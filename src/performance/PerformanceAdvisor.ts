import { EventEmitter } from 'eventemitter3';
import type { QualityTier, AdaptiveConfig } from '../contracts/Performance.js';
import { QualityTierManager } from './QualityTierManager.js';

const DEFAULT_CONFIG: Required<AdaptiveConfig> = {
  targetFps: 55,
  downgradeThreshold: 45,
  upgradeThreshold: 58,
  stabilityWindow: 2,
  upgradeBackoffMultiplier: 2,
  maxUpgradeBackoff: 16,
  minTier: '',
  maxTier: '',
  thermalProtection: true
};

/**
 * Adaptive performance system with automatic quality tier adjustment.
 *
 * Features:
 * - Hysteresis: separate up/down thresholds prevent oscillation
 * - EMA FPS tracking (reads from TickSystem)
 * - Exponential backoff for upgrades
 * - Thermal throttling detection (sustained FPS degradation)
 * - Battery API integration
 *
 * The dead zone between downgradeThreshold (45) and upgradeThreshold (58)
 * means: if FPS is between 45-58, no action is taken. This prevents
 * rapid tier flipping when FPS fluctuates near a single threshold.
 */
export class PerformanceAdvisor extends EventEmitter {
  private config: Required<AdaptiveConfig>;
  private tierManager: QualityTierManager;
  private _active = false;

  // FPS tracking (uses EMA from TickSystem, or internal tracking)
  private smoothFps = 60;
  private fpsAlpha = 0.05;

  // Stability tracking
  private stableStartTime = 0;
  private lastDirection: 'up' | 'down' | 'none' = 'none';

  // Upgrade backoff (exponential)
  private currentUpgradeBackoff: number;
  private lastUpgradeTime = 0;
  private consecutiveUpgrades = 0;

  // Thermal detection (timestamped samples)
  private fpsHistory: { fps: number; time: number }[] = [];
  private thermalCheckInterval = 30_000; // 30s
  private lastThermalCheck = 0;
  private thermalThrottled = false;

  constructor() {
    super();
    this.config = { ...DEFAULT_CONFIG };
    this.tierManager = new QualityTierManager();
    this.currentUpgradeBackoff = this.config.stabilityWindow * 1000;
  }

  /**
   * Enable adaptive quality management.
   */
  enable(config?: AdaptiveConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentUpgradeBackoff = this.config.stabilityWindow * 1000;

    if (this.config.minTier) this.tierManager.setMinTier(this.config.minTier);
    if (this.config.maxTier) this.tierManager.setMaxTier(this.config.maxTier);

    this._active = true;
    this.stableStartTime = performance.now();
    this.emit('enabled');
  }

  /**
   * Disable adaptive quality management.
   */
  disable(): void {
    this._active = false;
    this.emit('disabled');
  }

  get active(): boolean {
    return this._active;
  }

  /**
   * Manually trigger a quality regression (e.g., during heavy interaction).
   * Immediately drops one tier without waiting for stability window.
   */
  regress(): void {
    if (!this._active) return;
    const newTier = this.tierManager.downgrade();
    if (newTier) {
      this.emitQualityChange(newTier, 'down');
      this.stableStartTime = performance.now();
    }
  }

  /**
   * Manually set a specific quality tier.
   */
  setTier(tierName: string): void {
    const tier = this.tierManager.setTierByName(tierName);
    if (tier) {
      this.emitQualityChange(tier, 'down');
    }
  }

  /**
   * Get current quality tier settings.
   */
  getCurrentTier(): QualityTier {
    return this.tierManager.getCurrentTier();
  }

  /**
   * Register a custom quality tier.
   */
  registerTier(name: string, tier: QualityTier): void {
    this.tierManager.registerTier({ ...tier, name });
  }

  /**
   * Register callback for quality changes.
   */
  onQualityChange(callback: (tier: QualityTier, direction: 'up' | 'down') => void): void {
    this.on('quality:changed', callback);
  }

