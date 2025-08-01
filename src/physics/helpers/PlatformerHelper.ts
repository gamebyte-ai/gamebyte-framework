import { EventEmitter } from 'eventemitter3';
import {
  PlatformerPhysicsHelper,
  PhysicsBody,
  PhysicsWorld,
  Point,
  Vector3,
  RaycastOptions,
  RaycastResult
} from '../../contracts/Physics';

/**
 * Platformer-specific physics helper with ground detection, jumping, and wall sliding
 */
export class GameBytePlatformerHelper extends EventEmitter implements PlatformerPhysicsHelper {
  public readonly character: PhysicsBody;
  public readonly isGrounded: boolean = false;
  public readonly isOnWall: boolean = false;
  public readonly canJump: boolean = true;
  public readonly canWallJump: boolean = false;

  private world: PhysicsWorld;
  private horizontalInput = 0;
  private groundRayLength = 0.1;
  private groundRayOffset = 0;
  private groundMask = 0xFFFFFFFF;
  private wallRayLength = 0.1;
  private wallRayOffset = 0;
  private wallMask = 0xFFFFFFFF;
  
  // Movement settings
  private maxSpeed = 5;
  private acceleration = 20;
  private deceleration = 15;
  private airAcceleration = 10;
  private jumpForce = 8;
  private wallJumpForce = 6;
  private coyoteTime = 0.1;
  private jumpBufferTime = 0.1;
  
  // State tracking
  private groundNormal: Point = { x: 0, y: 1 };
  private wallNormal: Point = { x: 1, y: 0 };
  private lastGroundedTime = 0;
  private jumpBufferTimer = 0;
  private wallSlideSpeed = 2;
  
  // Features
  private doubleJumpEnabled = false;
  private wallSlidingEnabled = true;
  private coyoteTimeEnabled = true;
  private jumpBufferingEnabled = true;
  private hasDoubleJumped = false;

  constructor(character: PhysicsBody, world: PhysicsWorld) {
    super();
    this.character = character;
    this.world = world;
    
    // Set up default ground detection
    this.setGroundDetection({
      rayLength: 0.1,
      rayOffset: 0,
      groundMask: 0xFFFFFFFF
    });
    
    // Set up default wall detection
    this.setWallDetection({
      rayLength: 0.1,
      rayOffset: 0,
      wallMask: 0xFFFFFFFF
    });
  }

  /**
   * Set horizontal input (-1 to 1)
   */
  setHorizontalInput(input: number): void {
    this.horizontalInput = Math.max(-1, Math.min(1, input));
    this.emit('horizontal-input-changed', this.horizontalInput);
  }

  /**
   * Attempt to jump
   */
  jump(force?: number): boolean {
    const jumpForce = force || this.jumpForce;
    
    // Check if can jump
    if (this.canJump && (this.isGrounded || this.isWithinCoyoteTime())) {
      this.performJump(jumpForce);
      this.hasDoubleJumped = false;
      return true;
    }
    
    // Double jump
    if (this.doubleJumpEnabled && !this.hasDoubleJumped && !this.isGrounded) {
      this.performJump(jumpForce * 0.8); // Slightly weaker double jump
      this.hasDoubleJumped = true;
      return true;
    }
    
    // Jump buffering
    if (this.jumpBufferingEnabled && !this.isGrounded) {
      this.jumpBufferTimer = this.jumpBufferTime;
    }
    
    return false;
  }

  /**
   * Attempt to wall jump
   */
  wallJump(direction: number, force?: number): boolean {
    if (!this.canWallJump || !this.isOnWall) {
      return false;
    }
    
    const jumpForce = force || this.wallJumpForce;
    const wallJumpDirection = Math.sign(direction);
    
    // Apply wall jump force
    const horizontalForce = wallJumpDirection * jumpForce * 0.8;
    const verticalForce = jumpForce;
    
    if (this.world.dimension === '2d') {
      this.character.velocity = {
        x: horizontalForce,
        y: verticalForce
      };
    } else {
      this.character.velocity = {
        x: horizontalForce,
        y: verticalForce,
        z: 0
      };
    }
    
    this.emit('wall-jump', { direction: wallJumpDirection, force: jumpForce });
    return true;
  }

