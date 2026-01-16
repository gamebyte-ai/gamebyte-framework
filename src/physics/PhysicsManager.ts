import { EventEmitter } from 'eventemitter3';
import {
  PhysicsManager as IPhysicsManager,
  PhysicsDimension,
  PhysicsEngineType,
  PhysicsEngine,
  PhysicsWorld,
  PhysicsWorldConfig,
  PhysicsMaterial,
  PhysicsPerformanceMetrics,
  PhysicsBody,
  PhysicsBodyConfig,
  PhysicsShapeConfig,
  SimpleBodyConfig,
  Point,
  PlatformerPhysicsHelper,
  TopDownPhysicsHelper,
  TriggerZone,
  PhysicsParticleSystem,
  MobilePhysicsOptimizer
} from '../contracts/Physics';
import { Matter2DEngine } from './engines/Matter2DEngine';
import { Cannon3DEngine } from './engines/Cannon3DEngine';
import { GameBytePlatformerHelper } from './helpers/PlatformerHelper';
import { GameByteTopDownHelper } from './helpers/TopDownHelper';
import { GameByteTriggerZone } from './helpers/TriggerZone';
import { GameByteParticleSystem } from './helpers/ParticleSystem';
import { GameByteMobileOptimizer } from './optimization/MobileOptimizer';
import { DeviceDetector } from '../performance/DeviceDetector';

/**
 * Unified physics manager that handles both 2D and 3D physics
 */
export class PhysicsManager extends EventEmitter implements IPhysicsManager {
  // Private backing fields for public readonly properties
  private _isInitialized: boolean = false;
  private _currentWorld: PhysicsWorld | null = null;
  private _dimension: PhysicsDimension | null = null;

  private engine2D: Matter2DEngine | null = null;
  private engine3D: Cannon3DEngine | null = null;
  private currentEngine: PhysicsEngine | null = null;
  private activeWorld: PhysicsWorld | null = null;
  private worlds: Set<PhysicsWorld> = new Set();
  private materials: Map<string, PhysicsMaterial> = new Map();
  private mobileOptimizer: GameByteMobileOptimizer;
  private deviceTier: 'low' | 'medium' | 'high' = 'medium';

  constructor() {
    super();
    this.mobileOptimizer = new GameByteMobileOptimizer();
    this.detectDeviceTier();
  }

  // Public getters for readonly access
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get currentWorld(): PhysicsWorld | null {
    return this._currentWorld;
  }

  get dimension(): PhysicsDimension | null {
    return this._dimension;
  }

  /**
   * Get current performance metrics
   */
  get performanceMetrics(): PhysicsPerformanceMetrics {
    if (this.currentEngine) {
      return this.currentEngine.getPerformanceMetrics();
    }
    return this.getEmptyMetrics();
  }

