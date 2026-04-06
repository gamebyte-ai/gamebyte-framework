import { EventEmitter } from 'eventemitter3';

/**
 * Typed events emitted by GameConfigStore
 */
export interface GameConfigStoreEvents<T extends Record<string, any>> {
  'changed': (key: keyof T, newValue: any, oldValue: any) => void;
}

/**
 * GameConfigStore<T> — Reactive, typed configuration store for game settings.
 *
 * Stores a typed config object with get/set access, change events,
 * difficulty-based compound scaling, and reset-to-defaults capability.
 *
 * Named GameConfigStore (not GameConfig) to avoid conflict with the
 * existing GameConfig interface in src/types/index.ts.
 *
 * @example
 * ```typescript
 * const config = createGameConfig({
 *   speed: 100,
 *   spawnRate: 2,
 *   health: 3
 * });
 *
 * config.on('changed', (key, newVal) => console.log(key, newVal));
 * config.set('speed', 150);
 * config.applyDifficulty(2, { speed: 1.2, spawnRate: 1.5 });
 * config.reset();
 * ```
 */
export class GameConfigStore<T extends Record<string, any>> extends EventEmitter<GameConfigStoreEvents<T>> {
  private _current: T;
  private readonly _defaults: T;

  constructor(defaults: T) {
    super();
    // Deep copy via JSON for plain-object configs
    this._defaults = this._deepCopy(defaults);
    this._current = this._deepCopy(defaults);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Get the current value for a key.
   */
  get<K extends keyof T>(key: K): T[K] {
    return this._current[key];
  }

  /**
   * Set the value for a key. Emits 'changed' event.
   */
  set<K extends keyof T>(key: K, value: T[K]): void {
    const oldValue = this._current[key];
    this._current[key] = value;
    this.emit('changed', key, value, oldValue);
  }

  /**
   * Returns the entire current config as a readonly snapshot.
   */
  get values(): Readonly<T> {
    return this._current as Readonly<T>;
  }

  /**
   * Apply compound difficulty scaling.
   *
   * For each key in scaling, the final value is:
   *   defaults[key] * (scaling[key] ^ level)
   *
   * This allows exponential scaling relative to the base default value,
   * so difficulty always compounds from the same baseline.
   *
   * @param level - Difficulty level (e.g. 1, 2, 3)
   * @param scaling - Map of key to per-level multiplier
   */
  applyDifficulty(level: number, scaling: Partial<Record<keyof T, number>>): void {
    const keys = Object.keys(scaling) as Array<keyof T>;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const factor = scaling[key];
      if (factor === undefined) continue;
      const baseValue = this._defaults[key];
      if (typeof baseValue !== 'number') continue;
      const scaled = baseValue * Math.pow(factor, level);
      this.set(key, scaled as T[keyof T]);
    }
  }

  /**
   * Reset all values to the original defaults. Emits 'changed' for each key that differs.
   */
  reset(): void {
    const keys = Object.keys(this._defaults) as Array<keyof T>;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const defaultValue = this._defaults[key];
      if (this._current[key] !== defaultValue) {
        this.set(key, defaultValue);
      }
    }
  }

  // ============================================
  // PRIVATE
  // ============================================

  private _deepCopy(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

/**
 * Factory function to create a typed GameConfigStore.
 *
 * @example
 * ```typescript
 * const config = createGameConfig({ speed: 100, lives: 3 });
 * config.set('speed', 200);
 * ```
 */
export function createGameConfig<T extends Record<string, any>>(defaults: T): GameConfigStore<T> {
  return new GameConfigStore(defaults);
}
