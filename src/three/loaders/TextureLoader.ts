/**
 * TextureLoader3D - Enhanced texture loading for Three.js
 *
 * @example
 * ```typescript
 * const loader = new TextureLoader3D();
 *
 * // Load a texture
 * const texture = await loader.load('/textures/diffuse.jpg');
 *
 * // Load with options
 * const texture = await loader.load('/textures/diffuse.jpg', {
 *   wrapS: THREE.RepeatWrapping,
 *   wrapT: THREE.RepeatWrapping,
 *   repeat: { x: 2, y: 2 }
 * });
 *
 * // Load a cubemap for skybox
 * const cubeTexture = await loader.loadCubeMap([
 *   'px.jpg', 'nx.jpg',
 *   'py.jpg', 'ny.jpg',
 *   'pz.jpg', 'nz.jpg'
 * ], '/textures/skybox/');
 * ```
 */

import * as THREE from 'three';
import { EventEmitter } from 'eventemitter3';

export interface TextureOptions {
  /** Wrap mode for S (horizontal) */
  wrapS?: THREE.Wrapping;
  /** Wrap mode for T (vertical) */
  wrapT?: THREE.Wrapping;
  /** Texture repeat */
  repeat?: { x: number; y: number };
  /** Texture offset */
  offset?: { x: number; y: number };
  /** Min filter */
  minFilter?: THREE.MinificationTextureFilter;
  /** Mag filter */
  magFilter?: THREE.MagnificationTextureFilter;
  /** Generate mipmaps (default: true) */
  generateMipmaps?: boolean;
  /** Flip Y axis (default: true) */
  flipY?: boolean;
  /** Anisotropy level (default: 1) */
  anisotropy?: number;
  /** Color space (default: SRGBColorSpace) */
  colorSpace?: THREE.ColorSpace;
}

export interface TextureLoader3DConfig {
  /** Base path for all texture URLs */
  basePath?: string;
  /** Default texture options */
  defaults?: TextureOptions;
}

export interface TextureLoader3DEvents {
  load: [texture: THREE.Texture, url: string];
  error: [error: Error, url: string];
  progress: [progress: number, url: string];
}

export class TextureLoader3D extends EventEmitter<TextureLoader3DEvents> {
  private loader: THREE.TextureLoader;
  private cubeLoader: THREE.CubeTextureLoader;
  private config: Required<TextureLoader3DConfig>;
  private cache: Map<string, THREE.Texture> = new Map();

  constructor(config: TextureLoader3DConfig = {}) {
    super();

    this.config = {
      basePath: config.basePath ?? '',
      defaults: config.defaults ?? {},
    };

    this.loader = new THREE.TextureLoader();
    this.cubeLoader = new THREE.CubeTextureLoader();
  }

  /**
   * Load a texture
   */
  async load(url: string, options: TextureOptions = {}): Promise<THREE.Texture> {
    const fullUrl = this.config.basePath + url;

    // Check cache
    if (this.cache.has(fullUrl)) {
      return this.cache.get(fullUrl)!.clone();
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        fullUrl,
        (texture) => {
          this.applyOptions(texture, { ...this.config.defaults, ...options });
          this.cache.set(fullUrl, texture);
          this.emit('load', texture, fullUrl);
          // Return clone to keep cache pristine (consistent with cache hit behavior)
          resolve(texture.clone());
        },
        (progress) => {
          const percent = progress.total > 0 ? progress.loaded / progress.total : 0;
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
   * Load a cube texture (for skyboxes/environment maps)
   */
  async loadCubeMap(
    urls: [string, string, string, string, string, string],
    basePath?: string
  ): Promise<THREE.CubeTexture> {
    const path = basePath ?? this.config.basePath;
    this.cubeLoader.setPath(path);

    return new Promise((resolve, reject) => {
      this.cubeLoader.load(
        urls,
        (texture) => {
          this.emit('load', texture as unknown as THREE.Texture, path);
          resolve(texture);
        },
        (progress) => {
          const percent = progress.total > 0 ? progress.loaded / progress.total : 0;
          this.emit('progress', percent, path);
        },
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          this.emit('error', err, path);
          reject(err);
        }
      );
    });
  }

  /**
   * Load multiple textures
   */
  async loadAll(
    urls: string[],
    options: TextureOptions = {}
  ): Promise<Map<string, THREE.Texture>> {
    const results = new Map<string, THREE.Texture>();
    await Promise.all(
      urls.map(async (url) => {
        const texture = await this.load(url, options);
        results.set(url, texture);
      })
    );
    return results;
  }

  /**
   * Create a data texture from raw data
   */
  createDataTexture(
    data: Uint8Array | Float32Array,
    width: number,
    height: number,
    format: THREE.PixelFormat = THREE.RGBAFormat,
    type: THREE.TextureDataType = THREE.UnsignedByteType
  ): THREE.DataTexture {
    const texture = new THREE.DataTexture(data, width, height, format, type);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Create a canvas texture
   */
  createCanvasTexture(
    canvas: HTMLCanvasElement,
    options: TextureOptions = {}
  ): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    this.applyOptions(texture, { ...this.config.defaults, ...options });
    return texture;
  }

  private applyOptions(texture: THREE.Texture, options: TextureOptions): void {
    if (options.wrapS !== undefined) texture.wrapS = options.wrapS;
    if (options.wrapT !== undefined) texture.wrapT = options.wrapT;
    if (options.repeat) texture.repeat.set(options.repeat.x, options.repeat.y);
    if (options.offset) texture.offset.set(options.offset.x, options.offset.y);
    if (options.minFilter !== undefined) texture.minFilter = options.minFilter;
    if (options.magFilter !== undefined) texture.magFilter = options.magFilter;
    if (options.generateMipmaps !== undefined) texture.generateMipmaps = options.generateMipmaps;
    if (options.flipY !== undefined) texture.flipY = options.flipY;
    if (options.anisotropy !== undefined) texture.anisotropy = options.anisotropy;
    if (options.colorSpace !== undefined) texture.colorSpace = options.colorSpace;
  }

  /**
   * Check if a texture is cached
   */
  isCached(url: string): boolean {
    return this.cache.has(this.config.basePath + url);
  }

  /**
   * Clear the texture cache
   */
  clearCache(): void {
    this.cache.forEach(texture => texture.dispose());
    this.cache.clear();
  }

  /**
   * Dispose of the loader
   */
  dispose(): void {
    this.clearCache();
  }
}
