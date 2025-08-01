import { AssetCache, CacheConfig, LoadedAsset } from '../../contracts/AssetManager';
import { LRUCache } from './LRUCache';

/**
 * Persistent cache entry for IndexedDB storage.
 */
interface PersistentCacheEntry {
  key: string;
  asset: LoadedAsset;
  timestamp: number;
  ttl?: number;
  version: string;
}

/**
 * IndexedDB database configuration.
 */
interface IndexedDBConfig {
  name: string;
  version: number;
  storeName: string;
}

/**
 * Persistent cache implementation using IndexedDB with LRU fallback.
 * Provides offline support and persistence across browser sessions.
 */
export class PersistentCache implements AssetCache {
  readonly config: CacheConfig;
  
  private memoryCache: LRUCache;
  private dbConfig: IndexedDBConfig;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private isSupported: boolean;
  
  constructor(config: CacheConfig, dbConfig?: Partial<IndexedDBConfig>) {
    this.config = config;
    this.isSupported = this.checkIndexedDBSupport();
    
    this.dbConfig = {
      name: 'GameByteAssetCache',
      version: 1,
      storeName: 'assets',
      ...dbConfig
    };
    
    // Create memory cache as fallback
    this.memoryCache = new LRUCache({
      ...config,
      maxSize: Math.min(config.maxSize, 50 * 1024 * 1024), // 50MB max for memory
      persistent: false
    });
    
    if (this.isSupported && config.persistent) {
      this.initPromise = this.initializeDatabase();
    }
  }
  
  /**
   * Store an asset in both memory and persistent cache.
   */
  async set(key: string, asset: LoadedAsset): Promise<void> {
    // Always store in memory cache
    await this.memoryCache.set(key, asset);
    
    // Store in persistent cache if supported and enabled
    if (this.isSupported && this.config.persistent) {
      await this.setPersistent(key, asset);
    }
  }
  
  /**
   * Retrieve an asset from memory cache first, then persistent cache.
   */
  async get(key: string): Promise<LoadedAsset | null> {
    // Try memory cache first (fastest)
    const memoryAsset = await this.memoryCache.get(key);
    if (memoryAsset) {
      return memoryAsset;
    }
    
    // Try persistent cache if available
    if (this.isSupported && this.config.persistent) {
      const persistentAsset = await this.getPersistent(key);
      if (persistentAsset) {
        // Restore to memory cache for faster future access
        await this.memoryCache.set(key, persistentAsset);
        return persistentAsset;
      }
    }
    
    return null;
  }
  
  /**
   * Check if asset exists in any cache layer.
   */
  async has(key: string): Promise<boolean> {
    // Check memory cache first
    if (await this.memoryCache.has(key)) {
      return true;
    }
    
    // Check persistent cache
    if (this.isSupported && this.config.persistent) {
      return await this.hasPersistent(key);
    }
    
    return false;
  }
  
  /**
   * Remove asset from both cache layers.
   */
  async delete(key: string): Promise<boolean> {
    let deleted = false;
    
    // Delete from memory cache
    if (await this.memoryCache.delete(key)) {
      deleted = true;
    }
    
    // Delete from persistent cache
    if (this.isSupported && this.config.persistent) {
      if (await this.deletePersistent(key)) {
        deleted = true;
      }
    }
    
    return deleted;
  }
  
  /**
   * Clear both cache layers.
   */
  async clear(): Promise<void> {
    await this.memoryCache.clear();
    
    if (this.isSupported && this.config.persistent) {
      await this.clearPersistent();
    }
  }
  
  /**
   * Get combined cache statistics.
   */
  async getStats(): Promise<{
    size: number;
    itemCount: number;
    hitRate: number;
    missRate: number;
  }> {
    const memoryStats = await this.memoryCache.getStats();
    
    if (!this.isSupported || !this.config.persistent) {
      return memoryStats;
    }
    
    const persistentStats = await this.getPersistentStats();
    
    return {
      size: memoryStats.size + persistentStats.size,
      itemCount: memoryStats.itemCount + persistentStats.itemCount,
      hitRate: (memoryStats.hitRate + persistentStats.hitRate) / 2,
      missRate: (memoryStats.missRate + persistentStats.missRate) / 2
    };
  }
  
  /**
   * Evict assets from both cache layers.
   */
  async evict(targetSize?: number): Promise<void> {
    // Evict from memory cache first
    await this.memoryCache.evict(targetSize);
    
    // Evict from persistent cache if needed
    if (this.isSupported && this.config.persistent && targetSize) {
      await this.evictPersistent(targetSize);
    }
  }
  
