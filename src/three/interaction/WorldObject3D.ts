import { EventEmitter } from 'eventemitter3';

/**
 * Events emitted by WorldObject3D
 */
export interface WorldObject3DEvents {
  'pointerdown': (event: any, isRaycasted: boolean) => void;
  'pointermove': (event: any, isRaycasted: boolean) => void;
  'pointerup': (event: any, isRaycasted: boolean) => void;
  'pointerenter': () => void;
  'pointerleave': () => void;
}

/**
 * Base class for interactive 3D objects in the GameByte framework.
 *
 * WorldObject3D is intentionally NOT a THREE.Group subclass — it is a pure
 * event-emitting controller that users compose with their Three.js meshes/
 * groups. This keeps it testable without a WebGL context and lets bundlers
 * tree-shake Three.js when it is not needed.
 *
 * @example
 * ```typescript
 * const obj = new WorldObject3D();
 * obj.on('pointerdown', (event, isRaycasted) => {
 *   if (isRaycasted) console.log('directly hit!');
 * });
 *
 * // Register with RaycastInputManager so it receives pointer broadcasts
 * raycastManager.addHandler(obj);
 * ```
 */
export class WorldObject3D extends EventEmitter<WorldObject3DEvents> {
  /** Whether this object participates in raycasting. Default: true. */
  public interactive: boolean = true;

  private _isHovered: boolean = false;

  /** Returns true while the pointer is over this object. */
  public get isHovered(): boolean {
    return this._isHovered;
  }

  /**
   * Called by RaycastInputManager on pointer-down events.
   *
   * @param event - The original pointer/mouse event
   * @param isRaycasted - true when this object is the direct raycast hit
   */
  public handlePointerDown(event: any, isRaycasted: boolean): void {
    this.emit('pointerdown', event, isRaycasted);
  }

  /**
   * Called by RaycastInputManager on pointer-move events.
   *
   * @param event - The original pointer/mouse event
   * @param isRaycasted - true when this object is the direct raycast hit
   */
  public handlePointerMove(event: any, isRaycasted: boolean): void {
    this.emit('pointermove', event, isRaycasted);
  }

  /**
   * Called by RaycastInputManager on pointer-up events.
   *
   * @param event - The original pointer/mouse event
   * @param isRaycasted - true when this object is the direct raycast hit
   */
  public handlePointerUp(event: any, isRaycasted: boolean): void {
    this.emit('pointerup', event, isRaycasted);
  }

  /**
   * Called by RaycastInputManager when the pointer enters this object.
   * Sets isHovered to true and emits 'pointerenter'.
   */
  public handlePointerEnter(): void {
    this._isHovered = true;
    this.emit('pointerenter');
  }

  /**
   * Called by RaycastInputManager when the pointer leaves this object.
   * Sets isHovered to false and emits 'pointerleave'.
   */
  public handlePointerLeave(): void {
    this._isHovered = false;
    this.emit('pointerleave');
  }

  /**
   * Clean up all listeners and reset state.
   */
  public destroy(): void {
    this._isHovered = false;
    this.removeAllListeners();
  }
}
