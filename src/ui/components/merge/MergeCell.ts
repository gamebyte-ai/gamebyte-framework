import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics } from '../../../contracts/Graphics';
import { graphics } from '../../../graphics/GraphicsEngine';
import { MergeItem } from './MergeItem';
import { lightenColor } from '../../themes/GameStyleUITheme';

/**
 * MergeCell configuration
 */
export interface MergeCellConfig {
  /** Cell width */
  width?: number;
  /** Cell height */
  height?: number;
  /** Row index in grid */
  row: number;
  /** Column index in grid */
  col: number;
  /** Background color */
  backgroundColor?: number;
  /** Border color */
  borderColor?: number;
  /** Border width */
  borderWidth?: number;
  /** Border radius for rounded corners */
  borderRadius?: number;
  /** Whether this cell can accept items */
  acceptsItems?: boolean;
  /** Whether this cell is locked */
  locked?: boolean;
  /** Visual style for empty state */
  emptyStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
}

/**
 * Events emitted by MergeCell
 */
export interface MergeCellEvents {
  'item-placed': (cell: MergeCell, item: MergeItem) => void;
  'item-removed': (cell: MergeCell, item: MergeItem) => void;
  'item-dropped': (cell: MergeCell, item: MergeItem) => void;
  'merge-attempt': (cell: MergeCell, droppedItem: MergeItem, existingItem: MergeItem) => void;
  'hover-enter': (cell: MergeCell) => void;
  'hover-exit': (cell: MergeCell) => void;
  'locked-changed': (cell: MergeCell, locked: boolean) => void;
}

/**
 * MergeCell - A single cell in the merge grid
 *
 * A MergeCell can hold one MergeItem at a time and acts as a drop zone
 * for drag operations. When an item is dropped on a cell that already
 * contains an item of the same tier, a merge is triggered.
 *
 * Features:
 * - Hold single item
 * - Drop zone detection
 * - Merge trigger logic
 * - Visual feedback (hover, occupied, locked states)
 * - Lock/unlock for progression systems
 *
 * @example
 * ```typescript
 * const cell = new MergeCell({
 *   row: 0,
 *   col: 0,
 *   width: 100,
 *   height: 100
 * });
 *
 * cell.on('item-dropped', (cell, item) => {
 *   if (cell.hasItem() && cell.getItem()?.canMergeWith(item)) {
 *     // Trigger merge
 *   }
 * });
 * ```
 */
export class MergeCell extends EventEmitter<MergeCellEvents> {
  private container: IContainer;
  private background: IGraphics;
  private highlightGraphics: IGraphics;

  private config: Required<MergeCellConfig>;
  private _item: MergeItem | null = null;
  private _isHovered: boolean = false;
  private _isHighlighted: boolean = false;
  private _isDestroyed: boolean = false;

  constructor(config: MergeCellConfig) {
    super();

    this.config = {
      width: config.width ?? 100,
      height: config.height ?? 100,
      row: config.row,
      col: config.col,
      backgroundColor: config.backgroundColor ?? 0x2a2a2a,
      borderColor: config.borderColor ?? 0x444444,
      borderWidth: config.borderWidth ?? 2,
      borderRadius: config.borderRadius ?? 8,
      acceptsItems: config.acceptsItems ?? true,
      locked: config.locked ?? false,
      emptyStyle: config.emptyStyle ?? 'solid'
    };

    // Create visual elements
    this.container = graphics().createContainer();
    this.background = graphics().createGraphics();
    this.highlightGraphics = graphics().createGraphics();

    this.container.addChild(this.background);
    this.container.addChild(this.highlightGraphics);

    // Setup interaction
    this.setupInteraction();

    // Initial render
    this.updateVisuals();
  }

  // ============================================
  // PUBLIC GETTERS
  // ============================================

  /** Get row index */
  get row(): number {
    return this.config.row;
  }

  /** Get column index */
  get col(): number {
    return this.config.col;
  }

  /** Get cell width */
  get width(): number {
    return this.config.width;
  }

