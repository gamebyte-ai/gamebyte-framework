import * as THREE from 'three';
import { Logger } from '../../utils/Logger.js';

/**
 * Animation type for floating text
 */
export type FloatingTextAnimation = 'rise-fade' | 'pop' | 'bounce' | 'none';

/**
 * Configuration for FloatingText component
 */
export interface FloatingTextConfig {
  /** CSS font string */
  font?: string;
  /** Text color (hex) */
  color?: number;
  /** Stroke/outline color (hex) */
  stroke?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Spawn offset from position [x, y, z] */
  offset?: [number, number, number];
  /** Animation type */
  animation?: FloatingTextAnimation;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Distance to float upward (world units) */
  riseDistance?: number;
  /** Number of pre-allocated text sprites */
  poolSize?: number;
}

/**
 * Options for spawning individual text
 */
export interface FloatingTextSpawnOptions {
  /** Override default color */
  color?: number;
  /** Scale multiplier */
  scale?: number;
  /** Override default animation */
  animation?: FloatingTextAnimation;
  /** Override default duration */
  duration?: number;
}

/**
 * Internal state for an active floating text instance
 */
interface FloatingTextInstance {
  sprite: THREE.Sprite;
  startPosition: THREE.Vector3;
  startTime: number;
  duration: number;
  animation: FloatingTextAnimation;
  riseDistance: number;
  startScale: number;
  active: boolean;
}

/**
 * FloatingText - Damage numbers, XP gains, status text with animations
 *
 * Features:
 * - Object pooling for performance
 * - Multiple animation types (rise-fade, pop, bounce)
 * - Billboard behavior (always faces camera)
 * - Canvas-based text rendering with stroke support
 * - Configurable appearance and behavior
 *
 * @example
 * ```typescript
 * const floatingText = new FloatingText({
 *   font: 'bold 32px Arial',
 *   color: 0xFFFF00,
 *   animation: 'pop',
 *   duration: 1500
 * });
 * scene.add(floatingText);
 *
 * // Spawn damage number
 * floatingText.spawn(
 *   new THREE.Vector3(0, 0, 0),
 *   '-150',
 *   { color: 0xFF0000, scale: 1.5 }
 * );
 *
 * // Update in game loop
 * floatingText.update(camera, deltaTime);
 * ```
 */
export class FloatingText extends THREE.Group {
  private config: Required<FloatingTextConfig>;
  private pool: FloatingTextInstance[] = [];
  private activeInstances: FloatingTextInstance[] = [];
  private canvasCache: Map<string, HTMLCanvasElement> = new Map();

  constructor(config: FloatingTextConfig = {}) {
    super();

    // Apply defaults
    this.config = {
      font: config.font ?? 'bold 24px Arial',
      color: config.color ?? 0xffffff,
      stroke: config.stroke ?? 0x000000,
      strokeWidth: config.strokeWidth ?? 3,
      offset: config.offset ?? [0, 2, 0],
      animation: config.animation ?? 'rise-fade',
      duration: config.duration ?? 1000,
      riseDistance: config.riseDistance ?? 1,
      poolSize: config.poolSize ?? 20,
    };

    this.initializePool();
  }

  /**
   * Initialize the object pool with pre-allocated sprites
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.poolSize; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        transparent: true,
        opacity: 1,
        depthTest: false,
        depthWrite: false,
      }));
      sprite.visible = false;
      this.add(sprite);

      const instance: FloatingTextInstance = {
        sprite,
        startPosition: new THREE.Vector3(),
        startTime: 0,
        duration: 0,
        animation: 'none',
        riseDistance: 0,
        startScale: 1,
        active: false,
      };

      this.pool.push(instance);
    }
  }

  /**
   * Spawn a floating text at the specified position
   */
  public spawn(
    position: THREE.Vector3,
    text: string,
    options: FloatingTextSpawnOptions = {}
  ): void {
    // Get instance from pool
    const instance = this.getInstanceFromPool();
    if (!instance) {
      Logger.warn('FloatingText', 'Pool exhausted, cannot spawn text');
      return;
    }

    // Apply configuration
    const color = options.color ?? this.config.color;
    const scale = options.scale ?? 1;
    const animation = options.animation ?? this.config.animation;
    const duration = options.duration ?? this.config.duration;

    // Create or retrieve canvas texture
    const texture = this.createTextTexture(text, color);
    instance.sprite.material.map = texture;
    instance.sprite.material.needsUpdate = true;

    // Position with offset
    instance.startPosition.copy(position);
    instance.startPosition.x += this.config.offset[0];
    instance.startPosition.y += this.config.offset[1];
    instance.startPosition.z += this.config.offset[2];
    instance.sprite.position.copy(instance.startPosition);

    // Calculate scale based on texture size
    const aspectRatio = texture.image.width / texture.image.height;
    const baseScale = 0.5; // Base world unit scale
    instance.startScale = baseScale * scale;
    instance.sprite.scale.set(
      instance.startScale * aspectRatio,
      instance.startScale,
      1
    );

    // Configure animation
    instance.startTime = performance.now();
    instance.duration = duration;
    instance.animation = animation;
    instance.riseDistance = this.config.riseDistance;
    instance.active = true;
    instance.sprite.visible = true;

    // Add to active list
    this.activeInstances.push(instance);
  }

