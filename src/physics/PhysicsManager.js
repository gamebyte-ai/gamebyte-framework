"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsManager = void 0;
const eventemitter3_1 = require("eventemitter3");
const Matter2DEngine_1 = require("./engines/Matter2DEngine");
const Cannon3DEngine_1 = require("./engines/Cannon3DEngine");
const PlatformerHelper_1 = require("./helpers/PlatformerHelper");
const TopDownHelper_1 = require("./helpers/TopDownHelper");
const TriggerZone_1 = require("./helpers/TriggerZone");
const ParticleSystem_1 = require("./helpers/ParticleSystem");
const MobileOptimizer_1 = require("./optimization/MobileOptimizer");
/**
 * Unified physics manager that handles both 2D and 3D physics
 */
class PhysicsManager extends eventemitter3_1.EventEmitter {
    constructor() {
        super();
        this.isInitialized = false;
        this.currentWorld = null;
        this.dimension = null;
        this.engine2D = null;
        this.engine3D = null;
        this.currentEngine = null;
        this.activeWorld = null;
        this.worlds = new Set();
        this.materials = new Map();
        this.deviceTier = 'medium';
        this.mobileOptimizer = new MobileOptimizer_1.GameByteMobileOptimizer();
        this.detectDeviceTier();
    }
    /**
     * Get current performance metrics
     */
    get performanceMetrics() {
        if (this.currentEngine) {
            return this.currentEngine.getPerformanceMetrics();
        }
        return this.getEmptyMetrics();
    }
    /**
     * Initialize the physics manager
     */
    async initialize(dimension, engineType) {
        try {
            this.dimension = dimension;
            // Initialize the appropriate engine
            if (dimension === '2d') {
                this.engine2D = new Matter2DEngine_1.Matter2DEngine();
                await this.engine2D.initialize();
                this.currentEngine = this.engine2D;
            }
            else {
                const engine = engineType || 'cannon';
                if (engine === 'cannon') {
                    this.engine3D = new Cannon3DEngine_1.Cannon3DEngine();
                    await this.engine3D.initialize();
                    this.currentEngine = this.engine3D;
                }
                else {
                    throw new Error(`Unsupported 3D engine: ${engine}`);
                }
            }
            // Optimize for detected device tier
            this.currentEngine.optimizeForDevice(this.deviceTier);
            // Initialize default materials
            this.initializeDefaultMaterials();
            this.isInitialized = true;
            this.emit('initialized', { dimension, engineType });
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Destroy the physics manager
     */
    destroy() {
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
        this.currentWorld = null;
        this.dimension = null;
        this.isInitialized = false;
        this.materials.clear();
        this.emit('destroyed');
    }
    /**
     * Create a physics world
     */
    createWorld(config) {
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
    setActiveWorld(world) {
        if (!this.worlds.has(world)) {
            throw new Error('World is not managed by this physics manager');
        }
        const previousWorld = this.activeWorld;
        this.activeWorld = world;
        this.currentWorld = world;
        this.emit('active-world-changed', { previous: previousWorld, current: world });
    }
    /**
     * Get the active physics world
     */
    getActiveWorld() {
        return this.activeWorld;
    }
    /**
     * Destroy a physics world
     */
    destroyWorld(world) {
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
            this.currentWorld = null;
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
    async switchEngine(engineType) {
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
    getCurrentEngine() {
        return this.currentEngine;
    }
    /**
     * Create a platformer physics helper
     */
    createPlatformerHelper(character) {
        return new PlatformerHelper_1.GameBytePlatformerHelper(character, this.activeWorld);
    }
    /**
     * Create a top-down physics helper
     */
    createTopDownHelper(character) {
        return new TopDownHelper_1.GameByteTopDownHelper(character, this.activeWorld);
    }
    /**
     * Create a trigger zone
     */
    createTriggerZone(config) {
        if (!this.activeWorld) {
            throw new Error('No active physics world');
        }
        return new TriggerZone_1.GameByteTriggerZone(this.activeWorld, config);
    }
    /**
     * Create a particle system
     */
    createParticleSystem(config) {
        if (!this.activeWorld) {
            throw new Error('No active physics world');
        }
        return new ParticleSystem_1.GameByteParticleSystem(this.activeWorld, config);
    }
    /**
     * Get the mobile optimizer
     */
    getMobileOptimizer() {
        return this.mobileOptimizer;
    }
    /**
     * Enable mobile optimizations
     */
    enableMobileOptimizations() {
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
    setDeviceTier(tier) {
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
    createMaterial(config) {
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
    getMaterial(id) {
        return this.materials.get(id) || null;
    }
    /**
     * Register a material
     */
    registerMaterial(material) {
        this.materials.set(material.id, material);
        this.emit('material-registered', material);
    }
    /**
     * Update all physics worlds
     */
    update(deltaTime) {
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
    getPerformanceMetrics() {
        return this.performanceMetrics;
    }
    /**
     * Enable debug mode
     */
    enableDebugMode(enabled) {
        if (this.activeWorld) {
            this.activeWorld.enableDebugDraw(enabled);
        }
        this.emit('debug-mode-changed', enabled);
    }
    /**
     * Optimize for mobile devices
     */
    optimizeForMobile() {
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
    initializeDefaultMaterials() {
        if (!this.currentEngine)
            return;
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
    detectDeviceTier() {
        // Simple device tier detection based on available metrics
        const memory = navigator.deviceMemory || 4; // GB
        const cores = navigator.hardwareConcurrency || 4;
        const userAgent = navigator.userAgent.toLowerCase();
        // Check for mobile devices
        const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        if (isMobile) {
            // Mobile device tier detection
            if (memory <= 2 || cores <= 2) {
                this.deviceTier = 'low';
            }
            else if (memory <= 4 || cores <= 4) {
                this.deviceTier = 'medium';
            }
            else {
                this.deviceTier = 'high';
            }
        }
        else {
            // Desktop device tier detection
            if (memory <= 4 || cores <= 2) {
                this.deviceTier = 'medium';
            }
            else {
                this.deviceTier = 'high';
            }
        }
        this.emit('device-tier-detected', this.deviceTier);
    }
    /**
     * Get empty performance metrics
     */
    getEmptyMetrics() {
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
exports.PhysicsManager = PhysicsManager;
