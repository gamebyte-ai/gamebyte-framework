/**
 * @jest-environment jsdom
 */

import { GameByte } from '../../../src/core/GameByte';
import { ServiceContainer } from '../../../src/core/ServiceContainer';
import { AbstractServiceProvider } from '../../../src/contracts/ServiceProvider';
import { RenderingMode } from '../../../src/contracts/Renderer';

// Mock service provider for testing
class MockServiceProvider extends AbstractServiceProvider {
  public registerCalled = false;
  public bootCalled = false;
  public bootDelay = 0;

  register(app: GameByte): void {
    this.registerCalled = true;
    app.bind('mock-service', 'mock-value');
  }

  async boot(app: GameByte): Promise<void> {
    if (this.bootDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.bootDelay));
    }
    this.bootCalled = true;
  }

  provides(): string[] {
    return ['mock-service'];
  }
}

// Mock async service provider
class MockAsyncServiceProvider extends AbstractServiceProvider {
  public bootCalled = false;

  register(app: GameByte): void {
    app.bind('async-service', 'async-value');
  }

  async boot(app: GameByte): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
    this.bootCalled = true;
  }
}

// Mock renderer for testing
class MockRenderer {
  public initialized = false;
  public started = false;
  public destroyed = false;

  async initialize(canvas: HTMLCanvasElement, options?: any): Promise<void> {
    this.initialized = true;
  }

  start(): void {
    this.started = true;
  }

  stop(): void {
    this.started = false;
  }

  destroy(): void {
    this.destroyed = true;
  }
}

// Mock scene manager
class MockSceneManager {
  // Empty mock for now
}

