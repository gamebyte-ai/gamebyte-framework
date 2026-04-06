/**
 * @jest-environment jsdom
 */

import { Tween } from '../../../src/tween/Tween';
import { TweenManager } from '../../../src/tween/TweenManager';
import { Ease } from '../../../src/tween/Ease';

// ---- Helpers -------------------------------------------------------------

/** Advance TweenManager by `dt` ms for `steps` frames. */
function tick(dt: number, steps = 1): void {
  for (let i = 0; i < steps; i++) {
    TweenManager.update(dt);
  }
}

/** Advance in discrete steps summing to `total` ms. */
function tickTo(total: number, step = 16): void {
  let elapsed = 0;
  while (elapsed < total) {
    const dt = Math.min(step, total - elapsed);
    TweenManager.update(dt);
    elapsed += dt;
  }
}

// ---- Setup / teardown ----------------------------------------------------

beforeEach(() => {
  TweenManager._reset();
});

// ==========================================================================
// 1. Tween.to() interpolates properties correctly
// ==========================================================================
describe('Tween.to()', () => {
  it('interpolates numeric properties from start to end', () => {
    const obj = { x: 0, y: 0 };

    Tween.to(obj, { x: 100, y: 200 }, { duration: 100, ease: Ease.linear });

    // At t=0 (before first tick) values should still be 0
    expect(obj.x).toBe(0);

    // After 50 ms (halfway with linear ease)
    tickTo(50);
    expect(obj.x).toBeCloseTo(50, 0);
    expect(obj.y).toBeCloseTo(100, 0);

    // After full 100 ms
    tickTo(50);
    expect(obj.x).toBeCloseTo(100, 1);
    expect(obj.y).toBeCloseTo(200, 1);
  });

  it('captures start value lazily on first frame', () => {
    const obj = { x: 50 };

    // Tween created at x=50, will animate to x=150
    Tween.to(obj, { x: 150 }, { duration: 100, ease: Ease.linear });

    // Mutate target before first tick to verify lazy capture
    obj.x = 80;

    tick(50); // halfway
    // start should have been captured as 80, end = 150
    expect(obj.x).toBeCloseTo(80 + (150 - 80) * 0.5, 0);
  });
});

// ==========================================================================
// 2. Easing functions produce correct values at t=0, 0.5, 1
// ==========================================================================
describe('Ease functions', () => {
  const cases: Array<[string, (t: number) => number]> = [
    ['linear', Ease.linear],
    ['quadIn', Ease.quadIn],
    ['quadOut', Ease.quadOut],
    ['quadInOut', Ease.quadInOut],
    ['cubicIn', Ease.cubicIn],
    ['cubicOut', Ease.cubicOut],
    ['sineIn', Ease.sineIn],
    ['sineOut', Ease.sineOut],
    ['expoIn', Ease.expoIn],
    ['expoOut', Ease.expoOut],
    ['elasticOut', Ease.elasticOut],
    ['bounceOut', Ease.bounceOut],
    ['backOut', Ease.backOut],
  ];

  test.each(cases)('%s returns 0 at t=0 and 1 at t=1', (_name, fn) => {
    expect(fn(0)).toBeCloseTo(0, 5);
    expect(fn(1)).toBeCloseTo(1, 5);
  });

  it('linear returns 0.5 at t=0.5', () => {
    expect(Ease.linear(0.5)).toBeCloseTo(0.5, 5);
  });

  it('quadIn returns 0.25 at t=0.5', () => {
    expect(Ease.quadIn(0.5)).toBeCloseTo(0.25, 5);
  });

  it('quadOut returns 0.75 at t=0.5', () => {
    expect(Ease.quadOut(0.5)).toBeCloseTo(0.75, 5);
  });
});

// ==========================================================================
// 3. Delay before start
// ==========================================================================
describe('Delay', () => {
  it('does not update properties until delay has elapsed', () => {
    const obj = { x: 0 };

    Tween.to(obj, { x: 100 }, { duration: 100, ease: Ease.linear, delay: 50 });

    // 40 ms into delay — should not have started
    tick(40);
    expect(obj.x).toBe(0);

    // 50 ms delay complete, now 50 ms into duration (halfway)
    tick(60); // total 100 ms — 50 delay + 50 duration
    expect(obj.x).toBeCloseTo(50, 0);
  });
});

// ==========================================================================
// 4. Repeat count
// ==========================================================================
describe('Repeat', () => {
  it('repeats the animation the specified number of times', () => {
    const completions: number[] = [];
    let completionCount = 0;
    const obj = { x: 0 };

    Tween.to(obj, { x: 100 }, {
      duration: 100,
      ease: Ease.linear,
      repeat: 2,
      onComplete: () => completionCount++
    });

    // First pass
    tickTo(100);
    expect(obj.x).toBeCloseTo(100, 1);
    // Should have reset for second pass — not finished yet
    expect(completionCount).toBe(0);

    // Second pass
    tickTo(100);
    expect(completionCount).toBe(0);

    // Third pass (final)
    tickTo(100);
    expect(completionCount).toBe(1);
  });
});

