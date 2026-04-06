import { EventEmitter } from 'eventemitter3';

// ============================================================
// Types
// ============================================================

export interface EnemySpawnDef {
  type: string;
  count: number;
  /** ms between each spawn within this group, default: 500 */
  spawnInterval?: number;
  /** ms delay before this group starts, default: 0 */
  delay?: number;
}

export interface WaveData {
  enemies: EnemySpawnDef[];
  /** ms between this wave and the next, default: 5000 */
  intermission?: number;
  isBoss?: boolean;
  metadata?: Record<string, any>;
}

export interface WaveConfig {
  waves: WaveData[];
  /** Auto-start next wave after intermission, default: true */
  autoAdvance?: boolean;
  onSpawn: (enemyType: string, waveIndex: number) => void;
  onWaveStart?: (waveIndex: number, waveData: WaveData) => void;
  onWaveEnd?: (waveIndex: number) => void;
  onAllWavesComplete?: () => void;
}

export interface WaveManagerEvents {
  'wave-start': (waveIndex: number, waveData: WaveData) => void;
  'wave-end': (waveIndex: number) => void;
  'spawn': (enemyType: string, waveIndex: number) => void;
  'all-complete': () => void;
  'intermission-start': (duration: number) => void;
}

// ============================================================
// Internal helpers
// ============================================================

/** A single resolved spawn event with absolute time offset within the wave (ms). */
interface SpawnEvent {
  time: number;
  type: string;
}

const DEFAULT_SPAWN_INTERVAL = 500;
const DEFAULT_INTERMISSION = 5000;

/** Build a sorted flat list of spawn events from a wave definition. */
function buildSchedule(wave: WaveData): SpawnEvent[] {
  const events: SpawnEvent[] = [];

  for (let g = 0; g < wave.enemies.length; g++) {
    const group = wave.enemies[g];
    const delay = group.delay ?? 0;
    const interval = group.spawnInterval ?? DEFAULT_SPAWN_INTERVAL;

    for (let i = 0; i < group.count; i++) {
      events.push({ time: delay + i * interval, type: group.type });
    }
  }

  events.sort((a, b) => a.time - b.time);
  return events;
}

// ============================================================
// WaveManager
// ============================================================

/**
 * Data/timing wave management system.
 *
 * WaveManager does NOT create visual objects. It emits events
 * that tell game code when and what to spawn.
 *
 * Must call `update(dt)` each frame where `dt` is delta time in ms.
 *
 * @example
 * ```typescript
 * const wm = new WaveManager({
 *   waves: [{ enemies: [{ type: 'zombie', count: 5 }] }],
 *   onSpawn: (type, waveIdx) => spawnEnemy(type),
 * });
 * wm.start();
 * // In game loop:
 * wm.update(deltaMs);
 * ```
 */
export class WaveManager extends EventEmitter<WaveManagerEvents> {
  private readonly config: WaveConfig;
  private readonly autoAdvance: boolean;

  // Wave progress
  private _currentWaveIndex = 0;
  private _isActive = false;
  private _isPaused = false;
  private _isIntermission = false;

  // Spawn schedule for active wave
  private schedule: SpawnEvent[] = [];
  private scheduleIndex = 0;
  private waveElapsed = 0; // ms elapsed in current wave

  // Intermission tracking
  private intermissionDuration = 0;
  private intermissionElapsed = 0;

  constructor(config: WaveConfig) {
    super();
    this.config = config;
    this.autoAdvance = config.autoAdvance ?? true;
  }

  // ============================================================
  // Public API
  // ============================================================

  /** Begin wave 0. */
  start(): void {
    if (this._isActive) return;
    this._currentWaveIndex = 0;
    this._isActive = true;
    this._isPaused = false;
    this._isIntermission = false;
    this.beginWave(0);
  }

  /** Pause all timers. */
  pause(): void {
    this._isPaused = true;
  }

  /** Resume all timers. */
  resume(): void {
    this._isPaused = false;
  }

  /** Jump to a specific wave index (0-based). */
  skipToWave(index: number): void {
    if (index < 0 || index >= this.config.waves.length) return;
    this._isIntermission = false;
    this._isActive = true;
    this._isPaused = false;
    this.beginWave(index);
  }

  /**
   * Must be called every frame.
   * @param dt - Delta time in milliseconds.
   */
  update(dt: number): void {
    if (!this._isActive || this._isPaused) return;

    if (this._isIntermission) {
      this.tickIntermission(dt);
    } else {
      this.tickWave(dt);
    }
  }

  /** Clean up all internal state. */
  destroy(): void {
    this._isActive = false;
    this._isPaused = false;
    this._isIntermission = false;
    this.schedule = [];
    this.removeAllListeners();
  }

  // ============================================================
  // Readonly accessors
  // ============================================================

  get currentWave(): number { return this._currentWaveIndex; }
  get totalWaves(): number { return this.config.waves.length; }
  get isActive(): boolean { return this._isActive; }
  get isPaused(): boolean { return this._isPaused; }
  get isIntermission(): boolean { return this._isIntermission; }
  get intermissionTimeLeft(): number {
    if (!this._isIntermission) return 0;
    return Math.max(0, this.intermissionDuration - this.intermissionElapsed);
  }

  // ============================================================
  // Private — wave lifecycle
  // ============================================================

  private beginWave(index: number): void {
    this._currentWaveIndex = index;
    this.waveElapsed = 0;
    this.scheduleIndex = 0;
    this.schedule = buildSchedule(this.config.waves[index]);

    const waveData = this.config.waves[index];
    this.emit('wave-start', index, waveData);
    this.config.onWaveStart?.(index, waveData);
  }

  private tickWave(dt: number): void {
    this.waveElapsed += dt;

    // Fire all spawns whose scheduled time has been reached
    const schedule = this.schedule;
    const len = schedule.length;
    for (let i = this.scheduleIndex; i < len; i++) {
      if (schedule[i].time <= this.waveElapsed) {
        const spawnType = schedule[i].type;
        this.emit('spawn', spawnType, this._currentWaveIndex);
        this.config.onSpawn(spawnType, this._currentWaveIndex);
        this.scheduleIndex = i + 1;
      } else {
        // Schedule is sorted — no need to check further
        break;
      }
    }

    // Wave complete when all spawns have been fired
    if (this.scheduleIndex >= len) {
      this.endWave();
    }
  }

  private endWave(): void {
    const idx = this._currentWaveIndex;
    this.emit('wave-end', idx);
    this.config.onWaveEnd?.(idx);

    const isLast = idx >= this.config.waves.length - 1;

    if (isLast) {
      this._isActive = false;
      this.emit('all-complete');
      this.config.onAllWavesComplete?.();
      return;
    }

    // Start intermission before next wave
    const duration = this.config.waves[idx].intermission ?? DEFAULT_INTERMISSION;
    this.startIntermission(duration);
  }

  private startIntermission(duration: number): void {
    this._isIntermission = true;
    this.intermissionDuration = duration;
    this.intermissionElapsed = 0;
    this.emit('intermission-start', duration);
  }

  private tickIntermission(dt: number): void {
    this.intermissionElapsed += dt;

    if (this.intermissionElapsed >= this.intermissionDuration) {
      this._isIntermission = false;

      if (this.autoAdvance) {
        this.beginWave(this._currentWaveIndex + 1);
      }
    }
  }
}
