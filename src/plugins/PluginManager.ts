import { EventEmitter } from 'eventemitter3';
import { GameByte } from '../core/GameByte';
import { ServiceProvider } from '../contracts/ServiceProvider';
import { Logger } from '../utils/Logger.js';

/**
 * Plugin configuration interface.
 */
export interface PluginConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  provider: new () => ServiceProvider;
  enabled?: boolean;
}

/**
 * Plugin registry entry.
 */
export interface PluginEntry {
  config: PluginConfig;
  provider: ServiceProvider;
  loaded: boolean;
  enabled: boolean;
}

/**
 * Plugin manager for registering and managing framework plugins.
 */
export class PluginManager extends EventEmitter {
  private plugins = new Map<string, PluginEntry>();
  private app: GameByte;

  constructor(app: GameByte) {
    super();
    this.app = app;
  }

  /**
   * Register a plugin with the framework.
   */
  register(config: PluginConfig): void {
    if (this.plugins.has(config.name)) {
      throw new Error(`Plugin '${config.name}' is already registered`);
    }

    // Check dependencies
    if (config.dependencies) {
      for (const dependency of config.dependencies) {
        if (!this.plugins.has(dependency)) {
          throw new Error(`Plugin '${config.name}' requires '${dependency}' but it's not registered`);
        }
      }
    }

    const provider = new config.provider();
    const entry: PluginEntry = {
      config,
      provider,
      loaded: false,
      enabled: config.enabled !== false
    };

    this.plugins.set(config.name, entry);
    Logger.debug('Plugins', `Plugin registered: ${config.name}`);
    this.emit('plugin:registered', config.name, entry);
  }

  /**
   * Load a plugin by registering its service provider.
   */
  async load(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin '${pluginName}' not found`);
    }

    if (!entry.enabled) {
      throw new Error(`Plugin '${pluginName}' is disabled`);
    }

    if (entry.loaded) {
      return; // Already loaded
    }

    // Load dependencies first
    if (entry.config.dependencies) {
      for (const dependency of entry.config.dependencies) {
        await this.load(dependency);
      }
    }

    // Register the provider
    this.app.register(entry.provider, pluginName);
    entry.loaded = true;

    this.emit('plugin:loaded', pluginName, entry);
  }

  /**
   * Unload a plugin by removing its services.
   */
  unload(pluginName: string): void {
    const entry = this.plugins.get(pluginName);
    if (!entry || !entry.loaded) {
      return;
    }

    // Check if other plugins depend on this one
    for (const [name, otherEntry] of this.plugins) {
      if (otherEntry.loaded && otherEntry.config.dependencies?.includes(pluginName)) {
        throw new Error(`Cannot unload '${pluginName}' because '${name}' depends on it`);
      }
    }

    // Remove services provided by this plugin
    if (entry.provider.provides) {
      const services = entry.provider.provides();
      for (const service of services) {
        if (this.app.getContainer().bound(service)) {
          this.app.getContainer().unbind(service);
        }
      }
    }

    entry.loaded = false;
    this.emit('plugin:unloaded', pluginName, entry);
  }

  /**
   * Enable a plugin.
   */
  enable(pluginName: string): void {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin '${pluginName}' not found`);
    }

    entry.enabled = true;
    this.emit('plugin:enabled', pluginName, entry);
  }

  /**
   * Disable a plugin.
   */
  disable(pluginName: string): void {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin '${pluginName}' not found`);
    }

    if (entry.loaded) {
      this.unload(pluginName);
    }

    entry.enabled = false;
    this.emit('plugin:disabled', pluginName, entry);
  }

  /**
   * Load all registered and enabled plugins.
   */
  async loadAll(): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    for (const [name, entry] of this.plugins) {
      if (entry.enabled && !entry.loaded) {
        loadPromises.push(this.load(name));
      }
    }

    await Promise.all(loadPromises);
  }

  /**
   * Get plugin information.
   */
  getPlugin(pluginName: string): PluginEntry | null {
    return this.plugins.get(pluginName) || null;
  }

  /**
   * Get all registered plugins.
   */
  getAllPlugins(): Map<string, PluginEntry> {
    return new Map(this.plugins);
  }

  /**
   * Get enabled plugins.
   */
  getEnabledPlugins(): Map<string, PluginEntry> {
    const enabled = new Map<string, PluginEntry>();
    for (const [name, entry] of this.plugins) {
      if (entry.enabled) {
        enabled.set(name, entry);
      }
    }
    return enabled;
  }

  /**
   * Get loaded plugins.
   */
  getLoadedPlugins(): Map<string, PluginEntry> {
    const loaded = new Map<string, PluginEntry>();
    for (const [name, entry] of this.plugins) {
      if (entry.loaded) {
        loaded.set(name, entry);
      }
    }
    return loaded;
  }

  /**
   * Check if a plugin is registered.
   */
  hasPlugin(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  /**
   * Check if a plugin is loaded.
   */
  isLoaded(pluginName: string): boolean {
    const entry = this.plugins.get(pluginName);
    return entry ? entry.loaded : false;
  }

  /**
   * Check if a plugin is enabled.
   */
  isEnabled(pluginName: string): boolean {
    const entry = this.plugins.get(pluginName);
    return entry ? entry.enabled : false;
  }

  /**
   * Get plugin dependency graph for ordered loading.
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const [name, entry] of this.plugins) {
      graph.set(name, entry.config.dependencies || []);
    }
    
    return graph;
  }
}