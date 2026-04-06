import { SaveSystem } from '../../../src/save/SaveSystem';

interface TestSave {
  score: number;
  level: number;
  name: string;
}

/**
 * Simple in-memory storage for test isolation.
 * Each test gets its own instance (or shares one when testing cross-instance persistence).
 */
class TestStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  setItem(key: string, value: string): void { this.store.set(key, value); }
  removeItem(key: string): void { this.store.delete(key); }
}

const makeSystem = (
  overrides: Partial<ConstructorParameters<typeof SaveSystem>[0]> = {},
  storage?: TestStorage
) => {
  const st = storage ?? new TestStorage();
  return new SaveSystem<TestSave>({
    key: 'test-save',
    version: 1,
    defaults: { score: 0, level: 1, name: 'Player' },
    storage: st,
    ...overrides,
  });
};

describe('SaveSystem', () => {
  describe('load', () => {
    it('returns defaults when no save exists', () => {
      const sys = makeSystem();
      const data = sys.load();
      expect(data).toEqual({ score: 0, level: 1, name: 'Player' });
    });

    it('retrieves saved data after save()', () => {
      const sys = makeSystem();
      sys.save({ score: 999, level: 5, name: 'Hero' });
      const data = sys.load();
      expect(data).toEqual({ score: 999, level: 5, name: 'Hero' });
    });

    it('merges partial data: keeps defaults for unset keys', () => {
      const sys = makeSystem();
      sys.save({ score: 42 } as Partial<TestSave>);
      const data = sys.load();
      expect(data.score).toBe(42);
      expect(data.level).toBe(1);
      expect(data.name).toBe('Player');
    });
  });

  describe('get / set', () => {
    it('get returns current in-memory value', () => {
      const sys = makeSystem();
      sys.load();
      expect(sys.get('score')).toBe(0);
    });

    it('set updates a single field', () => {
      const sys = makeSystem();
      sys.load();
      sys.set('score', 500);
      expect(sys.get('score')).toBe(500);
    });

    it('set auto-saves to storage (persists across load via shared storage)', () => {
      const sharedStorage = new TestStorage();
      const sys = makeSystem({}, sharedStorage);
      sys.load();
      sys.set('level', 7);

      // Second instance sharing the same storage backend
      const sys2 = makeSystem({}, sharedStorage);
      const data = sys2.load();
      expect(data.level).toBe(7);
    });
  });

  describe('hasSave', () => {
    it('returns false before any save', () => {
      const sys = makeSystem();
      expect(sys.hasSave).toBe(false);
    });

    it('returns true after save()', () => {
      const sys = makeSystem();
      sys.save({ score: 1, level: 1, name: 'X' });
      expect(sys.hasSave).toBe(true);
    });

    it('returns false after reset()', () => {
      const sys = makeSystem();
      sys.save({ score: 1, level: 1, name: 'X' });
      sys.reset();
      expect(sys.hasSave).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears save and restores in-memory data to defaults', () => {
      const sys = makeSystem();
      sys.save({ score: 9000, level: 99, name: 'Boss' });
      sys.load();
      sys.reset();
      expect(sys.get('score')).toBe(0);
      expect(sys.get('level')).toBe(1);
      expect(sys.hasSave).toBe(false);
    });
  });

  describe('migrations', () => {
    interface OldSave { score: number; stage: number }
    interface NewSave { score: number; level: number; name: string }

    it('runs a single migration from v1 to v2', () => {
      const sharedStorage = new TestStorage();

      // Write a v1 save using shared storage
      const sys1 = new SaveSystem<OldSave>({
        key: 'mig-save',
        version: 1,
        defaults: { score: 0, stage: 1 },
        storage: sharedStorage,
      });
      sys1.save({ score: 50, stage: 3 });

      // Open with v2 + migration, same storage
      const sys2 = new SaveSystem<NewSave>({
        key: 'mig-save',
        version: 2,
        defaults: { score: 0, level: 1, name: 'Player' },
        storage: sharedStorage,
        migrations: {
          1: (old: OldSave) => ({ score: old.score, level: old.stage, name: 'Migrated' }),
        },
      });

      const migratedEvents: Array<[number, number]> = [];
      sys2.on('migrated', (from, to) => migratedEvents.push([from, to]));

      const data = sys2.load();
      expect(data.level).toBe(3);
      expect(data.score).toBe(50);
      expect(data.name).toBe('Migrated');
      expect(migratedEvents).toEqual([[1, 2]]);
    });

    it('should fallback to defaults on migration error and emit error event', () => {
      const sharedStorage = new TestStorage();

      // Write a v1 save
      const sys1 = new SaveSystem<any>({
        key: 'err-save',
        version: 1,
        defaults: { score: 0 },
        storage: sharedStorage,
      });
      sys1.save({ score: 42 });

      // Open with v2 + a migration that throws
      const sys2 = new SaveSystem<any>({
        key: 'err-save',
        version: 2,
        defaults: { score: 0, level: 1, name: 'Player' },
        storage: sharedStorage,
        migrations: {
          1: (_old: any) => { throw new Error('migration exploded'); },
        },
      });

      const errors: Error[] = [];
      sys2.on('error', (e) => errors.push(e));

      const data = sys2.load();
      expect(data).toEqual({ score: 0, level: 1, name: 'Player' });
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('migration exploded');
    });

    it('chains migrations sequentially from v1 to v3', () => {
      const sharedStorage = new TestStorage();

      // Write a v1 save
      const sys1 = new SaveSystem<any>({
        key: 'chain-save',
        version: 1,
        defaults: { score: 0 },
        storage: sharedStorage,
      });
      sys1.save({ score: 10 });

      const migratedEvents: Array<[number, number]> = [];

      const sys3 = new SaveSystem<any>({
        key: 'chain-save',
        version: 3,
        defaults: { score: 0, level: 1, bonus: 0 },
        storage: sharedStorage,
        migrations: {
          1: (old: any) => ({ ...old, level: 1 }),             // v1 → v2
          2: (old: any) => ({ ...old, bonus: old.score * 2 }), // v2 → v3
        },
      });

      sys3.on('migrated', (from, to) => migratedEvents.push([from, to]));

      const data = sys3.load();
      expect(data.score).toBe(10);
      expect(data.level).toBe(1);
      expect(data.bonus).toBe(20);
      expect(migratedEvents).toEqual([[1, 2], [2, 3]]);
    });
  });

  describe('export', () => {
    it('returns JSON string of current data', () => {
      const sys = makeSystem();
      sys.load();
      sys.set('score', 77);
      const exported = sys.export();
      const parsed = JSON.parse(exported);
      expect(parsed.score).toBe(77);
    });
  });

  describe('error handling', () => {
    it('returns defaults and emits error on invalid JSON in storage', () => {
      // Inject a storage that returns invalid JSON
      const badStorage: TestStorage = {
        getItem: (_key: string) => '{ this is: NOT valid JSON !!!',
        setItem: (_key: string, _value: string) => {},
        removeItem: (_key: string) => {},
      } as any;

      const sys = makeSystem({ storage: badStorage } as any);
      const errors: Error[] = [];
      sys.on('error', (e) => errors.push(e));

      const data = sys.load();
      expect(data).toEqual({ score: 0, level: 1, name: 'Player' });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(Error);
    });
  });

  describe('events', () => {
    it('emits "saved" when save() is called', () => {
      const sys = makeSystem();
      const events: any[] = [];
      sys.on('saved', (d) => events.push(d));
      sys.save({ score: 10, level: 1, name: 'X' });
      expect(events).toHaveLength(1);
      expect(events[0].score).toBe(10);
    });

    it('emits "loaded" when load() is called', () => {
      const sys = makeSystem();
      const events: any[] = [];
      sys.on('loaded', (d) => events.push(d));
      sys.load();
      expect(events).toHaveLength(1);
    });

    it('emits "reset" when reset() is called', () => {
      const sys = makeSystem();
      let fired = false;
      sys.on('reset', () => { fired = true; });
      sys.reset();
      expect(fired).toBe(true);
    });

    it('emits "migrated" during version upgrade', () => {
      const sharedStorage = new TestStorage();

      const sys1 = new SaveSystem<any>({
        key: 'evt-save',
        version: 1,
        defaults: { x: 1 },
        storage: sharedStorage,
      });
      sys1.save({ x: 1 });

      const sys2 = new SaveSystem<any>({
        key: 'evt-save',
        version: 2,
        defaults: { x: 0, y: 0 },
        storage: sharedStorage,
        migrations: { 1: (old: any) => ({ ...old, y: 99 }) },
      });

      const fired: Array<[number, number]> = [];
      sys2.on('migrated', (from, to) => fired.push([from, to]));
      sys2.load();
      expect(fired).toEqual([[1, 2]]);
    });
  });
});
