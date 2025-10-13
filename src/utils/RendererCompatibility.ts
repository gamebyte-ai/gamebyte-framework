/**
 * Renderer Compatibility Utilities
 *
 * Provides fallback mechanisms and compatibility helpers for working with
 * different versions of Pixi.js (v7/v8) and Three.js (r150-r180+)
 */

import * as PIXI from 'pixi.js';
import * as THREE from 'three';
import { PixiVersionDetector, ThreeVersionDetector, BrowserFeatureDetector } from './VersionDetection';

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
   * Create a Pixi renderer with automatic version detection and fallback
   * Supports both v7 (Application) and v8 (autoDetectRenderer)
   */
  static async createRenderer(options: PixiRendererOptions): Promise<any> {
    const isV8 = PixiVersionDetector.isV8OrHigher();
    const hasAutoDetect = PixiVersionDetector.hasAutoDetectRenderer();
    const features = BrowserFeatureDetector.getBestRenderingContext();

    console.log('🎨 Creating Pixi renderer:', {
      version: PixiVersionDetector.getVersion().raw,
      isV8,
      hasAutoDetect,
      bestContext: features
    });

    if (isV8 && hasAutoDetect) {
      return this.createV8Renderer(options);
    } else {
      return this.createV7Renderer(options);
    }
  }

  /**
   * Create renderer using Pixi.js v8 API (autoDetectRenderer with WebGPU support)
   */
  private static async createV8Renderer(options: PixiRendererOptions): Promise<any> {
    try {
      const autoDetect = (PIXI as any).autoDetectRenderer;

      if (!autoDetect) {
        console.warn('⚠️ autoDetectRenderer not found, falling back to v7 API');
        return this.createV7Renderer(options);
      }

      // Determine preferred renderer type based on browser capabilities
      let preference = options.preference || 'webgpu';

      if (preference === 'webgpu' && !BrowserFeatureDetector.hasWebGPU()) {
        console.log('⚠️ WebGPU not available, falling back to WebGL2');
        preference = 'webgl2';
      }

      if (preference === 'webgl2' && !BrowserFeatureDetector.hasWebGL2()) {
        console.log('⚠️ WebGL2 not available, falling back to WebGL');
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
        autoDensity: options.autoDensity !== false,
        powerPreference: options.powerPreference || 'default',
        preference
      };

      console.log('✅ Creating Pixi v8 renderer with preference:', preference);
      const renderer = await autoDetect(rendererOptions);

      return renderer;
    } catch (error) {
      console.error('❌ Failed to create v8 renderer:', error);
      console.log('🔄 Falling back to v7 API');
      return this.createV7Renderer(options);
    }
  }

  /**
   * Create renderer using Pixi.js v7 API (Application)
   */
  private static async createV7Renderer(options: PixiRendererOptions): Promise<any> {
    try {
      const Application = (PIXI as any).Application;

      if (!Application) {
        throw new Error('Pixi.js Application not found');
      }

      const appOptions = {
        view: options.canvas,
        width: options.width || 800,
        height: options.height || 600,
        backgroundColor: options.backgroundColor,
        backgroundAlpha: options.backgroundAlpha,
        antialias: options.antialias !== false,
        preserveDrawingBuffer: options.preserveDrawingBuffer || false,
        resolution: options.resolution || (window.devicePixelRatio || 1),
        autoDensity: options.autoDensity !== false,
        powerPreference: options.powerPreference || 'default'
      };

      console.log('✅ Creating Pixi v7 Application');
      const app = new Application(appOptions);

      // For v7, we need to wait for the app to be ready
      if (app.init) {
        await app.init(appOptions);
      }

      return app;
    } catch (error) {
      console.error('❌ Failed to create v7 renderer:', error);
      throw error;
    }
  }

  /**
   * Check if ParticleContainer is available and return appropriate container class
   */
  static getParticleContainer(): any {
    if (PixiVersionDetector.hasParticleContainer()) {
      return (PIXI as any).ParticleContainer;
    }

    console.warn('⚠️ ParticleContainer not available, using regular Container');
    return (PIXI as any).Container;
  }

  /**
   * Get the renderer instance from either v7 Application or v8 renderer
   */
  static getRenderer(appOrRenderer: any): any {
    if (appOrRenderer.renderer) {
      // v7 Application has a .renderer property
      return appOrRenderer.renderer;
    }
    // v8 returns renderer directly
    return appOrRenderer;
  }

  /**
   * Get the canvas from either v7 Application or v8 renderer
   */
  static getCanvas(appOrRenderer: any): HTMLCanvasElement {
    const renderer = this.getRenderer(appOrRenderer);

    if (renderer.view) {
      // v7/v8 both have .view property
      return renderer.view.canvas || renderer.view;
    }

    if (renderer.canvas) {
      return renderer.canvas;
    }

    throw new Error('Could not find canvas on renderer');
  }

  /**
   * Get the stage from either v7 Application or create one for v8
   */
  static getStage(appOrRenderer: any): any {
    if (appOrRenderer.stage) {
      // v7 Application has a .stage property
      return appOrRenderer.stage;
    }

    // v8 doesn't have stage, need to create one
    const Container = (PIXI as any).Container;
    return new Container();
  }

  /**
   * Resize renderer with version compatibility
   */
  static resize(appOrRenderer: any, width: number, height: number): void {
    const renderer = this.getRenderer(appOrRenderer);

    if (renderer.resize) {
      renderer.resize(width, height);
    } else if (appOrRenderer.resize) {
      appOrRenderer.resize(width, height);
    } else {
      console.warn('⚠️ Resize method not found on renderer');
    }
  }

  /**
   * Render with version compatibility
   */
  static render(appOrRenderer: any, stage?: any): void {
    const renderer = this.getRenderer(appOrRenderer);
    const actualStage = stage || this.getStage(appOrRenderer);

    if (renderer.render) {
      renderer.render(actualStage);
    } else {
      console.warn('⚠️ Render method not found on renderer');
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

    console.log('🎨 Creating Three.js renderer:', {
      revision,
      hasWebGPURenderer,
      hasWebGPU,
      bestContext: BrowserFeatureDetector.getBestRenderingContext()
    });

    // Try WebGPU first if available (r160+)
    if (hasWebGPURenderer && hasWebGPU) {
      try {
        const webgpuRenderer = await this.createWebGPURenderer(options);
        console.log('✅ Created WebGPU renderer');
        return webgpuRenderer;
      } catch (error) {
        console.warn('⚠️ WebGPU renderer failed, falling back to WebGL:', error);
      }
    }

    // Fall back to WebGL
    console.log('✅ Creating WebGL renderer');
    return this.createWebGLRenderer(options);
  }

  /**
   * Create WebGPU renderer (Three.js r160+)
   */
  private static async createWebGPURenderer(options: ThreeRendererOptions): Promise<any> {
    const WebGPURenderer = (THREE as any).WebGPURenderer;

    if (!WebGPURenderer) {
      throw new Error('WebGPURenderer not available');
    }

    const renderer = new WebGPURenderer({
      canvas: options.canvas,
      antialias: options.antialias !== false,
      alpha: options.alpha || false,
      powerPreference: options.powerPreference || 'high-performance'
    });

    // WebGPU requires async initialization
    await renderer.init();

    return renderer;
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
    console.warn('⚠️ InstancedMesh not available in this Three.js version');
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
    console.warn('⚠️ LOD not available in this Three.js version');
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
      console.log('✅ WebGPU renderer with native shadow support');
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
    console.group('🔍 Rendering Compatibility Report');

    console.log('Pixi.js:', {
      version: PixiVersionDetector.getVersion().raw,
      isV8: PixiVersionDetector.isV8OrHigher(),
      hasWebGPU: PixiVersionDetector.getFeatureSupport().webgpu,
      hasAutoDetect: PixiVersionDetector.hasAutoDetectRenderer(),
      hasParticleContainer: PixiVersionDetector.hasParticleContainer()
    });

    console.log('Three.js:', {
      revision: ThreeVersionDetector.getRevision(),
      isR180Plus: ThreeVersionDetector.isR180OrHigher(),
      hasWebGPU: ThreeVersionDetector.hasWebGPURenderer(),
      hasInstancedMesh: ThreeVersionDetector.hasInstancedMesh(),
      hasLOD: ThreeVersionDetector.hasLOD()
    });

    console.log('Recommendations:', {
      pixelRatio: this.getOptimalPixelRatio(),
      antialias: this.getRecommendedAntialias(),
      powerPreference: this.getRecommendedPowerPreference()
    });

    console.groupEnd();
  }
}
