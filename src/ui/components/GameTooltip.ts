import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { getFrameworkFontFamily, loadFrameworkFont } from '../utils/FontLoader';

/**
 * Tail/pointer position for the tooltip
 */
export type TooltipTailPosition =
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'left-top'
  | 'left-center'
  | 'left-bottom'
  | 'right-top'
  | 'right-center'
  | 'right-bottom'
  | 'none';

/**
 * Color scheme for the tooltip
 */
export interface GameTooltipColorScheme {
  background: number;
  border: number;
  text: number;
  textStroke?: number;
  shadow?: number;
}

/**
 * GameTooltip configuration
 */
export interface GameTooltipConfig {
  text?: string;
  maxWidth?: number;
  padding?: number;
  fontSize?: number;
  fontFamily?: string;
  colorScheme?: GameTooltipColorScheme;
  borderRadius?: number;
  borderWidth?: number;
  tailPosition?: TooltipTailPosition;
  tailSize?: number;
  showShadow?: boolean;
  shadowOffset?: number;
  shadowAlpha?: number;
}

/**
 * Default color scheme matching the "Coming Soon" tooltip style
 */
const DEFAULT_TOOLTIP_COLORS: GameTooltipColorScheme = {
  background: 0x7DD3FC, // Light cyan/sky blue
  border: 0x1E3A5F,     // Dark navy blue
  text: 0xFFFFFF,       // White
  textStroke: 0x1E3A5F, // Dark navy for text stroke
  shadow: 0x000000,     // Black shadow
};

/**
 * Preset color schemes for common tooltip styles
 */
export const GameTooltipColors = {
  /** Light blue/cyan (default - matches the "Coming Soon" style) */
  CYAN: { ...DEFAULT_TOOLTIP_COLORS },

  /** Classic yellow warning tooltip */
  YELLOW: {
    background: 0xFDE047,
    border: 0x92400E,
    text: 0x422006,
    textStroke: undefined,
    shadow: 0x000000,
  } as GameTooltipColorScheme,

  /** Green success tooltip */
  GREEN: {
    background: 0x86EFAC,
    border: 0x166534,
    text: 0xFFFFFF,
    textStroke: 0x166534,
    shadow: 0x000000,
  } as GameTooltipColorScheme,

  /** Red error/warning tooltip */
  RED: {
    background: 0xFCA5A5,
    border: 0x991B1B,
    text: 0xFFFFFF,
    textStroke: 0x991B1B,
    shadow: 0x000000,
  } as GameTooltipColorScheme,

  /** Purple/violet tooltip */
  PURPLE: {
    background: 0xD8B4FE,
    border: 0x6B21A8,
    text: 0xFFFFFF,
    textStroke: 0x6B21A8,
    shadow: 0x000000,
  } as GameTooltipColorScheme,

  /** Dark tooltip (for light backgrounds) */
  DARK: {
    background: 0x374151,
    border: 0x111827,
    text: 0xFFFFFF,
    textStroke: undefined,
    shadow: 0x000000,
  } as GameTooltipColorScheme,

  /** White tooltip (for dark backgrounds) */
  WHITE: {
    background: 0xFFFFFF,
    border: 0xD1D5DB,
    text: 0x374151,
    textStroke: undefined,
    shadow: 0x000000,
  } as GameTooltipColorScheme,
};

/**
 * GameTooltip - Speech bubble style tooltip/popover component
 *
 * A versatile tooltip component that can be used for:
 * - Informational tooltips on hover
 * - Popovers on click/tap
 * - Status indicators (Coming Soon, New, etc.)
 * - Tutorial hints
 *
 * Features:
 * - Customizable tail/pointer position (12 positions + none)
 * - Multiple color scheme presets
 * - Auto-sizing based on text content
 * - Optional drop shadow
 * - Mobile-optimized rendering
 *
 * @example
 * ```typescript
 * const tooltip = new GameTooltip({
 *   text: 'Coming Soon',
 *   tailPosition: 'bottom-left',
 *   colorScheme: GameTooltipColors.CYAN
 * });
 *
 * tooltip.setPosition(100, 50);
 * stage.addChild(tooltip.getContainer());
 * ```
 */
export class GameTooltip extends EventEmitter {
  private container: IContainer;
  private shadowGraphics: IGraphics;
  private bubbleGraphics: IGraphics;
  private textField: IText;

  private config: Required<GameTooltipConfig>;
  private bubbleWidth: number = 0;
  private bubbleHeight: number = 0;

