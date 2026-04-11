import { MatchDetector } from '../../../../src/genre/puzzle/MatchDetector.js';
import { BoardGravity } from '../../../../src/genre/puzzle/BoardGravity.js';

// Helper to build a 2D grid from a 2D array
function makeGrid(data: any[][]): any[][] {
  return data.map(row => [...row]);
}

describe('MatchDetector — row-3', () => {
  test('finds a horizontal match of 3', () => {
    const detector = new MatchDetector({ rule: 'row-3' });
    const grid = makeGrid([
      ['R', 'R', 'R', 'B'],
      ['B', 'G', 'B', 'G'],
    ]);
    const matches = detector.findMatches(grid, 2, 4);
    expect(matches).toHaveLength(1);
    expect(matches[0].value).toBe('R');
    expect(matches[0].size).toBe(3);
    expect(matches[0].cells).toEqual([
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    ]);
  });

  test('returns empty array when no row match exists', () => {
    const detector = new MatchDetector({ rule: 'row-3' });
    const grid = makeGrid([
      ['R', 'G', 'B'],
      ['B', 'R', 'G'],
    ]);
    expect(detector.findMatches(grid, 2, 3)).toHaveLength(0);
  });
});

describe('MatchDetector — col-3', () => {
  test('finds a vertical match of 3', () => {
    const detector = new MatchDetector({ rule: 'col-3' });
    const grid = makeGrid([
      ['R', 'B'],
      ['R', 'G'],
      ['R', 'B'],
    ]);
    const matches = detector.findMatches(grid, 3, 2);
    expect(matches).toHaveLength(1);
    expect(matches[0].value).toBe('R');
    expect(matches[0].size).toBe(3);
    expect(matches[0].cells).toEqual([
      { row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 },
    ]);
  });

  test('does not find a horizontal run in col-3 mode', () => {
    const detector = new MatchDetector({ rule: 'col-3' });
    const grid = makeGrid([['R', 'R', 'R']]);
    expect(detector.findMatches(grid, 1, 3)).toHaveLength(0);
  });
});

describe('MatchDetector — row-col-3', () => {
  test('finds both row and column matches', () => {
    const detector = new MatchDetector({ rule: 'row-col-3' });
    const grid = makeGrid([
      ['R', 'R', 'R'],
      ['B', 'G', 'B'],
      ['B', 'G', 'B'],
    ]);
    // Add a column match: col 1 -> G, G - only 2, not enough. Use 'B' in col 0
    const grid2 = makeGrid([
      ['R', 'R', 'R'],
      ['B', 'G', 'B'],
      ['B', 'G', 'G'],
      ['B', 'G', 'B'],
    ]);
    const matches = detector.findMatches(grid2, 4, 3);
    const rowMatch = matches.filter(m => m.value === 'R');
    const colMatch = matches.filter(m => m.value === 'B' && m.size >= 3);
    expect(rowMatch.length).toBeGreaterThan(0);
    expect(colMatch.length).toBeGreaterThan(0);
  });
});

describe('MatchDetector — adjacent-group', () => {
  test('finds a connected group of same-value cells', () => {
    const detector = new MatchDetector({ rule: 'adjacent-group', minGroupSize: 3 });
    const grid = makeGrid([
      ['R', 'R', 'B'],
      ['R', 'B', 'B'],
      ['G', 'G', 'G'],
    ]);
    const matches = detector.findMatches(grid, 3, 3);
    // R group: (0,0),(0,1),(1,0) = 3
    // B group: (0,2),(1,1),(1,2) = 3
    // G group: (2,0),(2,1),(2,2) = 3
    expect(matches).toHaveLength(3);
  });

  test('excludes groups below minGroupSize', () => {
    const detector = new MatchDetector({ rule: 'adjacent-group', minGroupSize: 4 });
    const grid = makeGrid([
      ['R', 'R', 'B'],
      ['R', 'B', 'B'],
      ['G', 'G', 'G'],
    ]);
    const matches = detector.findMatches(grid, 3, 3);
    // Only G group has 3, which is < 4; all groups are size 3, none qualify
    expect(matches).toHaveLength(0);
  });
});

