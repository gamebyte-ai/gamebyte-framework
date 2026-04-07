/**
 * @jest-environment jsdom
 */

// ---- Mocks ------------------------------------------------------------------

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

function makeContainerStub() {
  const children: any[] = [];
  const stub: any = {
    x: 0,
    y: 0,
    alpha: 1,
    visible: true,
    children,
    addChild: jest.fn((c: any) => {
      c.parent = stub;
      children.push(c);
      return c;
    }),
    removeChild: jest.fn((c: any) => {
      c.parent = null;
      const i = children.indexOf(c);
      if (i !== -1) children.splice(i, 1);
    }),
    removeChildAt: jest.fn((i: number) => {
      const c = children[i];
      if (c) { c.parent = null; children.splice(i, 1); }
      return c;
    }),
    destroy: jest.fn(),
    on: jest.fn().mockReturnThis(),
    eventMode: 'static' as string,
  };
  return stub;
}

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
  createContainer: jest.fn(() => makeContainerStub()),
  createGraphics: jest.fn(() => makeGfxStub()),
  createText: jest.fn((text: string) => makeTextStub(text)),
};

jest.mock('../../../src/graphics/GraphicsEngine', () => ({
  graphics: jest.fn(() => mockFactory),
}));

// ---- Imports ----------------------------------------------------------------

import { QuickGameSetup } from '../../../src/boilerplate/QuickGameSetup';

// ---- Helpers ----------------------------------------------------------------

function makeStage() {
  return makeContainerStub();
}

function makeConfig(overrides: Partial<Parameters<typeof QuickGameSetup>[1]> = {}) {
  return {
    title: 'Test Game',
    width: 540,
    height: 960,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('QuickGameSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-wire the mock factory after clearAllMocks() so createContainer keeps
    // returning fresh stubs on each call.
    mockFactory.createContainer.mockImplementation(() => makeContainerStub());
    mockFactory.createGraphics.mockImplementation(() => makeGfxStub());
    mockFactory.createText.mockImplementation((t: string) => makeTextStub(t));
  });

  // 1 ── Constructor creates flow ─────────────────────────────────────────────
  it('constructor instantiates without throwing', () => {
    const stage = makeStage();
    expect(() => new QuickGameSetup(stage, makeConfig())).not.toThrow();
  });

  // 2 ── start() shows hub ────────────────────────────────────────────────────
  it('start() sets currentScreen to "hub"', () => {
    const stage = makeStage();
    const setup = new QuickGameSetup(stage, makeConfig());
    setup.start();
    expect(setup.currentScreen).toBe('hub');
  });

  // 3 ── trigger('play') navigates to game ──────────────────────────────────
  it('trigger("play") navigates to game screen', () => {
    const stage = makeStage();
    const setup = new QuickGameSetup(stage, makeConfig());
    setup.start();
    setup.trigger('play');
    expect(setup.currentScreen).toBe('game');
  });

  // 4 ── endGame() navigates to result ──────────────────────────────────────
  it('endGame() sets currentScreen to "result"', () => {
    const stage = makeStage();
    const setup = new QuickGameSetup(stage, makeConfig());
    setup.start();
    setup.trigger('play');
    setup.endGame({ score: 1000, type: 'victory' });
    expect(setup.currentScreen).toBe('result');
  });

  // 5 ── showSettings() shows the settings panel ────────────────────────────
  it('showSettings() makes settings container visible', () => {
    const stage = makeStage();
    const setup = new QuickGameSetup(stage, makeConfig());
    setup.start();
    setup.showSettings();
    expect(setup.settings.getContainer().visible).toBe(true);
  });

  // 6 ── currentScreen tracks state ─────────────────────────────────────────
  it('currentScreen reflects each navigation', () => {
    const stage = makeStage();
    const setup = new QuickGameSetup(stage, makeConfig());

    setup.start();
    expect(setup.currentScreen).toBe('hub');

    setup.trigger('play');
    expect(setup.currentScreen).toBe('game');

    setup.trigger('home');
    expect(setup.currentScreen).toBe('hub');
  });

  // 7 ── screen-changed event fires ─────────────────────────────────────────
  it('emits screen-changed with the target screen name', () => {
    const stage = makeStage();
    const setup = new QuickGameSetup(stage, makeConfig());
    const handler = jest.fn();
    setup.on('screen-changed', handler);

    setup.start();
    setup.trigger('play');

    expect(handler).toHaveBeenCalledWith('hub');
    expect(handler).toHaveBeenCalledWith('game');
  });

  // 8 ── destroy cleans up ──────────────────────────────────────────────────
  it('destroy() removes all event listeners', () => {
    const stage = makeStage();
    const setup = new QuickGameSetup(stage, makeConfig());
    setup.start();

    const handler = jest.fn();
    setup.on('screen-changed', handler);
    setup.destroy();

    // After destroy, navigating should not fire listener
    // (flow is destroyed; any trigger call is a no-op)
    expect(setup.listenerCount('screen-changed')).toBe(0);
  });

  // ── Bonus: game-start event fires on play ─────────────────────────────────
  it('emits game-start when entering the game screen', () => {
    const stage = makeStage();
    const onPlay = jest.fn();
    const setup = new QuickGameSetup(stage, makeConfig({ onPlay }));
    const gameStartHandler = jest.fn();
    setup.on('game-start', gameStartHandler);

    setup.start();
    setup.trigger('play');

    expect(gameStartHandler).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  // ── onCreateGame callback receives gameContainer ───────────────────────────
  it('calls onCreateGame with the game container', () => {
    const stage = makeStage();
    const onCreateGame = jest.fn();
    const setup = new QuickGameSetup(stage, makeConfig({ game: { onCreateGame } }));

    setup.start();
    setup.trigger('play'); // triggers game screen creation

    expect(onCreateGame).toHaveBeenCalledTimes(1);
    // The argument should be the same object as setup.gameContainer
    expect(onCreateGame).toHaveBeenCalledWith(setup.gameContainer);
  });

  // ── endGame() emits game-end event with data ───────────────────────────────
  it('emits game-end with the provided data', () => {
    const stage = makeStage();
    const setup = new QuickGameSetup(stage, makeConfig());
    const gameEndHandler = jest.fn();
    setup.on('game-end', gameEndHandler);

    setup.start();
    setup.trigger('play');
    setup.endGame({ score: 999, stars: 3, type: 'victory' });

    expect(gameEndHandler).toHaveBeenCalledWith({ score: 999, stars: 3, type: 'victory' });
  });

  // ── setting-changed event proxied from SettingsPanel ──────────────────────
  it('emits setting-changed when a setting is toggled', () => {
    const stage = makeStage();
    const setup = new QuickGameSetup(stage, makeConfig());
    const handler = jest.fn();
    setup.on('setting-changed', handler);

    setup.settings.set('sound', false);

    expect(handler).toHaveBeenCalledWith('sound', false);
  });
});
