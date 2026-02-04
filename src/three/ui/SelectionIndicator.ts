import * as THREE from 'three';
import { EventEmitter } from 'eventemitter3';

/**
 * Selection indicator types
 */
export type SelectionIndicatorType = 'ring' | 'square' | 'hex' | 'custom';

/**
 * Selection indicator configuration
 */
export interface SelectionIndicatorConfig {
  /** Indicator shape type */
  type?: SelectionIndicatorType;
  /** Size (radius for ring, side length for square/hex) */
  size?: number;
  /** Indicator color */
  color?: number;
  /** Indicator opacity */
  opacity?: number;
  /** Enable pulse animation */
  pulseEnabled?: boolean;
  /** Pulse animation speed */
  pulseSpeed?: number;
  /** Pulse scale range [min, max] */
  pulseScale?: [number, number];
  /** Enable rotation animation */
  rotateEnabled?: boolean;
  /** Rotation speed (radians/second) */
  rotateSpeed?: number;
  /** Y offset from ground to prevent z-fighting */
  groundOffset?: number;
  /** Allow multiple selections */
  multiSelect?: boolean;
  /** Custom geometry for 'custom' type */
  customGeometry?: THREE.BufferGeometry;
}

/**
 * Events emitted by SelectionIndicator
 */
export interface SelectionIndicatorEvents {
  selected: (object: THREE.Object3D) => void;
  deselected: (object: THREE.Object3D) => void;
  'selection-changed': (objects: THREE.Object3D[]) => void;
}

/**
 * Selection indicator for highlighting selected 3D objects
 * Shows a visual indicator (ring, square, hex) at the base of selected objects
 */
export class SelectionIndicator extends THREE.Group {
  private config: Required<SelectionIndicatorConfig>;
  private emitter: EventEmitter<SelectionIndicatorEvents>;
  private selectedObjects: Map<THREE.Object3D, THREE.Mesh>;
  private material: THREE.MeshBasicMaterial;
  private baseGeometry: THREE.BufferGeometry;
  private pulseTime: number = 0;

  constructor(config: SelectionIndicatorConfig = {}) {
    super();

    // Set defaults
    this.config = {
      type: config.type ?? 'ring',
      size: config.size ?? 1,
      color: config.color ?? 0x00ff00,
      opacity: config.opacity ?? 0.6,
      pulseEnabled: config.pulseEnabled ?? true,
      pulseSpeed: config.pulseSpeed ?? 2,
      pulseScale: config.pulseScale ?? [1.0, 1.1],
      rotateEnabled: config.rotateEnabled ?? false,
      rotateSpeed: config.rotateSpeed ?? 1,
      groundOffset: config.groundOffset ?? 0.01,
      multiSelect: config.multiSelect ?? false,
      customGeometry: config.customGeometry ?? new THREE.RingGeometry(0.8, 1, 32),
    };

    this.emitter = new EventEmitter();
    this.selectedObjects = new Map();

    // Create material
    this.material = new THREE.MeshBasicMaterial({
      color: this.config.color,
      opacity: this.config.opacity,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
    });

    // Create base geometry based on type
    this.baseGeometry = this.createGeometry();

    this.name = 'SelectionIndicator';
  }

  /**
   * Create geometry based on indicator type
   */
  private createGeometry(): THREE.BufferGeometry {
    const size = this.config.size;

    switch (this.config.type) {
      case 'ring':
        return new THREE.RingGeometry(size * 0.8, size, 32);

      case 'square':
        return new THREE.PlaneGeometry(size * 2, size * 2);

      case 'hex':
        return this.createHexGeometry(size);

      case 'custom':
        return this.config.customGeometry;

      default:
        return new THREE.RingGeometry(size * 0.8, size, 32);
    }
  }

  /**
   * Create hexagon geometry
   */
  private createHexGeometry(size: number): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const sides = 6;
    const angleStep = (Math.PI * 2) / sides;

    // Create hexagon path
    for (let i = 0; i <= sides; i++) {
      const angle = angleStep * i;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }

    // Create inner hole for ring effect
    const hole = new THREE.Path();
    const innerSize = size * 0.8;
    for (let i = 0; i <= sides; i++) {
      const angle = angleStep * i;
      const x = Math.cos(angle) * innerSize;
      const y = Math.sin(angle) * innerSize;

      if (i === 0) {
        hole.moveTo(x, y);
      } else {
        hole.lineTo(x, y);
      }
    }
    shape.holes.push(hole);

