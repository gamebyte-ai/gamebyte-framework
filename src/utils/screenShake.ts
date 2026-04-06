/**
 * Screen Shake Utility
 *
 * Applies a camera/container shake effect using requestAnimationFrame.
 * Supports linear and exponential decay, directional constraints, and
 * concurrent shake protection via WeakMap tracking.
 *
 * @example
 * ```typescript
 * // Simple usage
 * screenShake(gameContainer, 10, 400);
 *
 * // Config usage
 * screenShake({ target: gameContainer, intensity: 12, duration: 500, decay: 'linear', direction: 'horizontal' });
 * ```
 */

export interface ScreenShakeConfig {
  /** Target container to shake */
  target: any; // Container with x/y properties
  /** Intensity in pixels (default: 8) */
  intensity?: number;
  /** Duration in milliseconds (default: 300) */
  duration?: number;
  /** Decay type (default: 'exponential') */
  decay?: 'linear' | 'exponential';
  /** Direction constraint (default: 'both') */
  direction?: 'horizontal' | 'vertical' | 'both';
}

/** Default shake configuration values */
const DEFAULTS = {
  intensity: 8,
  duration: 300,
  decay: 'exponential' as const,
  direction: 'both' as const,
};

/**
 * Tracks active shake state per target to prevent stacking and allow cleanup.
 * WeakMap ensures no memory leaks when targets are garbage collected.
 */
const activeShakes = new WeakMap<object, { rafId: number; originalX: number; originalY: number }>();

/**
 * Apply a screen shake effect to a container.
 *
 * Two overload signatures:
 * - `screenShake(target, intensity?, duration?)` — simple form
 * - `screenShake(config)` — full config form
 */
export function screenShake(target: any, intensity?: number, duration?: number): void;
export function screenShake(config: ScreenShakeConfig): void;
export function screenShake(targetOrConfig: any, intensity?: number, duration?: number): void {
  // Resolve overload — if first arg has a `.target` property treat it as config
  let config: Required<ScreenShakeConfig>;

  if (targetOrConfig !== null && typeof targetOrConfig === 'object' && 'target' in targetOrConfig) {
    const c = targetOrConfig as ScreenShakeConfig;
    config = {
      target: c.target,
      intensity: c.intensity ?? DEFAULTS.intensity,
      duration: c.duration ?? DEFAULTS.duration,
      decay: c.decay ?? DEFAULTS.decay,
      direction: c.direction ?? DEFAULTS.direction,
    };
  } else {
    config = {
      target: targetOrConfig,
      intensity: intensity ?? DEFAULTS.intensity,
      duration: duration ?? DEFAULTS.duration,
      decay: DEFAULTS.decay,
      direction: DEFAULTS.direction,
    };
  }

  const { target, intensity: intensityVal, duration: durationVal, decay, direction } = config;

  if (!target || typeof target !== 'object') return;

  // If this target is already shaking, cancel the previous shake and restore position
  const existing = activeShakes.get(target);
  if (existing) {
    cancelAnimationFrame(existing.rafId);
    target.x = existing.originalX;
    target.y = existing.originalY;
    activeShakes.delete(target);
  }

  const originalX = target.x;
  const originalY = target.y;
  let startTime: number | null = null;

  const shakeState = { rafId: 0, originalX, originalY };
  activeShakes.set(target, shakeState);

  function step(timestamp: number): void {
    if (startTime === null) startTime = timestamp;

    const elapsed = timestamp - startTime;

    if (elapsed >= durationVal) {
      // Shake complete — restore position and clean up
      target.x = originalX;
      target.y = originalY;
      activeShakes.delete(target);
      return;
    }

    const progress = elapsed / durationVal;
    let decayFactor: number;

    if (decay === 'linear') {
      decayFactor = 1 - progress;
    } else {
      // exponential — more dramatic falloff
      decayFactor = Math.pow(1 - progress, 2);
    }

    const offsetX = (Math.random() * 2 - 1) * intensityVal * decayFactor;
    const offsetY = (Math.random() * 2 - 1) * intensityVal * decayFactor;

    if (direction === 'horizontal' || direction === 'both') {
      target.x = originalX + offsetX;
    }

    if (direction === 'vertical' || direction === 'both') {
      target.y = originalY + offsetY;
    }

    shakeState.rafId = requestAnimationFrame(step);
  }

  shakeState.rafId = requestAnimationFrame(step);
}
