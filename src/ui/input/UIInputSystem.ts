import { EventEmitter } from 'eventemitter3';
import { UIInputSystem, UIComponent, Point, UIInteractionEvent } from '../../contracts/UI';

/**
 * Gesture recognition data
 */
interface GestureData {
  startPosition: Point;
  startTime: number;
  currentPosition: Point;
  velocity: Point;
  pointerCount: number;
  initialDistance?: number;
  initialAngle?: number;
}

/**
 * Touch/pointer tracking
 */
interface PointerData {
  id: number;
  position: Point;
  startPosition: Point;
  startTime: number;
  lastPosition: Point;
  lastTime: number;
  isDown: boolean;
}

/**
 * Mobile-optimized input system with gesture recognition
 */
export class GameByteUIInputSystem extends EventEmitter implements UIInputSystem {
  // Input state
  private pointers: Map<number, PointerData> = new Map();
  private currentFocus: UIComponent | null = null;
  private gestureData: GestureData | null = null;
  
  // Configuration
  private tapThreshold: number = 10; // pixels
  private longPressThreshold: number = 500; // milliseconds
  private doubleTapThreshold: number = 300; // milliseconds
  private swipeThreshold: number = 50; // pixels
  private pinchThreshold: number = 0.1; // scale difference
  
  // Gesture detection
  private lastTapTime: number = 0;
  private lastTapPosition: Point = { x: 0, y: 0 };
  private longPressTimer: number | null = null;
  
  // Target element for event capture
  private element: HTMLElement | null = null;
  
  // Bound event handlers for proper cleanup
  private boundPointerDown: (event: PointerEvent) => void;
  private boundPointerMove: (event: PointerEvent) => void;
  private boundPointerUp: (event: PointerEvent) => void;
  private boundPointerCancel: (event: PointerEvent) => void;
  private boundTouchStart: (event: TouchEvent) => void;
  private boundTouchMove: (event: TouchEvent) => void;
  private boundTouchEnd: (event: TouchEvent) => void;
  private boundTouchCancel: (event: TouchEvent) => void;
  private boundMouseDown: (event: MouseEvent) => void;
  private boundMouseMove: (event: MouseEvent) => void;
  private boundMouseUp: (event: MouseEvent) => void;
  private boundContextMenu: (event: Event) => void;

  constructor(element?: HTMLElement) {
    super();
    
    // Bind event handlers
    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);
    this.boundPointerCancel = this.onPointerCancel.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundTouchCancel = this.handleTouchCancel.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundContextMenu = (e) => e.preventDefault();
    