  /** Get cell height */
  get height(): number {
    return this.config.height;
  }

  /** Check if cell is locked */
  get isLocked(): boolean {
    return this.config.locked;
  }

  /** Check if cell can accept items */
  get acceptsItems(): boolean {
    return this.config.acceptsItems && !this.config.locked;
  }

  /** Get the display container */
  getContainer(): IContainer {
    return this.container;
  }

  /** Get cell center position */
  getCenterPosition(): { x: number; y: number } {
    return {
      x: this.container.x + this.config.width / 2,
      y: this.container.y + this.config.height / 2
    };
  }

  /** Get world center position */
  getWorldCenterPosition(): { x: number; y: number } {
    const containerAny = this.container as any;
    const globalPos = containerAny.getGlobalPosition?.() ?? { x: this.container.x, y: this.container.y };
    return {
      x: globalPos.x + this.config.width / 2,
      y: globalPos.y + this.config.height / 2
    };
  }

  // ============================================
  // ITEM MANAGEMENT
  // ============================================

  /**
   * Check if cell has an item
   */
  hasItem(): boolean {
    return this._item !== null;
  }

  /**
   * Get the current item (if any)
   */
  getItem(): MergeItem | null {
    return this._item;
  }

  /**
   * Place an item in this cell
   */
  placeItem(item: MergeItem): boolean {
    if (!this.acceptsItems) {
      return false;
    }

    if (this._item !== null) {
      // Cell already has an item
      return false;
    }

    this._item = item;

    // Position item at cell center
    const center = this.getCenterPosition();
    item.setPosition(center.x, center.y);

    // Add item to container
    const itemContainerAny = item.getContainer() as any;
    if (itemContainerAny.parent !== this.container) {
      this.container.addChild(item.getContainer());
    }

    this.updateVisuals();
    this.emit('item-placed', this, item);

    return true;
  }

  /**
   * Remove the current item
   */
  removeItem(): MergeItem | null {
    if (!this._item) {
      return null;
    }

    const item = this._item;
    this._item = null;

    // Remove from container
    const itemContainerAny = item.getContainer() as any;
    if (itemContainerAny.parent === this.container) {
      this.container.removeChild(item.getContainer());
    }

    this.updateVisuals();
    this.emit('item-removed', this, item);

    return item;
  }

  /**
   * Check if this cell can accept a specific item
   */
  canAcceptItem(item: MergeItem): boolean {
    if (!this.acceptsItems) {
      return false;
    }

    // Empty cell can accept any item
    if (!this._item) {
      return true;
    }

    // Cell with item can accept if merge is possible
    return this._item.canMergeWith(item);
  }

  /**
   * Handle a dropped item
   * Returns: 'placed' | 'merged' | 'rejected'
   */
  handleDrop(item: MergeItem): 'placed' | 'merged' | 'rejected' {
    if (!this.acceptsItems) {
      return 'rejected';
    }

    // Emit drop event
    this.emit('item-dropped', this, item);

    // If cell is empty, place the item
    if (!this._item) {
      this.placeItem(item);
      return 'placed';
    }

    // If cell has item, try to merge
    if (this._item.canMergeWith(item)) {
      this.emit('merge-attempt', this, item, this._item);
      return 'merged';
    }

    return 'rejected';
  }

  // ============================================
  // HIT DETECTION
  // ============================================

  /**
   * Check if a point is inside this cell
   */
  containsPoint(worldX: number, worldY: number): boolean {
    const containerAny = this.container as any;
    const pos = containerAny.getGlobalPosition?.() ?? { x: this.container.x, y: this.container.y };
    const x = pos.x;
    const y = pos.y;

    return (
      worldX >= x &&
      worldX <= x + this.config.width &&
      worldY >= y &&
      worldY <= y + this.config.height
    );
  }

  // ============================================
  // VISUAL STATE
  // ============================================

  /**
   * Set highlight state (for drag hover feedback)
   */
  setHighlighted(highlighted: boolean, canDrop: boolean = true): void {
    if (this._isHighlighted === highlighted) return;

    this._isHighlighted = highlighted;
    this.updateHighlight(canDrop);
  }

