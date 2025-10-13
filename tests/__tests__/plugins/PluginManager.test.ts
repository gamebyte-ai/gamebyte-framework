/**
 * @jest-environment jsdom
 */

import { PluginManager, PluginConfig } from '../../../src/plugins/PluginManager';
import { GameByte } from '../../../src/core/GameByte';
import { AbstractServiceProvider } from '../../../src/contracts/ServiceProvider';

// Mock service providers for testing
class MockServiceProvider extends AbstractServiceProvider {
  public registerCalled = false;
  public bootCalled = false;
  public serviceKey: string;

  constructor(serviceKey = 'mock-service') {
    super();
    this.serviceKey = serviceKey;
  }

  register(app: GameByte): void {
    this.registerCalled = true;
    app.bind(this.serviceKey, `${this.serviceKey}-value`);
  }

  async boot(app: GameByte): Promise<void> {
    this.bootCalled = true;
  }

  provides(): string[] {
    return [this.serviceKey];
  }
}

class DependentServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.bind('dependent-service', 'dependent-value');
  }

  provides(): string[] {
    return ['dependent-service'];
  }
}

class AsyncServiceProvider extends AbstractServiceProvider {
  public bootCalled = false;

  register(app: GameByte): void {
    app.bind('async-service', 'async-value');
  }

  async boot(app: GameByte): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
    this.bootCalled = true;
  }

  provides(): string[] {
    return ['async-service'];
  }
}

