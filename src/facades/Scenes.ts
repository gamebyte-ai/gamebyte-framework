import { Facade } from './Facade';
import { Scene, SceneManager, SceneTransition } from '../contracts/Scene';

/**
 * Scenes facade for easy static access to scene management services.
 */
export class Scenes extends Facade {
  /**
   * Get the service key for the scene manager.
   */
  protected static getFacadeAccessor(): string {
    return 'scene.manager';
  }

  /**
   * Register a scene with the manager.
   */
  static add(scene: Scene): void {
    const manager = this.resolveFacadeInstance() as SceneManager;
    manager.add(scene);
  }

  /**
   * Remove a scene from the manager.
   */
  static remove(sceneId: string): void {
    const manager = this.resolveFacadeInstance() as SceneManager;
    manager.remove(sceneId);
  }

  /**
   * Switch to a different scene.
   */
  static async switchTo(sceneId: string, transition?: SceneTransition): Promise<void> {
    const manager = this.resolveFacadeInstance() as SceneManager;
    return manager.switchTo(sceneId, transition);
  }

  /**
   * Get the currently active scene.
   */
  static getCurrentScene(): Scene | null {
    const manager = this.resolveFacadeInstance() as SceneManager;
    return manager.getCurrentScene();
  }

  /**
   * Get a scene by its ID.
   */
  static getScene(sceneId: string): Scene | null {
    const manager = this.resolveFacadeInstance() as SceneManager;
    return manager.getScene(sceneId);
  }

  /**
   * Check if a scene exists.
   */
  static hasScene(sceneId: string): boolean {
    const manager = this.resolveFacadeInstance() as SceneManager;
    return manager.hasScene(sceneId);
  }

  /**
   * Update the current scene.
   */
  static update(deltaTime: number): void {
    const manager = this.resolveFacadeInstance() as SceneManager;
    manager.update(deltaTime);
  }

  /**
   * Render the current scene.
   */
  static render(renderer: any): void {
    const manager = this.resolveFacadeInstance() as SceneManager;
    manager.render(renderer);
  }

  /**
   * Get the underlying scene manager instance.
   */
  static getInstance(): SceneManager {
    return this.resolveFacadeInstance() as SceneManager;
  }
}