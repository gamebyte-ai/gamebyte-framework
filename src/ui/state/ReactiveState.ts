/**
 * Reactive State Management for GameByte UI
 *
 * Provides automatic UI updates when state changes.
 * Inspired by Vue/Svelte reactivity.
 *
 * @example
 * ```typescript
 * import { createState } from 'gamebyte-framework';
 *
 * const state = createState({
 *   coins: 0,
 *   health: 100
 * });
 *
 * // UI automatically updates when state changes
 * state.coins += 50;
 *
 * // Listen to changes
 * state.on('coins', (newVal, oldVal) => {
 *   console.log(`Coins: ${oldVal} -> ${newVal}`);
 * });
 *
 * // Batch multiple updates (single notification)
 * state.batch((s) => {
 *   s.coins += 100;
 *   s.health -= 10;
 * });
 *
 * // Reset to initial values
 * state.reset();
 * ```
 */

/**
 * State change listener callback
 */
export type StateListener<T> = (newValue: T, oldValue: T, key: string) => void;

/**
 * Reactive state interface
 */
export interface ReactiveState<T extends object> {
  /** Get current state as plain object */
  readonly value: T;

  /** Subscribe to specific key changes */
  on<K extends keyof T>(key: K, listener: StateListener<T[K]>): () => void;

  /** Subscribe to any change */
  onChange(listener: (state: T) => void): () => void;

  /** Batch multiple updates (single notification at end) */
  batch(updater: (state: T) => void): void;

  /** Reset to initial values */
  reset(): void;
}

/**
 * Creates a reactive state object that triggers updates when properties change.
 *
 * @param initialState - Initial state values
 * @returns Reactive state proxy with subscription methods
 *
 * @example
 * ```typescript
 * // Create game state
 * const gameState = createState({
 *   score: 0,
 *   lives: 3,
 *   level: 1
 * });
 *
 * // Direct property access/modification
 * gameState.score += 100;
 * console.log(gameState.score); // 100
 *
 * // Subscribe to changes
 * const unsubscribe = gameState.on('score', (newScore, oldScore) => {
 *   updateScoreDisplay(newScore);
 * });
 *
 * // Later: unsubscribe
 * unsubscribe();
 * ```
 */
export function createState<T extends object>(initialState: T): T & ReactiveState<T> {
  const listeners = new Map<keyof T | '*', Set<StateListener<any>>>();
  const values = { ...initialState };
  let isBatching = false;
  let batchedChanges: Array<{ key: keyof T; oldValue: any; newValue: any }> = [];

  // Get listeners for a key
  const getListeners = (key: keyof T | '*'): Set<StateListener<any>> => {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    return listeners.get(key)!;
  };

  // Notify listeners of a change
  const notify = (key: keyof T, newValue: any, oldValue: any) => {
    // Notify specific key listeners
    getListeners(key).forEach(listener => {
      try {
        listener(newValue, oldValue, key as string);
      } catch (e) {
        console.error(`Error in state listener for '${String(key)}':`, e);
      }
    });

    // Notify wildcard listeners
    getListeners('*').forEach(listener => {
      try {
        listener(newValue, oldValue, key as string);
      } catch (e) {
        console.error('Error in state wildcard listener:', e);
      }
    });
  };

  // Process batched changes
  const processBatch = () => {
    const changes = batchedChanges;
    batchedChanges = [];
    isBatching = false;

    // Dedupe changes (keep last value for each key)
    const deduped = new Map<keyof T, { oldValue: any; newValue: any }>();
    for (const change of changes) {
      const existing = deduped.get(change.key);
      if (existing) {
        existing.newValue = change.newValue;
      } else {
        deduped.set(change.key, { oldValue: change.oldValue, newValue: change.newValue });
      }
    }

    // Notify
    deduped.forEach((change, key) => {
      if (change.oldValue !== change.newValue) {
        notify(key, change.newValue, change.oldValue);
      }
    });
  };

  // Create proxy to intercept property access/changes
  const proxy = new Proxy(values as T & ReactiveState<T>, {
    get(target, prop: string | symbol) {
      // Handle ReactiveState methods
      if (prop === 'value') {
        return { ...values };
      }

      if (prop === 'on') {
        return <K extends keyof T>(key: K, listener: StateListener<T[K]>) => {
          getListeners(key).add(listener);
          // Return unsubscribe function
          return () => {
            getListeners(key).delete(listener);
          };
        };
      }

      if (prop === 'onChange') {
        return (listener: (state: T) => void) => {
          const wrappedListener: StateListener<any> = () => {
            listener({ ...values } as T);
          };
          getListeners('*').add(wrappedListener);
          return () => {
            getListeners('*').delete(wrappedListener);
          };
        };
      }

      if (prop === 'batch') {
        return (updater: (state: T) => void) => {
          isBatching = true;
          try {
            updater(proxy as unknown as T);
          } finally {
            processBatch();
          }
        };
      }

      if (prop === 'reset') {
        return () => {
          const oldValues = { ...values };
          Object.assign(values, initialState);

          // Notify all changed keys
          for (const key of Object.keys(initialState) as Array<keyof T>) {
            if (oldValues[key] !== values[key]) {
              notify(key, values[key], oldValues[key]);
            }
          }
        };
      }

      // Return state value
      return values[prop as keyof T];
    },

    set(target, prop: string | symbol, newValue: any) {
      const key = prop as keyof T;
      const oldValue = values[key];

      // Skip if unchanged
      if (oldValue === newValue) {
        return true;
      }

      // Update value
      values[key] = newValue;

      // Handle batching
      if (isBatching) {
        batchedChanges.push({ key, oldValue, newValue });
      } else {
        notify(key, newValue, oldValue);
      }

      return true;
    },

    // Support 'key in state'
    has(target, prop) {
      return prop in values || ['value', 'on', 'onChange', 'batch', 'reset'].includes(prop as string);
    },

    // Support Object.keys(state)
    ownKeys() {
      return Reflect.ownKeys(values);
    },

    getOwnPropertyDescriptor(target, prop) {
      if (prop in values) {
        return {
          enumerable: true,
          configurable: true,
          value: values[prop as keyof T]
        };
      }
      return undefined;
    }
  });

  return proxy;
}

/**
 * Creates a computed value that auto-updates when dependencies change.
 *
 * @example
 * ```typescript
 * const state = createState({ base: 10, bonus: 5 });
 * const total = computed(() => state.base + state.bonus);
 *
 * console.log(total.value); // 15
 * state.bonus = 10;
 * console.log(total.value); // 20
 * ```
 */
export function computed<T>(getter: () => T): { readonly value: T } {
  return {
    get value() {
      return getter();
    }
  };
}

/**
 * Checks if a value is a reactive getter function.
 */
export function isReactive<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function';
}

/**
 * Resolves a potentially reactive value.
 */
export function resolveValue<T>(value: T | (() => T)): T {
  return isReactive(value) ? value() : value;
}
