import { GameByte } from '../core/GameByte';

/**
 * Base interface for all service providers in the GameByte framework.
 * Inspired by Laravel's service provider pattern.
 */
export interface ServiceProvider {
  /**
   * Register services in the container.
   * This method is called during the framework boot process.
   */
  register(app: GameByte): void;

  /**
   * Bootstrap services after all providers have been registered.
   * This method is called after all providers have been registered.
   */
  boot?(app: GameByte): void | Promise<void>;

  /**
   * Optional method to define what services this provider provides.
   * Used for deferred loading optimization.
   */
  provides?(): string[];

  /**
   * Indicates if the provider is deferred.
   * Deferred providers are only loaded when their services are needed.
   */
  isDeferred?(): boolean;
}

/**
 * Abstract base class for service providers with common functionality.
 */
export abstract class AbstractServiceProvider implements ServiceProvider {
  protected deferred = false;

  abstract register(app: GameByte): void;

  boot?(app: GameByte): void | Promise<void> {
    // Default empty implementation
  }

  provides?(): string[] {
    return [];
  }

  isDeferred(): boolean {
    return this.deferred;
  }
}