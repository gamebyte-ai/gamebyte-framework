/**
 * Renderer Compatibility Utilities
 *
 * Provides fallback mechanisms and compatibility helpers for working with
 * different versions of Pixi.js (v7/v8) and Three.js (r150-r180+)
 */

import * as PIXI from 'pixi.js';
import * as THREE from 'three';
import { PixiVersionDetector, ThreeVersionDetector, BrowserFeatureDetector } from './VersionDetection';
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

export interface ThreeRendererOptions {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  alpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  stencil?: boolean;
  depth?: boolean;
  logarithmicDepthBuffer?: boolean;
  precision?: 'highp' | 'mediump' | 'lowp';
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
 * Three.js Compatibility Helpers
 */
export class ThreeCompatibility {
  /**
   * Create a Three.js renderer with automatic version detection and fallback
   * Supports WebGPURenderer (r160+) with fallback to WebGLRenderer
   */
  static async createRenderer(options: ThreeRendererOptions): Promise<THREE.WebGLRenderer | any> {
    const hasWebGPURenderer = ThreeVersionDetector.hasWebGPURenderer();
    const hasWebGPU = BrowserFeatureDetector.hasWebGPU();
    const revision = ThreeVersionDetector.getRevision();

    Logger.info('Compatibility', 'Creating Three.js renderer:', {
      revision,
      hasWebGPURenderer,
      hasWebGPU,
      bestContext: BrowserFeatureDetector.getBestRenderingContext()
    });

    // Try WebGPU first if available (r160+)
    if (hasWebGPURenderer && hasWebGPU) {
      try {
        const webgpuRenderer = await this.createWebGPURenderer(options);
        Logger.info('Compatibility', 'Created WebGPU renderer');
        return webgpuRenderer;
      } catch (error) {
        Logger.warn('Compatibility', 'WebGPU renderer failed, falling back to WebGL:', error);
      }
    }

    // Fall back to WebGL
    Logger.info('Compatibility', 'Creating WebGL renderer');
    return this.createWebGLRenderer(options);
  }

  /**
   * Create WebGPU renderer (Three.js r160+)
   * WebGPURenderer is in examples/jsm, requires dynamic import
   */
  private static async createWebGPURenderer(options: ThreeRendererOptions): Promise<any> {
    try {
      // Dynamic import to avoid build-time resolution errors
      // @ts-expect-error - WebGPURenderer is in examples/jsm, not in main type definitions
      const { WebGPURenderer } = await import('three/examples/jsm/renderers/webgpu/WebGPURenderer.js');

      if (!WebGPURenderer) {
        throw new Error('WebGPURenderer not available after import');
      }

      const renderer = new WebGPURenderer({
        canvas: options.canvas,
        antialias: options.antialias !== false,
        alpha: options.alpha || false,
        powerPreference: options.powerPreference || 'high-performance'
      });

      await renderer.init();
      Logger.info('Compatibility', 'WebGPURenderer initialized successfully');
      return renderer;
    } catch (error) {
      Logger.warn('Compatibility', 'Failed to load WebGPURenderer:', error);
      throw new Error(`WebGPURenderer not available: ${error}`);
    }
  }

  /**
   * Create WebGL renderer (All Three.js versions)
   */
  private static createWebGLRenderer(options: ThreeRendererOptions): THREE.WebGLRenderer {
    const rendererOptions: THREE.WebGLRendererParameters = {
      canvas: options.canvas,
      antialias: options.antialias !== false,
      alpha: options.alpha || false,
      preserveDrawingBuffer: options.preserveDrawingBuffer || false,
      powerPreference: options.powerPreference || 'high-performance',
      stencil: options.stencil !== false,
      depth: options.depth !== false,
      logarithmicDepthBuffer: options.logarithmicDepthBuffer || false,
      precision: options.precision || 'highp'
    };

    return new THREE.WebGLRenderer(rendererOptions);
  }

  /**
   * Check if instanced rendering is available
   */
  static hasInstancedMesh(): boolean {
    return ThreeVersionDetector.hasInstancedMesh();
  }

  /**
   * Get InstancedMesh class if available
   */
  static getInstancedMesh(): any {
    if (this.hasInstancedMesh()) {
      return (THREE as any).InstancedMesh;
    }
    Logger.warn('Compatibility', 'InstancedMesh not available in this Three.js version');
    return null;
  }

  /**
   * Check if LOD (Level of Detail) is available
   */
  static hasLOD(): boolean {
    return ThreeVersionDetector.hasLOD();
  }

  /**
   * Get LOD class if available
   */
  static getLOD(): any {
    if (this.hasLOD()) {
      return THREE.LOD;
    }
    Logger.warn('Compatibility', 'LOD not available in this Three.js version');
    return null;
  }

  /**
   * Enable shadow optimization based on version
   */
  static optimizeShadows(renderer: THREE.WebGLRenderer | any, quality: 'low' | 'medium' | 'high' = 'medium'): void {
    const isWebGPU = renderer.isWebGPURenderer;

    if (!isWebGPU && renderer.shadowMap) {
      // WebGL shadow optimization
      renderer.shadowMap.enabled = true;

      switch (quality) {
        case 'low':
          renderer.shadowMap.type = THREE.BasicShadowMap;
          break;
        case 'medium':
          renderer.shadowMap.type = THREE.PCFShadowMap;
          break;
        case 'high':
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          break;
      }
    } else if (isWebGPU) {
      // WebGPU has built-in shadow support
      Logger.info('Compatibility', 'WebGPU renderer with native shadow support');
    }
  }

  /**
   * Get renderer type for diagnostics
   */
  static getRendererType(renderer: any): 'webgpu' | 'webgl2' | 'webgl' {
    if (renderer.isWebGPURenderer) {
      return 'webgpu';
    }

    const gl = renderer.getContext();
    if (gl && gl.constructor.name.includes('2')) {
      return 'webgl2';
    }

    return 'webgl';
  }
}

/**
 * General rendering compatibility helpers
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
   * Log compatibility report
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

    Logger.info('Compatibility', 'Three.js:', {
      revision: ThreeVersionDetector.getRevision(),
      isR180Plus: ThreeVersionDetector.isR180OrHigher(),
      hasWebGPU: ThreeVersionDetector.hasWebGPURenderer(),
      hasInstancedMesh: ThreeVersionDetector.hasInstancedMesh(),
      hasLOD: ThreeVersionDetector.hasLOD()
    });

    Logger.info('Compatibility', 'Recommendations:', {
      pixelRatio: this.getOptimalPixelRatio(),
      antialias: this.getRecommendedAntialias(),
      powerPreference: this.getRecommendedPowerPreference()
    });
  }
}
