import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IDisplayObject } from '../../contracts/Graphics.js';
import { graphics } from '../../graphics/GraphicsEngine.js';

/**
 * Shimmer effect configuration
 */
export interface ShimmerConfig {
  /** Width of the light streak - Default: 20 */
  width?: number;
  /** Angle in degrees - Default: -30 (diagonal) */
  angle?: number;
  /** Time for one sweep in ms - Default: 2000 */
  speed?: number;
  /** Light color - Default: 0xFFFFFF */
  color?: number;
  /** Light alpha - Default: 0.4 */
  alpha?: number;
  /** Loop continuously - Default: true */
  loop?: boolean;
  /** Delay between loops in ms - Default: 1000 */
  loopDelay?: number;
}

/**
 * Sparkle effect configuration
 */
export interface SparkleConfig {
  /** Number of sparkle particles - Default: 8 */
  particleCount?: number;
  /** Sparkle colors - Default: white/gold */
  colors?: number[];
  /** Duration in ms - Default: 600 */
  duration?: number;
  /** Spread radius - Default: 30 */
  radius?: number;
  /** Scale range - Default: { min: 0.3, max: 1 } */
  scale?: { min: number; max: number };
}

/**
 * Default configurations
 */
const DEFAULT_SHIMMER: Required<ShimmerConfig> = {
  width: 20,
  angle: -30,
  speed: 2000,
  color: 0xFFFFFF,
  alpha: 0.4,
  loop: true,
  loopDelay: 1000,
};

const DEFAULT_SPARKLE: Required<SparkleConfig> = {
  particleCount: 8,
  colors: [0xFFFFFF, 0xFFD700, 0xFFF8DC],
  duration: 600,
  radius: 30,
  scale: { min: 0.3, max: 1 },
};

/**
 * Shimmer instance for controlling individual shimmer effects
 */
export interface ShimmerInstance {
  stop(): void;
  pause(): void;
  resume(): void;
  isActive(): boolean;
}

/**
 * Internal shimmer data
 */
interface ShimmerData {
  target: IDisplayObject;
  graphic: IGraphics;
  container: IContainer;
  config: Required<ShimmerConfig>;
  progress: number;
  isPaused: boolean;
  isActive: boolean;
  waitTime: number;
}

/**
 * Sparkle particle
 */
interface SparkleParticle {
  graphic: IGraphics;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  life: number;
  maxLife: number;
}

/**
 * ShineEffect - Handles shine/sparkle effects for valuable items
 *
 * Two effect types:
 * - shimmer(): Continuous diagonal light sweep (idle state)
 * - sparkle(): Burst of star particles (interaction/reward)
 *
 * @example
 * ```typescript
 * const shine = new ShineEffect(stage);
 *
 * // Add shimmer to coin icon (idle)
 * const shimmerInstance = shine.shimmer(coinIcon);
 *
 * // Sparkle on coin collected
 * await shine.sparkle(coinX, coinY);
 *
 * // Stop shimmer when needed
 * shimmerInstance.stop();
 * ```
 */
export class ShineEffect extends EventEmitter {
  private container: IContainer;
  private shimmers: ShimmerData[] = [];
  private sparkles: SparkleParticle[] = [];

  constructor(container: IContainer) {
    super();
    this.container = container;
  }

