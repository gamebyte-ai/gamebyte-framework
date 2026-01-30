import { EventEmitter } from 'eventemitter3';
import { ScrollBox } from '@pixi/ui';
import { IContainer, IGraphics } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors } from '../themes/GameStyleUITheme';

/**
 * Color scheme for game-style scrollbox
 */
export interface GameScrollBoxColorScheme {
  background: number;
  border: number;
  borderInner: number;
  shadow: number;
  scrollbarTrack: number;
  scrollbarThumb: number;
  scrollbarThumbHover: number;
  highlight: number;
}

/**
 * GameScrollBox configuration
 */
export interface GameScrollBoxConfig {
  width?: number;
  height?: number;
  padding?: number;
  scrollDirection?: 'vertical' | 'horizontal' | 'both';
  colorScheme?: GameScrollBoxColorScheme;
  showScrollbar?: boolean;
}

/**
 * Game-style scrollable container with jellybean styling
 *
 * Features:
 * - Black outer border with inner shadow
 * - Custom styled scrollbar
 * - Smooth scroll behavior
 * - Content masking
 *
 * @example
 * ```typescript
 * const scrollBox = new GameScrollBox({ width: 300, height: 400 });
 * scrollBox.addItem(item1);
 * scrollBox.addItem(item2);
 * scrollBox.addItem(item3);
 * stage.addChild(scrollBox.getContainer());
 * ```
 */
export class GameScrollBox extends EventEmitter {
  private container: IContainer;
  private shadowGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private backgroundGraphics: IGraphics;
  private pixiScrollBox!: ScrollBox;
  private items: IContainer[] = [];

  private config: Required<GameScrollBoxConfig>;

  constructor(config: GameScrollBoxConfig = {}) {
    super();

    this.config = {
      width: config.width || 300,
      height: config.height || 200,
      padding: config.padding || 8,
      scrollDirection: config.scrollDirection || 'vertical',
      colorScheme: config.colorScheme || GameStyleColors.GAME_SCROLLBOX,
      showScrollbar: config.showScrollbar !== false
    };

    const factory = graphics();

    // Create container and graphics
    this.container = factory.createContainer();
    this.shadowGraphics = factory.createGraphics();
    this.borderGraphics = factory.createGraphics();
    this.backgroundGraphics = factory.createGraphics();

    // Build hierarchy
    this.container.addChild(this.shadowGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.backgroundGraphics);

    // Create @pixi/ui ScrollBox
    this.createPixiScrollBox();

    // Initial render
    this.render();
  }

  private createPixiScrollBox(): void {
    const { width, height, padding, scrollDirection } = this.config;
    const borderWidth = 3;
    const contentWidth = width - borderWidth * 2 - padding * 2;
    const contentHeight = height - borderWidth * 2 - padding * 2;

    this.pixiScrollBox = new ScrollBox({
      width: contentWidth,
      height: contentHeight,
      type: scrollDirection === 'both' ? undefined : scrollDirection,
      padding: padding,
      globalScroll: true,
      shiftScroll: scrollDirection === 'horizontal',
      disableEasing: false,
      dragTrashHold: 10
    });

    // Position inside our styled frame
    this.pixiScrollBox.x = borderWidth + padding;
    this.pixiScrollBox.y = borderWidth + padding;

    // Forward scroll events
    this.pixiScrollBox.onScroll.connect((value) => {
      const scrollY = typeof value === 'number' ? value : (value as { y?: number }).y ?? 0;
      this.emit('scroll', { y: scrollY, x: 0 });
    });

    this.container.addChild(this.pixiScrollBox as any);
  }

  private render(): void {
    const { width, height, colorScheme } = this.config;
    const radius = 8;
    const shadowOffset = 3;

    // Clear all
    this.shadowGraphics.clear();
    this.borderGraphics.clear();
    this.backgroundGraphics.clear();

    // 1. Inner shadow (inset effect)
    this.shadowGraphics.roundRect(shadowOffset, shadowOffset, width, height, radius);
    this.shadowGraphics.fill({ color: colorScheme.shadow, alpha: 0.5 });

    // 2. Black border
    this.borderGraphics.roundRect(-1, -1, width + 2, height + 2, radius + 1);
    this.borderGraphics.stroke({ color: colorScheme.border, width: 1 });

    // 3. Background
    this.backgroundGraphics.roundRect(0, 0, width, height, radius);
    this.backgroundGraphics.fill({ color: colorScheme.background });

    // 4. Inner border
    this.backgroundGraphics.roundRect(1, 1, width - 2, height - 2, radius - 1);
    this.backgroundGraphics.stroke({ color: colorScheme.borderInner, width: 1, alpha: 0.5 });
  }

  /** Add an item to the scroll box */
  public addItem(item: IContainer): void {
    this.items.push(item);
    this.pixiScrollBox.addItem(item as any);
    this.emit('itemAdded', item);
  }

  /** Remove an item from the scroll box */
  public removeItem(item: IContainer): void {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.pixiScrollBox.removeItem(index);
      this.emit('itemRemoved', item);
    }
  }

  /** Get all items */
  public getItems(): IContainer[] {
    return [...this.items];
  }

  /** Scroll to a specific position */
  public scrollToPosition(x: number, y: number): void {
    this.pixiScrollBox.scrollToPosition({ x, y });
  }

  /** Scroll to an item by index */
  public scrollToItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.pixiScrollBox.scrollTo(index);
    }
  }

  /** Scroll to top */
  public scrollToTop(): void {
    this.pixiScrollBox.scrollTop();
  }

  /** Scroll to bottom */
  public scrollToBottom(): void {
    this.pixiScrollBox.scrollBottom();
  }

  /** Get current scroll position Y */
  public getScrollY(): number {
    return this.pixiScrollBox.scrollY;
  }

  /** Get current scroll position X */
  public getScrollX(): number {
    return this.pixiScrollBox.scrollX;
  }

  /** Set scroll position Y */
  public setScrollY(value: number): void {
    this.pixiScrollBox.scrollY = value;
  }

  /** Set scroll position X */
  public setScrollX(value: number): void {
    this.pixiScrollBox.scrollX = value;
  }

  /** Set position */
  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /** Get the container */
  public getContainer(): IContainer {
    return this.container;
  }

  /** Destroy the component */
  public destroy(): void {
    this.items = [];
    this.pixiScrollBox.destroy();
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}

/**
 * Pre-defined scrollbox color schemes
 */
export const GameScrollBoxColors = {
  DEFAULT: GameStyleColors.GAME_SCROLLBOX,

  DARK: {
    ...GameStyleColors.GAME_SCROLLBOX,
    background: 0x1A2530,
    scrollbarTrack: 0x0A1520
  } as GameScrollBoxColorScheme,

  LIGHT: {
    ...GameStyleColors.GAME_SCROLLBOX,
    background: 0x4A5A6A,
    scrollbarTrack: 0x3A4A5A
  } as GameScrollBoxColorScheme
};
