import { EventEmitter } from 'eventemitter3';
import {
  AssetManager,
  AssetConfig,
  AssetType,
  LoadedAsset,
  AssetLoadingProgress,
  BatchLoadingProgress,
  AssetLoader,
  AssetCache,
  CacheConfig,
  AssetBundle,
  AssetLoadingState,
  AssetPriority,
  DeviceCapabilities,
  DevicePerformanceTier
} from '../contracts/AssetManager';

// Import loaders
import { TextureLoader } from './loaders/TextureLoader';
import { AudioLoader } from './loaders/AudioLoader';
import { JSONLoader } from './loaders/JSONLoader';

// Import cache implementations
import { LRUCache } from './cache/LRUCache';
import { PersistentCache } from './cache/PersistentCache';

// Import bundle support
import { GameByteAssetBundle } from './bundling/AssetBundle';
import { DeviceDetector } from '../performance/DeviceDetector';

/**
 * Asset manager configuration options.
 */
export interface AssetManagerConfig {
  /** Cache configuration */
  cache: CacheConfig;
  /** Maximum concurrent asset loads */
  maxConcurrentLoads?: number;
  /** Default timeout for asset loading */
  defaultTimeout?: number;
  /** Default retry attempts */
  defaultRetries?: number;
  /** Enable automatic memory optimization */
  autoMemoryOptimization?: boolean;
  /** Memory pressure threshold (0-1) */
  memoryPressureThreshold?: number;
  /** Device capabilities (auto-detected if not provided) */
  deviceCapabilities?: DeviceCapabilities;
}

/**
 * Loading queue entry.
 */
interface LoadingQueueEntry {
  config: AssetConfig;
  priority: AssetPriority;
  resolve: (asset: LoadedAsset) => void;
  reject: (error: Error) => void;
  retries: number;
  timeout?: NodeJS.Timeout;
  promise: Promise<LoadedAsset>;
}

/**
 * Batch loading context.
 */
interface BatchLoadingContext {
  id: string;
  totalAssets: number;
  loadedAssets: number;
  failedAssets: number;
  results: Map<string, LoadedAsset>;
  errors: Map<string, Error>;
  startTime: number;
}

/**
 * Main asset manager implementation for the GameByte framework.
 * Provides comprehensive asset loading, caching, and optimization for mobile games.
 *
 * @example Load a single texture
 * ```typescript
 * const assetManager = game.make('assets');
 * const texture = await assetManager.load({
 *   key: 'player',
 *   type: 'texture',
 *   src: 'assets/player.png'
 * });
 * ```
 *
 * @example Batch load with progress
 * ```typescript
 * assetManager.on('progress', (progress) => {
 *   console.log(`Loading: ${Math.round(progress * 100)}%`);
 * });
 *
 * const assets = await assetManager.loadBatch([
 *   { key: 'player', type: 'texture', src: 'assets/player.png' },
 *   { key: 'bgMusic', type: 'audio', src: 'assets/music.mp3' },
 *   { key: 'level1', type: 'json', src: 'assets/level1.json' }
 * ]);
 * ```
 *
 * @example Get cached asset
 * ```typescript
 * const texture = assetManager.get('player');
 * if (texture) {
 *   sprite.texture = texture.data;
 * }
 * ```
 */
export class GameByteAssetManager extends EventEmitter implements AssetManager {
  private config: AssetManagerConfig;
  private cache: AssetCache;
  private loaders = new Map<AssetType, AssetLoader>();
  private loadedAssets = new Map<string, LoadedAsset>();
  private loadingQueue: LoadingQueueEntry[] = [];
  private activeLoads = new Set<string>();
  private batchContext: BatchLoadingContext | null = null;
  private deviceCapabilities: DeviceCapabilities;
  private memoryUsage = { total: 0, cached: 0, active: 0 };
  private queueProcessorInterval: NodeJS.Timeout | null = null;
  
