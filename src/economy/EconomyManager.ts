import { EventEmitter } from 'eventemitter3';

export interface CurrencyDef {
  id: string;
  name: string;
  initial: number;
  /** Maximum balance. 0 or undefined = unlimited. */
  max?: number;
  icon?: string;
}

export interface ShopItemDef {
  id: string;
  name: string;
  cost: { currency: string; amount: number };
  /** Maximum number of purchases. 0 or undefined = unlimited. Default: 0 */
  maxPurchases?: number;
  onPurchase?: () => void;
}

export interface EconomyManagerEvents {
  'balance-changed': (currency: string, newBalance: number, delta: number) => void;
  'purchase': (itemId: string, cost: { currency: string; amount: number }) => void;
  'insufficient-funds': (currency: string, needed: number, have: number) => void;
}

/**
 * EconomyManager - Virtual currency and shop system.
 *
 * Manages multiple currencies, capped balances, shop item registration,
 * purchase gating, and purchase counts. Fully event-driven.
 *
 * @example
 * ```typescript
 * const economy = new EconomyManager([
 *   { id: 'gold', name: 'Gold', initial: 100 },
 *   { id: 'gems', name: 'Gems', initial: 0, max: 9999 }
 * ]);
 *
 * economy.registerItems([
 *   { id: 'sword', name: 'Iron Sword', cost: { currency: 'gold', amount: 50 } }
 * ]);
 *
 * const bought = economy.purchase('sword'); // true — deducts 50 gold
 * ```
 */
export class EconomyManager extends EventEmitter<EconomyManagerEvents> {
  private balances: Map<string, number>;
  private currencies: Map<string, CurrencyDef>;
  private shopItems: Map<string, ShopItemDef>;
  private purchaseCounts: Map<string, number>;

  constructor(currencies: CurrencyDef[]) {
    super();

    this.balances = new Map();
    this.currencies = new Map();
    this.shopItems = new Map();
    this.purchaseCounts = new Map();

    for (const c of currencies) {
      if (!c.id || !c.name) throw new Error('EconomyManager: currency must have id and name');
      if (c.initial < 0) c.initial = 0;
      this.currencies.set(c.id, c);
      this.balances.set(c.id, c.initial);
    }
  }

  // ============================================
  // CURRENCY OPERATIONS
  // ============================================

  /**
   * Get current balance for a currency. Returns 0 if currency not registered.
   */
  getBalance(currency: string): number {
    return this.balances.get(currency) ?? 0;
  }

  /**
   * Add amount to a currency balance, respecting the max cap if defined.
   * Emits 'balance-changed'.
   */
  add(currency: string, amount: number): void {
    if (amount < 0) return; // silently ignore negative adds
    const current = this.getBalance(currency);
    const def = this.currencies.get(currency);
    let newBalance = current + amount;

    if (def?.max !== undefined && def.max > 0) {
      newBalance = Math.min(newBalance, def.max);
    }

    const delta = newBalance - current;
    this.balances.set(currency, newBalance);
    this.emit('balance-changed', currency, newBalance, delta);
  }

  /**
   * Deduct amount from a currency balance.
   * Returns false and emits 'insufficient-funds' if balance is insufficient.
   * Returns true on success and emits 'balance-changed'.
   */
  spend(currency: string, amount: number): boolean {
    if (amount < 0) return false; // can't spend negative
    const current = this.getBalance(currency);

    if (current < amount) {
      this.emit('insufficient-funds', currency, amount, current);
      return false;
    }

    const newBalance = current - amount;
    this.balances.set(currency, newBalance);
    this.emit('balance-changed', currency, newBalance, -amount);
    return true;
  }

  /**
   * Check whether the player can afford an amount without modifying balance.
   */
  canAfford(currency: string, amount: number): boolean {
    return this.getBalance(currency) >= amount;
  }

  /**
   * Snapshot of all registered currency balances.
   */
  getAllBalances(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [id, balance] of this.balances) {
      result[id] = balance;
    }
    return result;
  }

  // ============================================
  // SHOP OPERATIONS
  // ============================================

  /**
   * Register shop items. Can be called multiple times to add more items.
   */
  registerItems(items: ShopItemDef[]): void {
    for (const item of items) {
      this.shopItems.set(item.id, item);
    }
  }

  /**
   * Attempt to purchase a shop item.
   * Checks canPurchase, deducts cost, increments purchase count,
   * calls onPurchase callback, and emits 'purchase'.
   * Returns true on success, false otherwise.
   */
  purchase(itemId: string): boolean {
    if (!this.canPurchase(itemId)) {
      return false;
    }

    const item = this.shopItems.get(itemId)!;
    const { currency, amount } = item.cost;

    // Deduct — spend handles the event emission
    this.spend(currency, amount);

    // Track purchase count
    const prev = this.purchaseCounts.get(itemId) ?? 0;
    this.purchaseCounts.set(itemId, prev + 1);

    // Invoke callback if provided
    if (item.onPurchase) {
      try {
        item.onPurchase();
      } catch (e) {
        // Don't let callback crash economy system
      }
    }

    this.emit('purchase', itemId, { currency, amount });
    return true;
  }

  /**
   * Check whether an item can be purchased:
   * - Item exists
   * - Player can afford it
   * - Under maxPurchases limit (if set)
   */
  canPurchase(itemId: string): boolean {
    const item = this.shopItems.get(itemId);
    if (!item) return false;

    if (!this.canAfford(item.cost.currency, item.cost.amount)) return false;

    const max = item.maxPurchases ?? 0;
    if (max > 0) {
      const count = this.purchaseCounts.get(itemId) ?? 0;
      if (count >= max) return false;
    }

    return true;
  }

  /**
   * Get the number of times an item has been purchased.
   */
  getPurchaseCount(itemId: string): number {
    return this.purchaseCounts.get(itemId) ?? 0;
  }

  /**
   * Get all registered shop items.
   */
  getShopItems(): ShopItemDef[] {
    return Array.from(this.shopItems.values());
  }

  // ============================================
  // STATIC HELPERS
  // ============================================

  /**
   * Calculate compound upgrade cost using exponential scaling.
   * Formula: floor(baseCost * multiplier^level)
   *
   * @param baseCost - Base cost at level 0
   * @param level - Current upgrade level
   * @param multiplier - Cost growth factor per level (default: 1.15)
   */
  static getUpgradeCost(baseCost: number, level: number, multiplier: number = 1.15): number {
    return Math.floor(baseCost * Math.pow(multiplier, level));
  }
}