  /**
   * Lock/unlock the cell
   */
  setLocked(locked: boolean): void {
    if (this.config.locked === locked) return;

    this.config.locked = locked;
    this.updateVisuals();
    this.emit('locked-changed', this, locked);
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  /**
   * Destroy the cell
   */
  destroy(): void {
    if (this._isDestroyed) return;

    this._isDestroyed = true;

    if (this._item) {
      this._item.destroy();
    }

    this.container.destroy();
    this.removeAllListeners();
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Setup cell interaction
   */
  private setupInteraction(): void {
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    this.container.on('pointerover', () => {
      if (this._isDestroyed) return;
      this._isHovered = true;
      this.emit('hover-enter', this);
    });

    this.container.on('pointerout', () => {
      if (this._isDestroyed) return;
      this._isHovered = false;
      this.emit('hover-exit', this);
    });
  }

  /**
   * Update visual appearance
   */
  private updateVisuals(): void {
    const { width, height, backgroundColor, borderColor, borderWidth, borderRadius, locked } = this.config;

    this.background.clear();

    // Determine colors based on state
    let bgColor = backgroundColor;
    let alpha = 1;

    if (locked) {
      bgColor = 0x1a1a1a;
      alpha = 0.5;
    } else if (this._item) {
      // Slightly lighter when occupied
      bgColor = lightenColor(backgroundColor, 0.1);
    }

    // Draw background using Pixi v8 modern API
    this.background
      .roundRect(0, 0, width, height, borderRadius)
      .fill({ color: bgColor, alpha })
      .stroke({ color: borderColor, width: borderWidth, alpha });

    // Draw lock icon if locked
    if (locked) {
      this.drawLockIcon();
    }

    // Draw empty indicator if not occupied and not locked
    if (!this._item && !locked && this.config.emptyStyle !== 'none') {
      this.drawEmptyIndicator();
    }
  }

  /**
   * Update highlight overlay
   */
  private updateHighlight(canDrop: boolean): void {
    this.highlightGraphics.clear();

    if (!this._isHighlighted) return;

    const { width, height, borderRadius } = this.config;
    const color = canDrop ? 0x4CAF50 : 0xF44336;

    // Draw highlight fill and glow border using Pixi v8 modern API
    this.highlightGraphics
      .roundRect(0, 0, width, height, borderRadius)
      .fill({ color, alpha: 0.3 })
      .stroke({ color, width: 3, alpha: 0.8 });
  }

  /**
   * Draw lock icon
   */
  private drawLockIcon(): void {
    const { width, height } = this.config;
    const iconSize = Math.min(width, height) * 0.3;
    const centerX = width / 2;
    const centerY = height / 2;

    // Lock body using Pixi v8 modern API
    this.background
      .roundRect(
        centerX - iconSize / 2,
        centerY - iconSize / 4,
        iconSize,
        iconSize * 0.7,
        4
      )
      .fill({ color: 0x666666, alpha: 0.8 });

    // Lock shackle (simplified as a small circle on top)
    this.background
      .circle(centerX, centerY - iconSize / 3, iconSize * 0.25)
      .stroke({ color: 0x666666, width: iconSize * 0.12, alpha: 0.8 });
  }

  /**
   * Draw empty cell indicator
   */
  private drawEmptyIndicator(): void {
    const { width, height } = this.config;
    const size = Math.min(width, height) * 0.2;
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw plus sign using Pixi v8 modern API
    // Horizontal line
    this.background
      .moveTo(centerX - size / 2, centerY)
      .lineTo(centerX + size / 2, centerY)
      .stroke({ color: 0x555555, width: 2, alpha: 0.5 });

    // Vertical line
    this.background
      .moveTo(centerX, centerY - size / 2)
      .lineTo(centerX, centerY + size / 2)
      .stroke({ color: 0x555555, width: 2, alpha: 0.5 });
  }

}

export default MergeCell;
