import { EventEmitter } from 'eventemitter3';
import * as CANNON from 'cannon-es';
import {
  PhysicsWorld,
  PhysicsDimension,
  PhysicsEngineType,
  PhysicsWorldConfig,
  PhysicsBody,
  PhysicsBodyConfig,
  PhysicsConstraint,
  PhysicsConstraintConfig,
  CollisionEvent,
  RaycastOptions,
  RaycastResult,
  PhysicsPerformanceMetrics,
  Point,
  Vector3
} from '../../contracts/Physics';
import { Cannon3DEngine } from '../engines/Cannon3DEngine';
import { Cannon3DBody } from '../bodies/Cannon3DBody';
import { Cannon3DConstraint } from '../constraints/Cannon3DConstraint';
import { Logger } from '../../utils/Logger.js';

/**
 * Cannon.js 3D physics world implementation
 */
export class Cannon3DWorld extends EventEmitter implements PhysicsWorld {
  public readonly dimension: PhysicsDimension = '3d';
  public readonly engineType: PhysicsEngineType = 'cannon';

  // Private backing field for mutable state
  private _isRunning: boolean = false;

  private engine: Cannon3DEngine;
  private world: CANNON.World;
  private bodies: Map<string, Cannon3DBody> = new Map();
  private constraints: Map<string, Cannon3DConstraint> = new Map();
  private config: PhysicsWorldConfig;
  private lastStepTime = 0;
  private paused = false;
  private animationFrameId?: number;

  // Public getter for readonly access
  get isRunning(): boolean {
    return this._isRunning;
  }

  constructor(engine: Cannon3DEngine, config: PhysicsWorldConfig) {
    super();
    this.engine = engine;
    this.config = { ...config };

    this.world = new CANNON.World();
    this.initializeWorld();
    this.setupCollisionEvents();
  }

  /**
   * Get current body count
   */
  get bodyCount(): number {
    return this.bodies.size;
  }

  /**
   * Get current constraint count
   */
  get constraintCount(): number {
    return this.constraints.size;
  }

  /**
   * Get current gravity
   */
  get gravity(): Vector3 {
    return {
      x: this.world.gravity.x,
      y: this.world.gravity.y,
      z: this.world.gravity.z
    };
  }

  /**
   * Set gravity
   */
  set gravity(gravity: Point | Vector3) {
    if ('z' in gravity) {
      const g = gravity as Vector3;
      this.world.gravity.set(g.x, g.y, g.z);
    } else {
      // Convert 2D gravity to 3D (assume Z is up)
      const g = gravity as Point;
      this.world.gravity.set(g.x, -g.y, 0); // Flip Y for 3D convention
    }
    this.emit('gravity-changed', gravity);
  }

  /**
   * Get time step
   */
  get timeStep(): number {
    return this.config.timeStep || 1/60;
  }

  /**
   * Set time step
   */
  set timeStep(timeStep: number) {
    this.config.timeStep = timeStep;
  }

  /**
   * Get solver iterations
   */
  get iterations(): { velocity: number; position: number } {
    // Cannon.js doesn't expose individual solver iterations
    // Use a reasonable default or stored value
    const defaultIterations = 10;
    return {
      velocity: defaultIterations,
      position: defaultIterations
    };
  }

  /**
   * Set solver iterations
   */
  set iterations(iterations: { velocity: number; position: number }) {
    // Cannon.js doesn't have separate velocity/position iterations
    // Apply the maximum of both to the solver if possible
    const maxIterations = Math.max(iterations.velocity, iterations.position);
    // Note: Cannon.js solver iterations are configured during world creation
    // We can store this for reference but cannot dynamically change it
  }

  /**
   * Step the physics simulation
   */
  step(deltaTime: number): void {
    if (this.paused) return;

    const startTime = performance.now();
    
    // Step the world
    this.world.step(this.timeStep, deltaTime, this.config.maxSubSteps || 3);
    
    // Update performance metrics
    const stepTime = performance.now() - startTime;
    this.engine.updatePerformanceMetrics(deltaTime, stepTime);
    this.lastStepTime = stepTime;

    this.emit('step', deltaTime);
  }