  /**
   * Initialize the physics manager
   */
  async initialize(dimension: PhysicsDimension, engineType?: PhysicsEngineType): Promise<void> {
    try {
      this._dimension = dimension;

      // Initialize the appropriate engine
      if (dimension === '2d') {
        this.engine2D = new Matter2DEngine();
        await this.engine2D.initialize();
        this.currentEngine = this.engine2D;
      } else {
        const engine = engineType || 'cannon';
        if (engine === 'cannon') {
          this.engine3D = new Cannon3DEngine();
          await this.engine3D.initialize();
          this.currentEngine = this.engine3D;
        } else {
          throw new Error(`Unsupported 3D engine: ${engine}`);
        }
      }

      // Optimize for detected device tier
      this.currentEngine.optimizeForDevice(this.deviceTier);

      // Initialize default materials
      this.initializeDefaultMaterials();

      // Create a default physics world automatically
      this.createDefaultWorld(dimension);

      this._isInitialized = true;
      this.emit('initialized', { dimension, engineType });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create the default physics world
   */
  private createDefaultWorld(dimension: PhysicsDimension): void {
    const defaultConfig: PhysicsWorldConfig = {
      dimension,
      gravity: dimension === '2d'
        ? { x: 0, y: 1 }  // 2D: positive Y is down (screen coordinates)
        : { x: 0, y: -9.81, z: 0 },  // 3D: negative Y is down (world coordinates)
      allowSleep: true,
      iterations: { velocity: 4, position: 3 }
    };

    const world = this.createWorld(defaultConfig);

    // Start the world immediately so physics simulation runs
    world.start();
  }

  /**
   * Destroy the physics manager
   */
  destroy(): void {
    // Destroy all worlds
    for (const world of this.worlds) {
      world.destroy();
    }
    this.worlds.clear();

    // Destroy engines
    if (this.engine2D) {
      this.engine2D.destroy();
      this.engine2D = null;
    }
    if (this.engine3D) {
      this.engine3D.destroy();
      this.engine3D = null;
    }

    this.currentEngine = null;
    this.activeWorld = null;
    this._currentWorld = null;
    this._dimension = null;
    this._isInitialized = false;

    this.materials.clear();
    this.emit('destroyed');
  }

  /**
   * Create a physics world
   */
  createWorld(config: PhysicsWorldConfig): PhysicsWorld {
    if (!this.currentEngine) {
      throw new Error('Physics manager not initialized');
    }

    // Ensure config dimension matches manager dimension
    if (config.dimension !== this.dimension) {
      throw new Error(`World dimension ${config.dimension} doesn't match manager dimension ${this.dimension}`);
    }

    const world = this.currentEngine.createWorld(config);
    this.worlds.add(world);

    // Set as active world if it's the first one
    if (!this.activeWorld) {
      this.setActiveWorld(world);
    }

    this.emit('world-created', world);
    return world;
  }

  /**
   * Set the active physics world
   */
  setActiveWorld(world: PhysicsWorld): void {
    if (!this.worlds.has(world)) {
      throw new Error('World is not managed by this physics manager');
    }

    const previousWorld = this.activeWorld;
    this.activeWorld = world;
    this._currentWorld = world;

    this.emit('active-world-changed', { previous: previousWorld, current: world });
  }

  /**
   * Get the active physics world
   */
  getActiveWorld(): PhysicsWorld | null {
    return this.activeWorld;
  }

  /**
   * Destroy a physics world
   */
  destroyWorld(world: PhysicsWorld): void {
    if (!this.worlds.has(world)) {
      return;
    }

    // Stop the world if it's running
    if (world.isRunning) {
      world.stop();
    }

    // Remove from active if it's the current one
    if (this.activeWorld === world) {
      this.activeWorld = null;
      this._currentWorld = null;
    }

    // Destroy and remove
    world.destroy();
    this.worlds.delete(world);

    if (this.currentEngine) {
      this.currentEngine.destroyWorld(world);
    }

    this.emit('world-destroyed', world);
  }

  /**
   * Switch physics engine
   */
  async switchEngine(engineType: PhysicsEngineType): Promise<void> {
    if (!this.dimension) {
      throw new Error('Physics manager not initialized');
    }

    // Validate engine compatibility
    if (this.dimension === '2d' && engineType !== 'matter') {
      throw new Error(`Engine ${engineType} is not compatible with 2D physics`);
    }
    if (this.dimension === '3d' && engineType === 'matter') {
      throw new Error('Matter.js engine is not compatible with 3D physics');
    }

    // Save current state
    const wasInitialized = this.isInitialized;
    const currentDimension = this.dimension;

    // Destroy current state
    this.destroy();

    // Reinitialize with new engine
    if (wasInitialized) {
      await this.initialize(currentDimension, engineType);
    }

    this.emit('engine-switched', engineType);
  }

  /**
   * Get the current physics engine
   */
  getCurrentEngine(): PhysicsEngine | null {
    return this.currentEngine;
  }

  /**
   * Create a physics body in the active world
   * Supports both simplified and full config formats
   *
   * @example Simplified format
   * ```typescript
   * const body = physicsManager.createBody({
   *   shape: 'rectangle',
   *   x: 100,
   *   y: 100,
   *   width: 40,
   *   height: 60,
   *   options: { friction: 0.1 }
   * });
   * ```
   *
   * @example Full format
   * ```typescript
   * const body = physicsManager.createBody({
   *   type: 'dynamic',
   *   position: { x: 100, y: 100 },
   *   shapes: [{ type: 'box', dimensions: { x: 40, y: 60 } }]
   * });
   * ```
   */
  createBody(config: SimpleBodyConfig | PhysicsBodyConfig): PhysicsBody {
    if (!this.activeWorld) {
      throw new Error('No active physics world. Create a world first.');
    }

    // Check if it's a simplified config
    if ('shape' in config) {
      const fullConfig = this.convertSimpleToFullConfig(config as SimpleBodyConfig);
      return this.activeWorld.createBody(fullConfig);
    }

    // It's a full config
    return this.activeWorld.createBody(config as PhysicsBodyConfig);
  }

  /**
   * Convert simplified body config to full config format
   */
  private convertSimpleToFullConfig(simple: SimpleBodyConfig): PhysicsBodyConfig {
    const options = simple.options || {};

    // Determine shape type for physics
    let shapeType: 'box' | 'circle' | 'mesh' = 'box';
    if (simple.shape === 'circle') {
      shapeType = 'circle';
    } else if (simple.shape === 'polygon') {
      shapeType = 'mesh';
    }

    // Build dimensions based on shape type
    let dimensions: Point;
    if (simple.shape === 'circle') {
      const radius = simple.radius || 16;
      dimensions = { x: radius * 2, y: radius * 2 };
    } else if (simple.shape === 'polygon' && simple.vertices && simple.vertices.length > 0) {
      // Calculate bounding box from vertices for polygon
      const xs = simple.vertices.map(v => v.x);
      const ys = simple.vertices.map(v => v.y);
      dimensions = {
        x: Math.max(...xs) - Math.min(...xs),
        y: Math.max(...ys) - Math.min(...ys)
      };
    } else {
      dimensions = { x: simple.width || 32, y: simple.height || 32 };
    }

    // Build shape config with vertices for polygon shapes
    const shapeConfig: PhysicsShapeConfig = {
      type: shapeType,
      dimensions,
      radius: simple.shape === 'circle' ? simple.radius : undefined,
      vertices: simple.shape === 'polygon' ? simple.vertices : undefined
    };

    const fullConfig: PhysicsBodyConfig = {
      type: options.isStatic ? 'static' : 'dynamic',
      position: { x: simple.x, y: simple.y },
      shapes: [shapeConfig],
      isStatic: options.isStatic,
      isSensor: options.isSensor,
      rotation: options.angle,
      angularVelocity: options.angularVelocity,
      fixedRotation: options.fixedRotation,
      gravityScale: options.gravityScale,
      collisionGroup: options.collisionGroup,
      collisionMask: options.collisionMask,
      mass: options.mass,
      linearDamping: options.frictionAir,
      userData: options.label ? { label: options.label } : undefined
    };

    // Add material properties if specified
    if (options.friction !== undefined || options.restitution !== undefined || options.density !== undefined) {
      fullConfig.material = {
        id: 'custom',
        name: 'Custom Material',
        friction: options.friction ?? 0.1,
        restitution: options.restitution ?? 0,
        density: options.density ?? 0.001,
        frictionAir: options.frictionAir,
        frictionStatic: options.frictionStatic
      };
    }

    return fullConfig;
  }

  /**
   * Create a platformer physics helper
   */
  createPlatformerHelper(character: PhysicsBody): PlatformerPhysicsHelper {
    if (!this.activeWorld) {
      throw new Error('No active physics world');
    }
    return new GameBytePlatformerHelper(character, this.activeWorld);
  }

  /**
   * Create a top-down physics helper
   */
  createTopDownHelper(character: PhysicsBody): TopDownPhysicsHelper {
    if (!this.activeWorld) {
      throw new Error('No active physics world');
    }
    return new GameByteTopDownHelper(character, this.activeWorld);
  }

  /**
   * Create a trigger zone
   */
  createTriggerZone(config: any): TriggerZone {
    if (!this.activeWorld) {
      throw new Error('No active physics world');
    }
    return new GameByteTriggerZone(this.activeWorld, config);
  }

  /**
   * Create a particle system
   */
  createParticleSystem(config: any): PhysicsParticleSystem {
    if (!this.activeWorld) {
      throw new Error('No active physics world');
    }
    return new GameByteParticleSystem(this.activeWorld, config);
  }

  /**
   * Get the mobile optimizer
   */
  getMobileOptimizer(): MobilePhysicsOptimizer {
    return this.mobileOptimizer;
  }

  /**
   * Enable mobile optimizations
   */
  enableMobileOptimizations(): void {
    this.mobileOptimizer.enableCulling(true);
    this.mobileOptimizer.enableAdaptiveQuality(true);
    this.mobileOptimizer.enableBatteryOptimization(true);
    this.mobileOptimizer.enableObjectPooling(true);
    this.mobileOptimizer.optimizeForDevice();

    // Apply optimizations to current engine
    if (this.currentEngine) {
      this.currentEngine.optimizeForDevice(this.deviceTier);
      this.currentEngine.enableObjectPooling(true);
    }

    this.emit('mobile-optimizations-enabled');
  }

  /**
   * Set device tier for optimization
   */
  setDeviceTier(tier: 'low' | 'medium' | 'high'): void {
    this.deviceTier = tier;
    
    if (this.currentEngine) {
      this.currentEngine.optimizeForDevice(tier);
    }

    this.mobileOptimizer.setDeviceTier?.(tier);
    this.emit('device-tier-changed', tier);
  }

  /**
   * Create a physics material
   */
  createMaterial(config: Partial<PhysicsMaterial>): PhysicsMaterial {
    if (!this.currentEngine) {
      throw new Error('Physics manager not initialized');
    }

    const material = this.currentEngine.createMaterial(config);
    this.materials.set(material.id, material);
    
    this.emit('material-created', material);
    return material;
  }

  /**
   * Get a material by ID
   */
  getMaterial(id: string): PhysicsMaterial | null {
    return this.materials.get(id) || null;
  }

  /**
   * Register a material
   */
  registerMaterial(material: PhysicsMaterial): void {
    this.materials.set(material.id, material);
    this.emit('material-registered', material);
  }

  /**
   * Update all physics worlds
   */
  update(deltaTime: number): void {
    // Update active world
    if (this.activeWorld && this.activeWorld.isRunning) {
      this.activeWorld.step(deltaTime);
    }

    // Update mobile optimizer
    this.mobileOptimizer.update?.(deltaTime);

    this.emit('update', deltaTime);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PhysicsPerformanceMetrics {
    return this.performanceMetrics;
  }

  /**
   * Enable debug mode
   */
  enableDebugMode(enabled: boolean): void {
    if (this.activeWorld) {
      this.activeWorld.enableDebugDraw(enabled);
    }
    this.emit('debug-mode-changed', enabled);
  }

  /**
   * Optimize for mobile devices
   */
  optimizeForMobile(): void {
    this.enableMobileOptimizations();
    
    // Apply mobile-specific world settings
    if (this.activeWorld) {
      this.activeWorld.optimizeForMobile();
    }

    this.emit('mobile-optimized');
  }

  /**
   * Initialize default materials
   */
  private initializeDefaultMaterials(): void {
    if (!this.currentEngine) return;

    // Default material
    const defaultMaterial = this.currentEngine.getDefaultMaterial();
    this.materials.set(defaultMaterial.id, defaultMaterial);

    // Common game materials
    const materials = [
      {
        id: 'bouncy',
        name: 'Bouncy',
        friction: 0.3,
        restitution: 0.8,
        density: 1.0
      },
      {
        id: 'ice',
        name: 'Ice',
        friction: 0.1,
        restitution: 0.1,
        density: 0.9
      },
      {
        id: 'rubber',
        name: 'Rubber',
        friction: 0.8,
        restitution: 0.6,
        density: 1.2
      },
      {
        id: 'metal',
        name: 'Metal',
        friction: 0.4,
        restitution: 0.2,
        density: 7.8
      },
      {
        id: 'wood',
        name: 'Wood',
        friction: 0.6,
        restitution: 0.3,
        density: 0.8
      }
    ];

    for (const config of materials) {
      const material = this.currentEngine.createMaterial(config);
      this.materials.set(material.id, material);
    }
  }

  /**
   * Detect device tier for optimization
   * Uses centralized DeviceDetector for consistent detection across the framework
   */
  private detectDeviceTier(): void {
    this.deviceTier = DeviceDetector.detectTierSync();
    this.emit('device-tier-detected', this.deviceTier);
  }

  /**
   * Get empty performance metrics
   */
  private getEmptyMetrics(): PhysicsPerformanceMetrics {
    return {
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
  }
}