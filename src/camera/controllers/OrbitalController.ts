/**
 * OrbitalController — Rotates a 3D camera around a focus point using spherical coordinates.
 *
 * Supports:
 *   - Azimuth (horizontal) and pitch (vertical) rotation
 *   - Distance zoom with clamping
 *   - Auto-rotation
 *   - Smooth damping (exponential lerp toward target angles)
 *
 * No Three.js imports — works with any camera via duck typing.
 *
 * @example
 * ```typescript
 * const orbital = new OrbitalController({ distance: 15, autoRotate: true });
 * orbital.rotate(0.1, 0);   // rotate horizontally
 * orbital.zoom(-2);          // zoom in
 *
 * // in game loop:
 * orbital.apply(camera, { x: 0, y: 0, z: 0 }, dt);
 * ```
 */

import {
  ICameraController3D,
  ICamera3D,
  FocusPoint,
  lerp,
  clamp,
  setCameraPosition,
} from './CameraController3D.js';

export interface OrbitalConfig {
  /** Camera distance from focus. Default: 10 */
  distance?: number;
  /** Minimum allowed distance. Default: 2 */
  minDistance?: number;
  /** Maximum allowed distance. Default: 50 */
  maxDistance?: number;
  /** Initial horizontal angle in radians. Default: 0 */
  azimuth?: number;
  /** Initial vertical angle in radians. Default: Math.PI / 4 */
  pitch?: number;
  /** Minimum pitch angle (prevents flipping under). Default: 0.1 */
  minPitch?: number;
  /** Maximum pitch angle (prevents flipping over). Default: Math.PI/2 - 0.1 */
  maxPitch?: number;
  /** Enable continuous rotation around the focus point. Default: false */
  autoRotate?: boolean;
  /** Auto-rotation speed in radians per second. Default: 0.5 */
  autoRotateSpeed?: number;
  /**
   * Smoothing factor [0, 1].
   * 0 = instant snap, higher values = more smoothing / slower follow.
   * Applied as: current = lerp(current, target, 1 - damping) each frame.
   * Default: 0.1
   */
  damping?: number;
}

export class OrbitalController implements ICameraController3D {
  readonly isOrthographic = false;

  // ---- Config ---------------------------------------------------------------
  private readonly _minDistance: number;
  private readonly _maxDistance: number;
  private readonly _minPitch: number;
  private readonly _maxPitch: number;
  private readonly _autoRotate: boolean;
  private readonly _autoRotateSpeed: number;
  private readonly _damping: number;

  // ---- Current state (what is applied to camera) ---------------------------
  private _currentAzimuth: number;
  private _currentPitch: number;
  private _currentDistance: number;

  // ---- Target state (what the user has requested) --------------------------
  private _targetAzimuth: number;
  private _targetPitch: number;
  private _targetDistance: number;

  constructor(config: Partial<OrbitalConfig> = {}) {
    const pitch = config.pitch ?? Math.PI / 4;
    const distance = config.distance ?? 10;
    const azimuth = config.azimuth ?? 0;

    this._minDistance = config.minDistance ?? 2;
    this._maxDistance = config.maxDistance ?? 50;
    this._minPitch = config.minPitch ?? 0.1;
    this._maxPitch = config.maxPitch ?? Math.PI / 2 - 0.1;
    this._autoRotate = config.autoRotate ?? false;
    this._autoRotateSpeed = config.autoRotateSpeed ?? 0.5;
    this._damping = config.damping ?? 0.1;

    this._currentAzimuth = azimuth;
    this._currentPitch = clamp(pitch, this._minPitch, this._maxPitch);
    this._currentDistance = clamp(distance, this._minDistance, this._maxDistance);

    this._targetAzimuth = this._currentAzimuth;
    this._targetPitch = this._currentPitch;
    this._targetDistance = this._currentDistance;
  }

  // ---- Public control API --------------------------------------------------

  /**
   * Add delta angles to the rotation target.
   * @param deltaAzimuth - Horizontal rotation delta in radians
   * @param deltaPitch   - Vertical rotation delta in radians (clamped)
   */
  rotate(deltaAzimuth: number, deltaPitch: number): void {
    this._targetAzimuth += deltaAzimuth;
    this._targetPitch = clamp(
      this._targetPitch + deltaPitch,
      this._minPitch,
      this._maxPitch
    );
  }

  /**
   * Add delta to the distance target.
   * @param delta - Positive = zoom out, negative = zoom in
   */
  zoom(delta: number): void {
    this._targetDistance = clamp(
      this._targetDistance + delta,
      this._minDistance,
      this._maxDistance
    );
  }

  // ---- ICameraController3D -------------------------------------------------

  apply(camera: ICamera3D, focus: FocusPoint, dt: number): void {
    // Auto-rotate
    if (this._autoRotate) {
      this._targetAzimuth += this._autoRotateSpeed * dt;
    }

    // Smooth current values toward targets using exponential damping
    // lerpFactor: higher damping → slower follow; 0 damping → instant
    const lerpFactor = this._damping <= 0 ? 1 : clamp(1 - this._damping, 0, 1);

    this._currentAzimuth = lerp(this._currentAzimuth, this._targetAzimuth, lerpFactor);
    this._currentPitch = lerp(this._currentPitch, this._targetPitch, lerpFactor);
    this._currentDistance = lerp(this._currentDistance, this._targetDistance, lerpFactor);

    // Clamp current values
    this._currentPitch = clamp(this._currentPitch, this._minPitch, this._maxPitch);
    this._currentDistance = clamp(this._currentDistance, this._minDistance, this._maxDistance);

    // Spherical to Cartesian:
    //   x = focus.x + r * cos(pitch) * sin(azimuth)
    //   y = focus.y + r * sin(pitch)
    //   z = focus.z + r * cos(pitch) * cos(azimuth)
    const r = this._currentDistance;
    const cosPitch = Math.cos(this._currentPitch);

    const camX = focus.x + r * cosPitch * Math.sin(this._currentAzimuth);
    const camY = focus.y + r * Math.sin(this._currentPitch);
    const camZ = focus.z + r * cosPitch * Math.cos(this._currentAzimuth);

    setCameraPosition(camera, camX, camY, camZ);
    camera.lookAt(focus.x, focus.y, focus.z);
  }

  destroy(): void {
    // No resources to release
  }

  // ---- Introspection -------------------------------------------------------

  get azimuth(): number { return this._currentAzimuth; }
  get pitch(): number { return this._currentPitch; }
  get distance(): number { return this._currentDistance; }
}
