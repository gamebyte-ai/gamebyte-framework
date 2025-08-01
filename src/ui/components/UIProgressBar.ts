import { BaseUIComponent } from '../core/BaseUIComponent';
import { Color, AnimationConfig } from '../../contracts/UI';

export interface UIProgressBarConfig {
  value?: number; // 0-1
  minValue?: number;
  maxValue?: number;
  backgroundColor?: Color;
  fillColor?: Color;
  borderColor?: Color;
  borderWidth?: number;
  borderRadius?: number;
  direction?: 'horizontal' | 'vertical';
  showText?: boolean;
  textColor?: Color;
  fontSize?: number;
  fontFamily?: string;
  textFormat?: (value: number, min: number, max: number) => string;
  animated?: boolean;
  animationDuration?: number;
  gradient?: {
    colors: Array<{ color: Color; stop: number }>;
  };
  stripes?: {
    enabled: boolean;
    color?: Color;
    width?: number;
    animated?: boolean;
  };
}

/**
 * Mobile-optimized progress bar component with animations and customization
 */
export class UIProgressBar extends BaseUIComponent {
  // Progress properties
  public value: number = 0; // 0-1
  public minValue: number = 0;
  public maxValue: number = 1;
  public backgroundColor: Color = { r: 220, g: 220, b: 220, a: 1 };
  public fillColor: Color = { r: 0, g: 122, b: 255, a: 1 };
  public borderColor: Color = { r: 200, g: 200, b: 200, a: 1 };
  public borderWidth: number = 1;
  public borderRadius: number = 4;
  public direction: 'horizontal' | 'vertical' = 'horizontal';
  
  // Text properties
  public showText: boolean = false;
  public textColor: Color = { r: 255, g: 255, b: 255, a: 1 };
  public fontSize: number = 14;
  public fontFamily: string = 'Arial, sans-serif';
  public textFormat: (value: number, min: number, max: number) => string = this.defaultTextFormat;
  
  // Animation properties
  public animated: boolean = true;
  public animationDuration: number = 300;
  
  // Visual effects
  public gradient?: {
    colors: Array<{ color: Color; stop: number }>;
  };
  
  public stripes?: {
    enabled: boolean;
    color?: Color;
    width?: number;
    animated?: boolean;
  };

  // Internal state
  private _displayValue: number = 0;
  private _targetValue: number = 0;
  private _animationStartTime: number = 0;
  private _animating: boolean = false;
  private _stripeOffset: number = 0;

  constructor(config?: UIProgressBarConfig, id?: string) {
    super(id);
    
    this.interactive = false; // Progress bars are not interactive by default
    
    // Set default size
    this.setSize(200, 20);
    
    // Apply configuration
    if (config) {
      this.configure(config);
    }

    this._displayValue = this.value;
    this._targetValue = this.value;
  }

  /**
   * Configure progress bar properties
   */
  public configure(config: UIProgressBarConfig): this {
    if (config.value !== undefined) this.setValue(config.value);
    if (config.minValue !== undefined) this.minValue = config.minValue;
    if (config.maxValue !== undefined) this.maxValue = config.maxValue;
    if (config.backgroundColor !== undefined) this.backgroundColor = config.backgroundColor;
    if (config.fillColor !== undefined) this.fillColor = config.fillColor;
    if (config.borderColor !== undefined) this.borderColor = config.borderColor;
    if (config.borderWidth !== undefined) this.borderWidth = config.borderWidth;
    if (config.borderRadius !== undefined) this.borderRadius = config.borderRadius;
    if (config.direction !== undefined) this.direction = config.direction;
    if (config.showText !== undefined) this.showText = config.showText;
    if (config.textColor !== undefined) this.textColor = config.textColor;
    if (config.fontSize !== undefined) this.fontSize = config.fontSize;
    if (config.fontFamily !== undefined) this.fontFamily = config.fontFamily;
    if (config.textFormat !== undefined) this.textFormat = config.textFormat;
    if (config.animated !== undefined) this.animated = config.animated;
    if (config.animationDuration !== undefined) this.animationDuration = config.animationDuration;
    if (config.gradient !== undefined) this.gradient = config.gradient;
    if (config.stripes !== undefined) this.stripes = config.stripes;

    return this;
  }

