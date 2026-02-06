import { AbstractServiceProvider } from '../contracts/ServiceProvider.js';
import { GameByte } from '../core/GameByte.js';
import { PrefabSystem } from '../prefabs/PrefabSystem.js';

/**
 * Service provider for the Prefab / Entity Component System.
 */
export class PrefabServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('prefabs', () => {
      const prefabs = new PrefabSystem();
      // Set scene if renderer is available
      if (app.getContainer().bound('renderer')) {
        const renderer = app.make<any>('renderer');
        const stage = renderer.getStage?.();
        if (stage) prefabs.setScene(stage);
      }
      return prefabs;
    });
  }

  boot(app: GameByte): void {
    const container = app.getContainer();

    // Wire to TickSystem for component updates
    if (container.bound('tick')) {
      const tick = app.make<any>('tick');
      tick.subscribe((state: any) => {
        if (container.bound('prefabs')) {
          const prefabs = app.make<PrefabSystem>('prefabs');
          prefabs.update(state.delta);
        }
      }, 5); // Priority 5: after physics, before rendering
    }

    app.on('destroyed', () => {
      if (container.bound('prefabs')) {
        app.make<PrefabSystem>('prefabs').dispose();
      }
    });
  }

  provides(): string[] {
    return ['prefabs'];
  }

  isDeferred(): boolean {
    return true;
  }
}
