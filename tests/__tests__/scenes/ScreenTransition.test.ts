/**
 * @jest-environment jsdom
 */

import { ScreenTransition, TransitionConfig } from '../../../src/scenes/transitions/ScreenTransition';
import { TweenManager } from '../../../src/tween/TweenManager';

// ---- Helpers ---------------------------------------------------------------

/** Advance TweenManager in discrete steps totalling `ms` milliseconds. */
function tickMs(ms: number, step = 16): void {
  let elapsed = 0;
  while (elapsed < ms) {
    const dt = Math.min(step, ms - elapsed);
    TweenManager.update(dt);
    elapsed += dt;
  }
}

/**
 * Yield to the microtask queue N times.
 * This allows pending Promise.then() chains to execute between our ticks.
 */
async function flushMicrotasks(count = 5): Promise<void> {
  for (let i = 0; i < count; i++) {
    await Promise.resolve();
  }
}

/**
 * Drive TweenManager concurrently while awaiting a promise.
 * Interleaves TweenManager ticks with microtask flushes so that internal
 * `await tweenToPromise(...)` chains inside ScreenTransition can progress.
 *
 * @param promise  - The async operation to wait for
 * @param totalMs  - Total ms to simulate (driven in 20ms steps)
 */
async function tickWhileAwaiting<T>(promise: Promise<T>, totalMs: number): Promise<T> {
  const step = 20;
  const steps = Math.ceil(totalMs / step);

  let result: T;
  let error: unknown;
  let settled = false;

  promise.then(
    (v) => { result = v; settled = true; },
    (e) => { error = e; settled = true; }
  );

  for (let i = 0; i < steps && !settled; i++) {
    TweenManager.update(step);
    await flushMicrotasks(8);
  }

  if (!settled) {
    // Force one last flush
    await flushMicrotasks(16);
  }

  if (error !== undefined) throw error;
  return result!;
}

/** Build a minimal container mock. */
function makeContainer(x = 0, y = 0, alpha = 1) {
  return {
    x,
    y,
    alpha,
    visible: true,
    scale: { x: 1, y: 1 },
  };
}

const viewport = { width: 480, height: 852 };

// ---- Setup -----------------------------------------------------------------

beforeEach(() => {
  TweenManager._reset();
  // jsdom does not implement requestAnimationFrame in a time-driven way,
  // so we stub it to immediately invoke the callback.
  // (ScreenTransition only uses rAF in its standalone drive loop — not exercised here.)
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(performance.now());
    return 0;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  TweenManager._reset();
});

// ---- Tests -----------------------------------------------------------------

describe('ScreenTransition', () => {
  // 1. Instant transition
  describe('instant', () => {
    it('applies immediately without needing TweenManager', async () => {
      const outgoing = makeContainer();
      const incoming = makeContainer(0, 0, 0);
      incoming.visible = false;

      await ScreenTransition.play(outgoing, incoming, viewport, ScreenTransition.INSTANT);

      expect(outgoing.visible).toBe(false);
      expect(outgoing.alpha).toBe(0);
      expect(incoming.alpha).toBe(1);
      expect(incoming.visible).toBe(true);
    });

    it('handles null outgoing container', async () => {
      const incoming = makeContainer();
      await expect(
        ScreenTransition.play(null, incoming, viewport, ScreenTransition.INSTANT)
      ).resolves.toBeUndefined();
    });
  });

  // 2. Fade transition
  describe('fade', () => {
    it('sets outgoing alpha to 0 after fade-out phase', async () => {
      const outgoing = makeContainer();
      const incoming = makeContainer(0, 0, 0);

      await tickWhileAwaiting(
        ScreenTransition.play(outgoing, incoming, viewport, {
          type: 'fade',
          duration: 200,
        }),
        600
      );

      // After full fade: outgoing alpha should be 0, incoming alpha should be 1
      expect(outgoing.alpha).toBeCloseTo(0, 1);
    });

    it('sets incoming alpha to 1 after full fade completes', async () => {
      const outgoing = makeContainer();
      const incoming = makeContainer(0, 0, 0);

      await tickWhileAwaiting(
        ScreenTransition.play(outgoing, incoming, viewport, {
          type: 'fade',
          duration: 100,
        }),
        400
      );

      expect(incoming.alpha).toBeCloseTo(1, 1);
    });
  });

  // 3. Slide transitions
  describe('slide-left', () => {
    it('positions incoming at viewport.width before animating', async () => {
      const outgoing = makeContainer();
      const incoming = makeContainer();

      // play() sets incoming.x synchronously before the first await
      // so we must start the promise and check x on the next microtask
      const promise = ScreenTransition.play(outgoing, incoming, viewport, {
        type: 'slide-left',
        duration: 200,
      });

      // incoming.x is set synchronously inside _playSlide before any await
      expect(incoming.x).toBe(viewport.width);

      await tickWhileAwaiting(promise, 600);
    });

    it('finishes with incoming.x === 0', async () => {
      const outgoing = makeContainer();
      const incoming = makeContainer();

      await tickWhileAwaiting(
        ScreenTransition.play(outgoing, incoming, viewport, {
          type: 'slide-left',
          duration: 100,
        }),
        400
      );

      expect(incoming.x).toBeCloseTo(0, 0);
    });
  });

  describe('slide-right', () => {
    it('positions incoming at -viewport.width initially', async () => {
      const outgoing = makeContainer();
      const incoming = makeContainer();

      const promise = ScreenTransition.play(outgoing, incoming, viewport, {
        type: 'slide-right',
        duration: 200,
      });

      expect(incoming.x).toBe(-viewport.width);

      await tickWhileAwaiting(promise, 600);
    });
  });

  describe('slide-up', () => {
    it('positions incoming at viewport.height initially', async () => {
      const outgoing = makeContainer();
      const incoming = makeContainer();

      const promise = ScreenTransition.play(outgoing, incoming, viewport, {
        type: 'slide-up',
        duration: 200,
      });

      expect(incoming.y).toBe(viewport.height);

      await tickWhileAwaiting(promise, 600);
    });
  });

  // 4. Zoom transition
  describe('zoom', () => {
    it('resolves after all tweens complete', async () => {
      const outgoing = makeContainer();
      const incoming = makeContainer(0, 0, 0);

      await tickWhileAwaiting(
        ScreenTransition.play(outgoing, incoming, viewport, {
          type: 'zoom',
          duration: 100,
        }),
        400
      );

      expect(incoming.alpha).toBeCloseTo(1, 1);
    });
  });

  // 5. Preset configs
  describe('presets', () => {
    it('FADE preset has type "fade"', () => {
      expect(ScreenTransition.FADE.type).toBe('fade');
    });

    it('SLIDE_LEFT preset has type "slide-left"', () => {
      expect(ScreenTransition.SLIDE_LEFT.type).toBe('slide-left');
    });

    it('SLIDE_RIGHT preset has type "slide-right"', () => {
      expect(ScreenTransition.SLIDE_RIGHT.type).toBe('slide-right');
    });

    it('SLIDE_UP preset has type "slide-up"', () => {
      expect(ScreenTransition.SLIDE_UP.type).toBe('slide-up');
    });

    it('SLIDE_DOWN preset has type "slide-down"', () => {
      expect(ScreenTransition.SLIDE_DOWN.type).toBe('slide-down');
    });

    it('ZOOM preset has type "zoom"', () => {
      expect(ScreenTransition.ZOOM.type).toBe('zoom');
    });

    it('INSTANT preset has type "instant"', () => {
      expect(ScreenTransition.INSTANT.type).toBe('instant');
    });
  });
});
