import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText, ISprite, ITexture } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { getFrameworkFontFamily } from '../utils/FontLoader';

/**
 * TopBar item types
 */
export enum TopBarItemType {
  RESOURCE = 'resource',
  SCORE = 'score',
  TIMER = 'timer',
  LEVEL = 'level',
  BUTTON = 'button',
  COUNTER = 'counter',
  CUSTOM = 'custom'
}

/**
 * TopBar item configuration
 */
export interface TopBarItemConfig {
  type: TopBarItemType;
  id?: string;
  icon?: string | ITexture;
  value?: number | string;
  max?: number;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'abbreviate' | 'time';
  animated?: boolean;
  onClick?: () => void;
  visible?: boolean;
}

/**
 * TopBar theme configuration
 */
export interface TopBarTheme {
  backgroundColor?: number;
  backgroundAlpha?: number;
  textColor?: number;
  iconSize?: number;
  height?: number;
  padding?: number;
  itemSpacing?: number;
  borderRadius?: number;
  fontFamily?: string;
  fontSize?: number;
}

/**
 * TopBar configuration
 */
export interface TopBarConfig {
  width: number;
  position?: 'top' | 'bottom';
  items: TopBarItemConfig[];
  theme?: TopBarTheme;
  visible?: boolean;
}

/**
 * TopBar item instance
 */
interface TopBarItem {
  config: TopBarItemConfig;
  container: IContainer;
  icon?: ISprite;
  text?: IText;
  background?: IGraphics;
  value: number | string;
}

/**
 * TopBar - Flexible top bar UI component for mobile games
 *
 * Supports multiple item types:
 * - Resource displays (coins, gems, lives, etc.)
 * - Scores and counters
 * - Timers (countdown/countup)
 * - Level indicators
 * - Buttons (settings, pause, etc.)
 *
 * @example
 * ```typescript
 * const topBar = new TopBar({
 *     width: 800,
 *     items: [
 *         { type: 'resource', icon: 'coin', value: 1000, animated: true },
 *         { type: 'resource', icon: 'life', value: 3, max: 5 },
 *         { type: 'score', value: 0, prefix: 'Score: ' },
 *         { type: 'button', icon: 'pause', onClick: pauseGame }
 *     ]
 * });
 * ```
 */
export class TopBar extends EventEmitter {
  private container: IContainer;
  private background: IGraphics;
  private items: Map<string, TopBarItem>;
  private config: TopBarConfig;
  private theme: Required<TopBarTheme>;

  constructor(config: TopBarConfig) {
    super();
    this.config = config;
    this.items = new Map();

    // Default theme
    this.theme = {
      backgroundColor: 0x2C3E50,
      backgroundAlpha: 0.95,
      textColor: 0xFFFFFF,
      iconSize: 32,
      height: 80,
      padding: 15,
      itemSpacing: 20,
      borderRadius: 0,
      fontFamily: getFrameworkFontFamily(),
      fontSize: 24,
      ...config.theme
    };

    this.container = graphics().createContainer();
    this.background = graphics().createGraphics();
    this.container.addChild(this.background);

    this.createBackground();
    this.createItems();

    // Position
    if (config.position === 'bottom') {
      // Position will be set by parent based on canvas height
      this.container.y = 0; // Placeholder
    }

    this.container.visible = config.visible !== false;
  }

  /**
   * Create background graphics
   */
  private createBackground(): void {
    this.background.clear();

    if (this.theme.borderRadius > 0) {
      this.background.roundRect(
        0,
        0,
        this.config.width,
        this.theme.height,
        this.theme.borderRadius
      );
    } else {
      this.background.rect(0, 0, this.config.width, this.theme.height);
    }

    this.background.fill({
      color: this.theme.backgroundColor,
      alpha: this.theme.backgroundAlpha
    });
  }

