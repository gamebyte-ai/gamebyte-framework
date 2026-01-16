import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics } from '../../../contracts/Graphics';
import { graphics } from '../../../graphics/GraphicsEngine';
import { MergeCell, MergeCellConfig } from './MergeCell';
import { MergeItem, MergeItemConfig } from './MergeItem';

/**
 * MergeGrid configuration
 */
export interface MergeGridConfig {
  /** Number of rows */
  rows: number;
  /** Number of columns */
  cols: number;
  /** Cell width */
  cellWidth?: number;
  /** Cell height */
  cellHeight?: number;
  /** Gap between cells */
  gap?: number;
  /** Padding around grid */
  padding?: number;
  /** Grid background color */
  backgroundColor?: number;
  /** Cell configuration overrides */
  cellConfig?: Partial<MergeCellConfig>;
  /** Which cells are initially locked (array of [row, col] pairs) */
  lockedCells?: Array<[number, number]>;
  /** Auto-spawn new items when merge happens */
  autoSpawn?: boolean;
  /** Maximum tier for items */
  maxTier?: number;
}

/**
 * Events emitted by MergeGrid
 */
export interface MergeGridEvents {
  'initialized': (grid: MergeGrid) => void;
  'item-spawned': (grid: MergeGrid, item: MergeItem, cell: MergeCell) => void;
  'item-moved': (grid: MergeGrid, item: MergeItem, fromCell: MergeCell | null, toCell: MergeCell) => void;
  'merge-started': (grid: MergeGrid, item1: MergeItem, item2: MergeItem, cell: MergeCell) => void;
  'merge-completed': (grid: MergeGrid, resultItem: MergeItem, cell: MergeCell) => void;
  'max-tier-reached': (grid: MergeGrid, item: MergeItem) => void;
  'grid-full': (grid: MergeGrid) => void;
  'cell-unlocked': (grid: MergeGrid, cell: MergeCell) => void;
}

/**
 * MergeGrid - Main container for merge puzzle games
 *
 * MergeGrid manages a grid of MergeCells and handles:
 * - Cell layout and positioning
 * - Item drag and drop between cells
 * - Merge detection and execution
 * - Item spawning
 * - Progression (cell unlocking)
 *
 * Features:
 * - Flexible grid sizing (rows x cols)
 * - Configurable cell appearance
 * - Automatic merge handling
 * - Drop zone detection during drag
 * - Cell locking/unlocking for progression
 * - Event system for game logic integration
 *
 * @example
 * ```typescript
 * const grid = new MergeGrid({
 *   rows: 5,
 *   cols: 5,
 *   cellWidth: 80,
 *   cellHeight: 80,
 *   gap: 8
 * });
 *
 * // Spawn an item
 * grid.spawnItem({ tier: 1 });
 *
 * // Listen for merges
 * grid.on('merge-completed', (grid, item, cell) => {
 *   console.log(`Merged! New tier: ${item.tier}`);
 * });
 *
 * scene.addChild(grid.getContainer());
 * ```
 */
export class MergeGrid extends EventEmitter<MergeGridEvents> {
  private container: IContainer;
  private background: IGraphics;
  private cellsContainer: IContainer;
  private itemsContainer: IContainer;

  private config: Required<MergeGridConfig>;
  private cells: MergeCell[][] = [];
  private allCells: MergeCell[] = [];
  private _currentDragItem: MergeItem | null = null;
  private _currentDragFromCell: MergeCell | null = null;
  private _highlightedCell: MergeCell | null = null;
  private _isDestroyed: boolean = false;

  constructor(config: MergeGridConfig) {
    super();

    this.config = {
      rows: config.rows,
      cols: config.cols,
      cellWidth: config.cellWidth ?? 80,
      cellHeight: config.cellHeight ?? 80,
      gap: config.gap ?? 8,
      padding: config.padding ?? 16,
      backgroundColor: config.backgroundColor ?? 0x1a1a1a,
      cellConfig: config.cellConfig ?? {},
      lockedCells: config.lockedCells ?? [],
      autoSpawn: config.autoSpawn ?? false,
      maxTier: config.maxTier ?? 10
    };

    // Create containers
    this.container = graphics().createContainer();
    this.background = graphics().createGraphics();
    this.cellsContainer = graphics().createContainer();
    this.itemsContainer = graphics().createContainer();

    this.container.addChild(this.background);
    this.container.addChild(this.cellsContainer);
    this.container.addChild(this.itemsContainer);

    // Initialize grid
    this.initializeGrid();

    // Setup global pointer move for drag tracking
    this.setupGlobalDragTracking();

    this.emit('initialized', this);
  }

  // ============================================
  // PUBLIC GETTERS
  // ============================================

  /** Get grid dimensions */
  get rows(): number { return this.config.rows; }
  get cols(): number { return this.config.cols; }

  /** Get total grid size */
  get width(): number {
    return this.config.padding * 2 + this.config.cols * this.config.cellWidth + (this.config.cols - 1) * this.config.gap;
  }

