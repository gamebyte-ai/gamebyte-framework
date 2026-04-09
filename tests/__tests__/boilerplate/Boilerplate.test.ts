/**
 * @jest-environment jsdom
 */

// ---- Mocks -----------------------------------------------------------------

// Mock graphics() with minimal stubs
const makeGfxStub = () => ({
  clear: jest.fn().mockReturnThis(),
  rect: jest.fn().mockReturnThis(),
  roundRect: jest.fn().mockReturnThis(),
  circle: jest.fn().mockReturnThis(),
  fill: jest.fn().mockReturnThis(),
  stroke: jest.fn().mockReturnThis(),
  eventMode: 'static' as string,
  cursor: 'pointer' as string,
  on: jest.fn().mockReturnThis(),
  x: 0,
  y: 0,
  alpha: 1,
  visible: true,
  parent: null as any,
  destroy: jest.fn(),
});

const makeContainerStub = () => {
  const children: any[] = [];
  return {
    x: 0,
    y: 0,
    alpha: 1,
    visible: true,
    children,
    addChild: jest.fn((c: any) => { c.parent = stub; children.push(c); return c; }),
    removeChild: jest.fn((c: any) => { c.parent = null; const i = children.indexOf(c); if (i !== -1) children.splice(i, 1); }),
    destroy: jest.fn(),
    on: jest.fn().mockReturnThis(),
    eventMode: 'static' as string,
  };
  var stub: any;
};

const makeTextStub = (text: string) => ({
  text,
  x: 0,
  y: 0,
  alpha: 1,
  visible: true,
  width: text.length * 9,
  height: 20,
  parent: null as any,
  eventMode: 'static' as string,
  cursor: 'pointer' as string,
  on: jest.fn().mockReturnThis(),
  destroy: jest.fn(),
});

const mockFactory = {
  createContainer: jest.fn(() => {
    const c = makeContainerStub();
    c.addChild = jest.fn((child: any) => { child.parent = c; c.children.push(child); return child; });
    return c;
  }),
  createGraphics: jest.fn(() => makeGfxStub()),
  createText: jest.fn((text: string) => makeTextStub(text)),
};

jest.mock('../../../src/graphics/GraphicsEngine', () => ({
  graphics: jest.fn(() => mockFactory),
}));

// Mock Tween to avoid TweenManager RAF loop
jest.mock('../../../src/tween/Tween', () => ({
  Tween: {
    to: jest.fn((_target: any, _props: any, cfg: any) => {
      if (cfg?.onComplete) cfg.onComplete();
      return { on: jest.fn().mockReturnThis(), _isFinished: true };
    }),
    delay: jest.fn(() => ({
      on: jest.fn((event: string, cb: () => void) => { if (event === 'complete') cb(); return { on: jest.fn() }; }),
    })),
  },
}));

jest.mock('../../../src/tween/Ease', () => ({
  Ease: { quadOut: (t: number) => t, quadIn: (t: number) => t, cubicOut: (t: number) => t },
}));

// ---- Imports ----------------------------------------------------------------

import { GameFlow } from '../../../src/boilerplate/GameFlow';
import { SettingsPanel } from '../../../src/boilerplate/SettingsPanel';
import { TutorialOverlay } from '../../../src/boilerplate/TutorialOverlay';
import { Toast } from '../../../src/boilerplate/Toast';
import { RewardFly } from '../../../src/boilerplate/RewardFly';

// ---- Helpers ----------------------------------------------------------------

function makeScreen(name: string) {
  const container = makeContainerStub();
  return {
    name,
    getContainer: () => container,
    show: jest.fn(),
    hide: jest.fn(),
    destroy: jest.fn(),
  };
}

