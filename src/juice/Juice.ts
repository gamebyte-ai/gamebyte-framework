/**
 * Juice — Static utility class for combining tween, particle, and screen shake
 * effects into high-level game feel primitives.
 *
 * All methods are designed to be called fire-and-forget; they handle their own
 * lifecycle internally. Particle emitters that are created via static presets
 * use burst mode and auto-cleanup via the 'complete' event.
 *
 * @example
 * ```typescript
 * import { Juice } from './juice/index.js';
 *
 * // In a hit handler:
 * Juice.impact(enemySprite, { particleParent: gameScene });
 *
 * // Collecting a coin:
 * Juice.collect(gameScene, coin.x, coin.y, { text: '+10', style: 'coin' });
 *
 * // Taking damage:
 * Juice.damage(playerSprite, gameScene, 25);
 *
 * // Combo streak:
 * Juice.combo(gameScene, player.x, player.y, comboCount);
 *
 * // Level complete:
 * Juice.celebrate(gameScene, cx, cy, { text: 'LEVEL COMPLETE!', score: 500 });
 *
 * // Button press:
 * Juice.pop(button);
 *
 * // Pulsing glow item:
 * const tween = Juice.pulse(glowSprite);
 * // Later: tween.stop();
 * ```
 */

import { Tween } from '../tween/Tween.js';
import { Ease } from '../tween/Ease.js';
import { ParticleEmitter } from '../particles/ParticleEmitter.js';
import { screenShake } from '../utils/screenShake.js';
import { FloatingText2D } from '../ui/effects/FloatingText2D.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface JuiceConfig {
  /** Scale to particle/text effects. Default: 1 */
  intensity?: number;
  /** Whether to use screen shake. Default: true */
  shakeEnabled?: boolean;
  /** Whether to use particles. Default: true */
  particlesEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Juice
// ---------------------------------------------------------------------------

export class Juice {
  private static _config: Required<JuiceConfig> = {
    intensity: 1,
    shakeEnabled: true,
    particlesEnabled: true,
  };

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  /**
   * Configure global juice settings. Merges with existing config.
   * Call once during game setup to control global intensity or disable effects.
   */
  static configure(config: Partial<JuiceConfig>): void {
    if (config.intensity !== undefined) Juice._config.intensity = config.intensity;
    if (config.shakeEnabled !== undefined) Juice._config.shakeEnabled = config.shakeEnabled;
    if (config.particlesEnabled !== undefined) Juice._config.particlesEnabled = config.particlesEnabled;
  }

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  /**
   * Impact effect — for hits, collisions, explosions.
   * Combines: scale pop + screen shake + particle burst.
   *
   * @param target - Display object with `scale` and optional `x`/`y`/`parent`
   * @param options - Overrides for shake intensity, duration, and particles
   */
  static impact(
    target: any,
    options?: {
      shakeIntensity?: number;
      shakeDuration?: number;
      particles?: boolean;
      particleParent?: any;
    }
  ): void {
    // Scale pop: up to 1.3 then bounce back
    if (target.scale) {
      const origX: number = (target.scale.x as number) ?? 1;
      const origY: number = (target.scale.y as number) ?? 1;
      Tween.to(
        target.scale,
        { x: origX * 1.3, y: origY * 1.3 },
        {
          duration: 80,
          ease: Ease.quadOut,
          onComplete: () => {
            Tween.to(
              target.scale,
              { x: origX, y: origY },
              { duration: 180, ease: Ease.bounceOut }
            );
          },
        }
      );
    }

    // Screen shake
    if (Juice._config.shakeEnabled && options?.shakeIntensity !== 0) {
      const stage = target.parent ?? target;
      screenShake(
        stage,
        (options?.shakeIntensity ?? 8) * Juice._config.intensity,
        options?.shakeDuration ?? 200
      );
    }

    // Particle burst
    if (
      Juice._config.particlesEnabled &&
      options?.particles !== false &&
      options?.particleParent
    ) {
      const emitter = ParticleEmitter.explosion(target.x ?? 0, target.y ?? 0);
      options.particleParent.addChild(emitter.getContainer());
      // Auto-cleanup once burst finishes
      emitter.once('complete', () => {
        options.particleParent.removeChild(emitter.getContainer());
        emitter.destroy();
      });
    }
  }

  /**
   * Collect effect — for coins, items, power-ups.
   * Combines: floating text + sparkle particles.
   *
   * @param parent - Container to spawn effects into
   * @param x - World X position
   * @param y - World Y position
   * @param options - Text, style, and amount overrides
   */
  static collect(
    parent: any,
    x: number,
    y: number,
    options?: {
      text?: string;
      style?: 'coin' | 'score' | 'heal';
      amount?: number;
    }
  ): void {
    const text = options?.text ?? (options?.amount !== undefined ? `+${options.amount}` : '+1');
    const style = options?.style ?? 'coin';

    FloatingText2D.spawn({ text, x, y, parent, style, direction: 'up', duration: 800 });

    if (Juice._config.particlesEnabled) {
      const emitter = ParticleEmitter.sparkle(x, y);
      parent.addChild(emitter.getContainer());
      // Stop emitting and clean up after a short burst
      setTimeout(() => {
        emitter.stop();
        setTimeout(() => {
          parent.removeChild(emitter.getContainer());
          emitter.destroy();
        }, 1500);
      }, 400);
    }
  }

