import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText, ISprite } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors } from '../themes/GameStyleUITheme';
import { getFrameworkFontFamily, loadFrameworkFont } from '../utils/FontLoader';

/**
 * Color scheme for game-style buttons
 */
export interface GameButtonColorScheme {
  gradientTop: number;
  gradientBottom: number;
  border: number;
  shadow: number;
  highlight: number;
  text: number;
  textStroke: number;
  jellybean?: number;  // Optional jellybean gloss color
}

/**
 * Button visual style presets
 * - 'raised': Classic 3D with drop shadow (Candy Crush style)
 * - 'flat': No shadow, thick bottom edge creates depth (modern mobile style)
 */
export type GameButtonStyle = 'raised' | 'flat';

/**
 * GameStyleButton configuration
 */
export interface GameStyleButtonConfig {
  text?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  colorScheme?: GameButtonColorScheme;
  buttonStyle?: GameButtonStyle;  // 'raised' (shadow) or 'flat' (edge)
  borderRadius?: number;
  borderWidth?: number;
  shadowOffset?: number;          // Only used in 'raised' style
  horizontalPadding?: number;     // Safe padding from left/right edges (default: 12)
  disabled?: boolean;
  icon?: string;
}

/**
 * GameStyleButton - Mobile game style button with multi-layer effects
 *
 * Features:
 * - Multi-layer border (dark outer, light inner)
 * - Vertical gradient (light top, dark bottom)
 * - Top shine/highlight effect
 * - 3D bevel/raised effect
 * - Drop shadow that moves on press
 * - Scale animation on press
 * - Bold text with stroke outline
 *
 * Inspired by: Brawl Stars, Candy Crush, Clash Royale style buttons
 *
 * @example
 * ```typescript
 * const playButton = new GameStyleButton({
 *   text: 'Play',
 *   width: 200,
 *   height: 70,
 *   colorScheme: GameStyleColors.YELLOW_BUTTON
 * });
 *
 * playButton.on('click', () => startGame());
 * stage.addChild(playButton.getContainer());
 * ```
 */
export class GameStyleButton extends EventEmitter {
  private container: IContainer;
  // Layer order (bottom to top): border → shadow → topShine → mainFill → highlight → jellybean → text
  private borderGraphics: IGraphics;      // 1. Black outer border (stroke)
  private shadowGraphics: IGraphics;      // 2. Shadow/depth (fill)
  private topShineGraphics: IGraphics;    // 3. Top shine (white 60% alpha)
  private mainFillGraphics: IGraphics;    // 4. Main button fill
  private highlightGraphics: IGraphics;   // 5. Highlight (white 25% alpha, rounded top)
  private jellybeanGraphics: IGraphics;   // 6. Jellybean gloss
  private textField?: IText;

  private config: Required<GameStyleButtonConfig>;
  private isPressed: boolean = false;
  private isHovered: boolean = false;

  constructor(config: GameStyleButtonConfig = {}) {
    super();

    // Trigger font loading (non-blocking)
    loadFrameworkFont();

    // Default configuration - Mobile game style defaults (No Ads popup style)
    this.config = {
      text: config.text || 'Button',
      width: config.width || 200,
      height: config.height || 70,
      fontSize: config.fontSize || 28,
      fontFamily: config.fontFamily || getFrameworkFontFamily(),
      colorScheme: config.colorScheme || GameStyleColors.GREEN_BUTTON,
      buttonStyle: config.buttonStyle || 'raised',  // 'raised' or 'flat'
      borderRadius: config.borderRadius || 14,
      borderWidth: config.borderWidth || 1,
      shadowOffset: config.shadowOffset || 3,
      horizontalPadding: config.horizontalPadding ?? 12,  // Safe text padding from edges
      disabled: config.disabled || false,
      icon: config.icon || ''
    };

    // Note: No minimum size constraint - developer controls button size

    // Create containers and graphics
    this.container = graphics().createContainer();
    this.borderGraphics = graphics().createGraphics();
    this.shadowGraphics = graphics().createGraphics();
    this.topShineGraphics = graphics().createGraphics();
    this.mainFillGraphics = graphics().createGraphics();
    this.highlightGraphics = graphics().createGraphics();
    this.jellybeanGraphics = graphics().createGraphics();

    // Build button layers (order matters for z-index) - exactly like no-ads-popup-demo
    this.container.addChild(this.borderGraphics);      // 1. Black outer border
    this.container.addChild(this.shadowGraphics);      // 2. Shadow
    this.container.addChild(this.topShineGraphics);    // 3. Top shine
    this.container.addChild(this.mainFillGraphics);    // 4. Main fill
    this.container.addChild(this.highlightGraphics);   // 5. Highlight
    this.container.addChild(this.jellybeanGraphics);   // 6. Jellybean

    // Create text
    if (this.config.text) {
      this.createText();
    }

    // Initial render
    this.render();

    // Setup interactivity
    this.setupInteractivity();
  }