  /**
   * Create all items
   */
  private createItems(): void {
    // Clear existing items
    this.items.forEach(item => {
      this.container.removeChild(item.container);
    });
    this.items.clear();

    // Calculate layout
    const visibleItems = this.config.items.filter(item => item.visible !== false);
    const totalItems = visibleItems.length;

    if (totalItems === 0) return;

    // Distribute items across the width
    const availableWidth = this.config.width - (this.theme.padding * 2);
    const itemWidth = (availableWidth - (this.theme.itemSpacing * (totalItems - 1))) / totalItems;

    let currentX = this.theme.padding;

    visibleItems.forEach((itemConfig, index) => {
      const item = this.createItem(itemConfig, itemWidth);
      item.container.x = currentX;
      item.container.y = this.theme.height / 2;

      const itemId = itemConfig.id || `item_${index}`;
      this.items.set(itemId, item);
      this.container.addChild(item.container);

      currentX += itemWidth + this.theme.itemSpacing;
    });
  }

  /**
   * Create a single item
   */
  private createItem(config: TopBarItemConfig, width: number): TopBarItem {
    const container = graphics().createContainer();
    const item: TopBarItem = {
      config,
      container,
      value: config.value || 0
    };

    // Create based on type
    switch (config.type) {
      case TopBarItemType.RESOURCE:
      case TopBarItemType.SCORE:
      case TopBarItemType.COUNTER:
        this.createResourceItem(item, width);
        break;

      case TopBarItemType.TIMER:
        this.createTimerItem(item, width);
        break;

      case TopBarItemType.LEVEL:
        this.createLevelItem(item, width);
        break;

      case TopBarItemType.BUTTON:
        this.createButtonItem(item, width);
        break;
    }

    return item;
  }

  /**
   * Create resource/score item (icon + text)
   */
  private createResourceItem(item: TopBarItem, width: number): void {
    const config = item.config;

    // Icon
    if (config.icon) {
      const iconTexture = typeof config.icon === 'string'
        ? graphics().createTexture(config.icon)
        : config.icon;

      item.icon = graphics().createSprite(iconTexture);
      if (item.icon.anchor) item.icon.anchor.set(0.5, 0.5);
      item.icon.width = this.theme.iconSize;
      item.icon.height = this.theme.iconSize;
      item.icon.x = -width / 4;
      item.container.addChild(item.icon);
    }

    // Text
    const textValue = this.formatValue(item.value, config);
    item.text = graphics().createText(textValue, {
      fontFamily: this.theme.fontFamily,
      fontSize: this.theme.fontSize,
      fill: this.theme.textColor,
      align: 'left'
    });
    if (item.text.anchor) item.text.anchor.set(0, 0.5);
    item.text.x = config.icon ? this.theme.iconSize / 2 + 5 : -width / 2;
    item.container.addChild(item.text);

    // Progress bar for max values
    if (config.max !== undefined) {
      this.createProgressBar(item, width);
    }
  }

  /**
   * Create timer item
   */
  private createTimerItem(item: TopBarItem, width: number): void {
    const textValue = this.formatValue(item.value, { ...item.config, format: 'time' });
    item.text = graphics().createText(textValue, {
      fontFamily: this.theme.fontFamily,
      fontSize: this.theme.fontSize,
      fill: this.theme.textColor,
      align: 'center'
    });
    if (item.text.anchor) item.text.anchor.set(0.5, 0.5);
    item.container.addChild(item.text);
  }

  /**
   * Create level indicator
   */
  private createLevelItem(item: TopBarItem, width: number): void {
    const prefix = item.config.prefix || 'Level ';
    const textValue = prefix + item.value;

    item.text = graphics().createText(textValue, {
      fontFamily: this.theme.fontFamily,
      fontSize: this.theme.fontSize,
      fill: this.theme.textColor,
      align: 'center'
    });
    if (item.text.anchor) item.text.anchor.set(0.5, 0.5);
    item.container.addChild(item.text);
  }

