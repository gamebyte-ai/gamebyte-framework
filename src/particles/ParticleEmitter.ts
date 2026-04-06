import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics } from '../contracts/Graphics.js';
import { graphics } from '../graphics/GraphicsEngine.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParticleConfig {
  /** Max simultaneous particles (default: 100) */
  maxParticles?: number;
  /** Particles emitted per second (default: 20) */
  rate?: number;
  /** Particle lifetime range in seconds */
  lifetime?: { min: number; max: number };
  /** Initial speed range in px/sec */
  speed?: { min: number; max: number };
  /** Emission angle range in radians (default: full circle) */
  angle?: { min: number; max: number };
  /** Gravity in px/sec² (default: 0) */
  gravity?: number;
  /** Start/end scale */
  scale?: { start: number; end: number };
  /** Start/end alpha */
  alpha?: { start: number; end: number };
  /** Start/end color (hex numbers) */
  color?: { start: number; end: number };
  /** Particle shape (default: 'circle') */
  shape?: 'circle' | 'square' | 'triangle';
  /** Particle size in px (default: 4) */
  size?: number;
  /** Blend mode (default: 'normal') */
  blendMode?: 'normal' | 'add' | 'screen';
}

export interface ParticleEmitterEvents {
  'particle-spawn': (count: number) => void;
  'complete': () => void;
}

// Internal resolved config — all fields guaranteed present
interface ResolvedConfig {
  maxParticles: number;
  rate: number;
  lifetime: { min: number; max: number };
  speed: { min: number; max: number };
  angle: { min: number; max: number };
  gravity: number;
  scale: { start: number; end: number };
  alpha: { start: number; end: number };
  color: { start: number; end: number };
  shape: 'circle' | 'square' | 'triangle';
  size: number;
  blendMode: 'normal' | 'add' | 'screen';
}

