import { BaseUIComponent } from '../core/BaseUIComponent';
import { Color } from '../../contracts/UI';

export interface UIPanelConfig {
  backgroundColor?: Color;
  borderColor?: Color;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: {
    color: Color;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread?: number;
  };
  gradient?: {
    type: 'linear' | 'radial';
    colors: Array<{ color: Color; stop: number }>;
    direction?: number; // angle in degrees for linear gradient
  };
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'stretch';
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  opacity?: number;
}

/**
 * Versatile panel component for backgrounds, containers, and layouts
 */
export class UIPanel extends BaseUIComponent {
  // Panel properties
  public backgroundColor: Color = { r: 255, g: 255, b: 255, a: 1 };
  public borderColor: Color = { r: 200, g: 200, b: 200, a: 1 };
  public borderWidth: number = 0;
  public borderRadius: number = 0;
  
  public shadow?: {
    color: Color;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread?: number;
  };
  
  public gradient?: {
    type: 'linear' | 'radial';
    colors: Array<{ color: Color; stop: number }>;
    direction?: number;
  };
  
  public backgroundImage?: string;
  public backgroundSize: 'cover' | 'contain' | 'stretch' = 'cover';
  public backgroundPosition: 'center' | 'top' | 'bottom' | 'left' | 'right' = 'center';

  // Internal state
  private _backgroundImageLoaded: boolean = false;
  private _backgroundImageElement: HTMLImageElement | null = null;

  constructor(config?: UIPanelConfig, id?: string) {
    super(id);
    
    this.interactive = false; // Panels are not interactive by default
    
    // Apply configuration
    if (config) {
      this.configure(config);
    }
  }

  /**
   * Configure panel properties
   */
  public configure(config: UIPanelConfig): this {
    if (config.backgroundColor !== undefined) this.backgroundColor = config.backgroundColor;
    if (config.borderColor !== undefined) this.borderColor = config.borderColor;
    if (config.borderWidth !== undefined) this.borderWidth = config.borderWidth;
    if (config.borderRadius !== undefined) this.borderRadius = config.borderRadius;
    if (config.shadow !== undefined) this.shadow = config.shadow;
    if (config.gradient !== undefined) this.gradient = config.gradient;
    if (config.backgroundImage !== undefined) this.setBackgroundImage(config.backgroundImage);
    if (config.backgroundSize !== undefined) this.backgroundSize = config.backgroundSize;
    if (config.backgroundPosition !== undefined) this.backgroundPosition = config.backgroundPosition;
    if (config.opacity !== undefined) this.alpha = config.opacity;

    return this;
  }

  /**
   * Render the panel
   */
  public render(renderer: any): void {
    if (!this.visible || this.alpha <= 0) return;

    const bounds = this.getBounds();
    const globalPos = this.getGlobalPosition();
    const ctx = renderer.context || renderer;
    
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Create clipping path if border radius is set
    if (this.borderRadius > 0) {
      this.createRoundedPath(ctx, bounds);
      ctx.clip();
    }

    // Render shadow
    if (this.shadow) {
      this.renderShadow(ctx, bounds);
    }

    // Render background
    this.renderBackground(ctx, bounds);

    // Render background image
    if (this.backgroundImage && this._backgroundImageLoaded && this._backgroundImageElement) {
      this.renderBackgroundImage(ctx, bounds);
    }

    ctx.restore();

    // Render border (after restoring to avoid clipping)
    if (this.borderWidth > 0) {
      this.renderBorder(ctx, bounds);
    }

    // Render children
    for (const child of this.children) {
      child.render(renderer);
    }
  }

  /**
   * Set background color
   */
  public setBackgroundColor(color: Color): this {
    this.backgroundColor = color;
    return this;
  }

  /**
   * Set border style
   */
  public setBorder(width: number, color: Color, radius?: number): this {
    this.borderWidth = width;
    this.borderColor = color;
    if (radius !== undefined) {
      this.borderRadius = radius;
    }
    return this;
  }

  /**
   * Set shadow
   */
  public setShadow(shadow: UIPanelConfig['shadow']): this {
    this.shadow = shadow;
    return this;
  }

  /**
   * Set gradient background
   */
  public setGradient(gradient: UIPanelConfig['gradient']): this {
    this.gradient = gradient;
    return this;
  }

  /**
   * Set background image
   */
  public setBackgroundImage(imageUrl: string): this {
    this.backgroundImage = imageUrl;
    this._backgroundImageLoaded = false;
    
    if (imageUrl) {
      this.loadBackgroundImage(imageUrl);
    }
    
    return this;
  }

  /**
   * Make panel interactive (useful for click areas)
   */
  public makeClickable(): this {
    this.interactive = true;
    return this;
  }

  /**
   * Load background image
   */
  private loadBackgroundImage(imageUrl: string): void {
    const img = new Image();
    img.onload = () => {
      this._backgroundImageElement = img;
      this._backgroundImageLoaded = true;
      this.emit('background-image-loaded', img);
    };
    img.onerror = () => {
      this.emit('background-image-error', imageUrl);
    };
    img.src = imageUrl;
  }

