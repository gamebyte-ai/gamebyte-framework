import { Vector3 } from 'three';
import {
  IGridSystem,
  GridCoord,
  gridCoordToKey,
  keyToGridCoord,
} from './GridSystem.js';

/**
 * Neighbor mode for square grids
 */
export type SquareGridNeighborMode = '4-way' | '8-way';

/**
 * Origin mode for grid positioning
 */
export type SquareGridOriginMode = 'center' | 'corner';

/**
 * Configuration for SquareGrid
 */
export interface SquareGridConfig {
  /** Grid width in cells */
  width: number;
  /** Grid height in cells */
  height: number;
  /** Size of each cell in world units */
  cellSize: number;
  /** World position of grid origin [x, y, z] */
  origin?: [number, number, number];
  /** Whether origin is at center or corner (top-left) */
  originMode?: SquareGridOriginMode;
  /** Neighbor mode: 4-way (cardinal) or 8-way (cardinal + diagonal) */
  neighborMode?: SquareGridNeighborMode;
}

/**
 * Square/rectangular grid system for GameByte Framework
 * @template T - Type of data stored in grid cells
 */
export class SquareGrid<T> implements IGridSystem<T, GridCoord> {
  private readonly width: number;
  private readonly height: number;
  private readonly cellSize: number;
  private readonly origin: Vector3;
  private readonly originMode: SquareGridOriginMode;
  private readonly neighborMode: SquareGridNeighborMode;

  private cells: Map<string, T> = new Map();
  private walkable: Map<string, boolean> = new Map();
  private movementCosts: Map<string, number> = new Map();

  constructor(config: SquareGridConfig) {
    this.width = config.width;
    this.height = config.height;
    this.cellSize = config.cellSize;
    this.origin = new Vector3(
      config.origin?.[0] ?? 0,
      config.origin?.[1] ?? 0,
      config.origin?.[2] ?? 0
    );
    this.originMode = config.originMode ?? 'corner';
    this.neighborMode = config.neighborMode ?? '4-way';
  }

  worldToCell(worldPos: Vector3): GridCoord {
    // Adjust for origin offset
    let localX = worldPos.x - this.origin.x;
    let localZ = worldPos.z - this.origin.z;

    // Adjust for center mode
    if (this.originMode === 'center') {
      localX += (this.width * this.cellSize) / 2;
      localZ += (this.height * this.cellSize) / 2;
    }

    // Convert to grid coordinates
    const x = Math.floor(localX / this.cellSize);
    const y = Math.floor(localZ / this.cellSize);

    return { x, y };
  }

  cellToWorld(coord: GridCoord): Vector3 {
    // Cell center position
    let worldX = coord.x * this.cellSize + this.cellSize / 2;
    let worldZ = coord.y * this.cellSize + this.cellSize / 2;

    // Adjust for center mode
    if (this.originMode === 'center') {
      worldX -= (this.width * this.cellSize) / 2;
      worldZ -= (this.height * this.cellSize) / 2;
    }

    // Apply origin offset
    worldX += this.origin.x;
    worldZ += this.origin.z;

    return new Vector3(worldX, this.origin.y, worldZ);
  }

  getCell(coord: GridCoord): T | undefined {
    if (!this.isValidCoord(coord)) return undefined;
    return this.cells.get(gridCoordToKey(coord));
  }

  setCell(coord: GridCoord, value: T): void {
    if (!this.isValidCoord(coord)) {
      throw new Error(`Invalid coordinate: (${coord.x}, ${coord.y})`);
    }
    this.cells.set(gridCoordToKey(coord), value);
  }

  clearCell(coord: GridCoord): void {
    this.cells.delete(gridCoordToKey(coord));
    this.walkable.delete(gridCoordToKey(coord));
    this.movementCosts.delete(gridCoordToKey(coord));
  }

  getAllCells(): Map<string, { coord: GridCoord; value: T }> {
    const result = new Map<string, { coord: GridCoord; value: T }>();
    this.cells.forEach((value, key) => {
      result.set(key, { coord: keyToGridCoord(key), value });
    });
    return result;
  }

