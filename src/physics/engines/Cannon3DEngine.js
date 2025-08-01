"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cannon3DEngine = void 0;
const eventemitter3_1 = require("eventemitter3");
const CANNON = require("cannon-es");
const Cannon3DWorld_1 = require("../worlds/Cannon3DWorld");
/**
 * Cannon.js 3D physics engine wrapper optimized for mobile games
 */
class Cannon3DEngine extends eventemitter3_1.EventEmitter {
    constructor() {
        super();
        this.engineType = 'cannon';
        this.dimension = '3d';
        this.isInitialized = false;
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
     * Initialize the Cannon.js engine
     */
    async initialize(config) {
        try {
            // Cannon.js doesn't require explicit initialization like Matter.js
            // But we can set up global configurations here
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
        // Destroy all worlds
        for (const world of this.worlds) {
            world.destroy();
        }
        this.worlds.clear();
        // Clear pools
        this.bodyPool.length = 0;
        this.constraintPool.length = 0;
        this.isInitialized = false;
        this.emit('destroyed');
    }
    /**
     * Create a new 3D physics world
     */
    createWorld(config) {
        const world = new Cannon3DWorld_1.Cannon3DWorld(this, config);
        this.worlds.add(world);
        this.emit('world-created', world);
        return world;
    }
    /**
     * Destroy a physics world
     */
    destroyWorld(world) {
        if (world instanceof Cannon3DWorld_1.Cannon3DWorld) {
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
    getPerformanceMetrics() {
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
    updatePerformanceMetrics(deltaTime, stepTime) {
        this.performanceMetrics.averageStepTime = (this.performanceMetrics.averageStepTime * 0.9) + (stepTime * 0.1);
        // Estimate memory usage (rough calculation)
        const bodyMemory = this.performanceMetrics.bodyCount * 512; // ~512 bytes per 3D body
        const constraintMemory = this.performanceMetrics.constraintCount * 256; // ~256 bytes per constraint
        this.performanceMetrics.memoryUsage = bodyMemory + constraintMemory;
    }
    /**
     * Create a Cannon.js material from physics material
     */
    createCannonMaterial(physicsMaterial) {
        return new CANNON.Material({
            name: physicsMaterial.name,
            friction: physicsMaterial.friction,
            restitution: physicsMaterial.restitution
        });
    }
    /**
     * Initialize default material
     */
    initializeDefaultMaterial() {
        this.defaultMaterial = {
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
        // Mobile optimization settings
        // These would be applied to individual worlds when created
        this.emit('mobile-optimized');
    }
}
exports.Cannon3DEngine = Cannon3DEngine;
