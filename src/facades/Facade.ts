import { GameByte } from '../core/GameByte';

/**
 * Base facade class for providing static access to services.
 * Inspired by Laravel's facade pattern.
 */
export abstract class Facade {
  protected static app: GameByte | null = null;

  /**
   * Set the GameByte application instance.
   */
  static setApplication(app: GameByte): void {
    Facade.app = app;
  }

  /**
   * Get the GameByte application instance.
   */
  static getApplication(): GameByte {
    if (!Facade.app) {
      throw new Error('GameByte application not set on facade');
    }
    return Facade.app;
  }

  /**
   * Get the service key that this facade represents.
   * Must be implemented by concrete facade classes.
   */
  protected static getFacadeAccessor(): string {
    throw new Error('Facade must implement getFacadeAccessor method');
  }

  /**
   * Resolve the facade root instance from the service container.
   */
  protected static resolveFacadeInstance(): any {
    const app = Facade.getApplication();
    const accessor = this.getFacadeAccessor();
    
    if (!app.getContainer().bound(accessor)) {
      throw new Error(`Service '${accessor}' not found in container`);
    }
    
    return app.make(accessor);
  }

  /**
   * Handle static method calls by forwarding them to the facade root.
   */
  protected static callStatic(method: string, args: any[]): any {
    const instance = this.resolveFacadeInstance();
    
    if (!instance || instance === null || instance === undefined) {
      throw new Error(`Facade root instance is ${instance === null ? 'null' : 'undefined'}`);
    }
    
    if (typeof instance[method] !== 'function') {
      throw new Error(`Method '${method}' does not exist on facade root`);
    }
    
    return instance[method](...args);
  }

  /**
   * Resolve a service from the container
   */
  protected static resolve<T>(key?: string): T {
    const app = this.getApplication();
    const serviceKey = key || this.getFacadeAccessor();
    return app.make<T>(serviceKey);
  }
}