  /**
   * Perform a dash move
   */
  dash(direction: Point, force: number): void {
    const normalizedDir = this.normalizeVector(direction);
    
    if (this.world.dimension === '2d') {
      this.character.applyImpulse({
        x: normalizedDir.x * force,
        y: normalizedDir.y * force
      });
    } else {
      this.character.applyImpulse({
        x: normalizedDir.x * force,
        y: normalizedDir.y * force,
        z: 0
      });
    }
    
    this.emit('dash', { direction: normalizedDir, force });
  }

  /**
   * Configure ground detection
   */
  setGroundDetection(config: {
    rayLength: number;
    rayOffset: number;
    groundMask: number;
  }): void {
    this.groundRayLength = config.rayLength;
    this.groundRayOffset = config.rayOffset;
    this.groundMask = config.groundMask;
    this.emit('ground-detection-changed', config);
  }

  /**
   * Configure wall detection
   */
  setWallDetection(config: {
    rayLength: number;
    rayOffset: number;
    wallMask: number;
  }): void {
    this.wallRayLength = config.rayLength;
    this.wallRayOffset = config.rayOffset;
    this.wallMask = config.wallMask;
    this.emit('wall-detection-changed', config);
  }

  /**
   * Configure movement settings
   */
  setMovementSettings(config: {
    maxSpeed: number;
    acceleration: number;
    deceleration: number;
    airAcceleration: number;
    jumpForce: number;
    wallJumpForce: number;
    coyoteTime: number;
    jumpBufferTime: number;
  }): void {
    this.maxSpeed = config.maxSpeed;
    this.acceleration = config.acceleration;
    this.deceleration = config.deceleration;
    this.airAcceleration = config.airAcceleration;
    this.jumpForce = config.jumpForce;
    this.wallJumpForce = config.wallJumpForce;
    this.coyoteTime = config.coyoteTime;
    this.jumpBufferTime = config.jumpBufferTime;
    this.emit('movement-settings-changed', config);
  }

  /**
   * Get ground normal vector
   */
  getGroundNormal(): Point {
    return { ...this.groundNormal };
  }

  /**
   * Get wall normal vector
   */
  getWallNormal(): Point {
    return { ...this.wallNormal };
  }

  /**
   * Get current movement state
   */
  getMovementState(): 'idle' | 'walking' | 'running' | 'jumping' | 'falling' | 'wall-sliding' {
    const velocity = this.character.velocity;
    const horizontalSpeed = Math.abs(velocity.x);
    const verticalSpeed = velocity.y;
    
    if (this.isOnWall && this.wallSlidingEnabled && verticalSpeed < 0) {
      return 'wall-sliding';
    }
    
    if (!this.isGrounded) {
      return verticalSpeed > 0 ? 'jumping' : 'falling';
    }
    
    if (horizontalSpeed < 0.1) {
      return 'idle';
    }
    
    return horizontalSpeed > this.maxSpeed * 0.8 ? 'running' : 'walking';
  }

  /**
   * Update platformer physics (call every frame)
   */
  update(deltaTime: number): void {
    // Update state
    this.updateGroundedState();
    this.updateWallState();
    
    // Handle movement
    this.handleMovement(deltaTime);
    
    // Handle wall sliding
    if (this.wallSlidingEnabled && this.isOnWall && !this.isGrounded) {
      this.handleWallSliding();
    }
    
    // Update timers
    if (!this.isGrounded) {
      this.lastGroundedTime += deltaTime;
    } else {
      this.lastGroundedTime = 0;
      this.hasDoubleJumped = false;
      
      // Check jump buffer
      if (this.jumpBufferTimer > 0 && this.jumpBufferingEnabled) {
        this.jump();
        this.jumpBufferTimer = 0;
      }
    }
    
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= deltaTime;
    }
    
