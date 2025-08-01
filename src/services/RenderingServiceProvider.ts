import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { RendererFactory } from '../rendering/RendererFactory';
import { RenderingMode } from '../contracts/Renderer';

/**
 * Service provider for rendering services.
 */
export class RenderingServiceProvider extends AbstractServiceProvider {
  /**
   * Register rendering services in the container.
   */
  register(app: GameByte): void {
    // Register renderer factory
    app.singleton('renderer.factory', () => RendererFactory);

    // Register renderer (lazy-loaded)
    app.bind('renderer', () => {
      // Default to 2D rendering mode
      const mode = RenderingMode.RENDERER_2D;
      return RendererFactory.create(mode);
    }, true);

    // Register renderer modes
    app.bind('renderer.modes', () => ({
      RENDERER_2D: RenderingMode.RENDERER_2D,
      RENDERER_3D: RenderingMode.RENDERER_3D,
      HYBRID: RenderingMode.HYBRID
    }));

    // Helper method to create specific renderer
    app.bind('renderer.create', () => (mode: RenderingMode) => {
      return RendererFactory.create(mode);
    });

    // Helper method to create renderer with fallback
    app.bind('renderer.createWithFallback', () => (preferredMode: RenderingMode, fallbackMode?: RenderingMode) => {
      return RendererFactory.createWithFallback(preferredMode, fallbackMode);
    });
  }

  /**
   * Bootstrap rendering services.
   */
  boot(app: GameByte): void {
    // Set up global rendering configuration
    const container = app.getContainer();
    
    // Register renderer event listeners if needed
    if (container.bound('renderer')) {
      const renderer = app.make('renderer');
      
      renderer.on('error', (error: Error) => {
        app.emit('renderer:error', error);
      });

      renderer.on('resize', (width: number, height: number) => {
        app.emit('renderer:resize', width, height);
      });
    }
  }

  /**
   * Services provided by this provider.
   */
  provides(): string[] {
    return [
      'renderer',
      'renderer.factory',
      'renderer.modes',
      'renderer.create',
      'renderer.createWithFallback'
    ];
  }
}