  /**
   * Start the physics simulation
   */
  start(): void {
    if (this.isRunning) return;

    const animate = () => {
      if (!this.isRunning) return;
      
      this.step(1/60); // 60 FPS
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this._isRunning = true;
    animate();
    this.emit('started');
  }

  /**
   * Stop the physics simulation
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    
    this._isRunning = false;
    this.emit('stopped');
  }

  /**
   * Pause the physics simulation
   */
  pause(): void {
    this.paused = true;
    this.emit('paused');
  }

  /**
   * Resume the physics simulation
   */
  resume(): void {
    this.paused = false;
    this.emit('resumed');
  }

  /**
   * Clear all bodies and constraints
   */
  clear(): void {
    // Remove all bodies
    for (const [id, body] of this.bodies) {
      this.removeBody(body);
    }

    // Remove all constraints
    for (const [id, constraint] of this.constraints) {
      this.removeConstraint(constraint);
    }

    this.emit('cleared');
  }

  /**
   * Create a physics body
   */
  createBody(config: PhysicsBodyConfig): PhysicsBody {
    const body = new Cannon3DBody(this.engine, config);
    this.addBody(body);
    return body;
  }

  /**
   * Add a body to the world
   */
  addBody(body: PhysicsBody): void {
    if (!(body instanceof Cannon3DBody)) {
      throw new Error('Body must be a Cannon3DBody');
    }

    this.bodies.set(body.id, body);
    this.world.addBody(body.getNativeBody());
    
    // Setup collision events for this body
    this.setupBodyCollisionEvents(body);
    
    this.emit('body-added', body);
  }

  /**
   * Remove a body from the world
   */
  removeBody(body: PhysicsBody | string): void {
    const bodyId = typeof body === 'string' ? body : body.id;
    const bodyInstance = this.bodies.get(bodyId);
    
    if (bodyInstance) {
      this.world.removeBody(bodyInstance.getNativeBody());
      this.bodies.delete(bodyId);
      
      // Return to pool if possible
      this.engine.returnBodyToPool(bodyInstance.getNativeBody());
      
      this.emit('body-removed', bodyInstance);
    }
  }

  /**
   * Get a body by ID
   */
  getBody(id: string): PhysicsBody | null {
    return this.bodies.get(id) || null;
  }

  /**
   * Get all bodies
   */
  getAllBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values());
  }

  /**
   * Get active bodies (not sleeping)
   */
  getActiveBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values()).filter(body => !body.isSleeping);
  }

  /**
   * Get sleeping bodies
   */
  getSleepingBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values()).filter(body => body.isSleeping);
  }

  /**
   * Create a constraint
   */
  createConstraint(config: PhysicsConstraintConfig): PhysicsConstraint {
    const bodyA = this.getBody(config.bodyA);
    const bodyB = this.getBody(config.bodyB);
    
    if (!bodyA || !bodyB) {
      throw new Error('Both bodies must exist in the world');
    }

    const constraint = new Cannon3DConstraint(config, bodyA as Cannon3DBody, bodyB as Cannon3DBody);
    this.addConstraint(constraint);
    return constraint;
  }

  /**
   * Add a constraint to the world
   */
  addConstraint(constraint: PhysicsConstraint): void {
    if (!(constraint instanceof Cannon3DConstraint)) {
      throw new Error('Constraint must be a Cannon3DConstraint');
    }

    this.constraints.set(constraint.id, constraint);
    this.world.addConstraint(constraint.getNativeConstraint());
    
    this.emit('constraint-added', constraint);
  }

  /**
   * Remove a constraint from the world
   */
  removeConstraint(constraint: PhysicsConstraint | string): void {
    const constraintId = typeof constraint === 'string' ? constraint : constraint.id;
    const constraintInstance = this.constraints.get(constraintId);
    
    if (constraintInstance) {
      this.world.removeConstraint(constraintInstance.getNativeConstraint());
      this.constraints.delete(constraintId);
      this.emit('constraint-removed', constraintInstance);
    }
  }

  /**
   * Get a constraint by ID
   */
  getConstraint(id: string): PhysicsConstraint | null {
    return this.constraints.get(id) || null;
  }

  /**
   * Get all constraints
   */
  getAllConstraints(): PhysicsConstraint[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Perform a raycast
   */
  raycast(options: RaycastOptions): RaycastResult[] {
    const from = options.from as Vector3;
    const to = options.to as Vector3;
    
    const fromVec = new CANNON.Vec3(from.x, from.y, from.z);
    const toVec = new CANNON.Vec3(to.x, to.y, to.z);
    
    const result = new CANNON.RaycastResult();
    this.world.raycastClosest(fromVec, toVec, {}, result);
    
    const results: RaycastResult[] = [];
    
    if (result.hasHit) {
      const physicsBody = this.findPhysicsBody(result.body!);
      if (physicsBody) {
        results.push({
          hit: true,
          body: physicsBody,
          point: {
            x: result.hitPointWorld.x,
            y: result.hitPointWorld.y,
            z: result.hitPointWorld.z
          },
          normal: {
            x: result.hitNormalWorld.x,
            y: result.hitNormalWorld.y,
            z: result.hitNormalWorld.z
          },
          distance: result.distance,
          fraction: result.distance / fromVec.distanceTo(toVec)
        });
      }
    }

    return results;
  }

  /**
   * Query bodies in AABB
   */
  queryAABB(min: Point | Vector3, max: Point | Vector3): PhysicsBody[] {
    const minVec = min as Vector3;
    const maxVec = max as Vector3;
    const results: PhysicsBody[] = [];

    for (const [id, body] of this.bodies) {
      const bounds = body.bounds;
      const bodyMin = bounds.min as Vector3;
      const bodyMax = bounds.max as Vector3;

      // Check AABB overlap
      if (bodyMin.x <= maxVec.x && bodyMax.x >= minVec.x &&
          bodyMin.y <= maxVec.y && bodyMax.y >= minVec.y &&
          bodyMin.z <= maxVec.z && bodyMax.z >= minVec.z) {
        results.push(body);
      }
    }

    return results;
  }

  /**
   * Query bodies at point
   */
  queryPoint(point: Point | Vector3): PhysicsBody[] {
    const p = point as Vector3;
    const results: PhysicsBody[] = [];

    for (const [id, body] of this.bodies) {
      const bounds = body.bounds;
      const bodyMin = bounds.min as Vector3;
      const bodyMax = bounds.max as Vector3;

      // Simple bounds check
      if (p.x >= bodyMin.x && p.x <= bodyMax.x &&
          p.y >= bodyMin.y && p.y <= bodyMax.y &&
          p.z >= bodyMin.z && p.z <= bodyMax.z) {
        results.push(body);
      }
    }

    return results;
  }

  /**
   * Check collision between two bodies
   */
  checkCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): boolean {
    if (!(bodyA instanceof Cannon3DBody) || !(bodyB instanceof Cannon3DBody)) {
      return false;
    }

    const nativeA = bodyA.getNativeBody();
    const nativeB = bodyB.getNativeBody();
    
    // Check if bodies are in contact
    for (const contact of this.world.contacts) {
      if ((contact.bi === nativeA && contact.bj === nativeB) ||
          (contact.bi === nativeB && contact.bj === nativeA)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PhysicsPerformanceMetrics {
    return {
      averageStepTime: this.lastStepTime,
      bodyCount: this.bodies.size,
      constraintCount: this.constraints.size,
      contactCount: this.world.contacts.length,
      broadphaseTime: 0, // Not available in Cannon.js
      narrowphaseTime: 0, // Not available in Cannon.js
      solverTime: 0, // Not available in Cannon.js
      memoryUsage: this.bodies.size * 512 + this.constraints.size * 256, // Rough estimate
      sleepingBodies: this.getSleepingBodies().length,
      activeBodies: this.getActiveBodies().length,
      culledBodies: 0
    };
  }

  /**
   * Enable debug drawing
   */
  enableDebugDraw(enabled: boolean): void {
    // Debug drawing would be implemented here
    this.emit('debug-draw-changed', enabled);
  }

  /**
   * Set gravity
   */
  setGravity(gravity: Point | Vector3): void {
    this.gravity = gravity;
  }

  /**
   * Set time step
   */
  setTimeStep(timeStep: number): void {
    this.timeStep = timeStep;
  }

  /**
   * Optimize for mobile devices
   */
  optimizeForMobile(): void {
    // Configure solver for mobile (if supported)
    // Note: Cannon.js solver configuration is limited
    
    // Use simpler broadphase for better performance
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    
    // Enable sleeping for better performance
    this.world.allowSleep = true;
    // Note: sleepSpeedLimit and sleepTimeLimit are configured per-body in Cannon.js
    // Set default sleep thresholds for bodies created in this world

    this.emit('mobile-optimized');
  }

  /**
   * Destroy the world
   */
  destroy(): void {
    this.stop();
    this.clear();
    
    this.bodies.clear();
    this.constraints.clear();
    
    this.emit('destroyed');
  }

  /**
   * Get the native Cannon.js world
   */
  getNativeWorld(): CANNON.World {
    return this.world;
  }

  /**
   * Initialize world properties
   */
  private initializeWorld(): void {
    // Set gravity
    if (this.config.gravity) {
      this.setGravity(this.config.gravity);
    } else {
      // Default 3D gravity (Y is up)
      this.world.gravity.set(0, -9.82, 0);
    }

    // Configure solver
    // Note: Cannon.js has limited solver configuration options
    // Solver iterations are set during solver creation, not dynamically
    
    // Configure broadphase
    switch (this.config.broadphaseType) {
      case 'sap':
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        break;
      case 'grid':
        this.world.broadphase = new CANNON.GridBroadphase();
        break;
      default:
        this.world.broadphase = new CANNON.NaiveBroadphase();
        break;
    }

    // Configure sleeping
    if (this.config.allowSleep !== undefined) {
      this.world.allowSleep = this.config.allowSleep;
    }

    // Configure bounds if specified
    if (this.config.bounds) {
      // Cannon.js doesn't have built-in world bounds, but we could add collision planes
      Logger.warn('Physics', 'World bounds not implemented for Cannon3DWorld');
    }

    // Enable CCD if requested
    if (this.config.enableCCD) {
      // Cannon.js doesn't have built-in CCD, but we could implement it
      Logger.warn('Physics', 'CCD not implemented for Cannon3DWorld');
    }

    // Optimize for mobile by default
    this.optimizeForMobile();
  }

  /**
   * Setup collision event handlers
   */
  private setupCollisionEvents(): void {
    // Collision begin
    this.world.addEventListener('beginContact', (event: any) => {
      const contact = event.contact as CANNON.ContactEquation;
      const bodyA = this.findPhysicsBody(contact.bi);
      const bodyB = this.findPhysicsBody(contact.bj);
      
      if (bodyA && bodyB) {
        const collisionEvent: CollisionEvent = {
          type: 'collision-start',
          bodyA,
          bodyB,
          contactPoint: {
            x: contact.ri.x + contact.bi.position.x,
            y: contact.ri.y + contact.bi.position.y,
            z: contact.ri.z + contact.bi.position.z
          },
          contactNormal: {
            x: contact.ni.x,
            y: contact.ni.y,
            z: contact.ni.z
          },
          timestamp: Date.now()
        };
        
        this.emit('collision-start', collisionEvent);
        bodyA.emit('collision-start', collisionEvent);
        bodyB.emit('collision-start', collisionEvent);
      }
    });

    // Collision end
    this.world.addEventListener('endContact', (event: any) => {
      const contact = event.contact as CANNON.ContactEquation;
      const bodyA = this.findPhysicsBody(contact.bi);
      const bodyB = this.findPhysicsBody(contact.bj);
      
      if (bodyA && bodyB) {
        const collisionEvent: CollisionEvent = {
          type: 'collision-end',
          bodyA,
          bodyB,
          timestamp: Date.now()
        };
        
        this.emit('collision-end', collisionEvent);
        bodyA.emit('collision-end', collisionEvent);
        bodyB.emit('collision-end', collisionEvent);
      }
    });
  }

  /**
   * Setup collision events for a specific body
   */
  private setupBodyCollisionEvents(body: Cannon3DBody): void {
    // Additional body-specific collision setup could be added here
  }

  /**
   * Find the PhysicsBody wrapper for a native Cannon body
   */
  private findPhysicsBody(nativeBody: CANNON.Body): PhysicsBody | null {
    for (const [id, body] of this.bodies) {
      if (body.getNativeBody() === nativeBody) {
        return body;
      }
    }
    return null;
  }
}