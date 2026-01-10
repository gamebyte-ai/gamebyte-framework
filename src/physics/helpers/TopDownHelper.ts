import { EventEmitter } from 'eventemitter3';
import {
  TopDownPhysicsHelper,
  PhysicsBody,
  PhysicsWorld,
  Point,
  Vector3
} from '../../contracts/Physics';

/**
 * Top-down game physics helper for movement, collision, and triggers
 */
export class GameByteTopDownHelper extends EventEmitter implements TopDownPhysicsHelper {
  public readonly character: PhysicsBody;

  // Private backing fields for mutable state properties
  private _isMoving: boolean = false;
  private _currentSpeed: number = 0;

  private world: PhysicsWorld;
  private movementInput: Point = { x: 0, y: 0 };
  
  // Movement settings
  private maxSpeed = 5;
  private acceleration = 15;
  private deceleration = 10;
  private rotationSpeed = 5;
  private dragCoefficient = 0.98;
  
  // Features
  private rotationEnabled = false;
  private momentumEnabled = true;
  private targetRotation = 0;
  
  // State tracking
  private velocity: Point = { x: 0, y: 0 };
  private lastMovementDirection: Point = { x: 0, y: 1 };

  // Public getters for readonly access
  get isMoving(): boolean {
    return this._isMoving;
  }

  get currentSpeed(): number {
    return this._currentSpeed;
  }

  constructor(character: PhysicsBody, world: PhysicsWorld) {
    super();
    this.character = character;
    this.world = world;
  }

