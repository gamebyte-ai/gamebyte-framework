import { EventEmitter } from 'eventemitter3';
import { graphics } from '../../graphics/GraphicsEngine';
import { IContainer, IGraphics, IText, ISprite } from '../../contracts/Graphics';
import { GameButtons } from './GameStyleButton';
import { getFrameworkFontFamily, loadFrameworkFont } from '../utils/FontLoader';

/**
 * Panel color scheme for game-style panels (No Ads popup style)
 */
export interface GamePanelColorScheme {
  // Background
  fillTop: number;
  fillBottom: number;
  // Border
  borderOuter: number;
  borderInner: number;
  borderWidth: number;
  // Header
  headerBg?: number;       // Header background color (darker than fill)
  // Title
  titleColor: number;
  titleStroke: number;
  // Close button
  closeButtonBg: number;
  closeButtonBorder: number;
  closeButtonX: number;
}

/**
 * GameStylePanel configuration
 */
export interface GameStylePanelConfig {
  width?: number;
  height?: number;
  title?: string;
  showCloseButton?: boolean;
  colorScheme?: GamePanelColorScheme;
  borderRadius?: number;
  borderWidth?: number;
  titleFontSize?: number;
  padding?: number;
  onClose?: () => void;
}

/**
 * Game-style panel component with skinnable borders and title bar
 * Inspired by Candy Crush, Brawl Stars, and Clash Royale
 *
 * Features:
 * - Multi-layer border effect
 * - Gradient background
 * - Title bar with close button
 * - Customizable color schemes
 * - Drop shadow
 *
 * @example
 * ```typescript
 * const panel = new GameStylePanel({
 *   width: 350,
 *   height: 400,
 *   title: 'SETTINGS',
 *   showCloseButton: true,
 *   colorScheme: GameStyleColors.PANEL_BLUE,
 *   onClose: () => panel.hide()
 * });
 *
 * stage.addChild(panel.getContainer());
 * ```
 */
export class GameStylePanel extends EventEmitter {
  private container: IContainer;
  private shadowGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private backgroundGraphics: IGraphics;
  private gradientSprite?: ISprite;
  private titleText?: IText;
  private closeButton?: IContainer;
  private contentContainer: IContainer;

  private config: Required<GameStylePanelConfig>;

  // Default blue panel color scheme (matches No Ads popup)
  private static readonly DEFAULT_SCHEME: GamePanelColorScheme = {
    fillTop: 0x41A7FB,      // Light blue modal background
    fillBottom: 0x41A7FB,   // Solid color
    borderOuter: 0x1e3a5f,  // Dark navy border
    borderInner: 0x1e3a5f,  // Same - single border
    borderWidth: 4,
    headerBg: 0x2889F0,     // Darker blue header
    titleColor: 0xFFFFFF,
    titleStroke: 0x1a2a3a,
    closeButtonBg: 0xE84C4C,
    closeButtonBorder: 0xA83340,
    closeButtonX: 0xFFFFFF,
  };

  constructor(config: GameStylePanelConfig = {}) {
    super();

    // Trigger font loading (non-blocking)
    loadFrameworkFont();

    this.config = {
      width: config.width || 350,
      height: config.height || 400,
      title: config.title || '',
      showCloseButton: config.showCloseButton !== false,
      colorScheme: config.colorScheme || GameStylePanel.DEFAULT_SCHEME,
      borderRadius: config.borderRadius || 18,  // Matches No Ads popup
      borderWidth: config.borderWidth || 4,     // Matches No Ads popup
      titleFontSize: config.titleFontSize || 28,
      padding: config.padding || 20,
      onClose: config.onClose || (() => {}),
    };

    const factory = graphics();

    // Create container hierarchy
    this.container = factory.createContainer();

    // Create shadow
    this.shadowGraphics = factory.createGraphics();
    this.container.addChild(this.shadowGraphics);

    // Create border
    this.borderGraphics = factory.createGraphics();
    this.container.addChild(this.borderGraphics);

    // Create background
    this.backgroundGraphics = factory.createGraphics();
    this.container.addChild(this.backgroundGraphics);

    // Create content container
    this.contentContainer = factory.createContainer();
    this.container.addChild(this.contentContainer);

    // Render panel
    this.render();

    // Create title if provided
    if (this.config.title) {
      this.createTitle();
    }

    // Create close button if needed
    if (this.config.showCloseButton) {
      this.createCloseButton();
    }
  }

