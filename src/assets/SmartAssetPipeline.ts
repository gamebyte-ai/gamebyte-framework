import { EventEmitter } from 'eventemitter3';
import { IAssetPipeline, AssetManifest } from '../contracts/AssetPipeline.js';

/** Priority weights for load ordering */
const PRIORITY_WEIGHTS: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3
};

/**
 * Loaded asset entry with access tracking for LRU eviction.
 */
interface LoadedEntry {
  data: unknown;
  size: number;
  lastAccess: number;
  accessCount: number;
  assetId: string;
}

/**
 * Smart Asset Pipeline with priority-ordered loading, memory budgeting, and LRU eviction.
 *
 * Features:
 * - Priority queue: critical assets load first
 * - Adaptive concurrency (based on device/network capabilities)
 * - Memory budgeting with LRU eviction (frequency-boosted)
 * - Format fallback: WebP → PNG, KTX2 → standard
 * - Abort controller: cancel pending loads on scene switch
 * - Progress events per-asset and overall
 * - Error resilience: continues loading even if one asset fails
 */
export class SmartAssetPipeline extends EventEmitter implements IAssetPipeline {
  private manifest: AssetManifest | null = null;
  private loaded: Map<string, LoadedEntry> = new Map();
  private loading: Map<string, Promise<unknown>> = new Map();
  private memoryBudgetBytes = 256 * 1024 * 1024; // 256MB default
  private totalLoadedBytes = 0;
  private abortController: AbortController | null = null;
  private concurrency: number;

  // Progress tracking
  private totalToLoad = 0;
  private totalLoaded = 0;

