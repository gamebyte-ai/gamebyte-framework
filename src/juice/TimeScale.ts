/**
 * TimeScale — Global time dilation system.
 * Enables slow-mo, speed-up, hitstop, and freeze effects.
 * Call `update(rawDt)` each frame with the unscaled delta, then
 * use `apply(dt)` to scale any per-frame value.
 */

import { EventEmitter } from 'eventemitter3';

export interface TimeScaleEvents {
  'changed': (scale: number) => void;
  'restored': () => void;
}

export class TimeScale extends EventEmitter<TimeScaleEvents> {
  private _scale = 1;
  private _restoreTimer = 0;
  private _restoreDuration = 0;
  private _easeBack = false;
  private _easeTimer = 0;
  private _easeStartScale = 1;
  private static readonly _EASE_DURATION = 200; // ms

  /** Current time scale (0.01 ≈ frozen, 1 = normal, 2 = double speed) */
  get scale(): number { return this._scale; }

  /** Set time scale instantly with no auto-restore. */
  set(scale: number): void {
    this._scale = Math.max(0.001, scale);
    this._restoreTimer = 0;
    this._easeBack = false;
    this._easeTimer = 0;
    this.emit('changed', this._scale);
  }

  /**
   * Set time scale for a duration (ms), then restore to 1.0.
   * @param scale - Target scale factor
   * @param durationMs - How long to hold the scale
   * @param easeBack - If true, smoothly lerp back to 1.0 over 200ms
   */
  setTemporary(scale: number, durationMs: number, easeBack = false): void {
    this._scale = Math.max(0.001, scale);
    this._restoreTimer = durationMs;
    this._restoreDuration = durationMs;
    this._easeBack = easeBack;
    this._easeTimer = 0;
    this.emit('changed', this._scale);
  }

  /**
   * Freeze time for `durationMs` milliseconds (scale ≈ 0.01).
   * Uses 0.01 instead of 0 so systems that divide by dt don't break.
   */
  freeze(durationMs: number): void {
    this.setTemporary(0.01, durationMs, false);
  }

  /**
   * Slow motion for `durationMs` milliseconds, then ease back to normal.
   * @param durationMs - How long to stay in slow-mo
   * @param scale - Slow-mo factor (default: 0.2)
   */
  slowMo(durationMs: number, scale = 0.2): void {
    this.setTemporary(scale, durationMs, true);
  }

  /**
   * Apply current time scale to a raw delta time value.
   * @param dt - Raw (unscaled) delta time
   * @returns Scaled delta time
   */
  apply(dt: number): number {
    return dt * this._scale;
  }

  /**
   * Must be called each frame with UNSCALED delta time (in seconds).
   * Handles timer countdown, ease-back, and auto-restore.
   * @param rawDt - Unscaled delta time in seconds
   */
  update(rawDt: number): void {
    let dtMs = rawDt * 1000;

    // --- Hold phase ---
    if (this._restoreTimer > 0) {
      this._restoreTimer -= dtMs;

      if (this._restoreTimer <= 0) {
        // Remaining dt after hold expired (positive = overflow into ease phase)
        const overflow = -this._restoreTimer;
        this._restoreTimer = 0;

        if (this._easeBack) {
          this._easeStartScale = this._scale;
          this._easeTimer = TimeScale._EASE_DURATION;
          // Apply overflow into ease phase below
          dtMs = overflow;
        } else {
          this._scale = 1;
          this.emit('changed', this._scale);
          this.emit('restored');
          return;
        }
      } else {
        return; // Still in hold phase, nothing more to do
      }
    }

    // --- Ease-back phase ---
    if (this._easeBack && this._easeTimer > 0) {
      this._easeTimer -= dtMs;
      const t = 1 - Math.max(0, this._easeTimer) / TimeScale._EASE_DURATION;
      this._scale = this._easeStartScale + (1 - this._easeStartScale) * t;

      if (this._easeTimer <= 0) {
        this._scale = 1;
        this._easeBack = false;
        this.emit('changed', this._scale);
        this.emit('restored');
      }
    }
  }

  /** Reset to normal time scale immediately. */
  reset(): void {
    this._scale = 1;
    this._restoreTimer = 0;
    this._easeBack = false;
    this._easeTimer = 0;
    this.emit('changed', 1);
    this.emit('restored');
  }
}
