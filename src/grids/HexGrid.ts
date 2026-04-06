import { Grid, GridConfig, CellResult } from './Grid.js';

// ============================================================
// HexGrid<T>
// ============================================================

/**
 * Hexagonal grid using offset coordinates (odd-r offset).
 *
 * Extends Grid<T> and overrides coordinate conversion and
 * neighbor queries for hex topology.
 *
 * Supports pointy-top and flat-top orientations.
 *
 * References:
 * - https://www.redblobgames.com/grids/hexagons/
 */
export class HexGrid<T> extends Grid<T> {
  private readonly orientation: 'flat' | 'pointy';

  constructor(config: GridConfig<T> & { orientation?: 'flat' | 'pointy' }) {
    super(config);
    this.orientation = config.orientation ?? 'pointy';
  }

  // ============================================================
  // Neighbor override — 6 hex directions
  // ============================================================

  /**
   * Returns up to 6 hex neighbors using odd-r offset coords.
   * Pointy-top: rows stagger. Flat-top: columns stagger.
   */
  override getNeighbors(row: number, col: number): CellResult<T>[] {
    const offsets = this.orientation === 'pointy'
      ? this.pointyNeighborOffsets(row)
      : this.flatNeighborOffsets(col);

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

  // ============================================================
  // Coordinate conversion override — hex pixel mapping
  // ============================================================

  /** Returns pixel center of a hex cell. */
  override cellToPixel(row: number, col: number): { x: number; y: number } {
    const size = this._cellSize;

    if (this.orientation === 'pointy') {
      // Pointy-top: width = sqrt(3)*size, height = 2*size
      const w = Math.sqrt(3) * size;
      const h = 2 * size;
      const x = this._originX + col * w + (row % 2 !== 0 ? w / 2 : 0);
      const y = this._originY + row * (h * 0.75);
      return { x, y };
    } else {
      // Flat-top: width = 2*size, height = sqrt(3)*size
      const w = 2 * size;
      const h = Math.sqrt(3) * size;
      const x = this._originX + col * (w * 0.75);
      const y = this._originY + row * h + (col % 2 !== 0 ? h / 2 : 0);
      return { x, y };
    }
  }

  /** Returns hex cell for a pixel coordinate, or null if outside. */
  override pixelToCell(x: number, y: number): { row: number; col: number } | null {
    const size = this._cellSize;
    let row: number;
    let col: number;

    if (this.orientation === 'pointy') {
      const w = Math.sqrt(3) * size;
      const h = 2 * size;
      const rowEst = (y - this._originY) / (h * 0.75);
      row = Math.round(rowEst);
      const xOffset = row % 2 !== 0 ? w / 2 : 0;
      col = Math.round((x - this._originX - xOffset) / w);
    } else {
      const w = 2 * size;
      const h = Math.sqrt(3) * size;
      const colEst = (x - this._originX) / (w * 0.75);
      col = Math.round(colEst);
      const yOffset = col % 2 !== 0 ? h / 2 : 0;
      row = Math.round((y - this._originY - yOffset) / h);
    }

    if (!this.isValidCell(row, col)) return null;
    return { row, col };
  }

  // ============================================================
  // Hex-specific methods
  // ============================================================

  /**
   * Hex distance using cube coordinate conversion.
   * Converts offset coords to cube, computes Manhattan/2.
   */
  hexDistance(r1: number, c1: number, r2: number, c2: number): number {
    const cube1 = this.offsetToCube(r1, c1);
    const cube2 = this.offsetToCube(r2, c2);
    return (
      Math.abs(cube1.q - cube2.q) +
      Math.abs(cube1.r - cube2.r) +
      Math.abs(cube1.s - cube2.s)
    ) / 2;
  }

  /**
   * Get all cells at exactly `radius` hex steps from center.
   */
  getRing(centerRow: number, centerCol: number, radius: number): Array<{ row: number; col: number }> {
    const results: Array<{ row: number; col: number }> = [];
    if (radius === 0) {
      if (this.isValidCell(centerRow, centerCol)) {
        results.push({ row: centerRow, col: centerCol });
      }
      return results;
    }

    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        if (this.hexDistance(centerRow, centerCol, r, c) === radius) {
          results.push({ row: r, col: c });
        }
      }
    }
    return results;
  }

  // ============================================================
  // Private helpers
  // ============================================================

  /**
   * Pointy-top odd-r offset neighbor offsets.
   * Even rows and odd rows have different column offsets.
   */
  private pointyNeighborOffsets(row: number): [number, number][] {
    if (row % 2 === 0) {
      // Even row
      return [
        [-1, -1], [-1, 0],  // upper-left, upper-right
        [0, -1],  [0, 1],   // left, right
        [1, -1],  [1, 0],   // lower-left, lower-right
      ];
    } else {
      // Odd row
      return [
        [-1, 0], [-1, 1],   // upper-left, upper-right
        [0, -1], [0, 1],    // left, right
        [1, 0],  [1, 1],    // lower-left, lower-right
      ];
    }
  }

  /**
   * Flat-top odd-q offset neighbor offsets.
   * Even columns and odd columns have different row offsets.
   */
  private flatNeighborOffsets(col: number): [number, number][] {
    if (col % 2 === 0) {
      // Even column
      return [
        [-1, 0], [1, 0],    // top, bottom
        [0, -1], [0, 1],    // left, right
        [-1, -1], [-1, 1],  // top-left, top-right (same row neighbors)
      ];
    } else {
      // Odd column
      return [
        [-1, 0], [1, 0],    // top, bottom
        [0, -1], [0, 1],    // left, right
        [1, -1], [1, 1],    // bottom-left, bottom-right
      ];
    }
  }

  /** Convert odd-r offset to cube coordinates. */
  private offsetToCube(row: number, col: number): { q: number; r: number; s: number } {
    // Pointy-top odd-r offset
    const q = col - (row - (row & 1)) / 2;
    const r = row;
    const s = -q - r;
    return { q, r, s };
  }
}
