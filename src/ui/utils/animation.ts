/**
 * Animation utilities for UI components
 */

/**
 * Easing functions
 */
export const Easing = {
  linear(t: number): number {
    return t;
  },

  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  },

  easeInCubic(t: number): number {
    return t * t * t;
  },

  easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
} as const;

/**
 * Animation options
 */
export interface AnimationOptions {
  duration: number;
  easing?: (t: number) => number;
  onUpdate: (progress: number, easedProgress: number) => void;
  onComplete?: () => void;
}

/**
 * Run an animation with the given options
 */
export function animate(options: AnimationOptions): Promise<void> {
  const { duration, easing = Easing.linear, onUpdate, onComplete } = options;

  return new Promise((resolve) => {
    const startTime = Date.now();

    function tick(): void {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      onUpdate(progress, easedProgress);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        onComplete?.();
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

/**
 * Interpolate between two values
 */
export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/**
 * Common animation presets
 */
export const AnimationPresets = {
  fadeIn(target: { alpha: number }, duration = 300): Promise<void> {
    return animate({
      duration,
      easing: Easing.easeOutCubic,
      onUpdate: (_, eased) => {
        target.alpha = eased;
      },
    });
  },

  fadeOut(target: { alpha: number }, duration = 200): Promise<void> {
    return animate({
      duration,
      easing: Easing.easeOutCubic,
      onUpdate: (_, eased) => {
        target.alpha = 1 - eased;
      },
    });
  },

  slideX(
    target: { x: number },
    from: number,
    to: number,
    duration = 300
  ): Promise<void> {
    target.x = from;
    return animate({
      duration,
      easing: Easing.easeOutCubic,
      onUpdate: (_, eased) => {
        target.x = lerp(from, to, eased);
      },
    });
  },

  slideY(
    target: { y: number },
    from: number,
    to: number,
    duration = 300
  ): Promise<void> {
    target.y = from;
    return animate({
      duration,
      easing: Easing.easeOutCubic,
      onUpdate: (_, eased) => {
        target.y = lerp(from, to, eased);
      },
    });
  },

  scaleIn(
    target: { scale: { x: number; y: number }; alpha: number },
    duration = 250
  ): Promise<void> {
    target.scale.x = 0.8;
    target.scale.y = 0.8;
    target.alpha = 0;

    return animate({
      duration,
      easing: Easing.easeOutBack,
      onUpdate: (progress, eased) => {
        const scale = lerp(0.8, 1, eased);
        target.scale.x = scale;
        target.scale.y = scale;
        target.alpha = progress;
      },
    });
  },

  scaleOut(
    target: { scale: { x: number; y: number }; alpha: number },
    duration = 200
  ): Promise<void> {
    return animate({
      duration,
      easing: Easing.easeInCubic,
      onUpdate: (progress, eased) => {
        const scale = lerp(1, 0.8, eased);
        target.scale.x = scale;
        target.scale.y = scale;
        target.alpha = 1 - progress;
      },
    });
  },
} as const;