  constructor() {
    super();
    // Adaptive concurrency based on hardware
    const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 4) : 4;
    this.concurrency = Math.min(Math.max(Math.floor(cores / 2), 2), 8);
  }

  /**
   * Register an asset manifest.
   */
  registerManifest(manifest: AssetManifest): void {
    this.manifest = manifest;
  }

  /**
   * Load all assets required by a scene.
   * Respects priority ordering (critical first, then high, normal, low).
   */
  async loadScene(sceneId: string): Promise<void> {
    if (!this.manifest) {
      throw new Error('SmartAssetPipeline: no manifest registered');
    }

    const assetIds = this.manifest.scenes[sceneId];
    if (!assetIds) {
      throw new Error(`SmartAssetPipeline: unknown scene '${sceneId}'`);
    }

    // Cancel any pending loads from previous scene
    this.abortController?.abort();
    this.abortController = new AbortController();

    // Sort by priority
    const sorted = [...assetIds].sort((a, b) => {
      const pa = this.manifest!.assets[a]?.priority ?? 'normal';
      const pb = this.manifest!.assets[b]?.priority ?? 'normal';
      return (PRIORITY_WEIGHTS[pa] ?? 2) - (PRIORITY_WEIGHTS[pb] ?? 2);
    });

    this.totalToLoad = sorted.length;
    this.totalLoaded = 0;

    // Load in batches respecting concurrency limit
    for (let i = 0; i < sorted.length; i += this.concurrency) {
      if (this.abortController.signal.aborted) break;

      const batch = sorted.slice(i, i + this.concurrency);
      const promises = batch.map(id => this.loadAsset(id));

      await Promise.allSettled(promises);
    }

    this.emit('scene:loaded', sceneId);
  }

  /**
   * Get overall loading progress (0-1).
   */
  getProgress(): number {
    if (this.totalToLoad === 0) return 1;
    return this.totalLoaded / this.totalToLoad;
  }

  /**
   * Set memory budget in MB.
   */
  setMemoryBudget(budgetMB: number): void {
    this.memoryBudgetBytes = budgetMB * 1024 * 1024;
    this.evictIfOverBudget();
  }

  /**
   * Load critical assets (blocks until all loaded).
   */
  async loadCritical(assetIds: string[]): Promise<void> {
    this.totalToLoad = assetIds.length;
    this.totalLoaded = 0;
    await Promise.all(assetIds.map(id => this.loadAsset(id)));
  }

  /**
   * Preload assets in the background (non-blocking).
   */
  preloadInBackground(assetIds: string[]): void {
    // Fire and forget - load in batches
    (async () => {
      for (let i = 0; i < assetIds.length; i += this.concurrency) {
        const batch = assetIds.slice(i, i + this.concurrency);
        await Promise.allSettled(batch.map(id => this.loadAsset(id)));
      }
    })();
  }

  /**
   * Evict unused/least-recently-used assets to free memory.
   */
  unloadUnused(): void {
    this.evictIfOverBudget();
  }

  /**
   * Get a loaded asset by ID.
   */
  get<T>(assetId: string): T | undefined {
    const entry = this.loaded.get(assetId);
    if (!entry) return undefined;

    // Update access tracking
    entry.lastAccess = performance.now();
    entry.accessCount++;

    return entry.data as T;
  }

  /**
   * Dispose all loaded assets and clear state.
   */
  dispose(): void {
    this.abortController?.abort();
    this.abortController = null;

    for (const entry of this.loaded.values()) {
      this.disposeAssetData(entry.data);
    }
    this.loaded.clear();
    this.loading.clear();
    this.totalLoadedBytes = 0;
    this.totalToLoad = 0;
    this.totalLoaded = 0;
    this.manifest = null;
    this.removeAllListeners();
  }

  // ─── Private Methods ───────────────────────────

  private async loadAsset(assetId: string): Promise<unknown> {
    // Already loaded
    if (this.loaded.has(assetId)) {
      this.totalLoaded++;
      this.emitProgress(assetId);
      return this.loaded.get(assetId)!.data;
    }

    // Already loading (dedup)
    if (this.loading.has(assetId)) {
      return this.loading.get(assetId);
    }

    const assetDef = this.manifest?.assets[assetId];
    if (!assetDef) {
      console.warn(`SmartAssetPipeline: asset '${assetId}' not found in manifest`);
      this.totalLoaded++;
      this.emitProgress(assetId);
      return undefined;
    }

    const promise = this.fetchAsset(assetId, assetDef);
    this.loading.set(assetId, promise);

    try {
      const data = await promise;
      const size = assetDef.size ?? this.estimateSize(data);

      this.loaded.set(assetId, {
        data,
        size,
        lastAccess: performance.now(),
        accessCount: 0,
        assetId
      });

      this.totalLoadedBytes += size;
      this.totalLoaded++;
      this.emitProgress(assetId);
      this.emit('asset:loaded', assetId, data);

      // Check memory budget
      this.evictIfOverBudget();

      return data;
    } catch (error) {
      this.totalLoaded++;
      this.emitProgress(assetId);
      this.emit('asset:failed', assetId, error);
      console.warn(`SmartAssetPipeline: failed to load '${assetId}':`, error);
      return undefined;
    } finally {
      this.loading.delete(assetId);
    }
  }

  private async fetchAsset(
    assetId: string,
    def: AssetManifest['assets'][string]
  ): Promise<unknown> {
    const url = def.cdn ? `${def.cdn}/${def.url}` : def.url;
    const signal = this.abortController?.signal;

    switch (def.type) {
      case 'json':
        return (await fetch(url, { signal })).json();

      case 'binary':
        return (await fetch(url, { signal })).arrayBuffer();

      case 'audio': {
        const response = await fetch(url, { signal });
        return response.arrayBuffer();
      }

      case 'texture': {
        // Try WebP fallback if available
        const fallbackUrl = def.fallbacks?.webp;
        const textureUrl = fallbackUrl ?? url;
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => {
            if (fallbackUrl && textureUrl !== url) {
              // Fallback to original URL
              img.src = url;
            } else {
              reject(new Error(`Failed to load texture: ${textureUrl}`));
            }
          };
          img.src = textureUrl;
        });
      }

      case 'model': {
        // Return the URL for model loaders to handle
        return { url, type: 'model-reference' };
      }

      default:
        return (await fetch(url, { signal })).blob();
    }
  }

  private evictIfOverBudget(): void {
    if (this.totalLoadedBytes <= this.memoryBudgetBytes) return;

    // LRU with frequency boost: score = lastAccessTime + (accessCount * 1000)
    // Lower score = older & less frequently used = evict first
    const entries = Array.from(this.loaded.entries())
      .map(([id, entry]) => ({
        id,
        entry,
        score: entry.lastAccess + entry.accessCount * 1000
      }))
      .sort((a, b) => a.score - b.score);

    // Evict until under budget
    for (const { id, entry } of entries) {
      if (this.totalLoadedBytes <= this.memoryBudgetBytes * 0.8) break; // 80% target
      this.disposeAssetData(entry.data);
      this.totalLoadedBytes -= entry.size;
      this.loaded.delete(id);
      this.emit('asset:evicted', id);
    }
  }

  private disposeAssetData(data: unknown): void {
    if (!data) return;
    const d = data as any;
    if (typeof d.dispose === 'function') d.dispose();
    else if (typeof d.destroy === 'function') d.destroy();
  }

  private estimateSize(data: unknown): number {
    if (data instanceof ArrayBuffer) return data.byteLength;
    if (data instanceof Blob) return data.size;
    if (data instanceof HTMLImageElement) return (data.width * data.height * 4); // RGBA
    return 1024; // Default 1KB estimate
  }

  private emitProgress(assetId: string): void {
    const progress = this.getProgress();
    this.emit('progress', progress, assetId);
  }
}
