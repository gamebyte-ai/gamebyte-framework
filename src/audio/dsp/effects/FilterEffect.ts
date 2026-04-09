import { DspEffect } from '../DspEffect.js';

export interface FilterConfig {
  /** BiquadFilter type. @default 'lowpass' */
  type?: BiquadFilterType;
  /** Cutoff frequency in Hz. @default 1000 */
  frequency?: number;
  /** Q (resonance) factor. @default 1 */
  Q?: number;
  /** Gain in dB (only applies to peaking/shelving types). @default 0 */
  gain?: number;
}

/**
 * Biquad filter effect: lowpass, highpass, bandpass, notch, peaking, etc.
 *
 * @example
 * ```typescript
 * const filter = new FilterEffect({ type: 'lowpass', frequency: 400, Q: 2 });
 * chain.addEffect(filter);
 * filter.setFrequency(800, 200); // Ramp to 800 Hz over 200 ms
 * ```
 */
export class FilterEffect extends DspEffect {
  private _filter: BiquadFilterNode | null = null;
  private readonly _config: FilterConfig;

  constructor(config: FilterConfig = {}) {
    super();
    this._config = config;
  }

  protected _createNodes(ctx: AudioContext): void {
    this._filter = ctx.createBiquadFilter();
    this._filter.type = this._config.type ?? 'lowpass';
    this._filter.frequency.value = this._config.frequency ?? 1000;
    this._filter.Q.value = this._config.Q ?? 1;
    if (this._config.gain !== undefined) {
      this._filter.gain.value = this._config.gain;
    }
    this._input!.connect(this._filter);
    this._filter.connect(this._output!);
  }

  /**
   * Set the filter cutoff frequency.
   * @param freq Target frequency in Hz
   * @param rampMs Optional linear ramp duration in milliseconds
   */
  public setFrequency(freq: number, rampMs?: number): void {
    if (!this._filter || !this._ctx) return;
    if (rampMs && rampMs > 0) {
      this._filter.frequency.linearRampToValueAtTime(
        freq,
        this._ctx.currentTime + rampMs / 1000
      );
    } else {
      this._filter.frequency.value = freq;
    }
  }

  /** Set the Q (resonance) factor. */
  public setQ(q: number): void {
    if (this._filter) this._filter.Q.value = q;
  }

  /** Change the filter type at runtime. */
  public setType(type: BiquadFilterType): void {
    if (this._filter) this._filter.type = type;
  }

  public override destroy(): void {
    this._filter?.disconnect();
    this._filter = null;
    super.destroy();
  }
}
