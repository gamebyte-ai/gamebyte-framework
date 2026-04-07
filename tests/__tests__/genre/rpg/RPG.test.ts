import { StatsSystem } from '../../../../src/genre/rpg/StatsSystem';
import { InventorySystem } from '../../../../src/genre/rpg/InventorySystem';
import { DialogueSystem } from '../../../../src/genre/rpg/DialogueSystem';
import type { ItemDef } from '../../../../src/genre/rpg/InventorySystem';
import type { DialogueNode } from '../../../../src/genre/rpg/DialogueSystem';

// ─── StatsSystem ───────────────────────────────────────────────────────────

describe('StatsSystem', () => {
  test('returns base stat value', () => {
    const stats = new StatsSystem({ hp: 100, atk: 20 });
    expect(stats.get('hp')).toBe(100);
    expect(stats.get('atk')).toBe(20);
  });

  test('getBase returns base without bonuses', () => {
    const stats = new StatsSystem({ hp: 100 });
    stats.addBonus('ring', 'hp', 50);
    expect(stats.getBase('hp')).toBe(100);
    expect(stats.get('hp')).toBe(150);
  });

  test('setBase updates stat and fires event', () => {
    const stats = new StatsSystem({ hp: 100 });
    const changes: number[] = [];
    stats.on('stat-changed', (_, newVal) => changes.push(newVal));
    stats.setBase('hp', 120);
    expect(stats.get('hp')).toBe(120);
    expect(changes).toContain(120);
  });

  test('addBonus stacks multiple bonuses', () => {
    const stats = new StatsSystem({ atk: 10 });
    stats.addBonus('sword', 'atk', 5);
    stats.addBonus('ring', 'atk', 3);
    expect(stats.get('atk')).toBe(18);
  });

  test('removeBonus removes only the specified bonus', () => {
    const stats = new StatsSystem({ atk: 10 });
    stats.addBonus('sword', 'atk', 5);
    stats.addBonus('ring', 'atk', 3);
    stats.removeBonus('sword');
    expect(stats.get('atk')).toBe(13);
  });

  test('clearBonuses removes all bonuses for a stat', () => {
    const stats = new StatsSystem({ def: 5 });
    stats.addBonus('shield1', 'def', 10);
    stats.addBonus('shield2', 'def', 10);
    stats.clearBonuses('def');
    expect(stats.get('def')).toBe(5);
  });

  test('getStatNames returns all stat names', () => {
    const stats = new StatsSystem({ hp: 100, atk: 10, def: 5 });
    expect(stats.getStatNames()).toEqual(expect.arrayContaining(['hp', 'atk', 'def']));
  });

  test('getAll returns effective values for all stats', () => {
    const stats = new StatsSystem({ hp: 100, atk: 10 });
    stats.addBonus('b', 'atk', 5);
    const all = stats.getAll();
    expect(all.hp).toBe(100);
    expect(all.atk).toBe(15);
  });
});

// ─── InventorySystem ───────────────────────────────────────────────────────

function makeItem(id: string, stackable = false): ItemDef {
  return { id, name: id, type: 'misc', stackable };
}

describe('InventorySystem', () => {
  test('add and has item', () => {
    const inv = new InventorySystem();
    const sword = makeItem('sword');
    inv.add(sword);
    expect(inv.has('sword')).toBe(true);
  });

  test('remove reduces count correctly', () => {
    const inv = new InventorySystem();
    const potion = makeItem('potion', true);
    inv.add(potion, 5);
    inv.remove('potion', 2);
    expect(inv.getCount('potion')).toBe(3);
  });

  test('has returns false when item fully removed', () => {
    const inv = new InventorySystem();
    inv.add(makeItem('coin'), 1);
    inv.remove('coin', 1);
    expect(inv.has('coin')).toBe(false);
  });

  test('getCount returns 0 for missing item', () => {
    const inv = new InventorySystem();
    expect(inv.getCount('ghost')).toBe(0);
  });

  test('equip and getEquipped', () => {
    const inv = new InventorySystem({ equipSlots: ['weapon'] });
    const sword = makeItem('sword');
    inv.add(sword);
    inv.equip('weapon', 'sword');
    expect(inv.getEquipped('weapon')?.id).toBe('sword');
  });

  test('unequip returns the item', () => {
    const inv = new InventorySystem({ equipSlots: ['weapon'] });
    inv.add(makeItem('axe'));
    inv.equip('weapon', 'axe');
    const removed = inv.unequip('weapon');
    expect(removed?.id).toBe('axe');
    expect(inv.getEquipped('weapon')).toBeNull();
  });

  test('isFull blocks adding when at capacity', () => {
    const inv = new InventorySystem({ maxSlots: 2 });
    inv.add(makeItem('a'));
    inv.add(makeItem('b'));
    expect(inv.isFull).toBe(true);
    const result = inv.add(makeItem('c'));
    expect(result).toBe(false);
  });

  test('slotCount and maxSlots', () => {
    const inv = new InventorySystem({ maxSlots: 10 });
    inv.add(makeItem('x'));
    expect(inv.slotCount).toBe(1);
    expect(inv.maxSlots).toBe(10);
  });
});

// ─── DialogueSystem ────────────────────────────────────────────────────────

function makeNodes(): DialogueNode[] {
  return [
    { id: 'start', text: 'Hello!', next: 'middle' },
    { id: 'middle', text: 'How are you?', choices: [
      { text: 'Good', next: 'end_good' },
      { text: 'Bad', next: 'end_bad' },
    ]},
    { id: 'end_good', text: 'Great!', next: undefined },
    { id: 'end_bad', text: 'Sorry to hear.', next: undefined },
  ];
}

describe('DialogueSystem', () => {
  test('start emits node event', () => {
    const dlg = new DialogueSystem(makeNodes());
    const nodes: string[] = [];
    dlg.on('node', n => nodes.push(n.id));
    dlg.start('start');
    expect(nodes).toContain('start');
    expect(dlg.isActive).toBe(true);
  });

  test('advance moves to next linear node', () => {
    const dlg = new DialogueSystem(makeNodes());
    dlg.start('start');
    dlg.advance();
    expect(dlg.current?.id).toBe('middle');
  });

  test('choose navigates to correct branch', () => {
    const dlg = new DialogueSystem(makeNodes());
    dlg.start('middle');
    dlg.choose(0);
    expect(dlg.current?.id).toBe('end_good');
  });

  test('choose second option works', () => {
    const dlg = new DialogueSystem(makeNodes());
    dlg.start('middle');
    dlg.choose(1);
    expect(dlg.current?.id).toBe('end_bad');
  });

  test('end event fires when no next node', () => {
    const dlg = new DialogueSystem(makeNodes());
    let ended = false;
    dlg.on('end', () => { ended = true; });
    dlg.start('end_good');
    dlg.advance();
    expect(ended).toBe(true);
    expect(dlg.isActive).toBe(false);
  });

  test('onEnter callback is called when entering node', () => {
    let called = false;
    const nodes: DialogueNode[] = [
      { id: 'a', text: 'Hi', onEnter: () => { called = true; } },
    ];
    const dlg = new DialogueSystem(nodes);
    dlg.start('a');
    expect(called).toBe(true);
  });
});
