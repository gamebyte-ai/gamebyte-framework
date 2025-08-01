import { Application, ApplicationOptions } from 'pixi.js';
import { EventEmitter } from 'eventemitter3';
import { Renderer, RenderingMode, RendererOptions, RendererStats } from '../contracts/Renderer';

/**
 * 2D renderer implementation using Pixi.js.
 */
export class PixiRenderer extends EventEmitter implements Renderer {
  public readonly mode = RenderingMode.RENDERER_2D;
  private app: Application | null = null;
  private lastTime = 0;
  private frameCount = 0;
  private fps = 60;

  /**
   * Initialize the 2D renderer.
   */
  async initialize(canvas: HTMLCanvasElement, options: RendererOptions = {}): Promise<void> {
    const pixiOptions: Partial<ApplicationOptions> = {
      view: canvas,
      width: options.width || canvas.width || 800,
      height: options.height || canvas.height || 600,
      antialias: options.antialias ?? true,
      backgroundAlpha: options.transparent ? 0 : 1,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: (options.powerPreference as any) || 'default',
      autoDensity: options.autoDensity ?? true,
      resolution: options.resolution || window.devicePixelRatio || 1
    };

    if (options.backgroundColor !== undefined) {
      if (typeof options.backgroundColor === 'string') {
        pixiOptions.background = options.backgroundColor;
      } else {
        pixiOptions.background = options.backgroundColor;
      }
    }

    this.app = new Application();
    await this.app.init(pixiOptions);

    // Set up resize handling
    this.app.renderer.on('resize', (width: number, height: number) => {
      this.emit('resize', width, height);
    });

    this.emit('initialized');
  }

  /**
   * Start the render loop.
   */
  start(): void {
    if (!this.app) {
      throw new Error('Renderer not initialized');
    }

    this.app.ticker.start();
    this.app.ticker.add(this.onTick, this);
    this.emit('started');
  }

  /**
   * Stop the render loop.
   */
  stop(): void {
    if (!this.app) {
      return;
    }

    this.app.ticker.remove(this.onTick, this);
    this.app.ticker.stop();
    this.emit('stopped');
  }

  /**
   * Resize the renderer.
   */
  resize(width: number, height: number): void {
    if (!this.app) {
      return;
    }

    this.app.renderer.resize(width, height);
    this.emit('resize', width, height);
  }

  /**
   * Render a single frame.
   */
  render(deltaTime?: number): void {
    if (!this.app) {
      return;
    }

    this.app.render();
    this.emit('render', deltaTime);
  }

  /**
   * Get the current canvas element.
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.app?.canvas as HTMLCanvasElement || null;
  }

  /**
   * Get the underlying 2D renderer application instance.
   */
  getApplication(): Application | null {
    return this.app;
  }

  /**
   * Get renderer statistics.
   */
  getStats(): RendererStats {
    const renderer = this.app?.renderer;
    const gl = (renderer as any)?.gl;

    return {
      fps: this.fps,
      deltaTime: this.app?.ticker.deltaMS || 0,
      drawCalls: 0, // Pixi doesn't expose this directly
      triangles: 0, // Pixi doesn't expose this directly
      memory: {
        used: gl ? (gl as any).memory?.used || 0 : 0,
        total: gl ? (gl as any).memory?.total || 0 : 0
      }
    };
  }

  /**
   * Destroy the renderer and clean up resources.
   */
  destroy(): void {
    if (this.app) {
      this.app.ticker.remove(this.onTick, this);
      this.app.destroy(true);
      this.app = null;
    }
    
    this.removeAllListeners();
    this.emit('destroyed');
  }

  /**
   * Handle ticker updates.
   */
  private onTick(): void {
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
  }
}