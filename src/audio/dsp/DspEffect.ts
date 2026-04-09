/**
 * Base class for all DSP audio effects.
 *
 * Each effect wraps one or more Web Audio nodes. Subclasses implement
 * `_createNodes()` to build the internal audio graph between `_input` and `_output`.
 *
 * Audio flow: chain_input → effect._input → [internal nodes] → effect._output → chain_output
 */
export abstract class DspEffect {
  protected _ctx: AudioContext | null = null;
  protected _input: GainNode | null = null;
  protected _output: GainNode | null = null;

  /** True once `init()` has been called. */
  private _initialized = false;

  /** Initialize the effect with a live AudioContext. Called by DspChain.addEffect(). */
  public init(ctx: AudioContext): void {
    if (this._initialized) return;
    this._ctx = ctx;
    this._input = ctx.createGain();
    this._output = ctx.createGain();
    this._createNodes(ctx);
    this._initialized = true;
  }

  /** The node that the chain connects incoming audio to. */
  public get input(): AudioNode {
    if (!this._input) throw new Error('DspEffect not initialized — call init() first');
    return this._input;
  }

  /** The node that carries processed audio out to the next stage. */
  public get output(): AudioNode {
    if (!this._output) throw new Error('DspEffect not initialized — call init() first');
    return this._output;
  }

  /**
   * Override to create the effect's internal audio nodes.
   * Connect `this._input` → [nodes] → `this._output`.
   */
  protected abstract _createNodes(ctx: AudioContext): void;

  /** Disconnect and release all Web Audio resources. */
  public destroy(): void {
    this._input?.disconnect();
    this._output?.disconnect();
    this._input = null;
    this._output = null;
    this._ctx = null;
    this._initialized = false;
  }
}
