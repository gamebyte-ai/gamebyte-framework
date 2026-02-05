/**
 * LightHelper - Debug visualization helpers for lights
 *
 * @example
 * ```typescript
 * const sunLight = new DirectionalLight({ ... });
 * const helper = LightHelper.createDirectionalHelper(sunLight, 5);
 * scene.add(helper);
 * ```
 */

import * as THREE from 'three';
import { DirectionalLight } from './DirectionalLight.js';
import { PointLight } from './PointLight.js';
import { SpotLight } from './SpotLight.js';
import { HemisphereLight } from './HemisphereLight.js';

export class LightHelper {
  /**
   * Create a helper for DirectionalLight
   * Shows an arrow indicating light direction
   */
  static createDirectionalHelper(
    light: DirectionalLight,
    size: number = 5,
    color?: number
  ): THREE.DirectionalLightHelper {
    return new THREE.DirectionalLightHelper(light.native, size, color);
  }

  /**
   * Create a helper for PointLight
   * Shows a wireframe sphere indicating light range
   */
  static createPointHelper(
    light: PointLight,
    sphereSize: number = 1,
    color?: number
  ): THREE.PointLightHelper {
    return new THREE.PointLightHelper(light.native, sphereSize, color);
  }

  /**
   * Create a helper for SpotLight
   * Shows a cone indicating light direction and angle
   */
  static createSpotHelper(
    light: SpotLight,
    color?: number
  ): THREE.SpotLightHelper {
    return new THREE.SpotLightHelper(light.native, color);
  }

  /**
   * Create a helper for HemisphereLight
   * Shows sky and ground colors
   */
  static createHemisphereHelper(
    light: HemisphereLight,
    size: number = 5,
    color?: number
  ): THREE.HemisphereLightHelper {
    return new THREE.HemisphereLightHelper(light.native, size, color);
  }

  /**
   * Create a shadow camera helper for debugging shadows
   */
  static createShadowCameraHelper(
    light: DirectionalLight | SpotLight | PointLight
  ): THREE.CameraHelper {
    return new THREE.CameraHelper(light.native.shadow.camera);
  }
}