// =============================================================================
// GameFlow
// =============================================================================
describe('GameFlow', () => {
  let container: any;
  let screenA: ReturnType<typeof makeScreen>;
  let screenB: ReturnType<typeof makeScreen>;

  beforeEach(() => {
    container = makeContainerStub();
    container.addChild = jest.fn();
    container.removeChild = jest.fn();
    screenA = makeScreen('A');
    screenB = makeScreen('B');
    jest.clearAllMocks();
  });

  it('start() navigates to the configured start screen', () => {
    const flow = new GameFlow(container, {
      screens: { menu: { create: () => screenA } },
      flow: {},
      start: 'menu',
    });
    flow.start();
    expect(screenA.show).toHaveBeenCalled();
    expect(flow.current).toBe('menu');
  });

  it('trigger() navigates via event mapping (string target)', () => {
    const flow = new GameFlow(container, {
      screens: {
        menu: { create: () => screenA },
        game: { create: () => screenB },
      },
      flow: { play: 'game' },
      start: 'menu',
    });
    flow.start();
    flow.trigger('play');
    expect(screenB.show).toHaveBeenCalled();
    expect(flow.current).toBe('game');
  });

  it('trigger() resolves function-based target', () => {
    const flow = new GameFlow(container, {
      screens: {
        menu: { create: () => screenA },
        game: { create: () => screenB },
      },
      flow: { play: (data?: any) => (data?.vip ? 'game' : 'menu') },
      start: 'menu',
    });
    flow.start();
    flow.trigger('play', { vip: true });
    expect(flow.current).toBe('game');
  });

  it('trigger() with unknown event does nothing', () => {
    const flow = new GameFlow(container, {
      screens: { menu: { create: () => screenA } },
      flow: {},
      start: 'menu',
    });
    flow.start();
    flow.trigger('nonexistent');
    expect(flow.current).toBe('menu');
  });

  it('goTo() switches to named screen directly', () => {
    const flow = new GameFlow(container, {
      screens: {
        menu: { create: () => screenA },
        game: { create: () => screenB },
      },
      flow: {},
      start: 'menu',
    });
    flow.start();
    flow.goTo('game');
    expect(flow.current).toBe('game');
    expect(screenB.show).toHaveBeenCalled();
  });

  it('getScreen() returns null for uncreated screen', () => {
    const flow = new GameFlow(container, {
      screens: { menu: { create: () => screenA } },
      flow: {},
      start: 'menu',
    });
    expect(flow.getScreen('menu')).toBeNull();
  });

  it('getScreen() returns instance after navigation', () => {
    const flow = new GameFlow(container, {
      screens: { menu: { create: () => screenA } },
      flow: {},
      start: 'menu',
    });
    flow.start();
    expect(flow.getScreen('menu')).toBe(screenA);
  });

  it('emits navigate event on screen change', () => {
    const handler = jest.fn();
    const flow = new GameFlow(container, {
      screens: {
        menu: { create: () => screenA },
        game: { create: () => screenB },
      },
      flow: { play: 'game' },
      start: 'menu',
    });
    flow.on('navigate', handler);
    flow.start();
    flow.trigger('play');
    expect(handler).toHaveBeenCalledWith('menu', 'game');
  });
});

// =============================================================================
// SettingsPanel
// =============================================================================
describe('SettingsPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('get() returns default values', () => {
    const panel = new SettingsPanel();
    expect(panel.get('sound')).toBe(true);
    expect(panel.get('music')).toBe(true);
    expect(panel.get('vibration')).toBe(true);
  });

  it('set() updates value and emits changed', () => {
    const panel = new SettingsPanel();
    const handler = jest.fn();
    panel.on('changed', handler);
    panel.set('sound', false);
    expect(panel.get('sound')).toBe(false);
    expect(handler).toHaveBeenCalledWith('sound', false);
  });

  it('getAll() returns all settings', () => {
    const panel = new SettingsPanel({ sound: false });
    const all = panel.getAll();
    expect(all).toMatchObject({ sound: false, music: true, vibration: true });
  });

  it('constructor respects custom defaults', () => {
    const panel = new SettingsPanel({ music: false, vibration: false });
    expect(panel.get('music')).toBe(false);
    expect(panel.get('vibration')).toBe(false);
  });

  it('custom entries are tracked in get/set', () => {
    const panel = new SettingsPanel({ custom: [{ key: 'haptics', label: 'Haptics', value: true }] });
    expect(panel.get('haptics')).toBe(true);
    panel.set('haptics', false);
    expect(panel.get('haptics')).toBe(false);
  });

  it('show/hide toggle container visibility', () => {
    const panel = new SettingsPanel();
    const c = panel.getContainer();
    panel.show();
    expect(c.visible).toBe(true);
    panel.hide();
    expect(c.visible).toBe(false);
  });

  it('should support number fields', () => {
    const panel = new SettingsPanel({
      fields: [
        { key: 'volume', label: 'Volume', type: 'number', defaultValue: 0.8, min: 0, max: 1, step: 0.1 },
      ],
    });
    expect(panel.get('volume')).toBeCloseTo(0.8);
    panel.set('volume', 0.5);
    expect(panel.get('volume')).toBeCloseTo(0.5);
  });

  it('should clamp number values to min/max', () => {
    const panel = new SettingsPanel({
      fields: [
        { key: 'vol', label: 'Vol', type: 'number', defaultValue: 0.5, min: 0, max: 1, step: 0.1 },
      ],
    });
    panel.set('vol', 1.5);
    expect(panel.get('vol')).toBeCloseTo(1);
    panel.set('vol', -0.5);
    expect(panel.get('vol')).toBeCloseTo(0);
  });

  it('should snap number values to step', () => {
    const panel = new SettingsPanel({
      fields: [
        { key: 'vol', label: 'Vol', type: 'number', defaultValue: 0.5, min: 0, max: 1, step: 0.25 },
      ],
    });
    // 0.3 rounded to nearest 0.25 step = 0.25
    panel.set('vol', 0.3);
    expect(panel.get('vol')).toBeCloseTo(0.25);
  });

  it('should emit changed event for number fields', () => {
    const panel = new SettingsPanel({
      fields: [
        { key: 'brightness', label: 'Brightness', type: 'number', defaultValue: 0.5, min: 0, max: 1, step: 0.1 },
      ],
    });
    const handler = jest.fn();
    panel.on('changed', handler);
    panel.set('brightness', 0.7);
    expect(handler).toHaveBeenCalledWith('brightness', expect.closeTo(0.7, 5));
  });

  it('should persist and load from localStorage', () => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      length: 0,
      key: () => null,
    };
    Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true, configurable: true });

    const panel = new SettingsPanel({ sound: true, persistKey: 'test-game' });
    panel.set('sound', false);
    expect(store['test-game:sound']).toBe('false');

    // Second instance should load from persisted value
    const panel2 = new SettingsPanel({ sound: true, persistKey: 'test-game' });
    expect(panel2.get('sound')).toBe(false);
  });
});

