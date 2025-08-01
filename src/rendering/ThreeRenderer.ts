import { 
  WebGLRenderer, 
  Scene, 
  Camera, 
  Clock,
  WebGLRendererParameters 
} from 'three';
import { EventEmitter } from 'eventemitter3';
import { Renderer, RenderingMode, RendererOptions, RendererStats } from '../contracts/Renderer';

/**
 * 3D renderer implementation using Three.js.
 */
export class ThreeRenderer extends EventEmitter implements Renderer {
  public readonly mode = RenderingMode.RENDERER_3D;
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: Camera | null = null;
  private clock: Clock = new Clock();
  private animationId: number | null = null;
  private lastTime = 0;
  private frameCount = 0;
  private fps = 60;

  /**
   * Initialize the 3D renderer.
   */
  async initialize(canvas: HTMLCanvasElement, options: RendererOptions = {}): Promise<void> {
    const threeOptions: WebGLRendererParameters = {
      canvas,
      antialias: options.antialias ?? true,
      alpha: options.transparent ?? false,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference || 'default'
    };

    this.renderer = new WebGLRenderer(threeOptions);
    this.renderer.setSize(
      options.width || canvas.width || 800,
      options.height || canvas.height || 600,
      false
    );

    if (options.resolution) {
      this.renderer.setPixelRatio(options.resolution);
    } else {
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    }

    if (options.backgroundColor !== undefined) {
      const color = typeof options.backgroundColor === 'string' 
        ? options.backgroundColor 
        : `#${options.backgroundColor.toString(16).padStart(6, '0')}`;
      this.renderer.setClearColor(color);
    }

    // Create default scene
    this.scene = new Scene();

    this.emit('initialized');
  }

  /**
   * Start the render loop.
   */
  start(): void {
    if (!this.renderer) {
      throw new Error('Renderer not initialized');
    }

    this.clock.start();
    this.renderLoop();
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
   * Resize the renderer.
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
  }

  /**
   * Render a single frame.
   */
  render(deltaTime?: number): void {
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }

    this.renderer.render(this.scene, this.camera);
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
   */
  getRenderer(): WebGLRenderer | null {
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
   * Get renderer statistics.
   */
  getStats(): RendererStats {
    const info = this.renderer?.info;
    const memory = info?.memory;
    const render = info?.render;

    return {
      fps: this.fps,
      deltaTime: this.clock.getDelta() * 1000,
      drawCalls: render?.calls || 0,
      triangles: render?.triangles || 0,
      memory: {
        used: (memory?.geometries || 0) + (memory?.textures || 0),
        total: 0 // Three.js doesn't provide total memory info
      }
    };
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
   * Main render loop.
   */
  private renderLoop = (): void => {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // Calculate FPS
    this.frameCount++;
    if (this.frameCount >= 60) {
      this.fps = Math.round(1000 / deltaTime);
      this.frameCount = 0;
    }

    this.emit('tick', deltaTime);
    this.render(deltaTime);

    this.animationId = requestAnimationFrame(this.renderLoop);
  };
}