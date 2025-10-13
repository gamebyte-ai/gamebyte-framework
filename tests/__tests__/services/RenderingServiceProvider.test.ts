/**
 * @jest-environment jsdom
 */

import { RenderingServiceProvider } from '../../../src/services/RenderingServiceProvider';
import { GameByte } from '../../../src/core/GameByte';
import { RendererFactory } from '../../../src/rendering/RendererFactory';
import { RenderingMode } from '../../../src/contracts/Renderer';
import { EventEmitter } from 'eventemitter3';

// Mock renderer for testing
class MockRenderer extends EventEmitter {
  public mode: RenderingMode;
  
  constructor(mode: RenderingMode) {
    super();
    this.mode = mode;
  }

  async initialize(): Promise<void> {
    // Mock implementation
  }

  start(): void {
    // Mock implementation
  }

  stop(): void {
    // Mock implementation
  }

  destroy(): void {
    // Mock implementation
  }
}

// Mock RendererFactory
jest.mock('../../../src/rendering/RendererFactory', () => ({
  RendererFactory: {
    create: jest.fn((mode: RenderingMode) => new MockRenderer(mode)),
    createWithFallback: jest.fn((preferredMode: RenderingMode, fallbackMode?: RenderingMode) => new MockRenderer(preferredMode)),
    getSupportedModes: jest.fn(() => [
      RenderingMode.RENDERER_2D,
      RenderingMode.RENDERER_3D,
      RenderingMode.HYBRID
    ]),
    isSupported: jest.fn(() => true),
    detectBestMode: jest.fn(() => RenderingMode.RENDERER_2D)
  }
}));

