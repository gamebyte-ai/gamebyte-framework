import { EventEmitter } from 'eventemitter3';
import { List } from '@pixi/ui';
import { IContainer } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';

/**
 * GameList configuration
 */
export interface GameListConfig {
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  padding?: number;
}

/**
 * Game-style list component for arranging children
 *
 * Features:
 * - Automatic layout with configurable gap
 * - Vertical or horizontal arrangement
 * - Dynamic add/remove items
 *
 * @example
 * ```typescript
 * const menu = new GameList({ direction: 'vertical', gap: 12 });
 * menu.addItem(button1.getContainer());
 * menu.addItem(button2.getContainer());
 * menu.addItem(button3.getContainer());
 * stage.addChild(menu.getContainer());
 * ```
 */
export class GameList extends EventEmitter {
  private container: IContainer;
  private pixiList: List;
  private items: IContainer[] = [];

  private config: Required<GameListConfig>;

  constructor(config: GameListConfig = {}) {
    super();

    this.config = {
      direction: config.direction || 'vertical',
      gap: config.gap || 8,
      padding: config.padding || 0
    };

    // Create our wrapper container
    this.container = graphics().createContainer();

    // Create @pixi/ui List for layout logic
    this.pixiList = new List({
      type: this.config.direction,
      elementsMargin: this.config.gap,
      padding: this.config.padding
    });

    // Add pixi list to our container
    this.container.addChild(this.pixiList as any);
  }

  /** Add an item to the list */
  public addItem(item: IContainer): void {
    this.items.push(item);
    this.pixiList.addChild(item as any);
    this.emit('itemAdded', item);
  }

  /** Remove an item from the list */
  public removeItem(item: IContainer): void {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.pixiList.removeChild(item as any);
      this.emit('itemRemoved', item);
    }
  }

  /** Get all items */
  public getItems(): IContainer[] {
    return [...this.items];
  }

  /** Clear all items */
  public clear(): void {
    this.items.forEach(item => {
      this.pixiList.removeChild(item as any);
    });
    this.items = [];
    this.emit('cleared');
  }

  /** Get item count */
  public getItemCount(): number {
    return this.items.length;
  }

  /** Set gap between items */
  public setGap(gap: number): void {
    this.config.gap = gap;
    this.pixiList.elementsMargin = gap;
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
    this.clear();
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