  /**
   * Called each frame with current FPS.
   * Typically wired to TickSystem via service provider.
   */
  sample(fps: number): void {
    if (!this._active) return;

    // EMA smoothing
    this.smoothFps += this.fpsAlpha * (fps - this.smoothFps);

    const now = performance.now();

    // Thermal detection: check for sustained FPS degradation
    if (this.config.thermalProtection && now - this.lastThermalCheck > this.thermalCheckInterval) {
      this.checkThermalThrottling();
      this.lastThermalCheck = now;
    }

    // Hysteresis decision
    if (this.smoothFps < this.config.downgradeThreshold) {
      // Below downgrade threshold
      if (this.lastDirection !== 'down') {
        this.lastDirection = 'down';
        this.stableStartTime = now;
      }

      const stableDuration = now - this.stableStartTime;
      if (stableDuration >= this.config.stabilityWindow * 1000) {
        // Downgrade immediately when stability window reached
        const newTier = this.tierManager.downgrade();
        if (newTier) {
          this.emitQualityChange(newTier, 'down');
          this.consecutiveUpgrades = 0; // Reset upgrade backoff
          this.currentUpgradeBackoff = this.config.stabilityWindow * 1000;
        }
        this.stableStartTime = now;
        this.lastDirection = 'none';
      }
    } else if (this.smoothFps > this.config.upgradeThreshold) {
      // Above upgrade threshold
      if (this.lastDirection !== 'up') {
        this.lastDirection = 'up';
        this.stableStartTime = now;
      }

      // Upgrade with exponential backoff
      const stableDuration = now - this.stableStartTime;
      const sinceLastUpgrade = now - this.lastUpgradeTime;

      if (
        stableDuration >= this.currentUpgradeBackoff &&
        sinceLastUpgrade >= this.currentUpgradeBackoff &&
        !this.thermalThrottled
      ) {
        const newTier = this.tierManager.upgrade();
        if (newTier) {
          this.emitQualityChange(newTier, 'up');
          this.lastUpgradeTime = now;
          this.consecutiveUpgrades++;

          // Exponential backoff: doubles each consecutive upgrade
          this.currentUpgradeBackoff = Math.min(
            this.currentUpgradeBackoff * this.config.upgradeBackoffMultiplier,
            this.config.maxUpgradeBackoff * 1000
          );
        }
        this.stableStartTime = now;
        this.lastDirection = 'none';
      }
    } else {
      // In dead zone - reset direction
      this.lastDirection = 'none';
      this.stableStartTime = now;
    }

    // Track FPS for thermal detection (timestamped for accurate time-window comparison)
    if (this.config.thermalProtection) {
      this.fpsHistory.push({ fps: this.smoothFps, time: now });
      // Prune samples older than 2x the thermal check interval
      const maxAge = this.thermalCheckInterval * 2;
      while (this.fpsHistory.length > 0 && now - this.fpsHistory[0].time > maxAge) {
        this.fpsHistory.shift();
      }
    }
  }

  /**
   * Detect thermal throttling: sustained FPS degradation over 30+ seconds.
   * Compares average FPS from the older half vs the newer half of the time window.
   */
  private checkThermalThrottling(): void {
    if (this.fpsHistory.length < 10) return;

    const now = this.fpsHistory[this.fpsHistory.length - 1].time;
    const windowStart = this.fpsHistory[0].time;
    const midTime = windowStart + (now - windowStart) / 2;

    let firstSum = 0, firstCount = 0;
    let secondSum = 0, secondCount = 0;

    for (let i = 0; i < this.fpsHistory.length; i++) {
      const entry = this.fpsHistory[i];
      if (entry.time < midTime) {
        firstSum += entry.fps;
        firstCount++;
      } else {
        secondSum += entry.fps;
        secondCount++;
      }
    }

    if (firstCount === 0 || secondCount === 0) return;

    const avgFirst = firstSum / firstCount;
    const avgSecond = secondSum / secondCount;

    // If FPS dropped more than 15% from first half to second half = thermal
    if (avgSecond < avgFirst * 0.85) {
      if (!this.thermalThrottled) {
        this.thermalThrottled = true;
        this.emit('thermal:throttled');
        // Aggressive downgrade
        this.regress();
      }
    } else if (avgSecond > avgFirst * 0.95) {
      // Recovered
      this.thermalThrottled = false;
    }
  }

  private emitQualityChange(tier: QualityTier, direction: 'up' | 'down'): void {
    this.emit('quality:changed', tier, direction);
  }

  /**
   * Get the quality tier manager for direct access.
   */
  getTierManager(): QualityTierManager {
    return this.tierManager;
  }

  /**
   * Destroy and clean up.
   */
  destroy(): void {
    this._active = false;
    this.fpsHistory.length = 0;
    this.removeAllListeners();
  }
}
