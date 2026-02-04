/**
 * Core Module - GameByte Framework
 *
 * Contains the core framework classes: GameByte, ServiceContainer, DefaultSceneManager
 *
 * @module core
 * @example
 * ```typescript
 * import { GameByte, ServiceContainer } from '@gamebyte/framework/core';
 *
 * const game = GameByte.create();
 * await game.initialize(canvas, '2d');
 * game.start();
 * ```
 */

export { GameByte } from './GameByte.js';
export type { QuickGameConfig } from './GameByte.js';
export { ServiceContainer } from './ServiceContainer.js';
export { DefaultSceneManager } from './DefaultSceneManager.js';
