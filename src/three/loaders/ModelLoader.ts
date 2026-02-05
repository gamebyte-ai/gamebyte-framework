/**
 * ModelLoader - Wrapper for Three.js GLTF/GLB model loading
 *
 * Provides easy loading of 3D models with animation support.
 *
 * @example
 * ```typescript
 * const loader = new ModelLoader();
 *
 * // Load a model
 * const result = await loader.load('/models/character.glb');
 * scene.add(result.scene);
 *
 * // With progress tracking
 * const result = await loader.load('/models/character.glb', {
 *   onProgress: (progress) => console.log(`Loading: ${progress * 100}%`)
 * });
 *
 * // Access animations
 * if (result.animations.length > 0) {
 *   const mixer = new THREE.AnimationMixer(result.scene);
 *   mixer.clipAction(result.animations[0]).play();
 * }
 * ```
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EventEmitter } from 'eventemitter3';

export interface ModelLoaderConfig {
  /** Path to Draco decoder files for compressed models */
  dracoDecoderPath?: string;
  /** Enable Draco compression support (default: false) */
  enableDraco?: boolean;
  /** Base path for all model URLs */
  basePath?: string;
}

export interface LoadOptions {
  /** Progress callback (0-1) */
  onProgress?: (progress: number) => void;
  /** Override base path for this load */
  basePath?: string;
}

export interface LoadedModel {
  /** The loaded scene/model group */
  scene: THREE.Group;
  /** Animation clips from the model */
  animations: THREE.AnimationClip[];
  /** All scenes in the GLTF file */
  scenes: THREE.Group[];
  /** Cameras defined in the model */
  cameras: THREE.Camera[];
  /** The parser used (for advanced access) */
  parser: GLTF['parser'];
  /** User data from the GLTF */
  userData: Record<string, any>;
}

export interface ModelLoaderEvents {
  load: [model: LoadedModel, url: string];
  error: [error: Error, url: string];
  progress: [progress: number, url: string];
}

export class ModelLoader extends EventEmitter<ModelLoaderEvents> {
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader | null = null;
  private config: Required<ModelLoaderConfig>;
  private cache: Map<string, LoadedModel> = new Map();

  constructor(config: ModelLoaderConfig = {}) {
    super();

    this.config = {
      dracoDecoderPath: config.dracoDecoderPath ?? '/draco/',
      enableDraco: config.enableDraco ?? false,
      basePath: config.basePath ?? '',
    };

    this.loader = new GLTFLoader();

    if (this.config.enableDraco) {
      this.setupDraco();
    }
  }

  private setupDraco(): void {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(this.config.dracoDecoderPath);
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  /**
   * Enable Draco compression support
   */
  enableDraco(decoderPath?: string): this {
    if (decoderPath) {
      this.config.dracoDecoderPath = decoderPath;
    }
    this.config.enableDraco = true;
    this.setupDraco();
    return this;
  }

  /**
   * Load a GLTF/GLB model
   */
  async load(url: string, options: LoadOptions = {}): Promise<LoadedModel> {
    const fullUrl = (options.basePath ?? this.config.basePath) + url;

    // Check cache first
    if (this.cache.has(fullUrl)) {
      return this.cloneModel(this.cache.get(fullUrl)!);
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        fullUrl,
        (gltf) => {
          const model: LoadedModel = {
            scene: gltf.scene,
            animations: gltf.animations,
            scenes: gltf.scenes,
            cameras: gltf.cameras,
            parser: gltf.parser,
            userData: gltf.userData,
          };

          // Cache the original
          this.cache.set(fullUrl, model);

          this.emit('load', model, fullUrl);
          resolve(this.cloneModel(model));
        },
        (progress) => {
          const percent = progress.total > 0 ? progress.loaded / progress.total : 0;
          options.onProgress?.(percent);
          this.emit('progress', percent, fullUrl);
        },
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          this.emit('error', err, fullUrl);
          reject(err);
        }
      );
    });
  }

  /**
   * Preload multiple models for later use
   */
  async preload(urls: string[], options: LoadOptions = {}): Promise<LoadedModel[]> {
    return Promise.all(urls.map(url => this.load(url, options)));
  }

  /**
   * Check if a model is cached
   */
  isCached(url: string): boolean {
    const fullUrl = this.config.basePath + url;
    return this.cache.has(fullUrl);
  }

  /**
   * Get a cached model (returns clone if cached, undefined if not)
   */
  getCached(url: string): LoadedModel | undefined {
    const fullUrl = this.config.basePath + url;
    const cached = this.cache.get(fullUrl);
    return cached ? this.cloneModel(cached) : undefined;
  }

  /**
   * Clear the model cache
   */
  clearCache(): void {
    this.cache.forEach(model => {
      this.disposeModel(model);
    });
    this.cache.clear();
  }

  /**
   * Clone a model (for reusing cached models)
   */
  private cloneModel(model: LoadedModel): LoadedModel {
    return {
      scene: model.scene.clone(),
      animations: model.animations.map(clip => clip.clone()),
      scenes: model.scenes.map(scene => scene.clone()),
      cameras: model.cameras.map(camera => camera.clone()),
      parser: model.parser,
      userData: { ...model.userData },
    };
  }

  /**
   * Dispose of a model's resources
   */
  private disposeModel(model: LoadedModel): void {
    model.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material?.dispose();
        }
      }
    });
  }

  /**
   * Dispose of the loader and all cached models
   */
  dispose(): void {
    this.clearCache();
    this.dracoLoader?.dispose();
  }
}
