/**
 * BoardGravity - Applies downward gravity to a grid after matches are cleared.
 * Drops existing pieces into gaps and reports which top cells need new pieces spawned.
 * No Pixi/Three dependencies — pure logic.
 */

export interface GravityResult {
  /** Cells that moved: { from, to } */
  moves: Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number }>;
  /** Empty cells at the top that need new pieces */
  spawns: Array<{ row: number; col: number }>;
}

export class BoardGravity {
  /**
   * Apply gravity: drop pieces downward to fill gaps. Mutates grid in-place.
   * @param grid    2D array [row][col], row 0 = top, last row = bottom
   * @param rows    Number of rows
   * @param cols    Number of columns
   * @param emptyValue  Value that represents an empty cell (default: null)
   */
  static apply(grid: any[][], rows: number, cols: number, emptyValue: any = null): GravityResult {
    const moves: GravityResult['moves'] = [];
    const spawns: GravityResult['spawns'] = [];

    for (let c = 0; c < cols; c++) {
      // Walk from bottom up, compacting non-empty values toward the bottom
      let writeRow = rows - 1;

      for (let r = rows - 1; r >= 0; r--) {
        if (grid[r][c] !== emptyValue) {
          if (r !== writeRow) {
            // Record the move before mutating
            moves.push({ fromRow: r, fromCol: c, toRow: writeRow, toCol: c });
            grid[writeRow][c] = grid[r][c];
            grid[r][c] = emptyValue;
          }
          writeRow--;
        }
      }

      // All rows above writeRow are empty — mark as spawn positions
      for (let r = writeRow; r >= 0; r--) {
        spawns.push({ row: r, col: c });
      }
    }

    return { moves, spawns };
  }
}
