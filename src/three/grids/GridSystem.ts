import { Vector3 } from 'three';

/**
 * Grid coordinate for square/rectangular grids
 */
export interface GridCoord {
  x: number;
  y: number;
}

/**
 * Hexagonal grid coordinate using cube/axial system
 * Constraint: q + r + s = 0
 */
export interface HexCoord {
  q: number;
  r: number;
  s: number;
}

/**
 * Base interface for all grid systems in GameByte Framework
 * @template T - Type of data stored in grid cells
 * @template C - Coordinate type (GridCoord or HexCoord)
 */
export interface IGridSystem<T, C extends GridCoord | HexCoord> {
  /**
   * Convert world position to grid coordinate
   */
  worldToCell(worldPos: Vector3): C;

  /**
   * Convert grid coordinate to world position
   */
  cellToWorld(coord: C): Vector3;

  /**
   * Get cell value at coordinate
   */
  getCell(coord: C): T | undefined;

  /**
   * Set cell value at coordinate
   */
  setCell(coord: C, value: T): void;

  /**
   * Clear cell at coordinate
   */
  clearCell(coord: C): void;

  /**
   * Get all cells in the grid
   */
  getAllCells(): Map<string, { coord: C; value: T }>;

  /**
   * Get neighboring coordinates
   */
  getNeighbors(coord: C): C[];

  /**
   * Get all cells within range of center
   * @param center - Center coordinate
   * @param range - Distance in cells
   */
  getCellsInRange(center: C, range: number): C[];

  /**
   * Check if coordinate is valid within grid bounds
   */
  isValidCoord(coord: C): boolean;

  /**
   * Check if cell is walkable for pathfinding
   */
  isWalkable(coord: C): boolean;

  /**
   * Set cell walkability for pathfinding
   */
  setWalkable(coord: C, walkable: boolean): void;

  /**
   * Get movement cost between adjacent cells
   * Returns Infinity for non-walkable or non-adjacent cells
   */
  getMovementCost(from: C, to: C): number;
}

/**
 * Helper to create grid coordinate key for Maps
 */
export function gridCoordToKey(coord: GridCoord | HexCoord): string {
  if ('q' in coord) {
    return `${coord.q},${coord.r},${coord.s}`;
  }
  return `${coord.x},${coord.y}`;
}

/**
 * Helper to parse grid coordinate from key
 */
export function keyToGridCoord(key: string): GridCoord {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

/**
 * Helper to parse hex coordinate from key
 */
export function keyToHexCoord(key: string): HexCoord {
  const [q, r, s] = key.split(',').map(Number);
  return { q, r, s };
}
