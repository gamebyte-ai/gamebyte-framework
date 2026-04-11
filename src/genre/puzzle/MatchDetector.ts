/**
 * MatchDetector - Grid match finding for puzzle/sorting games.
 * Supports row-3, col-3, row-col-3 (standard match-3) and adjacent-group (BFS flood fill).
 * No Pixi/Three dependencies — pure logic.
 */

export type MatchRule = 'row-3' | 'col-3' | 'adjacent-group' | 'row-col-3' | 'custom';

export interface MatchResult {
  cells: Array<{ row: number; col: number }>;
  value: any;
  size: number;
}

export interface MatchDetectorConfig {
  rule: MatchRule;
  /** Minimum group size for 'adjacent-group' rule (default: 3) */
  minGroupSize?: number;
  /** Custom match function for 'custom' rule */
  customMatcher?: (grid: any[][], rows: number, cols: number) => MatchResult[];
}

export class MatchDetector {
  private rule: MatchRule;
  private minGroupSize: number;
  private customMatcher?: (grid: any[][], rows: number, cols: number) => MatchResult[];

  constructor(config: MatchDetectorConfig) {
    this.rule = config.rule;
    this.minGroupSize = config.minGroupSize ?? 3;
    this.customMatcher = config.customMatcher;
  }

  /** Find all matches in a grid */
  findMatches(grid: any[][], rows: number, cols: number): MatchResult[] {
    switch (this.rule) {
      case 'row-3':    return this._scanRows(grid, rows, cols);
      case 'col-3':    return this._scanCols(grid, rows, cols);
      case 'row-col-3':return [...this._scanRows(grid, rows, cols), ...this._scanCols(grid, rows, cols)];
      case 'adjacent-group': return this._bfsGroups(grid, rows, cols);
      case 'custom':   return this.customMatcher ? this.customMatcher(grid, rows, cols) : [];
    }
  }

  /** Check if swapping two cells would produce at least one match */
  wouldMatch(grid: any[][], r1: number, c1: number, r2: number, c2: number): boolean {
    // Perform swap
    const tmp = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = tmp;

    const rows = grid.length;
    const cols = grid[0].length;

    // Use try/finally so the grid is always restored even if findMatches throws.
    // Without this, any exception would leave the caller's grid permanently mutated.
    let hasMatch = false;
    try {
      const matches = this.findMatches(grid, rows, cols);
      hasMatch = matches.length > 0;
    } finally {
      // Always revert the swap
      grid[r2][c2] = grid[r1][c1];
      grid[r1][c1] = tmp;
    }

    return hasMatch;
  }

  // --- Row scanning: find 3+ consecutive same values in each row ---
  private _scanRows(grid: any[][], rows: number, cols: number): MatchResult[] {
    const results: MatchResult[] = [];
    for (let r = 0; r < rows; r++) {
      let c = 0;
      while (c < cols) {
        const val = grid[r][c];
        if (val === null || val === undefined) { c++; continue; }
        let end = c + 1;
        while (end < cols && grid[r][end] === val) end++;
        const len = end - c;
        if (len >= 3) {
          const cells = [];
          for (let i = c; i < end; i++) cells.push({ row: r, col: i });
          results.push({ cells, value: val, size: len });
        }
        c = end;
      }
    }
    return results;
  }

  // --- Column scanning: find 3+ consecutive same values in each column ---
  private _scanCols(grid: any[][], rows: number, cols: number): MatchResult[] {
    const results: MatchResult[] = [];
    for (let c = 0; c < cols; c++) {
      let r = 0;
      while (r < rows) {
        const val = grid[r][c];
        if (val === null || val === undefined) { r++; continue; }
        let end = r + 1;
        while (end < rows && grid[end][c] === val) end++;
        const len = end - r;
        if (len >= 3) {
          const cells = [];
          for (let i = r; i < end; i++) cells.push({ row: i, col: c });
          results.push({ cells, value: val, size: len });
        }
        r = end;
      }
    }
    return results;
  }

  // --- BFS flood fill: find connected groups of same-value cells ---
  private _bfsGroups(grid: any[][], rows: number, cols: number): MatchResult[] {
    const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const results: MatchResult[] = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (visited[r][c]) continue;
        const val = grid[r][c];
        if (val === null || val === undefined) { visited[r][c] = true; continue; }

        // BFS
        const queue: Array<[number, number]> = [[r, c]];
        const group: Array<{ row: number; col: number }> = [];
        visited[r][c] = true;

        let head = 0;
        while (head < queue.length) {
          const [cr, cc] = queue[head++];
          group.push({ row: cr, col: cc });
          for (let d = 0; d < 4; d++) {
            const nr = cr + dirs[d][0];
            const nc = cc + dirs[d][1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] === val) {
              visited[nr][nc] = true;
              queue.push([nr, nc]);
            }
          }
        }

        if (group.length >= this.minGroupSize) {
          results.push({ cells: group, value: val, size: group.length });
        }
      }
    }
    return results;
  }
}
