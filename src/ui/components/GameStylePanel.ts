import { EventEmitter } from 'eventemitter3';
import { graphics } from '../../graphics/GraphicsEngine';
import { IContainer, IGraphics, IText, ISprite } from '../../contracts/Graphics';

/**
 * Panel color scheme for game-style panels
 */
export interface GamePanelColorScheme {
  // Background
  fillTop: number;
  fillBottom: number;
  // Border
  borderOuter: number;
  borderInner: number;
  borderWidth: number;
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

  // Default blue panel color scheme
  private static readonly DEFAULT_SCHEME: GamePanelColorScheme = {
    fillTop: 0x5BA3E0,
    fillBottom: 0x3B7BBF,
    borderOuter: 0x1A4B7A,
    borderInner: 0x2A6B9A,
    borderWidth: 8,
    titleColor: 0xFFFFFF,
    titleStroke: 0x1A4B7A,
    closeButtonBg: 0xE84C4C,
    closeButtonBorder: 0x8B2020,
    closeButtonX: 0xFFFFFF,
  };

  constructor(config: GameStylePanelConfig = {}) {
    super();

    this.config = {
      width: config.width || 350,
      height: config.height || 400,
      title: config.title || '',
      showCloseButton: config.showCloseButton !== false,
      colorScheme: config.colorScheme || GameStylePanel.DEFAULT_SCHEME,
      borderRadius: config.borderRadius || 24,
      borderWidth: config.borderWidth || 8,
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
   * Render the panel graphics
   */
  private render(): void {
    const { width, height, borderRadius, borderWidth, colorScheme } = this.config;

    // Clear previous graphics
    this.shadowGraphics.clear();
    this.borderGraphics.clear();
    this.backgroundGraphics.clear();

    // Draw shadow
    this.shadowGraphics.roundRect(6, 6, width, height, borderRadius);
    this.shadowGraphics.fill({ color: 0x000000, alpha: 0.3 });

    // Draw outer border
    this.borderGraphics.roundRect(0, 0, width, height, borderRadius);
    this.borderGraphics.fill(colorScheme.borderOuter);

    // Draw inner border
    const innerOffset = borderWidth / 2;
    this.borderGraphics.roundRect(
      innerOffset,
      innerOffset,
      width - borderWidth,
      height - borderWidth,
      borderRadius - innerOffset
    );
    this.borderGraphics.fill(colorScheme.borderInner);

    // Draw gradient background using canvas
    const bgOffset = borderWidth;
    const bgWidth = width - borderWidth * 2;
    const bgHeight = height - borderWidth * 2;
    const bgRadius = borderRadius - borderWidth;

    const gradCanvas = document.createElement('canvas');
    gradCanvas.width = bgWidth;
    gradCanvas.height = bgHeight;
    const ctx = gradCanvas.getContext('2d')!;

    // Create vertical gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, bgHeight);
    gradient.addColorStop(0, this.hexToRgb(colorScheme.fillTop));
    gradient.addColorStop(1, this.hexToRgb(colorScheme.fillBottom));

    // Draw rounded rect with gradient
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, bgWidth, bgHeight, bgRadius);
    ctx.fill();

    // Remove old gradient sprite if exists
    if (this.gradientSprite) {
      this.container.removeChild(this.gradientSprite);
    }

    // Create new gradient sprite
    const texture = graphics().createTexture(gradCanvas);
    this.gradientSprite = graphics().createSprite(texture);
    this.gradientSprite.x = bgOffset;
    this.gradientSprite.y = bgOffset;

    // Insert gradient sprite BEFORE content container (at index 3, after backgroundGraphics)
    // Order: shadow(0), border(1), background(2), gradientSprite(3), contentContainer(4)
    const contentIndex = this.container.getChildIndex(this.contentContainer);
    this.container.addChild(this.gradientSprite);
    this.container.setChildIndex(this.gradientSprite, contentIndex);

    // Position content container
    const titleHeight = this.config.title ? 50 : 0;
    this.contentContainer.x = bgOffset + this.config.padding;
    this.contentContainer.y = bgOffset + titleHeight + this.config.padding;
  }

  /**
   * Create the title text
   */
  private createTitle(): void {
    const { width, colorScheme, titleFontSize, borderWidth } = this.config;

    this.titleText = graphics().createText(this.config.title, {
      fontFamily: '"Fredoka One", "Arial Black", sans-serif',
      fontSize: titleFontSize,
      fontWeight: 'bold',
      fill: colorScheme.titleColor,
      stroke: colorScheme.titleStroke,
      strokeThickness: 4,
      align: 'center',
    });

    // Center title
    const titleWidth = this.titleText.width || 100;
    this.titleText.x = (width - titleWidth) / 2;
    this.titleText.y = borderWidth + 12;

    this.container.addChild(this.titleText);
  }

  /**
   * Create the close button - polished game style
   */
  private createCloseButton(): void {
    const { width, colorScheme, borderWidth } = this.config;
    const factory = graphics();

    // Remove existing close button if any
    if (this.closeButton) {
      this.container.removeChild(this.closeButton);
    }

    this.closeButton = factory.createContainer();

    // Button size
    const buttonSize = 44;
    const buttonRadius = buttonSize / 2;
    const depthOffset = 3;
    const borderSize = 3;

    // Position at top right, slightly overlapping
    const buttonX = width - buttonSize / 2 - borderWidth;
    const buttonY = borderWidth - buttonSize / 4;

    // Layer 1: Depth (darker, extends below)
    const depth = factory.createGraphics();
    depth.circle(buttonSize / 2, buttonSize / 2 + depthOffset, buttonRadius);
    depth.fill({ color: this.darkenColor(colorScheme.closeButtonBorder, 0.3) });
    this.closeButton.addChild(depth);

    // Layer 2: Border
    const border = factory.createGraphics();
    border.circle(buttonSize / 2, buttonSize / 2, buttonRadius);
    border.fill(colorScheme.closeButtonBorder);
    this.closeButton.addChild(border);

    // Layer 3: Background with gradient effect (using multiple fills)
    const bg = factory.createGraphics();
    const innerRadius = buttonRadius - borderSize;

    // Bottom half (darker)
    bg.circle(buttonSize / 2, buttonSize / 2, innerRadius);
    bg.fill(this.darkenColor(colorScheme.closeButtonBg, 0.15));

    // Top half overlay (lighter)
    bg.ellipse(buttonSize / 2, buttonSize / 2 - innerRadius * 0.15, innerRadius * 0.95, innerRadius * 0.75);
    bg.fill(colorScheme.closeButtonBg);

    this.closeButton.addChild(bg);

    // Layer 4: Specular highlights
    const shine = factory.createGraphics();
    // Rim light at top
    shine.ellipse(buttonSize / 2, buttonSize / 2 - innerRadius + 4, innerRadius * 0.6, 2);
    shine.fill({ color: 0xFFFFFF, alpha: 0.4 });
    // Corner specular
    shine.ellipse(buttonSize / 2 - innerRadius * 0.3, buttonSize / 2 - innerRadius * 0.4, 4, 2);
    shine.fill({ color: 0xFFFFFF, alpha: 0.5 });
    this.closeButton.addChild(shine);

    // Layer 5: X icon
    const xGraphics = factory.createGraphics();
    const xSize = 9;
    const xCenter = buttonSize / 2;
    const xThickness = 4;

    // Draw X shadow
    xGraphics.moveTo(xCenter - xSize + 1, xCenter - xSize + 2);
    xGraphics.lineTo(xCenter + xSize + 1, xCenter + xSize + 2);
    xGraphics.moveTo(xCenter + xSize + 1, xCenter - xSize + 2);
    xGraphics.lineTo(xCenter - xSize + 1, xCenter + xSize + 2);
    xGraphics.stroke({ width: xThickness, color: 0x000000, alpha: 0.3, cap: 'round' });

    // Draw X
    xGraphics.moveTo(xCenter - xSize, xCenter - xSize);
    xGraphics.lineTo(xCenter + xSize, xCenter + xSize);
    xGraphics.moveTo(xCenter + xSize, xCenter - xSize);
    xGraphics.lineTo(xCenter - xSize, xCenter + xSize);
    xGraphics.stroke({ width: xThickness, color: colorScheme.closeButtonX, cap: 'round' });

    this.closeButton.addChild(xGraphics);

    this.closeButton.x = buttonX - buttonSize / 2;
    this.closeButton.y = buttonY;

    // Make interactive with press animation
    this.closeButton.eventMode = 'static';
    this.closeButton.cursor = 'pointer';

    // Hit area
    this.closeButton.hitArea = {
      contains: (x: number, y: number) => {
        const dx = x - buttonSize / 2;
        const dy = y - buttonSize / 2;
        return dx * dx + dy * dy <= buttonRadius * buttonRadius;
      }
    };

    let isPressed = false;

    this.closeButton.on('pointerdown', () => {
      isPressed = true;
      // Press animation - scale from center
      const scale = 0.92;
      const offset = buttonSize * (1 - scale) / 2;
      this.closeButton!.scale.x = scale;
      this.closeButton!.scale.y = scale;
      this.closeButton!.x += offset;
      this.closeButton!.y += offset;
    });

    this.closeButton.on('pointerup', () => {
      if (isPressed) {
        // Restore scale
        const scale = 0.92;
        const offset = buttonSize * (1 - scale) / 2;
        this.closeButton!.x -= offset;
        this.closeButton!.y -= offset;
        this.closeButton!.scale.x = 1;
        this.closeButton!.scale.y = 1;
        isPressed = false;

        this.emit('close');
        this.config.onClose();
      }
    });

    this.closeButton.on('pointerupoutside', () => {
      if (isPressed) {
        // Restore scale without triggering close
        const scale = 0.92;
        const offset = buttonSize * (1 - scale) / 2;
        this.closeButton!.x -= offset;
        this.closeButton!.y -= offset;
        this.closeButton!.scale.x = 1;
        this.closeButton!.scale.y = 1;
        isPressed = false;
      }
    });

    this.container.addChild(this.closeButton);
  }

  /**
   * Darken a color by a factor
   */
  private darkenColor(color: number, factor: number): number {
    const r = Math.max(0, Math.floor(((color >> 16) & 0xFF) * (1 - factor)));
    const g = Math.max(0, Math.floor(((color >> 8) & 0xFF) * (1 - factor)));
    const b = Math.max(0, Math.floor((color & 0xFF) * (1 - factor)));
    return (r << 16) | (g << 8) | b;
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
