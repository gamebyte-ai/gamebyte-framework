import * as THREE from 'three';
import {
  GridCoord,
  HexCoord,
  IGridSystem,
  gridCoordToKey,
} from '../grids/GridSystem.js';

/**
 * Union type for grid coordinates
 */
export type Coord = GridCoord | HexCoord;

/**
 * Heuristic function types for pathfinding
 */
export type HeuristicType = 'manhattan' | 'euclidean' | 'chebyshev';

/**
 * Configuration for Pathfinder
 */
export interface PathfinderConfig<C extends Coord> {
  /**
   * Grid system to use for pathfinding
   */
  grid: IGridSystem<any, C>;

  /**
   * Allow diagonal movement (for square grids only)
   * @default true
   */
  allowDiagonals?: boolean;

  /**
   * Cost multiplier for diagonal movement
   * @default 1.414 (√2)
   */
  diagonalCost?: number;

  /**
   * Heuristic function to use
   * - manhattan: |dx| + |dy| (good for 4-directional)
   * - euclidean: sqrt(dx² + dy²) (good for any-directional)
   * - chebyshev: max(|dx|, |dy|) (good for 8-directional)
   * @default 'manhattan'
   */
  heuristic?: HeuristicType;

  /**
   * Maximum iterations to prevent infinite loops
   * @default 1000
   */
  maxIterations?: number;
}

/**
 * Options for findPath method
 */
export interface FindPathOptions {
  /**
   * Coordinates to avoid during pathfinding
   */
  avoidCoords?: Coord[];

  /**
   * Maximum total cost for the path
   */
  maxCost?: number;
}

/**
 * Options for createPathLine method
 */
export interface PathLineOptions {
  /**
   * Line color
   * @default 0x00ff00
   */
  color?: number;

  /**
   * Line width
   * @default 2
   */
  lineWidth?: number;

  /**
   * Y offset for the line (to prevent z-fighting)
   * @default 0.1
   */
  yOffset?: number;
}

/**
 * Node in the A* priority queue
 */
interface PathNode<C extends Coord> {
  coord: C;
  gScore: number;
  fScore: number;
}

/**
 * A* pathfinding implementation for grid-based movement
 * Works with both square and hexagonal grids through IGridSystem abstraction
 */
export class Pathfinder<C extends Coord = Coord> {
  private grid: IGridSystem<any, C>;
  private allowDiagonals: boolean;
  private diagonalCost: number;
  private heuristic: HeuristicType;
  private maxIterations: number;

  constructor(config: PathfinderConfig<C>) {
    this.grid = config.grid;
    this.allowDiagonals = config.allowDiagonals ?? true;
    this.diagonalCost = config.diagonalCost ?? 1.414; // √2
    this.heuristic = config.heuristic ?? 'manhattan';
    this.maxIterations = config.maxIterations ?? 1000;
  }

  /**
   * Find path from start to end using A* algorithm
   * @returns Array of coordinates forming the path, or null if no path exists
   */
  findPath(
    start: C,
    end: C,
    options?: FindPathOptions
  ): C[] | null {
    // Validate coordinates
    if (!this.grid.isValidCoord(start) || !this.grid.isValidCoord(end)) {
      return null;
    }

    if (!this.grid.isWalkable(start) || !this.grid.isWalkable(end)) {
      return null;
    }

    // Check if start equals end
    if (this.coordsEqual(start, end)) {
      return [start];
    }

    // Convert avoid coords to set for faster lookup
    const avoidSet = new Set<string>();
    if (options?.avoidCoords) {
      options.avoidCoords.forEach((coord) => {
        avoidSet.add(gridCoordToKey(coord));
      });
    }

    const openSet: PathNode<C>[] = [];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, C>();
    const gScore = new Map<string, number>();

    const startKey = gridCoordToKey(start);
    const endKey = gridCoordToKey(end);

    // Initialize start node
    gScore.set(startKey, 0);
    openSet.push({
      coord: start,
      gScore: 0,
      fScore: this.calculateHeuristic(start, end),
    });

    let iterations = 0;

    while (openSet.length > 0 && iterations < this.maxIterations) {
      iterations++;

      // Get node with lowest fScore
      openSet.sort((a, b) => a.fScore - b.fScore);
      const current = openSet.shift()!;
      const currentKey = gridCoordToKey(current.coord);

      // Check if we reached the goal
      if (currentKey === endKey) {
        return this.reconstructPath(cameFrom, current.coord);
      }

      closedSet.add(currentKey);

      // Check neighbors
      const neighbors = this.grid.getNeighbors(current.coord);

      for (const neighbor of neighbors) {
        const neighborKey = gridCoordToKey(neighbor);

        // Skip if already evaluated
        if (closedSet.has(neighborKey)) {
          continue;
        }

        // Skip if should avoid
        if (avoidSet.has(neighborKey)) {
          continue;
        }

        // Skip if not walkable
        if (!this.grid.isWalkable(neighbor)) {
          continue;
        }

        // Calculate tentative gScore
        const movementCost = this.grid.getMovementCost(current.coord, neighbor);
        if (movementCost === Infinity) {
          continue;
        }

        const tentativeGScore = current.gScore + movementCost;

        // Check max cost constraint
        if (options?.maxCost !== undefined && tentativeGScore > options.maxCost) {
          continue;
        }

        // Check if this path to neighbor is better
        const neighborGScore = gScore.get(neighborKey) ?? Infinity;
        if (tentativeGScore < neighborGScore) {
          // This is a better path
          cameFrom.set(neighborKey, current.coord);
          gScore.set(neighborKey, tentativeGScore);

          const hScore = this.calculateHeuristic(neighbor, end);
          const fScore = tentativeGScore + hScore;

          // Add to or update in open set
          const existingIndex = openSet.findIndex(
            (node) => gridCoordToKey(node.coord) === neighborKey
          );

          if (existingIndex === -1) {
            openSet.push({
              coord: neighbor,
              gScore: tentativeGScore,
              fScore,
            });
          } else {
            openSet[existingIndex].gScore = tentativeGScore;
            openSet[existingIndex].fScore = fScore;
          }
        }
      }
    }

    // No path found
    return null;
  }

