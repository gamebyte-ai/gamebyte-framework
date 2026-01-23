import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics } from '../../contracts/Graphics.js';
import { graphics } from '../../graphics/GraphicsEngine.js';

/**
 * Confetti particle shape types
 */
export type ConfettiShape = 'rect' | 'circle' | 'star';

/**
 * Confetti configuration
 */
export interface ConfettiConfig {
  /** Particle colors - Default: golden celebration palette */
  colors?: number[];
  /** Number of particles - Default: 50 */
  particleCount?: number;
  /** Duration in ms - Default: 2000 */
  duration?: number;
  /** Gravity strength - Default: 0.5 */
  gravity?: number;
  /** Spread angle in degrees - Default: 60 */
  spread?: number;
  /** Particle shapes - Default: ['rect', 'circle'] */
  shapes?: ConfettiShape[];
  /** Particle size range - Default: { min: 4, max: 12 } */
  size?: { min: number; max: number };
}

/**
 * Default confetti configuration
 */
const DEFAULT_CONFIG: Required<ConfettiConfig> = {
  colors: [0xFFD700, 0xFF6B6B, 0x6BCB77, 0x4D96FF, 0xFF69B4, 0xFFFFFF],
  particleCount: 50,
  duration: 2000,
  gravity: 0.5,
  spread: 60,
  shapes: ['rect', 'circle'],
  size: { min: 4, max: 12 },
};

/**
 * Individual confetti particle
 */
interface ConfettiParticle {
  graphic: IGraphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  life: number;
  maxLife: number;
  wobbleSpeed: number;
  wobblePhase: number;
}

/**
 * ConfettiSystem - Handles confetti particle effects for celebrations
 *
 * Three modes:
 * - rain(): Particles fall from top of screen (victory, level complete)
 * - burst(x, y): Particles explode from a point (star earned, reward)
 * - fountain(x, y): Particles shoot up then fall (bonus, jackpot)
 *
 * @example
 * ```typescript
 * const confetti = new ConfettiSystem(stage);
 *
 * // Victory celebration
 * confetti.rain({ particleCount: 80 });
 *
 * // Star earned burst
 * confetti.burst(starX, starY, { colors: [0xFFD700] });
 *
 * // Update in game loop
 * game.on('update', (dt) => confetti.update(dt));
 * ```
 */
export class ConfettiSystem extends EventEmitter {
  private container: IContainer;
  private particles: ConfettiParticle[] = [];
  private screenWidth: number;
  private screenHeight: number;
  private isActive: boolean = false;

  constructor(container: IContainer, screenWidth: number = 360, screenHeight: number = 640) {
    super();
    this.container = container;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /**
   * Rain mode - Confetti falls from top of screen
   * Best for: Victory screens, level complete
   */
  public rain(config: ConfettiConfig = {}): void {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    this.isActive = true;

    for (let i = 0; i < cfg.particleCount; i++) {
      // Stagger particle creation over time for natural rain effect
      const delay = (i / cfg.particleCount) * 500;

      setTimeout(() => {
        if (!this.isActive) return;

        const particle = this.createParticle(
          Math.random() * this.screenWidth,
          -20 - Math.random() * 100,
          (Math.random() - 0.5) * 2, // Slight horizontal drift
          2 + Math.random() * 3,      // Downward velocity
          cfg
        );
        this.particles.push(particle);
      }, delay);
    }

    this.emit('rain-started', cfg.particleCount);
  }

  /**
   * Burst mode - Confetti explodes from a point
   * Best for: Star earned, reward received
   */
  public burst(x: number, y: number, config: ConfettiConfig = {}): void {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    this.isActive = true;

    const spreadRad = (cfg.spread * Math.PI) / 180;

    for (let i = 0; i < cfg.particleCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadRad * 2;
      const speed = 4 + Math.random() * 6;

      const particle = this.createParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        cfg
      );
      this.particles.push(particle);
    }

    this.emit('burst-started', { x, y, count: cfg.particleCount });
  }

