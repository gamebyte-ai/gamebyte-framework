/**
 * @jest-environment jsdom
 */

/**
 * Juice unit tests.
 *
 * All heavy dependencies are mocked so tests run without Pixi.js or a real DOM
 * renderer. We verify that each Juice method delegates to the correct underlying
 * subsystem with the right arguments.
 */

// ---------------------------------------------------------------------------
// Mock: Tween
// ---------------------------------------------------------------------------

const mockTweenTo = jest.fn().mockReturnValue({ stop: jest.fn() });

jest.mock('../../../src/tween/Tween', () => ({
  Tween: {
    to: mockTweenTo,
  },
}));

// ---------------------------------------------------------------------------
// Mock: Ease
// ---------------------------------------------------------------------------

jest.mock('../../../src/tween/Ease', () => ({
  Ease: {
    linear: (t: number) => t,
    quadOut: (t: number) => t,
    bounceOut: (t: number) => t,
    sineInOut: (t: number) => t,
  },
}));

// ---------------------------------------------------------------------------
// Mock: ParticleEmitter
// ---------------------------------------------------------------------------

const mockEmitterContainer = {
  x: 0, y: 0,
  addChild: jest.fn(),
  removeChild: jest.fn(),
};

function buildMockEmitter() {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    getContainer: jest.fn(() => mockEmitterContainer),
    stop: jest.fn(),
    destroy: jest.fn(),
    burst: jest.fn(),
    once: jest.fn((event: string, cb: () => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
    }),
    _triggerComplete: () => {
      (listeners['complete'] ?? []).forEach((cb) => cb());
    },
  };
}

let mockExplosionEmitter: ReturnType<typeof buildMockEmitter>;
let mockSparkleEmitter: ReturnType<typeof buildMockEmitter>;
let mockConfettiEmitter: ReturnType<typeof buildMockEmitter>;

jest.mock('../../../src/particles/ParticleEmitter', () => ({
  ParticleEmitter: {
    explosion: jest.fn(() => mockExplosionEmitter),
    sparkle: jest.fn(() => mockSparkleEmitter),
    confetti: jest.fn(() => mockConfettiEmitter),
  },
}));

// ---------------------------------------------------------------------------
// Mock: screenShake
// ---------------------------------------------------------------------------

const mockScreenShake = jest.fn();

jest.mock('../../../src/utils/screenShake', () => ({
  screenShake: mockScreenShake,
}));

// ---------------------------------------------------------------------------
// Mock: FloatingText2D
// ---------------------------------------------------------------------------

const mockFloatingSpawn = jest.fn().mockReturnValue({ destroy: jest.fn() });
const mockFloatingDamage = jest.fn().mockReturnValue({ destroy: jest.fn() });
const mockFloatingScore = jest.fn().mockReturnValue({ destroy: jest.fn() });

jest.mock('../../../src/ui/effects/FloatingText2D', () => ({
  FloatingText2D: {
    spawn: mockFloatingSpawn,
    damage: mockFloatingDamage,
    score: mockFloatingScore,
    coin: jest.fn().mockReturnValue({ destroy: jest.fn() }),
  },
}));

// ---------------------------------------------------------------------------
// Import Juice AFTER all mocks are declared
// ---------------------------------------------------------------------------

import { Juice } from '../../../src/juice/Juice';
import { ParticleEmitter } from '../../../src/particles/ParticleEmitter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockContainer() {
  const children: any[] = [];
  return {
    x: 0,
    y: 0,
    alpha: 1,
    scale: { x: 1, y: 1 },
    children,
    parent: null as any,
    addChild: jest.fn((child: any) => {
      children.push(child);
      return child;
    }),
    removeChild: jest.fn((child: any) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      return child;
    }),
  };
}

