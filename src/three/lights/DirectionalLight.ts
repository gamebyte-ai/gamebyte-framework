/**
 * DirectionalLight - Wrapper for Three.js DirectionalLight
 *
 * Simulates distant light source like the sun. Light rays are parallel.
 *
 * @example
 * ```typescript
 * const sunLight = new DirectionalLight({
 *   color: 0xffffff,
 *   intensity: 1,
 *   position: { x: 10, y: 20, z: 10 },
 *   castShadow: true,
 *   shadowMapSize: 2048
 * });
 * scene.add(sunLight.native);
 * ```
 */

import * as THREE from 'three';

export interface DirectionalLightConfig {
  /** Light color (default: 0xffffff) */
  color?: number;
  /** Light intensity (default: 1) */
  intensity?: number;
  /** Light position */
  position?: { x: number; y: number; z: number };
  /** Target position for light direction */
  target?: { x: number; y: number; z: number };
  /** Enable shadow casting (default: false) */
  castShadow?: boolean;
  /** Shadow map resolution (default: 1024) */
  shadowMapSize?: number;
  /** Shadow camera frustum size (default: 50) */
  shadowCameraSize?: number;
  /** Shadow camera near plane (default: 0.5) */
  shadowCameraNear?: number;
  /** Shadow camera far plane (default: 500) */
  shadowCameraFar?: number;
  /** Shadow bias to prevent artifacts (default: -0.0001) */
  shadowBias?: number;
}

export class DirectionalLight {
  private light: THREE.DirectionalLight;
  private config: Required<DirectionalLightConfig>;

  constructor(config: DirectionalLightConfig = {}) {
    this.config = {
      color: config.color ?? 0xffffff,
      intensity: config.intensity ?? 1,
      position: config.position ?? { x: 10, y: 20, z: 10 },
      target: config.target ?? { x: 0, y: 0, z: 0 },
      castShadow: config.castShadow ?? false,
      shadowMapSize: config.shadowMapSize ?? 1024,
      shadowCameraSize: config.shadowCameraSize ?? 50,
      shadowCameraNear: config.shadowCameraNear ?? 0.5,
      shadowCameraFar: config.shadowCameraFar ?? 500,
      shadowBias: config.shadowBias ?? -0.0001,
    };

    this.light = new THREE.DirectionalLight(this.config.color, this.config.intensity);
    this.applyConfig();
  }

  private applyConfig(): void {
    const { position, target, castShadow, shadowMapSize, shadowCameraSize, shadowCameraNear, shadowCameraFar, shadowBias } = this.config;

    this.light.position.set(position.x, position.y, position.z);
    this.light.target.position.set(target.x, target.y, target.z);

    if (castShadow) {
      this.light.castShadow = true;
      this.light.shadow.mapSize.width = shadowMapSize;
      this.light.shadow.mapSize.height = shadowMapSize;
      this.light.shadow.camera.left = -shadowCameraSize;
      this.light.shadow.camera.right = shadowCameraSize;
      this.light.shadow.camera.top = shadowCameraSize;
      this.light.shadow.camera.bottom = -shadowCameraSize;
      this.light.shadow.camera.near = shadowCameraNear;
      this.light.shadow.camera.far = shadowCameraFar;
      this.light.shadow.bias = shadowBias;
    }
  }

  /** Get the native Three.js light */
  get native(): THREE.DirectionalLight {
    return this.light;
  }

  /** Get/set light color */
  get color(): number {
    return this.light.color.getHex();
  }
  set color(value: number) {
    this.light.color.setHex(value);
  }

  /** Get/set light intensity */
  get intensity(): number {
    return this.light.intensity;
  }
  set intensity(value: number) {
    this.light.intensity = value;
  }

  /** Get/set position */
  get position(): THREE.Vector3 {
    return this.light.position;
  }
  setPosition(x: number, y: number, z: number): this {
    this.light.position.set(x, y, z);
    return this;
  }

  /** Set target position */
  setTarget(x: number, y: number, z: number): this {
    this.light.target.position.set(x, y, z);
    return this;
  }

  /** Enable/disable shadow casting */
  setShadowEnabled(enabled: boolean): this {
    this.light.castShadow = enabled;
    return this;
  }

  /**
   * Update shadow map size. Disposes the current shadow map so Three.js
   * recreates it at the new resolution on the next render frame.
   * Safe to call even if the light is about to be removed from the scene.
   */
  setShadowMapSize(size: number): this {
    this.light.shadow.mapSize.width = size;
    this.light.shadow.mapSize.height = size;
    if (this.light.shadow.map) {
      this.light.shadow.map.dispose();
      this.light.shadow.map = null;
    }
    this.light.shadow.needsUpdate = true;
    return this;
  }

  /** Dispose of resources */
  dispose(): void {
    this.light.shadow.map?.dispose();
  }
}
