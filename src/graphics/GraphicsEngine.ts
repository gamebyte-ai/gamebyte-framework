/**
 * Graphics Engine
 *
 * Provides access to renderer-agnostic graphics primitives.
 * Automatically selects the correct factory based on the active renderer.
 */

import { IGraphicsEngine, IGraphicsFactory } from '../contracts/Graphics';
import { PixiGraphicsFactory } from './PixiGraphicsFactory';
import { RenderingMode } from '../contracts/Renderer';

/**
 * Graphics Engine Singleton
 *
 * Usage:
 * ```typescript
 * import { GraphicsEngine } from '@gamebyte/core';
 *
 * // In your UI component or game object
 * const factory = GraphicsEngine.getFactory();
 * const container = factory.createContainer();
 * const text = factory.createText('Hello World', { fontSize: 24 });
 * ```
 */
export class GraphicsEngine implements IGraphicsEngine {
  private static instance: GraphicsEngine;
  private _factory: IGraphicsFactory;
  private _type: 'PIXI' | 'THREE';

  private constructor(renderingMode: RenderingMode) {
    if (renderingMode === RenderingMode.RENDERER_2D) {
      this._factory = new PixiGraphicsFactory();
      this._type = 'PIXI';
    } else {
      // For 3D rendering, dynamically import ThreeGraphicsFactory
      // This avoids bundling CSS2DRenderer in UMD builds where Three.js is external
      throw new Error(
        'ThreeGraphicsFactory must be loaded dynamically for 3D mode. ' +
        'Use GraphicsEngine.initialize3D() instead of initialize() for 3D rendering.'
      );
    }
  }

  get factory(): IGraphicsFactory {
    return this._factory;
  }

  get type(): 'PIXI' | 'THREE' {
    return this._type;
  }

  /**
   * Initialize the graphics engine with a rendering mode
   */
  static initialize(renderingMode: RenderingMode): void {
    GraphicsEngine.instance = new GraphicsEngine(renderingMode);
  }

  /**
   * Get the current graphics factory
   * Throws error if not initialized
   */
  static getFactory(): IGraphicsFactory {
    if (!GraphicsEngine.instance) {
      throw new Error(
        'GraphicsEngine not initialized. Call GraphicsEngine.initialize(renderingMode) first.'
      );
    }
    return GraphicsEngine.instance.factory;
  }

  /**
   * Get the current renderer type
   */
  static getType(): 'PIXI' | 'THREE' {
    if (!GraphicsEngine.instance) {
      throw new Error('GraphicsEngine not initialized.');
    }
    return GraphicsEngine.instance.type;
  }

  /**
   * Check if graphics engine is initialized
   */
  static isInitialized(): boolean {
    return GraphicsEngine.instance !== undefined;
  }

  /**
   * Switch to a different renderer
   * This allows runtime switching between 2D and 3D
   */
  static switch(renderingMode: RenderingMode): void {
    GraphicsEngine.instance = new GraphicsEngine(renderingMode);
  }
}

/**
 * Convenience function to get graphics factory
 *
 * Usage:
 * ```typescript
 * import { graphics } from '@gamebyte/core';
 *
 * const button = graphics().createContainer();
 * ```
 */
export function graphics(): IGraphicsFactory {
  return GraphicsEngine.getFactory();
}
