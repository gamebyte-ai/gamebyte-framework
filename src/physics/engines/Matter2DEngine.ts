import { EventEmitter } from 'eventemitter3';
import Matter from 'matter-js';
import {
  PhysicsEngine,
  PhysicsEngineType,
  PhysicsDimension,
  PhysicsWorld,
  PhysicsWorldConfig,
  PhysicsMaterial,
  PhysicsBody,
  PhysicsBodyConfig,
  PhysicsConstraint,
  PhysicsConstraintConfig,
  CollisionEvent,
  RaycastOptions,
  RaycastResult,
  PhysicsPerformanceMetrics,
  Vector3,
  Point
} from '../../contracts/Physics';
import { Matter2DWorld } from '../worlds/Matter2DWorld';

/**
 * Matter.js 2D physics engine wrapper optimized for mobile games
 */
export class Matter2DEngine extends EventEmitter implements PhysicsEngine {
  public readonly engineType: PhysicsEngineType = 'matter';
  public readonly dimension: PhysicsDimension = '2d';

  // Private backing field for mutable state
  private _isInitialized: boolean = false;

  private engine: Matter.Engine | null = null;
  private render: Matter.Render | null = null;
  private runner: Matter.Runner | null = null;
  private worlds: Set<Matter2DWorld> = new Set();
  private bodyPool: Matter.Body[] = [];
  private constraintPool: Matter.Constraint[] = [];
  private objectPoolingEnabled = true;
  private maxBodies = 1000;
  private defaultMaterial: PhysicsMaterial = {
    id: 'default',
    name: 'Default Material',
    friction: 0.1,
    restitution: 0.0,
    density: 0.001,
    frictionAir: 0.01,
    frictionStatic: 0.5,
    damping: 0.1,
    angularDamping: 0.1
  };
  private materials: Map<string, PhysicsMaterial> = new Map();
  private performanceMetrics: PhysicsPerformanceMetrics = {
    averageStepTime: 0,
    bodyCount: 0,
    constraintCount: 0,
    contactCount: 0,
    broadphaseTime: 0,
    narrowphaseTime: 0,
    solverTime: 0,
    memoryUsage: 0,
    sleepingBodies: 0,
    activeBodies: 0,
    culledBodies: 0
  };

  // Public getter for readonly access
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  constructor() {
    super();
    // Initialize materials map with default material
    this.materials.set(this.defaultMaterial.id, this.defaultMaterial);
  }