  /**
   * Combo effect — escalating feedback for combo counters.
   * Higher combo count = bigger text + stronger shake.
   *
   * @param parent - Container for the floating text
   * @param x - World X position
   * @param y - World Y position
   * @param comboCount - Current combo multiplier (1+)
   */
  static combo(parent: any, x: number, y: number, comboCount: number): void {
    const intensity = Math.min(comboCount * 0.5, 5) * Juice._config.intensity;
    const fontSize = 24 + comboCount * 2;
    const duration = 1000 + comboCount * 100;
    const distance = 60 + comboCount * 5;

    FloatingText2D.spawn({
      text: `${comboCount}x COMBO!`,
      x,
      y,
      parent,
      style: {
        fontSize,
        fontWeight: 'bold',
        fill: 0xffdd44,
        stroke: { color: 0x000000, width: 3 },
      },
      duration,
      distance,
    });

    if (Juice._config.shakeEnabled) {
      screenShake(parent, intensity * 2, 150 + comboCount * 30);
    }
  }

  /**
   * Pop effect — for buttons and UI feedback.
   * Quick scale bounce that returns to original size.
   *
   * @param target - Display object with a `scale` property
   * @param scale - Peak scale multiplier (default: 1.2)
   */
  static pop(target: any, scale?: number): Tween | undefined {
    const s = scale ?? 1.2;
    if (!target.scale) return undefined;

    const origX: number = (target.scale.x as number) ?? 1;
    const origY: number = (target.scale.y as number) ?? 1;

    return Tween.to(
      target.scale,
      { x: origX * s, y: origY * s },
      {
        duration: 100,
        ease: Ease.quadOut,
        onComplete: () => {
          Tween.to(
            target.scale,
            { x: origX, y: origY },
            { duration: 200, ease: Ease.bounceOut }
          );
        },
      }
    );
  }

  /**
   * Damage effect — for taking damage.
   * Combines: floating damage number + alpha flash + screen shake.
   *
   * @param target - Display object receiving damage (must have `x`/`y`/`alpha`)
   * @param parent - Container for the floating number
   * @param amount - Damage value shown in floating text
   * @param options - Shake toggle override
   */
  static damage(
    target: any,
    parent: any,
    amount: number,
    options?: {
      shake?: boolean;
    }
  ): void {
    const x: number = target.x ?? 0;
    const y: number = target.y ?? 0;

    // Floating damage number slightly above the target
    FloatingText2D.damage(parent, x, y - 20, amount);

    // Alpha blink flash
    if (target.alpha !== undefined) {
      Tween.to(target, { alpha: 0.3 }, {
        duration: 60,
        ease: Ease.linear,
        onComplete: () => {
          Tween.to(target, { alpha: 1 }, { duration: 120, ease: Ease.linear });
        },
      });
    }

    // Screen shake
    if (options?.shake !== false && Juice._config.shakeEnabled) {
      screenShake(parent, 6 * Juice._config.intensity, 200);
    }
  }

  /**
   * Celebration effect — for level complete, victory.
   * Combines: large floating text + score popup + confetti burst.
   *
   * @param parent - Container for all effects
   * @param x - Center X position
   * @param y - Center Y position
   * @param options - Optional text label and score value
   */
  static celebrate(
    parent: any,
    x: number,
    y: number,
    options?: {
      text?: string;
      score?: number;
    }
  ): void {
    if (options?.text) {
      FloatingText2D.spawn({
        text: options.text,
        x,
        y,
        parent,
        style: {
          fontSize: 36,
          fontWeight: 'bold',
          fill: 0xffd700,
          stroke: { color: 0x000000, width: 4 },
        },
        duration: 1500,
        distance: 80,
      });
    }

    if (options?.score !== undefined) {
      FloatingText2D.score(parent, x, y + 30, options.score);
    }

    if (Juice._config.particlesEnabled) {
      const emitter = ParticleEmitter.confetti(x, y);
      parent.addChild(emitter.getContainer());
      emitter.once('complete', () => {
        parent.removeChild(emitter.getContainer());
        emitter.destroy();
      });
    }
  }

  /**
   * Pulse effect — for glowing, attention-drawing objects.
   * Runs indefinitely (repeat: -1, yoyo: true) until the returned Tween is stopped.
   *
   * @param target - Display object with `scale` property (or numeric `scale`)
   * @param options - Min/max scale and cycle duration
   * @returns The running Tween — call `.stop()` to cancel
   */
  static pulse(
    target: any,
    options?: {
      min?: number;
      max?: number;
      duration?: number;
    }
  ): Tween {
    const min = options?.min ?? 0.95;
    const max = options?.max ?? 1.05;
    const dur = options?.duration ?? 800;

    // Animate scale object if present, otherwise animate numeric scale property
    const tweenTarget: Record<string, number> = target.scale ?? target;
    const props: Record<string, number> = target.scale
      ? { x: max, y: max }
      : { scale: max };

    // Seed the starting values to min so yoyo bounces min↔max
    if (target.scale) {
      target.scale.x = min;
      target.scale.y = min;
    } else if ('scale' in target) {
      target.scale = min;
    }

    return Tween.to(tweenTarget, props, {
      duration: dur,
      ease: Ease.sineInOut,
      repeat: -1,
      yoyo: true,
    });
  }
}
