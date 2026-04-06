/**
 * @jest-environment jsdom
 */

import { OrbitalController } from '../../../../src/camera/controllers/OrbitalController';
import { TopDownController } from '../../../../src/camera/controllers/TopDownController';
import { IsometricController } from '../../../../src/camera/controllers/IsometricController';
import { FrontController } from '../../../../src/camera/controllers/FrontController';
import { ICamera3D } from '../../../../src/camera/controllers/CameraController3D';

// ---- Mock camera -----------------------------------------------------------

function makeCamera(): ICamera3D & { _lookAtCalls: Array<[number, number, number]> } {
  const cam = {
    position: { x: 0, y: 0, z: 0, set(x: number, y: number, z: number) {
      cam.position.x = x; cam.position.y = y; cam.position.z = z;
    }},
    _lookAtCalls: [] as Array<[number, number, number]>,
    lookAt(x: number, y: number, z: number) {
      cam._lookAtCalls.push([x, y, z]);
    },
  };
  return cam;
}

const origin = { x: 0, y: 0, z: 0 };
const focus  = { x: 5, y: 2, z: 3 };

// ---- OrbitalController -------------------------------------------------------

describe('OrbitalController', () => {
  it('positions camera using spherical coordinates (default config at origin)', () => {
    const ctrl = new OrbitalController({ damping: 0 });
    const cam = makeCamera();

    ctrl.apply(cam, origin, 0.016);

    // Default: azimuth=0, pitch=PI/4, distance=10
    // x = 0 + 10 * cos(PI/4) * sin(0) = 0
    // y = 0 + 10 * sin(PI/4) ≈ 7.07
    // z = 0 + 10 * cos(PI/4) * cos(0) ≈ 7.07
    expect(cam.position.x).toBeCloseTo(0, 4);
    expect(cam.position.y).toBeCloseTo(10 * Math.sin(Math.PI / 4), 3);
    expect(cam.position.z).toBeCloseTo(10 * Math.cos(Math.PI / 4), 3);
  });

  it('lookAt is called with the focus point', () => {
    const ctrl = new OrbitalController({ damping: 0 });
    const cam = makeCamera();

    ctrl.apply(cam, focus, 0.016);

    expect(cam._lookAtCalls.length).toBeGreaterThan(0);
    const lastLookAt = cam._lookAtCalls[cam._lookAtCalls.length - 1];
    expect(lastLookAt[0]).toBe(focus.x);
    expect(lastLookAt[1]).toBe(focus.y);
    expect(lastLookAt[2]).toBe(focus.z);
  });

  it('rotate() changes azimuth and pitch', () => {
    const ctrl = new OrbitalController({ azimuth: 0, pitch: 0.5, damping: 0 });
    ctrl.rotate(Math.PI / 2, 0.1);

    const cam = makeCamera();
    ctrl.apply(cam, origin, 0.016);

    // After rotating azimuth by PI/2, x component should dominate
    expect(cam.position.x).toBeGreaterThan(0.5);
  });

  it('zoom() changes distance with clamping', () => {
    const ctrl = new OrbitalController({ distance: 10, minDistance: 5, maxDistance: 20, damping: 0 });

    ctrl.zoom(-6); // would go to 4, clamped to 5
    const cam = makeCamera();
    ctrl.apply(cam, origin, 0.016);

    const dist = Math.sqrt(
      cam.position.x ** 2 + cam.position.y ** 2 + cam.position.z ** 2
    );
    expect(dist).toBeCloseTo(5, 1);
  });

  it('zoom() clamps to maxDistance', () => {
    const ctrl = new OrbitalController({ distance: 10, maxDistance: 20, damping: 0 });
    ctrl.zoom(100); // would go far past maxDistance

    const cam = makeCamera();
    ctrl.apply(cam, origin, 0.016);

    const dist = Math.sqrt(
      cam.position.x ** 2 + cam.position.y ** 2 + cam.position.z ** 2
    );
    expect(dist).toBeCloseTo(20, 1);
  });

  it('pitch is clamped to minPitch / maxPitch', () => {
    const minPitch = 0.1;
    const maxPitch = Math.PI / 2 - 0.1;
    const ctrl = new OrbitalController({ minPitch, maxPitch, pitch: 0.5, damping: 0 });

    ctrl.rotate(0, -Math.PI); // attempt to go far below minimum
    expect(ctrl.pitch).toBeGreaterThanOrEqual(minPitch);

    ctrl.rotate(0, Math.PI * 2); // attempt to go far above maximum
    expect(ctrl.pitch).toBeLessThanOrEqual(maxPitch);
  });

  it('isOrthographic is false', () => {
    expect(new OrbitalController().isOrthographic).toBe(false);
  });

  it('destroy() does not throw', () => {
    expect(() => new OrbitalController().destroy()).not.toThrow();
  });
});

// ---- TopDownController -------------------------------------------------------

describe('TopDownController', () => {
  it('positions camera directly above focus', () => {
    const ctrl = new TopDownController({ height: 15 });
    const cam = makeCamera();

    ctrl.apply(cam, focus, 0.016);

    expect(cam.position.x).toBe(focus.x);
    expect(cam.position.y).toBe(focus.y + 15);
    expect(cam.position.z).toBe(focus.z);
  });

  it('uses default height of 10', () => {
    const ctrl = new TopDownController();
    const cam = makeCamera();

    ctrl.apply(cam, origin, 0.016);

    expect(cam.position.y).toBe(10);
  });

  it('isOrthographic is true', () => {
    expect(new TopDownController().isOrthographic).toBe(true);
  });

  it('lookAt is called with focus coordinates', () => {
    const ctrl = new TopDownController();
    const cam = makeCamera();
    ctrl.apply(cam, focus, 0.016);

    const lastLookAt = cam._lookAtCalls[cam._lookAtCalls.length - 1];
    expect(lastLookAt).toEqual([focus.x, focus.y, focus.z]);
  });
});

// ---- IsometricController -----------------------------------------------------

describe('IsometricController', () => {
  it('positions camera at equal offset on all axes', () => {
    const ctrl = new IsometricController({ distance: 10 });
    const cam = makeCamera();

    ctrl.apply(cam, origin, 0.016);

    expect(cam.position.x).toBe(10);
    expect(cam.position.y).toBe(10);
    expect(cam.position.z).toBe(10);
  });

  it('applies offset relative to focus point', () => {
    const ctrl = new IsometricController({ distance: 5 });
    const cam = makeCamera();

    ctrl.apply(cam, focus, 0.016);

    expect(cam.position.x).toBe(focus.x + 5);
    expect(cam.position.y).toBe(focus.y + 5);
    expect(cam.position.z).toBe(focus.z + 5);
  });

  it('isOrthographic is true', () => {
    expect(new IsometricController().isOrthographic).toBe(true);
  });
});

// ---- FrontController ---------------------------------------------------------

describe('FrontController', () => {
  it('positions camera in front of focus along Z axis', () => {
    const ctrl = new FrontController({ distance: 12 });
    const cam = makeCamera();

    ctrl.apply(cam, focus, 0.016);

    expect(cam.position.x).toBe(focus.x);
    expect(cam.position.y).toBe(focus.y);
    expect(cam.position.z).toBe(focus.z + 12);
  });

  it('uses default distance of 10', () => {
    const ctrl = new FrontController();
    const cam = makeCamera();

    ctrl.apply(cam, origin, 0.016);

    expect(cam.position.z).toBe(10);
  });

  it('isOrthographic is false', () => {
    expect(new FrontController().isOrthographic).toBe(false);
  });
});