    return new THREE.ShapeGeometry(shape);
  }

  /**
   * Calculate object's ground position
   */
  private getGroundPosition(object: THREE.Object3D): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const height = box.max.y - box.min.y;
    const groundY = center.y - height / 2 + this.config.groundOffset;

    return new THREE.Vector3(center.x, groundY, center.z);
  }

  /**
   * Create indicator mesh for an object
   */
  private createIndicatorMesh(object: THREE.Object3D): THREE.Mesh {
    const mesh = new THREE.Mesh(this.baseGeometry, this.material);
    mesh.rotation.x = -Math.PI / 2; // Lay flat on ground
    mesh.renderOrder = 999; // Render on top

    const groundPos = this.getGroundPosition(object);
    mesh.position.copy(groundPos);

    return mesh;
  }

  /**
   * Select an object (clears previous selection if multiSelect is false)
   */
  select(object: THREE.Object3D): void {
    if (!this.config.multiSelect) {
      this.clearSelection();
    }

    if (!this.selectedObjects.has(object)) {
      const indicator = this.createIndicatorMesh(object);
      this.add(indicator);
      this.selectedObjects.set(object, indicator);

      this.emitter.emit('selected', object);
      this.emitter.emit('selection-changed', this.getSelection());
    }
  }

  /**
   * Deselect the current object (if single select) or all objects
   */
  deselect(): void {
    if (this.config.multiSelect) {
      this.clearSelection();
    } else {
      const objects = Array.from(this.selectedObjects.keys());
      if (objects.length > 0) {
        this.removeFromSelection(objects[0]);
      }
    }
  }

  /**
   * Add object to selection (for multiSelect mode)
   */
  addToSelection(object: THREE.Object3D): void {
    if (!this.selectedObjects.has(object)) {
      const indicator = this.createIndicatorMesh(object);
      this.add(indicator);
      this.selectedObjects.set(object, indicator);

      this.emitter.emit('selected', object);
      this.emitter.emit('selection-changed', this.getSelection());
    }
  }

  /**
   * Remove object from selection
   */
  removeFromSelection(object: THREE.Object3D): void {
    const indicator = this.selectedObjects.get(object);
    if (indicator) {
      this.remove(indicator);
      this.selectedObjects.delete(object);

      this.emitter.emit('deselected', object);
      this.emitter.emit('selection-changed', this.getSelection());
    }
  }

  /**
   * Get all selected objects
   */
  getSelection(): THREE.Object3D[] {
    return Array.from(this.selectedObjects.keys());
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    const objects = Array.from(this.selectedObjects.keys());

    for (const object of objects) {
      const indicator = this.selectedObjects.get(object);
      if (indicator) {
        this.remove(indicator);
        this.emitter.emit('deselected', object);
      }
    }

    this.selectedObjects.clear();
    this.emitter.emit('selection-changed', []);
  }

  /**
   * Check if object is selected
   */
  isSelected(object: THREE.Object3D): boolean {
    return this.selectedObjects.has(object);
  }

  /**
   * Set indicator color
   */
  setColor(color: number): void {
    this.config.color = color;
    this.material.color.setHex(color);
  }

  /**
   * Set indicator size
   */
  setSize(size: number): void {
    this.config.size = size;

    // Recreate geometry with new size
    this.baseGeometry.dispose();
    this.baseGeometry = this.createGeometry();

    // Update all existing indicators
    const entries = Array.from(this.selectedObjects.entries());
    this.clearSelection();

    for (const [object] of entries) {
      this.select(object);
    }
  }

  /**
   * Update animations (call each frame)
   */
  update(deltaTime: number): void {
    if (this.selectedObjects.size === 0) return;

    // Update pulse animation
    if (this.config.pulseEnabled) {
      this.pulseTime += deltaTime * this.config.pulseSpeed;
      const pulseValue =
        Math.sin(this.pulseTime) * 0.5 + 0.5; // 0 to 1
      const [minScale, maxScale] = this.config.pulseScale;
      const scale = minScale + (maxScale - minScale) * pulseValue;

      for (const indicator of this.selectedObjects.values()) {
        indicator.scale.setScalar(scale);
      }
    }

    // Update rotation animation
    if (this.config.rotateEnabled) {
      const rotationDelta = deltaTime * this.config.rotateSpeed;

      for (const indicator of this.selectedObjects.values()) {
        indicator.rotation.z += rotationDelta;
      }
    }

    // Update positions to follow objects
    for (const [object, indicator] of this.selectedObjects.entries()) {
      const groundPos = this.getGroundPosition(object);
      indicator.position.copy(groundPos);
    }
  }

  /**
   * Add event listener
   */
  on<K extends keyof SelectionIndicatorEvents>(
    event: K,
    listener: SelectionIndicatorEvents[K]
  ): this {
    this.emitter.on(event, listener as any);
    return this;
  }

  /**
   * Remove event listener
   */
  off<K extends keyof SelectionIndicatorEvents>(
    event: K,
    listener: SelectionIndicatorEvents[K]
  ): this {
    this.emitter.off(event, listener as any);
    return this;
  }

  /**
   * Add one-time event listener
   */
  once<K extends keyof SelectionIndicatorEvents>(
    event: K,
    listener: SelectionIndicatorEvents[K]
  ): this {
    this.emitter.once(event, listener as any);
    return this;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.clearSelection();
    this.baseGeometry.dispose();
    this.material.dispose();
    this.emitter.removeAllListeners();
  }
}