  get height(): number {
    return this.config.padding * 2 + this.config.rows * this.config.cellHeight + (this.config.rows - 1) * this.config.gap;
  }

  /** Get the display container */
  getContainer(): IContainer {
    return this.container;
  }

  /** Get all cells */
  getCells(): MergeCell[] {
    return [...this.allCells];
  }

  /** Get cell at position */
  getCell(row: number, col: number): MergeCell | null {
    if (row < 0 || row >= this.config.rows || col < 0 || col >= this.config.cols) {
      return null;
    }
    return this.cells[row][col];
  }

  /** Get all items currently in grid */
  getAllItems(): MergeItem[] {
    return this.allCells
      .filter(cell => cell.hasItem())
      .map(cell => cell.getItem()!);
  }

  /** Get empty cells */
  getEmptyCells(): MergeCell[] {
    return this.allCells.filter(cell => !cell.hasItem() && cell.acceptsItems);
  }

  /** Get unlocked cells */
  getUnlockedCells(): MergeCell[] {
    return this.allCells.filter(cell => !cell.isLocked);
  }

  /** Check if grid is full */
  isFull(): boolean {
    return this.getEmptyCells().length === 0;
  }

  // ============================================
  // ITEM MANAGEMENT
  // ============================================

  /**
   * Spawn a new item in a random empty cell
   */
  spawnItem(itemConfig: Partial<MergeItemConfig> = {}): MergeItem | null {
    const emptyCells = this.getEmptyCells();

    if (emptyCells.length === 0) {
      this.emit('grid-full', this);
      return null;
    }

    // Pick random empty cell
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return this.spawnItemInCell(cell, itemConfig);
  }

  /**
   * Spawn item in a specific cell
   */
  spawnItemInCell(cell: MergeCell, itemConfig: Partial<MergeItemConfig> = {}): MergeItem | null {
    if (cell.hasItem() || !cell.acceptsItems) {
      return null;
    }

    const item = new MergeItem({
      tier: itemConfig.tier ?? 1,
      size: Math.min(this.config.cellWidth, this.config.cellHeight) * 0.8,
      maxTier: this.config.maxTier,
      ...itemConfig
    });

    // Setup item events
    this.setupItemEvents(item, cell);

    // Add to items container (for proper z-ordering during drag)
    this.itemsContainer.addChild(item.getContainer());

    // Place in cell
    cell.placeItem(item);

    this.emit('item-spawned', this, item, cell);

    return item;
  }

