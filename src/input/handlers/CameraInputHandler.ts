import { EventEmitter } from 'eventemitter3';
import {
  CameraInputHandler,
  RawInputEvent,
  InputContext,
  GameAction,
  InputHandler
} from '../../contracts/Input';
import { Point } from '../../contracts/UI';

/**
 * Camera control configuration
 */
interface CameraInputConfig {
  panSensitivity: number;
  zoomSensitivity: number; 
  rotationSensitivity: number;
  panEnabled: boolean;
  zoomEnabled: boolean;
  rotationEnabled: boolean;
  invertPanX: boolean;
  invertPanY: boolean;
  invertZoom: boolean;
  invertRotation: boolean;
  smoothing: boolean;
  smoothingFactor: number;
  minZoom: number;
  maxZoom: number;
  panDeadZone: number;
  zoomDeadZone: number;
  rotationDeadZone: number;
  touchGestureEnabled: boolean;
  mouseWheelZoom: boolean;
  rightClickPan: boolean;
  middleClickPan: boolean;
}

/**
 * Camera input state
 */
interface CameraInputState {
  panDelta: Point;
  zoomDelta: number;
  rotationDelta: number;
  isPanning: boolean;
  isZooming: boolean;
  isRotating: boolean;
  lastMousePosition: Point;
  lastTouchPositions: Point[];
  lastPinchDistance: number;
  lastRotationAngle: number;
}

/**
 * Specialized input handler for camera controls
 * Supports pan, zoom, rotation with mouse, touch, and gamepad input
 */
export class GameByteCameraInputHandler extends EventEmitter implements CameraInputHandler, InputHandler {
  public readonly name: string = 'camera-input';
  public readonly priority: number = 80;
  public readonly supportedContexts: InputContext[] = ['gameplay', 'menu'];

  private active: boolean = false;
  private context: InputContext = 'gameplay';
  private config: CameraInputConfig;
  private state: CameraInputState;
  
  // Input tracking
  private pressedKeys: Set<string> = new Set();
  private pressedMouseButtons: Set<number> = new Set();
  private activeTouches: Map<number, Point> = new Map();
  
  // Smoothing
  private targetPanDelta: Point = { x: 0, y: 0 };
  private targetZoomDelta: number = 0;
  private targetRotationDelta: number = 0;

  constructor(config?: Partial<CameraInputConfig>) {
    super();
    
    this.config = {
      panSensitivity: 1.0,
      zoomSensitivity: 1.0,
      rotationSensitivity: 1.0,
      panEnabled: true,
      zoomEnabled: true,
      rotationEnabled: true,
      invertPanX: false,
      invertPanY: false,
      invertZoom: false,
      invertRotation: false,
      smoothing: true,
      smoothingFactor: 0.1,
      minZoom: 0.1,
      maxZoom: 10.0,
      panDeadZone: 0.05,
      zoomDeadZone: 0.01,
      rotationDeadZone: 0.01,
      touchGestureEnabled: true,
      mouseWheelZoom: true,
      rightClickPan: true,
      middleClickPan: true,
      ...config
    };
    
    this.state = {
      panDelta: { x: 0, y: 0 },
      zoomDelta: 0,
      rotationDelta: 0,
      isPanning: false,
      isZooming: false,
      isRotating: false,
      lastMousePosition: { x: 0, y: 0 },
      lastTouchPositions: [],
      lastPinchDistance: 0,
      lastRotationAngle: 0
    };
  }

  /**
   * Process raw input event
   */
  public handleInput(event: RawInputEvent): void {
    if (!this.active) return;

    // Set deviceType for compatibility
    if (!event.deviceType) {
      event.deviceType = event.device;
    }

    // Process different input types
    switch (event.deviceType || event.device) {
      case 'keyboard':
        this.handleKeyboardInput(event);
        break;
        
      case 'mouse':
        this.handleMouseInput(event);
        break;
        
      case 'touch':
        this.handleTouchInput(event);
        break;
        
      case 'gamepad':
        this.handleGamepadInput(event);
        break;
    }

    // Map to game actions
    const action = this.getActionFromInput(event);
    if (action) {
      this.emit('action', action, event);
    }
  }

