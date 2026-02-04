/**
 * Graphics Module - GameByte Framework
 *
 * Provides renderer-agnostic graphics primitives and factories.
 *
 * @module graphics
 * @example
 * ```typescript
 * import { GraphicsEngine, graphics, PixiGraphicsFactory } from '@gamebyte/framework/graphics';
 *
 * GraphicsEngine.initialize(RenderingMode.RENDERER_2D);
 * const factory = graphics();
 * const container = factory.createContainer();
 * ```
 */

export { GraphicsEngine, graphics, drawToTexture } from './GraphicsEngine.js';
export type { DrawToTextureOptions } from './GraphicsEngine.js';
export { PixiGraphicsFactory } from './PixiGraphicsFactory.js';

// Gradient System
export {
  Gradients,
  createLinearGradient,
  createRadialGradient,
  linearGradient,
  radialGradient
} from './GradientFactory.js';
export type {
  GradientFill,
  GradientColorStop,
  LinearGradientOptions,
  RadialGradientOptions
} from './GradientFactory.js';

// Note: ThreeGraphicsFactory is in @gamebyte/framework/three-toolkit
