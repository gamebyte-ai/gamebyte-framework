/**
 * GameCameraManager — Orchestrates switching between ICameraController3D implementations.
 *
 * Responsibilities:
 *   - Creates and owns a THREE.OrthographicCamera or THREE.PerspectiveCamera
 *   - Auto-switches camera type when a controller's `isOrthographic` flag differs
 *   - Smooth follow via exponential easing: t = 1 - Math.exp(-easing * dt)
 *   - Forwards each frame to the active controller via `apply(camera, pos, dt)`
 *
 * @example
 * ```typescript
 * const mgr = new GameCameraManager({ viewportWidth: 800, viewportHeight: 600 });
 * mgr.setController(new IsometricController());
 * mgr.followObject(player);
 *
 * // in game loop:
 * mgr.update(dt);
 * renderer.render(scene, mgr.getCamera());
 * ```
 */

import * as THREE from 'three';
import { EventEmitter } from 'eventemitter3';
import { ICameraController3D } from '../../camera/controllers/CameraController3D.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface GameCameraManagerConfig {
  /** Viewport width in pixels */
  viewportWidth: number;
  /** Viewport height in pixels */
  viewportHeight: number;
  /** World units visible vertically for orthographic projection. Default: 10 */
  orthoSize?: number;
  /**
   * Exponential follow easing coefficient.
   * Higher = snappier follow. Applied as: t = 1 - exp(-easing * dt).
   * Default: 8
   */
  followEasing?: number;
  /** Perspective field of view in degrees. Default: 60 */
  fov?: number;
  /** Near clipping plane. Default: 0.1 */
  near?: number;
  /** Far clipping plane. Default: 1000 */
  far?: number;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

interface GameCameraManagerEvents {
  /** Fired when setController() replaces the active controller. */
  'controller-changed': [controller: ICameraController3D];
  /** Fired when the camera type is switched (ortho <-> perspective). */
  'camera-switched': [camera: THREE.Camera];
}

// ---------------------------------------------------------------------------
// Minimal follow-target shape (duck typing — avoids THREE import in callers)
// ---------------------------------------------------------------------------

interface HasPosition {
  position: { x: number; y: number; z: number };
}

// ---------------------------------------------------------------------------
// GameCameraManager
// ---------------------------------------------------------------------------

export class GameCameraManager extends EventEmitter<GameCameraManagerEvents> {
  // ---- Config ------------------------------------------------------------------
  private _viewportWidth: number;
  private _viewportHeight: number;
  private _orthoSize: number;
  private _followEasing: number;
  private readonly _fov: number;
  private readonly _near: number;
  private readonly _far: number;

  // ---- Cameras -----------------------------------------------------------------
  private _orthoCamera: THREE.OrthographicCamera;
  private _perspCamera: THREE.PerspectiveCamera;
  private _camera: THREE.Camera;

  // ---- Controller --------------------------------------------------------------
  private _controller: ICameraController3D | null = null;

  // ---- Follow state ------------------------------------------------------------
  /** Pre-allocated Vector3 for currentPosition — avoids per-frame allocations. */
  private _currentPos: THREE.Vector3;
  /** Target position being followed. null = no follow. */
  private _targetPos: THREE.Vector3 | null = null;
  /** Live object to follow (position sampled every update). */
  private _followObject: HasPosition | null = null;
  /** Per-follow easing override. null = use manager default. */
  private _followEasingOverride: number | null = null;

  // ---- Activity ----------------------------------------------------------------
  private _active: boolean = true;

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  constructor(config: GameCameraManagerConfig) {
    super();

    const {
      viewportWidth,
      viewportHeight,
      orthoSize = 10,
      followEasing = 8,
      fov = 60,
      near = 0.1,
      far = 1000,
    } = config;

    this._viewportWidth  = viewportWidth;
    this._viewportHeight = viewportHeight;
    this._orthoSize      = orthoSize;
    this._followEasing   = followEasing;
    this._fov            = fov;
    this._near           = near;
    this._far            = far;

    // Pre-create both camera types; active one is selected per controller
    this._orthoCamera  = this._buildOrthoCamera();
    this._perspCamera  = this._buildPerspCamera();

    // Default to perspective until a controller is set
    this._camera = this._perspCamera;

    // Pre-allocated follow position
    this._currentPos = new THREE.Vector3(0, 0, 0);
  }

  // ---------------------------------------------------------------------------
  // Camera factory helpers
  // ---------------------------------------------------------------------------

  private _buildOrthoCamera(): THREE.OrthographicCamera {
    const aspect = this._viewportWidth / this._viewportHeight;
    const half   = this._orthoSize / 2;
    return new THREE.OrthographicCamera(
      -half * aspect,
       half * aspect,
       half,
      -half,
      this._near,
      this._far
    );
  }

  private _buildPerspCamera(): THREE.PerspectiveCamera {
    return new THREE.PerspectiveCamera(
      this._fov,
      this._viewportWidth / this._viewportHeight,
      this._near,
      this._far
    );
  }

  // ---------------------------------------------------------------------------
  // Controller management
  // ---------------------------------------------------------------------------