  /**
   * Create styled text with stroke
   * Text is automatically scaled down if it exceeds available width
   */
  private createText(): void {
    const { colorScheme, fontSize, fontFamily, width, height, horizontalPadding } = this.config;

    // Determine if we need dark text (for light backgrounds like cream)
    const isLightBackground = this.isLightColor(colorScheme.gradientTop);
    const textColor = colorScheme.text;
    const strokeColor = colorScheme.textStroke;
    const strokeThickness = isLightBackground
      ? Math.max(2, fontSize / 12)
      : Math.max(3, fontSize / 8);

    this.textField = graphics().createText(this.config.text, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: '700',  // Bold - Fredoka's max weight
      fill: textColor,
      stroke: strokeColor,
      strokeThickness: strokeThickness,
      align: 'center',
      dropShadow: !isLightBackground,
      dropShadowAlpha: 0.5,
      dropShadowAngle: Math.PI / 2,
      dropShadowBlur: 2,
      dropShadowColor: 0x000000,
      dropShadowDistance: 2
    });

    if (this.textField.anchor) this.textField.anchor.set(0.5, 0.5);
    this.textField.x = width / 2;
    this.textField.y = height / 2;

    // Scale down text if it exceeds available width (with padding)
    const availableWidth = width - (horizontalPadding * 2);
    const textWidth = (this.textField as any).width || 0;
    if (textWidth > availableWidth && textWidth > 0) {
      const scale = availableWidth / textWidth;
      this.textField.scale = { x: scale, y: scale };
    }