  /**
   * Remove an item from the grid
   */
  removeItem(item: MergeItem): boolean {
    for (const cell of this.allCells) {
      if (cell.getItem() === item) {
        cell.removeItem();
        item.destroy();
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all items from grid
   */
  clearAllItems(): void {
    for (const cell of this.allCells) {
      const item = cell.removeItem();
      if (item) {
        item.destroy();
      }
    }
  }

  // ============================================
  // CELL MANAGEMENT
  // ============================================

  /**
   * Unlock a specific cell
   */
  unlockCell(row: number, col: number): boolean {
    const cell = this.getCell(row, col);
    if (!cell || !cell.isLocked) {
      return false;
    }

    cell.setLocked(false);
    this.emit('cell-unlocked', this, cell);
    return true;
  }

  /**
   * Lock a specific cell
   */
  lockCell(row: number, col: number): boolean {
    const cell = this.getCell(row, col);
    if (!cell || cell.isLocked) {
      return false;
    }

    // Remove item if present
    const item = cell.removeItem();
    if (item) {
      item.destroy();
    }

    cell.setLocked(true);
    return true;
  }

  /**
   * Find cell at world position
   */
  getCellAtPosition(worldX: number, worldY: number): MergeCell | null {
    for (const cell of this.allCells) {
      if (cell.containsPoint(worldX, worldY)) {
        return cell;
      }
    }
    return null;
  }

  /**
   * Find the cell containing a specific item
   */
  getCellForItem(item: MergeItem): MergeCell | null {
    for (const cell of this.allCells) {
      if (cell.getItem() === item) {
        return cell;
      }
    }
    return null;
  }

  // ============================================
  // MERGE OPERATIONS
  // ============================================

  /**
   * Attempt to merge two items
   */
  performMerge(cell: MergeCell, droppedItem: MergeItem): MergeItem | null {
    const existingItem = cell.getItem();
    if (!existingItem || !existingItem.canMergeWith(droppedItem)) {
      return null;
    }

    this.emit('merge-started', this, droppedItem, existingItem, cell);

    // Remove existing item from cell
    cell.removeItem();

    // Perform merge
    const resultItem = existingItem.mergeWith(droppedItem);

    // Place result in cell
    this.itemsContainer.addChild(resultItem.getContainer());
    this.setupItemEvents(resultItem, cell);
    cell.placeItem(resultItem);

    // Check for max tier
    if (resultItem.tier >= this.config.maxTier) {
      this.emit('max-tier-reached', this, resultItem);
    }

    this.emit('merge-completed', this, resultItem, cell);

    // Auto spawn if enabled
    if (this.config.autoSpawn) {
      this.spawnItem({ tier: 1 });
    }

    return resultItem;
  }

  // ============================================
  // POSITION & LAYOUT
  // ============================================

  /**
   * Set grid position
   */
  setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  /**
   * Center the grid in a given area
   */
  centerIn(width: number, height: number): this {
    this.setPosition(
      (width - this.width) / 2,
      (height - this.height) / 2
    );
    return this;
  }

  /**
   * Destroy the grid
   */
  destroy(): void {
    if (this._isDestroyed) return;

    this._isDestroyed = true;

    // Destroy all items and cells
    for (const cell of this.allCells) {
      const item = cell.getItem();
      if (item) {
        item.destroy();
      }
      cell.destroy();
    }

    this.container.destroy();
    this.removeAllListeners();
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Initialize the grid cells
   */
  private initializeGrid(): void {
    const { rows, cols, cellWidth, cellHeight, gap, padding, lockedCells, cellConfig } = this.config;

    // Create locked cells set for O(1) lookup
    const lockedSet = new Set(lockedCells.map(([r, c]) => `${r},${c}`));

    // Draw background
    this.drawBackground();

    // Create cells
    for (let row = 0; row < rows; row++) {
      this.cells[row] = [];

      for (let col = 0; col < cols; col++) {
        const isLocked = lockedSet.has(`${row},${col}`);

        const cell = new MergeCell({
          row,
          col,
          width: cellWidth,
          height: cellHeight,
          locked: isLocked,
          ...cellConfig
        });

        // Position cell
        const x = padding + col * (cellWidth + gap);
        const y = padding + row * (cellHeight + gap);
        cell.setPosition(x, y);

        // Add to container
        this.cellsContainer.addChild(cell.getContainer());

        // Store reference
        this.cells[row][col] = cell;
        this.allCells.push(cell);

        // Setup cell events
        this.setupCellEvents(cell);
      }
    }
  }

  /**
   * Draw grid background
   */
  private drawBackground(): void {
    this.background.clear();
    // Use Pixi v8 modern API
    this.background
      .roundRect(0, 0, this.width, this.height, 12)
      .fill({ color: this.config.backgroundColor, alpha: 1 });
  }

  /**
   * Setup events for a cell
   */
  private setupCellEvents(cell: MergeCell): void {
    cell.on('hover-enter', () => {
      if (this._currentDragItem && !cell.hasItem()) {
        cell.setHighlighted(true, cell.canAcceptItem(this._currentDragItem));
      }
    });

    cell.on('hover-exit', () => {
      cell.setHighlighted(false);
    });

    cell.on('merge-attempt', (c, droppedItem, existingItem) => {
      this.performMerge(c, droppedItem);
    });
  }

  /**
   * Setup events for an item
   */
  private setupItemEvents(item: MergeItem, initialCell: MergeCell): void {
    item.on('drag-start', (it, x, y) => {
      this._currentDragItem = it;
      this._currentDragFromCell = this.getCellForItem(it);

      // Remove from cell and add back to items container for dragging
      if (this._currentDragFromCell) {
        this._currentDragFromCell.removeItem();
        this.itemsContainer.addChild(it.getContainer());
      }

      // Move to top of items container
      this.itemsContainer.setChildIndex(it.getContainer(), this.itemsContainer.children.length - 1);
    });

    item.on('drag-move', (it, x, y) => {
      // Update highlighted cell
      const cellUnder = this.getCellAtPosition(x, y);

      if (this._highlightedCell && this._highlightedCell !== cellUnder) {
        this._highlightedCell.setHighlighted(false);
      }

      if (cellUnder && cellUnder !== this._highlightedCell) {
        const canDrop = cellUnder.canAcceptItem(it);
        cellUnder.setHighlighted(true, canDrop);
        this._highlightedCell = cellUnder;
      } else if (!cellUnder) {
        this._highlightedCell = null;
      }
    });

    item.on('drag-end', (it, x, y) => {
      // Clear highlight
      if (this._highlightedCell) {
        this._highlightedCell.setHighlighted(false);
      }

      // Find drop target
      const dropCell = this.getCellAtPosition(x, y);

      if (dropCell) {
        const result = dropCell.handleDrop(it);

        if (result === 'placed') {
          this.emit('item-moved', this, it, this._currentDragFromCell, dropCell);
        } else if (result === 'rejected') {
          // Return to original cell
          if (this._currentDragFromCell) {
            this._currentDragFromCell.placeItem(it);
          }
        }
        // 'merged' is handled by merge-attempt event
      } else {
        // Dropped outside grid - return to original cell
        if (this._currentDragFromCell) {
          this._currentDragFromCell.placeItem(it);
        }
      }

      this._currentDragItem = null;
      this._currentDragFromCell = null;
      this._highlightedCell = null;
    });
  }

  /**
   * Setup global drag tracking
   */
  private setupGlobalDragTracking(): void {
    // The item handles its own drag via pointermove
    // This is for grid-level tracking if needed
  }
}

export default MergeGrid;