  /**
   * Get camera pan delta
   */
  public getPanDelta(): Point {
    return { ...this.state.panDelta };
  }

  /**
   * Get camera zoom delta
   */
  public getZoomDelta(): number {
    return this.state.zoomDelta;
  }

  /**
   * Get camera rotation delta
   */
  public getRotationDelta(): number {
    return this.state.rotationDelta;
  }

  /**
   * Check if camera is currently panning
   */
  public isPanning(): boolean {
    return this.state.isPanning;
  }

  /**
   * Check if camera is currently zooming
   */
  public isZooming(): boolean {
    return this.state.isZooming;
  }

  /**
   * Check if camera is currently rotating
   */
  public isRotating(): boolean {
    return this.state.isRotating;
  }

  /**
   * Set pan sensitivity
   */
  public setPanSensitivity(sensitivity: number): void {
    this.config.panSensitivity = sensitivity;
  }

  /**
   * Set zoom sensitivity
   */
  public setZoomSensitivity(sensitivity: number): void {
    this.config.zoomSensitivity = sensitivity;
  }

  /**
   * Set rotation sensitivity
   */
  public setRotationSensitivity(sensitivity: number): void {
    this.config.rotationSensitivity = sensitivity;
  }

  /**
   * Set invert controls
   */
  public setInvertControls(pan: boolean, zoom: boolean, rotation: boolean): void {
    this.config.invertPanX = pan;
    this.config.invertPanY = pan;
    this.config.invertZoom = zoom;
    this.config.invertRotation = rotation;
  }

  /**
   * Set pan limits
   */
  public setPanLimits(bounds: { min: Point; max: Point }): void {
    // Store pan limits in config (would need to extend config interface)
    // For now, just emit event to notify about limits
    this.emit('pan-limits-set', bounds);
  }

  /**
   * Set zoom limits
   */
  public setZoomLimits(min: number, max: number): void {
    this.config.minZoom = min;
    this.config.maxZoom = max;
  }

  /**
   * Set rotation limits
   */
  public setRotationLimits(min: number, max: number): void {
    // Store rotation limits (would need to extend config interface)
    // For now, just emit event to notify about limits
    this.emit('rotation-limits-set', { min, max });
  }

  /**
   * Check if handler is enabled (InputHandler interface)
   */
  public isEnabled(): boolean {
    return this.active;
  }

  /**
   * Set camera sensitivity
   */
  public setSensitivity(pan: number, zoom: number, rotation: number): void {
    this.config.panSensitivity = pan;
    this.config.zoomSensitivity = zoom;
    this.config.rotationSensitivity = rotation;
  }

  /**
   * Set handler enabled state (InputHandler interface)
   */
  public setEnabled(enabled: boolean): void {
    this.active = enabled;
    if (!enabled) {
      this.resetState();
    }
  }

  /**
   * Enable/disable camera controls
   */
  public setEnabledControls(pan: boolean, zoom: boolean, rotation: boolean): void {
    this.config.panEnabled = pan;
    this.config.zoomEnabled = zoom;
    this.config.rotationEnabled = rotation;
  }

  /**
   * Update handler state
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    // Update camera controls based on input
    this.updateKeyboardControls();
    this.updateGamepadControls();
    
    // Apply smoothing
    if (this.config.smoothing) {
      this.applySmoothing(deltaTime);
    } else {
      this.state.panDelta = { ...this.targetPanDelta };
      this.state.zoomDelta = this.targetZoomDelta;
      this.state.rotationDelta = this.targetRotationDelta;
    }
    
    // Apply dead zones
    this.applyDeadZones();
    
    // Apply sensitivity and inversion
    this.applySensitivityAndInversion();
    
    // Emit camera events if there's movement
    this.emitCameraEvents();
    
    // Reset deltas for next frame
    this.resetTargetDeltas();
  }

  /**
   * Check if handler can process this event
   */
  public canHandle(event: RawInputEvent, context: InputContext): boolean {
    return this.active && this.supportedContexts.includes(context);
  }

