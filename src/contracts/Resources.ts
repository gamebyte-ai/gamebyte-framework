/**
 * A hierarchical resource scope for tracking disposable resources.
 * Child scopes dispose before parent (cascading cleanup).
 */
export interface IResourceScope {
  readonly id: string;
  readonly parent: IResourceScope | null;
  /** Track a resource. Returns the same resource for chaining. */
  track<T>(resource: T): T;
  /** Release a resource (decrements ref count, disposes at zero). */
  release(resource: unknown): boolean;
  /** Create a child scope (auto-disposed when parent disposes). */
  createChild(id?: string): IResourceScope;
  /** Dispose all tracked resources in this scope and child scopes. */
  dispose(): void;
  /** Get count of tracked resources in this scope. */
  getTrackedCount(): number;
}

/**
 * Type check + disposer pair for the disposable registry.
 */
export interface DisposerEntry<T = unknown> {
  typeCheck: (obj: unknown) => boolean;
  disposer: (obj: T) => void;
}

/**
 * Main resource tracker contract.
 * Manages named scopes and a registry of disposer functions.
 */
export interface IResourceTracker {
  createScope(id: string): IResourceScope;
  getScope(id: string): IResourceScope | undefined;
  disposeScope(id: string): void;
  registerDisposer<T>(
    typeCheck: (obj: unknown) => boolean,
    disposer: (obj: T) => void
  ): void;
  getTotalTrackedCount(): number;
  disposeAll(): void;
}
