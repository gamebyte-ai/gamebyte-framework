import { IdleEngine } from '../../../../src/genre/idle/IdleEngine';
import { PrestigeSystem } from '../../../../src/genre/idle/PrestigeSystem';

function makeEngine() {
  return new IdleEngine({
    resources: ['gold', 'gems'],
    initialAmounts: { gold: 100, gems: 0 },
    generators: [
      {
        id: 'mine',
        name: 'Mine',
        baseCost: 10,
        costMultiplier: 1.15,
        baseProduction: 1,
        producesCurrency: 'gold',
      },
      {
        id: 'crystalCave',
        name: 'Crystal Cave',
        baseCost: 50,
        costMultiplier: 1.2,
        baseProduction: 0.5,
        costCurrency: 'gold',
        producesCurrency: 'gems',
      },
    ],
  });
}

describe('IdleEngine', () => {
  test('update() produces resources based on owned generators', () => {
    const engine = makeEngine();
    // Manually buy a mine by adding gold and buying
    engine.buy('mine'); // costs 10 gold, now owns 1 mine
    engine.update(1); // 1 second
    // Should have produced 1 gold (1 production * 1 owned * 1s)
    // Started with 100, paid 10, gained 1 => 91
    expect(engine.getResource('gold')).toBeCloseTo(91, 5);
  });

  test('getCost() increases with owned count', () => {
    const engine = makeEngine();
    const firstCost = engine.getCost('mine');
    expect(firstCost).toBeCloseTo(10, 5);

    engine.buy('mine');
    const secondCost = engine.getCost('mine');
    expect(secondCost).toBeCloseTo(10 * 1.15, 5);
  });

  test('buy() deducts cost and increments owned', () => {
    const engine = makeEngine();
    const result = engine.buy('mine');
    expect(result).toBe(true);
    expect(engine.getOwned('mine')).toBe(1);
    expect(engine.getResource('gold')).toBeCloseTo(90, 5); // 100 - 10
  });

  test('canBuy() returns false when cannot afford', () => {
    const engine = new IdleEngine({
      resources: ['gold'],
      initialAmounts: { gold: 5 },
      generators: [{ id: 'mine', name: 'Mine', baseCost: 10, baseProduction: 1 }],
    });
    expect(engine.canBuy('mine')).toBe(false);
  });

  test('canBuy() returns true when can afford', () => {
    const engine = makeEngine();
    expect(engine.canBuy('mine')).toBe(true);
  });

  test('buy() returns false when cannot afford', () => {
    const engine = new IdleEngine({
      resources: ['gold'],
      initialAmounts: { gold: 5 },
      generators: [{ id: 'mine', name: 'Mine', baseCost: 10, baseProduction: 1 }],
    });
    expect(engine.buy('mine')).toBe(false);
    expect(engine.getOwned('mine')).toBe(0);
  });

  test('getProductionRate() sums all generators for a resource', () => {
    const engine = makeEngine();
    engine.buy('mine'); // own 1
    engine.buy('mine'); // own 2 (costs 11.5, have 90 -> yes)
    const rate = engine.getProductionRate('gold');
    expect(rate).toBeCloseTo(2, 5); // 2 mines * 1 production
  });

  test('calculateOfflineEarnings() returns correct amounts', () => {
    const engine = makeEngine();
    engine.buy('mine'); // 1 mine, 1 gold/s
    const earnings = engine.calculateOfflineEarnings(60);
    expect(earnings['gold']).toBeCloseTo(60, 5);
  });

  test('applyOfflineEarnings() adds earnings to resources', () => {
    const engine = makeEngine();
    engine.buy('mine');
    const before = engine.getResource('gold');
    const earnings = engine.applyOfflineEarnings(10);
    expect(engine.getResource('gold')).toBeCloseTo(before + 10, 5);
    expect(earnings['gold']).toBeCloseTo(10, 5);
  });

  test('getState/loadState round-trips correctly', () => {
    const engine = makeEngine();
    engine.buy('mine');
    engine.addResource('gems', 5);
    const state = engine.getState();

    const engine2 = makeEngine();
    engine2.loadState(state);
    expect(engine2.getOwned('mine')).toBe(1);
    expect(engine2.getResource('gems')).toBe(5);
    expect(engine2.getResource('gold')).toBeCloseTo(state.resources['gold'], 5);
  });

  test('reset() clears all resources and owned', () => {
    const engine = makeEngine();
    engine.buy('mine');
    engine.reset();
    expect(engine.getOwned('mine')).toBe(0);
    expect(engine.getResource('gold')).toBe(0);
  });

  test('tick event is emitted on update', () => {
    const engine = makeEngine();
    engine.buy('mine');
    const handler = jest.fn();
    engine.on('tick', handler);
    engine.update(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('PrestigeSystem', () => {
  function makePrestige() {
    return new PrestigeSystem({ threshold: 1000, resource: 'gold' });
  }

  test('canPrestige() returns false below threshold', () => {
    const ps = makePrestige();
    expect(ps.canPrestige(500)).toBe(false);
  });

  test('canPrestige() returns true at or above threshold', () => {
    const ps = makePrestige();
    expect(ps.canPrestige(1000)).toBe(true);
    expect(ps.canPrestige(5000)).toBe(true);
  });

  test('prestige() returns new multiplier greater than initial', () => {
    const ps = makePrestige();
    const newMult = ps.prestige(10000);
    expect(newMult).toBeGreaterThan(1);
  });

  test('multiplier persists after prestige', () => {
    const ps = makePrestige();
    ps.prestige(10000);
    expect(ps.multiplier).toBeGreaterThan(1);
    expect(ps.totalPrestiges).toBe(1);
  });

  test('prestige() does nothing when below threshold', () => {
    const ps = makePrestige();
    const mult = ps.prestige(100);
    expect(mult).toBe(1);
    expect(ps.totalPrestiges).toBe(0);
  });

  test('getState/loadState round-trips correctly', () => {
    const ps = makePrestige();
    ps.prestige(10000);
    const state = ps.getState();

    const ps2 = makePrestige();
    ps2.loadState(state);
    expect(ps2.multiplier).toBeCloseTo(state.multiplier, 5);
    expect(ps2.totalPrestiges).toBe(state.count);
  });

  test('getMultiplierPreview() does not mutate state', () => {
    const ps = makePrestige();
    const preview = ps.getMultiplierPreview(10000);
    expect(preview).toBeGreaterThan(1);
    expect(ps.totalPrestiges).toBe(0);
    expect(ps.multiplier).toBe(1);
  });
});