  /**
   * Update progress bar animation
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);

    // Update value animation
    if (this._animating) {
      const elapsed = Date.now() - this._animationStartTime;
      const progress = Math.min(elapsed / this.animationDuration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const startValue = this._displayValue;
      this._displayValue = startValue + (this._targetValue - startValue) * easedProgress;
      
      if (progress >= 1) {
        this._displayValue = this._targetValue;
        this._animating = false;
        this.emit('animation-complete');
      }
    }

    // Update stripe animation
    if (this.stripes?.enabled && this.stripes.animated) {
      this._stripeOffset += deltaTime * 0.1; // Adjust speed as needed
      if (this._stripeOffset > (this.stripes.width || 10)) {
        this._stripeOffset = 0;
      }
    }
  }

  /**
   * Render the progress bar
   */
  public render(renderer: any): void {
    if (!this.visible || this.alpha <= 0) return;

    const bounds = this.getBounds();
    const ctx = renderer.context || renderer;
    
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Render background
    this.renderBackground(ctx, bounds);

    // Render fill
    this.renderFill(ctx, bounds);

    // Render border
    if (this.borderWidth > 0) {
      this.renderBorder(ctx, bounds);
    }

    // Render text
    if (this.showText) {
      this.renderText(ctx, bounds);
    }

    ctx.restore();

    // Render children
    for (const child of this.children) {
      child.render(renderer);
    }
  }

  /**
   * Set progress value (0-1 or between min/max)
   */
  public setValue(value: number, animate: boolean = this.animated): this {
    // Normalize value
    const normalizedValue = Math.max(0, Math.min(1, 
      (value - this.minValue) / (this.maxValue - this.minValue)
    ));

    this.value = normalizedValue;
    this._targetValue = normalizedValue;

    if (animate && this.animationDuration > 0) {
      this._animationStartTime = Date.now();
      this._animating = true;
    } else {
      this._displayValue = normalizedValue;
      this._animating = false;
    }

    this.emit('value-changed', value);
    return this;
  }

  /**
   * Get current progress value
   */
  public getValue(): number {
    return this.minValue + (this.value * (this.maxValue - this.minValue));
  }

  /**
   * Set progress to minimum
   */
  public setToMin(animate?: boolean): this {
    return this.setValue(this.minValue, animate);
  }

  /**
   * Set progress to maximum
   */
  public setToMax(animate?: boolean): this {
    return this.setValue(this.maxValue, animate);
  }

  /**
   * Increment progress
   */
  public increment(amount: number, animate?: boolean): this {
    const currentValue = this.getValue();
    return this.setValue(currentValue + amount, animate);
  }

  /**
   * Set style
   */
  public setStyle(style: Partial<UIProgressBarConfig>): this {
    return this.configure(style);
  }

  /**
   * Enable/disable stripes
   */
  public setStripes(enabled: boolean, config?: { color?: Color; width?: number; animated?: boolean }): this {
    this.stripes = {
      enabled,
      color: config?.color || { r: 255, g: 255, b: 255, a: 0.3 },
      width: config?.width || 10,
      animated: config?.animated || true
    };
    return this;
  }

  /**
   * Default text format function
   */
  private defaultTextFormat(value: number, min: number, max: number): string {
    const percentage = Math.round(((value - min) / (max - min)) * 100);
    return `${percentage}%`;
  }

  /**
   * Render background
   */
  private renderBackground(ctx: CanvasRenderingContext2D, bounds: any): void {
    const { x, y, width, height } = bounds;

    ctx.fillStyle = `rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, ${this.backgroundColor.a})`;

    if (this.borderRadius > 0) {
      this.drawRoundedRect(ctx, x, y, width, height, this.borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, width, height);
    }
  }

