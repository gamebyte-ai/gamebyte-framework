/**
 * @jest-environment jsdom
 */

import { ObjectPool } from '../../../src/pool/ObjectPool';

interface TestItem {
  id: number;
  value: string;
  active: boolean;
}

let _nextId = 0;
function makeItem(): TestItem {
  return { id: _nextId++, value: 'default', active: false };
}

describe('ObjectPool', () => {
  beforeEach(() => {
    _nextId = 0;
  });

  describe('pre-warm / initialSize', () => {
    it('should pre-create initialSize items in the available pool', () => {
      const pool = new ObjectPool({
        create: makeItem,
        initialSize: 5
      });

      expect(pool.availableCount).toBe(5);
      expect(pool.activeCount).toBe(0);
      expect(pool.totalCreated).toBe(5);
    });

    it('should default to initialSize 10 when not specified', () => {
      const pool = new ObjectPool({ create: makeItem });

      expect(pool.availableCount).toBe(10);
    });
  });

  describe('acquire / release cycle', () => {
    it('should move item from available to active on acquire', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 3 });

      const item = pool.acquire();

      expect(pool.availableCount).toBe(2);
      expect(pool.activeCount).toBe(1);
      expect(item).toBeDefined();
    });

    it('should move item from active to available on release', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 3 });

      const item = pool.acquire();
      pool.release(item);

      expect(pool.availableCount).toBe(3);
      expect(pool.activeCount).toBe(0);
    });

    it('should create new items when pool is exhausted (under maxSize)', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 2, maxSize: 10 });

      // Exhaust pre-warmed items
      pool.acquire();
      pool.acquire();
      // This one requires a new allocation
      const third = pool.acquire();

      expect(third).toBeDefined();
      expect(pool.totalCreated).toBe(3);
    });

    it('should return the same object reference after release + re-acquire', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 1 });

      const item = pool.acquire();
      pool.release(item);
      const reacquired = pool.acquire();

      expect(reacquired).toBe(item);
    });
  });

  describe('reset callback', () => {
    it('should call reset on release', () => {
      const resetFn = jest.fn((item: TestItem) => {
        item.value = 'reset';
        item.active = false;
      });
      const pool = new ObjectPool({ create: makeItem, reset: resetFn, initialSize: 1 });

      const item = pool.acquire();
      item.value = 'dirty';
      pool.release(item);

      expect(resetFn).toHaveBeenCalledWith(item);
      expect(item.value).toBe('reset');
    });

    it('should not call reset if reset function is not provided', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 1 });

      const item = pool.acquire();
      item.value = 'dirty';
      // Should not throw
      expect(() => pool.release(item)).not.toThrow();
    });
  });

  describe('maxSize', () => {
    it('should not exceed maxSize total items created', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 2, maxSize: 3 });

      const a = pool.acquire();
      const b = pool.acquire();
      const c = pool.acquire();

      expect(pool.totalCreated).toBe(3);
      expect(pool.activeCount).toBe(3);

      // Releasing c and re-acquiring should reuse, not create
      pool.release(c);
      pool.acquire();

      expect(pool.totalCreated).toBe(3);
    });
  });

  describe('releaseAll', () => {
    it('should move all active items back to available', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 0, maxSize: 50 });

      pool.acquire();
      pool.acquire();
      pool.acquire();

      expect(pool.activeCount).toBe(3);

      pool.releaseAll();

      expect(pool.activeCount).toBe(0);
      expect(pool.availableCount).toBe(3);
    });
  });

  describe('stats tracking', () => {
    it('should track totalCreated accurately across multiple operations', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 2, maxSize: 10 });

      const a = pool.acquire(); // reuses pool
      const b = pool.acquire(); // reuses pool
      const c = pool.acquire(); // new creation
      pool.release(a);
      pool.acquire(); // reuses a — no new creation

      expect(pool.totalCreated).toBe(3); // 2 pre-warm + 1 on-demand
    });
  });

  describe('destroy', () => {
    it('should clear both active and available collections', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 5 });

      pool.acquire();
      pool.acquire();

      pool.destroy();

      expect(pool.activeCount).toBe(0);
      expect(pool.availableCount).toBe(0);
    });
  });

  describe('unlimited pool (maxSize: 0)', () => {
    it('should create items without cap when maxSize is 0', () => {
      const pool = new ObjectPool({ create: makeItem, initialSize: 0, maxSize: 0 });

      for (let i = 0; i < 20; i++) {
        pool.acquire();
      }

      expect(pool.activeCount).toBe(20);
      expect(pool.totalCreated).toBe(20);
    });
  });
});
