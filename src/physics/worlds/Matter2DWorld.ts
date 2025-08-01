import { EventEmitter } from 'eventemitter3';
import Matter from 'matter-js';
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
import { Matter2DEngine } from '../engines/Matter2DEngine';
import { Matter2DBody } from '../bodies/Matter2DBody';
import { Matter2DConstraint } from '../constraints/Matter2DConstraint';

/**
 * Matter.js 2D physics world implementation
 */
export class Matter2DWorld extends EventEmitter implements PhysicsWorld {
  public readonly dimension: PhysicsDimension = '2d';
  public readonly engineType: PhysicsEngineType = 'matter';
  public readonly isRunning: boolean = false;

  private engine: Matter2DEngine;
  private world: Matter.World;
  private runner: Matter.Runner | null = null;
  private bodies: Map<string, Matter2DBody> = new Map();
  private constraints: Map<string, Matter2DConstraint> = new Map();
  private config: PhysicsWorldConfig;
  private lastStepTime = 0;
  private paused = false;

  constructor(engine: Matter2DEngine, config: PhysicsWorldConfig) {
    super();
    this.engine = engine;
    this.config = { ...config };
    
    const nativeEngine = engine.getNativeEngine();
    if (!nativeEngine) {
      throw new Error('Engine is not initialized');
    }
    
    this.world = nativeEngine.world;
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
  get gravity(): Point {
    return {
      x: this.world.gravity.x,
      y: this.world.gravity.y
    };
  }

  /**
   * Set gravity
   */
  set gravity(gravity: Point | Vector3) {
    const point = gravity as Point;
    this.world.gravity.x = point.x;
    this.world.gravity.y = point.y;
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
    const nativeEngine = this.engine.getNativeEngine();
    if (!nativeEngine) {
      return { velocity: 4, position: 3 };
    }
    return {
      velocity: nativeEngine.velocityIterations,
      position: nativeEngine.positionIterations
    };
  }

  /**
   * Set solver iterations
   */
  set iterations(iterations: { velocity: number; position: number }) {
    const nativeEngine = this.engine.getNativeEngine();
    if (nativeEngine) {
      nativeEngine.velocityIterations = iterations.velocity;
      nativeEngine.positionIterations = iterations.position;
    }
  }

  /**
   * Step the physics simulation
   */
  step(deltaTime: number): void {
    if (this.paused) return;

    const startTime = performance.now();
    const nativeEngine = this.engine.getNativeEngine();
    
    if (nativeEngine) {
      // Update engine timing
      nativeEngine.timing.timestamp += deltaTime * 1000;
      
      // Step the engine
      Matter.Engine.update(nativeEngine, deltaTime * 1000);
      
      // Update performance metrics
      const stepTime = performance.now() - startTime;
      this.engine.updatePerformanceMetrics(deltaTime, stepTime);
      this.lastStepTime = stepTime;
    }

    this.emit('step', deltaTime);
  }

  /**
   * Start the physics simulation
   */
  start(): void {
    if (this.isRunning) return;

    const nativeEngine = this.engine.getNativeEngine();
    if (nativeEngine) {
      this.runner = Matter.Runner.create();
      Matter.Runner.run(this.runner, nativeEngine);
      (this as any).isRunning = true;
      this.emit('started');
    }
  }

  /**
   * Stop the physics simulation
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.runner) {
      Matter.Runner.stop(this.runner);
      this.runner = null;
    }
    
    (this as any).isRunning = false;
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
    const body = new Matter2DBody(this.engine, config);
    this.addBody(body);
    return body;
  }

  /**
   * Add a body to the world
   */
  addBody(body: PhysicsBody): void {
    if (!(body instanceof Matter2DBody)) {
      throw new Error('Body must be a Matter2DBody');
    }

    this.bodies.set(body.id, body);
    Matter.World.add(this.world, body.getNativeBody());
    
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
      Matter.World.remove(this.world, bodyInstance.getNativeBody());
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

    const constraint = new Matter2DConstraint(config, bodyA as Matter2DBody, bodyB as Matter2DBody);
    this.addConstraint(constraint);
    return constraint;
  }

  /**
   * Add a constraint to the world
   */
  addConstraint(constraint: PhysicsConstraint): void {
    if (!(constraint instanceof Matter2DConstraint)) {
      throw new Error('Constraint must be a Matter2DConstraint');
    }

    this.constraints.set(constraint.id, constraint);
    Matter.World.add(this.world, constraint.getNativeConstraint());
    
    this.emit('constraint-added', constraint);
  }

  /**
   * Remove a constraint from the world
   */
  removeConstraint(constraint: PhysicsConstraint | string): void {
    const constraintId = typeof constraint === 'string' ? constraint : constraint.id;
    const constraintInstance = this.constraints.get(constraintId);
    
    if (constraintInstance) {
      Matter.World.remove(this.world, constraintInstance.getNativeConstraint());
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
    const results: RaycastResult[] = [];
    const allBodies = this.world.bodies;

    for (const body of allBodies) {
      // Simple ray-body intersection test
      const hit = this.rayIntersectBody(options.from as Point, options.to as Point, body);
      if (hit.hit) {
        const physicsBody = this.findPhysicsBody(body);
        if (physicsBody) {
          results.push({
            hit: true,
            body: physicsBody,
            point: hit.point,
            normal: hit.normal,
            distance: hit.distance,
            fraction: hit.fraction
          });
        }
      }
    }

    // Sort by distance
    results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return results;
  }

  /**
   * Query bodies in AABB
   */
  queryAABB(min: Point | Vector3, max: Point | Vector3): PhysicsBody[] {
    const minPoint = min as Point;
    const maxPoint = max as Point;
    const results: PhysicsBody[] = [];

    for (const [id, body] of this.bodies) {
      const bounds = body.bounds;
      const bodyMin = bounds.min as Point;
      const bodyMax = bounds.max as Point;

      // Check AABB overlap
      if (bodyMin.x <= maxPoint.x && bodyMax.x >= minPoint.x &&
          bodyMin.y <= maxPoint.y && bodyMax.y >= minPoint.y) {
        results.push(body);
      }
    }

    return results;
  }

  /**
   * Query bodies at point
   */
  queryPoint(point: Point | Vector3): PhysicsBody[] {
    const p = point as Point;
    const results: PhysicsBody[] = [];

    for (const [id, body] of this.bodies) {
      const nativeBody = body.getNativeBody();
      if (Matter.Bounds.contains(nativeBody.bounds, p)) {
        // More precise point-in-body test could be added here
        results.push(body);
      }
    }

    return results;
  }

  /**
   * Check collision between two bodies
   */
  checkCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): boolean {
    if (!(bodyA instanceof Matter2DBody) || !(bodyB instanceof Matter2DBody)) {
      return false;
    }

    const nativeA = bodyA.getNativeBody();
    const nativeB = bodyB.getNativeBody();
    
    // Check bounds overlap first
    if (!Matter.Bounds.overlaps(nativeA.bounds, nativeB.bounds)) {
      return false;
    }

    // Use Matter.js collision detection
    const collision = Matter.SAT.collides(nativeA, nativeB);
    return collision.collided;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PhysicsPerformanceMetrics {
    const metrics = this.engine.getPerformanceMetrics();
    metrics.contactCount = this.world.bodies.length; // Simplified
    return metrics;
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
    // Enable sleeping for better performance
    const nativeEngine = this.engine.getNativeEngine();
    if (nativeEngine) {
      nativeEngine.enableSleeping = true;
      
      // Reduce solver iterations for mobile
      nativeEngine.constraintIterations = 1;
      nativeEngine.velocityIterations = 3;
      nativeEngine.positionIterations = 2;
    }

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
   * Get the native Matter.js world
   */
  getNativeWorld(): Matter.World {
    return this.world;
  }

  /**
   * Initialize world properties
   */
  private initializeWorld(): void {
    // Set gravity
    if (this.config.gravity) {
      this.setGravity(this.config.gravity);
    }

    // Configure sleeping if specified
    const nativeEngine = this.engine.getNativeEngine();
    if (nativeEngine && this.config.allowSleep !== undefined) {
      nativeEngine.enableSleeping = this.config.allowSleep;
    }

    // Configure solver iterations
    if (this.config.iterations && nativeEngine) {
      nativeEngine.velocityIterations = this.config.iterations.velocity;
      nativeEngine.positionIterations = this.config.iterations.position;
    }
  }

  /**
   * Setup collision event handlers
   */
  private setupCollisionEvents(): void {
    const nativeEngine = this.engine.getNativeEngine();
    if (!nativeEngine) return;

    // Collision start
    Matter.Events.on(nativeEngine, 'collisionStart', (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const bodyA = this.findPhysicsBody(pair.bodyA);
        const bodyB = this.findPhysicsBody(pair.bodyB);
        
        if (bodyA && bodyB) {
          const collisionEvent: CollisionEvent = {
            type: 'collision-start',
            bodyA,
            bodyB,
            contactPoint: { x: pair.collision.supports[0].x, y: pair.collision.supports[0].y },
            contactNormal: { x: pair.collision.normal.x, y: pair.collision.normal.y },
            timestamp: Date.now()
          };
          
          this.emit('collision-start', collisionEvent);
          bodyA.emit('collision-start', collisionEvent);
          bodyB.emit('collision-start', collisionEvent);
        }
      }
    });

    // Collision end
    Matter.Events.on(nativeEngine, 'collisionEnd', (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const bodyA = this.findPhysicsBody(pair.bodyA);
        const bodyB = this.findPhysicsBody(pair.bodyB);
        
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
      }
    });

    // Collision active
    Matter.Events.on(nativeEngine, 'collisionActive', (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const bodyA = this.findPhysicsBody(pair.bodyA);
        const bodyB = this.findPhysicsBody(pair.bodyB);
        
        if (bodyA && bodyB) {
          const collisionEvent: CollisionEvent = {
            type: 'collision-active',
            bodyA,
            bodyB,
            contactPoint: { x: pair.collision.supports[0].x, y: pair.collision.supports[0].y },
            contactNormal: { x: pair.collision.normal.x, y: pair.collision.normal.y },
            timestamp: Date.now()
          };
          
          this.emit('collision-active', collisionEvent);
          bodyA.emit('collision-active', collisionEvent);
          bodyB.emit('collision-active', collisionEvent);
        }
      }
    });
  }

