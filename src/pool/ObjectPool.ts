/**
 * ObjectPool<T> — Generic object pool for any type.
 *
 * Reduces GC pressure by recycling objects instead of allocating new ones.
 * Ported from ObjectPool3D but fully generic with no Three.js dependency.
 *
 * @example
 * ```typescript
 * const pool = new ObjectPool({
 *   create: () => ({ x: 0, y: 0, active: false }),
 *   reset: (item) => { item.x = 0; item.y = 0; item.active = false; },
 *   initialSize: 20,
 *   maxSize: 100
 * });
 *
 * const bullet = pool.acquire();
 * // ... use bullet ...
 * pool.release(bullet);
 * ```
 */

/**
 * Configuration for ObjectPool
 */
export interface ObjectPoolConfig<T> {
  /** Factory function that creates a new item */
  create: () => T;
  /** Optional reset function called when an item is released back to the pool */
  reset?: (item: T) => void;
  /** Number of items to pre-allocate on construction (default: 10) */
  initialSize?: number;
  /** Maximum total items in the pool. 0 = unlimited (default: 100) */
  maxSize?: number;
}

/**
 * Generic object pool.
 * Uses two internal arrays: available (idle) and active (Set).
 */
export class ObjectPool<T> {
  private readonly _create: () => T;
  private readonly _reset: ((item: T) => void) | undefined;
  private readonly _maxSize: number;

  private _available: T[] = [];
  private _active: Set<T> = new Set();
  private _totalCreated: number = 0;

  constructor(config: ObjectPoolConfig<T>) {
    this._create = config.create;
    this._reset = config.reset;
    this._maxSize = config.maxSize ?? 100;

    const initialSize = config.initialSize ?? 10;
    this._warmup(initialSize);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Acquire an item from the pool.
   * Returns a pooled item if available, otherwise creates a new one.
   * Respects maxSize (0 = unlimited).
   */
  acquire(): T {
    let item: T;

    if (this._available.length > 0) {
      item = this._available.pop()!;
    } else if (this._maxSize === 0 || this._getTotalCount() < this._maxSize) {
      item = this._create();
      this._totalCreated++;
    } else {
      // Pool exhausted — reuse the oldest active item as an emergency fallback
      const oldest = this._active.values().next().value as T;
      if (oldest !== undefined) {
        this.release(oldest);
        item = this._available.pop()!;
      } else {
        // Absolute last resort (should not happen in practice)
        item = this._create();
        this._totalCreated++;
      }
    }

    this._active.add(item);
    return item;
  }

  /**
   * Release an item back to the pool.
   * Calls the reset callback if provided.
   */
  release(item: T): void {
    if (!this._active.has(item)) return;

    this._active.delete(item);

    if (this._reset) {
      this._reset(item);
    }

    this._available.push(item);
  }

  /**
   * Release all currently active items back to the pool.
   */
  releaseAll(): void {
    // Copy to array first to avoid modification during iteration
    const activeItems: T[] = [];
    this._active.forEach((item) => activeItems.push(item));

    for (let i = 0; i < activeItems.length; i++) {
      this.release(activeItems[i]);
    }
  }

  /**
   * Number of items currently in use.
   */
  get activeCount(): number {
    return this._active.size;
  }

  /**
   * Number of items currently idle in the pool.
   */
  get availableCount(): number {
    return this._available.length;
  }

  /**
   * Total number of items ever created by this pool.
   */
  get totalCreated(): number {
    return this._totalCreated;
  }

  /**
   * Clear all items from both pools. Does NOT call reset on active items.
   */
  destroy(): void {
    this._active.clear();
    this._available = [];
  }

  // ============================================
  // PRIVATE
  // ============================================

  private _warmup(count: number): void {
    const toCreate = this._maxSize === 0
      ? count
      : Math.min(count, this._maxSize - this._getTotalCount());

    for (let i = 0; i < toCreate; i++) {
      this._available.push(this._create());
      this._totalCreated++;
    }
  }

  private _getTotalCount(): number {
    return this._active.size + this._available.length;
  }
}
