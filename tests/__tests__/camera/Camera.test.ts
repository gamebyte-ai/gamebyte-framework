/**
 * @jest-environment jsdom
 */

import { Camera, CameraConfig } from '../../../src/camera/Camera';

// ============================================================
// Mock container factory
// ============================================================

const createMockContainer = () => ({
  x: 0,
  y: 0,
  scale: { x: 1, y: 1 },
});

// ============================================================
// Helpers
// ============================================================

function makeCamera(overrides: Partial<CameraConfig> = {}): Camera {
  return new Camera({
    viewportWidth: 480,
    viewportHeight: 852,
    ...overrides,
  });
}

// ============================================================
// Tests
// ============================================================

describe('Camera', () => {
  // ----------------------------------------------------------
  // 1. Constructor
  // ----------------------------------------------------------
  describe('constructor', () => {
    it('sets viewport dimensions and exposes initial zoom of 1', () => {
      const cam = makeCamera({ viewportWidth: 320, viewportHeight: 568 });
      expect(cam.zoom).toBe(1);
      // position starts at origin
      expect(cam.x).toBe(0);
      expect(cam.y).toBe(0);
    });

    it('applies default zoom limits (0.25 – 4)', () => {
      const cam = makeCamera();
      // Trying to set zoom below min should clamp
      cam.setZoom(0.1);
      expect(cam.zoom).toBe(0.25);

      cam.setZoom(10);
      expect(cam.zoom).toBe(4);
    });

    it('respects custom zoom limits from config', () => {
      const cam = makeCamera({ minZoom: 0.5, maxZoom: 2 });
      cam.setZoom(0.1);
      expect(cam.zoom).toBe(0.5);

      cam.setZoom(5);
      expect(cam.zoom).toBe(2);
    });
  });

  // ----------------------------------------------------------
  // 2. attach()
  // ----------------------------------------------------------
  describe('attach()', () => {
    it('stores the container reference and applies initial transform', () => {
      const cam = makeCamera();
      const container = createMockContainer();

      cam.attach(container);

      // With camera at (0,0) and zoom=1 the container must be at viewport center
      expect(container.x).toBe(480 / 2);  // 240
      expect(container.y).toBe(852 / 2);  // 426
      expect(container.scale.x).toBe(1);
      expect(container.scale.y).toBe(1);
    });
  });

  // ----------------------------------------------------------
  // 3. moveTo()
  // ----------------------------------------------------------
  describe('moveTo()', () => {
    it('changes camera position immediately when instant=true', () => {
      const cam = makeCamera();
      cam.moveTo(100, 200, true);

      expect(cam.x).toBe(100);
      expect(cam.y).toBe(200);
    });

    it('applies inverse transform to container on instant moveTo', () => {
      const cam = makeCamera();
      const container = createMockContainer();
      cam.attach(container);

      cam.moveTo(100, 200, true);

      // container.x = viewportWidth/2 - worldX * zoom
      expect(container.x).toBe(480 / 2 - 100 * 1);   // 140
      expect(container.y).toBe(852 / 2 - 200 * 1);   // 226
    });

    it('emits "move" event on instant moveTo', () => {
      const cam = makeCamera();
      const listener = jest.fn();
      cam.on('move', listener);

      cam.moveTo(50, 75, true);

      expect(listener).toHaveBeenCalledWith(50, 75);
    });
  });

  // ----------------------------------------------------------
  // 4. follow() — lerp behavior
  // ----------------------------------------------------------
  describe('follow()', () => {
    it('lerps camera toward the target over multiple update() calls', () => {
      const cam = makeCamera();
      const target = { x: 200, y: 300 };

      cam.follow(target, { lerp: 0.5 });

      // After one update the camera should have moved partway
      cam.update(1 / 60);
      expect(cam.x).toBeGreaterThan(0);
      expect(cam.y).toBeGreaterThan(0);

      // After several updates it should be closer
      for (let i = 0; i < 20; i++) cam.update(1 / 60);

      expect(Math.abs(cam.x - 200)).toBeLessThan(5);
      expect(Math.abs(cam.y - 300)).toBeLessThan(5);
    });

    it('does not move camera when target is within dead zone', () => {
      const cam = makeCamera();
      // Start camera at (100, 100)
      cam.moveTo(100, 100, true);

      // Target is only 5px away — well inside a 20×20 dead zone
      const target = { x: 105, y: 100 };
      cam.follow(target, { lerp: 0.5, deadZone: { width: 20, height: 20 } });

      const xBefore = cam.x;
      cam.update(1 / 60);

      // Camera should not have moved because target is inside dead zone
      expect(cam.x).toBe(xBefore);
    });

    it('should follow at consistent speed regardless of frame rate', () => {
      const cam = new Camera({ viewportWidth: 800, viewportHeight: 600 });
      const container = { x: 0, y: 0, scale: { x: 1, y: 1 } };
      cam.attach(container);
      cam.follow({ x: 100, y: 0 }, { lerp: 0.1 });

      // Simulate 60fps (60 frames of 1/60s)
      cam.moveTo(0, 0, true);
      for (let i = 0; i < 60; i++) cam.update(1 / 60);
      const pos60fps = cam.x;

      // Simulate 30fps (30 frames of 1/30s) — same total time (1 second)
      cam.moveTo(0, 0, true);
      cam.follow({ x: 100, y: 0 }, { lerp: 0.1 });
      for (let i = 0; i < 30; i++) cam.update(1 / 30);
      const pos30fps = cam.x;

      // Both should reach approximately the same position
      expect(Math.abs(pos60fps - pos30fps)).toBeLessThan(5); // within 5px
    });

    it('moves camera when target exits dead zone', () => {
      const cam = makeCamera();
      cam.moveTo(100, 100, true);

      // Target is 30px away — outside a 20×20 dead zone
      const target = { x: 130, y: 100 };
      cam.follow(target, { lerp: 0.5, deadZone: { width: 20, height: 20 } });

      const xBefore = cam.x;
      cam.update(1 / 60);

      expect(cam.x).toBeGreaterThan(xBefore);
    });
  });

  // ----------------------------------------------------------
  // 5. Bounds clamping
  // ----------------------------------------------------------
  describe('bounds clamping', () => {
    it('prevents camera from moving outside world bounds', () => {
      const cam = makeCamera({
        bounds: { x: 0, y: 0, width: 2000, height: 2000 },
      });

      // Try to move camera far outside the right edge
      cam.moveTo(99999, 99999, true);

      // With viewport 480×852 and zoom=1 the half-extents are 240 and 426
      // maxX = 0 + 2000 - 240 = 1760
      // maxY = 0 + 2000 - 426 = 1574
      expect(cam.x).toBeLessThanOrEqual(1760);
      expect(cam.y).toBeLessThanOrEqual(1574);
    });

    it('prevents camera from going below min bounds', () => {
      const cam = makeCamera({
        bounds: { x: 0, y: 0, width: 2000, height: 2000 },
      });

      cam.moveTo(-99999, -99999, true);

      // minX = 0 + 240 = 240, minY = 0 + 426 = 426
      expect(cam.x).toBeGreaterThanOrEqual(240);
      expect(cam.y).toBeGreaterThanOrEqual(426);
    });
  });

  // ----------------------------------------------------------
  // 6. setZoom() / zoomBy()
  // ----------------------------------------------------------
  describe('setZoom()', () => {
    it('changes zoom level instantly when no duration given', () => {
      const cam = makeCamera();
      cam.setZoom(2);
      expect(cam.zoom).toBe(2);
    });

    it('clamps zoom to minZoom', () => {
      const cam = makeCamera({ minZoom: 0.5 });
      cam.setZoom(0.1);
      expect(cam.zoom).toBe(0.5);
    });

    it('clamps zoom to maxZoom', () => {
      const cam = makeCamera({ maxZoom: 3 });
      cam.setZoom(10);
      expect(cam.zoom).toBe(3);
    });

    it('emits "zoom-change" event when zoom changes', () => {
      const cam = makeCamera();
      const listener = jest.fn();
      cam.on('zoom-change', listener);

      cam.setZoom(1.5);
      expect(listener).toHaveBeenCalledWith(1.5);
    });

    it('zoomBy() adds delta to current target zoom', () => {
      const cam = makeCamera();
      cam.setZoom(1);
      cam.zoomBy(0.5);
      expect(cam.zoom).toBe(1.5);
    });

    it('updates container scale when attached', () => {
      const cam = makeCamera();
      const container = createMockContainer();
      cam.attach(container);

      cam.setZoom(2);

      expect(container.scale.x).toBe(2);
      expect(container.scale.y).toBe(2);
    });
  });

  // ----------------------------------------------------------
  // 7. shake()
  // ----------------------------------------------------------
  describe('shake()', () => {
    it('temporarily offsets the container position', () => {
      const cam = makeCamera();
      const container = createMockContainer();
      cam.attach(container);

      // Record base position (camera at 0,0)
      const baseX = container.x;
      const baseY = container.y;

      cam.shake(20, 1);

      // After one frame the shake offset should be non-zero (probabilistic but highly likely)
      // Use a fixed seed via mocking Math.random
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(1);
      cam.update(1 / 60);
      mockRandom.mockRestore();

      // Container should have shifted from its base position due to shake
      const movedX = container.x !== baseX;
      const movedY = container.y !== baseY;
      expect(movedX || movedY).toBe(true);
    });

    it('emits "shake-start" and "shake-end" events', () => {
      const cam = makeCamera();
      const container = createMockContainer();
      cam.attach(container);

      const onStart = jest.fn();
      const onEnd = jest.fn();
      cam.on('shake-start', onStart);
      cam.on('shake-end', onEnd);

      cam.shake(10, 0.1); // 100ms shake
      expect(onStart).toHaveBeenCalledTimes(1);

      // Advance past duration — 0.1 seconds in one big step
      cam.update(0.2);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------
  // 8. screenToWorld / worldToScreen
  // ----------------------------------------------------------
  describe('coordinate conversion', () => {
    it('screenToWorld and worldToScreen are inverse operations', () => {
      const cam = makeCamera();
      cam.moveTo(150, 300, true);
      cam.setZoom(1.5);

      const worldPt = { x: 250, y: 400 };

      // Convert to screen and back
      const screen = cam.worldToScreen(worldPt.x, worldPt.y);
      const recovered = cam.screenToWorld(screen.x, screen.y);

      expect(recovered.x).toBeCloseTo(worldPt.x, 5);
      expect(recovered.y).toBeCloseTo(worldPt.y, 5);
    });

    it('screenToWorld maps viewport center to camera position', () => {
      const cam = makeCamera();
      cam.moveTo(100, 200, true);

      const world = cam.screenToWorld(480 / 2, 852 / 2);

      expect(world.x).toBeCloseTo(100, 5);
      expect(world.y).toBeCloseTo(200, 5);
    });
  });

  // ----------------------------------------------------------
  // 9. destroy()
  // ----------------------------------------------------------
  describe('destroy()', () => {
    it('clears container reference so further updates are no-ops', () => {
      const cam = makeCamera();
      const container = createMockContainer();
      cam.attach(container);

      cam.destroy();

      // update() after destroy should not throw
      expect(() => cam.update(1 / 60)).not.toThrow();
    });

    it('removes all event listeners', () => {
      const cam = makeCamera();
      const listener = jest.fn();
      cam.on('move', listener);

      cam.destroy();
      cam.moveTo(10, 20, true); // would normally emit 'move' but camera is destroyed

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
