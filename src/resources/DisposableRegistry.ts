import { DisposerEntry } from '../contracts/Resources.js';

/**
 * Registry of type-check + disposer pairs.
 * First match wins when disposing a resource.
 *
 * Pre-registers disposers for common Three.js and Pixi.js types
 * via duck-typing (no hard dependency on either library).
 */
export class DisposableRegistry {
  private entries: DisposerEntry[] = [];

  constructor() {
    this.registerDefaults();
  }

  /**
   * Register a custom disposer.
   * Added to the front of the list (higher priority than defaults).
   */
  register<T>(typeCheck: (obj: unknown) => boolean, disposer: (obj: T) => void): void {
    this.entries.unshift({ typeCheck, disposer: disposer as (obj: unknown) => void });
  }

  /**
   * Dispose a resource using the first matching disposer.
   * Returns true if a disposer was found and called.
   */
  dispose(resource: unknown): boolean {
    const len = this.entries.length;
    for (let i = 0; i < len; i++) {
      const entry = this.entries[i];
      if (entry.typeCheck(resource)) {
        entry.disposer(resource);
        return true;
      }
    }
    return false;
  }

  /**
   * Register default disposers for common resource types.
   * Uses duck-typing to avoid hard dependencies.
   */
  private registerDefaults(): void {
    // THREE.BufferGeometry (has .dispose() and .attributes)
    this.entries.push({
      typeCheck: (obj: any) =>
        obj != null &&
        typeof obj.dispose === 'function' &&
        obj.attributes !== undefined &&
        obj.index !== undefined,
      disposer: (obj: any) => obj.dispose()
    });

    // THREE.Material (has .dispose() and .uniforms or .type contains 'Material')
    this.entries.push({
      typeCheck: (obj: any) =>
        obj != null &&
        typeof obj.dispose === 'function' &&
        (obj.isMaterial === true ||
          (typeof obj.type === 'string' && obj.type.includes('Material'))),
      disposer: (obj: any) => obj.dispose()
    });

    // THREE.Texture (has .dispose() and .image)
    this.entries.push({
      typeCheck: (obj: any) =>
        obj != null &&
        typeof obj.dispose === 'function' &&
        obj.isTexture === true,
      disposer: (obj: any) => obj.dispose()
    });

    // THREE.WebGLRenderTarget
    this.entries.push({
      typeCheck: (obj: any) =>
        obj != null &&
        typeof obj.dispose === 'function' &&
        obj.isWebGLRenderTarget === true,
      disposer: (obj: any) => obj.dispose()
    });

    // Pixi.js objects (have .destroy())
    this.entries.push({
      typeCheck: (obj: any) =>
        obj != null &&
        typeof obj.destroy === 'function' &&
        typeof obj.dispose !== 'function',
      disposer: (obj: any) => {
        try {
          obj.destroy({ children: true, texture: true, baseTexture: true });
        } catch {
          // Some Pixi objects don't accept options
          obj.destroy();
        }
      }
    });

    // Generic fallback: any object with .dispose()
    this.entries.push({
      typeCheck: (obj: any) => obj != null && typeof obj.dispose === 'function',
      disposer: (obj: any) => obj.dispose()
    });

    // Generic fallback: any object with .destroy() (catch remaining)
    this.entries.push({
      typeCheck: (obj: any) => obj != null && typeof obj.destroy === 'function',
      disposer: (obj: any) => obj.destroy()
    });
  }
}
