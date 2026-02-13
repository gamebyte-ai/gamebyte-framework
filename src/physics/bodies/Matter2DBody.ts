import { EventEmitter } from 'eventemitter3';
import Matter from 'matter-js';
import {
  PhysicsBody,
  PhysicsBodyType,
  PhysicsDimension,
  PhysicsBodyConfig,
  PhysicsShapeConfig,
  PhysicsShapeType,
  PhysicsMaterial,
  Point,
  Vector3,
  Quaternion
} from '../../contracts/Physics';
import { Matter2DEngine } from '../engines/Matter2DEngine';
import { Logger } from '../../utils/Logger.js';

/**
 * Matter.js 2D physics body implementation
 */
export class Matter2DBody extends EventEmitter implements PhysicsBody {
  public readonly id: string;
  public readonly type: PhysicsBodyType;
  public readonly dimension: PhysicsDimension = '2d';

  // Private backing fields for mutable state
  private _isStatic: boolean;
  private _isSensor: boolean;

  private engine: Matter2DEngine;
  private body: Matter.Body;
  private _material: PhysicsMaterial;
  private _userData: any = null;
  private _gravityScale: number = 1;

  // Public getters for readonly access
  get isStatic(): boolean {
    return this._isStatic;
  }

  get isSensor(): boolean {
    return this._isSensor;
  }

