import { EconomyManager, CurrencyDef, ShopItemDef } from '../../../src/economy/EconomyManager';

const makeEconomy = () =>
  new EconomyManager([
    { id: 'gold', name: 'Gold', initial: 100 },
    { id: 'gems', name: 'Gems', initial: 10, max: 50 },
  ]);

const swordItem: ShopItemDef = {
  id: 'sword',
  name: 'Iron Sword',
  cost: { currency: 'gold', amount: 40 },
};

describe('EconomyManager', () => {
  describe('constructor', () => {
    it('initializes balances from CurrencyDef', () => {
      const eco = makeEconomy();
      expect(eco.getBalance('gold')).toBe(100);
      expect(eco.getBalance('gems')).toBe(10);
    });

    it('returns 0 for unknown currency', () => {
      const eco = makeEconomy();
      expect(eco.getBalance('crystals')).toBe(0);
    });
  });

  describe('add', () => {
    it('increases balance by the given amount', () => {
      const eco = makeEconomy();
      eco.add('gold', 50);
      expect(eco.getBalance('gold')).toBe(150);
    });

    it('caps balance at max when defined', () => {
      const eco = makeEconomy(); // gems max = 50, initial = 10
      eco.add('gems', 100);
      expect(eco.getBalance('gems')).toBe(50);
    });

    it('does not cap currencies without a max', () => {
      const eco = makeEconomy();
      eco.add('gold', 100000);
      expect(eco.getBalance('gold')).toBe(100100);
    });
  });

  describe('spend', () => {
    it('deducts balance and returns true on success', () => {
      const eco = makeEconomy();
      const result = eco.spend('gold', 30);
      expect(result).toBe(true);
      expect(eco.getBalance('gold')).toBe(70);
    });

    it('returns false and does not modify balance when insufficient funds', () => {
      const eco = makeEconomy();
      const result = eco.spend('gold', 999);
      expect(result).toBe(false);
      expect(eco.getBalance('gold')).toBe(100);
    });

    it('emits "insufficient-funds" with correct values', () => {
      const eco = makeEconomy();
      const events: Array<[string, number, number]> = [];
      eco.on('insufficient-funds', (currency, needed, have) => events.push([currency, needed, have]));

      eco.spend('gold', 200);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(['gold', 200, 100]);
    });
  });

  describe('canAfford', () => {
    it('returns true when balance >= amount', () => {
      const eco = makeEconomy();
      expect(eco.canAfford('gold', 100)).toBe(true);
      expect(eco.canAfford('gold', 50)).toBe(true);
    });

    it('returns false when balance < amount', () => {
      const eco = makeEconomy();
      expect(eco.canAfford('gold', 101)).toBe(false);
    });

    it('does not modify balance', () => {
      const eco = makeEconomy();
      eco.canAfford('gold', 50);
      expect(eco.getBalance('gold')).toBe(100);
    });
  });

  describe('getAllBalances', () => {
    it('returns a snapshot of all balances', () => {
      const eco = makeEconomy();
      const balances = eco.getAllBalances();
      expect(balances).toEqual({ gold: 100, gems: 10 });
    });

    it('snapshot is independent (mutation does not affect internal state)', () => {
      const eco = makeEconomy();
      const balances = eco.getAllBalances();
      balances['gold'] = 9999;
      expect(eco.getBalance('gold')).toBe(100);
    });
  });

  describe('registerItems', () => {
    it('stores shop items accessible via getShopItems()', () => {
      const eco = makeEconomy();
      eco.registerItems([swordItem]);
      expect(eco.getShopItems()).toHaveLength(1);
      expect(eco.getShopItems()[0].id).toBe('sword');
    });

    it('accumulates items across multiple registerItems calls', () => {
      const eco = makeEconomy();
      eco.registerItems([swordItem]);
      eco.registerItems([{ id: 'shield', name: 'Shield', cost: { currency: 'gold', amount: 20 } }]);
      expect(eco.getShopItems()).toHaveLength(2);
    });
  });

  describe('purchase', () => {
    it('succeeds and deducts cost when affordable', () => {
      const eco = makeEconomy();
      eco.registerItems([swordItem]);
      const result = eco.purchase('sword');
      expect(result).toBe(true);
      expect(eco.getBalance('gold')).toBe(60);
    });

    it('fails and returns false when insufficient funds', () => {
      const eco = new EconomyManager([{ id: 'gold', name: 'Gold', initial: 10 }]);
      eco.registerItems([swordItem]); // costs 40
      const result = eco.purchase('sword');
      expect(result).toBe(false);
      expect(eco.getBalance('gold')).toBe(10);
    });

    it('fails and returns false for unknown item', () => {
      const eco = makeEconomy();
      expect(eco.purchase('nonexistent')).toBe(false);
    });

    it('respects maxPurchases limit', () => {
      const eco = makeEconomy();
      const limitedItem: ShopItemDef = {
        id: 'potion',
        name: 'Potion',
        cost: { currency: 'gold', amount: 5 },
        maxPurchases: 2,
      };
      eco.registerItems([limitedItem]);

      expect(eco.purchase('potion')).toBe(true);
      expect(eco.purchase('potion')).toBe(true);
      expect(eco.purchase('potion')).toBe(false); // 3rd purchase blocked
      expect(eco.getPurchaseCount('potion')).toBe(2);
    });

    it('calls onPurchase callback', () => {
      const eco = makeEconomy();
      let called = false;
      const item: ShopItemDef = {
        id: 'ring',
        name: 'Ring',
        cost: { currency: 'gold', amount: 10 },
        onPurchase: () => { called = true; },
      };
      eco.registerItems([item]);
      eco.purchase('ring');
      expect(called).toBe(true);
    });

    it('emits "purchase" event with item id and cost', () => {
      const eco = makeEconomy();
      eco.registerItems([swordItem]);
      const events: Array<[string, { currency: string; amount: number }]> = [];
      eco.on('purchase', (id, cost) => events.push([id, cost]));

      eco.purchase('sword');
      expect(events).toHaveLength(1);
      expect(events[0][0]).toBe('sword');
      expect(events[0][1]).toEqual({ currency: 'gold', amount: 40 });
    });
  });

  describe('getPurchaseCount', () => {
    it('returns 0 for items never purchased', () => {
      const eco = makeEconomy();
      eco.registerItems([swordItem]);
      expect(eco.getPurchaseCount('sword')).toBe(0);
    });

    it('tracks purchase count correctly', () => {
      const eco = new EconomyManager([{ id: 'gold', name: 'Gold', initial: 1000 }]);
      const cheapItem: ShopItemDef = { id: 'coin', name: 'Coin', cost: { currency: 'gold', amount: 1 } };
      eco.registerItems([cheapItem]);

      eco.purchase('coin');
      eco.purchase('coin');
      eco.purchase('coin');
      expect(eco.getPurchaseCount('coin')).toBe(3);
    });
  });

  describe('balance-changed event', () => {
    it('fires with correct currency, newBalance, and delta on add()', () => {
      const eco = makeEconomy();
      const events: Array<[string, number, number]> = [];
      eco.on('balance-changed', (currency, newBal, delta) => events.push([currency, newBal, delta]));

      eco.add('gold', 25);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(['gold', 125, 25]);
    });

    it('fires with negative delta on spend()', () => {
      const eco = makeEconomy();
      const deltas: number[] = [];
      eco.on('balance-changed', (_, __, delta) => deltas.push(delta));

      eco.spend('gold', 30);
      expect(deltas[0]).toBe(-30);
    });

    it('fires with correct capped delta when add() hits max', () => {
      const eco = makeEconomy(); // gems: initial=10, max=50
      const events: Array<[string, number, number]> = [];
      eco.on('balance-changed', (currency, newBal, delta) => events.push([currency, newBal, delta]));

      eco.add('gems', 100); // would be 110 but capped at 50 → delta = 40
      expect(events[0][1]).toBe(50);
      expect(events[0][2]).toBe(40);
    });
  });

  describe('getUpgradeCost (static)', () => {
    it('returns baseCost at level 0', () => {
      expect(EconomyManager.getUpgradeCost(100, 0)).toBe(100);
    });

    it('calculates compound cost at level 1 with default multiplier', () => {
      expect(EconomyManager.getUpgradeCost(100, 1)).toBe(Math.floor(100 * 1.15));
    });

    it('respects custom multiplier', () => {
      expect(EconomyManager.getUpgradeCost(200, 2, 2.0)).toBe(Math.floor(200 * Math.pow(2.0, 2)));
    });

    it('floors the result (no fractional costs)', () => {
      const cost = EconomyManager.getUpgradeCost(100, 3, 1.15);
      expect(Number.isInteger(cost)).toBe(true);
    });
  });
});
