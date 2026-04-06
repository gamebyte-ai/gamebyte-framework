/**
 * TweenManager — Singleton registry that drives all active tweens.
 *
 * Usage:
 *   TweenManager.update(deltaMs);  // called once per game loop frame
 *   TweenManager.killAll();
 *   TweenManager.killTweensOf(target);
 *
 * Performance patterns (mirrors TickSystem):
 *   - for-loop iteration (not forEach)
 *   - Flag-based lazy removal during iteration
 *   - Compact pass only when dirty
 */

import { Tween } from './Tween.js';

/** Internal handle stored per-registration */
interface TweenEntry {
  tween: Tween;
  /** Marked true to schedule removal on next compact */
  removed: boolean;
}

const WARN_THRESHOLD = 1000;

export class TweenManager {
  private static _entries: TweenEntry[] = [];
  private static _needsCompact = false;

  // ---- Registration API ------------------------------------------------

  /** Add a tween to the managed list. Called internally by Tween factory methods. */
  static add(tween: Tween): void {
    TweenManager._entries.push({ tween, removed: false });

    if (TweenManager._entries.length > WARN_THRESHOLD) {
      console.warn(
        `[TweenManager] Active tween count exceeded ${WARN_THRESHOLD}. ` +
          'Check for tween leaks.'
      );
    }
  }

  /** Remove a specific tween (lazy — flags for next compact pass). */
  static remove(tween: Tween): void {
    const entries = TweenManager._entries;
    const len = entries.length;
    for (let i = 0; i < len; i++) {
      if (entries[i].tween === tween) {
        entries[i].removed = true;
        TweenManager._needsCompact = true;
        return;
      }
    }
  }

  // ---- Update loop -------------------------------------------------------

  /**
   * Advance all active tweens.
   * Call once per frame from the game loop — dt in milliseconds.
   */
  static update(dt: number): void {
    if (TweenManager._needsCompact) {
      TweenManager._compact();
    }

    const entries = TweenManager._entries;
    const len = entries.length;

    for (let i = 0; i < len; i++) {
      const entry = entries[i];
      if (entry.removed) continue;

      entry.tween._update(dt);

      // If the tween marked itself finished during _update, flag for removal
      if (entry.tween._isFinished) {
        entry.removed = true;
        TweenManager._needsCompact = true;
      }
    }
  }

  // ---- Kill helpers -------------------------------------------------------

  /** Stop and remove all active tweens. */
  static killAll(): void {
    const entries = TweenManager._entries;
    const len = entries.length;
    for (let i = 0; i < len; i++) {
      if (!entries[i].removed) {
        entries[i].tween._kill();
        entries[i].removed = true;
      }
    }
    TweenManager._entries.length = 0;
    TweenManager._needsCompact = false;
  }

  /** Stop and remove all tweens whose target matches `target`. */
  static killTweensOf(target: object): void {
    const entries = TweenManager._entries;
    const len = entries.length;
    for (let i = 0; i < len; i++) {
      const entry = entries[i];
      if (!entry.removed && entry.tween._target === target) {
        entry.tween._kill();
        entry.removed = true;
        TweenManager._needsCompact = true;
      }
    }
  }

  // ---- Introspection -------------------------------------------------------

  /** Number of active (non-removed) tweens. */
  static get activeCount(): number {
    let count = 0;
    const entries = TweenManager._entries;
    const len = entries.length;
    for (let i = 0; i < len; i++) {
      if (!entries[i].removed) count++;
    }
    return count;
  }

  // ---- Internal helpers ---------------------------------------------------

  /** Compact the entries array — remove flagged entries in-place. */
  private static _compact(): void {
    let writeIdx = 0;
    const entries = TweenManager._entries;
    const len = entries.length;
    for (let i = 0; i < len; i++) {
      if (!entries[i].removed) {
        entries[writeIdx++] = entries[i];
      }
    }
    entries.length = writeIdx;
    TweenManager._needsCompact = false;
  }

  /** Reset internal state — primarily for unit tests. */
  static _reset(): void {
    TweenManager._entries.length = 0;
    TweenManager._needsCompact = false;
  }
}
