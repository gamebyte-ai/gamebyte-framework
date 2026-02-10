import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import { Logger } from '../../utils/Logger.js';
import type { IGridSystem, GridCoord, HexCoord } from '../grids/GridSystem.js';

/**
 * Grid system interface for drag snapping
 */
export interface DragSnapGrid {
  worldToCell(worldPos: THREE.Vector3): GridCoord | HexCoord;
  cellToWorld(coord: GridCoord | HexCoord): THREE.Vector3;
}

/**
 * Configuration options for DragController
 */
export interface DragControllerConfig {
  /**
   * Drag constraint plane
   * - 'xy': Drag in XY plane (vertical)
   * - 'xz': Drag in XZ plane (horizontal, default)
   * - 'yz': Drag in YZ plane (vertical)
   * - THREE.Plane: Custom plane
   */
  plane?: 'xy' | 'xz' | 'yz' | THREE.Plane;

  /**
   * Height of the drag plane (Y position for XZ plane)
   * Default: 0
   */
  planeHeight?: number;

  /**
   * Optional grid system for snapping
   */
  snapToGrid?: DragSnapGrid | null;

  /**
   * Show semi-transparent ghost preview during drag
   * Default: true
   */
  showGhost?: boolean;

  /**
   * Opacity of ghost object
   * Default: 0.5
   */
  ghostOpacity?: number;

  /**
   * Validation function to determine if object can be dropped at position
   * @param object The object being dragged
   * @param targetPos Target world position
   * @param gridCoord Grid coordinate (if grid snapping enabled)
   * @returns true if drop is valid
   */
  validationFn?: (
    object: THREE.Object3D,
    targetPos: THREE.Vector3,
    gridCoord?: { x: number; y: number; z: number }
  ) => boolean;
}

/**
 * Drag event data
 */
export interface DragEventData {
  object: THREE.Object3D;
  startPos?: THREE.Vector3;
  currentPos?: THREE.Vector3;
  finalPos?: THREE.Vector3;
  gridCoord?: { x: number; y: number; z: number } | null;
  valid?: boolean;
}

/**
 * DragController - Handles 3D object drag and drop with grid snapping
 *
 * Features:
 * - Drag objects in XY, XZ, or YZ planes
 * - Optional grid snapping
 * - Ghost preview during drag
 * - Drop validation
 * - Full event support
 *
 * @example
 * ```typescript
 * const dragController = new DragController(camera, {
 *   plane: 'xz',
 *   planeHeight: 0,
 *   snapToGrid: gridSystem,
 *   showGhost: true,
 *   validationFn: (obj, pos, coord) => !isOccupied(coord)
 * });
 *
 * dragController.on('drag-end', ({ object, finalPos, valid }) => {
 *   if (valid) {
 *     // Place object
 *   }
 * });
 *
 * // Start drag from pointer event
 * dragController.startDrag(object, event.clientX, event.clientY);
 * ```
 */
export class DragController extends EventEmitter {
  private camera: THREE.Camera;
  private config: Required<Omit<DragControllerConfig, 'snapToGrid' | 'validationFn'>> & {
    snapToGrid: DragSnapGrid | null;
    validationFn: DragControllerConfig['validationFn'];
  };

  private draggedObject: THREE.Object3D | null = null;
  private ghostObject: THREE.Object3D | null = null;
  private dragPlane: THREE.Plane;
  private raycaster: THREE.Raycaster;
  private startPosition: THREE.Vector3 = new THREE.Vector3();
  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  private _isDragging: boolean = false;

  constructor(camera: THREE.Camera, config: DragControllerConfig = {}) {
    super();

    this.camera = camera;
    this.config = {
      plane: config.plane ?? 'xz',
      planeHeight: config.planeHeight ?? 0,
      snapToGrid: config.snapToGrid ?? null,
      showGhost: config.showGhost ?? true,
      ghostOpacity: config.ghostOpacity ?? 0.5,
      validationFn: config.validationFn
    };

    this.raycaster = new THREE.Raycaster();
    this.dragPlane = this.createDragPlane();
  }

