/**
 * @jest-environment jsdom
 *
 * HybridHUD tests — exercises the HUD without a real Pixi or Three.js context.
 * All Pixi graphics calls are intercepted via a mock factory.
 */

import { HybridHUD } from '../../../src/hybrid/HybridHUD';

// ---------------------------------------------------------------------------
// Mock graphics() so we never touch Pixi internals
// ---------------------------------------------------------------------------

const mockChildren: any[] = [];

function makeMockText(initialText: string) {
  return { text: initialText, x: 0, y: 0 };
}

function makeMockGraphics() {
  const gfx: any = {
    _ops: [] as string[],
    rect(..._args: any[]) { gfx._ops.push('rect'); return gfx; },
    roundRect(..._args: any[]) { gfx._ops.push('roundRect'); return gfx; },
    fill(..._args: any[]) { gfx._ops.push('fill'); return gfx; },
    stroke(..._args: any[]) { gfx._ops.push('stroke'); return gfx; },
    clear() { gfx._ops.push('clear'); return gfx; },
  };
  return gfx;
}

function makeMockContainer() {
  const children: any[] = [];
  const c: any = {
    x: 0, y: 0,
    visible: true,
    children,
    addChild(child: any) { children.push(child); return child; },
    removeChild(child: any) {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
    },
    // Simulate Pixi v8 event model
    eventMode: undefined,
    cursor: undefined,
    _listeners: {} as Record<string, Array<() => void>>,
    on(event: string, fn: () => void) {
      c._listeners[event] = c._listeners[event] || [];
      c._listeners[event].push(fn);
    },
    emit(event: string) {
      (c._listeners[event] || []).forEach((fn: () => void) => fn());
    },
  };
  return c;
}

