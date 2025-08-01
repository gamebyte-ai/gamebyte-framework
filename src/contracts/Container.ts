/**
 * Service container interface for dependency injection.
 * Inspired by Laravel's container pattern.
 */
export interface Container {
  /**
   * Register a binding in the container.
   */
  bind<T = any>(key: string, concrete: T | (() => T), singleton?: boolean): void;

  /**
   * Register a singleton binding in the container.
   */
  singleton<T = any>(key: string, concrete: T | (() => T)): void;

  /**
   * Resolve a service from the container.
   */
  make<T = any>(key: string): T;

  /**
   * Check if a binding exists in the container.
   */
  bound(key: string): boolean;

  /**
   * Remove a binding from the container.
   */
  unbind(key: string): void;

  /**
   * Get all bindings.
   */
  getBindings(): Map<string, any>;
}

/**
 * Factory function type for creating instances.
 */
export type Factory<T = any> = () => T;

/**
 * Binding configuration for the container.
 */
export interface Binding<T = any> {
  concrete: T | Factory<T>;
  singleton: boolean;
  instance?: T;
}