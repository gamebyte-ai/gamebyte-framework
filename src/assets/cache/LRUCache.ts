import { AssetCache, CacheConfig, LoadedAsset, CacheEvictionStrategy } from '../../contracts/AssetManager';
import { Logger } from '../../utils/Logger.js';

/**
 * Cache entry with LRU tracking.
 */
interface CacheEntry {
  asset: LoadedAsset;
  accessTime: number;
  accessCount: number;
  createdAt: number;
  size: number;
  ttl?: number;
}

/**
 * Cache statistics tracking.
 */
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  currentSize: number;
  currentItemCount: number;
}

/**
 * LRU (Least Recently Used) cache implementation optimized for mobile devices.
 * Features memory pressure handling, TTL support, and multiple eviction strategies.
 */
export class LRUCache implements AssetCache {
  readonly config: CacheConfig;
  
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    currentSize: 0,
    currentItemCount: 0
  };
  
  private memoryPressureCallback?: (usage: number, limit: number) => void;
  private cleanupInterval?: NodeJS.Timeout;
  
  constructor(config: CacheConfig) {
    this.config = {
      ...config,
      evictionStrategy: config.evictionStrategy || CacheEvictionStrategy.LRU
    };
    
    // Start cleanup timer for TTL support
    if (this.config.ttl) {
      this.startCleanupTimer();
    }
    
    // Setup memory pressure monitoring
    this.setupMemoryPressureMonitoring();
  }
  
  /**
   * Store an asset in cache.
   */
  async set(key: string, asset: LoadedAsset): Promise<void> {
    const entry: CacheEntry = {
      asset,
      accessTime: Date.now(),
      accessCount: 1,
      createdAt: Date.now(),
      size: asset.size,
      ttl: this.config.ttl ? Date.now() + this.config.ttl : undefined
    };
    
    // Remove existing entry if present
    if (this.cache.has(key)) {
      await this.delete(key);
    }
    
    // Check if we need to evict items to make space
    await this.ensureCapacity(entry.size);
    
    // Add new entry
    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.stats.currentSize += entry.size;
    this.stats.currentItemCount++;
    
    // Check memory pressure after addition
    this.checkMemoryPressure();
  }
  
  /**
   * Retrieve an asset from cache.
   */
  async get(key: string): Promise<LoadedAsset | null> {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check TTL expiration
    if (entry.ttl && Date.now() > entry.ttl) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update access tracking
    entry.accessTime = Date.now();
    entry.accessCount++;
    
    // Move to end of access order (most recently used)
    this.moveToEnd(key);
    
    this.stats.hits++;
    return entry.asset;
  }
  
  /**
   * Check if asset exists in cache.
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check TTL expiration
    if (entry.ttl && Date.now() > entry.ttl) {
      await this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove asset from cache.
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Remove from cache and access order
    this.cache.delete(key);
    this.removeFromAccessOrder(key);
    
    // Update stats
    this.stats.currentSize -= entry.size;
    this.stats.currentItemCount--;
    
    return true;
  }
  
  /**
   * Clear all cached assets.
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.stats.currentSize = 0;
    this.stats.currentItemCount = 0;
  }
  
  /**
   * Get cache statistics.
   */
  async getStats(): Promise<{
    size: number;
    itemCount: number;
    hitRate: number;
    missRate: number;
  }> {
    const hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;
    
    const missRate = this.stats.totalRequests > 0 
      ? this.stats.misses / this.stats.totalRequests 
      : 0;
    
    return {
      size: this.stats.currentSize,
      itemCount: this.stats.currentItemCount,
      hitRate,
      missRate
    };
  }
  
  /**
   * Evict assets based on cache policy.
   */
  async evict(targetSize?: number): Promise<void> {
    if (targetSize === undefined) {
      // Evict just one item when no target size is specified (e.g., for maxItems)
      const evictedKey = this.selectEvictionCandidate();
      if (evictedKey) {
        await this.delete(evictedKey);
        this.stats.evictions++;
      }
      return;
    }
    
    const evictTo = targetSize;
    
    while (this.stats.currentSize > evictTo && this.cache.size > 0) {
      const evictedKey = this.selectEvictionCandidate();
      if (evictedKey) {
        await this.delete(evictedKey);
        this.stats.evictions++;
      } else {
        break; // No more candidates
      }
    }
  }
  
  /**
   * Destroy cache and cleanup.
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    await this.clear();
  }
  
  /**
   * Set memory pressure callback.
   */
  setMemoryPressureCallback(callback: (usage: number, limit: number) => void): void {
    this.memoryPressureCallback = callback;
  }
  
  /**
   * Ensure cache has capacity for new entry.
   */
  private async ensureCapacity(requiredSize: number): Promise<void> {
    // Check item count limit first
    if (this.config.maxItems && this.stats.currentItemCount >= this.config.maxItems) {
      await this.evict();
      return;
    }
    
    const availableSpace = this.config.maxSize - this.stats.currentSize;
    
    if (availableSpace >= requiredSize) {
      return;
    }
    
    // Calculate how much space we need to free
    const spaceToFree = requiredSize - availableSpace;
    const targetSize = this.stats.currentSize - spaceToFree;
    
    await this.evict(targetSize);
  }
  
  /**
   * Select candidate for eviction based on strategy.
   */
  private selectEvictionCandidate(): string | null {
    if (this.cache.size === 0) {
      return null;
    }
    
    switch (this.config.evictionStrategy) {
      case CacheEvictionStrategy.LRU:
        return this.selectLRUCandidate();
      
      case CacheEvictionStrategy.LFU:
        return this.selectLFUCandidate();
      
      case CacheEvictionStrategy.FIFO:
        return this.selectFIFOCandidate();
      
      case CacheEvictionStrategy.SIZE_BASED:
        return this.selectSizeBasedCandidate();
      
      default:
        return this.selectLRUCandidate();
    }
  }
  
  /**
   * Select least recently used item.
   */
  private selectLRUCandidate(): string | null {
    return this.accessOrder.length > 0 ? this.accessOrder[0] : null;
  }
  
  /**
   * Select least frequently used item.
   */
  private selectLFUCandidate(): string | null {
    let minAccessCount = Infinity;
    let candidate: string | null = null;
    
    for (const [key, entry] of this.cache) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        candidate = key;
      }
    }
    
    return candidate;
  }
  
  /**
   * Select oldest item (first in, first out).
   */
  private selectFIFOCandidate(): string | null {
    let oldestTime = Infinity;
    let candidate: string | null = null;
    
    for (const [key, entry] of this.cache) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        candidate = key;
      }
    }
    
    return candidate;
  }
  
  /**
   * Select largest item for eviction.
   */
  private selectSizeBasedCandidate(): string | null {
    let maxSize = 0;
    let candidate: string | null = null;
    
    for (const [key, entry] of this.cache) {
      if (entry.size > maxSize) {
        maxSize = entry.size;
        candidate = key;
      }
    }
    
    return candidate;
  }
  
  /**
   * Move key to end of access order.
   */
  private moveToEnd(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }
  
  /**
   * Remove key from access order array.
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
  
  /**
   * Start cleanup timer for TTL support.
   */
  private startCleanupTimer(): void {
    const cleanupInterval = Math.min(this.config.ttl! / 4, 30000); // Every 1/4 TTL or 30s max
    
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpired();
    }, cleanupInterval);
  }
  
  /**
   * Remove expired entries.
   */
  private async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.ttl && now > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      await this.delete(key);
    }
  }
  
  /**
   * Setup memory pressure monitoring.
   */
  private setupMemoryPressureMonitoring(): void {
    // Monitor memory usage if Performance API is available
    if ('memory' in performance) {
      const checkMemory = () => {
        this.checkMemoryPressure();
      };
      
      // Check memory every 10 seconds
      setInterval(checkMemory, 10000);
    }
  }
  
  /**
   * Check for memory pressure and trigger callback.
   */
  private checkMemoryPressure(): void {
    if (!this.memoryPressureCallback) return;
    
    // Simple heuristic: if cache is using > 90% of allowed space
    const usageRatio = this.stats.currentSize / this.config.maxSize;
    
    if (usageRatio > 0.9) {
      try {
        this.memoryPressureCallback(this.stats.currentSize, this.config.maxSize);
      } catch (error) {
        // Ignore callback errors to prevent cache operations from failing
        Logger.warn('Assets', 'Memory pressure callback error:', error);
      }
    }
    
    // Advanced memory pressure detection if available
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
      
      if (memoryUsage > 0.8) {
        try {
          this.memoryPressureCallback(memInfo.usedJSHeapSize, memInfo.jsHeapSizeLimit);
        } catch (error) {
          // Ignore callback errors to prevent cache operations from failing
          Logger.warn('Assets', 'Memory pressure callback error:', error);
        }
      }
    }
  }
  
  /**
   * Get detailed cache information for debugging.
   */
  getDebugInfo(): {
    entries: Array<{ key: string; size: number; accessCount: number; age: number }>;
    accessOrder: string[];
    stats: CacheStats;
    config: CacheConfig;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: entry.size,
      accessCount: entry.accessCount,
      age: Date.now() - entry.createdAt
    }));
    
    return {
      entries,
      accessOrder: [...this.accessOrder],
      stats: { ...this.stats },
      config: { ...this.config }
    };
  }
}