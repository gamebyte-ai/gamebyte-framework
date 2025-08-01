import { EventEmitter } from 'eventemitter3';
import Matter from 'matter-js';
import {
  PhysicsConstraint,
  PhysicsConstraintType,
  PhysicsConstraintConfig,
  PhysicsBody,
  Point,
  Vector3
} from '../../contracts/Physics';
import { Matter2DBody } from '../bodies/Matter2DBody';

/**
 * Matter.js 2D physics constraint implementation
 */
export class Matter2DConstraint extends EventEmitter implements PhysicsConstraint {
  public readonly id: string;
  public readonly type: PhysicsConstraintType;
  public readonly bodyA: PhysicsBody;
  public readonly bodyB: PhysicsBody;

  private constraint: Matter.Constraint;
  private _userData: any = null;

  constructor(config: PhysicsConstraintConfig, bodyA: Matter2DBody, bodyB: Matter2DBody) {
    super();
    
    this.id = config.id || `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = config.type;
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this._userData = config.userData;

    this.constraint = this.createMatterConstraint(config, bodyA, bodyB);
  }

  /**
   * Get/set stiffness
   */
  get stiffness(): number {
    return this.constraint.stiffness;
  }

  set stiffness(stiffness: number) {
    this.constraint.stiffness = Math.max(0, Math.min(1, stiffness));
    this.emit('stiffness-changed', stiffness);
  }

  /**
   * Get/set damping
   */
  get damping(): number {
    return this.constraint.damping;
  }

  set damping(damping: number) {
    this.constraint.damping = Math.max(0, Math.min(1, damping));
    this.emit('damping-changed', damping);
  }

  /**
   * Get/set motor speed (for motorized constraints)
   */
  get motorSpeed(): number {
    // Matter.js doesn't have built-in motors, so we store this in userData
    return (this.constraint.render as any)?.motorSpeed || 0;
  }

  set motorSpeed(speed: number) {
    if (!this.constraint.render) {
      this.constraint.render = {};
    }
    (this.constraint.render as any).motorSpeed = speed;
    this.emit('motor-speed-changed', speed);
  }

  /**
   * Get/set motor force (for motorized constraints)
   */
  get motorForce(): number {
    return (this.constraint.render as any)?.motorForce || 0;
  }

  set motorForce(force: number) {
    if (!this.constraint.render) {
      this.constraint.render = {};
    }
    (this.constraint.render as any).motorForce = force;
    this.emit('motor-force-changed', force);
  }

  /**
   * Get motor enabled state
   */
  get isMotorEnabled(): boolean {
    return (this.constraint.render as any)?.motorEnabled || false;
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
    if (!this.constraint.render) {
      this.constraint.render = {};
    }
    (this.constraint.render as any).motorEnabled = enabled;
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
   * Get the native Matter.js constraint
   */
  getNativeConstraint(): Matter.Constraint {
    return this.constraint;
  }

  /**
   * Create the Matter.js constraint from configuration
   */
  private createMatterConstraint(
    config: PhysicsConstraintConfig, 
    bodyA: Matter2DBody, 
    bodyB: Matter2DBody
  ): Matter.Constraint {
    const nativeBodyA = bodyA.getNativeBody();
    const nativeBodyB = bodyB.getNativeBody();

    let constraint: Matter.Constraint;

    const options: Matter.IConstraintDefinition = {
      bodyA: nativeBodyA,
      bodyB: nativeBodyB,
      stiffness: config.stiffness || 0.8,
      damping: config.damping || 0.1,
      length: config.length
    };

    // Set anchor points if provided
    if (config.anchorA) {
      const anchor = config.anchorA as Point;
      options.pointA = { x: anchor.x, y: anchor.y };
    }

    if (config.anchorB) {
      const anchor = config.anchorB as Point;
      options.pointB = { x: anchor.x, y: anchor.y };
    }

    switch (config.type) {
      case 'distance':
        // Standard distance constraint
        if (config.length === undefined) {
          // Calculate distance between bodies if not specified
          const dx = nativeBodyB.position.x - nativeBodyA.position.x;
          const dy = nativeBodyB.position.y - nativeBodyA.position.y;
          options.length = Math.sqrt(dx * dx + dy * dy);
        }
        constraint = Matter.Constraint.create(options);
        break;

      case 'spring':
        // Spring constraint with higher stiffness
        options.stiffness = config.stiffness || 0.02;
        options.damping = config.damping || 0.05;
        constraint = Matter.Constraint.create(options);
        break;

      case 'revolute':
        // Pin constraint (revolute joint)
        options.length = 0;
        options.stiffness = 1;
        constraint = Matter.Constraint.create(options);
        break;

      case 'fixed':
        // Fixed constraint
        options.length = 0;
        options.stiffness = 1;
        options.damping = 0;
        constraint = Matter.Constraint.create(options);
        break;

      case 'rope':
        // Rope constraint (distance with no compression)
        constraint = Matter.Constraint.create(options);
        // Note: Matter.js doesn't have built-in rope physics, 
        // this would need custom implementation
        break;

      case 'mouse':
        // Mouse constraint for dragging
        options.stiffness = 0.2;
        options.length = 0;
        constraint = Matter.Constraint.create(options);
        break;

      case 'prismatic':
      case 'gear':
      case 'pulley':
        // These constraint types are not directly supported by Matter.js
        // Fall back to distance constraint
        console.warn(`Constraint type '${config.type}' not fully supported in Matter.js, using distance constraint`);
        constraint = Matter.Constraint.create(options);
        break;

      default:
        // Default to distance constraint
        constraint = Matter.Constraint.create(options);
        break;
    }

    // Apply limits if specified
    if (config.lowerLimit !== undefined || config.upperLimit !== undefined) {
      // Matter.js doesn't have built-in constraint limits
      // This would need custom implementation
      console.warn('Constraint limits not supported in Matter.js');
    }

    // Apply motor settings if specified
    if (config.motorSpeed !== undefined || config.motorForce !== undefined) {
      // Store motor settings in render object for later use
      constraint.render = constraint.render || {};
      (constraint.render as any).motorSpeed = config.motorSpeed || 0;
      (constraint.render as any).motorForce = config.motorForce || 0;
      (constraint.render as any).motorEnabled = config.enableMotor || false;
    }

    return constraint;
  }
}