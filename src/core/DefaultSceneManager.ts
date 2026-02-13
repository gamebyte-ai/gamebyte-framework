import { EventEmitter } from 'eventemitter3';
import { Scene, SceneManager, SceneTransition } from '../contracts/Scene';
import { Logger } from '../utils/Logger.js';

/**
 * Default implementation of the scene manager.
 */
export class DefaultSceneManager extends EventEmitter implements SceneManager {
  private scenes = new Map<string, Scene>();
  private currentScene: Scene | null = null;
  private transitionInProgress = false;

  /**
   * Register a scene with the manager.
   */
  add(scene: Scene): void {
    if (this.scenes.has(scene.id)) {
      throw new Error(`Scene with ID '${scene.id}' already exists`);
    }

    this.scenes.set(scene.id, scene);
    this.emit('scene:added', scene);
  }

  /**
   * Remove a scene from the manager.
   */
  remove(sceneId: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      return;
    }

    // Deactivate scene if it's current
    if (this.currentScene?.id === sceneId) {
      this.currentScene.deactivate();
      this.currentScene = null;
    }

    // Clean up scene
    scene.destroy();
    this.scenes.delete(sceneId);
    
    this.emit('scene:removed', scene);
  }

  /**
   * Switch to a different scene.
   */
  async switchTo(sceneId: string, transition?: SceneTransition): Promise<void> {
    if (this.transitionInProgress) {
      throw new Error('Scene transition already in progress');
    }

    const targetScene = this.scenes.get(sceneId);
    if (!targetScene) {
      throw new Error(`Scene '${sceneId}' not found`);
    }

    if (this.currentScene?.id === sceneId) {
      return; // Already on target scene
    }

    Logger.debug('Scenes', `Switching to: ${sceneId}`);
    this.transitionInProgress = true;
    const fromScene = this.currentScene;

    try {
      // Emit transition start
      this.emit('scene:transition:start', { from: fromScene, to: targetScene, transition });

      // Handle transition
      if (transition && transition.type !== 'instant') {
        await this.performTransition(fromScene, targetScene, transition);
      } else {
        await this.instantTransition(fromScene, targetScene);
      }

      // Emit transition complete
      this.emit('scene:transition:complete', { from: fromScene, to: targetScene, transition });
      this.emit('scene:changed', fromScene, targetScene);

    } finally {
      this.transitionInProgress = false;
    }
  }

  /**
   * Get the currently active scene.
   */
  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  /**
   * Get a scene by its ID.
   */
  getScene(sceneId: string): Scene | null {
    return this.scenes.get(sceneId) || null;
  }

  /**
   * Check if a scene exists.
   */
  hasScene(sceneId: string): boolean {
    return this.scenes.has(sceneId);
  }

  /**
   * Update the current scene.
   */
  update(deltaTime: number): void {
    if (this.currentScene && this.currentScene.isActive) {
      this.currentScene.update(deltaTime);
    }
  }

  /**
   * Render the current scene.
   */
  render(renderer: any): void {
    if (this.currentScene && this.currentScene.isActive) {
      this.currentScene.render(renderer);
    }
  }

  /**
   * Get all registered scenes.
   */
  getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Get scene IDs.
   */
  getSceneIds(): string[] {
    return Array.from(this.scenes.keys());
  }

  /**
   * Perform instant scene transition.
   */
  private async instantTransition(fromScene: Scene | null, toScene: Scene): Promise<void> {
    // Deactivate current scene
    if (fromScene) {
      fromScene.deactivate();
    }

    // Initialize and activate new scene
    if (!toScene.isActive) {
      await toScene.initialize();
    }
    
    toScene.activate();
    this.currentScene = toScene;
  }

  /**
   * Perform animated scene transition.
   */
  private async performTransition(
    fromScene: Scene | null, 
    toScene: Scene, 
    transition: SceneTransition
  ): Promise<void> {
    const duration = transition.duration || 500;
    const easing = transition.easing || ((t: number) => t);

    // Initialize target scene if needed
    if (!toScene.isActive) {
      await toScene.initialize();
    }

    return new Promise((resolve) => {
      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        // Handle different transition types
        switch (transition.type) {
          case 'fade':
            this.handleFadeTransition(fromScene, toScene, easedProgress);
            break;
          case 'slide':
            this.handleSlideTransition(fromScene, toScene, easedProgress);
            break;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Complete transition
          if (fromScene) {
            fromScene.deactivate();
          }
          toScene.activate();
          this.currentScene = toScene;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Handle fade transition between scenes.
   */
  private handleFadeTransition(fromScene: Scene | null, toScene: Scene, progress: number): void {
    // This is a simplified implementation
    // In a real implementation, you'd manipulate the alpha/opacity of scene containers
    if (progress >= 0.5 && !toScene.isActive) {
      toScene.activate();
      if (fromScene) {
        fromScene.deactivate();
      }
    }
  }

  /**
   * Handle slide transition between scenes.
   */
  private handleSlideTransition(fromScene: Scene | null, toScene: Scene, progress: number): void {
    // This is a simplified implementation
    // In a real implementation, you'd manipulate the position of scene containers
    if (progress >= 0.5 && !toScene.isActive) {
      toScene.activate();
      if (fromScene) {
        fromScene.deactivate();
      }
    }
  }
}