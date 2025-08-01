import { Facade } from './Facade';
import { 
  AssetManager, 
  AssetConfig, 
  LoadedAsset, 
  AssetBundle, 
  BatchLoadingProgress, 
  AssetLoadingProgress,
  AssetLoader,
  AssetCache
} from '../contracts/AssetManager';

/**
 * Assets facade for static access to asset management functionality.
 * Provides a clean, static API for loading and managing game assets.
 */
export class Assets extends Facade {
  /**
   * Get the service key for the asset manager.
   */
  protected static getFacadeAccessor(): string {
    return 'asset.manager';
  }
  
  /**
   * Load a single asset.
   * 
   * @example
   * ```typescript
   * const texture = await Assets.load({
   *   id: 'player-sprite',
   *   type: AssetType.TEXTURE,
   *   src: '/assets/player.png'
   * });
   * ```
   */
  static async load<T = any>(config: AssetConfig): Promise<LoadedAsset<T>> {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.load<T>(config);
  }
  
  /**
   * Load multiple assets in batch.
   * 
   * @example
   * ```typescript
   * const assets = await Assets.loadBatch([
   *   { id: 'bg', type: AssetType.TEXTURE, src: '/assets/bg.jpg' },
   *   { id: 'music', type: AssetType.AUDIO, src: '/assets/music.mp3' }
   * ]);
   * ```
   */
  static async loadBatch(configs: AssetConfig[]): Promise<Map<string, LoadedAsset>> {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.loadBatch(configs);
  }
  
  /**
   * Load an asset bundle.
   * 
   * @example
   * ```typescript
   * const bundle = new GameByteAssetBundle({
   *   id: 'level1',
   *   name: 'Level 1 Assets',
   *   assets: [...]
   * });
   * const assets = await Assets.loadBundle(bundle);
   * ```
   */
  static async loadBundle(bundle: AssetBundle): Promise<Map<string, LoadedAsset>> {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.loadBundle(bundle);
  }
  
  /**
   * Get a loaded asset by ID.
   * 
   * @example
   * ```typescript
   * const playerTexture = Assets.get<ProcessedTexture>('player-sprite');
   * if (playerTexture) {
   *   // Use the texture
   *   const image = playerTexture.data.image;
   * }
   * ```
   */
  static get<T = any>(assetId: string): LoadedAsset<T> | null {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.get<T>(assetId);
  }
  
  /**
   * Check if an asset is loaded.
   * 
   * @example
   * ```typescript
   * if (Assets.has('player-sprite')) {
   *   const texture = Assets.get('player-sprite');
   * }
   * ```
   */
  static has(assetId: string): boolean {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.has(assetId);
  }
  
  /**
   * Unload an asset and free its memory.
   * 
   * @example
   * ```typescript
   * Assets.unload('old-level-bg');
   * ```
   */
  static unload(assetId: string): boolean {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.unload(assetId);
  }
  
  /**
   * Unload multiple assets.
   * 
   * @example
   * ```typescript
   * const unloadedCount = Assets.unloadBatch(['bg1', 'bg2', 'music1']);
   * console.log(`Unloaded ${unloadedCount} assets`);
   * ```
   */
  static unloadBatch(assetIds: string[]): number {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.unloadBatch(assetIds);
  }
  
  /**
   * Preload assets in the background.
   * 
   * @example
   * ```typescript
   * // Preload next level assets
   * Assets.preload([
   *   { id: 'level2-bg', type: AssetType.TEXTURE, src: '/assets/level2/bg.jpg' },
   *   { id: 'level2-music', type: AssetType.AUDIO, src: '/assets/level2/music.mp3' }
   * ]);
   * ```
   */
  static async preload(configs: AssetConfig[]): Promise<void> {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.preload(configs);
  }
  
