import { TimeScale } from '../../../src/juice/TimeScale.js';

describe('TimeScale', () => {
  let ts: TimeScale;

  beforeEach(() => {
    ts = new TimeScale();
  });

  test('initial scale is 1', () => {
    expect(ts.scale).toBe(1);
  });

  test('set() changes scale immediately', () => {
    ts.set(0.5);
    expect(ts.scale).toBe(0.5);
  });

  test('set() emits changed event', () => {
    const spy = jest.fn();
    ts.on('changed', spy);
    ts.set(2);
    expect(spy).toHaveBeenCalledWith(2);
  });

  test('set() clears any pending restore timer', () => {
    ts.setTemporary(0.5, 500);
    ts.set(2);
    // After set(), update should not trigger restore
    ts.update(1); // 1 second = 1000ms, far past 500ms
    expect(ts.scale).toBe(2); // should remain at 2, no restore
  });

  test('setTemporary() sets scale and restores after duration', () => {
    const restoredSpy = jest.fn();
    ts.on('restored', restoredSpy);

    ts.setTemporary(0.1, 100);
    expect(ts.scale).toBe(0.1);

    // Advance 50ms — should still be 0.1
    ts.update(0.05);
    expect(ts.scale).toBe(0.1);

    // Advance another 60ms (total 110ms) — should be restored
    ts.update(0.06);
    expect(ts.scale).toBe(1);
    expect(restoredSpy).toHaveBeenCalled();
  });

  test('freeze() sets scale near zero', () => {
    ts.freeze(80);
    expect(ts.scale).toBeLessThanOrEqual(0.01);
    expect(ts.scale).toBeGreaterThan(0);
  });

  test('freeze() restores to 1 after duration', () => {
    ts.freeze(50);
    ts.update(0.1); // 100ms > 50ms freeze
    expect(ts.scale).toBe(1);
  });

  test('slowMo() sets scale to 0.2 by default', () => {
    ts.slowMo(200);
    expect(ts.scale).toBeCloseTo(0.2);
  });

  test('slowMo() accepts custom scale', () => {
    ts.slowMo(200, 0.4);
    expect(ts.scale).toBeCloseTo(0.4);
  });

  test('apply() multiplies dt by current scale', () => {
    ts.set(0.5);
    expect(ts.apply(1 / 60)).toBeCloseTo(0.5 / 60);
  });

  test('apply() returns dt unchanged when scale is 1', () => {
    const dt = 1 / 60;
    expect(ts.apply(dt)).toBeCloseTo(dt);
  });

  test('update() decrements restore timer', () => {
    // setTemporary with 300ms, advance 100ms — timer not yet expired
    ts.setTemporary(0.2, 300);
    ts.update(0.1); // 100ms
    expect(ts.scale).toBeCloseTo(0.2); // still in slow-mo
  });

  test('easeBack lerps scale back to 1.0', () => {
    ts.setTemporary(0.2, 100, true);

    // Exhaust the hold phase
    ts.update(0.11); // 110ms > 100ms hold

    // Scale should now be easing back (between 0.2 and 1)
    expect(ts.scale).toBeGreaterThan(0.2);
    expect(ts.scale).toBeLessThanOrEqual(1);
  });

  test('easeBack completes and emits restored', () => {
    const restoredSpy = jest.fn();
    ts.on('restored', restoredSpy);

    ts.setTemporary(0.2, 50, true);
    ts.update(0.06);   // exhaust hold (60ms > 50ms)
    ts.update(0.25);   // exhaust ease-back (250ms > 200ms ease duration)

    expect(ts.scale).toBe(1);
    expect(restoredSpy).toHaveBeenCalled();
  });

  test('reset() restores scale to 1 and emits events', () => {
    const changedSpy = jest.fn();
    const restoredSpy = jest.fn();
    ts.on('changed', changedSpy);
    ts.on('restored', restoredSpy);

    ts.set(0.1);
    ts.reset();

    expect(ts.scale).toBe(1);
    expect(changedSpy).toHaveBeenLastCalledWith(1);
    expect(restoredSpy).toHaveBeenCalled();
  });

  test('update() is a no-op when no temporary scale is active', () => {
    ts.set(0.5);
    ts.update(10); // large dt, no restore timer
    expect(ts.scale).toBe(0.5); // unchanged
  });
});
