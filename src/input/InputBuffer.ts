import { EventEmitter } from 'eventemitter3';

export interface InputBufferConfig {
  /** How long a buffered action stays valid (ms). Default: 100 */
  bufferWindow?: number;
  /** Grace period after leaving ground where jump is still allowed (ms). Default: 100 */
  coyoteTime?: number;
}

export interface InputBufferEvents {
  'consumed': (action: string) => void;
  'expired': (action: string) => void;
}

export class InputBuffer extends EventEmitter<InputBufferEvents> {
  private _bufferWindow: number;
  private _coyoteTime: number;
  private _buffered = new Map<string, number>(); // action → remaining ms
  private _grounded = false;
  private _coyoteTimer = 0;

  constructor(config?: InputBufferConfig) {
    super();
    this._bufferWindow = config?.bufferWindow ?? 100;
    this._coyoteTime = config?.coyoteTime ?? 100;
  }

  /** Buffer an input action */
  buffer(action: string): void {
    this._buffered.set(action, this._bufferWindow);
  }

  /** Try to consume a buffered action. Returns true if valid. */
  consume(action: string): boolean {
    if (this._buffered.has(action)) {
      this._buffered.delete(action);
      this.emit('consumed', action);
      return true;
    }
    return false;
  }

  /** Call each frame (dt in ms) */
  update(dtMs: number): void {
    // Decay buffered actions
    for (const [action, remaining] of this._buffered) {
      const newRemaining = remaining - dtMs;
      if (newRemaining <= 0) {
        this._buffered.delete(action);
        this.emit('expired', action);
      } else {
        this._buffered.set(action, newRemaining);
      }
    }

    // Decay coyote timer
    if (!this._grounded && this._coyoteTimer > 0) {
      this._coyoteTimer -= dtMs;
      if (this._coyoteTimer < 0) this._coyoteTimer = 0;
    }
  }

  /** Set grounded state for coyote time */
  setGrounded(grounded: boolean): void {
    if (this._grounded && !grounded) {
      // Just left ground — start coyote timer
      this._coyoteTimer = this._coyoteTime;
    }
    this._grounded = grounded;
  }

  /** Can jump? (grounded OR within coyote time) */
  get canJump(): boolean {
    return this._grounded || this._coyoteTimer > 0;
  }

  /** Has a specific action buffered? */
  has(action: string): boolean {
    return this._buffered.has(action);
  }

  /** Clear all buffered inputs */
  clear(): void {
    this._buffered.clear();
  }
}
