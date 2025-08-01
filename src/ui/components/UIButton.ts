import { BaseUIComponent } from '../core/BaseUIComponent';
import { Color, UIInteractionEvent } from '../../contracts/UI';

export interface UIButtonConfig {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textColor?: Color;
  backgroundColor?: Color;
  borderColor?: Color;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  disabled?: boolean;
  rippleEffect?: boolean;
}

/**
 * Mobile-optimized button component with touch feedback
 */
export class UIButton extends BaseUIComponent {
  // Button properties
  public text: string = '';
  public fontSize: number = 16;
  public fontFamily: string = 'Arial, sans-serif';
  public fontWeight: string = 'normal';
  public textColor: Color = { r: 255, g: 255, b: 255, a: 1 };
  public backgroundColor: Color = { r: 0, g: 122, b: 255, a: 1 };
  public borderColor: Color = { r: 0, g: 122, b: 255, a: 1 };
  public borderWidth: number = 0;
  public borderRadius: number = 8;
  public disabled: boolean = false;
  public rippleEffect: boolean = true;

  // Internal state
  private _isPressed: boolean = false;
  private _isHovered: boolean = false;
  private _ripples: Array<{ x: number; y: number; startTime: number; id: string }> = [];
  private _minTouchSize: number = 44; // Apple's recommended minimum touch target size

