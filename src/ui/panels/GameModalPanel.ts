import { GamePanel, GamePanelConfig } from './GamePanel';

/**
 * GameModalPanel configuration
 */
export interface GameModalPanelConfig extends GamePanelConfig {
  animationDuration?: number;
}

/**
 * GameModalPanel - Centered modal panel with scale animation
 *
 * Features:
 * - Centered positioning
 * - Scale in/out animation
 * - Dark overlay
 * - Close on overlay tap
 *
 * @example
 * ```typescript
 * const modal = new GameModalPanel({
 *   width: 350,
 *   height: 400,
 *   title: 'Settings',
 *   onClose: () => console.log('Modal closed')
 * });
 *
 * panelManager.show(modal);
 * ```
 */
export class GameModalPanel extends GamePanel {
  private animationDuration: number;
  private centerX: number = 0;
  private centerY: number = 0;

  constructor(config: GameModalPanelConfig = {}) {
    super(config);
    this.animationDuration = config.animationDuration || 250;
  }

  /**
   * Position panel at center of screen
   */
  protected positionPanel(screenWidth: number, screenHeight: number): void {
    // Store the center position for scaling calculations
    this.centerX = (screenWidth - this.config.width) / 2;
    this.centerY = (screenHeight - this.config.height) / 2;
    this.panelContainer.x = this.centerX;
    this.panelContainer.y = this.centerY;
  }

  /**
   * Helper to set scale and adjust position to scale from center
   */
  private setScaleFromCenter(scale: number): void {
    this.panelContainer.scale.x = scale;
    this.panelContainer.scale.y = scale;
    // Offset position to maintain visual center during scale
    const offset = (1 - scale) * this.config.width / 2;
    const offsetY = (1 - scale) * this.config.height / 2;
    this.panelContainer.x = this.centerX + offset;
    this.panelContainer.y = this.centerY + offsetY;
  }

  /**
   * Scale-in animation
   */
  protected async animateShow(): Promise<void> {
    return new Promise((resolve) => {
      this.setScaleFromCenter(0.8);
      this.panelContainer.alpha = 0;
      this.overlay.alpha = 0;

      const startTime = Date.now();
      const duration = this.animationDuration;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeOutBack(progress);

        this.setScaleFromCenter(0.8 + 0.2 * eased);
        this.panelContainer.alpha = progress;
        this.overlay.alpha = (this.theme.overlayAlpha || 0.6) * progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.setScaleFromCenter(1);
          this.panelContainer.alpha = 1;
          this.overlay.alpha = this.theme.overlayAlpha || 0.6;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Scale-out animation
   */
  protected async animateHide(): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.animationDuration * 0.8;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeInCubic(progress);

        this.setScaleFromCenter(1 - 0.2 * eased);
        this.panelContainer.alpha = 1 - progress;
        this.overlay.alpha = (this.theme.overlayAlpha || 0.6) * (1 - progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.setScaleFromCenter(0.8);
          this.panelContainer.alpha = 0;
          this.overlay.alpha = 0;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Ease out back (slight overshoot)
   */
  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /**
   * Ease in cubic
   */
  private easeInCubic(t: number): number {
    return t * t * t;
  }
}
