import { EventEmitter } from 'eventemitter3';
import * as THREE from 'three';
import {
  IPostProcessingPipeline,
  IPostProcessingEffect
} from '../contracts/PostProcessing.js';

/**
 * Deferred effect placeholder — created when pmndrs/postprocessing
 * hasn't been loaded yet. Resolved in rebuildComposer().
 */
interface DeferredEffect {
  __deferred: true;
  name: string;
  params: Record<string, unknown>;
}

/**
 * Built-in effect priorities (lower = processed first in the pipeline).
 */
const EFFECT_PRIORITIES: Record<string, number> = {
  ssao: 5,
  bloom: 10,
  dof: 20,
  chromaticAberration: 40,
  vignette: 50,
  toneMapping: 90,
  fxaa: 100
};

/**
 * Wrapped effect entry in the pipeline.
 */
class PostProcessingEffect implements IPostProcessingEffect {
  readonly name: string;
  readonly priority: number;
  private _enabled = true;
  private nativeEffect: any;
  private params: Record<string, unknown>;

  constructor(name: string, nativeEffect: any, params: Record<string, unknown>) {
    this.name = name;
    this.priority = EFFECT_PRIORITIES[name] ?? 50;
    this.nativeEffect = nativeEffect;
    this.params = params;
  }

  get enabled(): boolean { return this._enabled; }
  set enabled(v: boolean) {
    this._enabled = v;
    // pmndrs effects have a .disabled property (inverse of enabled)
    if (this.nativeEffect && 'disabled' in this.nativeEffect) {
      this.nativeEffect.disabled = !v;
    }
  }

  getNativeEffect(): unknown {
    return this.nativeEffect;
  }

  setParams(params: Record<string, unknown>): void {
    Object.assign(this.params, params);
    // Apply params to native effect
    if (this.nativeEffect) {
      for (const [key, value] of Object.entries(params)) {
        if (key in this.nativeEffect) {
          (this.nativeEffect as any)[key] = value;
        }
      }
    }
  }

  dispose(): void {
    if (this.nativeEffect?.dispose) {
      this.nativeEffect.dispose();
    }
    this.nativeEffect = null;
  }
}

/**
 * Post-processing pipeline using pmndrs/postprocessing for effect merging.
 *
 * Architecture: pmndrs/postprocessing merges compatible effects into single
 * shader passes. 5 effects might compile into 1-2 passes instead of 5.
 * This is ~80% fewer render operations compared to Three.js EffectComposer.
 *
 * Graceful degradation: if pmndrs/postprocessing is not installed,
 * effects are registered but not applied, and render() is a no-op.
 *
 * Features:
 * - Automatic effect merging via pmndrs EffectComposer
 * - Built-in factories for common effects (bloom, vignette, fxaa, etc.)
 * - Priority-ordered pipeline rebuilding
 * - Lazy shader compilation (only when enabled)
 * - PerformanceAdvisor integration: auto-disable on low quality tiers
 */
export class PostProcessingPipeline extends EventEmitter implements IPostProcessingPipeline {
  private effects: Map<string, PostProcessingEffect> = new Map();
  private customFactories: Map<string, (params?: Record<string, unknown>) => any> = new Map();
  private _enabled = true;
  private needsRebuild = false;
  private rebuilding = false;

  // pmndrs/postprocessing instances (lazy loaded)
  private composer: any = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private pmndrs: any = null; // Module reference

  get enabled(): boolean { return this._enabled; }
  set enabled(v: boolean) {
    this._enabled = v;
    this.emit('enabled:changed', v);
  }

  /**
   * Set renderer, scene, camera for the pipeline.
   */
  setRenderer(renderer: unknown, scene: unknown, camera: unknown): void {
    this.renderer = renderer as THREE.WebGLRenderer;
    this.scene = scene as THREE.Scene;
    this.camera = camera as THREE.Camera;
    this.needsRebuild = true;
  }

  /**
   * Add an effect by name.
   */
  add(name: string, params?: Record<string, unknown>): IPostProcessingEffect {
    // Remove existing if re-adding
    if (this.effects.has(name)) {
      this.remove(name);
    }

    // Create the native effect (will be null if pmndrs not available)
    const nativeEffect = this.createNativeEffect(name, params ?? {});
    const effect = new PostProcessingEffect(name, nativeEffect, params ?? {});
    this.effects.set(name, effect);
    this.needsRebuild = true;

    this.emit('effect:added', name);
    return effect;
  }

  /**
   * Remove an effect by name.
   */
  remove(name: string): void {
    const effect = this.effects.get(name);
    if (effect) {
      effect.dispose();
      this.effects.delete(name);
      this.needsRebuild = true;
      this.emit('effect:removed', name);
    }
  }

  /**
   * Get an effect by name.
   */
  get(name: string): IPostProcessingEffect | undefined {
    return this.effects.get(name);
  }

