import { DspEffect } from '../DspEffect.js';

export interface CompressorConfig {
  /** Threshold in dBFS above which compression begins. @default -24 */
  threshold?: number;
  /** Compression ratio (n:1). @default 12 */
  ratio?: number;
  /** Attack time in seconds. @default 0.003 */
  attack?: number;
  /** Release time in seconds. @default 0.25 */
  release?: number;
  /** Knee width in dB (soft-knee transition). @default 30 */
  knee?: number;
}

/**
 * DynamicsCompressor effect. Prevents clipping when many sounds play simultaneously.
 *
 * @example
 * ```typescript
 * const comp = new CompressorEffect({ threshold: -24, ratio: 4 });
 * chain.addEffect(comp);
 * comp.setThreshold(-18);
 * ```
 */
export class CompressorEffect extends DspEffect {
  private _compressor: DynamicsCompressorNode | null = null;
  private readonly _config: CompressorConfig;

  constructor(config: CompressorConfig = {}) {
    super();
    this._config = config;
  }

  protected _createNodes(ctx: AudioContext): void {
    this._compressor = ctx.createDynamicsCompressor();

    const { threshold = -24, ratio = 12, attack = 0.003, release = 0.25, knee = 30 } = this._config;
    this._compressor.threshold.value = threshold;
    this._compressor.ratio.value = ratio;
    this._compressor.attack.value = attack;
    this._compressor.release.value = release;
    this._compressor.knee.value = knee;

    this._input!.connect(this._compressor);
    this._compressor.connect(this._output!);
  }

  /** Set the compression threshold in dBFS. */
  public setThreshold(db: number): void {
    if (this._compressor) this._compressor.threshold.value = db;
  }

  /** Set the compression ratio (n:1). */
  public setRatio(ratio: number): void {
    if (this._compressor) this._compressor.ratio.value = ratio;
  }

  /** Set the attack time in seconds. */
  public setAttack(seconds: number): void {
    if (this._compressor) this._compressor.attack.value = seconds;
  }

  /** Set the release time in seconds. */
  public setRelease(seconds: number): void {
    if (this._compressor) this._compressor.release.value = seconds;
  }

  public override destroy(): void {
    this._compressor?.disconnect();
    this._compressor = null;
    super.destroy();
  }
}
