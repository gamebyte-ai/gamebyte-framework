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

// Mock animation utilities so tests run synchronously
jest.mock('../../../src/ui/utils/animation', () => ({
  animate: jest.fn(({ onUpdate }: { onUpdate: (t: number, e: number) => void }) => {
    onUpdate(1, 1);
    return Promise.resolve();
  }),
  Easing: { easeOutCubic: (t: number) => t },
  lerp: (a: number, b: number, t: number) => a + (b - a) * t,
  AnimationPresets: {
    fadeIn: jest.fn(() => Promise.resolve()),
    fadeOut: jest.fn(() => Promise.resolve()),
  },
}));

import { graphics } from '../../../src/graphics/GraphicsEngine';
import { ScreenManager } from '../../../src/ui/app/ScreenManager';
import { SimpleScreen } from '../../../src/ui/screens/SimpleScreen';

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
    createText: jest.fn(),
    createGraphics: jest.fn(() => ({
      rect: jest.fn().mockReturnThis(),
      roundRect: jest.fn().mockReturnThis(),
      circle: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      clear: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
    })),
    createSprite: jest.fn(),
  };
}

// Concrete SimpleScreen for testing
class TestScreen extends SimpleScreen {
  public setupCalled = false;

  constructor(name: string = 'test') {
    super(name);
  }

  protected setup(): void {
    this.setupCalled = true;
  }
}

// Screen with a deliberately failing show() for error-path tests
class FailingScreen extends SimpleScreen {
  protected setup(): void { /* no-op */ }

  public async show(_data?: any): Promise<void> {
    throw new Error('intentional show failure');
  }
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let mockFactory: ReturnType<typeof buildFactory>;
let rootContainer: ReturnType<typeof makeMockContainer>;
let manager: ScreenManager;

beforeEach(() => {
  mockFactory = buildFactory();
  mockGraphics.mockReturnValue(mockFactory as any);
  rootContainer = makeMockContainer();

  manager = new ScreenManager({
    container: rootContainer as any,
    width: 720,
    height: 1280,
    defaultTransition: 'none', // keeps tests synchronous
    transitionDuration: 0,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScreenManager', () => {
  describe('push()', () => {
    it('adds screen to the stack', async () => {
      const screen = new TestScreen('home');
      await manager.push(screen);
      expect(manager.getScreenCount()).toBe(1);
      expect(manager.getCurrentScreen()).toBe(screen);
    });

    it('emits screen-pushed after a successful push', async () => {
      const listener = jest.fn();
      manager.on('screen-pushed', listener);
      const screen = new TestScreen();
      await manager.push(screen);
      expect(listener).toHaveBeenCalledWith(screen);
    });

    it('ignores concurrent pushes while transitioning', async () => {
      // Freeze isTransitioning by providing a never-resolving transition
      let resolveBlock!: () => void;
      const block = new Promise<void>((res) => { resolveBlock = res; });

      const { animate: mockAnimate } = require('../../../src/ui/utils/animation');
      mockAnimate.mockImplementationOnce(() => block);

      const screen1 = new TestScreen('s1');
      const screen2 = new TestScreen('s2');

      // Push screen1 with the blocking transition
      manager.push(screen1, 'slide');

      // Immediately push screen2 — should be ignored
      await manager.push(screen2);

      // Only screen1 should be in the stack at this point (screen2 ignored)
      // screen1 is still transitioning, so count is 1
      expect(manager.getScreenCount()).toBe(1);

      // Unblock
      resolveBlock();
    });

    it('resets isTransitioning on animation error', async () => {
      const failingScreen = new FailingScreen('fail');
      // push with 'none' transition so it calls screen.show() directly, which throws
      await manager.push(failingScreen, 'none');

      // isTransitioning must be false after the error
      // Verify by successfully pushing a second screen (would be blocked if stuck)
      const followUp = new TestScreen('follow');
      await manager.push(followUp, 'none');
      expect(manager.getScreenCount()).toBe(2);
    });
  });

  describe('pop()', () => {
    it('returns null and warns when only one screen is on the stack', async () => {
      const screen = new TestScreen();
      await manager.push(screen, 'none');
      const result = await manager.pop('none');
      expect(result).toBeNull();
      expect(manager.getScreenCount()).toBe(1);
    });

    it('pops the top screen and returns it', async () => {
      const s1 = new TestScreen('s1');
      const s2 = new TestScreen('s2');
      await manager.push(s1, 'none');
      await manager.push(s2, 'none');

      const popped = await manager.pop('none');
      expect(popped).toBe(s2);
      expect(manager.getScreenCount()).toBe(1);
      expect(manager.getCurrentScreen()).toBe(s1);
    });

    it('resets isTransitioning even when transition throws', async () => {
      const s1 = new TestScreen('s1');
      const s2 = new TestScreen('s2');
      await manager.push(s1, 'none');
      await manager.push(s2, 'none');

      // Make the slide transition throw
      const { animate: mockAnimate } = require('../../../src/ui/utils/animation');
      mockAnimate.mockRejectedValueOnce(new Error('transition error'));

      // pop with slide so animateTransition runs
      await manager.pop('slide');

      // Must be able to pop again (not deadlocked)
      const s3 = new TestScreen('s3');
      // Stack had s1 remaining; push s3 to verify no lock
      await manager.push(s3, 'none');
      expect(manager.getScreenCount()).toBe(2);
    });
  });

  describe('replace()', () => {
    it('replaces the current screen', async () => {
      const s1 = new TestScreen('s1');
      const s2 = new TestScreen('s2');
      await manager.push(s1, 'none');
      await manager.replace(s2, 'none');

      expect(manager.getScreenCount()).toBe(1);
      expect(manager.getCurrentScreen()).toBe(s2);
    });

    it('resets isTransitioning on animation error during replace', async () => {
      const s1 = new TestScreen('s1');
      await manager.push(s1, 'none');

      const { animate: mockAnimate } = require('../../../src/ui/utils/animation');
      mockAnimate.mockRejectedValueOnce(new Error('replace error'));

      const s2 = new TestScreen('s2');
      await manager.replace(s2, 'slide');

      // Should be unlocked — push should work
      const s3 = new TestScreen('s3');
      await manager.push(s3, 'none');
      expect(manager.getScreenCount()).toBe(2);
    });
  });

  describe('destroy()', () => {
    it('sets _destroyed flag and removes all listeners', async () => {
      const listener = jest.fn();
      manager.on('screen-pushed', listener);
      manager.destroy();

      // Event listeners should be cleared
      expect(manager.listenerCount('screen-pushed')).toBe(0);
    });
  });

  describe('rapid navigation', () => {
    it('does not deadlock on rapid push calls', async () => {
      const screens = [new TestScreen('a'), new TestScreen('b'), new TestScreen('c')];

      await manager.push(screens[0], 'none');
      // Rapid second push while isTransitioning is false — should succeed
      await manager.push(screens[1], 'none');
      // Third push
      await manager.push(screens[2], 'none');

      expect(manager.getScreenCount()).toBe(3);
    });
  });
});
