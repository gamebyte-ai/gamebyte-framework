import { PathFollower } from '../../../../src/genre/td/PathFollower';
import { TowerManager } from '../../../../src/genre/td/TowerManager';

const PATH = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
];

function makeTowerManager() {
  return new TowerManager([
    {
      id: 'basic',
      name: 'Basic Tower',
      cost: 50,
      range: 100,
      damage: 10,
      fireRate: 1,
      upgrades: [
        { cost: 75, damage: 20, range: 120, fireRate: 1.5 },
      ],
    },
  ]);
}

function makeCurrency(amount: number) {
  let balance = amount;
  return {
    spend: (cost: number) => {
      if (balance >= cost) { balance -= cost; return true; }
      return false;
    },
    get balance() { return balance; },
  };
}

describe('PathFollower', () => {
  test('moves toward waypoints on update', () => {
    const follower = new PathFollower(PATH, 50); // 50 units/s
    follower.update(1); // 1 second -> moved 50 units along first segment
    expect(follower.x).toBeCloseTo(50, 1);
    expect(follower.y).toBeCloseTo(0, 1);
  });

  test('fires waypoint-reached event when waypoint is crossed', () => {
    const follower = new PathFollower(PATH, 200);
    const reached: number[] = [];
    follower.on('waypoint-reached', (idx) => reached.push(idx));
    follower.update(1); // should pass waypoint at x=100
    expect(reached).toContain(1);
  });

  test('fires path-complete at end of path', () => {
    const follower = new PathFollower(PATH, 1000);
    const completedFn = jest.fn();
    follower.on('path-complete', completedFn);
    follower.update(2); // More than enough to complete entire path
    expect(completedFn).toHaveBeenCalledTimes(1);
    expect(follower.isComplete).toBe(true);
  });

  test('progress returns value between 0 and 1', () => {
    const follower = new PathFollower(PATH, 50);
    expect(follower.progress).toBe(0);
    follower.update(1);
    expect(follower.progress).toBeGreaterThan(0);
    expect(follower.progress).toBeLessThanOrEqual(1);
  });

  test('progress is 1 when path is complete', () => {
    const follower = new PathFollower(PATH, 10000);
    follower.update(1);
    expect(follower.progress).toBe(1);
    expect(follower.isComplete).toBe(true);
  });

  test('pause() stops movement', () => {
    const follower = new PathFollower(PATH, 100);
    follower.pause();
    follower.update(1);
    expect(follower.x).toBe(0);
    expect(follower.y).toBe(0);
  });

  test('resume() allows movement after pause', () => {
    const follower = new PathFollower(PATH, 100);
    follower.pause();
    follower.update(1);
    follower.resume();
    follower.update(1);
    expect(follower.x).toBeGreaterThan(0);
  });

  test('reset() returns to start of path', () => {
    const follower = new PathFollower(PATH, 100);
    follower.update(1);
    follower.reset();
    expect(follower.x).toBe(0);
    expect(follower.y).toBe(0);
    expect(follower.progress).toBe(0);
    expect(follower.isComplete).toBe(false);
  });
});

describe('TowerManager', () => {
  test('place() creates tower and returns PlacedTower', () => {
    const tm = makeTowerManager();
    const currency = makeCurrency(100);
    const tower = tm.place('basic', 50, 50, currency);
    expect(tower).not.toBeNull();
    expect(tower!.defId).toBe('basic');
    expect(tower!.x).toBe(50);
    expect(tower!.y).toBe(50);
    expect(tower!.level).toBe(0);
    expect(currency.balance).toBe(50); // 100 - 50
  });

  test('place() returns null when currency is insufficient', () => {
    const tm = makeTowerManager();
    const currency = makeCurrency(10);
    const tower = tm.place('basic', 0, 0, currency);
    expect(tower).toBeNull();
    expect(tm.getTowers().length).toBe(0);
  });

  test('update() emits tower-fire for enemies in range', () => {
    const tm = makeTowerManager();
    const currency = makeCurrency(100);
    const tower = tm.place('basic', 0, 0, currency)!;

    const fired: any[] = [];
    tm.on('tower-fire', (t, target) => fired.push({ t, target }));

    const enemies = [{ x: 50, y: 0, health: 100 }]; // within range 100
    tm.update(2, enemies); // 2 seconds, fire rate 1/s => fires at least once
    expect(fired.length).toBeGreaterThanOrEqual(1);
    expect(fired[0].target).toBe(enemies[0]);
  });

  test('update() does NOT fire for enemies out of range', () => {
    const tm = makeTowerManager();
    const currency = makeCurrency(100);
    tm.place('basic', 0, 0, currency);

    const fired: any[] = [];
    tm.on('tower-fire', (t, target) => fired.push(target));

    const enemies = [{ x: 200, y: 0 }]; // outside range 100
    tm.update(2, enemies);
    expect(fired.length).toBe(0);
  });

  test('upgrade() increases tower level and emits event', () => {
    const tm = makeTowerManager();
    const currency = makeCurrency(200);
    const tower = tm.place('basic', 0, 0, currency)!;

    const upgradedFn = jest.fn();
    tm.on('tower-upgraded', upgradedFn);

    const result = tm.upgrade(tower.id, currency);
    expect(result).toBe(true);
    expect(upgradedFn).toHaveBeenCalledTimes(1);
    const upgraded = tm.getTowers()[0];
    expect(upgraded.level).toBe(1);
  });

  test('upgrade() returns false when cannot afford', () => {
    const tm = makeTowerManager();
    const currency = makeCurrency(50);
    const tower = tm.place('basic', 0, 0, currency)!;
    // Currency is now at 0, upgrade costs 75
    const result = tm.upgrade(tower.id, currency);
    expect(result).toBe(false);
  });

  test('sell() returns 50% of invested cost and removes tower', () => {
    const tm = makeTowerManager();
    const currency = makeCurrency(100);
    const tower = tm.place('basic', 0, 0, currency)!; // paid 50
    const refund = tm.sell(tower.id);
    expect(refund).toBe(25); // 50% of 50
    expect(tm.getTowers().length).toBe(0);
  });

  test('getUpgradeCost() returns null when at max level', () => {
    const tm = makeTowerManager();
    const currency = makeCurrency(500);
    const tower = tm.place('basic', 0, 0, currency)!;
    tm.upgrade(tower.id, currency); // level 1 (max for basic with 1 upgrade)
    expect(tm.getUpgradeCost(tower.id)).toBeNull();
  });
});
