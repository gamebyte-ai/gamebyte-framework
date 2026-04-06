/**
 * TopDownController — Positions the camera directly above the focus point.
 *
 * Classic top-down view. isOrthographic = true signals the renderer
 * to use orthographic projection for pixel-accurate rendering.
 *
 * @example
 * ```typescript
 * const topDown = new TopDownController({ height: 20 });
 * topDown.apply(camera, { x: player.x, y: 0, z: player.z }, dt);
 * ```
 */

import {
  ICameraController3D,
  ICamera3D,
  FocusPoint,
  setCameraPosition,
} from './CameraController3D.js';

export interface TopDownConfig {
  /** Height above the focus point. Default: 10 */
  height?: number;
}

export class TopDownController implements ICameraController3D {
  readonly isOrthographic = true;

  private readonly _height: number;

  constructor(config: Partial<TopDownConfig> = {}) {
    this._height = config.height ?? 10;
  }

  apply(camera: ICamera3D, focus: FocusPoint, _dt: number): void {
    setCameraPosition(camera, focus.x, focus.y + this._height, focus.z);
    camera.lookAt(focus.x, focus.y, focus.z);
  }

  destroy(): void {
    // No resources to release
  }
}
