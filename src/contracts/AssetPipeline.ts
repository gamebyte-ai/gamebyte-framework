/**
 * Asset manifest defining scenes and their required assets.
 */
export interface AssetManifest {
  scenes: Record<string, string[]>;
  assets: Record<string, {
    url: string;
    type: 'texture' | 'model' | 'audio' | 'json' | 'binary';
    size?: number;
    priority?: 'critical' | 'high' | 'normal' | 'low';
    fallbacks?: Record<string, string>;
    cdn?: string;
  }>;
}

/**
 * Smart asset pipeline contract.
 */
export interface IAssetPipeline {
  /** Load all assets for a scene (respects priority ordering) */
  loadScene(sceneId: string): Promise<void>;
  /** Register a manifest */
  registerManifest(manifest: AssetManifest): void;
  /** Get overall loading progress (0-1) */
  getProgress(): number;
  /** Set memory budget in MB (LRU eviction when exceeded) */
  setMemoryBudget(budgetMB: number): void;
  /** Load critical assets first (blocks until done) */
  loadCritical(assetIds: string[]): Promise<void>;
  /** Preload assets in the background (non-blocking) */
  preloadInBackground(assetIds: string[]): void;
  /** Evict unused assets to free memory */
  unloadUnused(): void;
  /** Get a loaded asset by ID */
  get<T>(assetId: string): T | undefined;
  /** Dispose all loaded assets */
  dispose(): void;
}