  getNeighbors(coord: GridCoord): GridCoord[] {
    const neighbors: GridCoord[] = [];

    // Cardinal directions (4-way)
    const cardinalOffsets: [number, number][] = [
      [0, -1], // North
      [1, 0],  // East
      [0, 1],  // South
      [-1, 0], // West
    ];

    // Diagonal directions (additional for 8-way)
    const diagonalOffsets: [number, number][] = [
      [1, -1],  // Northeast
      [1, 1],   // Southeast
      [-1, 1],  // Southwest
      [-1, -1], // Northwest
    ];

    // Add cardinal neighbors
    for (const [dx, dy] of cardinalOffsets) {
      const neighbor = { x: coord.x + dx, y: coord.y + dy };
      if (this.isValidCoord(neighbor)) {
        neighbors.push(neighbor);
      }
    }

    // Add diagonal neighbors for 8-way mode
    if (this.neighborMode === '8-way') {
      for (const [dx, dy] of diagonalOffsets) {
        const neighbor = { x: coord.x + dx, y: coord.y + dy };
        if (this.isValidCoord(neighbor)) {
          neighbors.push(neighbor);
        }
      }
    }

    return neighbors;
  }

  getCellsInRange(center: GridCoord, range: number): GridCoord[] {
    const cells: GridCoord[] = [];

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        // Manhattan distance for 4-way, Chebyshev for 8-way
        const distance =
          this.neighborMode === '4-way'
            ? Math.abs(dx) + Math.abs(dy)
            : Math.max(Math.abs(dx), Math.abs(dy));

        if (distance <= range) {
          const coord = { x: center.x + dx, y: center.y + dy };
          if (this.isValidCoord(coord)) {
            cells.push(coord);
          }
        }
      }
    }

    return cells;
  }

  isValidCoord(coord: GridCoord): boolean {
    return (
      coord.x >= 0 &&
      coord.x < this.width &&
      coord.y >= 0 &&
      coord.y < this.height
    );
  }

  isWalkable(coord: GridCoord): boolean {
    if (!this.isValidCoord(coord)) return false;
    const key = gridCoordToKey(coord);
    // Default to true if not explicitly set
    return this.walkable.get(key) ?? true;
  }

  setWalkable(coord: GridCoord, walkable: boolean): void {
    if (!this.isValidCoord(coord)) {
      throw new Error(`Invalid coordinate: (${coord.x}, ${coord.y})`);
    }
    this.walkable.set(gridCoordToKey(coord), walkable);
  }

  getMovementCost(from: GridCoord, to: GridCoord): number {
    // Check if coordinates are valid
    if (!this.isValidCoord(from) || !this.isValidCoord(to)) {
      return Infinity;
    }

    // Check if destination is walkable
    if (!this.isWalkable(to)) {
      return Infinity;
    }

    // Check if cells are adjacent
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    const isCardinal = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    const isDiagonal = dx === 1 && dy === 1;

    if (!isCardinal && !isDiagonal) {
      return Infinity; // Not adjacent
    }

    if (isDiagonal && this.neighborMode === '4-way') {
      return Infinity; // Diagonal not allowed in 4-way mode
    }

    // Check for custom movement cost
    const toKey = gridCoordToKey(to);
    const customCost = this.movementCosts.get(toKey);
    if (customCost !== undefined) {
      return customCost;
    }

    // Default costs: 1 for cardinal, sqrt(2) for diagonal
    return isDiagonal ? Math.SQRT2 : 1;
  }

  /**
   * Set custom movement cost for a cell
   */
  setMovementCost(coord: GridCoord, cost: number): void {
    if (!this.isValidCoord(coord)) {
      throw new Error(`Invalid coordinate: (${coord.x}, ${coord.y})`);
    }
    this.movementCosts.set(gridCoordToKey(coord), cost);
  }

  /**
   * Get grid dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get cell size
   */
  getCellSize(): number {
    return this.cellSize;
  }

  /**
   * Get grid origin
   */
  getOrigin(): Vector3 {
    return this.origin.clone();
  }
}
