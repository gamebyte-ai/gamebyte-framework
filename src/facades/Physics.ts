import { Facade } from './Facade';
import {
  PhysicsManager,
  PhysicsDimension,
  PhysicsEngineType,
  PhysicsWorld,
  PhysicsWorldConfig,
  PhysicsBody,
  PhysicsBodyConfig,
  PhysicsMaterial,
  PlatformerPhysicsHelper,
  TopDownPhysicsHelper,
  TriggerZone,
  PhysicsParticleSystem,
  MobilePhysicsOptimizer,
  PhysicsPerformanceMetrics
} from '../contracts/Physics';

/**
 * Physics facade for easy access to physics functionality
 */
export class Physics extends Facade {
  /**
   * Get the facade accessor key
   */
  protected static getFacadeAccessor(): string {
    return 'physics';
  }

  /**
   * Get the physics manager instance
   */
  private static getManager(): PhysicsManager {
    return this.resolve<PhysicsManager>();
  }

  /**
   * Initialize the physics system
   */
  static async initialize(dimension: PhysicsDimension, engineType?: PhysicsEngineType): Promise<void> {
    const manager = this.getManager();
    return manager.initialize(dimension, engineType);
  }

  /**
   * Create a physics world
   */
  static createWorld(config: PhysicsWorldConfig): PhysicsWorld {
    const manager = this.getManager();
    return manager.createWorld(config);
  }

  /**
   * Get the active physics world
   */
  static getActiveWorld(): PhysicsWorld | null {
    const manager = this.getManager();
    return manager.getActiveWorld();
  }

  /**
   * Set the active physics world
   */
  static setActiveWorld(world: PhysicsWorld): void {
    const manager = this.getManager();
    manager.setActiveWorld(world);
  }

  /**
   * Create a physics body in the active world
   */
  static createBody(config: PhysicsBodyConfig): PhysicsBody {
    const world = this.getActiveWorld();
    if (!world) {
      throw new Error('No active physics world. Create a world first.');
    }
    return world.createBody(config);
  }

  /**
   * Create a physics material
   */
  static createMaterial(config: Partial<PhysicsMaterial>): PhysicsMaterial {
    const manager = this.getManager();
    return manager.createMaterial(config);
  }

  /**
   * Get a material by ID
   */
  static getMaterial(id: string): PhysicsMaterial | null {
    const manager = this.getManager();
    return manager.getMaterial(id);
  }

  /**
   * Create a platformer physics helper
   */
  static createPlatformerHelper(character: PhysicsBody): PlatformerPhysicsHelper {
    const manager = this.getManager();
    return manager.createPlatformerHelper(character);
  }

  /**
   * Create a top-down physics helper
   */
  static createTopDownHelper(character: PhysicsBody): TopDownPhysicsHelper {
    const manager = this.getManager();
    return manager.createTopDownHelper(character);
  }

  /**
   * Create a trigger zone
   */
  static createTriggerZone(config: PhysicsBodyConfig): TriggerZone {
    const manager = this.getManager();
    return manager.createTriggerZone(config);
  }

  /**
   * Create a particle system
   */
  static createParticleSystem(config: any): PhysicsParticleSystem {
    const manager = this.getManager();
    return manager.createParticleSystem(config);
  }

  /**
   * Get the mobile optimizer
   */
  static getMobileOptimizer(): MobilePhysicsOptimizer {
    const manager = this.getManager();
    return manager.getMobileOptimizer();
  }

  /**
   * Enable mobile optimizations
   */
  static enableMobileOptimizations(): void {
    const manager = this.getManager();
    manager.enableMobileOptimizations();
  }

  /**
   * Set device tier for optimization
   */
  static setDeviceTier(tier: 'low' | 'medium' | 'high'): void {
    const manager = this.getManager();
    manager.setDeviceTier(tier);
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(): PhysicsPerformanceMetrics {
    const manager = this.getManager();
    return manager.getPerformanceMetrics();
  }

  /**
   * Enable debug mode
   */
  static enableDebugMode(enabled: boolean): void {
    const manager = this.getManager();
    manager.enableDebugMode(enabled);
  }

  /**
   * Optimize for mobile devices
   */
  static optimizeForMobile(): void {
    const manager = this.getManager();
    manager.optimizeForMobile();
  }

  /**
   * Switch physics engine
   */
  static async switchEngine(engineType: PhysicsEngineType): Promise<void> {
    const manager = this.getManager();
    return manager.switchEngine(engineType);
  }

  /**
   * Check if physics is initialized
   */
  static isInitialized(): boolean {
    const manager = this.getManager();
    return manager.isInitialized;
  }

  /**
   * Get current dimension
   */
  static getDimension(): PhysicsDimension | null {
    const manager = this.getManager();
    return manager.dimension;
  }

  /**
   * Perform a raycast in the active world
   */
  static raycast(options: any): any[] {
    const world = this.getActiveWorld();
    if (!world) {
      throw new Error('No active physics world. Create a world first.');
    }
    return world.raycast(options);
  }

  /**
   * Query bodies in AABB in the active world
   */
  static queryAABB(min: any, max: any): PhysicsBody[] {
    const world = this.getActiveWorld();
    if (!world) {
      throw new Error('No active physics world. Create a world first.');
    }
    return world.queryAABB(min, max);
  }

  /**
   * Query bodies at point in the active world
   */
  static queryPoint(point: any): PhysicsBody[] {
    const world = this.getActiveWorld();
    if (!world) {
      throw new Error('No active physics world. Create a world first.');
    }
    return world.queryPoint(point);
  }

  /**
   * Start the active physics world
   */
  static start(): void {
    const world = this.getActiveWorld();
    if (world) {
      world.start();
    }
  }

  /**
   * Stop the active physics world
   */
  static stop(): void {
    const world = this.getActiveWorld();
    if (world) {
      world.stop();
    }
  }

  /**
   * Pause the active physics world
   */
  static pause(): void {
    const world = this.getActiveWorld();
    if (world) {
      world.pause();
    }
  }

  /**
   * Resume the active physics world
   */
  static resume(): void {
    const world = this.getActiveWorld();
    if (world) {
      world.resume();
    }
  }

  /**
   * Clear all bodies and constraints from the active world
   */
  static clear(): void {
    const world = this.getActiveWorld();
    if (world) {
      world.clear();
    }
  }
}