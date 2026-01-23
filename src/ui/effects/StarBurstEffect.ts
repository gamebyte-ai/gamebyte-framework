import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IDisplayObject } from '../../contracts/Graphics.js';
import { getGraphicsFactory } from './graphics-utils.js';

/**
 * StarBurst zone configuration
 */
export interface StarBurstConfig {
  /** Spread radius around target - Default: 30 */
  radius?: number;
  /** Maximum concurrent sparkles - Default: 4 */
  count?: number;
  /** Sparkle colors - Default: white/gold gradient */
  colors?: number[];
  /** Single sparkle duration in ms - Default: 800 */
  duration?: number;
  /** Minimum delay between spawns in ms - Default: 100 */
  spawnDelayMin?: number;
  /** Maximum delay between spawns in ms - Default: 400 */
  spawnDelayMax?: number;
  /** Scale range - Default: { min: 0.3, max: 1.0 } */
  scale?: { min: number; max: number };
  /** Rotation speed in radians per frame - Default: 0.05 */
  rotationSpeed?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<StarBurstConfig> = {
  radius: 30,
  count: 4,
  colors: [0xFFFFFF, 0xFFF8DC, 0xFFD700],
  duration: 800,
  spawnDelayMin: 100,
  spawnDelayMax: 400,
  scale: { min: 0.2, max: 0.6 },  // Reduced: was 0.3-1.0, now 75% smaller max
  rotationSpeed: 0.025,           // Reduced: was 0.05, now 50% slower
};

/**
 * Individual sparkle particle
 */
interface SparkleParticle {
  graphic: IGraphics;
  spikes: 4 | 6;
  x: number;
  y: number;
  targetScale: number;
  currentScale: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  phase: 'spawn' | 'hold' | 'fade';
}

/**
 * Zone instance for controlling individual zones
 */
export interface StarBurstInstance {
  stop(): void;
  pause(): void;
  resume(): void;
  isActive(): boolean;
  setConfig(config: Partial<StarBurstConfig>): void;
}

/**
 * Internal zone data
 */
interface ZoneData {
  target: IDisplayObject;
  container: IContainer;
  config: Required<StarBurstConfig>;
  particles: SparkleParticle[];
  isActive: boolean;
  isPaused: boolean;
  spawnTimer: number;
  nextSpawnDelay: number;
}

/**
 * StarBurstEffect - Continuous sparkle effects around valuable items
 *
 * Creates a magical "glittering" effect with rotating star particles
 * that appear randomly around a target area.
 *
 * Features:
 * - Mix of 4-pointed (small, frequent) and 6-pointed (large, rare) stars
 * - Scale + Rotate + Fade animation
 * - Configurable per-zone colors and intensity
 * - Optimized particle pooling
 *
 * @example
 * ```typescript
 * const starburst = new StarBurstEffect(stage);
 *
 * // Add sparkle zone around gold icon
 * const zone = starburst.addZone(goldIcon, {
 *   radius: 40,
 *   count: 5,
 *   colors: [0xFFD700, 0xFFFFFF]
 * });
 *
 * // Update in game loop
 * game.on('update', (dt) => starburst.update(dt));
 *
 * // Stop when needed
 * zone.stop();
 * ```
 */
export class StarBurstEffect extends EventEmitter {
  private container: IContainer;
  private zones: ZoneData[] = [];

  constructor(container: IContainer) {
    super();
    this.container = container;
  }

