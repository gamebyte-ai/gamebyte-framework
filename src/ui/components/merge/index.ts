/**
 * Merge Game Components
 *
 * A complete component system for building merge puzzle games like
 * "World Tour Merge", "Goddess Merge", and similar mobile games.
 *
 * Components:
 * - MergeGrid: Main container that manages the grid of cells
 * - MergeCell: Individual cell that can hold items and detect drops
 * - MergeItem: Draggable, mergeable item with tier/level system
 *
 * @example
 * ```typescript
 * import { MergeGrid, MergeItem } from 'gamebyte/ui/components/merge';
 *
 * // Create a 5x5 merge grid
 * const grid = new MergeGrid({
 *   rows: 5,
 *   cols: 5,
 *   cellWidth: 80,
 *   cellHeight: 80,
 *   gap: 8
 * });
 *
 * // Spawn initial items
 * grid.spawnItem({ tier: 1 });
 * grid.spawnItem({ tier: 1 });
 * grid.spawnItem({ tier: 2 });
 *
 * // Listen for game events
 * grid.on('merge-completed', (g, item, cell) => {
 *   console.log(`Merged! New tier: ${item.tier}`);
 *   score += item.tier * 100;
 * });
 *
 * grid.on('max-tier-reached', (g, item) => {
 *   console.log('Congratulations! Max tier reached!');
 * });
 *
 * // Add to scene
 * scene.addChild(grid.getContainer());
 * ```
 *
 * @module merge
 */

export { MergeGrid } from './MergeGrid';
export type { MergeGridConfig, MergeGridEvents } from './MergeGrid';
export { MergeCell } from './MergeCell';
export type { MergeCellConfig, MergeCellEvents } from './MergeCell';
export { MergeItem } from './MergeItem';
export type { MergeItemConfig, MergeItemEvents } from './MergeItem';
