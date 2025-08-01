/**
 * GameByte Framework - 3D Renderer Bundle
 * 
 * Bu bundle sadece 3D oyunlar için gerekli dependency'leri içerir.
 * Kullanım: 3D oyun geliştirirken sadece bu bundle'ı import edin.
 */

// 3D renderer ve ilgili 3D bileşenler
export { ThreeRenderer as Renderer3D } from '../rendering/ThreeRenderer';

// 3D spesifik service provider'lar
export { RenderingServiceProvider } from '../services/RenderingServiceProvider';

// 3D spesifik facades
export { Renderer as RendererFacade } from '../facades/Renderer';

// 3D asset management
export { GameByteAssetManager as AssetManager3D } from '../assets/GameByteAssetManager';
export { AudioLoader } from '../assets/loaders/AudioLoader';
export { JSONLoader as ModelLoader } from '../assets/loaders/JSONLoader';

// 3D performance optimizations
export { RenderingOptimizer as RenderingOptimizerClass } from '../performance/RenderingOptimizer';
export { DeviceDetector } from '../performance/DeviceDetector';

// 3D audio (spatial audio)
export { GameByteAudioManager as AudioManager3D } from '../audio/core/GameByteAudioManager';
export { GameByteSpatialAudioSystem as SpatialAudio } from '../audio/spatial/GameByteSpatialAudioSystem';

// Re-export Three.js types for convenience
export type { 
  Renderer, 
  RendererOptions, 
  RendererStats 
} from '../contracts/Renderer';
export { RenderingMode } from '../contracts/Renderer';

// Utility function for 3D game creation
import { GameByte } from '../core/GameByte';
import { RenderingServiceProvider } from '../services/RenderingServiceProvider';
import { AssetServiceProvider } from '../services/AssetServiceProvider';
import { AudioServiceProvider } from '../services/AudioServiceProvider';
import { PerformanceServiceProvider } from '../services/PerformanceServiceProvider';
import { RenderingMode } from '../contracts/Renderer';

/**
 * Create a GameByte instance optimized for 3D games
 * Sadece 3D rendering için gerekli service'leri register eder
 */
export function create3DGame(): GameByte {
  const app = GameByte.create();
  
  // Sadece 3D için gerekli service provider'ları register et
  app.register(new RenderingServiceProvider());
  app.register(new AssetServiceProvider());
  app.register(new AudioServiceProvider()); // 3D spatial audio için
  app.register(new PerformanceServiceProvider());
  
  return app;
}

/**
 * Initialize a 3D game
 */
export async function initializeGame(
  app: GameByte, 
  canvas: HTMLCanvasElement, 
  options: any = {}
): Promise<void> {
  await app.initialize(canvas, RenderingMode.RENDERER_3D, {
    width: 800,
    height: 600,
    backgroundColor: 0x000000,
    ...options
  });
}

export default {
  create3DGame,
  initializeGame,
  RenderingMode
};