import { EventEmitter } from 'eventemitter3';
import {
  PlayerMovementHandler,
  RawInputEvent,
  InputContext,
  GameAction,
  InputHandler
} from '../../contracts/Input';
import { Point } from '../../contracts/UI';

/**
 * Player movement configuration
 */
interface PlayerMovementConfig {
  movementType: '2d' | '2.5d' | '3d';
  inputSmoothing: boolean;
  smoothingFactor: number;
  deadZone: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  analogMovement: boolean;
  eightDirectional: boolean; // For top-down games
  normalizeMovement: boolean; // Normalize diagonal movement
}

/**
 * Player movement state
 */
interface PlayerMovementState {
  movementVector: Point;
  targetVector: Point;
  currentSpeed: number;
  speedMultiplier: number;
  isMoving: boolean;
  movementDirection: number; // In radians
  lastInputTime: number;
}

/**
 * Specialized input handler for player movement
 * Supports various movement types and input methods
 */
export class GameBytePlayerMovementHandler extends EventEmitter implements PlayerMovementHandler, InputHandler {
  public readonly name: string = 'player-movement';
  public readonly priority: number = 85;
  public readonly supportedContexts: InputContext[] = ['gameplay'];

  private active: boolean = false;
  private context: InputContext = 'gameplay';
  private config: PlayerMovementConfig;
  private state: PlayerMovementState;
  
  // Input tracking
  private pressedKeys: Set<string> = new Set();
  private gamepadLeftStick: Point = { x: 0, y: 0 };
  private touchMovement: Point = { x: 0, y: 0 };
  
  // Movement calculation
  private rawMovementInput: Point = { x: 0, y: 0 };

  constructor(config?: Partial<PlayerMovementConfig>) {
    super();
    
    this.config = {
      movementType: '2d',
      inputSmoothing: true,
      smoothingFactor: 0.12,
      deadZone: 0.1,
      maxSpeed: 1.0,
      acceleration: 0.15,
      deceleration: 0.2,
      analogMovement: true,
      eightDirectional: false,
      normalizeMovement: true,
      ...config
    };
    
    this.state = {
      movementVector: { x: 0, y: 0 },
      targetVector: { x: 0, y: 0 },
      currentSpeed: 0,
      speedMultiplier: 1.0,
      isMoving: false,
      movementDirection: 0,
      lastInputTime: 0
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
        
      case 'gamepad':
        this.handleGamepadInput(event);
        break;
    }

    // Update raw movement input
    this.updateRawMovementInput();

    // Map to game actions
    const action = this.getActionFromInput(event);
    if (action) {
      this.emit('action', action, event);
    }
  }

  /**
   * Get movement vector
   */
  public getMovementVector(): Point {
    return { ...this.state.movementVector };
  }

  /**
   * Get movement vector in 3D space
   */
  public getMovementVector3D(): { x: number; y: number; z: number } {
    return {
      x: this.state.movementVector.x,
      y: this.state.movementVector.y,
      z: 0 // Default Z for 2D movement
    };
  }

  /**
   * Get movement speed multiplier
   */
  public getSpeedMultiplier(): number {
    return this.state.speedMultiplier;
  }

  /**
   * Check if player is trying to move
   */
  public isMoving(): boolean {
    return this.state.isMoving;
  }

  /**
   * Get movement direction in radians
   */
  public getMovementDirection(): number {
    return this.state.movementDirection;
  }

  /**
   * Set speed multiplier (for running, walking, etc.)
   */
  public setSpeedMultiplier(multiplier: number): void {
    this.state.speedMultiplier = Math.max(0, multiplier);
  }

  /**
   * Set analog mode enabled/disabled
   */
  public setAnalogMode(enabled: boolean): void {
    this.config.analogMovement = enabled;
  }

  /**
   * Check if analog mode is enabled
   */
  public isAnalogMode(): boolean {
    return this.config.analogMovement;
  }

  /**
   * Set dead zone for analog inputs
   */
  public setDeadZone(deadZone: number): void {
    this.config.deadZone = Math.max(0, Math.min(1, deadZone));
  }

  /**
   * Set movement smoothing factor
   */
  public setMovementSmoothing(smoothing: number): void {
    this.config.smoothingFactor = Math.max(0, Math.min(1, smoothing));
  }

