import { DspChain } from './DspChain.js';
import { FilterEffect } from './effects/FilterEffect.js';
import { ReverbEffect } from './effects/ReverbEffect.js';
import { DelayEffect } from './effects/DelayEffect.js';
import { DistortionEffect } from './effects/DistortionEffect.js';
import { CompressorEffect } from './effects/CompressorEffect.js';

/**
 * Factory methods that return pre-configured DspChains for common game audio scenarios.
 *
 * All methods are SSR-safe — they only call Web Audio APIs when `AudioContext` is
 * passed in, so the guard lives at the call site:
 *
 * @example
 * ```typescript
 * if (typeof AudioContext !== 'undefined') {
 *   const chain = DspPresets.underwater(myAudioContext);
 *   sourceNode.connect(chain.input);
 *   chain.output.connect(audioContext.destination);
 * }
 * ```
 */
export class DspPresets {
  /**
   * Muffled underwater sound.
   * Low-pass filter at 400 Hz with moderate resonance.
   */
  static underwater(ctx: AudioContext): DspChain {
    const chain = new DspChain(ctx);
    chain.addEffect(new FilterEffect({ type: 'lowpass', frequency: 400, Q: 2 }));
    return chain;
  }

  /**
   * Behind-wall occlusion.
   * Gentle low-pass filter at 800 Hz for a muffled, blocked sound.
   */
  static occluded(ctx: AudioContext): DspChain {
    const chain = new DspChain(ctx);
    chain.addEffect(new FilterEffect({ type: 'lowpass', frequency: 800, Q: 0.7 }));
    return chain;
  }

  /**
   * Spacey echo effect.
   * Short delay with moderate feedback for an environmental feel.
   */
  static echo(ctx: AudioContext): DspChain {
    const chain = new DspChain(ctx);
    chain.addEffect(new DelayEffect({ time: 0.25, feedback: 0.4, wetMix: 0.3 }));
    return chain;
  }

  /**
   * Old radio / walkie-talkie.
   * Bandpass filter to narrow the frequency range, then light distortion.
   */
  static radio(ctx: AudioContext): DspChain {
    const chain = new DspChain(ctx);
    chain.addEffect(new FilterEffect({ type: 'bandpass', frequency: 2000, Q: 5 }));
    chain.addEffect(new DistortionEffect({ amount: 20, wetMix: 0.6 }));
    return chain;
  }

  /**
   * Lo-fi / 8-bit aesthetic.
   * Heavy distortion followed by a high-pass filter to cut the bass.
   */
  static lofi(ctx: AudioContext): DspChain {
    const chain = new DspChain(ctx);
    chain.addEffect(new DistortionEffect({ amount: 80, wetMix: 0.8 }));
    chain.addEffect(new FilterEffect({ type: 'highpass', frequency: 300 }));
    return chain;
  }

  /**
   * Cave / cathedral reverb.
   * Long synthetic reverb tail for large enclosed spaces.
   */
  static cave(ctx: AudioContext): DspChain {
    const chain = new DspChain(ctx);
    const reverb = new ReverbEffect({ wetMix: 0.5, dryMix: 0.5 });
    chain.addEffect(reverb);
    // generateImpulse is called after init() — DspChain.addEffect() triggers init()
    reverb.generateImpulse(3.0, 0.3);
    return chain;
  }

  /**
   * Master bus compressor.
   * Transparent glue compression to prevent clipping when many sounds overlap.
   */
  static masterCompressor(ctx: AudioContext): DspChain {
    const chain = new DspChain(ctx);
    chain.addEffect(new CompressorEffect({ threshold: -24, ratio: 4, attack: 0.003, release: 0.25 }));
    return chain;
  }
}
