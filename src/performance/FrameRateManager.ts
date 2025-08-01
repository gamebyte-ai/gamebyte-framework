import { EventEmitter } from 'eventemitter3';
import { FrameRateManager as IFrameRateManager, GameLoopConfig } from '../contracts/Performance';

/**
 * Advanced frame rate management and monitoring system
 * Provides precise FPS control and stability analysis
 */
export class FrameRateManager extends EventEmitter implements IFrameRateManager {
  private config: GameLoopConfig;
  private isInitialized = false;
  private isRunning = false;
  
  // Frame timing
  private currentFps = 0;
  private targetFps = 60;
  private frameTime = 0;
  private lastFrameTime = 0;
  private frameTimes: number[] = [];
  private fpsHistory: number[] = [];
  
  // Stability analysis
  private frameTimeVariance = 0;
  private fpsStability = 1.0; // 0-1 scale
  private droppedFrames = 0;
  private stableFrameCount = 0;
  private unstableFrameCount = 0;
  
  // Performance thresholds
  private readonly STABLE_FPS_THRESHOLD = 0.95; // 95% of target FPS
  private readonly FRAME_TIME_HISTORY_SIZE = 120; // 2 seconds at 60fps
  private readonly VARIANCE_THRESHOLD = 4.0; // ms variance for stability
  
  // Adaptive features
  private dynamicTargetEnabled = false;
  private performanceProfile: 'battery' | 'balanced' | 'performance' = 'balanced';
  private thermalThrottling = false;

  constructor() {
    super();
    
    this.config = {
      targetFps: 60,
      maxDeltaTime: 100,
      fixedTimeStep: false,
      adaptiveFrameRate: true,
      vsyncEnabled: true,
      frameSkipping: false,
      maxFrameSkip: 0
    };
  }

  /**
   * Initialize the frame rate manager
   */
  initialize(config: Partial<GameLoopConfig> = {}): void {
    this.config = { ...this.config, ...config };
    this.targetFps = this.config.targetFps;
    this.isInitialized = true;
    
    // Reset all metrics
    this.resetMetrics();
    
    this.emit('initialized', this.config);
  }

  /**
   * Start frame rate monitoring
   */
  start(): void {
    if (!this.isInitialized) {
      throw new Error('FrameRateManager must be initialized before starting');
    }
    
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.resetMetrics();
    
    this.emit('started');
  }

  /**
   * Stop frame rate monitoring
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.emit('stopped');
  }

  /**
   * Update frame rate metrics (called each frame)
   */
  update(deltaTime: number): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    this.frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Calculate FPS from frame time
    this.currentFps = 1000 / this.frameTime;
    
    // Update histories
    this.updateFrameHistory(this.frameTime, this.currentFps);
    
    // Calculate stability metrics
    this.calculateStabilityMetrics();
    
    // Check for frame drops
    this.detectFrameDrops();
    
    // Adaptive adjustments
    if (this.config.adaptiveFrameRate) {
      this.adaptiveFrameRateAdjustment();
    }
    