    if (element) {
      this.attachToElement(element);
    }
  }

  /**
   * Attach input system to a DOM element
   */
  public attachToElement(element: HTMLElement): void {
    if (this.element) {
      this.detachFromElement();
    }
    
    this.element = element;
    this.setupEventListeners();
  }

  /**
   * Detach from current element
   */
  public detachFromElement(): void {
    if (this.element) {
      this.removeEventListeners();
      this.element = null;
    }
  }

  /**
   * Handle pointer down events
   */
  public onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    
    const pointer: PointerData = {
      id: event.pointerId,
      position: { x: event.clientX, y: event.clientY },
      startPosition: { x: event.clientX, y: event.clientY },
      startTime: Date.now(),
      lastPosition: { x: event.clientX, y: event.clientY },
      lastTime: Date.now(),
      isDown: true
    };
    
    this.pointers.set(event.pointerId, pointer);
    
    // Start gesture tracking
    this.startGesture(pointer);
    
    // Emit interaction event
    const interactionEvent: UIInteractionEvent = {
      type: 'down',
      position: pointer.position,
      target: null,
      timestamp: pointer.startTime,
      pointerID: event.pointerId
    };
    
    this.emit('pointer-down', interactionEvent);
  }

  /**
   * Handle pointer move events
   */
  public onPointerMove(event: PointerEvent): void {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    
    pointer.lastPosition = { ...pointer.position };
    pointer.lastTime = Date.now();
    pointer.position = { x: event.clientX, y: event.clientY };
    
    // Update gesture data
    this.updateGesture(pointer);
    
    // Check for gesture recognition
    this.recognizeGestures();
    
    // Emit interaction event
    const interactionEvent: UIInteractionEvent = {
      type: 'move',
      position: pointer.position,
      target: null,
      timestamp: pointer.lastTime,
      pointerID: event.pointerId
    };
    
    this.emit('pointer-move', interactionEvent);
  }

  /**
   * Handle pointer up events
   */
  public onPointerUp(event: PointerEvent): void {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    
    pointer.isDown = false;
    pointer.position = { x: event.clientX, y: event.clientY };
    
    const currentTime = Date.now();
    const duration = currentTime - pointer.startTime;
    const distance = this.calculateDistance(pointer.startPosition, pointer.position);
    
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // Detect tap gestures
    if (distance < this.tapThreshold && duration < 300) {
      this.handleTap(pointer, currentTime);
    }
    
    // Calculate velocity for swipe detection
    const timeDelta = currentTime - pointer.lastTime;
    const velocity: Point = {
      x: timeDelta > 0 ? (pointer.position.x - pointer.lastPosition.x) / timeDelta : 0,
      y: timeDelta > 0 ? (pointer.position.y - pointer.lastPosition.y) / timeDelta : 0
    };
    
    // Detect swipe
    if (distance >= this.swipeThreshold) {
      this.onSwipe(pointer.startPosition, pointer.position, velocity);
    }
    
    // End gesture
    this.endGesture();
    
    // Emit interaction event
    const interactionEvent: UIInteractionEvent = {
      type: 'up',
      position: pointer.position,
      target: null,
      timestamp: currentTime,
      pointerID: event.pointerId
    };
    
    this.emit('pointer-up', interactionEvent);
    
    // Remove pointer
    this.pointers.delete(event.pointerId);
  }

  /**
   * Handle pointer cancel events
   */
  public onPointerCancel(event: PointerEvent): void {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // End gesture
    this.endGesture();
    
    // Emit interaction event
    const interactionEvent: UIInteractionEvent = {
      type: 'cancel',
      position: pointer.position,
      target: null,
      timestamp: Date.now(),
      pointerID: event.pointerId
    };
    
    this.emit('pointer-cancel', interactionEvent);
    
    // Remove pointer
    this.pointers.delete(event.pointerId);
  }

  /**
   * Handle tap gesture
   */
  public onTap(position: Point): void {
    this.emit('tap', { position, timestamp: Date.now() });
  }

  /**
   * Handle double tap gesture
   */
  public onDoubleTap(position: Point): void {
    this.emit('double-tap', { position, timestamp: Date.now() });
  }

  /**
   * Handle long press gesture
   */
  public onLongPress(position: Point): void {
    this.emit('long-press', { position, timestamp: Date.now() });
  }

  /**
   * Handle pinch gesture
   */
  public onPinch(center: Point, scale: number): void {
    this.emit('pinch', { center, scale, timestamp: Date.now() });
  }

  /**
   * Handle swipe gesture
   */
  public onSwipe(start: Point, end: Point, velocity: Point): void {
    const direction = this.getSwipeDirection(start, end);
    this.emit('swipe', { start, end, velocity, direction, timestamp: Date.now() });
  }

  /**
   * Set focus to a component
   */
  public setFocus(component: UIComponent | null): void {
    const previousFocus = this.currentFocus;
    this.currentFocus = component;
    
    if (previousFocus) {
      previousFocus.emit('focus-lost');
    }
    
    if (component) {
      component.emit('focus-gained');
    }
    
    this.emit('focus-changed', { previous: previousFocus, current: component });
  }

  /**
   * Get currently focused component
   */
  public getFocus(): UIComponent | null {
    return this.currentFocus;
  }

  /**
   * Configuration methods
   */
  public setTapThreshold(pixels: number): void {
    this.tapThreshold = pixels;
  }

  public setLongPressThreshold(milliseconds: number): void {
    this.longPressThreshold = milliseconds;
  }

  public setPinchThreshold(scale: number): void {
    this.pinchThreshold = scale;
  }

  public setSwipeThreshold(pixels: number): void {
    this.swipeThreshold = pixels;
  }

  /**
   * Start gesture tracking
   */
  private startGesture(pointer: PointerData): void {
    this.gestureData = {
      startPosition: { ...pointer.startPosition },
      startTime: pointer.startTime,
      currentPosition: { ...pointer.position },
      velocity: { x: 0, y: 0 },
      pointerCount: this.pointers.size
    };
    
    // Setup long press detection
    this.longPressTimer = window.setTimeout(() => {
      if (this.gestureData) {
        this.onLongPress(this.gestureData.startPosition);
      }
    }, this.longPressThreshold);
    
    // Setup multi-touch data
    if (this.pointers.size === 2) {
      const pointers = Array.from(this.pointers.values());
      this.gestureData.initialDistance = this.calculateDistance(
        pointers[0].position,
        pointers[1].position
      );
      this.gestureData.initialAngle = this.calculateAngle(
        pointers[0].position,
        pointers[1].position
      );
    }
  }

  /**
   * Update gesture data
   */
  private updateGesture(pointer: PointerData): void {
    if (!this.gestureData) return;
    
    this.gestureData.currentPosition = { ...pointer.position };
    
    // Calculate velocity
    const timeDelta = pointer.lastTime - pointer.startTime;
    if (timeDelta > 0) {
      this.gestureData.velocity = {
        x: (pointer.position.x - pointer.startPosition.x) / timeDelta,
        y: (pointer.position.y - pointer.startPosition.y) / timeDelta
      };
    }
    
    this.gestureData.pointerCount = this.pointers.size;
  }

  /**
   * Recognize gestures based on current data
   */
  private recognizeGestures(): void {
    if (!this.gestureData) return;
    
    // Pinch/zoom detection for two fingers
    if (this.pointers.size === 2 && this.gestureData.initialDistance) {
      const pointers = Array.from(this.pointers.values());
      const currentDistance = this.calculateDistance(
        pointers[0].position,
        pointers[1].position
      );
      
      const scale = currentDistance / this.gestureData.initialDistance;
      
      if (Math.abs(scale - 1) > this.pinchThreshold) {
        const center: Point = {
          x: (pointers[0].position.x + pointers[1].position.x) / 2,
          y: (pointers[0].position.y + pointers[1].position.y) / 2
        };
        
        this.onPinch(center, scale);
      }
    }
  }

  /**
   * End gesture tracking
   */
  private endGesture(): void {
    this.gestureData = null;
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * Handle tap detection and double tap
   */
  private handleTap(pointer: PointerData, currentTime: number): void {
    const timeSinceLastTap = currentTime - this.lastTapTime;
    const distanceFromLastTap = this.calculateDistance(pointer.position, this.lastTapPosition);
    
    // Check for double tap
    if (timeSinceLastTap < this.doubleTapThreshold && distanceFromLastTap < this.tapThreshold) {
      this.onDoubleTap(pointer.position);
    } else {
      this.onTap(pointer.position);
    }
    
    this.lastTapTime = currentTime;
    this.lastTapPosition = { ...pointer.position };
  }

  /**
   * Get swipe direction
   */
  private getSwipeDirection(start: Point, end: Point): 'up' | 'down' | 'left' | 'right' {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: Point, point2: Point): number {
    const deltaX = point2.x - point1.x;
    const deltaY = point2.y - point1.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Calculate angle between two points
   */
  private calculateAngle(point1: Point, point2: Point): number {
    return Math.atan2(point2.y - point1.y, point2.x - point1.x);
  }

  /**
   * Setup DOM event listeners
   */
  private setupEventListeners(): void {
    if (!this.element) return;
    
    const element = this.element; // Create local reference for type narrowing
    
    // Pointer events (modern standard)
    if ('onpointerdown' in element) {
      element.addEventListener('pointerdown', this.boundPointerDown);
      element.addEventListener('pointermove', this.boundPointerMove);
      element.addEventListener('pointerup', this.boundPointerUp);
      element.addEventListener('pointercancel', this.boundPointerCancel);
    } else {
      // Fallback to touch and mouse events
      (element as HTMLElement).addEventListener('touchstart', this.boundTouchStart);
      (element as HTMLElement).addEventListener('touchmove', this.boundTouchMove);
      (element as HTMLElement).addEventListener('touchend', this.boundTouchEnd);
      (element as HTMLElement).addEventListener('touchcancel', this.boundTouchCancel);
      
      (element as HTMLElement).addEventListener('mousedown', this.boundMouseDown);
      (element as HTMLElement).addEventListener('mousemove', this.boundMouseMove);
      (element as HTMLElement).addEventListener('mouseup', this.boundMouseUp);
    }
    
    // Prevent default context menu
    element.addEventListener('contextmenu', this.boundContextMenu);
  }

  /**
   * Remove DOM event listeners
   */
  private removeEventListeners(): void {
    if (!this.element) return;
    
    // Remove all event listeners using bound references
    this.element.removeEventListener('pointerdown', this.boundPointerDown);
    this.element.removeEventListener('pointermove', this.boundPointerMove);
    this.element.removeEventListener('pointerup', this.boundPointerUp);
    this.element.removeEventListener('pointercancel', this.boundPointerCancel);
    
    this.element.removeEventListener('touchstart', this.boundTouchStart);
    this.element.removeEventListener('touchmove', this.boundTouchMove);
    this.element.removeEventListener('touchend', this.boundTouchEnd);
    this.element.removeEventListener('touchcancel', this.boundTouchCancel);
    
    this.element.removeEventListener('mousedown', this.boundMouseDown);
    this.element.removeEventListener('mousemove', this.boundMouseMove);
    this.element.removeEventListener('mouseup', this.boundMouseUp);
    
    this.element.removeEventListener('contextmenu', this.boundContextMenu);
  }

  /**
   * Touch event fallback handlers
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.onPointerDown(this.touchToPointerEvent(touch, 'pointerdown'));
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.onPointerMove(this.touchToPointerEvent(touch, 'pointermove'));
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.onPointerUp(this.touchToPointerEvent(touch, 'pointerup'));
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.onPointerCancel(this.touchToPointerEvent(touch, 'pointercancel'));
    }
  }

  /**
   * Mouse event fallback handlers
   */
  private handleMouseDown(event: MouseEvent): void {
    this.onPointerDown(this.mouseToPointerEvent(event, 'pointerdown'));
  }

  private handleMouseMove(event: MouseEvent): void {
    this.onPointerMove(this.mouseToPointerEvent(event, 'pointermove'));
  }

  private handleMouseUp(event: MouseEvent): void {
    this.onPointerUp(this.mouseToPointerEvent(event, 'pointerup'));
  }

  /**
   * Convert touch event to pointer event
   */
  private touchToPointerEvent(touch: Touch, type: string): PointerEvent {
    return {
      pointerId: touch.identifier,
      clientX: touch.clientX,
      clientY: touch.clientY,
      type,
      preventDefault: () => {}
    } as PointerEvent;
  }

  /**
   * Convert mouse event to pointer event
   */
  private mouseToPointerEvent(mouse: MouseEvent, type: string): PointerEvent {
    return {
      pointerId: 0, // Mouse always has ID 0
      clientX: mouse.clientX,
      clientY: mouse.clientY,
      type,
      preventDefault: () => mouse.preventDefault()
    } as PointerEvent;
  }

  /**
   * Destroy input system
   */
  public destroy(): void {
    this.detachFromElement();
    this.pointers.clear();
    this.currentFocus = null;
    this.gestureData = null;
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    this.removeAllListeners();
  }
}