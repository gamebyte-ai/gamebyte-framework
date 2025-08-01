import { EventEmitter } from 'eventemitter3';

/**
 * Supported asset types for the GameByte framework.
 */
export enum AssetType {
  TEXTURE = 'texture',
  AUDIO = 'audio',
  MODEL_3D = 'model_3d',
  SPRITE = 'sprite',
  JSON = 'json',
  FONT = 'font',
  VIDEO = 'video',
  BINARY = 'binary'
}

/**
 * Asset loading states.
 */
export enum AssetLoadingState {
  PENDING = 'pending',
  LOADING = 'loading',
  LOADED = 'loaded',
  FAILED = 'failed',
  CACHED = 'cached'
}

/**
 * Asset loading priority levels.
 */
export enum AssetPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Device performance tiers for asset optimization.
 */
export enum DevicePerformanceTier {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  PREMIUM = 'premium'
}

/**
 * Configuration options for asset loading.
 */
export interface AssetLoadOptions {
  /** Priority level for loading order */
  priority?: AssetPriority;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Cache the asset after loading */
  cache?: boolean;
  /** Preload asset without blocking */
  preload?: boolean;
  /** Device-specific quality settings */
  quality?: 'low' | 'medium' | 'high' | 'auto';
  /** Custom headers for HTTP requests */
  headers?: Record<string, string>;
  /** Cross-origin settings */
  crossOrigin?: string;
  /** Progressive loading for large assets */
  progressive?: boolean;
}

/**
 * Asset metadata and configuration.
 */
export interface AssetConfig {
  /** Unique identifier for the asset */
  id: string;
  /** Asset type */
  type: AssetType;
  /** Source URL or path */
  src: string;
  /** Alternative sources for different quality levels */
  sources?: {
    low?: string;
    medium?: string;
    high?: string;
  };
  /** File size in bytes (if known) */
  size?: number;
  /** MIME type */
  mimeType?: string;
  /** Asset dependencies */
  dependencies?: string[];
  /** Loading options */
  options?: AssetLoadOptions;
}

/**
 * Loaded asset with metadata.
 */
export interface LoadedAsset<T = any> {
  /** Asset configuration */
  config: AssetConfig;
  /** Loaded asset data */
  data: T;
  /** Loading state */
  state: AssetLoadingState;
  /** Load timestamp */
  loadedAt: number;
  /** File size in bytes */
  size: number;
  /** Error information if loading failed */
  error?: Error;
  /** Loading progress (0-1) */
  progress: number;
}

/**
 * Asset loading progress information.
 */
export interface AssetLoadingProgress {
  /** Asset ID */
  assetId: string;
  /** Loading progress (0-1) */
  progress: number;
  /** Bytes loaded */
  loaded: number;
  /** Total bytes */
  total: number;
  /** Current loading state */
  state: AssetLoadingState;
}

/**
 * Batch loading progress information.
 */
export interface BatchLoadingProgress {
  /** Total number of assets */
  totalAssets: number;
  /** Number of loaded assets */
  loadedAssets: number;
  /** Number of failed assets */
  failedAssets: number;
  /** Overall progress (0-1) */
  progress: number;
  /** Currently loading asset */
  currentAsset?: string;
  /** Individual asset progress */
  assetProgress: Map<string, AssetLoadingProgress>;
}

/**
 * Cache eviction strategies.
 */
export enum CacheEvictionStrategy {
  LRU = 'lru',         // Least Recently Used
  LFU = 'lfu',         // Least Frequently Used
  FIFO = 'fifo',       // First In, First Out
  SIZE_BASED = 'size'  // Evict largest assets first
}

/**
 * Cache configuration options.
 */
export interface CacheConfig {
  /** Maximum cache size in bytes */
  maxSize: number;
  /** Maximum number of cached assets */
  maxItems?: number;
  /** Cache eviction strategy */
  evictionStrategy: CacheEvictionStrategy;
  /** TTL for cached items in milliseconds */
  ttl?: number;
  /** Enable persistent cache using IndexedDB */
  persistent?: boolean;
  /** Cache version for invalidation */
  version?: string;
}

/**
 * Asset bundle configuration.
 */
export interface AssetBundle {
  /** Bundle identifier */
  id: string;
  /** Bundle name */
  name: string;
  /** Assets included in bundle */
  assets: AssetConfig[];
  /** Bundle metadata */
  metadata?: {
    version: string;
    description?: string;
    tags?: string[];
  };
  /** Bundle dependencies */
  dependencies?: string[];
  /** Loading options for the entire bundle */
  options?: AssetLoadOptions;
}

/**
 * Core asset loader interface for different asset types.
 */
export interface AssetLoader<T = any> {
  /** Asset types this loader supports */
  readonly supportedTypes: AssetType[];
  
  /** Load a single asset */
  load(config: AssetConfig): Promise<T>;
  
  /** Check if this loader can handle the asset type */
  canLoad(type: AssetType): boolean;
  
