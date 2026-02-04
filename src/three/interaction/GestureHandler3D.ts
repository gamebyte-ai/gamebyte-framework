import { EventEmitter } from 'eventemitter3';
import { Vector2, Vector3 } from 'three';

/**
 * Configuration options for GestureHandler3D
 */
export interface GestureHandler3DConfig {
  /** Maximum pixel movement to register as tap (default: 10) */
  tapThreshold: number;
  /** Maximum duration in ms to register as tap (default: 300) */
  tapDuration: number;
  /** Delay in ms before triggering long press (default: 500) */
  longPressDelay: number;
  /** Maximum delay in ms between taps for double tap (default: 300) */
  doubleTapDelay: number;
  /** Enable pinch gesture detection (default: true) */
  pinchEnabled: boolean;
  /** Enable double tap detection (default: true) */
  doubleTapEnabled: boolean;
}

/**
 * Position in 2D screen space
 */
export interface ScreenPosition {
  x: number;
  y: number;
}

/**
 * Gesture event data
 */
export interface TapEvent {
  screenPos: ScreenPosition;
  worldPos?: Vector3;
}

export interface DoubleTapEvent {
  screenPos: ScreenPosition;
  worldPos?: Vector3;
}

export interface LongPressEvent {
  screenPos: ScreenPosition;
  worldPos?: Vector3;
}

export interface DragStartEvent {
  screenPos: ScreenPosition;
}

export interface DragMoveEvent {
  screenPos: ScreenPosition;
  delta: ScreenPosition;
  startPos: ScreenPosition;
}

export interface DragEndEvent {
  screenPos: ScreenPosition;
  velocity: ScreenPosition;
}

export interface PinchEvent {
  scale: number;
  center: ScreenPosition;
}

export interface PinchStartEvent {
  center: ScreenPosition;
}

export interface PinchEndEvent {}

/**
 * Placeholder interface for CameraController
 * Will be implemented in CameraController.ts
 */
export interface CameraController {
  pan(deltaX: number, deltaY: number): void;
  zoom(delta: number, center?: ScreenPosition): void;
}

/**
 * Placeholder interface for Object3DPicker
 * Will be implemented in Object3DPicker.ts
 */
export interface Object3DPicker {
  pick(screenPos: ScreenPosition): { worldPos?: Vector3; object?: any } | null;
}

/**
 * Placeholder interface for DragController
 * Will be implemented in DragController.ts
 */
export interface DragController {
  startDrag(screenPos: ScreenPosition): void;
  updateDrag(screenPos: ScreenPosition, delta: ScreenPosition): void;
  endDrag(screenPos: ScreenPosition, velocity: ScreenPosition): void;
}

/**
 * Event types emitted by GestureHandler3D
 */
export interface GestureEvents {
  tap: [TapEvent];
  'double-tap': [DoubleTapEvent];
  'long-press': [LongPressEvent];
  'drag-start': [DragStartEvent];
  'drag-move': [DragMoveEvent];
  'drag-end': [DragEndEvent];
  pinch: [PinchEvent];
  'pinch-start': [PinchStartEvent];
  'pinch-end': [PinchEndEvent];
}

/**
 * Touch tracking data
 */
interface TouchData {
  identifier: number;
  startPos: ScreenPosition;
  currentPos: ScreenPosition;
  startTime: number;
}

/**
 * Unified touch and mouse gesture handler for Three.js
 * Supports tap, double-tap, long-press, drag, and pinch gestures
 */
export class GestureHandler3D extends EventEmitter<GestureEvents> {
  private config: GestureHandler3DConfig;
  private element: HTMLElement | null = null;
  private enabled: boolean = true;

  // Connected components
  private cameraController: CameraController | null = null;
  private objectPicker: Object3DPicker | null = null;
  private dragController: DragController | null = null;

  // Touch/Mouse state
  private touches: Map<number, TouchData> = new Map();
  private mouseDown: boolean = false;
  private mouseStartPos: ScreenPosition | null = null;
  private mouseCurrentPos: ScreenPosition | null = null;
  private mouseStartTime: number = 0;

  // Gesture state
  private isDragging: boolean = false;
  private isPinching: boolean = false;
  private longPressTimer: number | null = null;
  private lastTapTime: number = 0;
  private lastTapPos: ScreenPosition | null = null;

  // Velocity tracking
  private lastMoveTime: number = 0;
  private lastMovePos: ScreenPosition | null = null;
  private velocityX: number = 0;
  private velocityY: number = 0;

  // Pinch state
  private initialPinchDistance: number = 0;
  private lastPinchScale: number = 1;