    this.emit('update', deltaTime);
  }

  /**
   * Check if character is grounded
   */
  checkGrounded(): boolean {
    return this.performGroundRaycast();
  }

  /**
   * Check if character is touching a wall
   */
  checkWallContact(): boolean {
    return this.performWallRaycast();
  }

  /**
   * Enable/disable double jump
   */
  enableDoubleJump(enabled: boolean): void {
    this.doubleJumpEnabled = enabled;
    this.emit('double-jump-changed', enabled);
  }

  /**
   * Enable/disable wall sliding
   */
  enableWallSliding(enabled: boolean): void {
    this.wallSlidingEnabled = enabled;
    this.emit('wall-sliding-changed', enabled);
  }

  /**
   * Enable/disable coyote time
   */
  enableCoyoteTime(enabled: boolean): void {
    this.coyoteTimeEnabled = enabled;
    this.emit('coyote-time-changed', enabled);
  }

  /**
   * Enable/disable jump buffering
   */
  enableJumpBuffering(enabled: boolean): void {
    this.jumpBufferingEnabled = enabled;
    this.emit('jump-buffering-changed', enabled);
  }

  /**
   * Update grounded state using raycast
   */
  private updateGroundedState(): void {
    const wasGrounded = this.isGrounded;
    (this as any).isGrounded = this.performGroundRaycast();
    
    if (wasGrounded !== this.isGrounded) {
      this.emit('grounded-changed', this.isGrounded);
      if (this.isGrounded) {
        this.emit('landed');
      } else {
        this.emit('left-ground');
      }
    }
  }

  /**
   * Update wall contact state using raycast
   */
  private updateWallState(): void {
    const wasOnWall = this.isOnWall;
    (this as any).isOnWall = this.performWallRaycast();
    (this as any).canWallJump = this.isOnWall && !this.isGrounded;
    
    if (wasOnWall !== this.isOnWall) {
      this.emit('wall-contact-changed', this.isOnWall);
    }
  }

  /**
   * Handle horizontal movement
   */
  private handleMovement(deltaTime: number): void {
    if (Math.abs(this.horizontalInput) < 0.01) {
      // Decelerate when no input
      this.applyDeceleration(deltaTime);
    } else {
      // Accelerate towards target speed
      this.applyAcceleration(deltaTime);
    }
  }

  /**
   * Apply acceleration based on input
   */
  private applyAcceleration(deltaTime: number): void {
    const targetSpeed = this.horizontalInput * this.maxSpeed;
    const currentSpeed = this.character.velocity.x;
    const acceleration = this.isGrounded ? this.acceleration : this.airAcceleration;
    
    const speedDiff = targetSpeed - currentSpeed;
    const accelerationAmount = Math.sign(speedDiff) * acceleration * deltaTime;
    
    let newSpeed = currentSpeed + accelerationAmount;
    
    // Clamp to target speed
    if (Math.sign(speedDiff) !== Math.sign(targetSpeed - newSpeed)) {
      newSpeed = targetSpeed;
    }
    
    // Update velocity
    if (this.world.dimension === '2d') {
      this.character.velocity = {
        x: newSpeed,
        y: this.character.velocity.y
      };
    } else {
      this.character.velocity = {
        x: newSpeed,
        y: this.character.velocity.y,
        z: (this.character.velocity as Vector3).z
      };
    }
  }

  /**
   * Apply deceleration when no input
   */
  private applyDeceleration(deltaTime: number): void {
    const currentSpeed = this.character.velocity.x;
    const deceleration = this.isGrounded ? this.deceleration : this.deceleration * 0.5;
    
    const decelerationAmount = Math.sign(currentSpeed) * deceleration * deltaTime;
    let newSpeed = currentSpeed - decelerationAmount;
    
    // Stop if we would overshoot
    if (Math.sign(currentSpeed) !== Math.sign(newSpeed)) {
      newSpeed = 0;
    }
    
    // Update velocity
    if (this.world.dimension === '2d') {
      this.character.velocity = {
        x: newSpeed,
        y: this.character.velocity.y
      };
    } else {
      this.character.velocity = {
        x: newSpeed,
        y: this.character.velocity.y,
        z: (this.character.velocity as Vector3).z
      };
    }
  }

  /**
   * Handle wall sliding physics
   */
  private handleWallSliding(): void {
    const velocity = this.character.velocity;
    
    if (velocity.y < -this.wallSlideSpeed) {
      // Limit falling speed when wall sliding
      if (this.world.dimension === '2d') {
        this.character.velocity = {
          x: velocity.x,
          y: -this.wallSlideSpeed
        };
      } else {
        this.character.velocity = {
          x: velocity.x,
          y: -this.wallSlideSpeed,
          z: (velocity as Vector3).z
        };
      }
    }
  }

  /**
   * Perform the actual jump
   */
  private performJump(force: number): void {
    if (this.world.dimension === '2d') {
      this.character.velocity = {
        x: this.character.velocity.x,
        y: force
      };
    } else {
      this.character.velocity = {
        x: this.character.velocity.x,
        y: force,
        z: (this.character.velocity as Vector3).z
      };
    }
    
    this.emit('jump', { force });
  }

  /**
   * Check if within coyote time
   */
  private isWithinCoyoteTime(): boolean {
    return this.coyoteTimeEnabled && this.lastGroundedTime <= this.coyoteTime;
  }

  /**
   * Perform ground detection raycast
   */
  private performGroundRaycast(): boolean {
    const position = this.character.position;
    const bounds = this.character.bounds;
    
    const rayStart = this.world.dimension === '2d'
      ? { x: position.x + this.groundRayOffset, y: bounds.min.y }
      : { x: position.x + this.groundRayOffset, y: bounds.min.y, z: (position as Vector3).z };
    
    const rayEnd = this.world.dimension === '2d'
      ? { x: rayStart.x, y: rayStart.y - this.groundRayLength }
      : { x: rayStart.x, y: rayStart.y - this.groundRayLength, z: (rayStart as Vector3).z };
    
    const raycastOptions: RaycastOptions = {
      from: rayStart,
      to: rayEnd,
      collisionMask: this.groundMask
    };
    
    const results = this.world.raycast(raycastOptions);
    
    if (results.length > 0 && results[0].normal) {
      this.groundNormal = results[0].normal as Point;
      return true;
    }
    
    return false;
  }

  /**
   * Perform wall detection raycast
   */
  private performWallRaycast(): boolean {
    const position = this.character.position;
    const bounds = this.character.bounds;
    
    // Check both sides
    const leftRayStart = this.world.dimension === '2d'
      ? { x: bounds.min.x, y: position.y + this.wallRayOffset }
      : { x: bounds.min.x, y: position.y + this.wallRayOffset, z: (position as Vector3).z };
    
    const leftRayEnd = this.world.dimension === '2d'
      ? { x: leftRayStart.x - this.wallRayLength, y: leftRayStart.y }
      : { x: leftRayStart.x - this.wallRayLength, y: leftRayStart.y, z: (leftRayStart as Vector3).z };
    
    const rightRayStart = this.world.dimension === '2d'
      ? { x: bounds.max.x, y: position.y + this.wallRayOffset }
      : { x: bounds.max.x, y: position.y + this.wallRayOffset, z: (position as Vector3).z };
    
    const rightRayEnd = this.world.dimension === '2d'
      ? { x: rightRayStart.x + this.wallRayLength, y: rightRayStart.y }
      : { x: rightRayStart.x + this.wallRayLength, y: rightRayStart.y, z: (rightRayStart as Vector3).z };
    
    // Check left wall
    const leftResults = this.world.raycast({
      from: leftRayStart,
      to: leftRayEnd,
      collisionMask: this.wallMask
    });
    
    // Check right wall
    const rightResults = this.world.raycast({
      from: rightRayStart,
      to: rightRayEnd,
      collisionMask: this.wallMask
    });
    
    if (leftResults.length > 0 && leftResults[0].normal) {
      this.wallNormal = leftResults[0].normal as Point;
      return true;
    }
    
    if (rightResults.length > 0 && rightResults[0].normal) {
      this.wallNormal = rightResults[0].normal as Point;
      return true;
    }
    
    return false;
  }

  /**
   * Normalize a 2D vector
   */
  private normalizeVector(vector: Point): Point {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: vector.x / length,
      y: vector.y / length
    };
  }
}