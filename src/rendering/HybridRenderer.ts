import { EventEmitter } from 'eventemitter3';
import { Renderer, RenderingMode, RendererOptions, RendererStats } from '../contracts/Renderer';
import { PixiCompatibility, PixiRendererOptions, ThreeCompatibility, ThreeRendererOptions, RenderingCompatibility } from '../utils/RendererCompatibility';
import { PixiVersionDetector, ThreeVersionDetector } from '../utils/VersionDetection';
import * as PIXI from 'pixi.js';
import {
  WebGLRenderer,
  Scene as ThreeScene,
  Camera as ThreeCamera,
  Clock
} from 'three';

export interface HybridRendererConfig extends RendererOptions {
  /**
   * Rendering mode: continuous (default) or on-demand
   * On-demand only renders when explicitly requested, saving battery/performance
   */
  renderMode?: 'continuous' | 'on-demand';

  /**
   * Prefer specific renderer type for Pixi (WebGPU, WebGL2, WebGL)
   */
  pixiPreference?: 'webgpu' | 'webgl2' | 'webgl';

  /**
   * Shadow quality level for Three.js
   */
  shadowQuality?: 'low' | 'medium' | 'high';

  /**
   * Enable performance monitoring and stats
   */
  enableStats?: boolean;

  /**
   * Enable frustum culling optimization for Three.js
   */
  enableFrustumCulling?: boolean;

  /**
   * Z-index for Three.js canvas (default: 1)
   */
  threeZIndex?: number;

  /**
   * Z-index for Pixi.js canvas (default: 2)
   */
  pixiZIndex?: number;

  /**
   * Share WebGL context between renderers (advanced, experimental)
   * Not recommended unless you know what you're doing
   */
  shareContext?: boolean;
}

/**
 * Hybrid renderer that combines Three.js (3D) and Pixi.js (2D) using stacked canvas approach.
 *
 * Architecture:
 * - Layer 1 (z-index: 1): Three.js canvas for 3D background/scene
 * - Layer 2 (z-index: 2): Pixi.js canvas for 2D UI overlay (transparent)
 *
 * Both renderers run independently with synchronized dimensions and render loops.
 * Perfect for games that need 3D environments with 2D UI overlays.
 *
 * @example
 * ```typescript
 * const hybridRenderer = new HybridRenderer();
 * await hybridRenderer.initialize(containerElement, {
 *   width: 1080,
 *   height: 1920,
 *   antialias: true,
 *   transparent: false // Three.js opaque, Pixi.js transparent
 * });
 *
 * // Get Three.js components
 * const threeScene = hybridRenderer.getThreeScene();
 * const threeCamera = hybridRenderer.getThreeCamera();
 *
 * // Get Pixi.js stage
 * const pixiStage = hybridRenderer.getPixiStage();
 *
 * // Start rendering both layers
 * hybridRenderer.start();
 * ```
 */
export class HybridRenderer extends EventEmitter implements Renderer {
  public readonly mode = RenderingMode.HYBRID;

  // Three.js (3D Layer)
  private threeRenderer: WebGLRenderer | any = null;
  private threeScene: ThreeScene | null = null;
  private threeCamera: ThreeCamera | null = null;
  private threeCanvas: HTMLCanvasElement | null = null;
  private clock: Clock = new Clock();

  // Pixi.js (2D UI Layer)
  private pixiApp: any = null; // Can be Application (v7) or Renderer (v8)
  private pixiStage: any = null; // Pixi Container
  private pixiCanvas: HTMLCanvasElement | null = null;

  // Shared state
  private container: HTMLElement | null = null;
  private animationId: number | null = null;
  private lastTime = 0;
  private frameCount = 0;
  private fps = 60;
  private renderMode: 'continuous' | 'on-demand' = 'continuous';
  private needsRender = false;
  private enableStats = false;

  // Configuration
  private shadowQuality: 'low' | 'medium' | 'high' = 'medium';
  private enableFrustumCulling = true;
  private threeZIndex = 1;
  private pixiZIndex = 2;

