import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics } from '../../contracts/Graphics.js';
import { getGraphicsFactory } from './graphics-utils.js';

/**
 * Sunburst effect configuration
 */
export interface SunburstConfig {
  /** Number of rays - Default: 12 */
  rayCount?: number;
  /** Inner radius where rays start - Default: 20 */
  innerRadius?: number;
  /** Outer radius where rays end - Default: 150 */
  outerRadius?: number;
  /** Ray angular width in radians - Default: 0.15 */
  rayWidth?: number;
  /** Primary ray color - Default: 0xFFD700 (gold) */
  color?: number;
  /** Starting alpha at center - Default: 0.8 */
  alphaCenter?: number;
  /** Ending alpha at edge - Default: 0 */
  alphaEdge?: number;
  /** Rotation speed in radians per second - Default: 0.5 */
  rotationSpeed?: number;
  /** Rendering method - Default: 'mask' */
  method?: 'mask' | 'global';
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<SunburstConfig> = {
  rayCount: 12,
  innerRadius: 20,
  outerRadius: 150,
  rayWidth: 0.15,
  color: 0xFFD700,
  alphaCenter: 0.8,
  alphaEdge: 0,
  rotationSpeed: 0.5,
  method: 'mask'
};

/**
 * Convert hex color to rgba string with alpha
 */
function hexToRgba(hex: number, alpha: number): string {
  const r = (hex >> 16) & 0xFF;
  const g = (hex >> 8) & 0xFF;
  const b = hex & 0xFF;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * SunburstEffect - Rotating ray/sunburst background effect
 *
 * Creates a sunburst pattern with rays emanating from a center point,
 * featuring smooth gradient fade from center to edge. Optimized for
 * use as a rotating background element in mobile games.
 *
 * Two rendering methods available:
 * - 'mask' (default): Best for rotating backgrounds. Uses a radial gradient
 *   circle masked by ray shapes. Gradient rotates with the container.
 * - 'global': Uses global coordinate system for gradient. Better performance
 *   but gradient doesn't rotate with container (stays fixed in world space).
 *
 * @example
 * ```typescript
 * // Create sunburst effect
 * const sunburst = new SunburstEffect({
 *   rayCount: 16,
 *   outerRadius: 200,
 *   color: 0xFFD700,
 *   rotationSpeed: 0.3
 * });
 *
 * // Add to stage
 * stage.addChildAt(sunburst.getContainer(), 0);
 *
 * // Update in game loop
 * game.on('update', (dt) => sunburst.update(dt));
 *
 * // Position at center
 * sunburst.setPosition(screenWidth / 2, screenHeight / 2);
 * ```
 */
export class SunburstEffect extends EventEmitter {
  private container: IContainer;
  private config: Required<SunburstConfig>;
  private rotationAngle: number = 0;
  private isPaused: boolean = false;

  // For mask method
  private gradientCircle: IGraphics | null = null;
  private rayMask: IGraphics | null = null;

  // For global method
  private raysGraphics: IGraphics | null = null;

  constructor(config: SunburstConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    const factory = getGraphicsFactory();
    this.container = factory.createContainer();

    this.build();
  }

  /**
   * Build the sunburst effect based on configured method
   */
  private build(): void {
    if (this.config.method === 'mask') {
      this.buildMaskMethod();
    } else {
      this.buildGlobalMethod();
    }
  }

  /**
   * Build using Mask + Radial Gradient Circle method
   * Best for rotating backgrounds - gradient rotates with container
   */
  private buildMaskMethod(): void {
    const factory = getGraphicsFactory();
    const { innerRadius, outerRadius, rayCount, rayWidth, color, alphaCenter, alphaEdge } = this.config;

    // Create radial gradient circle
    const gradientCircle = factory.createGraphics();

    // Create radial gradient using graphics factory abstraction
    const circleGradient = factory.createRadialGradient({
      center: { x: 0.5, y: 0.5 },
      innerRadius: innerRadius / (outerRadius * 2),
      outerCenter: { x: 0.5, y: 0.5 },
      outerRadius: 0.5,
      colorStops: [
        { offset: 0, color: hexToRgba(color, alphaCenter) },
        { offset: 0.3, color: hexToRgba(color, alphaCenter * 0.7) },
        { offset: 0.6, color: hexToRgba(color, alphaCenter * 0.3) },
        { offset: 1, color: hexToRgba(color, alphaEdge) }
      ]
    });

    gradientCircle.circle(0, 0, outerRadius).fill(circleGradient.native);

    // Create ray mask
    const rayMask = factory.createGraphics();

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const startAngle = angle - rayWidth / 2;
      const endAngle = angle + rayWidth / 2;

      rayMask.moveTo(0, 0);
      rayMask.lineTo(
        Math.cos(startAngle) * (outerRadius + 10),
        Math.sin(startAngle) * (outerRadius + 10)
      );
      rayMask.lineTo(
        Math.cos(endAngle) * (outerRadius + 10),
        Math.sin(endAngle) * (outerRadius + 10)
      );
      rayMask.closePath();
    }
    rayMask.fill(0xffffff);

    // Apply mask - need to cast to any for mask property access
    (gradientCircle as any).mask = rayMask;

    this.container.addChild(rayMask);
    this.container.addChild(gradientCircle);

    this.gradientCircle = gradientCircle;
    this.rayMask = rayMask;
  }

  /**
   * Build using Single Graphics + Global Radial method
   * Better performance but gradient doesn't rotate with container
   */
  private buildGlobalMethod(): void {
    const factory = getGraphicsFactory();
    const { innerRadius, outerRadius, rayCount, rayWidth, color, alphaCenter, alphaEdge } = this.config;

    // Create radial gradient using graphics factory abstraction (global texture space)
    const radialGradient = factory.createRadialGradient({
      center: { x: 0, y: 0 },
      innerRadius: 0,
      outerCenter: { x: 0, y: 0 },
      outerRadius: outerRadius,
      colorStops: [
        { offset: 0, color: hexToRgba(color, alphaCenter) },
        { offset: 0.3, color: hexToRgba(color, alphaCenter * 0.7) },
        { offset: 0.6, color: hexToRgba(color, alphaCenter * 0.3) },
        { offset: 1, color: hexToRgba(color, alphaEdge) }
      ],
      textureSpace: 'global'
    });

    // Draw ALL rays in ONE Graphics object
    const rays = factory.createGraphics();

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const startAngle = angle - rayWidth / 2;
      const endAngle = angle + rayWidth / 2;

      rays.moveTo(
        Math.cos(startAngle) * innerRadius,
        Math.sin(startAngle) * innerRadius
      );
      rays.lineTo(
        Math.cos(startAngle) * outerRadius,
        Math.sin(startAngle) * outerRadius
      );
      rays.lineTo(
        Math.cos(endAngle) * outerRadius,
        Math.sin(endAngle) * outerRadius
      );
      rays.lineTo(
        Math.cos(endAngle) * innerRadius,
        Math.sin(endAngle) * innerRadius
      );
      rays.closePath();
    }
    rays.fill(radialGradient.native);

    this.container.addChild(rays);
    this.raysGraphics = rays;
  }

