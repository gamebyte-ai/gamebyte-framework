import { EventEmitter } from 'eventemitter3';
import { 
  MemoryOptimizer as IMemoryOptimizer, 
  MemoryInfo, 
  MemoryLeak, 
  ObjectPool, 
  ObjectPoolConfig 
} from '../contracts/Performance';

/**
 * Object pool implementation for memory optimization
 */
class GameByteObjectPool<T> implements ObjectPool<T> {
  private pool: T[] = [];
  private inUseObjects = new Set<T>();
  private config: ObjectPoolConfig;
  private totalCreated = 0;
  private totalReused = 0;
  
  constructor(config: ObjectPoolConfig) {
    this.config = config;
    this.grow(config.initialSize);
  }

  /**
   * Get an object from the pool
   */
  get(): T {
    let obj: T;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
      this.totalReused++;
    } else if (this.inUseObjects.size < this.config.maxSize) {
      obj = this.config.createFunction();
      this.totalCreated++;
    } else {
      throw new Error('Object pool exhausted');
    }
    
    this.inUseObjects.add(obj);
    return obj;
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (!this.inUseObjects.has(obj)) {
      console.warn('Attempting to release object not from this pool');
      return;
    }
    
    this.inUseObjects.delete(obj);
    
    // Reset object if reset function provided
    if (this.config.resetFunction) {
      this.config.resetFunction(obj);
    }
    
    this.pool.push(obj);
    
    // Shrink pool if it's getting too large
    if (this.pool.length > this.config.shrinkThreshold) {
      this.shrink();
    }
  }

  /**
   * Clear all objects from the pool
   */
  clear(): void {
    // Destroy objects if destroy function provided
    if (this.config.destroyFunction) {
      this.pool.forEach(obj => this.config.destroyFunction!(obj));
      this.inUseObjects.forEach(obj => this.config.destroyFunction!(obj));
    }
    
    this.pool.length = 0;
    this.inUseObjects.clear();
  }

  /**
   * Get total pool size
   */
  size(): number {
    return this.pool.length + this.inUseObjects.size;
  }

  /**
   * Get available objects count
   */
  available(): number {
    return this.pool.length;
  }

  /**
   * Get in-use objects count
   */
  inUse(): number {
    return this.inUseObjects.size;
  }

  /**
   * Grow the pool by specified count
   */
  grow(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.size() >= this.config.maxSize) break;
      this.pool.push(this.config.createFunction());
      this.totalCreated++;
    }
  }

  /**
   * Shrink the pool by removing excess objects
   */
  shrink(): void {
    const excess = this.pool.length - this.config.shrinkThreshold;
    if (excess > 0) {
      const removed = this.pool.splice(0, excess);
      
      if (this.config.destroyFunction) {
        removed.forEach(obj => this.config.destroyFunction!(obj));
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalSize: this.size(),
      available: this.available(),
      inUse: this.inUse(),
      totalCreated: this.totalCreated,
      totalReused: this.totalReused,
      reuseRatio: this.totalReused / (this.totalCreated + this.totalReused)
    };
  }
}

/**
 * Memory optimization and management system
 */
export class MemoryOptimizer extends EventEmitter implements IMemoryOptimizer {
  private isInitialized = false;
  private objectPools = new Map<string, GameByteObjectPool<any>>();
  private memoryMonitorInterval: number | null = null;
  private gcScheduleInterval: number | null = null;
  
  // Memory tracking
  private memoryHistory: MemoryInfo[] = [];
  private maxHistorySize = 300; // 5 minutes at 1 sample per second
  private lastMemoryInfo: MemoryInfo | null = null;
  private memoryLeaks: MemoryLeak[] = [];
  
  // GC tracking
  private gcCount = 0;
  private totalGcTime = 0;
  private lastGcTime = 0;
  private forcedGcCount = 0;
  
  // Memory pressure detection
  private memoryPressureThreshold = 0.8; // 80% of available memory
  private memoryWarningThreshold = 0.9; // 90% of available memory
  private memoryLeakThreshold = 50 * 1024 * 1024; // 50MB growth without GC
  
  // Performance optimization
  private autoGcEnabled = true;
  private gcScheduleMs = 30000; // 30 seconds
  private memoryMonitorMs = 1000; // 1 second

  /**
   * Initialize memory optimizer
   */
  initialize(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    this.setupMemoryMonitoring();
    this.setupGarbageCollectionScheduling();
    
    // Create default object pools
    this.createDefaultPools();
    
    this.emit('initialized');
  }

