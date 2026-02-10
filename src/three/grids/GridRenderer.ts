import * as THREE from 'three';
import { IGridSystem, GridCoord, HexCoord, gridCoordToKey } from './GridSystem.js';
import { Logger } from '../../utils/Logger.js';

/**
 * Material type for filled cells
 */
export type CellMaterialType = 'basic' | 'standard' | THREE.Material;

/**
 * Configuration for GridRenderer
 */
export interface GridRendererConfig {
  /** Show grid lines */
  showGrid?: boolean;
  /** Grid line color (hex) */
  lineColor?: number;
  /** Grid line opacity (0-1) */
  lineAlpha?: number;
  /** Grid line width */
  lineWidth?: number;
  /** Default highlight color (hex) */
  highlightColor?: number;
  /** Material type for filled cells */
  cellMaterial?: CellMaterialType;
  /** Y offset to prevent z-fighting */
  groundOffset?: number;
}

/**
 * Highlight entry data
 */
interface HighlightEntry {
  mesh: THREE.Mesh;
  color: number;
}

/**
 * Filled cell entry data
 */
interface FilledCellEntry {
  mesh: THREE.Mesh;
  color: number;
}

/**
 * GridRenderer - Visualizes grid systems in Three.js
 * Works with both SquareGrid and HexGrid (when implemented)
 * Extends THREE.Group so it can be added directly to scene
 */
export class GridRenderer extends THREE.Group {
  private grid: IGridSystem<any, GridCoord | HexCoord> | null = null;
  private config: Required<GridRendererConfig>;

  // Visual components
  private gridLines: THREE.LineSegments | null = null;
  private highlights: Map<string, HighlightEntry> = new Map();
  private filledCells: Map<string, FilledCellEntry> = new Map();

  // Geometries and materials for cleanup
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor(
    grid?: IGridSystem<any, GridCoord | HexCoord>,
    config: GridRendererConfig = {}
  ) {
    super();

    // Set default configuration
    this.config = {
      showGrid: config.showGrid ?? true,
      lineColor: config.lineColor ?? 0x444444,
      lineAlpha: config.lineAlpha ?? 0.5,
      lineWidth: config.lineWidth ?? 1,
      highlightColor: config.highlightColor ?? 0xffff00,
      cellMaterial: config.cellMaterial ?? 'standard',
      groundOffset: config.groundOffset ?? 0.01,
    };

    if (grid) {
      this.setGrid(grid);
    }
  }

  /**
   * Set the grid system to render
   */
  setGrid(grid: IGridSystem<any, GridCoord | HexCoord>): void {
    this.grid = grid;
    this.rebuild();
  }

  /**
   * Highlight a single cell
   */
  highlightCell(coord: GridCoord | HexCoord, color?: number): void {
    if (!this.grid) return;

    const key = gridCoordToKey(coord);
    const highlightColor = color ?? this.config.highlightColor;

    // Remove existing highlight if present
    this.clearHighlight(coord);

    // Create highlight mesh
    const worldPos = this.grid.cellToWorld(coord);
    const mesh = this.createHighlightMesh(coord, highlightColor);
    mesh.position.copy(worldPos);
    mesh.position.y += this.config.groundOffset;

    this.add(mesh);
    this.highlights.set(key, { mesh, color: highlightColor });
  }

  /**
   * Highlight multiple cells
   */
  highlightCells(coords: (GridCoord | HexCoord)[], color?: number): void {
    coords.forEach((coord) => this.highlightCell(coord, color));
  }

  /**
   * Clear highlight from a cell
   */
  clearHighlight(coord: GridCoord | HexCoord): void {
    const key = gridCoordToKey(coord);
    const entry = this.highlights.get(key);

    if (entry) {
      this.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      if (entry.mesh.material instanceof THREE.Material) {
        entry.mesh.material.dispose();
      }
      this.highlights.delete(key);
    }
  }

  /**
   * Clear all highlights
   */
  clearAllHighlights(): void {
    this.highlights.forEach((entry) => {
      this.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      if (entry.mesh.material instanceof THREE.Material) {
        entry.mesh.material.dispose();
      }
    });
    this.highlights.clear();
  }

