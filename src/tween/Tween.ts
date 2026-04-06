/**
 * Tween — Lightweight property animator.
 *
 * Primary API:
 *   Tween.to(target, { x: 100, y: 200 }, { duration: 500 })
 *   Tween.from(target, { alpha: 0 }, { duration: 300, ease: Ease.cubicOut })
 *   Tween.sequence([tween1, tween2])
 *   Tween.parallel([tween1, tween2])
 *   Tween.delay(ms)
 *
 * Performance patterns (mirrors TickSystem):
 *   - Property arrays pre-allocated in constructor
 *   - for-loops in hot paths (_update)
 *   - Start values captured on first _update call for .to() (lazy)
 *   - No allocations during update
 */

import { EventEmitter } from 'eventemitter3';
import { Ease, EasingFunction } from './Ease.js';
import { TweenManager } from './TweenManager.js';

// ---- Configuration -------------------------------------------------------

export interface TweenConfig {
  /** Duration in milliseconds */
  duration: number;
  /** Easing function — defaults to Ease.quadOut */
  ease?: EasingFunction;
  /** Delay before start in milliseconds — defaults to 0 */
  delay?: number;
  /** Repeat count: 0 = no repeat, -1 = infinite */
  repeat?: number;
  /** Reverse direction on each repeat cycle */
  yoyo?: boolean;
  /** Called each frame with the eased progress value [0, 1] */
  onUpdate?: (progress: number) => void;
  /** Called when the tween (including all repeats) finishes */
  onComplete?: () => void;
}

// ---- Events --------------------------------------------------------------

export interface TweenEvents {
  update: [progress: number];
  complete: [];
  pause: [];
  resume: [];
  stop: [];
}

// ---- Internal property record -------------------------------------------

interface PropRecord {
  key: string;
  start: number;
  end: number;
}

// ---- Container mode enum ------------------------------------------------

const enum ContainerMode {
  None = 0,
  Sequence = 1,
  Parallel = 2
}

// ---- Tween ---------------------------------------------------------------

export class Tween extends EventEmitter<TweenEvents> {
  // Internal fields accessed by TweenManager (underscore prefix convention)
  /** The object being tweened — null for sequence/parallel containers */
  _target: object | null;
  /** True once the tween has finished and can be removed from TweenManager */
  _isFinished = false;

  // Config
  private readonly _duration: number;
  private readonly _ease: EasingFunction;
  private readonly _delay: number;
  private readonly _repeat: number;
  private readonly _yoyo: boolean;
  private readonly _onUpdate: ((p: number) => void) | undefined;
  private readonly _onComplete: (() => void) | undefined;

  // Runtime state
  private _elapsed = 0;
  private _delayElapsed = 0;
  private _repeatCount = 0;
  private _playing = true;
  /** 1 = forward, -1 = backward (yoyo) */
  private _direction = 1;

  // Property records — pre-allocated at construction, zero allocations in update
  private readonly _props: PropRecord[];
  /** For Tween.to() — start values captured on first _update call */
  private readonly _captureStart: boolean;
  private _startCaptured = false;

  // Container (sequence / parallel)
  private readonly _children: Tween[] | null;
  private readonly _containerMode: ContainerMode;
  /** Index of the currently active child in a sequence */
  private _seqIndex = 0;

  // ---- Constructor (private — use static factories) ----------------------

