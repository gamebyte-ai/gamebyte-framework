import { AbstractServiceProvider } from '../contracts/ServiceProvider.js';
import { GameByte } from '../core/GameByte.js';
import { EnvironmentSystem } from '../environment/EnvironmentSystem.js';

/**
 * Service provider for the 3D environment system.
 * Lazy-initializes EnvironmentSystem when first resolved (requires a Three.js scene).
 */
export class EnvironmentServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('environment', () => {
      const renderer = app.make<any>('renderer');
      const scene = renderer.getStage();
      if (!scene) {
        throw new Error('EnvironmentServiceProvider: renderer stage (THREE.Scene) not available');
      }
      const nativeRenderer = renderer.getNativeRenderer?.() ?? null;
      const env = new EnvironmentSystem(scene, nativeRenderer);
      return env;
    });
  }

  boot(app: GameByte): void {
    app.on('destroyed', () => {
      if (app.getContainer().bound('environment')) {
        const env = app.make<EnvironmentSystem>('environment');
        env.dispose();
      }
    });
  }

  provides(): string[] {
    return ['environment'];
  }

  isDeferred(): boolean {
    return true; // Only load when requested (3D feature)
  }
}
