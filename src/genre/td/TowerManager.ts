/**
 * TowerManager - Manages tower placement, upgrades, targeting, and firing.
 * Towers auto-target nearest enemy in range. Sell returns 50% invested cost.
 * No Pixi/Three dependencies — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface TowerDef {
  id: string;
  name: string;
  cost: number;
  range: number;
  damage: number;
  /** Attacks per second */
  fireRate: number;
  upgrades?: Array<{ cost: number; damage: number; range: number; fireRate: number }>;
}

export interface PlacedTower {
  id: string;
  defId: string;
  x: number;
  y: number;
  level: number;
}

interface TowerState extends PlacedTower {
  cooldown: number;
  /** Total currency invested (base cost + all upgrade costs paid) */
  totalInvested: number;
  /** Current stats after upgrades */
  currentDamage: number;
  currentRange: number;
  currentFireRate: number;
}

export interface TowerManagerEvents {
  'tower-placed': (tower: PlacedTower) => void;
  'tower-upgraded': (tower: PlacedTower) => void;
  'tower-sold': (tower: PlacedTower) => void;
  'tower-fire': (tower: PlacedTower, target: any) => void;
}

let _towerIdCounter = 0;

export class TowerManager extends EventEmitter<TowerManagerEvents> {
  private defs: Map<string, TowerDef> = new Map();
  private towers: Map<string, TowerState> = new Map();

  constructor(towerDefs: TowerDef[]) {
    super();
    for (const def of towerDefs) {
      this.defs.set(def.id, def);
    }
  }

  /** Place a tower. Returns tower instance or null if can't afford. */
  place(
    defId: string,
    x: number,
    y: number,
    currency: { spend: (amount: number) => boolean }
  ): PlacedTower | null {
    const def = this.defs.get(defId);
    if (!def) return null;

    if (!currency.spend(def.cost)) return null;

    const state: TowerState = {
      id: `tower_${++_towerIdCounter}`,
      defId,
      x,
      y,
      level: 0,
      cooldown: 0,
      totalInvested: def.cost,
      currentDamage: def.damage,
      currentRange: def.range,
      currentFireRate: def.fireRate,
    };

    this.towers.set(state.id, state);
    const snapshot = this._snapshot(state);
    this.emit('tower-placed', snapshot);
    return snapshot;
  }

  /** Upgrade a placed tower. Returns true if successful. */
  upgrade(towerId: string, currency: { spend: (amount: number) => boolean }): boolean {
    const state = this.towers.get(towerId);
    if (!state) return false;

    const def = this.defs.get(state.defId);
    if (!def || !def.upgrades || state.level >= def.upgrades.length) return false;

    const upgrade = def.upgrades[state.level];
    if (!currency.spend(upgrade.cost)) return false;

    state.level++;
    state.totalInvested += upgrade.cost;
    state.currentDamage = upgrade.damage;
    state.currentRange = upgrade.range;
    state.currentFireRate = upgrade.fireRate;

    const snapshot = this._snapshot(state);
    this.emit('tower-upgraded', snapshot);
    return true;
  }

  /** Sell a tower. Returns 50% of total invested cost. */
  sell(towerId: string): number {
    const state = this.towers.get(towerId);
    if (!state) return 0;

    const refund = Math.floor(state.totalInvested * 0.5);
    this.towers.delete(towerId);
    this.emit('tower-sold', this._snapshot(state));
    return refund;
  }

  /** Call each frame. Checks range, fires at enemies in range. */
  update(dt: number, enemies: Array<{ x: number; y: number; health?: number }>): void {
    for (const state of this.towers.values()) {
      state.cooldown -= dt;
      if (state.cooldown > 0) continue;

      const target = this._findNearest(state, enemies);
      if (!target) continue;

      state.cooldown = 1 / state.currentFireRate;
      this.emit('tower-fire', this._snapshot(state), target);
    }
  }

  /** Get all placed towers (snapshots) */
  getTowers(): PlacedTower[] {
    return Array.from(this.towers.values()).map(s => this._snapshot(s));
  }

  /** Get tower def by id */
  getDef(defId: string): TowerDef | undefined {
    return this.defs.get(defId);
  }

  /** Get upgrade cost for a placed tower. Returns null if at max level. */
  getUpgradeCost(towerId: string): number | null {
    const state = this.towers.get(towerId);
    if (!state) return null;

    const def = this.defs.get(state.defId);
    if (!def || !def.upgrades || state.level >= def.upgrades.length) return null;

    return def.upgrades[state.level].cost;
  }

  destroy(): void {
    this.towers.clear();
    this.removeAllListeners();
  }

  private _snapshot(state: TowerState): PlacedTower {
    return { id: state.id, defId: state.defId, x: state.x, y: state.y, level: state.level };
  }

  private _findNearest(
    state: TowerState,
    enemies: Array<{ x: number; y: number; health?: number }>
  ): { x: number; y: number; health?: number } | null {
    let nearest: { x: number; y: number; health?: number } | null = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      const dx = enemy.x - state.x;
      const dy = enemy.y - state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= state.currentRange && dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }
}
