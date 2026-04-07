import { AutoAttack } from '../../../../src/genre/survivors/AutoAttack.js';
import { UpgradeSystem, UpgradeDef } from '../../../../src/genre/survivors/UpgradeSystem.js';
import { XPSystem } from '../../../../src/genre/survivors/XPSystem.js';

// ─── AutoAttack tests ────────────────────────────────────────────────────────

describe('AutoAttack — fire rate', () => {
  test('fires at nearest enemy within range', () => {
    const aa = new AutoAttack({ range: 200, fireRate: 1, damage: 10, targeting: 'nearest' });
    const owner = { x: 0, y: 0 };
    const enemies = [
      { x: 50, y: 0, health: 100 },
      { x: 100, y: 0, health: 100 },
    ];
    const fired: any[] = [];
    aa.on('fire', (target) => fired.push(target));

    aa.update(1, owner, enemies); // 1 second = 1 fire
    expect(fired).toHaveLength(1);
    expect(fired[0]).toBe(enemies[0]); // nearest
  });

  test('does not fire at enemies outside range', () => {
    const aa = new AutoAttack({ range: 50, fireRate: 1, damage: 10 });
    const owner = { x: 0, y: 0 };
    const enemies = [{ x: 100, y: 0, health: 100 }];
    const fired: any[] = [];
    aa.on('fire', (t) => fired.push(t));

    aa.update(1, owner, enemies);
    expect(fired).toHaveLength(0);
  });

  test('respects fire rate — does not fire before interval elapses', () => {
    const aa = new AutoAttack({ range: 200, fireRate: 2, damage: 5 }); // 2/s -> 0.5s interval
    const owner = { x: 0, y: 0 };
    const enemy = { x: 10, y: 0, health: 100 };
    const fired: any[] = [];
    aa.on('fire', (t) => fired.push(t));

    aa.update(0.3, owner, [enemy]); // < 0.5s, no fire
    expect(fired).toHaveLength(0);

    aa.update(0.2, owner, [enemy]); // 0.5s total, fires once
    expect(fired).toHaveLength(1);
  });

  test('fires multiple times when dt > multiple intervals', () => {
    const aa = new AutoAttack({ range: 200, fireRate: 4, damage: 5 }); // 0.25s interval
    const owner = { x: 0, y: 0 };
    const enemy = { x: 10, y: 0, health: 100 };
    const fired: any[] = [];
    aa.on('fire', (t) => fired.push(t));

    aa.update(1, owner, [enemy]); // should fire 4 times
    expect(fired).toHaveLength(4);
  });
});

describe('AutoAttack — targeting strategies', () => {
  const owner = { x: 0, y: 0 };
  const enemies = [
    { x: 30, y: 0, health: 20 },  // nearest, lowest-hp
    { x: 60, y: 0, health: 80 },
    { x: 80, y: 0, health: 50 },
  ];

  test('nearest picks closest enemy', () => {
    const aa = new AutoAttack({ range: 200, fireRate: 1, damage: 5, targeting: 'nearest' });
    const fired: any[] = [];
    aa.on('fire', (t) => fired.push(t));
    aa.update(1, owner, enemies);
    expect(fired[0]).toBe(enemies[0]);
  });

  test('lowest-hp picks enemy with least health', () => {
    const aa = new AutoAttack({ range: 200, fireRate: 1, damage: 5, targeting: 'lowest-hp' });
    const fired: any[] = [];
    aa.on('fire', (t) => fired.push(t));
    aa.update(1, owner, enemies);
    expect(fired[0]).toBe(enemies[0]); // health: 20
  });

  test('random picks one of the enemies', () => {
    const aa = new AutoAttack({ range: 200, fireRate: 1, damage: 5, targeting: 'random' });
    const fired: any[] = [];
    aa.on('fire', (t) => fired.push(t));
    aa.update(1, owner, enemies);
    expect(enemies).toContain(fired[0]);
  });
});

describe('AutoAttack — configure', () => {
  test('configure updates range at runtime', () => {
    const aa = new AutoAttack({ range: 50, fireRate: 1, damage: 5 });
    const owner = { x: 0, y: 0 };
    const enemy = { x: 100, y: 0, health: 50 };
    const fired: any[] = [];
    aa.on('fire', (t) => fired.push(t));

    aa.update(1, owner, [enemy]);
    expect(fired).toHaveLength(0); // out of range

    aa.configure({ range: 200 });
    aa.update(1, owner, [enemy]);
    expect(fired).toHaveLength(1); // now in range
  });
});

// ─── UpgradeSystem tests ─────────────────────────────────────────────────────

const testUpgrades: UpgradeDef[] = [
  { id: 'speed', name: 'Speed', description: '+move spd', maxLevel: 3, effect: { speed: 10 }, weight: 2 },
  { id: 'dmg',   name: 'Damage', description: '+dmg',    maxLevel: 2, effect: { damage: 5 }, weight: 1 },
  { id: 'hp',    name: 'Health', description: '+hp',     maxLevel: 5, effect: { health: 20 }, weight: 3 },
];

