/**
 * Graphics Engine
 *
 * Provides access to renderer-agnostic graphics primitives.
 * Automatically selects the correct factory based on the active renderer.
 */

import { IGraphicsEngine, IGraphicsFactory, ITexture } from '../contracts/Graphics';
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

  private constructor(renderingMode: RenderingMode, factory?: IGraphicsFactory) {
    if (factory) {
      this._factory = factory;
      this._type = renderingMode === RenderingMode.RENDERER_2D ? 'PIXI' : 'THREE';
    } else if (renderingMode === RenderingMode.RENDERER_2D) {
      this._factory = new PixiGraphicsFactory();
      this._type = 'PIXI';
    } else {
      // For 3D rendering, use initialize3D() which loads ThreeGraphicsFactory dynamically
      throw new Error(
        'For 3D mode, use GraphicsEngine.initialize3D() which loads the Three.js factory dynamically. ' +
        'Example: await GraphicsEngine.initialize3D();'
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
   * Initialize the graphics engine with a rendering mode (2D only)
   * For 3D mode, use initialize3D() instead
   */
  static initialize(renderingMode: RenderingMode): void {
    GraphicsEngine.instance = new GraphicsEngine(renderingMode);
  }

  /**
   * Initialize the graphics engine for 3D rendering
   * This loads ThreeGraphicsFactory dynamically to avoid bundling issues
   */
  static async initialize3D(): Promise<void> {
    try {
      const { ThreeGraphicsFactory } = await import('./ThreeGraphicsFactory');
      GraphicsEngine.instance = new GraphicsEngine(RenderingMode.RENDERER_3D, new ThreeGraphicsFactory());
    } catch (error) {
      throw new Error(
        'Failed to load ThreeGraphicsFactory. Make sure Three.js is available. ' +
        'Error: ' + (error instanceof Error ? error.message : String(error))
      );
    }
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

/**
 * Draw any display object to a texture
 *
 * For 2D (Pixi): Requires the renderer from game.renderer
 * For 3D (Three): Uses canvas-based rendering
 *
 * Usage:
 * ```typescript
 * import { drawToTexture } from '@gamebyte/core';
 *
 * const icon = graphics().createGraphics();
 * icon.circle(16, 16, 16).fill({ color: 0xff0000 });
 * const texture = await drawToTexture(icon, game.renderer);
 * ```
 */
export async function drawToTexture(
  displayObject: any,
  renderer: any,
  options?: { width?: number; height?: number; resolution?: number }
): Promise<ITexture> {
  const type = GraphicsEngine.getType();

  if (type === 'PIXI') {
    // For Pixi v8, use RenderTexture
    const PIXI = await import('pixi.js');

    // Get bounds of the display object
    const bounds = displayObject.getBounds?.() || { width: options?.width || 64, height: options?.height || 64 };
    const width = options?.width || bounds.width || 64;
    const height = options?.height || bounds.height || 64;
    const resolution = options?.resolution || window.devicePixelRatio || 1;

    // Create render texture
    const renderTexture = PIXI.RenderTexture.create({
      width,
      height,
      resolution
    });

    // Get the native Pixi renderer
    const nativeRenderer = renderer.getNativeRenderer?.() || renderer;

    // Render the display object to the texture
    if (nativeRenderer.render) {
      nativeRenderer.render({ container: displayObject, target: renderTexture });
    }

    return renderTexture as ITexture;
  } else {
    // For Three.js, render to canvas and create texture
    const canvas = document.createElement('canvas');
    const width = options?.width || 64;
    const height = options?.height || 64;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx && displayObject.element instanceof HTMLCanvasElement) {
      // If it's a canvas-based graphics, copy it
      ctx.drawImage(displayObject.element, 0, 0);
    }

    return GraphicsEngine.getFactory().createTexture(canvas);
  }
}
