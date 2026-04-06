import { WaveManager, WaveData } from '../../../src/waves/WaveManager.js';

// ============================================================
// Helpers
// ============================================================

function makeWave(count: number, type = 'enemy', interval = 100, delay = 0): WaveData {
  return { enemies: [{ type, count, spawnInterval: interval, delay }] };
}

// ============================================================
// Tests
// ============================================================

describe('WaveManager', () => {
  let spawns: Array<{ type: string; waveIdx: number }>;
  let waveStartEvents: number[];
  let waveEndEvents: number[];

  beforeEach(() => {
    jest.useFakeTimers();
    spawns = [];
    waveStartEvents = [];
    waveEndEvents = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---- 1. Start emits wave-start ----
  test('start() emits wave-start for wave 0', () => {
    const wm = new WaveManager({
      waves: [makeWave(1)],
      onSpawn: () => {},
      onWaveStart: (idx) => waveStartEvents.push(idx),
    });

    wm.start();
    expect(waveStartEvents).toContain(0);
  });

  // ---- 2. Spawns correct number ----
  test('spawns correct number of enemies', () => {
    const wm = new WaveManager({
      waves: [makeWave(3, 'zombie', 0)],
      onSpawn: (type, waveIdx) => spawns.push({ type, waveIdx }),
    });

    wm.start();
    // Advance enough time for all 3 spawns (0ms interval means all at t=0)
    wm.update(1);

    expect(spawns.length).toBe(3);
    expect(spawns.every(s => s.type === 'zombie')).toBe(true);
  });

  // ---- 3. Spawn intervals respected ----
  test('spawn intervals are respected', () => {
    const wm = new WaveManager({
      waves: [makeWave(3, 'goblin', 100)],
      onSpawn: (type) => spawns.push({ type, waveIdx: 0 }),
    });

    wm.start();
    wm.update(50);
    expect(spawns.length).toBe(1); // only t=0 spawn fires

    wm.update(100);
    expect(spawns.length).toBe(2); // t=100 fires

    wm.update(100);
    expect(spawns.length).toBe(3); // t=200 fires
  });

  // ---- 4. Wave-end event ----
  test('emits wave-end after all spawns complete', () => {
    const wm = new WaveManager({
      waves: [makeWave(2, 'orc', 0)],
      onSpawn: () => {},
      onWaveEnd: (idx) => waveEndEvents.push(idx),
    });

    wm.start();
    wm.update(1);

    expect(waveEndEvents).toContain(0);
  });

  // ---- 5. Intermission between waves ----
  test('intermission delays next wave-start', () => {
    const wm = new WaveManager({
      waves: [
        { enemies: [{ type: 'a', count: 1, spawnInterval: 0 }], intermission: 1000 },
        makeWave(1, 'b', 0),
      ],
      onSpawn: () => {},
      onWaveStart: (idx) => waveStartEvents.push(idx),
    });

    wm.start();
    wm.update(1);    // completes wave 0
    expect(waveStartEvents).toEqual([0]);

    wm.update(500); // mid-intermission
    expect(waveStartEvents).toEqual([0]);

    wm.update(600); // past intermission (total: 1101ms)
    expect(waveStartEvents).toEqual([0, 1]);
  });

  // ---- 6. AutoAdvance starts next wave ----
  test('autoAdvance: true automatically starts next wave', () => {
    const wm = new WaveManager({
      waves: [
        { enemies: [{ type: 'a', count: 1, spawnInterval: 0 }], intermission: 200 },
        makeWave(1, 'b', 0),
      ],
      autoAdvance: true,
      onSpawn: () => {},
      onWaveStart: (idx) => waveStartEvents.push(idx),
    });

    wm.start();
    wm.update(1);
    wm.update(300);

    expect(waveStartEvents).toEqual([0, 1]);
  });

  // ---- 7. autoAdvance: false does NOT start next wave ----
  test('autoAdvance: false does not auto-start next wave', () => {
    const wm = new WaveManager({
      waves: [
        { enemies: [{ type: 'a', count: 1, spawnInterval: 0 }], intermission: 200 },
        makeWave(1, 'b', 0),
      ],
      autoAdvance: false,
      onSpawn: () => {},
      onWaveStart: (idx) => waveStartEvents.push(idx),
    });

    wm.start();
    wm.update(1);
    wm.update(300); // past intermission, but autoAdvance=false

    expect(waveStartEvents).toEqual([0]);
  });

  // ---- 8. all-complete fires after last wave ----
  test('emits all-complete after last wave ends', () => {
    let completeFired = false;
    const wm = new WaveManager({
      waves: [makeWave(1, 'x', 0)],
      onSpawn: () => {},
      onAllWavesComplete: () => { completeFired = true; },
    });

    wm.start();
    wm.update(1);

    expect(completeFired).toBe(true);
  });

  // ---- 9. Pause/resume stops spawning ----
  test('pause stops spawn accumulation, resume continues', () => {
    const wm = new WaveManager({
      waves: [makeWave(3, 'bat', 100)],
      onSpawn: (type) => spawns.push({ type, waveIdx: 0 }),
    });

    wm.start();
    wm.update(1);   // fires first spawn (t=0)
    expect(spawns.length).toBe(1);

    wm.pause();
    wm.update(500); // paused — no new spawns
    expect(spawns.length).toBe(1);

    wm.resume();
    wm.update(100); // resumes — fires t=100 spawn
    expect(spawns.length).toBe(2);
  });

  // ---- 10. skipToWave jumps correctly ----
  test('skipToWave jumps to specified wave index', () => {
    const wm = new WaveManager({
      waves: [makeWave(1, 'a', 0), makeWave(1, 'b', 0), makeWave(1, 'c', 0)],
      onSpawn: (type) => spawns.push({ type, waveIdx: 0 }),
      onWaveStart: (idx) => waveStartEvents.push(idx),
    });

    wm.skipToWave(2);
    expect(waveStartEvents).toContain(2);
    expect(wm.currentWave).toBe(2);

    wm.update(1);
    expect(spawns[0].type).toBe('c');
  });

  // ---- 11. EventEmitter events match callbacks ----
  test('emits spawn event matching onSpawn callback', () => {
    const emittedSpawns: string[] = [];
    const wm = new WaveManager({
      waves: [makeWave(2, 'ogre', 0)],
      onSpawn: () => {},
    });
    wm.on('spawn', (type) => emittedSpawns.push(type));

    wm.start();
    wm.update(1);

    expect(emittedSpawns.length).toBe(2);
    expect(emittedSpawns.every(t => t === 'ogre')).toBe(true);
  });

  // ---- 12. Spawn delay respected ----
  test('group delay offsets spawn start time', () => {
    const wm = new WaveManager({
      waves: [{ enemies: [{ type: 'delayed', count: 1, spawnInterval: 0, delay: 500 }] }],
      onSpawn: (type) => spawns.push({ type, waveIdx: 0 }),
    });

    wm.start();
    wm.update(499);
    expect(spawns.length).toBe(0);

    wm.update(2);
    expect(spawns.length).toBe(1);
  });
});
