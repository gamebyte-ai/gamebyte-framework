import {
  WebGLRenderer,
  Scene,
  Camera,
  Clock
} from 'three';
import { EventEmitter } from 'eventemitter3';
import { Renderer, RenderingMode, RendererOptions, RendererStats } from '../contracts/Renderer';
import { ThreeCompatibility, ThreeRendererOptions, RenderingCompatibility } from '../utils/RendererCompatibility';
import { ThreeVersionDetector } from '../utils/VersionDetection';

export interface ThreeRendererConfig extends RendererOptions {
  /**
   * Rendering mode: continuous (default) or on-demand
   * On-demand only renders when explicitly requested, saving battery/performance
   */
  renderMode?: 'continuous' | 'on-demand';

  /**
   * Shadow quality level
   */
  shadowQuality?: 'low' | 'medium' | 'high';

  /**
   * Enable performance monitoring and stats
   */
  enableStats?: boolean;

  /**
   * Enable frustum culling optimization
   */
  enableFrustumCulling?: boolean;
}

/**
 * 3D renderer implementation using Three.js with WebGPU support.
 * Supports WebGPURenderer (r160+) with automatic fallback to WebGLRenderer.
 */
export class ThreeRenderer extends EventEmitter implements Renderer {
  public readonly mode = RenderingMode.RENDERER_3D;
  private renderer: WebGLRenderer | any = null; // Can be WebGLRenderer or WebGPURenderer
  private scene: Scene | null = null;
  private camera: Camera | null = null;
  private clock: Clock = new Clock();
  private animationId: number | null = null;
  private lastTime = 0;
  private frameCount = 0;
  private fps = 60;
  private renderMode: 'continuous' | 'on-demand' = 'continuous';
  private needsRender = false;
  private enableStats = false;
  private shadowQuality: 'low' | 'medium' | 'high' = 'medium';
  private enableFrustumCulling = true;

  /**
   * Initialize the 3D renderer with WebGPU support and r180 optimizations.
   */
  async initialize(canvas: HTMLCanvasElement, options: ThreeRendererConfig = {}): Promise<void> {
    // Log compatibility info
    console.log('🎮 Initializing ThreeRenderer with Three.js r' + ThreeVersionDetector.getRevision());

    // Set configuration
    this.renderMode = options.renderMode || 'continuous';
    this.enableStats = options.enableStats ?? false;
    this.shadowQuality = options.shadowQuality || 'medium';
    this.enableFrustumCulling = options.enableFrustumCulling ?? true;

    // Get optimal settings for device
    const optimalPixelRatio = RenderingCompatibility.getOptimalPixelRatio();
    const recommendedAntialias = RenderingCompatibility.getRecommendedAntialias();
    const recommendedPower = RenderingCompatibility.getRecommendedPowerPreference();

    // Build Three.js options with smart defaults
    const threeOptions: ThreeRendererOptions = {
      canvas,
      antialias: options.antialias ?? recommendedAntialias,
      alpha: options.transparent ?? false,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference || recommendedPower
    };

    // Create renderer using compatibility layer (WebGPU or WebGL)
    try {
      this.renderer = await ThreeCompatibility.createRenderer(threeOptions);
      console.log('✅ ThreeRenderer initialized with', ThreeCompatibility.getRendererType(this.renderer));
    } catch (error) {
      console.error('❌ Failed to initialize ThreeRenderer:', error);
      throw error;
    }

    // Set renderer size and pixel ratio
    this.renderer.setSize(
      options.width || canvas.width || 800,
      options.height || canvas.height || 600,
      false
    );

    if (options.resolution) {
      this.renderer.setPixelRatio(options.resolution);
    } else {
      this.renderer.setPixelRatio(optimalPixelRatio);
    }

    // Set background color if provided
    if (options.backgroundColor !== undefined) {
      const color = typeof options.backgroundColor === 'string'
        ? options.backgroundColor
        : `#${options.backgroundColor.toString(16).padStart(6, '0')}`;

      if (this.renderer.setClearColor) {
        this.renderer.setClearColor(color);
      }
    }

    // Apply shadow optimization
    ThreeCompatibility.optimizeShadows(this.renderer, this.shadowQuality);

    // Create default scene
    this.scene = new Scene();

    // Frustum culling is enabled by default in Three.js
    // Objects are automatically culled based on camera frustum

    this.emit('initialized');
  }

  /**
   * Start the render loop.
   * In on-demand mode, this just enables rendering when requested.
   * In continuous mode, this starts the animation loop.
   */
  start(): void {
    if (!this.renderer) {
      throw new Error('Renderer not initialized');
    }

    this.clock.start();

    if (this.renderMode === 'continuous') {
      this.renderLoop();
    } else {
      console.log('📊 ThreeRenderer started in on-demand mode');
    }

    this.emit('started');
  }

