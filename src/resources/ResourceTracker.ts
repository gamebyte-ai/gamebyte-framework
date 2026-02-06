import { EventEmitter } from 'eventemitter3';
import { IResourceTracker, IResourceScope } from '../contracts/Resources.js';
import { DisposableRegistry } from './DisposableRegistry.js';
import { ResourceScope } from './ResourceScope.js';

/**
 * Main resource lifecycle manager.
 *
 * Manages named scopes and provides centralized resource cleanup.
 * Integrates with scene lifecycle for automatic scope disposal.
 *
 * @example
 * ```typescript
 * const tracker = new ResourceTracker();
 * const scope = tracker.createScope('level-1');
 * const geo = scope.track(new THREE.BoxGeometry(1, 1, 1));
 * const mat = scope.track(new THREE.MeshStandardMaterial());
 * // When done:
 * tracker.disposeScope('level-1'); // both auto-disposed
 * ```
 */
export class ResourceTracker extends EventEmitter implements IResourceTracker {
  private scopes: Map<string, ResourceScope> = new Map();
  private registry: DisposableRegistry;

  constructor() {
    super();
    this.registry = new DisposableRegistry();
  }

  /**
   * Create a named resource scope.
   * If a scope with this ID already exists, returns the existing one.
   */
  createScope(id: string): IResourceScope {
    const existing = this.scopes.get(id);
    if (existing && !existing.isDisposed()) {
      return existing;
    }

    const scope = new ResourceScope(id, this.registry);
    this.scopes.set(id, scope);
    this.emit('scope:created', id);
    return scope;
  }

  /**
   * Get an existing scope by ID.
   */
  getScope(id: string): IResourceScope | undefined {
    const scope = this.scopes.get(id);
    if (scope && scope.isDisposed()) {
      this.scopes.delete(id);
      return undefined;
    }
    return scope;
  }

  /**
   * Dispose a named scope and all its tracked resources.
   */
  disposeScope(id: string): void {
    const scope = this.scopes.get(id);
    if (scope) {
      scope.dispose();
      this.scopes.delete(id);
      this.emit('scope:disposed', id);
    }
  }

  /**
   * Register a custom disposer for a resource type.
   * Custom disposers take priority over defaults.
   */
  registerDisposer<T>(
    typeCheck: (obj: unknown) => boolean,
    disposer: (obj: T) => void
  ): void {
    this.registry.register(typeCheck, disposer);
  }

  /**
   * Get total count of tracked resources across all scopes.
   */
  getTotalTrackedCount(): number {
    let total = 0;
    for (const scope of this.scopes.values()) {
      if (!scope.isDisposed()) {
        total += scope.getTrackedCount();
      }
    }
    return total;
  }

  /**
   * Dispose all scopes and their resources.
   */
  disposeAll(): void {
    for (const [id, scope] of this.scopes) {
      scope.dispose();
      this.emit('scope:disposed', id);
    }
    this.scopes.clear();
    this.emit('all:disposed');
  }

  /**
   * Destroy the tracker entirely.
   */
  destroy(): void {
    this.disposeAll();
    this.removeAllListeners();
  }
}
