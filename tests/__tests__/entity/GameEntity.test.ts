/**
 * @jest-environment jsdom
 */

import { GameEntity, GameEntityConfig } from '../../../src/entity/GameEntity';

// ============================================================
// Mock GraphicsEngine so tests run without a real Pixi context
// ============================================================
const createMockContainer = () => ({
  x: 0,
  y: 0,
  rotation: 0,
  scale: { x: 1, y: 1 },
  alpha: 1,
  visible: true,
  children: [] as any[],
  parent: null as any,
  addChild: jest.fn(function(this: any, child: any) {
    this.children.push(child);
    child.parent = this;
    return child;
  }),
  removeChild: jest.fn(function(this: any, child: any) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
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
  removeAllListeners: jest.fn()
});

jest.mock('../../../src/graphics/GraphicsEngine', () => ({
  graphics: jest.fn(() => ({
    createContainer: jest.fn(() => createMockContainer()),
    createGraphics: jest.fn(),
    createText: jest.fn(),
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
    createMaskFromSprite: jest.fn()
  }))
}));

// ============================================================

describe('GameEntity', () => {
  describe('constructor defaults', () => {
    it('should have correct default values when created with no config', () => {
      const entity = new GameEntity();

      expect(entity.x).toBe(0);
      expect(entity.y).toBe(0);
      expect(entity.vx).toBe(0);
      expect(entity.vy).toBe(0);
      expect(entity.health).toBe(100);
      expect(entity.maxHealth).toBe(100);
      expect(entity.isAlive).toBe(true);
      expect(entity.active).toBe(true);
      expect(entity.speed).toBe(1);
      expect(entity.tags.size).toBe(0);
      expect(entity.collisionRadius).toBe(0);
      expect(entity.collisionRect).toBeUndefined();
    });
  });

  describe('constructor validation', () => {
    it('should clamp health to valid range', () => {
      const e = new GameEntity({ health: -10, maxHealth: 50 });
      expect(e.health).toBe(0);
      expect(e.maxHealth).toBe(50);
    });

    it('should clamp health to maxHealth when health exceeds it', () => {
      const e = new GameEntity({ health: 200, maxHealth: 100 });
      expect(e.health).toBe(100);
    });

    it('should default maxHealth to 100 when <= 0', () => {
      const e = new GameEntity({ maxHealth: 0 });
      expect(e.maxHealth).toBe(100);
    });
  });

  describe('position get/set', () => {
    it('should proxy x and y to the internal container', () => {
      const entity = new GameEntity({ x: 50, y: 75 });

      expect(entity.x).toBe(50);
      expect(entity.y).toBe(75);

      entity.x = 200;
      entity.y = 300;

      expect(entity.x).toBe(200);
      expect(entity.y).toBe(300);
    });
  });

  describe('update / velocity', () => {
    it('should apply velocity to position on update', () => {
      const entity = new GameEntity({ x: 0, y: 0, vx: 10, vy: -5 });

      entity.update(1);

      expect(entity.x).toBe(10);
      expect(entity.y).toBe(-5);
    });

    it('should scale velocity by delta time', () => {
      const entity = new GameEntity({ x: 100, y: 200, vx: 60, vy: 30 });

      entity.update(0.5);

      expect(entity.x).toBe(130);
      expect(entity.y).toBe(215);
    });
  });

  describe('damage', () => {
    it('should reduce health and emit damaged event', () => {
      const entity = new GameEntity({ health: 100 });
      const handler = jest.fn();
      entity.on('damaged', handler);

      entity.damage(30);

      expect(entity.health).toBe(70);
      expect(handler).toHaveBeenCalledWith(30, 70);
    });

    it('should clamp health at 0 and not go negative', () => {
      const entity = new GameEntity({ health: 50 });

      entity.damage(200);

      expect(entity.health).toBe(0);
    });

    it('should emit died when health reaches zero', () => {
      const entity = new GameEntity({ health: 10 });
      const diedHandler = jest.fn();
      entity.on('died', diedHandler);

      entity.damage(10);

      expect(entity.isAlive).toBe(false);
      expect(diedHandler).toHaveBeenCalledTimes(1);
    });

    it('should not take damage once already dead', () => {
      const entity = new GameEntity({ health: 10 });
      const damagedHandler = jest.fn();
      entity.on('damaged', damagedHandler);

      entity.damage(10); // kills
      entity.damage(50); // should be ignored

      expect(damagedHandler).toHaveBeenCalledTimes(1);
      expect(entity.health).toBe(0);
    });
  });

  describe('heal', () => {
    it('should restore health and emit healed event', () => {
      const entity = new GameEntity({ health: 50, maxHealth: 100 });
      const handler = jest.fn();
      entity.on('healed', handler);

      entity.heal(30);

      expect(entity.health).toBe(80);
      expect(handler).toHaveBeenCalledWith(30, 80);
    });

    it('should cap health at maxHealth', () => {
      const entity = new GameEntity({ health: 90, maxHealth: 100 });

      entity.heal(50);

      expect(entity.health).toBe(100);
    });
  });

  describe('collision detection', () => {
    it('should detect circle collision when both entities overlap', () => {
      const a = new GameEntity({ x: 0, y: 0, collisionRadius: 10 });
      const b = new GameEntity({ x: 15, y: 0, collisionRadius: 10 });

      expect(a.collidesWith(b)).toBe(true);
    });

    it('should return false when circles do not overlap', () => {
      const a = new GameEntity({ x: 0, y: 0, collisionRadius: 5 });
      const b = new GameEntity({ x: 50, y: 0, collisionRadius: 5 });

      expect(a.collidesWith(b)).toBe(false);
    });

    it('should detect AABB collision when rects overlap', () => {
      const a = new GameEntity({ x: 0, y: 0, collisionRect: { width: 20, height: 20 } });
      const b = new GameEntity({ x: 10, y: 10, collisionRect: { width: 20, height: 20 } });

      expect(a.collidesWith(b)).toBe(true);
    });

    it('should return false when AABB rects do not overlap', () => {
      const a = new GameEntity({ x: 0, y: 0, collisionRect: { width: 10, height: 10 } });
      const b = new GameEntity({ x: 100, y: 100, collisionRect: { width: 10, height: 10 } });

      expect(a.collidesWith(b)).toBe(false);
    });

    it('should return false when no collision shape is defined on either side', () => {
      const a = new GameEntity({ x: 0, y: 0 });
      const b = new GameEntity({ x: 1, y: 1 });

      expect(a.collidesWith(b)).toBe(false);
    });
  });

  describe('distanceTo', () => {
    it('should return Euclidean distance between two entities', () => {
      const a = new GameEntity({ x: 0, y: 0 });
      const b = new GameEntity({ x: 3, y: 4 });

      expect(a.distanceTo(b)).toBe(5);
    });

    it('should return 0 when entities are at the same position', () => {
      const a = new GameEntity({ x: 10, y: 10 });
      const b = new GameEntity({ x: 10, y: 10 });

      expect(a.distanceTo(b)).toBe(0);
    });
  });

  describe('tags', () => {
    it('should initialise tags from config array', () => {
      const entity = new GameEntity({ tags: ['enemy', 'flying'] });

      expect(entity.tags.has('enemy')).toBe(true);
      expect(entity.tags.has('flying')).toBe(true);
    });

    it('should allow dynamic tag manipulation via the Set API', () => {
      const entity = new GameEntity();

      entity.tags.add('projectile');
      expect(entity.tags.has('projectile')).toBe(true);

      entity.tags.delete('projectile');
      expect(entity.tags.has('projectile')).toBe(false);
    });
  });

  describe('getContainer', () => {
    it('should return the internal IContainer', () => {
      const entity = new GameEntity();
      const container = entity.getContainer();

      expect(container).toBeDefined();
      expect(typeof container.addChild).toBe('function');
    });
  });

  describe('destroy', () => {
    it('should emit destroyed event and remove all listeners', () => {
      const entity = new GameEntity();
      const destroyedHandler = jest.fn();
      entity.on('destroyed', destroyedHandler);

      entity.destroy();

      expect(destroyedHandler).toHaveBeenCalledTimes(1);
    });

    it('should call destroy on the internal container', () => {
      const entity = new GameEntity();
      const container = entity.getContainer();

      entity.destroy();

      expect(container.destroy).toHaveBeenCalled();
    });
  });
});