// Patch the module-level graphics() factory before tests run
jest.mock('../../../src/graphics/GraphicsEngine', () => ({
  graphics: () => ({
    createText: (t: string) => makeMockText(t),
    createGraphics: () => makeMockGraphics(),
    createContainer: () => makeMockContainer(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHUD(width = 800, height = 600) {
  const stage: any = makeMockContainer();
  const hud = new HybridHUD(stage, width, height);
  return { hud, stage };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HybridHUD', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---- construction ---------------------------------------------------------

  it('constructs without throwing', () => {
    expect(() => makeHUD()).not.toThrow();
  });

  // ---- addTopBar ------------------------------------------------------------

  it('addTopBar adds a container to the stage', () => {
    const { hud, stage } = makeHUD();
    hud.addTopBar({ score: { initial: 0 } });
    expect(stage.children.length).toBe(1);
  });

  it('addTopBar stores score element so setValue works', () => {
    const { hud } = makeHUD();
    hud.addTopBar({ score: { initial: 0 } });
    hud.setValue('score', 999);
    // Verify that the internal element has been updated — access via private map
    const el = (hud as any)._elements.get('score');
    expect(el.text).toBe('999');
  });

  it('addTopBar stores all four standard fields', () => {
    const { hud } = makeHUD();
    hud.addTopBar({
      score: { initial: 0 },
      lives: { initial: 3, max: 5 },
      coins: { initial: 10 },
      timer: { seconds: 60 },
    });
    const keys = Array.from((hud as any)._elements.keys());
    expect(keys).toContain('score');
    expect(keys).toContain('lives');
    expect(keys).toContain('coins');
    expect(keys).toContain('timer');
  });

  it('addTopBar stores custom fields', () => {
    const { hud } = makeHUD();
    hud.addTopBar({
      custom: [{ key: 'xp', label: 'XP', value: 100 }],
    });
    expect((hud as any)._elements.has('xp')).toBe(true);
  });

  // ---- addBottomBar ---------------------------------------------------------

  it('addBottomBar adds a container to the stage', () => {
    const { hud, stage } = makeHUD();
    hud.addBottomBar({
      buttons: [{ id: 'pause', label: 'Pause' }],
    });
    expect(stage.children.length).toBe(1);
  });

  it('addBottomBar registers all buttons in _containers', () => {
    const { hud } = makeHUD();
    hud.addBottomBar({
      buttons: [
        { id: 'pause', label: 'Pause' },
        { id: 'shop', label: 'Shop' },
      ],
    });
    expect((hud as any)._containers.has('button:pause')).toBe(true);
    expect((hud as any)._containers.has('button:shop')).toBe(true);
  });

  it('addBottomBar calls onClick when button is clicked', () => {
    const { hud } = makeHUD();
    const onClick = jest.fn();
    hud.addBottomBar({ buttons: [{ id: 'act', label: 'Act', onClick }] });

    const btnContainer = (hud as any)._containers.get('button:act');
    // Simulate a pointerdown event from Pixi
    btnContainer?.emit('pointerdown');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // ---- setValue -------------------------------------------------------------

  it('setValue is a no-op for unknown keys', () => {
    const { hud } = makeHUD();
    expect(() => hud.setValue('nonexistent', 42)).not.toThrow();
  });

  it('setValue updates lives field', () => {
    const { hud } = makeHUD();
    hud.addTopBar({ lives: { initial: 3 } });
    hud.setValue('lives', 1);
    const el = (hud as any)._elements.get('lives');
    expect(el.text).toBe('1');
  });

  // ---- setVisible -----------------------------------------------------------

  it('setVisible(false) hides all bar containers', () => {
    const { hud } = makeHUD();
    hud.addTopBar({ score: { initial: 0 } });
    hud.addBottomBar({ buttons: [{ id: 'x', label: 'X' }] });

    hud.setVisible(false);

    for (const [, container] of (hud as any)._containers) {
      expect(container.visible).toBe(false);
    }
  });

  it('setVisible(true) shows all bar containers', () => {
    const { hud } = makeHUD();
    hud.addTopBar({ score: { initial: 0 } });
    hud.setVisible(false);
    hud.setVisible(true);

    for (const [, container] of (hud as any)._containers) {
      expect(container.visible).toBe(true);
    }
  });

  // ---- showMessage ----------------------------------------------------------

  it('showMessage adds a text child to the stage', () => {
    const { hud, stage } = makeHUD();
    hud.showMessage('WAVE 1');
    expect(stage.children.length).toBe(1);
  });

  it('showMessage removes the text after duration', () => {
    const { hud, stage } = makeHUD();
    hud.showMessage('GO!', { duration: 1000 });
    expect(stage.children.length).toBe(1);

    jest.advanceTimersByTime(1000);
    expect(stage.children.length).toBe(0);
  });

  it('showMessage uses default 2000ms duration', () => {
    const { hud, stage } = makeHUD();
    hud.showMessage('Hi');

    jest.advanceTimersByTime(1999);
    expect(stage.children.length).toBe(1);

    jest.advanceTimersByTime(1);
    expect(stage.children.length).toBe(0);
  });

  // ---- destroy --------------------------------------------------------------

  it('destroy clears all containers and elements', () => {
    const { hud } = makeHUD();
    hud.addTopBar({ score: { initial: 0 } });
    hud.addBottomBar({ buttons: [{ id: 'btn', label: 'Btn' }] });

    hud.destroy();

    expect((hud as any)._containers.size).toBe(0);
    expect((hud as any)._elements.size).toBe(0);
  });

  it('destroy removes containers from the stage', () => {
    const { hud, stage } = makeHUD();
    hud.addTopBar({ score: { initial: 0 } });
    expect(stage.children.length).toBe(1);

    hud.destroy();
    expect(stage.children.length).toBe(0);
  });

  // ---- button:click event ---------------------------------------------------

  it('emits button:click event with button id on press', () => {
    const { hud } = makeHUD();
    const handler = jest.fn();
    hud.on('button:click', handler);

    hud.addBottomBar({ buttons: [{ id: 'fire', label: 'Fire' }] });
    const btnContainer = (hud as any)._containers.get('button:fire');
    btnContainer?.emit('pointerdown');

    expect(handler).toHaveBeenCalledWith('fire');
  });
});
