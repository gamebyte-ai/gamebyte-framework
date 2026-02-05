/**
 * HemisphereLight - Wrapper for Three.js HemisphereLight
 *
 * Simulates sky/ground lighting with two colors. Sky color comes from above,
 * ground color comes from below. Does not cast shadows.
 *
 * @example
 * ```typescript
 * const hemi = new HemisphereLight({
 *   skyColor: 0x87ceeb,    // Light blue sky
 *   groundColor: 0x5a3d2b, // Brown ground
 *   intensity: 0.6
 * });
 * scene.add(hemi.native);
 * ```
 */

import * as THREE from 'three';

export interface HemisphereLightConfig {
  /** Sky color from above (default: 0xffffff) */
  skyColor?: number;
  /** Ground color from below (default: 0x444444) */
  groundColor?: number;
  /** Light intensity (default: 1) */
  intensity?: number;
  /** Light position (affects gradient direction) */
  position?: { x: number; y: number; z: number };
}

export class HemisphereLight {
  private light: THREE.HemisphereLight;

  constructor(config: HemisphereLightConfig = {}) {
    const skyColor = config.skyColor ?? 0xffffff;
    const groundColor = config.groundColor ?? 0x444444;
    const intensity = config.intensity ?? 1;

    this.light = new THREE.HemisphereLight(skyColor, groundColor, intensity);

    if (config.position) {
      this.light.position.set(config.position.x, config.position.y, config.position.z);
    }
  }

  /** Get the native Three.js light */
  get native(): THREE.HemisphereLight {
    return this.light;
  }

  /** Get/set sky color */
  get skyColor(): number {
    return this.light.color.getHex();
  }
  set skyColor(value: number) {
    this.light.color.setHex(value);
  }

  /** Get/set ground color */
  get groundColor(): number {
    return this.light.groundColor.getHex();
  }
  set groundColor(value: number) {
    this.light.groundColor.setHex(value);
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

  /** Dispose of resources (no-op for hemisphere light) */
  dispose(): void {
    // No resources to dispose
  }
}
