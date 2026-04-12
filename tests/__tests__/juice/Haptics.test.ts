import { Haptics } from '../../../src/juice/Haptics.js';

describe('Haptics', () => {
  let vibrateSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset enabled state before each test
    Haptics.setEnabled(true);

    // Mock navigator.vibrate
    vibrateSpy = jest.fn();
    Object.defineProperty(global.navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('supported returns true when navigator.vibrate exists', () => {
    expect(Haptics.supported).toBe(true);
  });

  test('light() calls vibrate with 15ms', () => {
    Haptics.light();
    expect(vibrateSpy).toHaveBeenCalledWith(15);
  });

  test('medium() calls vibrate with 40ms', () => {
    Haptics.medium();
    expect(vibrateSpy).toHaveBeenCalledWith(40);
  });

  test('heavy() calls vibrate with 70ms', () => {
    Haptics.heavy();
    expect(vibrateSpy).toHaveBeenCalledWith(70);
  });

  test('double() calls vibrate with [30, 50, 30]', () => {
    Haptics.double();
    expect(vibrateSpy).toHaveBeenCalledWith([30, 50, 30]);
  });

  test('success() calls vibrate with correct pattern', () => {
    Haptics.success();
    expect(vibrateSpy).toHaveBeenCalledWith([20, 40, 40, 40, 80]);
  });

  test('error() calls vibrate with correct pattern', () => {
    Haptics.error();
    expect(vibrateSpy).toHaveBeenCalledWith([100, 30, 100]);
  });

  test('setEnabled(false) prevents vibrate from being called', () => {
    Haptics.setEnabled(false);
    Haptics.heavy();
    Haptics.light();
    Haptics.success();
    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  test('setEnabled(true) re-enables haptics after disable', () => {
    Haptics.setEnabled(false);
    Haptics.setEnabled(true);
    Haptics.medium();
    expect(vibrateSpy).toHaveBeenCalledWith(40);
  });

  test('enabled getter reflects current state', () => {
    Haptics.setEnabled(false);
    expect(Haptics.enabled).toBe(false);
    Haptics.setEnabled(true);
    expect(Haptics.enabled).toBe(true);
  });

  test('pattern() passes custom value directly to vibrate', () => {
    Haptics.pattern([10, 20, 30]);
    expect(vibrateSpy).toHaveBeenCalledWith([10, 20, 30]);
  });

  test('pattern() accepts single number', () => {
    Haptics.pattern(55);
    expect(vibrateSpy).toHaveBeenCalledWith(55);
  });

  test('supported returns false when navigator.vibrate is absent', () => {
    const originalVibrate = navigator.vibrate;
    // @ts-ignore — intentionally delete for test
    delete (navigator as any).vibrate;

    expect(Haptics.supported).toBe(false);

    // Restore
    Object.defineProperty(global.navigator, 'vibrate', {
      value: originalVibrate,
      configurable: true,
      writable: true,
    });
  });

  test('_vibrate silently ignores errors from vibrate()', () => {
    vibrateSpy.mockImplementation(() => { throw new Error('vibrate error'); });
    expect(() => Haptics.heavy()).not.toThrow();
  });
});
