/**
 * AutoAttack - Manages auto-attack targeting and fire rate for survivors/roguelike games.
 * No Pixi/Three dependencies — pure logic, emits events for the game to render.
 */

import { EventEmitter } from 'eventemitter3';

export interface AutoAttackConfig {
  /** Attack range in pixels */
  range: number;
  /** Attacks per second */
  fireRate: number;
  /** Damage per hit */
  damage: number;
  /** Targeting strategy */
  targeting?: 'nearest' | 'lowest-hp' | 'random';
}

export interface AutoAttackEvents {
  'fire': (target: any, damage: number) => void;
  'target-changed': (target: any | null) => void;
}

type Enemy = { x: number; y: number; health?: number };

export class AutoAttack extends EventEmitter<AutoAttackEvents> {
  private _range: number;
  private _fireRate: number;
  private _damage: number;
  private _targeting: NonNullable<AutoAttackConfig['targeting']>;
  private _target: any | null = null;
  private _accumulated: number = 0;

  constructor(config: AutoAttackConfig) {
    super();
    this._range = config.range;
    this._fireRate = config.fireRate;
    this._damage = config.damage;
    this._targeting = config.targeting ?? 'nearest';
  }

  /** Current target (or null) */
  get target(): any | null {
    return this._target;
  }

  /** Reconfigure at runtime (e.g., after an upgrade) */
  configure(config: Partial<AutoAttackConfig>): void {
    if (config.range    !== undefined) this._range    = config.range;
    if (config.fireRate !== undefined) this._fireRate = config.fireRate;
    if (config.damage   !== undefined) this._damage   = config.damage;
    if (config.targeting !== undefined) this._targeting = config.targeting;
  }

  /**
   * Call each frame.
   * @param dt      Delta time in seconds
   * @param owner   Entity with x, y position
   * @param enemies Array of enemies with x, y (and optionally health)
   */
  update(dt: number, owner: { x: number; y: number }, enemies: Enemy[]): void {
    if (this._fireRate <= 0) return;

    this._accumulated += dt;
    const interval = 1 / this._fireRate;

    // Fire once per elapsed interval (handles burst when dt > multiple intervals)
    while (this._accumulated >= interval) {
      this._accumulated -= interval;

      // Filter to in-range enemies
      const inRange = enemies.filter(e => this._dist(owner, e) <= this._range);
      const newTarget = inRange.length > 0 ? this._pickTarget(inRange, owner) : null;

      if (newTarget !== this._target) {
        this._target = newTarget;
        this.emit('target-changed', this._target);
      }

      if (this._target !== null) {
        this.emit('fire', this._target, this._damage);
      }
    }
  }

  // --- Private helpers ---

  private _dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private _pickTarget(candidates: Enemy[], owner: { x: number; y: number }): Enemy {
    switch (this._targeting) {
      case 'nearest': {
        let best = candidates[0];
        let bestDist = this._dist(owner, best);
        for (let i = 1; i < candidates.length; i++) {
          const d = this._dist(owner, candidates[i]);
          if (d < bestDist) { bestDist = d; best = candidates[i]; }
        }
        return best;
      }
      case 'lowest-hp': {
        let best = candidates[0];
        let bestHp = best.health ?? 0;
        for (let i = 1; i < candidates.length; i++) {
          const hp = candidates[i].health ?? 0;
          if (hp < bestHp) { bestHp = hp; best = candidates[i]; }
        }
        return best;
      }
      case 'random':
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
}
