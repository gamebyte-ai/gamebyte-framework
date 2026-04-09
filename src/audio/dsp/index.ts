/**
 * DSP Effects Chain — GameByte Framework
 *
 * Real-time Web Audio API effects processing via chainable DspEffect nodes.
 *
 * @module audio/dsp
 * @example
 * ```typescript
 * import { DspChain, FilterEffect, DspPresets } from '@gamebyte/framework/audio/dsp';
 *
 * const chain = DspPresets.underwater(audioContext);
 * sourceNode.connect(chain.input);
 * chain.output.connect(audioContext.destination);
 * ```
 */

export { DspEffect } from './DspEffect.js';
export { DspChain } from './DspChain.js';
export { DspPresets } from './DspPresets.js';

// Effects
export { FilterEffect } from './effects/FilterEffect.js';
export { ReverbEffect } from './effects/ReverbEffect.js';
export { DelayEffect } from './effects/DelayEffect.js';
export { DistortionEffect } from './effects/DistortionEffect.js';
export { CompressorEffect } from './effects/CompressorEffect.js';

// Config interfaces
export type { FilterConfig } from './effects/FilterEffect.js';
export type { ReverbConfig } from './effects/ReverbEffect.js';
export type { DelayConfig } from './effects/DelayEffect.js';
export type { DistortionConfig } from './effects/DistortionEffect.js';
export type { CompressorConfig } from './effects/CompressorEffect.js';
