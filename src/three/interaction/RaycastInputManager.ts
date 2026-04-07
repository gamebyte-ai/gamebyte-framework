import { EventEmitter } from 'eventemitter3';
import { WorldObject3D } from './WorldObject3D.js';

/**
 * Duck-typed camera interface — avoids importing THREE.Camera so this file
 * can be tested without a WebGL context.
 */
interface DuckCamera {
  [key: string]: any;
}

/**
 * Duck-typed scene interface.
 */
interface DuckScene {
  children?: any[];
  [key: string]: any;
}

/**
 * Duck-typed raycaster interface that mirrors THREE.Raycaster.
 */
interface DuckRaycaster {
  setFromCamera(coords: { x: number; y: number }, camera: DuckCamera): void;
  intersectObject(object: any, recursive: boolean): Array<{ object: any }>;
  intersectObjects(objects: any[], recursive: boolean): Array<{ object: any }>;
  [key: string]: any;
}

/**
 * Events emitted by RaycastInputManager.
 */
export interface RaycastInputManagerEvents {
  'pointerdown': (event: PointerEvent | MouseEvent, hitHandler: WorldObject3D | null) => void;
  'pointermove': (event: PointerEvent | MouseEvent, hitHandler: WorldObject3D | null) => void;
  'pointerup': (event: PointerEvent | MouseEvent, hitHandler: WorldObject3D | null) => void;
}

/**
 * RaycastInputManager — broadcasts pointer events with raycast hit info to
 * all registered WorldObject3D handlers.
 *
 * Internal flow on each pointer event:
 * 1. Convert mouse client coords to NDC: x = (clientX − rect.left) / rect.width * 2 − 1
 * 2. If raycaster + camera + scene are set: cast a ray and walk each
 *    intersection's parent chain to find the first registered handler.
 * 3. Broadcast to ALL handlers; isRaycasted is true only for the hit handler.
 * 4. Track hover enter/leave across frames.
 *
 * @example
 * ```typescript
 * const manager = new RaycastInputManager();
 * manager.attach(canvas);
 * manager.setCamera(camera);
 * manager.setScene(scene);
 * manager.setRaycaster(new THREE.Raycaster());
 *
 * const obj = new WorldObject3D();
 * manager.addHandler(obj);
 * manager.startListening();
 * ```
 */
export class RaycastInputManager extends EventEmitter<RaycastInputManagerEvents> {
  private canvas: HTMLElement | null = null;
  private camera: DuckCamera | null = null;
  private scene: DuckScene | null = null;
  private raycaster: DuckRaycaster | null = null;

  private handlers: Set<WorldObject3D> = new Set();
  private hoveredHandler: WorldObject3D | null = null;
  private listening: boolean = false;

  // Bound event listeners kept for clean removal
  private _onPointerDown: (e: PointerEvent | MouseEvent) => void;
  private _onPointerMove: (e: PointerEvent | MouseEvent) => void;
  private _onPointerUp: (e: PointerEvent | MouseEvent) => void;

