/**
 * @jest-environment jsdom
 */

import { createGame, GameByte, initializeFacades } from '../../../src';
import { RenderingMode } from '../../../src/contracts/Renderer';
import { AssetType } from '../../../src/contracts/AssetManager';
import { mockFetch } from '../../setup';

// Mock the actual renderers since we're testing integration
jest.mock('../../../src/rendering/PixiRenderer', () => ({
  PixiRenderer: jest.fn().mockImplementation(() => ({
    mode: 'pixi-2d',
    initialize: jest.fn().mockResolvedValue(undefined),
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }))
}));

jest.mock('../../../src/rendering/ThreeRenderer', () => ({
  ThreeRenderer: jest.fn().mockImplementation(() => ({
    mode: 'three-3d',
    initialize: jest.fn().mockResolvedValue(undefined),
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }))
}));

describe('Framework Integration Tests', () => {
  let app: GameByte;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas') as HTMLCanvasElement;
    
    // Setup mock fetch for asset loading
    (mockFetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['fake-data'], { type: 'image/jpeg' })),
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      json: jest.fn().mockResolvedValue({ test: 'data' }),
      text: jest.fn().mockResolvedValue('test data')
    });
  });

  afterEach(() => {
    if (app) {
      app.destroy();
    }
  });

  describe('framework initialization', () => {
    it('should create and initialize a complete game application', async () => {
      // Act
      app = createGame();
      await app.initialize(canvas, RenderingMode.RENDERER_2D);

      // Assert
      expect(app).toBeInstanceOf(GameByte);
      expect(app.isBooted()).toBe(true);
      expect(app.getCanvas()).toBe(canvas);
      
      // Check that core services are registered
      expect(app.getContainer().bound('renderer')).toBe(true);
      expect(app.getContainer().bound('renderer.factory')).toBe(true);
      expect(app.getContainer().bound('scene.manager')).toBe(true);
      expect(app.getContainer().bound('plugin.manager')).toBe(true);
    });

    it('should start and stop the application lifecycle', async () => {
      // Arrange
      app = createGame();
      await app.initialize(canvas, RenderingMode.RENDERER_2D);

      // Act
      app.start();
      expect(app.isRunning()).toBe(true);

      app.stop();
      expect(app.isRunning()).toBe(false);
    });

    it('should handle different rendering modes', async () => {
      // Test RENDERER_2D mode
      app = createGame();
      await app.initialize(canvas, RenderingMode.RENDERER_2D);
      
      const pixiRenderer = app.make('renderer');
      expect(pixiRenderer.mode).toBe('pixi-2d');
      
      app.destroy();

      // Test RENDERER_3D mode
      app = createGame();
      await app.initialize(canvas, RenderingMode.RENDERER_3D);
      
      const threeRenderer = app.make('renderer');
      expect(threeRenderer.mode).toBe('three-3d');
    });
  });

  describe('service provider integration', () => {
    it('should register and boot all core service providers', async () => {
      // Act
      app = createGame();
      const providers = app.getProviders();

      // Assert
      expect(providers.size).toBe(3); // Rendering, Scene, Plugin providers
      expect(providers.has('RenderingServiceProvider')).toBe(true);
      expect(providers.has('SceneServiceProvider')).toBe(true);
      expect(providers.has('PluginServiceProvider')).toBe(true);

      // Boot and verify all providers are booted
      await app.boot();
      expect(app.isBooted()).toBe(true);
    });

    it('should handle service provider boot sequence correctly', async () => {
      // Arrange
      const bootOrder: string[] = [];
      
      app = createGame();
      
      // Listen to boot events to track order
      app.on('provider:booted', (name: string) => {
        bootOrder.push(name);
      });

      // Act
      await app.boot();

      // Assert
      expect(bootOrder).toHaveLength(3);
      expect(bootOrder).toContain('RenderingServiceProvider');
      expect(bootOrder).toContain('SceneServiceProvider');
      expect(bootOrder).toContain('PluginServiceProvider');
    });
  });

  describe('asset management integration', () => {
    it('should load and manage assets through the framework', async () => {
      // Arrange
      app = createGame();
      await app.boot();

      // Mock asset manager (would be registered by AssetServiceProvider in real app)
      const mockAssetManager = {
        load: jest.fn().mockResolvedValue({
          config: { id: 'test-asset', type: AssetType.TEXTURE, src: '/test.jpg' },
          data: new Image(),
          state: 'loaded',
          loadedAt: Date.now(),
          size: 1024,
          progress: 1
        }),
        has: jest.fn().mockReturnValue(true),
        get: jest.fn().mockReturnValue({ data: 'mock-asset' }),
        unload: jest.fn().mockReturnValue(true)
      };

      app.bind('asset.manager', mockAssetManager);

      // Act
      const assetManager = app.make('asset.manager');
      const asset = await assetManager.load({
        id: 'test-texture',
        type: AssetType.TEXTURE,
        src: '/textures/test.jpg'
      });

      // Assert
      expect(mockAssetManager.load).toHaveBeenCalled();
      expect(asset).toBeDefined();
      expect(asset.config.id).toBe('test-asset');
    });
  });

  describe('plugin system integration', () => {
    it('should manage plugins through the framework', async () => {
      // Arrange
      app = createGame();
      await app.boot();
      
      const pluginManager = app.make('plugin.manager');

      // Mock plugin
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        provider: class MockProvider {
          register(app: GameByte) {
            app.bind('plugin-service', 'plugin-value');
          }
        }
      };

      // Act
      pluginManager.register(mockPlugin);
      await pluginManager.load('test-plugin');

      // Assert
      expect(pluginManager.isLoaded('test-plugin')).toBe(true);
      expect(app.getContainer().bound('plugin-service')).toBe(true);
      expect(app.make('plugin-service')).toBe('plugin-value');
    });
  });

  describe('memory management', () => {
    it('should properly clean up resources on destroy', async () => {
      // Arrange
      app = createGame();
      await app.initialize(canvas, RenderingMode.RENDERER_2D);
      app.start();

      const renderer = app.make('renderer');
      const initialProviderCount = app.getProviders().size;

      // Act
      app.destroy();

      // Assert
      expect(app.isRunning()).toBe(false);
      expect(app.isBooted()).toBe(false);
      expect(app.getCanvas()).toBeNull();
      expect(app.getProviders().size).toBe(0);
      expect(renderer.destroy).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', async () => {
      // Arrange
      app = createGame();
      await app.initialize(canvas, RenderingMode.RENDERER_2D);

      // Act & Assert
      expect(() => {
        app.destroy();
        app.destroy(); // Second destroy should not throw
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle renderer initialization errors', async () => {
      // Arrange
      app = createGame();
      
      // Mock renderer that fails to initialize
      const failingRenderer = {
        initialize: jest.fn().mockRejectedValue(new Error('Renderer init failed')),
        start: jest.fn(),
        stop: jest.fn(),
        destroy: jest.fn()
      };
      
      app.bind('renderer', failingRenderer);

      // Act & Assert
      await expect(app.initialize(canvas, RenderingMode.RENDERER_2D))
        .rejects.toThrow('Renderer init failed');
    });

    it('should handle service provider boot errors', async () => {
      // Arrange
      app = GameByte.create();
      
      // Add a provider that fails to boot
      class FailingProvider {
        register(): void {}
        async boot(): Promise<void> {
          throw new Error('Provider boot failed');
        }
      }
      
      app.register(new FailingProvider());

      // Act & Assert
      await expect(app.boot()).rejects.toThrow('Provider boot failed');
    });

    it('should handle service resolution errors', async () => {
      // Arrange
      app = createGame();
      await app.boot();

      // Act & Assert
      expect(() => app.make('non-existent-service'))
        .toThrow("No binding found for 'non-existent-service'");
    });
  });

  describe('facade integration', () => {
    it('should initialize facades with application instance', async () => {
      // Arrange
      app = createGame();
      
      // Act
      initializeFacades(app);

      // Assert - Facades should be accessible (though implementation details are mocked)
      const { Facade } = require('../../../src/facades/Facade');
      expect(Facade.getApplication()).toBe(app);
    });
  });

  describe('event system integration', () => {
    it('should propagate events throughout the framework', async () => {
      // Arrange
      const events: Array<{ name: string; data: any }> = [];
      
      app = createGame();
      
      // Listen to various framework events
      const eventTypes = [
        'provider:registered',
        'provider:booted',
        'booted',
        'initialized',
        'started',
        'stopped',
        'destroyed'
      ];
      
      eventTypes.forEach(eventType => {
        app.on(eventType, (data: any) => {
          events.push({ name: eventType, data });
        });
      });

      // Act - Go through full lifecycle
      await app.initialize(canvas, RenderingMode.RENDERER_2D);
      app.start();
      app.stop();
      app.destroy();

      // Assert
      expect(events.length).toBeGreaterThan(0);
      expect(events.map(e => e.name)).toContain('booted');
      expect(events.map(e => e.name)).toContain('initialized');
      expect(events.map(e => e.name)).toContain('started');
      expect(events.map(e => e.name)).toContain('stopped');
      expect(events.map(e => e.name)).toContain('destroyed');
    });

    it('should handle renderer events through the framework', async () => {
      // Arrange
      const rendererEvents: Array<{ name: string; data: any }> = [];
      
      app = createGame();
      
      // Listen to renderer events forwarded by the framework
      app.on('renderer:error', (error: Error) => {
        rendererEvents.push({ name: 'renderer:error', data: error });
      });
      
      app.on('renderer:resize', (width: number, height: number) => {
        rendererEvents.push({ name: 'renderer:resize', data: { width, height } });
      });

      await app.initialize(canvas, RenderingMode.RENDERER_2D);
      
      const renderer = app.make('renderer');

      // Act - Simulate renderer events
      const testError = new Error('Test renderer error');
      renderer.emit('error', testError);
      renderer.emit('resize', 1920, 1080);

      // Assert
      expect(rendererEvents).toHaveLength(2);
      expect(rendererEvents[0]).toEqual({
        name: 'renderer:error',
        data: testError
      });
      expect(rendererEvents[1]).toEqual({
        name: 'renderer:resize',
        data: { width: 1920, height: 1080 }
      });
    });
  });

  describe('performance and scalability', () => {
    it('should handle multiple simultaneous operations', async () => {
      // Arrange
      app = createGame();
      await app.initialize(canvas, RenderingMode.RENDERER_2D);

      // Act - Perform multiple operations simultaneously
      const operations = [
        app.start(),
        Promise.resolve(app.make('renderer')),
        Promise.resolve(app.make('scene.manager')),
        Promise.resolve(app.make('plugin.manager'))
      ];

      const results = await Promise.all(operations);

      // Assert
      expect(app.isRunning()).toBe(true);
      expect(results[1]).toBeDefined(); // renderer
      expect(results[2]).toBeDefined(); // scene manager
      expect(results[3]).toBeDefined(); // plugin manager
    });

    it('should maintain consistent state under rapid state changes', async () => {
      // Arrange
      app = createGame();
      await app.initialize(canvas, RenderingMode.RENDERER_2D);

      // Act - Rapid start/stop cycles
      for (let i = 0; i < 10; i++) {
        app.start();
        expect(app.isRunning()).toBe(true);
        
        app.stop();
        expect(app.isRunning()).toBe(false);
      }

      // Assert - App should still be in valid state
      expect(app.isBooted()).toBe(true);
      expect(app.getCanvas()).toBe(canvas);
    });
  });

  describe('configuration and customization', () => {
    it('should support custom service binding', async () => {
      // Arrange
      app = createGame();
      
      const customService = {
        value: 'custom-implementation',
        method: () => 'custom-result'
      };

      // Act
      app.bind('custom-service', customService);
      await app.boot();

      // Assert
      const resolved = app.make('custom-service');
      expect(resolved.value).toBe('custom-implementation');
      expect(resolved.method()).toBe('custom-result');
    });

    it('should support service override', async () => {
      // Arrange
      app = createGame();
      await app.boot();

      const originalRenderer = app.make('renderer');
      const customRenderer = {
        mode: 'custom-renderer',
        initialize: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        destroy: jest.fn()
      };

      // Act
      app.bind('renderer', customRenderer);
      const newRenderer = app.make('renderer');

      // Assert
      expect(newRenderer).not.toBe(originalRenderer);
      expect(newRenderer.mode).toBe('custom-renderer');
    });
  });

  describe('real-world usage patterns', () => {
    it('should support typical game initialization workflow', async () => {
      // Arrange & Act - Typical game setup
      app = createGame();
      
      // Initialize with canvas and rendering mode
      await app.initialize(canvas, RenderingMode.RENDERER_2D);
      
      // Start the game loop
      app.start();
      
      // Simulate asset loading (would typically happen during startup)
      const renderer = app.make('renderer');
      const sceneManager = app.make('scene.manager');
      
      // Assert - Everything should be ready for game execution
      expect(app.isRunning()).toBe(true);
      expect(renderer).toBeDefined();
      expect(sceneManager).toBeDefined();
      expect(renderer.initialize).toHaveBeenCalledWith(canvas, undefined);
      expect(renderer.start).toHaveBeenCalled();
    });

    it('should support game state management workflow', async () => {
      // Arrange
      app = createGame();
      await app.initialize(canvas, RenderingMode.RENDERER_2D);
      
      const events: string[] = [];
      ['started', 'stopped'].forEach(event => {
        app.on(event, () => events.push(event));
      });

      // Act - Simulate game state changes
      app.start(); // Game running
      expect(events).toContain('started');
      
      app.stop(); // Pause/menu
      expect(events).toContain('stopped');
      
      app.start(); // Resume
      expect(events.filter(e => e === 'started')).toHaveLength(2);

      // Assert
      expect(app.isRunning()).toBe(true);
    });
  });
});