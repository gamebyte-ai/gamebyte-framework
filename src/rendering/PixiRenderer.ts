import { EventEmitter } from 'eventemitter3';
import { Renderer, RenderingMode, RendererOptions, RendererStats } from '../contracts/Renderer';
import { PixiCompatibility, PixiRendererOptions, RenderingCompatibility } from '../utils/RendererCompatibility';
import { PixiVersionDetector } from '../utils/VersionDetection';
import * as PIXI from 'pixi.js';

export interface PixiRendererConfig extends RendererOptions {
  /**
   * Rendering mode: continuous (default) or on-demand
   * On-demand only renders when explicitly requested, saving battery/performance
   */
  renderMode?: 'continuous' | 'on-demand';

  /**
   * Prefer specific renderer type (WebGPU, WebGL2, WebGL)
   */
  preference?: 'webgpu' | 'webgl2' | 'webgl';

  /**
   * Enable performance monitoring and stats
   */
  enableStats?: boolean;
}

/**
 * 2D renderer implementation using Pixi.js with WebGPU support.
 * Supports both Pixi.js v7 and v8 with automatic fallback.
 */
export class PixiRenderer extends EventEmitter implements Renderer {
  public readonly mode = RenderingMode.RENDERER_2D;
  private app: any = null; // Can be Application (v7) or Renderer (v8)
  private stage: any = null; // Pixi Container for scene graph
  private lastTime = 0;
  private frameCount = 0;
  private fps = 60;
  private renderMode: 'continuous' | 'on-demand' = 'continuous';
  private needsRender = false;
  private enableStats = false;

  /**
   * Initialize the 2D renderer with WebGPU support and v7/v8 compatibility.
   */
  async initialize(canvas: HTMLCanvasElement, options: PixiRendererConfig = {}): Promise<void> {
    // Log compatibility info
    console.log('🎮 Initializing PixiRenderer with Pixi.js', PixiVersionDetector.getVersion().raw);

    // Set configuration
    this.renderMode = options.renderMode || 'continuous';
    this.enableStats = options.enableStats ?? false;

    // Get optimal settings for device
    const optimalPixelRatio = RenderingCompatibility.getOptimalPixelRatio();
    const recommendedAntialias = RenderingCompatibility.getRecommendedAntialias();
    const recommendedPower = RenderingCompatibility.getRecommendedPowerPreference();

    // Build Pixi options with smart defaults
    const pixiOptions: PixiRendererOptions = {
      canvas,
      width: options.width || canvas.width || 800,
      height: options.height || canvas.height || 600,
      antialias: options.antialias ?? recommendedAntialias,
      backgroundAlpha: options.transparent ? 0 : 1,
      backgroundColor: options.backgroundColor as number,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference || recommendedPower,
      autoDensity: options.autoDensity ?? true,
      resolution: options.resolution || optimalPixelRatio,
      preference: options.preference // WebGPU/WebGL2/WebGL preference
    };

    // Create renderer using compatibility layer (supports v7 and v8)
    try {
      this.app = await PixiCompatibility.createRenderer(pixiOptions);
      console.log('✅ PixiRenderer initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize PixiRenderer:', error);
      throw error;
    }

    // Get stage (v7 has it, v8 needs to create it)
    this.stage = PixiCompatibility.getStage(this.app);

    // Set up resize handling if available
    const renderer = PixiCompatibility.getRenderer(this.app);
    if (renderer && renderer.on) {
      renderer.on('resize', (width: number, height: number) => {
        this.emit('resize', width, height);
        this.requestRender(); // Re-render on resize
      });
    }

    this.emit('initialized');
  }

  /**
   * Start the render loop.
   * In on-demand mode, this just enables rendering when requested.
   * In continuous mode, this starts the ticker.
   */
  start(): void {
    if (!this.app) {
      throw new Error('Renderer not initialized');
    }

    if (this.renderMode === 'continuous') {
      // Continuous rendering - use ticker
      const ticker = this.getTicker();
      if (ticker) {
        ticker.start();
        ticker.add(this.onTick, this);
      }
    } else {
      // On-demand rendering - just mark as ready
      console.log('📊 PixiRenderer started in on-demand mode');
    }

    this.emit('started');
  }

