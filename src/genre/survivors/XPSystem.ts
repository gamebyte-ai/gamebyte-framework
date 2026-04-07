/**
 * XPSystem - XP accumulation with configurable level curve and level-up events.
 * No Pixi/Three dependencies — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface XPSystemEvents {
  'level-up': (newLevel: number, totalXP: number) => void;
  'xp-gained': (amount: number, current: number, needed: number) => void;
}

export class XPSystem extends EventEmitter<XPSystemEvents> {
  private _level: number;
  private _currentXP: number = 0;
  private _totalXP: number = 0;
  private _xpCurve: (level: number) => number;

  constructor(config?: {
    /** XP needed per level. Default: (level) => 100 * level */
    xpCurve?: (level: number) => number;
    /** Starting level. Default: 1 */
    startLevel?: number;
  }) {
    super();
    this._xpCurve = config?.xpCurve ?? ((level: number) => 100 * level);
    this._level = config?.startLevel ?? 1;
  }

  /** Add XP. Auto-levels-up (possibly multiple times) if threshold is reached. */
  addXP(amount: number): void {
    if (amount <= 0) return;
    this._currentXP += amount;
    this._totalXP += amount;

    // Emit xp-gained before potential level-ups
    this.emit('xp-gained', amount, this._currentXP, this.xpToNextLevel);

    // Handle multiple level-ups from a single XP gain
    let needed = this._xpCurve(this._level);
    while (this._currentXP >= needed) {
      this._currentXP -= needed;
      this._level++;
      this.emit('level-up', this._level, this._totalXP);
      needed = this._xpCurve(this._level);
    }
  }

  get level(): number {
    return this._level;
  }

  get currentXP(): number {
    return this._currentXP;
  }

  get xpToNextLevel(): number {
    return this._xpCurve(this._level);
  }

  /** Progress toward next level, 0–1 */
  get progress(): number {
    const needed = this._xpCurve(this._level);
    if (needed <= 0) return 1;
    return Math.min(this._currentXP / needed, 1);
  }

  reset(): void {
    this._level = 1;
    this._currentXP = 0;
    this._totalXP = 0;
  }
}