  /**
   * Get current memory usage information
   */
  getMemoryUsage(): MemoryInfo {
    const memory = (performance as any).memory;
    const info: MemoryInfo = {
      used: 0,
      total: 0,
      percentage: 0,
      jsHeapSizeUsed: 0,
      jsHeapSizeTotal: 0,
      jsHeapSizeLimit: 0,
      gcCount: this.gcCount,
      gcTime: this.totalGcTime
    };
    
    if (memory) {
      info.jsHeapSizeUsed = memory.usedJSHeapSize;
      info.jsHeapSizeTotal = memory.totalJSHeapSize;
      info.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      info.used = memory.usedJSHeapSize;
      info.total = memory.jsHeapSizeLimit;
      info.percentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    } else {
      // Fallback for browsers without memory API
      info.used = 50 * 1024 * 1024; // Estimate 50MB
      info.total = 100 * 1024 * 1024; // Estimate 100MB
      info.percentage = 50;
    }
    
    this.lastMemoryInfo = info;
    return info;
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    this.memoryMonitorInterval = window.setInterval(() => {
      const memInfo = this.getMemoryUsage();
      this.memoryHistory.push(memInfo);
      
      // Limit history size
      if (this.memoryHistory.length > this.maxHistorySize) {
        this.memoryHistory.shift();
      }
      
      // Check for memory pressure
      this.checkMemoryPressure(memInfo);
      
      // Detect potential memory leaks
      this.detectMemoryLeaksInternal();
      
      this.emit('memory-updated', memInfo);
    }, this.memoryMonitorMs);
  }

  /**
   * Setup garbage collection scheduling
   */
  private setupGarbageCollectionScheduling(): void {
    if (!this.autoGcEnabled) return;
    
    this.gcScheduleInterval = window.setInterval(() => {
      this.scheduleGC();
    }, this.gcScheduleMs);
  }

