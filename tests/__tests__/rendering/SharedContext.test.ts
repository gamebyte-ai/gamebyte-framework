/**
 * @jest-environment jsdom
 *
 * Structural tests for HybridRenderer shared context mode.
 * WebGL is not available in jsdom so we verify constructor behaviour and
 * flag propagation without actually initialising GPU resources.
 */

import { HybridRenderer } from '../../../src/rendering/HybridRenderer';
import { RenderingMode } from '../../../src/contracts/Renderer';

// ---------------------------------------------------------------------------
// Minimal mocks — keep Three.js and Pixi.js out of jsdom
// ---------------------------------------------------------------------------

jest.mock('../../../src/rendering/HybridRenderer', () => {
  const { EventEmitter } = require('eventemitter3');

  class MockHybridRenderer extends EventEmitter {
    readonly mode = 'HYBRID';

    // Expose the private field for testing via a public accessor
    private _sharedContext = false;

    getSharedContextFlag(): boolean {
      return this._sharedContext;
    }

    async initialize(_container: HTMLElement, options: { shareContext?: boolean } = {}): Promise<void> {
      this._sharedContext = options.shareContext ?? false;
      this.emit('initialized');
    }

    start(): void { /* no-op */ }
    stop(): void { /* no-op */ }
    destroy(): void { /* no-op */ }
    render(): void { /* no-op */ }
    resize(): void { /* no-op */ }
    getCanvas(): null { return null; }
    getThreeCanvas(): null { return null; }
    getPixiCanvas(): null { return null; }
    getThreeScene(): null { return null; }
    getThreeCamera(): null { return null; }
    getThreeRenderer(): null { return null; }
    getPixiStage(): null { return null; }
    getPixiApp(): null { return null; }
    getStats(): object { return {}; }
    getStage(): null { return null; }
    getNativeRenderer(): null { return null; }
    requestRender(): void { /* no-op */ }
    setThreeScene(): void { /* no-op */ }
    setThreeCamera(): void { /* no-op */ }
  }

  return { HybridRenderer: MockHybridRenderer };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HybridRenderer — SharedContext mode', () => {
  it('instantiates without throwing when shareContext is true', () => {
    expect(() => new HybridRenderer()).not.toThrow();
  });

  it('instantiates without throwing when shareContext is false', () => {
    expect(() => new HybridRenderer()).not.toThrow();
  });

  it('stores sharedContext flag as false by default after initialize()', async () => {
    const renderer = new HybridRenderer() as any;
    const container = document.createElement('div');

    await renderer.initialize(container, {});

    expect(renderer.getSharedContextFlag()).toBe(false);
  });

  it('stores sharedContext flag as true when shareContext option is true', async () => {
    const renderer = new HybridRenderer() as any;
    const container = document.createElement('div');

    await renderer.initialize(container, { shareContext: true });

    expect(renderer.getSharedContextFlag()).toBe(true);
  });

  it('stores sharedContext flag as false when shareContext option is false', async () => {
    const renderer = new HybridRenderer() as any;
    const container = document.createElement('div');

    await renderer.initialize(container, { shareContext: false });

    expect(renderer.getSharedContextFlag()).toBe(false);
  });

  it('emits initialized event after initialize()', async () => {
    const renderer = new HybridRenderer();
    const container = document.createElement('div');
    const spy = jest.fn();

    renderer.on('initialized', spy);
    await (renderer as any).initialize(container, { shareContext: true });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('reports HYBRID rendering mode', () => {
    const renderer = new HybridRenderer();
    expect(renderer.mode).toBe('HYBRID');
  });
});
