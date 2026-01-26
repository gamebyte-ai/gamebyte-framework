import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText, ITexture } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { getFrameworkFontFamily } from '../utils/FontLoader';

/**
 * UIButton configuration
 */
export interface UIButtonConfig {
  text?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textColor?: number;
  backgroundColor?: number;
  hoverColor?: number;
  pressedColor?: number;
  disabledColor?: number;
  borderColor?: number;
  borderWidth?: number;
  borderRadius?: number;
  disabled?: boolean;
  rippleEffect?: boolean;
  glowEffect?: boolean;
  shadowEffect?: boolean;
  gradient?: {
    enabled: boolean;
    colorTop?: number;
    colorBottom?: number;
  };
}

/**
 * Modern UIButton component for mobile games
 *
 * Features:
 * - Gradient backgrounds
 * - Glow effects
 * - Shadow effects
 * - Ripple animations on tap
 * - Smooth touch feedback
 * - Mobile-optimized (44px minimum touch target)
 *
 * @example
 * ```typescript
 * const button = new UIButton({
 *   text: 'PLAY',
 *   width: 200,
 *   height: 60,
 *   backgroundColor: 0x4CAF50,
 *   gradient: { enabled: true, colorTop: 0x66BB6A, colorBottom: 0x388E3C },
 *   glowEffect: true,
 *   shadowEffect: true
 * });
 *
 * button.on('click', () => console.log('Button clicked!'));
 * scene.addChild(button.getContainer());
 * ```
 */
export class UIButton extends EventEmitter {
  private container: IContainer;
  private background: IGraphics;
  private glowGraphics?: IGraphics;
  private shadowGraphics?: IGraphics;
  private textField?: IText;
  private rippleContainer: IContainer;

  private config: Required<UIButtonConfig>;
  private isPressed: boolean = false;
  private isHovered: boolean = false;
  private activeRipples: Array<{
    graphics: IGraphics;
    startTime: number;
    x: number;
    y: number;
  }> = [];

  constructor(config: UIButtonConfig = {}) {
    super();

    // Default configuration with mobile game polish
    this.config = {
      text: config.text || '',
      width: config.width || 180,
      height: config.height || 60,
      fontSize: config.fontSize || 24,
      fontFamily: config.fontFamily || getFrameworkFontFamily(),
      fontWeight: config.fontWeight || 'bold',
      textColor: config.textColor !== undefined ? config.textColor : 0xFFFFFF,
      backgroundColor: config.backgroundColor !== undefined ? config.backgroundColor : 0x007AFF,
      hoverColor: config.hoverColor !== undefined ? config.hoverColor : 0x0096FF,
      pressedColor: config.pressedColor !== undefined ? config.pressedColor : 0x0056B3,
      disabledColor: config.disabledColor !== undefined ? config.disabledColor : 0x999999,
      borderColor: config.borderColor !== undefined ? config.borderColor : 0xFFFFFF,
      borderWidth: config.borderWidth !== undefined ? config.borderWidth : 0,
      borderRadius: config.borderRadius !== undefined ? config.borderRadius : 12,
      disabled: config.disabled || false,
      rippleEffect: config.rippleEffect !== false,
      glowEffect: config.glowEffect !== false,
      shadowEffect: config.shadowEffect !== false,
      gradient: config.gradient || { enabled: true, colorTop: undefined, colorBottom: undefined }
    };

    // Ensure minimum touch target size (Apple HIG: 44x44pt)
    this.config.width = Math.max(this.config.width, 44);
    this.config.height = Math.max(this.config.height, 44);

    // Create container
    this.container = graphics().createContainer();
    this.rippleContainer = graphics().createContainer();

    // Create graphics elements
    this.shadowGraphics = graphics().createGraphics();
    this.glowGraphics = graphics().createGraphics();
    this.background = graphics().createGraphics();

    // Build button
    this.container.addChild(this.shadowGraphics);
    this.container.addChild(this.glowGraphics);
    this.container.addChild(this.background);
    this.container.addChild(this.rippleContainer);

    // Create text
    if (this.config.text) {
      this.createText();
    }

    // Render initial state
    this.render();

    // Setup interactivity
    this.setupInteractivity();
  }

