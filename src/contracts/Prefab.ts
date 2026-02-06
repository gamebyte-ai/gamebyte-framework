/**
 * Primitive shape configuration for visual components.
 */
export interface PrimitiveConfig {
  shape: 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'torus';
  color?: number;
  size?: number | [number, number, number];
}

/**
 * JSON-serializable prefab definition.
 */
export interface PrefabConfig {
  id: string;
  name: string;
  visual: {
    type: 'model' | 'primitive';
    url?: string;
    primitive?: PrimitiveConfig;
  };
  transform?: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
  };
  physics?: {
    type: 'static' | 'dynamic' | 'kinematic';
    mass?: number;
    collider?: string;
  };
  audio?: {
    ambient?: string;
    onSpawn?: string;
  };
  components?: Record<string, unknown>;
  tags?: string[];
  /** Template inheritance - deep-merges parent config */
  extends?: string;
}

/**
 * Component lifecycle hooks.
 */
export interface ComponentLifecycle {
  onAttach?(entity: IEntity): void;
  onDetach?(entity: IEntity): void;
  onUpdate?(entity: IEntity, delta: number): void;
  onDestroy?(entity: IEntity): void;
}

/**
 * Spawned entity instance.
 */
export interface IEntity {
  readonly id: string;
  readonly prefabId: string;
  readonly object: any; // THREE.Object3D or IContainer
  getComponent<T>(name: string): T | undefined;
  addComponent(name: string, component: unknown): void;
  removeComponent(name: string): void;
  hasComponent(name: string): boolean;
  getTags(): string[];
  hasTag(tag: string): boolean;
  destroy(): void;
}

/**
 * Prefab system contract.
 */
export interface IPrefabSystem {
  register(config: PrefabConfig): void;
  registerFromJSON(json: unknown): void;
  spawn(prefabId: string, overrides?: Partial<PrefabConfig['transform']>): Promise<IEntity>;
  has(prefabId: string): boolean;
  despawn(entity: IEntity): void;
  getEntities(): IEntity[];
  getEntitiesByTag(tag: string): IEntity[];
  serialize(): string;
  deserialize(data: string): Promise<void>;
  dispose(): void;
}
