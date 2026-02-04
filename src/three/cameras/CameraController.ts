import * as THREE from 'three';
import { EventEmitter } from 'eventemitter3';

/**
 * Configuration options for CameraController
 */
export interface CameraControllerConfig {
  /** Enable drag to pan (default: true) */
  enablePan?: boolean;
  /** Enable pinch/scroll to zoom (default: true) */
  enableZoom?: boolean;
  /** Enable rotation controls (default: false) */
  enableRotate?: boolean;
  /** Pan movement speed multiplier (default: 1) */
  panSpeed?: number;
  /** Zoom speed multiplier (default: 1) */
  zoomSpeed?: number;
  /** Rotation speed multiplier (default: 1) */
  rotateSpeed?: number;
  /** Zoom range [min, max] (default: [0.5, 5]) */
  zoomRange?: [number, number];
  /** Pan boundaries { minX, maxX, minZ, maxZ } (default: null - no bounds) */
  bounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  } | null;
  /** Smooth interpolation factor 0-1 (default: 0.1) */
  smoothing?: number;
  /** Enable momentum/inertia on release (default: true) */
  momentum?: boolean;
  /** Momentum decay rate (default: 0.92) */
  momentumDecay?: number;
}

/**
 * Events emitted by CameraController
 */
interface CameraControllerEvents {
  pan: [x: number, z: number];
  zoom: [zoom: number];
  rotate: [angle: number];
}

/**
 * Input state tracking
 */
interface InputState {
  isPointerDown: boolean;
  pointerCount: number;
  lastPointerX: number;
  lastPointerY: number;
  lastPinchDistance: number;
  velocityX: number;
  velocityZ: number;
}

/**
 * CameraController - Universal camera controller for Three.js cameras
 *
 * Works with any THREE.Camera including IsometricCamera and StrategyCamera.
 * Provides pan, zoom, and optional rotation controls with smooth interpolation,
 * momentum, and boundary enforcement.
 *
 * @example
 * ```typescript
 * const controller = new CameraController(camera, {
 *   enablePan: true,
 *   enableZoom: true,
 *   panSpeed: 1.5,
 *   zoomRange: [0.5, 3],
 *   bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
 *   smoothing: 0.15,
 *   momentum: true
 * });
 *
 * // In game loop
 * controller.update(deltaTime);
 *
 * // Pan to position
 * controller.setTarget(10, 20);
 *
 * // Clean up
 * controller.dispose();
 * ```
 */
export class CameraController extends EventEmitter<CameraControllerEvents> {
  private camera: THREE.Camera;
  private config: Required<CameraControllerConfig>;
  private enabled: boolean = true;

  // Target state (what we're lerping toward)
  private targetX: number = 0;
  private targetZ: number = 0;
  private targetZoom: number = 1;
  private targetRotation: number = 0;

  // Current state (smoothed)
  private currentX: number = 0;
  private currentZ: number = 0;
  private currentZoom: number = 1;
  private currentRotation: number = 0;

  // Initial state (for reset)
  private initialX: number = 0;
  private initialZ: number = 0;
  private initialZoom: number = 1;
  private initialRotation: number = 0;

  // Input tracking
  private input: InputState = {
    isPointerDown: false,
    pointerCount: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    lastPinchDistance: 0,
    velocityX: 0,
    velocityZ: 0
  };

  // DOM element for event listeners
  private domElement: HTMLElement | null = null;

  // Bound event handlers for cleanup
  private boundHandlers = {
    pointerDown: this.onPointerDown.bind(this),
    pointerMove: this.onPointerMove.bind(this),
    pointerUp: this.onPointerUp.bind(this),
    wheel: this.onWheel.bind(this),
    touchStart: this.onTouchStart.bind(this),
    touchMove: this.onTouchMove.bind(this),
    touchEnd: this.onTouchEnd.bind(this)
  };

  constructor(camera: THREE.Camera, config: CameraControllerConfig = {}) {
    super();

    this.camera = camera;

    // Merge config with defaults
    this.config = {
      enablePan: config.enablePan ?? true,
      enableZoom: config.enableZoom ?? true,
      enableRotate: config.enableRotate ?? false,
      panSpeed: config.panSpeed ?? 1,
      zoomSpeed: config.zoomSpeed ?? 1,
      rotateSpeed: config.rotateSpeed ?? 1,
      zoomRange: config.zoomRange ?? [0.5, 5],
      bounds: config.bounds ?? null,
      smoothing: Math.max(0, Math.min(1, config.smoothing ?? 0.1)),
      momentum: config.momentum ?? true,
      momentumDecay: Math.max(0, Math.min(1, config.momentumDecay ?? 0.92))
    };

    // Initialize from camera position
    this.initializeFromCamera();

    // Auto-detect DOM element from renderer
    if (typeof document !== 'undefined') {
      this.attachToElement(document.body);
    }
  }

