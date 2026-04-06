import { HexGrid } from '../../../src/grids/HexGrid.js';

describe('HexGrid<T>', () => {
  // ---- 1. Hex neighbors — pointy-top even row ----
  test('getNeighbors returns 6 hex neighbors for interior cell (pointy, even row)', () => {
    const grid = new HexGrid<string>({ rows: 7, cols: 7, cellSize: 32, orientation: 'pointy' });
    const neighbors = grid.getNeighbors(2, 3); // interior cell
    expect(neighbors.length).toBe(6);
  });

  // ---- 2. Hex neighbors — boundary cell has fewer ----
  test('getNeighbors returns fewer than 6 for corner cells', () => {
    const grid = new HexGrid<string>({ rows: 5, cols: 5, cellSize: 32, orientation: 'pointy' });
    const neighbors = grid.getNeighbors(0, 0);
    expect(neighbors.length).toBeLessThan(6);
  });

  // ---- 3. hexDistance ----
  test('hexDistance returns 0 for same cell', () => {
    const grid = new HexGrid<string>({ rows: 5, cols: 5, cellSize: 32 });
    expect(grid.hexDistance(2, 2, 2, 2)).toBe(0);
  });

  test('hexDistance is symmetric', () => {
    const grid = new HexGrid<string>({ rows: 7, cols: 7, cellSize: 32 });
    const d1 = grid.hexDistance(1, 1, 3, 3);
    const d2 = grid.hexDistance(3, 3, 1, 1);
    expect(d1).toBe(d2);
  });

  test('hexDistance for adjacent cells is 1', () => {
    const grid = new HexGrid<string>({ rows: 5, cols: 5, cellSize: 32, orientation: 'pointy' });
    // (2,2) and (2,3) are adjacent (same row, next column)
    const dist = grid.hexDistance(2, 2, 2, 3);
    expect(dist).toBe(1);
  });

  // ---- 4. getRing ----
  test('getRing with radius 0 returns center only', () => {
    const grid = new HexGrid<string>({ rows: 9, cols: 9, cellSize: 32 });
    const ring = grid.getRing(4, 4, 0);
    expect(ring.length).toBe(1);
    expect(ring[0]).toEqual({ row: 4, col: 4 });
  });

  test('getRing returns cells at exact distance', () => {
    const grid = new HexGrid<string>({ rows: 9, cols: 9, cellSize: 32, orientation: 'pointy' });
    const ring = grid.getRing(4, 4, 1);
    // All cells in ring should be at distance 1
    for (const cell of ring) {
      expect(grid.hexDistance(4, 4, cell.row, cell.col)).toBe(1);
    }
  });

  // ---- 5. cellToPixel hex stagger (pointy-top) ----
  test('cellToPixel staggers odd rows for pointy-top', () => {
    const grid = new HexGrid<string>({ rows: 5, cols: 5, cellSize: 32, orientation: 'pointy' });
    const even = grid.cellToPixel(0, 0); // even row
    const odd = grid.cellToPixel(1, 0);  // odd row — should be offset

    // Odd row x should be offset by w/2
    const w = Math.sqrt(3) * 32;
    expect(odd.x).toBeCloseTo(even.x + w / 2, 1);
  });

  // ---- 6. pixelToCell inverse (approximate) ----
  test('pixelToCell returns valid cell for pixel inside grid', () => {
    const grid = new HexGrid<string>({ rows: 7, cols: 7, cellSize: 32, orientation: 'pointy' });
    // Use center of a known cell
    const px = grid.cellToPixel(3, 3);
    const cell = grid.pixelToCell(px.x, px.y);
    expect(cell).not.toBeNull();
    expect(cell!.row).toBe(3);
    expect(cell!.col).toBe(3);
  });

  test('pixelToCell returns null for coords outside grid', () => {
    const grid = new HexGrid<string>({ rows: 5, cols: 5, cellSize: 32 });
    expect(grid.pixelToCell(-9999, -9999)).toBeNull();
  });
});
