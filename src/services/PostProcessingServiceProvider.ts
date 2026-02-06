import { AbstractServiceProvider } from '../contracts/ServiceProvider.js';
import { GameByte } from '../core/GameByte.js';
import { PostProcessingPipeline } from '../postprocessing/PostProcessingPipeline.js';

/**
 * Service provider for post-processing pipeline.
 * Deferred: only loaded when post-processing is requested.
 */
export class PostProcessingServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('postprocessing', () => new PostProcessingPipeline());
  }

  boot(app: GameByte): void {
    app.on('destroyed', () => {
      if (app.getContainer().bound('postprocessing')) {
        const pp = app.make<PostProcessingPipeline>('postprocessing');
        pp.dispose();
      }
    });
  }

  provides(): string[] {
    return ['postprocessing'];
  }

  isDeferred(): boolean {
    return true;
  }
}