  /**
   * Check for memory pressure and emit warnings
   */
  private checkMemoryPressure(memInfo: MemoryInfo): void {
    const pressureLevel = memInfo.percentage / 100;
    
    if (pressureLevel >= this.memoryWarningThreshold) {
      this.emit('memory-warning', {
        level: 'critical',
        percentage: memInfo.percentage,
        message: 'Memory usage is critically high'
      });
      
      // Force garbage collection
      this.optimizeMemory();
    } else if (pressureLevel >= this.memoryPressureThreshold) {
      this.emit('memory-warning', {
        level: 'high',
        percentage: memInfo.percentage,
        message: 'Memory usage is high'
      });
    }
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaksInternal(): void {
    if (this.memoryHistory.length < 60) return; // Need at least 1 minute of data
    
    const recentHistory = this.memoryHistory.slice(-60); // Last 1 minute
    const oldHistory = this.memoryHistory.slice(-120, -60); // Previous 1 minute
    
    if (oldHistory.length === 0) return;
    
    const recentAvg = recentHistory.reduce((sum, info) => sum + info.used, 0) / recentHistory.length;
    const oldAvg = oldHistory.reduce((sum, info) => sum + info.used, 0) / oldHistory.length;
    
    const growth = recentAvg - oldAvg;
    
    if (growth > this.memoryLeakThreshold) {
      const leak: MemoryLeak = {
        type: 'sustained_growth',
        count: 1,
        size: growth,
        severity: growth > this.memoryLeakThreshold * 2 ? 'high' : 'medium',
        location: 'unknown'
      };
      
      this.memoryLeaks.push(leak);
      this.emit('memory-leak-detected', leak);
      
      // Limit leak history
      if (this.memoryLeaks.length > 10) {
        this.memoryLeaks.shift();
      }
    }
  }

  /**
   * Get detected memory leaks
   */
  detectMemoryLeaks(): MemoryLeak[] {
    return [...this.memoryLeaks];
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory(): void {
    const startTime = performance.now();
    
    // Force garbage collection if available
    this.forceGC();
    
    // Optimize object pools
    this.optimizeObjectPools();
    
    // Clear memory history to prevent it from growing too large
    if (this.memoryHistory.length > this.maxHistorySize * 1.5) {
      this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize);
    }
    
    const endTime = performance.now();
    const optimizationTime = endTime - startTime;
    
    this.emit('memory-optimized', {
      duration: optimizationTime,
      beforeMemory: this.lastMemoryInfo,
      afterMemory: this.getMemoryUsage()
    });
  }

  /**
   * Schedule garbage collection
   */
  scheduleGC(): void {
    if (!this.autoGcEnabled) return;
    
    const memInfo = this.getMemoryUsage();
    
    // Only trigger GC if memory usage is above threshold
    if (memInfo.percentage > 70) {
      this.forceGC();
    }
  }

  /**
   * Force garbage collection if available
   */
  private forceGC(): void {
    const startTime = performance.now();
    
    try {
      // Try different GC methods
      if ((window as any).gc) {
        (window as any).gc();
      } else if ((window as any).CollectGarbage) {
        (window as any).CollectGarbage();
      } else {
        // Fallback: create and release large objects to trigger GC
        this.triggerGCFallback();
      }
      
      const endTime = performance.now();
      const gcTime = endTime - startTime;
      
      this.gcCount++;
      this.totalGcTime += gcTime;
      this.lastGcTime = gcTime;
      this.forcedGcCount++;
      
      this.emit('gc-completed', {
        duration: gcTime,
        method: 'forced'
      });
    } catch (error) {
      this.emit('gc-error', error);
    }
  }

  /**
   * Fallback method to trigger GC by memory pressure
   */
  private triggerGCFallback(): void {
    // Create large temporary objects to trigger GC
    const temp = [];
    for (let i = 0; i < 1000; i++) {
      temp.push(new Array(1000).fill(Math.random()));
    }
    // Objects will be collected when temp goes out of scope
  }

  /**
   * Optimize all object pools
   */
  private optimizeObjectPools(): void {
    this.objectPools.forEach((pool, name) => {
      try {
        pool.shrink();
      } catch (error) {
        this.emit('pool-optimization-error', { poolName: name, error });
      }
    });
  }

  /**
   * Create default object pools for common objects
   */
  private createDefaultPools(): void {
    // Vector2 pool
    this.registerPool('Vector2', {
      initialSize: 100,
      maxSize: 1000,
      growthFactor: 1.5,
      shrinkThreshold: 200,
      createFunction: () => ({ x: 0, y: 0 }),
      resetFunction: (obj: any) => {
        obj.x = 0;
        obj.y = 0;
      }
    });
    
    // Array pool for temporary calculations
    this.registerPool('TempArray', {
      initialSize: 50,
      maxSize: 500,
      growthFactor: 1.5,
      shrinkThreshold: 100,
      createFunction: () => [],
      resetFunction: (arr: any[]) => {
        arr.length = 0;
      }
    });
    
    // Object pool for temporary objects
    this.registerPool('TempObject', {
      initialSize: 50,
      maxSize: 500,
      growthFactor: 1.5,
      shrinkThreshold: 100,
      createFunction: () => ({}),
      resetFunction: (obj: any) => {
        for (const key in obj) {
          delete obj[key];
        }
      }
    });
  }

  /**
   * Create a new object pool
   */
  createObjectPool<T>(config: ObjectPoolConfig): ObjectPool<T> {
    const pool = new GameByteObjectPool<T>(config);
    return pool;
  }

  /**
   * Get object pools map
   */
  getObjectPools(): Map<string, ObjectPool<any>> {
    return new Map(this.objectPools);
  }

  /**
   * Register a named object pool
   */
  registerPool<T>(name: string, config: ObjectPoolConfig): ObjectPool<T> {
    if (this.objectPools.has(name)) {
      throw new Error(`Object pool '${name}' already exists`);
    }
    
    const pool = new GameByteObjectPool<T>(config);
    this.objectPools.set(name, pool);
    
    this.emit('pool-created', { name, config });
    return pool;
  }

  /**
   * Get object pool by name
   */
  getPool<T>(name: string): ObjectPool<T> | null {
    return this.objectPools.get(name) || null;
  }

  /**
   * Remove object pool
   */
  removePool(name: string): boolean {
    const pool = this.objectPools.get(name);
    if (pool) {
      (pool as GameByteObjectPool<any>).clear();
      this.objectPools.delete(name);
      this.emit('pool-removed', name);
      return true;
    }
    return false;
  }

  /**
   * Get memory optimization report
   */
  getReport(): any {
    const currentMemory = this.getMemoryUsage();
    const poolStats = Array.from(this.objectPools.entries()).map(([name, pool]) => ({
      name,
      stats: (pool as GameByteObjectPool<any>).getStats()
    }));
    
    return {
      currentMemory,
      memoryHistory: this.memoryHistory.slice(-10), // Last 10 entries
      gcStats: {
        count: this.gcCount,
        totalTime: this.totalGcTime,
        lastTime: this.lastGcTime,
        forcedCount: this.forcedGcCount
      },
      objectPools: poolStats,
      memoryLeaks: this.memoryLeaks,
      settings: {
        autoGcEnabled: this.autoGcEnabled,
        memoryPressureThreshold: this.memoryPressureThreshold,
        memoryWarningThreshold: this.memoryWarningThreshold,
        gcScheduleMs: this.gcScheduleMs
      }
    };
  }

  /**
   * Set auto GC enabled state
   */
  setAutoGCEnabled(enabled: boolean): void {
    this.autoGcEnabled = enabled;
    
    if (enabled && !this.gcScheduleInterval) {
      this.setupGarbageCollectionScheduling();
    } else if (!enabled && this.gcScheduleInterval) {
      clearInterval(this.gcScheduleInterval);
      this.gcScheduleInterval = null;
    }
    
    this.emit('auto-gc-changed', enabled);
  }

  /**
   * Set memory pressure thresholds
   */
  setMemoryThresholds(pressure: number, warning: number): void {
    this.memoryPressureThreshold = Math.max(0.5, Math.min(1.0, pressure));
    this.memoryWarningThreshold = Math.max(0.5, Math.min(1.0, warning));
    
    this.emit('thresholds-changed', {
      pressure: this.memoryPressureThreshold,
      warning: this.memoryWarningThreshold
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
    
    if (this.gcScheduleInterval) {
      clearInterval(this.gcScheduleInterval);
      this.gcScheduleInterval = null;
    }
    
    // Clear all object pools
    this.objectPools.forEach((pool) => {
      (pool as GameByteObjectPool<any>).clear();
    });
    this.objectPools.clear();
    
    // Clear history
    this.memoryHistory.length = 0;
    this.memoryLeaks.length = 0;
    
    this.removeAllListeners();
    this.isInitialized = false;
  }
}