  /**
   * Initialize the hybrid renderer with stacked canvas architecture.
   *
   * @param container - Parent HTML element to contain both canvases
   * @param options - Configuration options
   */
  async initialize(container: HTMLElement, options: HybridRendererConfig = {}): Promise<void> {
    console.log('🎮 Initializing HybridRenderer (Three.js + Pixi.js)');
    console.log('   Three.js r' + ThreeVersionDetector.getRevision());
    console.log('   Pixi.js', PixiVersionDetector.getVersion().raw);

    this.container = container;

    // Set configuration
    this.renderMode = options.renderMode || 'continuous';
    this.enableStats = options.enableStats ?? false;
    this.shadowQuality = options.shadowQuality || 'medium';
    this.enableFrustumCulling = options.enableFrustumCulling ?? true;
    this.threeZIndex = options.threeZIndex ?? 1;
    this.pixiZIndex = options.pixiZIndex ?? 2;

    // Get optimal settings for device
    const optimalPixelRatio = RenderingCompatibility.getOptimalPixelRatio();
    const recommendedAntialias = RenderingCompatibility.getRecommendedAntialias();
    const recommendedPower = RenderingCompatibility.getRecommendedPowerPreference();

    const width = options.width || container.clientWidth || 800;
    const height = options.height || container.clientHeight || 600;

    // Setup container styles
    container.style.position = 'relative';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.overflow = 'hidden';

    // Initialize Three.js (3D Background Layer)
    await this.initializeThreeLayer(width, height, {
      antialias: options.antialias ?? recommendedAntialias,
      alpha: false, // Opaque background (Three.js uses 'alpha' not 'transparent')
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference || recommendedPower
    }, {
      backgroundColor: options.backgroundColor,
      resolution: options.resolution || optimalPixelRatio
    });

    // Initialize Pixi.js (2D UI Overlay Layer)
    await this.initializePixiLayer(width, height, {
      antialias: options.antialias ?? recommendedAntialias,
      backgroundAlpha: 0, // Transparent to show 3D layer below
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference || recommendedPower,
      resolution: options.resolution || optimalPixelRatio,
      preference: options.pixiPreference
    });

    // Set up synchronized resize handling
    this.setupResizeHandling();

    console.log('✅ HybridRenderer initialized successfully');
    console.log('   Three.js layer: z-index', this.threeZIndex);
    console.log('   Pixi.js layer: z-index', this.pixiZIndex);

    this.emit('initialized');
  }

  /**
   * Initialize Three.js 3D background layer
   */
  private async initializeThreeLayer(
    width: number,
    height: number,
    options: Partial<ThreeRendererOptions>,
    extraOptions?: { backgroundColor?: number | string; resolution?: number }
  ): Promise<void> {
    // Create Three.js canvas
    this.threeCanvas = document.createElement('canvas');
    this.threeCanvas.id = 'three-canvas';
    this.threeCanvas.style.position = 'absolute';
    this.threeCanvas.style.top = '0';
    this.threeCanvas.style.left = '0';
    this.threeCanvas.style.zIndex = String(this.threeZIndex);
    this.threeCanvas.style.pointerEvents = 'none'; // UI layer handles interactions

    // Append to container
    this.container!.appendChild(this.threeCanvas);

    // Create Three.js renderer
    const threeOptions: ThreeRendererOptions = {
      canvas: this.threeCanvas,
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference || 'high-performance'
    };

    try {
      this.threeRenderer = await ThreeCompatibility.createRenderer(threeOptions);
      console.log('✅ Three.js layer initialized with', ThreeCompatibility.getRendererType(this.threeRenderer));
    } catch (error) {
      console.error('❌ Failed to initialize Three.js layer:', error);
      throw error;
    }

    // Set renderer size and pixel ratio
    this.threeRenderer.setSize(width, height, false);

    if (extraOptions?.resolution) {
      this.threeRenderer.setPixelRatio(extraOptions.resolution);
    } else {
      this.threeRenderer.setPixelRatio(RenderingCompatibility.getOptimalPixelRatio());
    }

    // Set background color
    if (extraOptions?.backgroundColor !== undefined) {
      const bgColor = typeof extraOptions.backgroundColor === 'string'
        ? parseInt(extraOptions.backgroundColor.replace('#', '0x'), 16)
        : extraOptions.backgroundColor;
      this.threeRenderer.setClearColor(bgColor, 1.0);
    }

    // Configure shadow quality
    if (this.threeRenderer.shadowMap) {
      this.threeRenderer.shadowMap.enabled = true;

      switch (this.shadowQuality) {
        case 'low':
          this.threeRenderer.shadowMap.type = 0; // BasicShadowMap
          break;
        case 'medium':
          this.threeRenderer.shadowMap.type = 1; // PCFShadowMap
          break;
        case 'high':
          this.threeRenderer.shadowMap.type = 2; // PCFSoftShadowMap
          break;
      }
    }

    // Create default scene (can be replaced by user)
    this.threeScene = new ThreeScene();

    // Camera will be set by user via setThreeCamera()
  }