describe('GameByte', () => {
  let app: GameByte;

  beforeEach(() => {
    app = GameByte.create();
  });

  afterEach(() => {
    if (app) {
      app.destroy();
    }
  });

  describe('instance creation', () => {
    it('should create new instances with create()', () => {
      // Act
      const app1 = GameByte.create();
      const app2 = GameByte.create();

      // Assert
      expect(app1).toBeInstanceOf(GameByte);
      expect(app2).toBeInstanceOf(GameByte);
      expect(app1).not.toBe(app2);

      // Cleanup
      app1.destroy();
      app2.destroy();
    });

    it('should provide singleton instance with getInstance()', () => {
      // Act
      const instance1 = GameByte.getInstance();
      const instance2 = GameByte.getInstance();

      // Assert
      expect(instance1).toBeInstanceOf(GameByte);
      expect(instance1).toBe(instance2);

      // Cleanup
      instance1.destroy();
    });

    it('should have correct version', () => {
      // Assert
      expect(GameByte.VERSION).toBe('1.0.0');
    });
  });

  describe('service container integration', () => {
    it('should have a service container', () => {
      // Act
      const container = app.getContainer();

      // Assert
      expect(container).toBeInstanceOf(ServiceContainer);
    });

    it('should bind core services on construction', () => {
      // Act
      const container = app.getContainer();

      // Assert
      expect(container.bound('container')).toBe(true);
      expect(container.bound('app')).toBe(true);
      expect(container.bound('GameByte')).toBe(true); // alias
      expect(container.make('app')).toBe(app);
      expect(container.make('GameByte')).toBe(app);
    });

    it('should delegate bind() to container', () => {
      // Act
      app.bind('test-service', 'test-value');

      // Assert
      expect(app.make<string>('test-service')).toBe('test-value');
    });

    it('should delegate singleton() to container', () => {
      // Arrange
      const factory = jest.fn(() => ({ id: Math.random() }));

      // Act
      app.singleton('test-singleton', factory);
      const instance1 = app.make('test-singleton');
      const instance2 = app.make('test-singleton');

      // Assert
      expect(factory).toHaveBeenCalledTimes(1);
      expect(instance1).toBe(instance2);
    });

    it('should delegate make() to container', () => {
      // Arrange
      app.bind('test', { value: 'resolved' });

      // Act
      const resolved = app.make('test');

      // Assert
      expect(resolved.value).toBe('resolved');
    });
  });

  describe('service provider registration', () => {
    it('should register service providers by instance', () => {
      // Arrange
      const provider = new MockServiceProvider();
      const registerSpy = jest.fn();
      app.on('provider:registered', registerSpy);

      // Act
      app.register(provider);

      // Assert
      expect(provider.registerCalled).toBe(true);
      expect(app.make<string>('mock-service')).toBe('mock-value');
      expect(registerSpy).toHaveBeenCalledWith('MockServiceProvider', provider);
    });

    it('should register service providers by constructor', () => {
      // Arrange
      const registerSpy = jest.fn();
      app.on('provider:registered', registerSpy);

      // Act
      app.register(MockServiceProvider);

      // Assert
      expect(app.make<string>('mock-service')).toBe('mock-value');
      expect(registerSpy).toHaveBeenCalledWith('MockServiceProvider', expect.any(MockServiceProvider));
    });

    it('should register providers with custom names', () => {
      // Arrange
      const provider = new MockServiceProvider();
      const customName = 'custom-provider';

      // Act
      app.register(provider, customName);

      // Assert
      const providers = app.getProviders();
      expect(providers.has(customName)).toBe(true);
      expect(providers.get(customName)).toBe(provider);
    });

    it('should track registered providers', () => {
      // Arrange
      const provider1 = new MockServiceProvider();
      const provider2 = new MockAsyncServiceProvider();

      // Act
      app.register(provider1);
      app.register(provider2);

      // Assert
      const providers = app.getProviders();
      expect(providers.size).toBe(2);
      expect(providers.has('MockServiceProvider')).toBe(true);
      expect(providers.has('MockAsyncServiceProvider')).toBe(true);
    });
  });

  describe('booting', () => {
    it('should boot all registered providers', async () => {
      // Arrange
      const provider1 = new MockServiceProvider();
      const provider2 = new MockAsyncServiceProvider();
      const bootSpy = jest.fn();
      
      app.register(provider1);
      app.register(provider2);
      app.on('provider:booted', bootSpy);
      app.on('booted', bootSpy);

      // Act
      await app.boot();

      // Assert
      expect(provider1.bootCalled).toBe(true);
      expect(provider2.bootCalled).toBe(true);
      expect(app.isBooted()).toBe(true);
      expect(bootSpy).toHaveBeenCalledTimes(3); // 2 providers + booted event
    });

    it('should handle async boot methods', async () => {
      // Arrange
      const provider = new MockServiceProvider();
      provider.bootDelay = 100;
      app.register(provider);

      // Act
      const startTime = Date.now();
      await app.boot();
      const endTime = Date.now();

      // Assert
      expect(provider.bootCalled).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should not boot twice', async () => {
      // Arrange
      const provider = new MockServiceProvider();
      app.register(provider);
      await app.boot();
      provider.bootCalled = false; // Reset

      // Act
      await app.boot();

      // Assert
      expect(provider.bootCalled).toBe(false);
      expect(app.isBooted()).toBe(true);
    });

    it('should handle providers without boot method', async () => {
      // Arrange
      class SimpleProvider extends AbstractServiceProvider {
        register(): void {
          // Just register, no boot method
        }
      }
      
      app.register(new SimpleProvider());

      // Act & Assert
      await expect(app.boot()).resolves.toBe(app);
      expect(app.isBooted()).toBe(true);
    });
  });

  describe('initialization', () => {
    it('should initialize with canvas and rendering mode', async () => {
      // Arrange
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      const mockRenderer = new MockRenderer();
      app.bind('renderer', mockRenderer);

      // Act
      await app.initialize(canvas, RenderingMode.RENDERER_2D);

      // Assert
      expect(mockRenderer.initialized).toBe(true);
      expect(app.getCanvas()).toBe(canvas);
      expect(app.isBooted()).toBe(true);
    });

    it('should boot framework during initialization if not already booted', async () => {
      // Arrange
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      const mockRenderer = new MockRenderer();
      const provider = new MockServiceProvider();
      
      app.bind('renderer', mockRenderer);
      app.register(provider);

      // Act
      await app.initialize(canvas, RenderingMode.RENDERER_2D);

      // Assert
      expect(app.isBooted()).toBe(true);
      expect(provider.bootCalled).toBe(true);
    });

    it('should emit initialization event', async () => {
      // Arrange
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      const mockRenderer = new MockRenderer();
      const initSpy = jest.fn();
      
      app.bind('renderer', mockRenderer);
      app.on('initialized', initSpy);

      // Act
      await app.initialize(canvas, RenderingMode.RENDERER_2D);

      // Assert
      expect(initSpy).toHaveBeenCalledWith({
        canvas,
        mode: RenderingMode.RENDERER_2D,
        options: undefined
      });
    });
  });

  describe('lifecycle management', () => {
    it('should start the application', () => {
      // Arrange
      const mockRenderer = new MockRenderer();
      const mockSceneManager = new MockSceneManager();
      const startSpy = jest.fn();
      
      app.bind('renderer', mockRenderer);
      app.bind('scene.manager', mockSceneManager);
      app.on('started', startSpy);

      // Act
      app.start();

      // Assert
      expect(mockRenderer.started).toBe(true);
      expect(app.isRunning()).toBe(true);
      expect(startSpy).toHaveBeenCalled();
    });

    it('should not start twice', () => {
      // Arrange
      const mockRenderer = new MockRenderer();
      const mockSceneManager = new MockSceneManager();
      
      app.bind('renderer', mockRenderer);
      app.bind('scene.manager', mockSceneManager);
      
      app.start();
      mockRenderer.started = false; // Reset

      // Act
      app.start();

      // Assert
      expect(mockRenderer.started).toBe(false); // Should not be called again
      expect(app.isRunning()).toBe(true);
    });

    it('should stop the application', () => {
      // Arrange
      const mockRenderer = new MockRenderer();
      const mockSceneManager = { start: jest.fn(), stop: jest.fn() };
      const stopSpy = jest.fn();
      
      app.bind('renderer', mockRenderer);
      app.bind('scene.manager', mockSceneManager);
      app.on('stopped', stopSpy);
      
      app.start();

      // Act
      app.stop();

      // Assert
      expect(mockRenderer.started).toBe(false);
      expect(app.isRunning()).toBe(false);
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should not stop when not running', () => {
      // Arrange
      const mockRenderer = new MockRenderer();
      const stopSpy = jest.fn();
      
      app.bind('renderer', mockRenderer);
      app.on('stopped', stopSpy);

      // Act
      app.stop();

      // Assert
      expect(stopSpy).not.toHaveBeenCalled();
      expect(app.isRunning()).toBe(false);
    });
  });

  describe('destruction', () => {
    it('should destroy all resources', () => {
      // Arrange
      const mockRenderer = new MockRenderer();
      const mockSceneManager = { start: jest.fn(), stop: jest.fn() };
      const provider = new MockServiceProvider();
      const destroySpy = jest.fn();
      
      app.bind('renderer', mockRenderer);
      app.bind('scene.manager', mockSceneManager);
      app.register(provider);
      app.start();
      app.on('destroyed', destroySpy);

      // Act
      app.destroy();

      // Assert
      expect(mockRenderer.destroyed).toBe(true);
      expect(app.isRunning()).toBe(false);
      expect(app.isBooted()).toBe(false);
      expect(app.getCanvas()).toBeNull();
      expect(app.getProviders().size).toBe(0);
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should handle destruction when renderer is not bound', () => {
      // Arrange
      const provider = new MockServiceProvider();
      app.register(provider);

      // Act & Assert
      expect(() => app.destroy()).not.toThrow();
      expect(app.isBooted()).toBe(false);
    });

    it('should flush container on destruction', () => {
      // Arrange
      app.bind('test-service', 'test-value');
      expect(app.getContainer().bound('test-service')).toBe(true);

      // Act
      app.destroy();

      // Assert
      expect(app.getContainer().bound('test-service')).toBe(false);
    });
  });

  describe('state queries', () => {
    it('should track booted state correctly', async () => {
      // Assert initial state
      expect(app.isBooted()).toBe(false);

      // Boot and check
      await app.boot();
      expect(app.isBooted()).toBe(true);

      // Destroy and check
      app.destroy();
      expect(app.isBooted()).toBe(false);
    });

    it('should track running state correctly', () => {
      // Arrange
      const mockRenderer = new MockRenderer();
      const mockSceneManager = new MockSceneManager();
      
      app.bind('renderer', mockRenderer);
      app.bind('scene.manager', mockSceneManager);

      // Assert initial state
      expect(app.isRunning()).toBe(false);

      // Start and check
      app.start();
      expect(app.isRunning()).toBe(true);

      // Stop and check
      app.stop();
      expect(app.isRunning()).toBe(false);
    });

    it('should track canvas correctly', async () => {
      // Arrange
      const canvas = document.createElement('canvas') as HTMLCanvasElement;
      const mockRenderer = new MockRenderer();
      
      app.bind('renderer', mockRenderer);

      // Assert initial state
      expect(app.getCanvas()).toBeNull();

      // Initialize and check
      await app.initialize(canvas, RenderingMode.RENDERER_2D);
      expect(app.getCanvas()).toBe(canvas);

      // Destroy and check
      app.destroy();
      expect(app.getCanvas()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle service resolution errors gracefully', () => {
      // Act & Assert
      expect(() => app.make('non-existent-service')).toThrow();
    });

    it('should handle provider boot errors', async () => {
      // Arrange
      class ErrorProvider extends AbstractServiceProvider {
        register(): void {}
        
        async boot(): Promise<void> {
          throw new Error('Boot failed');
        }
      }

      app.register(new ErrorProvider());

      // Act & Assert
      await expect(app.boot()).rejects.toThrow('Boot failed');
    });
  });
});