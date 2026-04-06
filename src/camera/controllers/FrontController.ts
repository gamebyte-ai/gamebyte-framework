/**
 * FrontController — Front-facing camera for 2.5D side-scrolling games.
 *
 * Positions the camera directly in front of the focus point along the Z axis.
 * Ideal for platformers, runners, and fighting games that use 3D rendering
 * with a fixed front perspective.
 *
 * @example
 * ```typescript
 * const front = new FrontController({ distance: 15 });
 * front.apply(camera, { x: player.x, y: player.y, z: 0 }, dt);
 * ```
 */

import {
  ICameraController3D,
  ICamera3D,
  FocusPoint,
  setCameraPosition,
} from './CameraController3D.js';

export interface FrontConfig {
  /** Distance from the focus point along the Z axis. Default: 10 */
  distance?: number;
}

export class FrontController implements ICameraController3D {
  readonly isOrthographic = false;

  private readonly _distance: number;

  constructor(config: Partial<FrontConfig> = {}) {
    this._distance = config.distance ?? 10;
  }

  apply(camera: ICamera3D, focus: FocusPoint, _dt: number): void {
    setCameraPosition(camera, focus.x, focus.y, focus.z + this._distance);
    camera.lookAt(focus.x, focus.y, focus.z);
  }

  destroy(): void {
    // No resources to release
  }
}
