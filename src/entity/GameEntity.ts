import { EventEmitter } from 'eventemitter3';
import { IContainer } from '../contracts/Graphics.js';
import { graphics } from '../graphics/GraphicsEngine.js';

/**
 * Typed events emitted by GameEntity
 */
export interface GameEntityEvents {
  'damaged': (amount: number, remaining: number) => void;
  'healed': (amount: number, current: number) => void;
  'died': () => void;
  'destroyed': () => void;
}

/**
 * Optional collision rectangle (AABB)
 */
export interface CollisionRect {
  width: number;
  height: number;
}

/**
 * Configuration for constructing a GameEntity
 */
export interface GameEntityConfig {
  /** Optional display object (Container, Sprite, etc.) added as child */
  display?: any;
  /** Initial x position */
  x?: number;
  /** Initial y position */
  y?: number;
  /** Initial x velocity (units/second) */
  vx?: number;
  /** Initial y velocity (units/second) */
  vy?: number;
  /** Starting health points */
  health?: number;
  /** Maximum health points */
  maxHealth?: number;
  /** Radius for circle-based collision detection */
  collisionRadius?: number;
  /** Bounding box for AABB collision detection */
  collisionRect?: CollisionRect;
  /** Classification tags for the entity */
  tags?: string[];
}

/**
 * GameEntity — base class for all game objects.
 *
 * Wraps a Pixi container via composition, applies velocity-based movement,
 * health tracking, collision detection, and typed event emission.
 *
 * @example
 * ```typescript
 * const player = new GameEntity({ x: 100, y: 200, health: 100, collisionRadius: 16 });
 * player.on('died', () => console.log('Player died'));
 * player.update(delta); // call each frame
 * ```
 */
export class GameEntity extends EventEmitter<GameEntityEvents> {
  private static readonly DEFAULT_CONFIG: Required<Omit<GameEntityConfig, 'display' | 'collisionRect'>> & {
    display: any;
    collisionRect: CollisionRect | undefined;
  } = {
    display: null,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    health: 100,
    maxHealth: 100,
    collisionRadius: 0,
    collisionRect: undefined,
    tags: []
  };

  private readonly _container: IContainer;
  private _health: number;
  private _maxHealth: number;
  private _isAlive: boolean;

  /** X velocity in units per second */
  vx: number;
  /** Y velocity in units per second */
  vy: number;
  /** Movement speed scalar (applied externally if needed) */
  speed: number = 1;
  /** Whether the entity is active in the game world */
  active: boolean = true;
  /** Radius used for circle-based collision */
  readonly collisionRadius: number;
  /** AABB dimensions used for rect-based collision */
  readonly collisionRect: CollisionRect | undefined;
  /** Classification tags */
  readonly tags: Set<string>;

  constructor(config: GameEntityConfig = {}) {
    super();

    const cfg = { ...GameEntity.DEFAULT_CONFIG, ...config };

    this._container = graphics().createContainer();
    this._container.x = cfg.x;
    this._container.y = cfg.y;

    if (cfg.display) {
      this._container.addChild(cfg.display);
    }

    this.vx = cfg.vx;
    this.vy = cfg.vy;
    this._health = cfg.health;
    this._maxHealth = cfg.maxHealth;
    this._isAlive = cfg.health > 0;
    this.collisionRadius = cfg.collisionRadius;
    this.collisionRect = cfg.collisionRect;
    this.tags = new Set(cfg.tags);
  }

  // ============================================
  // POSITION PROXY
  // ============================================

  get x(): number {
    return this._container.x;
  }

  set x(value: number) {
    this._container.x = value;
  }

  get y(): number {
    return this._container.y;
  }

  set y(value: number) {
    this._container.y = value;
  }

  // ============================================
  // HEALTH
  // ============================================

  get health(): number {
    return this._health;
  }

  get maxHealth(): number {
    return this._maxHealth;
  }

  get isAlive(): boolean {
    return this._isAlive;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Returns the internal IContainer for adding to scenes.
   */
  getContainer(): IContainer {
    return this._container;
  }

  /**
   * Per-frame update. Applies velocity, override in subclasses for custom logic.
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    this.move(dt);
  }

  /**
   * Applies velocity to position. Called by update(); can also be called directly.
   * @param dt - Delta time in seconds
   */
  protected move(dt: number): void {
    this._container.x += this.vx * dt;
    this._container.y += this.vy * dt;
  }

  /**
   * Reduce health by amount. Emits 'damaged'. If health reaches 0 emits 'died'.
   * @param amount - Damage amount (positive number)
   */
  damage(amount: number): void {
    if (!this._isAlive) return;

    this._health = Math.max(0, this._health - amount);
    this.emit('damaged', amount, this._health);

    if (this._health <= 0) {
      this._isAlive = false;
      this.emit('died');
    }
  }

  /**
   * Restore health by amount, capped at maxHealth. Emits 'healed'.
   * @param amount - Heal amount (positive number)
   */
  heal(amount: number): void {
    const before = this._health;
    this._health = Math.min(this._maxHealth, this._health + amount);
    const actual = this._health - before;
    this.emit('healed', actual, this._health);
  }

  /**
   * Returns true if this entity overlaps the other.
   * Uses circle collision when both have collisionRadius > 0,
   * otherwise falls back to AABB if collisionRect is set.
   */
  collidesWith(other: GameEntity): boolean {
    const useCircle = this.collisionRadius > 0 && other.collisionRadius > 0;

    if (useCircle) {
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < this.collisionRadius + other.collisionRadius;
    }

    // AABB fallback — requires collisionRect on both
    const a = this.collisionRect;
    const b = other.collisionRect;
    if (!a || !b) return false;

    const ax = this.x - a.width * 0.5;
    const ay = this.y - a.height * 0.5;
    const bx = other.x - b.width * 0.5;
    const by = other.y - b.height * 0.5;

    return (
      ax < bx + b.width &&
      ax + a.width > bx &&
      ay < by + b.height &&
      ay + a.height > by
    );
  }

  /**
   * Returns the Euclidean distance between this entity's position and another.
   */
  distanceTo(other: GameEntity): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Remove this entity's container from its parent, emit 'destroyed', and clean up listeners.
   */
  destroy(): void {
    if (this._container.children && (this._container as any).parent) {
      (this._container as any).parent.removeChild(this._container);
    }
    this._container.destroy();
    this.emit('destroyed');
    this.removeAllListeners();
  }
}
