/**
 * PrestigeSystem - Soft-reset mechanic: reset progress for a permanent multiplier.
 * Default formula: 1 + log10(amount / threshold), capped at a reasonable max.
 * No Pixi/Three dependencies — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface PrestigeConfig {
  /** Minimum resource amount to prestige */
  threshold: number;
  /** Which resource to check */
  resource: string;
  /** Multiplier formula: (amount) => multiplier (default: 1 + log10(amount / threshold)) */
  multiplierFormula?: (amount: number) => number;
  /** Maximum multiplier cap (default: 1000) */
  maxMultiplier?: number;
}

export interface PrestigeEvents {
  'prestige': (newMultiplier: number, totalPrestiges: number) => void;
}

export class PrestigeSystem extends EventEmitter<PrestigeEvents> {
  private config: PrestigeConfig;
  private _multiplier: number = 1;
  private _totalPrestiges: number = 0;

  constructor(config: PrestigeConfig) {
    super();
    this.config = config;
  }

  /** Can prestige right now? */
  canPrestige(currentAmount: number): boolean {
    return currentAmount >= this.config.threshold;
  }

  /** Calculate multiplier if prestige now */
  getMultiplierPreview(currentAmount: number): number {
    if (!this.canPrestige(currentAmount)) return this._multiplier;

    const maxMultiplier = this.config.maxMultiplier ?? 1000;
    const formula = this.config.multiplierFormula
      ?? ((amount: number) => 1 + Math.log10(amount / this.config.threshold));

    const gained = Math.min(formula(currentAmount), maxMultiplier);
    return Math.min(this._multiplier + gained - 1, maxMultiplier);
  }

  /** Execute prestige. Returns new multiplier. */
  prestige(currentAmount: number): number {
    if (!this.canPrestige(currentAmount)) return this._multiplier;

    const maxMultiplier = this.config.maxMultiplier ?? 1000;
    const formula = this.config.multiplierFormula
      ?? ((amount: number) => 1 + Math.log10(amount / this.config.threshold));

    const gained = Math.min(formula(currentAmount), maxMultiplier);
    this._multiplier = Math.min(this._multiplier + gained - 1, maxMultiplier);
    this._totalPrestiges++;

    this.emit('prestige', this._multiplier, this._totalPrestiges);
    return this._multiplier;
  }

  /** Current permanent multiplier */
  get multiplier(): number {
    return this._multiplier;
  }

  /** Total prestige count */
  get totalPrestiges(): number {
    return this._totalPrestiges;
  }

  /** Get state for saving */
  getState(): { multiplier: number; count: number } {
    return { multiplier: this._multiplier, count: this._totalPrestiges };
  }

  /** Load state */
  loadState(state: { multiplier: number; count: number }): void {
    this._multiplier = state.multiplier;
    this._totalPrestiges = state.count;
  }
}
