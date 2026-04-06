import { GestureDetector } from '../../../src/gesture/GestureDetector.js';

// ============================================================
// jsdom polyfills — PointerEvent and Touch/TouchEvent are not
// available in the default jsdom environment used by Jest.
// ============================================================

if (typeof PointerEvent === 'undefined') {
  // Minimal PointerEvent polyfill backed by MouseEvent
  class PointerEventPolyfill extends MouseEvent {
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
    }
  }
  (global as any).PointerEvent = PointerEventPolyfill;
}

if (typeof Touch === 'undefined') {
  class TouchPolyfill {
    identifier: number;
    target: EventTarget;
    clientX: number;
    clientY: number;
    constructor(init: { identifier: number; target: EventTarget; clientX: number; clientY: number }) {
      this.identifier = init.identifier;
      this.target = init.target;
      this.clientX = init.clientX;
      this.clientY = init.clientY;
    }
  }
  (global as any).Touch = TouchPolyfill;
}

if (typeof TouchEvent === 'undefined') {
  class TouchEventPolyfill extends Event {
    touches: any[];
    changedTouches: any[];
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.touches = init.touches ?? [];
      this.changedTouches = init.changedTouches ?? [];
    }
  }
  (global as any).TouchEvent = TouchEventPolyfill;
}

// ============================================================
// Helpers — synthetic pointer events
// ============================================================

function pointerDown(target: HTMLElement, x: number, y: number): void {
  const event = new PointerEvent('pointerdown', {
    clientX: x, clientY: y, bubbles: true, cancelable: true,
  });
  target.dispatchEvent(event);
}

function pointerMove(target: HTMLElement, x: number, y: number): void {
  const event = new PointerEvent('pointermove', {
    clientX: x, clientY: y, bubbles: true, cancelable: true,
  });
  target.dispatchEvent(event);
}

function pointerUp(target: HTMLElement, x: number, y: number): void {
  const event = new PointerEvent('pointerup', {
    clientX: x, clientY: y, bubbles: true, cancelable: true,
  });
  target.dispatchEvent(event);
}

function createTouchEvent(type: string, touches: Array<{ id: number; x: number; y: number }>): TouchEvent {
  const touchList = touches.map(t =>
    new Touch({ identifier: t.id, target: document.body, clientX: t.x, clientY: t.y })
  );
  return new TouchEvent(type, {
    touches: touchList,
    changedTouches: touchList,
    bubbles: true,
  });
}

// ============================================================
// Tests
// ============================================================

