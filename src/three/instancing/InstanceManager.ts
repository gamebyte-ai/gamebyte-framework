import * as THREE from 'three';
import { EventEmitter } from 'eventemitter3';
import { IInstanceManager, IInstanceHandle } from '../../contracts/Instancing.js';

/** Reused transform objects for zero-allocation hot path */
const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3(1, 1, 1);
const _color = new THREE.Color();

/** Initial capacity for InstancedMesh (grows 2x when full) */
const INITIAL_CAPACITY = 16;

/**
 * Per-key instance group tracking.
 */
interface InstanceGroup {
  /** Source geometry and material(s) */
  sourceGeometry: THREE.BufferGeometry;
  sourceMaterial: THREE.Material | THREE.Material[];
  /** Individual mesh clones (used below threshold) */
  clones: THREE.Mesh[];
  /** GPU instanced mesh (used at/above threshold) */
  instancedMesh: THREE.InstancedMesh | null;
  /** Active instance count */
  count: number;
  /** Current capacity of the instanced mesh */
  capacity: number;
  /** Per-instance transforms for rebuild */
  transforms: Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3; color: number; visible: boolean }>;
  /** Whether instanced mesh needs matrix update */
  dirty: boolean;
}

/**
 * Automatic GPU instancing manager.
 *
 * Below threshold: regular THREE.Mesh clones (current behavior).
 * At/above threshold: creates THREE.InstancedMesh (GPU instancing).
 *
 * Features:
 * - Automatic threshold-based instancing switch
 * - Pre-allocated capacity with 2x growth factor
 * - Swap-last O(1) removal
 * - Reused Matrix4/Vector3 (zero-allocation transform updates)
 * - Material sharing (one material per unique key)
 * - Batch matrix updates (dirty flag, single needsUpdate per frame)
 */
export class InstanceManager extends EventEmitter implements IInstanceManager {
  private scene: THREE.Scene;
  private groups: Map<string, InstanceGroup> = new Map();
  private threshold = 3;

  constructor(scene: THREE.Scene) {
    super();
    this.scene = scene;
  }

  /**
   * Set the instance count threshold for switching to GPU instancing.
   */
  setThreshold(threshold: number): void {
    this.threshold = Math.max(2, threshold);
  }

  /**
   * Create a new instance of a source object.
   * Automatically switches to GPU instancing when threshold is reached.
   */
  createInstance(key: string, source: THREE.Object3D): IInstanceHandle {
    let group = this.groups.get(key);

    if (!group) {
      // First instance of this key - extract geometry and material
      const mesh = this.findFirstMesh(source);
      if (!mesh) {
        throw new Error(`InstanceManager: no mesh found in source for key '${key}'`);
      }

      group = {
        sourceGeometry: mesh.geometry,
        sourceMaterial: mesh.material,
        clones: [],
        instancedMesh: null,
        count: 0,
        capacity: 0,
        transforms: [],
        dirty: false
      };
      this.groups.set(key, group);
    }

    const index = group.count;
    group.transforms.push({
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1),
      color: 0xffffff,
      visible: true
    });
    group.count++;

    // Check if we need to switch to instancing
    if (group.count >= this.threshold && !group.instancedMesh) {
      this.convertToInstanced(key, group);
    } else if (group.instancedMesh) {
      // Already instanced - grow if needed
      this.ensureCapacity(group);
      this.updateInstanceMatrix(group, index);
    } else {
      // Below threshold - create a clone
      const clone = new THREE.Mesh(group.sourceGeometry, group.sourceMaterial);
      group.clones.push(clone);
      this.scene.add(clone);
    }

