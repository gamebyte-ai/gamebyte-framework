import { WorldObject3D } from '../../../../src/three/interaction/WorldObject3D.js';
import { RaycastInputManager } from '../../../../src/three/interaction/RaycastInputManager.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCanvas(): HTMLElement {
  const canvas = document.createElement('canvas');
  // Stub getBoundingClientRect so NDC calculations don't produce NaN
  canvas.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
  return canvas;
}

function fakeEvent(clientX = 0, clientY = 0): MouseEvent {
  return new MouseEvent('pointerdown', { clientX, clientY });
}

// ---------------------------------------------------------------------------
// WorldObject3D tests
// ---------------------------------------------------------------------------

describe('WorldObject3D', () => {
  it('constructs with interactive=true by default', () => {
    const obj = new WorldObject3D();
    expect(obj.interactive).toBe(true);
    expect(obj.isHovered).toBe(false);
  });

  it('emits pointerdown event when handlePointerDown is called', () => {
    const obj = new WorldObject3D();
    const listener = jest.fn();
    obj.on('pointerdown', listener);

    const evt = fakeEvent();
    obj.handlePointerDown(evt, true);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(evt, true);
  });

  it('passes isRaycasted=false correctly via handlePointerDown', () => {
    const obj = new WorldObject3D();
    const listener = jest.fn();
    obj.on('pointerdown', listener);

    obj.handlePointerDown(fakeEvent(), false);

    expect(listener).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('emits pointermove and pointerup with correct isRaycasted flag', () => {
    const obj = new WorldObject3D();
    const moveFn = jest.fn();
    const upFn = jest.fn();
    obj.on('pointermove', moveFn);
    obj.on('pointerup', upFn);

    const evt = fakeEvent();
    obj.handlePointerMove(evt, true);
    obj.handlePointerUp(evt, false);

    expect(moveFn).toHaveBeenCalledWith(evt, true);
    expect(upFn).toHaveBeenCalledWith(evt, false);
  });

  it('tracks hover state: handlePointerEnter sets isHovered true', () => {
    const obj = new WorldObject3D();
    const enterFn = jest.fn();
    obj.on('pointerenter', enterFn);

    expect(obj.isHovered).toBe(false);
    obj.handlePointerEnter();

    expect(obj.isHovered).toBe(true);
    expect(enterFn).toHaveBeenCalledTimes(1);
  });

  it('tracks hover state: handlePointerLeave sets isHovered false', () => {
    const obj = new WorldObject3D();
    const leaveFn = jest.fn();
    obj.on('pointerleave', leaveFn);

    obj.handlePointerEnter();
    expect(obj.isHovered).toBe(true);

    obj.handlePointerLeave();
    expect(obj.isHovered).toBe(false);
    expect(leaveFn).toHaveBeenCalledTimes(1);
  });

  it('destroy() removes all listeners and resets hover', () => {
    const obj = new WorldObject3D();
    const listener = jest.fn();
    obj.on('pointerdown', listener);
    obj.handlePointerEnter();

    obj.destroy();

    // Listeners should be gone
    obj.handlePointerDown(fakeEvent(), true);
    expect(listener).not.toHaveBeenCalled();

    // Hover state should be reset
    expect(obj.isHovered).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RaycastInputManager tests
// ---------------------------------------------------------------------------

describe('RaycastInputManager', () => {
  it('registers handlers and handlerCount reflects count', () => {
    const mgr = new RaycastInputManager();
    const a = new WorldObject3D();
    const b = new WorldObject3D();

    expect(mgr.handlerCount).toBe(0);
    mgr.addHandler(a);
    expect(mgr.handlerCount).toBe(1);
    mgr.addHandler(b);
    expect(mgr.handlerCount).toBe(2);
  });

  it('removeHandler unregisters a handler and decrements handlerCount', () => {
    const mgr = new RaycastInputManager();
    const obj = new WorldObject3D();

    mgr.addHandler(obj);
    expect(mgr.handlerCount).toBe(1);

    mgr.removeHandler(obj);
    expect(mgr.handlerCount).toBe(0);
  });

  it('startListening attaches pointer events to the canvas', () => {
    const canvas = makeCanvas();
    const addSpy = jest.spyOn(canvas, 'addEventListener');

    const mgr = new RaycastInputManager();
    mgr.attach(canvas);
    mgr.startListening();

    const eventNames = addSpy.mock.calls.map((c) => c[0]);
    expect(eventNames).toContain('pointerdown');
    expect(eventNames).toContain('pointermove');
    expect(eventNames).toContain('pointerup');

    mgr.destroy();
  });

  it('stopListening detaches pointer events from the canvas', () => {
    const canvas = makeCanvas();
    const removeSpy = jest.spyOn(canvas, 'removeEventListener');

    const mgr = new RaycastInputManager();
    mgr.attach(canvas);
    mgr.startListening();
    mgr.stopListening();

    const eventNames = removeSpy.mock.calls.map((c) => c[0]);
    expect(eventNames).toContain('pointerdown');
    expect(eventNames).toContain('pointermove');
    expect(eventNames).toContain('pointerup');

    mgr.destroy();
  });

  it('broadcastPointerDown sends event to all registered handlers', () => {
    const mgr = new RaycastInputManager();
    const a = new WorldObject3D();
    const b = new WorldObject3D();
    const spyA = jest.spyOn(a, 'handlePointerDown');
    const spyB = jest.spyOn(b, 'handlePointerDown');

    mgr.addHandler(a);
    mgr.addHandler(b);

    const evt = fakeEvent();
    mgr.broadcastPointerDown(evt, a);

    expect(spyA).toHaveBeenCalledWith(evt, true);
    expect(spyB).toHaveBeenCalledWith(evt, false);

    mgr.destroy();
  });

  it('destroy() stops listening, clears handlers, and removes all emitter listeners', () => {
    const canvas = makeCanvas();
    const mgr = new RaycastInputManager();
    const obj = new WorldObject3D();
    const emitterSpy = jest.fn();

    mgr.attach(canvas);
    mgr.addHandler(obj);
    mgr.startListening();
    mgr.on('pointerdown', emitterSpy);

    mgr.destroy();

    expect(mgr.handlerCount).toBe(0);

    // After destroy the emitter listeners are gone — broadcasting should not trigger them
    mgr.broadcastPointerDown(fakeEvent(), null);
    expect(emitterSpy).not.toHaveBeenCalled();
  });
});
