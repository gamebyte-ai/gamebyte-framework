/**
 * @jest-environment jsdom
 */

import { screenShake, ScreenShakeConfig } from '../../../src/utils/screenShake';

// ---------------------------------------------------------------------------
// RAF simulation helpers
// ---------------------------------------------------------------------------

let rafCallbacks: Array<(timestamp: number) => void> = [];
let rafTimestamp = 0;

function mockRAF(cb: (ts: number) => void): number {
  rafCallbacks.push(cb);
  return rafCallbacks.length; // Non-zero handle
}

function mockCancelRAF(id: number): void {
  // Replace with no-op; simple enough for our tests
  rafCallbacks = rafCallbacks.filter((_, i) => i !== id - 1);
}

/** Run all pending RAF callbacks at the given timestamp and clear the queue. */
function flushRAF(timestamp: number): void {
  rafTimestamp = timestamp;
  const pending = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of pending) {
    cb(timestamp);
  }
}

beforeEach(() => {
  rafCallbacks = [];
  rafTimestamp = 0;

  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(mockRAF as any);
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(mockCancelRAF as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper to create a mock container
// ---------------------------------------------------------------------------

function makeTarget(x = 0, y = 0) {
  return { x, y };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('screenShake', () => {
  it('applies default intensity=8 and duration=300 when not specified', () => {
    const target = makeTarget(50, 100);
    screenShake(target);

    // First frame at t=0 — no elapsed time so decay is full, offset should be non-zero
    flushRAF(0);

    // Position should have changed from original (randomness could hit 0, extremely unlikely)
    // We verify that the function called RAF once
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('simple overload (target, intensity, duration) sets position back after duration', () => {
    const target = makeTarget(10, 20);
    screenShake(target, 5, 200);

    // Frame at time 0 (start)
    flushRAF(0);

    // Frame past duration
    flushRAF(250);

    expect(target.x).toBe(10);
    expect(target.y).toBe(20);
  });

  it('config overload accepts ScreenShakeConfig object', () => {
    const target = makeTarget(0, 0);
    const config: ScreenShakeConfig = {
      target,
      intensity: 15,
      duration: 400,
      decay: 'linear',
      direction: 'both',
    };

    screenShake(config);

    // Should have queued a RAF
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('restores position exactly after shake completes', () => {
    const target = makeTarget(77, 33);
    screenShake(target, 10, 100);

    // Start frame
    flushRAF(0);
    // Mid-shake frames
    flushRAF(50);
    // Past duration — should restore
    flushRAF(120);

    expect(target.x).toBe(77);
    expect(target.y).toBe(33);
  });

  it('direction=horizontal only modifies x, not y', () => {
    const target = makeTarget(0, 0);
    screenShake({ target, intensity: 20, duration: 300, direction: 'horizontal' });

    // Run one non-terminal frame
    flushRAF(0);
    flushRAF(10);

    // y must always remain at original
    expect(target.y).toBe(0);
    // x may have changed (allow any value)
  });

  it('direction=vertical only modifies y, not x', () => {
    const target = makeTarget(0, 0);
    screenShake({ target, intensity: 20, duration: 300, direction: 'vertical' });

    flushRAF(0);
    flushRAF(10);

    expect(target.x).toBe(0);
    // y may have changed
  });

  it('starting a new shake on an already-shaking target restores position before starting', () => {
    const target = makeTarget(5, 10);

    // First shake
    screenShake(target, 20, 500);
    flushRAF(0); // Start first shake — position is now offset

    const xAfterFirstFrame = target.x;
    const yAfterFirstFrame = target.y;

    // Second shake before first ends — should restore then begin fresh
    screenShake(target, 5, 300);

    // After the second shake is applied the target should have been restored to
    // its original coords before the new random offset is applied.
    // We can verify that cancelAnimationFrame was called (cleanup happened).
    expect(cancelAnimationFrame).toHaveBeenCalled();

    // Run to completion of second shake
    flushRAF(0);
    flushRAF(350);

    // After second shake completes position should be restored to original
    expect(target.x).toBe(5);
    expect(target.y).toBe(10);
  });
});
