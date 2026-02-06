import { Facade } from './Facade.js';
import { PostProcessingPipeline } from '../postprocessing/PostProcessingPipeline.js';
import { IPostProcessingEffect } from '../contracts/PostProcessing.js';

/**
 * Static PostProcessing facade.
 *
 * @example
 * ```typescript
 * import { PostProcessing } from 'gamebyte-framework';
 *
 * PostProcessing.add('bloom', { intensity: 0.5, threshold: 0.8 });
 * PostProcessing.add('vignette', { darkness: 0.3 });
 * PostProcessing.add('fxaa');
 * PostProcessing.get('bloom')?.setParams({ intensity: 1.0 });
 * ```
 */
export class PostProcessing extends Facade {
  protected static getFacadeAccessor(): string {
    return 'postprocessing';
  }

  private static getPipeline(): PostProcessingPipeline {
    return this.resolve<PostProcessingPipeline>();
  }

  static add(name: string, params?: Record<string, unknown>): IPostProcessingEffect {
    return this.getPipeline().add(name, params);
  }

  static remove(name: string): void {
    this.getPipeline().remove(name);
  }

  static get(name: string): IPostProcessingEffect | undefined {
    return this.getPipeline().get(name);
  }

  static get enabled(): boolean {
    return this.getPipeline().enabled;
  }

  static set enabled(value: boolean) {
    this.getPipeline().enabled = value;
  }

  static getEffects(): IPostProcessingEffect[] {
    return this.getPipeline().getEffects();
  }

  static registerEffect(name: string, factory: (params?: Record<string, unknown>) => unknown): void {
    this.getPipeline().registerEffect(name, factory);
  }
}
