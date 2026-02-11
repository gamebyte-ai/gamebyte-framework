import { EventEmitter } from 'eventemitter3';
import * as THREE from 'three';
import { IEnvironmentSystem, EnvironmentConfig } from '../contracts/Environment.js';
import { Logger } from '../utils/Logger.js';

// ─── Built-in Presets ─────────────────────────

const DAY_PRESET: EnvironmentConfig = {
  sunPosition: [50, 100, 50],
  sunColor: '#ffffff',
  sunIntensity: 1.5,
  ambientIntensity: 0.6,
  skyColor: '#87CEEB',
  groundColor: '#4a7c59',
  fog: { color: '#c8e0f0', near: 50, far: 500, type: 'linear' }
};

const SUNSET_PRESET: EnvironmentConfig = {
  sunPosition: [100, 20, -50],
  sunColor: '#ff7733',
  sunIntensity: 1.2,
  ambientIntensity: 0.3,
  skyColor: '#ff6b35',
  groundColor: '#2d1b0e',
  fog: { color: '#ff9966', near: 30, far: 300, type: 'linear' }
};

const NIGHT_PRESET: EnvironmentConfig = {
  sunPosition: [-50, -10, 50],
  sunColor: '#4466aa',
  sunIntensity: 0.1,
  ambientIntensity: 0.15,
  skyColor: '#0a0a2e',
  groundColor: '#050510',
  fog: { color: '#0a0a1a', near: 20, far: 200, type: 'exponential', density: 0.01 }
};

const OVERCAST_PRESET: EnvironmentConfig = {
  sunPosition: [0, 80, 30],
  sunColor: '#cccccc',
  sunIntensity: 0.6,
  ambientIntensity: 0.7,
  skyColor: '#999999',
  groundColor: '#555555',
  fog: { color: '#aaaaaa', near: 30, far: 250, type: 'linear' }
};

/**
 * Environment & Skybox system for Three.js scenes.
 *
 * Manages directional light (sun), hemisphere light (ambient), fog,
 * and environment maps (HDRI or procedural sky).
 *
 * Features:
 * - 4 built-in presets: day, sunset, night, overcast
 * - Smooth transitions between presets (lerp colors/values)
 * - HDRI environment map loading
 * - Fog management (linear and exponential)
 * - Custom preset registration
 */
export class EnvironmentSystem extends EventEmitter implements IEnvironmentSystem {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private hemisphereLight: THREE.HemisphereLight | null = null;
  private presets: Map<string, EnvironmentConfig> = new Map();
  private currentConfig: EnvironmentConfig;
  private transitioning = false;

  // Reused color objects for lerping
  private readonly tempColor1 = new THREE.Color();
  private readonly tempColor2 = new THREE.Color();
  private readonly tempColor3 = new THREE.Color();

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    super();
    this.scene = scene;
    this.renderer = renderer ?? null;
    this.currentConfig = { ...DAY_PRESET };

    // Register built-in presets
    this.presets.set('day', DAY_PRESET);
    this.presets.set('sunset', SUNSET_PRESET);
    this.presets.set('night', NIGHT_PRESET);
    this.presets.set('overcast', OVERCAST_PRESET);

