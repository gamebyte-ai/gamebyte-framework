/**
 * GameByte Hybrid Module
 *
 * One-call setup for 3D world + 2D HUD games.
 *
 * @example
 * ```typescript
 * import { HybridGame } from 'gamebyte-framework/hybrid';
 *
 * const game = await HybridGame.create({
 *   container: '#game',
 *   width: 800,
 *   height: 600,
 *   cameraMode: 'isometric',
 *   enableRaycast: true,
 * });
 *
 * game.addDefaultLighting();
 * game.onUpdate((dt) => { myMesh.rotation.y += dt; });
 * ```
 */

export { HybridGame } from './HybridGame.js';
export type { HybridGameConfig, HybridGameEvents } from './HybridGame.js';

export { HybridHUD } from './HybridHUD.js';
export type { TopBarConfig, BottomBarConfig } from './HybridHUD.js';