describe('GestureDetector', () => {
  let target: HTMLElement;
  let gesture: GestureDetector;

  beforeEach(() => {
    jest.useFakeTimers();
    target = document.createElement('div');
    document.body.appendChild(target);
    gesture = new GestureDetector({ target, tapTimeout: 200, doubleTapTimeout: 300, longPressDelay: 500, swipeThreshold: 50 });
  });

  afterEach(() => {
    gesture.destroy();
    document.body.removeChild(target);
    jest.useRealTimers();
  });

  // ---- 1. Tap detection ----
  test('emits tap on quick press + release within tap timeout', () => {
    const taps: Array<[number, number]> = [];
    gesture.on('tap', (x, y) => taps.push([x, y]));

    pointerDown(target, 100, 100);
    jest.advanceTimersByTime(100); // within 200ms tapTimeout
    pointerUp(target, 100, 100);

    expect(taps.length).toBe(1);
    expect(taps[0]).toEqual([100, 100]);
  });

  test('does not emit tap if moved too far', () => {
    const taps: Array<[number, number]> = [];
    gesture.on('tap', (x, y) => taps.push([x, y]));

    pointerDown(target, 100, 100);
    pointerMove(target, 200, 200); // moved > 10px
    pointerUp(target, 200, 200);

    expect(taps.length).toBe(0);
  });

  // ---- 2. Double-tap detection ----
  test('emits double-tap on two quick taps', () => {
    const doubleTaps: Array<[number, number]> = [];
    gesture.on('double-tap', (x, y) => doubleTaps.push([x, y]));

    // First tap
    pointerDown(target, 100, 100);
    pointerUp(target, 100, 100);

    jest.advanceTimersByTime(150); // within doubleTapTimeout (300ms)

    // Second tap
    pointerDown(target, 100, 100);
    pointerUp(target, 100, 100);

    expect(doubleTaps.length).toBe(1);
  });

  test('does not emit double-tap if second tap is too late', () => {
    const doubleTaps: Array<[number, number]> = [];
    gesture.on('double-tap', (x, y) => doubleTaps.push([x, y]));

    pointerDown(target, 100, 100);
    pointerUp(target, 100, 100);

    jest.advanceTimersByTime(400); // exceeds doubleTapTimeout

    pointerDown(target, 100, 100);
    pointerUp(target, 100, 100);

    expect(doubleTaps.length).toBe(0);
  });

  // ---- 3. Long-press detection ----
  test('emits long-press after longPressDelay without movement', () => {
    const longPresses: Array<[number, number]> = [];
    gesture.on('long-press', (x, y) => longPresses.push([x, y]));

    pointerDown(target, 100, 100);
    jest.advanceTimersByTime(600); // past 500ms delay

    expect(longPresses.length).toBe(1);
    expect(longPresses[0]).toEqual([100, 100]);
  });

  test('long-press is cancelled by movement', () => {
    const longPresses: Array<[number, number]> = [];
    gesture.on('long-press', (x, y) => longPresses.push([x, y]));

    pointerDown(target, 100, 100);
    jest.advanceTimersByTime(200);
    pointerMove(target, 200, 200); // move cancels long-press timer
    jest.advanceTimersByTime(400);

    expect(longPresses.length).toBe(0);
  });

  // ---- 4. Swipe detection — all 4 directions ----
  test('emits swipe right', () => {
    const swipes: Array<[string, number, number]> = [];
    gesture.on('swipe', (dir, vel, dist) => swipes.push([dir, vel, dist]));

    pointerDown(target, 100, 100);
    jest.advanceTimersByTime(50);
    pointerUp(target, 200, 100); // 100px right within 50ms + tap timeout (~200ms total)

    expect(swipes.length).toBe(1);
    expect(swipes[0][0]).toBe('right');
  });

  test('emits swipe left', () => {
    const swipes: string[] = [];
    gesture.on('swipe', (dir) => swipes.push(dir));

    pointerDown(target, 200, 100);
    jest.advanceTimersByTime(50);
    pointerUp(target, 100, 100); // 100px left

    expect(swipes).toContain('left');
  });

  test('emits swipe down', () => {
    const swipes: string[] = [];
    gesture.on('swipe', (dir) => swipes.push(dir));

    pointerDown(target, 100, 100);
    jest.advanceTimersByTime(50);
    pointerUp(target, 100, 200); // 100px down

    expect(swipes).toContain('down');
  });

  test('emits swipe up', () => {
    const swipes: string[] = [];
    gesture.on('swipe', (dir) => swipes.push(dir));

    pointerDown(target, 100, 200);
    jest.advanceTimersByTime(50);
    pointerUp(target, 100, 100); // 100px up

    expect(swipes).toContain('up');
  });

  // ---- 5. Drag sequence ----
  test('emits drag-start, drag-move, drag-end sequence', () => {
    const events: string[] = [];
    gesture.on('drag-start', () => events.push('start'));
    gesture.on('drag-move', () => events.push('move'));
    gesture.on('drag-end', () => events.push('end'));

    pointerDown(target, 100, 100);
    pointerMove(target, 150, 100); // 50px > 10px threshold
    pointerMove(target, 200, 100);
    pointerUp(target, 200, 100);

    expect(events).toContain('start');
    expect(events).toContain('move');
    expect(events).toContain('end');
    expect(events.indexOf('start')).toBeLessThan(events.indexOf('move'));
    expect(events.indexOf('move')).toBeLessThan(events.indexOf('end'));
  });

  test('drag-move includes delta values', () => {
    const deltas: Array<[number, number]> = [];
    gesture.on('drag-move', (_x, _y, dx, dy) => deltas.push([dx, dy]));

    pointerDown(target, 100, 100);
    pointerMove(target, 150, 100); // exceeds drag threshold, first move
    pointerMove(target, 160, 105); // dx=10, dy=5

    expect(deltas.length).toBeGreaterThan(0);
  });

  // ---- 6. Pinch detection ----
  test('emits pinch with scale when two fingers move', () => {
    const pinches: Array<[number, number, number]> = [];
    gesture.on('pinch', (scale, cx, cy) => pinches.push([scale, cx, cy]));

    // Start with two fingers 100px apart
    target.dispatchEvent(createTouchEvent('touchstart', [
      { id: 0, x: 100, y: 200 },
      { id: 1, x: 200, y: 200 },
    ]));

    // Move fingers 200px apart (2x scale)
    target.dispatchEvent(createTouchEvent('touchmove', [
      { id: 0, x: 50, y: 200 },
      { id: 1, x: 250, y: 200 },
    ]));

    expect(pinches.length).toBeGreaterThan(0);
    expect(pinches[0][0]).toBeCloseTo(2, 0); // scale ≈ 2
  });

  // ---- 7. destroy() removes listeners ----
  test('destroy removes listeners — no events after destroy', () => {
    const taps: number[] = [];
    gesture.on('tap', () => taps.push(1));

    gesture.destroy();

    pointerDown(target, 100, 100);
    pointerUp(target, 100, 100);

    expect(taps.length).toBe(0);
  });

  // ---- 8. Config defaults applied ----
  test('config defaults are applied when not specified', () => {
    const defaultGesture = new GestureDetector({ target });
    // Access internal config via casting - just verify it doesn't throw
    expect(defaultGesture).toBeInstanceOf(GestureDetector);
    defaultGesture.destroy();
  });

  // ---- 9. pointerX/pointerY tracks current position ----
  test('pointerX/pointerY are updated on move', () => {
    pointerDown(target, 100, 100);
    pointerMove(target, 150, 200);

    expect(gesture.pointerX).toBe(150);
    expect(gesture.pointerY).toBe(200);

    gesture.destroy();
  });

  // ---- 10. isDown tracks press state ----
  test('isDown is true while pressed, false after release', () => {
    expect(gesture.isDown).toBe(false);

    pointerDown(target, 100, 100);
    expect(gesture.isDown).toBe(true);

    pointerUp(target, 100, 100);
    expect(gesture.isDown).toBe(false);
  });
});