  /**
   * Render fill
   */
  private renderFill(ctx: CanvasRenderingContext2D, bounds: any): void {
    const { x, y, width, height } = bounds;
    const progress = this._displayValue;

    if (progress <= 0) return;

    // Calculate fill dimensions
    let fillX = x;
    let fillY = y;
    let fillWidth = width;
    let fillHeight = height;

    if (this.direction === 'horizontal') {
      fillWidth = width * progress;
    } else {
      fillHeight = height * progress;
      fillY = y + height - fillHeight;
    }

    // Create fill style (gradient or solid)
    if (this.gradient) {
      ctx.fillStyle = this.createFillGradient(ctx, { x: fillX, y: fillY, width: fillWidth, height: fillHeight });
    } else {
      ctx.fillStyle = `rgba(${this.fillColor.r}, ${this.fillColor.g}, ${this.fillColor.b}, ${this.fillColor.a})`;
    }

    // Draw fill
    ctx.save();
    
    // Clip to progress bar bounds
    if (this.borderRadius > 0) {
      this.drawRoundedRect(ctx, x, y, width, height, this.borderRadius);
      ctx.clip();
    }

    ctx.fillRect(fillX, fillY, fillWidth, fillHeight);

    // Draw stripes if enabled
    if (this.stripes?.enabled) {
      this.renderStripes(ctx, { x: fillX, y: fillY, width: fillWidth, height: fillHeight });
    }

    ctx.restore();
  }

  /**
   * Render stripes
   */
  private renderStripes(ctx: CanvasRenderingContext2D, fillBounds: any): void {
    if (!this.stripes) return;

    const { x, y, width, height } = fillBounds;
    const stripeWidth = this.stripes.width || 10;
    const stripeColor = this.stripes.color || { r: 255, g: 255, b: 255, a: 0.3 };

    ctx.save();
    ctx.fillStyle = `rgba(${stripeColor.r}, ${stripeColor.g}, ${stripeColor.b}, ${stripeColor.a})`;

    const offset = this.stripes.animated ? -this._stripeOffset : 0;

    if (this.direction === 'horizontal') {
      // Diagonal stripes for horizontal progress
      for (let i = offset; i < width + height; i += stripeWidth * 2) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + stripeWidth, y);
        ctx.lineTo(x + i + stripeWidth - height, y + height);
        ctx.lineTo(x + i - height, y + height);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Horizontal stripes for vertical progress
      for (let i = offset; i < height; i += stripeWidth * 2) {
        ctx.fillRect(x, y + i, width, stripeWidth);
      }
    }

    ctx.restore();
  }

  /**
   * Create gradient for fill
   */
  private createFillGradient(ctx: CanvasRenderingContext2D, bounds: any): CanvasGradient {
    const { x, y, width, height } = bounds;
    
    let gradient: CanvasGradient;
    
    if (this.direction === 'horizontal') {
      gradient = ctx.createLinearGradient(x, y, x + width, y);
    } else {
      gradient = ctx.createLinearGradient(x, y + height, x, y);
    }

    if (this.gradient) {
      for (const colorStop of this.gradient.colors) {
        const { r, g, b, a } = colorStop.color;
        gradient.addColorStop(colorStop.stop, `rgba(${r}, ${g}, ${b}, ${a})`);
      }
    }

    return gradient;
  }

  /**
   * Render border
   */
  private renderBorder(ctx: CanvasRenderingContext2D, bounds: any): void {
    const { x, y, width, height } = bounds;

    ctx.strokeStyle = `rgba(${this.borderColor.r}, ${this.borderColor.g}, ${this.borderColor.b}, ${this.borderColor.a})`;
    ctx.lineWidth = this.borderWidth;

    if (this.borderRadius > 0) {
      this.drawRoundedRect(ctx, x, y, width, height, this.borderRadius);
      ctx.stroke();
    } else {
      ctx.strokeRect(x + this.borderWidth / 2, y + this.borderWidth / 2, 
                    width - this.borderWidth, height - this.borderWidth);
    }
  }

  /**
   * Render text
   */
  private renderText(ctx: CanvasRenderingContext2D, bounds: any): void {
    const { x, y, width, height } = bounds;
    const currentValue = this.minValue + (this._displayValue * (this.maxValue - this.minValue));
    const text = this.textFormat(currentValue, this.minValue, this.maxValue);

    ctx.save();
    ctx.fillStyle = `rgba(${this.textColor.r}, ${this.textColor.g}, ${this.textColor.b}, ${this.textColor.a})`;
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Draw text with outline for better visibility
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeText(text, centerX, centerY);
    ctx.fillText(text, centerX, centerY);

    ctx.restore();
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
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
}