import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors, numberToHex, lightenColor, darkenColor } from '../themes/GameStyleUITheme';

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
}

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
  borderRadius?: number;
  borderWidth?: number;
  shadowOffset?: number;
  disabled?: boolean;
  icon?: string; // Optional icon before text
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
  private textField?: IText;

  private config: Required<GameStyleButtonConfig>;
  private isPressed: boolean = false;
  private isHovered: boolean = false;

  constructor(config: GameStyleButtonConfig = {}) {
    super();

    // Default configuration
    this.config = {
      text: config.text || 'Button',
      width: config.width || 200,
      height: config.height || 70,
      fontSize: config.fontSize || 28,
      fontFamily: config.fontFamily || '"Fredoka One", "Arial Black", sans-serif',
      colorScheme: config.colorScheme || GameStyleColors.YELLOW_BUTTON,
      borderRadius: config.borderRadius || 16,
      borderWidth: config.borderWidth || 4,
      shadowOffset: config.shadowOffset || 6,
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

    // Build button layers (order matters for z-index)
    this.container.addChild(this.shadowGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.backgroundGraphics);
    this.container.addChild(this.highlightGraphics);

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

    this.textField = graphics().createText(this.config.text, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: 'bold',
      fill: colorScheme.text,
      stroke: { color: colorScheme.textStroke, width: Math.max(3, fontSize / 8) },
      align: 'center',
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 2,
        blur: 2,
        color: 0x000000,
        distance: 2
      }
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
   * Render all button graphics
   */
  private render(): void {
    const { width, height, borderRadius, borderWidth, shadowOffset, colorScheme, disabled } = this.config;

    // Clear all graphics
    this.shadowGraphics.clear();
    this.borderGraphics.clear();
    this.backgroundGraphics.clear();
    this.highlightGraphics.clear();

    // Adjust for pressed state
    const pressedOffset = this.isPressed ? shadowOffset - 2 : 0;
    const currentShadowOffset = this.isPressed ? 2 : shadowOffset;

    // Get colors (grayed out if disabled)
    const colors = disabled ? this.getDisabledColors() : colorScheme;

    // 1. Drop Shadow (bottom layer)
    this.shadowGraphics.roundRect(
      0,
      currentShadowOffset,
      width,
      height,
      borderRadius
    );
    this.shadowGraphics.fill({ color: colors.shadow, alpha: 0.8 });

    // 2. Outer Border (dark)
    this.borderGraphics.roundRect(
      0,
      pressedOffset,
      width,
      height,
      borderRadius
    );
    this.borderGraphics.fill({ color: colors.border });

    // 3. Main Background with gradient
    this.renderGradientBackground(
      borderWidth,
      borderWidth + pressedOffset,
      width - borderWidth * 2,
      height - borderWidth * 2,
      borderRadius - borderWidth / 2,
      colors.gradientTop,
      colors.gradientBottom
    );

    // 4. Top Highlight/Shine
    if (!this.isPressed) {
      this.renderHighlight(
        borderWidth + 4,
        borderWidth + pressedOffset + 4,
        width - borderWidth * 2 - 8,
        (height - borderWidth * 2) * 0.35,
        borderRadius - borderWidth,
        colors.highlight
      );
    }

    // Update text position for press effect
    if (this.textField) {
      this.textField.y = height / 2 + pressedOffset;
    }
  }

  /**
   * Render gradient background using canvas texture
   */
  private renderGradientBackground(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    colorTop: number,
    colorBottom: number
  ): void {
    // Create gradient texture
    const texture = graphics().createCanvasTexture(
      Math.ceil(width),
      Math.ceil(height),
      (ctx: CanvasRenderingContext2D) => {
        // Create vertical gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, numberToHex(colorTop));
        gradient.addColorStop(0.4, numberToHex(colorTop));
        gradient.addColorStop(0.6, numberToHex(colorBottom));
        gradient.addColorStop(1, numberToHex(colorBottom));

        ctx.fillStyle = gradient;

        // Draw rounded rectangle
        this.drawRoundedRect(ctx, 0, 0, width, height, radius);
        ctx.fill();
      }
    );

    // Apply texture to background
    this.backgroundGraphics.texture(texture);
    this.backgroundGraphics.roundRect(x, y, width, height, radius);
    this.backgroundGraphics.fill();
  }

  /**
   * Render top highlight/shine effect
   */
  private renderHighlight(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: number
  ): void {
    // Create highlight texture with gradient fade
    const texture = graphics().createCanvasTexture(
      Math.ceil(width),
      Math.ceil(height),
      (ctx: CanvasRenderingContext2D) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0.6)`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, 0.3)`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.fillStyle = gradient;
        this.drawRoundedRect(ctx, 0, 0, width, height, Math.min(radius, height / 2));
        ctx.fill();
      }
    );

    this.highlightGraphics.texture(texture);
    this.highlightGraphics.roundRect(x, y, width, height, Math.min(radius, height / 2));
    this.highlightGraphics.fill();
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
   * Draw rounded rectangle path on canvas context
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * Pointer event handlers
   */
  private onPointerDown(event: any): void {
    if (this.config.disabled) return;

    this.isPressed = true;
    this.render();

    // Scale feedback
    this.container.scale.x = 0.97;
    this.container.scale.y = 0.97;

    this.emit('press', event);
  }

  private onPointerUp(event: any): void {
    if (this.config.disabled) return;

    this.isPressed = false;
    this.render();

    // Scale back
    this.container.scale.x = 1;
    this.container.scale.y = 1;

    this.emit('click', event);
    this.emit('release', event);
  }

  private onPointerUpOutside(): void {
    if (this.config.disabled) return;

    this.isPressed = false;
    this.render();

    this.container.scale.x = 1;
    this.container.scale.y = 1;

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
      this.textField.style.stroke = { color: colorScheme.textStroke, width: this.config.fontSize / 8 };
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
  }
};