  /**
   * Setup collision events for a specific body
   */
  private setupBodyCollisionEvents(body: Matter2DBody): void {
    // Additional body-specific collision setup could be added here
  }

  /**
   * Find the PhysicsBody wrapper for a native Matter body
   */
  private findPhysicsBody(nativeBody: Matter.Body): PhysicsBody | null {
    for (const [id, body] of this.bodies) {
      if (body.getNativeBody() === nativeBody) {
        return body;
      }
    }
    return null;
  }

  /**
   * Perform ray-body intersection test
   */
  private rayIntersectBody(from: Point, to: Point, body: Matter.Body): {
    hit: boolean;
    point?: Point;
    normal?: Point;
    distance?: number;
    fraction?: number;
  } {
    // Simple bounds check first
    if (!this.rayIntersectBounds(from, to, body.bounds)) {
      return { hit: false };
    }

    // For now, just return bounds intersection
    // More precise shape intersection could be implemented
    const centerX = (body.bounds.min.x + body.bounds.max.x) / 2;
    const centerY = (body.bounds.min.y + body.bounds.max.y) / 2;
    
    const dx = centerX - from.x;
    const dy = centerY - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return {
      hit: true,
      point: { x: centerX, y: centerY },
      normal: { x: dx / distance, y: dy / distance },
      distance,
      fraction: distance / Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2)
    };
  }

  /**
   * Check if ray intersects bounds
   */
  private rayIntersectBounds(from: Point, to: Point, bounds: Matter.Bounds): boolean {
    // Simple AABB ray intersection
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    const txMin = (bounds.min.x - from.x) / dx;
    const txMax = (bounds.max.x - from.x) / dx;
    const tyMin = (bounds.min.y - from.y) / dy;
    const tyMax = (bounds.max.y - from.y) / dy;
    
    const tMin = Math.max(Math.min(txMin, txMax), Math.min(tyMin, tyMax));
    const tMax = Math.min(Math.max(txMin, txMax), Math.max(tyMin, tyMax));
    
    return tMax >= 0 && tMin <= tMax && tMin <= 1;
  }
}