import { GamePanel, GamePanelConfig } from './GamePanel.js';
import { animate, Easing, lerp } from '../utils/animation.js';

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
    this.setScaleFromCenter(0.8);
    this.panelContainer.alpha = 0;
    this.overlay.alpha = 0;

    const overlayAlpha = this.theme.overlayAlpha || 0.6;

    return animate({
      duration: this.animationDuration,
      easing: Easing.easeOutBack,
      onUpdate: (progress, eased) => {
        this.setScaleFromCenter(lerp(0.8, 1, eased));
        this.panelContainer.alpha = progress;
        this.overlay.alpha = overlayAlpha * progress;
      },
    });
  }

  /**
   * Scale-out animation
   */
  protected async animateHide(): Promise<void> {
    const overlayAlpha = this.theme.overlayAlpha || 0.6;

    return animate({
      duration: this.animationDuration * 0.8,
      easing: Easing.easeInCubic,
      onUpdate: (progress, eased) => {
        this.setScaleFromCenter(lerp(1, 0.8, eased));
        this.panelContainer.alpha = 1 - progress;
        this.overlay.alpha = overlayAlpha * (1 - progress);
      },
    });
  }
}
