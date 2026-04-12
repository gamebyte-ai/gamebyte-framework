/**
 * @jest-environment jsdom
 */

/**
 * ComboTracker unit tests.
 * No external dependencies — pure logic, EventEmitter3 only.
 */

import { ComboTracker } from '../../../src/juice/ComboTracker';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ComboTracker.hit()', () => {
  it('increments count on each hit', () => {
    const tracker = new ComboTracker();
    tracker.hit();
    tracker.hit();
    tracker.hit();
    expect(tracker.count).toBe(3);
  });

  it('returns the new count', () => {
    const tracker = new ComboTracker();
    expect(tracker.hit()).toBe(1);
    expect(tracker.hit()).toBe(2);
  });

  it('emits "hit" event with count and multiplier', () => {
    const tracker = new ComboTracker();
    const listener = jest.fn();
    tracker.on('hit', listener);
    tracker.hit();
    expect(listener).toHaveBeenCalledWith(1, 1); // count=1, multiplier=1+floor(1/10)*0.5=1
  });

  it('emits "milestone" event when count crosses a milestone', () => {
    const tracker = new ComboTracker({ milestones: [5] });
    const milestone = jest.fn();
    tracker.on('milestone', milestone);
    for (let i = 0; i < 4; i++) tracker.hit();
    expect(milestone).not.toHaveBeenCalled();
    tracker.hit(); // count = 5
    expect(milestone).toHaveBeenCalledWith(5);
  });

  it('resets timer on each hit keeping combo alive', () => {
    const tracker = new ComboTracker({ timeout: 500 });
    tracker.hit();
    tracker.update(400); // close to timeout
    tracker.hit();       // reset timer
    tracker.update(400); // should NOT break — timer reset to 500
    expect(tracker.isActive).toBe(true);
    expect(tracker.count).toBe(2);
  });
});

describe('ComboTracker.update()', () => {
  it('breaks combo when timeout elapses', () => {
    const tracker = new ComboTracker({ timeout: 1000 });
    const onBreak = jest.fn();
    tracker.on('break', onBreak);
    tracker.hit();
    tracker.update(1001);
    expect(tracker.count).toBe(0);
    expect(tracker.isActive).toBe(false);
    expect(onBreak).toHaveBeenCalledWith(1);
  });

  it('emits "break" with the final count', () => {
    const tracker = new ComboTracker({ timeout: 100 });
    const onBreak = jest.fn();
    tracker.on('break', onBreak);
    tracker.hit();
    tracker.hit();
    tracker.hit();
    tracker.update(200);
    expect(onBreak).toHaveBeenCalledWith(3);
  });

  it('does nothing when count is 0', () => {
    const tracker = new ComboTracker({ timeout: 100 });
    const onBreak = jest.fn();
    tracker.on('break', onBreak);
    tracker.update(500); // no active combo
    expect(onBreak).not.toHaveBeenCalled();
  });
});

describe('ComboTracker.multiplier', () => {
  it('returns 1x at counts below 10', () => {
    const tracker = new ComboTracker();
    for (let i = 0; i < 9; i++) tracker.hit();
    expect(tracker.multiplier).toBe(1);
  });

  it('returns 1.5x at 10 hits', () => {
    const tracker = new ComboTracker({ timeout: 999999 });
    for (let i = 0; i < 10; i++) tracker.hit();
    expect(tracker.multiplier).toBe(1.5);
  });

  it('returns 2x at 20 hits', () => {
    const tracker = new ComboTracker({ timeout: 999999 });
    for (let i = 0; i < 20; i++) tracker.hit();
    expect(tracker.multiplier).toBe(2);
  });
});

describe('ComboTracker.reset()', () => {
  it('clears count and timer without emitting "break"', () => {
    const tracker = new ComboTracker();
    const onBreak = jest.fn();
    tracker.on('break', onBreak);
    tracker.hit();
    tracker.reset();
    expect(tracker.count).toBe(0);
    expect(tracker.isActive).toBe(false);
    expect(onBreak).not.toHaveBeenCalled();
  });
});

describe('ComboTracker.isActive', () => {
  it('is false initially', () => {
    expect(new ComboTracker().isActive).toBe(false);
  });

  it('becomes true after a hit', () => {
    const tracker = new ComboTracker();
    tracker.hit();
    expect(tracker.isActive).toBe(true);
  });

  it('becomes false again after reset', () => {
    const tracker = new ComboTracker();
    tracker.hit();
    tracker.reset();
    expect(tracker.isActive).toBe(false);
  });
});