  /**
   * Create button item
   */
  private createButtonItem(item: TopBarItem, width: number): void {
    const config = item.config;

    // Background
    item.background = graphics().createGraphics();
    item.background.roundRect(
      -this.theme.iconSize / 2 - 10,
      -this.theme.iconSize / 2 - 10,
      this.theme.iconSize + 20,
      this.theme.iconSize + 20,
      10
    );
    item.background.fill({ color: 0xFFFFFF, alpha: 0.1 });
    item.container.addChild(item.background);

    // Icon
    if (config.icon) {
      const iconTexture = typeof config.icon === 'string'
        ? graphics().createTexture(config.icon)
        : config.icon;

      item.icon = graphics().createSprite(iconTexture);
      if (item.icon.anchor) item.icon.anchor.set(0.5, 0.5);
      item.icon.width = this.theme.iconSize;
      item.icon.height = this.theme.iconSize;
      item.container.addChild(item.icon);
    }

    // Make interactive
    item.container.eventMode = 'static';
    item.container.cursor = 'pointer';

    item.container.on('pointerdown', () => {
      if (item.background) {
        item.background.tint = 0xCCCCCC;
      }
    });

    item.container.on('pointerup', () => {
      if (item.background) {
        item.background.tint = 0xFFFFFF;
      }
      if (config.onClick) {
        config.onClick();
        this.emit('button:click', config.id);
      }
    });

    item.container.on('pointerupoutside', () => {
      if (item.background) {
        item.background.tint = 0xFFFFFF;
      }
    });
  }

  /**
   * Create progress bar (for resources with max values)
   */
  private createProgressBar(item: TopBarItem, width: number): void {
    // TODO: Implement progress bar visualization
    // For now, show value/max in text
    if (item.config.max !== undefined && item.text) {
      const textValue = `${item.value}/${item.config.max}`;
      item.text.text = textValue;
    }
  }

  /**
   * Format value based on format type
   */
  private formatValue(value: number | string, config: TopBarItemConfig): string {
    if (typeof value === 'string') return value;

    let formatted: string;

    switch (config.format) {
      case 'abbreviate':
        formatted = this.abbreviateNumber(value);
        break;

      case 'time':
        formatted = this.formatTime(value);
        break;

      case 'number':
      default:
        formatted = value.toLocaleString();
        break;
    }

    const prefix = config.prefix || '';
    const suffix = config.suffix || '';

    return prefix + formatted + suffix;
  }

  /**
   * Abbreviate large numbers (1000 -> 1K, 1000000 -> 1M)
   */
  private abbreviateNumber(num: number): string {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
  }

  /**
   * Format time (seconds to mm:ss or hh:mm:ss)
   */
  private formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Update an item's value
   */
  public updateItem(id: string, value: number | string, animated: boolean = false): void {
    const item = this.items.get(id);
    if (!item || !item.text) return;

    const oldValue = item.value;
    item.value = value;

    const newText = this.formatValue(value, item.config);
    item.text.text = newText;

    // Animate if requested and value is numeric
    if (animated && typeof value === 'number' && typeof oldValue === 'number') {
      this.animateValueChange(item, oldValue, value);
    }

    this.emit('item:updated', id, value);
  }

  /**
   * Animate value change
   */
  private animateValueChange(item: TopBarItem, from: number, to: number): void {
    // Simple scale animation on change
    if (!item.text) return;

    const originalScale = item.text.scale.x;
    item.text.scale.x = originalScale * 1.2;
    item.text.scale.y = originalScale * 1.2;

    // Smooth back to original scale
    const animate = () => {
      if (!item.text) return;

      const currentScale = item.text.scale.x;
      const newScale = currentScale + (originalScale - currentScale) * 0.1;

      item.text.scale.x = newScale;
      item.text.scale.y = newScale;

      if (Math.abs(newScale - originalScale) > 0.01) {
        requestAnimationFrame(animate);
      } else {
        item.text.scale.x = originalScale;
        item.text.scale.y = originalScale;
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Get item value
   */
  public getItemValue(id: string): number | string | undefined {
    return this.items.get(id)?.value;
  }

  /**
   * Set item visibility
   */
  public setItemVisible(id: string, visible: boolean): void {
    const item = this.items.get(id);
    if (item) {
      item.container.visible = visible;
    }
  }

  /**
   * Update theme
   */
  public setTheme(theme: Partial<TopBarTheme>): void {
    this.theme = { ...this.theme, ...theme };
    this.createBackground();
    this.createItems();
  }

  /**
   * Show/hide TopBar
   */
  public setVisible(visible: boolean): void {
    this.container.visible = visible;
    this.emit('visibility:changed', visible);
  }

  /**
   * Get container
   */
  public getContainer(): IContainer {
    return this.container;
  }

  /**
   * Destroy TopBar
   */
  public destroy(): void {
    this.items.forEach(item => {
      item.container.destroy({ children: true });
    });
    this.items.clear();
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