  /**
   * Add a sparkle zone around a target object
   * Sparkles will continuously appear and animate around the target
   */
  public addZone(target: IDisplayObject, config: StarBurstConfig = {}): StarBurstInstance {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const factory = getGraphicsFactory();

    // Create container for this zone's particles
    const zoneContainer = factory.createContainer();
    this.container.addChild(zoneContainer);

    const zoneData: ZoneData = {
      target,
      container: zoneContainer,
      config: cfg,
      particles: [],
      isActive: true,
      isPaused: false,
      spawnTimer: 0,
      nextSpawnDelay: this.getRandomSpawnDelay(cfg),
    };

    this.zones.push(zoneData);

    // Return control instance
    const instance: StarBurstInstance = {
      stop: () => this.removeZone(zoneData),
      pause: () => { zoneData.isPaused = true; },
      resume: () => { zoneData.isPaused = false; },
      isActive: () => zoneData.isActive,
      setConfig: (newConfig: Partial<StarBurstConfig>) => {
        Object.assign(zoneData.config, newConfig);
      },
    };

    this.emit('zone-added', target);
    return instance;
  }

  /**
   * Remove a zone and all its particles
   */
  private removeZone(zoneData: ZoneData): void {
    zoneData.isActive = false;
    const index = this.zones.indexOf(zoneData);

    if (index !== -1) {
      this.zones.splice(index, 1);

      // Remove all particles
      for (const particle of zoneData.particles) {
        zoneData.container.removeChild(particle.graphic);
        particle.graphic.destroy();
      }
      zoneData.particles = [];

      // Remove container
      this.container.removeChild(zoneData.container);
      zoneData.container.destroy();
    }

    this.emit('zone-removed');
  }

  /**
   * Get random spawn delay based on config
   */
  private getRandomSpawnDelay(config: Required<StarBurstConfig>): number {
    return config.spawnDelayMin + Math.random() * (config.spawnDelayMax - config.spawnDelayMin);
  }

  /**
   * Spawn a new sparkle particle in a zone
   */
  private spawnParticle(zone: ZoneData): void {
    if (zone.particles.length >= zone.config.count) return;

    const factory = getGraphicsFactory();
    const graphic = factory.createGraphics();

    // 70% small (4-pointed), 30% large (6-pointed)
    const isLarge = Math.random() >= 0.7;
    const spikes: 4 | 6 = isLarge ? 6 : 4;
    const color = zone.config.colors[Math.floor(Math.random() * zone.config.colors.length)];
    const size = isLarge ? 10 : 8;

    // Draw the sparkle shape
    this.drawStar(graphic, spikes, size, color);

    // Random position within radius
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * zone.config.radius;

    // Get target's global position
    const targetPos = this.getTargetPosition(zone.target);
    const x = targetPos.x + Math.cos(angle) * distance;
    const y = targetPos.y + Math.sin(angle) * distance;

    graphic.x = x;
    graphic.y = y;
    graphic.alpha = 0;
    graphic.scale.x = 0;
    graphic.scale.y = 0;

    zone.container.addChild(graphic);

    const targetScale = zone.config.scale.min +
      Math.random() * (zone.config.scale.max - zone.config.scale.min);

    // Large stars are slower but only slightly bigger
    const durationMultiplier = isLarge ? 1.3 : 1;
    const scaleMultiplier = isLarge ? 1.15 : 1;

    const particle: SparkleParticle = {
      graphic,
      spikes,
      x,
      y,
      targetScale: targetScale * scaleMultiplier,
      currentScale: 0,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: zone.config.rotationSpeed * (0.8 + Math.random() * 0.4),
      life: 0,
      maxLife: zone.config.duration * durationMultiplier,
      phase: 'spawn',
    };

    zone.particles.push(particle);
    this.emit('sparkle-spawned', { x, y, spikes });
  }

  /**
   * Draw star shape with configurable spike count
   * @param spikes Number of points (4 or 6)
   * @param size Outer radius of the star
   */
  private drawStar(graphic: IGraphics, spikes: 4 | 6, size: number, color: number): void {
    graphic.clear();

    const innerRatio = spikes === 4 ? 0.25 : 0.4;
    const innerRadius = size * innerRatio;
    const points: number[] = [];

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? size : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      points.push(Math.cos(angle) * radius);
      points.push(Math.sin(angle) * radius);
    }

    graphic.poly(points).fill(color);
  }

