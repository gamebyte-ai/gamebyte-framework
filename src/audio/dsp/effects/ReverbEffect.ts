import { DspEffect } from '../DspEffect.js';

export interface ReverbConfig {
  /** Wet (processed) mix level 0–1. @default 0.3 */
  wetMix?: number;
  /** Dry (original) mix level 0–1. @default 0.7 */
  dryMix?: number;
}

/**
 * Convolution reverb effect with wet/dry mix.
 *
 * Call `generateImpulse()` for an instant synthetic reverb, or
 * call `setImpulse()` with a pre-loaded AudioBuffer for higher quality.
 *
 * @example
 * ```typescript
 * const reverb = new ReverbEffect({ wetMix: 0.4, dryMix: 0.6 });
 * chain.addEffect(reverb);
 * reverb.generateImpulse(2.0, 0.8); // 2-second tail, 0.8 decay
 * ```
 */
export class ReverbEffect extends DspEffect {
  private _convolver: ConvolverNode | null = null;
  private _dryGain: GainNode | null = null;
  private _wetGain: GainNode | null = null;
  private readonly _config: ReverbConfig;

  constructor(config: ReverbConfig = {}) {
    super();
    this._config = config;
  }

  protected _createNodes(ctx: AudioContext): void {
    this._convolver = ctx.createConvolver();
    this._dryGain = ctx.createGain();
    this._wetGain = ctx.createGain();

    this._dryGain.gain.value = this._config.dryMix ?? 0.7;
    this._wetGain.gain.value = this._config.wetMix ?? 0.3;

    // Dry path: input → dryGain → output
    this._input!.connect(this._dryGain);
    this._dryGain.connect(this._output!);

    // Wet path: input → convolver → wetGain → output
    this._input!.connect(this._convolver);
    this._convolver.connect(this._wetGain);
    this._wetGain.connect(this._output!);
  }

  /** Assign a pre-loaded impulse response AudioBuffer. */
  public setImpulse(buffer: AudioBuffer): void {
    if (this._convolver) this._convolver.buffer = buffer;
  }

  /**
   * Synthesize a simple impulse response in-place.
   * @param duration Reverb tail length in seconds. @default 2.0
   * @param decay    Exponential decay rate (0–1, higher = faster fade). @default 0.5
   */
  public generateImpulse(duration = 2.0, decay = 0.5): void {
    if (!this._ctx || !this._convolver) return;
    const sampleRate = this._ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay * 10);
      }
    }
    this._convolver.buffer = buffer;
  }

  /** Adjust wet and dry levels independently. Values are clamped to 0–1. */
  public setWetDry(wet: number, dry: number): void {
    const w = Math.max(0, Math.min(1, wet));
    const d = Math.max(0, Math.min(1, dry));
    if (this._wetGain) this._wetGain.gain.value = w;
    if (this._dryGain) this._dryGain.gain.value = d;
  }

  public override destroy(): void {
    this._convolver?.disconnect();
    this._dryGain?.disconnect();
    this._wetGain?.disconnect();
    this._convolver = null;
    this._dryGain = null;
    this._wetGain = null;
    super.destroy();
  }
}
