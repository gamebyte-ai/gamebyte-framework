import { EventEmitter } from 'eventemitter3';

// ============================================================
// Types
// ============================================================

export interface GestureConfig {
  /** Target element to attach listeners to, default: document.body */
  target?: HTMLElement;
  /** Min swipe distance in px, default: 50 */
  swipeThreshold?: number;
  /** ms before long-press fires, default: 500 */
  longPressDelay?: number;
  /** Max ms for a tap, default: 200 */
  tapTimeout?: number;
  /** Max ms between taps for double-tap, default: 300 */
  doubleTapTimeout?: number;
}

export interface GestureDetectorEvents {
  'tap': (x: number, y: number) => void;
  'double-tap': (x: number, y: number) => void;
  'long-press': (x: number, y: number) => void;
  'swipe': (direction: 'up' | 'down' | 'left' | 'right', velocity: number, distance: number) => void;
  'drag-start': (x: number, y: number) => void;
  'drag-move': (x: number, y: number, dx: number, dy: number) => void;
  'drag-end': (x: number, y: number) => void;
  'pinch': (scale: number, centerX: number, centerY: number) => void;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_SWIPE_THRESHOLD = 50;
const DEFAULT_LONG_PRESS_DELAY = 500;
const DEFAULT_TAP_TIMEOUT = 200;
const DEFAULT_DOUBLE_TAP_TIMEOUT = 300;
const DRAG_THRESHOLD = 10;
const SWIPE_TIME_LIMIT = 300; // ms — swipe must complete within this window

// ============================================================
// GestureDetector
// ============================================================

/**
 * Unified 2D gesture detection using the Pointer Events API.
 * No Three.js or Pixi.js dependencies — pure DOM.
 *
 * SSR-safe: checks `typeof document !== 'undefined'` before attaching.
 *
 * Detects: tap, double-tap, long-press, swipe (4 directions), drag, pinch.
 *
 * @example
 * ```typescript
 * const gesture = new GestureDetector({ target: canvas });
 * gesture.on('tap', (x, y) => console.log('tap at', x, y));
 * gesture.on('swipe', (dir, velocity, dist) => console.log('swipe', dir));
 * // On cleanup:
 * gesture.destroy();
 * ```
 */
export class GestureDetector extends EventEmitter<GestureDetectorEvents> {
  private readonly config: Required<Omit<GestureConfig, 'target'>>;
  private readonly target: HTMLElement | null;

  // Pointer state
  private _isDown = false;
  private _isDragging = false;
  private _pointerX = 0;
  private _pointerY = 0;

  private startX = 0;
  private startY = 0;
  private startTime = 0;

  private prevX = 0;
  private prevY = 0;

  // Tap tracking
  private lastTapTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;

  // Long-press timer handle
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  // Pinch tracking (touch events)
  private activeTouches: Map<number, { x: number; y: number }> = new Map();
  private initialPinchDistance = 0;

  // Bound handlers (stored for removeEventListener)
  private readonly onPointerDown: (e: PointerEvent) => void;
  private readonly onPointerMove: (e: PointerEvent) => void;
  private readonly onPointerUp: (e: PointerEvent) => void;
  private readonly onPointerCancel: (e: PointerEvent) => void;
  private readonly onTouchStart: (e: TouchEvent) => void;
  private readonly onTouchMove: (e: TouchEvent) => void;
  private readonly onTouchEnd: (e: TouchEvent) => void;

  constructor(config: GestureConfig = {}) {
    super();

    this.config = {
      swipeThreshold: config.swipeThreshold ?? DEFAULT_SWIPE_THRESHOLD,
      longPressDelay: config.longPressDelay ?? DEFAULT_LONG_PRESS_DELAY,
      tapTimeout: config.tapTimeout ?? DEFAULT_TAP_TIMEOUT,
      doubleTapTimeout: config.doubleTapTimeout ?? DEFAULT_DOUBLE_TAP_TIMEOUT,
    };

    // Bind handlers once so we can remove them later
    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);
    this.onPointerCancel = this.handlePointerCancel.bind(this);
    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchMove = this.handleTouchMove.bind(this);
    this.onTouchEnd = this.handleTouchEnd.bind(this);

    // SSR safety
    if (typeof document === 'undefined') {
      this.target = null;
      return;
    }

    this.target = config.target ?? document.body;
    this.attachListeners();
  }

  // ============================================================
  // Public readonly state
  // ============================================================

  get isDown(): boolean { return this._isDown; }
  get pointerX(): number { return this._pointerX; }
  get pointerY(): number { return this._pointerY; }

  // ============================================================
  // Cleanup
  // ============================================================

  /** Remove all event listeners and clean up. */
  destroy(): void {
    this.detachListeners();
    this.clearLongPress();
    this.removeAllListeners();
  }

  // ============================================================
  // Listener management
  // ============================================================

