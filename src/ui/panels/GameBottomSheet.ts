import { GamePanel, GamePanelConfig } from './GamePanel';
import { graphics } from '../../graphics/GraphicsEngine';
import { IGraphics } from '../../contracts/Graphics';

/**
 * Bottom sheet height options
 */
export type BottomSheetHeight = number | 'auto' | 'half' | 'full';

/**
 * GameBottomSheet configuration
 */
export interface GameBottomSheetConfig extends Omit<GamePanelConfig, 'height'> {
  height?: BottomSheetHeight;
  showHandle?: boolean;
  dragToClose?: boolean;
  animationDuration?: number;
}

/**
 * GameBottomSheet - Slide-up panel from bottom
 *
 * Features:
 * - Slides up from bottom
 * - Drag handle for closing
 * - Swipe down to close
 * - Height options: fixed, auto, half, full
 *
 * @example
 * ```typescript
 * const sheet = new GameBottomSheet({
 *   height: 'half',
 *   title: 'Select Item',
 *   showHandle: true,
 *   dragToClose: true
 * });
 *
 * panelManager.show(sheet);
 * ```
 */
export class GameBottomSheet extends GamePanel {
  private animationDuration: number;
  private showHandle: boolean;
  private dragToClose: boolean;
  private handle?: IGraphics;

  private screenHeight: number = 0;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private panelStartY: number = 0;

  constructor(config: GameBottomSheetConfig = {}) {
    // Convert height to number for parent
    const numericHeight = GameBottomSheet.resolveHeight(config.height, 1280);

    super({
      ...config,
      height: numericHeight,
      borderRadius: config.borderRadius || 24,
    });

    this.animationDuration = config.animationDuration || 300;
    this.showHandle = config.showHandle ?? true;
    this.dragToClose = config.dragToClose ?? true;
  }

  /**
   * Resolve height value to pixels
   */
  private static resolveHeight(height: BottomSheetHeight | undefined, screenHeight: number): number {
    if (typeof height === 'number') {
      return height;
    }

    switch (height) {
      case 'half':
        return screenHeight * 0.5;
      case 'full':
        return screenHeight * 0.9;
      case 'auto':
      default:
        return 400;
    }
  }

  /**
   * Override initialize to handle screen height
   */
  public initialize(screenWidth: number, screenHeight: number): void {
    this.screenHeight = screenHeight;

    // Recalculate height if needed
    // Update config width to match screen
    this.config.width = screenWidth;

    super.initialize(screenWidth, screenHeight);

    // Create handle
    if (this.showHandle) {
      this.createHandle();
    }

    // Setup drag interaction
    if (this.dragToClose) {
      this.setupDragInteraction();
    }
  }

  /**
   * Override background to have top-only rounded corners
   */
  protected drawBackground(): void {
    const { width, height, borderRadius } = this.config;

    this.backgroundGraphics.clear();

    // Shadow
    this.backgroundGraphics.roundRect(0, 0, width, height + 50, borderRadius);
    this.backgroundGraphics.fill({ color: 0x000000, alpha: 0.3 });

    // Border
    this.backgroundGraphics.roundRect(0, 0, width, height + 50, borderRadius);
    this.backgroundGraphics.fill({ color: this.theme.border });

    // Background (extend beyond bottom)
    const borderWidth = this.theme.borderWidth || 4;
    this.backgroundGraphics.roundRect(
      borderWidth,
      borderWidth,
      width - borderWidth * 2,
      height + 50 - borderWidth,
      borderRadius - borderWidth
    );
    this.backgroundGraphics.fill({
      color: this.theme.background,
      alpha: this.theme.backgroundAlpha,
    });
  }

  /**
   * Create drag handle
   */
  private createHandle(): void {
    this.handle = graphics().createGraphics();

    const handleWidth = 40;
    const handleHeight = 5;

    this.handle.roundRect(
      (this.config.width - handleWidth) / 2,
      10,
      handleWidth,
      handleHeight,
      handleHeight / 2
    );
    this.handle.fill({ color: 0x888888, alpha: 0.5 });

    this.panelContainer.addChild(this.handle);
  }