  /**
   * Create text field
   */
  private createText(): void {
    this.textField = graphics().createText(this.config.text, {
      fontFamily: this.config.fontFamily,
      fontSize: this.config.fontSize,
      fontWeight: this.config.fontWeight,
      fill: this.config.textColor,
      align: 'center'
    });

    if (this.textField.anchor) this.textField.anchor.set(0.5, 0.5);
    this.textField.x = this.config.width / 2;
    this.textField.y = this.config.height / 2;

    this.container.addChild(this.textField);
  }

  /**
   * Setup touch/mouse interactivity
   */
  private setupInteractivity(): void {
    this.container.eventMode = 'static';
    this.container.cursor = this.config.disabled ? 'default' : 'pointer';

    // Pointer events
    this.container.on('pointerdown', this.onPointerDown.bind(this));
    this.container.on('pointerup', this.onPointerUp.bind(this));
    this.container.on('pointerupoutside', this.onPointerUpOutside.bind(this));
    this.container.on('pointerover', this.onPointerOver.bind(this));
    this.container.on('pointerout', this.onPointerOut.bind(this));
  }

  /**
   * Render button graphics
   */
  private render(): void {
    const { width, height, borderRadius, shadowEffect, glowEffect } = this.config;

    // Clear all graphics
    this.background.clear();
    if (this.shadowGraphics) this.shadowGraphics.clear();
    if (this.glowGraphics) this.glowGraphics.clear();

    // Get current state color
    const currentColor = this.getCurrentColor();

    // Shadow effect
    if (shadowEffect && !this.config.disabled) {
      this.renderShadow();
    }

    // Glow effect (for pressed/hover states)
    if (glowEffect && (this.isPressed || this.isHovered) && !this.config.disabled) {
      this.renderGlow();
    }

    // Background with gradient
    if (this.config.gradient.enabled) {
      this.renderGradientBackground(currentColor);
    } else {
      this.renderSolidBackground(currentColor);
    }

    // Border
    if (this.config.borderWidth > 0) {
      this.renderBorder();
    }
  }

  /**
   * Render shadow effect
   */
  private renderShadow(): void {
    if (!this.shadowGraphics) return;

    const { width, height, borderRadius } = this.config;
    const offsetY = this.isPressed ? 2 : 4;
    const alpha = this.isPressed ? 0.2 : 0.3;

    this.shadowGraphics.roundRect(
      0,
      offsetY,
      width,
      height,
      borderRadius
    );
    this.shadowGraphics.fill({ color: 0x000000, alpha });

    // Note: Blur filter is renderer-specific and applied internally by the graphics implementation
    // The framework handles blur effects automatically based on the renderer type
  }

  /**
   * Render glow effect
   */
  private renderGlow(): void {
    if (!this.glowGraphics) return;

    const { width, height, borderRadius, backgroundColor } = this.config;

    this.glowGraphics.roundRect(
      -4,
      -4,
      width + 8,
      height + 8,
      borderRadius + 4
    );
    this.glowGraphics.fill({ color: backgroundColor, alpha: 0.4 });

    // Note: Blur filter is renderer-specific and applied internally by the graphics implementation
    // The framework handles blur effects automatically based on the renderer type
  }

  /**
   * Render gradient background
   */
  private renderGradientBackground(baseColor: number): void {
    const { width, height, borderRadius, gradient } = this.config;

    // Determine gradient colors
    const colorTop = gradient.colorTop !== undefined ? gradient.colorTop : this.lightenColor(baseColor, 0.2);
    const colorBottom = gradient.colorBottom !== undefined ? gradient.colorBottom : this.darkenColor(baseColor, 0.2);

    // Create gradient texture using framework abstraction
    const texture = graphics().createCanvasTexture(width, height, (ctx: CanvasRenderingContext2D) => {
      const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
      gradientFill.addColorStop(0, this.numberToHex(colorTop));
      gradientFill.addColorStop(1, this.numberToHex(colorBottom));

      ctx.fillStyle = gradientFill;
      this.roundRect(ctx, 0, 0, width, height, borderRadius);
      ctx.fill();
    });

    // Apply to sprite
    this.background.texture(texture);
    this.background.roundRect(0, 0, width, height, borderRadius);
    this.background.fill();
  }

  /**
   * Render solid background
   */
  private renderSolidBackground(color: number): void {
    const { width, height, borderRadius } = this.config;

    this.background.roundRect(0, 0, width, height, borderRadius);
    this.background.fill({ color });
  }