    this.container.addChild(this.textField);
  }

  /**
   * Setup touch/mouse events
   */
  private setupInteractivity(): void {
    this.container.eventMode = 'static';
    this.container.cursor = this.config.disabled ? 'default' : 'pointer';

    this.container.on('pointerdown', this.onPointerDown.bind(this));
    this.container.on('pointerup', this.onPointerUp.bind(this));
    this.container.on('pointerupoutside', this.onPointerUpOutside.bind(this));
    this.container.on('pointerover', this.onPointerOver.bind(this));
    this.container.on('pointerout', this.onPointerOut.bind(this));
  }

  /**
   * Render all button graphics - Mobile game style with 3D effect
   * Supports two styles:
   * - 'raised': Drop shadow style (Candy Crush)
   * - 'flat': Bottom edge style (modern mobile games)
   */
  private render(): void {
    const { width, height, borderRadius, borderWidth, shadowOffset, colorScheme, buttonStyle, disabled } = this.config;

    // Clear all graphics
    this.borderGraphics.clear();
    this.shadowGraphics.clear();
    this.topShineGraphics.clear();
    this.mainFillGraphics.clear();
    this.highlightGraphics.clear();
    this.jellybeanGraphics.clear();

    // Reset jellybean transform
    this.jellybeanGraphics.x = 0;
    this.jellybeanGraphics.y = 0;
    this.jellybeanGraphics.rotation = 0;

    // Get colors (grayed out if disabled)
    const colors = disabled ? this.getDisabledColors() : colorScheme;

    // Render raised style (No Ads popup style)
    this.renderRaisedStyle(width, height, borderRadius, borderWidth, shadowOffset, colors);
  }

  /**
   * Render 'raised' style - EXACT copy from no-ads-popup-demo.html
   * Layer order: border → shadow → topShine → mainFill → highlight → jellybean
   */
  private renderRaisedStyle(
    width: number,
    height: number,
    borderRadius: number,
    borderWidth: number,
    shadowOffset: number,
    colors: GameButtonColorScheme
  ): void {
    // Demo variables (origin is 0,0 for button-local coordinates)
    const ctaX = 0;
    const ctaY = this.isPressed ? shadowOffset - 1 : 0;
    const ctaWidth = width;
    const ctaHeight = height;
    const ctaRadius = borderRadius;
    const currentShadowOffset = this.isPressed ? 1 : shadowOffset;

    // 1. Black border (tüm butonu çerçeveleyen - shadow dahil, 1px)
    // Demo: ctaOuterBorder.roundRect(ctaX - 1, ctaY - 1, ctaWidth + 2, ctaHeight + shadowOffset + 2, ctaRadius + 1);
    // Demo: ctaOuterBorder.stroke({ color: 0x000000, width: 1 });
    this.borderGraphics.roundRect(
      ctaX - 1,
      -1,  // Always starts at -1 (border is fixed position)
      ctaWidth + 2,
      ctaHeight + currentShadowOffset + 2,
      ctaRadius + 1
    );
    this.borderGraphics.stroke({ color: colors.border, width: borderWidth });

    // 2. Shadow (alt kısım - yeşil)
    // Demo: ctaShadow.roundRect(ctaX, ctaY + shadowOffset, ctaWidth, ctaHeight, ctaRadius);
    // Demo: ctaShadow.fill(0x28A165);
    this.shadowGraphics.roundRect(
      ctaX,
      currentShadowOffset,  // Shadow is always at shadowOffset from top
      ctaWidth,
      ctaHeight,
      ctaRadius
    );
    this.shadowGraphics.fill({ color: colors.shadow });

    // 2.5. Top shine (üst parlaklık - border içinde kalacak, %60 opak)
    // Demo: ctaTopShine.roundRect(ctaX + 0.5, ctaY - 0.5, ctaWidth - 1, ctaHeight, ctaRadius);
    // Demo: ctaTopShine.fill({ color: 0xFFFFFF, alpha: 0.60 });
    this.topShineGraphics.roundRect(
      ctaX + 0.5,
      ctaY - 0.5,
      ctaWidth - 1,
      ctaHeight,
      ctaRadius
    );
    this.topShineGraphics.fill({ color: 0xFFFFFF, alpha: 0.60 });

    // 3. Button main (ana yüzey - yeşil)
    // Demo: ctaBtn.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, ctaRadius);
    // Demo: ctaBtn.fill(0x2DE45A);
    this.mainFillGraphics.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, ctaRadius);
    this.mainFillGraphics.fill({ color: colors.gradientTop });

    // 4. Highlight (parlama efekti - üst köşeler yuvarlak, alt keskin)
    // Demo: exactly as written
    if (!this.isPressed) {
      const hlX = ctaX + 3;
      const hlY = ctaY + 3;
      const hlW = ctaWidth - 6;
      const hlH = ctaHeight * 0.45;
      const hlR = ctaRadius - 2;

      this.highlightGraphics.moveTo(hlX + hlR, hlY);
      this.highlightGraphics.lineTo(hlX + hlW - hlR, hlY);
      this.highlightGraphics.arc(hlX + hlW - hlR, hlY + hlR, hlR, -Math.PI / 2, 0);
      this.highlightGraphics.lineTo(hlX + hlW, hlY + hlH);
      this.highlightGraphics.lineTo(hlX, hlY + hlH);
      this.highlightGraphics.lineTo(hlX, hlY + hlR);
      this.highlightGraphics.arc(hlX + hlR, hlY + hlR, hlR, Math.PI, -Math.PI / 2);
      this.highlightGraphics.closePath();
      this.highlightGraphics.fill({ color: 0xFFFFFF, alpha: 0.25 });
    }

    // 5. Jellybean efekti (sol üst köşe, orantılı boyut)
    // Base size for 58px height button: 3.5x2.6, position: 10,9
    if (!this.isPressed && colors.jellybean) {
      const scale = ctaHeight / 58;  // Scale relative to standard button height
      const jbWidth = 3.5 * scale;
      const jbHeight = 2.6 * scale;
      const jbX = 10 * scale;
      const jbY = 9 * scale;

      this.jellybeanGraphics.ellipse(0, 0, jbWidth, jbHeight);
      this.jellybeanGraphics.fill({ color: colors.jellybean });
      this.jellybeanGraphics.x = ctaX + jbX;
      this.jellybeanGraphics.y = ctaY + jbY;
      this.jellybeanGraphics.rotation = -25 * Math.PI / 180;
    }

    // Update text position for press animation
    if (this.textField) {
      this.textField.y = this.config.height / 2 + ctaY;
    }
  }

  /**
   * Get grayed out colors for disabled state
   */
  private getDisabledColors(): GameButtonColorScheme {
    return {
      gradientTop: 0x9E9E9E,
      gradientBottom: 0x757575,
      border: 0x616161,
      shadow: 0x424242,
      highlight: 0xBDBDBD,
      text: 0xE0E0E0,
      textStroke: 0x616161
    };
  }

  /**
   * Check if a color is light (for determining text contrast)
   */
  private isLightColor(color: number): boolean {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    // Using relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  }

  /** Press animation scale factor */
  private static readonly PRESS_SCALE = 0.96;

  /**
   * Get scale offset for press animation (centers the scale transform)
   */
  private getScaleOffset(): { offsetX: number; offsetY: number } {
    const scale = GameStyleButton.PRESS_SCALE;
    return {
      offsetX: this.config.width * (1 - scale) / 2,
      offsetY: this.config.height * (1 - scale) / 2
    };
  }

  /**
   * Pointer event handlers
   */
  private onPointerDown(event: any): void {
    if (this.config.disabled) return;

    this.isPressed = true;
    this.render();

    // Scale from center - apply scale and offset to compensate
    const { offsetX, offsetY } = this.getScaleOffset();
    this.container.scale.x = GameStyleButton.PRESS_SCALE;
    this.container.scale.y = GameStyleButton.PRESS_SCALE;
    this.container.x += offsetX;
    this.container.y += offsetY;

    this.emit('press', event);
  }

  private onPointerUp(event: any): void {
    if (this.config.disabled) return;

    // Restore position before scale reset
    const { offsetX, offsetY } = this.getScaleOffset();
    this.container.x -= offsetX;
    this.container.y -= offsetY;
    this.container.scale.x = 1;
    this.container.scale.y = 1;

    this.isPressed = false;
    this.render();

    this.emit('click', event);
    this.emit('release', event);
  }

  private onPointerUpOutside(): void {
    if (this.config.disabled) return;

    // Restore position before scale reset
    const { offsetX, offsetY } = this.getScaleOffset();
    this.container.x -= offsetX;
    this.container.y -= offsetY;
    this.container.scale.x = 1;
    this.container.scale.y = 1;

    this.isPressed = false;
    this.render();

    this.emit('cancel');
  }

  private onPointerOver(): void {
    if (this.config.disabled) return;
    this.isHovered = true;
    this.emit('hover');
  }

  private onPointerOut(): void {
    if (this.config.disabled) return;
    this.isHovered = false;
    this.emit('hoverEnd');
  }

  /**
   * Public API
   */

  public setText(text: string): this {
    this.config.text = text;
    if (this.textField) {
      // Reset scale before measuring
      this.textField.scale = { x: 1, y: 1 };
      this.textField.text = text;

      // Scale down if text exceeds available width
      const { width, horizontalPadding } = this.config;
      const availableWidth = width - (horizontalPadding * 2);
      const textWidth = (this.textField as any).width || 0;
      if (textWidth > availableWidth && textWidth > 0) {
        const scale = availableWidth / textWidth;
        this.textField.scale = { x: scale, y: scale };
      }
    }
    return this;
  }

  public setDisabled(disabled: boolean): this {
    this.config.disabled = disabled;
    this.container.cursor = disabled ? 'default' : 'pointer';
    this.render();
    return this;
  }

  public setColorScheme(colorScheme: GameButtonColorScheme): this {
    this.config.colorScheme = colorScheme;
    this.render();
    if (this.textField) {
      this.textField.style.fill = colorScheme.text;
      this.textField.style.stroke = colorScheme.textStroke;
      this.textField.style.strokeThickness = this.config.fontSize / 8;
    }
    return this;
  }

  public setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  public getContainer(): IContainer {
    return this.container;
  }

  public getWidth(): number {
    return this.config.width;
  }

  public getHeight(): number {
    return this.config.height;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}

/**
 * Pre-built button factory functions
 */
export const GameButtons = {
  /**
   * Create a yellow "Play" style button
   */
  play(text: string = 'Play', width: number = 220, height: number = 70): GameStyleButton {
    return new GameStyleButton({
      text,
      width,
      height,
      colorScheme: GameStyleColors.YELLOW_BUTTON
    });
  },

  /**
   * Create a green action button
   */
  success(text: string, width: number = 160, height: number = 56): GameStyleButton {
    return new GameStyleButton({
      text,
      width,
      height,
      colorScheme: GameStyleColors.GREEN_BUTTON
    });
  },

  /**
   * Create a blue secondary button
   */
  secondary(text: string, width: number = 160, height: number = 56): GameStyleButton {
    return new GameStyleButton({
      text,
      width,
      height,
      colorScheme: GameStyleColors.BLUE_BUTTON
    });
  },

  /**
   * Create a red warning/cancel button
   */
  danger(text: string, width: number = 160, height: number = 56): GameStyleButton {
    return new GameStyleButton({
      text,
      width,
      height,
      colorScheme: GameStyleColors.RED_BUTTON
    });
  },

  /**
   * Create a purple special button
   */
  special(text: string, width: number = 160, height: number = 56): GameStyleButton {
    return new GameStyleButton({
      text,
      width,
      height,
      colorScheme: GameStyleColors.PURPLE_BUTTON
    });
  },

  /**
   * Create a cream/beige "Play" style button (Candy Crush style)
   */
  cream(text: string = 'Play', width: number = 220, height: number = 60): GameStyleButton {
    return new GameStyleButton({
      text,
      width,
      height,
      colorScheme: GameStyleColors.CREAM_BUTTON,
      borderRadius: 18,
      shadowOffset: 5
    });
  },

  /**
   * Create a small square icon button (e.g., close, settings)
   * Same style as No Ads popup buttons but square
   * @param icon - Icon character (emoji or text like '✕', '⚙', '⏸')
   * @param colorScheme - Color scheme (default: RED for close buttons)
   * @param size - Button size (default: 36)
   */
  mini(
    icon: string,
    colorScheme: GameButtonColorScheme = GameStyleColors.RED_BUTTON,
    size: number = 36
  ): GameStyleButton {
    return new GameStyleButton({
      text: icon,
      width: size,
      height: size,
      fontSize: Math.floor(size * 0.55),  // Larger font for icons
      colorScheme,
      borderRadius: Math.floor(size * 0.22),
      borderWidth: 1,
      shadowOffset: 2
    });
  },

  /**
   * Create a close (X) icon button - red square
   */
  close(size: number = 36): GameStyleButton {
    return GameButtons.mini('X', GameStyleColors.RED_BUTTON, size);
  },

  /**
   * Create a settings (gear) icon button
   */
  settings(size: number = 36): GameStyleButton {
    return GameButtons.mini('⚙', GameStyleColors.BLUE_BUTTON, size);
  },

  /**
   * Create a pause icon button
   */
  pause(size: number = 36): GameStyleButton {
    return GameButtons.mini('⏸', GameStyleColors.YELLOW_BUTTON, size);
  },

  /**
   * Create a play icon button (triangle)
   */
  playIcon(size: number = 36): GameStyleButton {
    return GameButtons.mini('▶', GameStyleColors.GREEN_BUTTON, size);
  },

  /**
   * Create an info icon button
   */
  info(size: number = 36): GameStyleButton {
    return GameButtons.mini('ℹ', GameStyleColors.BLUE_BUTTON, size);
  },

  /**
   * Create a home icon button
   */
  home(size: number = 36): GameStyleButton {
    return GameButtons.mini('🏠', GameStyleColors.YELLOW_BUTTON, size);
  }
};
