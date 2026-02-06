import { AbstractServiceProvider } from '../contracts/ServiceProvider.js';
import { GameByte } from '../core/GameByte.js';
import { SmartAssetPipeline } from '../assets/SmartAssetPipeline.js';

/**
 * Service provider for the Smart Asset Pipeline.
 */
export class AssetPipelineServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('assets.pipeline', () => new SmartAssetPipeline());
  }

  boot(app: GameByte): void {
    app.on('destroyed', () => {
      if (app.getContainer().bound('assets.pipeline')) {
        app.make<SmartAssetPipeline>('assets.pipeline').dispose();
      }
    });
  }

  provides(): string[] {
    return ['assets.pipeline'];
  }

  isDeferred(): boolean {
    return true;
  }
}
