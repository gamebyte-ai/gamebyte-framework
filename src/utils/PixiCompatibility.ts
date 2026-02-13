/**
 * Pixi.js Compatibility Utilities
 *
 * Provides compatibility helpers for working with Pixi.js v8+
 */

import * as PIXI from 'pixi.js';
import { PixiVersionDetector, BrowserFeatureDetector } from './PixiVersionDetection';
import { Logger } from './Logger.js';

export interface PixiRendererOptions {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  backgroundColor?: number;
  backgroundAlpha?: number;
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  resolution?: number;
  autoDensity?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  preference?: 'webgpu' | 'webgl2' | 'webgl'; // v8 feature
}

/**
 * Pixi.js Compatibility Helpers
 */
export class PixiCompatibility {
  /**
   * Create a Pixi v8 renderer using autoDetectRenderer
   * Framework only supports Pixi v8+
   */
  static async createRenderer(options: PixiRendererOptions): Promise<any> {
    const version = PixiVersionDetector.getVersion();
    const features = BrowserFeatureDetector.getBestRenderingContext();

    Logger.info('Compatibility', 'Creating Pixi v8 renderer:', {
      version: version.raw,
      bestContext: features
    });

    return this.createV8Renderer(options);
  }

  /**
   * Create renderer using Pixi.js v8 API (autoDetectRenderer with WebGPU support)
   * Framework requires Pixi v8+
   */
  private static async createV8Renderer(options: PixiRendererOptions): Promise<any> {
    const autoDetect = (PIXI as any).autoDetectRenderer;

    if (!autoDetect) {
      throw new Error('Pixi.js v8 autoDetectRenderer not found. Framework requires Pixi v8+');
    }

    // Determine preferred renderer type based on browser capabilities
    // Default to WebGL (stable) instead of WebGPU (experimental)
    let preference = options.preference || 'webgl';

    if (preference === 'webgpu' && !BrowserFeatureDetector.hasWebGPU()) {
      Logger.warn('Compatibility', 'WebGPU not available, falling back to WebGL2');
      preference = 'webgl2';
    }

    if (preference === 'webgl2' && !BrowserFeatureDetector.hasWebGL2()) {
      Logger.warn('Compatibility', 'WebGL2 not available, falling back to WebGL');
      preference = 'webgl';
    }

    // Create renderer with v8 API
    const rendererOptions = {
      canvas: options.canvas,
      width: options.width || 800,
      height: options.height || 600,
      backgroundColor: options.backgroundColor,
      backgroundAlpha: options.backgroundAlpha,
      antialias: options.antialias !== false,
      preserveDrawingBuffer: options.preserveDrawingBuffer || false,
      resolution: options.resolution || (window.devicePixelRatio || 1),
      autoDensity: options.autoDensity ?? true,
      powerPreference: options.powerPreference,
      preference
    }

    Logger.info('Compatibility', 'Creating Pixi v8 renderer with preference:', preference);
    const renderer = await autoDetect(rendererOptions);

    return renderer;
  }

  /**
   * Check if ParticleContainer is available and return appropriate container class
   */
  static getParticleContainer(): any {
    if (PixiVersionDetector.hasParticleContainer()) {
      return (PIXI as any).ParticleContainer;
    }

    Logger.warn('Compatibility', 'ParticleContainer not available, using regular Container');
    return (PIXI as any).Container;
  }

  /**
   * Get the renderer instance (Pixi v8 returns renderer directly)
   */
  static getRenderer(renderer: any): any {
    return renderer;
  }

  /**
   * Get the canvas from Pixi v8 renderer
   */
  static getCanvas(renderer: any): HTMLCanvasElement {
    if (renderer.view) {
      return renderer.view.canvas || renderer.view;
    }

    if (renderer.canvas) {
      return renderer.canvas;
    }

    throw new Error('Could not find canvas on Pixi v8 renderer');
  }

  /**
   * Get or create stage for Pixi v8 renderer
   */
  static getStage(renderer: any): any {
    // v8 doesn't have stage, need to create one
    const Container = (PIXI as any).Container;
    return new Container();
  }

  /**
   * Resize Pixi v8 renderer
   */
  static resize(renderer: any, width: number, height: number): void {
    if (renderer.resize) {
      renderer.resize(width, height);
    } else {
      throw new Error('Resize method not found on Pixi v8 renderer');
    }
  }

  /**
   * Render with Pixi v8 renderer
   */
  static render(renderer: any, stage: any): void {
    if (renderer.render) {
      renderer.render(stage);
    } else {
      throw new Error('Render method not found on Pixi v8 renderer');
    }
  }
}

/**
 * General rendering compatibility helpers (Pixi-only version)
 */
export class RenderingCompatibility {
  /**
   * Detect optimal pixel ratio for device
   */
  static getOptimalPixelRatio(): number {
    const dpr = window.devicePixelRatio || 1;
    const isMobile = BrowserFeatureDetector.isMobile();

    // Limit pixel ratio on mobile to save performance
    if (isMobile) {
      return Math.min(dpr, 2);
    }

    // Desktop can handle higher DPR
    return Math.min(dpr, 3);
  }

  /**
   * Get recommended anti-aliasing setting
   */
  static getRecommendedAntialias(): boolean {
    const isMobile = BrowserFeatureDetector.isMobile();
    const hasWebGPU = BrowserFeatureDetector.hasWebGPU();

    // WebGPU has better AA performance
    if (hasWebGPU) {
      return true;
    }

    // Mobile with WebGL - disable AA for performance
    if (isMobile) {
      return false;
    }

    // Desktop with WebGL - enable AA
    return true;
  }

  /**
   * Get recommended power preference
   */
  static getRecommendedPowerPreference(): 'default' | 'high-performance' | 'low-power' {
    const isMobile = BrowserFeatureDetector.isMobile();
    const hasBattery = BrowserFeatureDetector.hasBatteryAPI();

    if (isMobile || hasBattery) {
      // Mobile and battery-powered devices: balance performance and battery
      return 'default';
    }

    // Desktop: prefer high performance
    return 'high-performance';
  }

  /**
   * Log compatibility report (Pixi only)
   */
  static logCompatibilityReport(): void {
    Logger.info('Compatibility', 'Rendering Compatibility Report');

    Logger.info('Compatibility', 'Pixi.js:', {
      version: PixiVersionDetector.getVersion().raw,
      isV8: PixiVersionDetector.isV8OrHigher(),
      hasWebGPU: PixiVersionDetector.getFeatureSupport().webgpu,
      hasAutoDetect: PixiVersionDetector.hasAutoDetectRenderer(),
      hasParticleContainer: PixiVersionDetector.hasParticleContainer()
    });

    Logger.info('Compatibility', 'Recommendations:', {
      pixelRatio: this.getOptimalPixelRatio(),
      antialias: this.getRecommendedAntialias(),
      powerPreference: this.getRecommendedPowerPreference()
    });
  }
}