  /**
   * Create rounded rectangle path
   */
  private createRoundedPath(ctx: CanvasRenderingContext2D, bounds: any): void {
    const { x, y, width, height } = bounds;
    const radius = Math.min(this.borderRadius, width / 2, height / 2);

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

  /**
   * Render shadow
   */
  private renderShadow(ctx: CanvasRenderingContext2D, bounds: any): void {
    if (!this.shadow) return;

    const { x, y, width, height } = bounds;
    const { color, offsetX, offsetY, blur, spread = 0 } = this.shadow;

    ctx.save();
    
    // Create shadow path
    const shadowBounds = {
      x: x + offsetX - spread,
      y: y + offsetY - spread,
      width: width + (spread * 2),
      height: height + (spread * 2)
    };

    ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = offsetX;
    ctx.shadowOffsetY = offsetY;

    ctx.fillStyle = `rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, ${this.backgroundColor.a})`;

    if (this.borderRadius > 0) {
      this.createRoundedPath(ctx, shadowBounds);
      ctx.fill();
    } else {
      ctx.fillRect(shadowBounds.x, shadowBounds.y, shadowBounds.width, shadowBounds.height);
    }

    ctx.restore();
  }

  /**
   * Render background
   */
  private renderBackground(ctx: CanvasRenderingContext2D, bounds: any): void {
    const { x, y, width, height } = bounds;

    // Render gradient if specified
    if (this.gradient) {
      const gradient = this.createGradient(ctx, bounds);
      ctx.fillStyle = gradient;
    } else {
      // Solid color background
      ctx.fillStyle = `rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, ${this.backgroundColor.a})`;
    }

    if (this.borderRadius > 0) {
      this.createRoundedPath(ctx, bounds);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, width, height);
    }
  }

  /**
   * Create gradient
   */
  private createGradient(ctx: CanvasRenderingContext2D, bounds: any): CanvasGradient {
    const { x, y, width, height } = bounds;
    let gradient: CanvasGradient;

    if (this.gradient!.type === 'linear') {
      const angle = (this.gradient!.direction || 0) * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const x1 = x + (width / 2) - (cos * width / 2);
      const y1 = y + (height / 2) - (sin * height / 2);
      const x2 = x + (width / 2) + (cos * width / 2);
      const y2 = y + (height / 2) + (sin * height / 2);
      
      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      // Radial gradient
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radius = Math.max(width, height) / 2;
      
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    }

    // Add color stops
    for (const colorStop of this.gradient!.colors) {
      const { r, g, b, a } = colorStop.color;
      gradient.addColorStop(colorStop.stop, `rgba(${r}, ${g}, ${b}, ${a})`);
    }

    return gradient;
  }

  /**
   * Render background image
   */
  private renderBackgroundImage(ctx: CanvasRenderingContext2D, bounds: any): void {
    if (!this._backgroundImageElement) return;

    const { x, y, width, height } = bounds;
    const img = this._backgroundImageElement;
    
    let drawX = x;
    let drawY = y; 
    let drawWidth = width;
    let drawHeight = height;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.width;
    let sourceHeight = img.height;

    // Calculate dimensions based on background size
    switch (this.backgroundSize) {
      case 'cover':
        const scaleX = width / img.width;
        const scaleY = height / img.height;
        const scale = Math.max(scaleX, scaleY);
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        drawX = x + (width - scaledWidth) / 2;
        drawY = y + (height - scaledHeight) / 2;
        drawWidth = scaledWidth;
        drawHeight = scaledHeight;
        break;
        
      case 'contain':
        const containScaleX = width / img.width;
        const containScaleY = height / img.height;
        const containScale = Math.min(containScaleX, containScaleY);
        
        const containScaledWidth = img.width * containScale;
        const containScaledHeight = img.height * containScale;
        
        drawX = x + (width - containScaledWidth) / 2;
        drawY = y + (height - containScaledHeight) / 2;
        drawWidth = containScaledWidth;
        drawHeight = containScaledHeight;
        break;
        
      case 'stretch':
        // Use original bounds (already set)
        break;
    }

    // Apply background position adjustments
    switch (this.backgroundPosition) {
      case 'top':
        drawY = y;
        break;
      case 'bottom':
        drawY = y + height - drawHeight;
        break;
      case 'left':
        drawX = x;
        break;
      case 'right':
        drawX = x + width - drawWidth;
        break;
      case 'center':
        // Already centered
        break;
    }

    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      drawX, drawY, drawWidth, drawHeight
    );
  }

  /**
   * Render border
   */
  private renderBorder(ctx: CanvasRenderingContext2D, bounds: any): void {
    const { x, y, width, height } = bounds;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = `rgba(${this.borderColor.r}, ${this.borderColor.g}, ${this.borderColor.b}, ${this.borderColor.a})`;
    ctx.lineWidth = this.borderWidth;

    if (this.borderRadius > 0) {
      this.createRoundedPath(ctx, bounds);
      ctx.stroke();
    } else {
      ctx.strokeRect(x + this.borderWidth / 2, y + this.borderWidth / 2, 
                    width - this.borderWidth, height - this.borderWidth);
    }

    ctx.restore();
  }
}