  constructor(config?: Partial<GestureHandler3DConfig>) {
    super();

    this.config = {
      tapThreshold: config?.tapThreshold ?? 10,
      tapDuration: config?.tapDuration ?? 300,
      longPressDelay: config?.longPressDelay ?? 500,
      doubleTapDelay: config?.doubleTapDelay ?? 300,
      pinchEnabled: config?.pinchEnabled ?? true,
      doubleTapEnabled: config?.doubleTapEnabled ?? true,
    };
  }

  /**
   * Attach gesture handling to a DOM element
   */
  public attach(element: HTMLElement): void {
    this.detach();
    this.element = element;

    // Touch events
    element.addEventListener('touchstart', this.handleTouchStart);
    element.addEventListener('touchmove', this.handleTouchMove);
    element.addEventListener('touchend', this.handleTouchEnd);
    element.addEventListener('touchcancel', this.handleTouchCancel);

    // Mouse events
    element.addEventListener('mousedown', this.handleMouseDown);
    element.addEventListener('mousemove', this.handleMouseMove);
    element.addEventListener('mouseup', this.handleMouseUp);
    element.addEventListener('mouseleave', this.handleMouseLeave);

    // Prevent default touch behaviors
    element.style.touchAction = 'none';
  }

  /**
   * Detach gesture handling from current element
   */
  public detach(): void {
    if (!this.element) return;

    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);

    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mousemove', this.handleMouseMove);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('mouseleave', this.handleMouseLeave);