  constructor(config: GameTooltipConfig = {}) {
    super();

    // Trigger font loading (non-blocking)
    loadFrameworkFont();

    // Default configuration
    this.config = {
      text: config.text || 'Tooltip',
      maxWidth: config.maxWidth || 200,
      padding: config.padding || 12,
      fontSize: config.fontSize || 16,
      fontFamily: config.fontFamily || getFrameworkFontFamily(),
      colorScheme: config.colorScheme || DEFAULT_TOOLTIP_COLORS,
      borderRadius: config.borderRadius || 10,
      borderWidth: config.borderWidth || 3,
      tailPosition: config.tailPosition || 'bottom-left',
      tailSize: config.tailSize || 10,
      showShadow: config.showShadow !== false,
      shadowOffset: config.shadowOffset || 4,
      shadowAlpha: config.shadowAlpha || 0.3,
    };

    const factory = graphics();

    // Create container hierarchy
    this.container = factory.createContainer();

    // Create shadow layer
    this.shadowGraphics = factory.createGraphics();
    this.container.addChild(this.shadowGraphics);

    // Create bubble (background + border)
    this.bubbleGraphics = factory.createGraphics();
    this.container.addChild(this.bubbleGraphics);

    // Create text
    this.textField = this.createTextField();
    this.container.addChild(this.textField);

    // Initial render
    this.render();
  }

  /**
   * Create the text field
   */
  private createTextField(): IText {
    const { colorScheme, fontSize, fontFamily, maxWidth, padding } = this.config;
    const hasStroke = colorScheme.textStroke !== undefined;

    return graphics().createText(this.config.text, {
      fontFamily,
      fontSize,
      fontWeight: '700',
      fill: colorScheme.text,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: maxWidth - padding * 2,
      ...(hasStroke && {
        stroke: colorScheme.textStroke,
        strokeThickness: Math.max(2, fontSize * 0.1),
      }),
    });
  }

  /**
   * Render the tooltip
   */
  private render(): void {
    const {
      padding,
      borderWidth,
      colorScheme,
      showShadow,
      shadowOffset,
      shadowAlpha,
    } = this.config;

    // Calculate bubble dimensions based on text
    const textWidth = this.textField.width || 50;
    const textHeight = this.textField.height || 20;

    this.bubbleWidth = textWidth + padding * 2;
    this.bubbleHeight = textHeight + padding * 2;

    // Clear previous graphics
    this.shadowGraphics.clear();
    this.bubbleGraphics.clear();

    // Get tail info
    const tailInfo = this.getTailInfo();

    // Draw shadow (if enabled)
    if (showShadow && colorScheme.shadow !== undefined) {
      this.drawBubbleShape(
        this.shadowGraphics,
        shadowOffset,
        shadowOffset,
        colorScheme.shadow,
        shadowAlpha,
        tailInfo
      );
    }

    // Draw border (larger bubble behind)
    this.drawBubbleShape(
      this.bubbleGraphics,
      -borderWidth,
      -borderWidth,
      colorScheme.border,
      1,
      tailInfo,
      borderWidth
    );

    // Draw main background
    this.drawBubbleShape(
      this.bubbleGraphics,
      0,
      0,
      colorScheme.background,
      1,
      tailInfo
    );

    // Position text centered in bubble
    this.textField.x = padding;
    this.textField.y = padding;
  }

  /**
   * Get tail position and direction info
   */
  private getTailInfo(): {
    side: 'top' | 'bottom' | 'left' | 'right' | 'none';
    position: 'start' | 'center' | 'end';
  } {
    const { tailPosition } = this.config;

    if (tailPosition === 'none') {
      return { side: 'none', position: 'center' };
    }

    const [side, position] = tailPosition.split('-') as [
      'top' | 'bottom' | 'left' | 'right',
      'start' | 'center' | 'end' | 'left' | 'right' | 'top' | 'bottom'
    ];

    // Normalize position names
    let normalizedPosition: 'start' | 'center' | 'end' = 'center';
    if (position === 'left' || position === 'top') {
      normalizedPosition = 'start';
    } else if (position === 'right' || position === 'bottom') {
      normalizedPosition = 'end';
    } else if (position === 'center') {
      normalizedPosition = 'center';
    }

    return { side, position: normalizedPosition };
  }

  /**
   * Draw the bubble shape with optional tail
   */
  private drawBubbleShape(
    gfx: IGraphics,
    offsetX: number,
    offsetY: number,
    color: number,
    alpha: number,
    tailInfo: { side: 'top' | 'bottom' | 'left' | 'right' | 'none'; position: 'start' | 'center' | 'end' },
    extraSize: number = 0
  ): void {
    const { borderRadius, tailSize } = this.config;
    const w = this.bubbleWidth + extraSize * 2;
    const h = this.bubbleHeight + extraSize * 2;
    const r = Math.min(borderRadius + extraSize, w / 2, h / 2);
    const ts = tailSize + (extraSize > 0 ? extraSize * 0.5 : 0);

    const x = offsetX;
    const y = offsetY;

    // Start path
    gfx.moveTo(x + r, y);

    // Top edge
    if (tailInfo.side === 'top') {
      const tailX = this.getTailOffset(w, r, tailInfo.position);
      gfx.lineTo(x + tailX - ts, y);
      gfx.lineTo(x + tailX, y - ts);
      gfx.lineTo(x + tailX + ts, y);
    }
    gfx.lineTo(x + w - r, y);

    // Top-right corner
    gfx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);

