/**
 * @jest-environment jsdom
 */

import { ParticleEmitter } from '../../../src/particles/ParticleEmitter';

// ---------------------------------------------------------------------------
// Mock graphics() and GraphicsEngine
// ---------------------------------------------------------------------------

function makeMockGraphics() {
  return {
    x: 0,
    y: 0,
    alpha: 1,
    rotation: 0,
    scale: { x: 1, y: 1 },
    visible: false,
    interactive: false,
    blendMode: 'normal',
    clear: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    roundRect: jest.fn().mockReturnThis(),
    circle: jest.fn().mockReturnThis(),
    ellipse: jest.fn().mockReturnThis(),
    poly: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    arc: jest.fn().mockReturnThis(),
    closePath: jest.fn().mockReturnThis(),
    texture: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  };
}

function makeMockContainer() {
  const children: any[] = [];
  return {
    x: 0,
    y: 0,
    alpha: 1,
    rotation: 0,
    scale: { x: 1, y: 1 },
    visible: true,
    interactive: false,
    children,
    addChild: jest.fn((child: any) => { children.push(child); return child; }),
    removeChild: jest.fn((child: any) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      return child;
    }),
    removeChildren: jest.fn(),
    getChildAt: jest.fn(),
    getChildIndex: jest.fn(),
    setChildIndex: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  };
}

// Mock the GraphicsEngine module before any import that depends on it
jest.mock('../../../src/graphics/GraphicsEngine', () => {
  return {
    graphics: jest.fn(),
    GraphicsEngine: {
      getFactory: jest.fn(),
      isInitialized: jest.fn().mockReturnValue(true),
    },
  };
});

import { graphics } from '../../../src/graphics/GraphicsEngine';
const mockGraphics = graphics as jest.MockedFunction<typeof graphics>;

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function buildFactory() {
  return {
    createContainer: jest.fn(() => makeMockContainer()),
    createGraphics: jest.fn(() => makeMockGraphics()),
    createText: jest.fn(),
    createSprite: jest.fn(),
    createTexture: jest.fn(),
    createCanvasTexture: jest.fn(),
    createLinearGradient: jest.fn(),
    createRadialGradient: jest.fn(),
    createBlurFilter: jest.fn(),
    createColorMatrixFilter: jest.fn(),
    createDropShadowFilter: jest.fn(),
    createGlowFilter: jest.fn(),
    createOutlineFilter: jest.fn(),
    createMaskFromGraphics: jest.fn(),
    createMaskFromSprite: jest.fn(),
  };
}

let mockFactory: ReturnType<typeof buildFactory>;

