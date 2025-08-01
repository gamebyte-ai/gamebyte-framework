import { EventEmitter } from 'eventemitter3';
import {
  PlatformerInputHandler,
  RawInputEvent,
  InputContext,
  GameAction,
  InputHandler
} from '../../contracts/Input';

/**
 * Platformer-specific movement state
 */
interface PlatformerMovementState {
  horizontalMovement: number; // -1 to 1
  isJumpPressed: boolean;
  wasJumpJustPressed: boolean;
  isRunPressed: boolean;
  jumpHoldDuration: number;
  jumpStartTime: number;
  framesSinceJumpPressed: number;
  coyoteTime: number; // Frames after leaving ground where jump is still valid
  jumpBufferTime: number; // Frames to buffer jump input
}

/**
 * Platformer input configuration
 */
interface PlatformerInputConfig {
  jumpBufferFrames: number;
  coyoteTimeFrames: number;
  variableJumpHeight: boolean;
  maxJumpHoldTime: number;
  runSpeedMultiplier: number;
  inputSmoothing: boolean;
  smoothingFactor: number;
}

/**
 * Specialized input handler for platformer games
 * Handles movement, jumping with coyote time, jump buffering, and variable jump height
 */
export class GameBytePlatformerInputHandler extends EventEmitter implements PlatformerInputHandler, InputHandler {
  public readonly name: string = 'platformer-input';
  public readonly priority: number = 90;
  public readonly supportedContexts: InputContext[] = ['gameplay'];

  private active: boolean = false;
  private context: InputContext = 'gameplay';
  private config: PlatformerInputConfig;
  private state: PlatformerMovementState;
  
  // Input tracking
  private pressedKeys: Set<string> = new Set();
  private frameCounter: number = 0;
  private lastUpdateTime: number = 0;
  
  // Smoothing
  private targetHorizontalMovement: number = 0;
  private smoothedHorizontalMovement: number = 0;

  constructor(config?: Partial<PlatformerInputConfig>) {
    super();
    
    this.config = {
      jumpBufferFrames: 6,
      coyoteTimeFrames: 6,
      variableJumpHeight: true,
      maxJumpHoldTime: 300, // milliseconds
      runSpeedMultiplier: 1.5,
      inputSmoothing: true,
      smoothingFactor: 0.15,
      ...config
    };
    
    this.state = {
      horizontalMovement: 0,
      isJumpPressed: false,
      wasJumpJustPressed: false,
      isRunPressed: false,
      jumpHoldDuration: 0,
      jumpStartTime: 0,
      framesSinceJumpPressed: 0,
      coyoteTime: 0,
      jumpBufferTime: 0
    };
  }

  /**
   * Process raw input event
   */
  public handleInput(event: RawInputEvent): void {
    if (!this.active) return;

    // Set deviceType for compatibility
    if (!event.deviceType) {
      event.deviceType = event.device;
    }

    // Process different input types
    switch (event.deviceType || event.device) {
      case 'keyboard':
        this.handleKeyboardInput(event);
        break;
        
      case 'touch':
        this.handleTouchInput(event);
        break;
        
      case 'mouse':
        this.handleMouseInput(event);
        break;
        
      case 'gamepad':
        this.handleGamepadInput(event);
        break;
    }

    // Map to game actions
    const action = this.getActionFromInput(event);
    if (action) {
      this.emit('action', action, event);
    }
  }

  /**
   * Get horizontal movement input (-1 to 1)
   */
  public getHorizontalMovement(): number {
    return this.config.inputSmoothing ? this.smoothedHorizontalMovement : this.state.horizontalMovement;
  }

  /**
   * Get horizontal input (alias for interface compatibility)
   */
  public getHorizontalInput(): number {
    return this.getHorizontalMovement();
  }

  /**
   * Check if jump action is active
   */
  public isJumpPressed(): boolean {
    return this.state.isJumpPressed;
  }

  /**
   * Check if jump was just pressed this frame
   */
  public wasJumpJustPressed(): boolean {
    return this.state.wasJumpJustPressed;
  }

  /**
   * Check if jump was just pressed (alias for interface compatibility)
   */
  public isJumpJustPressed(): boolean {
    return this.wasJumpJustPressed();
  }

  /**
   * Check if run action is active
   */
  public isRunPressed(): boolean {
    return this.state.isRunPressed;
  }

  /**
   * Get jump hold duration
   */
  public getJumpHoldDuration(): number {
    return this.state.jumpHoldDuration;
  }

  /**
   * Check if jump is buffered (pressed recently but not processed)
   */
  public isJumpBuffered(): boolean {
    return this.state.jumpBufferTime > 0;
  }

  /**
   * Consume jump buffer (call when jump is processed)
   */
  public consumeJumpBuffer(): void {
    this.state.jumpBufferTime = 0;
    this.state.wasJumpJustPressed = false;
  }

