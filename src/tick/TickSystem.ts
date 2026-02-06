import { EventEmitter } from 'eventemitter3';
import {
  ITickSystem,
  TickState,
  TickSubscriptionHandle,
  TickSubscribeOptions
} from '../contracts/Tick.js';

/**
 * Internal subscriber entry.
 * Kept flat for cache-friendly iteration.
 */
interface TickSubscriber {
  id: number;
  callback: (state: TickState) => void;
  priority: number;
  active: boolean;
  /** Fixed timestep accumulator (seconds). Null = variable timestep. */
  fixedStep: number | null;
  fixedAccumulator: number;
  /** Marked for removal during iteration */
  removed: boolean;
}

/** Maximum delta clamp in seconds (prevents huge jumps on tab background) */
const MAX_DELTA_S = 0.1; // 100ms

/** EMA smoothing factor for FPS (lower = smoother) */
const FPS_ALPHA = 0.05;

/**
 * Component-Level Render Loop System.
 *
 * Allows per-component tick subscriptions with priority ordering,
 * inspired by R3F's useFrame hook.
 *
 * Performance characteristics:
 * - O(1) per-frame FPS tracking (EMA, not rolling array)
 * - Pre-allocated TickState object (zero GC pressure)
 * - for-loop iteration (15-30% faster than forEach in hot paths)
 * - Dirty-flag re-sorting (only on add/remove)
 * - Lazy removal during iteration (flag-based, no splice)
 * - Visibility API: auto-pause when document.hidden
 */
export class TickSystem extends EventEmitter implements ITickSystem {
  private subscribers: TickSubscriber[] = [];
  private onceQueue: Array<(state: TickState) => void> = [];
  private nextId = 1;
  private needsSort = false;
  private paused = false;
  private destroyed = false;
  private smoothFps = 60;
  private boundVisibilityHandler: (() => void) | null = null;

  /** Pre-allocated state object - mutated in-place each frame */
  private readonly state: TickState = {
    delta: 0,
    deltaMs: 0,
    elapsed: 0,
    frame: 0,
    fps: 60
  };

  constructor() {
    super();
    this.setupVisibilityAPI();
  }

  /**
   * Subscribe a callback to the tick loop.
   * Lower priority numbers run first (negative = early, positive = late).
   * Default priority is 0.
   */
  subscribe(
    callback: (state: TickState) => void,
    priority = 0,
    options?: TickSubscribeOptions
  ): TickSubscriptionHandle {
    const id = this.nextId++;
    const subscriber: TickSubscriber = {
      id,
      callback,
      priority,
      active: true,
      fixedStep: options?.fixedStep ?? null,
      fixedAccumulator: 0,
      removed: false
    };

    this.subscribers.push(subscriber);
    this.needsSort = true;

    const handle: TickSubscriptionHandle = {
      id,
      priority,
      active: true,
      pause: () => {
        subscriber.active = false;
        handle.active = false;
      },
      resume: () => {
        subscriber.active = true;
        handle.active = true;
      },
      unsubscribe: () => {
        this.unsubscribe(handle);
      }
    };

    return handle;
  }

  /**
   * Remove a subscription by handle.
   * Uses flag-based lazy removal to avoid splice during iteration.
   */
  unsubscribe(handle: TickSubscriptionHandle): void {
    const len = this.subscribers.length;
    for (let i = 0; i < len; i++) {
      if (this.subscribers[i].id === handle.id) {
        this.subscribers[i].removed = true;
        this.needsSort = true; // will compact on next sort
        break;
      }
    }
  }

  /**
   * Register a one-shot callback (runs once on next tick, then auto-removed).
   */
  runOnce(callback: (state: TickState) => void): void {
    this.onceQueue.push(callback);
  }

  /**
   * Get current tick state (readonly snapshot).
   */
  getState(): Readonly<TickState> {
    return this.state;
  }

  /**
   * Get count of active subscribers.
   */
  getSubscriberCount(): number {
    let count = 0;
    const len = this.subscribers.length;
    for (let i = 0; i < len; i++) {
      if (!this.subscribers[i].removed) count++;
    }
    return count;
  }