  /**
   * Check if end is reachable from start (faster than findPath)
   */
  canReach(start: C, end: C, options?: FindPathOptions): boolean {
    // Simple check - try to find path with reduced iterations
    const originalMaxIterations = this.maxIterations;
    this.maxIterations = Math.min(100, this.maxIterations);

    const path = this.findPath(start, end, options);

    this.maxIterations = originalMaxIterations;

    return path !== null;
  }

  /**
   * Get all cells reachable from start within maxCost
   * Useful for showing movement range
   */
  getReachableCells(start: C, maxCost: number): C[] {
    if (!this.grid.isValidCoord(start) || !this.grid.isWalkable(start)) {
      return [];
    }

    const reachable: C[] = [];
    const visited = new Set<string>();
    const queue: Array<{ coord: C; cost: number }> = [{ coord: start, cost: 0 }];

    visited.add(gridCoordToKey(start));

    while (queue.length > 0) {
      const current = queue.shift()!;
      reachable.push(current.coord);

      const neighbors = this.grid.getNeighbors(current.coord);

      for (const neighbor of neighbors) {
        const neighborKey = gridCoordToKey(neighbor);

        if (visited.has(neighborKey)) {
          continue;
        }

        if (!this.grid.isWalkable(neighbor)) {
          continue;
        }

        const movementCost = this.grid.getMovementCost(current.coord, neighbor);
        if (movementCost === Infinity) {
          continue;
        }

        const totalCost = current.cost + movementCost;

        if (totalCost <= maxCost) {
          visited.add(neighborKey);
          queue.push({ coord: neighbor, cost: totalCost });
        }
      }
    }

    return reachable;
  }

  /**
   * Create a visual debug line for a path
   */
  createPathLine(path: C[], options?: PathLineOptions): THREE.Line {
    const color = options?.color ?? 0x00ff00;
    const lineWidth = options?.lineWidth ?? 2;
    const yOffset = options?.yOffset ?? 0.1;

    const points: THREE.Vector3[] = [];

    for (const coord of path) {
      const worldPos = this.grid.cellToWorld(coord);
      points.push(new THREE.Vector3(worldPos.x, worldPos.y + yOffset, worldPos.z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: lineWidth,
    });

    return new THREE.Line(geometry, material);
  }

  /**
   * Reconstruct path from came-from map
   */
  private reconstructPath(cameFrom: Map<string, C>, current: C): C[] {
    const path: C[] = [current];
    let currentKey = gridCoordToKey(current);

    while (cameFrom.has(currentKey)) {
      current = cameFrom.get(currentKey)!;
      path.unshift(current);
      currentKey = gridCoordToKey(current);
    }

    return path;
  }

  /**
   * Calculate heuristic distance between two coordinates
   */
  private calculateHeuristic(from: C, to: C): number {
    // For hex grids, use cube distance
    if ('q' in from && 'q' in to) {
      const fromHex = from as HexCoord;
      const toHex = to as HexCoord;
      return (
        Math.abs(fromHex.q - toHex.q) +
        Math.abs(fromHex.r - toHex.r) +
        Math.abs(fromHex.s - toHex.s)
      ) / 2;
    }

    // For square grids, use selected heuristic
    const fromGrid = from as GridCoord;
    const toGrid = to as GridCoord;
    const dx = Math.abs(fromGrid.x - toGrid.x);
    const dy = Math.abs(fromGrid.y - toGrid.y);

    switch (this.heuristic) {
      case 'manhattan':
        return dx + dy;
      case 'euclidean':
        return Math.sqrt(dx * dx + dy * dy);
      case 'chebyshev':
        return Math.max(dx, dy);
      default:
        return dx + dy;
    }
  }

  /**
   * Check if two coordinates are equal
   */
  private coordsEqual(a: C, b: C): boolean {
    return gridCoordToKey(a) === gridCoordToKey(b);
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<PathfinderConfig<C>>): void {
    if (config.grid !== undefined) {
      this.grid = config.grid;
    }
    if (config.allowDiagonals !== undefined) {
      this.allowDiagonals = config.allowDiagonals;
    }
    if (config.diagonalCost !== undefined) {
      this.diagonalCost = config.diagonalCost;
    }
    if (config.heuristic !== undefined) {
      this.heuristic = config.heuristic;
    }
    if (config.maxIterations !== undefined) {
      this.maxIterations = config.maxIterations;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<PathfinderConfig<C>> {
    return {
      grid: this.grid,
      allowDiagonals: this.allowDiagonals,
      diagonalCost: this.diagonalCost,
      heuristic: this.heuristic,
      maxIterations: this.maxIterations,
    };
  }
}
