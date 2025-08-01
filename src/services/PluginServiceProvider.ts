import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { PluginManager } from '../plugins/PluginManager';

/**
 * Service provider for plugin management services.
 */
export class PluginServiceProvider extends AbstractServiceProvider {
  /**
   * Register plugin services in the container.
   */
  register(app: GameByte): void {
    // Register plugin manager as singleton
    app.singleton('plugin.manager', () => new PluginManager(app));
    
    // Alias for convenience
    app.getContainer().alias('plugins', 'plugin.manager');
  }

  /**
   * Bootstrap plugin services.
   */
  boot(app: GameByte): void {
    const pluginManager = app.make<PluginManager>('plugin.manager');
    
    // Forward plugin events to the main app
    pluginManager.on('plugin:registered', (name, entry) => {
      app.emit('plugin:registered', name, entry);
    });

    pluginManager.on('plugin:loaded', (name, entry) => {
      app.emit('plugin:loaded', name, entry);
    });

    pluginManager.on('plugin:unloaded', (name, entry) => {
      app.emit('plugin:unloaded', name, entry);
    });

    pluginManager.on('plugin:enabled', (name, entry) => {
      app.emit('plugin:enabled', name, entry);
    });

    pluginManager.on('plugin:disabled', (name, entry) => {
      app.emit('plugin:disabled', name, entry);
    });
  }

  /**
   * Services provided by this provider.
   */
  provides(): string[] {
    return [
      'plugin.manager',
      'plugins'
    ];
  }
}