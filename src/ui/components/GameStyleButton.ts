import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText, ISprite } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors, numberToHex, lightenColor, darkenColor } from '../themes/GameStyleUITheme';

/**
 * Creates a vertical linear gradient texture using canvas
 * @internal
 */
function createGradientTexture(
  width: number,
  height: number,
  colorTop: number,
  colorBottom: number,
  borderRadius: number = 0
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Convert hex numbers to CSS color strings
  const topHex = '#' + colorTop.toString(16).padStart(6, '0');
  const bottomHex = '#' + colorBottom.toString(16).padStart(6, '0');

  // Create vertical gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, topHex);
  gradient.addColorStop(1, bottomHex);

  // Draw rounded rect with gradient
  if (borderRadius > 0) {
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, borderRadius);
    ctx.fillStyle = gradient;
    ctx.fill();
  } else {
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  return canvas;
}

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
  private shadowGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private backgroundGraphics: IGraphics;
  private highlightGraphics: IGraphics;
  private shineGraphics: IGraphics;  // Specular highlight & rim light
  private gradientSprite?: ISprite;  // Gradient fill sprite
  private textField?: IText;

  private config: Required<GameStyleButtonConfig>;
  private isPressed: boolean = false;
  private isHovered: boolean = false;

  constructor(config: GameStyleButtonConfig = {}) {
    super();

    // Default configuration - Mobile game style defaults (No Ads popup style)
    this.config = {
      text: config.text || 'Button',
      width: config.width || 200,
      height: config.height || 70,
      fontSize: config.fontSize || 28,
      fontFamily: config.fontFamily || '"Fredoka One", "Arial Black", sans-serif',
      colorScheme: config.colorScheme || GameStyleColors.GREEN_BUTTON,
      buttonStyle: config.buttonStyle || 'raised',  // 'raised' or 'flat'
      borderRadius: config.borderRadius || 14,
      borderWidth: config.borderWidth || 1,
      shadowOffset: config.shadowOffset || 3,
      disabled: config.disabled || false,
      icon: config.icon || ''
    };

    // Ensure minimum touch target
    this.config.width = Math.max(this.config.width, 88);
    this.config.height = Math.max(this.config.height, 44);

    // Create containers and graphics
    this.container = graphics().createContainer();
    this.shadowGraphics = graphics().createGraphics();
    this.borderGraphics = graphics().createGraphics();
    this.backgroundGraphics = graphics().createGraphics();
    this.highlightGraphics = graphics().createGraphics();
    this.shineGraphics = graphics().createGraphics();

    // Build button layers (order matters for z-index)
    this.container.addChild(this.shadowGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.backgroundGraphics);
    this.container.addChild(this.highlightGraphics);
    this.container.addChild(this.shineGraphics);

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
   */
  private createText(): void {
    const { colorScheme, fontSize, fontFamily, width, height } = this.config;

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
      fontWeight: 'bold',
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
    this.shadowGraphics.clear();
    this.borderGraphics.clear();
    this.backgroundGraphics.clear();
    this.highlightGraphics.clear();
    this.shineGraphics.clear();

    // Remove old gradient sprite if exists
    if (this.gradientSprite) {
      this.container.removeChild(this.gradientSprite);
      this.gradientSprite = undefined;
    }

    // Get colors (grayed out if disabled)
    const colors = disabled ? this.getDisabledColors() : colorScheme;

    // Render based on style
    if (buttonStyle === 'flat') {
      this.renderFlatStyle(width, height, borderRadius, borderWidth, colors);
    } else {
      this.renderRaisedStyle(width, height, borderRadius, borderWidth, shadowOffset, colors);
    }
  }

  /**
   * Render 'raised' style - No Ads popup button style
   * Features: black outer border, green shadow, top shine, highlight, jellybean
   */
  private renderRaisedStyle(
    width: number,
    height: number,
    borderRadius: number,
    borderWidth: number,
    shadowOffset: number,
    colors: GameButtonColorScheme
  ): void {
    // Pressed state adjustments
    const pressedOffset = this.isPressed ? shadowOffset - 1 : 0;
    const currentShadowOffset = this.isPressed ? 1 : shadowOffset;

    // Layer 1: Black outer border (stroke around everything including shadow)
    this.shadowGraphics.roundRect(
      -1,
      -1,
      width + 2,
      height + currentShadowOffset + 2,
      borderRadius + 1
    );
    this.shadowGraphics.stroke({ color: 0x000000, width: 1 });

    // Layer 2: Shadow/depth (green, visible at bottom)
    this.borderGraphics.roundRect(
      0,
      currentShadowOffset + pressedOffset,
      width,
      height,
      borderRadius
    );
    this.borderGraphics.fill({ color: colors.shadow });

    // Layer 3: Top shine (white, peek above main button)
    this.backgroundGraphics.roundRect(
      0.5,
      pressedOffset - 0.5,
      width - 1,
      height,
      borderRadius
    );
    this.backgroundGraphics.fill({ color: 0xFFFFFF, alpha: 0.60 });

    // Layer 4: Main button fill
    const fillX = 0;
    const fillY = pressedOffset;
    const fillWidth = width;
    const fillHeight = height;
    const fillRadius = borderRadius;

    // Create gradient texture and sprite (or solid color)
    const gradientCanvas = createGradientTexture(
      fillWidth,
      fillHeight,
      colors.gradientTop,
      colors.gradientBottom,
      fillRadius
    );
    const gradientTexture = graphics().createTexture(gradientCanvas);
    this.gradientSprite = graphics().createSprite(gradientTexture);
    this.gradientSprite.x = fillX;
    this.gradientSprite.y = fillY;

    // Insert gradient sprite after background graphics
    const bgIndex = this.container.getChildIndex(this.backgroundGraphics);
    this.container.addChild(this.gradientSprite);
    this.container.setChildIndex(this.gradientSprite, bgIndex + 1);

    // Layer 5: Highlight (upper portion, white 25% alpha, sharp bottom)
    const hlX = fillX + 3;
    const hlY = fillY + 3;
    const hlW = fillWidth - 6;
    const hlH = fillHeight * 0.45;
    const hlR = Math.max(4, fillRadius - 2);

    if (!this.isPressed) {
      // Draw highlight with rounded top, sharp bottom
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

    // Layer 6: Jellybean gloss (small ellipse top-left, rotated)
    if (!this.isPressed && colors.jellybean) {
      this.shineGraphics.ellipse(0, 0, 3.5, 2.6);
      this.shineGraphics.fill({ color: colors.jellybean });
      this.shineGraphics.x = fillX + 10;
      this.shineGraphics.y = fillY + 9;
      this.shineGraphics.rotation = -25 * Math.PI / 180;
    }

    // Update text position for press animation
    if (this.textField) {
      this.textField.y = this.config.height / 2 + pressedOffset;
    }
  }

  /**
   * Render 'flat' style - 3D depth effect via extended bottom border
   * The button looks like a thick 3D box - border extends downward at bottom
   * NO separate shadow - the depth IS part of the border
   * Modern mobile game style (like reference screenshot 2)
   */
  private renderFlatStyle(
    width: number,
    height: number,
    borderRadius: number,
    borderWidth: number,
    colors: GameButtonColorScheme
  ): void {
    // Bottom depth - how much the border extends below (creates 3D thickness)
    const bottomDepth = 6;
    const pressedOffset = this.isPressed ? bottomDepth - 1 : 0;
    const currentDepth = this.isPressed ? 1 : bottomDepth;

    // Calculate derived colors
    const depthColor = darkenColor(colors.border, 0.2);  // Slightly darker for depth

    // Layer 1: Full border shape including bottom depth
    // This is ONE piece - the border wraps around AND extends at bottom
    this.shadowGraphics.roundRect(0, 0, width, height + currentDepth, borderRadius);
    this.shadowGraphics.fill({ color: depthColor });

    // Layer 2: Main border (covers most of layer 1, leaving depth visible at bottom)
    this.borderGraphics.roundRect(0, pressedOffset, width, height, borderRadius);
    this.borderGraphics.fill({ color: colors.border });

    // Layer 3: Inner fill area with gradient
    const fillX = borderWidth;
    const fillY = borderWidth + pressedOffset;
    const fillWidth = width - borderWidth * 2;
    const fillHeight = height - borderWidth * 2;
    const fillRadius = Math.max(4, borderRadius - borderWidth);

    // Create gradient texture and sprite
    const gradientCanvas = createGradientTexture(
      fillWidth,
      fillHeight,
      colors.gradientTop,
      colors.gradientBottom,
      fillRadius
    );
    const gradientTexture = graphics().createTexture(gradientCanvas);
    this.gradientSprite = graphics().createSprite(gradientTexture);
    this.gradientSprite.x = fillX;
    this.gradientSprite.y = fillY;

    // Insert gradient sprite after border graphics
    const borderIndex = this.container.getChildIndex(this.borderGraphics);
    this.container.addChild(this.gradientSprite);
    this.container.setChildIndex(this.gradientSprite, borderIndex + 1);

    // Layer 4: Subtle highlight overlay for glass effect (upper half)
    const highlightHeight = fillHeight * 0.35;
    if (!this.isPressed) {
      this.highlightGraphics.roundRect(
        fillX + 3,
        fillY + 2,
        fillWidth - 6,
        highlightHeight,
        Math.min(fillRadius - 2, 10)
      );
      this.highlightGraphics.fill({ color: 0xFFFFFF, alpha: 0.12 });
    }

    // Layer 5: Specular highlights
    // Rim light - very thin bright arc at top edge (like light reflection)
    this.shineGraphics.roundRect(
      fillX + 8,
      fillY + 2,
      fillWidth - 16,
      2,
      1
    );
    this.shineGraphics.fill({ color: 0xFFFFFF, alpha: this.isPressed ? 0.15 : 0.4 });

    // Corner specular - small ellipse at top-left (glass reflection)
    if (!this.isPressed) {
      this.shineGraphics.ellipse(fillX + 14, fillY + 8, 5, 3);
      this.shineGraphics.fill({ color: 0xFFFFFF, alpha: 0.5 });
    }

    // Update text position for press effect
    if (this.textField) {
      this.textField.y = this.config.height / 2 + pressedOffset;
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

  /**
   * Pointer event handlers
   */
  private onPointerDown(event: any): void {
    if (this.config.disabled) return;

    this.isPressed = true;
    this.render();

    // Scale from center - apply scale and offset to compensate
    const scale = 0.96;
    const offsetX = this.config.width * (1 - scale) / 2;
    const offsetY = this.config.height * (1 - scale) / 2;
    this.container.scale.x = scale;
    this.container.scale.y = scale;
    this.container.x += offsetX;
    this.container.y += offsetY;

    this.emit('press', event);
  }

  private onPointerUp(event: any): void {
    if (this.config.disabled) return;

    // Restore position before scale reset
    const scale = 0.96;
    const offsetX = this.config.width * (1 - scale) / 2;
    const offsetY = this.config.height * (1 - scale) / 2;
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
    const scale = 0.96;
    const offsetX = this.config.width * (1 - scale) / 2;
    const offsetY = this.config.height * (1 - scale) / 2;
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
      this.textField.text = text;
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
   * @param icon - Icon character (emoji or text like '✕', '⚙', '⏸')
   * @param colorScheme - Color scheme (default: RED for close buttons)
   * @param size - Button size (default: 40)
   */
  icon(
    icon: string,
    colorScheme: GameButtonColorScheme = GameStyleColors.RED_BUTTON,
    size: number = 40
  ): GameStyleButton {
    return new GameStyleButton({
      text: icon,
      width: size,
      height: size,
      fontSize: Math.floor(size * 0.5),
      colorScheme,
      borderRadius: Math.floor(size * 0.25),
      borderWidth: 2,
      shadowOffset: 3
    });
  },

  /**
   * Create a close (X) icon button - red square
   */
  close(size: number = 40): GameStyleButton {
    return GameButtons.icon('✕', GameStyleColors.RED_BUTTON, size);
  },

  /**
   * Create a settings (gear) icon button
   */
  settings(size: number = 40): GameStyleButton {
    return GameButtons.icon('⚙', GameStyleColors.BLUE_BUTTON, size);
  },

  /**
   * Create a pause icon button
   */
  pause(size: number = 40): GameStyleButton {
    return GameButtons.icon('⏸', GameStyleColors.YELLOW_BUTTON, size);
  },

  /**
   * Create a play icon button (triangle)
   */
  playIcon(size: number = 40): GameStyleButton {
    return GameButtons.icon('▶', GameStyleColors.GREEN_BUTTON, size);
  },

  /**
   * Create an info icon button
   */
  info(size: number = 40): GameStyleButton {
    return GameButtons.icon('ℹ', GameStyleColors.BLUE_BUTTON, size);
  },

  /**
   * Create a home icon button
   */
  home(size: number = 40): GameStyleButton {
    return GameButtons.icon('🏠', GameStyleColors.YELLOW_BUTTON, size);
  }
};
