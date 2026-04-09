import { DspEffect } from '../DspEffect.js';

export interface DelayConfig {
  /** Delay time in seconds. @default 0.3 */
  time?: number;
  /** Feedback amount 0–1 (capped at 0.95 to prevent runaway). @default 0.3 */
  feedback?: number;
  /** Wet mix level 0–1. @default 0.3 */
  wetMix?: number;
}

/**
 * Delay/echo effect with feedback and wet/dry mix.
 *
 * @example
 * ```typescript
 * const delay = new DelayEffect({ time: 0.25, feedback: 0.4, wetMix: 0.3 });
 * chain.addEffect(delay);
 * delay.setTime(0.5);
 * ```
 */
export class DelayEffect extends DspEffect {
  private _delay: DelayNode | null = null;
  private _feedbackGain: GainNode | null = null;
  private _dryGain: GainNode | null = null;
  private _wetGain: GainNode | null = null;
  private readonly _config: DelayConfig;

  constructor(config: DelayConfig = {}) {
    super();
    this._config = config;
  }

  protected _createNodes(ctx: AudioContext): void {
    const wetMix = this._config.wetMix ?? 0.3;

    this._delay = ctx.createDelay(5); // Max 5-second delay
    this._delay.delayTime.value = this._config.time ?? 0.3;

    this._feedbackGain = ctx.createGain();
    this._feedbackGain.gain.value = Math.min(0.95, Math.max(0, this._config.feedback ?? 0.3));

    this._dryGain = ctx.createGain();
    this._dryGain.gain.value = 1 - wetMix;

    this._wetGain = ctx.createGain();
    this._wetGain.gain.value = wetMix;

    // Dry path: input → dryGain → output
    this._input!.connect(this._dryGain);
    this._dryGain.connect(this._output!);

    // Wet path with feedback loop: input → delay → feedbackGain ↩ delay → wetGain → output
    this._input!.connect(this._delay);
    this._delay.connect(this._feedbackGain);
    this._feedbackGain.connect(this._delay);
    this._delay.connect(this._wetGain);
    this._wetGain.connect(this._output!);
  }

  /**
   * Set delay time.
   * @param seconds Delay duration
   * @param rampMs  Optional linear ramp duration in milliseconds
   */
  public setTime(seconds: number, rampMs?: number): void {
    if (!this._delay || !this._ctx) return;
    if (rampMs && rampMs > 0) {
      this._delay.delayTime.linearRampToValueAtTime(
        seconds,
        this._ctx.currentTime + rampMs / 1000
      );
    } else {
      this._delay.delayTime.value = seconds;
    }
  }

  /** Set feedback amount. Clamped to 0–0.95 to prevent runaway feedback. */
  public setFeedback(feedback: number): void {
    if (this._feedbackGain) {
      this._feedbackGain.gain.value = Math.min(0.95, Math.max(0, feedback));
    }
  }

  public override destroy(): void {
    this._delay?.disconnect();
    this._feedbackGain?.disconnect();
    this._dryGain?.disconnect();
    this._wetGain?.disconnect();
    this._delay = null;
    this._feedbackGain = null;
    this._dryGain = null;
    this._wetGain = null;
    super.destroy();
  }
}