  /**
   * Pause the tick system (subscribers won't receive ticks).
   */
  pause(): void {
    this.paused = true;
    this.emit('paused');
  }

  /**
   * Resume the tick system.
   */
  resume(): void {
    this.paused = false;
    this.emit('resumed');
  }

  /**
   * Called by the renderer's tick event each frame.
   * This is the hot path - zero allocations, for-loop iteration.
   * @param deltaMs - Delta time in milliseconds from renderer
   */
  tick(deltaMs: number): void {
    if (this.paused || this.destroyed) return;

    // Clamp delta to prevent huge jumps (tab backgrounding)
    const clampedMs = Math.min(deltaMs, MAX_DELTA_S * 1000);
    const deltaS = clampedMs / 1000;

    // Update state object in-place (zero allocation)
    this.state.deltaMs = clampedMs;
    this.state.delta = deltaS;
    this.state.elapsed += deltaS;
    this.state.frame++;

    // EMA FPS calculation - O(1), zero allocations (Babylon.js pattern)
    if (clampedMs > 0) {
      const instantFps = 1000 / clampedMs;
      this.smoothFps += FPS_ALPHA * (instantFps - this.smoothFps);
      this.state.fps = Math.round(this.smoothFps);
    }

    // Sort if dirty (only happens on add/remove, not every frame)
    if (this.needsSort) {
      this.compactAndSort();
    }

    // Iterate subscribers - for-loop, NOT forEach (Phaser 3 pattern)
    const subs = this.subscribers;
    const len = subs.length;
    for (let i = 0; i < len; i++) {
      const sub = subs[i];
      if (!sub.active || sub.removed) continue;

      if (sub.fixedStep !== null) {
        // Fixed timestep accumulator (Gaffer pattern)
        sub.fixedAccumulator += deltaS;
        while (sub.fixedAccumulator >= sub.fixedStep) {
          sub.fixedAccumulator -= sub.fixedStep;
          // Temporarily set delta to fixed step for the callback
          const originalDelta = this.state.delta;
          const originalDeltaMs = this.state.deltaMs;
          this.state.delta = sub.fixedStep;
          this.state.deltaMs = sub.fixedStep * 1000;
          sub.callback(this.state);
          this.state.delta = originalDelta;
          this.state.deltaMs = originalDeltaMs;
        }
      } else {
        sub.callback(this.state);
      }
    }

    // Drain once queue after main loop
    if (this.onceQueue.length > 0) {
      const queue = this.onceQueue;
      this.onceQueue = [];
      for (let i = 0; i < queue.length; i++) {
        queue[i](this.state);
      }
    }

    this.emit('tick', this.state);
  }

  /**
   * Compact removed entries and re-sort by priority.
   * Only called when needsSort is true (add/remove occurred).
   */
  private compactAndSort(): void {
    // Filter out removed subscribers
    let writeIdx = 0;
    for (let i = 0; i < this.subscribers.length; i++) {
      if (!this.subscribers[i].removed) {
        this.subscribers[writeIdx++] = this.subscribers[i];
      }
    }
    this.subscribers.length = writeIdx;

    // Sort by priority (lower runs first)
    this.subscribers.sort((a, b) => a.priority - b.priority);
    this.needsSort = false;
  }

  /**
   * Setup Visibility API to auto-pause when tab is hidden.
   */
  private setupVisibilityAPI(): void {
    if (typeof document === 'undefined') return;

    this.boundVisibilityHandler = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };

    document.addEventListener('visibilitychange', this.boundVisibilityHandler);
  }

  /**
   * Destroy the tick system and clean up all resources.
   */
  destroy(): void {
    this.destroyed = true;
    this.subscribers.length = 0;
    this.onceQueue.length = 0;

    if (this.boundVisibilityHandler) {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
      this.boundVisibilityHandler = null;
    }

    this.removeAllListeners();
  }
}
