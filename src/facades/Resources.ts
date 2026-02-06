import { Facade } from './Facade.js';
import { ResourceTracker } from '../resources/ResourceTracker.js';
import { IResourceScope } from '../contracts/Resources.js';

/**
 * Static Resources facade for resource lifecycle management.
 *
 * @example
 * ```typescript
 * import { Resources } from 'gamebyte-framework';
 *
 * const scope = Resources.createScope('level-1');
 * const geo = scope.track(new THREE.BoxGeometry(1, 1, 1));
 * const mat = scope.track(new THREE.MeshStandardMaterial());
 * // When done:
 * Resources.disposeScope('level-1'); // both auto-disposed
 * ```
 */
export class Resources extends Facade {
  protected static getFacadeAccessor(): string {
    return 'resources';
  }

  private static getTracker(): ResourceTracker {
    return this.resolve<ResourceTracker>();
  }

  static createScope(id: string): IResourceScope {
    return this.getTracker().createScope(id);
  }

  static getScope(id: string): IResourceScope | undefined {
    return this.getTracker().getScope(id);
  }

  static disposeScope(id: string): void {
    this.getTracker().disposeScope(id);
  }

  static registerDisposer<T>(
    typeCheck: (obj: unknown) => boolean,
    disposer: (obj: T) => void
  ): void {
    this.getTracker().registerDisposer(typeCheck, disposer);
  }

  static getTotalTrackedCount(): number {
    return this.getTracker().getTotalTrackedCount();
  }

  static disposeAll(): void {
    this.getTracker().disposeAll();
  }
}