    // Right edge
    if (tailInfo.side === 'right') {
      const tailY = this.getTailOffset(h, r, tailInfo.position);
      gfx.lineTo(x + w, y + tailY - ts);
      gfx.lineTo(x + w + ts, y + tailY);
      gfx.lineTo(x + w, y + tailY + ts);
    }
    gfx.lineTo(x + w, y + h - r);

    // Bottom-right corner
    gfx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);

    // Bottom edge
    if (tailInfo.side === 'bottom') {
      const tailX = this.getTailOffset(w, r, tailInfo.position);
      gfx.lineTo(x + tailX + ts, y + h);
      gfx.lineTo(x + tailX, y + h + ts);
      gfx.lineTo(x + tailX - ts, y + h);
    }
    gfx.lineTo(x + r, y + h);

    // Bottom-left corner
    gfx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);

    // Left edge
    if (tailInfo.side === 'left') {
      const tailY = this.getTailOffset(h, r, tailInfo.position);
      gfx.lineTo(x, y + tailY + ts);
      gfx.lineTo(x - ts, y + tailY);
      gfx.lineTo(x, y + tailY - ts);
    }
    gfx.lineTo(x, y + r);

    // Top-left corner
    gfx.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);

    // Close and fill
    gfx.closePath();
    gfx.fill({ color, alpha });
  }

  /**
   * Calculate tail offset based on position
   */
  private getTailOffset(
    dimension: number,
    radius: number,
    position: 'start' | 'center' | 'end'
  ): number {
    const { tailSize } = this.config;
    const minOffset = radius + tailSize + 5;
    const maxOffset = dimension - radius - tailSize - 5;

    switch (position) {
      case 'start':
        return Math.max(minOffset, dimension * 0.25);
      case 'center':
        return dimension / 2;
      case 'end':
        return Math.min(maxOffset, dimension * 0.75);
      default:
        return dimension / 2;
    }
  }

  /**
   * Set the tooltip text
   */
  public setText(text: string): this {
    this.config.text = text;
    this.textField.text = text;
    this.render();
    return this;
  }

  /**
   * Get the current text
   */
  public getText(): string {
    return this.config.text;
  }

  /**
   * Set the tail position
   */
  public setTailPosition(position: TooltipTailPosition): this {
    this.config.tailPosition = position;
    this.render();
    return this;
  }

  /**
   * Set the color scheme
   */
  public setColorScheme(scheme: GameTooltipColorScheme): this {
    this.config.colorScheme = scheme;

    // Recreate text with new colors
    this.container.removeChild(this.textField);
    this.textField = this.createTextField();
    this.container.addChild(this.textField);

    this.render();
    return this;
  }

  /**
   * Set tooltip position
   */
  public setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  /**
   * Get tooltip position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  /**
   * Show the tooltip
   */
  public show(): this {
    this.container.visible = true;
    this.emit('show');
    return this;
  }

  /**
   * Hide the tooltip
   */
  public hide(): this {
    this.container.visible = false;
    this.emit('hide');
    return this;
  }

  /**
   * Toggle visibility
   */
  public toggle(): this {
    if (this.container.visible) {
      this.hide();
    } else {
      this.show();
    }
    return this;
  }

  /**
   * Check if tooltip is visible
   */
  public isVisible(): boolean {
    return this.container.visible;
  }

  /**
   * Set visibility
   */
  public setVisible(visible: boolean): this {
    this.container.visible = visible;
    return this;
  }

  /**
   * Get the bubble dimensions
   */
  public getSize(): { width: number; height: number } {
    return {
      width: this.bubbleWidth,
      height: this.bubbleHeight,
    };
  }

  /**
   * Get the total bounds including tail and shadow
   */
  public getTotalBounds(): { width: number; height: number; tailOffset: number } {
    const { tailSize, showShadow, shadowOffset } = this.config;
    const tailInfo = this.getTailInfo();

    let width = this.bubbleWidth;
    let height = this.bubbleHeight;
    let tailOffset = 0;

    // Add tail size to appropriate dimension
    if (tailInfo.side === 'left' || tailInfo.side === 'right') {
      width += tailSize;
      tailOffset = tailInfo.side === 'left' ? tailSize : 0;
    } else if (tailInfo.side === 'top' || tailInfo.side === 'bottom') {
      height += tailSize;
      tailOffset = tailInfo.side === 'top' ? tailSize : 0;
    }

    // Add shadow
    if (showShadow) {
      width += shadowOffset;
      height += shadowOffset;
    }

    return { width, height, tailOffset };
  }

  /**
   * Get the container
   */
  public getContainer(): IContainer {
    return this.container;
  }

  /**
   * Destroy the tooltip
   */
  public destroy(): void {
    this.container.destroy();
    this.removeAllListeners();
  }
}
