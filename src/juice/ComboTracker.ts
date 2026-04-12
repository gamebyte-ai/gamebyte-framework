/**
 * ComboTracker — Tracks consecutive hit combos with a configurable timeout.
 *
 * Emits 'hit' each time a hit is registered, 'break' when the combo expires,
 * and 'milestone' when the count crosses a predefined threshold.
 *
 * Must call `update(dt)` each frame (dt in milliseconds).
 *
 * @example
 * ```typescript
 * const combo = new ComboTracker({ timeout: 2000, milestones: [5, 10, 25] });
 * combo.on('hit', (count, mult) => showComboUI(count, mult));
 * combo.on('break', (final) => hideComboUI());
 * combo.on('milestone', (count) => Juice.celebrate(scene, x, y));
 *
 * // In hit handler:
 * combo.hit();
 *
 * // In game loop (dt in ms):
 * combo.update(dt);
 * ```
 */

import { EventEmitter } from 'eventemitter3';

// ---- Events ----------------------------------------------------------------

export interface ComboTrackerEvents {
  /** Fired on each successful hit. */
  'hit': (count: number, multiplier: number) => void;
  /** Fired when the combo timer expires naturally. */
  'break': (finalCount: number) => void;
  /** Fired when count crosses a milestone threshold. */
  'milestone': (count: number) => void;
}

// ---- ComboTracker ----------------------------------------------------------

export class ComboTracker extends EventEmitter<ComboTrackerEvents> {
  private _count: number = 0;
  private _timer: number = 0;
  private readonly _timeout: number;
  private readonly _milestones: number[];

  constructor(config?: { timeout?: number; milestones?: number[] }) {
    super();
    this._timeout = config?.timeout ?? 2000;
    this._milestones = config?.milestones ?? [5, 10, 25, 50, 100];
  }

  // ---- Public API ----------------------------------------------------------

  /**
   * Register a hit. Resets the timeout and increments the counter.
   * @returns The new combo count.
   */
  hit(): number {
    this._count++;
    this._timer = this._timeout;

    this.emit('hit', this._count, this.multiplier);

    if (this._milestones.includes(this._count)) {
      this.emit('milestone', this._count);
    }

    return this._count;
  }

  /**
   * Advance the combo timer. Call each game frame.
   * @param dt - Delta time in milliseconds
   */
  update(dt: number): void {
    if (this._count === 0) return;

    this._timer -= dt;
    if (this._timer <= 0) {
      const final = this._count;
      this._count = 0;
      this._timer = 0;
      this.emit('break', final);
    }
  }

  /** Reset combo immediately without firing 'break'. */
  reset(): void {
    this._count = 0;
    this._timer = 0;
  }

  // ---- Getters -------------------------------------------------------------

  /** Current combo hit count. */
  get count(): number { return this._count; }

  /** Score multiplier: +0.5x per 10 hits, starting at 1x. */
  get multiplier(): number {
    return 1 + Math.floor(this._count / 10) * 0.5;
  }

  /** True while a combo is active (count > 0). */
  get isActive(): boolean { return this._count > 0; }
}
