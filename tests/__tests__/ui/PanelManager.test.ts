/**
 * @jest-environment jsdom
 */

// ---------------------------------------------------------------------------
// Mock GraphicsEngine before any imports that use it
// ---------------------------------------------------------------------------

jest.mock('../../../src/graphics/GraphicsEngine', () => ({
  graphics: jest.fn(),
  GraphicsEngine: {
    getFactory: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(true),
  },
}));

import { graphics } from '../../../src/graphics/GraphicsEngine';
import { PanelManager } from '../../../src/ui/app/PanelManager';
import { GamePanel } from '../../../src/ui/panels/GamePanel';

const mockGraphics = graphics as jest.MockedFunction<typeof graphics>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockContainer() {
  const children: any[] = [];
  return {
    x: 0,
    y: 0,
    alpha: 1,
    visible: true,
    interactiveChildren: true,
    children,
    addChild: jest.fn((c: any) => { children.push(c); return c; }),
    removeChild: jest.fn((c: any) => {
      const i = children.indexOf(c);
      if (i !== -1) children.splice(i, 1);
      return c;
    }),
    removeChildren: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  };
}

function buildFactory() {
  return {
    createContainer: jest.fn(() => makeMockContainer()),
    createText: jest.fn(() => ({
      x: 0, y: 0, text: '', style: {}, anchor: { set: jest.fn() }, destroy: jest.fn(),
    })),
    createGraphics: jest.fn(() => ({
      rect: jest.fn().mockReturnThis(),
      roundRect: jest.fn().mockReturnThis(),
      circle: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      clear: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      eventMode: 'none',
      cursor: 'default',
      on: jest.fn(),
      destroy: jest.fn(),
    })),
    createSprite: jest.fn(),
  };
}

// Minimal concrete GamePanel for testing
class TestPanel extends GamePanel {
  public resizeCalled = false;
  public resizeArgs: [number, number] | null = null;

  protected positionPanel(_w: number, _h: number): void { /* no-op */ }
  protected async animateShow(): Promise<void> { /* no-op */ }
  protected async animateHide(): Promise<void> { /* no-op */ }

  public resize(w: number, h: number): void {
    this.resizeCalled = true;
    this.resizeArgs = [w, h];
  }
}

// Panel without a resize() method (to test fallback path)
class LegacyPanel extends GamePanel {
  public initializeCount = 0;

  protected positionPanel(_w: number, _h: number): void { /* no-op */ }
  protected async animateShow(): Promise<void> { /* no-op */ }
  protected async animateHide(): Promise<void> { /* no-op */ }

  public initialize(w: number, h: number): void {
    this.initializeCount++;
    super.initialize(w, h);
  }
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let mockFactory: ReturnType<typeof buildFactory>;
let rootContainer: ReturnType<typeof makeMockContainer>;
let manager: PanelManager;

beforeEach(() => {
  mockFactory = buildFactory();
  mockGraphics.mockReturnValue(mockFactory as any);
  rootContainer = makeMockContainer();

  manager = new PanelManager({
    container: rootContainer as any,
    screenWidth: 720,
    screenHeight: 1280,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PanelManager', () => {
  describe('show()', () => {
    it('adds panel to active panels', async () => {
      const panel = new TestPanel({ title: 'Test' });
      await manager.show(panel);
      expect(manager.getPanelCount()).toBe(1);
      expect(manager.getTopPanel()).toBe(panel);
    });

    it('emits panel-shown after show animation', async () => {
      const listener = jest.fn();
      manager.on('panel-shown', listener);
      const panel = new TestPanel();
      await manager.show(panel);
      expect(listener).toHaveBeenCalledWith(panel);
    });

    it('blocks interactiveChildren during show animation and re-enables after', async () => {
      const panel = new TestPanel();
      const container = makeMockContainer();
      // Override getContainer to return our spy container
      jest.spyOn(panel, 'getContainer').mockReturnValue(container as any);

      // Track interactiveChildren value when show() is called
      let valueWhenShowCalled: boolean | undefined;
      jest.spyOn(panel, 'show').mockImplementation(async () => {
        valueWhenShowCalled = (container as any).interactiveChildren;
      });

      await manager.show(panel);

      // During show: interactiveChildren should have been false
      expect(valueWhenShowCalled).toBe(false);
      // After show: re-enabled
      expect((container as any).interactiveChildren).toBe(true);
    });
  });

  describe('closeTop()', () => {
    it('returns null when no panels are active', async () => {
      const result = await manager.closeTop();
      expect(result).toBeNull();
    });

    it('closes and returns the top panel', async () => {
      const p1 = new TestPanel({ title: 'P1' });
      const p2 = new TestPanel({ title: 'P2' });
      await manager.show(p1);
      await manager.show(p2);

      const closed = await manager.closeTop();
      expect(closed).toBe(p2);
    });

    it('blocks interactiveChildren on top panel during close', async () => {
      const panel = new TestPanel();
      const container = makeMockContainer();
      jest.spyOn(panel, 'getContainer').mockReturnValue(container as any);

      let valueWhenCloseCalled: boolean | undefined;
      jest.spyOn(panel, 'close').mockImplementation(async () => {
        valueWhenCloseCalled = (container as any).interactiveChildren;
        // Simulate the close event so removePanel fires
        panel.emit('close');
      });

      await manager.show(panel);
      await manager.closeTop();

      expect(valueWhenCloseCalled).toBe(false);
    });
  });

  describe('resize()', () => {
    it('calls resize() on panels that have a resize method', async () => {
      const panel = new TestPanel();
      await manager.show(panel);

      manager.resize(1080, 1920);

      expect(panel.resizeCalled).toBe(true);
      expect(panel.resizeArgs).toEqual([1080, 1920]);
    });

    it('falls back to initialize() on panels without a resize method', async () => {
      const panel = new LegacyPanel();
      // Remove the resize method to simulate a legacy panel
      delete (panel as any).resize;

      await manager.show(panel);
      const initCountBefore = panel.initializeCount;

      manager.resize(1080, 1920);

      // initialize() should have been called once more
      expect(panel.initializeCount).toBeGreaterThan(initCountBefore);
    });

    it('updates stored config dimensions', () => {
      manager.resize(1080, 1920);
      // Verify by emitting resize event
      const listener = jest.fn();
      manager.on('resize', listener);
      manager.resize(540, 960);
      expect(listener).toHaveBeenCalledWith({ width: 540, height: 960 });
    });

    it('emits resize event with new dimensions', () => {
      const listener = jest.fn();
      manager.on('resize', listener);
      manager.resize(1080, 1920);
      expect(listener).toHaveBeenCalledWith({ width: 1080, height: 1920 });
    });
  });

  describe('hasActivePanels() / getPanelCount()', () => {
    it('returns false and 0 when no panels are active', () => {
      expect(manager.hasActivePanels()).toBe(false);
      expect(manager.getPanelCount()).toBe(0);
    });

    it('tracks count correctly after show', async () => {
      await manager.show(new TestPanel());
      await manager.show(new TestPanel());
      expect(manager.hasActivePanels()).toBe(true);
      expect(manager.getPanelCount()).toBe(2);
    });
  });

  describe('closeAll()', () => {
    it('closes all active panels', async () => {
      const p1 = new TestPanel({ title: 'P1' });
      const p2 = new TestPanel({ title: 'P2' });
      await manager.show(p1);
      await manager.show(p2);
      await manager.closeAll();
      expect(manager.getPanelCount()).toBe(0);
    });
  });
});
