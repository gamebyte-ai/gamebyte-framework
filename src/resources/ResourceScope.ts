import { IResourceScope } from '../contracts/Resources.js';
import { DisposableRegistry } from './DisposableRegistry.js';
import { Logger } from '../utils/Logger.js';

/**
 * A hierarchical resource scope for tracking disposable resources.
 *
 * Features:
 * - Reference counting for shared resources (textures, materials)
 * - Child scopes dispose before parent (cascading cleanup)
 * - Deferred disposal via microtask to avoid mid-frame GPU stalls
 */
export class ResourceScope implements IResourceScope {
  readonly id: string;
  readonly parent: IResourceScope | null;
  private tracked: Set<unknown> = new Set();
  private refCounts: Map<unknown, number> = new Map();
  private children: ResourceScope[] = [];
  private registry: DisposableRegistry;
  private disposed = false;
  private childIdCounter = 0;

  constructor(id: string, registry: DisposableRegistry, parent: IResourceScope | null = null) {
    this.id = id;
    this.registry = registry;
    this.parent = parent;
  }

  /**
   * Track a resource in this scope. Returns the same resource for chaining.
   * Increments reference count for shared resources.
   */
  track<T>(resource: T): T {
    if (this.disposed) {
      Logger.warn('Resources', `ResourceScope '${this.id}' is disposed, cannot track new resources`);
      return resource;
    }

    const ref = this.refCounts.get(resource) ?? 0;
    this.refCounts.set(resource, ref + 1);
    this.tracked.add(resource);
    return resource;
  }

  /**
   * Release a resource. Decrements ref count; disposes at zero.
   * Returns true if the resource was actually disposed.
   */
  release(resource: unknown): boolean {
    if (!this.tracked.has(resource)) return false;

    const ref = (this.refCounts.get(resource) ?? 1) - 1;
    if (ref <= 0) {
      this.tracked.delete(resource);
      this.refCounts.delete(resource);
      this.registry.dispose(resource);
      return true;
    }

    this.refCounts.set(resource, ref);
    return false;
  }

  /**
   * Create a child scope. Child disposes before parent.
   */
  createChild(id?: string): IResourceScope {
    const childId = id ?? `${this.id}:child-${this.childIdCounter++}`;
    const child = new ResourceScope(childId, this.registry, this);
    this.children.push(child);
    return child;
  }

  /**
   * Dispose all tracked resources in this scope and child scopes.
   * Children are disposed first (leaf-to-root order).
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    // Dispose children first (leaf-to-root)
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i].dispose();
    }
    this.children.length = 0;

    // Dispose all tracked resources
    for (const resource of this.tracked) {
      this.registry.dispose(resource);
    }
    this.tracked.clear();
    this.refCounts.clear();
  }

  /**
   * Get count of tracked resources in this scope (not including children).
   */
  getTrackedCount(): number {
    return this.tracked.size;
  }

  /**
   * Check if this scope has been disposed.
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}
