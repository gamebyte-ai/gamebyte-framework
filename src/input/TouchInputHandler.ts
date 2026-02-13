import { EventEmitter } from 'eventemitter3';
import { Point } from '../contracts/UI';
import {
  TouchInputHandler,
  RawInputEvent,
  GestureEvent,
  GestureType,
  InputDevice,
  InputHandler
} from '../contracts/Input';
import { Logger } from '../utils/Logger.js';

/**
 * Touch data for tracking individual touches
 */
interface TouchData {
  id: number;
  startPosition: Point;
  currentPosition: Point;
  previousPosition: Point;
  startTime: number;
  lastTime: number;
  pressure: number;
  velocity: Point;
  isActive: boolean;
}

/**
 * Gesture tracking data
 */
interface GestureTracker {
  type: GestureType;
  startTime: number;
  startPosition: Point;
  currentPosition: Point;
  touches: TouchData[];
  initialDistance?: number;
  initialAngle?: number;
  minDistance?: number;
  maxDistance?: number;
  completed: boolean;
}

/**
 * Advanced touch input handler with gesture recognition and palm rejection
 */
export class GameByteTouchInputHandler extends EventEmitter implements TouchInputHandler, InputHandler {
  private element: HTMLElement | null = null;
  private isInitialized: boolean = false;
  
  // Touch tracking
  private activeTouches: Map<number, TouchData> = new Map();
  private primaryTouchId: number | null = null;
  
  // Gesture tracking
  private activeGestures: GestureTracker[] = [];
  private lastTapTime: number = 0;
  private lastTapPosition: Point = { x: 0, y: 0 };
  private longPressTimer: number | null = null;
  
  // Configuration
  private sensitivity: number = 1.0;
  private palmRejectionEnabled: boolean = true;
  private gestureThresholds = {
    tap: 10, // pixels
    longPress: 500, // milliseconds
    swipe: 50, // pixels
    pinch: 0.2, // scale change
    rotate: 15, // degrees
    doubleTap: 300 // milliseconds between taps
  };
  
  // Touch and gesture tracking for update method
  private touchTracker: Map<number, { timestamp: number; data: any }> = new Map();
  private gestureTimeout: number = 1000; // ms
  private gestureStartTime: number = 0;
  
  // Palm rejection settings
  private palmRejectionThreshold = {
    maxTouchSize: 30, // max touch radius to not be considered palm
    minTouchDistance: 40, // min distance between touches
    maxSimultaneousTouches: 5 // max touches before considering palm
  };
  
  // Performance tracking
  private gestureRecognitionTimes: number[] = [];

  constructor() {
    super();
  }

  /**
   * Initialize the touch handler with DOM element
   */
  async initialize(element: HTMLElement): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.element = element;
    this.setupEventListeners();
    this.isInitialized = true;
    
