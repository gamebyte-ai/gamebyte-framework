import { Renderer, RenderingMode } from '../contracts/Renderer';
import { Logger } from '../utils/Logger.js';
import { PixiRenderer } from './PixiRenderer';
// ThreeRenderer NOT imported statically to avoid bundling in UMD
// import { ThreeRenderer } from './ThreeRenderer';

/**
 * Factory for creating renderer instances based on rendering mode.
 * Supports 2D, 3D, and hybrid rendering across all platforms.
 * Does not make assumptions about device capabilities - respects developer choice.
 */
export class RendererFactory {
  /**
   * Create a renderer instance based on the specified mode.
   */
  static create(mode: RenderingMode): Renderer {
    switch (mode) {
      case RenderingMode.RENDERER_2D:
        return new PixiRenderer();

      case RenderingMode.RENDERER_3D:
        // ThreeRenderer not available in UMD builds
        // Use dist/renderers/three3d.js for 3D rendering
        throw new Error(
          '3D renderer not available in main bundle. ' +
          'Please use dist/renderers/three3d.js for 3D rendering, ' +
          'or import ThreeRenderer directly in ESM/CJS environments.'
        );

      case RenderingMode.HYBRID:
        // For hybrid mode, we'll default to 2D renderer and allow 3D overlay
        // This can be extended later for more sophisticated hybrid rendering
        return new PixiRenderer();

      default:
        // Fallback to 2D renderer if mode is not recognized
        Logger.warn('Renderer', `Unsupported rendering mode: ${mode}. Falling back to 2D renderer.`);
        return new PixiRenderer();
    }
  }

  /**
   * Get all supported rendering modes.
   */
  static getSupportedModes(): RenderingMode[] {
    return [
      RenderingMode.RENDERER_2D,
      RenderingMode.RENDERER_3D,
      RenderingMode.HYBRID
    ];
  }

  /**
   * Check if a rendering mode is supported.
   */
  static isSupported(mode: RenderingMode): boolean {
    return this.getSupportedModes().includes(mode);
  }

  /**
   * Create a renderer with automatic fallback if the requested mode is not supported.
   */
  static createWithFallback(preferredMode: RenderingMode, fallbackMode?: RenderingMode): Renderer {
    try {
      // Check if WebGL is required and available
      if (preferredMode === RenderingMode.RENDERER_3D || preferredMode === RenderingMode.HYBRID) {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl && preferredMode === RenderingMode.RENDERER_3D) {
          Logger.warn('Renderer', 'WebGL not supported, falling back to 2D renderer');
          return this.create(fallbackMode || RenderingMode.RENDERER_2D);
        }
      }
      
      return this.create(preferredMode);
    } catch (error) {
      Logger.warn('Renderer', `Failed to create ${preferredMode} renderer:`, error);
      if (fallbackMode && fallbackMode !== preferredMode) {
        Logger.info('Renderer', `Falling back to ${fallbackMode} renderer`);
        return this.create(fallbackMode);
      }
      // Final fallback to 2D
      return this.create(RenderingMode.RENDERER_2D);
    }
  }

  /**
   * Detect the best rendering mode based on browser capabilities.
   * This method does not make assumptions about device type - both 2D and 3D
   * are available on all platforms. The choice should be made by the developer.
   */
  static detectBestMode(): RenderingMode {
    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      // Fallback to 2D if WebGL is not supported
      Logger.info('Renderer', 'WebGL not supported, defaulting to 2D renderer');
      return RenderingMode.RENDERER_2D;
    }

    // Default to 2D renderer - developers should explicitly choose 3D when needed
    // This ensures consistent behavior across all platforms
    return RenderingMode.RENDERER_2D;
  }
}