  /**
   * Update the effect - call every frame
   * @param deltaTime Time since last update in milliseconds
   */
  public update(deltaTime: number): void {
    if (this.isPaused) return;

    // Convert ms to seconds for rotation calculation
    const dt = deltaTime / 1000;
    this.rotationAngle += this.config.rotationSpeed * dt;

    // Apply rotation to container
    this.container.rotation = this.rotationAngle;

    this.emit('update', this.rotationAngle);
  }

  /**
   * Get the container for adding to stage
   */
  public getContainer(): IContainer {
    return this.container;
  }

  /**
   * Set position
   */
  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Set rotation speed
   * @param speed Radians per second
   */
  public setRotationSpeed(speed: number): void {
    this.config.rotationSpeed = speed;
  }

  /**
   * Pause rotation
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume rotation
   */
  public resume(): void {
    this.isPaused = false;
  }

  /**
   * Check if paused
   */
  public isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * Set visibility
   */
  public setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * Set alpha/opacity
   */
  public setAlpha(alpha: number): void {
    this.container.alpha = alpha;
  }

  /**
   * Rebuild with new configuration
   */
  public setConfig(config: Partial<SunburstConfig>): void {
    const methodChanged = config.method !== undefined && config.method !== this.config.method;

    Object.assign(this.config, config);

    // Clear existing graphics
    this.clear();

    // Rebuild
    this.build();

    this.emit('config-changed', this.config);
  }

  /**
   * Clear all graphics
   */
  private clear(): void {
    if (this.gradientCircle) {
      this.container.removeChild(this.gradientCircle);
      this.gradientCircle.destroy();
      this.gradientCircle = null;
    }

    if (this.rayMask) {
      this.container.removeChild(this.rayMask);
      this.rayMask.destroy();
      this.rayMask = null;
    }

    if (this.raysGraphics) {
      this.container.removeChild(this.raysGraphics);
      this.raysGraphics.destroy();
      this.raysGraphics = null;
    }
  }

  /**
   * Destroy the effect and clean up resources
   */
  public destroy(): void {
    this.clear();
    this.container.destroy();
    this.removeAllListeners();
  }
}
