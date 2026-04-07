/**
 * StatsSystem - Character stats with base + bonus + modifiers.
 * No rendering imports — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface StatsDef {
  /** Stat name → base value */
  [key: string]: number;
}

export interface StatsSystemEvents {
  'stat-changed': (stat: string, newValue: number, oldValue: number) => void;
}

interface BonusEntry {
  stat: string;
  value: number;
}

export class StatsSystem extends EventEmitter<StatsSystemEvents> {
  private _base: Map<string, number>;
  private _bonuses: Map<string, BonusEntry>;

  constructor(baseStats: StatsDef) {
    super();
    this._base = new Map();
    this._bonuses = new Map();

    for (const [stat, value] of Object.entries(baseStats)) {
      this._base.set(stat, value);
    }
  }

  /** Get effective value (base + all matching bonuses) */
  get(stat: string): number {
    const base = this._base.get(stat) ?? 0;
    let bonus = 0;
    for (const entry of this._bonuses.values()) {
      if (entry.stat === stat) bonus += entry.value;
    }
    return base + bonus;
  }

  /** Get base value without bonuses */
  getBase(stat: string): number {
    return this._base.get(stat) ?? 0;
  }

  /** Set base stat value */
  setBase(stat: string, value: number): void {
    const oldEffective = this.get(stat);
    this._base.set(stat, value);
    const newEffective = this.get(stat);
    if (newEffective !== oldEffective) {
      this.emit('stat-changed', stat, newEffective, oldEffective);
    }
  }

  /** Add a named bonus (e.g., from equipment, buff) */
  addBonus(id: string, stat: string, value: number): void {
    const oldEffective = this.get(stat);
    this._bonuses.set(id, { stat, value });
    const newEffective = this.get(stat);
    if (newEffective !== oldEffective) {
      this.emit('stat-changed', stat, newEffective, oldEffective);
    }
  }

  /** Remove a named bonus by id */
  removeBonus(id: string): void {
    const entry = this._bonuses.get(id);
    if (!entry) return;
    const oldEffective = this.get(entry.stat);
    this._bonuses.delete(id);
    const newEffective = this.get(entry.stat);
    if (newEffective !== oldEffective) {
      this.emit('stat-changed', entry.stat, newEffective, oldEffective);
    }
  }

  /** Remove all bonuses for a specific stat */
  clearBonuses(stat: string): void {
    const affected = [...this._bonuses.entries()]
      .filter(([, entry]) => entry.stat === stat);
    if (affected.length === 0) return;
    const oldEffective = this.get(stat);
    for (const [id] of affected) this._bonuses.delete(id);
    const newEffective = this.get(stat);
    if (newEffective !== oldEffective) {
      this.emit('stat-changed', stat, newEffective, oldEffective);
    }
  }

  /** Get all stat names (base stats) */
  getStatNames(): string[] {
    return [...this._base.keys()];
  }

  /** Get all effective stats as a plain object */
  getAll(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const stat of this._base.keys()) {
      result[stat] = this.get(stat);
    }
    return result;
  }
}