  /**
   * Initialize controller state from current camera position
   */
  private initializeFromCamera(): void {
    this.currentX = this.targetX = this.initialX = this.camera.position.x;
    this.currentZ = this.targetZ = this.initialZ = this.camera.position.z;

    // Try to get zoom from camera
    if ('zoom' in this.camera && typeof this.camera.zoom === 'number') {
      this.currentZoom = this.targetZoom = this.initialZoom = this.camera.zoom;
    }

    // Try to get rotation from camera
    this.currentRotation = this.targetRotation = this.initialRotation = this.camera.rotation.y;
  }

  /**
   * Attach event listeners to a DOM element
   */
  attachToElement(element: HTMLElement): void {
    if (this.domElement) {
      this.detachFromElement();
    }

    this.domElement = element;

    // Mouse events
    element.addEventListener('pointerdown', this.boundHandlers.pointerDown);
    element.addEventListener('pointermove', this.boundHandlers.pointerMove);
    element.addEventListener('pointerup', this.boundHandlers.pointerUp);
    element.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });

    // Touch events
    element.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
    element.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
    element.addEventListener('touchend', this.boundHandlers.touchEnd);
  }

  /**
   * Remove event listeners from current DOM element
   */
  private detachFromElement(): void {
    if (!this.domElement) return;

    const element = this.domElement;
    element.removeEventListener('pointerdown', this.boundHandlers.pointerDown);
    element.removeEventListener('pointermove', this.boundHandlers.pointerMove);
    element.removeEventListener('pointerup', this.boundHandlers.pointerUp);
    element.removeEventListener('wheel', this.boundHandlers.wheel);
    element.removeEventListener('touchstart', this.boundHandlers.touchStart);
    element.removeEventListener('touchmove', this.boundHandlers.touchMove);
    element.removeEventListener('touchend', this.boundHandlers.touchEnd);

    this.domElement = null;
  }

  /**
   * Handle pointer down event
   */
  private onPointerDown(event: PointerEvent): void {
    if (!this.enabled || !this.config.enablePan) return;

    this.input.isPointerDown = true;
    this.input.lastPointerX = event.clientX;
    this.input.lastPointerY = event.clientY;
    this.input.velocityX = 0;
    this.input.velocityZ = 0;
  }

  /**
   * Handle pointer move event
   */
  private onPointerMove(event: PointerEvent): void {
    if (!this.enabled || !this.input.isPointerDown || !this.config.enablePan) return;

    const deltaX = event.clientX - this.input.lastPointerX;
    const deltaY = event.clientY - this.input.lastPointerY;

    // Calculate world-space pan movement
    const panScale = this.calculatePanScale();
    const moveX = -deltaX * panScale * this.config.panSpeed;
    const moveZ = -deltaY * panScale * this.config.panSpeed;

    this.targetX += moveX;
    this.targetZ += moveZ;

    // Track velocity for momentum
    if (this.config.momentum) {
      this.input.velocityX = moveX * 0.3;
      this.input.velocityZ = moveZ * 0.3;
    }

    this.input.lastPointerX = event.clientX;
    this.input.lastPointerY = event.clientY;

    this.applyBounds();
  }

  /**
   * Handle pointer up event
   */
  private onPointerUp(): void {
    this.input.isPointerDown = false;
  }

  /**
   * Handle wheel event (zoom)
   */
  private onWheel(event: WheelEvent): void {
    if (!this.enabled || !this.config.enableZoom) return;

    event.preventDefault();

    const delta = event.deltaY;
    const zoomDelta = -delta * 0.001 * this.config.zoomSpeed;

    this.targetZoom = THREE.MathUtils.clamp(
      this.targetZoom + zoomDelta,
      this.config.zoomRange[0],
      this.config.zoomRange[1]
    );
  }

  /**
   * Handle touch start event
   */
  private onTouchStart(event: TouchEvent): void {
    if (!this.enabled) return;

    event.preventDefault();

    this.input.pointerCount = event.touches.length;

    if (event.touches.length === 1 && this.config.enablePan) {
      // Single touch - pan
      this.input.isPointerDown = true;
      this.input.lastPointerX = event.touches[0].clientX;
      this.input.lastPointerY = event.touches[0].clientY;
      this.input.velocityX = 0;
      this.input.velocityZ = 0;
    } else if (event.touches.length === 2 && this.config.enableZoom) {
      // Two fingers - pinch zoom
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.input.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  /**
   * Handle touch move event
   */
  private onTouchMove(event: TouchEvent): void {
    if (!this.enabled) return;

    event.preventDefault();

    if (event.touches.length === 1 && this.input.isPointerDown && this.config.enablePan) {
      // Single touch - pan
      const deltaX = event.touches[0].clientX - this.input.lastPointerX;
      const deltaY = event.touches[0].clientY - this.input.lastPointerY;

      const panScale = this.calculatePanScale();
      const moveX = -deltaX * panScale * this.config.panSpeed;
      const moveZ = -deltaY * panScale * this.config.panSpeed;

      this.targetX += moveX;
      this.targetZ += moveZ;

      if (this.config.momentum) {
        this.input.velocityX = moveX * 0.3;
        this.input.velocityZ = moveZ * 0.3;
      }

      this.input.lastPointerX = event.touches[0].clientX;
      this.input.lastPointerY = event.touches[0].clientY;

      this.applyBounds();
    } else if (event.touches.length === 2 && this.config.enableZoom) {
      // Two fingers - pinch zoom
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (this.input.lastPinchDistance > 0) {
        const delta = distance - this.input.lastPinchDistance;
        const zoomDelta = delta * 0.01 * this.config.zoomSpeed;

        this.targetZoom = THREE.MathUtils.clamp(
          this.targetZoom + zoomDelta,
          this.config.zoomRange[0],
          this.config.zoomRange[1]
        );
      }

      this.input.lastPinchDistance = distance;
    }
  }

  /**
   * Handle touch end event
   */
  private onTouchEnd(event: TouchEvent): void {
    this.input.isPointerDown = false;
    this.input.pointerCount = event.touches.length;

    if (event.touches.length === 0) {
      this.input.lastPinchDistance = 0;
    }
  }

  /**
   * Calculate pan scale based on camera distance/zoom
   */
  private calculatePanScale(): number {
    // For orthographic cameras (zoom-based)
    if ('zoom' in this.camera && typeof this.camera.zoom === 'number') {
      const zoom = this.camera.zoom || 1;
      return 1 / (zoom * 100);
    }

    // For perspective cameras (distance-based)
    const distance = this.camera.position.length();
    return distance / 500;
  }

  /**
   * Apply boundary constraints to target position
   */
  private applyBounds(): void {
    if (!this.config.bounds) return;

    const { minX, maxX, minZ, maxZ } = this.config.bounds;

    // Hard clamp
    this.targetX = THREE.MathUtils.clamp(this.targetX, minX, maxX);
    this.targetZ = THREE.MathUtils.clamp(this.targetZ, minZ, maxZ);
  }

  /**
   * Update controller (call this in your game loop)
   */
  update(deltaTime: number): void {
    if (!this.enabled) return;

    // Apply momentum
    if (this.config.momentum && !this.input.isPointerDown) {
      if (Math.abs(this.input.velocityX) > 0.001 || Math.abs(this.input.velocityZ) > 0.001) {
        this.targetX += this.input.velocityX;
        this.targetZ += this.input.velocityZ;

        this.input.velocityX *= this.config.momentumDecay;
        this.input.velocityZ *= this.config.momentumDecay;

        this.applyBounds();
      }
    }

    // Smooth interpolation
    const lerpFactor = 1 - Math.pow(1 - this.config.smoothing, deltaTime * 60);

    const lastX = this.currentX;
    const lastZ = this.currentZ;
    const lastZoom = this.currentZoom;

    this.currentX = THREE.MathUtils.lerp(this.currentX, this.targetX, lerpFactor);
    this.currentZ = THREE.MathUtils.lerp(this.currentZ, this.targetZ, lerpFactor);
    this.currentZoom = THREE.MathUtils.lerp(this.currentZoom, this.targetZoom, lerpFactor);
    this.currentRotation = THREE.MathUtils.lerp(this.currentRotation, this.targetRotation, lerpFactor);

    // Update camera position
    const deltaX = this.currentX - lastX;
    const deltaZ = this.currentZ - lastZ;

    if (Math.abs(deltaX) > 0.001 || Math.abs(deltaZ) > 0.001) {
      this.camera.position.x = this.currentX;
      this.camera.position.z = this.currentZ;
      this.emit('pan', this.currentX, this.currentZ);
    }

    // Update camera zoom
    if (Math.abs(this.currentZoom - lastZoom) > 0.001) {
      if ('zoom' in this.camera && 'updateProjectionMatrix' in this.camera) {
        (this.camera as THREE.OrthographicCamera).zoom = this.currentZoom;
        (this.camera as THREE.OrthographicCamera).updateProjectionMatrix();
      } else if (this.camera instanceof THREE.PerspectiveCamera) {
        // For perspective cameras, adjust FOV instead
        const baseFOV = 60;
        this.camera.fov = baseFOV / this.currentZoom;
        this.camera.updateProjectionMatrix();
      }
      this.emit('zoom', this.currentZoom);
    }

    // Update camera rotation (if enabled)
    if (this.config.enableRotate && Math.abs(this.currentRotation - this.camera.rotation.y) > 0.001) {
      this.camera.rotation.y = this.currentRotation;
      this.emit('rotate', this.currentRotation);
    }
  }

  /**
   * Set target pan position
   */
  setTarget(x: number, z: number): void {
    this.targetX = x;
    this.targetZ = z;
    this.applyBounds();
  }

  /**
   * Set target zoom level
   */
  setZoom(zoom: number): void {
    this.targetZoom = THREE.MathUtils.clamp(
      zoom,
      this.config.zoomRange[0],
      this.config.zoomRange[1]
    );
  }

  /**
   * Set target rotation angle (radians)
   */
  setRotation(angle: number): void {
    this.targetRotation = angle;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.targetX = this.currentX = this.initialX;
    this.targetZ = this.currentZ = this.initialZ;
    this.targetZoom = this.currentZoom = this.initialZoom;
    this.targetRotation = this.currentRotation = this.initialRotation;

    this.input.velocityX = 0;
    this.input.velocityZ = 0;

    this.camera.position.x = this.currentX;
    this.camera.position.z = this.currentZ;

    if ('zoom' in this.camera && 'updateProjectionMatrix' in this.camera) {
      (this.camera as THREE.OrthographicCamera).zoom = this.currentZoom;
      (this.camera as THREE.OrthographicCamera).updateProjectionMatrix();
    }
  }

  /**
   * Enable controller
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable controller
   */
  disable(): void {
    this.enabled = false;
    this.input.isPointerDown = false;
    this.input.velocityX = 0;
    this.input.velocityZ = 0;
  }

  /**
   * Check if controller is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current pan position
   */
  getPosition(): { x: number; z: number } {
    return { x: this.currentX, z: this.currentZ };
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    return this.currentZoom;
  }

  /**
   * Get current rotation angle
   */
  getRotation(): number {
    return this.currentRotation;
  }

  /**
   * Update controller configuration
   */
  updateConfig(config: Partial<CameraControllerConfig>): void {
    if (config.enablePan !== undefined) this.config.enablePan = config.enablePan;
    if (config.enableZoom !== undefined) this.config.enableZoom = config.enableZoom;
    if (config.enableRotate !== undefined) this.config.enableRotate = config.enableRotate;
    if (config.panSpeed !== undefined) this.config.panSpeed = config.panSpeed;
    if (config.zoomSpeed !== undefined) this.config.zoomSpeed = config.zoomSpeed;
    if (config.rotateSpeed !== undefined) this.config.rotateSpeed = config.rotateSpeed;
    if (config.zoomRange !== undefined) this.config.zoomRange = config.zoomRange;
    if (config.bounds !== undefined) this.config.bounds = config.bounds;
    if (config.smoothing !== undefined) {
      this.config.smoothing = Math.max(0, Math.min(1, config.smoothing));
    }
    if (config.momentum !== undefined) this.config.momentum = config.momentum;
    if (config.momentumDecay !== undefined) {
      this.config.momentumDecay = Math.max(0, Math.min(1, config.momentumDecay));
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<CameraControllerConfig> {
    return { ...this.config };
  }

  /**
   * Dispose of resources and remove event listeners
   */
  dispose(): void {
    this.detachFromElement();
    this.removeAllListeners();
  }
}