    // Emit metrics periodically
    if (this.frameTimes.length % 60 === 0) {
      this.emitMetrics();
    }
  }

  /**
   * Update frame time and FPS history
   */
  private updateFrameHistory(frameTime: number, fps: number): void {
    // Add to histories
    this.frameTimes.push(frameTime);
    this.fpsHistory.push(fps);
    
    // Limit history size
    if (this.frameTimes.length > this.FRAME_TIME_HISTORY_SIZE) {
      this.frameTimes.shift();
      this.fpsHistory.shift();
    }
  }

  /**
   * Calculate frame rate stability metrics
   */
  private calculateStabilityMetrics(): void {
    if (this.frameTimes.length < 30) return; // Need some data
    
    // Calculate frame time variance
    const recentFrameTimes = this.frameTimes.slice(-60); // Last 1 second
    const avgFrameTime = recentFrameTimes.reduce((sum, time) => sum + time, 0) / recentFrameTimes.length;
    
    const squaredDiffs = recentFrameTimes.map(time => Math.pow(time - avgFrameTime, 2));
    this.frameTimeVariance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / recentFrameTimes.length;
    
    // Calculate FPS stability (0-1 scale)
    const recentFps = this.fpsHistory.slice(-60);
    const avgFps = recentFps.reduce((sum, fps) => sum + fps, 0) / recentFps.length;
    const targetRatio = avgFps / this.targetFps;
    
    // Stability is high when FPS is close to target and variance is low
    const fpsStability = Math.max(0, Math.min(1, targetRatio));
    const varianceStability = Math.max(0, 1 - (this.frameTimeVariance / (this.VARIANCE_THRESHOLD * this.VARIANCE_THRESHOLD)));
    
    this.fpsStability = (fpsStability + varianceStability) / 2;
    
    // Update stable/unstable frame counts
    if (this.isFrameRateStable()) {
      this.stableFrameCount++;
      this.unstableFrameCount = 0;
    } else {
      this.unstableFrameCount++;
      this.stableFrameCount = Math.max(0, this.stableFrameCount - 1);
    }
  }

  /**
   * Detect frame drops and performance issues
   */
  private detectFrameDrops(): void {
    const expectedFrameTime = 1000 / this.targetFps;
    const dropThreshold = expectedFrameTime * 1.5; // 50% longer than expected
    
    if (this.frameTime > dropThreshold) {
      this.droppedFrames++;
      this.emit('frame-drop', {
        frameTime: this.frameTime,
        expectedTime: expectedFrameTime,
        severity: this.frameTime > expectedFrameTime * 2 ? 'high' : 'medium'
      });
    }
    
    // Reset dropped frames counter periodically
    if (this.frameTimes.length % 300 === 0) { // Every 5 seconds
      this.droppedFrames = 0;
    }
  }

  /**
   * Adaptive frame rate adjustment based on performance
   */
  private adaptiveFrameRateAdjustment(): void {
    if (!this.dynamicTargetEnabled) return;
    
    const avgFps = this.getAverageFps();
    const stability = this.fpsStability;
    
    // Adjust target based on device capabilities and thermal state
    if (this.thermalThrottling) {
      // Reduce target FPS during thermal throttling
      this.adjustTargetFps(Math.min(this.targetFps, 45));
    } else if (stability < 0.8 && avgFps < this.targetFps * 0.9) {
      // Performance is poor, reduce target
      const newTarget = Math.max(30, this.targetFps - 5);
      this.adjustTargetFps(newTarget);
    } else if (stability > 0.95 && avgFps > this.targetFps * 1.05) {
      // Performance is excellent, potentially increase target
      if (this.performanceProfile === 'performance') {
        const newTarget = Math.min(120, this.targetFps + 5);
        this.adjustTargetFps(newTarget);
      }
    }
  }

  /**
   * Adjust target FPS with validation
   */
  private adjustTargetFps(newTarget: number): void {
    const oldTarget = this.targetFps;
    this.targetFps = Math.max(30, Math.min(120, newTarget));
    
    if (oldTarget !== this.targetFps) {
      this.emit('target-fps-changed', {
        oldTarget,
        newTarget: this.targetFps,
        reason: this.thermalThrottling ? 'thermal' : 'performance'
      });
    }
  }

  /**
   * Emit current metrics
   */
  private emitMetrics(): void {
    const metrics = {
      currentFps: Math.round(this.currentFps),
      averageFps: Math.round(this.getAverageFps()),
      targetFps: this.targetFps,
      frameTime: Math.round(this.frameTime * 100) / 100,
      averageFrameTime: Math.round(this.getAverageFrameTime() * 100) / 100,
      frameTimeVariance: Math.round(this.frameTimeVariance * 100) / 100,
      stability: Math.round(this.fpsStability * 100) / 100,
      isStable: this.isFrameRateStable(),
      droppedFrames: this.droppedFrames,
      stableFrameCount: this.stableFrameCount,
      unstableFrameCount: this.unstableFrameCount
    };
    
    this.emit('metrics-updated', metrics);
  }

  /**
   * Reset all metrics
   */
  private resetMetrics(): void {
    this.currentFps = 0;
    this.frameTime = 0;
    this.frameTimes.length = 0;
    this.fpsHistory.length = 0;
    this.frameTimeVariance = 0;
    this.fpsStability = 1.0;
    this.droppedFrames = 0;
    this.stableFrameCount = 0;
    this.unstableFrameCount = 0;
  }

  /**
   * Get current FPS
   */
  getCurrentFps(): number {
    return Math.round(this.currentFps);
  }

  /**
   * Get target FPS
   */
  getTargetFps(): number {
    return this.targetFps;
  }

  /**
   * Set target FPS
   */
  setTargetFps(fps: number): void {
    const oldTarget = this.targetFps;
    this.targetFps = Math.max(30, Math.min(120, fps));
    this.config.targetFps = this.targetFps;
    
    if (oldTarget !== this.targetFps) {
      this.emit('target-fps-changed', {
        oldTarget,
        newTarget: this.targetFps,
        reason: 'manual'
      });
    }
  }

  /**
   * Get current frame time in milliseconds
   */
  getFrameTime(): number {
    return this.frameTime;
  }

  /**
   * Get average FPS over recent history
   */
  getAverageFps(): number {
    if (this.fpsHistory.length === 0) return 0;
    
    const recentFps = this.fpsHistory.slice(-60); // Last 1 second
    return recentFps.reduce((sum, fps) => sum + fps, 0) / recentFps.length;
  }

  /**
   * Get average frame time over recent history
   */
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    
    const recentTimes = this.frameTimes.slice(-60); // Last 1 second
    return recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
  }

  /**
   * Check if frame rate is stable
   */
  isFrameRateStable(): boolean {
    if (this.frameTimes.length < 30) return true; // Not enough data
    
    const avgFps = this.getAverageFps();
    const isWithinTarget = avgFps >= (this.targetFps * this.STABLE_FPS_THRESHOLD);
    const hasLowVariance = this.frameTimeVariance < this.VARIANCE_THRESHOLD;
    
    return isWithinTarget && hasLowVariance;
  }

  /**
   * Get frame rate stability score (0-1)
   */
  getStabilityScore(): number {
    return this.fpsStability;
  }

  /**
   * Get performance quality assessment
   */
  getPerformanceQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const avgFps = this.getAverageFps();
    const targetRatio = avgFps / this.targetFps;
    const stability = this.fpsStability;
    
    if (targetRatio >= 0.98 && stability >= 0.9) return 'excellent';
    if (targetRatio >= 0.9 && stability >= 0.8) return 'good';
    if (targetRatio >= 0.8 && stability >= 0.6) return 'fair';
    return 'poor';
  }

  /**
   * Set performance profile
   */
  setPerformanceProfile(profile: 'battery' | 'balanced' | 'performance'): void {
    this.performanceProfile = profile;
    
    // Adjust target FPS based on profile
    switch (profile) {
      case 'battery':
        this.setTargetFps(30);
        break;
      case 'balanced':
        this.setTargetFps(60);
        break;
      case 'performance':
        this.setTargetFps(120);
        this.dynamicTargetEnabled = true;
        break;
    }
    
    this.emit('performance-profile-changed', profile);
  }

  /**
   * Enable/disable dynamic target FPS
   */
  setDynamicTargetEnabled(enabled: boolean): void {
    this.dynamicTargetEnabled = enabled;
    this.emit('dynamic-target-changed', enabled);
  }

  /**
   * Set thermal throttling state
   */
  setThermalThrottling(enabled: boolean): void {
    this.thermalThrottling = enabled;
    
    if (enabled) {
      // Reduce target FPS during thermal throttling
      this.adjustTargetFps(Math.min(this.targetFps, 45));
    } else {
      // Restore normal target based on profile
      this.setPerformanceProfile(this.performanceProfile);
    }
    
    this.emit('thermal-throttling-changed', enabled);
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport(): any {
    return {
      // Current metrics
      currentFps: this.getCurrentFps(),
      targetFps: this.getTargetFps(),
      averageFps: Math.round(this.getAverageFps()),
      frameTime: Math.round(this.frameTime * 100) / 100,
      averageFrameTime: Math.round(this.getAverageFrameTime() * 100) / 100,
      
      // Stability metrics
      frameTimeVariance: Math.round(this.frameTimeVariance * 100) / 100,
      stabilityScore: Math.round(this.fpsStability * 100) / 100,
      isStable: this.isFrameRateStable(),
      performanceQuality: this.getPerformanceQuality(),
      
      // Frame tracking
      droppedFrames: this.droppedFrames,
      stableFrameCount: this.stableFrameCount,
      unstableFrameCount: this.unstableFrameCount,
      
      // Configuration
      performanceProfile: this.performanceProfile,
      dynamicTargetEnabled: this.dynamicTargetEnabled,
      thermalThrottling: this.thermalThrottling,
      
      // History sizes
      frameHistorySize: this.frameTimes.length,
      fpsHistorySize: this.fpsHistory.length
    };
  }

  /**
   * Export frame rate data for analysis
   */
  exportData(): any {
    return {
      frameTimes: [...this.frameTimes],
      fpsHistory: [...this.fpsHistory],
      config: { ...this.config },
      metrics: this.getPerformanceReport(),
      timestamp: Date.now()
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.frameTimes.length = 0;
    this.fpsHistory.length = 0;
    this.removeAllListeners();
    this.isInitialized = false;
  }
}