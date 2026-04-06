/**
 * CameraController3D — Base interface for all 3D camera controllers.
 *
 * Controllers use duck typing so they work with any 3D camera object
 * (Three.js PerspectiveCamera, OrthographicCamera, mocks, etc.) that exposes:
 *   - position.set(x, y, z)  or  position.x / position.y / position.z
 *   - lookAt(x, y, z)
 *
 * No Three.js import required.
 */

/**
 * Minimal 3D camera interface expected by all controllers.
 * Any object matching this shape is compatible.
 */
export interface ICamera3D {
  position: { x: number; y: number; z: number; set?: (x: number, y: number, z: number) => void };
  lookAt(x: number, y: number, z: number): void;
}

/**
 * Focus point in 3D world space.
 */
export interface FocusPoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Base interface implemented by all 3D camera controllers.
 */
export interface ICameraController3D {
  /**
   * Apply this controller's camera positioning for the current frame.
   * @param camera - Any object with position.set and lookAt methods
   * @param focus  - The world-space point to look at / orbit around
   * @param dt     - Delta time in seconds (used for smoothing/auto-rotation)
   */
  apply(camera: ICamera3D, focus: FocusPoint, dt: number): void;

  /**
   * Whether this controller is designed for orthographic projection.
   * The game can use this hint to switch camera projection type.
   */
  readonly isOrthographic: boolean;

  /** Release any resources held by this controller. */
  destroy(): void;
}

// ---- Internal math helpers -------------------------------------------------

/**
 * Linearly interpolate from `a` to `b` by factor `t`.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp `value` to [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Set camera position using either position.set() or direct property assignment.
 */
export function setCameraPosition(camera: ICamera3D, x: number, y: number, z: number): void {
  if (typeof camera.position.set === 'function') {
    camera.position.set(x, y, z);
  } else {
    camera.position.x = x;
    camera.position.y = y;
    camera.position.z = z;
  }
}
