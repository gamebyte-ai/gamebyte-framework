/**
 * Ease — Collection of easing functions for tween animations.
 *
 * All functions accept a normalized time `t` in [0, 1] and return a
 * transformed value in approximately [0, 1] (some overshoot past 1).
 *
 * Performance: pure math, no allocations.
 */

export type EasingFunction = (t: number) => number;

const _c1 = 1.70158;
const _c2 = _c1 * 1.525;
const _c3 = _c1 + 1;
const _c4 = (2 * Math.PI) / 3;
const _c5 = (2 * Math.PI) / 4.5;

export const Ease = {
  // ---- Linear ----
  linear: (t: number): number => t,

  // ---- Quadratic ----
  quadIn: (t: number): number => t * t,
  quadOut: (t: number): number => 1 - (1 - t) * (1 - t),
  quadInOut: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  // ---- Cubic ----
  cubicIn: (t: number): number => t * t * t,
  cubicOut: (t: number): number => 1 - Math.pow(1 - t, 3),
  cubicInOut: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // ---- Quartic ----
  quartIn: (t: number): number => t * t * t * t,
  quartOut: (t: number): number => 1 - Math.pow(1 - t, 4),
  quartInOut: (t: number): number =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,

  // ---- Sine ----
  sineIn: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t: number): number => Math.sin((t * Math.PI) / 2),
  sineInOut: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,

  // ---- Exponential ----
  expoIn: (t: number): number => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  expoOut: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoInOut: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // ---- Circular ----
  circIn: (t: number): number => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  circOut: (t: number): number => Math.sqrt(1 - Math.pow(t - 1, 2)),
  circInOut: (t: number): number =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // ---- Back (overshoot) ----
  backIn: (t: number): number => _c3 * t * t * t - _c1 * t * t,
  backOut: (t: number): number =>
    1 + _c3 * Math.pow(t - 1, 3) + _c1 * Math.pow(t - 1, 2),
  backInOut: (t: number): number =>
    t < 0.5
      ? (Math.pow(2 * t, 2) * ((_c2 + 1) * 2 * t - _c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((_c2 + 1) * (2 * t - 2) + _c2) + 2) / 2,

  // ---- Elastic (spring) ----
  elasticIn: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * _c4);
  },
  elasticOut: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * _c4) + 1;
  },
  elasticInOut: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * _c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * _c5)) / 2 + 1;
  },

  // ---- Bounce ----
  bounceOut: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      t -= 1.5 / d1;
      return n1 * t * t + 0.75;
    } else if (t < 2.5 / d1) {
      t -= 2.25 / d1;
      return n1 * t * t + 0.9375;
    } else {
      t -= 2.625 / d1;
      return n1 * t * t + 0.984375;
    }
  },
  bounceIn: (t: number): number => 1 - Ease.bounceOut(1 - t),
  bounceInOut: (t: number): number =>
    t < 0.5
      ? (1 - Ease.bounceOut(1 - 2 * t)) / 2
      : (1 + Ease.bounceOut(2 * t - 1)) / 2,
} as const;
