/**
 * PlatformerController - 2D platformer movement logic.
 * Handles: run, jump, double jump, gravity, coyote time, ground detection.
 * No rendering imports — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface PlatformerConfig {
  /** Horizontal move speed (px/sec). Default: 200 */
  moveSpeed?: number;
  /** Jump velocity (px/sec upward, negative = up). Default: -400 */
  jumpForce?: number;
  /** Gravity acceleration (px/sec²). Default: 800 */
  gravity?: number;
  /** Maximum fall speed (px/sec). Default: 600 */
  maxFallSpeed?: number;
  /** Allow double jump? Default: false */
  doubleJump?: boolean;
  /** Coyote time grace period (ms after leaving edge). Default: 100 */
  coyoteTime?: number;
}

export interface PlatformerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  isJumping: boolean;
  canDoubleJump: boolean;
  facing: 'left' | 'right';
}

export interface PlatformerEvents {
  'jump': () => void;
  'land': () => void;
  'double-jump': () => void;
}

export class PlatformerController extends EventEmitter<PlatformerEvents> {
  private _config: Required<PlatformerConfig>;
  private _state: PlatformerState;
  private _coyoteTimer: number;
  private _wasGrounded: boolean;
  private _jumpPressed: boolean;

  constructor(config: PlatformerConfig = {}) {
    super();
    this._config = {
      moveSpeed: config.moveSpeed ?? 200,
      jumpForce: config.jumpForce ?? -400,
      gravity: config.gravity ?? 800,
      maxFallSpeed: config.maxFallSpeed ?? 600,
      doubleJump: config.doubleJump ?? false,
      coyoteTime: config.coyoteTime ?? 100,
    };
    this._state = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      isGrounded: false,
      isJumping: false,
      canDoubleJump: false,
      facing: 'right',
    };
    this._coyoteTimer = 0;
    this._wasGrounded = false;
    this._jumpPressed = false;
  }

  /**
   * Call each frame with dt in seconds and current input.
   * groundY: if provided, clamp position when y >= groundY.
   * Returns the updated state.
   */
  update(
    dt: number,
    input: { left: boolean; right: boolean; jump: boolean },
    groundY?: number
  ): PlatformerState {
    const cfg = this._config;
    const s = this._state;

    // Track coyote time: window after leaving ground
    if (s.isGrounded) {
      this._coyoteTimer = cfg.coyoteTime;
    } else if (this._coyoteTimer > 0) {
      this._coyoteTimer -= dt * 1000;
    }

    // Horizontal movement
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    s.vx = cfg.moveSpeed * dir;
    if (dir > 0) s.facing = 'right';
    else if (dir < 0) s.facing = 'left';

    // Jump logic
    const jumpJustPressed = input.jump && !this._jumpPressed;
    this._jumpPressed = input.jump;

    const canJumpCoyote = this._coyoteTimer > 0 && !s.isGrounded;
    const canJumpGrounded = s.isGrounded;

    if (jumpJustPressed) {
      if (canJumpGrounded || canJumpCoyote) {
        s.vy = cfg.jumpForce;
        s.isJumping = true;
        s.isGrounded = false;
        this._coyoteTimer = 0;
        if (cfg.doubleJump) s.canDoubleJump = true;
        this.emit('jump');
      } else if (cfg.doubleJump && s.canDoubleJump && !s.isGrounded) {
        s.vy = cfg.jumpForce;
        s.canDoubleJump = false;
        this.emit('double-jump');
      }
    }

    // Apply gravity
    if (!s.isGrounded) {
      s.vy += cfg.gravity * dt;
      if (s.vy > cfg.maxFallSpeed) s.vy = cfg.maxFallSpeed;
    }

    // Integrate position
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    // Ground collision via groundY
    // Only snap to ground when moving downward (vy >= 0) to allow jumping off ground
    if (groundY !== undefined && s.y >= groundY && s.vy >= 0) {
      const wasInAir = !this._wasGrounded;
      s.y = groundY;
      s.vy = 0;
      s.isGrounded = true;
      s.isJumping = false;
      s.canDoubleJump = false;
      if (wasInAir) this.emit('land');
    } else if (groundY !== undefined && (s.y < groundY || s.vy < 0)) {
      s.isGrounded = false;
    }

    this._wasGrounded = s.isGrounded;
    return { ...s };
  }

  /** Set grounded state externally (from collision detection) */
  setGrounded(grounded: boolean, groundY?: number): void {
    const wasInAir = !this._state.isGrounded && grounded;
    this._state.isGrounded = grounded;
    if (grounded) {
      this._state.vy = 0;
      this._state.isJumping = false;
      this._state.canDoubleJump = false;
      if (groundY !== undefined) this._state.y = groundY;
      if (wasInAir) this.emit('land');
    }
  }

  /** Get current state snapshot */
  get state(): PlatformerState {
    return { ...this._state };
  }

  /** Set position directly */
  setPosition(x: number, y: number): void {
    this._state.x = x;
    this._state.y = y;
  }

  /** Reset velocity and state */
  reset(): void {
    this._state.vx = 0;
    this._state.vy = 0;
    this._state.isGrounded = false;
    this._state.isJumping = false;
    this._state.canDoubleJump = false;
    this._coyoteTimer = 0;
    this._wasGrounded = false;
    this._jumpPressed = false;
  }
}