  /**
   * Create the constraint plane based on configuration
   */
  private createDragPlane(): THREE.Plane {
    const planeConfig = this.config.plane;

    if (planeConfig instanceof THREE.Plane) {
      return planeConfig;
    }

    // Create plane based on string configuration
    switch (planeConfig) {
      case 'xy':
        // XY plane (vertical, facing Z)
        return new THREE.Plane(new THREE.Vector3(0, 0, 1), -this.config.planeHeight);
      case 'yz':
        // YZ plane (vertical, facing X)
        return new THREE.Plane(new THREE.Vector3(1, 0, 0), -this.config.planeHeight);
      case 'xz':
      default:
        // XZ plane (horizontal, facing Y)
        return new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.config.planeHeight);
    }
  }

  /**
   * Calculate world position from screen coordinates using raycasting to plane
   */
  private screenToWorld(screenX: number, screenY: number, target: THREE.Vector3): boolean {
    // Convert screen coordinates to NDC
    const rect = (this.camera as any).viewport || { width: window.innerWidth, height: window.innerHeight };
    const mouse = new THREE.Vector2(
      (screenX / rect.width) * 2 - 1,
      -(screenY / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, this.camera);
    return this.raycaster.ray.intersectPlane(this.dragPlane, target) !== null;
  }

  /**
   * Create ghost object from original
   */
  private createGhost(object: THREE.Object3D): THREE.Object3D {
    const ghost = object.clone();

    // Apply transparency to all materials
    ghost.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material;
        if (Array.isArray(material)) {
          child.material = material.map((mat) => this.makeTransparent(mat));
        } else {
          child.material = this.makeTransparent(material);
        }
      }
    });

    return ghost;
  }

  /**
   * Create transparent material clone
   */
  private makeTransparent(material: THREE.Material): THREE.Material {
    const clone = material.clone();
    clone.transparent = true;
    clone.opacity = this.config.ghostOpacity;
    clone.depthWrite = false;
    return clone;
  }

  /**
   * Start dragging an object
   */
  public startDrag(object: THREE.Object3D, screenX: number, screenY: number): void {
    if (this._isDragging) {
      this.cancelDrag();
    }

    // Calculate start position
    if (!this.screenToWorld(screenX, screenY, this.startPosition)) {
      Logger.warn('DragController', 'Failed to calculate start position');
      return;
    }

    this.draggedObject = object;
    this._isDragging = true;
    this.currentPosition.copy(this.startPosition);

    // Create ghost if enabled
    if (this.config.showGhost && object.parent) {
      this.ghostObject = this.createGhost(object);
      this.ghostObject.position.copy(object.position);
      object.parent.add(this.ghostObject);

      // Hide original object
      object.visible = false;
    }

    // Emit drag start event
    this.emit('drag-start', {
      object,
      startPos: this.startPosition.clone()
    } as DragEventData);
  }

  /**
   * Update drag position
   */
  public updateDrag(screenX: number, screenY: number): void {
    if (!this._isDragging || !this.draggedObject) {
      return;
    }

    // Calculate new position
    if (!this.screenToWorld(screenX, screenY, this.currentPosition)) {
      return;
    }

    let targetPos = this.currentPosition.clone();
    let gridCoord: { x: number; y: number; z: number } | null = null;

    // Apply grid snapping if enabled
    if (this.config.snapToGrid) {
      const cellCoord = this.config.snapToGrid.worldToCell(targetPos);
      const snappedPos = this.config.snapToGrid.cellToWorld(cellCoord);
      targetPos = snappedPos;
      gridCoord = 'q' in cellCoord
        ? { x: cellCoord.q, y: cellCoord.r, z: cellCoord.s }
        : { x: cellCoord.x, y: cellCoord.y, z: 0 };
    }

    // Update ghost position
    if (this.ghostObject) {
      this.ghostObject.position.copy(targetPos);

      // Apply validation visual feedback if validation function exists
      if (this.config.validationFn) {
        const isValid = this.config.validationFn(this.draggedObject, targetPos, gridCoord ?? undefined);

        // Change ghost color based on validity
        this.ghostObject.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material;
            if (Array.isArray(material)) {
              material.forEach((mat) => {
                if ('color' in mat) {
                  (mat as any).color.setHex(isValid ? 0x00ff00 : 0xff0000);
                }
              });
            } else if ('color' in material) {
              (material as any).color.setHex(isValid ? 0x00ff00 : 0xff0000);
            }
          }
        });
      }
    }

    // Emit drag move event
    this.emit('drag-move', {
      object: this.draggedObject,
      currentPos: targetPos,
      gridCoord
    } as DragEventData);
  }

  /**
   * End drag and place object
   */
  public endDrag(): DragEventData | null {
    if (!this._isDragging || !this.draggedObject) {
      return null;
    }

    let finalPos = this.currentPosition.clone();
    let gridCoord: { x: number; y: number; z: number } | null = null;

    // Apply grid snapping
    if (this.config.snapToGrid) {
      const cellCoord = this.config.snapToGrid.worldToCell(finalPos);
      const snappedPos = this.config.snapToGrid.cellToWorld(cellCoord);
      finalPos = snappedPos;
      gridCoord = 'q' in cellCoord
        ? { x: cellCoord.q, y: cellCoord.r, z: cellCoord.s }
        : { x: cellCoord.x, y: cellCoord.y, z: 0 };
    }

    // Validate final position
    const isValid = this.config.validationFn
      ? this.config.validationFn(this.draggedObject, finalPos, gridCoord ?? undefined)
      : true;

    // Update object position if valid
    if (isValid) {
      this.draggedObject.position.copy(finalPos);
    }

    // Show original object
    this.draggedObject.visible = true;

    // Remove ghost
    if (this.ghostObject && this.ghostObject.parent) {
      this.ghostObject.parent.remove(this.ghostObject);
      this.ghostObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const material = child.material;
          if (Array.isArray(material)) {
            material.forEach((mat) => mat.dispose());
          } else {
            material.dispose();
          }
        }
      });
      this.ghostObject = null;
    }

    const result: DragEventData = {
      object: this.draggedObject,
      finalPos,
      gridCoord,
      valid: isValid
    };

    const draggedObject = this.draggedObject;
    this.draggedObject = null;
    this._isDragging = false;

    // Emit drag end event
    this.emit('drag-end', result);

    return result;
  }

  /**
   * Cancel drag without placing object
   */
  public cancelDrag(): void {
    if (!this._isDragging || !this.draggedObject) {
      return;
    }

    // Show original object
    this.draggedObject.visible = true;

    // Remove ghost
    if (this.ghostObject && this.ghostObject.parent) {
      this.ghostObject.parent.remove(this.ghostObject);
      this.ghostObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const material = child.material;
          if (Array.isArray(material)) {
            material.forEach((mat) => mat.dispose());
          } else {
            material.dispose();
          }
        }
      });
      this.ghostObject = null;
    }

    const draggedObject = this.draggedObject;
    this.draggedObject = null;
    this._isDragging = false;

    // Emit drag cancel event
    this.emit('drag-cancel', { object: draggedObject } as DragEventData);
  }

  /**
   * Check if currently dragging
   */
  public isDragging(): boolean {
    return this._isDragging;
  }

  /**
   * Get currently dragged object
   */
  public getDraggedObject(): THREE.Object3D | null {
    return this.draggedObject;
  }

  /**
   * Update camera reference (e.g., when switching cameras)
   */
  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<DragControllerConfig>): void {
    Object.assign(this.config, config);

    // Recreate drag plane if plane config changed
    if (config.plane !== undefined || config.planeHeight !== undefined) {
      this.dragPlane = this.createDragPlane();
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this._isDragging) {
      this.cancelDrag();
    }
    this.removeAllListeners();
  }
}
