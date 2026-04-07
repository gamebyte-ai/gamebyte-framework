/**
 * IdleEngine - Core idle/tycoon game engine.
 * Generators produce resources per second. Upgradeable with exponential cost scaling.
 * No Pixi/Three dependencies — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface GeneratorDef {
  id: string;
  name: string;
  /** Base cost to buy first */
  baseCost: number;
  /** Cost multiplier per owned (default: 1.15) */
  costMultiplier?: number;
  /** Resource produced per second per owned */
  baseProduction: number;
  /** Which resource it costs (default: first resource) */
  costCurrency?: string;
  /** Which resource it produces (default: first resource) */
  producesCurrency?: string;
}

export interface IdleEngineConfig {
  /** Resource IDs to track (e.g., ['gold', 'gems']) */
  resources: string[];
  /** Initial amounts */
  initialAmounts?: Record<string, number>;
  generators: GeneratorDef[];
}

export interface IdleEngineEvents {
  'tick': (production: Record<string, number>) => void;
  'purchase': (generatorId: string, count: number) => void;
  'resource-changed': (resourceId: string, amount: number) => void;
}

export class IdleEngine extends EventEmitter<IdleEngineEvents> {
  private resources: Map<string, number> = new Map();
  private owned: Map<string, number> = new Map();
  private defs: Map<string, GeneratorDef> = new Map();
  private defaultResource: string;

  constructor(config: IdleEngineConfig) {
    super();

    this.defaultResource = config.resources[0];

    // Initialize resources
    for (const id of config.resources) {
      const initial = config.initialAmounts?.[id] ?? 0;
      this.resources.set(id, initial);
    }

    // Register generators
    for (const def of config.generators) {
      this.defs.set(def.id, def);
      this.owned.set(def.id, 0);
    }
  }

  /** Call each frame or at fixed interval. dt in seconds. */
  update(dt: number): void {
    const production: Record<string, number> = {};

    for (const def of this.defs.values()) {
      const count = this.owned.get(def.id) ?? 0;
      if (count === 0) continue;

      const target = def.producesCurrency ?? this.defaultResource;
      const amount = def.baseProduction * count * dt;
      const current = this.resources.get(target) ?? 0;
      const next = current + amount;

      this.resources.set(target, next);
      production[target] = (production[target] ?? 0) + amount;
      this.emit('resource-changed', target, next);
    }

    this.emit('tick', production);
  }

  /** Get current amount of a resource */
  getResource(id: string): number {
    return this.resources.get(id) ?? 0;
  }

  /** Add resource directly */
  addResource(id: string, amount: number): void {
    const current = this.resources.get(id) ?? 0;
    const next = current + amount;
    this.resources.set(id, next);
    this.emit('resource-changed', id, next);
  }

  /** Get cost to buy next generator */
  getCost(generatorId: string): number {
    const def = this.defs.get(generatorId);
    if (!def) return Infinity;
    const count = this.owned.get(generatorId) ?? 0;
    const multiplier = def.costMultiplier ?? 1.15;
    return def.baseCost * Math.pow(multiplier, count);
  }

  /** How many of this generator are owned */
  getOwned(generatorId: string): number {
    return this.owned.get(generatorId) ?? 0;
  }

  /** Can afford to buy? */
  canBuy(generatorId: string): boolean {
    const def = this.defs.get(generatorId);
    if (!def) return false;
    const currency = def.costCurrency ?? this.defaultResource;
    const cost = this.getCost(generatorId);
    return (this.resources.get(currency) ?? 0) >= cost;
  }

  /** Buy one generator. Returns true if successful. */
  buy(generatorId: string): boolean {
    if (!this.canBuy(generatorId)) return false;

    const def = this.defs.get(generatorId)!;
    const currency = def.costCurrency ?? this.defaultResource;
    const cost = this.getCost(generatorId);

    const current = this.resources.get(currency) ?? 0;
    const remaining = current - cost;
    this.resources.set(currency, remaining);
    this.emit('resource-changed', currency, remaining);

    const prevOwned = this.owned.get(generatorId) ?? 0;
    const newOwned = prevOwned + 1;
    this.owned.set(generatorId, newOwned);

    this.emit('purchase', generatorId, newOwned);
    return true;
  }

  /** Get production per second for a resource */
  getProductionRate(resourceId: string): number {
    let rate = 0;
    for (const def of this.defs.values()) {
      const target = def.producesCurrency ?? this.defaultResource;
      if (target !== resourceId) continue;
      const count = this.owned.get(def.id) ?? 0;
      rate += def.baseProduction * count;
    }
    return rate;
  }

  /** Calculate offline earnings for given seconds */
  calculateOfflineEarnings(seconds: number): Record<string, number> {
    const earnings: Record<string, number> = {};
    for (const def of this.defs.values()) {
      const count = this.owned.get(def.id) ?? 0;
      if (count === 0) continue;
      const target = def.producesCurrency ?? this.defaultResource;
      earnings[target] = (earnings[target] ?? 0) + def.baseProduction * count * seconds;
    }
    return earnings;
  }

  /** Apply offline earnings and return the amounts added */
  applyOfflineEarnings(seconds: number): Record<string, number> {
    const earnings = this.calculateOfflineEarnings(seconds);
    for (const [id, amount] of Object.entries(earnings)) {
      this.addResource(id, amount);
    }
    return earnings;
  }

  /** Get all state (for saving) */
  getState(): { resources: Record<string, number>; owned: Record<string, number> } {
    const resources: Record<string, number> = {};
    const owned: Record<string, number> = {};
    for (const [id, val] of this.resources) resources[id] = val;
    for (const [id, val] of this.owned) owned[id] = val;
    return { resources, owned };
  }

  /** Load state (from save) */
  loadState(state: { resources: Record<string, number>; owned: Record<string, number> }): void {
    for (const [id, val] of Object.entries(state.resources)) {
      if (this.resources.has(id)) this.resources.set(id, val);
    }
    for (const [id, val] of Object.entries(state.owned)) {
      if (this.owned.has(id)) this.owned.set(id, val);
    }
  }

  /** Reset everything */
  reset(): void {
    for (const id of this.resources.keys()) this.resources.set(id, 0);
    for (const id of this.owned.keys()) this.owned.set(id, 0);
  }
}