  /**
   * Add shimmer effect to a target object
   * Creates a diagonal light sweep animation
   */
  public shimmer(target: IDisplayObject, config: ShimmerConfig = {}): ShimmerInstance {
    const cfg = { ...DEFAULT_SHIMMER, ...config };
    const factory = graphics();

    // Create shimmer container
    const shimmerContainer = factory.createContainer();

    // Create shimmer graphic (light streak)
    const shimmerGraphic = factory.createGraphics();
    this.drawShimmerStreak(shimmerGraphic, cfg);

    shimmerContainer.addChild(shimmerGraphic);

    // Position shimmer at target's parent
    // Note: shimmer will be animated across the target
    if ((target as any).parent) {
      (target as any).parent.addChild(shimmerContainer);
    } else {
      this.container.addChild(shimmerContainer);
    }

    // Get target bounds for positioning
    const bounds = this.getTargetBounds(target);
    shimmerContainer.x = bounds.x;
    shimmerContainer.y = bounds.y;

    const shimmerData: ShimmerData = {
      target,
      graphic: shimmerGraphic,
      container: shimmerContainer,
      config: cfg,
      progress: 0,
      isPaused: false,
      isActive: true,
      waitTime: 0,
    };

    this.shimmers.push(shimmerData);

    // Return control instance
    const instance: ShimmerInstance = {
      stop: () => this.stopShimmer(shimmerData),
      pause: () => { shimmerData.isPaused = true; },
      resume: () => { shimmerData.isPaused = false; },
      isActive: () => shimmerData.isActive,
    };

    this.emit('shimmer-started', target);
    return instance;
  }

  /**
   * Draw the shimmer light streak
   */
  private drawShimmerStreak(graphic: IGraphics, config: Required<ShimmerConfig>): void {
    graphic.clear();

    const height = 100; // Tall enough to cover most elements
    const angleRad = (config.angle * Math.PI) / 180;

    // Create angled rectangle for light streak
    const points: number[] = [];
    const hw = config.width / 2;

    // Calculate rotated rectangle points
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    points.push(-hw * cos, -hw * sin); // Top left
    points.push(hw * cos, hw * sin);   // Top right
    points.push(hw * cos + sin * height, hw * sin + cos * height); // Bottom right
    points.push(-hw * cos + sin * height, -hw * sin + cos * height); // Bottom left

    graphic.poly(points);
    graphic.fill({ color: config.color, alpha: config.alpha });
  }

  /**
   * Get target bounds
   */
  private getTargetBounds(target: IDisplayObject): { x: number; y: number; width: number; height: number } {
    // Try to get bounds from target
    const bounds = (target as any).getBounds?.() || (target as any).getLocalBounds?.();

    if (bounds) {
      return {
        x: target.x + (bounds.x || 0),
        y: target.y + (bounds.y || 0),
        width: bounds.width || 50,
        height: bounds.height || 50,
      };
    }

    // Fallback
    return {
      x: target.x,
      y: target.y,
      width: (target as any).width || 50,
      height: (target as any).height || 50,
    };
  }

  /**
   * Stop a specific shimmer
   */
  private stopShimmer(shimmerData: ShimmerData): void {
    shimmerData.isActive = false;
    const index = this.shimmers.indexOf(shimmerData);
    if (index !== -1) {
      this.shimmers.splice(index, 1);
      try {
        if ((shimmerData.container as any).parent) {
          (shimmerData.container as any).parent.removeChild(shimmerData.container);
        }
      } catch {
        // Ignore removal errors
      }
      shimmerData.graphic.destroy();
      shimmerData.container.destroy();
    }
    this.emit('shimmer-stopped');
  }

