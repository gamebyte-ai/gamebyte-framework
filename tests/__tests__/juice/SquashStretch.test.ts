/**
 * @jest-environment jsdom
 */

/**
 * SquashStretch unit tests.
 * Mocks Tween so no animation engine is needed.
 */

// ---------------------------------------------------------------------------
// Mock: Tween & Ease
// ---------------------------------------------------------------------------

const mockTweenTo = jest.fn().mockReturnValue({ stop: jest.fn() });

jest.mock('../../../src/tween/Tween', () => ({
  Tween: { to: mockTweenTo },
}));

jest.mock('../../../src/tween/Ease', () => ({
  Ease: {
    quadOut: (t: number) => t,
    bounceOut: (t: number) => t,
    elasticOut: (t: number) => t,
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { SquashStretch } from '../../../src/juice/SquashStretch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTarget(scaleX = 1, scaleY = 1) {
  return { scale: { x: scaleX, y: scaleY } };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => jest.clearAllMocks());

describe('SquashStretch.squash()', () => {
  it('does nothing when target has no scale', () => {
    SquashStretch.squash({} as any);
    expect(mockTweenTo).not.toHaveBeenCalled();
  });

  it('calls Tween.to to widen and flatten the target', () => {
    const target = makeTarget();
    SquashStretch.squash(target, 0.3, 100);
    const firstCall = mockTweenTo.mock.calls[0];
    expect(firstCall[0]).toBe(target.scale);
    // x grows (1 + 0.3 = 1.3), y shrinks (1 - 0.3 = 0.7)
    expect(firstCall[1].x).toBeCloseTo(1.3);
    expect(firstCall[1].y).toBeCloseTo(0.7);
    expect(firstCall[2].duration).toBe(50); // half of 100
  });

  it('restores to original scale in onComplete', () => {
    const target = makeTarget(2, 2);
    SquashStretch.squash(target, 0.3, 100);
    // Trigger onComplete of first tween
    const firstCallConfig = mockTweenTo.mock.calls[0][2];
    firstCallConfig.onComplete();
    // Second tween should restore to origX=2, origY=2
    const secondCall = mockTweenTo.mock.calls[1];
    expect(secondCall[1].x).toBeCloseTo(2);
    expect(secondCall[1].y).toBeCloseTo(2);
  });
});

describe('SquashStretch.stretch()', () => {
  it('does nothing when target has no scale', () => {
    SquashStretch.stretch(null as any);
    expect(mockTweenTo).not.toHaveBeenCalled();
  });

  it('calls Tween.to to narrow and elongate the target', () => {
    const target = makeTarget();
    SquashStretch.stretch(target, 0.25, 120);
    const firstCall = mockTweenTo.mock.calls[0];
    // x shrinks (1 - 0.25*0.5 = 0.875), y grows (1 + 0.25 = 1.25)
    expect(firstCall[1].x).toBeCloseTo(0.875);
    expect(firstCall[1].y).toBeCloseTo(1.25);
    expect(firstCall[2].duration).toBe(60); // half of 120
  });

  it('restores original scale in onComplete', () => {
    const target = makeTarget();
    SquashStretch.stretch(target, 0.25, 120);
    const firstCallConfig = mockTweenTo.mock.calls[0][2];
    firstCallConfig.onComplete();
    const secondCall = mockTweenTo.mock.calls[1];
    expect(secondCall[1].x).toBeCloseTo(1);
    expect(secondCall[1].y).toBeCloseTo(1);
  });
});

describe('SquashStretch.land()', () => {
  it('delegates to squash with the provided intensity and 150ms', () => {
    const target = makeTarget();
    SquashStretch.land(target, 0.4);
    const firstCall = mockTweenTo.mock.calls[0];
    // intensity 0.4 → x = 1.4, y = 0.6; half duration = 75
    expect(firstCall[1].x).toBeCloseTo(1.4);
    expect(firstCall[1].y).toBeCloseTo(0.6);
    expect(firstCall[2].duration).toBe(75);
  });

  it('uses default intensity 0.35 when none provided', () => {
    const target = makeTarget();
    SquashStretch.land(target);
    const firstCall = mockTweenTo.mock.calls[0];
    expect(firstCall[1].x).toBeCloseTo(1.35);
    expect(firstCall[1].y).toBeCloseTo(0.65);
  });
});
