import { Facade } from './Facade';
import { Renderer as RendererContract, RendererOptions, RendererStats } from '../contracts/Renderer';

/**
 * Renderer facade for easy static access to rendering services.
 */
export class Renderer extends Facade {
  /**
   * Get the service key for the renderer.
   */
  protected static getFacadeAccessor(): string {
    return 'renderer';
  }

  /**
   * Initialize the renderer with a canvas element.
   */
  static async initialize(canvas: HTMLCanvasElement, options?: RendererOptions): Promise<void> {
    const renderer = this.resolveFacadeInstance() as RendererContract;
    return renderer.initialize(canvas, options);
  }

  /**
   * Start the render loop.
   */
  static start(): void {
    const renderer = this.resolveFacadeInstance() as RendererContract;
    renderer.start();
  }

  /**
   * Stop the render loop.
   */
  static stop(): void {
    const renderer = this.resolveFacadeInstance() as RendererContract;
    renderer.stop();
  }

  /**
   * Resize the renderer.
   */
  static resize(width: number, height: number): void {
    const renderer = this.resolveFacadeInstance() as RendererContract;
    renderer.resize(width, height);
  }

  /**
   * Render a single frame.
   */
  static render(deltaTime?: number): void {
    const renderer = this.resolveFacadeInstance() as RendererContract;
    renderer.render(deltaTime);
  }

  /**
   * Get the current canvas element.
   */
  static getCanvas(): HTMLCanvasElement | null {
    const renderer = this.resolveFacadeInstance() as RendererContract;
    return renderer.getCanvas();
  }

  /**
   * Get renderer statistics.
   */
  static getStats(): RendererStats {
    const renderer = this.resolveFacadeInstance() as RendererContract;
    return renderer.getStats();
  }

  /**
   * Get the underlying renderer instance.
   */
  static getInstance(): RendererContract {
    return this.resolveFacadeInstance() as RendererContract;
  }
}