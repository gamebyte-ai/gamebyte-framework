/**
 * GameByte Framework - 2D Renderer Bundle
 * 
 * Bu bundle sadece 2D oyunlar için gerekli dependency'leri içerir.
 * Kullanım: 2D oyun geliştirirken sadece bu bundle'ı import edin.
 */

// 2D renderer ve ilgili 2D bileşenler
export { PixiRenderer as Renderer2D } from '../rendering/PixiRenderer';

// 2D spesifik service provider'lar
export { RenderingServiceProvider } from '../services/RenderingServiceProvider';

// 2D spesifik facades
export { Renderer as RendererFacade } from '../facades/Renderer';

// 2D UI bileşenleri (Pixi.js tabanlı)
export { BaseUIComponent } from '../ui/core/BaseUIComponent';
export { GameByteUIManager } from '../ui/core/UIManager';
export { UIContainer } from '../ui/components/UIContainer';
export { UIButton } from '../ui/components/UIButton';
export { UIText } from '../ui/components/UIText';
export { UIPanel } from '../ui/components/UIPanel';
export { UIProgressBar } from '../ui/components/UIProgressBar';

// 2D animation sistemi
export { GameByteUIAnimationSystem } from '../ui/animations/UIAnimationSystem';

// 2D asset management
export { GameByteAssetManager as AssetManager2D } from '../assets/GameByteAssetManager';
export { TextureLoader as ImageLoader } from '../assets/loaders/TextureLoader';

// 2D performance optimizations
export { RenderingOptimizer as RenderingOptimizerClass } from '../performance/RenderingOptimizer';

// Re-export Pixi.js types for convenience
export type { 
  Renderer, 
  RendererOptions, 
  RendererStats 
} from '../contracts/Renderer';
export { RenderingMode } from '../contracts/Renderer';

// Utility function for 2D game creation
import { GameByte } from '../core/GameByte';
import { RenderingServiceProvider } from '../services/RenderingServiceProvider';
import { AssetServiceProvider } from '../services/AssetServiceProvider';
import { UIServiceProvider } from '../services/UIServiceProvider';
import { PerformanceServiceProvider } from '../services/PerformanceServiceProvider';
import { RenderingMode } from '../contracts/Renderer';

/**
 * Create a GameByte instance optimized for 2D games
 * Sadece 2D rendering için gerekli service'leri register eder
 */
export function create2DGame(): GameByte {
  const app = GameByte.create();
  
  // Sadece 2D için gerekli service provider'ları register et
  app.register(new RenderingServiceProvider());
  app.register(new AssetServiceProvider());
  app.register(new UIServiceProvider());
  app.register(new PerformanceServiceProvider());
  
  return app;
}

/**
 * Initialize a 2D game
 */
export async function initializeGame(
  app: GameByte, 
  canvas: HTMLCanvasElement, 
  options: any = {}
): Promise<void> {
  await app.initialize(canvas, RenderingMode.RENDERER_2D, {
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
    ...options
  });
}

export default {
  create2DGame,
  initializeGame,
  RenderingMode
};