/**
 * @jest-environment jsdom
 */

import { LRUCache } from '../../../../src/assets/cache/LRUCache';
import { CacheConfig, CacheEvictionStrategy, LoadedAsset, AssetLoadingState, AssetType } from '../../../../src/contracts/AssetManager';

// Mock LoadedAsset helper
function createMockAsset(id: string, size: number = 1024): LoadedAsset {
  return {
    config: {
      id,
      type: AssetType.TEXTURE,
      src: `/${id}.jpg`
    },
    data: new ArrayBuffer(size),
    state: AssetLoadingState.LOADED,
    loadedAt: Date.now(),
    size,
    progress: 1
  };
}

describe('LRUCache', () => {
  let cache: LRUCache;
  const defaultConfig: CacheConfig = {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxItems: 100,
    evictionStrategy: CacheEvictionStrategy.LRU
  };

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    cache = new LRUCache(defaultConfig);
  });

  afterEach(async () => {
    await cache.destroy();
    jest.useRealTimers();
  });

  describe('basic operations', () => {
    it('should store and retrieve assets', async () => {
      // Arrange
      const asset = createMockAsset('test-asset', 1024);

      // Act
      await cache.set('test-key', asset);
      const retrieved = await cache.get('test-key');

      // Assert
      expect(retrieved).toEqual(asset);
    });

    it('should return null for non-existent keys', async () => {
      // Act
      const result = await cache.get('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should check if assets exist', async () => {
      // Arrange
      const asset = createMockAsset('test-asset');
      await cache.set('test-key', asset);

      // Act & Assert
      expect(await cache.has('test-key')).toBe(true);
      expect(await cache.has('non-existent')).toBe(false);
    });

    it('should delete assets', async () => {
      // Arrange
      const asset = createMockAsset('test-asset');
      await cache.set('test-key', asset);

      // Act
      const deleted = await cache.delete('test-key');

      // Assert
      expect(deleted).toBe(true);
      expect(await cache.has('test-key')).toBe(false);
      expect(await cache.get('test-key')).toBeNull();
    });

    it('should return false when deleting non-existent assets', async () => {
      // Act
      const deleted = await cache.delete('non-existent');

      // Assert
      expect(deleted).toBe(false);
    });

    it('should clear all assets', async () => {
      // Arrange
      await cache.set('key1', createMockAsset('asset1'));
      await cache.set('key2', createMockAsset('asset2'));

      // Act
      await cache.clear();

      // Assert
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(false);
      
      const stats = await cache.getStats();
      expect(stats.itemCount).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe('LRU behavior', () => {
    it('should update access order when getting assets', async () => {
      // Arrange
      await cache.set('key1', createMockAsset('asset1'));
      await cache.set('key2', createMockAsset('asset2'));
      await cache.set('key3', createMockAsset('asset3'));

      // Act - Access key1 to make it most recently used
      await cache.get('key1');

      // Create cache with small capacity to force eviction
      const smallCache = new LRUCache({ maxSize: 2048, maxItems: 2 });
      await smallCache.set('key1', createMockAsset('asset1'));
      await smallCache.set('key2', createMockAsset('asset2'));
      await smallCache.get('key1'); // Make key1 most recently used
      await smallCache.set('key3', createMockAsset('asset3')); // Should evict key2

      // Assert
      expect(await smallCache.has('key1')).toBe(true); // Most recently used
      expect(await smallCache.has('key2')).toBe(false); // Least recently used, evicted
      expect(await smallCache.has('key3')).toBe(true); // Just added

      await smallCache.destroy();
    });

    it('should maintain correct access order', async () => {
      // Arrange
      const smallCache = new LRUCache({ maxSize: 4096, maxItems: 3 });

      // Act
      await smallCache.set('key1', createMockAsset('asset1'));
      await smallCache.set('key2', createMockAsset('asset2'));
      await smallCache.set('key3', createMockAsset('asset3'));
      
      // Access in different order
      await smallCache.get('key1');
      await smallCache.get('key3');
      
      // Add fourth item, should evict key2 (least recently used)
      await smallCache.set('key4', createMockAsset('asset4'));

      // Assert
      expect(await smallCache.has('key1')).toBe(true);
      expect(await smallCache.has('key2')).toBe(false); // Evicted
      expect(await smallCache.has('key3')).toBe(true);
      expect(await smallCache.has('key4')).toBe(true);

      await smallCache.destroy();
    });
  });

  describe('eviction strategies', () => {
    it('should evict using LRU strategy', async () => {
      // Arrange
      const lruCache = new LRUCache({
        maxSize: 3072,
        evictionStrategy: CacheEvictionStrategy.LRU
      });

      await lruCache.set('key1', createMockAsset('asset1'));
      await lruCache.set('key2', createMockAsset('asset2'));
      await lruCache.set('key3', createMockAsset('asset3'));
      
      // Access key1 and key3 to update their positions
      await lruCache.get('key1');
      await lruCache.get('key3');

      // Act - Add item that forces eviction
      await lruCache.set('key4', createMockAsset('asset4'));

      // Assert - key2 should be evicted (least recently used)
      expect(await lruCache.has('key1')).toBe(true);
      expect(await lruCache.has('key2')).toBe(false);
      expect(await lruCache.has('key3')).toBe(true);
      expect(await lruCache.has('key4')).toBe(true);

      await lruCache.destroy();
    });

    it('should evict using LFU strategy', async () => {
      // Arrange
      const lfuCache = new LRUCache({
        maxSize: 3072,
        evictionStrategy: CacheEvictionStrategy.LFU
      });

      await lfuCache.set('key1', createMockAsset('asset1'));
      await lfuCache.set('key2', createMockAsset('asset2'));
      await lfuCache.set('key3', createMockAsset('asset3'));
      
      // Access key1 multiple times, key3 once, leave key2 untouched
      await lfuCache.get('key1');
      await lfuCache.get('key1');
      await lfuCache.get('key3');

      // Act - Add item that forces eviction
      await lfuCache.set('key4', createMockAsset('asset4'));

      // Assert - key2 should be evicted (least frequently used)
      expect(await lfuCache.has('key1')).toBe(true);
      expect(await lfuCache.has('key2')).toBe(false);
      expect(await lfuCache.has('key3')).toBe(true);
      expect(await lfuCache.has('key4')).toBe(true);

      await lfuCache.destroy();
    });

    it('should evict using FIFO strategy', async () => {
      // Arrange
      const fifoCache = new LRUCache({
        maxSize: 3072,
        evictionStrategy: CacheEvictionStrategy.FIFO
      });

      await fifoCache.set('key1', createMockAsset('asset1'));
      jest.advanceTimersByTime(100);
      await fifoCache.set('key2', createMockAsset('asset2'));
      jest.advanceTimersByTime(100);
      await fifoCache.set('key3', createMockAsset('asset3'));
      
      // Access all items to verify FIFO ignores access patterns
      await fifoCache.get('key1');
      await fifoCache.get('key2');
      await fifoCache.get('key3');

      // Act - Add item that forces eviction
      await fifoCache.set('key4', createMockAsset('asset4'));

      // Assert - key1 should be evicted (first in)
      expect(await fifoCache.has('key1')).toBe(false);
      expect(await fifoCache.has('key2')).toBe(true);
      expect(await fifoCache.has('key3')).toBe(true);
      expect(await fifoCache.has('key4')).toBe(true);

      await fifoCache.destroy();
    });

    it('should evict using size-based strategy', async () => {
      // Arrange
      const sizeCache = new LRUCache({
        maxSize: 5120,
        evictionStrategy: CacheEvictionStrategy.SIZE_BASED
      });

      await sizeCache.set('small1', createMockAsset('small1', 512));
      await sizeCache.set('large', createMockAsset('large', 2048)); // Largest
      await sizeCache.set('small2', createMockAsset('small2', 512));
      await sizeCache.set('medium', createMockAsset('medium', 1024));

      // Act - Add item that forces eviction
      await sizeCache.set('new', createMockAsset('new', 1024));

      // Assert - 'large' should be evicted (largest size)
      expect(await sizeCache.has('small1')).toBe(true);
      expect(await sizeCache.has('large')).toBe(false);
      expect(await sizeCache.has('small2')).toBe(true);
      expect(await sizeCache.has('medium')).toBe(true);
      expect(await sizeCache.has('new')).toBe(true);

      await sizeCache.destroy();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should support TTL expiration', async () => {
      // Arrange
      const ttlCache = new LRUCache({
        maxSize: 10 * 1024 * 1024,
        ttl: 1000 // 1 second
      });

      const asset = createMockAsset('asset');
      await ttlCache.set('key', asset);

      // Act & Assert - Should be available immediately
      expect(await ttlCache.get('key')).toEqual(asset);
      expect(await ttlCache.has('key')).toBe(true);

      // Advance time beyond TTL
      jest.advanceTimersByTime(1500);

      // Should be expired
      expect(await ttlCache.get('key')).toBeNull();
      expect(await ttlCache.has('key')).toBe(false);

      await ttlCache.destroy();
    });

    it('should start cleanup timer with TTL', async () => {
      // Arrange
      const ttlCache = new LRUCache({
        maxSize: 10 * 1024 * 1024,
        ttl: 10000 // 10 seconds
      });

      const asset1 = createMockAsset('asset1');
      const asset2 = createMockAsset('asset2');

      await ttlCache.set('key1', asset1);
      
      // Advance time to near expiration
      jest.advanceTimersByTime(8000);
      await ttlCache.set('key2', asset2);
      
      // Advance time to trigger cleanup of key1
      jest.advanceTimersByTime(3000);

      // Act - Trigger cleanup
      jest.runOnlyPendingTimers();

      // Assert
      expect(await ttlCache.has('key1')).toBe(false); // Expired
      expect(await ttlCache.has('key2')).toBe(true); // Still valid

      await ttlCache.destroy();
    });
  });

  describe('capacity management', () => {
    it('should respect maxSize limit', async () => {
      // Arrange
      const smallCache = new LRUCache({ maxSize: 2048 });

      // Act - Add assets that exceed capacity
      await smallCache.set('key1', createMockAsset('asset1', 1024));
      await smallCache.set('key2', createMockAsset('asset2', 1024));
      await smallCache.set('key3', createMockAsset('asset3', 1024)); // Should trigger eviction

      // Assert
      const stats = await smallCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(2048);
      expect(stats.itemCount).toBe(2); // One item should be evicted

      await smallCache.destroy();
    });

    it('should respect maxItems limit', async () => {
      // Arrange
      const itemLimitCache = new LRUCache({ 
        maxSize: 10 * 1024 * 1024, 
        maxItems: 2 
      });

      // Act
      await itemLimitCache.set('key1', createMockAsset('asset1', 100));
      await itemLimitCache.set('key2', createMockAsset('asset2', 100));
      await itemLimitCache.set('key3', createMockAsset('asset3', 100)); // Should trigger eviction

      // Assert
      const stats = await itemLimitCache.getStats();
      expect(stats.itemCount).toBe(2);

      await itemLimitCache.destroy();
    });

    it('should handle manual eviction', async () => {
      // Arrange
      await cache.set('key1', createMockAsset('asset1', 1024));
      await cache.set('key2', createMockAsset('asset2', 2048));
      await cache.set('key3', createMockAsset('asset3', 1024));

      // Act
      await cache.evict(2048); // Evict to 2KB

      // Assert
      const stats = await cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(2048);
    });
  });

  describe('statistics tracking', () => {
    it('should track cache statistics correctly', async () => {
      // Arrange & Act
      await cache.set('key1', createMockAsset('asset1', 1024));
      await cache.set('key2', createMockAsset('asset2', 2048));
      
      await cache.get('key1'); // Hit
      await cache.get('key2'); // Hit
      await cache.get('non-existent'); // Miss

      // Assert
      const stats = await cache.getStats();
      expect(stats.itemCount).toBe(2);
      expect(stats.size).toBe(3072);
      expect(stats.hitRate).toBeCloseTo(2/3, 2); // 2 hits out of 3 requests
      expect(stats.missRate).toBeCloseTo(1/3, 2); // 1 miss out of 3 requests
    });

    it('should handle zero requests in statistics', async () => {
      // Act
      const stats = await cache.getStats();

      // Assert
      expect(stats.hitRate).toBe(0);
      expect(stats.missRate).toBe(0);
      expect(stats.itemCount).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe('memory pressure handling', () => {
    it('should call memory pressure callback when threshold exceeded', async () => {
      // Arrange
      const pressureCallback = jest.fn();
      cache.setMemoryPressureCallback(pressureCallback);

      // Fill cache to over 90% capacity to trigger pressure
      const largeAsset = createMockAsset('large', 9.5 * 1024 * 1024); // 9.5MB of 10MB limit

      // Act
      await cache.set('large-key', largeAsset);

      // Assert
      expect(pressureCallback).toHaveBeenCalledWith(
        expect.any(Number),
        defaultConfig.maxSize
      );
    });

    it('should handle memory pressure callback errors gracefully', async () => {
      // Arrange
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      cache.setMemoryPressureCallback(errorCallback);

      const largeAsset = createMockAsset('large', 9.5 * 1024 * 1024);

      // Act & Assert - Should not throw
      await expect(cache.set('large-key', largeAsset)).resolves.toBeUndefined();
    });
  });

  describe('replacement behavior', () => {
    it('should replace existing keys', async () => {
      // Arrange
      const asset1 = createMockAsset('asset1', 1024);
      const asset2 = createMockAsset('asset2', 2048);
      
      await cache.set('key', asset1);

      // Act
      await cache.set('key', asset2);

      // Assert
      const retrieved = await cache.get('key');
      expect(retrieved).toEqual(asset2);
      expect(retrieved?.size).toBe(2048);

      const stats = await cache.getStats();
      expect(stats.itemCount).toBe(1); // Should still be 1 item
    });
  });

  describe('error handling', () => {
    it('should handle invalid eviction strategies gracefully', async () => {
      // Arrange
      const invalidCache = new LRUCache({
        maxSize: 1024,
        evictionStrategy: 'INVALID' as any
      });

      await invalidCache.set('key1', createMockAsset('asset1'));
      await invalidCache.set('key2', createMockAsset('asset2'));

      // Act & Assert - Should default to LRU and not crash
      await expect(invalidCache.set('key3', createMockAsset('asset3'))).resolves.toBeUndefined();

      await invalidCache.destroy();
    });
  });

  describe('debugging utilities', () => {
    it('should provide debug information', async () => {
      // Arrange
      await cache.set('key1', createMockAsset('asset1', 1024));
      await cache.set('key2', createMockAsset('asset2', 2048));
      await cache.get('key1'); // Update access

      // Act
      const debugInfo = cache.getDebugInfo();

      // Assert
      expect(debugInfo.entries).toHaveLength(2);
      expect(debugInfo.entries[0]).toMatchObject({
        key: expect.any(String),
        size: expect.any(Number),
        accessCount: expect.any(Number),
        age: expect.any(Number)
      });
      expect(debugInfo.accessOrder).toBeInstanceOf(Array);
      expect(debugInfo.stats).toMatchObject({
        hits: expect.any(Number),
        misses: expect.any(Number),
        evictions: expect.any(Number),
        totalRequests: expect.any(Number),
        currentSize: expect.any(Number),
        currentItemCount: expect.any(Number)
      });
      expect(debugInfo.config).toEqual(expect.objectContaining(defaultConfig));
    });
  });

  describe('destruction', () => {
    it('should clean up resources on destroy', async () => {
      // Arrange
      const ttlCache = new LRUCache({
        maxSize: 10 * 1024 * 1024,
        ttl: 1000
      });

      await ttlCache.set('key', createMockAsset('asset'));

      // Act
      await ttlCache.destroy();

      // Assert
      const stats = await ttlCache.getStats();
      expect(stats.itemCount).toBe(0);
      expect(stats.size).toBe(0);
    });
  });
});