import { EventEmitter } from 'eventemitter3';

// ============================================================
// Types
// ============================================================

export interface GridConfig<T = any> {
  rows: number;
  cols: number;
  cellSize: number;
  /** Gap between cells in pixels, default: 0 */
  gap?: number;
  /** Value to fill cells with on creation, default: null */
  defaultValue?: T;
  /** Grid origin X in pixel space, default: 0 */
  x?: number;
  /** Grid origin Y in pixel space, default: 0 */
  y?: number;
}

export interface CellResult<T> {
  row: number;
  col: number;
  value: T | null;
}

// ============================================================
// Grid<T>
// ============================================================

/**
 * 2D square grid data structure.
 *
 * Pure data — no Pixi.js or Three.js dependencies.
 * Use `cellToPixel` / `pixelToCell` for coordinate conversion.
 *
 * @example
 * ```typescript
 * const grid = new Grid<string>({ rows: 5, cols: 5, cellSize: 64 });
 * grid.setCell(0, 0, 'player');
 * const px = grid.cellToPixel(0, 0); // { x: 32, y: 32 }
 * ```
 */
export class Grid<T> extends EventEmitter {
  protected readonly _rows: number;
  protected readonly _cols: number;
  protected readonly _cellSize: number;
  protected readonly _gap: number;
  protected readonly _originX: number;
  protected readonly _originY: number;
  protected readonly _defaultValue: T | null;

  /** Internal 2D storage: cells[row][col] */
  protected cells: (T | null)[][];

  constructor(config: GridConfig<T>) {
    super();
    if (config.rows <= 0 || config.cols <= 0) throw new Error('Grid: rows and cols must be > 0');
    if (config.cellSize <= 0) throw new Error('Grid: cellSize must be > 0');
    this._rows = config.rows;
    this._cols = config.cols;
    this._cellSize = config.cellSize;
    this._gap = config.gap ?? 0;
    this._originX = config.x ?? 0;
    this._originY = config.y ?? 0;
    this._defaultValue = config.defaultValue ?? null;

    this.cells = this.createEmptyGrid();
  }

  // ============================================================
  // Cell access
  // ============================================================

  getCell(row: number, col: number): T | null {
    if (!this.isValidCell(row, col)) return null;
    return this.cells[row][col];
  }

  setCell(row: number, col: number, value: T): void {
    if (!this.isValidCell(row, col)) return;
    this.cells[row][col] = value;
  }

  clearCell(row: number, col: number): void {
    if (!this.isValidCell(row, col)) return;
    this.cells[row][col] = this._defaultValue;
  }

  // ============================================================
  // Neighbor queries
  // ============================================================

  /** Returns 4-directional (cardinal) neighbors. */
  getNeighbors(row: number, col: number): CellResult<T>[] {
    const offsets: [number, number][] = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1],  // right
    ];

    const results: CellResult<T>[] = [];
    for (let i = 0; i < offsets.length; i++) {
      const r = row + offsets[i][0];
      const c = col + offsets[i][1];
      if (this.isValidCell(r, c)) {
        results.push({ row: r, col: c, value: this.cells[r][c] });
      }
    }
    return results;
  }

  /** Returns 8-directional neighbors (cardinal + diagonal). */
  getNeighbors8(row: number, col: number): CellResult<T>[] {
    const offsets: [number, number][] = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],            [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    const results: CellResult<T>[] = [];
    for (let i = 0; i < offsets.length; i++) {
      const r = row + offsets[i][0];
      const c = col + offsets[i][1];
      if (this.isValidCell(r, c)) {
        results.push({ row: r, col: c, value: this.cells[r][c] });
      }
    }
    return results;
  }

  /** Find all cells matching a predicate. */
  findCells(predicate: (value: T | null, row: number, col: number) => boolean): CellResult<T>[] {
    const results: CellResult<T>[] = [];
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        if (predicate(this.cells[r][c], r, c)) {
          results.push({ row: r, col: c, value: this.cells[r][c] });
        }
      }
    }
    return results;
  }

  /** Get all values in a row. */
  getRow(row: number): (T | null)[] {
    if (row < 0 || row >= this._rows) return [];
    return [...this.cells[row]];
  }

  /** Get all values in a column. */
  getCol(col: number): (T | null)[] {
    if (col < 0 || col >= this._cols) return [];
    const result: (T | null)[] = [];
    for (let r = 0; r < this._rows; r++) {
      result.push(this.cells[r][col]);
    }
    return result;
  }

  // ============================================================
  // Coordinate conversion
  // ============================================================

  /**
   * Returns pixel center of a cell.
   * `x = originX + col * (cellSize + gap) + cellSize / 2`
   * `y = originY + row * (cellSize + gap) + cellSize / 2`
   */
  cellToPixel(row: number, col: number): { x: number; y: number } {
    const stride = this._cellSize + this._gap;
    return {
      x: this._originX + col * stride + this._cellSize / 2,
      y: this._originY + row * stride + this._cellSize / 2,
    };
  }

  /**
   * Returns grid cell for a pixel coordinate, or null if outside.
   */
  pixelToCell(x: number, y: number): { row: number; col: number } | null {
    const stride = this._cellSize + this._gap;
    const localX = x - this._originX;
    const localY = y - this._originY;

    if (localX < 0 || localY < 0) return null;

    const col = Math.floor(localX / stride);
    const row = Math.floor(localY / stride);

    if (!this.isValidCell(row, col)) return null;

    // Verify the point is inside the cell body (not in the gap)
    const cellLocalX = localX - col * stride;
    const cellLocalY = localY - row * stride;
    if (cellLocalX > this._cellSize || cellLocalY > this._cellSize) return null;

    return { row, col };
  }

  // ============================================================
  // Iteration
  // ============================================================

  forEach(fn: (value: T | null, row: number, col: number) => void): void {
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        fn(this.cells[r][c], r, c);
      }
    }
  }

  // ============================================================
  // Info
  // ============================================================

  get rows(): number { return this._rows; }
  get cols(): number { return this._cols; }
  get cellSize(): number { return this._cellSize; }

  isValidCell(row: number, col: number): boolean {
    return row >= 0 && row < this._rows && col >= 0 && col < this._cols;
  }

  // ============================================================
  // Private
  // ============================================================

  private createEmptyGrid(): (T | null)[][] {
    const grid: (T | null)[][] = [];
    for (let r = 0; r < this._rows; r++) {
      const row: (T | null)[] = [];
      for (let c = 0; c < this._cols; c++) {
        row.push(this._defaultValue);
      }
      grid.push(row);
    }
    return grid;
  }
}