  constructor(engine: Matter2DEngine, config: PhysicsBodyConfig) {
    super();

    this.engine = engine;
    this.id = config.id || `body_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = config.type;
    this._isStatic = config.isStatic || config.type === 'static';
    this._isSensor = config.isSensor || false;
    this._material = config.material || engine.getDefaultMaterial();
    this._userData = config.userData;

    this.body = this.createMatterBody(config);
    this.applyConfiguration(config);
  }

  /**
   * Get if body is active (not sleeping)
   */
  get isActive(): boolean {
    return !this.body.isSleeping;
  }

  /**
   * Get if body is sleeping
   */
  get isSleeping(): boolean {
    return this.body.isSleeping;
  }

  /**
   * Get/set position
   */
  get position(): Point {
    return { x: this.body.position.x, y: this.body.position.y };
  }

  set position(position: Point | Vector3) {
    const pos = position as Point;
    Matter.Body.setPosition(this.body, pos);
    this.emit('position-changed', pos);
  }

  /**
   * Get/set rotation (angle in radians)
   */
  get rotation(): number {
    return this.body.angle;
  }

  set rotation(rotation: number | Quaternion) {
    const angle = typeof rotation === 'number' ? rotation : 0; // For 2D, ignore quaternion
    Matter.Body.setAngle(this.body, angle);
    this.emit('rotation-changed', angle);
  }

  /**
   * Get/set velocity
   */
  get velocity(): Point {
    return { x: this.body.velocity.x, y: this.body.velocity.y };
  }

  set velocity(velocity: Point | Vector3) {
    const vel = velocity as Point;
    Matter.Body.setVelocity(this.body, vel);
    this.emit('velocity-changed', vel);
  }

  /**
   * Get/set angular velocity
   */
  get angularVelocity(): number {
    return this.body.angularVelocity;
  }

  set angularVelocity(angularVelocity: number | Vector3) {
    const angVel = typeof angularVelocity === 'number' ? angularVelocity : 0;
    Matter.Body.setAngularVelocity(this.body, angVel);
    this.emit('angular-velocity-changed', angVel);
  }

  /**
   * Get/set mass
   */
  get mass(): number {
    return this.body.mass;
  }

  set mass(mass: number) {
    Matter.Body.setMass(this.body, mass);
    this.emit('mass-changed', mass);
  }

  /**
   * Get/set material
   */
  get material(): PhysicsMaterial {
    return this._material;
  }

  set material(material: PhysicsMaterial) {
    this._material = material;
    this.applyMaterial(material);
    this.emit('material-changed', material);
  }

  /**
   * Get/set gravity scale
   */
  get gravityScale(): number {
    return this._gravityScale;
  }

  set gravityScale(scale: number) {
    // Matter.js doesn't have built-in gravity scale, so we store it privately
    this._gravityScale = scale;
    this.emit('gravity-scale-changed', scale);
  }

  /**
   * Get/set linear damping
   */
  get linearDamping(): number {
    return this.body.frictionAir;
  }

  set linearDamping(damping: number) {
    this.body.frictionAir = damping;
    this.emit('linear-damping-changed', damping);
  }

  /**
   * Get/set angular damping
   */
  get angularDamping(): number {
    return this.body.frictionAir; // Matter.js uses same value for both
  }

  set angularDamping(damping: number) {
    this.body.frictionAir = damping;
    this.emit('angular-damping-changed', damping);
  }

  /**
   * Get/set collision group
   */
  get collisionGroup(): number {
    return this.body.collisionFilter.group || 0;
  }

  set collisionGroup(group: number) {
    this.body.collisionFilter.group = group;
    this.emit('collision-group-changed', group);
  }

  /**
   * Get/set collision mask
   */
  get collisionMask(): number {
    return this.body.collisionFilter.mask || 0xFFFFFFFF;
  }

  set collisionMask(mask: number) {
    this.body.collisionFilter.mask = mask;
    this.emit('collision-mask-changed', mask);
  }

  /**
   * Get body bounds
   */
  get bounds(): { min: Point; max: Point } {
    return {
      min: { x: this.body.bounds.min.x, y: this.body.bounds.min.y },
      max: { x: this.body.bounds.max.x, y: this.body.bounds.max.y }
    };
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
   * Apply force at a point
   */
  applyForce(force: Point | Vector3, point?: Point | Vector3): void {
    const f = force as Point;
    const p = point ? point as Point : this.body.position;
    Matter.Body.applyForce(this.body, p, f);
    this.emit('force-applied', { force: f, point: p });
  }

  /**
   * Apply impulse at a point
   */
  applyImpulse(impulse: Point | Vector3, point?: Point | Vector3): void {
    const imp = impulse as Point;
    const p = point ? point as Point : this.body.position;
    
    // Convert impulse to force (impulse = force * deltaTime, assuming 1/60 deltaTime)
    const force = { x: imp.x * 60, y: imp.y * 60 };
    Matter.Body.applyForce(this.body, p, force);
    this.emit('impulse-applied', { impulse: imp, point: p });
  }

  /**
   * Apply torque
   */
  applyTorque(torque: number | Vector3): void {
    const t = typeof torque === 'number' ? torque : 0;
    
    // Apply torque by applying forces at the edges
    const radius = Math.max(this.body.bounds.max.x - this.body.bounds.min.x, 
                           this.body.bounds.max.y - this.body.bounds.min.y) / 2;
    const force = t / radius;
    
    const offset = { x: 0, y: radius };
    const forcePoint1 = { x: this.body.position.x + offset.x, y: this.body.position.y + offset.y };
    const forcePoint2 = { x: this.body.position.x - offset.x, y: this.body.position.y - offset.y };
    
    Matter.Body.applyForce(this.body, forcePoint1, { x: force, y: 0 });
    Matter.Body.applyForce(this.body, forcePoint2, { x: -force, y: 0 });
    
    this.emit('torque-applied', t);
  }

  /**
   * Set body as static/dynamic
   */
  setStatic(isStatic: boolean): void {
    Matter.Body.setStatic(this.body, isStatic);
    this._isStatic = isStatic;
    this.emit('static-changed', isStatic);
  }

  /**
   * Set body as sensor
   */
  setSensor(isSensor: boolean): void {
    this.body.isSensor = isSensor;
    this._isSensor = isSensor;
    this.emit('sensor-changed', isSensor);
  }

  /**
   * Set body active state
   */
  setActive(active: boolean): void {
    if (active) {
      this.wakeUp();
    } else {
      this.sleep();
    }
  }

  /**
   * Wake up the body
   */
  wakeUp(): void {
    Matter.Sleeping.set(this.body, false);
    this.emit('wake-up');
  }

  /**
   * Put body to sleep
   */
  sleep(): void {
    Matter.Sleeping.set(this.body, true);
    this.emit('sleep');
  }

  /**
   * Add a shape to the body
   */
  addShape(config: PhysicsShapeConfig): void {
    // For Matter.js, we would need to create a compound body
    // This is a simplified implementation
    Logger.warn('Physics', 'addShape not fully implemented for Matter2DBody');
    this.emit('shape-added', config);
  }

  /**
   * Remove a shape from the body
   */
  removeShape(index: number): void {
    // For Matter.js, this would require reconstructing the body
    Logger.warn('Physics', 'removeShape not fully implemented for Matter2DBody');
    this.emit('shape-removed', index);
  }

  /**
   * Update transform (force bounds recalculation)
   */
  updateTransform(): void {
    // Update the body's bounds and properties
    Matter.Body.update(this.body, 1000/60, 1, 1); // deltaTime, timeScale, correction
    this.emit('transform-updated');
  }

  /**
   * Destroy the body
   */
  destroy(): void {
    this.emit('destroy');
    this.removeAllListeners();
  }

  /**
   * Get the native Matter.js body
   */
  getNativeBody(): Matter.Body {
    return this.body;
  }

  /**
   * Create the Matter.js body from configuration
   */
  private createMatterBody(config: PhysicsBodyConfig): Matter.Body {
    let body: Matter.Body;

    // Use the first shape to create the body
    const primaryShape = config.shapes[0];
    if (!primaryShape) {
      throw new Error('Body must have at least one shape');
    }

    const position = config.position as Point;
    const options: Matter.IBodyDefinition = {
      isStatic: this.isStatic,
      isSensor: this.isSensor,
      angle: typeof config.rotation === 'number' ? config.rotation : 0,
      frictionAir: config.linearDamping || 0.01,
      friction: this._material.friction,
      restitution: this._material.restitution,
      density: this._material.density,
      sleepThreshold: config.sleepSpeedLimit || 60
    };

    // Create body based on shape type
    switch (primaryShape.type) {
      case 'box':
        const dimensions = primaryShape.dimensions as Point;
        body = Matter.Bodies.rectangle(
          position.x, 
          position.y, 
          dimensions.x, 
          dimensions.y, 
          options
        );
        break;

      case 'circle':
        const radius = primaryShape.radius || (primaryShape.dimensions as Point).x / 2;
        body = Matter.Bodies.circle(
          position.x, 
          position.y, 
          radius, 
          options
        );
        break;

      default:
        // Default to box
        body = Matter.Bodies.rectangle(
          position.x, 
          position.y, 
          32, 
          32, 
          options
        );
        break;
    }

    // Set initial velocity if provided
    if (config.velocity) {
      const vel = config.velocity as Point;
      Matter.Body.setVelocity(body, vel);
    }

    // Set initial angular velocity if provided
    if (config.angularVelocity) {
      const angVel = typeof config.angularVelocity === 'number' ? config.angularVelocity : 0;
      Matter.Body.setAngularVelocity(body, angVel);
    }

    // Set collision filtering
    if (config.collisionGroup !== undefined || config.collisionMask !== undefined) {
      body.collisionFilter = {
        category: 0x0001,
        mask: config.collisionMask || 0xFFFFFFFF,
        group: config.collisionGroup || 0
      };
    }

    return body;
  }

  /**
   * Apply configuration to the body
   */
  private applyConfiguration(config: PhysicsBodyConfig): void {
    // Set mass if provided
    if (config.mass !== undefined) {
      this.mass = config.mass;
    }

    // Set gravity scale if provided
    if (config.gravityScale !== undefined) {
      this.gravityScale = config.gravityScale;
    }

    // Set damping values
    if (config.linearDamping !== undefined) {
      this.linearDamping = config.linearDamping;
    }

    if (config.angularDamping !== undefined) {
      this.angularDamping = config.angularDamping;
    }

    // Set fixed rotation
    if (config.fixedRotation) {
      this.body.inertia = Infinity;
    }

    // Configure sleeping
    if (config.allowSleep !== undefined) {
      // Matter.js bodies can sleep by default, so we don't need to do anything special
      if (!config.allowSleep) {
        this.body.sleepThreshold = Infinity;
      }
    }
  }

  /**
   * Apply material properties to the body
   */
  private applyMaterial(material: PhysicsMaterial): void {
    this.body.friction = material.friction;
    this.body.restitution = material.restitution;
    this.body.density = material.density;
    
    if (material.frictionAir !== undefined) {
      this.body.frictionAir = material.frictionAir;
    }

    // Update mass based on new density
    Matter.Body.setMass(this.body, this.body.area * material.density);
  }
}