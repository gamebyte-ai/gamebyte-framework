/**
 * Full environment configuration including sun, ambient, fog, and sky.
 */
export interface EnvironmentConfig {
  sunPosition: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  ambientIntensity: number;
  skyColor: string;
  groundColor: string;
  fog: {
    color: string;
    near: number;
    far: number;
    type: 'linear' | 'exponential';
    density?: number;
  };
  sky?: {
    turbidity: number;
    rayleigh: number;
    mieCoefficient?: number;
  };
}

/**
 * Core environment system contract.
 */
export interface IEnvironmentSystem {
  /** Apply a named preset */
  preset(name: string): void;
  /** Set HDRI environment map */
  setHDRI(url: string, options?: { resolution?: number }): Promise<void>;
  /** Set procedural sky shader */
  setProceduralSky(config?: Partial<NonNullable<EnvironmentConfig['sky']>>): void;
  /** Set fog configuration */
  setFog(config: Partial<EnvironmentConfig['fog']>): void;
  /** Remove fog */
  clearFog(): void;
  /** Smooth transition to another preset over duration (seconds) */
  transitionTo(preset: string, duration: number): Promise<void>;
  /** Register a custom preset */
  registerPreset(name: string, config: EnvironmentConfig): void;
  /** Get current environment configuration */
  getConfig(): EnvironmentConfig;
  /** Cleanup */
  dispose(): void;
}