  /** Get loading progress for an asset */
  getProgress?(assetId: string): AssetLoadingProgress | null;
  
  /** Cancel asset loading */
  cancel?(assetId: string): void;
  
  /** Destroy and cleanup resources */
  destroy?(): void;
}

/**
 * Asset cache interface for storing and retrieving assets.
 */
export interface AssetCache {
  /** Cache configuration */
  readonly config: CacheConfig;
  
  /** Store an asset in cache */
  set(key: string, asset: LoadedAsset): Promise<void>;
  
  /** Retrieve an asset from cache */
  get(key: string): Promise<LoadedAsset | null>;
  
  /** Check if asset exists in cache */
  has(key: string): Promise<boolean>;
  
  /** Remove asset from cache */
  delete(key: string): Promise<boolean>;
  
  /** Clear all cached assets */
  clear(): Promise<void>;
  
  /** Get cache statistics */
  getStats(): Promise<{
    size: number;
    itemCount: number;
    hitRate: number;
    missRate: number;
  }>;
  
  /** Evict assets based on cache policy */
  evict(targetSize?: number): Promise<void>;
  
  /** Destroy cache and cleanup */
  destroy(): Promise<void>;
}

/**
 * Main asset manager interface.
 */
export interface AssetManager extends EventEmitter {
  /** Load a single asset */
  load<T = any>(config: AssetConfig): Promise<LoadedAsset<T>>;
  
  /** Load multiple assets */
  loadBatch(configs: AssetConfig[]): Promise<Map<string, LoadedAsset>>;
  
  /** Load an asset bundle */
  loadBundle(bundle: AssetBundle): Promise<Map<string, LoadedAsset>>;
  
  /** Get a loaded asset */
  get<T = any>(assetId: string): LoadedAsset<T> | null;
  
  /** Check if asset is loaded */
  has(assetId: string): boolean;
  
  /** Unload an asset */
  unload(assetId: string): boolean;
  
  /** Unload multiple assets */
  unloadBatch(assetIds: string[]): number;
  
  /** Preload assets in background */
  preload(configs: AssetConfig[]): Promise<void>;
  
  /** Get loading progress for batch operations */
  getBatchProgress(): BatchLoadingProgress | null;
  
  /** Get asset loading progress */
  getProgress(assetId: string): AssetLoadingProgress | null;
  
  /** Cancel asset loading */
  cancel(assetId: string): void;
  
  /** Register a custom asset loader */
  registerLoader(loader: AssetLoader): void;
  
  /** Get cache instance */
  getCache(): AssetCache;
  
  /** Get current memory usage */
  getMemoryUsage(): {
    total: number;
    cached: number;
    active: number;
  };
  
  /** Optimize memory usage based on device constraints */
  optimizeMemory(): Promise<void>;
  
  /** Destroy and cleanup all resources */
  destroy(): Promise<void>;
}

/**
 * Asset manager events.
 */
export interface AssetManagerEvents {
  /** Asset loading started */
  'asset:loading': (assetId: string, config: AssetConfig) => void;
  
  /** Asset loading progress updated */
  'asset:progress': (progress: AssetLoadingProgress) => void;
  
  /** Asset loaded successfully */
  'asset:loaded': (asset: LoadedAsset) => void;
  
  /** Asset loading failed */
  'asset:failed': (assetId: string, error: Error) => void;
  
  /** Asset unloaded */
  'asset:unloaded': (assetId: string) => void;
  
  /** Batch loading started */
  'batch:started': (totalAssets: number) => void;
  
  /** Batch loading progress */
  'batch:progress': (progress: BatchLoadingProgress) => void;
  
  /** Batch loading completed */
  'batch:completed': (results: Map<string, LoadedAsset>) => void;
  
  /** Bundle loading started */
  'bundle:started': (bundleId: string) => void;
  
  /** Bundle loading completed */
  'bundle:completed': (bundleId: string, results: Map<string, LoadedAsset>) => void;
  
  /** Cache hit */
  'cache:hit': (assetId: string) => void;
  
  /** Cache miss */
  'cache:miss': (assetId: string) => void;
  
  /** Cache eviction occurred */
  'cache:evicted': (assetIds: string[], reason: string) => void;
  
  /** Memory pressure detected */
  'memory:pressure': (usage: number, limit: number) => void;
  
  /** Memory optimization completed */
  'memory:optimized': (freedBytes: number) => void;
}

/**
 * Device capability detection for asset optimization.
 */
export interface DeviceCapabilities {
  /** Performance tier */
  performanceTier: DevicePerformanceTier;
  
  /** Available memory in MB */
  availableMemory: number;
  
  /** GPU tier information */
  gpuTier: string;
  
  /** Supported texture formats */
  supportedTextureFormats: string[];
  
  /** Supported audio formats */
  supportedAudioFormats: string[];
  
  /** Network connection type */
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi';
  
  /** Screen dimensions */
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  
  /** Platform information */
  platform: 'ios' | 'android' | 'web';
}