  /**
   * Get target's global position
   */
  private getTargetPosition(target: IDisplayObject): { x: number; y: number } {
    // Try to get global position (Pixi.js DisplayObject method)
    const targetWithGlobal = target as IDisplayObject & {
      getGlobalPosition?: () => { x: number; y: number };
    };
    const globalPos = targetWithGlobal.getGlobalPosition?.();
    if (globalPos) {
      return { x: globalPos.x, y: globalPos.y };
    }

    // Fallback to direct position
    return { x: target.x, y: target.y };
  }

  /**
   * Update all zones and particles - call every frame
   */
  public update(deltaTime: number): void {
    for (const zone of this.zones) {
      if (!zone.isActive || zone.isPaused) continue;

      // Update spawn timer
      zone.spawnTimer += deltaTime;
      if (zone.spawnTimer >= zone.nextSpawnDelay) {
        this.spawnParticle(zone);
        zone.spawnTimer = 0;
        zone.nextSpawnDelay = this.getRandomSpawnDelay(zone.config);
      }

      // Update particles
      this.updateParticles(zone, deltaTime);
    }
  }

  /**
   * Update particles in a zone
   */
  private updateParticles(zone: ZoneData, deltaTime: number): void {
    for (let i = zone.particles.length - 1; i >= 0; i--) {
      const p = zone.particles[i];

      p.life += deltaTime;
      const progress = p.life / p.maxLife;

      // Determine phase
      if (progress < 0.3) {
        p.phase = 'spawn';
      } else if (progress < 0.7) {
        p.phase = 'hold';
      } else {
        p.phase = 'fade';
      }

      // Update based on phase
      switch (p.phase) {
        case 'spawn': {
          // Scale 0→1, alpha 0→1
          const spawnProgress = progress / 0.3;
          const eased = this.easeOutBack(spawnProgress);
          p.currentScale = p.targetScale * eased;
          p.graphic.alpha = spawnProgress;
          break;
        }
        case 'hold': {
          // Rotate, subtle scale pulse
          const holdProgress = (progress - 0.3) / 0.4;
          const pulse = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.1;
          p.currentScale = p.targetScale * pulse;
          p.graphic.alpha = 1;
          break;
        }
        case 'fade': {
          // Scale 1→0, alpha 1→0
          const fadeProgress = (progress - 0.7) / 0.3;
          const eased = 1 - this.easeInQuad(fadeProgress);
          p.currentScale = p.targetScale * eased;
          p.graphic.alpha = eased;
          break;
        }
      }

      // Apply rotation
      p.rotation += p.rotationSpeed;

      // Apply to graphic
      p.graphic.scale.x = p.currentScale;
      p.graphic.scale.y = p.currentScale;
      p.graphic.rotation = p.rotation;

      // Remove dead particles
      if (progress >= 1) {
        zone.container.removeChild(p.graphic);
        p.graphic.destroy();
        zone.particles.splice(i, 1);
      }
    }
  }

  /**
   * Ease out back - slight overshoot for bouncy feel
   */
  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /**
   * Ease in quad - accelerating from zero
   */
  private easeInQuad(t: number): number {
    return t * t;
  }

  /**
   * Remove zone by target
   */
  public removeZoneByTarget(target: IDisplayObject): void {
    const zone = this.zones.find(z => z.target === target);
    if (zone) {
      this.removeZone(zone);
    }
  }

  /**
   * Check if target has an active zone
   */
  public hasZone(target: IDisplayObject): boolean {
    return this.zones.some(z => z.target === target && z.isActive);
  }

  /**
   * Get active zone count
   */
  public getZoneCount(): number {
    return this.zones.length;
  }

  /**
   * Get total particle count across all zones
   */
  public getParticleCount(): number {
    return this.zones.reduce((sum, zone) => sum + zone.particles.length, 0);
  }

  /**
   * Clear all zones
   */
  public clear(): void {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      this.removeZone(this.zones[i]);
    }
    this.emit('cleared');
  }

  /**
   * Destroy the system
   */
  public destroy(): void {
    this.clear();
    this.removeAllListeners();
  }
}