beforeEach(() => {
  mockFactory = buildFactory();
  mockGraphics.mockReturnValue(mockFactory as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ParticleEmitter', () => {
  // 1. Constructor with defaults pre-allocates the pool
  it('constructor pre-allocates maxParticles graphics objects', () => {
    const emitter = new ParticleEmitter({ maxParticles: 20 });

    // One createContainer call + 20 createGraphics calls
    expect(mockFactory.createContainer).toHaveBeenCalledTimes(1);
    expect(mockFactory.createGraphics).toHaveBeenCalledTimes(20);
    expect(emitter.activeCount).toBe(0);
    expect(emitter.isEmitting).toBe(false);
  });

  // 2. burst() activates N particles
  it('burst() activates the requested number of particles', () => {
    const emitter = new ParticleEmitter({ maxParticles: 50 });
    emitter.burst(100, 200, 10);

    expect(emitter.activeCount).toBe(10);
  });

  // 3. start() sets isEmitting
  it('start() sets isEmitting to true', () => {
    const emitter = new ParticleEmitter();
    expect(emitter.isEmitting).toBe(false);
    emitter.start(0, 0);
    expect(emitter.isEmitting).toBe(true);
  });

  // 4. stop() clears isEmitting
  it('stop() sets isEmitting to false while particles remain alive', () => {
    const emitter = new ParticleEmitter({ rate: 100 });
    emitter.start(0, 0);
    emitter.update(0.5); // spawn some particles
    emitter.stop();
    expect(emitter.isEmitting).toBe(false);
    // Previously spawned particles should still be active
    expect(emitter.activeCount).toBeGreaterThan(0);
  });

  // 5. update() moves particles by velocity
  it('update() advances particle positions by velocity', () => {
    const emitter = new ParticleEmitter({
      maxParticles: 10,
      speed: { min: 100, max: 100 },
      angle: { min: 0, max: 0 }, // all go right (vx=100, vy=0)
      lifetime: { min: 5, max: 5 },
      gravity: 0,
    });
    emitter.burst(0, 0, 1);

    // Record initial graphics x before update
    const container = emitter.getContainer() as any;
    const gfx = container.children.find((c: any) => c.visible);
    expect(gfx).toBeDefined();

    emitter.update(0.1); // 100 px/s * 0.1s = 10 px

    expect(gfx.x).toBeCloseTo(10, 1);
  });

  // 6. update() applies gravity
  it('update() applies gravity to vertical velocity', () => {
    const emitter = new ParticleEmitter({
      maxParticles: 10,
      speed: { min: 0, max: 0 },
      angle: { min: 0, max: 0 },
      gravity: 200,
      lifetime: { min: 5, max: 5 },
    });
    emitter.burst(0, 0, 1);

    const container = emitter.getContainer() as any;
    const gfx = container.children.find((c: any) => c.visible);

    emitter.update(0.1); // vy = 200 * 0.1 = 20, y = 20 * 0.1 = 2 ... integrated: y = 0.5 * 200 * 0.01 = 1
    expect(gfx.y).toBeGreaterThan(0);
  });

  // 7. Particles die after lifetime
  it('particles expire after their lifetime and activeCount decreases', () => {
    const emitter = new ParticleEmitter({
      maxParticles: 10,
      lifetime: { min: 0.5, max: 0.5 },
      speed: { min: 0, max: 0 },
    });
    emitter.burst(0, 0, 5);
    expect(emitter.activeCount).toBe(5);

    emitter.update(0.6); // past lifetime
    expect(emitter.activeCount).toBe(0);
  });

  // 8. Alpha interpolation over lifetime
  it('update() interpolates alpha from start to end over particle lifetime', () => {
    const emitter = new ParticleEmitter({
      maxParticles: 10,
      lifetime: { min: 1, max: 1 },
      speed: { min: 0, max: 0 },
      alpha: { start: 1, end: 0 },
      gravity: 0,
    });
    emitter.burst(0, 0, 1);

    const container = emitter.getContainer() as any;
    const gfx = container.children.find((c: any) => c.visible);

    // At half lifetime (progress ≈ 0.5), alpha ≈ 0.5
    emitter.update(0.5);
    expect(gfx.alpha).toBeCloseTo(0.5, 1);
  });

  // 9. Scale interpolation over lifetime
  it('update() interpolates scale from start to end over particle lifetime', () => {
    const emitter = new ParticleEmitter({
      maxParticles: 10,
      lifetime: { min: 1, max: 1 },
      speed: { min: 0, max: 0 },
      scale: { start: 2, end: 0 },
      gravity: 0,
    });
    emitter.burst(0, 0, 1);

    const container = emitter.getContainer() as any;
    const gfx = container.children.find((c: any) => c.visible);

    // At half lifetime, scale ≈ 1.0
    emitter.update(0.5);
    expect(gfx.scale.x).toBeCloseTo(1, 1);
    expect(gfx.scale.y).toBeCloseTo(1, 1);
  });

  // 10. activeCount tracks correctly
  it('activeCount reflects the true number of live particles', () => {
    const emitter = new ParticleEmitter({ maxParticles: 20, lifetime: { min: 1, max: 1 }, speed: { min: 0, max: 0 } });
    emitter.burst(0, 0, 15);
    expect(emitter.activeCount).toBe(15);

    emitter.update(0.5);
    expect(emitter.activeCount).toBe(15); // still alive

    emitter.update(0.6); // total dt=1.1 > lifetime=1.0 → all dead
    expect(emitter.activeCount).toBe(0);
  });

  // 11. clear() kills all particles immediately
  it('clear() deactivates all particles and stops emission', () => {
    const emitter = new ParticleEmitter({ rate: 100 });
    emitter.start(0, 0);
    emitter.update(1); // spawn many particles
    expect(emitter.activeCount).toBeGreaterThan(0);

    emitter.clear();
    expect(emitter.activeCount).toBe(0);
    expect(emitter.isEmitting).toBe(false);
  });

  // 12. destroy() cleans up graphics and stops update
  it('destroy() calls destroy on all pooled graphics objects', () => {
    const emitter = new ParticleEmitter({ maxParticles: 10 });
    emitter.burst(0, 0, 5);

    const container = emitter.getContainer() as any;
    const gfxObjects = [...container.children];

    emitter.destroy();

    for (const gfx of gfxObjects) {
      expect(gfx.destroy).toHaveBeenCalled();
    }
    expect(container.destroy).toHaveBeenCalled();
    // Subsequent update should be a no-op (no throw)
    expect(() => emitter.update(1)).not.toThrow();
  });

  // 13. 'complete' event fires after burst particles expire
  it("emits 'complete' after all burst particles expire", () => {
    const emitter = new ParticleEmitter({
      maxParticles: 10,
      lifetime: { min: 0.5, max: 0.5 },
      speed: { min: 0, max: 0 },
    });
    const completeFn = jest.fn();
    emitter.on('complete', completeFn);

    emitter.burst(0, 0, 3);
    emitter.update(0.3); // not dead yet
    expect(completeFn).not.toHaveBeenCalled();

    emitter.update(0.3); // total 0.6 > 0.5 lifetime
    expect(completeFn).toHaveBeenCalledTimes(1);
  });

  // 14. Preset factory — explosion() returns an emitter with active particles
  it('ParticleEmitter.explosion() returns an emitter with active burst particles', () => {
    const emitter = ParticleEmitter.explosion(100, 200);
    expect(emitter).toBeInstanceOf(ParticleEmitter);
    expect(emitter.activeCount).toBeGreaterThan(0);
    expect(emitter.isEmitting).toBe(false); // burst, not continuous
  });

  // 15. Preset factory — sparkle() returns a continuously emitting emitter
  it('ParticleEmitter.sparkle() returns a continuously emitting emitter', () => {
    const emitter = ParticleEmitter.sparkle(50, 50);
    expect(emitter).toBeInstanceOf(ParticleEmitter);
    expect(emitter.isEmitting).toBe(true);
  });

  // 16. Preset factory — smoke() returns a continuously emitting emitter
  it('ParticleEmitter.smoke() returns a continuously emitting emitter', () => {
    const emitter = ParticleEmitter.smoke(50, 50);
    expect(emitter).toBeInstanceOf(ParticleEmitter);
    expect(emitter.isEmitting).toBe(true);
  });

  // 17. Preset factory — confetti() returns an emitter with active burst particles
  it('ParticleEmitter.confetti() returns an emitter with active burst particles', () => {
    const emitter = ParticleEmitter.confetti(150, 300);
    expect(emitter).toBeInstanceOf(ParticleEmitter);
    expect(emitter.activeCount).toBeGreaterThan(0);
  });

  // 18. configure() updates config without resizing pool
  it('configure() updates rate at runtime and recalculates spawn interval', () => {
    const emitter = new ParticleEmitter({ rate: 10 });
    emitter.configure({ rate: 50 });
    emitter.start(0, 0);
    emitter.update(0.1); // at 50/s over 0.1s → 5 particles
    // At 10/s we would only get 1 — so activeCount > 1 confirms the new rate
    expect(emitter.activeCount).toBeGreaterThan(1);
  });

  // 19. 'particle-spawn' event fires with correct count
  it("emits 'particle-spawn' with spawned count during continuous emission", () => {
    const emitter = new ParticleEmitter({ rate: 10, maxParticles: 20, lifetime: { min: 5, max: 5 }, speed: { min: 0, max: 0 } });
    const spawnFn = jest.fn();
    emitter.on('particle-spawn', spawnFn);

    emitter.start(0, 0);
    emitter.update(0.1); // 10/s * 0.1s = 1 particle
    expect(spawnFn).toHaveBeenCalled();
    const totalSpawned = spawnFn.mock.calls.reduce((sum: number, args: any[]) => sum + args[0], 0);
    expect(totalSpawned).toBeGreaterThanOrEqual(1);
  });
});
