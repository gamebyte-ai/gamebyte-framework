import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';

/**
 * Panel color scheme
 */
export interface GamePanelTheme {
  background: number;
  backgroundAlpha?: number;
  border: number;
  borderWidth?: number;
  overlay?: number;
  overlayAlpha?: number;
  title?: number;
  titleStroke?: number;
}

/**
 * Default panel theme
 */
export const DEFAULT_PANEL_THEME: GamePanelTheme = {
  background: 0x2A3142,
  backgroundAlpha: 0.98,
  border: 0x3D4F5F,
  borderWidth: 4,
  overlay: 0x000000,
  overlayAlpha: 0.6,
  title: 0xFFFFFF,
  titleStroke: 0x1A1A2A,
};

/**
 * Base panel configuration
 */
export interface GamePanelConfig {
  width?: number;
  height?: number;
  title?: string;
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
  theme?: Partial<GamePanelTheme>;
  borderRadius?: number;
  onClose?: () => void;
}

/**
 * GamePanel - Base class for all panel types
 *
 * Provides common functionality:
 * - Container hierarchy (overlay, panel, content)
 * - Show/hide with animation
 * - Close button
 * - Theme support
 *
 * @example
 * ```typescript
 * // Extend GamePanel for custom panels
 * class MyPanel extends GamePanel {
 *   protected async animateShow(): Promise<void> {
 *     // Custom animation
 *   }
 * }
 * ```
 */
export abstract class GamePanel extends EventEmitter {
  protected container: IContainer;
  protected overlay: IGraphics;
  protected panelContainer: IContainer;
  protected backgroundGraphics: IGraphics;
  protected contentContainer: IContainer;
  protected titleText?: IText;
  protected closeButton?: IContainer;

  protected config: Required<GamePanelConfig>;
  protected theme: GamePanelTheme;
  protected _isVisible: boolean = false;

  constructor(config: GamePanelConfig = {}) {
    super();

    this.config = {
      width: config.width || 350,
      height: config.height || 400,
      title: config.title || '',
      showCloseButton: config.showCloseButton ?? true,
      closeOnOverlay: config.closeOnOverlay ?? true,
      theme: config.theme || {},
      borderRadius: config.borderRadius || 20,
      onClose: config.onClose || (() => {}),
    };

    this.theme = { ...DEFAULT_PANEL_THEME, ...config.theme };

    const factory = graphics();

    // Create container hierarchy
    this.container = factory.createContainer();
    this.container.visible = false;

    // Overlay
    this.overlay = factory.createGraphics();
    this.container.addChild(this.overlay);

    // Panel container (for positioning)
    this.panelContainer = factory.createContainer();
    this.container.addChild(this.panelContainer);

    // Background
    this.backgroundGraphics = factory.createGraphics();
    this.panelContainer.addChild(this.backgroundGraphics);

    // Content container
    this.contentContainer = factory.createContainer();
    this.panelContainer.addChild(this.contentContainer);

    // Setup overlay interaction
    if (this.config.closeOnOverlay) {
      this.setupOverlayInteraction();
    }
  }

  /**
   * Initialize panel with screen dimensions
   */
  public initialize(screenWidth: number, screenHeight: number): void {
    // Draw overlay
    this.drawOverlay(screenWidth, screenHeight);

    // Draw panel background
    this.drawBackground();

    // Create title if provided
    if (this.config.title) {
      this.createTitle();
    }

    // Create close button
    if (this.config.showCloseButton) {
      this.createCloseButton();
    }

    // Position content container
    this.positionContent();

    // Abstract method for specific positioning
    this.positionPanel(screenWidth, screenHeight);
  }

  /**
   * Draw the overlay background
   */
  protected drawOverlay(width: number, height: number): void {
    this.overlay.clear();
    this.overlay.rect(0, 0, width, height);
    this.overlay.fill({
      color: this.theme.overlay || 0x000000,
      alpha: this.theme.overlayAlpha || 0.6,
    });
  }

  /**
   * Draw panel background
   */
  protected drawBackground(): void {
    const { width, height, borderRadius } = this.config;

    this.backgroundGraphics.clear();

    // Shadow
    this.backgroundGraphics.roundRect(4, 4, width, height, borderRadius);
    this.backgroundGraphics.fill({ color: 0x000000, alpha: 0.3 });

    // Border
    this.backgroundGraphics.roundRect(0, 0, width, height, borderRadius);
    this.backgroundGraphics.fill({ color: this.theme.border });

    // Background
    const borderWidth = this.theme.borderWidth || 4;
    this.backgroundGraphics.roundRect(
      borderWidth,
      borderWidth,
      width - borderWidth * 2,
      height - borderWidth * 2,
      borderRadius - borderWidth
    );
    this.backgroundGraphics.fill({
      color: this.theme.background,
      alpha: this.theme.backgroundAlpha,
    });
  }

