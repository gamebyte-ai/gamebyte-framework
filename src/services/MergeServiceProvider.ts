import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { MergeManager, MergeGameConfig } from '../merge/MergeManager';

/**
 * Service provider for the Merge game system
 *
 * Registers merge game services and components in the container.
 *
 * @example
 * ```typescript
 * import { GameByte, MergeServiceProvider } from 'gamebyte-framework';
 *
 * const game = GameByte.create();
 * game.register(new MergeServiceProvider());
 *
 * await game.initialize(canvas, '2d');
 *
 * // Now you can use the Merge facade
 * import { Merge } from 'gamebyte-framework';
 * Merge.createGame({ rows: 5, cols: 5 });
 * ```
 */
export class MergeServiceProvider extends AbstractServiceProvider {
  private config: Partial<MergeGameConfig>;

  constructor(config: Partial<MergeGameConfig> = {}) {
    super();
    this.config = config;
  }

  /**
   * Register merge services in the container
   */
  public register(app: GameByte): void {
    // Register MergeManager as singleton
    app.singleton('merge', () => {
      return new MergeManager(this.config);
    });

    // Register alias for convenience
    app.getContainer().alias('merge.manager', 'merge');
  }

  /**
   * Boot the merge services
   */
  public async boot(app: GameByte): Promise<void> {
    // Get the merge manager to ensure it's initialized
    const mergeManager = app.make<MergeManager>('merge');

    // Emit merge system ready event
    app.emit('merge-system-ready', { mergeManager });
  }

  /**
   * Services this provider offers
   */
  public provides(): string[] {
    return ['merge', 'merge.manager'];
  }
}

export default MergeServiceProvider;
