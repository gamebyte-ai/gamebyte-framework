/**
 * 3D pointer event types mirroring DOM PointerEvent types.
 */
export type PointerEvent3DType =
  | 'click'
  | 'dblclick'
  | 'contextmenu'
  | 'pointerdown'
  | 'pointerup'
  | 'pointermove'
  | 'pointerenter'
  | 'pointerleave'
  | 'pointerover'
  | 'pointerout';

/**
 * 3D pointer event data passed to event handlers.
 * Mirrors DOM PointerEvent structure for familiarity.
 */
export interface PointerEvent3DData {
  type: PointerEvent3DType;
  /** The object that originally received the event */
  target: any; // THREE.Object3D
  /** The object currently handling the event (during bubble) */
  currentTarget: any; // THREE.Object3D
  /** World-space intersection point */
  point: { x: number; y: number; z: number };
  /** Distance from camera to intersection */
  distance: number;
  /** Surface normal at intersection (null if unavailable) */
  normal: { x: number; y: number; z: number } | null;
  /** UV coordinates at intersection (null if unavailable) */
  uv: { x: number; y: number } | null;
  /** Original DOM event */
  nativeEvent: PointerEvent | MouseEvent | TouchEvent;
  /** Stop event from bubbling to parent objects */
  stopPropagation(): void;
  /** Pointer movement delta since last event */
  delta: { x: number; y: number };
  /** Pointer ID for multi-touch */
  pointerId: number;
}

/**
 * Event handler signature for 3D pointer events.
 */
export type PointerEvent3DHandler = (event: PointerEvent3DData) => void;

/**
 * Core 3D pointer event system contract.
 */
export interface IRaycastEventSystem {
  /** Enable raycasting on an object (make it interactive) */
  enable(object: any): void;
  /** Disable raycasting on an object */
  disable(object: any): void;
  /** Add event handler to an object */
  on(object: any, type: PointerEvent3DType, handler: PointerEvent3DHandler): void;
  /** Remove event handler from an object */
  off(object: any, type: PointerEvent3DType, handler: PointerEvent3DHandler): void;
  /** Set scene, camera and DOM element for raycasting */
  setScene(scene: any, camera: any, domElement: HTMLElement): void;
  /** Manual update (for use in tick loop) */
  update(): void;
  /** Cleanup and remove all listeners */
  destroy(): void;
}
