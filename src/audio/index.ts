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

// Lightweight SFX Helper (Web Audio API, no framework dependencies)
export { SFXHelper } from './SFXHelper.js';

// DSP Effects Chain
export { DspEffect, DspChain, DspPresets } from './dsp/index.js';
export { FilterEffect } from './dsp/index.js';
export { ReverbEffect } from './dsp/index.js';
export { DelayEffect } from './dsp/index.js';
export { DistortionEffect } from './dsp/index.js';
export { CompressorEffect } from './dsp/index.js';
export type { FilterConfig, ReverbConfig, DelayConfig, DistortionConfig, CompressorConfig } from './dsp/index.js';
