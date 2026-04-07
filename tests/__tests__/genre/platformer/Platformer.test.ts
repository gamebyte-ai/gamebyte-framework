import { PlatformerController } from '../../../../src/genre/platformer/PlatformerController';
import { ObstaclePattern } from '../../../../src/genre/platformer/ObstaclePattern';
import type { PatternDef } from '../../../../src/genre/platformer/ObstaclePattern';

const NO_INPUT = { left: false, right: false, jump: false };
const RIGHT_INPUT = { left: false, right: true, jump: false };
const LEFT_INPUT = { left: true, right: false, jump: false };
const JUMP_INPUT = { left: false, right: false, jump: true };

// ─── PlatformerController ──────────────────────────────────────────────────

describe('PlatformerController', () => {
  test('horizontal movement right updates x and facing', () => {
    const ctrl = new PlatformerController({ moveSpeed: 200 });
    ctrl.setGrounded(true, 0);
    const state = ctrl.update(1, RIGHT_INPUT, 0);
    expect(state.x).toBeCloseTo(200);
    expect(state.facing).toBe('right');
  });

  test('horizontal movement left updates x and facing', () => {
    const ctrl = new PlatformerController({ moveSpeed: 200 });
    ctrl.setGrounded(true, 0);
    const state = ctrl.update(1, LEFT_INPUT, 0);
    expect(state.x).toBeCloseTo(-200);
    expect(state.facing).toBe('left');
  });

  test('gravity accumulates when airborne', () => {
    const ctrl = new PlatformerController({ gravity: 800 });
    // Not grounded, no jump — gravity should pull down
    const state = ctrl.update(0.5, NO_INPUT);
    expect(state.vy).toBeCloseTo(400); // 800 * 0.5
  });

  test('jump sets negative vy when grounded', () => {
    const ctrl = new PlatformerController({ jumpForce: -400 });
    ctrl.setGrounded(true, 0);
    const state = ctrl.update(0, JUMP_INPUT, 0);
    expect(state.vy).toBeCloseTo(-400);
  });

  test('double jump works when enabled', () => {
    const ctrl = new PlatformerController({ jumpForce: -400, doubleJump: true });
    ctrl.setGrounded(true, 0);
    // First jump
    ctrl.update(0, JUMP_INPUT, 0);
    // Release jump
    ctrl.update(0.1, NO_INPUT);
    // Second jump while airborne
    const state = ctrl.update(0, JUMP_INPUT);
    expect(state.vy).toBeCloseTo(-400);
  });

  test('double jump not allowed without config', () => {
    const ctrl = new PlatformerController({ jumpForce: -400, doubleJump: false });
    ctrl.setGrounded(true, 0);
    ctrl.update(0, JUMP_INPUT, 0);
    ctrl.update(0.1, NO_INPUT);
    // Second jump attempt — vy should NOT reset to jumpForce
    const state = ctrl.update(0, JUMP_INPUT);
    // vy should be positive (falling) after gravity, not -400
    expect(state.vy).toBeGreaterThan(-400);
  });

  test('landing emits land event', () => {
    const ctrl = new PlatformerController({ gravity: 800, jumpForce: -400 });
    ctrl.setGrounded(true, 300);
    ctrl.update(0, JUMP_INPUT, 300); // jump
    ctrl.update(0.1, NO_INPUT); // in air

    let landed = false;
    ctrl.on('land', () => { landed = true; });
    // Simulate enough time to fall back to groundY=300
    ctrl.update(2, NO_INPUT, 300);
    expect(landed).toBe(true);
  });

  test('coyote time allows jump just after leaving edge', () => {
    const ctrl = new PlatformerController({
      jumpForce: -400,
      coyoteTime: 100,
      gravity: 0, // disable gravity for simplicity
    });
    // Start grounded
    ctrl.setGrounded(true, 0);
    ctrl.update(0, NO_INPUT, 0);
    // Now airborne
    ctrl.setGrounded(false);
    // Within coyote window (50ms = 0.05s), jump should work
    const state = ctrl.update(0.05, JUMP_INPUT);
    expect(state.vy).toBeCloseTo(-400);
  });

  test('setPosition updates x and y directly', () => {
    const ctrl = new PlatformerController();
    ctrl.setPosition(100, 200);
    expect(ctrl.state.x).toBe(100);
    expect(ctrl.state.y).toBe(200);
  });

  test('reset clears velocity', () => {
    const ctrl = new PlatformerController({ gravity: 800 });
    ctrl.update(1, NO_INPUT);
    ctrl.reset();
    expect(ctrl.state.vx).toBe(0);
    expect(ctrl.state.vy).toBe(0);
  });

  test('maxFallSpeed caps vy', () => {
    const ctrl = new PlatformerController({ gravity: 800, maxFallSpeed: 100 });
    ctrl.update(10, NO_INPUT); // 10 seconds of gravity
    expect(ctrl.state.vy).toBeLessThanOrEqual(100);
  });
});

// ─── ObstaclePattern ──────────────────────────────────────────────────────

const PATTERNS: PatternDef[] = [
  {
    id: 'gap',
    width: 200,
    difficulty: 0.3,
    obstacles: [{ type: 'gap', x: 50, y: 0 }],
  },
  {
    id: 'spikes',
    width: 150,
    difficulty: 0.6,
    obstacles: [
      { type: 'spike', x: 10, y: 0 },
      { type: 'spike', x: 50, y: 0 },
    ],
  },
  {
    id: 'easy_platform',
    width: 100,
    difficulty: 0.1,
    obstacles: [{ type: 'platform', x: 20, y: -50, width: 80 }],
  },
];

describe('ObstaclePattern', () => {
  test('getNext returns a valid pattern', () => {
    const op = new ObstaclePattern(PATTERNS);
    const p = op.getNext();
    expect(p).toBeDefined();
    expect(p.id).toBeDefined();
  });

  test('getNext filters by maxDifficulty', () => {
    const op = new ObstaclePattern(PATTERNS);
    // Only easy_platform (0.1) and gap (0.3) qualify
    for (let i = 0; i < 20; i++) {
      const p = op.getNext(0.3);
      expect(p.difficulty ?? 0).toBeLessThanOrEqual(0.3);
    }
  });

  test('getPattern returns specific pattern by id', () => {
    const op = new ObstaclePattern(PATTERNS);
    const p = op.getPattern('spikes');
    expect(p?.id).toBe('spikes');
    expect(p?.obstacles).toHaveLength(2);
  });

  test('getAll returns all patterns', () => {
    const op = new ObstaclePattern(PATTERNS);
    expect(op.getAll()).toHaveLength(3);
  });

  test('generate returns correct count of obstacles', () => {
    const op = new ObstaclePattern(PATTERNS);
    // Using single-obstacle pattern for predictability
    const single = new ObstaclePattern([PATTERNS[0]]); // gap: 1 obstacle
    const obstacles = single.generate(3, 0);
    expect(obstacles).toHaveLength(3);
  });

  test('generate offsets obstacles by startX', () => {
    const single = new ObstaclePattern([PATTERNS[0]]); // gap x=50, pattern width=200
    const obstacles = single.generate(2, 100);
    // Pattern 1: startX=100, obs.x=50 → 150
    expect(obstacles[0].x).toBe(150);
    // Pattern 2: startX=300, obs.x=50 → 350
    expect(obstacles[1].x).toBe(350);
  });

  test('generate attaches patternId to each obstacle', () => {
    const op = new ObstaclePattern([PATTERNS[0]]);
    const obstacles = op.generate(2, 0);
    expect(obstacles[0].patternId).toBe('gap');
  });
});