  /**
   * Create sparkle burst effect at a point
   * Returns a promise that resolves when animation completes
   */
  public sparkle(x: number, y: number, config: SparkleConfig = {}): Promise<void> {
    const cfg = { ...DEFAULT_SPARKLE, ...config };

    return new Promise((resolve) => {
      const factory = graphics();

      for (let i = 0; i < cfg.particleCount; i++) {
        const graphic = factory.createGraphics();

        // Draw star/sparkle shape
        const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
        this.drawSparkle(graphic, color);

        graphic.x = x;
        graphic.y = y;
        graphic.alpha = 1;

        const scale = cfg.scale.min + Math.random() * (cfg.scale.max - cfg.scale.min);
        graphic.scale.x = 0;
        graphic.scale.y = 0;

        this.container.addChild(graphic);

        // Calculate target position (radial spread)
        const angle = (i / cfg.particleCount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = cfg.radius * (0.5 + Math.random() * 0.5);

        const particle: SparkleParticle = {
          graphic,
          x,
          y,
          targetX: x + Math.cos(angle) * distance,
          targetY: y + Math.sin(angle) * distance,
          scale,
          life: 0,
          maxLife: cfg.duration,
        };

        this.sparkles.push(particle);
      }

      // Set timeout for completion
      setTimeout(() => {
        this.emit('sparkle-complete', { x, y });
        resolve();
      }, cfg.duration);

      this.emit('sparkle-started', { x, y, count: cfg.particleCount });
    });
  }

  /**
   * Draw sparkle/star shape
   */
  private drawSparkle(graphic: IGraphics, color: number): void {
    graphic.clear();

    // Draw 4-pointed star
    const size = 8;
    const points: number[] = [];
    const spikes = 4;
    const innerRadius = size * 0.3;

    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? size : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      points.push(Math.cos(angle) * r);
      points.push(Math.sin(angle) * r);
    }

    graphic.poly(points);
    graphic.fill({ color });
  }

  /**
   * Update all effects - call every frame
   */
  public update(deltaTime: number): void {
    this.updateShimmers(deltaTime);
    this.updateSparkles(deltaTime);
  }

  /**
   * Update shimmer effects
   */
  private updateShimmers(deltaTime: number): void {
    for (const shimmer of this.shimmers) {
      if (!shimmer.isActive || shimmer.isPaused) continue;

      // Handle delay between loops
      if (shimmer.waitTime > 0) {
        shimmer.waitTime -= deltaTime;
        shimmer.graphic.alpha = 0;
        continue;
      }

      // Update progress
      shimmer.progress += deltaTime / shimmer.config.speed;

      if (shimmer.progress >= 1) {
        if (shimmer.config.loop) {
          shimmer.progress = 0;
          shimmer.waitTime = shimmer.config.loopDelay;
        } else {
          this.stopShimmer(shimmer);
          continue;
        }
      }

      // Get target bounds
      const bounds = this.getTargetBounds(shimmer.target);

      // Animate shimmer position across target
      const startX = -shimmer.config.width - 20;
      const endX = bounds.width + shimmer.config.width + 20;
      const currentX = startX + shimmer.progress * (endX - startX);

      shimmer.graphic.x = currentX;
      shimmer.graphic.alpha = shimmer.config.alpha;

      // Update container position to follow target
      shimmer.container.x = shimmer.target.x;
      shimmer.container.y = shimmer.target.y;
    }
  }

  /**
   * Update sparkle particles
   */
  private updateSparkles(deltaTime: number): void {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const p = this.sparkles[i];

      p.life += deltaTime;
      const progress = p.life / p.maxLife;

      if (progress >= 1) {
        // Remove particle
        this.container.removeChild(p.graphic);
        p.graphic.destroy();
        this.sparkles.splice(i, 1);
        continue;
      }

      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);

      // Scale up then down
      const scaleProgress = progress < 0.3 ? progress / 0.3 : 1 - ((progress - 0.3) / 0.7);
      p.graphic.scale.x = p.scale * scaleProgress;
      p.graphic.scale.y = p.scale * scaleProgress;

      // Move towards target
      p.graphic.x = p.x + (p.targetX - p.x) * eased;
      p.graphic.y = p.y + (p.targetY - p.y) * eased;

      // Fade out in last 50%
      if (progress > 0.5) {
        p.graphic.alpha = 1 - ((progress - 0.5) / 0.5);
      }

      // Rotate
      p.graphic.rotation += 0.1;
    }
  }

  /**
   * Clear all effects
   */
  public clear(): void {
    // Clear shimmers
    for (let i = this.shimmers.length - 1; i >= 0; i--) {
      this.stopShimmer(this.shimmers[i]);
    }

    // Clear sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const p = this.sparkles[i];
      this.container.removeChild(p.graphic);
      p.graphic.destroy();
    }
    this.sparkles = [];

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