  /**
   * Update all active floating texts
   */
  public update(camera: THREE.Camera, deltaTime: number): void {
    const currentTime = performance.now();
    const instancesToRemove: FloatingTextInstance[] = [];

    for (const instance of this.activeInstances) {
      const elapsed = currentTime - instance.startTime;
      const progress = Math.min(elapsed / instance.duration, 1);

      // Update animation
      this.updateAnimation(instance, progress);

      // Billboard effect - face camera
      instance.sprite.quaternion.copy(camera.quaternion);

      // Mark for removal if complete
      if (progress >= 1) {
        instancesToRemove.push(instance);
      }
    }

    // Remove completed instances
    for (const instance of instancesToRemove) {
      this.returnInstanceToPool(instance);
    }
  }

  /**
   * Update individual instance based on animation type
   */
  private updateAnimation(instance: FloatingTextInstance, progress: number): void {
    const easeOut = 1 - Math.pow(1 - progress, 2);
    const easeInOut = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    switch (instance.animation) {
      case 'rise-fade': {
        // Float upward while fading
        const offset = easeOut * instance.riseDistance;
        instance.sprite.position.copy(instance.startPosition);
        instance.sprite.position.y += offset;
        instance.sprite.material.opacity = 1 - progress;
        break;
      }

      case 'pop': {
        // Scale up quickly then shrink while fading
        const scale = progress < 0.3
          ? 1 + (progress / 0.3) * 0.5 // Grow to 1.5x
          : 1.5 - ((progress - 0.3) / 0.7) * 0.5; // Shrink back to 1x

        const map = instance.sprite.material.map;
        const aspectRatio = map?.image ? map.image.width / map.image.height : 1;
        instance.sprite.scale.set(
          instance.startScale * scale * aspectRatio,
          instance.startScale * scale,
          1
        );
        instance.sprite.material.opacity = 1 - progress;
        break;
      }

      case 'bounce': {
        // Bounce up and down while fading
        const bounceHeight = Math.sin(progress * Math.PI) * instance.riseDistance;
        instance.sprite.position.copy(instance.startPosition);
        instance.sprite.position.y += bounceHeight;
        instance.sprite.material.opacity = 1 - progress;
        break;
      }

      case 'none': {
        // Just fade out
        instance.sprite.material.opacity = 1 - progress;
        break;
      }
    }
  }

  /**
   * Create a canvas texture for the given text
   */
  private createTextTexture(text: string, color: number): THREE.Texture {
    // Create cache key
    const cacheKey = `${text}_${color.toString(16)}`;

    // Check cache
    let canvas = this.canvasCache.get(cacheKey);
    if (!canvas) {
      canvas = this.renderTextToCanvas(text, color);
      this.canvasCache.set(cacheKey, canvas);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Render text to a canvas element
   */
  private renderTextToCanvas(text: string, color: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Set font to measure text
    ctx.font = this.config.font;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = parseInt(this.config.font.match(/\d+/)?.[0] ?? '24', 10);

    // Set canvas size with padding
    const padding = this.config.strokeWidth * 2;
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Re-set font after canvas resize (resets context)
    ctx.font = this.config.font;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // Draw stroke
    if (this.config.strokeWidth > 0) {
      ctx.strokeStyle = `#${this.config.stroke.toString(16).padStart(6, '0')}`;
      ctx.lineWidth = this.config.strokeWidth * 2;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(text, padding, padding);
    }

    // Draw fill
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillText(text, padding, padding);

    return canvas;
  }

  /**
   * Get an available instance from the pool
   */
  private getInstanceFromPool(): FloatingTextInstance | null {
    for (const instance of this.pool) {
      if (!instance.active) {
        return instance;
      }
    }
    return null;
  }

  /**
   * Return an instance to the pool
   */
  private returnInstanceToPool(instance: FloatingTextInstance): void {
    instance.active = false;
    instance.sprite.visible = false;
    instance.sprite.material.opacity = 1;

    // Remove from active list
    const index = this.activeInstances.indexOf(instance);
    if (index !== -1) {
      this.activeInstances.splice(index, 1);
    }
  }

  /**
   * Clear all active floating texts
   */
  public clearAll(): void {
    for (const instance of this.activeInstances) {
      this.returnInstanceToPool(instance);
    }
    this.activeInstances = [];
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.clearAll();

    // Dispose sprites
    for (const instance of this.pool) {
      if (instance.sprite.material.map) {
        instance.sprite.material.map.dispose();
      }
      instance.sprite.material.dispose();
    }

    // Clear cache
    this.canvasCache.clear();

    this.pool = [];
  }
}
