/**
 * SpotLight - Wrapper for Three.js SpotLight
 *
 * Emits light in a cone from a single point toward a target.
 *
 * @example
 * ```typescript
 * const spotlight = new SpotLight({
 *   color: 0xffffff,
 *   intensity: 2,
 *   distance: 100,
 *   angle: Math.PI / 6,
 *   penumbra: 0.5,
 *   position: { x: 0, y: 10, z: 0 },
 *   target: { x: 0, y: 0, z: 0 },
 *   castShadow: true
 * });
 * scene.add(spotlight.native);
 * ```
 */

import * as THREE from 'three';

export interface SpotLightConfig {
  /** Light color (default: 0xffffff) */
  color?: number;
  /** Light intensity (default: 1) */
  intensity?: number;
  /** Maximum range of light (0 = infinite) (default: 0) */
  distance?: number;
  /** Cone angle in radians (default: Math.PI/3) */
  angle?: number;
  /** Softness of cone edge 0-1 (default: 0) */
  penumbra?: number;
  /** Light falloff amount (default: 2) */
  decay?: number;
  /** Light position */
  position?: { x: number; y: number; z: number };
  /** Target position */
  target?: { x: number; y: number; z: number };
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
  /** Shadow camera field of view (default: calculated from angle) */
  shadowCameraFov?: number;
}

export class SpotLight {
  private light: THREE.SpotLight;
  private config: Required<SpotLightConfig>;

  constructor(config: SpotLightConfig = {}) {
    const angle = config.angle ?? Math.PI / 3;
    this.config = {
      color: config.color ?? 0xffffff,
      intensity: config.intensity ?? 1,
      distance: config.distance ?? 0,
      angle,
      penumbra: config.penumbra ?? 0,
      decay: config.decay ?? 2,
      position: config.position ?? { x: 0, y: 10, z: 0 },
      target: config.target ?? { x: 0, y: 0, z: 0 },
      castShadow: config.castShadow ?? false,
      shadowMapSize: config.shadowMapSize ?? 512,
      shadowCameraNear: config.shadowCameraNear ?? 0.5,
      shadowCameraFar: config.shadowCameraFar ?? 500,
      shadowBias: config.shadowBias ?? -0.0001,
      shadowCameraFov: config.shadowCameraFov ?? THREE.MathUtils.radToDeg(angle) * 2,
    };

    this.light = new THREE.SpotLight(
      this.config.color,
      this.config.intensity,
      this.config.distance,
      this.config.angle,
      this.config.penumbra,
      this.config.decay
    );
    this.applyConfig();
  }

  private applyConfig(): void {
    const { position, target, castShadow, shadowMapSize, shadowCameraNear, shadowCameraFar, shadowBias, shadowCameraFov } = this.config;

    this.light.position.set(position.x, position.y, position.z);
    this.light.target.position.set(target.x, target.y, target.z);

    if (castShadow) {
      this.light.castShadow = true;
      this.light.shadow.mapSize.width = shadowMapSize;
      this.light.shadow.mapSize.height = shadowMapSize;
      this.light.shadow.camera.near = shadowCameraNear;
      this.light.shadow.camera.far = shadowCameraFar;
      this.light.shadow.camera.fov = shadowCameraFov;
      this.light.shadow.bias = shadowBias;
    }
  }

  /** Get the native Three.js light */
  get native(): THREE.SpotLight {
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

  /** Get/set cone angle */
  get angle(): number {
    return this.light.angle;
  }
  set angle(value: number) {
    this.light.angle = value;
  }

  /** Get/set penumbra */
  get penumbra(): number {
    return this.light.penumbra;
  }
  set penumbra(value: number) {
    this.light.penumbra = value;
  }

  /** Get/set distance */
  get distance(): number {
    return this.light.distance;
  }
  set distance(value: number) {
    this.light.distance = value;
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

  /** Dispose of resources */
  dispose(): void {
    this.light.shadow.map?.dispose();
  }
}