  /**
   * Check if in coyote time (recently left ground)
   */
  public isInCoyoteTime(): boolean {
    return this.state.coyoteTime > 0;
  }

  /**
   * Consume coyote time (call when jump is processed)
   */
  public consumeCoyoteTime(): void {
    this.state.coyoteTime = 0;
  }

  /**
   * Notify that player has landed (resets coyote time)
   */
  public onPlayerLanded(): void {
    this.state.coyoteTime = this.config.coyoteTimeFrames;
  }

  /**
   * Notify that player has left ground
   */
  public onPlayerLeftGround(): void {
    // Coyote time starts counting down when leaving ground
    if (this.state.coyoteTime === 0) {
      this.state.coyoteTime = this.config.coyoteTimeFrames;
    }
  }

  /**
   * Set movement smoothing factor
   */
  public setMovementSmoothing(smoothing: number): void {
    this.config.smoothingFactor = smoothing;
  }

  /**
   * Set jump buffering enabled/disabled
   */
  public setJumpBuffering(enabled: boolean): void {
    if (enabled) {
      this.config.jumpBufferFrames = 6; // Default buffer frames
    } else {
      this.config.jumpBufferFrames = 0;
    }
  }

  /**
   * Set coyote time frames
   */
  public setCoyoteTime(time: number): void {
    this.config.coyoteTimeFrames = Math.max(0, time);
  }

  /**
   * Check if player can jump
   */
  public canJump(): boolean {
    return this.isInCoyoteTime() || this.isJumpBuffered();
  }

  /**
   * Check if player is grounded (simplified implementation)
   */
  public isGrounded(): boolean {
    return this.state.coyoteTime > 0;
  }

  /**
   * Set grounded state
   */
  public setGrounded(grounded: boolean): void {
    if (grounded) {
      this.onPlayerLanded();
    } else {
      this.onPlayerLeftGround();
    }
  }

  /**
   * Check if handler is enabled (InputHandler interface)
   */
  public isEnabled(): boolean {
    return this.active;
  }

  /**
   * Set handler enabled state (InputHandler interface)
   */
  public setEnabled(enabled: boolean): void {
    this.active = enabled;
    if (!enabled) {
      this.resetState();
    }
  }

  /**
   * Update handler state
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    this.frameCounter++;
    this.lastUpdateTime = performance.now();

    // Update input states
    this.updateMovementState();
    this.updateJumpState();
    this.updateTimers();
    
    // Apply input smoothing
    if (this.config.inputSmoothing) {
      this.applyInputSmoothing(deltaTime);
    }

    // Reset frame-specific flags
    this.state.wasJumpJustPressed = false;
  }

  /**
   * Check if handler can process this event
   */
  public canHandle(event: RawInputEvent, context: InputContext): boolean {
    return this.active && this.supportedContexts.includes(context);
  }

  /**
   * Activate handler for context
   */
  public activate(context: InputContext): void {
    this.active = true;
    this.context = context;
    this.resetState();
    this.emit('activated', context);
  }

  /**
   * Deactivate handler
   */
  public deactivate(): void {
    this.active = false;
    this.resetState();
    this.emit('deactivated');
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.deactivate();
    this.removeAllListeners();
  }