  /**
   * Render the panel graphics (No Ads popup style)
   */
  private render(): void {
    const { width, height, borderRadius, borderWidth, colorScheme } = this.config;
    const headerHeight = this.config.title ? 52 : 0;

    // Clear previous graphics
    this.shadowGraphics.clear();
    this.borderGraphics.clear();
    this.backgroundGraphics.clear();

    // ==========================================
    // No Ads popup style rendering
    // ==========================================

    // 1. Shadow (8px down, 40% alpha)
    this.shadowGraphics.roundRect(0, 8, width, height, borderRadius);
    this.shadowGraphics.fill({ color: 0x000000, alpha: 0.4 });

    // 2. Border (single dark navy border)
    this.borderGraphics.roundRect(
      -borderWidth,
      -borderWidth,
      width + borderWidth * 2,
      height + borderWidth * 2,
      borderRadius + borderWidth
    );
    this.borderGraphics.fill(colorScheme.borderOuter);

    // 3. Main background (solid color)
    this.backgroundGraphics.roundRect(0, 0, width, height, borderRadius);
    this.backgroundGraphics.fill(colorScheme.fillTop);

    // 4. Header background (darker blue, only if title exists)
    if (headerHeight > 0 && colorScheme.headerBg) {
      // Header with rounded top corners, straight bottom
      this.backgroundGraphics.roundRect(0, 0, width, headerHeight, borderRadius);
      this.backgroundGraphics.rect(0, headerHeight - borderRadius, width, borderRadius);
      this.backgroundGraphics.fill(colorScheme.headerBg);
    }

    // Remove old gradient sprite if exists (not used in new style)
    if (this.gradientSprite) {
      this.container.removeChild(this.gradientSprite);
      this.gradientSprite = undefined;
    }

    // Position content container (below header)
    this.contentContainer.x = this.config.padding;
    this.contentContainer.y = headerHeight + this.config.padding;
  }

  /**
   * Create the title text (centered in 52px header, No Ads popup style)
   */
  private createTitle(): void {
    const { width, colorScheme, titleFontSize } = this.config;
    const headerHeight = 52;

    // No Ads popup style text - stroke + dropShadow
    this.titleText = graphics().createText(this.config.title, {
      fontFamily: getFrameworkFontFamily(),
      fontSize: titleFontSize,
      fontWeight: '900',
      fill: colorScheme.titleColor,
      stroke: colorScheme.titleStroke,
      strokeThickness: Math.max(3, titleFontSize * 0.12),
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 0,
      dropShadowDistance: Math.max(2, titleFontSize * 0.06),
      dropShadowAngle: Math.PI / 2,
      dropShadowAlpha: 0.5,
    });

    // Center title in header
    const titleWidth = this.titleText.width || 100;
    const titleHeight = this.titleText.height || titleFontSize;
    this.titleText.x = (width - titleWidth) / 2;
    this.titleText.y = (headerHeight - titleHeight) / 2;

    this.container.addChild(this.titleText);
  }

  /**
   * Create the close button - uses new GameStyleButton (positioned in header)
   */
  private createCloseButton(): void {
    const { width } = this.config;
    const headerHeight = 52;

    // Remove existing close button if any
    if (this.closeButton) {
      this.container.removeChild(this.closeButton);
    }

    // Use the new GameButtons.close() for consistent button style
    const buttonSize = 38;
    const closeBtn = GameButtons.close(buttonSize);

    // Position at top right corner within header
    const buttonX = width - buttonSize - 8;
    const buttonY = (headerHeight - buttonSize) / 2;

    closeBtn.setPosition(buttonX, buttonY);

    // Wire up click handler
    closeBtn.on('click', () => {
      this.emit('close');
      this.config.onClose();
    });

    this.closeButton = closeBtn.getContainer();
    this.container.addChild(this.closeButton);
  }

  /**
   * Convert hex to rgb string
   */
  private hexToRgb(hex: number): string {
    const r = (hex >> 16) & 0xFF;
    const g = (hex >> 8) & 0xFF;
    const b = hex & 0xFF;
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Add child to content area
   */
  public addContent(child: IContainer | IGraphics | IText): void {
    this.contentContainer.addChild(child);
  }

  /**
   * Remove child from content area
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
   * Get the content container for direct manipulation
   */
  public getContentContainer(): IContainer {
    return this.contentContainer;
  }

  /**
   * Set panel position
   */
  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Get panel position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  /**
   * Show the panel
   */
  public show(): void {
    this.container.visible = true;
    this.emit('show');
  }

  /**
   * Hide the panel
   */
  public hide(): void {
    this.container.visible = false;
    this.emit('hide');
  }

  /**
   * Set panel visibility
   */
  public setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * Get the main container
   */
  public getContainer(): IContainer {
    return this.container;
  }

  /**
   * Set title text
   */
  public setTitle(title: string): void {
    if (this.titleText) {
      this.titleText.text = title;
      // Re-center
      const titleWidth = this.titleText.width || 100;
      this.titleText.x = (this.config.width - titleWidth) / 2;
    }
  }

  /**
   * Update color scheme
   */
  public setColorScheme(scheme: GamePanelColorScheme): void {
    this.config.colorScheme = scheme;
    this.render();
    if (this.config.title) {
      this.createTitle();
    }
    if (this.config.showCloseButton) {
      this.createCloseButton();
    }
  }

  /**
   * Get panel dimensions
   */
  public getSize(): { width: number; height: number } {
    return {
      width: this.config.width,
      height: this.config.height,
    };
  }

  /**
   * Get content area dimensions (usable space)
   */
  public getContentSize(): { width: number; height: number } {
    const titleHeight = this.config.title ? 50 : 0;
    return {
      width: this.config.width - this.config.borderWidth * 2 - this.config.padding * 2,
      height: this.config.height - this.config.borderWidth * 2 - titleHeight - this.config.padding * 2,
    };
  }

  /**
   * Destroy the panel
   */
  public destroy(): void {
    this.container.destroy();
    this.removeAllListeners();
  }
}
