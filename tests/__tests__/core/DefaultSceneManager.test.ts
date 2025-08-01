/**
 * @jest-environment jsdom
 */

import { DefaultSceneManager } from '../../../src/core/DefaultSceneManager';
import { Scene, SceneTransition } from '../../../src/contracts/Scene';
import { EventEmitter } from 'eventemitter3';

// Mock Scene implementation for testing
class MockScene extends EventEmitter implements Scene {
  public readonly id: string;
  public readonly name: string;
  public isActive = false;
  public initializeCalled = false;
  public activateCalled = false;
  public deactivateCalled = false;
  public updateCalled = false;
  public renderCalled = false;
  public destroyCalled = false;
  public initializeDelay = 0;
  public shouldFailInitialization = false;

  constructor(id: string, name: string = id) {
    super();
    this.id = id;
    this.name = name;
  }

  async initialize(): Promise<void> {
    if (this.shouldFailInitialization) {
      throw new Error(`Failed to initialize scene ${this.id}`);
    }
    
    if (this.initializeDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.initializeDelay));
    }
    
    this.initializeCalled = true;
    this.emit('initialized');
  }

  activate(): void {
    this.activateCalled = true;
    this.isActive = true;
    this.emit('activated');
  }

  deactivate(): void {
    this.deactivateCalled = true;
    this.isActive = false;
    this.emit('deactivated');
  }

  update(deltaTime: number): void {
    this.updateCalled = true;
    this.emit('updated', deltaTime);
  }

  render(renderer: any): void {
    this.renderCalled = true;
    this.emit('rendered', renderer);
  }

  destroy(): void {
    this.destroyCalled = true;
    this.removeAllListeners();
    this.emit('destroyed');
  }

  reset(): void {
    this.isActive = false;
    this.initializeCalled = false;
    this.activateCalled = false;
    this.deactivateCalled = false;
    this.updateCalled = false;
    this.renderCalled = false;
    this.destroyCalled = false;
  }
}