// =============================================================================
// TutorialOverlay
// =============================================================================
describe('TutorialOverlay', () => {
  const steps = [
    { text: 'Step 1', x: 100, y: 200 },
    { text: 'Step 2', x: 150, y: 250 },
    { text: 'Step 3', x: 200, y: 300 },
  ];

  beforeEach(() => jest.clearAllMocks());

  it('start() shows container and emits step 0', () => {
    const overlay = new TutorialOverlay(steps);
    const stepHandler = jest.fn();
    overlay.on('step', stepHandler);
    overlay.start();
    expect(overlay.getContainer().visible).toBe(true);
    expect(stepHandler).toHaveBeenCalledWith(0);
    expect(overlay.currentStep).toBe(0);
  });

  it('next() advances step index and emits step event', () => {
    const overlay = new TutorialOverlay(steps);
    const stepHandler = jest.fn();
    overlay.on('step', stepHandler);
    overlay.start();
    overlay.next();
    expect(overlay.currentStep).toBe(1);
    expect(stepHandler).toHaveBeenCalledWith(1);
  });

  it('next() on last step emits complete and hides', () => {
    const overlay = new TutorialOverlay(steps);
    const completeHandler = jest.fn();
    overlay.on('complete', completeHandler);
    overlay.start();
    overlay.next(); // step 1
    overlay.next(); // step 2
    overlay.next(); // complete
    expect(completeHandler).toHaveBeenCalled();
    expect(overlay.getContainer().visible).toBe(false);
  });

  it('skip() hides overlay and emits skip event', () => {
    const overlay = new TutorialOverlay(steps);
    const skipHandler = jest.fn();
    overlay.on('skip', skipHandler);
    overlay.start();
    overlay.skip();
    expect(skipHandler).toHaveBeenCalled();
    expect(overlay.getContainer().visible).toBe(false);
  });

  it('complete fires immediately when steps array is empty', () => {
    const overlay = new TutorialOverlay([]);
    const completeHandler = jest.fn();
    overlay.on('complete', completeHandler);
    overlay.start();
    expect(completeHandler).toHaveBeenCalled();
  });
});

// =============================================================================
// Toast
// =============================================================================
describe('Toast', () => {
  beforeEach(() => jest.clearAllMocks());

  it('show() adds a child to parent', () => {
    const parent = makeContainerStub();
    parent.addChild = jest.fn();
    parent.removeChild = jest.fn();
    Toast.show(parent, { text: 'Hello!' });
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('show() accepts string shorthand', () => {
    const parent = makeContainerStub();
    parent.addChild = jest.fn();
    expect(() => Toast.show(parent, 'Quick toast')).not.toThrow();
  });

  it('show() removes child after animation (Tween mock fires immediately)', () => {
    const parent = makeContainerStub();
    const added: any[] = [];
    parent.addChild = jest.fn((c: any) => { c.parent = parent; added.push(c); });
    parent.removeChild = jest.fn((c: any) => { c.parent = null; });
    Toast.show(parent, 'Bye!');
    // Since Tween mock fires onComplete immediately, removeChild is called
    expect(parent.removeChild).toHaveBeenCalled();
  });
});

// =============================================================================
// RewardFly
// =============================================================================
describe('RewardFly', () => {
  beforeEach(() => jest.clearAllMocks());

  it('play() calls onComplete after all particles arrive', () => {
    const parent = makeContainerStub();
    parent.addChild = jest.fn();
    parent.removeChild = jest.fn();

    const onComplete = jest.fn();
    RewardFly.play({
      parent,
      from: { x: 0, y: 0 },
      to: { x: 200, y: 200 },
      count: 3,
      onComplete,
    });
    // Tween mock fires onComplete immediately so all 3 particles arrive
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('play() calls onEachArrive for each particle', () => {
    const parent = makeContainerStub();
    parent.addChild = jest.fn();
    parent.removeChild = jest.fn();

    const onEachArrive = jest.fn();
    RewardFly.play({
      parent,
      from: { x: 0, y: 0 },
      to: { x: 100, y: 100 },
      count: 5,
      onEachArrive,
    });
    expect(onEachArrive).toHaveBeenCalledTimes(5);
  });

  it('play() works with default count without throwing', () => {
    const parent = makeContainerStub();
    parent.addChild = jest.fn();
    parent.removeChild = jest.fn();
    expect(() =>
      RewardFly.play({ parent, from: { x: 0, y: 0 }, to: { x: 100, y: 100 } })
    ).not.toThrow();
  });
});