  /**
   * Render border
   */
  private renderBorder(): void {
    const { width, height, borderRadius, borderWidth, borderColor } = this.config;

    this.background.roundRect(0, 0, width, height, borderRadius);
    this.background.stroke({ width: borderWidth, color: borderColor, alpha: 1 });
  }

  /**
   * Get current button color based on state
   */
  private getCurrentColor(): number {
    if (this.config.disabled) return this.config.disabledColor;
    if (this.isPressed) return this.config.pressedColor;
    if (this.isHovered) return this.config.hoverColor;
    return this.config.backgroundColor;
  }

  /**
   * Create ripple effect at position
   */
  private createRipple(x: number, y: number): void {
    if (!this.config.rippleEffect) return;

    const ripple = graphics().createGraphics();
    ripple.x = x;
    ripple.y = y;

    this.rippleContainer.addChild(ripple);

    this.activeRipples.push({
      graphics: ripple,
      startTime: Date.now(),
      x,
      y
    });
  }

  /**
   * Update ripple animations
   */
  public update(deltaTime: number): void {
    const now = Date.now();
    const duration = 400; // ms

    this.activeRipples = this.activeRipples.filter(ripple => {
      const elapsed = now - ripple.startTime;
      if (elapsed >= duration) {
        this.rippleContainer.removeChild(ripple.graphics);
        ripple.graphics.destroy();
        return false;
      }

      // Animate ripple
      const progress = elapsed / duration;
      const radius = progress * Math.max(this.config.width, this.config.height);
      const alpha = 1 - progress;

      ripple.graphics.clear();
      ripple.graphics.circle(0, 0, radius);
      ripple.graphics.fill({ color: 0xFFFFFF, alpha: alpha * 0.5 });

      return true;
    });
  }

  /**
   * Pointer event handlers
   */
  private onPointerDown(event: any): void {
    if (this.config.disabled) return;

    this.isPressed = true;
    this.render();

    // Create ripple at touch position
    const localPos = event.getLocalPosition ? event.getLocalPosition(this.container) : { x: this.config.width / 2, y: this.config.height / 2 };
    this.createRipple(localPos.x, localPos.y);

    // Scale feedback
    this.container.scale.x = 0.95;
    this.container.scale.y = 0.95;

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

    // Scale back
    this.container.scale.x = 1;
    this.container.scale.y = 1;

    this.emit('cancel');
  }

  private onPointerOver(): void {
    if (this.config.disabled) return;

    this.isHovered = true;
    this.render();

    this.emit('hover');
  }

  private onPointerOut(): void {
    if (this.config.disabled) return;

    this.isHovered = false;
    this.render();

    this.emit('hoverEnd');
  }

  /**
   * Public API
   */

  public setText(text: string): this {
    this.config.text = text;
    if (this.textField) {
      this.textField.text = text;
    } else {
      this.createText();
    }
    return this;
  }

  public setDisabled(disabled: boolean): this {
    this.config.disabled = disabled;
    this.container.cursor = disabled ? 'default' : 'pointer';
    this.render();
    this.emit('disabled-changed', disabled);
    return this;
  }

  public setBackgroundColor(color: number): this {
    this.config.backgroundColor = color;
    this.render();
    return this;
  }

  public setTextColor(color: number): this {
    this.config.textColor = color;
    if (this.textField) {
      this.textField.style.fill = color;
    }
    return this;
  }

  public getContainer(): IContainer {
    return this.container;
  }

  public destroy(): void {
    this.activeRipples.forEach(ripple => {
      ripple.graphics.destroy();
    });
    this.activeRipples = [];
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }

  /**
   * Utility methods
   */

  private lightenColor(color: number, amount: number): number {
    const r = ((color >> 16) & 0xFF) + Math.floor(255 * amount);
    const g = ((color >> 8) & 0xFF) + Math.floor(255 * amount);
    const b = (color & 0xFF) + Math.floor(255 * amount);

    return ((Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b));
  }

  private darkenColor(color: number, amount: number): number {
    const r = ((color >> 16) & 0xFF) - Math.floor(255 * amount);
    const g = ((color >> 8) & 0xFF) - Math.floor(255 * amount);
    const b = (color & 0xFF) - Math.floor(255 * amount);

    return ((Math.max(0, r) << 16) | (Math.max(0, g) << 8) | Math.max(0, b));
  }

  private numberToHex(num: number): string {
    return `#${num.toString(16).padStart(6, '0')}`;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
