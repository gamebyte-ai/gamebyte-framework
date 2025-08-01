"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Matter2DEngine = void 0;
const eventemitter3_1 = require("eventemitter3");
const matter_js_1 = require("matter-js");
const Matter2DWorld_1 = require("../worlds/Matter2DWorld");
/**
 * Matter.js 2D physics engine wrapper optimized for mobile games
 */
class Matter2DEngine extends eventemitter3_1.EventEmitter {
    constructor() {
        super();
        this.engineType = 'matter';
        this.dimension = '2d';
        this.isInitialized = false;
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.worlds = new Set();
        this.bodyPool = [];
        this.constraintPool = [];
        this.objectPoolingEnabled = true;
        this.maxBodies = 1000;
        this.materials = new Map();
        this.initializeDefaultMaterial();
        this.initializePerformanceMetrics();
    }
    /**
     * Initialize the Matter.js engine
     */
    async initialize(config) {
        try {
            // Create the Matter.js engine
            this.engine = matter_js_1.default.Engine.create({
                gravity: { x: 0, y: 1, scale: 0.001 },
                timing: {
                    timeScale: 1,
                    timestamp: 0
                },
                broadphase: {
                    current: 'grid' // Use grid broadphase for better mobile performance
                }
            });
            // Configure for mobile optimization
            this.optimizeForMobile();
            this.isInitialized = true;
            this.emit('initialized');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Destroy the engine and clean up resources
     */
    destroy() {
        if (this.runner) {
            matter_js_1.default.Runner.stop(this.runner);
            this.runner = null;
        }
        if (this.render) {
            matter_js_1.default.Render.stop(this.render);
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
        this.isInitialized = false;
        this.emit('destroyed');
    }
    /**
     * Create a new 2D physics world
     */
    createWorld(config) {
        if (!this.engine) {
            throw new Error('Engine not initialized. Call initialize() first.');
        }
        const world = new Matter2DWorld_1.Matter2DWorld(this, config);
        this.worlds.add(world);
        this.emit('world-created', world);
        return world;
    }
    /**
     * Destroy a physics world
     */
    destroyWorld(world) {
        if (world instanceof Matter2DWorld_1.Matter2DWorld) {
            this.worlds.delete(world);
            world.destroy();
            this.emit('world-destroyed', world);
        }
    }
    /**
     * Create a physics material
     */
    createMaterial(config) {
        const material = {
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
    getDefaultMaterial() {
        return this.defaultMaterial;
    }
    /**
     * Get a material by ID
     */
    getMaterial(id) {
        return this.materials.get(id) || null;
    }
    /**
     * Optimize engine for different device tiers
     */
    optimizeForDevice(deviceTier) {
        if (!this.engine)
            return;
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
    enableObjectPooling(enabled) {
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
    setMaxBodies(maxBodies) {
        this.maxBodies = maxBodies;
        // Trim pool if necessary
        if (this.bodyPool.length > maxBodies) {
            this.bodyPool.length = maxBodies;
        }
    }
    /**
     * Get the native Matter.js engine
     */
    getNativeEngine() {
        return this.engine;
    }
    /**
     * Get a body from the pool or create a new one
     */
    getPooledBody() {
        if (this.objectPoolingEnabled && this.bodyPool.length > 0) {
            return this.bodyPool.pop();
        }
        return null;
    }
    /**
     * Return a body to the pool
     */
    returnBodyToPool(body) {
        if (this.objectPoolingEnabled && this.bodyPool.length < this.maxBodies) {
            // Reset body properties
            matter_js_1.default.Body.setPosition(body, { x: 0, y: 0 });
            matter_js_1.default.Body.setVelocity(body, { x: 0, y: 0 });
            matter_js_1.default.Body.setAngularVelocity(body, 0);
            matter_js_1.default.Body.setAngle(body, 0);
            this.bodyPool.push(body);
        }
    }
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
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
    updatePerformanceMetrics(deltaTime, stepTime) {
        this.performanceMetrics.averageStepTime = (this.performanceMetrics.averageStepTime * 0.9) + (stepTime * 0.1);
        // Estimate memory usage (rough calculation)
        const bodyMemory = this.performanceMetrics.bodyCount * 256; // ~256 bytes per body
        const constraintMemory = this.performanceMetrics.constraintCount * 128; // ~128 bytes per constraint
        this.performanceMetrics.memoryUsage = bodyMemory + constraintMemory;
    }
    /**
     * Initialize default material
     */
    initializeDefaultMaterial() {
        this.defaultMaterial = {
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
        this.materials.set(this.defaultMaterial.id, this.defaultMaterial);
    }
    /**
     * Initialize performance metrics
     */
    initializePerformanceMetrics() {
        this.performanceMetrics = {
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
    /**
     * Optimize engine for mobile devices
     */
    optimizeForMobile() {
        if (!this.engine)
            return;
        // Enable sleeping for better performance
        this.engine.enableSleeping = true;
        // Set reasonable sleep thresholds
        matter_js_1.default.Sleeping.set({
            motionSleepThreshold: 0.18,
            motionWakeThreshold: 0.18,
            minSleepTime: 1000
        });
        // Use grid broadphase for better mobile performance
        this.engine.broadphase.current = 'grid';
        // Optimize timing
        this.engine.timing.timeScale = 1;
        this.engine.constraintIterations = 2;
        this.engine.velocityIterations = 4;
        this.engine.positionIterations = 3;
        // Reduce gravity scale for better mobile performance
        this.engine.world.gravity.scale = 0.001;
    }
}
exports.Matter2DEngine = Matter2DEngine;