  /**
   * Set movement sensitivity
   */
  public setSensitivity(sensitivity: number): void {
    this.config.maxSpeed = Math.max(0, sensitivity);
  }

  /**
   * Get movement speed
   */
  public getMovementSpeed(): number {
    return this.state.currentSpeed;
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

    // Calculate target movement vector
    this.calculateTargetMovement();
    
    // Apply smoothing and acceleration
    this.applyMovementSmoothing(deltaTime);
    
    // Update movement state
    this.updateMovementState();
    
    // Emit movement events
    this.emitMovementEvents();
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
  public configure(config: Partial<PlayerMovementConfig>): void {
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
    } else if (event.type === 'key-up') {
      this.pressedKeys.delete(key);
    }
    
    this.state.lastInputTime = performance.now();
  }

  /**
   * Handle touch input (from virtual controls)
   */
  private handleTouchInput(event: RawInputEvent): void {
    // Touch movement would typically come from virtual joystick
    // This would be handled through the virtual controls manager
    // For now, we'll just update the timestamp
    this.state.lastInputTime = performance.now();
  }

  /**
   * Handle gamepad input
   */
  private handleGamepadInput(event: RawInputEvent): void {
    if (event.type === 'gamepad-axis' && event.gamepadAxis !== undefined && event.axisValue !== undefined) {
      const axis = event.gamepadAxis;
      const value = event.axisValue;
      
      if (axis === 0) { // Left stick X
        this.gamepadLeftStick.x = Math.abs(value) > this.config.deadZone ? value : 0;
      } else if (axis === 1) { // Left stick Y
        this.gamepadLeftStick.y = Math.abs(value) > this.config.deadZone ? value : 0;
      }
      
      this.state.lastInputTime = performance.now();
    }
  }

  /**
   * Update raw movement input from all sources
   */
  private updateRawMovementInput(): void {
    let x = 0;
    let y = 0;
    
    // Keyboard input
    if (this.pressedKeys.has('ArrowLeft') || this.pressedKeys.has('KeyA')) {
      x -= 1;
    }
    if (this.pressedKeys.has('ArrowRight') || this.pressedKeys.has('KeyD')) {
      x += 1;
    }
    if (this.pressedKeys.has('ArrowUp') || this.pressedKeys.has('KeyW')) {
      y -= 1;
    }
    if (this.pressedKeys.has('ArrowDown') || this.pressedKeys.has('KeyS')) {
      y += 1;
    }
    
    // Gamepad input
    if (Math.abs(this.gamepadLeftStick.x) > Math.abs(x)) {
      x = this.gamepadLeftStick.x;
    }
    if (Math.abs(this.gamepadLeftStick.y) > Math.abs(y)) {
      y = this.gamepadLeftStick.y;
    }
    
    // Touch input (would be set by virtual controls)
    if (Math.abs(this.touchMovement.x) > Math.abs(x)) {
      x = this.touchMovement.x;
    }
    if (Math.abs(this.touchMovement.y) > Math.abs(y)) {
      y = this.touchMovement.y;
    }
    
    this.rawMovementInput = { x, y };
  }

  /**
   * Calculate target movement vector
   */
  private calculateTargetMovement(): void {
    let { x, y } = this.rawMovementInput;
    
    // Apply dead zone
    if (Math.abs(x) < this.config.deadZone) x = 0;
    if (Math.abs(y) < this.config.deadZone) y = 0;
    
    // Handle different movement types
    if (this.config.eightDirectional) {
      // Snap to 8 directions for top-down games
      x = x > 0.5 ? 1 : x < -0.5 ? -1 : 0;
      y = y > 0.5 ? 1 : y < -0.5 ? -1 : 0;
    } else if (!this.config.analogMovement) {
      // Digital movement (on/off)
      x = x > 0 ? 1 : x < 0 ? -1 : 0;
      y = y > 0 ? 1 : y < 0 ? -1 : 0;
    }
    
    // Normalize diagonal movement if enabled
    if (this.config.normalizeMovement && x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      if (length > 1) {
        x /= length;
        y /= length;
      }
    }
    
    // Apply movement type constraints
    switch (this.config.movementType) {
      case '2d':
        // 2D movement - no constraints
        break;
        
      case '2.5d':
        // 2.5D movement - might want to adjust Y movement
        break;
        
      case '3d':
        // 3D movement - full freedom
        break;
    }
    
    this.state.targetVector = { x, y };
  }