    this.emit('initialized');
  }

  /**
   * Destroy the touch handler and clean up resources
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    this.removeEventListeners();
    this.clearAllTouches();
    this.clearAllGestures();
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    this.element = null;
    this.isInitialized = false;
    
    this.emit('destroyed');
    this.removeAllListeners();
  }

  /**
   * Process touch event and return array of raw input events
   */
  processTouchEvent(event: TouchEvent): RawInputEvent[] {
    const rawEvents: RawInputEvent[] = [];
    const timestamp = performance.now();

    // Process each changed touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      
      // Apply palm rejection
      if (this.palmRejectionEnabled && this.isPalmTouch(touch, event)) {
        continue;
      }
      
      const rawEvent: RawInputEvent = {
        type: this.mapTouchEventType(event.type),
        device: 'touch' as InputDevice,
        timestamp,
        position: { x: touch.clientX, y: touch.clientY },
        pointerId: touch.identifier,
        pressure: (touch as any).pressure || 1.0
      };
      
      rawEvents.push(rawEvent);
      
      // Update touch tracking
      this.updateTouchTracking(touch, event.type, timestamp);
    }
    
    // Update gesture recognition
    this.updateGestureRecognition();
    
    return rawEvents;
  }

  /**
   * Process pointer event and return raw input event
   */
  processPointerEvent(event: PointerEvent): RawInputEvent {
    const timestamp = performance.now();
    
    const rawEvent: RawInputEvent = {
      type: this.mapPointerEventType(event.type),
      device: event.pointerType === 'touch' ? 'touch' : 'mouse',
      timestamp,
      position: { x: event.clientX, y: event.clientY },
      pointerId: event.pointerId,
      pressure: event.pressure
    };
    
    // Update touch tracking for touch pointers
    if (event.pointerType === 'touch') {
      this.updatePointerTracking(event, timestamp);
    }
    
    // Update gesture recognition
    this.updateGestureRecognition();
    
    return rawEvent;
  }

  /**
   * Recognize current gesture based on active touches
   */
  recognizeGesture(): GestureEvent | null {
    const startTime = performance.now();
    
    let recognizedGesture: GestureEvent | null = null;
    
    // Check for completed gestures
    for (let i = this.activeGestures.length - 1; i >= 0; i--) {
      const gesture = this.activeGestures[i];
      
      if (gesture.completed) {
        recognizedGesture = this.createGestureEvent(gesture);
        this.activeGestures.splice(i, 1);
        break;
      }
    }
    
    // Track performance
    const recognitionTime = performance.now() - startTime;
    this.gestureRecognitionTimes.push(recognitionTime);
    if (this.gestureRecognitionTimes.length > 100) {
      this.gestureRecognitionTimes.shift();
    }
    
    return recognizedGesture;
  }

  /**
   * Configure gesture recognition parameters
   */
  configureGesture(type: GestureType, config: any): void {
    switch (type) {
      case 'tap':
        if (config.threshold !== undefined) {
          this.gestureThresholds.tap = config.threshold;
        }
        break;
      case 'long-press':
        if (config.duration !== undefined) {
          this.gestureThresholds.longPress = config.duration;
        }
        break;
      case 'swipe':
        if (config.threshold !== undefined) {
          this.gestureThresholds.swipe = config.threshold;
        }
        break;
      case 'pinch':
        if (config.threshold !== undefined) {
          this.gestureThresholds.pinch = config.threshold;
        }
        break;
      case 'rotate':
        if (config.threshold !== undefined) {
          this.gestureThresholds.rotate = config.threshold;
        }
        break;
      case 'double-tap':
        if (config.interval !== undefined) {
          this.gestureThresholds.doubleTap = config.interval;
        }
        break;
    }
  }

  /**
   * Get number of active touches
   */
  getTouchCount(): number {
    return this.activeTouches.size;
  }

  /**
   * Get touch by ID
   */
  getTouch(id: number): Touch | null {
    const touchData = this.activeTouches.get(id);
    if (!touchData) return null;
    
    // Create a Touch-like object
    return {
      identifier: touchData.id,
      clientX: touchData.currentPosition.x,
      clientY: touchData.currentPosition.y,
      screenX: touchData.currentPosition.x,
      screenY: touchData.currentPosition.y,
      pageX: touchData.currentPosition.x,
      pageY: touchData.currentPosition.y,
      radiusX: 10,
      radiusY: 10,
      rotationAngle: 0,
      force: touchData.pressure,
      target: this.element
    } as Touch;
  }

  /**
   * Get primary touch (first touch)
   */
  getPrimaryTouch(): Touch | null {
    if (this.primaryTouchId === null) return null;
    return this.getTouch(this.primaryTouchId);
  }

  /**
   * Set touch sensitivity
   */
  setSensitivity(sensitivity: number): void {
    this.sensitivity = Math.max(0.1, Math.min(5.0, sensitivity));
  }

  /**
   * Set gesture thresholds
   */
  setGestureThresholds(thresholds: any): void {
    this.gestureThresholds = { ...this.gestureThresholds, ...thresholds };
  }

  /**
   * Enable or disable palm rejection
   */
  enablePalmRejection(enabled: boolean): void {
    this.palmRejectionEnabled = enabled;
  }

  /**
   * Get average gesture recognition time
   */
  getAverageRecognitionTime(): number {
    if (this.gestureRecognitionTimes.length === 0) return 0;
    
    const sum = this.gestureRecognitionTimes.reduce((a, b) => a + b, 0);
    return sum / this.gestureRecognitionTimes.length;
  }

  /**
   * Setup DOM event listeners
   */
  private setupEventListeners(): void {
    if (!this.element) return;
    
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    // Pointer events (fallback/enhancement)
    if ('onpointerdown' in this.element) {
      this.element.addEventListener('pointerdown', this.handlePointerDown.bind(this));
      this.element.addEventListener('pointermove', this.handlePointerMove.bind(this));
      this.element.addEventListener('pointerup', this.handlePointerUp.bind(this));
      this.element.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
    }
  }

  /**
   * Remove DOM event listeners
   */
  private removeEventListeners(): void {
    if (!this.element) return;
    
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    this.element.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.element.removeEventListener('pointermove', this.handlePointerMove.bind(this));
    this.element.removeEventListener('pointerup', this.handlePointerUp.bind(this));
    this.element.removeEventListener('pointercancel', this.handlePointerCancel.bind(this));
  }

  /**
   * Handle touch start event
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const rawEvents = this.processTouchEvent(event);
    for (const rawEvent of rawEvents) {
      this.emit('raw-input', rawEvent);
    }
  }

  /**
   * Handle touch move event
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    const rawEvents = this.processTouchEvent(event);
    for (const rawEvent of rawEvents) {
      this.emit('raw-input', rawEvent);
    }
  }

  /**
   * Handle touch end event
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    const rawEvents = this.processTouchEvent(event);
    for (const rawEvent of rawEvents) {
      this.emit('raw-input', rawEvent);
    }
  }

  /**
   * Handle touch cancel event
   */
  private handleTouchCancel(event: TouchEvent): void {
    event.preventDefault();
    const rawEvents = this.processTouchEvent(event);
    for (const rawEvent of rawEvents) {
      this.emit('raw-input', rawEvent);
    }
  }

  /**
   * Handle pointer down event
   */
  private handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }
    const rawEvent = this.processPointerEvent(event);
    this.emit('raw-input', rawEvent);
  }

  /**
   * Handle pointer move event
   */
  private handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }
    const rawEvent = this.processPointerEvent(event);
    this.emit('raw-input', rawEvent);
  }

  /**
   * Handle pointer up event
   */
  private handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }
    const rawEvent = this.processPointerEvent(event);
    this.emit('raw-input', rawEvent);
  }

  /**
   * Handle pointer cancel event
   */
  private handlePointerCancel(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }
    const rawEvent = this.processPointerEvent(event);
    this.emit('raw-input', rawEvent);
  }

  /**
   * Update touch tracking data
   */
  private updateTouchTracking(touch: Touch, eventType: string, timestamp: number): void {
    const touchId = touch.identifier;
    const position = { x: touch.clientX, y: touch.clientY };
    const pressure = (touch as any).pressure || 1.0;

    if (eventType === 'touchstart') {
      const touchData: TouchData = {
        id: touchId,
        startPosition: position,
        currentPosition: position,
        previousPosition: position,
        startTime: timestamp,
        lastTime: timestamp,
        pressure,
        velocity: { x: 0, y: 0 },
        isActive: true
      };
      
      this.activeTouches.set(touchId, touchData);
      
      // Set primary touch if none exists
      if (this.primaryTouchId === null) {
        this.primaryTouchId = touchId;
      }
      
      // Start gesture tracking
      this.startGestureTracking(touchData);
      
    } else if (eventType === 'touchmove') {
      const touchData = this.activeTouches.get(touchId);
      if (touchData) {
        touchData.previousPosition = { ...touchData.currentPosition };
        touchData.currentPosition = position;
        
        // Calculate velocity
        const deltaTime = timestamp - touchData.lastTime;
        if (deltaTime > 0) {
          touchData.velocity = {
            x: (position.x - touchData.previousPosition.x) / deltaTime,
            y: (position.y - touchData.previousPosition.y) / deltaTime
          };
        }
        
        touchData.lastTime = timestamp;
        touchData.pressure = pressure;
      }
      
    } else if (eventType === 'touchend' || eventType === 'touchcancel') {
      const touchData = this.activeTouches.get(touchId);
      if (touchData) {
        touchData.isActive = false;
        touchData.currentPosition = position;
        touchData.lastTime = timestamp;
        
        // Handle tap gesture
        if (eventType === 'touchend') {
          this.handlePotentialTap(touchData, timestamp);
        }
        
        // End gesture tracking
        this.endGestureTracking(touchData);
        
        this.activeTouches.delete(touchId);
        
        // Update primary touch
        if (this.primaryTouchId === touchId) {
          this.primaryTouchId = this.activeTouches.size > 0 
            ? this.activeTouches.keys().next().value ?? null
            : null;
        }
      }
    }
  }

  /**
   * Update pointer tracking (similar to touch tracking)
   */
  private updatePointerTracking(event: PointerEvent, timestamp: number): void {
    const pointerId = event.pointerId;
    const position = { x: event.clientX, y: event.clientY };
    const pressure = event.pressure;

    if (event.type === 'pointerdown') {
      const touchData: TouchData = {
        id: pointerId,
        startPosition: position,
        currentPosition: position,
        previousPosition: position,
        startTime: timestamp,
        lastTime: timestamp,
        pressure,
        velocity: { x: 0, y: 0 },
        isActive: true
      };
      
      this.activeTouches.set(pointerId, touchData);
      
      if (this.primaryTouchId === null) {
        this.primaryTouchId = pointerId;
      }
      
      this.startGestureTracking(touchData);
      
    } else if (event.type === 'pointermove') {
      const touchData = this.activeTouches.get(pointerId);
      if (touchData) {
        touchData.previousPosition = { ...touchData.currentPosition };
        touchData.currentPosition = position;
        
        const deltaTime = timestamp - touchData.lastTime;
        if (deltaTime > 0) {
          touchData.velocity = {
            x: (position.x - touchData.previousPosition.x) / deltaTime,
            y: (position.y - touchData.previousPosition.y) / deltaTime
          };
        }
        
        touchData.lastTime = timestamp;
        touchData.pressure = pressure;
      }
      
    } else if (event.type === 'pointerup' || event.type === 'pointercancel') {
      const touchData = this.activeTouches.get(pointerId);
      if (touchData) {
        touchData.isActive = false;
        touchData.currentPosition = position;
        touchData.lastTime = timestamp;
        
        if (event.type === 'pointerup') {
          this.handlePotentialTap(touchData, timestamp);
        }
        
        this.endGestureTracking(touchData);
        this.activeTouches.delete(pointerId);
        
        if (this.primaryTouchId === pointerId) {
          this.primaryTouchId = this.activeTouches.size > 0 
            ? this.activeTouches.keys().next().value ?? null
            : null;
        }
      }
    }
  }

  /**
   * Start tracking gestures for a new touch
   */
  private startGestureTracking(touchData: TouchData): void {
    // Clear any existing long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    // Start long press detection for single touch
    if (this.activeTouches.size === 1) {
      this.longPressTimer = window.setTimeout(() => {
        this.completeGesture('long-press', touchData.startPosition);
      }, this.gestureThresholds.longPress) as number;
    }
    
    // Start multi-touch gesture tracking
    if (this.activeTouches.size === 2) {
      const touches = Array.from(this.activeTouches.values());
      this.startMultiTouchGesture(touches);
    }
  }

  /**
   * End gesture tracking for a touch
   */
  private endGestureTracking(touchData: TouchData): void {
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // Check for swipe gesture
    const distance = this.calculateDistance(touchData.startPosition, touchData.currentPosition);
    const duration = touchData.lastTime - touchData.startTime;
    
    if (distance >= this.gestureThresholds.swipe && duration < 1000) {
      this.completeSwipeGesture(touchData);
    }
    
    // Clean up multi-touch gestures
    this.cleanupMultiTouchGestures();
  }

  /**
   * Start multi-touch gesture tracking
   */
  private startMultiTouchGesture(touches: TouchData[]): void {
    if (touches.length !== 2) return;
    
    const distance = this.calculateDistance(touches[0].currentPosition, touches[1].currentPosition);
    const angle = this.calculateAngle(touches[0].currentPosition, touches[1].currentPosition);
    
    // Create pinch gesture tracker
    const pinchGesture: GestureTracker = {
      type: 'pinch',
      startTime: Math.max(touches[0].startTime, touches[1].startTime),
      startPosition: this.calculateMidpoint(touches[0].startPosition, touches[1].startPosition),
      currentPosition: this.calculateMidpoint(touches[0].currentPosition, touches[1].currentPosition),
      touches: [...touches],
      initialDistance: distance,
      minDistance: distance,
      maxDistance: distance,
      completed: false
    };
    
    // Create rotate gesture tracker
    const rotateGesture: GestureTracker = {
      type: 'rotate',
      startTime: Math.max(touches[0].startTime, touches[1].startTime),
      startPosition: this.calculateMidpoint(touches[0].startPosition, touches[1].startPosition),
      currentPosition: this.calculateMidpoint(touches[0].currentPosition, touches[1].currentPosition),
      touches: [...touches],
      initialAngle: angle,
      completed: false
    };
    
    this.activeGestures.push(pinchGesture, rotateGesture);
  }

  /**
   * Update gesture recognition
   */
  private updateGestureRecognition(): void {
    for (const gesture of this.activeGestures) {
      this.updateGestureProgress(gesture);
    }
  }

  /**
   * Update individual gesture progress
   */
  private updateGestureProgress(gesture: GestureTracker): void {
    if (gesture.completed || gesture.touches.length < 2) return;
    
    const touches = gesture.touches.filter(t => this.activeTouches.has(t.id));
    if (touches.length < 2) return;
    
    const currentDistance = this.calculateDistance(touches[0].currentPosition, touches[1].currentPosition);
    const currentAngle = this.calculateAngle(touches[0].currentPosition, touches[1].currentPosition);
    
    if (gesture.type === 'pinch') {
      gesture.minDistance = Math.min(gesture.minDistance!, currentDistance);
      gesture.maxDistance = Math.max(gesture.maxDistance!, currentDistance);
      
      const scaleChange = Math.abs(currentDistance - gesture.initialDistance!) / gesture.initialDistance!;
      if (scaleChange >= this.gestureThresholds.pinch) {
        gesture.completed = true;
      }
    } else if (gesture.type === 'rotate') {
      const angleDiff = Math.abs(currentAngle - gesture.initialAngle!) * (180 / Math.PI);
      if (angleDiff >= this.gestureThresholds.rotate) {
        gesture.completed = true;
      }
    }
    
    gesture.currentPosition = this.calculateMidpoint(touches[0].currentPosition, touches[1].currentPosition);
  }

  /**
   * Handle potential tap gesture
   */
  private handlePotentialTap(touchData: TouchData, timestamp: number): void {
    const distance = this.calculateDistance(touchData.startPosition, touchData.currentPosition);
    const duration = timestamp - touchData.startTime;
    
    if (distance <= this.gestureThresholds.tap && duration < 300) {
      // Check for double tap
      const timeSinceLastTap = timestamp - this.lastTapTime;
      const distanceFromLastTap = this.calculateDistance(touchData.currentPosition, this.lastTapPosition);
      
      if (timeSinceLastTap < this.gestureThresholds.doubleTap && 
          distanceFromLastTap < this.gestureThresholds.tap) {
        this.completeGesture('double-tap', touchData.currentPosition);
      } else {
        this.completeGesture('tap', touchData.currentPosition);
      }
      
      this.lastTapTime = timestamp;
      this.lastTapPosition = { ...touchData.currentPosition };
    }
  }

  /**
   * Complete swipe gesture
   */
  private completeSwipeGesture(touchData: TouchData): void {
    const gestureEvent: GestureEvent = {
      type: 'swipe',
      position: touchData.currentPosition,
      startPosition: touchData.startPosition,
      endPosition: touchData.currentPosition,
      timestamp: touchData.lastTime,
      duration: touchData.lastTime - touchData.startTime,
      distance: this.calculateDistance(touchData.startPosition, touchData.currentPosition),
      direction: this.getSwipeDirection(touchData.startPosition, touchData.currentPosition),
      velocity: touchData.velocity,
      fingers: 1
    };
    
    this.emit('gesture', gestureEvent);
  }

  /**
   * Complete a simple gesture
   */
  private completeGesture(type: GestureType, position: Point): void {
    const gestureEvent: GestureEvent = {
      type,
      position,
      timestamp: performance.now(),
      fingers: type === 'pinch' || type === 'rotate' ? 2 : 1
    };
    
    this.emit('gesture', gestureEvent);
  }

  /**
   * Create gesture event from tracker
   */
  private createGestureEvent(gesture: GestureTracker): GestureEvent {
    const event: GestureEvent = {
      type: gesture.type,
      position: gesture.currentPosition,
      startPosition: gesture.startPosition,
      timestamp: performance.now(),
      duration: performance.now() - gesture.startTime,
      fingers: gesture.touches.length
    };
    
    if (gesture.type === 'pinch' && gesture.minDistance && gesture.maxDistance && gesture.initialDistance) {
      event.scale = gesture.maxDistance / gesture.initialDistance;
    }
    
    if (gesture.type === 'rotate' && gesture.initialAngle) {
      const currentAngle = this.calculateAngle(
        gesture.touches[0].currentPosition, 
        gesture.touches[1].currentPosition
      );
      event.rotation = (currentAngle - gesture.initialAngle) * (180 / Math.PI);
    }
    
    return event;
  }

  /**
   * Clean up completed multi-touch gestures
   */
  private cleanupMultiTouchGestures(): void {
    this.activeGestures = this.activeGestures.filter(gesture => {
      const activeTouches = gesture.touches.filter(t => this.activeTouches.has(t.id));
      return activeTouches.length >= 2 && !gesture.completed;
    });
  }

  /**
   * Clear all active touches
   */
  private clearAllTouches(): void {
    this.activeTouches.clear();
    this.primaryTouchId = null;
  }

  /**
   * Clear all active gestures
   */
  private clearAllGestures(): void {
    this.activeGestures = [];
  }

  /**
   * Check if touch should be rejected as palm
   */
  private isPalmTouch(touch: Touch, event: TouchEvent): boolean {
    if (!this.palmRejectionEnabled) return false;
    
    // Check if too many touches are active
    if (event.touches.length > this.palmRejectionThreshold.maxSimultaneousTouches) {
      return true;
    }
    
    // Check touch size (if available)
    const touchRadius = Math.max((touch as any).radiusX || 0, (touch as any).radiusY || 0);
    if (touchRadius > this.palmRejectionThreshold.maxTouchSize) {
      return true;
    }
    
    // Check distance to other touches
    for (let i = 0; i < event.touches.length; i++) {
      const otherTouch = event.touches[i];
      if (otherTouch.identifier === touch.identifier) continue;
      
      const distance = this.calculateDistance(
        { x: touch.clientX, y: touch.clientY },
        { x: otherTouch.clientX, y: otherTouch.clientY }
      );
      
      if (distance < this.palmRejectionThreshold.minTouchDistance) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Map touch event type to input event type
   */
  private mapTouchEventType(type: string): 'down' | 'move' | 'up' | 'cancel' {
    switch (type) {
      case 'touchstart': return 'down';
      case 'touchmove': return 'move';
      case 'touchend': return 'up';
      case 'touchcancel': return 'cancel';
      default: return 'move';
    }
  }

  /**
   * Map pointer event type to input event type
   */
  private mapPointerEventType(type: string): 'down' | 'move' | 'up' | 'cancel' {
    switch (type) {
      case 'pointerdown': return 'down';
      case 'pointermove': return 'move';
      case 'pointerup': return 'up';
      case 'pointercancel': return 'cancel';
      default: return 'move';
    }
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
   * Calculate angle between two points in radians
   */
  private calculateAngle(point1: Point, point2: Point): number {
    return Math.atan2(point2.y - point1.y, point2.x - point1.x);
  }

  /**
   * Calculate midpoint between two points
   */
  private calculateMidpoint(point1: Point, point2: Point): Point {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2
    };
  }

  /**
   * Get swipe direction from start and end points
   */
  private getSwipeDirection(start: Point, end: Point): 'up' | 'down' | 'left' | 'right' {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * Handle input from InputHandler interface
   */
  public handleInput(event: RawInputEvent): void {
    // TouchInputHandler processes events differently from other handlers
    // It works with raw TouchEvent and PointerEvent objects
    // This method is here for interface compatibility
    Logger.warn('Input', 'TouchInputHandler.handleInput() called directly - use processTouchEvent() or processPointerEvent() instead');
  }

  /**
   * Check if handler is enabled (InputHandler interface)
   */
  public isEnabled(): boolean {
    return this.isInitialized;
  }

  /**
   * Set handler enabled state (InputHandler interface)
   */
  public setEnabled(enabled: boolean): void {
    if (enabled && !this.isInitialized) {
      Logger.warn('Input', 'Cannot enable TouchInputHandler - not initialized. Call initialize() first.');
    } else if (!enabled && this.isInitialized) {
      this.destroy();
    }
  }

  /**
   * Update touch handler (called by input manager)
   */
  update(deltaTime: number): void {
    if (!this.isInitialized) return;

    // Update gesture recognition timeouts
    const currentTime = performance.now();
    
    // Clean up old touch tracking data
    for (const [id, data] of this.touchTracker.entries()) {
      if (currentTime - data.timestamp > 5000) { // 5 second timeout
        this.touchTracker.delete(id);
      }
    }

    // Update gesture timeouts
    if (this.gestureTimeout && currentTime - this.gestureStartTime > this.gestureTimeout) {
      this.resetGestureState();
    }
  }

  /**
   * Reset gesture state for timeout handling
   */
  private resetGestureState(): void {
    this.activeGestures = [];
    this.gestureStartTime = 0;
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
}