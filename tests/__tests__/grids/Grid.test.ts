import { Grid } from '../../../src/grids/Grid.js';

describe('Grid<T>', () => {
  // ---- 1. Constructor creates correct size ----
  test('constructor creates grid with correct dimensions', () => {
    const grid = new Grid<string>({ rows: 4, cols: 6, cellSize: 32 });
    expect(grid.rows).toBe(4);
    expect(grid.cols).toBe(6);
    expect(grid.cellSize).toBe(32);
  });

  // ---- 2. Default value fills grid ----
  test('cells are initialized to defaultValue', () => {
    const grid = new Grid<number>({ rows: 2, cols: 2, cellSize: 32, defaultValue: 99 });
    expect(grid.getCell(0, 0)).toBe(99);
    expect(grid.getCell(1, 1)).toBe(99);
  });

  // ---- 3. getCell/setCell/clearCell ----
  test('setCell and getCell work correctly', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 32 });
    grid.setCell(1, 2, 'player');
    expect(grid.getCell(1, 2)).toBe('player');
  });

  test('clearCell resets cell to defaultValue', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 32, defaultValue: 'empty' });
    grid.setCell(0, 0, 'filled');
    grid.clearCell(0, 0);
    expect(grid.getCell(0, 0)).toBe('empty');
  });

  test('getCell returns null for out-of-bounds', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 32 });
    expect(grid.getCell(10, 10)).toBeNull();
    expect(grid.getCell(-1, 0)).toBeNull();
  });

  // ---- 4. getNeighbors — 4-directional ----
  test('getNeighbors returns 4 neighbors for a center cell', () => {
    const grid = new Grid<string>({ rows: 5, cols: 5, cellSize: 32 });
    const neighbors = grid.getNeighbors(2, 2);
    expect(neighbors.length).toBe(4);

    const coords = neighbors.map(n => `${n.row},${n.col}`);
    expect(coords).toContain('1,2');
    expect(coords).toContain('3,2');
    expect(coords).toContain('2,1');
    expect(coords).toContain('2,3');
  });

  test('getNeighbors handles edge cells correctly', () => {
    const grid = new Grid<string>({ rows: 5, cols: 5, cellSize: 32 });
    // Top-left corner — only 2 valid neighbors
    const neighbors = grid.getNeighbors(0, 0);
    expect(neighbors.length).toBe(2);
  });

  test('getNeighbors handles corner cells correctly', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 32 });
    const neighbors = grid.getNeighbors(2, 2); // bottom-right
    expect(neighbors.length).toBe(2);
  });

  // ---- 5. getNeighbors8 ----
  test('getNeighbors8 returns 8 neighbors for center cell', () => {
    const grid = new Grid<string>({ rows: 5, cols: 5, cellSize: 32 });
    const neighbors = grid.getNeighbors8(2, 2);
    expect(neighbors.length).toBe(8);
  });

  test('getNeighbors8 handles corners', () => {
    const grid = new Grid<string>({ rows: 5, cols: 5, cellSize: 32 });
    const neighbors = grid.getNeighbors8(0, 0);
    expect(neighbors.length).toBe(3);
  });

  // ---- 6. cellToPixel coordinate conversion ----
  test('cellToPixel returns cell center with no gap', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 64, x: 0, y: 0 });
    const pixel = grid.cellToPixel(0, 0);
    expect(pixel.x).toBe(32); // 0 * 64 + 32
    expect(pixel.y).toBe(32);
  });

  test('cellToPixel respects origin offset', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 64, x: 100, y: 50 });
    const pixel = grid.cellToPixel(0, 0);
    expect(pixel.x).toBe(132); // 100 + 32
    expect(pixel.y).toBe(82);  // 50 + 32
  });

  test('cellToPixel respects gap', () => {
    // stride = cellSize + gap = 64 + 8 = 72
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 64, gap: 8 });
    const pixel = grid.cellToPixel(0, 1);
    expect(pixel.x).toBe(1 * 72 + 32); // 104
    expect(pixel.y).toBe(32);
  });

  // ---- 7. pixelToCell inverse ----
  test('pixelToCell returns correct cell for pixel inside grid', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 64 });
    const cell = grid.pixelToCell(32, 32); // center of (0,0)
    expect(cell).toEqual({ row: 0, col: 0 });
  });

  test('pixelToCell returns null for pixel outside grid', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 64 });
    const cell = grid.pixelToCell(9999, 9999);
    expect(cell).toBeNull();
  });

  test('pixelToCell returns null for negative coords', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 64 });
    expect(grid.pixelToCell(-1, -1)).toBeNull();
  });

  test('pixelToCell is inverse of cellToPixel', () => {
    const grid = new Grid<string>({ rows: 5, cols: 5, cellSize: 40 });
    const px = grid.cellToPixel(3, 2);
    const cell = grid.pixelToCell(px.x, px.y);
    expect(cell).toEqual({ row: 3, col: 2 });
  });

  // ---- 8. findCells with predicate ----
  test('findCells finds all matching cells', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 32 });
    grid.setCell(0, 0, 'x');
    grid.setCell(1, 1, 'x');
    grid.setCell(2, 2, 'y');

    const results = grid.findCells(v => v === 'x');
    expect(results.length).toBe(2);
  });

  test('findCells returns empty array when no match', () => {
    const grid = new Grid<string>({ rows: 3, cols: 3, cellSize: 32 });
    const results = grid.findCells(v => v === 'nonexistent');
    expect(results.length).toBe(0);
  });

  // ---- 9. forEach iterates all cells ----
  test('forEach visits all rows × cols cells', () => {
    const grid = new Grid<number>({ rows: 3, cols: 4, cellSize: 32 });
    let count = 0;
    grid.forEach(() => count++);
    expect(count).toBe(12); // 3 × 4
  });

  // ---- 10. isValidCell boundary check ----
  test('isValidCell returns true for valid coordinates', () => {
    const grid = new Grid<string>({ rows: 5, cols: 5, cellSize: 32 });
    expect(grid.isValidCell(0, 0)).toBe(true);
    expect(grid.isValidCell(4, 4)).toBe(true);
  });

  test('isValidCell returns false for out-of-bounds', () => {
    const grid = new Grid<string>({ rows: 5, cols: 5, cellSize: 32 });
    expect(grid.isValidCell(-1, 0)).toBe(false);
    expect(grid.isValidCell(0, -1)).toBe(false);
    expect(grid.isValidCell(5, 0)).toBe(false);
    expect(grid.isValidCell(0, 5)).toBe(false);
  });

  // ---- 11. getRow / getCol ----
  test('getRow returns correct values', () => {
    const grid = new Grid<number>({ rows: 3, cols: 3, cellSize: 32 });
    grid.setCell(1, 0, 10);
    grid.setCell(1, 1, 20);
    grid.setCell(1, 2, 30);
    expect(grid.getRow(1)).toEqual([10, 20, 30]);
  });

  test('getCol returns correct values', () => {
    const grid = new Grid<number>({ rows: 3, cols: 3, cellSize: 32 });
    grid.setCell(0, 2, 1);
    grid.setCell(1, 2, 2);
    grid.setCell(2, 2, 3);
    expect(grid.getCol(2)).toEqual([1, 2, 3]);
  });
});
