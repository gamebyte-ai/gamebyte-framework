/**
 * PointLight - Wrapper for Three.js PointLight
 *
 * Emits light in all directions from a single point (like a light bulb).
 *
 * @example
 * ```typescript
 * const bulb = new PointLight({
 *   color: 0xffaa00,
 *   intensity: 2,
 *   distance: 50,
 *   decay: 2,
 *   position: { x: 0, y: 5, z: 0 },
 *   castShadow: true
 * });
 * scene.add(bulb.native);
 * ```
 */

import * as THREE from 'three';

export interface PointLightConfig {
  /** Light color (default: 0xffffff) */
  color?: number;
  /** Light intensity (default: 1) */
  intensity?: number;
  /** Maximum range of light (0 = infinite) (default: 0) */
  distance?: number;
  /** Light falloff amount (default: 2 for physically correct) */
  decay?: number;
  /** Light position */
  position?: { x: number; y: number; z: number };
  /** Enable shadow casting (default: false) */
  castShadow?: boolean;
  /** Shadow map resolution (default: 512) */
  shadowMapSize?: number;
  /** Shadow camera near plane (default: 0.5) */
  shadowCameraNear?: number;
  /** Shadow camera far plane (default: 500) */
  shadowCameraFar?: number;
  /** Shadow bias (default: -0.0001) */
  shadowBias?: number;
}

export class PointLight {
  private light: THREE.PointLight;
  private config: Required<PointLightConfig>;

  constructor(config: PointLightConfig = {}) {
    this.config = {
      color: config.color ?? 0xffffff,
      intensity: config.intensity ?? 1,
      distance: config.distance ?? 0,
      decay: config.decay ?? 2,
      position: config.position ?? { x: 0, y: 5, z: 0 },
      castShadow: config.castShadow ?? false,
      shadowMapSize: config.shadowMapSize ?? 512,
      shadowCameraNear: config.shadowCameraNear ?? 0.5,
      shadowCameraFar: config.shadowCameraFar ?? 500,
      shadowBias: config.shadowBias ?? -0.0001,
    };

    this.light = new THREE.PointLight(
      this.config.color,
      this.config.intensity,
      this.config.distance,
      this.config.decay
    );
    this.applyConfig();
  }

  private applyConfig(): void {
    const { position, castShadow, shadowMapSize, shadowCameraNear, shadowCameraFar, shadowBias } = this.config;

    this.light.position.set(position.x, position.y, position.z);

    if (castShadow) {
      this.light.castShadow = true;
      this.light.shadow.mapSize.width = shadowMapSize;
      this.light.shadow.mapSize.height = shadowMapSize;
      this.light.shadow.camera.near = shadowCameraNear;
      this.light.shadow.camera.far = shadowCameraFar;
      this.light.shadow.bias = shadowBias;
    }
  }

  /** Get the native Three.js light */
  get native(): THREE.PointLight {
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

  /** Get/set distance */
  get distance(): number {
    return this.light.distance;
  }
  set distance(value: number) {
    this.light.distance = value;
  }

  /** Get/set decay */
  get decay(): number {
    return this.light.decay;
  }
  set decay(value: number) {
    this.light.decay = value;
  }

  /** Get/set position */
  get position(): THREE.Vector3 {
    return this.light.position;
  }
  setPosition(x: number, y: number, z: number): this {
    this.light.position.set(x, y, z);
    return this;
  }

  /** Enable/disable shadow casting */
  setShadowEnabled(enabled: boolean): this {
    this.light.castShadow = enabled;
    return this;
  }

  /** Dispose of resources */
  dispose(): void {
    this.light.shadow.map?.dispose();
  }
}