describe('PluginManager', () => {
  let app: GameByte;
  let pluginManager: PluginManager;

  beforeEach(() => {
    app = GameByte.create();
    pluginManager = new PluginManager(app);
  });

  afterEach(() => {
    app.destroy();
  });

  describe('plugin registration', () => {
    it('should register a plugin successfully', () => {
      // Arrange
      const config: PluginConfig = {
        name: 'test-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      const registerSpy = jest.fn();
      pluginManager.on('plugin:registered', registerSpy);

      // Act
      pluginManager.register(config);

      // Assert
      expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
      expect(registerSpy).toHaveBeenCalledWith('test-plugin', expect.any(Object));
      
      const plugin = pluginManager.getPlugin('test-plugin');
      expect(plugin).not.toBeNull();
      expect(plugin!.config).toEqual(config);
      expect(plugin!.loaded).toBe(false);
      expect(plugin!.enabled).toBe(true); // Default enabled
    });

    it('should register plugin with custom metadata', () => {
      // Arrange
      const config: PluginConfig = {
        name: 'custom-plugin',
        version: '2.0.0',
        description: 'A custom plugin for testing',
        author: 'Test Author',
        provider: MockServiceProvider,
        enabled: false
      };

      // Act
      pluginManager.register(config);

      // Assert
      const plugin = pluginManager.getPlugin('custom-plugin');
      expect(plugin!.config.description).toBe('A custom plugin for testing');
      expect(plugin!.config.author).toBe('Test Author');
      expect(plugin!.enabled).toBe(false);
    });

    it('should throw error when registering duplicate plugin', () => {
      // Arrange
      const config: PluginConfig = {
        name: 'duplicate-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      pluginManager.register(config);

      // Act & Assert
      expect(() => pluginManager.register(config)).toThrow(
        "Plugin 'duplicate-plugin' is already registered"
      );
    });

    it('should validate dependencies during registration', () => {
      // Arrange
      const config: PluginConfig = {
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['non-existent-plugin'],
        provider: DependentServiceProvider
      };

      // Act & Assert
      expect(() => pluginManager.register(config)).toThrow(
        "Plugin 'dependent-plugin' requires 'non-existent-plugin' but it's not registered"
      );
    });

    it('should allow registration with valid dependencies', () => {
      // Arrange
      const baseConfig: PluginConfig = {
        name: 'base-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      const dependentConfig: PluginConfig = {
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['base-plugin'],
        provider: DependentServiceProvider
      };

      // Act
      pluginManager.register(baseConfig);
      pluginManager.register(dependentConfig);

      // Assert
      expect(pluginManager.hasPlugin('base-plugin')).toBe(true);
      expect(pluginManager.hasPlugin('dependent-plugin')).toBe(true);
    });
  });

  describe('plugin loading', () => {
    it('should load a plugin successfully', async () => {
      // Arrange
      const config: PluginConfig = {
        name: 'test-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      pluginManager.register(config);

      const loadSpy = jest.fn();
      pluginManager.on('plugin:loaded', loadSpy);

      // Act
      await pluginManager.load('test-plugin');

      // Assert
      const plugin = pluginManager.getPlugin('test-plugin');
      const provider = plugin!.provider as MockServiceProvider;
      expect(provider.registerCalled).toBe(true);
      expect(app.make('mock-service')).toBe('mock-service-value');
      expect(loadSpy).toHaveBeenCalledWith('test-plugin', expect.any(Object));
      expect(plugin!.loaded).toBe(true);
    });

    it('should load dependencies before loading plugin', async () => {
      // Arrange
      class BaseServiceProvider extends MockServiceProvider {
        constructor() {
          super('base-service');
        }
      }

      const baseConfig: PluginConfig = {
        name: 'base-plugin',
        version: '1.0.0',
        provider: BaseServiceProvider
      };

      const dependentConfig: PluginConfig = {
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['base-plugin'],
        provider: DependentServiceProvider
      };

      pluginManager.register(baseConfig);
      pluginManager.register(dependentConfig);

      // Act
      await pluginManager.load('dependent-plugin');

      // Assert
      const basePlugin = pluginManager.getPlugin('base-plugin');
      const baseProvider = basePlugin!.provider as MockServiceProvider;
      expect(baseProvider.registerCalled).toBe(true);
      expect(pluginManager.isLoaded('base-plugin')).toBe(true);
      expect(pluginManager.isLoaded('dependent-plugin')).toBe(true);
      expect(app.make('base-service')).toBe('base-service-value');
      expect(app.make('dependent-service')).toBe('dependent-value');
    });

    it('should not load disabled plugins', async () => {
      // Arrange
      const config: PluginConfig = {
        name: 'disabled-plugin',
        version: '1.0.0',
        provider: MockServiceProvider,
        enabled: false
      };

      pluginManager.register(config);

      // Act & Assert
      await expect(pluginManager.load('disabled-plugin')).rejects.toThrow(
        "Plugin 'disabled-plugin' is disabled"
      );
    });

    it('should throw error for non-existent plugin', async () => {
      // Act & Assert
      await expect(pluginManager.load('non-existent')).rejects.toThrow(
        "Plugin 'non-existent' not found"
      );
    });

    it('should not load already loaded plugin', async () => {
      // Arrange
      const config: PluginConfig = {
        name: 'test-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      pluginManager.register(config);
      await pluginManager.load('test-plugin');

      const plugin = pluginManager.getPlugin('test-plugin');
      const provider = plugin!.provider as MockServiceProvider;
      provider.registerCalled = false; // Reset

      // Act
      await pluginManager.load('test-plugin');

      // Assert
      expect(provider.registerCalled).toBe(false); // Should not be called again
    });
  });

  describe('plugin unloading', () => {
    it('should unload a plugin successfully', async () => {
      // Arrange
      const config: PluginConfig = {
        name: 'test-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      pluginManager.register(config);
      await pluginManager.load('test-plugin');

      const unloadSpy = jest.fn();
      pluginManager.on('plugin:unloaded', unloadSpy);

      // Act
      pluginManager.unload('test-plugin');

      // Assert
      expect(pluginManager.isLoaded('test-plugin')).toBe(false);
      expect(app.getContainer().bound('mock-service')).toBe(false);
      expect(unloadSpy).toHaveBeenCalledWith('test-plugin', expect.any(Object));
    });

    it('should prevent unloading plugin with dependents', async () => {
      // Arrange
      const baseConfig: PluginConfig = {
        name: 'base-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      const dependentConfig: PluginConfig = {
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['base-plugin'],
        provider: DependentServiceProvider
      };

      pluginManager.register(baseConfig);
      pluginManager.register(dependentConfig);
      await pluginManager.load('base-plugin');
      await pluginManager.load('dependent-plugin');

      // Act & Assert
      expect(() => pluginManager.unload('base-plugin')).toThrow(
        "Cannot unload 'base-plugin' because 'dependent-plugin' depends on it"
      );
    });

    it('should handle unloading non-existent or unloaded plugin', () => {
      // Act & Assert
      expect(() => pluginManager.unload('non-existent')).not.toThrow();
      
      const config: PluginConfig = {
        name: 'unloaded-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };
      
      pluginManager.register(config);
      expect(() => pluginManager.unload('unloaded-plugin')).not.toThrow();
    });
  });

  describe('plugin state management', () => {
    it('should enable and disable plugins', () => {
      // Arrange
      const config: PluginConfig = {
        name: 'test-plugin',
        version: '1.0.0',
        provider: MockServiceProvider,
        enabled: false
      };

      pluginManager.register(config);
      
      const enableSpy = jest.fn();
      const disableSpy = jest.fn();
      pluginManager.on('plugin:enabled', enableSpy);
      pluginManager.on('plugin:disabled', disableSpy);

      // Act
      pluginManager.enable('test-plugin');
      expect(pluginManager.isEnabled('test-plugin')).toBe(true);
      expect(enableSpy).toHaveBeenCalledWith('test-plugin', expect.any(Object));

      pluginManager.disable('test-plugin');
      expect(pluginManager.isEnabled('test-plugin')).toBe(false);
      expect(disableSpy).toHaveBeenCalledWith('test-plugin', expect.any(Object));
    });

    it('should unload plugin when disabling loaded plugin', async () => {
      // Arrange
      const config: PluginConfig = {
        name: 'test-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      pluginManager.register(config);
      await pluginManager.load('test-plugin');

      // Act
      pluginManager.disable('test-plugin');

      // Assert
      expect(pluginManager.isLoaded('test-plugin')).toBe(false);
      expect(pluginManager.isEnabled('test-plugin')).toBe(false);
    });

    it('should throw error for non-existent plugin state operations', () => {
      // Act & Assert
      expect(() => pluginManager.enable('non-existent')).toThrow(
        "Plugin 'non-existent' not found"
      );
      expect(() => pluginManager.disable('non-existent')).toThrow(
        "Plugin 'non-existent' not found"
      );
    });
  });

  describe('bulk operations', () => {
    it('should load all enabled plugins', async () => {
      // Arrange
      const config1: PluginConfig = {
        name: 'plugin1',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      const config2: PluginConfig = {
        name: 'plugin2',
        version: '1.0.0',
        provider: AsyncServiceProvider,
        enabled: true
      };

      const config3: PluginConfig = {
        name: 'plugin3',
        version: '1.0.0',
        provider: MockServiceProvider,
        enabled: false
      };

      pluginManager.register(config1);
      pluginManager.register(config2);
      pluginManager.register(config3);

      // Act
      await pluginManager.loadAll();

      // Assert
      expect(pluginManager.isLoaded('plugin1')).toBe(true);
      expect(pluginManager.isLoaded('plugin2')).toBe(true);
      expect(pluginManager.isLoaded('plugin3')).toBe(false); // Disabled
    });

    it('should handle errors during bulk loading', async () => {
      // Arrange
      class FailingProvider extends AbstractServiceProvider {
        register(): void {
          throw new Error('Registration failed');
        }
      }

      const goodConfig: PluginConfig = {
        name: 'good-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      const badConfig: PluginConfig = {
        name: 'bad-plugin',
        version: '1.0.0',
        provider: FailingProvider
      };

      pluginManager.register(goodConfig);
      pluginManager.register(badConfig);

      // Act & Assert
      await expect(pluginManager.loadAll()).rejects.toThrow('Registration failed');
      
      // Good plugin should still be loaded
      expect(pluginManager.isLoaded('good-plugin')).toBe(true);
    });
  });

  describe('plugin querying', () => {
    it('should get all plugins', () => {
      // Arrange
      const config1: PluginConfig = {
        name: 'plugin1',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      const config2: PluginConfig = {
        name: 'plugin2',
        version: '1.0.0',
        provider: MockServiceProvider,
        enabled: false
      };

      pluginManager.register(config1);
      pluginManager.register(config2);

      // Act
      const allPlugins = pluginManager.getAllPlugins();

      // Assert
      expect(allPlugins.size).toBe(2);
      expect(allPlugins.has('plugin1')).toBe(true);
      expect(allPlugins.has('plugin2')).toBe(true);
    });

    it('should get enabled plugins only', () => {
      // Arrange
      const config1: PluginConfig = {
        name: 'enabled-plugin',
        version: '1.0.0',
        provider: MockServiceProvider,
        enabled: true
      };

      const config2: PluginConfig = {
        name: 'disabled-plugin',
        version: '1.0.0',
        provider: MockServiceProvider,
        enabled: false
      };

      pluginManager.register(config1);
      pluginManager.register(config2);

      // Act
      const enabledPlugins = pluginManager.getEnabledPlugins();

      // Assert
      expect(enabledPlugins.size).toBe(1);
      expect(enabledPlugins.has('enabled-plugin')).toBe(true);
      expect(enabledPlugins.has('disabled-plugin')).toBe(false);
    });

    it('should get loaded plugins only', async () => {
      // Arrange
      const config1: PluginConfig = {
        name: 'loaded-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      const config2: PluginConfig = {
        name: 'unloaded-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      pluginManager.register(config1);
      pluginManager.register(config2);
      await pluginManager.load('loaded-plugin');

      // Act
      const loadedPlugins = pluginManager.getLoadedPlugins();

      // Assert
      expect(loadedPlugins.size).toBe(1);
      expect(loadedPlugins.has('loaded-plugin')).toBe(true);
      expect(loadedPlugins.has('unloaded-plugin')).toBe(false);
    });

    it('should check plugin existence and state', async () => {
      // Arrange
      const config: PluginConfig = {
        name: 'test-plugin',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      pluginManager.register(config);
      await pluginManager.load('test-plugin');

      // Act & Assert
      expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
      expect(pluginManager.hasPlugin('non-existent')).toBe(false);
      
      expect(pluginManager.isLoaded('test-plugin')).toBe(true);
      expect(pluginManager.isLoaded('non-existent')).toBe(false);
      
      expect(pluginManager.isEnabled('test-plugin')).toBe(true);
      expect(pluginManager.isEnabled('non-existent')).toBe(false);
    });
  });

  describe('dependency management', () => {
    it('should get dependency graph', () => {
      // Arrange
      const config1: PluginConfig = {
        name: 'plugin1',
        version: '1.0.0',
        provider: MockServiceProvider
      };

      const config2: PluginConfig = {
        name: 'plugin2',
        version: '1.0.0',
        dependencies: ['plugin1'],
        provider: MockServiceProvider
      };

      const config3: PluginConfig = {
        name: 'plugin3',
        version: '1.0.0',
        dependencies: ['plugin1', 'plugin2'],
        provider: MockServiceProvider
      };

      pluginManager.register(config1);
      pluginManager.register(config2);
      pluginManager.register(config3);

      // Act
      const dependencyGraph = pluginManager.getDependencyGraph();

      // Assert
      expect(dependencyGraph.get('plugin1')).toEqual([]);
      expect(dependencyGraph.get('plugin2')).toEqual(['plugin1']);
      expect(dependencyGraph.get('plugin3')).toEqual(['plugin1', 'plugin2']);
    });

    it('should handle complex dependency chains', async () => {
      // Arrange
      const configs = [
        { name: 'a', deps: [] },
        { name: 'b', deps: ['a'] },
        { name: 'c', deps: ['a'] },
        { name: 'd', deps: ['b', 'c'] }
      ].map(({ name, deps }) => ({
        name,
        version: '1.0.0',
        dependencies: deps,
        provider: class extends MockServiceProvider {
          constructor() {
            super(`${name}-service`);
          }
        }
      }));

      configs.forEach(config => pluginManager.register(config));

      // Act
      await pluginManager.load('d');

      // Assert - All dependencies should be loaded
      expect(pluginManager.isLoaded('a')).toBe(true);
      expect(pluginManager.isLoaded('b')).toBe(true);
      expect(pluginManager.isLoaded('c')).toBe(true);
      expect(pluginManager.isLoaded('d')).toBe(true);
    });
  });

  describe('event handling', () => {
    it('should emit all plugin lifecycle events', async () => {
      // Arrange
      const events: string[] = [];
      const eventTypes = ['plugin:registered', 'plugin:loaded', 'plugin:unloaded', 'plugin:enabled', 'plugin:disabled'];
      
      eventTypes.forEach(event => {
        pluginManager.on(event, () => events.push(event));
      });

      const config: PluginConfig = {
        name: 'event-test-plugin',
        version: '1.0.0',
        provider: MockServiceProvider,
        enabled: false
      };

      // Act
      pluginManager.register(config);
      pluginManager.enable('event-test-plugin');
      await pluginManager.load('event-test-plugin');
      pluginManager.unload('event-test-plugin');
      pluginManager.disable('event-test-plugin');

      // Assert
      expect(events).toEqual([
        'plugin:registered',
        'plugin:enabled',
        'plugin:loaded',
        'plugin:unloaded',
        'plugin:disabled'
      ]);
    });
  });

  describe('error scenarios', () => {
    it('should handle provider instantiation errors', () => {
      // Arrange
      class FailingProviderConstructor extends AbstractServiceProvider {
        constructor() {
          super();
          throw new Error('Constructor failed');
        }
        register(): void {}
      }

      const config: PluginConfig = {
        name: 'failing-plugin',
        version: '1.0.0',
        provider: FailingProviderConstructor
      };

      // Act & Assert
      expect(() => pluginManager.register(config)).toThrow('Constructor failed');
    });

    it('should handle missing provider services during unload', async () => {
      // Arrange
      class ProviderWithoutProvides extends AbstractServiceProvider {
        register(app: GameByte): void {
          app.bind('test-service', 'value');
        }
        // No provides() method
      }

      const config: PluginConfig = {
        name: 'no-provides-plugin',
        version: '1.0.0',
        provider: ProviderWithoutProvides
      };

      pluginManager.register(config);
      await pluginManager.load('no-provides-plugin');

      // Act & Assert - Should not throw
      expect(() => pluginManager.unload('no-provides-plugin')).not.toThrow();
    });
  });
});