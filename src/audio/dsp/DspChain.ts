import { DspEffect } from './DspEffect.js';

/**
 * A serial chain of DspEffects driven by a single AudioContext.
 *
 * Audio flow: source → chain.input → [effect1 → effect2 → ...] → chain.output → destination
 *
 * @example
 * ```typescript
 * const chain = new DspChain(audioContext);
 * chain.addEffect(new FilterEffect({ type: 'lowpass', frequency: 400 }));
 * sourceNode.connect(chain.input);
 * chain.output.connect(audioContext.destination);
 * ```
 */
export class DspChain {
  private readonly _ctx: AudioContext;
  private readonly _effects: DspEffect[] = [];
  private readonly _input: GainNode;
  private readonly _output: GainNode;

  constructor(ctx: AudioContext) {
    this._ctx = ctx;
    this._input = ctx.createGain();
    this._output = ctx.createGain();
    // Bypass path: input directly to output when no effects are present.
    this._input.connect(this._output);
  }

  /** Connect your audio source to this node. */
  public get input(): GainNode {
    return this._input;
  }

  /** Connect this node to your destination (e.g. audioContext.destination). */
  public get output(): GainNode {
    return this._output;
  }

  /** Add an effect to the end of the chain and rewire. */
  public addEffect(effect: DspEffect): void {
    effect.init(this._ctx);
    this._effects.push(effect);
    this._rewire();
  }

  /** Remove an effect from the chain, destroy it, and rewire. */
  public removeEffect(effect: DspEffect): void {
    const idx = this._effects.indexOf(effect);
    if (idx < 0) return;
    this._effects.splice(idx, 1);
    effect.destroy();
    this._rewire();
  }

  /** Remove and destroy all effects. */
  public clearEffects(): void {
    for (const effect of this._effects) effect.destroy();
    this._effects.length = 0;
    this._rewire();
  }

  /** Return a snapshot of the current effects in chain order. */
  public getEffects(): DspEffect[] {
    return [...this._effects];
  }

  /** Set the input gain (0–1). Useful for level-matching sources. */
  public setInputGain(gain: number): void {
    this._input.gain.value = Math.max(0, gain);
  }

  /** Set the output gain (0–1). Useful for overall wet level. */
  public setOutputGain(gain: number): void {
    this._output.gain.value = Math.max(0, gain);
  }

  /** Connect the chain's output to any destination AudioNode. */
  public connectTo(destination: AudioNode): void {
    this._output.connect(destination);
  }

  /** Disconnect the chain's output from all destinations. */
  public disconnect(): void {
    this._output.disconnect();
  }

  /** Destroy all effects and release all Web Audio nodes. */
  public destroy(): void {
    for (const effect of this._effects) effect.destroy();
    this._effects.length = 0;
    this._input.disconnect();
    this._output.disconnect();
  }

  /**
   * Rebuild the internal graph after effects are added or removed.
   * Disconnects everything, then re-chains: input → e[0] → e[1] → ... → output.
   */
  private _rewire(): void {
    this._input.disconnect();
    for (const effect of this._effects) {
      effect.input.disconnect();
      effect.output.disconnect();
    }

    if (this._effects.length === 0) {
      this._input.connect(this._output);
      return;
    }

    this._input.connect(this._effects[0]!.input);

    for (let i = 0; i < this._effects.length - 1; i++) {
      this._effects[i]!.output.connect(this._effects[i + 1]!.input);
    }

    this._effects[this._effects.length - 1]!.output.connect(this._output);
  }
}
