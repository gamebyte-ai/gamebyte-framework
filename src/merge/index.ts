/**
 * Merge Game System
 *
 * Complete system for building merge puzzle games like
 * "World Tour Merge", "Goddess Merge", "Candy Crush", and similar mobile games.
 *
 * This module provides:
 * - MergeManager: High-level game management
 * - MergeGrid, MergeCell, MergeItem: Core components
 * - MergeGameScene: Ready-to-use scene preset
 * - Merge facade: Static API for quick access
 *
 * @example
 * ```typescript
 * // Quick start with facade
 * import { Merge } from 'gamebyte-framework';
 *
 * Merge.createGame({ rows: 5, cols: 5 });
 * Merge.on('merge', (item, tier, score) => console.log('Merged!'));
 * Merge.start();
 * scene.addChild(Merge.getContainer());
 *
 * // Or with MergeGameScene
 * import { MergeGameScene } from 'gamebyte-framework';
 *
 * const scene = new MergeGameScene({
 *   rows: 6,
 *   cols: 6,
 *   showScoreUI: true
 * });
 * sceneManager.add(scene);
 * sceneManager.switchTo('merge-game');
 * ```
 *
 * @module merge
 */

export { MergeManager } from './MergeManager';
export type {
  MergeGameConfig,
  MergeGameState,
  MergeManagerEvents
} from './MergeManager';