  private attachListeners(): void {
    if (!this.target) return;

    this.target.addEventListener('pointerdown', this.onPointerDown);
    this.target.addEventListener('pointermove', this.onPointerMove);
    this.target.addEventListener('pointerup', this.onPointerUp);
    this.target.addEventListener('pointercancel', this.onPointerCancel);

    // Touch events for pinch (two-finger)
    this.target.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.target.addEventListener('touchmove', this.onTouchMove, { passive: true });
    this.target.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  private detachListeners(): void {
    if (!this.target) return;

    this.target.removeEventListener('pointerdown', this.onPointerDown);
    this.target.removeEventListener('pointermove', this.onPointerMove);
    this.target.removeEventListener('pointerup', this.onPointerUp);
    this.target.removeEventListener('pointercancel', this.onPointerCancel);

    this.target.removeEventListener('touchstart', this.onTouchStart);
    this.target.removeEventListener('touchmove', this.onTouchMove);
    this.target.removeEventListener('touchend', this.onTouchEnd);
  }

  // ============================================================
  // Pointer event handlers
  // ============================================================

  private handlePointerDown(e: PointerEvent): void {
    this._isDown = true;
    this._isDragging = false;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.prevX = e.clientX;
    this.prevY = e.clientY;
    this.startTime = Date.now();
    this._pointerX = e.clientX;
    this._pointerY = e.clientY;

    this.scheduleLongPress(e.clientX, e.clientY);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this._isDown) return;

    const dx = e.clientX - this.prevX;
    const dy = e.clientY - this.prevY;
    this._pointerX = e.clientX;
    this._pointerY = e.clientY;

    const totalDist = this.dist(e.clientX, e.clientY, this.startX, this.startY);

    if (totalDist > DRAG_THRESHOLD) {
      this.clearLongPress();

      if (!this._isDragging) {
        this._isDragging = true;
        this.emit('drag-start', this.startX, this.startY);
      }

      this.emit('drag-move', e.clientX, e.clientY, dx, dy);
    }

    this.prevX = e.clientX;
    this.prevY = e.clientY;
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this._isDown) return;

    this.clearLongPress();

    const endX = e.clientX;
    const endY = e.clientY;
    const elapsed = Date.now() - this.startTime;
    const distance = this.dist(endX, endY, this.startX, this.startY);

    this._pointerX = endX;
    this._pointerY = endY;

    if (this._isDragging) {
      this._isDragging = false;
      this.emit('drag-end', endX, endY);
    } else if (distance < DRAG_THRESHOLD && elapsed <= this.config.tapTimeout) {
      // Tap
      this.handleTap(endX, endY);
    } else if (distance >= this.config.swipeThreshold && elapsed <= SWIPE_TIME_LIMIT) {
      // Swipe
      this.handleSwipe(endX, endY, elapsed);
    }

    this._isDown = false;
  }

  private handlePointerCancel(_e: PointerEvent): void {
    this.clearLongPress();
    if (this._isDragging) {
      this.emit('drag-end', this._pointerX, this._pointerY);
    }
    this._isDown = false;
    this._isDragging = false;
  }

  // ============================================================
  // Touch event handlers (for pinch only)
  // ============================================================

  private handleTouchStart(e: TouchEvent): void {
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      this.activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }

    if (this.activeTouches.size === 2) {
      this.initialPinchDistance = this.getTouchDistance();
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      this.activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }

    if (this.activeTouches.size === 2 && this.initialPinchDistance > 0) {
      const currentDist = this.getTouchDistance();
      const scale = currentDist / this.initialPinchDistance;
      const center = this.getTouchCenter();
      this.emit('pinch', scale, center.x, center.y);
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.activeTouches.delete(e.changedTouches[i].identifier);
    }

    if (this.activeTouches.size < 2) {
      this.initialPinchDistance = 0;
    }
  }

  // ============================================================
  // Gesture logic
  // ============================================================

  private handleTap(x: number, y: number): void {
    const now = Date.now();
    const timeSinceLast = now - this.lastTapTime;
    const distFromLast = this.dist(x, y, this.lastTapX, this.lastTapY);

    if (timeSinceLast <= this.config.doubleTapTimeout && distFromLast < DRAG_THRESHOLD) {
      this.emit('double-tap', x, y);
      // Reset so triple-tap doesn't trigger another double-tap
      this.lastTapTime = 0;
    } else {
      this.emit('tap', x, y);
      this.lastTapTime = now;
      this.lastTapX = x;
      this.lastTapY = y;
    }
  }

  private handleSwipe(endX: number, endY: number, elapsed: number): void {
    const dx = endX - this.startX;
    const dy = endY - this.startY;
    const distance = this.dist(endX, endY, this.startX, this.startY);
    const velocity = distance / elapsed; // px/ms

    let direction: 'up' | 'down' | 'left' | 'right';

    if (Math.abs(dx) >= Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    this.emit('swipe', direction, velocity, distance);
  }

  private scheduleLongPress(x: number, y: number): void {
    this.clearLongPress();
    this.longPressTimer = setTimeout(() => {
      this.longPressTimer = null;
      this.emit('long-press', x, y);
    }, this.config.longPressDelay);
  }

  private clearLongPress(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  // ============================================================
  // Utility
  // ============================================================

  private dist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchDistance(): number {
    const touches = Array.from(this.activeTouches.values());
    if (touches.length < 2) return 0;
    return this.dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
  }

  private getTouchCenter(): { x: number; y: number } {
    const touches = Array.from(this.activeTouches.values());
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].x + touches[1].x) / 2,
      y: (touches[0].y + touches[1].y) / 2,
    };
  }
}
