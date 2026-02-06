import { AbstractServiceProvider } from '../contracts/ServiceProvider.js';
import { GameByte } from '../core/GameByte.js';
import { ResourceTracker } from '../resources/ResourceTracker.js';

/**
 * Service provider for auto-dispose / resource lifecycle management.
 * Integrates ResourceTracker with scene lifecycle for automatic cleanup.
 */
export class ResourceServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('resources', () => new ResourceTracker());
  }

  boot(app: GameByte): void {
    const container = app.getContainer();

    // Auto-create scene scopes and dispose on scene deactivation
    app.on('scene:activated', (sceneName: string) => {
      if (container.bound('resources')) {
        const tracker = app.make<ResourceTracker>('resources');
        tracker.createScope(`scene:${sceneName}`);
      }
    });

    app.on('scene:deactivated', (sceneName: string) => {
      if (container.bound('resources')) {
        const tracker = app.make<ResourceTracker>('resources');
        tracker.disposeScope(`scene:${sceneName}`);
      }
    });

    // Dispose all on app destroy
    app.on('destroyed', () => {
      if (container.bound('resources')) {
        const tracker = app.make<ResourceTracker>('resources');
        tracker.destroy();
      }
    });
  }

  provides(): string[] {
    return ['resources'];
  }

  isDeferred(): boolean {
    return false;
  }
}
