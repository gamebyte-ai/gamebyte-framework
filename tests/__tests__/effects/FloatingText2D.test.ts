/**
 * @jest-environment jsdom
 */

import { FloatingText2D, FloatingTextConfig } from '../../../src/ui/effects/FloatingText2D';

// ---------------------------------------------------------------------------
// Mock GraphicsEngine so tests never touch Pixi.js internals
// ---------------------------------------------------------------------------

function makeAnchor() {
  const anchor = { x: 0.5, y: 0.5, set: jest.fn() };
  return anchor;
}

function makeMockText(label: string = '') {
  return {
    _label: label,
    x: 0, y: 0,
    alpha: 1,
    rotation: 0,
    scale: { x: 1, y: 1 },
    visible: true,
    interactive: false,
    anchor: makeAnchor(),
    text: label,
    style: {},
    width: 100,
    height: 30,
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  };
}

function makeMockContainer() {
  const children: any[] = [];
  return {
    x: 0, y: 0,
    alpha: 1,
    rotation: 0,
    scale: { x: 1, y: 1 },
    visible: true,
    interactive: false,
    children,
    addChild: jest.fn((child: any) => { children.push(child); return child; }),
    removeChild: jest.fn((child: any) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      return child;
    }),
    removeChildren: jest.fn(),
    getChildAt: jest.fn(),
    getChildIndex: jest.fn(),
    setChildIndex: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  };
}

// Mock the GraphicsEngine module
jest.mock('../../../src/graphics/GraphicsEngine', () => {
  return {
    graphics: jest.fn(),
    GraphicsEngine: {
      getFactory: jest.fn(),
      isInitialized: jest.fn().mockReturnValue(true),
    },
  };
});

// We import after the mock is set up
import { graphics } from '../../../src/graphics/GraphicsEngine';

const mockGraphics = graphics as jest.MockedFunction<typeof graphics>;

// ---------------------------------------------------------------------------
// RAF simulation
// ---------------------------------------------------------------------------

let rafQueue: Array<(ts: number) => void> = [];

function mockRAF(cb: (ts: number) => void): number {
  rafQueue.push(cb);
  return rafQueue.length;
}

function mockCancelRAF(): void {
  // no-op for these tests
}

function flushRAF(timestamp: number): void {
  const pending = [...rafQueue];
  rafQueue = [];
  for (const cb of pending) cb(timestamp);
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let mockFactory: ReturnType<typeof buildFactory>;

function buildFactory() {
  return {
    createContainer: jest.fn(() => makeMockContainer()),
    createText: jest.fn((text: string) => makeMockText(text)),
    createGraphics: jest.fn(),
    createSprite: jest.fn(),
    createTexture: jest.fn(),
    createCanvasTexture: jest.fn(),
    createLinearGradient: jest.fn(),
    createRadialGradient: jest.fn(),
    createBlurFilter: jest.fn(),
    createColorMatrixFilter: jest.fn(),
    createDropShadowFilter: jest.fn(),
    createGlowFilter: jest.fn(),
    createOutlineFilter: jest.fn(),
    createMaskFromGraphics: jest.fn(),
    createMaskFromSprite: jest.fn(),
  };
}

beforeEach(() => {
  rafQueue = [];
  mockFactory = buildFactory();
  mockGraphics.mockReturnValue(mockFactory as any);

  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(mockRAF as any);
  jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(mockCancelRAF as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FloatingText2D', () => {
  it('spawn() creates a text object with the correct string', () => {
    const parent = makeMockContainer();
    FloatingText2D.spawn({ text: 'Hello', x: 0, y: 0, parent });

    expect(mockFactory.createText).toHaveBeenCalledWith('Hello', expect.any(Object));
  });

  it('spawn() adds the container to the parent', () => {
    const parent = makeMockContainer();
    FloatingText2D.spawn({ text: 'Test', x: 10, y: 20, parent });

    expect(parent.addChild).toHaveBeenCalled();
  });

  it('damage() convenience method uses "-amount" text and damage style', () => {
    const parent = makeMockContainer();
    FloatingText2D.damage(parent, 50, 80, 42);

    expect(mockFactory.createText).toHaveBeenCalledWith(
      '-42',
      expect.objectContaining({ fill: 0xFF4444 })
    );
  });

  it('score() convenience method uses "+points" text and score style', () => {
    const parent = makeMockContainer();
    FloatingText2D.score(parent, 50, 80, 150);

    expect(mockFactory.createText).toHaveBeenCalledWith(
      '+150',
      expect.objectContaining({ fill: 0xFFDD44 })
    );
  });

  it('coin() convenience method uses "+amount" text and coin style', () => {
    const parent = makeMockContainer();
    FloatingText2D.coin(parent, 50, 80, 5);

    expect(mockFactory.createText).toHaveBeenCalledWith(
      '+5',
      expect.objectContaining({ fill: 0xFFAA00 })
    );
  });

  it('auto-destroy removes container from parent after animation completes', () => {
    const parent = makeMockContainer();
    FloatingText2D.spawn({ text: 'Gone', x: 0, y: 0, parent, duration: 200, autoDestroy: true });

    // Initial frame
    flushRAF(0);
    // Frame past duration
    flushRAF(250);

    expect(parent.removeChild).toHaveBeenCalled();
  });

  it('direction=down moves container downward (increasing y)', () => {
    const parent = makeMockContainer();
    const ft = FloatingText2D.spawn({
      text: 'Down',
      x: 0, y: 100,
      parent,
      direction: 'down',
      duration: 800,
      autoDestroy: false,
    });

    const container = ft.getContainer();

    // First frame — t=0, progress=0, no movement yet
    flushRAF(0);
    // Mid-animation frame
    flushRAF(400);

    // y should be > 100 (moving down)
    expect(container.y).toBeGreaterThan(100);
  });
});