  /**
   * Create title text
   */
  protected createTitle(): void {
    this.titleText = graphics().createText(this.config.title, {
      fontFamily: '"Fredoka One", "Arial Black", sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: this.theme.title || 0xFFFFFF,
      stroke: this.theme.titleStroke || 0x1A1A2A,
      strokeThickness: 3,
      align: 'center',
    });

    if (this.titleText.anchor) {
      this.titleText.anchor.set(0.5, 0);
    }

    this.titleText.x = this.config.width / 2;
    this.titleText.y = 15;

    this.panelContainer.addChild(this.titleText);
  }

  /**
   * Create close button
   */
  protected createCloseButton(): void {
    const factory = graphics();
    this.closeButton = factory.createContainer();

    const buttonSize = 36;
    const buttonRadius = buttonSize / 2;

    // Background
    const bg = factory.createGraphics();
    bg.circle(0, 0, buttonRadius);
    bg.fill({ color: 0xE84C4C });
    bg.stroke({ color: 0x8B2020, width: 3 });
    this.closeButton.addChild(bg);

    // X icon
    const xGraphics = factory.createGraphics();
    const xSize = 8;
    xGraphics.moveTo(-xSize, -xSize);
    xGraphics.lineTo(xSize, xSize);
    xGraphics.moveTo(xSize, -xSize);
    xGraphics.lineTo(-xSize, xSize);
    xGraphics.stroke({ width: 3, color: 0xFFFFFF, cap: 'round' });
    this.closeButton.addChild(xGraphics);

    // Position at top right
    this.closeButton.x = this.config.width - buttonSize / 2 - 10;
    this.closeButton.y = buttonSize / 2 + 10;

    // Interaction
    this.closeButton.eventMode = 'static';
    this.closeButton.cursor = 'pointer';

    this.closeButton.on('pointerdown', () => {
      this.closeButton!.scale.x = 0.9;
      this.closeButton!.scale.y = 0.9;
    });

    this.closeButton.on('pointerup', () => {
      this.closeButton!.scale.x = 1;
      this.closeButton!.scale.y = 1;
      this.close();
    });

    this.closeButton.on('pointerupoutside', () => {
      this.closeButton!.scale.x = 1;
      this.closeButton!.scale.y = 1;
    });

    this.panelContainer.addChild(this.closeButton);
  }

  /**
   * Setup overlay click to close
   */
  protected setupOverlayInteraction(): void {
    this.overlay.eventMode = 'static';
    this.overlay.cursor = 'pointer';

    this.overlay.on('pointerup', () => {
      this.close();
    });
  }

  /**
   * Position content container
   */
  protected positionContent(): void {
    const padding = 20;
    const titleHeight = this.config.title ? 50 : 0;

    this.contentContainer.x = padding;
    this.contentContainer.y = titleHeight + padding;
  }

  /**
   * Abstract: Position the panel on screen
   */
  protected abstract positionPanel(screenWidth: number, screenHeight: number): void;

  /**
   * Abstract: Show animation
   */
  protected abstract animateShow(): Promise<void>;

  /**
   * Abstract: Hide animation
   */
  protected abstract animateHide(): Promise<void>;

  /**
   * Show the panel
   */
  public async show(): Promise<void> {
    if (this._isVisible) return;

    this._isVisible = true;
    this.container.visible = true;

    await this.animateShow();

    this.emit('show');
  }

  /**
   * Hide the panel
   */
  public async hide(): Promise<void> {
    if (!this._isVisible) return;

    await this.animateHide();

    this._isVisible = false;
    this.container.visible = false;

    this.emit('hide');
  }

  /**
   * Close the panel (triggers callback)
   */
  public async close(): Promise<void> {
    await this.hide();
    this.config.onClose();
    this.emit('close');
  }

  /**
   * Add content to the panel
   */
  public addContent(child: IContainer | IGraphics | IText): void {
    this.contentContainer.addChild(child);
  }

  /**
   * Remove content from the panel
   */
  public removeContent(child: IContainer | IGraphics | IText): void {
    this.contentContainer.removeChild(child);
  }

  /**
   * Clear all content
   */
  public clearContent(): void {
    this.contentContainer.removeChildren();
  }

  /**
   * Get content container for direct manipulation
   */
  public getContentContainer(): IContainer {
    return this.contentContainer;
  }

  /**
   * Get content area dimensions
   */
  public getContentSize(): { width: number; height: number } {
    const padding = 20;
    const titleHeight = this.config.title ? 50 : 0;
    return {
      width: this.config.width - padding * 2,
      height: this.config.height - titleHeight - padding * 2,
    };
  }

  /**
   * Check if panel is visible
   */
  public isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * Get the main container
   */
  public getContainer(): IContainer {
    return this.container;
  }

  /**
   * Update theme
   */
  public setTheme(theme: Partial<GamePanelTheme>): void {
    this.theme = { ...this.theme, ...theme };
    this.drawBackground();
    if (this.titleText) {
      this.titleText.style.fill = this.theme.title || 0xFFFFFF;
    }
  }

  /**
   * Set title text
   */
  public setTitle(title: string): void {
    if (this.titleText) {
      this.titleText.text = title;
    }
  }

  /**
   * Destroy the panel
   */
  public destroy(): void {
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
