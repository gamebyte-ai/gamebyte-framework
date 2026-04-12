/**
 * Haptics — navigator.vibrate() wrapper with semantic game feel patterns.
 * All methods are no-ops when vibration is unsupported or disabled.
 *
 * @example
 * ```typescript
 * import { Haptics } from './juice/Haptics.js';
 *
 * Haptics.light();    // button press
 * Haptics.heavy();    // explosion
 * Haptics.success();  // level complete
 * ```
 */

export class Haptics {
  private static _enabled = true;

  /** Enable or disable haptics globally (e.g. from settings screen). */
  static setEnabled(enabled: boolean): void {
    Haptics._enabled = enabled;
  }

  /** Whether haptics are currently enabled. */
  static get enabled(): boolean {
    return Haptics._enabled;
  }

  /** Whether the current environment supports vibration. */
  static get supported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /** Light tap — button press, UI interaction (15ms). */
  static light(): void {
    Haptics._vibrate(15);
  }

  /** Medium pulse — collect item, score point (40ms). */
  static medium(): void {
    Haptics._vibrate(40);
  }

  /** Heavy thud — impact, explosion, damage (70ms). */
  static heavy(): void {
    Haptics._vibrate(70);
  }

  /** Double tap — notification, alert. */
  static double(): void {
    Haptics._vibrate([30, 50, 30]);
  }

  /** Success pattern — level complete, achievement. */
  static success(): void {
    Haptics._vibrate([20, 40, 40, 40, 80]);
  }

  /** Error pattern — fail, insufficient funds. */
  static error(): void {
    Haptics._vibrate([100, 30, 100]);
  }

  /** Custom vibration pattern (ms on, ms off, ms on, ...). */
  static pattern(pattern: number | number[]): void {
    Haptics._vibrate(pattern);
  }

  private static _vibrate(pattern: number | number[]): void {
    if (!Haptics._enabled || !Haptics.supported) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently ignore — some browsers throw on vibrate()
    }
  }
}