  /**
   * Initialize the Matter.js engine
   */
  async initialize(config?: any): Promise<void> {
    try {
      // Create the Matter.js engine
      this.engine = Matter.Engine.create({
        gravity: { x: 0, y: 1, scale: 0.001 },
        timing: {
          timeScale: 1,
          timestamp: 0
        }
      });
      
      // Configure broadphase separately (grid broadphase for better mobile performance)
      if (this.engine.broadphase && typeof this.engine.broadphase === 'object') {
        (this.engine.broadphase as any).detector = Matter.Detector.canCollide;
      }

      // Configure for mobile optimization
      this.optimizeForMobile();

      this._isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Destroy the engine and clean up resources
   */
  destroy(): void {
    if (this.runner) {
      Matter.Runner.stop(this.runner);
      this.runner = null;
    }

    if (this.render) {
      Matter.Render.stop(this.render);
      this.render = null;
    }

    // Destroy all worlds
    for (const world of this.worlds) {
      world.destroy();
    }
    this.worlds.clear();

    // Clear pools
    this.bodyPool.length = 0;
    this.constraintPool.length = 0;

    this.engine = null;
    this._isInitialized = false;
    this.emit('destroyed');
  }

  /**
   * Create a new 2D physics world
   */
  createWorld(config: PhysicsWorldConfig): PhysicsWorld {
    if (!this.engine) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    const world = new Matter2DWorld(this, config);
    this.worlds.add(world);
    
    this.emit('world-created', world);
    return world;
  }

  /**
   * Destroy a physics world
   */
  destroyWorld(world: PhysicsWorld): void {
    if (world instanceof Matter2DWorld) {
      this.worlds.delete(world);
      world.destroy();
      this.emit('world-destroyed', world);
    }
  }

  /**
   * Create a physics material
   */
  createMaterial(config: Partial<PhysicsMaterial>): PhysicsMaterial {
    const material: PhysicsMaterial = {
      id: config.id || `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name || 'Unnamed Material',
      friction: config.friction ?? 0.1,
      restitution: config.restitution ?? 0.0,
      density: config.density ?? 0.001,
      frictionAir: config.frictionAir ?? 0.01,
      frictionStatic: config.frictionStatic ?? 0.5,
      damping: config.damping ?? 0.1,
      angularDamping: config.angularDamping ?? 0.1
    };

    this.materials.set(material.id, material);
    return material;
  }

  /**
   * Get the default physics material
   */
  getDefaultMaterial(): PhysicsMaterial {
    return this.defaultMaterial;
  }

  /**
   * Get a material by ID
   */
  getMaterial(id: string): PhysicsMaterial | null {
    return this.materials.get(id) || null;
  }

  /**
   * Optimize engine for different device tiers
   */
  optimizeForDevice(deviceTier: 'low' | 'medium' | 'high'): void {
    if (!this.engine) return;

    switch (deviceTier) {
      case 'low':
        // Reduce quality for low-end devices
        this.engine.constraintIterations = 1;
        this.engine.velocityIterations = 2;
        this.engine.positionIterations = 2;
        this.maxBodies = 500;
        break;

      case 'medium':
        // Balanced settings
        this.engine.constraintIterations = 2;
        this.engine.velocityIterations = 4;
        this.engine.positionIterations = 3;
        this.maxBodies = 750;
        break;

      case 'high':
        // High quality for powerful devices
        this.engine.constraintIterations = 3;
        this.engine.velocityIterations = 6;
        this.engine.positionIterations = 4;
        this.maxBodies = 1000;
        break;
    }

    this.emit('device-optimized', deviceTier);
  }

  /**
   * Enable or disable object pooling
   */
  enableObjectPooling(enabled: boolean): void {
    this.objectPoolingEnabled = enabled;
    if (!enabled) {
      this.bodyPool.length = 0;
      this.constraintPool.length = 0;
    }
    this.emit('object-pooling-changed', enabled);
  }

  /**
   * Set maximum number of bodies
   */
  setMaxBodies(maxBodies: number): void {
    this.maxBodies = maxBodies;
    // Trim pool if necessary
    if (this.bodyPool.length > maxBodies) {
      this.bodyPool.length = maxBodies;
    }
  }

  /**
   * Get the native Matter.js engine
   */
  getNativeEngine(): Matter.Engine | null {
    return this.engine;
  }

  /**
   * Get a body from the pool or create a new one
   */
  getPooledBody(): Matter.Body | null {
    if (this.objectPoolingEnabled && this.bodyPool.length > 0) {
      return this.bodyPool.pop()!;
    }
    return null;
  }

  /**
   * Return a body to the pool
   */
  returnBodyToPool(body: Matter.Body): void {
    if (this.objectPoolingEnabled && this.bodyPool.length < this.maxBodies) {
      // Reset body properties
      Matter.Body.setPosition(body, { x: 0, y: 0 });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
      Matter.Body.setAngle(body, 0);
      
      this.bodyPool.push(body);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PhysicsPerformanceMetrics {
    if (!this.engine) {
      return this.performanceMetrics;
    }

    // Update metrics
    this.performanceMetrics.bodyCount = this.engine.world.bodies.length;
    this.performanceMetrics.constraintCount = this.engine.world.constraints.length;
    this.performanceMetrics.activeBodies = this.engine.world.bodies.filter(body => !body.isSleeping).length;
    this.performanceMetrics.sleepingBodies = this.engine.world.bodies.filter(body => body.isSleeping).length;

    return this.performanceMetrics;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(deltaTime: number, stepTime: number): void {
    this.performanceMetrics.averageStepTime = (this.performanceMetrics.averageStepTime * 0.9) + (stepTime * 0.1);
    
    // Estimate memory usage (rough calculation)
    const bodyMemory = this.performanceMetrics.bodyCount * 256; // ~256 bytes per body
    const constraintMemory = this.performanceMetrics.constraintCount * 128; // ~128 bytes per constraint
    this.performanceMetrics.memoryUsage = bodyMemory + constraintMemory;
  }


  /**
   * Optimize engine for mobile devices
   */
  private optimizeForMobile(): void {
    if (!this.engine) return;

    // Enable sleeping for better performance
    this.engine.enableSleeping = true;
    
    // Configure sleep thresholds globally for all bodies
    // Note: Matter.js applies sleep settings per body, not globally
    // These settings will be applied to bodies when they are created

    // Configure broadphase for better mobile performance
    // Note: Broadphase configuration is handled during engine creation
    
    // Optimize timing
    this.engine.timing.timeScale = 1;
    this.engine.constraintIterations = 2;
    this.engine.velocityIterations = 4;
    this.engine.positionIterations = 3;

    // Reduce gravity scale for better mobile performance
    this.engine.world.gravity.scale = 0.001;
  }
}