    this.element = null;
    this.resetState();
  }

  /**
   * Connect camera controller for auto pan/zoom
   */
  public connectCamera(controller: CameraController): void {
    this.cameraController = controller;
  }

  /**
   * Connect object picker for auto selection on tap
   */
  public connectPicker(picker: Object3DPicker): void {
    this.objectPicker = picker;
  }

  /**
   * Connect drag controller for auto drag handling
   */
  public connectDragger(dragger: DragController): void {
    this.dragController = dragger;
  }

  /**
   * Disconnect all connected components
   */
  public disconnectAll(): void {
    this.cameraController = null;
    this.objectPicker = null;
    this.dragController = null;
  }

  /**
   * Enable gesture handling
   */
  public enable(): void {
    this.enabled = true;
  }

  /**
   * Disable gesture handling
   */
  public disable(): void {
    this.enabled = false;
    this.resetState();
  }

  // Touch Event Handlers
  private handleTouchStart = (event: TouchEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();

    const now = performance.now();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const pos = this.getScreenPosition(touch);

      this.touches.set(touch.identifier, {
        identifier: touch.identifier,
        startPos: pos,
        currentPos: pos,
        startTime: now,
      });
    }

    // Handle pinch start
    if (this.config.pinchEnabled && this.touches.size === 2) {
      this.startPinch();
    }
    // Handle potential tap/long-press
    else if (this.touches.size === 1) {
      const firstTouch = Array.from(this.touches.values())[0];
      this.startLongPressTimer(firstTouch.startPos);
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();

    const now = performance.now();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchData = this.touches.get(touch.identifier);
      if (!touchData) continue;

      const pos = this.getScreenPosition(touch);
      touchData.currentPos = pos;

      // Update velocity
      if (this.lastMovePos && this.lastMoveTime) {
        const dt = Math.max(1, now - this.lastMoveTime);
        this.velocityX = ((pos.x - this.lastMovePos.x) / dt) * 1000;
        this.velocityY = ((pos.y - this.lastMovePos.y) / dt) * 1000;
      }

      this.lastMovePos = { ...pos };
      this.lastMoveTime = now;
    }

    // Handle pinch
    if (this.isPinching && this.touches.size === 2) {
      this.updatePinch();
    }
    // Handle drag
    else if (this.touches.size === 1) {
      const firstTouch = Array.from(this.touches.values())[0];
      const distance = this.getDistance(firstTouch.startPos, firstTouch.currentPos);

      if (distance > this.config.tapThreshold) {
        this.cancelLongPress();

        if (!this.isDragging) {
          this.startDrag(firstTouch.startPos);
        }

        this.updateDrag(firstTouch.currentPos, firstTouch.startPos);
      }
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();

    const now = performance.now();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchData = this.touches.get(touch.identifier);
      if (!touchData) continue;

      const distance = this.getDistance(touchData.startPos, touchData.currentPos);
      const duration = now - touchData.startTime;

      // Handle tap
      if (distance <= this.config.tapThreshold && duration <= this.config.tapDuration) {
        this.handleTap(touchData.currentPos, now);
      }

      this.touches.delete(touch.identifier);
    }

    // End pinch
    if (this.isPinching && this.touches.size < 2) {
      this.endPinch();
    }

    // End drag
    if (this.isDragging && this.touches.size === 0) {
      const lastTouch = Array.from(this.touches.values())[0];
      const pos = lastTouch?.currentPos ?? this.lastMovePos;
      if (pos) {
        this.endDrag(pos);
      }
    }

    this.cancelLongPress();

    if (this.touches.size === 0) {
      this.resetVelocity();
    }
  };

  private handleTouchCancel = (event: TouchEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.touches.delete(touch.identifier);
    }

    if (this.isPinching) {
      this.endPinch();
    }

    if (this.isDragging) {
      const pos = this.lastMovePos;
      if (pos) {
        this.endDrag(pos);
      }
    }

    this.cancelLongPress();
    this.resetState();
  };

  // Mouse Event Handlers
  private handleMouseDown = (event: MouseEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();

    const pos = this.getScreenPositionMouse(event);
    const now = performance.now();

    this.mouseDown = true;
    this.mouseStartPos = pos;
    this.mouseCurrentPos = pos;
    this.mouseStartTime = now;

    this.startLongPressTimer(pos);
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.enabled || !this.mouseDown) return;

    const pos = this.getScreenPositionMouse(event);
    const now = performance.now();

    this.mouseCurrentPos = pos;

    // Update velocity
    if (this.lastMovePos && this.lastMoveTime) {
      const dt = Math.max(1, now - this.lastMoveTime);
      this.velocityX = ((pos.x - this.lastMovePos.x) / dt) * 1000;
      this.velocityY = ((pos.y - this.lastMovePos.y) / dt) * 1000;
    }

    this.lastMovePos = { ...pos };
    this.lastMoveTime = now;

    if (!this.mouseStartPos) return;

    const distance = this.getDistance(this.mouseStartPos, pos);

    if (distance > this.config.tapThreshold) {
      this.cancelLongPress();

      if (!this.isDragging) {
        this.startDrag(this.mouseStartPos);
      }

      this.updateDrag(pos, this.mouseStartPos);
    }
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (!this.enabled || !this.mouseDown) return;
    event.preventDefault();

    const pos = this.getScreenPositionMouse(event);
    const now = performance.now();

    if (this.mouseStartPos) {
      const distance = this.getDistance(this.mouseStartPos, pos);
      const duration = now - this.mouseStartTime;

      // Handle tap
      if (distance <= this.config.tapThreshold && duration <= this.config.tapDuration) {
        this.handleTap(pos, now);
      }
    }

    if (this.isDragging) {
      this.endDrag(pos);
    }

    this.cancelLongPress();
    this.mouseDown = false;
    this.mouseStartPos = null;
    this.mouseCurrentPos = null;
    this.resetVelocity();
  };

  private handleMouseLeave = (event: MouseEvent): void => {
    if (!this.enabled || !this.mouseDown) return;

    const pos = this.getScreenPositionMouse(event);

    if (this.isDragging) {
      this.endDrag(pos);
    }

    this.cancelLongPress();
    this.mouseDown = false;
    this.mouseStartPos = null;
    this.mouseCurrentPos = null;
    this.resetVelocity();
  };

  // Gesture Handlers
  private handleTap(pos: ScreenPosition, now: number): void {
    let worldPos: Vector3 | undefined;

    // Try to pick object at tap position
    if (this.objectPicker) {
      const pickResult = this.objectPicker.pick(pos);
      if (pickResult?.worldPos) {
        worldPos = pickResult.worldPos;
      }
    }

    const tapEvent: TapEvent = { screenPos: pos, worldPos };
    this.emit('tap', tapEvent);

    // Handle double tap
    if (this.config.doubleTapEnabled && this.lastTapPos) {
      const timeSinceLastTap = now - this.lastTapTime;
      const distanceFromLastTap = this.getDistance(pos, this.lastTapPos);

      if (
        timeSinceLastTap <= this.config.doubleTapDelay &&
        distanceFromLastTap <= this.config.tapThreshold
      ) {
        const doubleTapEvent: DoubleTapEvent = { screenPos: pos, worldPos };
        this.emit('double-tap', doubleTapEvent);

        // Reset to prevent triple tap
        this.lastTapTime = 0;
        this.lastTapPos = null;
        return;
      }
    }

    this.lastTapTime = now;
    this.lastTapPos = pos;
  }

  private startLongPressTimer(pos: ScreenPosition): void {
    this.cancelLongPress();

    this.longPressTimer = window.setTimeout(() => {
      let worldPos: Vector3 | undefined;

      if (this.objectPicker) {
        const pickResult = this.objectPicker.pick(pos);
        if (pickResult?.worldPos) {
          worldPos = pickResult.worldPos;
        }
      }

      const event: LongPressEvent = { screenPos: pos, worldPos };
      this.emit('long-press', event);

      this.longPressTimer = null;
    }, this.config.longPressDelay);
  }

  private cancelLongPress(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private startDrag(startPos: ScreenPosition): void {
    this.isDragging = true;

    const event: DragStartEvent = { screenPos: startPos };
    this.emit('drag-start', event);

    if (this.dragController) {
      this.dragController.startDrag(startPos);
    }
  }

  private updateDrag(currentPos: ScreenPosition, startPos: ScreenPosition): void {
    if (!this.isDragging) return;

    const delta: ScreenPosition = {
      x: currentPos.x - (this.lastMovePos?.x ?? startPos.x),
      y: currentPos.y - (this.lastMovePos?.y ?? startPos.y),
    };

    const event: DragMoveEvent = {
      screenPos: currentPos,
      delta,
      startPos,
    };
    this.emit('drag-move', event);

    // Auto pan camera if connected
    if (this.cameraController) {
      this.cameraController.pan(delta.x, delta.y);
    }

    if (this.dragController) {
      this.dragController.updateDrag(currentPos, delta);
    }
  }

  private endDrag(endPos: ScreenPosition): void {
    if (!this.isDragging) return;

    const velocity: ScreenPosition = {
      x: this.velocityX,
      y: this.velocityY,
    };

    const event: DragEndEvent = {
      screenPos: endPos,
      velocity,
    };
    this.emit('drag-end', event);

    if (this.dragController) {
      this.dragController.endDrag(endPos, velocity);
    }

    this.isDragging = false;
  }

  private startPinch(): void {
    const touchArray = Array.from(this.touches.values());
    if (touchArray.length !== 2) return;

    this.isPinching = true;
    this.initialPinchDistance = this.getTouchDistance(touchArray[0], touchArray[1]);
    this.lastPinchScale = 1;

    const center = this.getTouchCenter(touchArray[0], touchArray[1]);
    const event: PinchStartEvent = { center };
    this.emit('pinch-start', event);
  }

  private updatePinch(): void {
    if (!this.isPinching) return;

    const touchArray = Array.from(this.touches.values());
    if (touchArray.length !== 2) return;

    const currentDistance = this.getTouchDistance(touchArray[0], touchArray[1]);
    const scale = currentDistance / this.initialPinchDistance;
    const center = this.getTouchCenter(touchArray[0], touchArray[1]);

    const event: PinchEvent = { scale, center };
    this.emit('pinch', event);

    // Auto zoom camera if connected
    if (this.cameraController) {
      const scaleDelta = scale - this.lastPinchScale;
      this.cameraController.zoom(scaleDelta, center);
    }

    this.lastPinchScale = scale;
  }

  private endPinch(): void {
    if (!this.isPinching) return;

    this.isPinching = false;
    this.initialPinchDistance = 0;
    this.lastPinchScale = 1;

    const event: PinchEndEvent = {};
    this.emit('pinch-end', event);
  }

  // Utility Methods
  private getScreenPosition(touch: Touch): ScreenPosition {
    if (!this.element) return { x: 0, y: 0 };

    const rect = this.element.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  private getScreenPositionMouse(event: MouseEvent): ScreenPosition {
    if (!this.element) return { x: 0, y: 0 };

    const rect = this.element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private getDistance(pos1: ScreenPosition, pos2: ScreenPosition): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchDistance(touch1: TouchData, touch2: TouchData): number {
    return this.getDistance(touch1.currentPos, touch2.currentPos);
  }

  private getTouchCenter(touch1: TouchData, touch2: TouchData): ScreenPosition {
    return {
      x: (touch1.currentPos.x + touch2.currentPos.x) / 2,
      y: (touch1.currentPos.y + touch2.currentPos.y) / 2,
    };
  }

  private resetState(): void {
    this.touches.clear();
    this.mouseDown = false;
    this.mouseStartPos = null;
    this.mouseCurrentPos = null;
    this.isDragging = false;
    this.isPinching = false;
    this.cancelLongPress();
    this.resetVelocity();
  }

  private resetVelocity(): void {
    this.velocityX = 0;
    this.velocityY = 0;
    this.lastMovePos = null;
    this.lastMoveTime = 0;
  }
}
