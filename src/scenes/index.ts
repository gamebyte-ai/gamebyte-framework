/**
 * Scenes Module - GameByte Framework
 *
 * Contains base scene implementations for 2D games.
 * Note: BaseScene3D is in the three-toolkit module.
 *
 * @module scenes
 * @example
 * ```typescript
 * import { BaseScene } from '@gamebyte/framework/scenes';
 *
 * class GameScene extends BaseScene {
 *   constructor() {
 *     super('game', 'Game Scene');
 *   }
 * }
 * ```
 */

export { BaseScene } from './BaseScene.js';
export { MergeGameScene } from './MergeGameScene.js';
export type { MergeGameSceneConfig } from './MergeGameScene.js';

// Note: BaseScene3D is in @gamebyte/framework/three-toolkit
