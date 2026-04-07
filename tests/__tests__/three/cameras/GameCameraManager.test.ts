/**
 * @jest-environment jsdom
 *
 * GameCameraManager tests — no real Three.js rendering needed.
 * Mock cameras and controllers use duck typing to match the interfaces.
 */

import { GameCameraManager } from '../../../../src/three/cameras/GameCameraManager';
import { ICameraController3D, ICamera3D, FocusPoint } from '../../../../src/camera/controllers/CameraController3D';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Creates a minimal mock camera that satisfies the duck-typed ICamera3D contract. */
function makeMockCamera(isOrtho = false) {
  return {
    position: {
      x: 0,
      y: 0,
      z: 0,
      set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
      },
    },
    lookAt(_x: number, _y: number, _z: number) { /* no-op */ },
    // Ortho cameras also expose these; they are checked via duck-typing in THREE code
    left: 0, right: 0, top: 0, bottom: 0,
    updateProjectionMatrix() { /* no-op */ },
    zoom: 1,
    fov: 60,
    aspect: 1,
    // Tag so tests can inspect which camera was active
    _isOrtho: isOrtho,
  };
}

/** Creates a minimal ICameraController3D mock. */
function makeMockController(opts: {
  isOrthographic?: boolean;
  onApply?: (camera: ICamera3D, focus: FocusPoint, dt: number) => void;
} = {}): ICameraController3D & { applyCalls: Array<{ focus: FocusPoint; dt: number }> } {
  const ctrl = {
    isOrthographic: opts.isOrthographic ?? false,
    applyCalls: [] as Array<{ focus: FocusPoint; dt: number }>,
    apply(camera: ICamera3D, focus: FocusPoint, dt: number) {
      ctrl.applyCalls.push({ focus: { ...focus }, dt });
      if (opts.onApply) opts.onApply(camera, focus, dt);
    },
    destroy: jest.fn(),
  };
  return ctrl;
}