  private constructor(
    target: object | null,
    props: Record<string, number> | null,
    config: TweenConfig,
    captureStart: boolean,
    children: Tween[] | null = null,
    containerMode: ContainerMode = ContainerMode.None
  ) {
    super();

    this._target = target;
    this._duration = config.duration;
    this._ease = config.ease ?? Ease.quadOut;
    this._delay = config.delay ?? 0;
    this._repeat = config.repeat ?? 0;
    this._yoyo = config.yoyo ?? false;
    this._onUpdate = config.onUpdate;
    this._onComplete = config.onComplete;
    this._captureStart = captureStart;
    this._children = children;
    this._containerMode = containerMode;

    // Pre-allocate property records
    if (props && target) {
      const keys = Object.keys(props);
      this._props = new Array(keys.length);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        this._props[i] = {
          key,
          start: captureStart ? 0 : (target as Record<string, number>)[key],
          end: props[key]
        };
      }
    } else {
      this._props = [];
    }
  }

  // ---- Static factory API ------------------------------------------------

  /**
   * Animate `target` properties TO the given values.
   * Start values are captured from `target` on the first update frame.
   */
  static to(
    target: object,
    props: Record<string, number>,
    config: TweenConfig
  ): Tween {
    const tween = new Tween(target, props, config, true);
    TweenManager.add(tween);
    return tween;
  }

  /**
   * Animate `target` properties FROM the given values to their current values.
   * End values are captured from `target` at construction time.
   */
  static from(
    target: object,
    props: Record<string, number>,
    config: TweenConfig
  ): Tween {
    const t = target as Record<string, number>;
    const keys = Object.keys(props);

    // Build end props from current target state before we overwrite
    const endProps: Record<string, number> = {};
    for (let i = 0; i < keys.length; i++) {
      endProps[keys[i]] = t[keys[i]];
    }

    // Set target to from-values so constructor reads them as start
    for (let i = 0; i < keys.length; i++) {
      t[keys[i]] = props[keys[i]];
    }

    const tween = new Tween(target, endProps, config, false);
    TweenManager.add(tween);
    return tween;
  }

  /**
   * Play `tweens` one after another.
   * Returns a wrapper Tween whose lifecycle represents the whole sequence.
   */
  static sequence(tweens: Tween[]): Tween {
    // Remove children from TweenManager — sequence container drives them
    for (let i = 0; i < tweens.length; i++) {
      TweenManager.remove(tweens[i]);
      tweens[i]._playing = false;
    }

    const totalDuration = tweens.reduce((sum, t) => sum + t._fullDuration(), 0);
    const seq = new Tween(
      null,
      null,
      { duration: totalDuration },
      false,
      tweens,
      ContainerMode.Sequence
    );

    // Activate first child
    if (tweens.length > 0) tweens[0]._playing = true;

    TweenManager.add(seq);
    return seq;
  }

  /**
   * Play all `tweens` simultaneously.
   * Completes when the longest child finishes.
   */
  static parallel(tweens: Tween[]): Tween {
    // Remove children from TweenManager — parallel container drives them
    for (let i = 0; i < tweens.length; i++) {
      TweenManager.remove(tweens[i]);
    }

    const maxDuration = tweens.reduce(
      (max, t) => Math.max(max, t._fullDuration()),
      0
    );
    const par = new Tween(
      null,
      null,
      { duration: maxDuration },
      false,
      tweens,
      ContainerMode.Parallel
    );

    TweenManager.add(par);
    return par;
  }

  /**
   * Returns a tween that simply waits for `ms` milliseconds then fires complete.
   */
  static delay(ms: number): Tween {
    const tween = new Tween(null, null, { duration: ms }, false);
    TweenManager.add(tween);
    return tween;
  }

  // ---- Instance control API ----------------------------------------------

  pause(): this {
    this._playing = false;
    this.emit('pause');
    return this;
  }

  resume(): this {
    this._playing = true;
    this.emit('resume');
    return this;
  }

  /**
   * Stop the tween immediately and remove it from TweenManager.
   * Does NOT fire the complete callback.
   */
  stop(): void {
    this._playing = false;
    this._isFinished = true;
    TweenManager.remove(this);
    this.emit('stop');
  }

  /**
   * Jump immediately to the final state and fire onComplete.
   */
  complete(): void {
    if (this._target) {
      this._applyProgress(1);
    }
    this._finish();
  }

  // ---- Introspection -----------------------------------------------------

  get isPlaying(): boolean {
    return this._playing && !this._isFinished;
  }

  /** Normalized linear progress [0, 1] of current forward pass. */
  get progress(): number {
    if (this._duration === 0) return 1;
    return Math.min(this._elapsed / this._duration, 1);
  }

  // ---- Internal update (called by TweenManager) --------------------------

  /**
   * Advance the tween by `dt` milliseconds.
   * Hot path — zero allocations inside.
   */
  _update(dt: number): void {
    if (!this._playing || this._isFinished) return;

    // Handle initial delay
    if (this._delayElapsed < this._delay) {
      this._delayElapsed += dt;
      if (this._delayElapsed < this._delay) return;
      dt = this._delayElapsed - this._delay;
    }

    // Dispatch to container mode
    if (this._containerMode === ContainerMode.Sequence) {
      this._updateSequence(dt);
      return;
    }
    if (this._containerMode === ContainerMode.Parallel) {
      this._updateParallel(dt);
      return;
    }

    // Normal tween
    this._elapsed += dt;

    // Lazy start value capture for Tween.to()
    if (this._captureStart && !this._startCaptured) {
      const t = this._target as Record<string, number>;
      for (let i = 0; i < this._props.length; i++) {
        this._props[i].start = t[this._props[i].key];
      }
      this._startCaptured = true;
    }

    if (this._elapsed >= this._duration) {
      this._elapsed = this._duration;
      // Apply final position
      this._applyProgress(this._direction === 1 ? 1 : 0);

      // Handle repeat / yoyo
      if (this._repeat === -1 || this._repeatCount < this._repeat) {
        this._repeatCount++;
        if (this._yoyo) {
          this._direction *= -1;
        }
        this._elapsed = 0;
      } else {
        this._finish();
      }
    } else {
      const raw = this._elapsed / this._duration;
      const directed = this._direction === 1 ? raw : 1 - raw;
      this._applyProgress(directed);
    }
  }

  // ---- Container update helpers ------------------------------------------

  private _updateSequence(dt: number): void {
    const children = this._children!;
    let remaining = dt;

    while (remaining > 0 && this._seqIndex < children.length) {
      const child = children[this._seqIndex];
      child._update(remaining);

      if (child._isFinished) {
        // Compute leftover time beyond child's completion
        const overflow = child._elapsed - child._duration;
        remaining = Math.max(0, overflow);
        this._seqIndex++;
        if (this._seqIndex < children.length) {
          children[this._seqIndex]._playing = true;
        }
      } else {
        remaining = 0;
      }
    }

    if (this._seqIndex >= children.length) {
      this._finish();
    }
  }

  private _updateParallel(dt: number): void {
    const children = this._children!;
    let allDone = true;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child._isFinished) {
        child._update(dt);
      }
      if (!child._isFinished) allDone = false;
    }

    if (allDone) {
      this._finish();
    }
  }

  // ---- Value application -------------------------------------------------

  /** Apply eased progress to all target properties. */
  private _applyProgress(rawProgress: number): void {
    const eased = this._ease(rawProgress);

    if (this._target) {
      const t = this._target as Record<string, number>;
      for (let i = 0; i < this._props.length; i++) {
        const prop = this._props[i];
        t[prop.key] = prop.start + (prop.end - prop.start) * eased;
      }
    }

    if (this._onUpdate) this._onUpdate(eased);
    this.emit('update', eased);
  }

  // ---- Completion --------------------------------------------------------

  private _finish(): void {
    this._isFinished = true;
    this._playing = false;
    if (this._onComplete) this._onComplete();
    this.emit('complete');
  }

  /**
   * Internal kill — stops tween without firing complete.
   * Also kills children recursively for containers.
   */
  _kill(): void {
    this._isFinished = true;
    this._playing = false;
    if (this._children) {
      for (let i = 0; i < this._children.length; i++) {
        this._children[i]._kill();
      }
    }
  }

  /** Total duration including delay (used by sequence to sum child durations). */
  _fullDuration(): number {
    return this._delay + this._duration;
  }
}