  /**
   * Initialize Pixi.js 2D UI overlay layer
   */
  private async initializePixiLayer(
    width: number,
    height: number,
    options: Partial<PixiRendererOptions>
  ): Promise<void> {
    // Create Pixi.js canvas
    this.pixiCanvas = document.createElement('canvas');
    this.pixiCanvas.id = 'pixi-canvas';
    this.pixiCanvas.style.position = 'absolute';
    this.pixiCanvas.style.top = '0';
    this.pixiCanvas.style.left = '0';
    this.pixiCanvas.style.zIndex = String(this.pixiZIndex);
    this.pixiCanvas.style.pointerEvents = 'auto'; // Handle all interactions

    // Append to container
    this.container!.appendChild(this.pixiCanvas);

    // Create Pixi.js renderer
    const pixiOptions: PixiRendererOptions = {
      canvas: this.pixiCanvas,
      width,
      height,
      antialias: options.antialias ?? true,
      backgroundAlpha: 0, // Fully transparent
      backgroundColor: 0x000000, // Black (won't be visible)
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference || 'high-performance',
      autoDensity: true,
      resolution: options.resolution || RenderingCompatibility.getOptimalPixelRatio(),
      preference: options.preference
    };

    try {
      this.pixiApp = await PixiCompatibility.createRenderer(pixiOptions);
      console.log('✅ Pixi.js layer initialized (transparent overlay)');
    } catch (error) {
      console.error('❌ Failed to initialize Pixi.js layer:', error);
      throw error;
    }

    // Get stage
    this.pixiStage = PixiCompatibility.getStage(this.pixiApp);
  }

  /**
   * Setup synchronized resize handling for both layers
   */
  private setupResizeHandling(): void {
    const renderer = PixiCompatibility.getRenderer(this.pixiApp);
    if (renderer && renderer.on) {
      renderer.on('resize', (width: number, height: number) => {
        // Resize Three.js layer to match
        if (this.threeRenderer) {
          this.threeRenderer.setSize(width, height, false);
        }

        // Update container size
        if (this.container) {
          this.container.style.width = `${width}px`;
          this.container.style.height = `${height}px`;
        }

        this.emit('resize', width, height);
        this.requestRender();
      });
    }
  }

  /**
   * Start the hybrid render loop.
   * Both Three.js and Pixi.js render in the same animation frame.
   */
  start(): void {
    if (this.animationId !== null) {
      console.warn('HybridRenderer already started');
      return;
    }

    console.log('▶️ Starting HybridRenderer');

    if (this.renderMode === 'continuous') {
      this.startContinuousRendering();
    } else {
      console.log('On-demand mode enabled. Call requestRender() to render.');
    }

    this.emit('start');
  }

  /**
   * Start continuous rendering loop
   */
  private startContinuousRendering(): void {
    const animate = (currentTime: number) => {
      this.animationId = requestAnimationFrame(animate);

      // Calculate delta time
      const deltaTime = this.lastTime > 0 ? (currentTime - this.lastTime) / 1000 : 0;
      this.lastTime = currentTime;

      // Calculate FPS
      this.frameCount++;
      if (this.frameCount >= 60) {
        this.fps = Math.round(1 / deltaTime);
        this.frameCount = 0;
      }

      // Render both layers
      this.render(deltaTime);

      // Emit tick event
      this.emit('tick', deltaTime);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Stop the render loop.
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log('⏸️ HybridRenderer stopped');
    }

    this.emit('stop');
  }

  /**
   * Render a single frame (both Three.js and Pixi.js).
   */
  render(deltaTime?: number): void {
    if (this.renderMode === 'on-demand' && !this.needsRender) {
      return; // Skip rendering if not requested
    }

    // Render Three.js 3D layer
    if (this.threeRenderer && this.threeScene && this.threeCamera) {
      this.threeRenderer.render(this.threeScene, this.threeCamera);
    }

    // Render Pixi.js 2D UI layer
    if (this.pixiApp && this.pixiStage) {
      const renderer = PixiCompatibility.getRenderer(this.pixiApp);
      if (renderer) {
        renderer.render(this.pixiStage);
      }
    }

    // Reset render request flag
    this.needsRender = false;

    // Emit render event
    if (deltaTime !== undefined) {
      this.emit('render', deltaTime);
    }
  }

  /**
   * Request a render in on-demand mode.
   * In continuous mode, this has no effect.
   */
  requestRender(): void {
    if (this.renderMode === 'on-demand') {
      this.needsRender = true;

      // Trigger single frame render
      if (this.animationId === null) {
        requestAnimationFrame(() => {
          const deltaTime = this.clock.getDelta();
          this.render(deltaTime);
        });
      }
    }
  }

