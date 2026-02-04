/**
 * Audio Module - GameByte Framework
 *
 * Complete audio system with music, SFX, spatial audio, and procedural generation.
 *
 * @module audio
 * @example
 * ```typescript
 * import { GameByteAudioManager, GameByteAudioSource } from '@gamebyte/framework/audio';
 * ```
 */

// Core Audio
export { GameByteAudioManager } from './core/GameByteAudioManager.js';
export { GameByteAudioSource } from './core/GameByteAudioSource.js';
export { GameByteAudioBus } from './core/GameByteAudioBus.js';

// Effects
export { GameByteAudioEffectsProcessor } from './effects/GameByteAudioEffectsProcessor.js';

// Procedural
export { GameByteProceduralAudioGenerator } from './procedural/GameByteProceduralAudioGenerator.js';

// Analytics
export { GameByteAudioAnalytics } from './analytics/GameByteAudioAnalytics.js';