describe('UpgradeSystem', () => {
  test('getChoices returns correct count', () => {
    const sys = new UpgradeSystem(testUpgrades);
    expect(sys.getChoices(3)).toHaveLength(3);
    expect(sys.getChoices(2)).toHaveLength(2);
  });

  test('getChoices excludes maxed-out upgrades', () => {
    const sys = new UpgradeSystem(testUpgrades);
    // Max out 'dmg' (maxLevel: 2)
    sys.choose('dmg');
    sys.choose('dmg');
    const choices = sys.getChoices(3);
    const ids = choices.map(c => c.id);
    expect(ids).not.toContain('dmg');
  });

  test('choose increments upgrade level', () => {
    const sys = new UpgradeSystem(testUpgrades);
    expect(sys.getLevel('speed')).toBe(0);
    sys.choose('speed');
    expect(sys.getLevel('speed')).toBe(1);
    sys.choose('speed');
    expect(sys.getLevel('speed')).toBe(2);
  });

  test('choose does not exceed maxLevel', () => {
    const sys = new UpgradeSystem(testUpgrades);
    sys.choose('dmg'); sys.choose('dmg'); sys.choose('dmg'); // 3rd should be no-op
    expect(sys.getLevel('dmg')).toBe(2);
  });

  test('choose emits upgrade-chosen event with correct level', () => {
    const sys = new UpgradeSystem(testUpgrades);
    const events: Array<[UpgradeDef, number]> = [];
    sys.on('upgrade-chosen', (def, level) => events.push([def, level]));
    sys.choose('hp');
    expect(events).toHaveLength(1);
    expect(events[0][0].id).toBe('hp');
    expect(events[0][1]).toBe(1);
  });

  test('getAllLevels returns all upgrade levels', () => {
    const sys = new UpgradeSystem(testUpgrades);
    sys.choose('speed');
    const levels = sys.getAllLevels();
    expect(levels.speed).toBe(1);
    expect(levels.dmg).toBe(0);
    expect(levels.hp).toBe(0);
  });

  test('reset sets all levels back to 0', () => {
    const sys = new UpgradeSystem(testUpgrades);
    sys.choose('speed'); sys.choose('hp');
    sys.reset();
    expect(sys.getLevel('speed')).toBe(0);
    expect(sys.getLevel('hp')).toBe(0);
  });

  test('getChoices never returns more choices than available upgrades', () => {
    const sys = new UpgradeSystem([
      { id: 'a', name: 'A', description: '', maxLevel: 1, effect: {} },
    ]);
    expect(sys.getChoices(5)).toHaveLength(1);
  });
});

// ─── XPSystem tests ──────────────────────────────────────────────────────────

describe('XPSystem', () => {
  test('addXP accumulates currentXP', () => {
    const xp = new XPSystem();
    xp.addXP(50);
    expect(xp.currentXP).toBe(50);
    xp.addXP(30);
    expect(xp.currentXP).toBe(80);
  });

  test('level-up fires when threshold is reached', () => {
    const xp = new XPSystem(); // default: 100*level, level 1 needs 100 XP
    const leveled: number[] = [];
    xp.on('level-up', (lvl) => leveled.push(lvl));
    xp.addXP(100);
    expect(leveled).toEqual([2]);
    expect(xp.level).toBe(2);
  });

  test('xp-gained event fires with correct values', () => {
    const xp = new XPSystem();
    const events: Array<[number, number, number]> = [];
    xp.on('xp-gained', (amount, current, needed) => events.push([amount, current, needed]));
    xp.addXP(40);
    expect(events[0][0]).toBe(40);  // amount
    expect(events[0][1]).toBe(40);  // current after gain (before level-up processing)
  });

  test('progress returns value between 0 and 1', () => {
    const xp = new XPSystem();
    expect(xp.progress).toBe(0);
    xp.addXP(50);
    expect(xp.progress).toBeCloseTo(0.5);
    xp.addXP(50); // level up, currentXP resets
    expect(xp.progress).toBe(0);
  });

  test('custom xpCurve is respected', () => {
    const xp = new XPSystem({ xpCurve: (level) => level * 50 });
    // Level 1 needs 50 XP
    const leveled: number[] = [];
    xp.on('level-up', (lvl) => leveled.push(lvl));
    xp.addXP(50);
    expect(leveled).toEqual([2]);
  });

  test('multiple level-ups in a single addXP call', () => {
    const xp = new XPSystem({ xpCurve: () => 10 }); // needs 10 XP per level
    const leveled: number[] = [];
    xp.on('level-up', (lvl) => leveled.push(lvl));
    xp.addXP(35); // should level up 3 times, leftover 5
    expect(leveled).toHaveLength(3);
    expect(xp.currentXP).toBe(5);
  });

  test('reset returns system to initial state', () => {
    const xp = new XPSystem();
    xp.addXP(200);
    xp.reset();
    expect(xp.level).toBe(1);
    expect(xp.currentXP).toBe(0);
    expect(xp.progress).toBe(0);
  });
});