  /**
   * Fountain mode - Confetti shoots up then falls
   * Best for: Bonus, jackpot, special rewards
   */
  public fountain(x: number, y: number, config: ConfettiConfig = {}): void {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    this.isActive = true;

    const spreadRad = (cfg.spread * Math.PI) / 180 / 2;

    for (let i = 0; i < cfg.particleCount; i++) {
      // Angle pointing upward with spread
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadRad;
      const speed = 8 + Math.random() * 6;

      const particle = this.createParticle(
        x + (Math.random() - 0.5) * 20,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        cfg
      );
      this.particles.push(particle);
    }

    this.emit('fountain-started', { x, y, count: cfg.particleCount });
  }

  /**
   * Create a single confetti particle
   */
  private createParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    config: Required<ConfettiConfig>
  ): ConfettiParticle {
    const factory = graphics();
    const graphic = factory.createGraphics();

    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
    const size = config.size.min + Math.random() * (config.size.max - config.size.min);

    // Draw particle shape
    this.drawParticleShape(graphic, shape, size, color);

    graphic.x = x;
    graphic.y = y;
    this.container.addChild(graphic);

    return {
      graphic,
      x,
      y,
      vx,
      vy,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      size,
      life: 0,
      maxLife: config.duration,
      wobbleSpeed: 2 + Math.random() * 4,
      wobblePhase: Math.random() * Math.PI * 2,
    };
  }

  /**
   * Draw particle shape
   */
  private drawParticleShape(graphic: IGraphics, shape: ConfettiShape, size: number, color: number): void {
    graphic.clear();

    switch (shape) {
      case 'rect':
        graphic.rect(-size / 2, -size / 4, size, size / 2);
        graphic.fill({ color });
        break;

      case 'circle':
        graphic.circle(0, 0, size / 2);
        graphic.fill({ color });
        break;

      case 'star':
        this.drawStar(graphic, 0, 0, size / 2, color);
        break;
    }
  }

  /**
   * Draw a star shape
   */
  private drawStar(graphic: IGraphics, cx: number, cy: number, radius: number, color: number): void {
    const points: number[] = [];
    const spikes = 5;
    const innerRadius = radius * 0.5;

    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? radius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      points.push(cx + Math.cos(angle) * r);
      points.push(cy + Math.sin(angle) * r);
    }

    graphic.poly(points);
    graphic.fill({ color });
  }

  /**
   * Update all particles - call every frame
   */
  public update(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update life
      p.life += deltaTime;

      // Apply gravity
      p.vy += DEFAULT_CONFIG.gravity * dt * 60;

      // Apply wobble (horizontal oscillation)
      const wobble = Math.sin(p.life * 0.01 * p.wobbleSpeed + p.wobblePhase) * 0.5;

      // Update position
      p.x += (p.vx + wobble) * dt * 60;
      p.y += p.vy * dt * 60;

      // Update rotation
      p.rotation += p.rotationSpeed;

      // Apply to graphic
      p.graphic.x = p.x;
      p.graphic.y = p.y;
      p.graphic.rotation = p.rotation;

      // Fade out in last 30% of life
      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio > 0.7) {
        p.graphic.alpha = 1 - ((lifeRatio - 0.7) / 0.3);
      }

      // Remove dead particles
      if (p.life >= p.maxLife || p.y > this.screenHeight + 50) {
        this.removeParticle(i);
      }
    }

    // Check if all particles are done
    if (this.isActive && this.particles.length === 0) {
      this.isActive = false;
      this.emit('complete');
    }
  }

  /**
   * Remove a particle
   */
  private removeParticle(index: number): void {
    const particle = this.particles[index];
    this.container.removeChild(particle.graphic);
    particle.graphic.destroy();
    this.particles.splice(index, 1);
  }

  /**
   * Clear all particles immediately
   */
  public clear(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.removeParticle(i);
    }
    this.isActive = false;
    this.emit('cleared');
  }

  /**
   * Resize the system
   */
  public resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  /**
   * Check if confetti is currently active
   */
  public getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Get current particle count
   */
  public getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * Destroy the system
   */
  public destroy(): void {
    this.clear();
    this.removeAllListeners();
  }
}
