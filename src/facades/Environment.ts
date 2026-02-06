import { Facade } from './Facade.js';
import { EnvironmentSystem } from '../environment/EnvironmentSystem.js';
import { EnvironmentConfig } from '../contracts/Environment.js';

/**
 * Static Environment facade for 3D scene environment management.
 *
 * @example
 * ```typescript
 * import { Environment } from 'gamebyte-framework';
 *
 * Environment.preset('sunset');
 * await Environment.transitionTo('night', 5.0);
 * await Environment.setHDRI('/hdris/studio.hdr');
 * ```
 */
export class Environment extends Facade {
  protected static getFacadeAccessor(): string {
    return 'environment';
  }

  private static getSystem(): EnvironmentSystem {
    return this.resolve<EnvironmentSystem>();
  }

  static preset(name: string): void {
    this.getSystem().preset(name);
  }

  static async setHDRI(url: string, options?: { resolution?: number }): Promise<void> {
    return this.getSystem().setHDRI(url, options);
  }

  static setProceduralSky(config?: Partial<NonNullable<EnvironmentConfig['sky']>>): void {
    this.getSystem().setProceduralSky(config);
  }

  static setFog(config: Partial<EnvironmentConfig['fog']>): void {
    this.getSystem().setFog(config);
  }

  static clearFog(): void {
    this.getSystem().clearFog();
  }

  static async transitionTo(preset: string, duration: number): Promise<void> {
    return this.getSystem().transitionTo(preset, duration);
  }

  static registerPreset(name: string, config: EnvironmentConfig): void {
    this.getSystem().registerPreset(name, config);
  }

  static getConfig(): EnvironmentConfig {
    return this.getSystem().getConfig();
  }
}
