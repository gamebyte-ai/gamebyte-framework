import { EventEmitter } from 'eventemitter3';

/**
 * Tick state passed to every subscriber each frame.
 * Single reused object - never recreated (zero GC pressure).
 */
export interface TickState {
  /** Delta time in seconds (R3F convention) */
  delta: number;
  /** Delta time in milliseconds (backwards compat) */
  deltaMs: number;
  /** Total elapsed time in seconds */
  elapsed: number;
  /** Frame count since start */
  frame: number;
  /** Smoothed FPS (EMA-based, O(1) per frame) */
  fps: number;
}

/**
 * Handle returned by subscribe() for controlling a subscription.
 */
export interface TickSubscriptionHandle {
  readonly id: number;
  readonly priority: number;
  active: boolean;
  pause(): void;
  resume(): void;
  unsubscribe(): void;
}

/**
 * Options for tick subscription.
 */
export interface TickSubscribeOptions {
  /** Fixed timestep in seconds (e.g., 1/60 for 60Hz physics).
   *  When set, callback runs at fixed intervals with accumulated delta. */
  fixedStep?: number;
}

/**
 * Core tick system contract.
 * Provides component-level render loop participation with priority ordering.
 */
export interface ITickSystem {
  subscribe(
    callback: (state: TickState) => void,
    priority?: number,
    options?: TickSubscribeOptions
  ): TickSubscriptionHandle;
  unsubscribe(handle: TickSubscriptionHandle): void;
  runOnce(callback: (state: TickState) => void): void;
  getState(): Readonly<TickState>;
  getSubscriberCount(): number;
  pause(): void;
  resume(): void;
  destroy(): void;
}
