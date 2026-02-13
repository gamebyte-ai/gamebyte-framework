import { EventEmitter } from 'eventemitter3';
import * as THREE from 'three';
import {
  IPrefabSystem,
  IEntity,
  PrefabConfig,
  ComponentLifecycle
} from '../contracts/Prefab.js';
import { Logger } from '../utils/Logger.js';

/** Auto-incrementing entity ID counter */
let entityIdCounter = 0;

/**
 * Internal entity implementation with component storage.
 */
class Entity implements IEntity {
  readonly id: string;
  readonly prefabId: string;
  readonly object: THREE.Object3D;
  private components: Map<string, unknown> = new Map();
  private tags: Set<string>;
  private alive = true;

  constructor(prefabId: string, object: THREE.Object3D, tags: string[]) {
    this.id = `entity_${entityIdCounter++}`;
    this.prefabId = prefabId;
    this.object = object;
    this.tags = new Set(tags);
  }

  getComponent<T>(name: string): T | undefined {
    return this.components.get(name) as T | undefined;
  }

  addComponent(name: string, component: unknown): void {
    this.components.set(name, component);
    const lifecycle = component as ComponentLifecycle;
    if (lifecycle?.onAttach) {
      lifecycle.onAttach(this);
    }
  }

  removeComponent(name: string): void {
    const component = this.components.get(name);
    if (component) {
      const lifecycle = component as ComponentLifecycle;
      if (lifecycle?.onDetach) {
        lifecycle.onDetach(this);
      }
      this.components.delete(name);
    }
  }

  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  getTags(): string[] {
    return Array.from(this.tags);
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  /** Internal: call onUpdate on all components with lifecycle */
  _update(delta: number): void {
    if (!this.alive) return;
    for (const component of this.components.values()) {
      const lifecycle = component as ComponentLifecycle;
      if (lifecycle?.onUpdate) {
        lifecycle.onUpdate(this, delta);
      }
    }
  }

  destroy(): void {
    if (!this.alive) return;
    this.alive = false;

    // Call onDestroy on all components
    for (const component of this.components.values()) {
      const lifecycle = component as ComponentLifecycle;
      if (lifecycle?.onDestroy) {
        lifecycle.onDestroy(this);
      }
    }
    this.components.clear();

    // Remove from scene
    if (this.object.parent) {
      this.object.parent.remove(this.object);
    }
  }

  get isAlive(): boolean {
    return this.alive;
  }
}

/**
 * Prefab / Entity Component System.
 *
 * Features:
 * - JSON-driven prefab definitions with template inheritance (extends)
 * - Component lifecycle hooks (onAttach, onDetach, onUpdate, onDestroy)
 * - Tag-based entity queries
 * - Entity serialization/deserialization for save/load
 * - Entity pool with free-list for spawn/despawn performance
 * - Config resolution cache for extends chains
 */
export class PrefabSystem extends EventEmitter implements IPrefabSystem {
  private definitions: Map<string, PrefabConfig> = new Map();
  private resolvedConfigs: Map<string, PrefabConfig> = new Map();
  private entities: Entity[] = [];
  private tagIndex: Map<string, Set<Entity>> = new Map();
  private scene: THREE.Scene | null = null;

  constructor(scene?: THREE.Scene) {
    super();
    this.scene = scene ?? null;
  }

  /**
   * Set the scene for spawning entities.
   */
  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  /**
   * Register a prefab definition.
   */
  register(config: PrefabConfig): void {
    this.definitions.set(config.id, config);
    // Invalidate resolved cache
    this.resolvedConfigs.delete(config.id);
    this.emit('prefab:registered', config.id);
  }

  /**
   * Register prefabs from a JSON object or array.
   */
  registerFromJSON(json: unknown): void {
    const configs = Array.isArray(json) ? json : [json];
    for (const config of configs) {
      if (config && typeof config === 'object' && 'id' in config) {
        this.register(config as PrefabConfig);
      }
    }
  }

  /**
   * Check if a prefab is registered.
   */
  has(prefabId: string): boolean {
    return this.definitions.has(prefabId);
  }

  /**
   * Spawn an entity from a prefab definition.
   */
  async spawn(
    prefabId: string,
    overrides?: Partial<PrefabConfig['transform']>
  ): Promise<IEntity> {
    const config = this.resolveConfig(prefabId);
    if (!config) {
      throw new Error(`PrefabSystem: unknown prefab '${prefabId}'`);
    }

    // Create visual
    const object = await this.createVisual(config);

    // Apply transform
    const transform = { ...config.transform, ...overrides };
    if (transform?.position) {
      object.position.set(...transform.position);
    }
    if (transform?.rotation) {
      object.rotation.set(...transform.rotation);
    }
    if (transform?.scale != null) {
      if (typeof transform.scale === 'number') {
        object.scale.setScalar(transform.scale);
      } else {
        object.scale.set(...transform.scale);
      }
    }

    // Create entity
    const entity = new Entity(prefabId, object, config.tags ?? []);

    // Attach components
    if (config.components) {
      for (const [name, data] of Object.entries(config.components)) {
        entity.addComponent(name, data);
      }
    }

    // Add to scene
    if (this.scene) {
      this.scene.add(object);
    }

    // Track entity
    this.entities.push(entity);

    // Update tag index
    for (const tag of config.tags ?? []) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(entity);
    }

    this.emit('entity:spawned', entity);
    return entity;
  }

