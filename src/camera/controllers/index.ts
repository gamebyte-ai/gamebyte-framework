/**
 * 3D Camera Controllers
 *
 * A collection of ready-to-use 3D camera positioning strategies.
 * All controllers work with any object exposing position.set(x,y,z) and lookAt(x,y,z).
 * No Three.js import required.
 *
 * @example
 * ```typescript
 * import { OrbitalController, TopDownController } from './controllers';
 *
 * const orbital = new OrbitalController({ distance: 15, autoRotate: true });
 * orbital.apply(threeCamera, { x: 0, y: 0, z: 0 }, dt);
 * ```
 */

export type { ICameraController3D, ICamera3D, FocusPoint } from './CameraController3D.js';

export { OrbitalController } from './OrbitalController.js';
export type { OrbitalConfig } from './OrbitalController.js';

export { TopDownController } from './TopDownController.js';
export type { TopDownConfig } from './TopDownController.js';

export { IsometricController } from './IsometricController.js';
export type { IsometricConfig } from './IsometricController.js';

export { FrontController } from './FrontController.js';
export type { FrontConfig } from './FrontController.js';
