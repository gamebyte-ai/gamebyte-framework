import { EventEmitter } from 'eventemitter3';
import * as CANNON from 'cannon-es';
import {
  PhysicsEngine,
  PhysicsEngineType,
  PhysicsDimension,
  PhysicsWorld,
  PhysicsWorldConfig,
  PhysicsMaterial,
  PhysicsPerformanceMetrics,
  Point,
  Vector3
} from '../../contracts/Physics';
import { Cannon3DWorld } from '../worlds/Cannon3DWorld';

/**
 * Cannon.js 3D physics engine wrapper optimized for mobile games
 */
export class Cannon3DEngine extends EventEmitter implements PhysicsEngine {
  public readonly engineType: PhysicsEngineType = 'cannon';
  public readonly dimension: PhysicsDimension = '3d';

  // Private backing field for mutable state
  private _isInitialized: boolean = false;

  private worlds: Set<Cannon3DWorld> = new Set();
  private bodyPool: CANNON.Body[] = [];
  private constraintPool: CANNON.Constraint[] = [];
  private objectPoolingEnabled = true;
  private maxBodies = 1000;
  private defaultMaterial: PhysicsMaterial = {
    id: 'default',
    name: 'Default Material',
    friction: 0.3,
    restitution: 0.0,
    density: 1.0,
    frictionAir: 0.01,
    frictionStatic: 0.3,
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
   * Initialize the Cannon.js engine
   */
  async initialize(config?: any): Promise<void> {
    try {
      // Cannon.js doesn't require explicit initialization like Matter.js
      // But we can set up global configurations here
      
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
    // Destroy all worlds
    for (const world of this.worlds) {
      world.destroy();
    }
    this.worlds.clear();

    // Clear pools
    this.bodyPool.length = 0;
    this.constraintPool.length = 0;

    this._isInitialized = false;
    this.emit('destroyed');
  }

  /**
   * Create a new 3D physics world
   */
  createWorld(config: PhysicsWorldConfig): PhysicsWorld {
    const world = new Cannon3DWorld(this, config);
    this.worlds.add(world);
    
    this.emit('world-created', world);
    return world;
  }

  /**
   * Destroy a physics world
   */
  destroyWorld(world: PhysicsWorld): void {
    if (world instanceof Cannon3DWorld) {
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
      friction: config.friction ?? 0.3,
      restitution: config.restitution ?? 0.0,
      density: config.density ?? 1.0,
      frictionAir: config.frictionAir ?? 0.01,
      frictionStatic: config.frictionStatic ?? 0.3,
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
    switch (deviceTier) {
      case 'low':
        // Reduce quality for low-end devices
        this.maxBodies = 300;
        break;

      case 'medium':
        // Balanced settings
        this.maxBodies = 500;
        break;

      case 'high':
        // High quality for powerful devices
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
   * Get a body from the pool or create a new one
   */
  getPooledBody(): CANNON.Body | null {
    if (this.objectPoolingEnabled && this.bodyPool.length > 0) {
      return this.bodyPool.pop()!;
    }
    return null;
  }

  /**
   * Return a body to the pool
   */
  returnBodyToPool(body: CANNON.Body): void {
    if (this.objectPoolingEnabled && this.bodyPool.length < this.maxBodies) {
      // Reset body properties
      body.position.set(0, 0, 0);
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
      body.quaternion.set(0, 0, 0, 1);
      body.force.set(0, 0, 0);
      body.torque.set(0, 0, 0);
      
      this.bodyPool.push(body);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PhysicsPerformanceMetrics {
    // Update metrics from all worlds
    let totalBodies = 0;
    let totalConstraints = 0;
    let totalActiveBodies = 0;
    let totalSleepingBodies = 0;

    for (const world of this.worlds) {
      const metrics = world.getPerformanceMetrics();
      totalBodies += metrics.bodyCount;
      totalConstraints += metrics.constraintCount;
      totalActiveBodies += metrics.activeBodies;
      totalSleepingBodies += metrics.sleepingBodies;
    }

    this.performanceMetrics.bodyCount = totalBodies;
    this.performanceMetrics.constraintCount = totalConstraints;
    this.performanceMetrics.activeBodies = totalActiveBodies;
    this.performanceMetrics.sleepingBodies = totalSleepingBodies;

    return this.performanceMetrics;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(deltaTime: number, stepTime: number): void {
    this.performanceMetrics.averageStepTime = (this.performanceMetrics.averageStepTime * 0.9) + (stepTime * 0.1);
    
    // Estimate memory usage (rough calculation)
    const bodyMemory = this.performanceMetrics.bodyCount * 512; // ~512 bytes per 3D body
    const constraintMemory = this.performanceMetrics.constraintCount * 256; // ~256 bytes per constraint
    this.performanceMetrics.memoryUsage = bodyMemory + constraintMemory;
  }

  /**
   * Create a Cannon.js material from physics material
   */
  createCannonMaterial(physicsMaterial: PhysicsMaterial): CANNON.Material {
    const material = new CANNON.Material(physicsMaterial.id);
    material.friction = physicsMaterial.friction;
    material.restitution = physicsMaterial.restitution;
    return material;
  }


  /**
   * Optimize engine for mobile devices
   */
  private optimizeForMobile(): void {
    // Mobile optimization settings
    // These would be applied to individual worlds when created
    this.emit('mobile-optimized');
  }
}