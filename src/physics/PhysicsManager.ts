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

/**
 * Unified physics manager that handles both 2D and 3D physics
 */
export class PhysicsManager extends EventEmitter implements IPhysicsManager {
  public readonly isInitialized: boolean = false;
  public readonly currentWorld: PhysicsWorld | null = null;
  public readonly dimension: PhysicsDimension | null = null;

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
      (this as any).dimension = dimension;
      
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

      (this as any).isInitialized = true;
      this.emit('initialized', { dimension, engineType });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
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
    (this as any).currentWorld = null;
    (this as any).dimension = null;
    (this as any).isInitialized = false;

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
    (this as any).currentWorld = world;

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
      (this as any).currentWorld = null;
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
   * Create a platformer physics helper
   */
  createPlatformerHelper(character: PhysicsBody): PlatformerPhysicsHelper {
    return new GameBytePlatformerHelper(character, this.activeWorld!);
  }

  /**
   * Create a top-down physics helper
   */
  createTopDownHelper(character: PhysicsBody): TopDownPhysicsHelper {
    return new GameByteTopDownHelper(character, this.activeWorld!);
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
   */
  private detectDeviceTier(): void {
    // Simple device tier detection based on available metrics
    const memory = (navigator as any).deviceMemory || 4; // GB
    const cores = navigator.hardwareConcurrency || 4;
    const userAgent = navigator.userAgent.toLowerCase();

    // Check for mobile devices
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    if (isMobile) {
      // Mobile device tier detection
      if (memory <= 2 || cores <= 2) {
        this.deviceTier = 'low';
      } else if (memory <= 4 || cores <= 4) {
        this.deviceTier = 'medium';
      } else {
        this.deviceTier = 'high';
      }
    } else {
      // Desktop device tier detection
      if (memory <= 4 || cores <= 2) {
        this.deviceTier = 'medium';
      } else {
        this.deviceTier = 'high';
      }
    }

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