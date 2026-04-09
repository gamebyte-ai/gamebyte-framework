import { UnsubscribeBag } from '../../../src/utils/UnsubscribeBag';

describe('UnsubscribeBag', () => {
  it('should flush callbacks in LIFO order', () => {
    const order: number[] = [];
    const bag = new UnsubscribeBag();
    bag.add(() => order.push(1));
    bag.add(() => order.push(2));
    bag.add(() => order.push(3));
    bag.flush();
    expect(order).toEqual([3, 2, 1]);
  });

  it('should ignore null/undefined adds', () => {
    const bag = new UnsubscribeBag();
    bag.add(null);
    bag.add(undefined);
    expect(bag.count).toBe(0);
    expect(() => bag.flush()).not.toThrow();
  });

  it('should continue flushing on callback error', () => {
    const called: number[] = [];
    const bag = new UnsubscribeBag();
    bag.add(() => called.push(1));
    bag.add(() => { throw new Error('boom'); });
    bag.add(() => called.push(3));
    expect(() => bag.flush()).not.toThrow();
    expect(called).toContain(1);
    expect(called).toContain(3);
  });

  it('should be idempotent (second flush is no-op)', () => {
    const called = jest.fn();
    const bag = new UnsubscribeBag();
    bag.add(called);
    bag.flush();
    bag.flush();
    expect(called).toHaveBeenCalledTimes(1);
    expect(bag.count).toBe(0);
  });

  it('should track count', () => {
    const bag = new UnsubscribeBag();
    expect(bag.count).toBe(0);
    bag.add(() => {});
    expect(bag.count).toBe(1);
    bag.add(() => {});
    expect(bag.count).toBe(2);
    bag.flush();
    expect(bag.count).toBe(0);
  });

  it('should return the added callback', () => {
    const bag = new UnsubscribeBag();
    const fn = jest.fn();
    const returned = bag.add(fn);
    expect(returned).toBe(fn);
  });

  it('should return a no-op for null/undefined add', () => {
    const bag = new UnsubscribeBag();
    const noop = bag.add(null);
    expect(typeof noop).toBe('function');
    expect(() => noop()).not.toThrow();
  });
});