  /**
   * Replace the active controller.
   * Auto-switches camera type if isOrthographic differs from current camera.
   */
  setController(ctrl: ICameraController3D): void {
    this._controller = ctrl;

    const wantsOrtho = ctrl.isOrthographic;
    const hasOrtho   = this._camera === this._orthoCamera;

    if (wantsOrtho !== hasOrtho) {
      this._camera = wantsOrtho ? this._orthoCamera : this._perspCamera;
      this.emit('camera-switched', this._camera);
    }

    this.emit('controller-changed', ctrl);
  }

  // ---------------------------------------------------------------------------
  // Follow API
  // ---------------------------------------------------------------------------

  /**
   * Smoothly follow a world-space position.
   * @param x       - World X
   * @param y       - World Y
   * @param z       - World Z
   * @param easing  - Optional per-call easing override (default: manager followEasing)
   */
  followPosition(x: number, y: number, z: number, easing?: number): void {
    if (this._targetPos === null) {
      this._targetPos = new THREE.Vector3(x, y, z);
    } else {
      this._targetPos.set(x, y, z);
    }
    this._followObject         = null;
    this._followEasingOverride = easing !== undefined ? easing : null;
  }

  /**
   * Follow an object's `position` property each frame.
   * @param obj     - Any object with a `position: {x,y,z}` property
   * @param easing  - Optional per-call easing override
   */
  followObject(obj: HasPosition, easing?: number): void {
    this._followObject         = obj;
    this._followEasingOverride = easing !== undefined ? easing : null;
    // Initialise target at current object position to avoid a snap on first frame
    if (this._targetPos === null) {
      this._targetPos = new THREE.Vector3(
        obj.position.x,
        obj.position.y,
        obj.position.z
      );
    }
  }

  /** Stop following any position or object. */
  stopFollow(): void {
    this._targetPos            = null;
    this._followObject         = null;
    this._followEasingOverride = null;
  }

  /**
   * Instantly move the camera focus to (x, y, z) and stop any follow.
   */
  setPosition(x: number, y: number, z: number): void {
    this._currentPos.set(x, y, z);
    this.stopFollow();
  }

  // ---------------------------------------------------------------------------
  // Update — call once per frame
  // ---------------------------------------------------------------------------

  /**
   * Advance the camera manager.
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    if (!this._active || this._controller === null) return;

    // Sync live object follow target
    if (this._followObject !== null) {
      const op = this._followObject.position;
      if (this._targetPos === null) {
        this._targetPos = new THREE.Vector3(op.x, op.y, op.z);
      } else {
        this._targetPos.set(op.x, op.y, op.z);
      }
    }

    // Exponential lerp toward target
    if (this._targetPos !== null) {
      const easing = this._followEasingOverride !== null
        ? this._followEasingOverride
        : this._followEasing;
      const t = 1 - Math.exp(-easing * dt);

      this._currentPos.x += (this._targetPos.x - this._currentPos.x) * t;
      this._currentPos.y += (this._targetPos.y - this._currentPos.y) * t;
      this._currentPos.z += (this._targetPos.z - this._currentPos.z) * t;
    }

    // Delegate to active controller
    this._controller.apply(
      this._camera,
      { x: this._currentPos.x, y: this._currentPos.y, z: this._currentPos.z },
      dt
    );
  }

  // ---------------------------------------------------------------------------
  // Projection helpers
  // ---------------------------------------------------------------------------

  /**
   * Update viewport dimensions and rebuild projections.
   */
  resize(w: number, h: number): void {
    this._viewportWidth  = w;
    this._viewportHeight = h;

    const aspect = w / h;
    const half   = this._orthoSize / 2;

    this._orthoCamera.left   = -half * aspect;
    this._orthoCamera.right  =  half * aspect;
    this._orthoCamera.top    =  half;
    this._orthoCamera.bottom = -half;
    this._orthoCamera.updateProjectionMatrix();

    this._perspCamera.aspect = aspect;
    this._perspCamera.updateProjectionMatrix();
  }

  /**
   * Set the orthographic view size (world units visible vertically).
   */
  setOrthoSize(size: number): void {
    this._orthoSize = size;

    const aspect = this._viewportWidth / this._viewportHeight;
    const half   = size / 2;

    this._orthoCamera.left   = -half * aspect;
    this._orthoCamera.right  =  half * aspect;
    this._orthoCamera.top    =  half;
    this._orthoCamera.bottom = -half;
    this._orthoCamera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** Returns the currently active THREE.Camera (ortho or perspective). */
  getCamera(): THREE.Camera {
    return this._camera;
  }

  /** Returns the current follow/focus position. */
  getCurrentPosition(): { x: number; y: number; z: number } {
    return { x: this._currentPos.x, y: this._currentPos.y, z: this._currentPos.z };
  }

  // ---------------------------------------------------------------------------
  // Activity
  // ---------------------------------------------------------------------------

  /** Enable the manager. update() will process normally. */
  activate(): void {
    this._active = true;
  }

  /** Disable the manager. update() becomes a no-op until activate() is called. */
  deactivate(): void {
    this._active = false;
  }

  /** Whether the manager is currently active. */
  get isActive(): boolean {
    return this._active;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /** Release resources. Destroys the active controller if one is set. */
  destroy(): void {
    if (this._controller !== null) {
      this._controller.destroy();
      this._controller = null;
    }
    this._followObject = null;
    this._targetPos    = null;
    this.removeAllListeners();
  }
}
