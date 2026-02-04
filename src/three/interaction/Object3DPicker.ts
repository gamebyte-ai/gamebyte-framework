import * as THREE from 'three';
import { EventEmitter } from 'eventemitter3';

/**
 * Result of a raycast pick operation
 */
export interface PickResult {
  /** The picked object */
  object: THREE.Object3D;
  /** World-space intersection point */
  point: THREE.Vector3;
  /** Distance from camera to intersection */
  distance: number;
  /** Intersected face (if mesh with geometry) */
  face: THREE.Face | null;
  /** Face index in geometry */
  faceIndex: number | null;
  /** UV coordinates at intersection */
  uv: THREE.Vector2 | null;
}

/**
 * Configuration options for Object3DPicker
 */
export interface Object3DPickerConfig {
  /** Which layers to raycast against (default: [0]) */
  layers?: number[];
  /** Check children recursively (default: true) */
  recursive?: boolean;
  /** Sort results by distance, nearest first (default: true) */
  sortByDistance?: boolean;
}

/**
 * Events emitted by Object3DPicker
 */
interface Object3DPickerEvents {
  'hover-enter': (object: THREE.Object3D) => void;
  'hover-exit': (object: THREE.Object3D) => void;
  'pick': (result: PickResult) => void;
}

/**
 * Raycasting-based 3D object picker for Three.js scenes.
 *
 * Features:
 * - Screen-to-world raycasting
 * - Layer-based filtering
 * - Hover detection with enter/exit events
 * - Single and multi-object picking
 * - Configurable sorting and recursion
 *
 * @example
 * ```typescript
 * const picker = new Object3DPicker(camera, { layers: [0, 1] });
 * picker.addTargets([cube, sphere]);
 * picker.on('hover-enter', (obj) => obj.material.color.set(0xff0000));
 *
 * const result = picker.pick(mouseX, mouseY);
 * if (result) {
 *   console.log('Picked:', result.object.name);
 * }
 * ```
 */
export class Object3DPicker extends EventEmitter<Object3DPickerEvents> {
  private raycaster: THREE.Raycaster;
  private targets: Set<THREE.Object3D>;
  private camera: THREE.Camera;
  private canvasWidth: number;
  private canvasHeight: number;
  private config: Required<Object3DPickerConfig>;
  private hoveredObject: THREE.Object3D | null = null;
  private mouse: THREE.Vector2;

  /**
   * Creates a new Object3DPicker
   *
   * @param camera - Camera to use for raycasting
   * @param config - Optional configuration
   */
  constructor(camera: THREE.Camera, config: Object3DPickerConfig = {}) {
    super();

    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.targets = new Set();
    this.mouse = new THREE.Vector2();
    this.canvasWidth = 1;
    this.canvasHeight = 1;

    // Merge config with defaults
    this.config = {
      layers: config.layers || [0],
      recursive: config.recursive !== undefined ? config.recursive : true,
      sortByDistance: config.sortByDistance !== undefined ? config.sortByDistance : true,
    };

    // Configure raycaster layers
    this.updateRaycasterLayers();
  }

  /**
   * Updates raycaster layer mask based on config
   */
  private updateRaycasterLayers(): void {
    this.raycaster.layers.disableAll();
    for (const layer of this.config.layers) {
      this.raycaster.layers.enable(layer);
    }
  }

  /**
   * Normalizes screen coordinates to NDC (-1 to +1)
   *
   * @param screenX - Screen X coordinate (0 to canvasWidth)
   * @param screenY - Screen Y coordinate (0 to canvasHeight)
   */
  private normalizeCoordinates(screenX: number, screenY: number): void {
    this.mouse.x = (screenX / this.canvasWidth) * 2 - 1;
    this.mouse.y = -(screenY / this.canvasHeight) * 2 + 1;
  }

  /**
   * Converts THREE.Intersection to PickResult
   */
  private intersectionToPickResult(intersection: THREE.Intersection): PickResult {
    return {
      object: intersection.object,
      point: intersection.point.clone(),
      distance: intersection.distance,
      face: intersection.face || null,
      faceIndex: intersection.faceIndex !== undefined ? intersection.faceIndex : null,
      uv: intersection.uv ? intersection.uv.clone() : null,
    };
  }

  /**
   * Performs raycast against current targets
   */
  private performRaycast(): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const targetsArray = Array.from(this.targets);
    const intersections = this.raycaster.intersectObjects(
      targetsArray,
      this.config.recursive
    );

