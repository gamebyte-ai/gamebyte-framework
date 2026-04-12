/**
 * @jest-environment jsdom
 */

/**
 * ScreenEffects unit tests.
 * Mocks graphics() factory and Tween so no Pixi.js is needed.
 */

// ---------------------------------------------------------------------------
// Mock: Tween
// ---------------------------------------------------------------------------

const mockTweenTo = jest.fn().mockReturnValue({ stop: jest.fn() });

jest.mock('../../../src/tween/Tween', () => ({
  Tween: { to: mockTweenTo },
}));

jest.mock('../../../src/tween/Ease', () => ({
  Ease: { quadOut: (t: number) => t },
}));

// ---------------------------------------------------------------------------
// Mock: graphics()
// ---------------------------------------------------------------------------

const mockOverlay = {
  rect: jest.fn().mockReturnThis(),
  fill: jest.fn().mockReturnThis(),
  alpha: 0,
  destroy: jest.fn(),
};

jest.mock('../../../src/graphics/GraphicsEngine', () => ({
  graphics: jest.fn(() => ({
    createGraphics: jest.fn(() => mockOverlay),
  })),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { ScreenEffects } from '../../../src/juice/ScreenEffects';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockParent() {
  return {
    addChild: jest.fn(),
    removeChild: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockOverlay.alpha = 0;
});

describe('ScreenEffects.init()', () => {
  it('stores the parent container', () => {
    const parent = makeMockParent();
    ScreenEffects.init(parent);
    // flash() should now work without errors
    expect(() => ScreenEffects.flash()).not.toThrow();
  });
});

describe('ScreenEffects.flash()', () => {
  it('does nothing when parent is not set', () => {
    // Reset internal parent by passing null cast
    ScreenEffects.init(null as any);
    expect(() => ScreenEffects.flash()).not.toThrow();
    expect(mockTweenTo).not.toHaveBeenCalled();
  });

  it('adds overlay to parent', () => {
    const parent = makeMockParent();
    ScreenEffects.init(parent);
    ScreenEffects.flash();
    expect(parent.addChild).toHaveBeenCalledWith(mockOverlay);
  });

  it('sets overlay alpha to provided value', () => {
    const parent = makeMockParent();
    ScreenEffects.init(parent);
    ScreenEffects.flash(0xFFFFFF, 0.7, 200);
    expect(mockOverlay.alpha).toBe(0.7);
  });

  it('creates a Tween animating alpha to 0', () => {
    const parent = makeMockParent();
    ScreenEffects.init(parent);
    ScreenEffects.flash(0xFFFFFF, 0.5, 300);
    expect(mockTweenTo).toHaveBeenCalledWith(
      mockOverlay,
      { alpha: 0 },
      expect.objectContaining({ duration: 300 })
    );
  });

  it('removes and destroys overlay on tween complete', () => {
    const parent = makeMockParent();
    ScreenEffects.init(parent);
    ScreenEffects.flash();

    // Extract and call the onComplete callback
    const tweenConfig = mockTweenTo.mock.calls[0][2];
    tweenConfig.onComplete();

    expect(parent.removeChild).toHaveBeenCalledWith(mockOverlay);
    expect(mockOverlay.destroy).toHaveBeenCalled();
  });
});

describe('ScreenEffects.damageVignette()', () => {
  it('delegates to flash() with red color', () => {
    const parent = makeMockParent();
    ScreenEffects.init(parent);
    ScreenEffects.damageVignette();
    // Should call Tween.to (via flash)
    expect(mockTweenTo).toHaveBeenCalled();
    // Overlay fill should have been called
    expect(mockOverlay.fill).toHaveBeenCalled();
  });
});

describe('ScreenEffects.powerFlash()', () => {
  it('delegates to flash() with white color', () => {
    const parent = makeMockParent();
    ScreenEffects.init(parent);
    ScreenEffects.powerFlash(200);
    expect(mockTweenTo).toHaveBeenCalledWith(
      mockOverlay,
      { alpha: 0 },
      expect.objectContaining({ duration: 200 })
    );
  });
});