  /**
   * Get batch loading progress.
   * 
   * @example
   * ```typescript
   * const progress = Assets.getBatchProgress();
   * if (progress) {
   *   console.log(`Loading: ${progress.loadedAssets}/${progress.totalAssets}`);
   * }
   * ```
   */
  static getBatchProgress(): BatchLoadingProgress | null {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.getBatchProgress();
  }
  
  /**
   * Get individual asset loading progress.
   * 
   * @example
   * ```typescript
   * const progress = Assets.getProgress('large-video');
   * if (progress) {
   *   console.log(`Progress: ${Math.round(progress.progress * 100)}%`);
   * }
   * ```
   */
  static getProgress(assetId: string): AssetLoadingProgress | null {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.getProgress(assetId);
  }
  
  /**
   * Cancel asset loading.
   * 
   * @example
   * ```typescript
   * Assets.cancel('large-video'); // Cancel if still loading
   * ```
   */
  static cancel(assetId: string): void {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.cancel(assetId);
  }
  
  /**
   * Register a custom asset loader.
   * 
   * @example
   * ```typescript
   * class CustomModelLoader extends BaseAssetLoader<CustomModel> {
   *   readonly supportedTypes = [AssetType.MODEL_3D];
   *   // ... implementation
   * }
   * 
   * Assets.registerLoader(new CustomModelLoader());
   * ```
   */
  static registerLoader(loader: AssetLoader): void {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.registerLoader(loader);
  }
  
  /**
   * Get the cache instance for advanced operations.
   * 
   * @example
   * ```typescript
   * const cache = Assets.getCache();
   * const stats = await cache.getStats();
   * console.log(`Cache hit rate: ${Math.round(stats.hitRate * 100)}%`);
   * ```
   */
  static getCache(): AssetCache {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.getCache();
  }
  
  /**
   * Get current memory usage statistics.
   * 
   * @example
   * ```typescript
   * const usage = Assets.getMemoryUsage();
   * console.log(`Memory usage: ${Math.round(usage.total / 1024 / 1024)}MB`);
   * ```
   */
  static getMemoryUsage(): { total: number; cached: number; active: number } {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.getMemoryUsage();
  }
  
  /**
   * Manually trigger memory optimization.
   * 
   * @example
   * ```typescript
   * // On level change or low memory warning
   * await Assets.optimizeMemory();
   * ```
   */
  static async optimizeMemory(): Promise<void> {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.optimizeMemory();
  }
  
  /**
   * Clean up and destroy the asset manager.
   * Usually called during app shutdown.
   * 
   * @example
   * ```typescript
   * window.addEventListener('beforeunload', () => {
   *   Assets.destroy();
   * });
   * ```
   */
  static async destroy(): Promise<void> {
    const manager = this.resolveFacadeInstance() as AssetManager;
    return manager.destroy();
  }
  
  // Convenience methods for common asset operations
  
  /**
   * Load a texture asset with optimized settings.
   * 
   * @example
   * ```typescript
   * const texture = await Assets.loadTexture('player-sprite', '/assets/player.png', {
   *   quality: 'high',
   *   generateMipmaps: true
   * });
   * ```
   */
  static async loadTexture(
    id: string, 
    src: string, 
    options?: {
      quality?: 'low' | 'medium' | 'high' | 'auto';
      generateMipmaps?: boolean;
      maxSize?: number;
    }
  ): Promise<LoadedAsset> {
    return this.load({
      id,
      type: 'texture' as any,
      src,
      options: {
        ...options,
        cache: true
      }
    });
  }
  
  /**
   * Load an audio asset with optimized settings.
   * 
   * @example
   * ```typescript
   * const audio = await Assets.loadAudio('bgm', '/assets/music.mp3', {
   *   streaming: true,
   *   quality: 'medium'
   * });
   * ```
   */
  static async loadAudio(
    id: string, 
    src: string, 
    options?: {
      streaming?: boolean;
      quality?: 'low' | 'medium' | 'high';
      normalize?: boolean;
    }
  ): Promise<LoadedAsset> {
    return this.load({
      id,
      type: 'audio' as any,
      src,
      options: {
        ...options,
        cache: true
      }
    });
  }
  
