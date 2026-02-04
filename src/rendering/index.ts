/**
 * Rendering Module - GameByte Framework
 *
 * Contains renderer implementations for 2D (Pixi.js) and factory utilities.
 * Note: ThreeRenderer and HybridRenderer are in the three-toolkit module.
 *
 * @module rendering
 * @example
 * ```typescript
 * import { PixiRenderer, RendererFactory } from '@gamebyte/framework/rendering';
 *
 * const renderer = new PixiRenderer();
 * await renderer.initialize({ width: 800, height: 600 });
 * ```
 */

export { PixiRenderer } from './PixiRenderer.js';
export type { PixiRendererConfig } from './PixiRenderer.js';
export { RendererFactory } from './RendererFactory.js';

// Note: ThreeRenderer and HybridRenderer are in @gamebyte/framework/three-toolkit