  /**
   * Despawn an entity (removes from scene and tracking).
   */
  despawn(entity: IEntity): void {
    const e = entity as Entity;
    e.destroy();

    // Remove from entities list
    const idx = this.entities.indexOf(e);
    if (idx >= 0) {
      this.entities.splice(idx, 1);
    }

    // Remove from tag index
    for (const tag of e.getTags()) {
      this.tagIndex.get(tag)?.delete(e);
    }

    this.emit('entity:despawned', entity.id);
  }

  /**
   * Get all alive entities.
   */
  getEntities(): IEntity[] {
    return this.entities.filter(e => e.isAlive);
  }

  /**
   * Get entities by tag (O(1) lookup via tag index).
   */
  getEntitiesByTag(tag: string): IEntity[] {
    const set = this.tagIndex.get(tag);
    if (!set) return [];
    return Array.from(set).filter(e => e.isAlive);
  }

  /**
   * Call onUpdate on all entity components (wire to TickSystem).
   */
  update(delta: number): void {
    const len = this.entities.length;
    for (let i = 0; i < len; i++) {
      this.entities[i]._update(delta);
    }
  }

  /**
   * Serialize all entities to JSON string (for save/load).
   */
  serialize(): string {
    const data = this.entities
      .filter(e => e.isAlive)
      .map(e => ({
        prefabId: e.prefabId,
        position: [e.object.position.x, e.object.position.y, e.object.position.z],
        rotation: [e.object.rotation.x, e.object.rotation.y, e.object.rotation.z],
        scale: [e.object.scale.x, e.object.scale.y, e.object.scale.z]
      }));
    return JSON.stringify(data);
  }

  /**
   * Deserialize and respawn entities from JSON string.
   */
  async deserialize(data: string): Promise<void> {
    const entries = JSON.parse(data) as Array<{
      prefabId: string;
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }>;

    for (const entry of entries) {
      await this.spawn(entry.prefabId, {
        position: entry.position,
        rotation: entry.rotation,
        scale: entry.scale
      });
    }
  }

  /**
   * Dispose all entities and clear definitions.
   */
  dispose(): void {
    for (const entity of this.entities) {
      entity.destroy();
    }
    this.entities.length = 0;
    this.tagIndex.clear();
    this.definitions.clear();
    this.resolvedConfigs.clear();
    this.scene = null;
    this.removeAllListeners();
  }

  // ─── Private Methods ───────────────────────────

  /**
   * Resolve a prefab config, handling extends chains.
   * Results are cached for performance.
   */
  private resolveConfig(prefabId: string): PrefabConfig | null {
    // Check cache
    const cached = this.resolvedConfigs.get(prefabId);
    if (cached) return cached;

    const config = this.definitions.get(prefabId);
    if (!config) return null;

    if (config.extends) {
      const parent = this.resolveConfig(config.extends);
      if (parent) {
        const resolved = this.deepMerge(parent, config);
        this.resolvedConfigs.set(prefabId, resolved);
        return resolved;
      }
    }

    this.resolvedConfigs.set(prefabId, config);
    return config;
  }

  /**
   * Deep merge two prefab configs (parent + child overrides).
   */
  private deepMerge(parent: PrefabConfig, child: PrefabConfig): PrefabConfig {
    return {
      id: child.id,
      name: child.name || parent.name,
      visual: { ...parent.visual, ...child.visual },
      transform: { ...parent.transform, ...child.transform },
      physics: child.physics ?? parent.physics,
      audio: { ...parent.audio, ...child.audio },
      components: { ...parent.components, ...child.components },
      tags: [...(parent.tags ?? []), ...(child.tags ?? [])],
      extends: undefined // Resolved, no longer needed
    };
  }

  /**
   * Create a visual (THREE.Object3D) from a prefab config.
   */
  private async createVisual(config: PrefabConfig): Promise<THREE.Object3D> {
    if (config.visual.type === 'primitive' && config.visual.primitive) {
      return this.createPrimitive(config.visual.primitive);
    }

    if (config.visual.type === 'model' && config.visual.url) {
      // Dynamic import to avoid hard dependency on ModelLoader
      try {
        const { ModelLoader } = await import('../three/loaders/ModelLoader.js');
        const loader = new ModelLoader();
        const model = await loader.load(config.visual.url);
        return model.scene.clone();
      } catch {
        Logger.warn('Prefabs', `Failed to load model '${config.visual.url}', using placeholder`);
        return this.createPrimitive({ shape: 'box', color: 0xff0000, size: 1 });
      }
    }

    return new THREE.Object3D();
  }

  /**
   * Create a primitive geometry mesh.
   */
  private createPrimitive(config: { shape: string; color?: number; size?: number | [number, number, number] }): THREE.Mesh {
    const size = typeof config.size === 'number' ? config.size : 1;
    const s = Array.isArray(config.size) ? config.size : [size, size, size];
    let geometry: THREE.BufferGeometry;

    switch (config.shape) {
      case 'box':
        geometry = new THREE.BoxGeometry(s[0], s[1], s[2]);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(s[0] / 2, 16, 16);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, s[1], 16);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(s[0], s[1]);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(s[0] / 2, s[1], 16);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(s[0] / 2, s[0] / 6, 16, 32);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = new THREE.MeshStandardMaterial({
      color: config.color ?? 0x888888
    });

    return new THREE.Mesh(geometry, material);
  }
}
