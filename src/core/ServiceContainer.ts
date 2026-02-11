import { Container, Binding, Factory } from '../contracts/Container';
import { Logger } from '../utils/Logger.js';

/**
 * Service container implementation for dependency injection.
 * Provides Laravel-style service binding and resolution.
 */
export class ServiceContainer implements Container {
  private bindings = new Map<string, Binding>();
  private instances = new Map<string, any>();
  private aliases = new Map<string, string>();

  /**
   * Register a binding in the container.
   */
  bind<T = any>(key: string, concrete: T | Factory<T>, singleton = false): void {
    Logger.debug('Core', `Service bound: ${key}`);
    this.bindings.set(key, {
      concrete,
      singleton,
      instance: undefined
    });

    // Clear any existing instance if rebinding
    this.instances.delete(key);
  }

  /**
   * Register a singleton binding in the container.
   */
  singleton<T = any>(key: string, concrete: T | Factory<T>): void {
    this.bind(key, concrete, true);
  }

  /**
   * Register an alias for a service.
   */
  alias(alias: string, abstract: string): void {
    this.aliases.set(alias, abstract);
  }

  /**
   * Resolve a service from the container.
   */
  make<T = any>(key: string): T {
    // Resolve alias chains
    const resolvedKey = this.resolveAlias(key);

    // Check if we have a cached singleton instance
    if (this.instances.has(resolvedKey)) {
      return this.instances.get(resolvedKey);
    }

    const binding = this.bindings.get(resolvedKey);
    if (!binding) {
      throw new Error(`No binding found for '${key}'`);
    }

    let instance: T;

    if (typeof binding.concrete === 'function') {
      instance = (binding.concrete as Factory<T>)();
    } else {
      instance = binding.concrete as T;
    }

    // Cache singleton instances
    if (binding.singleton) {
      this.instances.set(resolvedKey, instance);
    }

    Logger.debug('Core', `Service resolved: ${key}`);
    return instance;
  }

  /**
   * Check if a binding exists in the container.
   */
  bound(key: string): boolean {
    const resolvedKey = this.resolveAlias(key);
    return this.bindings.has(resolvedKey);
  }

  /**
   * Remove a binding from the container.
   */
  unbind(key: string): void {
    const resolvedKey = this.resolveAlias(key);
    this.bindings.delete(resolvedKey);
    this.instances.delete(resolvedKey);
  }

  /**
   * Get all bindings.
   */
  getBindings(): Map<string, any> {
    return new Map(this.bindings);
  }

  /**
   * Register an existing instance as a singleton.
   */
  instance<T = any>(key: string, instance: T): T {
    this.instances.set(key, instance);
    this.singleton(key, () => instance);
    return instance;
  }

  /**
   * Flush all bindings and instances.
   */
  flush(): void {
    this.bindings.clear();
    this.instances.clear();
    this.aliases.clear();
  }

  /**
   * Get all registered service keys.
   */
  keys(): string[] {
    return Array.from(this.bindings.keys());
  }

  /**
   * Resolve alias chains to get the final key.
   */
  private resolveAlias(key: string): string {
    let resolvedKey = key;
    const visited = new Set<string>();
    
    while (this.aliases.has(resolvedKey)) {
      if (visited.has(resolvedKey)) {
        throw new Error(`Circular alias reference detected for '${key}'`);
      }
      visited.add(resolvedKey);
      resolvedKey = this.aliases.get(resolvedKey)!;
    }
    
    return resolvedKey;
  }
}