  /**
   * Show a filled cell
   */
  showCell(coord: GridCoord | HexCoord, color?: number): void {
    if (!this.grid) return;

    const key = gridCoordToKey(coord);
    const cellColor = color ?? 0xffffff;

    // Remove existing filled cell if present
    this.hideCell(coord);

    // Create filled cell mesh
    const worldPos = this.grid.cellToWorld(coord);
    const mesh = this.createFilledCellMesh(coord, cellColor);
    mesh.position.copy(worldPos);

    this.add(mesh);
    this.filledCells.set(key, { mesh, color: cellColor });
  }

  /**
   * Hide a filled cell
   */
  hideCell(coord: GridCoord | HexCoord): void {
    const key = gridCoordToKey(coord);
    const entry = this.filledCells.get(key);

    if (entry) {
      this.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      if (entry.mesh.material instanceof THREE.Material) {
        entry.mesh.material.dispose();
      }
      this.filledCells.delete(key);
    }
  }

  /**
   * Rebuild grid lines
   */
  rebuild(): void {
    // Clear existing grid lines
    if (this.gridLines) {
      this.remove(this.gridLines);
      this.gridLines.geometry.dispose();
      if (this.gridLines.material instanceof THREE.Material) {
        this.gridLines.material.dispose();
      }
      this.gridLines = null;
    }

    if (!this.grid || !this.config.showGrid) return;

    // Determine grid type and build appropriate lines
    const testCoord = this.getTestCoordinate();
    if (this.isHexCoord(testCoord)) {
      this.buildHexGridLines();
    } else {
      this.buildSquareGridLines();
    }
  }

  /**
   * Set visibility of grid renderer
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GridRendererConfig>): void {
    Object.assign(this.config, config);
    this.rebuild();
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<GridRendererConfig>> {
    return { ...this.config };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearAllHighlights();

    // Dispose filled cells
    this.filledCells.forEach((entry) => {
      this.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      if (entry.mesh.material instanceof THREE.Material) {
        entry.mesh.material.dispose();
      }
    });
    this.filledCells.clear();

    // Dispose grid lines
    if (this.gridLines) {
      this.remove(this.gridLines);
      this.gridLines.geometry.dispose();
      if (this.gridLines.material instanceof THREE.Material) {
        this.gridLines.material.dispose();
      }
      this.gridLines = null;
    }

    // Dispose tracked geometries and materials
    this.geometries.forEach((geom) => geom.dispose());
    this.materials.forEach((mat) => mat.dispose());
    this.geometries = [];
    this.materials = [];
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Build grid lines for square grid
   */
  private buildSquareGridLines(): void {
    if (!this.grid) return;

    // Get grid dimensions from SquareGrid
    const squareGrid = this.grid as any;
    if (!squareGrid.getDimensions || !squareGrid.getCellSize) {
      Logger.warn('Grid', 'Grid does not support SquareGrid methods');
      return;
    }

    const { width, height } = squareGrid.getDimensions();
    const cellSize = squareGrid.getCellSize();
    const origin = squareGrid.getOrigin();

    const positions: number[] = [];

    // Vertical lines
    for (let x = 0; x <= width; x++) {
      const worldX = origin.x + x * cellSize;
      const startZ = origin.z;
      const endZ = origin.z + height * cellSize;

      positions.push(worldX, origin.y, startZ);
      positions.push(worldX, origin.y, endZ);
    }

    // Horizontal lines
    for (let y = 0; y <= height; y++) {
      const worldZ = origin.z + y * cellSize;
      const startX = origin.x;
      const endX = origin.x + width * cellSize;

      positions.push(startX, origin.y, worldZ);
      positions.push(endX, origin.y, worldZ);
    }

    this.createLineSegments(positions);
  }

  /**
   * Build grid lines for hex grid
   */
  private buildHexGridLines(): void {
    if (!this.grid) return;

    // Get all cells and draw hexagon outlines
    const allCells = this.grid.getAllCells();
    const positions: number[] = [];

    allCells.forEach(({ coord }) => {
      const hexPositions = this.getHexagonVertices(coord as HexCoord);
      // Create lines connecting vertices
      for (let i = 0; i < 6; i++) {
        const v1 = hexPositions[i];
        const v2 = hexPositions[(i + 1) % 6];
        positions.push(v1.x, v1.y, v1.z);
        positions.push(v2.x, v2.y, v2.z);
      }
    });

    if (positions.length > 0) {
      this.createLineSegments(positions);
    }
  }

