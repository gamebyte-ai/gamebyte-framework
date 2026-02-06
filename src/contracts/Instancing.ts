/**
 * Handle for a single instance within an instanced group.
 * Provides per-instance transform and visibility control.
 */
export interface IInstanceHandle {
  readonly key: string;
  readonly index: number;
  readonly isInstanced: boolean;
  setPosition(x: number, y: number, z: number): void;
  setRotation(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
  setColor(color: number): void;
  setVisible(visible: boolean): void;
  /** Get the underlying Object3D (mesh clone or InstancedMesh) */
  getObject(): any;
  dispose(): void;
}

/**
 * Instance manager contract for automatic GPU instancing.
 */
export interface IInstanceManager {
  createInstance(key: string, source: any): IInstanceHandle;
  getInstanceCount(key: string): number;
  isInstanced(key: string): boolean;
  setThreshold(threshold: number): void;
  removeAll(key: string): void;
  dispose(): void;
}
