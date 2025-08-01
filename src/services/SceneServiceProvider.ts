import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { SceneManager } from '../contracts/Scene';
import { DefaultSceneManager } from '../core/DefaultSceneManager';

/**
 * Service provider for scene management services.
 */
export class SceneServiceProvider extends AbstractServiceProvider {
  /**
   * Register scene services in the container.
   */
  register(app: GameByte): void {
    // Register scene manager
    app.singleton('scene.manager', () => new DefaultSceneManager());
    
    // Alias for convenience
    app.getContainer().alias('scenes', 'scene.manager');
  }

  /**
   * Bootstrap scene services.
   */
  boot(app: GameByte): void {
    const sceneManager = app.make<SceneManager>('scene.manager');
    
    // Set up scene manager event listeners
    sceneManager.on('scene:changed', (fromScene, toScene) => {
      app.emit('scene:changed', fromScene, toScene);
    });

    sceneManager.on('scene:transition:start', (transition) => {
      app.emit('scene:transition:start', transition);
    });

    sceneManager.on('scene:transition:complete', (transition) => {
      app.emit('scene:transition:complete', transition);
    });
  }

  /**
   * Services provided by this provider.
   */
  provides(): string[] {
    return [
      'scene.manager',
      'scenes'
    ];
  }
}