  constructor() {
    super();

    this._onPointerDown = (e) => this._handlePointer('down', e);
    this._onPointerMove = (e) => this._handlePointer('move', e);
    this._onPointerUp = (e) => this._handlePointer('up', e);
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Set the canvas element that pointer events will be read from.
   * Call before startListening().
   */
  public attach(canvas: HTMLElement): void {
    this.canvas = canvas;
  }

  /** Set the Three.js camera used for ray projection. */
  public setCamera(camera: DuckCamera): void {
    this.camera = camera;
  }

  /** Set the Three.js scene whose children are raycasted against. */
  public setScene(scene: DuckScene): void {
    this.scene = scene;
  }

  /** Provide a THREE.Raycaster instance (duck-typed). */
  public setRaycaster(raycaster: DuckRaycaster): void {
    this.raycaster = raycaster;
  }

  // ---------------------------------------------------------------------------
  // Handler registration
  // ---------------------------------------------------------------------------

  /** Register a WorldObject3D to receive pointer broadcasts. */
  public addHandler(handler: WorldObject3D): void {
    this.handlers.add(handler);
  }

  /** Unregister a WorldObject3D. Clears hover state if it was hovered. */
  public removeHandler(handler: WorldObject3D): void {
    if (this.hoveredHandler === handler) {
      handler.handlePointerLeave();
      this.hoveredHandler = null;
    }
    this.handlers.delete(handler);
  }

  /** Number of currently registered handlers. */
  public get handlerCount(): number {
    return this.handlers.size;
  }

  // ---------------------------------------------------------------------------
  // Listening lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Attach pointer event listeners to the canvas.
   * No-op if already listening or no canvas set.
   */
  public startListening(): void {
    if (this.listening || !this.canvas) return;

    this.canvas.addEventListener('pointerdown', this._onPointerDown as EventListener);
    this.canvas.addEventListener('pointermove', this._onPointerMove as EventListener);
    this.canvas.addEventListener('pointerup', this._onPointerUp as EventListener);

    this.listening = true;
  }

  /**
   * Remove pointer event listeners from the canvas.
   * No-op if not currently listening.
   */
  public stopListening(): void {
    if (!this.listening || !this.canvas) return;

    this.canvas.removeEventListener('pointerdown', this._onPointerDown as EventListener);
    this.canvas.removeEventListener('pointermove', this._onPointerMove as EventListener);
    this.canvas.removeEventListener('pointerup', this._onPointerUp as EventListener);

    this.listening = false;
  }

  // ---------------------------------------------------------------------------
  // Manual broadcast (also used internally)
  // ---------------------------------------------------------------------------

  /**
   * Manually broadcast a pointer-down event to all handlers.
   * Useful for testing or forwarding synthetic events.
   *
   * @param event - The pointer/mouse event
   * @param raycasted - The handler that was directly hit (or null)
   */
  public broadcastPointerDown(event: any, raycasted: WorldObject3D | null): void {
    this._broadcast('down', event, raycasted);
  }

  /**
   * Manually broadcast a pointer-move event.
   */
  public broadcastPointerMove(event: any, raycasted: WorldObject3D | null): void {
    this._broadcast('move', event, raycasted);
  }

  /**
   * Manually broadcast a pointer-up event.
   */
  public broadcastPointerUp(event: any, raycasted: WorldObject3D | null): void {
    this._broadcast('up', event, raycasted);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Stop listening, clear all handlers, and remove all event listeners.
   */
  public destroy(): void {
    this.stopListening();

    // Fire pointer-leave on any currently hovered handler
    if (this.hoveredHandler) {
      this.hoveredHandler.handlePointerLeave();
      this.hoveredHandler = null;
    }

    this.handlers.clear();
    this.removeAllListeners();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Entry point for all pointer events from the canvas.
   */
  private _handlePointer(type: 'down' | 'move' | 'up', event: PointerEvent | MouseEvent): void {
    const hitHandler = this._findHitHandler(event);

    // Update hover state on move
    if (type === 'move') {
      this._updateHover(hitHandler);
    }

    this._broadcast(type, event, hitHandler);
  }

  /**
   * Cast a ray and return the first registered WorldObject3D that was hit,
   * or null if no hit / raycasting is not configured.
   */
  private _findHitHandler(event: { clientX: number; clientY: number }): WorldObject3D | null {
    if (!this.raycaster || !this.camera || !this.canvas) {
      return null;
    }

    // Convert client coords to NDC
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera({ x, y }, this.camera);

    // Collect all scene children or handler-associated meshes
    let targets: any[] = [];
    if (this.scene && Array.isArray(this.scene.children)) {
      targets = this.scene.children;
    }

    if (targets.length === 0) return null;

    const intersections = this.raycaster.intersectObjects(targets, true);
    if (intersections.length === 0) return null;

    // Walk the parent chain of the nearest hit to find a registered handler
    return this._resolveHandler(intersections[0].object);
  }

  /**
   * Walk up the parent chain of a Three.js object to find the first
   * WorldObject3D registered as a handler (using userData.worldObject3D).
   * If no match is found via userData, return null.
   */
  private _resolveHandler(object: any): WorldObject3D | null {
    let current = object;
    while (current) {
      if (current.userData && current.userData.worldObject3D instanceof WorldObject3D) {
        const handler = current.userData.worldObject3D as WorldObject3D;
        if (this.handlers.has(handler) && handler.interactive) {
          return handler;
        }
      }
      current = current.parent ?? null;
    }
    return null;
  }

  /**
   * Update hover enter/leave state based on the current hit handler.
   */
  private _updateHover(newHit: WorldObject3D | null): void {
    if (newHit === this.hoveredHandler) return;

    if (this.hoveredHandler) {
      this.hoveredHandler.handlePointerLeave();
    }

    this.hoveredHandler = newHit;

    if (this.hoveredHandler) {
      this.hoveredHandler.handlePointerEnter();
    }
  }

  /**
   * Broadcast an event type to all interactive handlers.
   */
  private _broadcast(
    type: 'down' | 'move' | 'up',
    event: any,
    hitHandler: WorldObject3D | null
  ): void {
    const eventName =
      type === 'down' ? 'pointerdown' : type === 'move' ? 'pointermove' : 'pointerup';

    this.emit(eventName, event, hitHandler);

    this.handlers.forEach((handler) => {
      if (!handler.interactive) return;

      const isRaycasted = handler === hitHandler;

      if (type === 'down') {
        handler.handlePointerDown(event, isRaycasted);
      } else if (type === 'move') {
        handler.handlePointerMove(event, isRaycasted);
      } else {
        handler.handlePointerUp(event, isRaycasted);
      }
    });
  }
}