  /**
   * Set movement input (normalized -1 to 1 for each axis)
   */
  setMovementInput(input: Point): void {
    this.movementInput = {
      x: Math.max(-1, Math.min(1, input.x)),
      y: Math.max(-1, Math.min(1, input.y))
    };
    
    // Update target rotation if rotation is enabled
    if (this.rotationEnabled && (Math.abs(input.x) > 0.1 || Math.abs(input.y) > 0.1)) {
      this.targetRotation = Math.atan2(input.x, input.y);
      this.lastMovementDirection = this.normalizeVector(input);
    }
    
    this.emit('movement-input-changed', this.movementInput);
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
        y: 0,
        z: normalizedDir.y * force // Y becomes Z in 3D top-down
      });
    }
    
    this.emit('dash', { direction: normalizedDir, force });
  }

  /**
   * Apply braking force
   */
  brake(force?: number): void {
    const brakeForce = force || this.deceleration * 2;
    const velocity = this.character.velocity;
    
    if (this.world.dimension === '2d') {
      const vel = velocity as Point;
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      
      if (speed > 0.1) {
        const brakeDirection = {
          x: -vel.x / speed,
          y: -vel.y / speed
        };
        
        this.character.applyForce({
          x: brakeDirection.x * brakeForce,
          y: brakeDirection.y * brakeForce
        });
      }
    } else {
      const vel = velocity as Vector3;
      const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      
      if (speed > 0.1) {
        const brakeDirection = {
          x: -vel.x / speed,
          y: 0,
          z: -vel.z / speed
        };
        
        this.character.applyForce(brakeDirection);
      }
    }
    
    this.emit('brake', { force: brakeForce });
  }

  /**
   * Configure movement settings
   */
  setMovementSettings(config: {
    maxSpeed: number;
    acceleration: number;
    deceleration: number;
    rotationSpeed: number;
    dragCoefficient: number;
  }): void {
    this.maxSpeed = config.maxSpeed;
    this.acceleration = config.acceleration;
    this.deceleration = config.deceleration;
    this.rotationSpeed = config.rotationSpeed;
    this.dragCoefficient = Math.max(0, Math.min(1, config.dragCoefficient));
    this.emit('movement-settings-changed', config);
  }

  /**
   * Get current movement direction
   */
  getMovementDirection(): Point {
    return { ...this.lastMovementDirection };
  }

  /**
   * Get current movement speed
   */
  getMovementSpeed(): number {
    const velocity = this.character.velocity;
    
    if (this.world.dimension === '2d') {
      const vel = velocity as Point;
      return Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    } else {
      const vel = velocity as Vector3;
      return Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    }
  }

  /**
   * Update top-down physics (call every frame)
   */
  update(deltaTime: number): void {
    // Handle movement
    this.handleMovement(deltaTime);
    
    // Handle rotation
    if (this.rotationEnabled) {
      this.handleRotation(deltaTime);
    }
    
    // Apply drag if momentum is disabled
    if (!this.momentumEnabled) {
      this.applyDrag();
    }
    
    // Update state
    this.updateMovementState();
    
    this.emit('update', deltaTime);
  }

  /**
   * Enable/disable rotation towards movement direction
   */
  enableRotation(enabled: boolean): void {
    this.rotationEnabled = enabled;
    this.emit('rotation-changed', enabled);
  }

  /**
   * Enable/disable momentum (physics-based movement)
   */
  enableMomentum(enabled: boolean): void {
    this.momentumEnabled = enabled;
    this.emit('momentum-changed', enabled);
  }

  /**
   * Handle movement input and physics
   */
  private handleMovement(deltaTime: number): void {
    const hasInput = Math.abs(this.movementInput.x) > 0.01 || Math.abs(this.movementInput.y) > 0.01;
    
    if (hasInput) {
      // Apply acceleration towards input direction
      this.applyAcceleration(deltaTime);
    } else {
      // Apply deceleration when no input
      this.applyDeceleration(deltaTime);
    }
  }

  /**
   * Apply acceleration based on input
   */
  private applyAcceleration(deltaTime: number): void {
    const targetVelocity = {
      x: this.movementInput.x * this.maxSpeed,
      y: this.movementInput.y * this.maxSpeed
    };
    
    const currentVelocity = this.world.dimension === '2d' 
      ? this.character.velocity as Point
      : { x: (this.character.velocity as Vector3).x, y: (this.character.velocity as Vector3).z };
    
    const velocityDiff = {
      x: targetVelocity.x - currentVelocity.x,
      y: targetVelocity.y - currentVelocity.y
    };
    
    const accelerationForce = {
      x: velocityDiff.x * this.acceleration,
      y: velocityDiff.y * this.acceleration
    };
    
    if (this.world.dimension === '2d') {
      this.character.applyForce(accelerationForce);
    } else {
      this.character.applyForce({
        x: accelerationForce.x,
        y: 0,
        z: accelerationForce.y
      });
    }
  }

  /**
   * Apply deceleration when no input
   */
  private applyDeceleration(deltaTime: number): void {
    const velocity = this.world.dimension === '2d'
      ? this.character.velocity as Point
      : { x: (this.character.velocity as Vector3).x, y: (this.character.velocity as Vector3).z };
    
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    if (speed > 0.1) {
      const decelerationForce = {
        x: -(velocity.x / speed) * this.deceleration,
        y: -(velocity.y / speed) * this.deceleration
      };
      
      if (this.world.dimension === '2d') {
        this.character.applyForce(decelerationForce);
      } else {
        this.character.applyForce({
          x: decelerationForce.x,
          y: 0,
          z: decelerationForce.y
        });
      }
    }
  }

  /**
   * Handle character rotation towards movement direction
   */
  private handleRotation(deltaTime: number): void {
    let currentRotation: number;
    
    if (this.world.dimension === '2d') {
      currentRotation = this.character.rotation as number;
    } else {
      // Extract Y rotation from quaternion for 3D
      const quat = this.character.rotation as any;
      currentRotation = Math.atan2(2 * (quat.w * quat.y + quat.x * quat.z), 1 - 2 * (quat.y * quat.y + quat.z * quat.z));
    }
    
    // Calculate rotation difference
    let rotationDiff = this.targetRotation - currentRotation;
    
    // Normalize rotation difference to [-π, π]
    while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
    while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
    
    // Apply rotation
    if (Math.abs(rotationDiff) > 0.01) {
      const rotationAmount = Math.sign(rotationDiff) * this.rotationSpeed * deltaTime;
      
      // Clamp to target
      if (Math.abs(rotationAmount) > Math.abs(rotationDiff)) {
        this.character.rotation = this.targetRotation;
      } else {
        this.character.rotation = currentRotation + rotationAmount;
      }
    }
  }

  /**
   * Apply drag to reduce velocity
   */
  private applyDrag(): void {
    const velocity = this.character.velocity;
    
    if (this.world.dimension === '2d') {
      const vel = velocity as Point;
      this.character.velocity = {
        x: vel.x * this.dragCoefficient,
        y: vel.y * this.dragCoefficient
      };
    } else {
      const vel = velocity as Vector3;
      this.character.velocity = {
        x: vel.x * this.dragCoefficient,
        y: vel.y,
        z: vel.z * this.dragCoefficient
      };
    }
  }

  /**
   * Update movement state flags
   */
  private updateMovementState(): void {
    const speed = this.getMovementSpeed();
    const wasMoving = this.isMoving;
    
    this._isMoving = speed > 0.1;
    this._currentSpeed = speed;
    
    if (wasMoving !== this.isMoving) {
      this.emit('movement-state-changed', this.isMoving);
      if (this.isMoving) {
        this.emit('started-moving');
      } else {
        this.emit('stopped-moving');
      }
    }
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