import { DspEffect } from '../DspEffect.js';

export interface DistortionConfig {
  /** Drive amount 0–100 (higher = more distortion). @default 50 */
  amount?: number;
  /** Wet mix level 0–1. @default 0.5 */
  wetMix?: number;
}

/**
 * WaveShaper-based distortion effect with wet/dry mix.
 * Uses a tanh soft-clipping curve for musical harmonic distortion.
 *
 * @example
 * ```typescript
 * const dist = new DistortionEffect({ amount: 80, wetMix: 0.8 });
 * chain.addEffect(dist);
 * dist.setAmount(40); // Back off the drive
 * ```
 */
export class DistortionEffect extends DspEffect {
  private _shaper: WaveShaperNode | null = null;
  private _dryGain: GainNode | null = null;
  private _wetGain: GainNode | null = null;
  private readonly _config: DistortionConfig;

  constructor(config: DistortionConfig = {}) {
    super();
    this._config = config;
  }

  protected _createNodes(ctx: AudioContext): void {
    const wetMix = this._config.wetMix ?? 0.5;

    this._shaper = ctx.createWaveShaper();
    this._shaper.oversample = '4x';
    this._applyDriveCurve(this._config.amount ?? 50);

    this._dryGain = ctx.createGain();
    this._dryGain.gain.value = 1 - wetMix;

    this._wetGain = ctx.createGain();
    this._wetGain.gain.value = wetMix;

    // Dry path
    this._input!.connect(this._dryGain);
    this._dryGain.connect(this._output!);

    // Wet (distorted) path
    this._input!.connect(this._shaper);
    this._shaper.connect(this._wetGain);
    this._wetGain.connect(this._output!);
  }

  /**
   * Set distortion drive amount.
   * @param amount 0–100 (higher = more distortion)
   */
  public setAmount(amount: number): void {
    if (this._shaper) this._applyDriveCurve(amount);
  }

  /** Build a tanh soft-clip waveshaping curve for the given drive. */
  private _applyDriveCurve(amount: number): void {
    if (!this._shaper) return;
    const samples = 256;
    const curve = new Float32Array(samples);
    const drive = Math.max(0, amount);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * (drive + 1));
    }
    this._shaper.curve = curve;
  }

  public override destroy(): void {
    this._shaper?.disconnect();
    this._dryGain?.disconnect();
    this._wetGain?.disconnect();
    this._shaper = null;
    this._dryGain = null;
    this._wetGain = null;
    super.destroy();
  }
}