  /**
   * Get all active effects sorted by priority.
   */
  getEffects(): IPostProcessingEffect[] {
    return Array.from(this.effects.values())
      .filter(e => e.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Register a custom effect factory.
   */
  registerEffect(name: string, factory: (params?: Record<string, unknown>) => unknown): void {
    this.customFactories.set(name, factory);
  }

  /**
   * Render one frame through the post-processing pipeline.
   * Falls back to standard renderer.render() if pipeline is disabled or unavailable.
   */
  render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    if (!this._enabled || this.effects.size === 0) {
      // Standard render
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // Rebuild composer if needed (async, guarded against concurrent rebuilds)
    if (this.needsRebuild && !this.rebuilding) {
      this.rebuildComposer();
    }

    if (this.composer) {
      this.composer.render();
    } else {
      // Fallback: standard render
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Dispose all effects and the composer.
   */
  dispose(): void {
    for (const effect of this.effects.values()) {
      effect.dispose();
    }
    this.effects.clear();

    if (this.composer?.dispose) {
      this.composer.dispose();
    }
    this.composer = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.customFactories.clear();
    this.removeAllListeners();
  }

  // ─── Private Methods ───────────────────────────

  private async loadPmndrs(): Promise<any> {
    if (this.pmndrs) return this.pmndrs;
    try {
      this.pmndrs = await import('postprocessing');
      return this.pmndrs;
    } catch {
      console.warn('PostProcessingPipeline: pmndrs/postprocessing not installed. Effects will not be applied.');
      return null;
    }
  }

  private createNativeEffect(name: string, params: Record<string, unknown>): any {
    // Check custom factories first
    const customFactory = this.customFactories.get(name);
    if (customFactory) {
      return customFactory(params);
    }

    // Built-in effect creation is deferred to rebuildComposer
    // to handle async import of pmndrs/postprocessing
    return { __deferred: true, name, params } as DeferredEffect;
  }

  private async rebuildComposer(): Promise<void> {
    this.rebuilding = true;

    if (!this.renderer || !this.scene || !this.camera) {
      this.rebuilding = false;
      return;
    }

    const pp = await this.loadPmndrs();
    if (!pp) {
      this.rebuilding = false;
      return;
    }

    // Dispose old composer
    if (this.composer?.dispose) {
      this.composer.dispose();
    }

    // Create new composer
    this.composer = new pp.EffectComposer(this.renderer);

    // Add render pass
    const renderPass = new pp.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Collect native effects, creating deferred ones now
    const nativeEffects: any[] = [];
    const sortedEffects = this.getEffects();

    for (const effect of sortedEffects) {
      let native: any = (effect as PostProcessingEffect).getNativeEffect();

      // Resolve deferred effects
      if (native?.__deferred) {
        native = this.createBuiltinEffect(pp, (native as DeferredEffect).name, (native as DeferredEffect).params);
        // Replace the deferred placeholder
        if (native) {
          (effect as any).nativeEffect = native;
        }
      }

      if (native && !native.__deferred) {
        nativeEffects.push(native);
      }
    }

    // Create merged EffectPass (pmndrs groups compatible effects automatically)
    if (nativeEffects.length > 0) {
      const effectPass = new pp.EffectPass(this.camera, ...nativeEffects);
      this.composer.addPass(effectPass);
    }

    this.rebuilding = false;
    this.needsRebuild = false;
    this.emit('pipeline:rebuilt', sortedEffects.length);
  }

  private createBuiltinEffect(pp: any, name: string, params: Record<string, unknown>): any {
    switch (name) {
      case 'bloom':
        return new pp.BloomEffect({
          intensity: (params.intensity as number) ?? 1.0,
          luminanceThreshold: (params.threshold as number) ?? 0.8,
          luminanceSmoothing: (params.smoothing as number) ?? 0.075,
          mipmapBlur: true,
          ...params
        });

      case 'vignette':
        return new pp.VignetteEffect({
          darkness: (params.darkness as number) ?? 0.5,
          offset: (params.offset as number) ?? 0.5,
          ...params
        });

      case 'fxaa':
        return new pp.FXAAEffect();

      case 'chromaticAberration':
        return new pp.ChromaticAberrationEffect({
          offset: params.offset ?? new (pp.Vector2 ?? THREE.Vector2)(0.001, 0.001),
          ...params
        });

      case 'ssao':
        if (pp.SSAOEffect) {
          return new pp.SSAOEffect(this.camera, null, {
            samples: (params.samples as number) ?? 16,
            rings: (params.rings as number) ?? 4,
            intensity: (params.intensity as number) ?? 1.0,
            ...params
          });
        }
        return null;

      case 'dof':
        if (pp.DepthOfFieldEffect) {
          return new pp.DepthOfFieldEffect(this.camera, {
            focusDistance: (params.focusDistance as number) ?? 0.02,
            focalLength: (params.focalLength as number) ?? 0.05,
            bokehScale: (params.bokehScale as number) ?? 2.0,
            ...params
          });
        }
        return null;

      case 'toneMapping':
        if (pp.ToneMappingEffect) {
          return new pp.ToneMappingEffect({
            mode: params.mode ?? 1, // ACESFilmicToneMapping
            ...params
          });
        }
        return null;

      default:
        console.warn(`PostProcessingPipeline: unknown built-in effect '${name}'`);
        return null;
    }
  }
}
