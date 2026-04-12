/**
 * SquashStretch — Squash and stretch animation helpers.
 *
 * Static utility. All methods are fire-and-forget and self-clean via Tween
 * lifecycle. Requires the target to have a `scale` object with `x` and `y`.
 */

import { Tween } from '../tween/Tween.js';
import { Ease } from '../tween/Ease.js';

export class SquashStretch {
  /**
   * Squash — compress the object wide and short (on impact).
   * Returns to original size with a bounce.
   *
   * @param target     - Object with `scale.x` / `scale.y`
   * @param intensity  - Deformation amount (default: 0.3)
   * @param durationMs - Total animation duration in ms (default: 100)
   */
  static squash(target: any, intensity: number = 0.3, durationMs: number = 100): void {
    if (!target?.scale) return;

    const origX: number = target.scale.x ?? 1;
    const origY: number = target.scale.y ?? 1;
    const half = durationMs / 2;

    Tween.to(target.scale, { x: origX * (1 + intensity), y: origY * (1 - intensity) }, {
      duration: half,
      ease: Ease.quadOut,
      onComplete: () => {
        Tween.to(target.scale, { x: origX, y: origY }, {
          duration: half,
          ease: Ease.bounceOut,
        });
      },
    });
  }

  /**
   * Stretch — elongate the object tall and thin (on jump/launch).
   * Returns to original size with an elastic bounce.
   *
   * @param target     - Object with `scale.x` / `scale.y`
   * @param intensity  - Deformation amount (default: 0.25)
   * @param durationMs - Total animation duration in ms (default: 120)
   */
  static stretch(target: any, intensity: number = 0.25, durationMs: number = 120): void {
    if (!target?.scale) return;

    const origX: number = target.scale.x ?? 1;
    const origY: number = target.scale.y ?? 1;
    const half = durationMs / 2;

    Tween.to(target.scale, { x: origX * (1 - intensity * 0.5), y: origY * (1 + intensity) }, {
      duration: half,
      ease: Ease.quadOut,
      onComplete: () => {
        Tween.to(target.scale, { x: origX, y: origY }, {
          duration: half,
          ease: Ease.elasticOut,
        });
      },
    });
  }

  /**
   * Land — squash on landing with a slightly stronger default intensity.
   * Convenience wrapper around squash().
   *
   * @param target    - Object with `scale.x` / `scale.y`
   * @param intensity - Deformation amount (default: 0.35)
   */
  static land(target: any, intensity: number = 0.35): void {
    SquashStretch.squash(target, intensity, 150);
  }
}
