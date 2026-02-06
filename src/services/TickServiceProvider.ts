import { AbstractServiceProvider } from '../contracts/ServiceProvider.js';
import { GameByte } from '../core/GameByte.js';
import { TickSystem } from '../tick/TickSystem.js';
import { Renderer } from '../contracts/Renderer.js';

/**
 * Service provider for the component-level TickSystem.
 * Wires TickSystem to the renderer's tick event.
 */
export class TickServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('tick', () => new TickSystem());
  }

  boot(app: GameByte): void {
    const container = app.getContainer();

    // Wire tick system to renderer's tick event when renderer is available
    if (container.bound('renderer')) {
      const renderer = app.make<Renderer>('renderer');
      const tick = app.make<TickSystem>('tick');

      renderer.on('tick', (deltaMs: number) => {
        tick.tick(deltaMs);
      });
    }

    // Cleanup on app destroy
    app.on('destroyed', () => {
      if (container.bound('tick')) {
        const tick = app.make<TickSystem>('tick');
        tick.destroy();
      }
    });
  }

  provides(): string[] {
    return ['tick'];
  }

  isDeferred(): boolean {
    return false;
  }
}