    if (this.config.sortByDistance) {
      intersections.sort((a, b) => a.distance - b.distance);
    }

    return intersections;
  }

  /**
   * Adds a target object for picking
   *
   * @param object - Object to add
   */
  addTarget(object: THREE.Object3D): void {
    this.targets.add(object);
  }

  /**
   * Adds multiple target objects for picking
   *
   * @param objects - Objects to add
   */
  addTargets(objects: THREE.Object3D[]): void {
    for (const object of objects) {
      this.targets.add(object);
    }
  }

  /**
   * Removes a target object from picking
   *
   * @param object - Object to remove
   */
  removeTarget(object: THREE.Object3D): void {
    this.targets.delete(object);

    // Clear hover if removing hovered object
    if (this.hoveredObject === object) {
      this.emit('hover-exit', object);
      this.hoveredObject = null;
    }
  }

  /**
   * Clears all target objects
   */
  clearTargets(): void {
    // Clear hover state
    if (this.hoveredObject) {
      this.emit('hover-exit', this.hoveredObject);
      this.hoveredObject = null;
    }

    this.targets.clear();
  }

  /**
   * Picks the first object at screen coordinates
   *
   * @param screenX - Screen X coordinate (pixels)
   * @param screenY - Screen Y coordinate (pixels)
   * @returns Pick result or null if nothing picked
   */
  pick(screenX: number, screenY: number): PickResult | null {
    this.normalizeCoordinates(screenX, screenY);
    const intersections = this.performRaycast();

    if (intersections.length === 0) {
      return null;
    }

    const result = this.intersectionToPickResult(intersections[0]);
    this.emit('pick', result);
    return result;
  }

  /**
   * Picks all objects at screen coordinates
   *
   * @param screenX - Screen X coordinate (pixels)
   * @param screenY - Screen Y coordinate (pixels)
   * @returns Array of pick results (may be empty)
   */
  pickAll(screenX: number, screenY: number): PickResult[] {
    this.normalizeCoordinates(screenX, screenY);
    const intersections = this.performRaycast();

    const results = intersections.map((intersection) =>
      this.intersectionToPickResult(intersection)
    );

    if (results.length > 0) {
      this.emit('pick', results[0]);
    }

    return results;
  }

  /**
   * Updates hover state at screen coordinates.
   * Call this continuously (e.g., on mousemove) to track hover changes.
   *
   * @param screenX - Screen X coordinate (pixels)
   * @param screenY - Screen Y coordinate (pixels)
   */
  updateHover(screenX: number, screenY: number): void {
    this.normalizeCoordinates(screenX, screenY);
    const intersections = this.performRaycast();

    const newHovered = intersections.length > 0 ? intersections[0].object : null;

    // Check if hover changed
    if (newHovered !== this.hoveredObject) {
      // Exit previous
      if (this.hoveredObject) {
        this.emit('hover-exit', this.hoveredObject);
      }

      // Enter new
      if (newHovered) {
        this.emit('hover-enter', newHovered);
      }

      this.hoveredObject = newHovered;
    }
  }

  /**
   * Sets the camera used for raycasting
   *
   * @param camera - New camera
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Sets the canvas size for coordinate normalization
   *
   * @param width - Canvas width in pixels
   * @param height - Canvas height in pixels
   */
  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = Math.max(1, width);
    this.canvasHeight = Math.max(1, height);
  }

  /**
   * Updates configuration
   *
   * @param config - Partial config to merge
   */
  updateConfig(config: Partial<Object3DPickerConfig>): void {
    if (config.layers !== undefined) {
      this.config.layers = config.layers;
      this.updateRaycasterLayers();
    }
    if (config.recursive !== undefined) {
      this.config.recursive = config.recursive;
    }
    if (config.sortByDistance !== undefined) {
      this.config.sortByDistance = config.sortByDistance;
    }
  }

  /**
   * Gets current configuration
   */
  getConfig(): Readonly<Required<Object3DPickerConfig>> {
    return { ...this.config };
  }

  /**
   * Gets the currently hovered object (if any)
   */
  getHoveredObject(): THREE.Object3D | null {
    return this.hoveredObject;
  }

  /**
   * Gets the underlying THREE.Raycaster for advanced usage
   */
  getRaycaster(): THREE.Raycaster {
    return this.raycaster;
  }

  /**
   * Cleans up resources
   */
  dispose(): void {
    this.clearTargets();
    this.removeAllListeners();
  }
}