function makeMockTarget(extras: Record<string, any> = {}) {
  return {
    x: 100,
    y: 200,
    alpha: 1,
    scale: { x: 1, y: 1 },
    parent: makeMockContainer(),
    ...extras,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset emitter mocks before each test so they start fresh
  mockExplosionEmitter = buildMockEmitter();
  mockSparkleEmitter = buildMockEmitter();
  mockConfettiEmitter = buildMockEmitter();

  jest.clearAllMocks();

  // Restore default config between tests
  Juice.configure({ intensity: 1, shakeEnabled: true, particlesEnabled: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Juice.configure()', () => {
  it('merges partial config without overwriting unspecified keys', () => {
    Juice.configure({ intensity: 2 });
    // shakeEnabled should still be true from beforeEach reset
    const parent = makeMockContainer();
    const target = makeMockTarget({ parent });
    Juice.impact(target);
    // screenShake should be called with intensity scaled by 2 (8 * 2 = 16)
    expect(mockScreenShake).toHaveBeenCalledWith(
      expect.anything(),
      16,
      expect.any(Number)
    );
  });

  it('configure({ shakeEnabled: false }) suppresses shake globally', () => {
    Juice.configure({ shakeEnabled: false });
    const parent = makeMockContainer();
    const target = makeMockTarget({ parent });
    Juice.impact(target);
    expect(mockScreenShake).not.toHaveBeenCalled();
  });

  it('configure({ particlesEnabled: false }) suppresses particles globally', () => {
    Juice.configure({ particlesEnabled: false });
    const parent = makeMockContainer();
    Juice.collect(parent, 0, 0);
    expect(ParticleEmitter.sparkle).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('Juice.pop()', () => {
  it('calls Tween.to on the target scale with a scaled-up value', () => {
    const target = makeMockTarget();
    Juice.pop(target);
    expect(mockTweenTo).toHaveBeenCalledWith(
      target.scale,
      { x: expect.any(Number), y: expect.any(Number) },
      expect.objectContaining({ duration: 100 })
    );
    // Default scale multiplier is 1.2
    const callArgs = mockTweenTo.mock.calls[0];
    expect(callArgs[1].x).toBeCloseTo(1.2);
    expect(callArgs[1].y).toBeCloseTo(1.2);
  });

  it('accepts a custom scale multiplier', () => {
    const target = makeMockTarget({ scale: { x: 1, y: 1 } });
    Juice.pop(target, 1.5);
    const callArgs = mockTweenTo.mock.calls[0];
    expect(callArgs[1].x).toBeCloseTo(1.5);
    expect(callArgs[1].y).toBeCloseTo(1.5);
  });

  it('returns undefined when target has no scale property', () => {
    const noScale = { x: 0, y: 0, alpha: 1 };
    const result = Juice.pop(noScale as any);
    expect(result).toBeUndefined();
    expect(mockTweenTo).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('Juice.impact()', () => {
  it('calls screenShake on the target parent', () => {
    const parent = makeMockContainer();
    const target = makeMockTarget({ parent });
    Juice.impact(target);
    expect(mockScreenShake).toHaveBeenCalledWith(parent, expect.any(Number), expect.any(Number));
  });

  it('uses target as shake stage when parent is absent', () => {
    const target = makeMockTarget({ parent: null });
    Juice.impact(target);
    expect(mockScreenShake).toHaveBeenCalledWith(target, expect.any(Number), expect.any(Number));
  });

  it('applies custom shakeIntensity scaled by global intensity', () => {
    const target = makeMockTarget();
    Juice.impact(target, { shakeIntensity: 20 });
    expect(mockScreenShake).toHaveBeenCalledWith(
      expect.anything(),
      20, // intensity 1 * 20
      expect.any(Number)
    );
  });

  it('skips shake when shakeIntensity is 0', () => {
    const target = makeMockTarget();
    Juice.impact(target, { shakeIntensity: 0 });
    expect(mockScreenShake).not.toHaveBeenCalled();
  });

  it('adds explosion emitter to particleParent when particles enabled', () => {
    const parent = makeMockContainer();
    const target = makeMockTarget({ parent });
    Juice.impact(target, { particleParent: parent });
    expect(ParticleEmitter.explosion).toHaveBeenCalledWith(target.x, target.y);
    expect(parent.addChild).toHaveBeenCalledWith(mockEmitterContainer);
  });

  it('skips particles when particles option is false', () => {
    const parent = makeMockContainer();
    const target = makeMockTarget({ parent });
    Juice.impact(target, { particles: false, particleParent: parent });
    expect(ParticleEmitter.explosion).not.toHaveBeenCalled();
  });

  it('skips particles when particlesEnabled is configured off', () => {
    Juice.configure({ particlesEnabled: false });
    const parent = makeMockContainer();
    const target = makeMockTarget({ parent });
    Juice.impact(target, { particleParent: parent });
    expect(ParticleEmitter.explosion).not.toHaveBeenCalled();
  });

  it('delegates scale animation to SquashStretch (no competing scale-pop tween)', () => {
    const target = makeMockTarget();
    Juice.impact(target);
    // SquashStretch.squash() calls Tween.to with squash deformation (x wider, y shorter).
    // Verify Tween.to was called on target.scale with asymmetric x/y values — not a uniform 1.3 pop.
    const scaleCalls = mockTweenTo.mock.calls.filter(
      (call) => call[0] === target.scale
    );
    expect(scaleCalls.length).toBeGreaterThan(0);
    // The squash tween should have x > 1 and y < 1 (wide and short), not the old 1.3 uniform pop
    const squashCall = scaleCalls[0];
    expect(squashCall[1].x).toBeGreaterThan(1);   // wider
    expect(squashCall[1].y).toBeLessThan(1);       // shorter
  });
});

// ---------------------------------------------------------------------------

describe('Juice.collect()', () => {
  it('creates a FloatingText2D with default coin style', () => {
    const parent = makeMockContainer();
    Juice.collect(parent, 50, 100);
    expect(mockFloatingSpawn).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '+1',
        x: 50,
        y: 100,
        parent,
        style: 'coin',
      })
    );
  });

  it('uses the provided text option directly', () => {
    const parent = makeMockContainer();
    Juice.collect(parent, 0, 0, { text: 'BONUS!' });
    expect(mockFloatingSpawn).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'BONUS!' })
    );
  });

  it('builds text from amount option when text is not given', () => {
    const parent = makeMockContainer();
    Juice.collect(parent, 0, 0, { amount: 50 });
    expect(mockFloatingSpawn).toHaveBeenCalledWith(
      expect.objectContaining({ text: '+50' })
    );
  });

  it('uses the provided style option', () => {
    const parent = makeMockContainer();
    Juice.collect(parent, 0, 0, { style: 'heal' });
    expect(mockFloatingSpawn).toHaveBeenCalledWith(
      expect.objectContaining({ style: 'heal' })
    );
  });

  it('creates sparkle emitter when particlesEnabled is true', () => {
    const parent = makeMockContainer();
    Juice.collect(parent, 10, 20);
    expect(ParticleEmitter.sparkle).toHaveBeenCalledWith(10, 20);
    expect(parent.addChild).toHaveBeenCalledWith(mockEmitterContainer);
  });

  it('skips sparkle emitter when particlesEnabled is false', () => {
    Juice.configure({ particlesEnabled: false });
    const parent = makeMockContainer();
    Juice.collect(parent, 10, 20);
    expect(ParticleEmitter.sparkle).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('Juice.damage()', () => {
  it('calls FloatingText2D.damage with the correct arguments', () => {
    const parent = makeMockContainer();
    const target = makeMockTarget();
    Juice.damage(target, parent, 42);
    expect(mockFloatingDamage).toHaveBeenCalledWith(
      parent,
      target.x,
      target.y - 20,
      42
    );
  });

  it('creates alpha flash tween on target', () => {
    const parent = makeMockContainer();
    const target = makeMockTarget();
    Juice.damage(target, parent, 10);
    // First tween: flash to low alpha
    expect(mockTweenTo).toHaveBeenCalledWith(
      target,
      { alpha: 0.3 },
      expect.objectContaining({ duration: 60 })
    );
  });

  it('calls screenShake on parent by default', () => {
    const parent = makeMockContainer();
    const target = makeMockTarget();
    Juice.damage(target, parent, 10);
    expect(mockScreenShake).toHaveBeenCalledWith(parent, expect.any(Number), expect.any(Number));
  });

  it('suppresses shake when shake option is false', () => {
    const parent = makeMockContainer();
    const target = makeMockTarget();
    Juice.damage(target, parent, 10, { shake: false });
    expect(mockScreenShake).not.toHaveBeenCalled();
  });

  it('suppresses shake when shakeEnabled is globally disabled', () => {
    Juice.configure({ shakeEnabled: false });
    const parent = makeMockContainer();
    const target = makeMockTarget();
    Juice.damage(target, parent, 10);
    expect(mockScreenShake).not.toHaveBeenCalled();
  });

  it('skips alpha tween when target has no alpha property', () => {
    const parent = makeMockContainer();
    const noAlpha = { x: 0, y: 0, scale: { x: 1, y: 1 }, parent: null };
    Juice.damage(noAlpha as any, parent, 5);
    // Tween.to should not be called for alpha
    const alphaCalls = mockTweenTo.mock.calls.filter(
      (call) => call[1] && 'alpha' in call[1]
    );
    expect(alphaCalls.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------

describe('Juice.combo()', () => {
  it('spawns floating text containing the combo count', () => {
    const parent = makeMockContainer();
    Juice.combo(parent, 100, 200, 5);
    expect(mockFloatingSpawn).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '5x COMBO!',
        x: 100,
        y: 200,
        parent,
      })
    );
  });

  it('increases fontSize proportionally with combo count', () => {
    const parent = makeMockContainer();
    Juice.combo(parent, 0, 0, 3);
    const call = mockFloatingSpawn.mock.calls[0][0];
    expect(call.style.fontSize).toBe(24 + 3 * 2); // 30
  });

  it('calls screenShake when shakeEnabled is true', () => {
    const parent = makeMockContainer();
    Juice.combo(parent, 0, 0, 4);
    expect(mockScreenShake).toHaveBeenCalledWith(
      parent,
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('skips shake when shakeEnabled is false', () => {
    Juice.configure({ shakeEnabled: false });
    const parent = makeMockContainer();
    Juice.combo(parent, 0, 0, 3);
    expect(mockScreenShake).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('Juice.celebrate()', () => {
  it('spawns text when text option is provided', () => {
    const parent = makeMockContainer();
    Juice.celebrate(parent, 200, 300, { text: 'VICTORY!' });
    expect(mockFloatingSpawn).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'VICTORY!', x: 200, y: 300, parent })
    );
  });

  it('spawns score text when score option is provided', () => {
    const parent = makeMockContainer();
    Juice.celebrate(parent, 0, 0, { score: 1000 });
    expect(mockFloatingScore).toHaveBeenCalledWith(parent, 0, 30, 1000);
  });

  it('creates confetti emitter when particlesEnabled is true', () => {
    const parent = makeMockContainer();
    Juice.celebrate(parent, 100, 100);
    expect(ParticleEmitter.confetti).toHaveBeenCalledWith(100, 100);
    expect(parent.addChild).toHaveBeenCalledWith(mockEmitterContainer);
  });

  it('skips confetti when particlesEnabled is false', () => {
    Juice.configure({ particlesEnabled: false });
    const parent = makeMockContainer();
    Juice.celebrate(parent, 0, 0);
    expect(ParticleEmitter.confetti).not.toHaveBeenCalled();
  });

  it('removes confetti emitter from parent after complete event fires', () => {
    const parent = makeMockContainer();
    Juice.celebrate(parent, 0, 0);
    // Simulate the emitter finishing its burst
    mockConfettiEmitter._triggerComplete();
    expect(parent.removeChild).toHaveBeenCalledWith(mockEmitterContainer);
    expect(mockConfettiEmitter.destroy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('Juice.pulse()', () => {
  it('returns a Tween (the mock return value)', () => {
    const target = makeMockTarget();
    const result = Juice.pulse(target);
    // mockTweenTo returns { stop: jest.fn() } by default — truthy
    expect(result).toBeTruthy();
  });

  it('calls Tween.to with repeat: -1 and yoyo: true for infinite loop', () => {
    const target = makeMockTarget();
    Juice.pulse(target);
    expect(mockTweenTo).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Object),
      expect.objectContaining({ repeat: -1, yoyo: true })
    );
  });

  it('applies custom min/max/duration options', () => {
    const target = makeMockTarget();
    Juice.pulse(target, { min: 0.8, max: 1.2, duration: 600 });
    expect(mockTweenTo).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ x: 1.2, y: 1.2 }),
      expect.objectContaining({ duration: 600 })
    );
  });

  it('seeds scale to min before starting tween', () => {
    const target = makeMockTarget({ scale: { x: 1, y: 1 } });
    Juice.pulse(target, { min: 0.9, max: 1.1 });
    expect(target.scale.x).toBeCloseTo(0.9);
    expect(target.scale.y).toBeCloseTo(0.9);
  });
});