// ==========================================================================
// 5. Yoyo (reverse on repeat)
// ==========================================================================
describe('Yoyo', () => {
  it('reverses direction on each repeat', () => {
    const obj = { x: 0 };

    Tween.to(obj, { x: 100 }, {
      duration: 100,
      ease: Ease.linear,
      repeat: 1,
      yoyo: true
    });

    // Forward pass complete
    tickTo(100);
    expect(obj.x).toBeCloseTo(100, 1);

    // Halfway through reverse pass
    tickTo(50);
    expect(obj.x).toBeCloseTo(50, 0);

    // Reverse pass complete — back to start
    tickTo(50);
    expect(obj.x).toBeCloseTo(0, 1);
  });
});

// ==========================================================================
// 6. onComplete callback fires
// ==========================================================================
describe('onComplete', () => {
  it('fires exactly once when duration elapses', () => {
    const onComplete = jest.fn();
    const obj = { x: 0 };

    Tween.to(obj, { x: 100 }, { duration: 100, ease: Ease.linear, onComplete });

    tickTo(99);
    expect(onComplete).not.toHaveBeenCalled();

    tickTo(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('fires via EventEmitter "complete" event', () => {
    const handler = jest.fn();
    const obj = { x: 0 };

    const tween = Tween.to(obj, { x: 100 }, { duration: 100 });
    tween.on('complete', handler);

    tickTo(100);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ==========================================================================
// 7. onUpdate callback fires each frame
// ==========================================================================
describe('onUpdate', () => {
  it('fires every frame while the tween is running', () => {
    const onUpdate = jest.fn();
    const obj = { x: 0 };

    Tween.to(obj, { x: 100 }, { duration: 100, ease: Ease.linear, onUpdate });

    tick(25);
    tick(25);
    tick(25);
    tick(25);

    expect(onUpdate).toHaveBeenCalledTimes(4);
  });

  it('receives eased progress values in [0, 1] range', () => {
    const values: number[] = [];
    const obj = { x: 0 };

    Tween.to(obj, { x: 100 }, {
      duration: 100,
      ease: Ease.linear,
      onUpdate: (p) => values.push(p)
    });

    tickTo(100);

    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

// ==========================================================================
// 8. Tween.sequence() plays tweens in order
// ==========================================================================
describe('Tween.sequence()', () => {
  it('plays children in order and completes after all finish', () => {
    const order: string[] = [];
    const a = { x: 0 };
    const b = { y: 0 };

    const t1 = Tween.to(a, { x: 100 }, {
      duration: 100,
      ease: Ease.linear,
      onComplete: () => order.push('t1')
    });
    const t2 = Tween.to(b, { y: 200 }, {
      duration: 100,
      ease: Ease.linear,
      onComplete: () => order.push('t2')
    });

    const seq = Tween.sequence([t1, t2]);
    const seqComplete = jest.fn();
    seq.on('complete', seqComplete);

    // After 100 ms — t1 should be done, t2 not started
    tickTo(100);
    expect(order).toEqual(['t1']);
    expect(b.y).toBe(0);
    expect(seqComplete).not.toHaveBeenCalled();

    // After another 100 ms — t2 done, sequence complete
    tickTo(100);
    expect(order).toEqual(['t1', 't2']);
    expect(b.y).toBeCloseTo(200, 1);
    expect(seqComplete).toHaveBeenCalledTimes(1);
  });
});

// ==========================================================================
// 9. Tween.parallel() plays tweens simultaneously
// ==========================================================================
describe('Tween.parallel()', () => {
  it('runs all children at the same time', () => {
    const a = { x: 0 };
    const b = { y: 0 };

    const t1 = Tween.to(a, { x: 100 }, { duration: 100, ease: Ease.linear });
    const t2 = Tween.to(b, { y: 200 }, { duration: 100, ease: Ease.linear });

    Tween.parallel([t1, t2]);

    // After 50 ms both should be at halfway
    tickTo(50);
    expect(a.x).toBeCloseTo(50, 0);
    expect(b.y).toBeCloseTo(100, 0);
  });

  it('completes when the longest child finishes', () => {
    const a = { x: 0 };
    const b = { y: 0 };

    const completions: string[] = [];

    const t1 = Tween.to(a, { x: 100 }, {
      duration: 50,
      ease: Ease.linear,
      onComplete: () => completions.push('t1')
    });
    const t2 = Tween.to(b, { y: 200 }, {
      duration: 150,
      ease: Ease.linear,
      onComplete: () => completions.push('t2')
    });

    const par = Tween.parallel([t1, t2]);
    const parComplete = jest.fn();
    par.on('complete', parComplete);

    tickTo(50);
    expect(completions).toContain('t1');
    expect(parComplete).not.toHaveBeenCalled();

    tickTo(100);
    expect(completions).toContain('t2');
    expect(parComplete).toHaveBeenCalledTimes(1);
  });
});

// ==========================================================================
// 10. pause / resume
// ==========================================================================
describe('pause / resume', () => {
  it('stops animation while paused and resumes from where it left off', () => {
    const obj = { x: 0 };

    const tween = Tween.to(obj, { x: 100 }, { duration: 100, ease: Ease.linear });

    tickTo(40);
    const xAtPause = obj.x;
    expect(xAtPause).toBeCloseTo(40, 0);

    tween.pause();

    // Ticking while paused should not move x
    tickTo(30);
    expect(obj.x).toBeCloseTo(xAtPause, 1);

    // Resume and advance the remaining 60 ms
    tween.resume();
    tickTo(60);
    expect(obj.x).toBeCloseTo(100, 1);
  });

  it('emits pause and resume events', () => {
    const pauseHandler = jest.fn();
    const resumeHandler = jest.fn();
    const obj = { x: 0 };

    const tween = Tween.to(obj, { x: 100 }, { duration: 100 });
    tween.on('pause', pauseHandler);
    tween.on('resume', resumeHandler);

    tween.pause();
    expect(pauseHandler).toHaveBeenCalledTimes(1);

    tween.resume();
    expect(resumeHandler).toHaveBeenCalledTimes(1);
  });
});

// ==========================================================================
// 11. TweenManager.killTweensOf removes target's tweens
// ==========================================================================
describe('TweenManager.killTweensOf()', () => {
  it('removes all tweens associated with a specific target', () => {
    const a = { x: 0 };
    const b = { y: 0 };

    Tween.to(a, { x: 100 }, { duration: 100, ease: Ease.linear });
    Tween.to(b, { y: 100 }, { duration: 100, ease: Ease.linear });

    expect(TweenManager.activeCount).toBe(2);

    TweenManager.killTweensOf(a);

    expect(TweenManager.activeCount).toBe(1);

    // b's tween should still progress
    tickTo(50);
    expect(b.y).toBeCloseTo(50, 0);
    // a's tween should not have moved
    expect(a.x).toBe(0);
  });
});

// ==========================================================================
// 12. stop() removes tween without firing onComplete
// ==========================================================================
describe('Tween.stop()', () => {
  it('removes the tween without triggering onComplete', () => {
    const onComplete = jest.fn();
    const obj = { x: 0 };

    const tween = Tween.to(obj, { x: 100 }, {
      duration: 100,
      ease: Ease.linear,
      onComplete
    });

    tickTo(40);
    tween.stop();

    // Further ticks should not move x
    const xAtStop = obj.x;
    tickTo(100);
    expect(obj.x).toBeCloseTo(xAtStop, 1);

    // onComplete must not have fired
    expect(onComplete).not.toHaveBeenCalled();
    expect(TweenManager.activeCount).toBe(0);
  });

  it('emits the stop event', () => {
    const stopHandler = jest.fn();
    const obj = { x: 0 };

    const tween = Tween.to(obj, { x: 100 }, { duration: 100 });
    tween.on('stop', stopHandler);

    tween.stop();
    expect(stopHandler).toHaveBeenCalledTimes(1);
  });
});

// ==========================================================================
// Bonus: Tween.from() animates from given values to current
// ==========================================================================
describe('Tween.from()', () => {
  it('animates from provided values to original target values', () => {
    const obj = { alpha: 1 };

    Tween.from(obj, { alpha: 0 }, { duration: 100, ease: Ease.linear });

    // Immediately after creation target should be set to from-value
    expect(obj.alpha).toBeCloseTo(0, 5);

    // Halfway: should be at 0.5
    tickTo(50);
    expect(obj.alpha).toBeCloseTo(0.5, 0);

    // End: back to original 1
    tickTo(50);
    expect(obj.alpha).toBeCloseTo(1, 1);
  });
});

// ==========================================================================
// Bonus: TweenManager.activeCount tracks correctly
// ==========================================================================
describe('TweenManager.activeCount', () => {
  it('increments on add and decrements on complete', () => {
    const obj = { x: 0 };

    expect(TweenManager.activeCount).toBe(0);

    Tween.to(obj, { x: 100 }, { duration: 100 });
    expect(TweenManager.activeCount).toBe(1);

    tickTo(100);
    // After completion and compact
    TweenManager.update(0); // trigger compact
    expect(TweenManager.activeCount).toBe(0);
  });

  it('killAll clears all tweens', () => {
    const a = { x: 0 };
    const b = { x: 0 };

    Tween.to(a, { x: 100 }, { duration: 100 });
    Tween.to(b, { x: 100 }, { duration: 100 });

    expect(TweenManager.activeCount).toBe(2);
    TweenManager.killAll();
    expect(TweenManager.activeCount).toBe(0);
  });
});
