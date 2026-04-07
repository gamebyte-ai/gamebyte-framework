/**
 * ObstaclePattern - Repeatable obstacle patterns for infinite runners and level generators.
 * No rendering imports — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface ObstacleDef {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export interface PatternDef {
  id: string;
  /** Total width of this pattern in world units */
  width: number;
  obstacles: ObstacleDef[];
  /** Difficulty 0-1, used for selection filtering */
  difficulty?: number;
}

export interface ObstaclePatternEvents {
  'pattern-spawned': (pattern: PatternDef, offsetX: number) => void;
}

export class ObstaclePattern extends EventEmitter<ObstaclePatternEvents> {
  private _patterns: Map<string, PatternDef>;

  constructor(patterns: PatternDef[]) {
    super();
    this._patterns = new Map();
    for (const pattern of patterns) {
      this._patterns.set(pattern.id, pattern);
    }
  }

  /**
   * Get the next pattern at random.
   * If maxDifficulty is provided, only patterns with difficulty <= maxDifficulty
   * are considered. Falls back to all patterns if none qualify.
   */
  getNext(maxDifficulty?: number): PatternDef {
    let pool = [...this._patterns.values()];

    if (maxDifficulty !== undefined) {
      const filtered = pool.filter(
        p => (p.difficulty ?? 0) <= maxDifficulty
      );
      if (filtered.length > 0) pool = filtered;
    }

    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  /** Get a specific pattern by id */
  getPattern(id: string): PatternDef | undefined {
    return this._patterns.get(id);
  }

  /** Get all registered patterns */
  getAll(): PatternDef[] {
    return [...this._patterns.values()];
  }

  /**
   * Generate `count` patterns in sequence starting at startX.
   * Returns all obstacles with absolute world positions.
   * Each obstacle also carries `patternId` for identification.
   */
  generate(
    count: number,
    startX = 0,
    maxDifficulty?: number
  ): Array<ObstacleDef & { patternId: string }> {
    const result: Array<ObstacleDef & { patternId: string }> = [];
    let cursorX = startX;

    for (let i = 0; i < count; i++) {
      const pattern = this.getNext(maxDifficulty);

      for (const obs of pattern.obstacles) {
        result.push({
          ...obs,
          x: cursorX + obs.x,
          patternId: pattern.id,
        });
      }

      this.emit('pattern-spawned', pattern, cursorX);
      cursorX += pattern.width;
    }

    return result;
  }
}