  /**
   * Destroy both cache layers.
   */
  async destroy(): Promise<void> {
    await this.memoryCache.destroy();
    
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
  
  /**
   * Check if IndexedDB is supported.
   */
  private checkIndexedDBSupport(): boolean {
    try {
      return 'indexedDB' in window && indexedDB !== null;
    } catch {
      return false;
    }
  }
  
  /**
   * Initialize IndexedDB database.
   */
  private async initializeDatabase(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('IndexedDB not supported');
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbConfig.name, this.dbConfig.version);
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.dbConfig.storeName)) {
          const store = db.createObjectStore(this.dbConfig.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('ttl', 'ttl', { unique: false });
        }
      };
    });
  }
  
  /**
   * Ensure database is initialized.
   */
  private async ensureDatabase(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
  }
  
  /**
   * Store asset in persistent cache.
   */
  private async setPersistent(key: string, asset: LoadedAsset): Promise<void> {
    await this.ensureDatabase();
    
    const entry: PersistentCacheEntry = {
      key,
      asset: {
        ...asset,
        // Don't store the actual data for large assets, just metadata
        data: asset.size > 1024 * 1024 ? null : asset.data
      },
      timestamp: Date.now(),
      ttl: this.config.ttl ? Date.now() + this.config.ttl : undefined,
      version: this.config.version || '1.0.0'
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readwrite');
      const store = transaction.objectStore(this.dbConfig.storeName);
      
      const request = store.put(entry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store in persistent cache'));
    });
  }
  
  /**
   * Retrieve asset from persistent cache.
   */
  private async getPersistent(key: string): Promise<LoadedAsset | null> {
    await this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readonly');
      const store = transaction.objectStore(this.dbConfig.storeName);
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        const entry = request.result as PersistentCacheEntry;
        
        if (!entry) {
          resolve(null);
          return;
        }
        
        // Check TTL expiration
        if (entry.ttl && Date.now() > entry.ttl) {
          this.deletePersistent(key); // Fire and forget cleanup
          resolve(null);
          return;
        }
        
        // Check version compatibility
        if (this.config.version && entry.version !== this.config.version) {
          this.deletePersistent(key); // Fire and forget cleanup
          resolve(null);
          return;
        }
        
        resolve(entry.asset);
      };
      
      request.onerror = () => reject(new Error('Failed to retrieve from persistent cache'));
    });
  }
  
  /**
   * Check if asset exists in persistent cache.
   */
  private async hasPersistent(key: string): Promise<boolean> {
    const asset = await this.getPersistent(key);
    return asset !== null;
  }
  
  /**
   * Delete asset from persistent cache.
   */
  private async deletePersistent(key: string): Promise<boolean> {
    await this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readwrite');
      const store = transaction.objectStore(this.dbConfig.storeName);
      
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to delete from persistent cache'));
    });
  }
  
  /**
   * Clear all persistent cache entries.
   */
  private async clearPersistent(): Promise<void> {
    await this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readwrite');
      const store = transaction.objectStore(this.dbConfig.storeName);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear persistent cache'));
    });
  }
  
  /**
   * Get persistent cache statistics.
   */
  private async getPersistentStats(): Promise<{
    size: number;
    itemCount: number;
    hitRate: number;
    missRate: number;
  }> {
    await this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readonly');
      const store = transaction.objectStore(this.dbConfig.storeName);
      
      let totalSize = 0;
      let itemCount = 0;
      
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          const entry = cursor.value as PersistentCacheEntry;
          totalSize += entry.asset.size;
          itemCount++;
          cursor.continue();
        } else {
          resolve({
            size: totalSize,
            itemCount,
            hitRate: 0, // Would need separate tracking
            missRate: 0  // Would need separate tracking
          });
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get persistent cache stats'));
    });
  }
  
  /**
   * Evict assets from persistent cache.
   */
  private async evictPersistent(targetSize: number): Promise<void> {
    await this.ensureDatabase();
    
    // Get all entries sorted by timestamp (oldest first)
    const entries = await this.getAllPersistentEntries();
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    let currentSize = entries.reduce((sum, entry) => sum + entry.asset.size, 0);
    
    // Remove entries until we're under target size
    for (const entry of entries) {
      if (currentSize <= targetSize) break;
      
      await this.deletePersistent(entry.key);
      currentSize -= entry.asset.size;
    }
  }
  
  /**
   * Get all persistent cache entries.
   */
  private async getAllPersistentEntries(): Promise<PersistentCacheEntry[]> {
    await this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readonly');
      const store = transaction.objectStore(this.dbConfig.storeName);
      
      const entries: PersistentCacheEntry[] = [];
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          entries.push(cursor.value);
          cursor.continue();
        } else {
          resolve(entries);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get all persistent entries'));
    });
  }
  
  /**
   * Cleanup expired persistent cache entries.
   */
  async cleanupExpired(): Promise<number> {
    if (!this.isSupported || !this.config.persistent) {
      return 0;
    }
    
    await this.ensureDatabase();
    
    const now = Date.now();
    const entries = await this.getAllPersistentEntries();
    let cleanedCount = 0;
    
    for (const entry of entries) {
      if (entry.ttl && now > entry.ttl) {
        await this.deletePersistent(entry.key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
}