describe('MatchDetector — wouldMatch', () => {
  test('returns true when a swap creates a match', () => {
    const detector = new MatchDetector({ rule: 'row-3' });
    // Row 0: R G R R — swap (0,1) and (0,0) gives G R R R
    // Actually: swap col0 and col3 -> R R R G = match
    const grid = makeGrid([
      ['R', 'G', 'R', 'R'],
    ]);
    // Swap (0,1) 'G' with (0,0) 'R': result G R R R — col 1,2,3 = R,R,R -> match!
    expect(detector.wouldMatch(grid, 0, 1, 0, 0)).toBe(true);
  });

  test('returns false when a swap does not create a match', () => {
    const detector = new MatchDetector({ rule: 'row-3' });
    const grid = makeGrid([
      ['R', 'G', 'B', 'R'],
    ]);
    expect(detector.wouldMatch(grid, 0, 0, 0, 1)).toBe(false);
  });

  test('does not permanently mutate the grid', () => {
    const detector = new MatchDetector({ rule: 'row-3' });
    const grid = makeGrid([['R', 'G', 'R', 'R']]);
    detector.wouldMatch(grid, 0, 0, 0, 1);
    expect(grid[0]).toEqual(['R', 'G', 'R', 'R']);
  });

  test('restores grid even when findMatches throws (exception safety)', () => {
    // Use a 'custom' rule whose matcher throws to simulate a buggy/unexpected error.
    const detector = new MatchDetector({
      rule: 'custom',
      customMatcher: () => { throw new Error('unexpected error'); },
    });
    const grid = makeGrid([['R', 'G', 'B']]);
    const originalRow = [...grid[0]];

    expect(() => detector.wouldMatch(grid, 0, 0, 0, 1)).toThrow('unexpected error');

    // Grid must be identical to what it was before the call
    expect(grid[0]).toEqual(originalRow);
  });
});

describe('BoardGravity', () => {
  test('drops pieces down to fill gaps', () => {
    // Col 0: [R, null, G] -> [null, R, G]
    const grid = [
      ['R', 'B'],
      [null, 'B'],
      ['G', null],
    ];
    const result = BoardGravity.apply(grid, 3, 2);
    // Col 0: R at row 0, gap at row 1, G at row 2 -> after gravity: null, R, G
    expect(grid[2][0]).toBe('G');
    expect(grid[1][0]).toBe('R');
    expect(grid[0][0]).toBeNull();
    expect(result.moves.length).toBeGreaterThan(0);
  });

  test('reports spawn positions for empty top cells', () => {
    const grid = [
      [null, 'B'],
      [null, 'G'],
      ['R', 'R'],
    ];
    const result = BoardGravity.apply(grid, 3, 2);
    // Col 0: only R at bottom; rows 0 and 1 become empty -> 2 spawns
    const col0Spawns = result.spawns.filter(s => s.col === 0);
    expect(col0Spawns).toHaveLength(2);
  });

  test('does nothing when no gaps exist', () => {
    const grid = [
      ['R', 'G'],
      ['B', 'B'],
    ];
    const result = BoardGravity.apply(grid, 2, 2);
    expect(result.moves).toHaveLength(0);
    expect(result.spawns).toHaveLength(0);
  });

  test('handles fully empty columns', () => {
    const grid = [
      [null, 'R'],
      [null, 'G'],
      [null, 'B'],
    ];
    const result = BoardGravity.apply(grid, 3, 2);
    // Col 0: all empty, 3 spawn positions
    const col0Spawns = result.spawns.filter(s => s.col === 0);
    expect(col0Spawns).toHaveLength(3);
  });
});
