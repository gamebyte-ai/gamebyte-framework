import { EventEmitter } from 'eventemitter3';
import * as CANNON from 'cannon-es';
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
import { Cannon3DEngine } from '../engines/Cannon3DEngine';

/**
 * Cannon.js 3D physics body implementation
 */
export class Cannon3DBody extends EventEmitter implements PhysicsBody {
  public readonly id: string;
  public readonly type: PhysicsBodyType;
  public readonly dimension: PhysicsDimension = '3d';

  // Private backing fields for mutable state
  private _isStatic: boolean;
  private _isSensor: boolean;

  private engine: Cannon3DEngine;
  private body: CANNON.Body;
  private _material: PhysicsMaterial;
  private cannonMaterial: CANNON.Material;
  private _userData: any = null;

  // Public getters for readonly access
  get isStatic(): boolean {
    return this._isStatic;
  }

  get isSensor(): boolean {
    return this._isSensor;
  }

  constructor(engine: Cannon3DEngine, config: PhysicsBodyConfig) {
    super();

    this.engine = engine;
    this.id = config.id || `body_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = config.type;
    this._isStatic = config.isStatic || config.type === 'static';
    this._isSensor = config.isSensor || false;
    this._material = config.material || engine.getDefaultMaterial();
    this._userData = config.userData;

    this.cannonMaterial = engine.createCannonMaterial(this._material);
    this.body = this.createCannonBody(config);
    this.applyConfiguration(config);
  }

  /**
   * Get if body is active (not sleeping)
   */
  get isActive(): boolean {
    return this.body.sleepState === CANNON.Body.AWAKE;
  }

  /**
   * Get if body is sleeping
   */
  get isSleeping(): boolean {
    return this.body.sleepState === CANNON.Body.SLEEPING;
  }

  /**
   * Get/set position
   */
  get position(): Vector3 {
    return {
      x: this.body.position.x,
      y: this.body.position.y,
      z: this.body.position.z
    };
  }

  set position(position: Point | Vector3) {
    if ('z' in position) {
      const pos = position as Vector3;
      this.body.position.set(pos.x, pos.y, pos.z);
    } else {
      // Convert 2D position to 3D
      const pos = position as Point;
      this.body.position.set(pos.x, pos.y, 0);
    }
    this.emit('position-changed', position);
  }

  /**
   * Get/set rotation (quaternion)
   */
  get rotation(): Quaternion {
    return {
      x: this.body.quaternion.x,
      y: this.body.quaternion.y,
      z: this.body.quaternion.z,
      w: this.body.quaternion.w
    };
  }

  set rotation(rotation: number | Quaternion) {
    if (typeof rotation === 'number') {
      // Convert 2D angle to 3D quaternion (rotation around Z axis)
      this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), rotation);
    } else {
      const quat = rotation as Quaternion;
      this.body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
    }
    this.emit('rotation-changed', rotation);
  }

  /**
   * Get/set velocity
   */
  get velocity(): Vector3 {
    return {
      x: this.body.velocity.x,
      y: this.body.velocity.y,
      z: this.body.velocity.z
    };
  }

  set velocity(velocity: Point | Vector3) {
    if ('z' in velocity) {
      const vel = velocity as Vector3;
      this.body.velocity.set(vel.x, vel.y, vel.z);
    } else {
      // Convert 2D velocity to 3D
      const vel = velocity as Point;
      this.body.velocity.set(vel.x, vel.y, 0);
    }
    this.emit('velocity-changed', velocity);
  }

  /**
   * Get/set angular velocity
   */
  get angularVelocity(): Vector3 {
    return {
      x: this.body.angularVelocity.x,
      y: this.body.angularVelocity.y,
      z: this.body.angularVelocity.z
    };
  }

  set angularVelocity(angularVelocity: number | Vector3) {
    if (typeof angularVelocity === 'number') {
      // Convert 2D angular velocity to 3D (around Z axis)
      this.body.angularVelocity.set(0, 0, angularVelocity);
    } else {
      const angVel = angularVelocity as Vector3;
      this.body.angularVelocity.set(angVel.x, angVel.y, angVel.z);
    }
    this.emit('angular-velocity-changed', angularVelocity);
  }

  /**
   * Get/set mass
   */
  get mass(): number {
    return this.body.mass;
  }

  set mass(mass: number) {
    this.body.mass = mass;
    this.body.updateMassProperties();
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
    this.cannonMaterial = this.engine.createCannonMaterial(material);
    this.applyMaterial(material);
    this.emit('material-changed', material);
  }

  /**
   * Get/set gravity scale (custom property)
   */
  get gravityScale(): number {
    return (this.body as any).gravityScale || 1;
  }

  set gravityScale(scale: number) {
    (this.body as any).gravityScale = scale;
    this.emit('gravity-scale-changed', scale);
  }

  /**
   * Get/set linear damping
   */
  get linearDamping(): number {
    return this.body.linearDamping;
  }

  set linearDamping(damping: number) {
    this.body.linearDamping = damping;
    this.emit('linear-damping-changed', damping);
  }

  /**
   * Get/set angular damping
   */
  get angularDamping(): number {
    return this.body.angularDamping;
  }

  set angularDamping(damping: number) {
    this.body.angularDamping = damping;
    this.emit('angular-damping-changed', damping);
  }

  /**
   * Get/set collision group
   */
  get collisionGroup(): number {
    return this.body.collisionFilterGroup;
  }

  set collisionGroup(group: number) {
    this.body.collisionFilterGroup = group;
    this.emit('collision-group-changed', group);
  }

  /**
   * Get/set collision mask
   */
  get collisionMask(): number {
    return this.body.collisionFilterMask;
  }

  set collisionMask(mask: number) {
    this.body.collisionFilterMask = mask;
    this.emit('collision-mask-changed', mask);
  }

  /**
   * Get body bounds
   */
  get bounds(): { min: Vector3; max: Vector3 } {
    // Force AABB update
    this.body.updateBoundingRadius();
    this.body.updateAABB();
    return {
      min: {
        x: this.body.aabb.lowerBound.x,
        y: this.body.aabb.lowerBound.y,
        z: this.body.aabb.lowerBound.z
      },
      max: {
        x: this.body.aabb.upperBound.x,
        y: this.body.aabb.upperBound.y,
        z: this.body.aabb.upperBound.z
      }
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
    const f = this.toVector3(force);
    const p = point ? this.toVector3(point) : this.body.position;
    
    const forceVec = new CANNON.Vec3(f.x, f.y, f.z);
    const pointVec = new CANNON.Vec3(p.x, p.y, p.z);
    
    this.body.applyForce(forceVec, pointVec);
    this.emit('force-applied', { force: f, point: p });
  }

  /**
   * Apply impulse at a point
   */
  applyImpulse(impulse: Point | Vector3, point?: Point | Vector3): void {
    const imp = this.toVector3(impulse);
    const p = point ? this.toVector3(point) : this.body.position;
    
    const impulseVec = new CANNON.Vec3(imp.x, imp.y, imp.z);
    const pointVec = new CANNON.Vec3(p.x, p.y, p.z);
    
    this.body.applyImpulse(impulseVec, pointVec);
    this.emit('impulse-applied', { impulse: imp, point: p });
  }

  /**
   * Apply torque
   */
  applyTorque(torque: number | Vector3): void {
    const t = typeof torque === 'number' 
      ? { x: 0, y: 0, z: torque }  // 2D torque around Z axis
      : torque as Vector3;
    
    const torqueVec = new CANNON.Vec3(t.x, t.y, t.z);
    this.body.torque.vadd(torqueVec, this.body.torque);
    
    this.emit('torque-applied', t);
  }

  /**
   * Set body as static/dynamic
   */
  setStatic(isStatic: boolean): void {
    this.body.type = isStatic ? CANNON.Body.KINEMATIC : CANNON.Body.DYNAMIC;
    if (isStatic) {
      this.body.mass = 0;
      this.body.updateMassProperties();
    }
    this._isStatic = isStatic;
    this.emit('static-changed', isStatic);
  }

  /**
   * Set body as sensor
   */
  setSensor(isSensor: boolean): void {
    this.body.isTrigger = isSensor;
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
    this.body.wakeUp();
    this.emit('wake-up');
  }

  /**
   * Put body to sleep
   */
  sleep(): void {
    this.body.sleep();
    this.emit('sleep');
  }

  /**
   * Add a shape to the body
   */
  addShape(config: PhysicsShapeConfig): void {
    const shape = this.createCannonShape(config);
    const offset = config.offset ? this.toVector3(config.offset) : new CANNON.Vec3(0, 0, 0);
    const rotation = config.rotation ? this.toQuaternion(config.rotation) : new CANNON.Quaternion();
    
    this.body.addShape(shape, new CANNON.Vec3(offset.x, offset.y, offset.z), rotation);
    this.emit('shape-added', config);
  }

  /**
   * Remove a shape from the body
   */
  removeShape(index: number): void {
    if (index >= 0 && index < this.body.shapes.length) {
      this.body.removeShape(this.body.shapes[index]);
      this.emit('shape-removed', index);
    }
  }

  /**
   * Update transform (force AABB recalculation)
   */
  updateTransform(): void {
    this.body.updateBoundingRadius();
    this.body.updateAABB();
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
   * Get the native Cannon.js body
   */
  getNativeBody(): CANNON.Body {
    return this.body;
  }

  /**
   * Create the Cannon.js body from configuration
   */
  private createCannonBody(config: PhysicsBodyConfig): CANNON.Body {
    const position = this.toVector3(config.position);
    
    const body = new CANNON.Body({
      mass: this.isStatic ? 0 : (config.mass || 1),
      position: new CANNON.Vec3(position.x, position.y, position.z),
      material: this.cannonMaterial,
      type: this.isStatic ? CANNON.Body.KINEMATIC : CANNON.Body.DYNAMIC,
      isTrigger: this.isSensor
    });

    // Set rotation if provided
    if (config.rotation !== undefined) {
      const quat = this.toQuaternion(config.rotation);
      body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
    }

    // Add shapes
    for (const shapeConfig of config.shapes) {
      const shape = this.createCannonShape(shapeConfig);
      const offset = shapeConfig.offset ? this.toVector3(shapeConfig.offset) : new CANNON.Vec3(0, 0, 0);
      const rotation = shapeConfig.rotation ? this.toQuaternion(shapeConfig.rotation) : new CANNON.Quaternion();
      
      body.addShape(shape, new CANNON.Vec3(offset.x, offset.y, offset.z), rotation);
    }

    // Set initial velocity if provided
    if (config.velocity) {
      const vel = this.toVector3(config.velocity);
      body.velocity.set(vel.x, vel.y, vel.z);
    }

    // Set initial angular velocity if provided
    if (config.angularVelocity) {
      if (typeof config.angularVelocity === 'number') {
        // For scalar angular velocity, assume rotation around Z-axis
        body.angularVelocity.set(0, 0, config.angularVelocity);
      } else {
        const angVel = this.toVector3(config.angularVelocity);
        body.angularVelocity.set(angVel.x, angVel.y, angVel.z);
      }
    }

    // Set collision filtering
    if (config.collisionGroup !== undefined) {
      body.collisionFilterGroup = config.collisionGroup;
    }
    if (config.collisionMask !== undefined) {
      body.collisionFilterMask = config.collisionMask;
    }

    return body;
  }

  /**
   * Create a Cannon.js shape from configuration
   */
  private createCannonShape(config: PhysicsShapeConfig): CANNON.Shape {
    const dimensions = this.toVector3(config.dimensions);
    
    switch (config.type) {
      case 'box':
        return new CANNON.Box(new CANNON.Vec3(dimensions.x / 2, dimensions.y / 2, dimensions.z / 2));
      
      case 'sphere':
        return new CANNON.Sphere(config.radius || dimensions.x / 2);
      
      case 'circle':
        // Create a very thin cylinder for 2D circle
        return new CANNON.Cylinder(
          config.radius || dimensions.x / 2,
          config.radius || dimensions.x / 2,
          0.1,
          8
        );
      
      case 'capsule':
        return new CANNON.Cylinder(
          config.radius || dimensions.x / 2,
          config.radius || dimensions.x / 2,
          config.height || dimensions.y,
          8
        );
      
      case 'heightfield':
        // Would need height data
        console.warn('Heightfield shape not implemented');
        return new CANNON.Box(new CANNON.Vec3(1, 1, 1));
      
      case 'mesh':
        // Would need mesh data
        console.warn('Mesh shape not implemented');
        return new CANNON.Box(new CANNON.Vec3(1, 1, 1));
      
      default:
        // Default to box
        return new CANNON.Box(new CANNON.Vec3(dimensions.x / 2, dimensions.y / 2, dimensions.z / 2));
    }
  }

  /**
   * Apply configuration to the body
   */
  private applyConfiguration(config: PhysicsBodyConfig): void {
    // Set gravity scale
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
      this.body.fixedRotation = true;
      this.body.updateMassProperties();
    }

    // Configure sleeping
    if (config.allowSleep !== undefined) {
      this.body.allowSleep = config.allowSleep;
      if (config.sleepTimeLimit !== undefined) {
        this.body.sleepTimeLimit = config.sleepTimeLimit / 1000; // Convert to seconds
      }
      if (config.sleepSpeedLimit !== undefined) {
        this.body.sleepSpeedLimit = config.sleepSpeedLimit;
      }
    }
  }

  /**
   * Apply material properties to the body
   */
  private applyMaterial(material: PhysicsMaterial): void {
    this.cannonMaterial.friction = material.friction;
    this.cannonMaterial.restitution = material.restitution;
    
    // Update body mass based on density
    if (!this.isStatic) {
      this.body.mass = this.calculateBodyVolume() * material.density;
      this.body.updateMassProperties();
    }
  }

  /**
   * Calculate approximate body volume for mass calculation
   */
  private calculateBodyVolume(): number {
    let totalVolume = 0;
    
    for (const shape of this.body.shapes) {
      if (shape instanceof CANNON.Box) {
        const box = shape as CANNON.Box;
        totalVolume += 8 * box.halfExtents.x * box.halfExtents.y * box.halfExtents.z;
      } else if (shape instanceof CANNON.Sphere) {
        const sphere = shape as CANNON.Sphere;
        totalVolume += (4/3) * Math.PI * sphere.radius ** 3;
      } else if (shape instanceof CANNON.Cylinder) {
        const cylinder = shape as CANNON.Cylinder;
        totalVolume += Math.PI * cylinder.radiusTop ** 2 * cylinder.height;
      } else {
        // Default volume for unknown shapes
        totalVolume += 1;
      }
    }
    
    return Math.max(totalVolume, 0.1); // Minimum volume to avoid zero mass
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

  /**
   * Convert number or Quaternion to CANNON.Quaternion
   */
  private toQuaternion(input: number | Quaternion): CANNON.Quaternion {
    if (typeof input === 'number') {
      // Convert 2D angle to 3D quaternion (rotation around Z axis)
      return new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0, 0, 1), input);
    } else {
      const quat = input as Quaternion;
      return new CANNON.Quaternion(quat.x, quat.y, quat.z, quat.w);
    }
  }
}