  /**
   * Resize both renderer layers.
   */
  resize(width: number, height: number): void {
    // Resize Three.js
    if (this.threeRenderer) {
      this.threeRenderer.setSize(width, height, false);
    }

    // Resize Pixi.js
    if (this.pixiApp) {
      const renderer = PixiCompatibility.getRenderer(this.pixiApp);
      if (renderer && renderer.resize) {
        renderer.resize(width, height);
      }
    }

    // Update container
    if (this.container) {
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
    }

    // Update camera aspect ratio if it's a PerspectiveCamera
    if (this.threeCamera && 'aspect' in this.threeCamera) {
      (this.threeCamera as any).aspect = width / height;
      (this.threeCamera as any).updateProjectionMatrix();
    }

    this.requestRender();
    this.emit('resize', width, height);
  }

  /**
   * Get the Three.js canvas element.
   */
  getCanvas(): HTMLCanvasElement | null {
    // Return Pixi canvas since it's the top layer handling interactions
    return this.pixiCanvas;
  }

  /**
   * Get the Three.js canvas element specifically.
   */
  getThreeCanvas(): HTMLCanvasElement | null {
    return this.threeCanvas;
  }

  /**
   * Get the Pixi.js canvas element specifically.
   */
  getPixiCanvas(): HTMLCanvasElement | null {
    return this.pixiCanvas;
  }

  /**
   * Get the Three.js scene.
   * Add your 3D objects to this scene.
   */
  getThreeScene(): ThreeScene | null {
    return this.threeScene;
  }

  /**
   * Set the Three.js scene (optional, default scene is created).
   */
  setThreeScene(scene: ThreeScene): void {
    this.threeScene = scene;
    this.requestRender();
  }

  /**
   * Get the Three.js camera.
   */
  getThreeCamera(): ThreeCamera | null {
    return this.threeCamera;
  }

  /**
   * Set the Three.js camera.
   * This must be called before rendering.
   */
  setThreeCamera(camera: ThreeCamera): void {
    this.threeCamera = camera;
    this.requestRender();
  }

  /**
   * Get the Three.js renderer instance.
   */
  getThreeRenderer(): WebGLRenderer | any {
    return this.threeRenderer;
  }

  /**
   * Get the Pixi.js stage container.
   * Add your 2D UI elements to this container.
   */
  getPixiStage(): any {
    return this.pixiStage;
  }

  /**
   * Get the Pixi.js application/renderer instance.
   */
  getPixiApp(): any {
    return this.pixiApp;
  }

  /**
   * Get renderer statistics.
   */
  getStats(): RendererStats {
    const stats: RendererStats = {
      fps: this.fps,
      deltaTime: this.clock.getDelta(),
      drawCalls: 0,
      triangles: 0,
      memory: {
        used: 0,
        total: 0
      }
    };

    // Get Three.js stats if available
    if (this.threeRenderer && this.threeRenderer.info) {
      const info = this.threeRenderer.info;
      stats.drawCalls += info.render?.calls || 0;
      stats.triangles += info.render?.triangles || 0;

      if (info.memory) {
        stats.memory.used += info.memory.geometries || 0;
        stats.memory.used += info.memory.textures || 0;
      }
    }

    // Get Pixi.js stats if available
    if (this.pixiApp) {
      const renderer = PixiCompatibility.getRenderer(this.pixiApp);
      if (renderer && renderer.renderingToScreen !== undefined) {
        // Pixi v8 stats
        // Note: Pixi doesn't expose detailed stats, just FPS
      }
    }

    // Get memory info if available
    if ((performance as any).memory) {
      const mem = (performance as any).memory;
      stats.memory.used = mem.usedJSHeapSize / 1048576; // Convert to MB
      stats.memory.total = mem.totalJSHeapSize / 1048576;
    }

    return stats;
  }

  /**
   * Destroy the hybrid renderer and clean up all resources.
   */
  destroy(): void {
    console.log('🗑️ Destroying HybridRenderer');

    // Stop rendering
    this.stop();

    // Destroy Three.js
    if (this.threeRenderer) {
      this.threeRenderer.dispose();
      this.threeRenderer = null;
    }

    if (this.threeScene) {
      // Dispose scene resources
      this.threeScene.traverse((object: any) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat: any) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      this.threeScene = null;
    }

    // Destroy Pixi.js
    if (this.pixiApp) {
      if (this.pixiApp.destroy) {
        this.pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
      }
      this.pixiApp = null;
    }

    // Remove canvases
    if (this.threeCanvas && this.threeCanvas.parentNode) {
      this.threeCanvas.parentNode.removeChild(this.threeCanvas);
      this.threeCanvas = null;
    }

    if (this.pixiCanvas && this.pixiCanvas.parentNode) {
      this.pixiCanvas.parentNode.removeChild(this.pixiCanvas);
      this.pixiCanvas = null;
    }

    // Clear references
    this.container = null;
    this.threeCamera = null;
    this.pixiStage = null;

    // Remove all event listeners
    this.removeAllListeners();

    this.emit('destroyed');
    console.log('✅ HybridRenderer destroyed');
  }
}
