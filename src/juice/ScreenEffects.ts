/**
 * ScreenEffects — Full-screen overlay effects for damage, power-ups, etc.
 *
 * Static utility class. Call `ScreenEffects.init(parent)` once during setup,
 * then fire-and-forget calls like `flash()`, `damageVignette()`, `powerFlash()`.
 *
 * Uses the graphics() abstraction so it works with any renderer.
 */

import { graphics } from '../graphics/GraphicsEngine.js';
import { Tween } from '../tween/Tween.js';
import { Ease } from '../tween/Ease.js';

export class ScreenEffects {
  private static _parent: any = null;

  // ---- Setup ---------------------------------------------------------------

  /**
   * Attach a parent container (typically the root stage or HUD layer).
   * Must be called before any effect methods.
   */
  static init(parent: any): void {
    ScreenEffects._parent = parent;
  }

  // ---- Effects -------------------------------------------------------------

  /**
   * Flash the entire screen with a solid color overlay.
   *
   * @param color     - Hex color (default: 0xFFFFFF)
   * @param alpha     - Peak overlay alpha (default: 0.5)
   * @param durationMs - Fade-out duration in ms (default: 200)
   */
  static flash(color: number = 0xFFFFFF, alpha: number = 0.5, durationMs: number = 200): void {
    const parent = ScreenEffects._parent;
    if (!parent) return;

    const factory = graphics();
    const overlay = factory.createGraphics() as any;

    // Draw a large rectangle — 4000×4000 centered to cover any viewport
    overlay.rect(-2000, -2000, 4000, 4000);
    overlay.fill({ color, alpha: 1 });
    overlay.alpha = alpha;

    parent.addChild(overlay);

    Tween.to(overlay, { alpha: 0 }, {
      duration: durationMs,
      ease: Ease.quadOut,
      onComplete: () => {
        parent.removeChild(overlay);
        if (overlay.destroy) overlay.destroy();
      },
    });
  }

  /**
   * Red vignette pulse — visual indication of taking damage.
   * @param durationMs - Total pulse duration in ms (default: 400)
   */
  static damageVignette(durationMs: number = 400): void {
    ScreenEffects.flash(0xFF0000, 0.35, durationMs);
  }

  /**
   * White flash — visual indication of power-up or level-up.
   * @param durationMs - Total flash duration in ms (default: 250)
   */
  static powerFlash(durationMs: number = 250): void {
    ScreenEffects.flash(0xFFFFFF, 0.6, durationMs);
  }
}
