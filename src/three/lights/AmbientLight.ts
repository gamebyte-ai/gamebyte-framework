/**
 * AmbientLight - Wrapper for Three.js AmbientLight
 *
 * Global light that illuminates all objects equally regardless of position.
 * Does not cast shadows.
 *
 * @example
 * ```typescript
 * const ambient = new AmbientLight({
 *   color: 0x404040,
 *   intensity: 0.5
 * });
 * scene.add(ambient.native);
 * ```
 */

import * as THREE from 'three';

export interface AmbientLightConfig {
  /** Light color (default: 0xffffff) */
  color?: number;
  /** Light intensity (default: 1) */
  intensity?: number;
}

export class AmbientLight {
  private light: THREE.AmbientLight;

  constructor(config: AmbientLightConfig = {}) {
    const color = config.color ?? 0xffffff;
    const intensity = config.intensity ?? 1;
    this.light = new THREE.AmbientLight(color, intensity);
  }

  /** Get the native Three.js light */
  get native(): THREE.AmbientLight {
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

  /** Dispose of resources (no-op for ambient light) */
  dispose(): void {
    // No resources to dispose
  }
}
