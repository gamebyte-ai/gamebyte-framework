/**
 * IsometricController — Classic isometric 45° camera view.
 *
 * Positions the camera at an equal offset on all three axes from the focus point,
 * creating the characteristic isometric projection look used in strategy and
 * puzzle games. isOrthographic = true.
 *
 * The `angle` parameter controls the elevation: Math.PI/4 (45°) is classic iso.
 *
 * @example
 * ```typescript
 * const iso = new IsometricController({ distance: 20 });
 * iso.apply(camera, { x: 0, y: 0, z: 0 }, dt);
 * ```
 */

import {
  ICameraController3D,
  ICamera3D,
  FocusPoint,
  setCameraPosition,
} from './CameraController3D.js';

export interface IsometricConfig {
  /** Distance from the focus point along each axis. Default: 15 */
  distance?: number;
  /**
   * Elevation angle in radians.
   * Math.PI/4 = true 45° isometric. Default: Math.PI / 4
   */
  angle?: number;
}

export class IsometricController implements ICameraController3D {
  readonly isOrthographic = true;

  private readonly _distance: number;
  private readonly _angle: number;

  constructor(config: Partial<IsometricConfig> = {}) {
    this._distance = config.distance ?? 15;
    this._angle = config.angle ?? Math.PI / 4;
  }

  apply(camera: ICamera3D, focus: FocusPoint, _dt: number): void {
    // Classic isometric: camera offset is (+d, +d, +d) from focus
    // The angle parameter could be used to vary the exact positioning,
    // but the standard iso look uses equal offsets on all axes.
    const d = this._distance;
    setCameraPosition(
      camera,
      focus.x + d,
      focus.y + d,
      focus.z + d
    );
    camera.lookAt(focus.x, focus.y, focus.z);
  }

  destroy(): void {
    // No resources to release
  }
}
