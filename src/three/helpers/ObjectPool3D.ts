/**
 * ObjectPool3D - Generic object pooling for THREE.Object3D instances
 *
 * Manages a pool of reusable 3D objects to reduce garbage collection and improve performance.
 * Supports automatic scene management, lifecycle callbacks, and object recycling.
 *
 * @example
 * ```typescript
 * const enemyPool = new ObjectPool3D({
 *   factory: () => createEnemyMesh(),
 *   initialSize: 20,
 *   maxSize: 100,
 *   autoAddToScene: scene,
 *   onAcquire: (enemy) => {
 *     enemy.userData.health = 100;
 *     enemy.visible = true;
 *   },
 *   onRelease: (enemy) => {
 *     enemy.visible = false;
 *   }
 * });
 *
 * const enemy = enemyPool.acquire();
 * // ... use enemy ...
 * enemyPool.release(enemy);
 * ```
 */

import * as THREE from 'three';

export interface ObjectPool3DConfig<T extends THREE.Object3D> {
  /** Factory function to create new objects */
  factory: () => T;

  /** Number of objects to pre-allocate (default: 10) */
  initialSize?: number;

  /** Maximum pool size (default: 100) */
  maxSize?: number;

  /** Callback when object is acquired from pool */
  onAcquire?: (obj: T) => void;

  /** Callback when object is released back to pool */
  onRelease?: (obj: T) => void;

  /** Auto add/remove from scene when acquiring/releasing */
  autoAddToScene?: THREE.Scene | null;
}

/**
 * ObjectPool3D - Generic object pooling for THREE.Object3D
 */
export class ObjectPool3D<T extends THREE.Object3D> {
  private factory: () => T;
  private initialSize: number;
  private maxSize: number;
  private onAcquire?: (obj: T) => void;
  private onRelease?: (obj: T) => void;
  private autoAddToScene?: THREE.Scene | null;

  private available: T[] = [];
  private active: Set<T> = new Set();

  constructor(config: ObjectPool3DConfig<T>) {
    this.factory = config.factory;
    this.initialSize = config.initialSize ?? 10;
    this.maxSize = config.maxSize ?? 100;
    this.onAcquire = config.onAcquire;
    this.onRelease = config.onRelease;
    this.autoAddToScene = config.autoAddToScene;

    // Pre-allocate initial objects
    this.warmup(this.initialSize);
  }

  /**
   * Pre-create objects and add them to the pool
   */
  public warmup(count: number): void {
    const toCreate = Math.min(count, this.maxSize - this.getTotalCount());

    for (let i = 0; i < toCreate; i++) {
      const obj = this.factory();
      this.available.push(obj);
    }
  }

  /**
   * Get an object from the pool (creates new if pool is empty and under max size)
   */
  public acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      // Reuse object from pool
      obj = this.available.pop()!;
    } else if (this.getTotalCount() < this.maxSize) {
      // Create new object if under max size
      obj = this.factory();
    } else {
      // Pool exhausted - reuse oldest active object (emergency fallback)
      const oldest = this.active.values().next().value;
      if (oldest) {
        this.release(oldest);
        obj = this.available.pop()!;
      } else {
        // Should never happen, but create new object as last resort
        obj = this.factory();
      }
    }

    // Track as active
    this.active.add(obj);

    // Reset transform
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
    obj.scale.set(1, 1, 1);

    // Auto add to scene
    if (this.autoAddToScene) {
      this.autoAddToScene.add(obj);
    }

    // Call acquire callback
    if (this.onAcquire) {
      this.onAcquire(obj);
    }

    return obj;
  }

  /**
   * Return an object to the pool
   */
  public release(obj: T): void {
    // Check if object is tracked
    if (!this.active.has(obj)) {
      console.warn('ObjectPool3D: Attempting to release object not acquired from this pool');
      return;
    }

    // Remove from active set
    this.active.delete(obj);

    // Call release callback
    if (this.onRelease) {
      this.onRelease(obj);
    }

    // Auto remove from scene
    if (this.autoAddToScene && obj.parent === this.autoAddToScene) {
      this.autoAddToScene.remove(obj);
    }

    // Reset transform
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
    obj.scale.set(1, 1, 1);

    // Return to pool
    this.available.push(obj);
  }

  /**
   * Release all active objects back to the pool
   */
  public releaseAll(): void {
    // Create array copy to avoid modification during iteration
    const activeObjects = Array.from(this.active);

    for (const obj of activeObjects) {
      this.release(obj);
    }
  }

  /**
   * Get number of active (in-use) objects
   */
  public getActiveCount(): number {
    return this.active.size;
  }

  /**
   * Get number of available (pooled) objects
   */
  public getAvailableCount(): number {
    return this.available.length;
  }

  /**
   * Get total number of objects (active + available)
   */
  public getTotalCount(): number {
    return this.active.size + this.available.length;
  }

  /**
   * Dispose all objects and clear the pool
   */
  public destroy(): void {
    // Release all active objects first
    this.releaseAll();

    // Dispose all objects
    for (const obj of this.available) {
      this.disposeObject(obj);
    }

    // Clear arrays
    this.available = [];
    this.active.clear();
  }

  /**
   * Recursively dispose geometries and materials in an object hierarchy
   */
  private disposeObject(obj: T): void {
    obj.traverse((child) => {
      // Dispose geometry
      if ((child as any).geometry) {
        (child as any).geometry.dispose();
      }

      // Dispose material(s)
      if ((child as any).material) {
        const materials = Array.isArray((child as any).material)
          ? (child as any).material
          : [(child as any).material];

        for (const material of materials) {
          // Dispose textures
          if (material.map) material.map.dispose();
          if (material.lightMap) material.lightMap.dispose();
          if (material.bumpMap) material.bumpMap.dispose();
          if (material.normalMap) material.normalMap.dispose();
          if (material.specularMap) material.specularMap.dispose();
          if (material.envMap) material.envMap.dispose();
          if (material.alphaMap) material.alphaMap.dispose();
          if (material.aoMap) material.aoMap.dispose();
          if (material.displacementMap) material.displacementMap.dispose();
          if (material.emissiveMap) material.emissiveMap.dispose();
          if (material.gradientMap) material.gradientMap.dispose();
          if (material.metalnessMap) material.metalnessMap.dispose();
          if (material.roughnessMap) material.roughnessMap.dispose();

          // Dispose material
          material.dispose();
        }
      }
    });

    // Remove from parent if attached
    if (obj.parent) {
      obj.parent.remove(obj);
    }
  }
}
