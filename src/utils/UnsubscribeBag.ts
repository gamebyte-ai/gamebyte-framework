export type Unsubscribe = () => void;

/**
 * Collects unsubscribe/cleanup functions and flushes them safely in LIFO order.
 *
 * @example
 * ```typescript
 * const subs = new UnsubscribeBag();
 * subs.add(emitter.on('event', handler));
 * subs.add(otherEmitter.on('change', otherHandler));
 *
 * // On cleanup — all listeners removed safely
 * subs.flush();
 * ```
 */
export class UnsubscribeBag {
  private _unsubs: Unsubscribe[] = [];

  /** Add an unsubscribe callback. Null/undefined inputs are ignored. Returns the callback. */
  add(unsub: Unsubscribe | null | undefined): Unsubscribe {
    if (!unsub || typeof unsub !== 'function') return () => {};
    this._unsubs.push(unsub);
    return unsub;
  }

  /** Flush all callbacks in LIFO order. Safe: each callback is try/catch'd. Idempotent. */
  flush(): void {
    const callbacks = this._unsubs;
    this._unsubs = []; // Clear before execution (idempotent)
    for (let i = callbacks.length - 1; i >= 0; i--) {
      try {
        callbacks[i]();
      } catch (e) {
        // Continue flushing remaining callbacks
      }
    }
  }

  /** Number of registered callbacks */
  get count(): number {
    return this._unsubs.length;
  }
}
