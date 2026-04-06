import { EventEmitter } from 'eventemitter3';

export interface SaveConfig<T extends Record<string, any>> {
  /** Unique key for localStorage (default: 'gamebyte-save') */
  key?: string;
  /** Schema version for migrations */
  version: number;
  /** Default save data */
  defaults: T;
  /** Migration functions: { fromVersion: migrateFn } */
  migrations?: Record<number, (oldData: any) => any>;
  /**
   * Custom storage backend (for testing or custom persistence).
   * If not provided, uses localStorage with in-memory fallback.
   */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

export interface SaveSystemEvents {
  'saved': (data: any) => void;
  'loaded': (data: any) => void;
  'migrated': (fromVersion: number, toVersion: number) => void;
  'error': (error: Error) => void;
  'reset': () => void;
}

/** Serialized storage format */
interface StorageEnvelope {
  version: number;
  data: any;
}

/** Simple in-memory storage fallback for SSR/Node environments */
class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}

let warnedAboutFallback = false;

/**
 * Module-level singleton memory storage — shared across all SaveSystem instances,
 * exactly as localStorage is shared in a browser context.
 */
const globalMemoryStorage = new MemoryStorage();

/**
 * SaveSystem - Generic typed save/load system with versioned migrations.
 *
 * Supports localStorage with in-memory fallback for SSR/Node environments.
 * Uses a { version, data } envelope for schema versioning.
 *
 * @example
 * ```typescript
 * interface GameSave { score: number; level: number; }
 *
 * const save = new SaveSystem<GameSave>({
 *   key: 'my-game',
 *   version: 2,
 *   defaults: { score: 0, level: 1 },
 *   migrations: {
 *     1: (old) => ({ ...old, level: old.stage ?? 1 })
 *   }
 * });
 *
 * const data = save.load();
 * save.set('score', 100);
 * ```
 */
export class SaveSystem<T extends Record<string, any>> extends EventEmitter<SaveSystemEvents> {
  private key: string;
  private version: number;
  private defaults: T;
  private migrations: Record<number, (oldData: any) => any>;
  private data: T;
  private storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | MemoryStorage;

  constructor(config: SaveConfig<T>) {
    super();

    this.key = config.key ?? 'gamebyte-save';
    this.version = config.version;
    this.defaults = this.deepClone(config.defaults);
    this.migrations = config.migrations ?? {};

    // SSR/Node safety: check for localStorage availability
    if (config.storage) {
      // Explicit storage injection (e.g. for testing or custom backends)
      this.storage = config.storage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      if (!warnedAboutFallback) {
        console.warn('[SaveSystem] localStorage not available — using in-memory fallback.');
        warnedAboutFallback = true;
      }
      this.storage = globalMemoryStorage;
    }

    // Initialize data to defaults (load() must be called explicitly)
    this.data = this.deepClone(this.defaults);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Load save data from storage.
   * Runs migration chain if version mismatch is detected.
   * Falls back to defaults on parse errors.
   */
  load(): T {
    const raw = this.storage.getItem(this.key);

    if (raw === null) {
      this.data = this.deepClone(this.defaults);
      this.emit('loaded', this.deepClone(this.data));
      return this.deepClone(this.data);
    }

    let envelope: StorageEnvelope;
    try {
      envelope = JSON.parse(raw) as StorageEnvelope;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.emit('error', error);
      this.data = this.deepClone(this.defaults);
      this.emit('loaded', this.deepClone(this.data));
      return this.deepClone(this.data);
    }

    let loadedData = envelope.data;
    const storedVersion = envelope.version ?? 0;

    if (storedVersion < this.version) {
      // Run migration chain: storedVersion → storedVersion+1 → ... → this.version
      for (let v = storedVersion; v < this.version; v++) {
        if (this.migrations[v]) {
          try {
            loadedData = this.migrations[v](loadedData);
            this.emit('migrated', v, v + 1);
          } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
            this.data = this.deepClone(this.defaults);
            this.emit('loaded', this.deepClone(this.data));
            return this.deepClone(this.data);
          }
        }
      }
    } else if (storedVersion > this.version) {
      console.warn(
        `[SaveSystem] Stored version (${storedVersion}) is newer than current version (${this.version}). Using stored data as-is.`
      );
    }

    this.data = { ...this.deepClone(this.defaults), ...loadedData };
    this.emit('loaded', this.deepClone(this.data));
    return this.deepClone(this.data);
  }

  /**
   * Merge partial data into current save and persist to storage.
   */
  save(data: Partial<T>): void {
    this.data = { ...this.data, ...data };
    const envelope: StorageEnvelope = { version: this.version, data: this.data };
    this.storage.setItem(this.key, JSON.stringify(envelope));
    this.emit('saved', this.deepClone(this.data));
  }

  /**
   * Get a single field from current in-memory data.
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  /**
   * Set a single field and auto-save to storage.
   */
  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value;
    this.save({} as Partial<T>);
  }

  /**
   * Whether storage currently contains a save for this key.
   */
  get hasSave(): boolean {
    return this.storage.getItem(this.key) !== null;
  }

  /**
   * Delete the save from storage and reset in-memory data to defaults.
   */
  reset(): void {
    this.storage.removeItem(this.key);
    this.data = this.deepClone(this.defaults);
    this.emit('reset');
  }

  /**
   * Export current in-memory data as a JSON string (for debugging).
   */
  export(): string {
    return JSON.stringify(this.data);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private deepClone<V>(value: V): V {
    return JSON.parse(JSON.stringify(value)) as V;
  }
}
