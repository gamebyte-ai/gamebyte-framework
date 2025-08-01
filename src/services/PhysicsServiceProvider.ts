import { GameByte } from '../core/GameByte';
import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { PhysicsManager } from '../physics/PhysicsManager';

/**
 * Physics service provider for the GameByte framework
 */
export class PhysicsServiceProvider extends AbstractServiceProvider {
  /**
   * Register physics services in the container
   */
  register(app: GameByte): void {
    // Register the physics manager as a singleton
    app.singleton('physics', () => new PhysicsManager());
    
    // Register alias for easier access
    app.getContainer().alias('PhysicsManager', 'physics');
  }

  /**
   * Boot physics services after all providers have been registered
   */
  async boot(app: GameByte): Promise<void> {
    const physicsManager = app.make<PhysicsManager>('physics');
    
    // Set up event listeners for scene transitions
    const sceneManager = app.make('scene.manager');
    if (sceneManager) {
      sceneManager.on('scene-changing', this.handleSceneChange.bind(this, physicsManager));
      sceneManager.on('scene-changed', this.handleSceneChanged.bind(this, physicsManager));
    }
    
    // Set up render loop integration
    const renderer = app.make('renderer');
    if (renderer) {
      renderer.on('render', this.handleRenderLoop.bind(this, physicsManager));
    }
    
    // Emit physics service booted event
    app.emit('physics:booted', physicsManager);
  }

  /**
   * Services provided by this provider
   */
  provides(): string[] {
    return ['physics', 'PhysicsManager'];
  }

  /**
   * Handle scene change events
   */
  private handleSceneChange(physicsManager: PhysicsManager, event: any): void {
    // Pause physics when changing scenes
    const activeWorld = physicsManager.getActiveWorld();
    if (activeWorld && activeWorld.isRunning) {
      activeWorld.pause();
    }
  }

  /**
   * Handle scene changed events
   */
  private handleSceneChanged(physicsManager: PhysicsManager, event: any): void {
    // Resume physics after scene change
    const activeWorld = physicsManager.getActiveWorld();
    if (activeWorld) {
      activeWorld.resume();
    }
  }

  /**
   * Handle render loop for physics updates
   */
  private handleRenderLoop(physicsManager: PhysicsManager, deltaTime: number): void {
    // Update physics on each render frame
    if (physicsManager.isInitialized) {
      physicsManager.update(deltaTime);
    }
  }
}