  /**
   * Configure handler settings
   */
  public configure(config: Partial<PlatformerInputConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle keyboard input
   */
  private handleKeyboardInput(event: RawInputEvent): void {
    if (!event.key) return;

    const key = event.key;
    
    if (event.type === 'key-down') {
      this.pressedKeys.add(key);
      
      // Jump input
      if (this.isJumpKey(key)) {
        this.onJumpPressed();
      }
      
      // Run input
      if (this.isRunKey(key)) {
        this.state.isRunPressed = true;
      }
    } else if (event.type === 'key-up') {
      this.pressedKeys.delete(key);
      
      // Jump input
      if (this.isJumpKey(key)) {
        this.onJumpReleased();
      }
      
      // Run input
      if (this.isRunKey(key)) {
        this.state.isRunPressed = false;
      }
    }
  }

  /**
   * Handle touch input (usually from virtual controls)
   */
  private handleTouchInput(event: RawInputEvent): void {
    // Touch input is typically handled by virtual controls
    // which translate to game actions
  }

  /**
   * Handle mouse input
   */
  private handleMouseInput(event: RawInputEvent): void {
    if (event.type === 'down') {
      if (event.button === 0) { // Left click
        this.onJumpPressed();
      }
    } else if (event.type === 'up') {
      if (event.button === 0) {
        this.onJumpReleased();
      }
    }
  }

  /**
   * Handle gamepad input
   */
  private handleGamepadInput(event: RawInputEvent): void {
    if (event.type === 'gamepad-button-down' || event.type === 'gamepad-button-up') {
      const button = event.gamepadButton;
      
      if (button === 0) { // A button (jump)
        if (event.type === 'gamepad-button-down') {
          this.onJumpPressed();
        } else {
          this.onJumpReleased();
        }
      }
    } else if (event.type === 'gamepad-axis') {
      const axis = event.gamepadAxis;
      
      if (axis === 0) { // Left stick X
        this.targetHorizontalMovement = event.axisValue || 0;
      }
    }
  }

  /**
   * Update movement state based on pressed keys
   */
  private updateMovementState(): void {
    let movement = 0;
    
    // Check for movement keys
    if (this.pressedKeys.has('ArrowLeft') || this.pressedKeys.has('KeyA')) {
      movement -= 1;
    }
    if (this.pressedKeys.has('ArrowRight') || this.pressedKeys.has('KeyD')) {
      movement += 1;
    }
    
    this.targetHorizontalMovement = movement;
    
    if (!this.config.inputSmoothing) {
      this.state.horizontalMovement = movement;
    }
  }

  /**
   * Update jump state
   */
  private updateJumpState(): void {
    // Update jump hold duration
    if (this.state.isJumpPressed && this.state.jumpStartTime > 0) {
      this.state.jumpHoldDuration = this.lastUpdateTime - this.state.jumpStartTime;
      
      // Limit jump hold time
      if (this.config.variableJumpHeight && 
          this.state.jumpHoldDuration > this.config.maxJumpHoldTime) {
        this.state.isJumpPressed = false;
      }
    }
  }

  /**
   * Update frame-based timers
   */
  private updateTimers(): void {
    // Update jump buffer
    if (this.state.jumpBufferTime > 0) {
      this.state.jumpBufferTime--;
    }
    
    // Update coyote time
    if (this.state.coyoteTime > 0) {
      this.state.coyoteTime--;
    }
    
    // Update frames since jump pressed
    if (this.state.framesSinceJumpPressed < 999) {
      this.state.framesSinceJumpPressed++;
    }
  }

  /**
   * Apply input smoothing to movement
   */
  private applyInputSmoothing(deltaTime: number): void {
    const smoothingFactor = this.config.smoothingFactor;
    const frameSmoothing = Math.min(smoothingFactor * (deltaTime / 16.67), 1); // Normalize to 60fps
    
    this.smoothedHorizontalMovement = this.lerp(
      this.smoothedHorizontalMovement,
      this.targetHorizontalMovement,
      frameSmoothing
    );
    
    // Snap to target when very close
    if (Math.abs(this.smoothedHorizontalMovement - this.targetHorizontalMovement) < 0.01) {
      this.smoothedHorizontalMovement = this.targetHorizontalMovement;
    }
    
    this.state.horizontalMovement = this.smoothedHorizontalMovement;
  }

  /**
   * Handle jump pressed
   */
  private onJumpPressed(): void {
    if (!this.state.isJumpPressed) {
      this.state.isJumpPressed = true;
      this.state.wasJumpJustPressed = true;
      this.state.jumpStartTime = this.lastUpdateTime;
      this.state.jumpHoldDuration = 0;
      this.state.framesSinceJumpPressed = 0;
      this.state.jumpBufferTime = this.config.jumpBufferFrames;
      
      this.emit('jump-pressed');
    }
  }

  /**
   * Handle jump released
   */
  private onJumpReleased(): void {
    if (this.state.isJumpPressed) {
      this.state.isJumpPressed = false;
      this.emit('jump-released', this.state.jumpHoldDuration);
    }
  }

  /**
   * Check if key is a jump key
   */
  private isJumpKey(key: string): boolean {
    return ['Space', 'ArrowUp', 'KeyW', 'KeyZ'].includes(key);
  }

  /**
   * Check if key is a run key
   */
  private isRunKey(key: string): boolean {
    return ['ShiftLeft', 'ShiftRight', 'KeyX'].includes(key);
  }

  /**
   * Get action from input event
   */
  private getActionFromInput(event: RawInputEvent): GameAction | null {
    if (event.deviceType === 'keyboard' && event.key) {
      if (this.isJumpKey(event.key) && event.type === 'key-down') {
        return 'jump';
      }
      if (['ArrowLeft', 'KeyA'].includes(event.key)) {
        return 'move-left';
      }
      if (['ArrowRight', 'KeyD'].includes(event.key)) {
        return 'move-right';
      }
    }
    
    return null;
  }

  /**
   * Reset handler state
   */
  private resetState(): void {
    this.state = {
      horizontalMovement: 0,
      isJumpPressed: false,
      wasJumpJustPressed: false,
      isRunPressed: false,
      jumpHoldDuration: 0,
      jumpStartTime: 0,
      framesSinceJumpPressed: 0,
      coyoteTime: 0,
      jumpBufferTime: 0
    };
    
    this.pressedKeys.clear();
    this.targetHorizontalMovement = 0;
    this.smoothedHorizontalMovement = 0;
  }

  /**
   * Linear interpolation utility
   */
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }
}