/**
 * UpgradeSystem - Weighted random upgrade choices for survivors/roguelike games.
 * Tracks per-upgrade levels, filters maxed-out upgrades, and emits events on selection.
 * No Pixi/Three dependencies — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  /** Effect values applied per level — agent defines semantics */
  effect: Record<string, number>;
  /** Rarity weight (higher = more common). Default: 1 */
  weight?: number;
}

export interface UpgradeSystemEvents {
  'upgrade-chosen': (upgrade: UpgradeDef, newLevel: number) => void;
}

export class UpgradeSystem extends EventEmitter<UpgradeSystemEvents> {
  private _defs: Map<string, UpgradeDef>;
  private _levels: Map<string, number>;

  constructor(upgrades: UpgradeDef[]) {
    super();
    this._defs = new Map(upgrades.map(u => [u.id, u]));
    this._levels = new Map(upgrades.map(u => [u.id, 0]));
  }

  /**
   * Get N random upgrade choices, weighted by rarity, excluding maxed-out upgrades.
   * @param count Number of choices to return (default: 3)
   */
  getChoices(count: number = 3): UpgradeDef[] {
    // Collect available (not maxed) upgrades
    const available: UpgradeDef[] = [];
    for (const [id, def] of this._defs) {
      const level = this._levels.get(id) ?? 0;
      if (level < def.maxLevel) available.push(def);
    }

    if (available.length === 0) return [];
    const take = Math.min(count, available.length);

    // Weighted reservoir sampling (no repeats)
    const chosen: UpgradeDef[] = [];
    const pool = [...available];

    for (let i = 0; i < take; i++) {
      const totalWeight = pool.reduce((sum, u) => sum + (u.weight ?? 1), 0);
      let rnd = Math.random() * totalWeight;
      let pickedIndex = 0;
      for (let j = 0; j < pool.length; j++) {
        rnd -= pool[j].weight ?? 1;
        if (rnd <= 0) { pickedIndex = j; break; }
      }
      chosen.push(pool[pickedIndex]);
      pool.splice(pickedIndex, 1);
    }

    return chosen;
  }

  /** Apply a chosen upgrade by id */
  choose(upgradeId: string): void {
    const def = this._defs.get(upgradeId);
    if (!def) return;

    const current = this._levels.get(upgradeId) ?? 0;
    if (current >= def.maxLevel) return;

    const newLevel = current + 1;
    this._levels.set(upgradeId, newLevel);
    this.emit('upgrade-chosen', def, newLevel);
  }

  /** Get current level of a specific upgrade */
  getLevel(upgradeId: string): number {
    return this._levels.get(upgradeId) ?? 0;
  }

  /** Get all upgrade levels as a plain object */
  getAllLevels(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [id, level] of this._levels) {
      result[id] = level;
    }
    return result;
  }

  /** Reset all upgrades to level 0 */
  reset(): void {
    for (const id of this._levels.keys()) {
      this._levels.set(id, 0);
    }
  }
}