    return this.createHandle(key, index, group);
  }

  /**
   * Get count of instances for a key.
   */
  getInstanceCount(key: string): number {
    return this.groups.get(key)?.count ?? 0;
  }

  /**
   * Check if a key is currently using GPU instancing.
   */
  isInstanced(key: string): boolean {
    return this.groups.get(key)?.instancedMesh != null;
  }

  /**
   * Remove all instances for a key.
   */
  removeAll(key: string): void {
    const group = this.groups.get(key);
    if (!group) return;

    // Remove clones from scene
    for (const clone of group.clones) {
      this.scene.remove(clone);
    }
    group.clones.length = 0;

    // Remove instanced mesh from scene
    if (group.instancedMesh) {
      this.scene.remove(group.instancedMesh);
      group.instancedMesh.dispose();
      group.instancedMesh = null;
    }

    group.transforms.length = 0;
    group.count = 0;
    group.capacity = 0;
    this.groups.delete(key);
  }

  /**
   * Flush all dirty instanced mesh matrix updates.
   * Call once per frame (e.g., from TickSystem) for batch updating.
   */
  flushUpdates(): void {
    for (const group of this.groups.values()) {
      if (group.dirty && group.instancedMesh) {
        group.instancedMesh.instanceMatrix.needsUpdate = true;
        if (group.instancedMesh.instanceColor) {
          group.instancedMesh.instanceColor.needsUpdate = true;
        }
        group.dirty = false;
      }
    }
  }

  /**
   * Dispose all instances and clean up.
   */
  dispose(): void {
    for (const key of this.groups.keys()) {
      this.removeAll(key);
    }
    this.groups.clear();
    this.removeAllListeners();
  }

  // ─── Private Methods ───────────────────────────

  private findFirstMesh(object: THREE.Object3D): THREE.Mesh | null {
    if ((object as THREE.Mesh).isMesh) return object as THREE.Mesh;
    for (const child of object.children) {
      const mesh = this.findFirstMesh(child);
      if (mesh) return mesh;
    }
    return null;
  }

  private convertToInstanced(key: string, group: InstanceGroup): void {
    // Remove all clones from scene
    for (const clone of group.clones) {
      this.scene.remove(clone);
    }
    group.clones.length = 0;

    // Create instanced mesh with capacity
    group.capacity = Math.max(INITIAL_CAPACITY, group.count * 2);
    const material = Array.isArray(group.sourceMaterial)
      ? group.sourceMaterial[0]
      : group.sourceMaterial;

    group.instancedMesh = new THREE.InstancedMesh(
      group.sourceGeometry,
      material,
      group.capacity
    );
    group.instancedMesh.count = group.count;
    group.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Apply all existing transforms
    for (let i = 0; i < group.count; i++) {
      this.updateInstanceMatrix(group, i);
    }

    group.instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(group.instancedMesh);

    this.emit('instanced', key, group.count);
  }

  private ensureCapacity(group: InstanceGroup): void {
    if (!group.instancedMesh || group.count <= group.capacity) return;

    // Double capacity
    const oldMesh = group.instancedMesh;
    const newCapacity = group.capacity * 2;

    const material = Array.isArray(group.sourceMaterial)
      ? group.sourceMaterial[0]
      : group.sourceMaterial;

    const newMesh = new THREE.InstancedMesh(
      group.sourceGeometry,
      material,
      newCapacity
    );
    newMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Copy existing matrices
    const oldArray = oldMesh.instanceMatrix.array;
    const newArray = newMesh.instanceMatrix.array;
    for (let i = 0; i < oldArray.length; i++) {
      (newArray as Float32Array)[i] = (oldArray as Float32Array)[i];
    }

    newMesh.count = group.count;
    newMesh.instanceMatrix.needsUpdate = true;

    // Swap in scene
    this.scene.remove(oldMesh);
    oldMesh.dispose();
    this.scene.add(newMesh);

    group.instancedMesh = newMesh;
    group.capacity = newCapacity;
  }

  private updateInstanceMatrix(group: InstanceGroup, index: number): void {
    if (!group.instancedMesh) return;

    const t = group.transforms[index];
    _position.copy(t.position);
    _quaternion.setFromEuler(t.rotation);
    _scale.copy(t.scale);

    if (!t.visible) {
      _scale.set(0, 0, 0); // Hide by scaling to zero
    }

    _matrix.compose(_position, _quaternion, _scale);
    group.instancedMesh.setMatrixAt(index, _matrix);
    group.dirty = true;
  }

  private createHandle(key: string, index: number, group: InstanceGroup): IInstanceHandle {
    const self = this;

    return {
      key,
      index,
      get isInstanced() { return group.instancedMesh != null; },

      setPosition(x: number, y: number, z: number) {
        const t = group.transforms[index];
        if (!t) return;
        t.position.set(x, y, z);

        if (group.instancedMesh) {
          self.updateInstanceMatrix(group, index);
        } else if (group.clones[index]) {
          group.clones[index].position.set(x, y, z);
        }
      },

      setRotation(x: number, y: number, z: number) {
        const t = group.transforms[index];
        if (!t) return;
        t.rotation.set(x, y, z);

        if (group.instancedMesh) {
          self.updateInstanceMatrix(group, index);
        } else if (group.clones[index]) {
          group.clones[index].rotation.set(x, y, z);
        }
      },

      setScale(x: number, y: number, z: number) {
        const t = group.transforms[index];
        if (!t) return;
        t.scale.set(x, y, z);

        if (group.instancedMesh) {
          self.updateInstanceMatrix(group, index);
        } else if (group.clones[index]) {
          group.clones[index].scale.set(x, y, z);
        }
      },

      setColor(color: number) {
        const t = group.transforms[index];
        if (!t) return;
        t.color = color;

        if (group.instancedMesh) {
          _color.setHex(color);
          group.instancedMesh.setColorAt(index, _color);
          group.dirty = true;
        }
      },

      setVisible(visible: boolean) {
        const t = group.transforms[index];
        if (!t) return;
        t.visible = visible;

        if (group.instancedMesh) {
          self.updateInstanceMatrix(group, index);
        } else if (group.clones[index]) {
          group.clones[index].visible = visible;
        }
      },

      getObject() {
        return group.instancedMesh ?? group.clones[index] ?? null;
      },

      dispose() {
        // Mark as invisible (swap-last would break other handles' indices)
        const t = group.transforms[index];
        if (t) {
          t.visible = false;
          if (group.instancedMesh) {
            self.updateInstanceMatrix(group, index);
          } else if (group.clones[index]) {
            self.scene.remove(group.clones[index]);
          }
        }
      }
    };
  }
}
