import * as THREE from 'three';
import { EventEmitter } from 'eventemitter3';
import { Logger } from '../../utils/Logger.js';

/**
 * Configuration options for IsometricCamera
 */
export interface IsometricCameraConfig {
  /**
   * World units visible vertically (height of the view frustum)
   * @default 10
   */
  viewSize?: number;

  /**
   * Rotation around Y axis in degrees
   * @default 45
   */
  angle?: number;

  /**
   * Camera tilt angle in degrees (angle from horizontal)
   * @default 35.264 (true isometric: atan(1/√2))
   */
  tilt?: number;

  /**
   * Initial aspect ratio (width/height)
   * @default 1
   */
  aspectRatio?: number;

  /**
   * Near clipping plane
   * @default 0.1
   */
  near?: number;

  /**
   * Far clipping plane
   * @default 1000
   */
  far?: number;

  /**
   * Initial zoom level
   * @default 1
   */
  zoom?: number;
}

/**
 * Events emitted by IsometricCamera
 */
interface IsometricCameraEvents {
  'zoom-changed': [zoom: number];
  'view-size-changed': [size: number];
  'projection-updated': [];
}

/**
 * IsometricCamera component for true isometric projection
 *
 * Provides a camera with proper isometric angles:
 * - 45° rotation around Y axis (by default)
 * - 35.264° tilt from horizontal (atan(1/√2) for true isometric)
 *
 * @example
 * ```typescript
 * const camera = new IsometricCamera({
 *   viewSize: 20,
 *   aspectRatio: window.innerWidth / window.innerHeight
 * });
 *
 * // Position camera to look at origin
 * camera.lookAt(0, 0, 0);
 *
 * // Handle window resize
 * window.addEventListener('resize', () => {
 *   camera.setAspectRatio(window.innerWidth / window.innerHeight);
 *   camera.updateProjection();
 * });
 * ```
 */
export class IsometricCamera extends EventEmitter<IsometricCameraEvents> {
  private camera: THREE.OrthographicCamera;
  private _viewSize: number;
  private _aspectRatio: number;
  private _angle: number;
  private _tilt: number;

  // True isometric tilt: atan(1/√2) ≈ 35.264°
  private static readonly TRUE_ISOMETRIC_TILT = Math.atan(1 / Math.sqrt(2)) * (180 / Math.PI);

  constructor(options: IsometricCameraConfig = {}) {
    super();

    const {
      viewSize = 10,
      angle = 45,
      tilt = IsometricCamera.TRUE_ISOMETRIC_TILT,
      aspectRatio = 1,
      near = 0.1,
      far = 1000,
      zoom = 1
    } = options;

    this._viewSize = viewSize;
    this._aspectRatio = aspectRatio;
    this._angle = angle;
    this._tilt = tilt;

    // Calculate initial frustum
    const frustumHeight = viewSize;
    const frustumWidth = frustumHeight * aspectRatio;

    // Create orthographic camera
    this.camera = new THREE.OrthographicCamera(
      -frustumWidth / 2,
      frustumWidth / 2,
      frustumHeight / 2,
      -frustumHeight / 2,
      near,
      far
    );

    this.camera.zoom = zoom;

    // Set initial isometric position and rotation
    this.applyIsometricTransform();
  }

  /**
   * Apply isometric transformation to camera
   */
  private applyIsometricTransform(): void {
    // Calculate camera distance based on view size
    // Distance ensures the frustum covers the desired view size
    const distance = this._viewSize * 2;

    // Convert angles to radians
    const angleRad = this._angle * (Math.PI / 180);
    const tiltRad = this._tilt * (Math.PI / 180);

    // Calculate camera position using spherical coordinates
    const x = distance * Math.cos(tiltRad) * Math.sin(angleRad);
    const y = distance * Math.sin(tiltRad);
    const z = distance * Math.cos(tiltRad) * Math.cos(angleRad);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Point camera at specific world coordinates
   */
  lookAt(x: number, y: number, z: number): void {
    this.camera.lookAt(x, y, z);
  }

  /**
   * Set camera zoom level
   */
  setZoom(zoom: number): void {
    if (zoom <= 0) {
      Logger.warn('Camera', 'IsometricCamera: zoom must be positive, clamping to 0.01');
      zoom = 0.01;
    }

    this.camera.zoom = zoom;
    this.camera.updateProjectionMatrix();
    this.emit('zoom-changed', zoom);
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    return this.camera.zoom;
  }

  /**
   * Set view size (world units visible vertically)
   */
  setViewSize(size: number): void {
    if (size <= 0) {
      Logger.warn('Camera', 'IsometricCamera: viewSize must be positive, clamping to 1');
      size = 1;
    }

    this._viewSize = size;
    this.applyIsometricTransform();
    this.updateProjection();
    this.emit('view-size-changed', size);
  }

  /**
   * Get current view size
   */
  getViewSize(): number {
    return this._viewSize;
  }

  /**
   * Set aspect ratio (width/height)
   */
  setAspectRatio(aspectRatio: number): void {
    if (aspectRatio <= 0) {
      Logger.warn('Camera', 'IsometricCamera: aspectRatio must be positive, clamping to 1');
      aspectRatio = 1;
    }

    this._aspectRatio = aspectRatio;
  }

  /**
   * Get current aspect ratio
   */
  getAspectRatio(): number {
    return this._aspectRatio;
  }

  /**
   * Set camera angle (rotation around Y axis in degrees)
   */
  setAngle(angle: number): void {
    this._angle = angle;
    this.applyIsometricTransform();
  }

  /**
   * Get current camera angle
   */
  getAngle(): number {
    return this._angle;
  }

  /**
   * Set camera tilt (angle from horizontal in degrees)
   */
  setTilt(tilt: number): void {
    this._tilt = tilt;
    this.applyIsometricTransform();
  }

  /**
   * Get current camera tilt
   */
  getTilt(): number {
    return this._tilt;
  }

  /**
   * Update projection matrix after aspect ratio or view size changes
   * Call this after window resize events
   */
  updateProjection(): void {
    const frustumHeight = this._viewSize;
    const frustumWidth = frustumHeight * this._aspectRatio;

    this.camera.left = -frustumWidth / 2;
    this.camera.right = frustumWidth / 2;
    this.camera.top = frustumHeight / 2;
    this.camera.bottom = -frustumHeight / 2;

    this.camera.updateProjectionMatrix();
    this.emit('projection-updated');
  }

  /**
   * Get underlying THREE.OrthographicCamera instance
   */
  getThreeCamera(): THREE.OrthographicCamera {
    return this.camera;
  }

  /**
   * Get camera position
   */
  getPosition(): THREE.Vector3 {
    return this.camera.position;
  }

  /**
   * Set camera position directly (bypasses isometric transform)
   */
  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  /**
   * Get camera rotation
   */
  getRotation(): THREE.Euler {
    return this.camera.rotation;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.removeAllListeners();
  }
}