  constructor(config?: UIButtonConfig, id?: string) {
    super(id);
    
    this.interactive = true;
    
    // Apply configuration
    if (config) {
      this.configure(config);
    }

    // Ensure minimum touch size for mobile
    this.ensureMinimumTouchSize();

    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Configure button properties
   */
  public configure(config: UIButtonConfig): this {
    if (config.text !== undefined) this.text = config.text;
    if (config.fontSize !== undefined) this.fontSize = config.fontSize;
    if (config.fontFamily !== undefined) this.fontFamily = config.fontFamily;
    if (config.fontWeight !== undefined) this.fontWeight = config.fontWeight;
    if (config.textColor !== undefined) this.textColor = config.textColor;
    if (config.backgroundColor !== undefined) this.backgroundColor = config.backgroundColor;
    if (config.borderColor !== undefined) this.borderColor = config.borderColor;
    if (config.borderWidth !== undefined) this.borderWidth = config.borderWidth;
    if (config.borderRadius !== undefined) this.borderRadius = config.borderRadius;
    if (config.disabled !== undefined) this.disabled = config.disabled;
    if (config.rippleEffect !== undefined) this.rippleEffect = config.rippleEffect;

    if (config.padding !== undefined) {
      this.setPadding(config.padding);
    }

    return this;
  }

  /**
   * Render the button
   */
  public render(renderer: any): void {
    if (!this.visible || this.alpha <= 0) return;

    const bounds = this.getBounds();
    const globalPos = this.getGlobalPosition();
    
    // Get current colors based on state
    const bgColor = this.getCurrentBackgroundColor();
    const textCol = this.getCurrentTextColor();
    
    // Render background
    this.renderBackground(renderer, bounds, globalPos, bgColor);
    
    // Render border if specified
    if (this.borderWidth > 0) {
      this.renderBorder(renderer, bounds, globalPos);
    }
    
    // Render ripple effects
    if (this.rippleEffect) {
      this.renderRipples(renderer, bounds, globalPos);
    }
    
    // Render text
    if (this.text) {
      this.renderText(renderer, bounds, globalPos, textCol);
    }

    // Render children
    for (const child of this.children) {
      child.render(renderer);
    }
  }

  /**
   * Update button (handle animations, ripples, etc.)
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);

    // Update ripple effects
    if (this.rippleEffect) {
      this.updateRipples(deltaTime);
    }
  }

  /**
   * Set button text
   */
  public setText(text: string): this {
    this.text = text;
    this.calculateTextSize();
    return this;
  }

  /**
   * Set button style
   */
  public setStyle(style: Partial<UIButtonConfig>): this {
    return this.configure(style);
  }

  /**
   * Set disabled state
   */
  public setDisabled(disabled: boolean): this {
    this.disabled = disabled;
    this.interactive = !disabled;
    this.emit('disabled-changed', disabled);
    return this;
  }

  /**
   * Trigger button click programmatically
   */
  public click(): this {
    if (!this.disabled) {
      this.emit('click');
    }
    return this;
  }

  /**
   * Setup event handlers for touch/mouse interactions
   */
  private setupEventHandlers(): void {
    this.on('pointer-down', this.handlePointerDown.bind(this));
    this.on('pointer-up', this.handlePointerUp.bind(this));
    this.on('pointer-move', this.handlePointerMove.bind(this));
    this.on('pointer-cancel', this.handlePointerCancel.bind(this));
  }

  private handlePointerDown(event: UIInteractionEvent): void {
    if (this.disabled) return;

    this._isPressed = true;
    
    // Create ripple effect
    if (this.rippleEffect) {
      this.createRipple(event.position);
    }

    // Emit press event
    this.emit('press', event);
    
    // Scale feedback
    this.animate({ scale: { x: 0.95, y: 0.95 } }, {
      duration: 100,
      easing: 'ease-out'
    });
  }

  private handlePointerUp(event: UIInteractionEvent): void {
    if (this.disabled) return;

    const wasPressed = this._isPressed;
    this._isPressed = false;

    // Scale back to normal
    this.animate({ scale: { x: 1, y: 1 } }, {
      duration: 150,
      easing: 'spring'
    });

    // Emit click if pointer is still over button
    const hitTarget = this.hitTest(event.position);
    if (wasPressed && hitTarget === this) {
      this.emit('click', event);
    }

    this.emit('release', event);
  }

  private handlePointerMove(event: UIInteractionEvent): void {
    // Check if still hovering
    const hitTarget = this.hitTest(event.position);
    const isHovered = hitTarget === this;
    
    if (isHovered !== this._isHovered) {
      this._isHovered = isHovered;
      this.emit(isHovered ? 'hover-start' : 'hover-end', event);
    }
  }

  private handlePointerCancel(event: UIInteractionEvent): void {
    this._isPressed = false;
    this._isHovered = false;
    
    // Scale back to normal
    this.animate({ scale: { x: 1, y: 1 } }, {
      duration: 150,
      easing: 'spring'
    });

    this.emit('cancel', event);
  }

  /**
   * Ensure button meets minimum touch size requirements
   */
  private ensureMinimumTouchSize(): void {
    if (this.size.width < this._minTouchSize) {
      this.size.width = this._minTouchSize;
    }
    if (this.size.height < this._minTouchSize) {
      this.size.height = this._minTouchSize;
    }
  }

  /**
   * Calculate text size and adjust button size if needed
   */
  private calculateTextSize(): void {
    if (!this.text) return;

    // This is a simplified calculation - in a real implementation,
    // you'd measure the actual text with the rendering context
    const estimatedWidth = this.text.length * (this.fontSize * 0.6);
    const estimatedHeight = this.fontSize * 1.2;

    const requiredWidth = estimatedWidth + this.padding.left + this.padding.right;
    const requiredHeight = estimatedHeight + this.padding.top + this.padding.bottom;

    if (this.constraints.width.type === 'wrap') {
      this.size.width = Math.max(requiredWidth, this._minTouchSize);
    }
    if (this.constraints.height.type === 'wrap') {
      this.size.height = Math.max(requiredHeight, this._minTouchSize);
    }
  }

  /**
   * Get current background color based on state
   */
  private getCurrentBackgroundColor(): Color {
    if (this.disabled) {
      return {
        r: this.backgroundColor.r * 0.5,
        g: this.backgroundColor.g * 0.5,
        b: this.backgroundColor.b * 0.5,
        a: this.backgroundColor.a * 0.5
      };
    }

    if (this._isPressed) {
      return {
        r: Math.max(0, this.backgroundColor.r - 30),
        g: Math.max(0, this.backgroundColor.g - 30),
        b: Math.max(0, this.backgroundColor.b - 30),
        a: this.backgroundColor.a
      };
    }

    if (this._isHovered) {
      return {
        r: Math.min(255, this.backgroundColor.r + 20),
        g: Math.min(255, this.backgroundColor.g + 20),
        b: Math.min(255, this.backgroundColor.b + 20),
        a: this.backgroundColor.a
      };
    }

    return this.backgroundColor;
  }

  /**
   * Get current text color based on state
   */
  private getCurrentTextColor(): Color {
    if (this.disabled) {
      return {
        r: this.textColor.r,
        g: this.textColor.g,
        b: this.textColor.b,
        a: this.textColor.a * 0.5
      };
    }

    return this.textColor;
  }

  /**
   * Create a ripple effect at the given position
   */
  private createRipple(position: { x: number; y: number }): void {
    const bounds = this.getBounds();
    const localX = position.x - bounds.x;
    const localY = position.y - bounds.y;

    this._ripples.push({
      x: localX,
      y: localY,
      startTime: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });
  }

  /**
   * Update ripple animations
   */
  private updateRipples(deltaTime: number): void {
    const currentTime = Date.now();
    const rippleDuration = 300; // ms

    // Remove expired ripples
    this._ripples = this._ripples.filter(ripple => {
      return (currentTime - ripple.startTime) < rippleDuration;
    });
  }

  /**
   * Render background
   */
  private renderBackground(renderer: any, bounds: any, globalPos: any, bgColor: Color): void {
    // Implementation depends on the renderer
    // This is a placeholder that would be implemented for specific renderers
    const ctx = renderer.context || renderer;
    
    if (ctx && ctx.fillStyle !== undefined) {
      // HTML5 Canvas implementation
      ctx.save();
      ctx.fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${bgColor.a})`;
      
      if (this.borderRadius > 0) {
        this.drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, this.borderRadius);
        ctx.fill();
      } else {
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
      
      ctx.restore();
    }
  }

  /**
   * Render border
   */
  private renderBorder(renderer: any, bounds: any, globalPos: any): void {
    const ctx = renderer.context || renderer;
    
    if (ctx && ctx.strokeStyle !== undefined) {
      ctx.save();
      ctx.strokeStyle = `rgba(${this.borderColor.r}, ${this.borderColor.g}, ${this.borderColor.b}, ${this.borderColor.a})`;
      ctx.lineWidth = this.borderWidth;
      
      if (this.borderRadius > 0) {
        this.drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, this.borderRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
      
      ctx.restore();
    }
  }

  /**
   * Render text
   */
  private renderText(renderer: any, bounds: any, globalPos: any, textColor: Color): void {
    const ctx = renderer.context || renderer;
    
    if (ctx && ctx.fillText !== undefined) {
      ctx.save();
      ctx.fillStyle = `rgba(${textColor.r}, ${textColor.g}, ${textColor.b}, ${textColor.a})`;
      ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      
      ctx.fillText(this.text, centerX, centerY);
      ctx.restore();
    }
  }

  /**
   * Render ripple effects
   */
  private renderRipples(renderer: any, bounds: any, globalPos: any): void {
    const ctx = renderer.context || renderer;
    if (!ctx) return;

    const currentTime = Date.now();
    const rippleDuration = 300;

    for (const ripple of this._ripples) {
      const elapsed = currentTime - ripple.startTime;
      const progress = Math.min(elapsed / rippleDuration, 1);
      const maxRadius = Math.max(bounds.width, bounds.height);
      const radius = progress * maxRadius;
      const opacity = 1 - progress;

      ctx.save();
      ctx.globalAlpha = opacity * 0.3;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.beginPath();
      ctx.arc(bounds.x + ripple.x, bounds.y + ripple.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRect(ctx: any, x: number, y: number, width: number, height: number, radius: number): void {
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