/** Default viewport for convenience */
const DEFAULT_VIEWPORT = { viewportWidth: 800, viewportHeight: 600 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GameCameraManager', () => {

  // 1. Constructor defaults
  it('constructs with defaults and exposes an active state of true', () => {
    const mgr = new GameCameraManager(DEFAULT_VIEWPORT);

    expect(mgr.isActive).toBe(true);
    expect(mgr.getCamera()).toBeDefined();
    expect(mgr.getCurrentPosition()).toEqual({ x: 0, y: 0, z: 0 });
  });

  // 2. setController stores the controller
  it('setController() stores the given controller', () => {
    const mgr  = new GameCameraManager(DEFAULT_VIEWPORT);
    const ctrl = makeMockController();

    mgr.setController(ctrl);

    // Calling update should delegate to the controller
    mgr.update(0.016);
    expect(ctrl.applyCalls.length).toBe(1);
  });

  // 3. Creates ortho camera when controller.isOrthographic === true
  it('switches to orthographic camera for an orthographic controller', () => {
    const mgr  = new GameCameraManager(DEFAULT_VIEWPORT);
    const ctrl = makeMockController({ isOrthographic: true });

    const switched: Array<unknown> = [];
    mgr.on('camera-switched', (cam) => switched.push(cam));

    mgr.setController(ctrl);

    // The switch event should have fired (perspective → ortho)
    expect(switched.length).toBe(1);

    // The returned camera should be an OrthographicCamera (THREE)
    const cam = mgr.getCamera();
    // THREE.OrthographicCamera has `isOrthographicCamera` === true
    expect((cam as unknown as Record<string, unknown>).isOrthographicCamera).toBe(true);
  });

  // 4. Creates perspective camera for non-ortho controller
  it('switches to perspective camera for a non-orthographic controller', () => {
    const mgr = new GameCameraManager(DEFAULT_VIEWPORT);

    // First set an ortho controller to force the camera to ortho
    mgr.setController(makeMockController({ isOrthographic: true }));
    const switched: Array<unknown> = [];
    mgr.on('camera-switched', (cam) => switched.push(cam));

    // Now switch to a perspective controller
    mgr.setController(makeMockController({ isOrthographic: false }));

    expect(switched.length).toBe(1);
    const cam = mgr.getCamera();
    expect((cam as unknown as Record<string, unknown>).isPerspectiveCamera).toBe(true);
  });

  // 5. followPosition + update lerps toward target
  it('followPosition() causes update() to lerp currentPosition toward target', () => {
    const mgr  = new GameCameraManager({ ...DEFAULT_VIEWPORT, followEasing: 100 }); // very snappy
    const ctrl = makeMockController();
    mgr.setController(ctrl);

    mgr.followPosition(10, 5, 3);
    mgr.update(1); // large dt so exp easing is essentially 1

    const pos = mgr.getCurrentPosition();
    expect(pos.x).toBeCloseTo(10, 0);
    expect(pos.y).toBeCloseTo(5, 0);
    expect(pos.z).toBeCloseTo(3, 0);
  });

  // 6. stopFollow() stops movement
  it('stopFollow() stops movement toward the previous target', () => {
    const mgr  = new GameCameraManager({ ...DEFAULT_VIEWPORT, followEasing: 100 });
    const ctrl = makeMockController();
    mgr.setController(ctrl);

    mgr.followPosition(10, 0, 0);
    mgr.update(0.001); // tiny dt — move a little

    const posAfterPartialMove = mgr.getCurrentPosition();
    expect(posAfterPartialMove.x).toBeGreaterThan(0);

    mgr.stopFollow();
    const posBeforeUpdate = mgr.getCurrentPosition();
    mgr.update(0.5); // large dt — should not move further
    const posAfterUpdate = mgr.getCurrentPosition();

    expect(posAfterUpdate.x).toBeCloseTo(posBeforeUpdate.x, 5);
    expect(posAfterUpdate.y).toBeCloseTo(posBeforeUpdate.y, 5);
    expect(posAfterUpdate.z).toBeCloseTo(posBeforeUpdate.z, 5);
  });

  // 7. setOrthoSize updates projection
  it('setOrthoSize() updates the orthographic projection bounds', () => {
    const mgr = new GameCameraManager({ ...DEFAULT_VIEWPORT, orthoSize: 10 });
    const ctrl = makeMockController({ isOrthographic: true });
    mgr.setController(ctrl);

    // Obtain the THREE.OrthographicCamera
    const cam = mgr.getCamera() as THREE.Camera & {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };

    // Initial half-size should be 5 (orthoSize / 2)
    expect(cam.top).toBeCloseTo(5, 4);
    expect(cam.bottom).toBeCloseTo(-5, 4);

    mgr.setOrthoSize(20);

    // After update, half-size should be 10
    expect(cam.top).toBeCloseTo(10, 4);
    expect(cam.bottom).toBeCloseTo(-10, 4);
  });

  // 8. resize handles viewport change
  it('resize() updates both ortho and perspective camera projections', () => {
    const mgr  = new GameCameraManager(DEFAULT_VIEWPORT);
    const ctrl = makeMockController({ isOrthographic: true });
    mgr.setController(ctrl);

    const cam = mgr.getCamera() as THREE.Camera & {
      left: number;
      right: number;
      aspect?: number;
    };

    mgr.resize(1600, 900);

    // For ortho camera the left/right should reflect the new aspect ratio
    const newAspect = 1600 / 900;
    const expectedHalfX = (10 / 2) * newAspect; // orthoSize default = 10
    expect(cam.right).toBeCloseTo(expectedHalfX, 3);
    expect(cam.left).toBeCloseTo(-expectedHalfX, 3);
  });

  // 9. setPosition moves instantly and stops follow
  it('setPosition() instantly moves currentPosition and stops follow', () => {
    const mgr  = new GameCameraManager(DEFAULT_VIEWPORT);
    const ctrl = makeMockController();
    mgr.setController(ctrl);

    mgr.followPosition(100, 100, 100);
    mgr.setPosition(7, 3, 1);

    const pos = mgr.getCurrentPosition();
    expect(pos).toEqual({ x: 7, y: 3, z: 1 });

    // Running update with large dt should not move because follow was cleared
    mgr.update(1);
    expect(mgr.getCurrentPosition()).toEqual({ x: 7, y: 3, z: 1 });
  });

  // 10. activate / deactivate
  it('activate() and deactivate() toggle isActive', () => {
    const mgr = new GameCameraManager(DEFAULT_VIEWPORT);

    expect(mgr.isActive).toBe(true);
    mgr.deactivate();
    expect(mgr.isActive).toBe(false);
    mgr.activate();
    expect(mgr.isActive).toBe(true);
  });

  // 11. update does nothing when deactivated
  it('update() does nothing when deactivated', () => {
    const mgr  = new GameCameraManager({ ...DEFAULT_VIEWPORT, followEasing: 100 });
    const ctrl = makeMockController();
    mgr.setController(ctrl);
    mgr.followPosition(50, 50, 50);

    mgr.deactivate();
    mgr.update(1);

    // Controller should not have been called
    expect(ctrl.applyCalls.length).toBe(0);
    // Position should not have moved
    expect(mgr.getCurrentPosition()).toEqual({ x: 0, y: 0, z: 0 });
  });

  // 12. destroy cleans up
  it('destroy() calls controller.destroy() and removes event listeners', () => {
    const mgr  = new GameCameraManager(DEFAULT_VIEWPORT);
    const ctrl = makeMockController();
    mgr.setController(ctrl);

    const listenerFired = jest.fn();
    mgr.on('controller-changed', listenerFired);

    mgr.destroy();

    // Controller should have been destroyed
    expect(ctrl.destroy).toHaveBeenCalledTimes(1);

    // After destroy, setting a new controller should not emit events
    // (listeners were removed)
    mgr.setController(makeMockController());
    expect(listenerFired).not.toHaveBeenCalled();
  });

});

// Needed for the THREE type assertion in test 7/8
import type * as THREE from 'three';
