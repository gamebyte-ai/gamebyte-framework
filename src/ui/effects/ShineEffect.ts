import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IDisplayObject } from '../../contracts/Graphics.js';
import { GraphicsEngine } from '../../graphics/GraphicsEngine.js';
import { getGraphicsFactory } from './graphics-utils.js';

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
  width: 40,
  angle: -25,
  speed: 500,
  color: 0xFFFFFF,
  alpha: 1.0,
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
  mask: any; // Can be Graphics or Sprite depending on target type
  container: IContainer;
  config: Required<ShimmerConfig>;
  progress: number;
  isPaused: boolean;
  isActive: boolean;
  waitTime: number;
  targetWidth: number;
  targetHeight: number;
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
   * Creates a simple light sweep animation across the target
   * Generates texture from target to use as alpha mask (clips to exact shape)
   */
  public shimmer(target: IDisplayObject, config: ShimmerConfig = {}): ShimmerInstance {
    const cfg = { ...DEFAULT_SHIMMER, ...config };
    const factory = getGraphicsFactory();

    // Get target size for shimmer dimensions
    const size = this.getTargetBounds(target);
    const targetWidth = size.width || 40;
    const targetHeight = size.height || 40;

    // Create container to hold shimmer and mask
    const shimmerContainer = factory.createContainer();

    // Create mask from target's shape
    let mask: any;
    const targetAny = target as any;
    const renderer = GraphicsEngine.getRenderer();

    if (GraphicsEngine.getType() === 'PIXI' && renderer) {
      try {
        const rendererObj = renderer as any;
        const nativeRenderer = rendererObj.getNativeRenderer?.() || renderer;

        if (targetAny.texture) {
          // Target is a Sprite - use its texture
          const maskSprite = factory.createSprite(targetAny.texture);
          if (targetAny.anchor) {
            (maskSprite as any).anchor?.set(targetAny.anchor.x, targetAny.anchor.y);
          } else {
            (maskSprite as any).anchor?.set(0.5, 0.5);
          }
          mask = maskSprite;
        } else if (nativeRenderer.generateTexture) {
          // Target is Text/Container - generate texture from it
          const texture = nativeRenderer.generateTexture(target);
          const maskSprite = factory.createSprite(texture);
          (maskSprite as any).anchor?.set(0.5, 0.5);
          mask = maskSprite;
        } else {
          // Fallback to rectangle
          mask = factory.createGraphics();
          mask.rect(-targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
          mask.fill(0xFFFFFF);
        }
      } catch (e) {
        console.warn('ShineEffect: mask creation failed', e);
        mask = factory.createGraphics();
        mask.rect(-targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
        mask.fill(0xFFFFFF);
      }
    } else {
      // Fallback: rectangular mask
      mask = factory.createGraphics();
      mask.rect(-targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      mask.fill(0xFFFFFF);
    }

    // Create shimmer graphic with gradient and dual-streak effect
    const shimmerGraphic = factory.createGraphics();
    const streakWidth = cfg.width;
    const hh = targetHeight * 2;

    // Primary streak angle
    const angleRad = (cfg.angle * Math.PI) / 180;
    const sin1 = Math.sin(angleRad);

    // Secondary streak angle (offset by 40 degrees for curved surface effect)
    const angle2Rad = ((cfg.angle + 40) * Math.PI) / 180;
    const sin2 = Math.sin(angle2Rad);

    // Draw gradient layers for primary streak (outer to inner, increasing brightness)
    const layers = [
      { width: streakWidth * 2.5, alpha: 0.15 },
      { width: streakWidth * 1.8, alpha: 0.25 },
      { width: streakWidth * 1.2, alpha: 0.4 },
      { width: streakWidth * 0.7, alpha: 0.6 },
      { width: streakWidth * 0.3, alpha: 1.0 },
    ];

    // Primary shimmer streak
    for (const layer of layers) {
      const hw = layer.width / 2;
      for (let i = 0; i < 3; i++) { // Triple draw for brightness
        shimmerGraphic.poly([
          -hw + sin1 * hh, -hh,
          hw + sin1 * hh, -hh,
          hw - sin1 * hh, hh,
          -hw - sin1 * hh, hh,
        ]);
        shimmerGraphic.fill({ color: 0xFFFFFF, alpha: layer.alpha });
      }
    }

    // Secondary shimmer streak (smaller, offset position)
    const secondaryOffset = streakWidth * 0.8;
    const secondaryLayers = [
      { width: streakWidth * 1.2, alpha: 0.1 },
      { width: streakWidth * 0.6, alpha: 0.2 },
      { width: streakWidth * 0.2, alpha: 0.4 },
    ];

    for (const layer of secondaryLayers) {
      const hw = layer.width / 2;
      for (let i = 0; i < 2; i++) {
        shimmerGraphic.poly([
          -hw + sin2 * hh + secondaryOffset, -hh,
          hw + sin2 * hh + secondaryOffset, -hh,
          hw - sin2 * hh + secondaryOffset, hh,
          -hw - sin2 * hh + secondaryOffset, hh,
        ]);
        shimmerGraphic.fill({ color: 0xFFFFFF, alpha: layer.alpha });
      }
    }

    // Use 'add' blend mode for glow effect
    (shimmerGraphic as any).blendMode = 'add';

    // Add shimmer to container
    shimmerContainer.addChild(shimmerGraphic);

    // Apply Graphics mask - mask must be in display list for Pixi.js
    shimmerContainer.addChild(mask);
    (shimmerGraphic as any).mask = mask;

    // Add container as child of target
    (target as any).addChild(shimmerContainer);

    // Force full opacity
    shimmerGraphic.alpha = 1;

    // Initial position (local to target, centered)
    shimmerGraphic.x = -targetWidth / 2 - streakWidth;
    shimmerGraphic.y = 0;

    const shimmerData: ShimmerData = {
      target,
      graphic: shimmerGraphic,
      mask,
      container: shimmerContainer,
      config: cfg,
      progress: 0,
      isPaused: false,
      isActive: true,
      waitTime: 0,
      targetWidth,
      targetHeight,
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
   * Get target dimensions for shimmer animation
   */
  private getTargetBounds(target: IDisplayObject): { width: number; height: number } {
    // Try to get bounds from target
    const bounds = (target as any).getLocalBounds?.() || (target as any).getBounds?.();

    if (bounds) {
      return {
        width: bounds.width || 50,
        height: bounds.height || 50,
      };
    }

    // Fallback
    return {
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
        // Remove mask from shimmer
        (shimmerData.graphic as any).mask = null;
        // Remove container from target
        (shimmerData.target as any).removeChild?.(shimmerData.container);
        // Destroy all
        shimmerData.graphic.destroy();
        shimmerData.mask.destroy();
        shimmerData.container.destroy();
      } catch {
        // Ignore removal errors
      }
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
      const factory = getGraphicsFactory();

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
   * Uses Pixi.js v8 Graphics API
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

    // Pixi v8: poly().fill(color)
    graphic.poly(points).fill(color);
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

      // Animate shimmer position across target (from left to right)
      // Shimmer is a child of target, positions are relative to target center (0,0)
      const halfWidth = shimmer.targetWidth / 2;
      const streakWidth = shimmer.config.width;
      const startX = -halfWidth - streakWidth;
      const endX = halfWidth + streakWidth;
      const currentX = startX + shimmer.progress * (endX - startX);

      shimmer.graphic.x = currentX;
      shimmer.graphic.alpha = 1; // Always full opacity
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