// Pre-allocated particle data (no class allocation per particle)
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  active: boolean;
  graphics: IGraphics;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULTS: ResolvedConfig = {
  maxParticles: 100,
  rate: 20,
  lifetime: { min: 1.0, max: 2.0 },
  speed: { min: 50, max: 150 },
  angle: { min: 0, max: Math.PI * 2 },
  gravity: 0,
  scale: { start: 1, end: 0 },
  alpha: { start: 1, end: 0 },
  color: { start: 0xffffff, end: 0xffffff },
  shape: 'circle',
  size: 4,
  blendMode: 'normal',
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(startColor: number, endColor: number, t: number): number {
  const sr = (startColor >> 16) & 0xff;
  const sg = (startColor >> 8) & 0xff;
  const sb = startColor & 0xff;
  const er = (endColor >> 16) & 0xff;
  const eg = (endColor >> 8) & 0xff;
  const eb = endColor & 0xff;
  const r = Math.round(lerp(sr, er, t));
  const g = Math.round(lerp(sg, eg, t));
  const b = Math.round(lerp(sb, eb, t));
  return (r << 16) | (g << 8) | b;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function mergeConfig(partial: Partial<ParticleConfig>): ResolvedConfig {
  return {
    maxParticles: partial.maxParticles ?? DEFAULTS.maxParticles,
    rate: partial.rate ?? DEFAULTS.rate,
    lifetime: partial.lifetime ?? { ...DEFAULTS.lifetime },
    speed: partial.speed ?? { ...DEFAULTS.speed },
    angle: partial.angle ?? { ...DEFAULTS.angle },
    gravity: partial.gravity ?? DEFAULTS.gravity,
    scale: partial.scale ?? { ...DEFAULTS.scale },
    alpha: partial.alpha ?? { ...DEFAULTS.alpha },
    color: partial.color ?? { ...DEFAULTS.color },
    shape: partial.shape ?? DEFAULTS.shape,
    size: partial.size ?? DEFAULTS.size,
    blendMode: partial.blendMode ?? DEFAULTS.blendMode,
  };
}

function drawShape(gfx: IGraphics, shape: 'circle' | 'square' | 'triangle', size: number, color: number): void {
  gfx.clear();
  const half = size / 2;
  switch (shape) {
    case 'circle':
      gfx.circle(0, 0, half).fill({ color });
      break;
    case 'square':
      gfx.rect(-half, -half, size, size).fill({ color });
      break;
    case 'triangle': {
      const points = [
        0, -half,
        half, half,
        -half, half,
      ];
      gfx.poly(points).fill({ color });
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// ParticleEmitter
// ---------------------------------------------------------------------------

/**
 * General-purpose 2D particle emitter.
 *
 * Supports continuous emission and one-shot bursts. Uses a fixed-size particle
 * pool pre-allocated in the constructor to avoid per-frame garbage collection.
 *
 * @example
 * ```typescript
 * const emitter = new ParticleEmitter({ rate: 30, gravity: 200 });
 * scene.addChild(emitter.getContainer());
 * emitter.start(200, 300);
 *
 * // In game loop
 * emitter.update(dt);
 * ```
 */
export class ParticleEmitter extends EventEmitter<ParticleEmitterEvents> {
  private _container: IContainer;
  private _config: ResolvedConfig;
  private _particles: Particle[];
  private _activeCount: number = 0;
  private _isEmitting: boolean = false;
  private _emitX: number = 0;
  private _emitY: number = 0;
  private _spawnAccumulator: number = 0;
  private _spawnInterval: number;
  private _burstActive: boolean = false;
  private _destroyed: boolean = false;

  constructor(config?: Partial<ParticleConfig>) {
    super();
    this._config = mergeConfig(config ?? {});
    this._spawnInterval = 1 / this._config.rate;

    const factory = graphics();
    this._container = factory.createContainer();

    // Pre-allocate the particle pool
    this._particles = [];
    for (let i = 0; i < this._config.maxParticles; i++) {
      const gfx = factory.createGraphics();
      drawShape(gfx, this._config.shape, this._config.size, this._config.color.start);
      gfx.visible = false;
      this._container.addChild(gfx);
      this._particles.push({
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 0,
        active: false,
        graphics: gfx,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /** Get the container to add to your scene. */
  getContainer(): IContainer {
    return this._container;
  }

  /** Start continuous emission at (x, y). */
  start(x: number, y: number): void {
    this._emitX = x;
    this._emitY = y;
    this._isEmitting = true;
    this._spawnAccumulator = 0;
    this._burstActive = false;
  }

  /** Stop continuous emission. Existing particles continue until they expire. */
  stop(): void {
    this._isEmitting = false;
  }

  /**
   * One-shot burst of N particles at (x, y).
   * Emits `complete` once all burst particles have expired.
   * @param count - number of particles to spawn (default: maxParticles / 2)
   */
  burst(x: number, y: number, count?: number): void {
    const n = count ?? Math.floor(this._config.maxParticles / 2);
    this._emitX = x;
    this._emitY = y;
    this._burstActive = true;
    this._isEmitting = false;

    let spawned = 0;
    for (let i = 0; i < n; i++) {
      if (this._spawnOne()) spawned++;
    }

    if (spawned > 0) {
      this.emit('particle-spawn', spawned);
    }
  }

  /** Move the emitter position (for following entities during continuous emission). */
  moveTo(x: number, y: number): void {
    this._emitX = x;
    this._emitY = y;
  }

  /**
   * Update all active particles. Must be called each frame.
   * @param dt - delta time in seconds
   */
  update(dt: number): void {
    if (this._destroyed) return;

    // Spawn new particles for continuous emission
    if (this._isEmitting) {
      this._spawnAccumulator += dt;
      let spawned = 0;
      while (this._spawnAccumulator >= this._spawnInterval) {
        if (this._spawnOne()) spawned++;
        this._spawnAccumulator -= this._spawnInterval;
      }
      if (spawned > 0) {
        this.emit('particle-spawn', spawned);
      }
    }

    // Update all particles (hot path — minimal allocations)
    const particles = this._particles;
    const len = particles.length;
    const gravity = this._config.gravity;
    const alphaStart = this._config.alpha.start;
    const alphaEnd = this._config.alpha.end;
    const scaleStart = this._config.scale.start;
    const scaleEnd = this._config.scale.end;
    const colorStart = this._config.color.start;
    const colorEnd = this._config.color.end;
    const colorsMatch = colorStart === colorEnd;

    for (let i = 0; i < len; i++) {
      const p = particles[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.graphics.visible = false;
        this._activeCount--;
        continue;
      }

      // Physics
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Progress: 0 = just spawned, 1 = about to die
      const progress = 1 - (p.life / p.maxLife);
      const gfx = p.graphics;

      gfx.x = p.x;
      gfx.y = p.y;
      gfx.alpha = lerp(alphaStart, alphaEnd, progress);
      const s = lerp(scaleStart, scaleEnd, progress);
      gfx.scale.x = s;
      gfx.scale.y = s;

      // Redraw with interpolated color only when colors differ
      if (!colorsMatch) {
        const color = lerpColor(colorStart, colorEnd, progress);
        drawShape(gfx, this._config.shape, this._config.size, color);
      }
    }

    // Fire 'complete' when a burst finishes and all particles have expired
    if (this._burstActive && !this._isEmitting && this._activeCount === 0) {
      this._burstActive = false;
      this.emit('complete');
    }
  }

  /** Update config at runtime. Does not resize the particle pool. */
  configure(config: Partial<ParticleConfig>): void {
    // Rate changes require recalculating spawn interval
    const newConfig = mergeConfig({ ...this._config, ...config });
    this._config = newConfig;
    this._spawnInterval = 1 / this._config.rate;
  }

  /** Kill all active particles and stop emission immediately. */
  clear(): void {
    this._isEmitting = false;
    this._burstActive = false;
    this._spawnAccumulator = 0;
    const particles = this._particles;
    for (let i = 0, len = particles.length; i < len; i++) {
      const p = particles[i];
      if (p.active) {
        p.active = false;
        p.graphics.visible = false;
      }
    }
    this._activeCount = 0;
  }

  /** Destroy emitter and free all resources. */
  destroy(): void {
    this.clear();
    this._destroyed = true;
    const particles = this._particles;
    for (let i = 0, len = particles.length; i < len; i++) {
      particles[i].graphics.destroy();
    }
    this._particles = [];
    this._container.destroy();
    this.removeAllListeners();
  }

  // --------------------------------------------------------------------------
  // Accessors
  // --------------------------------------------------------------------------

  get activeCount(): number {
    return this._activeCount;
  }

  get isEmitting(): boolean {
    return this._isEmitting;
  }

  // --------------------------------------------------------------------------
  // Static presets
  // --------------------------------------------------------------------------

  /**
   * Burst of orange-to-red particles — explosion effect.
   * Call `emitter.update(dt)` each frame; `complete` fires when finished.
   */
  static explosion(x: number, y: number): ParticleEmitter {
    const emitter = new ParticleEmitter({
      maxParticles: 80,
      rate: 200,
      lifetime: { min: 0.4, max: 0.9 },
      speed: { min: 120, max: 320 },
      angle: { min: 0, max: Math.PI * 2 },
      gravity: 150,
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      color: { start: 0xff8800, end: 0xff2200 },
      shape: 'circle',
      size: 6,
      blendMode: 'add',
    });
    emitter.burst(x, y, 60);
    return emitter;
  }

  /**
   * Gentle upward gold sparkle — pickup / reward effect.
   * Continuous; call `stop()` when finished.
   */
  static sparkle(x: number, y: number): ParticleEmitter {
    const emitter = new ParticleEmitter({
      maxParticles: 40,
      rate: 15,
      lifetime: { min: 0.8, max: 1.5 },
      speed: { min: 20, max: 80 },
      angle: { min: -Math.PI * 1.1, max: -Math.PI * 0.9 },
      gravity: -30,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      color: { start: 0xffd700, end: 0xffee88 },
      shape: 'circle',
      size: 5,
      blendMode: 'add',
    });
    emitter.start(x, y);
    return emitter;
  }

  /**
   * Gray rising smoke — fire / exhaust effect.
   * Continuous; call `stop()` when finished.
   */
  static smoke(x: number, y: number): ParticleEmitter {
    const emitter = new ParticleEmitter({
      maxParticles: 60,
      rate: 12,
      lifetime: { min: 1.5, max: 3.0 },
      speed: { min: 10, max: 40 },
      angle: { min: -Math.PI * 1.2, max: -Math.PI * 0.8 },
      gravity: -20,
      scale: { start: 0.5, end: 2.0 },
      alpha: { start: 0.6, end: 0 },
      color: { start: 0x888888, end: 0xaaaaaa },
      shape: 'circle',
      size: 10,
      blendMode: 'normal',
    });
    emitter.start(x, y);
    return emitter;
  }

  /**
   * Multi-color celebration confetti burst.
   * Call `emitter.update(dt)` each frame; `complete` fires when finished.
   */
  static confetti(x: number, y: number): ParticleEmitter {
    // Cycle through a palette by using a wide color range and square shapes
    const emitter = new ParticleEmitter({
      maxParticles: 80,
      rate: 200,
      lifetime: { min: 1.0, max: 2.5 },
      speed: { min: 80, max: 220 },
      angle: { min: -Math.PI * 1.2, max: -Math.PI * 0.3 },
      gravity: 200,
      scale: { start: 1, end: 0.8 },
      alpha: { start: 1, end: 0 },
      color: { start: 0xff69b4, end: 0x00ccff },
      shape: 'square',
      size: 8,
      blendMode: 'normal',
    });
    emitter.burst(x, y, 60);
    return emitter;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /** Find an inactive particle slot, initialise it, and return true on success. */
  private _spawnOne(): boolean {
    const particles = this._particles;
    const len = particles.length;
    for (let i = 0; i < len; i++) {
      if (!particles[i].active) {
        this._initParticle(particles[i]);
        return true;
      }
    }
    return false; // pool exhausted
  }

  private _initParticle(p: Particle): void {
    const cfg = this._config;
    const angle = rand(cfg.angle.min, cfg.angle.max);
    const speed = rand(cfg.speed.min, cfg.speed.max);
    const life = rand(cfg.lifetime.min, cfg.lifetime.max);

    p.x = this._emitX;
    p.y = this._emitY;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = life;
    p.maxLife = life;
    p.active = true;
    this._activeCount++;

    const gfx = p.graphics;
    drawShape(gfx, cfg.shape, cfg.size, cfg.color.start);
    gfx.x = p.x;
    gfx.y = p.y;
    gfx.alpha = cfg.alpha.start;
    const s = cfg.scale.start;
    gfx.scale.x = s;
    gfx.scale.y = s;
    gfx.visible = true;
    if (cfg.blendMode !== 'normal') {
      (gfx as any).blendMode = cfg.blendMode;
    }
  }
}