  constructor(config: AssetManagerConfig) {
    super();
    
    this.config = {
      maxConcurrentLoads: 6,
      defaultTimeout: 30000,
      defaultRetries: 3,
      autoMemoryOptimization: true,
      memoryPressureThreshold: 0.8,
      ...config
    };
    
    // Initialize cache
    this.cache = this.createCache(this.config.cache);
    
    // Setup memory pressure monitoring
    if (this.cache instanceof LRUCache || this.cache instanceof PersistentCache) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Cache interface doesn't define optional method
      (this.cache as any).setMemoryPressureCallback?.((usage: number, limit: number) => {
        this.emit('memory:pressure', usage, limit);
        if (this.config.autoMemoryOptimization) {
          this.optimizeMemory();
        }
      });
    }
    
    // Detect device capabilities
    this.deviceCapabilities = config.deviceCapabilities || this.detectDeviceCapabilities();
    
    // Register default loaders
    this.registerDefaultLoaders();
    
    // Start processing queue
    this.startQueueProcessor();
  }
  
  /**
   * Load a single asset.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic default allows flexible API
  async load<T = any>(config: AssetConfig): Promise<LoadedAsset<T>> {
    // Check if already loaded
    const existing = this.loadedAssets.get(config.id);
    if (existing) {
      this.emit('cache:hit', config.id);
      return existing as LoadedAsset<T>;
    }
    
    // Check cache
    const cached = await this.cache.get(config.id);
    if (cached) {
      this.loadedAssets.set(config.id, cached);
      this.emit('cache:hit', config.id);
      return cached as LoadedAsset<T>;
    }

    // Cache miss - emit event
    this.emit('cache:miss', config.id);

    // Check if already in queue
    const existingEntry = this.loadingQueue.find(e => e.config.id === config.id);
    if (existingEntry) {
      return existingEntry.promise as Promise<LoadedAsset<T>>;
    }

    // Add to loading queue
    // Create entry first without promise
    /* eslint-disable @typescript-eslint/no-explicit-any -- Promise constructor circular dependency pattern */
    const entry: LoadingQueueEntry = {
      config: this.optimizeAssetConfig(config),
      priority: config.options?.priority || AssetPriority.NORMAL,
      resolve: null as any,
      reject: null as any,
      retries: 0,
      promise: null as any,
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Now create the promise and set resolve/reject on entry
    const promise = new Promise<LoadedAsset<T>>((resolve, reject) => {
      entry.resolve = resolve as (asset: LoadedAsset) => void;
      entry.reject = reject as (error: Error) => void;
    });

    // Set the promise on the entry AFTER it's created
    entry.promise = promise as Promise<LoadedAsset>;

    this.loadingQueue.push(entry);
    this.sortLoadingQueue();
    this.processQueue();

    return promise;
  }
  
  /**
   * Load multiple assets in batch.
   */
  async loadBatch(configs: AssetConfig[]): Promise<Map<string, LoadedAsset>> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.batchContext = {
      id: batchId,
      totalAssets: configs.length,
      loadedAssets: 0,
      failedAssets: 0,
      results: new Map(),
      errors: new Map(),
      startTime: Date.now()
    };
    
    this.emit('batch:started', configs.length);
    
    try {
      // Load all assets
      const loadPromises = configs.map(async (config) => {
        try {
          const asset = await this.load(config);
          const ctx = this.batchContext; // Store local reference
          if (ctx) {
            ctx.results.set(config.id, asset);
            ctx.loadedAssets++;
          }
          this.updateBatchProgress();
          return { id: config.id, asset, error: null };
        } catch (error) {
          const ctx = this.batchContext; // Store local reference
          if (ctx) {
            ctx.errors.set(config.id, error as Error);
            ctx.failedAssets++;
          }
          this.updateBatchProgress();
          return { id: config.id, asset: null, error: error as Error };
        }
      });
      
      await Promise.allSettled(loadPromises);
      
      const results = this.batchContext.results;
      this.emit('batch:completed', results);
      
      return results;
      
    } finally {
      this.batchContext = null;
    }
  }
  
  /**
   * Load an asset bundle.
   */
  async loadBundle(bundle: AssetBundle): Promise<Map<string, LoadedAsset>> {
    this.emit('bundle:started', bundle.id);
    
    try {
      // Load bundle data if not already loaded
      if (bundle instanceof GameByteAssetBundle && !bundle.getBundleData()) {
        await this.loadBundleData(bundle);
      }
      
      // Load individual assets from bundle
      const results = new Map<string, LoadedAsset>();
      
      for (const assetConfig of bundle.assets) {
        try {
          let asset: LoadedAsset;
          
          // Try to extract from bundle first
          if (bundle instanceof GameByteAssetBundle) {
            const extractedData = bundle.extractAssetData(assetConfig.id);
            if (extractedData) {
              asset = await this.loadAssetFromData(assetConfig, extractedData);
            } else {
              asset = await this.load(assetConfig);
            }
          } else {
            asset = await this.load(assetConfig);
          }
          
          results.set(assetConfig.id, asset);
          
          // Store in bundle for quick access
          if (bundle instanceof GameByteAssetBundle) {
            bundle.setAsset(assetConfig.id, asset);
          }
          
        } catch (error) {
          console.warn(`Failed to load asset ${assetConfig.id} from bundle ${bundle.id}:`, error);
        }
      }
      
      this.emit('bundle:completed', bundle.id, results);
      return results;
      
    } catch (error) {
      this.emit('bundle:failed', bundle.id, error);
      throw error;
    }
  }
  
  /**
   * Get a loaded asset.
   */
  get<T = any>(assetId: string): LoadedAsset<T> | null {
    return this.loadedAssets.get(assetId) as LoadedAsset<T> || null;
  }
  
  /**
   * Check if asset is loaded.
   */
  has(assetId: string): boolean {
    return this.loadedAssets.has(assetId);
  }
  
  /**
   * Unload an asset.
   */
  unload(assetId: string): boolean {
    const asset = this.loadedAssets.get(assetId);
    if (!asset) return false;
    
    this.loadedAssets.delete(assetId);
    this.cache.delete(assetId);
    this.updateMemoryUsage();
    
    this.emit('asset:unloaded', assetId);
    return true;
  }
  
  /**
   * Unload multiple assets.
   */
  unloadBatch(assetIds: string[]): number {
    let unloaded = 0;
    for (const assetId of assetIds) {
      if (this.unload(assetId)) {
        unloaded++;
      }
    }
    return unloaded;
  }
  
  /**
   * Preload assets in background.
   */
  async preload(configs: AssetConfig[]): Promise<void> {
    const preloadConfigs = configs.map(config => ({
      ...config,
      options: {
        ...config.options,
        preload: true,
        priority: AssetPriority.LOW
      }
    }));
    
    // Load in background without waiting
    this.loadBatch(preloadConfigs).catch(error => {
      console.warn('Preload failed:', error);
    });
  }
  
  /**
   * Get loading progress for batch operations.
   */
  getBatchProgress(): BatchLoadingProgress | null {
    if (!this.batchContext) return null;
    
    const progress = this.batchContext.totalAssets > 0 
      ? (this.batchContext.loadedAssets + this.batchContext.failedAssets) / this.batchContext.totalAssets 
      : 0;
    
    return {
      totalAssets: this.batchContext.totalAssets,
      loadedAssets: this.batchContext.loadedAssets,
      failedAssets: this.batchContext.failedAssets,
      progress,
      assetProgress: new Map() // Would need to track individual progress
    };
  }
  
  /**
   * Get asset loading progress.
   */
  getProgress(assetId: string): AssetLoadingProgress | null {
    // Check active loaders for progress
    for (const loader of this.loaders.values()) {
      const progress = loader.getProgress?.(assetId);
      if (progress) return progress;
    }
    
    return null;
  }
  
  /**
   * Cancel asset loading.
   */
  cancel(assetId: string): void {
    // Remove from queue
    this.loadingQueue = this.loadingQueue.filter(entry => entry.config.id !== assetId);
    
    // Cancel active loading
    for (const loader of this.loaders.values()) {
      loader.cancel?.(assetId);
    }
    
    this.activeLoads.delete(assetId);
  }
  
  /**
   * Register a custom asset loader.
   */
  registerLoader(loader: AssetLoader): void {
    for (const type of loader.supportedTypes) {
      this.loaders.set(type, loader);
    }
  }
  
  /**
   * Get cache instance.
   */
  getCache(): AssetCache {
    return this.cache;
  }
  
  /**
   * Get current memory usage.
   */
  getMemoryUsage(): { total: number; cached: number; active: number } {
    return { ...this.memoryUsage };
  }
  
  /**
   * Set memory pressure callback for custom memory management.
   */
  setMemoryPressureCallback(callback: (usage: number, limit: number) => void): void {
    if (this.cache instanceof LRUCache || this.cache instanceof PersistentCache) {
      (this.cache as any).setMemoryPressureCallback?.(callback);
    }
  }
  
  /**
   * Optimize memory usage based on device constraints.
   */
  async optimizeMemory(): Promise<void> {
    const currentUsage = this.memoryUsage.total;
    const memoryLimit = this.getMemoryLimit();
    
    if (currentUsage > memoryLimit * this.config.memoryPressureThreshold!) {
      // Aggressive cache eviction
      await this.cache.evict(Math.floor(memoryLimit * 0.6));
      
      // Remove unused assets from memory
      const unusedAssets: string[] = [];
      for (const [assetId, asset] of this.loadedAssets) {
        // Simple heuristic: remove assets loaded more than 5 minutes ago
        if (Date.now() - asset.loadedAt > 5 * 60 * 1000) {
          unusedAssets.push(assetId);
        }
      }
      
      const freedBytes = this.unloadBatch(unusedAssets);
      this.emit('memory:optimized', freedBytes);
    }
  }
  
  /**
   * Destroy and cleanup all resources.
   */
  async destroy(): Promise<void> {
    // Stop queue processor
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = null;
    }

    // Cancel all pending loads - wrap rejections to prevent unhandled promise rejections
    const rejectionPromises = [];
    for (const entry of this.loadingQueue) {
      try {
        entry.reject(new Error('Asset manager destroyed'));
        rejectionPromises.push(entry.promise.catch(() => {})); // Catch and ignore the rejection
      } catch (error) {
        // Ignore synchronous errors during rejection
      }
      if (entry.timeout) {
        clearTimeout(entry.timeout);
      }
    }

    // Wait for all rejections to be processed
    await Promise.allSettled(rejectionPromises);

    this.loadingQueue = [];
    this.activeLoads.clear();
    
    // Destroy loaders
    for (const loader of this.loaders.values()) {
      loader.destroy?.();
    }
    
    // Destroy cache
    await this.cache.destroy();
    
    // Clear loaded assets
    this.loadedAssets.clear();
    
    // Reset memory usage tracking
    this.memoryUsage = { total: 0, cached: 0, active: 0 };
    
    this.removeAllListeners();
  }
  
  /**
   * Create cache instance based on configuration.
   */
  private createCache(config: CacheConfig): AssetCache {
    if (config.persistent) {
      return new PersistentCache(config);
    } else {
      return new LRUCache(config);
    }
  }
  
  /**
   * Register default asset loaders.
   */
  private registerDefaultLoaders(): void {
    this.registerLoader(new TextureLoader());
    this.registerLoader(new AudioLoader());
    this.registerLoader(new JSONLoader());
  }
  
  /**
   * Detect device capabilities using centralized DeviceDetector.
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const screenSize = DeviceDetector.getScreenSize();
    const nav = navigator as any;
    const connectionType = nav.connection?.effectiveType || '4g';

    // Use centralized DeviceDetector for hardware info
    const deviceMemory = DeviceDetector.getDeviceMemory();
    const cores = DeviceDetector.getCoreCount();

    // Map DeviceDetector tier to AssetManager's DevicePerformanceTier
    let performanceTier: DevicePerformanceTier = DevicePerformanceTier.MEDIUM;
    const tier = DeviceDetector.detectTierSync();

    if (tier === 'high') {
      // Check if it qualifies for PREMIUM
      if (deviceMemory >= 8 && cores >= 8) {
        performanceTier = DevicePerformanceTier.PREMIUM;
      } else {
        performanceTier = DevicePerformanceTier.HIGH;
      }
    } else if (tier === 'low') {
      performanceTier = DevicePerformanceTier.LOW;
    }

    return {
      performanceTier,
      availableMemory: deviceMemory * 1024, // Convert to MB
      gpuTier: 'unknown', // Would need WebGL detection
      supportedTextureFormats: this.detectTextureFormats(),
      supportedAudioFormats: this.detectAudioFormats(),
      connectionType: connectionType as any,
      screen: {
        width: screenSize.width,
        height: screenSize.height,
        pixelRatio: DeviceDetector.getPixelRatio()
      },
      platform: this.detectPlatform()
    };
  }
  
  /**
   * Detect supported texture formats.
   */
  private detectTextureFormats(): string[] {
    const formats: string[] = [];
    const canvas = document.createElement('canvas');
    
    // Check for WebP support
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      formats.push('webp');
    }
    
    // Check for AVIF support
    if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
      formats.push('avif');
    }
    
    formats.push('jpeg', 'png'); // Always supported
    
    return formats;
  }
  
  /**
   * Detect supported audio formats.
   */
  private detectAudioFormats(): string[] {
    const audio = document.createElement('audio');
    const formats: string[] = [];
    
    if (audio.canPlayType('audio/mpeg;')) formats.push('mp3');
    if (audio.canPlayType('audio/ogg; codecs="vorbis"')) formats.push('ogg');
    if (audio.canPlayType('audio/webm; codecs="vorbis"')) formats.push('webm');
    if (audio.canPlayType('audio/aac;')) formats.push('aac');
    
    return formats;
  }
  
  /**
   * Detect platform.
   */
  private detectPlatform(): 'ios' | 'android' | 'web' {
    const ua = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'web';
  }
  
  /**
   * Get memory limit based on device capabilities.
   */
  private getMemoryLimit(): number {
    const baseMB = this.deviceCapabilities.availableMemory;
    
    // Reserve memory for the browser and other processes
    switch (this.deviceCapabilities.performanceTier) {
      case DevicePerformanceTier.LOW:
        return baseMB * 0.3 * 1024 * 1024; // 30% of available memory
      case DevicePerformanceTier.MEDIUM:
        return baseMB * 0.5 * 1024 * 1024; // 50% of available memory
      case DevicePerformanceTier.HIGH:
        return baseMB * 0.7 * 1024 * 1024; // 70% of available memory
      case DevicePerformanceTier.PREMIUM:
        return baseMB * 0.8 * 1024 * 1024; // 80% of available memory
      default:
        return baseMB * 0.5 * 1024 * 1024;
    }
  }
  
  /**
   * Optimize asset configuration based on device capabilities.
   */
  private optimizeAssetConfig(config: AssetConfig): AssetConfig {
    const optimized = { ...config };
    
    // Adjust quality based on device tier
    if (!optimized.options?.quality || optimized.options.quality === 'auto') {
      switch (this.deviceCapabilities.performanceTier) {
        case DevicePerformanceTier.LOW:
          optimized.options = { ...optimized.options, quality: 'low' };
          break;
        case DevicePerformanceTier.HIGH:
        case DevicePerformanceTier.PREMIUM:
          optimized.options = { ...optimized.options, quality: 'high' };
          break;
        default:
          optimized.options = { ...optimized.options, quality: 'medium' };
      }
    }
    
    // Set default timeout and retries
    optimized.options = {
      timeout: this.config.defaultTimeout,
      maxRetries: this.config.defaultRetries,
      cache: true,
      ...optimized.options
    };
    
    return optimized;
  }
  
  /**
   * Sort loading queue by priority.
   */
  private sortLoadingQueue(): void {
    this.loadingQueue.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Start queue processor.
   */
  private startQueueProcessor(): void {
    this.queueProcessorInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Process every 100ms
  }
  
  /**
   * Process loading queue.
   */
  private async processQueue(): Promise<void> {
    while (
      this.loadingQueue.length > 0 && 
      this.activeLoads.size < this.config.maxConcurrentLoads!
    ) {
      const entry = this.loadingQueue.shift()!;
      this.activeLoads.add(entry.config.id);
      
      this.loadAssetEntry(entry);
    }
  }
  
  /**
   * Load individual asset entry.
   */
  private async loadAssetEntry(entry: LoadingQueueEntry): Promise<void> {
    const { config } = entry;
    
    try {
      this.emit('asset:loading', config.id, config);
      
      // Set timeout
      if (config.options?.timeout) {
        entry.timeout = setTimeout(() => {
          this.activeLoads.delete(config.id);
          entry.reject(new Error(`Asset loading timeout: ${config.id}`));
        }, config.options.timeout);
      }
      
      // Get appropriate loader
      const loader = this.loaders.get(config.type);
      if (!loader) {
        throw new Error(`No loader available for asset type: ${config.type}`);
      }
      
      // Load asset
      const data = await loader.load(config);
      
      // Create loaded asset
      const asset: LoadedAsset = {
        config,
        data,
        state: AssetLoadingState.LOADED,
        loadedAt: Date.now(),
        size: this.estimateAssetSize(data, config),
        progress: 1
      };
      
      // Store in memory and cache
      this.loadedAssets.set(config.id, asset);
      if (config.options?.cache !== false) {
        await this.cache.set(config.id, asset);
      }
      
      this.updateMemoryUsage();
      
      // Clear timeout
      if (entry.timeout) {
        clearTimeout(entry.timeout);
      }
      
      this.activeLoads.delete(config.id);
      this.emit('asset:loaded', asset);
      entry.resolve(asset);
      
    } catch (error) {
      this.activeLoads.delete(config.id);
      
      // Clear timeout
      if (entry.timeout) {
        clearTimeout(entry.timeout);
      }
      
      // Retry if configured
      if (entry.retries < (config.options?.maxRetries || this.config.defaultRetries!)) {
        entry.retries++;
        this.loadingQueue.unshift(entry); // Add back to front of queue
        this.processQueue();
        return;
      }
      
      this.emit('asset:failed', config.id, error);
      entry.reject(error as Error);
    }
  }
  
  /**
   * Load asset from bundle data.
   */
  private async loadAssetFromData(config: AssetConfig, data: ArrayBuffer): Promise<LoadedAsset> {
    // This would need to be implemented based on asset type
    // For now, create a basic loaded asset
    return {
      config,
      data,
      state: AssetLoadingState.LOADED,
      loadedAt: Date.now(),
      size: data.byteLength,
      progress: 1
    };
  }
  
  /**
   * Load bundle data from URL.
   */
  private async loadBundleData(bundle: GameByteAssetBundle): Promise<void> {
    // This would load the bundle manifest and data
    // Implementation depends on bundle storage format
    throw new Error('Bundle loading not implemented');
  }
  
  /**
   * Estimate asset size in bytes.
   */
  private estimateAssetSize(data: any, config: AssetConfig): number {
    if (typeof data === 'object' && data !== null) {
      if (data instanceof ArrayBuffer) {
        return data.byteLength;
      }
      if (data.size !== undefined) {
        return data.size;
      }
      if (data.buffer && data.buffer instanceof ArrayBuffer) {
        return data.buffer.byteLength;
      }
    }
    
    // Fallback estimate
    return config.size || 1024;
  }
  
  /**
   * Update memory usage statistics.
   */
  private updateMemoryUsage(): void {
    let total = 0;
    let active = 0;
    
    for (const asset of this.loadedAssets.values()) {
      const size = asset.size;
      total += size;
      active += size;
    }
    
    this.memoryUsage = {
      total,
      cached: 0, // Would need to query cache
      active
    };
  }
  
  /**
   * Update batch loading progress.
   */
  private updateBatchProgress(): void {
    if (!this.batchContext) return;
    
    const progress: BatchLoadingProgress = {
      totalAssets: this.batchContext.totalAssets,
      loadedAssets: this.batchContext.loadedAssets,
      failedAssets: this.batchContext.failedAssets,
      progress: (this.batchContext.loadedAssets + this.batchContext.failedAssets) / this.batchContext.totalAssets,
      assetProgress: new Map() // Individual progress would need more tracking
    };
    
    this.emit('batch:progress', progress);
  }
}