describe('RenderingServiceProvider', () => {
  let app: GameByte;
  let provider: RenderingServiceProvider;

  beforeEach(() => {
    app = GameByte.create();
    provider = new RenderingServiceProvider();
    jest.clearAllMocks();

    // Restore original mock implementations
    (RendererFactory.create as jest.Mock).mockImplementation((mode: RenderingMode) => new MockRenderer(mode));
    (RendererFactory.createWithFallback as jest.Mock).mockImplementation((preferredMode: RenderingMode) => new MockRenderer(preferredMode));
  });

  afterEach(() => {
    app.destroy();
  });

  describe('service registration', () => {
    it('should register renderer factory as singleton', () => {
      // Act
      provider.register(app);

      // Assert
      const factory1 = app.make('renderer.factory');
      const factory2 = app.make('renderer.factory');
      
      expect(factory1).toBe(RendererFactory);
      expect(factory1).toBe(factory2); // Singleton behavior
    });

    it('should register renderer as singleton with default mode', () => {
      // Act
      provider.register(app);

      // Assert
      const renderer1 = app.make('renderer');
      const renderer2 = app.make('renderer');
      
      expect(renderer1).toBeInstanceOf(MockRenderer);
      expect(renderer1.mode).toBe(RenderingMode.RENDERER_2D);
      expect(renderer1).toBe(renderer2); // Singleton behavior
      expect(RendererFactory.create).toHaveBeenCalledWith(RenderingMode.RENDERER_2D);
    });

    it('should register renderer modes configuration', () => {
      // Act
      provider.register(app);

      // Assert
      const modes = app.make('renderer.modes');
      
      expect(modes).toEqual({
        RENDERER_2D: RenderingMode.RENDERER_2D,
        RENDERER_3D: RenderingMode.RENDERER_3D,
        HYBRID: RenderingMode.HYBRID
      });
    });

    it('should register renderer creation helper', () => {
      // Act
      provider.register(app);

      // Assert
      const createRenderer = app.make('renderer.create');
      expect(typeof createRenderer).toBe('function');
      
      const renderer = createRenderer(RenderingMode.RENDERER_3D);
      expect(renderer).toBeInstanceOf(MockRenderer);
      expect(renderer.mode).toBe(RenderingMode.RENDERER_3D);
      expect(RendererFactory.create).toHaveBeenCalledWith(RenderingMode.RENDERER_3D);
    });
  });

  describe('service bootstrapping', () => {
    it('should set up renderer event forwarding during boot', () => {
      // Arrange
      provider.register(app);
      app.make('renderer'); // Create renderer instance
      
      const errorSpy = jest.fn();
      const resizeSpy = jest.fn();
      
      app.on('renderer:error', errorSpy);
      app.on('renderer:resize', resizeSpy);

      // Act
      provider.boot(app);
      
      const renderer = app.make('renderer') as MockRenderer;
      const testError = new Error('Test error');
      
      renderer.emit('error', testError);
      renderer.emit('resize', 1920, 1080);

      // Assert
      expect(errorSpy).toHaveBeenCalledWith(testError);
      expect(resizeSpy).toHaveBeenCalledWith(1920, 1080);
    });

    it('should handle boot when renderer is not yet bound', () => {
      // Act & Assert
      expect(() => provider.boot(app)).not.toThrow();
    });

    it('should handle boot when renderer is bound but not instantiated', () => {
      // Arrange
      provider.register(app);
      // Don't instantiate renderer yet

      // Act & Assert
      expect(() => provider.boot(app)).not.toThrow();
    });
  });

  describe('provider metadata', () => {
    it('should list provided services', () => {
      // Act
      const providedServices = provider.provides();

      // Assert
      expect(providedServices).toEqual([
        'renderer',
        'renderer.factory',
        'renderer.modes',
        'renderer.create',
        'renderer.createWithFallback'
      ]);
    });

    it('should not be deferred by default', () => {
      // Act
      const isDeferred = provider.isDeferred();

      // Assert
      expect(isDeferred).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should work with full app lifecycle', async () => {
      // Arrange
      // Mock scene.manager to avoid dependency on SceneServiceProvider
      app.singleton('scene.manager', () => ({
        getCurrentScene: jest.fn(),
        switchScene: jest.fn()
      }));

      app.register(provider);
      await app.boot();

      const canvas = document.createElement('canvas') as HTMLCanvasElement;

      // Act
      await app.initialize(canvas, RenderingMode.RENDERER_3D);
      app.start();

      // Assert
      const renderer = app.make('renderer');
      expect(renderer).toBeInstanceOf(MockRenderer);
      expect(renderer.mode).toBe(RenderingMode.RENDERER_2D); // Still default from singleton
    });

    it('should allow creating renderers with different modes', () => {
      // Arrange
      provider.register(app);
      const createRenderer = app.make('renderer.create');

      // Act
      const renderer2D = createRenderer(RenderingMode.RENDERER_2D);
      const renderer3D = createRenderer(RenderingMode.RENDERER_3D);
      const rendererHybrid = createRenderer(RenderingMode.HYBRID);

      // Assert
      expect(renderer2D.mode).toBe(RenderingMode.RENDERER_2D);
      expect(renderer3D.mode).toBe(RenderingMode.RENDERER_3D);
      expect(rendererHybrid.mode).toBe(RenderingMode.HYBRID);
      
      expect(RendererFactory.create).toHaveBeenCalledTimes(3);
      expect(RendererFactory.create).toHaveBeenCalledWith(RenderingMode.RENDERER_2D);
      expect(RendererFactory.create).toHaveBeenCalledWith(RenderingMode.RENDERER_3D);
      expect(RendererFactory.create).toHaveBeenCalledWith(RenderingMode.HYBRID);
    });

    it('should handle renderer factory errors gracefully', () => {
      // Arrange
      (RendererFactory.create as jest.Mock).mockImplementation(() => {
        throw new Error('Renderer creation failed');
      });

      provider.register(app);

      // Act & Assert
      expect(() => app.make('renderer')).toThrow('Renderer creation failed');

      // Cleanup: Restore mock to prevent afterEach from failing
      (RendererFactory.create as jest.Mock).mockImplementation((mode: RenderingMode) => new MockRenderer(mode));
    });

    it('should support multiple provider instances', () => {
      // Arrange
      const provider1 = new RenderingServiceProvider();
      const provider2 = new RenderingServiceProvider();

      // Act
      app.register(provider1, 'provider1');
      app.register(provider2, 'provider2');

      // Assert
      const providers = app.getProviders();
      expect(providers.size).toBe(2);
      expect(providers.has('provider1')).toBe(true);
      expect(providers.has('provider2')).toBe(true);
      
      // Services should still work (last registration wins for conflicts)
      expect(app.make('renderer')).toBeInstanceOf(MockRenderer);
    });
  });

  describe('event forwarding', () => {
    it('should forward various renderer events', () => {
      // Arrange
      provider.register(app);
      const renderer = app.make('renderer') as MockRenderer;
      provider.boot(app);
      
      const errorHandler = jest.fn();
      const resizeHandler = jest.fn();
      
      app.on('renderer:error', errorHandler);
      app.on('renderer:resize', resizeHandler);

      // Act
      const error = new Error('Test error');
      renderer.emit('error', error);
      renderer.emit('resize', 800, 600);

      // Assert
      expect(errorHandler).toHaveBeenCalledWith(error);
      expect(resizeHandler).toHaveBeenCalledWith(800, 600);
    });

    it('should handle multiple event listeners', () => {
      // Arrange
      provider.register(app);
      const renderer = app.make('renderer') as MockRenderer;
      provider.boot(app);
      
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      app.on('renderer:error', handler1);
      app.on('renderer:error', handler2);

      // Act
      const error = new Error('Test error');
      renderer.emit('error', error);

      // Assert
      expect(handler1).toHaveBeenCalledWith(error);
      expect(handler2).toHaveBeenCalledWith(error);
    });
  });
});