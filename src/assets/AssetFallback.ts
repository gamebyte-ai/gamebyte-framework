/**
 * AssetFallback — Wraps asset loading with graceful fallback support.
 *
 * When an asset fails to load, instead of throwing, this class:
 *   1. Calls onFail callback (if configured)
 *   2. Emits a 'fallback' event
 *   3. Returns a type-appropriate placeholder value
 *   4. Tracks which asset IDs used fallbacks for inspection
 *
 * Integrates with the existing GameByteAssetManager but can also be used
 * standalone to wrap any async loader.
 *
 * @example
 * ```typescript
 * const fallback = new AssetFallback({
 *   onFail: (id, err) => console.warn(`[Asset] ${id} failed:`, err.message),
 * });
 *
 * const texture = await fallback.load(
 *   'hero-sprite',
 *   () => loader.load('assets/hero.png'),
 *   'texture'
 * );
 *
 * if (fallback.isFallback('hero-sprite')) {
 *   console.log('Using placeholder texture');
 * }
 * ```
 */

import { EventEmitter } from 'eventemitter3';

// ---- Placeholder factories -------------------------------------------------

/**
 * Default placeholder generators for each asset type.
 * These produce minimal non-null values that prevent downstream null checks
 * from throwing when an asset fails to load.
 */
const DEFAULT_GENERATORS = {
  texture: (): Record<string, unknown> => ({
    width: 1,
    height: 1,
    _isFallbackTexture: true,
  }),
  audio: (): Record<string, unknown> => ({
    duration: 0,
    _isFallbackAudio: true,
  }),
  json: (): Record<string, unknown> => ({}),
  other: (): null => null,
};

// ---- Types -----------------------------------------------------------------

export interface FallbackConfig {
  /**
   * Enable fallback placeholders for failed loads.
   * When false, errors are rethrown after calling onFail.
   * Default: true
   */
  enabled?: boolean;
  /** Called when an asset fails to load, before returning the placeholder. */
  onFail?: (id: string, error: Error) => void;
  /** Override default placeholder generators per asset type. */
  generators?: {
    texture?: () => any;
    audio?: () => any;
    json?: () => any;
    other?: () => any;
  };
}

export interface AssetFallbackStats {
  /** Assets successfully loaded without fallback */
  loaded: number;
  /** Assets that used a fallback placeholder */
  fallbacks: number;
  /** Total load attempts */
  total: number;
}

// ---- Events ----------------------------------------------------------------

export interface AssetFallbackEvents {
  /** Emitted when an asset falls back. Payload: (id, error) */
  fallback: [id: string, error: unknown];
}

// ---- AssetFallback ---------------------------------------------------------

export class AssetFallback extends EventEmitter<AssetFallbackEvents> {
  private readonly _config: Required<Omit<FallbackConfig, 'generators'>> & {
    generators: Required<typeof DEFAULT_GENERATORS>;
  };

  private readonly _fallbackIds = new Set<string>();

  private _stats: AssetFallbackStats = { loaded: 0, fallbacks: 0, total: 0 };

  constructor(config: FallbackConfig = {}) {
    super();

    this._config = {
      enabled: config.enabled ?? true,
      onFail: config.onFail ?? (() => { /* no-op */ }),
      generators: {
        texture: config.generators?.texture ?? DEFAULT_GENERATORS.texture,
        audio: config.generators?.audio ?? DEFAULT_GENERATORS.audio,
        json: config.generators?.json ?? DEFAULT_GENERATORS.json,
        other: config.generators?.other ?? DEFAULT_GENERATORS.other,
      },
    };
  }

  // ---- Core API ------------------------------------------------------------

  /**
   * Wrap an async loader with fallback support.
   *
   * If the loader succeeds, the result is returned as-is and stats.loaded is incremented.
   * If the loader throws and enabled=true, a placeholder is returned and stats.fallbacks is incremented.
   * If enabled=false, the error is rethrown after calling onFail.
   *
   * @param id     - Unique identifier for this asset (used for fallback tracking)
   * @param loader - Async function that performs the actual load
   * @param type   - Asset type hint for choosing the right placeholder
   */
  async load<T>(
    id: string,
    loader: () => Promise<T>,
    type: 'texture' | 'audio' | 'json' | 'other' = 'other'
  ): Promise<T> {
    try {
      const result = await loader();
      this._stats.loaded++;
      this._stats.total++;
      return result;
    } catch (rawError) {
      const error = rawError instanceof Error ? rawError : new Error(String(rawError));

      this._stats.fallbacks++;
      this._stats.total++;
      this._fallbackIds.add(id);

      // Notify
      this._config.onFail(id, error);
      this.emit('fallback', id, error);

      if (!this._config.enabled) {
        throw error;
      }

      return this._getPlaceholder(type) as T;
    }
  }

  // ---- Inspection ----------------------------------------------------------

  /**
   * Returns true if the given asset ID was resolved via a fallback placeholder.
   */
  isFallback(id: string): boolean {
    return this._fallbackIds.has(id);
  }

  /**
   * Returns all asset IDs that used fallback placeholders.
   */
  getFallbackIds(): string[] {
    return Array.from(this._fallbackIds);
  }

  /**
   * Cumulative load statistics.
   */
  get stats(): AssetFallbackStats {
    return { ...this._stats };
  }

  // ---- Lifecycle -----------------------------------------------------------

  /**
   * Reset all state (stats, fallback IDs, listeners).
   * Useful when reloading a level or resetting the game.
   */
  destroy(): void {
    this._fallbackIds.clear();
    this._stats = { loaded: 0, fallbacks: 0, total: 0 };
    this.removeAllListeners();
  }

  // ---- Private -------------------------------------------------------------

  private _getPlaceholder(type: string): unknown {
    switch (type) {
      case 'texture':
        return this._config.generators.texture();
      case 'audio':
        return this._config.generators.audio();
      case 'json':
        return this._config.generators.json();
      default:
        return this._config.generators.other();
    }
  }
}
