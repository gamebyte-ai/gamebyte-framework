import { Vector3 } from 'three';
import { IGridSystem, HexCoord, gridCoordToKey, keyToHexCoord } from './GridSystem.js';

/**
 * Hexagonal grid orientation
 */
export type HexOrientation = 'flat' | 'pointy';

/**
 * Configuration for hexagonal grid
 */
export interface HexGridConfig {
  /** Number of hex rings from center (total hexes = 1 + 6*radius*(radius+1)/2) */
  radius: number;
  /** Flat-to-flat distance of hexagon */
  hexSize: number;
  /** Hex orientation: flat-top or pointy-top */
  orientation: HexOrientation;
  /** Grid origin in world coordinates */
  origin: [number, number, number];
  /** Default movement cost for walkable cells */
  defaultMovementCost?: number;
}

/**
 * Hexagonal grid using cube coordinates
 *
 * Based on Red Blob Games hex grid math:
 * https://www.redblobgames.com/grids/hexagons/
 *
 * Uses cube coordinates where q + r + s = 0
 * - q: column axis
 * - r: row axis
 * - s: diagonal axis
 *
 * @template T - Type of data stored in grid cells
 */
export class HexGrid<T> implements IGridSystem<T, HexCoord> {
  private config: Required<HexGridConfig>;
  private cells: Map<string, T>;
  private walkable: Map<string, boolean>;
  private origin: Vector3;

  // Orientation matrices for hex-to-pixel conversion
  private readonly orientations = {
    flat: {
      f0: 3.0 / 2.0, f1: 0.0, f2: Math.sqrt(3.0) / 2.0, f3: Math.sqrt(3.0),
      b0: 2.0 / 3.0, b1: 0.0, b2: -1.0 / 3.0, b3: Math.sqrt(3.0) / 3.0,
      startAngle: 0.0,
    },
    pointy: {
      f0: Math.sqrt(3.0), f1: Math.sqrt(3.0) / 2.0, f2: 0.0, f3: 3.0 / 2.0,
      b0: Math.sqrt(3.0) / 3.0, b1: -1.0 / 3.0, b2: 0.0, b3: 2.0 / 3.0,
      startAngle: 0.5,
    },
  };

  // Cube direction vectors for 6 neighbors
  private readonly directions: HexCoord[] = [
    { q: 1, r: 0, s: -1 },
    { q: 1, r: -1, s: 0 },
    { q: 0, r: -1, s: 1 },
    { q: -1, r: 0, s: 1 },
    { q: -1, r: 1, s: 0 },
    { q: 0, r: 1, s: -1 },
  ];

  constructor(config: HexGridConfig) {
    this.config = {
      ...config,
      defaultMovementCost: config.defaultMovementCost ?? 1,
    };
    this.cells = new Map();
    this.walkable = new Map();
    this.origin = new Vector3(...config.origin);
  }

  /**
   * Convert world position to hex coordinate
   */
  worldToCell(worldPos: Vector3): HexCoord {
    const orientation = this.orientations[this.config.orientation];
    const size = this.config.hexSize;

    // Convert world to local coordinates
    const localX = worldPos.x - this.origin.x;
    const localZ = worldPos.z - this.origin.z;

    // Hex-to-pixel inverse transformation
    const q = (orientation.b0 * localX + orientation.b1 * localZ) / size;
    const r = (orientation.b2 * localX + orientation.b3 * localZ) / size;

    // Round to nearest hex using cube rounding
    return this.cubeRound({ q, r, s: -q - r });
  }

  /**
   * Convert hex coordinate to world position
   */
  cellToWorld(coord: HexCoord): Vector3 {
    const orientation = this.orientations[this.config.orientation];
    const size = this.config.hexSize;

    // Pixel-to-hex transformation
    const x = (orientation.f0 * coord.q + orientation.f1 * coord.r) * size;
    const z = (orientation.f2 * coord.q + orientation.f3 * coord.r) * size;

    return new Vector3(
      this.origin.x + x,
      this.origin.y,
      this.origin.z + z
    );
  }

  /**
   * Get cell value at coordinate
   */
  getCell(coord: HexCoord): T | undefined {
    const key = gridCoordToKey(coord);
    return this.cells.get(key);
  }

  /**
   * Set cell value at coordinate
   */
  setCell(coord: HexCoord, value: T): void {
    if (!this.isValidCoord(coord)) {
      throw new Error(`Coordinate ${gridCoordToKey(coord)} is outside grid radius ${this.config.radius}`);
    }
    const key = gridCoordToKey(coord);
    this.cells.set(key, value);
  }

  /**
   * Clear cell at coordinate
   */
  clearCell(coord: HexCoord): void {
    const key = gridCoordToKey(coord);
    this.cells.delete(key);
    this.walkable.delete(key);
  }

  /**
   * Get all cells in the grid
   */
  getAllCells(): Map<string, { coord: HexCoord; value: T }> {
    const result = new Map<string, { coord: HexCoord; value: T }>();
    this.cells.forEach((value, key) => {
      result.set(key, { coord: keyToHexCoord(key), value });
    });
    return result;
  }

  /**
   * Get 6 neighboring hex coordinates
   */
  getNeighbors(coord: HexCoord): HexCoord[] {
    return this.directions
      .map((dir) => this.cubeAdd(coord, dir))
      .filter((neighbor) => this.isValidCoord(neighbor));
  }