  /**
   * Apply movement smoothing and acceleration
   */
  private applyMovementSmoothing(deltaTime: number): void {
    const target = this.state.targetVector;
    const current = this.state.movementVector;
    
    if (this.config.inputSmoothing) {
      // Smooth interpolation
      const smoothingFactor = this.config.smoothingFactor;
      const frameSmoothing = Math.min(smoothingFactor * (deltaTime / 16.67), 1);
      
      this.state.movementVector.x = this.lerp(current.x, target.x, frameSmoothing);
      this.state.movementVector.y = this.lerp(current.y, target.y, frameSmoothing);
      
      // Snap to target when very close
      if (Math.abs(this.state.movementVector.x - target.x) < 0.01) {
        this.state.movementVector.x = target.x;
      }
      if (Math.abs(this.state.movementVector.y - target.y) < 0.01) {
        this.state.movementVector.y = target.y;
      }
    } else {
      // Direct assignment
      this.state.movementVector = { ...target };
    }
    
    // Apply acceleration/deceleration
    const targetSpeed = Math.sqrt(target.x * target.x + target.y * target.y);
    
    if (targetSpeed > 0) {
      // Accelerating
      this.state.currentSpeed = Math.min(
        this.state.currentSpeed + this.config.acceleration * (deltaTime / 16.67),
        targetSpeed * this.config.maxSpeed
      );
    } else {
      // Decelerating
      this.state.currentSpeed = Math.max(
        this.state.currentSpeed - this.config.deceleration * (deltaTime / 16.67),
        0
      );
    }
    
    // Apply speed to movement vector
    const movementLength = Math.sqrt(
      this.state.movementVector.x * this.state.movementVector.x + 
      this.state.movementVector.y * this.state.movementVector.y
    );
    
    if (movementLength > 0) {
      const speedRatio = this.state.currentSpeed / movementLength;
      this.state.movementVector.x *= speedRatio;
      this.state.movementVector.y *= speedRatio;
    }
    
    // Apply speed multiplier
    this.state.movementVector.x *= this.state.speedMultiplier;
    this.state.movementVector.y *= this.state.speedMultiplier;
  }

  /**
   * Update movement state
   */
  private updateMovementState(): void {
    const vector = this.state.movementVector;
    
    // Update isMoving
    this.state.isMoving = Math.abs(vector.x) > 0.01 || Math.abs(vector.y) > 0.01;
    
    // Update movement direction
    if (this.state.isMoving) {
      this.state.movementDirection = Math.atan2(vector.y, vector.x);
    }
  }

  /**
   * Emit movement events
   */
  private emitMovementEvents(): void {
    if (this.state.isMoving) {
      this.emit('player-move', {
        vector: this.state.movementVector,
        speed: this.state.currentSpeed,
        direction: this.state.movementDirection,
        multiplier: this.state.speedMultiplier
      });
    } else {
      this.emit('player-stop');
    }
  }

  /**
   * Set touch movement input (called by virtual controls)
   */
  public setTouchMovement(movement: Point): void {
    this.touchMovement = { ...movement };
    this.state.lastInputTime = performance.now();
  }

  /**
   * Get action from input event
   */
  private getActionFromInput(event: RawInputEvent): GameAction | null {
    if (event.deviceType === 'keyboard' && event.key && event.type === 'key-down') {
      if (['ArrowLeft', 'KeyA'].includes(event.key)) {
        return 'move-left';
      }
      if (['ArrowRight', 'KeyD'].includes(event.key)) {
        return 'move-right';
      }
      if (['ArrowUp', 'KeyW'].includes(event.key)) {
        return 'move-up';
      }
      if (['ArrowDown', 'KeyS'].includes(event.key)) {
        return 'move-down';
      }
    }
    
    return null;
  }

  /**
   * Reset handler state
   */
  private resetState(): void {
    this.state = {
      movementVector: { x: 0, y: 0 },
      targetVector: { x: 0, y: 0 },
      currentSpeed: 0,
      speedMultiplier: 1.0,
      isMoving: false,
      movementDirection: 0,
      lastInputTime: 0
    };
    
    this.pressedKeys.clear();
    this.gamepadLeftStick = { x: 0, y: 0 };
    this.touchMovement = { x: 0, y: 0 };
    this.rawMovementInput = { x: 0, y: 0 };
  }

  /**
   * Linear interpolation utility
   */
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }
}