  /**
   * Load a JSON data asset.
   * 
   * @example
   * ```typescript
   * const levelData = await Assets.loadJSON<LevelConfig>('level1', '/data/level1.json');
   * const config = levelData.data.data; // Access the parsed JSON
   * ```
   */
  static async loadJSON<T = any>(
    id: string, 
    src: string, 
    options?: {
      schema?: any;
      transform?: (data: any) => T;
      strict?: boolean;
    }
  ): Promise<LoadedAsset<{ data: T; size: number; valid: boolean }>> {
    return this.load({
      id,
      type: 'json' as any,
      src,
      options: {
        ...options,
        cache: true
      }
    });
  }
  
  /**
   * Batch load common game assets.
   * 
   * @example
   * ```typescript
   * const gameAssets = await Assets.loadGameAssets({
   *   textures: {
   *     'player': '/assets/player.png',
   *     'enemy': '/assets/enemy.png'
   *   },
   *   audio: {
   *     'jump': '/assets/sounds/jump.wav',
   *     'bgm': '/assets/music/level1.mp3'
   *   },
   *   data: {
   *     'config': '/data/game-config.json'
   *   }
   * });
   * ```
   */
  static async loadGameAssets(assets: {
    textures?: Record<string, string>;
    audio?: Record<string, string>;
    data?: Record<string, string>;
  }): Promise<Map<string, LoadedAsset>> {
    const configs: AssetConfig[] = [];
    
    // Add texture assets
    if (assets.textures) {
      for (const [id, src] of Object.entries(assets.textures)) {
        configs.push({
          id: `texture_${id}`,
          type: 'texture' as any,
          src,
          options: { cache: true, quality: 'auto' }
        });
      }
    }
    
    // Add audio assets
    if (assets.audio) {
      for (const [id, src] of Object.entries(assets.audio)) {
        configs.push({
          id: `audio_${id}`,
          type: 'audio' as any,
          src,
          options: { cache: true, quality: 'medium' }
        });
      }
    }
    
    // Add data assets
    if (assets.data) {
      for (const [id, src] of Object.entries(assets.data)) {
        configs.push({
          id: `data_${id}`,
          type: 'json' as any,
          src,
          options: { cache: true }
        });
      }
    }
    
    return this.loadBatch(configs);
  }
  
  /**
   * Create a simple asset loading progress callback.
   * 
   * @example
   * ```typescript
   * const stopProgress = Assets.onBatchProgress((progress) => {
   *   updateLoadingBar(progress.progress);
   *   if (progress.progress === 1) {
   *     stopProgress(); // Stop listening
   *   }
   * });
   * ```
   */
  static onBatchProgress(callback: (progress: BatchLoadingProgress) => void): () => void {
    const manager = this.resolveFacadeInstance() as AssetManager;
    
    const progressHandler = (progress: BatchLoadingProgress) => {
      callback(progress);
    };
    
    manager.on('batch:progress', progressHandler);
    
    // Return cleanup function
    return () => {
      manager.off('batch:progress', progressHandler);
    };
  }
  
  /**
   * Wait for all assets to finish loading.
   * 
   * @example
   * ```typescript
   * Assets.preload(preloadAssets);
   * await Assets.waitForAll();
   * console.log('All assets loaded!');
   * ```
   */
  static async waitForAll(): Promise<void> {
    return new Promise<void>((resolve) => {
      const manager = this.resolveFacadeInstance() as AssetManager;
      
      const checkProgress = () => {
        const progress = manager.getBatchProgress();
        if (!progress || progress.progress === 1) {
          resolve();
        } else {
          setTimeout(checkProgress, 100);
        }
      };
      
      checkProgress();
    });
  }
}