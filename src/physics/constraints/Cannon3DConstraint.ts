import { EventEmitter } from 'eventemitter3';
import * as CANNON from 'cannon-es';
import {
  PhysicsConstraint,
  PhysicsConstraintType,
  PhysicsConstraintConfig,
  PhysicsBody,
  Point,
  Vector3
} from '../../contracts/Physics';
import { Cannon3DBody } from '../bodies/Cannon3DBody';
import { Logger } from '../../utils/Logger.js';

/**
 * Cannon.js 3D physics constraint implementation
 */
export class Cannon3DConstraint extends EventEmitter implements PhysicsConstraint {
  public readonly id: string;
  public readonly type: PhysicsConstraintType;
  public readonly bodyA: PhysicsBody;
  public readonly bodyB: PhysicsBody;

  private constraint: CANNON.Constraint;
  private _userData: any = null;

  constructor(config: PhysicsConstraintConfig, bodyA: Cannon3DBody, bodyB: Cannon3DBody) {
    super();
    
    this.id = config.id || `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = config.type;
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this._userData = config.userData;

    this.constraint = this.createCannonConstraint(config, bodyA, bodyB);
  }

  /**
   * Get/set stiffness (not directly supported by Cannon.js)
   */
  get stiffness(): number {
    return (this.constraint as any).stiffness || 1;
  }

  set stiffness(stiffness: number) {
    (this.constraint as any).stiffness = Math.max(0, Math.min(1, stiffness));
    this.emit('stiffness-changed', stiffness);
  }

  /**
   * Get/set damping (not directly supported by Cannon.js)
   */
  get damping(): number {
    return (this.constraint as any).damping || 0;
  }

  set damping(damping: number) {
    (this.constraint as any).damping = Math.max(0, Math.min(1, damping));
    this.emit('damping-changed', damping);
  }

  /**
   * Get/set motor speed (for motorized constraints)
   */
  get motorSpeed(): number {
    if (this.constraint instanceof CANNON.HingeConstraint) {
      return (this.constraint as any).motorTargetVelocity || 0;
    }
    return (this.constraint as any).motorSpeed || 0;
  }

  set motorSpeed(speed: number) {
    if (this.constraint instanceof CANNON.HingeConstraint) {
      (this.constraint as any).motorTargetVelocity = speed;
    } else {
      (this.constraint as any).motorSpeed = speed;
    }
    this.emit('motor-speed-changed', speed);
  }

  /**
   * Get/set motor force (for motorized constraints)
   */
  get motorForce(): number {
    if (this.constraint instanceof CANNON.HingeConstraint) {
      return (this.constraint as any).motorMaxForce || 0;
    }
    return (this.constraint as any).motorForce || 0;
  }

  set motorForce(force: number) {
    if (this.constraint instanceof CANNON.HingeConstraint) {
      (this.constraint as any).motorMaxForce = force;
    } else {
      (this.constraint as any).motorForce = force;
    }
    this.emit('motor-force-changed', force);
  }

  /**
   * Get motor enabled state
   */
  get isMotorEnabled(): boolean {
    if (this.constraint instanceof CANNON.HingeConstraint) {
      return (this.constraint as any).motorEnabled || false;
    }
    return (this.constraint as any).motorEnabled || false;
  }

  /**
   * Get/set user data
   */
  get userData(): any {
    return this._userData;
  }

  set userData(data: any) {
    this._userData = data;
    this.emit('user-data-changed', data);
  }

  /**
   * Set stiffness
   */
  setStiffness(stiffness: number): void {
    this.stiffness = stiffness;
  }

  /**
   * Set damping
   */
  setDamping(damping: number): void {
    this.damping = damping;
  }

  /**
   * Set motor speed
   */
  setMotorSpeed(speed: number): void {
    this.motorSpeed = speed;
  }

  /**
   * Set motor force
   */
  setMotorForce(force: number): void {
    this.motorForce = force;
  }

  /**
   * Enable or disable motor
   */
  enableMotor(enabled: boolean): void {
    if (this.constraint instanceof CANNON.HingeConstraint) {
      (this.constraint as any).motorEnabled = enabled;
    } else {
      (this.constraint as any).motorEnabled = enabled;
    }
    this.emit('motor-enabled-changed', enabled);
  }

  /**
   * Destroy the constraint
   */
  destroy(): void {
    this.emit('destroy');
    this.removeAllListeners();
  }

  /**
   * Get the native Cannon.js constraint
   */
  getNativeConstraint(): CANNON.Constraint {
    return this.constraint;
  }

  /**
   * Create the Cannon.js constraint from configuration
   */
  private createCannonConstraint(
    config: PhysicsConstraintConfig, 
    bodyA: Cannon3DBody, 
    bodyB: Cannon3DBody
  ): CANNON.Constraint {
    const nativeBodyA = bodyA.getNativeBody();
    const nativeBodyB = bodyB.getNativeBody();

    let constraint: CANNON.Constraint;

    switch (config.type) {
      case 'distance':
        // Distance constraint
        const distance = config.length || this.calculateDistance(bodyA, bodyB);
        constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, distance);
        break;

      case 'spring':
        // Spring constraint (distance constraint with custom properties)
        const springDistance = config.length || this.calculateDistance(bodyA, bodyB);
        constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, springDistance);
        (constraint as any).stiffness = config.stiffness || 0.02;
        (constraint as any).damping = config.damping || 0.05;
        break;

      case 'revolute':
        // Hinge constraint (revolute joint)
        const pivotA = config.anchorA ? this.toVector3(config.anchorA) : { x: 0, y: 0, z: 0 };
        const pivotB = config.anchorB ? this.toVector3(config.anchorB) : { x: 0, y: 0, z: 0 };
        const axisA = config.axis ? this.toVector3(config.axis) : { x: 0, y: 0, z: 1 };
        const axisB = config.axis ? this.toVector3(config.axis) : { x: 0, y: 0, z: 1 };
        
        constraint = new CANNON.HingeConstraint(
          nativeBodyA,
          nativeBodyB,
          {
            pivotA: new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
            axisA: new CANNON.Vec3(axisA.x, axisA.y, axisA.z),
            pivotB: new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z),
            axisB: new CANNON.Vec3(axisB.x, axisB.y, axisB.z)
          }
        );
        
        // Configure motor if specified
        if (config.motorSpeed !== undefined || config.enableMotor) {
          (constraint as any).motorEnabled = config.enableMotor || false;
          (constraint as any).motorTargetVelocity = config.motorSpeed || 0;
          (constraint as any).motorMaxForce = config.motorForce || 1;
        }
        break;

      case 'prismatic':
        // Prismatic constraint (linear movement along axis)
        Logger.warn('Physics', 'Prismatic constraint not fully supported in Cannon.js, using distance constraint');
        constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, config.length || 1);
        break;

      case 'fixed':
        // Lock constraint (fixed joint)
        constraint = new CANNON.LockConstraint(nativeBodyA, nativeBodyB);
        break;

      case 'rope':
        // Rope constraint (distance with no compression)
        const ropeDistance = config.length || this.calculateDistance(bodyA, bodyB);
        constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, ropeDistance);
        // Note: Cannon.js distance constraint doesn't prevent compression
        break;

      case 'gear':
      case 'pulley':
      case 'mouse':
        // These constraint types are not directly supported by Cannon.js
        Logger.warn('Physics', `Constraint type '${config.type}' not supported in Cannon.js, using distance constraint`);
        constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, config.length || 1);
        break;

      default:
        // Default to distance constraint
        constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, config.length || 1);
        break;
    }

    // Store configuration for later use
    (constraint as any).stiffness = config.stiffness || 1;
    (constraint as any).damping = config.damping || 0;
    (constraint as any).motorSpeed = config.motorSpeed || 0;
    (constraint as any).motorForce = config.motorForce || 0;
    (constraint as any).motorEnabled = config.enableMotor || false;

    // Apply limits if specified (only supported by HingeConstraint)
    if (constraint instanceof CANNON.HingeConstraint) {
      if (config.lowerLimit !== undefined) {
        (constraint as any).lowerLimit = config.lowerLimit;
      }
      if (config.upperLimit !== undefined) {
        (constraint as any).upperLimit = config.upperLimit;
      }
    }

    return constraint;
  }

  /**
   * Calculate distance between two bodies
   */
  private calculateDistance(bodyA: Cannon3DBody, bodyB: Cannon3DBody): number {
    const posA = bodyA.position;
    const posB = bodyB.position;
    
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const dz = posB.z - posA.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Convert Point or Vector3 to Vector3
   */
  private toVector3(input: Point | Vector3): Vector3 {
    if ('z' in input) {
      return input as Vector3;
    } else {
      const point = input as Point;
      return { x: point.x, y: point.y, z: 0 };
    }
  }
}