  /**
   * Stop the render loop.
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.clock.stop();
    this.emit('stopped');
  }

  /**
   * Request a render frame (useful for on-demand rendering).
   */
  requestRender(): void {
    if (this.renderMode === 'on-demand') {
      this.needsRender = true;
      this.render();
    }
  }

  /**
   * Mark scene as dirty and needing re-render.
   */
  markDirty(): void {
    this.needsRender = true;
  }

  /**
   * Resize the renderer and update camera.
   */
  resize(width: number, height: number): void {
    if (!this.renderer) {
      return;
    }

    this.renderer.setSize(width, height, false);

    // Update camera aspect ratio if it's a perspective camera
    if (this.camera && 'aspect' in this.camera) {
      (this.camera as any).aspect = width / height;
      (this.camera as any).updateProjectionMatrix?.();
    }

    this.emit('resize', width, height);
    this.requestRender(); // Re-render after resize
  }

  /**
   * Render a single frame.
   * In on-demand mode, only renders if scene is dirty.
   */
  render(deltaTime?: number): void {
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }

    // In on-demand mode, only render if needed
    if (this.renderMode === 'on-demand' && !this.needsRender) {
      return;
    }

    this.renderer.render(this.scene, this.camera);
    this.needsRender = false;
    this.emit('render', deltaTime);
  }

  /**
   * Get the current canvas element.
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.renderer?.domElement || null;
  }

  /**
   * Get the underlying 3D renderer instance.
   * Can be WebGLRenderer or WebGPURenderer (r160+).
   */
  getRenderer(): WebGLRenderer | any {
    return this.renderer;
  }

  /**
   * Get the current scene.
   */
  getScene(): Scene | null {
    return this.scene;
  }

  /**
   * Set the active scene.
   */
  setScene(scene: Scene): void {
    this.scene = scene;
  }

  /**
   * Get the current camera.
   */
  getCamera(): Camera | null {
    return this.camera;
  }

  /**
   * Set the active camera.
   */
  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  /**
   * Get renderer statistics with improved tracking.
   */
  getStats(): RendererStats {
    const info = this.renderer?.info;
    const memory = info?.memory;
    const render = info?.render;

    // Get delta time without consuming it
    const delta = this.clock.running ? performance.now() - this.lastTime : 0;

    return {
      fps: this.fps,
      deltaTime: delta,
      drawCalls: render?.calls || 0,
      triangles: render?.triangles || 0,
      memory: {
        used: (memory?.geometries || 0) + (memory?.textures || 0),
        total: 0 // Three.js doesn't provide total memory info
      }
    };
  }

  /**
   * Get detailed renderer information for debugging.
   */
  getRendererInfo(): any {
    return {
      revision: ThreeVersionDetector.getRevision(),
      type: ThreeCompatibility.getRendererType(this.renderer),
      renderMode: this.renderMode,
      shadowQuality: this.shadowQuality,
      frustumCulling: this.enableFrustumCulling,
      resolution: this.renderer?.getPixelRatio() || 1,
      fps: this.fps,
      features: ThreeVersionDetector.getFeatureSupport(),
      info: this.renderer?.info
    };
  }

  /**
   * Enable or disable shadow rendering
   */
  setShadowQuality(quality: 'low' | 'medium' | 'high'): void {
    this.shadowQuality = quality;
    if (this.renderer) {
      ThreeCompatibility.optimizeShadows(this.renderer, quality);
    }
  }

  /**
   * Get the Three.js scene (implements Renderer interface).
   */
  getStage<T = unknown>(): T {
    return this.scene as T;
  }

  /**
   * Get the native Three.js renderer (implements Renderer interface).
   */
  getNativeRenderer<T = unknown>(): T {
    return this.renderer as T;
  }

  /**
   * Destroy the renderer and clean up resources.
   */
  destroy(): void {
    this.stop();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.removeAllListeners();
    this.emit('destroyed');
  }

  /**
   * Main render loop with improved FPS calculation.
   */
  private renderLoop = (): void => {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // Calculate FPS with smoothing
    this.frameCount++;
    if (this.frameCount >= 30) { // Check every 30 frames for more stable FPS
      const averageDelta = deltaTime / this.frameCount;
      this.fps = Math.round(1000 / averageDelta);
      this.frameCount = 0;
    }

    this.emit('tick', deltaTime);

    // In continuous mode, always mark for re-render
    if (this.renderMode === 'continuous') {
      this.needsRender = true;
    }

    this.render(deltaTime);

    this.animationId = requestAnimationFrame(this.renderLoop);
  };
}