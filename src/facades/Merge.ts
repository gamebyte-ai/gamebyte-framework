import { Facade } from './Facade';
import { MergeManager, MergeGameConfig, MergeGameState } from '../merge/MergeManager';
import { MergeGrid } from '../ui/components/merge/MergeGrid';
import { MergeItem } from '../ui/components/merge/MergeItem';
import { IContainer } from '../contracts/Graphics';

/**
 * Merge facade for easy access to merge game functionality
 *
 * Provides a simple, static API for creating and managing merge puzzle games.
 *
 * @example
 * ```typescript
 * import { Merge } from 'gamebyte-framework';
 *
 * // Quick setup - create a 5x5 merge game
 * const grid = Merge.createGame({
 *   rows: 5,
 *   cols: 5,
 *   initialItems: 3
 * });
 *
 * // Listen for events
 * Merge.on('merge', (item, tier, score) => {
 *   console.log(`Merged! Tier: ${tier}, Score: ${score}`);
 * });
 *
 * // Start the game
 * Merge.start();
 *
 * // Add to your scene
 * scene.addChild(Merge.getContainer());
 * ```
 */
export class Merge extends Facade {
  /**
   * Get the facade accessor key
   */
  protected static getFacadeAccessor(): string {
    return 'merge';
  }

  /**
   * Get the merge manager instance
   */
  private static getManager(): MergeManager {
    return this.resolve<MergeManager>();
  }

  // ============================================
  // GAME CREATION
  // ============================================

  /**
   * Create a new merge game
   *
   * @example
   * ```typescript
   * // Simple 5x5 grid
   * Merge.createGame({ rows: 5, cols: 5 });
   *
   * // Custom configuration
   * Merge.createGame({
   *   rows: 6,
   *   cols: 6,
   *   maxTier: 12,
   *   initialItems: 5,
   *   autoSpawn: true,
   *   tierColors: [0xFF0000, 0x00FF00, 0x0000FF]
   * });
   * ```
   */
  static createGame(config?: Partial<MergeGameConfig>): MergeGrid {
    return this.getManager().createGame(config);
  }

  /**
   * Quick create - creates a game with sensible defaults
   *
   * @example
   * ```typescript
   * // Creates 5x5 grid with 3 initial items
   * const grid = Merge.quick();
   * scene.addChild(Merge.getContainer());
   * Merge.start();
   * ```
   */
  static quick(): MergeGrid {
    return this.createGame({
      rows: 5,
      cols: 5,
      initialItems: 3,
      autoSpawn: false
    });
  }

  /**
   * Create a Candy Crush style merge game
   */
  static createCandyStyle(rows: number = 6, cols: number = 5): MergeGrid {
    return this.createGame({
      rows,
      cols,
      cellWidth: 70,
      cellHeight: 70,
      gap: 6,
      padding: 12,
      maxTier: 8,
      initialItems: 4,
      tierColors: [
        0xE57373, // Red candy
        0x81C784, // Green candy
        0x64B5F6, // Blue candy
        0xFFD54F, // Yellow candy
        0xBA68C8, // Purple candy
        0x4DD0E1, // Cyan candy
        0xFFB74D, // Orange candy
        0xF06292, // Pink candy
      ]
    });
  }

  /**
   * Create a compact mobile-friendly merge game
   */
  static createMobileCompact(): MergeGrid {
    return this.createGame({
      rows: 4,
      cols: 4,
      cellWidth: 85,
      cellHeight: 85,
      gap: 10,
      padding: 20,
      initialItems: 2,
      autoSpawn: false
    });
  }

  // ============================================
  // GAME CONTROL
  // ============================================

  /**
   * Start the game
   */
  static start(): void {
    this.getManager().start();
  }

  /**
   * Pause the game
   */
  static pause(): void {
    this.getManager().pause();
  }

  /**
   * Resume the game
   */
  static resume(): void {
    this.getManager().resume();
  }

  /**
   * Reset the game
   */
  static reset(): void {
    this.getManager().reset();
  }

  /**
   * Restart the game (reset + start)
   */
  static restart(): void {
    this.reset();
    this.start();
  }

  // ============================================
  // ITEM MANAGEMENT
  // ============================================

  /**
   * Spawn a new item
   */
  static spawnItem(tier: number = 1): MergeItem | null {
    return this.getManager().spawnItem(tier);
  }

  /**
   * Spawn multiple items
   */
  static spawnItems(count: number, tier: number = 1): MergeItem[] {
    const items: MergeItem[] = [];
    for (let i = 0; i < count; i++) {
      const item = this.spawnItem(tier);
      if (item) {
        items.push(item);
      }
    }
    return items;
  }

  // ============================================
  // STATE & GETTERS
  // ============================================

  /**
   * Get the grid instance
   */
  static getGrid(): MergeGrid | null {
    return this.getManager().getGrid();
  }

  /**
   * Get the container for adding to scene
   */
  static getContainer(): IContainer {
    return this.getManager().getContainer();
  }

  /**
   * Get current game state
   */
  static getState(): MergeGameState {
    return this.getManager().getState();
  }

  /**
   * Get current score
   */
  static getScore(): number {
    return this.getManager().getScore();
  }

  /**
   * Get highest tier achieved
   */
  static getHighestTier(): number {
    return this.getManager().getHighestTier();
  }

  /**
   * Check if game is over
   */
  static isGameOver(): boolean {
    return this.getManager().isGameOver();
  }

  /**
   * Check if game is paused
   */
  static isPaused(): boolean {
    return this.getManager().isPaused();
  }

  /**
   * Get grid dimensions
   */
  static getDimensions(): { width: number; height: number } {
    return this.getManager().getDimensions();
  }

  // ============================================
  // POSITIONING
  // ============================================

  /**
   * Set grid position
   */
  static setPosition(x: number, y: number): typeof Merge {
    this.getManager().setPosition(x, y);
    return this;
  }

  /**
   * Center grid in area
   */
  static centerIn(width: number, height: number): typeof Merge {
    this.getManager().centerIn(width, height);
    return this;
  }

  // ============================================
  // EVENTS
  // ============================================

  /**
   * Listen for game events
   *
   * @example
   * ```typescript
   * Merge.on('merge', (item, tier, score) => {
   *   showMergeEffect(item.getPosition());
   *   updateScoreDisplay(score);
   * });
   *
   * Merge.on('game-over', (state) => {
   *   showGameOverScreen(state.score);
   * });
   *
   * Merge.on('max-tier', (item) => {
   *   celebrate();
   * });
   * ```
   */
  static on(event: string, callback: (...args: any[]) => void): typeof Merge {
    this.getManager().on(event as any, callback);
    return this;
  }

  /**
   * Listen for event once
   */
  static once(event: string, callback: (...args: any[]) => void): typeof Merge {
    this.getManager().once(event as any, callback);
    return this;
  }

  /**
   * Remove event listener
   */
  static off(event: string, callback?: (...args: any[]) => void): typeof Merge {
    if (callback) {
      this.getManager().off(event as any, callback);
    } else {
      this.getManager().removeAllListeners(event as any);
    }
    return this;
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Destroy the merge game
   */
  static destroy(): void {
    this.getManager().destroy();
  }
}

export default Merge;
