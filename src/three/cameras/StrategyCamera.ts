import * as THREE from 'three';

/**
 * Configuration options for StrategyCamera
 */
export interface StrategyCameraConfig {
  /** Field of view in degrees (default: 60) */
  fov?: number;
  /** Distance from target point (default: 10) */
  distance?: number;
  /** Rotation angle around Y-axis in degrees (default: 0) */
  angle?: number;
  /** Tilt angle from horizontal in degrees, 45-70° typical (default: 55) */
  tilt?: number;
  /** Target look-at point [x, y, z] (default: [0, 0, 0]) */
  target?: [number, number, number];
  /** Near clipping plane (default: 0.1) */
  near?: number;
  /** Far clipping plane (default: 1000) */
  far?: number;
  /** Aspect ratio (default: window.innerWidth / window.innerHeight) */
  aspect?: number;
}

/**
 * StrategyCamera - Perspective top-down camera for strategy games
 *
 * Provides a bird's-eye view similar to Clash Royale, Brawl Stars, etc.
 * The camera orbits around a target point with configurable distance, angle, and tilt.
 *
 * @example
 * ```typescript
 * const camera = new StrategyCamera({
 *   fov: 60,
 *   distance: 15,
 *   angle: 45,
 *   tilt: 55,
 *   target: [0, 0, 0]
 * });
 *
 * // Move camera target
 * camera.setTarget(5, 0, 10);
 *
 * // Rotate around target
 * camera.setAngle(90);
 *
 * // Adjust view distance
 * camera.setDistance(20);
 * ```
 */
export class StrategyCamera {
  private _camera: THREE.PerspectiveCamera;
  private _target: THREE.Vector3;
  private _distance: number;
  private _angle: number; // degrees
  private _tilt: number; // degrees

  /**
   * Creates a new StrategyCamera instance
   * @param config - Camera configuration options
   */
  constructor(config: StrategyCameraConfig = {}) {
    const {
      fov = 60,
      distance = 10,
      angle = 0,
      tilt = 55,
      target = [0, 0, 0],
      near = 0.1,
      far = 1000,
      aspect = (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1)
    } = config;

    // Create the underlying PerspectiveCamera
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // Initialize properties
    this._target = new THREE.Vector3(target[0], target[1], target[2]);
    this._distance = distance;
    this._angle = angle;
    this._tilt = Math.max(0, Math.min(90, tilt)); // Clamp tilt to 0-90 degrees

    // Position the camera
    this.updatePosition();
  }

  /**
   * Get the underlying THREE.PerspectiveCamera instance
   */
  get camera(): THREE.PerspectiveCamera {
    return this._camera;
  }

  /**
   * Set the target look-at point
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   */
  setTarget(x: number, y: number, z: number): void {
    this._target.set(x, y, z);
    this.updatePosition();
  }

  /**
   * Set the distance from target
   * @param distance - Distance value (must be positive)
   */
  setDistance(distance: number): void {
    this._distance = Math.max(0.1, distance);
    this.updatePosition();
  }

  /**
   * Set the rotation angle around Y-axis
   * @param angle - Angle in degrees
   */
  setAngle(angle: number): void {
    this._angle = angle;
    this.updatePosition();
  }

  /**
   * Set the tilt angle from horizontal
   * @param tilt - Tilt angle in degrees (clamped to 0-90)
   */
  setTilt(tilt: number): void {
    this._tilt = Math.max(0, Math.min(90, tilt));
    this.updatePosition();
  }

  /**
   * Get the current target point
   * @returns A copy of the target Vector3
   */
  getTarget(): THREE.Vector3 {
    return this._target.clone();
  }

  /**
   * Get the current distance from target
   */
  getDistance(): number {
    return this._distance;
  }

  /**
   * Get the current rotation angle
   */
  getAngle(): number {
    return this._angle;
  }

  /**
   * Get the current tilt angle
   */
  getTilt(): number {
    return this._tilt;
  }

  /**
   * Update camera position based on current target, distance, angle, and tilt
   *
   * Calculation:
   * - Convert angles to radians
   * - Calculate camera position using spherical coordinates
   * - Position camera and update look-at target
   */
  updatePosition(): void {
    // Convert degrees to radians
    const angleRad = THREE.MathUtils.degToRad(this._angle);
    const tiltRad = THREE.MathUtils.degToRad(this._tilt);

    // Calculate camera position using spherical coordinates
    // X and Z form a circle around target, Y is height above target
    const horizontalDistance = this._distance * Math.cos(tiltRad);
    const verticalDistance = this._distance * Math.sin(tiltRad);

    const x = this._target.x + horizontalDistance * Math.sin(angleRad);
    const y = this._target.y + verticalDistance;
    const z = this._target.z + horizontalDistance * Math.cos(angleRad);

    // Set camera position and look at target
    this._camera.position.set(x, y, z);
    this._camera.lookAt(this._target);
    this._camera.updateMatrixWorld();
  }

  /**
   * Update camera aspect ratio (useful for window resize)
   * @param aspect - New aspect ratio
   */
  updateAspect(aspect: number): void {
    this._camera.aspect = aspect;
    this._camera.updateProjectionMatrix();
  }

  /**
   * Update field of view
   * @param fov - Field of view in degrees
   */
  updateFOV(fov: number): void {
    this._camera.fov = fov;
    this._camera.updateProjectionMatrix();
  }

  /**
   * Smoothly move target to a new position
   * @param x - Target X coordinate
   * @param y - Target Y coordinate
   * @param z - Target Z coordinate
   * @param duration - Animation duration in milliseconds
   * @returns Promise that resolves when animation completes
   */
  async animateToTarget(x: number, y: number, z: number, duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startTarget = this._target.clone();
      const endTarget = new THREE.Vector3(x, y, z);
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out cubic
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        this._target.lerpVectors(startTarget, endTarget, eased);
        this.updatePosition();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Smoothly rotate to a new angle
   * @param angle - Target angle in degrees
   * @param duration - Animation duration in milliseconds
   * @returns Promise that resolves when animation completes
   */
  async animateToAngle(angle: number, duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startAngle = this._angle;
      const endAngle = angle;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out cubic
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        this._angle = startAngle + (endAngle - startAngle) * eased;
        this.updatePosition();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // PerspectiveCamera doesn't have resources to dispose,
    // but this method is here for consistency with other components
  }
}