describe('DefaultSceneManager', () => {
  let sceneManager: DefaultSceneManager;
  let mockScene1: MockScene;
  let mockScene2: MockScene;
  let mockScene3: MockScene;
  let mockRenderer: any;

  beforeEach(() => {
    sceneManager = new DefaultSceneManager();
    mockScene1 = new MockScene('scene1', 'Scene One');
    mockScene2 = new MockScene('scene2', 'Scene Two');
    mockScene3 = new MockScene('scene3', 'Scene Three');
    mockRenderer = { render: jest.fn() };
  });

  afterEach(() => {
    // Clean up all scenes
    sceneManager.removeAllListeners();
    mockScene1.reset();
    mockScene2.reset();
    mockScene3.reset();
  });

  describe('Scene Registration', () => {
    it('should add a scene successfully', () => {
      const sceneAddedSpy = jest.fn();
      sceneManager.on('scene:added', sceneAddedSpy);

      sceneManager.add(mockScene1);

      expect(sceneManager.hasScene('scene1')).toBe(true);
      expect(sceneManager.getScene('scene1')).toBe(mockScene1);
      expect(sceneAddedSpy).toHaveBeenCalledWith(mockScene1);
    });

    it('should throw error when adding scene with duplicate ID', () => {
      sceneManager.add(mockScene1);

      expect(() => sceneManager.add(mockScene1))
        .toThrow("Scene with ID 'scene1' already exists");
    });

    it('should add multiple scenes with different IDs', () => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
      sceneManager.add(mockScene3);

      expect(sceneManager.hasScene('scene1')).toBe(true);
      expect(sceneManager.hasScene('scene2')).toBe(true);
      expect(sceneManager.hasScene('scene3')).toBe(true);
      expect(sceneManager.getAllScenes()).toHaveLength(3);
    });
  });

  describe('Scene Removal', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
    });

    it('should remove a scene successfully', () => {
      const sceneRemovedSpy = jest.fn();
      sceneManager.on('scene:removed', sceneRemovedSpy);

      sceneManager.remove('scene1');

      expect(sceneManager.hasScene('scene1')).toBe(false);
      expect(sceneManager.getScene('scene1')).toBe(null);
      expect(mockScene1.destroyCalled).toBe(true);
      expect(sceneRemovedSpy).toHaveBeenCalledWith(mockScene1);
    });

    it('should handle removing non-existent scene gracefully', () => {
      const sceneRemovedSpy = jest.fn();
      sceneManager.on('scene:removed', sceneRemovedSpy);

      sceneManager.remove('nonexistent');

      expect(sceneRemovedSpy).not.toHaveBeenCalled();
    });

    it('should deactivate current scene when removing it', async () => {
      await sceneManager.switchTo('scene1');
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);
      expect(mockScene1.isActive).toBe(true);

      sceneManager.remove('scene1');

      expect(sceneManager.getCurrentScene()).toBe(null);
      expect(mockScene1.deactivateCalled).toBe(true);
      expect(mockScene1.destroyCalled).toBe(true);
    });

    it('should not affect other scenes when removing one', () => {
      sceneManager.remove('scene1');

      expect(sceneManager.hasScene('scene2')).toBe(true);
      expect(mockScene2.destroyCalled).toBe(false);
    });
  });

  describe('Scene Queries', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
    });

    it('should return correct scene by ID', () => {
      expect(sceneManager.getScene('scene1')).toBe(mockScene1);
      expect(sceneManager.getScene('scene2')).toBe(mockScene2);
    });

    it('should return null for non-existent scene', () => {
      expect(sceneManager.getScene('nonexistent')).toBe(null);
    });

    it('should check scene existence correctly', () => {
      expect(sceneManager.hasScene('scene1')).toBe(true);
      expect(sceneManager.hasScene('scene2')).toBe(true);
      expect(sceneManager.hasScene('nonexistent')).toBe(false);
    });

    it('should return all scenes', () => {
      const allScenes = sceneManager.getAllScenes();
      expect(allScenes).toHaveLength(2);
      expect(allScenes).toContain(mockScene1);
      expect(allScenes).toContain(mockScene2);
    });

    it('should return all scene IDs', () => {
      const sceneIds = sceneManager.getSceneIds();
      expect(sceneIds).toHaveLength(2);
      expect(sceneIds).toContain('scene1');
      expect(sceneIds).toContain('scene2');
    });

    it('should return empty arrays when no scenes registered', () => {
      const emptyManager = new DefaultSceneManager();
      expect(emptyManager.getAllScenes()).toEqual([]);
      expect(emptyManager.getSceneIds()).toEqual([]);
    });
  });

  describe('Current Scene Management', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
    });

    it('should return null for current scene initially', () => {
      expect(sceneManager.getCurrentScene()).toBe(null);
    });

    it('should track current scene after switching', async () => {
      await sceneManager.switchTo('scene1');
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);

      await sceneManager.switchTo('scene2');
      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
    });
  });

  describe('Instant Scene Transitions', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
    });

    it('should switch to scene with instant transition', async () => {
      const transitionStartSpy = jest.fn();
      const transitionCompleteSpy = jest.fn();
      const sceneChangedSpy = jest.fn();

      sceneManager.on('scene:transition:start', transitionStartSpy);
      sceneManager.on('scene:transition:complete', transitionCompleteSpy);
      sceneManager.on('scene:changed', sceneChangedSpy);

      await sceneManager.switchTo('scene1');

      expect(mockScene1.initializeCalled).toBe(true);
      expect(mockScene1.activateCalled).toBe(true);
      expect(mockScene1.isActive).toBe(true);
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);
      
      expect(transitionStartSpy).toHaveBeenCalledWith({
        from: null,
        to: mockScene1,
        transition: undefined
      });
      expect(transitionCompleteSpy).toHaveBeenCalledWith({
        from: null,
        to: mockScene1,
        transition: undefined
      });
      expect(sceneChangedSpy).toHaveBeenCalledWith(null, mockScene1);
    });

    it('should handle scene transition between active scenes', async () => {
      await sceneManager.switchTo('scene1');
      mockScene1.reset();
      mockScene1.isActive = true;

      await sceneManager.switchTo('scene2');

      expect(mockScene1.deactivateCalled).toBe(true);
      expect(mockScene2.initializeCalled).toBe(true);
      expect(mockScene2.activateCalled).toBe(true);
      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
    });

    it('should not switch if already on target scene', async () => {
      await sceneManager.switchTo('scene1');
      mockScene1.reset();
      mockScene1.isActive = true;

      await sceneManager.switchTo('scene1');

      expect(mockScene1.initializeCalled).toBe(false);
      expect(mockScene1.activateCalled).toBe(false);
    });

    it('should not initialize already active scene', async () => {
      mockScene1.isActive = true;
      await sceneManager.switchTo('scene1');

      expect(mockScene1.initializeCalled).toBe(false);
      expect(mockScene1.activateCalled).toBe(true);
    });
  });

  describe('Animated Scene Transitions', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
      // Mock requestAnimationFrame for testing
      global.requestAnimationFrame = jest.fn((callback) => {
        setTimeout(() => callback(Date.now()), 16);
        return 1;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should perform fade transition', async () => {
      const transition: SceneTransition = {
        type: 'fade',
        duration: 100
      };

      await sceneManager.switchTo('scene1');
      await sceneManager.switchTo('scene2', transition);

      expect(mockScene1.deactivateCalled).toBe(true);
      expect(mockScene2.activateCalled).toBe(true);
      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
    });

    it('should perform slide transition', async () => {
      const transition: SceneTransition = {
        type: 'slide',
        duration: 100
      };

      await sceneManager.switchTo('scene1');
      await sceneManager.switchTo('scene2', transition);

      expect(mockScene1.deactivateCalled).toBe(true);
      expect(mockScene2.activateCalled).toBe(true);
      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
    });

    it('should use default duration and easing for transitions', async () => {
      const transition: SceneTransition = {
        type: 'fade'
      };

      await sceneManager.switchTo('scene1');
      await sceneManager.switchTo('scene2', transition);

      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
    });

    it('should handle custom easing function', async () => {
      const customEasing = jest.fn((t: number) => t * t);
      const transition: SceneTransition = {
        type: 'fade',
        duration: 100,
        easing: customEasing
      };

      await sceneManager.switchTo('scene1');
      await sceneManager.switchTo('scene2', transition);

      expect(customEasing).toHaveBeenCalled();
      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
    });
  });

  describe('Transition Error Handling', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
    });

    it('should throw error for non-existent scene', async () => {
      await expect(sceneManager.switchTo('nonexistent'))
        .rejects.toThrow("Scene 'nonexistent' not found");
    });

    it('should prevent concurrent transitions', async () => {
      const transition1 = sceneManager.switchTo('scene1');
      
      await expect(sceneManager.switchTo('scene2'))
        .rejects.toThrow('Scene transition already in progress');

      await transition1;
    });

    it('should handle scene initialization failures', async () => {
      mockScene1.shouldFailInitialization = true;

      await expect(sceneManager.switchTo('scene1'))
        .rejects.toThrow('Failed to initialize scene scene1');
    });

    it('should reset transition state after error', async () => {
      mockScene1.shouldFailInitialization = true;

      try {
        await sceneManager.switchTo('scene1');
      } catch (error) {
        // Expected error
      }

      // Should be able to transition after error
      mockScene2.shouldFailInitialization = false;
      await expect(sceneManager.switchTo('scene2')).resolves.not.toThrow();
    });
  });

  describe('Scene Updates and Rendering', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
    });

    it('should update current active scene', async () => {
      await sceneManager.switchTo('scene1');
      const deltaTime = 16.67;

      sceneManager.update(deltaTime);

      expect(mockScene1.updateCalled).toBe(true);
    });

    it('should not update when no current scene', () => {
      sceneManager.update(16.67);
      // Should not throw or crash
    });

    it('should not update inactive scene', async () => {
      await sceneManager.switchTo('scene1');
      mockScene1.isActive = false;

      sceneManager.update(16.67);

      expect(mockScene1.updateCalled).toBe(false);
    });

    it('should render current active scene', async () => {
      await sceneManager.switchTo('scene1');

      sceneManager.render(mockRenderer);

      expect(mockScene1.renderCalled).toBe(true);
    });

    it('should not render when no current scene', () => {
      sceneManager.render(mockRenderer);
      // Should not throw or crash
    });

    it('should not render inactive scene', async () => {
      await sceneManager.switchTo('scene1');
      mockScene1.isActive = false;

      sceneManager.render(mockRenderer);

      expect(mockScene1.renderCalled).toBe(false);
    });
  });

  describe('Event System', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
    });

    it('should emit scene:added event', () => {
      const spy = jest.fn();
      sceneManager.on('scene:added', spy);

      sceneManager.add(mockScene3);

      expect(spy).toHaveBeenCalledWith(mockScene3);
    });

    it('should emit scene:removed event', () => {
      const spy = jest.fn();
      sceneManager.on('scene:removed', spy);

      sceneManager.remove('scene1');

      expect(spy).toHaveBeenCalledWith(mockScene1);
    });

    it('should emit transition events in correct order', async () => {
      const events: string[] = [];
      
      sceneManager.on('scene:transition:start', () => events.push('start'));
      sceneManager.on('scene:transition:complete', () => events.push('complete'));
      sceneManager.on('scene:changed', () => events.push('changed'));

      await sceneManager.switchTo('scene1');

      expect(events).toEqual(['start', 'complete', 'changed']);
    });

    it('should provide correct event data for transitions', async () => {
      const startSpy = jest.fn();
      const completeSpy = jest.fn();
      const changedSpy = jest.fn();

      sceneManager.on('scene:transition:start', startSpy);
      sceneManager.on('scene:transition:complete', completeSpy);
      sceneManager.on('scene:changed', changedSpy);

      const transition: SceneTransition = { type: 'fade', duration: 100 };
      await sceneManager.switchTo('scene1');
      await sceneManager.switchTo('scene2', transition);

      expect(startSpy).toHaveBeenLastCalledWith({
        from: mockScene1,
        to: mockScene2,
        transition
      });
      expect(completeSpy).toHaveBeenLastCalledWith({
        from: mockScene1,
        to: mockScene2,
        transition
      });
      expect(changedSpy).toHaveBeenLastCalledWith(mockScene1, mockScene2);
    });
  });

  describe('Complex Scenarios', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
      sceneManager.add(mockScene3);
    });

    it('should handle multiple scene transitions', async () => {
      await sceneManager.switchTo('scene1');
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);

      await sceneManager.switchTo('scene2');
      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
      expect(mockScene1.deactivateCalled).toBe(true);

      await sceneManager.switchTo('scene3');
      expect(sceneManager.getCurrentScene()).toBe(mockScene3);
      expect(mockScene2.deactivateCalled).toBe(true);
    });

    it('should handle scene removal and re-addition', () => {
      sceneManager.remove('scene1');
      expect(sceneManager.hasScene('scene1')).toBe(false);

      const newScene1 = new MockScene('scene1', 'New Scene One');
      sceneManager.add(newScene1);
      expect(sceneManager.getScene('scene1')).toBe(newScene1);
    });

    it('should maintain scene state during rapid operations', async () => {
      await sceneManager.switchTo('scene1');
      
      // Rapid scene operations
      sceneManager.add(new MockScene('temp'));
      sceneManager.remove('temp');
      
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);
      expect(mockScene1.isActive).toBe(true);
    });

    it('should handle asynchronous scene initialization', async () => {
      mockScene1.initializeDelay = 50;
      
      const startTime = Date.now();
      await sceneManager.switchTo('scene1');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
      expect(mockScene1.initializeCalled).toBe(true);
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      sceneManager.add(mockScene1);
      sceneManager.add(mockScene2);
    });

    it('should clean up scene resources on removal', () => {
      sceneManager.remove('scene1');

      expect(mockScene1.destroyCalled).toBe(true);
      expect(sceneManager.getScene('scene1')).toBe(null);
    });

    it('should properly manage scene references', async () => {
      await sceneManager.switchTo('scene1');
      const currentScene = sceneManager.getCurrentScene();
      
      sceneManager.remove('scene1');
      
      expect(sceneManager.getCurrentScene()).toBe(null);
      expect(currentScene?.destroyCalled).toBe(true);
    });

    it('should handle scene manager cleanup', () => {
      sceneManager.add(mockScene3);
      
      // Simulate cleanup
      sceneManager.removeAllListeners();
      
      // Should not crash
      expect(() => sceneManager.getAllScenes()).not.toThrow();
    });
  });
});