  /**
   * Get all cells within range of center
   */
  getCellsInRange(center: HexCoord, range: number): HexCoord[] {
    const results: HexCoord[] = [];
    for (let q = -range; q <= range; q++) {
      for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
        const s = -q - r;
        const coord = this.cubeAdd(center, { q, r, s });
        if (this.isValidCoord(coord)) {
          results.push(coord);
        }
      }
    }
    return results;
  }

  /**
   * Check if coordinate is valid within grid bounds
   */
  isValidCoord(coord: HexCoord): boolean {
    // Validate cube coordinate constraint
    if (Math.abs(coord.q + coord.r + coord.s) > 0.001) {
      return false;
    }
    // Check distance from origin
    const distance = this.distance(coord, { q: 0, r: 0, s: 0 });
    return distance <= this.config.radius;
  }

  /**
   * Check if cell is walkable for pathfinding
   */
  isWalkable(coord: HexCoord): boolean {
    const key = gridCoordToKey(coord);
    return this.walkable.get(key) ?? true;
  }

  /**
   * Set cell walkability for pathfinding
   */
  setWalkable(coord: HexCoord, walkable: boolean): void {
    const key = gridCoordToKey(coord);
    this.walkable.set(key, walkable);
  }

  /**
   * Get movement cost between adjacent cells
   */
  getMovementCost(from: HexCoord, to: HexCoord): number {
    // Check if cells are adjacent
    const distance = this.distance(from, to);
    if (distance !== 1) {
      return Infinity;
    }

    // Check if destination is walkable
    if (!this.isWalkable(to)) {
      return Infinity;
    }

    return this.config.defaultMovementCost;
  }

  /**
   * Get all hexes at exact distance from center (ring)
   */
  getRing(center: HexCoord, radius: number): HexCoord[] {
    if (radius === 0) {
      return [center];
    }

    const results: HexCoord[] = [];
    // Start at radius steps in one direction
    let hex = this.cubeAdd(center, this.cubeScale(this.directions[4], radius));

    // Walk around the ring
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < radius; j++) {
        if (this.isValidCoord(hex)) {
          results.push(hex);
        }
        hex = this.cubeAdd(hex, this.directions[i]);
      }
    }

    return results;
  }

  /**
   * Get all hexes up to radius from center (filled spiral)
   */
  getSpiral(center: HexCoord, radius: number): HexCoord[] {
    const results: HexCoord[] = [center];
    for (let r = 1; r <= radius; r++) {
      results.push(...this.getRing(center, r));
    }
    return results;
  }

  /**
   * Get hexes along line from start to end
   */
  getLine(from: HexCoord, to: HexCoord): HexCoord[] {
    const distance = this.distance(from, to);
    const results: HexCoord[] = [];

    for (let i = 0; i <= distance; i++) {
      const t = distance === 0 ? 0 : i / distance;
      results.push(this.cubeLerp(from, to, t));
    }

    return results;
  }

  /**
   * Convert cube coordinate to axial (q, r)
   */
  cubeToAxial(cube: HexCoord): { q: number; r: number } {
    return { q: cube.q, r: cube.r };
  }

  /**
   * Convert axial coordinate to cube (q, r, s)
   */
  axialToCube(axial: { q: number; r: number }): HexCoord {
    return { q: axial.q, r: axial.r, s: -axial.q - axial.r };
  }

  /**
   * Calculate distance between two hex coordinates
   */
  distance(a: HexCoord, b: HexCoord): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
  }

  /**
   * Get hex size (flat-to-flat distance)
   */
  getHexSize(): number {
    return this.config.hexSize;
  }

  /**
   * Get grid radius
   */
  getRadius(): number {
    return this.config.radius;
  }

  /**
   * Get hex orientation
   */
  getOrientation(): HexOrientation {
    return this.config.orientation;
  }

  /**
   * Get grid origin
   */
  getOrigin(): Vector3 {
    return this.origin.clone();
  }

  /**
   * Get corner positions of a hex in world space
   */
  getHexCorners(coord: HexCoord): Vector3[] {
    const center = this.cellToWorld(coord);
    const orientation = this.orientations[this.config.orientation];
    const size = this.config.hexSize;
    const corners: Vector3[] = [];

    for (let i = 0; i < 6; i++) {
      const angle = 2.0 * Math.PI * (orientation.startAngle + i) / 6.0;
      const x = center.x + size * Math.cos(angle);
      const z = center.z + size * Math.sin(angle);
      corners.push(new Vector3(x, center.y, z));
    }

    return corners;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Add two cube coordinates
   */
  private cubeAdd(a: HexCoord, b: HexCoord): HexCoord {
    return { q: a.q + b.q, r: a.r + b.r, s: a.s + b.s };
  }

  /**
   * Scale cube coordinate by factor
   */
  private cubeScale(coord: HexCoord, factor: number): HexCoord {
    return { q: coord.q * factor, r: coord.r * factor, s: coord.s * factor };
  }

  /**
   * Linear interpolation between two cube coordinates
   */
  private cubeLerp(a: HexCoord, b: HexCoord, t: number): HexCoord {
    return this.cubeRound({
      q: a.q * (1 - t) + b.q * t,
      r: a.r * (1 - t) + b.r * t,
      s: a.s * (1 - t) + b.s * t,
    });
  }

  /**
   * Round fractional cube coordinates to nearest hex
   */
  private cubeRound(frac: { q: number; r: number; s: number }): HexCoord {
    let q = Math.round(frac.q);
    let r = Math.round(frac.r);
    let s = Math.round(frac.s);

    const qDiff = Math.abs(q - frac.q);
    const rDiff = Math.abs(r - frac.r);
    const sDiff = Math.abs(s - frac.s);

    // Reset the component with largest rounding error
    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    } else {
      s = -q - r;
    }

    return { q, r, s };
  }
}
