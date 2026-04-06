/**
 * @jest-environment jsdom
 */

import { GameConfigStore, createGameConfig } from '../../../src/config/GameConfigStore';

interface TestConfig {
  speed: number;
  lives: number;
  spawnRate: number;
  label: string;
}

const DEFAULT: TestConfig = {
  speed: 100,
  lives: 3,
  spawnRate: 2,
  label: 'normal'
};

describe('GameConfigStore', () => {
  describe('get / set', () => {
    it('should return default values on creation', () => {
      const store = new GameConfigStore(DEFAULT);

      expect(store.get('speed')).toBe(100);
      expect(store.get('lives')).toBe(3);
      expect(store.get('label')).toBe('normal');
    });

    it('should update value with set', () => {
      const store = new GameConfigStore(DEFAULT);

      store.set('speed', 200);

      expect(store.get('speed')).toBe(200);
    });

    it('should emit changed event with correct args on set', () => {
      const store = new GameConfigStore(DEFAULT);
      const handler = jest.fn();
      store.on('changed', handler);

      store.set('lives', 5);

      expect(handler).toHaveBeenCalledWith('lives', 5, 3);
    });
  });

  describe('values', () => {
    it('should expose current config as a readonly snapshot', () => {
      const store = new GameConfigStore(DEFAULT);
      store.set('speed', 150);

      const vals = store.values;

      expect(vals.speed).toBe(150);
      expect(vals.lives).toBe(3);
    });

    it('should reflect the latest state after multiple sets', () => {
      const store = new GameConfigStore(DEFAULT);

      store.set('speed', 300);
      store.set('lives', 1);

      expect(store.values.speed).toBe(300);
      expect(store.values.lives).toBe(1);
    });
  });

  describe('applyDifficulty', () => {
    it('should scale numeric values using defaults ^ level compound formula', () => {
      const store = new GameConfigStore(DEFAULT);

      // level 2, factor 1.5 => speed = 100 * (1.5^2) = 225
      store.applyDifficulty(2, { speed: 1.5 });

      expect(store.get('speed')).toBeCloseTo(225, 5);
    });

    it('should compound from original defaults even after prior set', () => {
      const store = new GameConfigStore(DEFAULT);
      store.set('speed', 999); // override, should be ignored for scaling base

      store.applyDifficulty(1, { speed: 2 });

      // Default speed is 100, so 100 * 2^1 = 200
      expect(store.get('speed')).toBe(200);
    });

    it('should not scale non-numeric keys', () => {
      const store = new GameConfigStore(DEFAULT);

      // label is a string — should be silently skipped
      expect(() => store.applyDifficulty(1, { label: 2 as any })).not.toThrow();
      expect(store.get('label')).toBe('normal');
    });

    it('should apply scaling to multiple keys at once', () => {
      const store = new GameConfigStore(DEFAULT);

      store.applyDifficulty(1, { speed: 1.2, spawnRate: 1.5 });

      expect(store.get('speed')).toBeCloseTo(120, 5);
      expect(store.get('spawnRate')).toBeCloseTo(3, 5);
    });
  });

  describe('reset', () => {
    it('should restore all values to defaults', () => {
      const store = new GameConfigStore(DEFAULT);
      store.set('speed', 500);
      store.set('lives', 10);

      store.reset();

      expect(store.get('speed')).toBe(100);
      expect(store.get('lives')).toBe(3);
    });

    it('should emit changed events for each key that was different', () => {
      const store = new GameConfigStore(DEFAULT);
      store.set('speed', 999);
      const handler = jest.fn();
      store.on('changed', handler);

      store.reset();

      expect(handler).toHaveBeenCalledWith('speed', 100, 999);
    });

    it('should not emit changed for keys that already match defaults', () => {
      const store = new GameConfigStore(DEFAULT);
      // Only change speed
      store.set('speed', 999);
      const handler = jest.fn();
      store.on('changed', handler);

      store.reset();

      // lives/spawnRate/label already equal defaults — should not emit
      const keys = handler.mock.calls.map(([k]) => k);
      expect(keys).toEqual(['speed']);
    });
  });

  describe('createGameConfig factory', () => {
    it('should return a GameConfigStore instance', () => {
      const store = createGameConfig({ level: 1, score: 0 });

      expect(store).toBeInstanceOf(GameConfigStore);
    });

    it('should initialise with provided defaults', () => {
      const store = createGameConfig({ level: 5, multiplier: 2.5 });

      expect(store.get('level')).toBe(5);
      expect(store.get('multiplier')).toBe(2.5);
    });

    it('should be independent of the original defaults object', () => {
      const defaults = { hp: 100 };
      const store = createGameConfig(defaults);

      defaults.hp = 999; // mutate original

      expect(store.get('hp')).toBe(100); // store must be unaffected
    });
  });
});