  /**
   * Create line segments from positions array
   */
  private createLineSegments(positions: number[]): void {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    const material = new THREE.LineBasicMaterial({
      color: this.config.lineColor,
      opacity: this.config.lineAlpha,
      transparent: this.config.lineAlpha < 1,
      linewidth: this.config.lineWidth, // Note: linewidth only works in WebGL when using LineSegments2
    });

    this.gridLines = new THREE.LineSegments(geometry, material);
    this.add(this.gridLines);

    this.geometries.push(geometry);
    this.materials.push(material);
  }

  /**
   * Create highlight mesh for a cell
   */
  private createHighlightMesh(
    coord: GridCoord | HexCoord,
    color: number
  ): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    if (this.isHexCoord(coord)) {
      // Hexagon shape
      const vertices = this.getHexagonVertices(coord as HexCoord);
      const positions: number[] = [];

      // Create triangle fan
      const center = this.grid!.cellToWorld(coord);
      for (let i = 0; i < 6; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % 6];

        positions.push(center.x, 0, center.z);
        positions.push(v1.x, 0, v1.z);
        positions.push(v2.x, 0, v2.z);
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
    } else {
      // Square shape
      const squareGrid = this.grid as any;
      const cellSize = squareGrid.getCellSize();
      geometry = new THREE.PlaneGeometry(cellSize, cellSize);
      geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane
    }

    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    this.geometries.push(geometry);
    this.materials.push(material);

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create filled cell mesh
   */
  private createFilledCellMesh(
    coord: GridCoord | HexCoord,
    color: number
  ): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    if (this.isHexCoord(coord)) {
      // Hexagon shape
      const vertices = this.getHexagonVertices(coord as HexCoord);
      const positions: number[] = [];

      // Create triangle fan
      const center = this.grid!.cellToWorld(coord);
      for (let i = 0; i < 6; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % 6];

        positions.push(center.x, 0, center.z);
        positions.push(v1.x, 0, v1.z);
        positions.push(v2.x, 0, v2.z);
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geometry.computeVertexNormals();
    } else {
      // Square shape
      const squareGrid = this.grid as any;
      const cellSize = squareGrid.getCellSize();
      geometry = new THREE.PlaneGeometry(cellSize, cellSize);
      geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane
    }

    let material: THREE.Material;
    if (this.config.cellMaterial instanceof THREE.Material) {
      material = this.config.cellMaterial.clone();
      if ('color' in material) {
        (material as any).color = new THREE.Color(color);
      }
    } else if (this.config.cellMaterial === 'basic') {
      material = new THREE.MeshBasicMaterial({ color });
    } else {
      material = new THREE.MeshStandardMaterial({ color });
    }

    this.geometries.push(geometry);
    this.materials.push(material);

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Get hexagon vertices for a hex coordinate
   */
  private getHexagonVertices(coord: HexCoord): THREE.Vector3[] {
    // This is a placeholder - will need proper hex-to-world conversion
    // when HexGrid is implemented
    const center = this.grid!.cellToWorld(coord);
    const size = 1; // This should come from HexGrid config
    const vertices: THREE.Vector3[] = [];

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = center.x + size * Math.cos(angle);
      const z = center.z + size * Math.sin(angle);
      vertices.push(new THREE.Vector3(x, center.y, z));
    }

    return vertices;
  }

  /**
   * Get a test coordinate to determine grid type
   */
  private getTestCoordinate(): GridCoord | HexCoord {
    if (!this.grid) {
      return { x: 0, y: 0 };
    }

    // Try to get any cell
    const cells = this.grid.getAllCells();
    const firstCell = cells.values().next().value;
    if (firstCell) {
      return firstCell.coord;
    }

    // Fallback to origin
    return { x: 0, y: 0 };
  }

  /**
   * Type guard to check if coordinate is HexCoord
   */
  private isHexCoord(coord: GridCoord | HexCoord): coord is HexCoord {
    return 'q' in coord && 'r' in coord && 's' in coord;
  }
}