    // Create lights
    this.createLights();
  }

  /**
   * Apply a named preset immediately.
   */
  preset(name: string): void {
    const config = this.presets.get(name);
    if (!config) {
      Logger.warn('Environment', `Unknown preset '${name}'`);
      return;
    }
    this.applyConfig(config);
    this.currentConfig = { ...config };
    this.emit('preset:applied', name);
  }

  /**
   * Load and apply an HDRI environment map.
   */
  /**
   * Set the renderer (required for HDRI loading).
   * Called by EnvironmentServiceProvider during boot.
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  async setHDRI(url: string, _options?: { resolution?: number }): Promise<void> {
    if (!this.renderer) {
      throw new Error('EnvironmentSystem: renderer is required for HDRI loading. Call setRenderer() first.');
    }

    const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');

    return new Promise((resolve, reject) => {
      const loader = new RGBELoader();
      loader.load(
        url,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;

          const pmremGenerator = new THREE.PMREMGenerator(this.renderer!);
          pmremGenerator.compileEquirectangularShader();
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;

          this.scene.environment = envMap;
          this.scene.background = envMap;

          texture.dispose();
          pmremGenerator.dispose();

          this.emit('hdri:loaded', url);
          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Set procedural sky (uses Three.js Sky shader).
   */
  setProceduralSky(config?: Partial<NonNullable<EnvironmentConfig['sky']>>): void {
    // Store sky config for later use
    this.currentConfig.sky = {
      turbidity: config?.turbidity ?? 10,
      rayleigh: config?.rayleigh ?? 2,
      mieCoefficient: config?.mieCoefficient ?? 0.005
    };
    this.emit('sky:configured', this.currentConfig.sky);
  }

  /**
   * Set fog configuration.
   */
  setFog(config: Partial<EnvironmentConfig['fog']>): void {
    const fogConfig = { ...this.currentConfig.fog, ...config };
    this.currentConfig.fog = fogConfig;
    this.applyFog(fogConfig);
    this.emit('fog:changed', fogConfig);
  }

  /**
   * Remove fog.
   */
  clearFog(): void {
    this.scene.fog = null;
    this.emit('fog:cleared');
  }

  /**
   * Smooth transition to another preset over duration (seconds).
   * Lerps colors and values each frame.
   */
  async transitionTo(presetName: string, duration: number): Promise<void> {
    const target = this.presets.get(presetName);
    if (!target) {
      Logger.warn('Environment', `Unknown preset '${presetName}'`);
      return;
    }

    if (this.transitioning) return; // Already transitioning
    this.transitioning = true;

    const start = { ...this.currentConfig };
    const startTime = performance.now();
    const durationMs = duration * 1000;

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / durationMs, 1);
        const eased = t * t * (3 - 2 * t); // smoothstep

        this.lerpConfig(start, target, eased);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.currentConfig = { ...target };
          this.transitioning = false;
          this.emit('transition:complete', presetName);
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Register a custom preset.
   */
  registerPreset(name: string, config: EnvironmentConfig): void {
    this.presets.set(name, config);
  }

  /**
   * Get current environment configuration.
   */
  getConfig(): EnvironmentConfig {
    return { ...this.currentConfig };
  }

  /**
   * Dispose lights and cleanup.
   */
  dispose(): void {
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
      this.directionalLight.dispose();
      this.directionalLight = null;
    }
    if (this.hemisphereLight) {
      this.scene.remove(this.hemisphereLight);
      this.hemisphereLight.dispose();
      this.hemisphereLight = null;
    }
    this.scene.fog = null;
    this.scene.environment = null;
    this.presets.clear();
    this.removeAllListeners();
  }

  // ─── Private Methods ───────────────────────────

  private createLights(): void {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(this.directionalLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x4a7c59, 0.6);
    this.scene.add(this.hemisphereLight);
  }

  private applyConfig(config: EnvironmentConfig): void {
    if (this.directionalLight) {
      this.directionalLight.color.set(config.sunColor);
      this.directionalLight.intensity = config.sunIntensity;
      this.directionalLight.position.set(...config.sunPosition);
    }

    if (this.hemisphereLight) {
      this.hemisphereLight.color.set(config.skyColor);
      this.hemisphereLight.groundColor.set(config.groundColor);
      this.hemisphereLight.intensity = config.ambientIntensity;
    }

    this.applyFog(config.fog);
  }

  private applyFog(fog: EnvironmentConfig['fog']): void {
    if (fog.type === 'exponential') {
      this.scene.fog = new THREE.FogExp2(fog.color, fog.density ?? 0.01);
    } else {
      this.scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);
    }
  }

  private lerpConfig(from: EnvironmentConfig, to: EnvironmentConfig, t: number): void {
    if (this.directionalLight) {
      this.tempColor1.set(from.sunColor);
      this.tempColor2.set(to.sunColor);
      this.directionalLight.color.copy(this.tempColor1.lerp(this.tempColor2, t));
      this.directionalLight.intensity = from.sunIntensity + (to.sunIntensity - from.sunIntensity) * t;

      // Lerp position
      this.directionalLight.position.set(
        from.sunPosition[0] + (to.sunPosition[0] - from.sunPosition[0]) * t,
        from.sunPosition[1] + (to.sunPosition[1] - from.sunPosition[1]) * t,
        from.sunPosition[2] + (to.sunPosition[2] - from.sunPosition[2]) * t
      );
    }

    if (this.hemisphereLight) {
      this.tempColor1.set(from.skyColor);
      this.tempColor2.set(to.skyColor);
      this.hemisphereLight.color.copy(this.tempColor1.lerp(this.tempColor2, t));

      this.tempColor1.set(from.groundColor);
      this.tempColor2.set(to.groundColor);
      this.hemisphereLight.groundColor.copy(this.tempColor1.lerp(this.tempColor2, t));

      this.hemisphereLight.intensity = from.ambientIntensity + (to.ambientIntensity - from.ambientIntensity) * t;
    }

    // Lerp fog
    this.tempColor1.set(from.fog.color);
    this.tempColor2.set(to.fog.color);
    this.tempColor3.copy(this.tempColor1.lerp(this.tempColor2, t));
    const fogColorStr = '#' + this.tempColor3.getHexString();
    const fogNear = from.fog.near + (to.fog.near - from.fog.near) * t;
    const fogFar = from.fog.far + (to.fog.far - from.fog.far) * t;

    if (to.fog.type === 'exponential') {
      const fromDensity = from.fog.density ?? 0.01;
      const toDensity = to.fog.density ?? 0.01;
      const density = fromDensity + (toDensity - fromDensity) * t;
      this.scene.fog = new THREE.FogExp2(fogColorStr, density);
    } else {
      this.scene.fog = new THREE.Fog(fogColorStr, fogNear, fogFar);
    }
  }
}