  /**
   * Activate handler for context
   */
  public activate(context: InputContext): void {
    this.active = true;
    this.context = context;
    this.resetState();
    this.emit('activated', context);
  }

  /**
   * Deactivate handler
   */
  public deactivate(): void {
    this.active = false;
    this.resetState();
    this.emit('deactivated');
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.deactivate();
    this.removeAllListeners();
  }

  /**
   * Configure handler settings
   */
  public configure(config: Partial<CameraInputConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle keyboard input
   */
  private handleKeyboardInput(event: RawInputEvent): void {
    if (!event.key) return;

    const key = event.key;
    
    if (event.type === 'key-down') {
      this.pressedKeys.add(key);
    } else if (event.type === 'key-up') {
      this.pressedKeys.delete(key);
    }
  }

  /**
   * Handle mouse input
   */
  private handleMouseInput(event: RawInputEvent): void {
    if (!event.position) return;

    const position = event.position;
    
    switch (event.type) {
      case 'down':
        if (event.button !== undefined) {
          this.pressedMouseButtons.add(event.button);
          this.state.lastMousePosition = { ...position };
          
          if (event.button === 2 && this.config.rightClickPan) { // Right click
            this.state.isPanning = true;
          } else if (event.button === 1 && this.config.middleClickPan) { // Middle click
            this.state.isPanning = true;
          }
        }
        break;
        
      case 'up':
        if (event.button !== undefined) {
          this.pressedMouseButtons.delete(event.button);
          
          if (event.button === 2 || event.button === 1) {
            this.state.isPanning = false;
          }
        }
        break;
        
      case 'move':
        if (this.state.isPanning && this.config.panEnabled) {
          const deltaX = position.x - this.state.lastMousePosition.x;
          const deltaY = position.y - this.state.lastMousePosition.y;
          
          this.targetPanDelta.x += deltaX;
          this.targetPanDelta.y += deltaY;
        }
        
        this.state.lastMousePosition = { ...position };
        break;
        
      default:
        // Handle wheel events for zoom
        if (event.delta && this.config.mouseWheelZoom && this.config.zoomEnabled) {
          this.targetZoomDelta += event.delta.y * 0.001;
        }
        break;
    }
  }

  /**
   * Handle touch input
   */
  private handleTouchInput(event: RawInputEvent): void {
    if (!event.position || event.pointerId === undefined) return;

    const touchId = event.pointerId;
    const position = event.position;
    
    switch (event.type) {
      case 'down':
        this.activeTouches.set(touchId, position);
        this.updateTouchGestures();
        break;
        
      case 'move':
        if (this.activeTouches.has(touchId)) {
          this.activeTouches.set(touchId, position);
          this.updateTouchGestures();
        }
        break;
        
      case 'up':
      case 'cancel':
        this.activeTouches.delete(touchId);
        this.updateTouchGestures();
        break;
    }
  }

  /**
   * Handle gamepad input
   */
  private handleGamepadInput(event: RawInputEvent): void {
    if (event.type === 'gamepad-axis' && event.gamepadAxis !== undefined && event.axisValue !== undefined) {
      const axis = event.gamepadAxis;
      const value = event.axisValue;
      
      switch (axis) {
        case 2: // Right stick X - Camera pan X
          if (this.config.panEnabled) {
            this.targetPanDelta.x += value * 2; // Scale for gamepad
          }
          break;
          
        case 3: // Right stick Y - Camera pan Y  
          if (this.config.panEnabled) {
            this.targetPanDelta.y += value * 2;
          }
          break;
          
        case 4: // Left trigger - Zoom out
          if (this.config.zoomEnabled && value > 0.1) {
            this.targetZoomDelta += value * 0.02;
          }
          break;
          
        case 5: // Right trigger - Zoom in
          if (this.config.zoomEnabled && value > 0.1) {
            this.targetZoomDelta -= value * 0.02;
          }
          break;
      }
    }
  }

  /**
   * Update keyboard-based camera controls
   */
  private updateKeyboardControls(): void {
    if (!this.config.panEnabled) return;
    
    let panX = 0;
    let panY = 0;
    
    // Pan controls
    if (this.pressedKeys.has('ArrowLeft') || this.pressedKeys.has('KeyA')) {
      panX -= 1;
    }
    if (this.pressedKeys.has('ArrowRight') || this.pressedKeys.has('KeyD')) {
      panX += 1;
    }
    if (this.pressedKeys.has('ArrowUp') || this.pressedKeys.has('KeyW')) {
      panY -= 1;
    }
    if (this.pressedKeys.has('ArrowDown') || this.pressedKeys.has('KeyS')) {
      panY += 1;
    }
    
    this.targetPanDelta.x += panX * 2; // Scale for keyboard
    this.targetPanDelta.y += panY * 2;
    
    // Zoom controls
    if (this.config.zoomEnabled) {
      if (this.pressedKeys.has('Equal') || this.pressedKeys.has('NumpadAdd')) {
        this.targetZoomDelta -= 0.02;
      }
      if (this.pressedKeys.has('Minus') || this.pressedKeys.has('NumpadSubtract')) {
        this.targetZoomDelta += 0.02;
      }
    }
    
    // Rotation controls
    if (this.config.rotationEnabled) {
      if (this.pressedKeys.has('KeyQ')) {
        this.targetRotationDelta -= 0.02;
      }
      if (this.pressedKeys.has('KeyE')) {
        this.targetRotationDelta += 0.02;
      }
    }
  }

  /**
   * Update gamepad-based camera controls
   */
  private updateGamepadControls(): void {
    // Gamepad controls are handled in handleGamepadInput
    // This method could be used for additional gamepad processing
  }

  /**
   * Update touch gesture recognition
   */
  private updateTouchGestures(): void {
    if (!this.config.touchGestureEnabled) return;
    
    const touches = Array.from(this.activeTouches.values());
    
    if (touches.length === 1) {
      // Single touch pan
      if (this.config.panEnabled && this.state.lastTouchPositions.length === 1) {
        const lastTouch = this.state.lastTouchPositions[0];
        const currentTouch = touches[0];
        
        this.targetPanDelta.x += currentTouch.x - lastTouch.x;
        this.targetPanDelta.y += currentTouch.y - lastTouch.y;
      }
    } else if (touches.length === 2) {
      // Two finger gestures
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      // Pinch to zoom
      if (this.config.zoomEnabled) {
        const currentDistance = this.calculateDistance(touch1, touch2);
        
        if (this.state.lastTouchPositions.length === 2) {
          const lastDistance = this.state.lastPinchDistance;
          const zoomDelta = (currentDistance - lastDistance) * 0.01;
          this.targetZoomDelta -= zoomDelta; // Invert for natural pinch
        }
        
        this.state.lastPinchDistance = currentDistance;
      }
      
      // Two finger rotation
      if (this.config.rotationEnabled) {
        const currentAngle = this.calculateAngle(touch1, touch2);
        
        if (this.state.lastTouchPositions.length === 2) {
          const lastAngle = this.state.lastRotationAngle;
          let rotationDelta = currentAngle - lastAngle;
          
          // Handle angle wrap-around
          if (rotationDelta > Math.PI) rotationDelta -= 2 * Math.PI;
          if (rotationDelta < -Math.PI) rotationDelta += 2 * Math.PI;
          
          this.targetRotationDelta += rotationDelta;
        }
        
        this.state.lastRotationAngle = currentAngle;
      }
    }
    
    // Store current touch positions for next frame
    this.state.lastTouchPositions = [...touches];
  }

  /**
   * Apply smoothing to camera deltas
   */
  private applySmoothing(deltaTime: number): void {
    const smoothingFactor = this.config.smoothingFactor;
    const frameSmoothing = Math.min(smoothingFactor * (deltaTime / 16.67), 1);
    
    this.state.panDelta.x = this.lerp(this.state.panDelta.x, this.targetPanDelta.x, frameSmoothing);
    this.state.panDelta.y = this.lerp(this.state.panDelta.y, this.targetPanDelta.y, frameSmoothing);
    this.state.zoomDelta = this.lerp(this.state.zoomDelta, this.targetZoomDelta, frameSmoothing);
    this.state.rotationDelta = this.lerp(this.state.rotationDelta, this.targetRotationDelta, frameSmoothing);
  }

  /**
   * Apply dead zones to prevent jitter
   */
  private applyDeadZones(): void {
    // Pan dead zone
    if (Math.abs(this.state.panDelta.x) < this.config.panDeadZone) {
      this.state.panDelta.x = 0;
    }
    if (Math.abs(this.state.panDelta.y) < this.config.panDeadZone) {
      this.state.panDelta.y = 0;
    }
    
    // Zoom dead zone
    if (Math.abs(this.state.zoomDelta) < this.config.zoomDeadZone) {
      this.state.zoomDelta = 0;
    }
    
    // Rotation dead zone
    if (Math.abs(this.state.rotationDelta) < this.config.rotationDeadZone) {
      this.state.rotationDelta = 0;
    }
  }

  /**
   * Apply sensitivity and inversion settings
   */
  private applySensitivityAndInversion(): void {
    // Apply sensitivity
    this.state.panDelta.x *= this.config.panSensitivity;
    this.state.panDelta.y *= this.config.panSensitivity;
    this.state.zoomDelta *= this.config.zoomSensitivity;
    this.state.rotationDelta *= this.config.rotationSensitivity;
    
    // Apply inversion
    if (this.config.invertPanX) {
      this.state.panDelta.x *= -1;
    }
    if (this.config.invertPanY) {
      this.state.panDelta.y *= -1;
    }
    if (this.config.invertZoom) {
      this.state.zoomDelta *= -1;
    }
    if (this.config.invertRotation) {
      this.state.rotationDelta *= -1;
    }
  }

  /**
   * Emit camera events if there's significant movement
   */
  private emitCameraEvents(): void {
    if (this.state.panDelta.x !== 0 || this.state.panDelta.y !== 0) {
      this.emit('camera-pan', this.state.panDelta);
    }
    
    if (this.state.zoomDelta !== 0) {
      this.emit('camera-zoom', this.state.zoomDelta);
    }
    
    if (this.state.rotationDelta !== 0) {
      this.emit('camera-rotate', this.state.rotationDelta);
    }
  }

  /**
   * Reset target deltas for next frame
   */
  private resetTargetDeltas(): void {
    if (!this.config.smoothing) {
      this.targetPanDelta = { x: 0, y: 0 };
      this.targetZoomDelta = 0;
      this.targetRotationDelta = 0;
    }
  }

  /**
   * Get action from input event
   */
  private getActionFromInput(event: RawInputEvent): GameAction | null {
    // Camera actions are typically not mapped to specific game actions
    // Instead they emit custom events like 'camera-pan', 'camera-zoom', etc.
    return null;
  }

  /**
   * Reset handler state
   */
  private resetState(): void {
    this.state = {
      panDelta: { x: 0, y: 0 },
      zoomDelta: 0,
      rotationDelta: 0,
      isPanning: false,
      isZooming: false,
      isRotating: false,
      lastMousePosition: { x: 0, y: 0 },
      lastTouchPositions: [],
      lastPinchDistance: 0,
      lastRotationAngle: 0
    };
    
    this.pressedKeys.clear();
    this.pressedMouseButtons.clear();
    this.activeTouches.clear();
    
    this.targetPanDelta = { x: 0, y: 0 };
    this.targetZoomDelta = 0;
    this.targetRotationDelta = 0;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate angle between two points
   */
  private calculateAngle(point1: Point, point2: Point): number {
    return Math.atan2(point2.y - point1.y, point2.x - point1.x);
  }

  /**
   * Linear interpolation utility
   */
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }
}