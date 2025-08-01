import { Facade } from './Facade';
import { PluginManager, PluginConfig, PluginEntry } from '../plugins/PluginManager';

/**
 * Plugins facade for easy static access to plugin management services.
 */
export class Plugins extends Facade {
  /**
   * Get the service key for the plugin manager.
   */
  protected static getFacadeAccessor(): string {
    return 'plugin.manager';
  }

  /**
   * Register a plugin with the framework.
   */
  static register(config: PluginConfig): void {
    const manager = this.resolveFacadeInstance() as PluginManager;
    manager.register(config);
  }

  /**
   * Load a plugin by registering its service provider.
   */
  static async load(pluginName: string): Promise<void> {
    const manager = this.resolveFacadeInstance() as PluginManager;
    return manager.load(pluginName);
  }

  /**
   * Unload a plugin by removing its services.
   */
  static unload(pluginName: string): void {
    const manager = this.resolveFacadeInstance() as PluginManager;
    manager.unload(pluginName);
  }

  /**
   * Enable a plugin.
   */
  static enable(pluginName: string): void {
    const manager = this.resolveFacadeInstance() as PluginManager;
    manager.enable(pluginName);
  }

  /**
   * Disable a plugin.
   */
  static disable(pluginName: string): void {
    const manager = this.resolveFacadeInstance() as PluginManager;
    manager.disable(pluginName);
  }

  /**
   * Load all registered and enabled plugins.
   */
  static async loadAll(): Promise<void> {
    const manager = this.resolveFacadeInstance() as PluginManager;
    return manager.loadAll();
  }

  /**
   * Get plugin information.
   */
  static getPlugin(pluginName: string): PluginEntry | null {
    const manager = this.resolveFacadeInstance() as PluginManager;
    return manager.getPlugin(pluginName);
  }

  /**
   * Get all registered plugins.
   */
  static getAllPlugins(): Map<string, PluginEntry> {
    const manager = this.resolveFacadeInstance() as PluginManager;
    return manager.getAllPlugins();
  }

  /**
   * Check if a plugin is registered.
   */
  static hasPlugin(pluginName: string): boolean {
    const manager = this.resolveFacadeInstance() as PluginManager;
    return manager.hasPlugin(pluginName);
  }

  /**
   * Check if a plugin is loaded.
   */
  static isLoaded(pluginName: string): boolean {
    const manager = this.resolveFacadeInstance() as PluginManager;
    return manager.isLoaded(pluginName);
  }

  /**
   * Check if a plugin is enabled.
   */
  static isEnabled(pluginName: string): boolean {
    const manager = this.resolveFacadeInstance() as PluginManager;
    return manager.isEnabled(pluginName);
  }

  /**
   * Get the underlying plugin manager instance.
   */
  static getInstance(): PluginManager {
    return this.resolveFacadeInstance() as PluginManager;
  }
}