  /**
   * Stop the render loop.
   */
  stop(): void {
    if (!this.app) {
      return;
    }

    const ticker = this.getTicker();
    if (ticker) {
      ticker.remove(this.onTick, this);
      ticker.stop();
    }

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
   * Resize the renderer using compatibility helper.
   */
  resize(width: number, height: number): void {
    if (!this.app) {
      return;
    }

    PixiCompatibility.resize(this.app, width, height);
    this.emit('resize', width, height);
    this.requestRender(); // Re-render after resize
  }

  /**
   * Render a single frame using compatibility helper.
   * In on-demand mode, only renders if scene is dirty.
   */
  render(deltaTime?: number): void {
    if (!this.app || !this.stage) {
      return;
    }

    // In on-demand mode, only render if needed
    if (this.renderMode === 'on-demand' && !this.needsRender) {
      return;
    }

    PixiCompatibility.render(this.app, this.stage);
    this.needsRender = false;
    this.emit('render', deltaTime);
  }

  /**
   * Get the current canvas element using compatibility helper.
   */
  getCanvas(): HTMLCanvasElement | null {
    if (!this.app) {
      return null;
    }

    try {
      return PixiCompatibility.getCanvas(this.app);
    } catch {
      return null;
    }
  }

  /**
   * Get the underlying 2D renderer application/renderer instance.
   * Can be Application (v7) or Renderer (v8).
   */
  getApplication(): any {
    return this.app;
  }

  /**
   * Get the Pixi stage (scene graph root).
   */
  getStage(): any {
    return this.stage;
  }

  /**
   * Get the actual renderer instance (unwrapped from Application if needed).
   */
  getRenderer(): any {
    if (!this.app) {
      return null;
    }

    return PixiCompatibility.getRenderer(this.app);
  }

  /**
   * Get the ticker for animation loop.
   */
  private getTicker(): any {
    if (!this.app) {
      return null;
    }

    // v7 Application has ticker
    if (this.app.ticker) {
      return this.app.ticker;
    }

    // v8 needs to create shared ticker
    const Ticker = (PIXI as any).Ticker;
    if (Ticker && Ticker.shared) {
      return Ticker.shared;
    }

    return null;
  }

  /**
   * Get renderer statistics with improved tracking.
   */
  getStats(): RendererStats {
    const renderer = PixiCompatibility.getRenderer(this.app);
    const ticker = this.getTicker();
    const gl = (renderer as any)?.gl;

    // Try to get actual stats from renderer
    let drawCalls = 0;
    let textureBindings = 0;

    if (this.enableStats && renderer) {
      // Pixi v8 may expose renderer.renderTarget or renderer.batch
      const batch = (renderer as any).batch;
      if (batch && batch.drawCalls !== undefined) {
        drawCalls = batch.drawCalls;
      }

      // Get texture binding count if available
      if ((renderer as any).texture && (renderer as any).texture.boundTextures) {
        textureBindings = (renderer as any).texture.boundTextures.length || 0;
      }
    }

    return {
      fps: this.fps,
      deltaTime: ticker?.deltaMS || 0,
      drawCalls,
      triangles: 0, // Pixi doesn't expose this
      memory: {
        used: gl ? (gl as any).memory?.used || 0 : 0,
        total: gl ? (gl as any).memory?.total || 0 : 0
      }
    };
  }

  /**
   * Get detailed renderer information for debugging.
   */
  getRendererInfo(): any {
    const renderer = PixiCompatibility.getRenderer(this.app);

    return {
      version: PixiVersionDetector.getVersion(),
      type: renderer?.type || 'unknown',
      renderMode: this.renderMode,
      resolution: renderer?.resolution || 1,
      fps: this.fps,
      features: PixiVersionDetector.getFeatureSupport()
    };
  }

  /**
   * Destroy the renderer and clean up resources.
   */
  destroy(): void {
    if (this.app) {
      const ticker = this.getTicker();
      if (ticker) {
        ticker.remove(this.onTick, this);
      }

      // Destroy application/renderer
      if (this.app.destroy) {
        this.app.destroy(true);
      }

      this.app = null;
      this.stage = null;
    }

    this.removeAllListeners();
    this.emit('destroyed');
  }

  /**
   * Handle ticker updates with improved FPS calculation.
   */
  private onTick(): void {
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

    // Emit tick event for game loop
    this.emit('tick', deltaTime);

    // In continuous mode, always mark for re-render
    if (this.renderMode === 'continuous') {
      this.needsRender = true;
    }
  }
}