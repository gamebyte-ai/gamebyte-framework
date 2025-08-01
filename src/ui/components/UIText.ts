import { BaseUIComponent } from '../core/BaseUIComponent';
import { Color } from '../../contracts/UI';

export interface UITextConfig {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color?: Color;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  wordWrap?: boolean;
  maxLines?: number;
  ellipsis?: boolean;
  shadow?: {
    color: Color;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
  stroke?: {
    color: Color;
    width: number;
  };
}

/**
 * Mobile-optimized text component with advanced typography features
 */
export class UIText extends BaseUIComponent {
  // Text properties
  public text: string = '';
  public fontSize: number = 16;
  public fontFamily: string = 'Arial, sans-serif';
  public fontWeight: string = 'normal';
  public color: Color = { r: 0, g: 0, b: 0, a: 1 };
  public textAlign: 'left' | 'center' | 'right' = 'left';
  public lineHeight: number = 1.2;
  public letterSpacing: number = 0;
  public wordWrap: boolean = false;
  public maxLines: number = 0; // 0 = unlimited
  public ellipsis: boolean = false;
  
  public shadow?: {
    color: Color;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
  
  public stroke?: {
    color: Color;
    width: number;
  };

  // Internal state
  private _lines: string[] = [];
  private _measuredSize: { width: number; height: number } = { width: 0, height: 0 };
  private _textMetrics: TextMetrics | null = null;

  constructor(config?: UITextConfig, id?: string) {
    super(id);
    
    this.interactive = false; // Text is not interactive by default
    
    // Apply configuration
    if (config) {
      this.configure(config);
    }

    this.calculateTextLayout();
  }

  /**
   * Configure text properties
   */
  public configure(config: UITextConfig): this {
    if (config.text !== undefined) this.text = config.text;
    if (config.fontSize !== undefined) this.fontSize = config.fontSize;
    if (config.fontFamily !== undefined) this.fontFamily = config.fontFamily;
    if (config.fontWeight !== undefined) this.fontWeight = config.fontWeight;
    if (config.color !== undefined) this.color = config.color;
    if (config.textAlign !== undefined) this.textAlign = config.textAlign;
    if (config.lineHeight !== undefined) this.lineHeight = config.lineHeight;
    if (config.letterSpacing !== undefined) this.letterSpacing = config.letterSpacing;
    if (config.wordWrap !== undefined) this.wordWrap = config.wordWrap;
    if (config.maxLines !== undefined) this.maxLines = config.maxLines;
    if (config.ellipsis !== undefined) this.ellipsis = config.ellipsis;
    if (config.shadow !== undefined) this.shadow = config.shadow;
    if (config.stroke !== undefined) this.stroke = config.stroke;

    this.calculateTextLayout();
    return this;
  }

  /**
   * Render the text
   */
  public render(renderer: any): void {
    if (!this.visible || this.alpha <= 0 || !this.text) return;

    const bounds = this.getBounds();
    const globalPos = this.getGlobalPosition();
    const ctx = renderer.context || renderer;
    
    if (!ctx || typeof ctx.fillText !== 'function') return;

    ctx.save();
    
    // Set font properties
    ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = 'top';
    ctx.globalAlpha = this.alpha;

    // Apply letter spacing if supported
    if (this.letterSpacing !== 0) {
      ctx.letterSpacing = `${this.letterSpacing}px`;
    }

    // Calculate text position based on alignment
    const startX = this.getTextStartX(bounds);
    const startY = bounds.y;
    const lineSpacing = this.fontSize * this.lineHeight;

    // Render each line
    for (let i = 0; i < this._lines.length; i++) {
      const line = this._lines[i];
      const y = startY + (i * lineSpacing);

      // Render shadow if specified
      if (this.shadow) {
        ctx.save();
        ctx.globalAlpha = this.alpha * this.shadow.color.a;
        ctx.fillStyle = `rgba(${this.shadow.color.r}, ${this.shadow.color.g}, ${this.shadow.color.b}, 1)`;
        
        if (this.shadow.blur > 0) {
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = this.shadow.blur;
          ctx.shadowOffsetX = this.shadow.offsetX;
          ctx.shadowOffsetY = this.shadow.offsetY;
        }
        
        ctx.fillText(line, startX + this.shadow.offsetX, y + this.shadow.offsetY);
        ctx.restore();
      }

      // Render stroke if specified
      if (this.stroke) {
        ctx.save();
        ctx.globalAlpha = this.alpha * this.stroke.color.a;
        ctx.strokeStyle = `rgba(${this.stroke.color.r}, ${this.stroke.color.g}, ${this.stroke.color.b}, 1)`;
        ctx.lineWidth = this.stroke.width;
        ctx.strokeText(line, startX, y);
        ctx.restore();
      }

      // Render main text
      ctx.globalAlpha = this.alpha * this.color.a;
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 1)`;
      ctx.fillText(line, startX, y);
    }

    ctx.restore();

    // Render children
    for (const child of this.children) {
      child.render(renderer);
    }
  }

  /**
   * Set text content
   */
  public setText(text: string): this {
    this.text = text;
    this.calculateTextLayout();
    return this;
  }

  /**
   * Set text style
   */
  public setStyle(style: Partial<UITextConfig>): this {
    return this.configure(style);
  }

  /**
   * Get measured text size
   */
  public getMeasuredSize(): { width: number; height: number } {
    return { ...this._measuredSize };
  }

  /**
   * Auto-size component to fit text
   */
  public autoSize(): this {
    this.setSize(this._measuredSize.width, this._measuredSize.height);
    return this;
  }

  /**
   * Update layout when size changes
   */
  protected updateLayout(): void {
    super.updateLayout();
    this.calculateTextLayout();
  }

  /**
   * Calculate text layout and line breaks
   */
  private calculateTextLayout(): void {
    if (!this.text) {
      this._lines = [];
      this._measuredSize = { width: 0, height: 0 };
      return;
    }

    // Create a temporary canvas for text measurement
    const canvas = this.createMeasurementCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set font for measurement
    ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;

    // Split text into lines
    this._lines = this.wordWrap ? this.wrapText(ctx, this.text) : [this.text];

    // Apply max lines limit
    if (this.maxLines > 0 && this._lines.length > this.maxLines) {
      this._lines = this._lines.slice(0, this.maxLines);
      
      // Add ellipsis to last line if enabled
      if (this.ellipsis && this._lines.length > 0) {
        const lastLine = this._lines[this._lines.length - 1];
        this._lines[this._lines.length - 1] = this.addEllipsis(ctx, lastLine);
      }
    }

    // Calculate total text size
    this.calculateMeasuredSize(ctx);
  }

  /**
   * Wrap text to fit within the component width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = this.size.width - this.padding.left - this.padding.right;

    if (maxWidth <= 0) {
      return [text]; // No wrapping if no width constraint
    }

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, break it
          lines.push(...this.breakLongWord(ctx, word, maxWidth));
          currentLine = '';
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  /**
   * Break a long word that doesn't fit on a single line
   */
  private breakLongWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let currentLine = '';

    for (const char of word) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = char;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Add ellipsis to a line that's too long
   */
  private addEllipsis(ctx: CanvasRenderingContext2D, line: string): string {
    const maxWidth = this.size.width - this.padding.left - this.padding.right;
    const ellipsis = '...';
    
    if (ctx.measureText(line).width <= maxWidth) {
      return line;
    }

    // Binary search for the right length
    let left = 0;
    let right = line.length;
    let result = line;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const testText = line.substring(0, mid) + ellipsis;
      const width = ctx.measureText(testText).width;

      if (width <= maxWidth) {
        result = testText;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }

  /**
   * Calculate the measured size of the text
   */
  private calculateMeasuredSize(ctx: CanvasRenderingContext2D): void {
    let maxWidth = 0;
    
    for (const line of this._lines) {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }

    const totalHeight = this._lines.length * this.fontSize * this.lineHeight;

    this._measuredSize = {
      width: maxWidth + this.padding.left + this.padding.right,
      height: totalHeight + this.padding.top + this.padding.bottom
    };

    // Auto-resize if using wrap constraints
    if (this.constraints.width.type === 'wrap') {
      this.size.width = this._measuredSize.width;
    }
    if (this.constraints.height.type === 'wrap') {
      this.size.height = this._measuredSize.height;
    }
  }

  /**
   * Get the starting X position based on text alignment
   */
  private getTextStartX(bounds: { x: number; width: number }): number {
    switch (this.textAlign) {
      case 'left':
        return bounds.x + this.padding.left;
      case 'center':
        return bounds.x + bounds.width / 2;
      case 'right':
        return bounds.x + bounds.width - this.padding.right;
      default:
        return bounds.x + this.padding.left;
    }
  }

  /**
   * Create a canvas for text measurement
   */
  private createMeasurementCanvas(): HTMLCanvasElement {
    // In a real implementation, you might want to cache this
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas;
  }
}