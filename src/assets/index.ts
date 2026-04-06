/**
 * Assets module barrel — exports all public asset system APIs.
 */

export { GameByteAssetManager } from './GameByteAssetManager.js';
export type { AssetManagerConfig } from './GameByteAssetManager.js';

export { AssetFallback } from './AssetFallback.js';
export type { FallbackConfig, AssetFallbackStats } from './AssetFallback.js';