  /**
   * Setup drag to close interaction
   */
  private setupDragInteraction(): void {
    this.panelContainer.eventMode = 'static';

    this.panelContainer.on('pointerdown', (event: any) => {
      // Only start drag from top area (handle region)
      const localY = event.data?.getLocalPosition?.(this.panelContainer)?.y || event.global?.y || 0;
      if (localY < 50) {
        this.isDragging = true;
        this.dragStartY = event.global?.y || event.clientY || 0;
        this.panelStartY = this.panelContainer.y;
      }
    });

    this.panelContainer.on('pointermove', (event: any) => {
      if (!this.isDragging) return;

      const currentY = event.global?.y || event.clientY || 0;
      const deltaY = currentY - this.dragStartY;

      // Only allow dragging down
      if (deltaY > 0) {
        this.panelContainer.y = this.panelStartY + deltaY;
      }
    });

    this.panelContainer.on('pointerup', (event: any) => {
      if (!this.isDragging) return;
      this.isDragging = false;

      const currentY = event.global?.y || event.clientY || 0;
      const deltaY = currentY - this.dragStartY;

      // If dragged more than 100px, close
      if (deltaY > 100) {
        this.close();
      } else {
        // Snap back
        this.animateSnapBack();
      }
    });

    this.panelContainer.on('pointerupoutside', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.animateSnapBack();
      }
    });
  }

  /**
   * Animate snap back to original position
   */
  private animateSnapBack(): void {
    const startY = this.panelContainer.y;
    const targetY = this.screenHeight - this.config.height;
    const startTime = Date.now();
    const duration = 200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);

      this.panelContainer.y = startY + (targetY - startY) * eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Position panel at bottom of screen
   */
  protected positionPanel(screenWidth: number, screenHeight: number): void {
    this.panelContainer.x = 0;
    this.panelContainer.y = screenHeight; // Start below screen
  }

  /**
   * Position content with more padding for handle
   */
  protected positionContent(): void {
    const padding = 20;
    const handleHeight = this.showHandle ? 30 : 0;
    const titleHeight = this.config.title ? 50 : 0;

    this.contentContainer.x = padding;
    this.contentContainer.y = handleHeight + titleHeight + padding;
  }

  /**
   * Override title positioning for handle
   */
  protected createTitle(): void {
    super.createTitle();
    if (this.titleText) {
      this.titleText.y = this.showHandle ? 30 : 15;
    }
  }

  /**
   * Override close button positioning for handle
   */
  protected createCloseButton(): void {
    super.createCloseButton();
    if (this.closeButton) {
      this.closeButton.y = this.showHandle ? 40 : 25;
    }
  }

  /**
   * Slide-up animation
   */
  protected async animateShow(): Promise<void> {
    return new Promise((resolve) => {
      const targetY = this.screenHeight - this.config.height;
      const startY = this.screenHeight;

      this.panelContainer.y = startY;
      this.overlay.alpha = 0;

      const startTime = Date.now();
      const duration = this.animationDuration;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeOutCubic(progress);

        this.panelContainer.y = startY + (targetY - startY) * eased;
        this.overlay.alpha = (this.theme.overlayAlpha || 0.6) * progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.panelContainer.y = targetY;
          this.overlay.alpha = this.theme.overlayAlpha || 0.6;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Slide-down animation
   */
  protected async animateHide(): Promise<void> {
    return new Promise((resolve) => {
      const startY = this.panelContainer.y;
      const targetY = this.screenHeight;

      const startTime = Date.now();
      const duration = this.animationDuration * 0.8;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeInCubic(progress);

        this.panelContainer.y = startY + (targetY - startY) * eased;
        this.overlay.alpha = (this.theme.overlayAlpha || 0.6) * (1 - progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.panelContainer.y = targetY;
          this.overlay.alpha = 0;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Ease out cubic
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Ease in cubic
   */
  private easeInCubic(t: number): number {
    return t * t * t;
  }
}
