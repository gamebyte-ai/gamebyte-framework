"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cannon3DWorld = void 0;
const eventemitter3_1 = require("eventemitter3");
const CANNON = require("cannon-es");
const Cannon3DBody_1 = require("../bodies/Cannon3DBody");
const Cannon3DConstraint_1 = require("../constraints/Cannon3DConstraint");
/**
 * Cannon.js 3D physics world implementation
 */
class Cannon3DWorld extends eventemitter3_1.EventEmitter {
    constructor(engine, config) {
        super();
        this.dimension = '3d';
        this.engineType = 'cannon';
        this.isRunning = false;
        this.bodies = new Map();
        this.constraints = new Map();
        this.lastStepTime = 0;
        this.paused = false;
        this.engine = engine;
        this.config = { ...config };
        this.world = new CANNON.World();
        this.initializeWorld();
        this.setupCollisionEvents();
    }
    /**
     * Get current body count
     */
    get bodyCount() {
        return this.bodies.size;
    }
    /**
     * Get current constraint count
     */
    get constraintCount() {
        return this.constraints.size;
    }
    /**
     * Get current gravity
     */
    get gravity() {
        return {
            x: this.world.gravity.x,
            y: this.world.gravity.y,
            z: this.world.gravity.z
        };
    }
    /**
     * Set gravity
     */
    set gravity(gravity) {
        if ('z' in gravity) {
            const g = gravity;
            this.world.gravity.set(g.x, g.y, g.z);
        }
        else {
            // Convert 2D gravity to 3D (assume Z is up)
            const g = gravity;
            this.world.gravity.set(g.x, -g.y, 0); // Flip Y for 3D convention
        }
        this.emit('gravity-changed', gravity);
    }
    /**
     * Get time step
     */
    get timeStep() {
        return this.config.timeStep || 1 / 60;
    }
    /**
     * Set time step
     */
    set timeStep(timeStep) {
        this.config.timeStep = timeStep;
    }
    /**
     * Get solver iterations
     */
    get iterations() {
        return {
            velocity: this.world.solver.iterations,
            position: this.world.solver.iterations // Cannon uses same value
        };
    }
    /**
     * Set solver iterations
     */
    set iterations(iterations) {
        this.world.solver.iterations = Math.max(iterations.velocity, iterations.position);
    }
    /**
     * Step the physics simulation
     */
    step(deltaTime) {
        if (this.paused)
            return;
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
    start() {
        if (this.isRunning)
            return;
        const animate = () => {
            if (!this.isRunning)
                return;
            this.step(1 / 60); // 60 FPS
            this.animationFrameId = requestAnimationFrame(animate);
        };
        this.isRunning = true;
        animate();
        this.emit('started');
    }
    /**
     * Stop the physics simulation
     */
    stop() {
        if (!this.isRunning)
            return;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = undefined;
        }
        this.isRunning = false;
        this.emit('stopped');
    }
    /**
     * Pause the physics simulation
     */
    pause() {
        this.paused = true;
        this.emit('paused');
    }
    /**
     * Resume the physics simulation
     */
    resume() {
        this.paused = false;
        this.emit('resumed');
    }
    /**
     * Clear all bodies and constraints
     */
    clear() {
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
    createBody(config) {
        const body = new Cannon3DBody_1.Cannon3DBody(this.engine, config);
        this.addBody(body);
        return body;
    }
    /**
     * Add a body to the world
     */
    addBody(body) {
        if (!(body instanceof Cannon3DBody_1.Cannon3DBody)) {
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
    removeBody(body) {
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
    getBody(id) {
        return this.bodies.get(id) || null;
    }
    /**
     * Get all bodies
     */
    getAllBodies() {
        return Array.from(this.bodies.values());
    }
    /**
     * Get active bodies (not sleeping)
     */
    getActiveBodies() {
        return Array.from(this.bodies.values()).filter(body => !body.isSleeping);
    }
    /**
     * Get sleeping bodies
     */
    getSleepingBodies() {
        return Array.from(this.bodies.values()).filter(body => body.isSleeping);
    }
    /**
     * Create a constraint
     */
    createConstraint(config) {
        const bodyA = this.getBody(config.bodyA);
        const bodyB = this.getBody(config.bodyB);
        if (!bodyA || !bodyB) {
            throw new Error('Both bodies must exist in the world');
        }
        const constraint = new Cannon3DConstraint_1.Cannon3DConstraint(config, bodyA, bodyB);
        this.addConstraint(constraint);
        return constraint;
    }
    /**
     * Add a constraint to the world
     */
    addConstraint(constraint) {
        if (!(constraint instanceof Cannon3DConstraint_1.Cannon3DConstraint)) {
            throw new Error('Constraint must be a Cannon3DConstraint');
        }
        this.constraints.set(constraint.id, constraint);
        this.world.addConstraint(constraint.getNativeConstraint());
        this.emit('constraint-added', constraint);
    }
    /**
     * Remove a constraint from the world
     */
    removeConstraint(constraint) {
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
    getConstraint(id) {
        return this.constraints.get(id) || null;
    }
    /**
     * Get all constraints
     */
    getAllConstraints() {
        return Array.from(this.constraints.values());
    }
    /**
     * Perform a raycast
     */
    raycast(options) {
        const from = options.from;
        const to = options.to;
        const fromVec = new CANNON.Vec3(from.x, from.y, from.z);
        const toVec = new CANNON.Vec3(to.x, to.y, to.z);
        const result = new CANNON.RaycastResult();
        this.world.raycastClosest(fromVec, toVec, {}, result);
        const results = [];
        if (result.hasHit) {
            const physicsBody = this.findPhysicsBody(result.body);
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
    queryAABB(min, max) {
        const minVec = min;
        const maxVec = max;
        const results = [];
        for (const [id, body] of this.bodies) {
            const bounds = body.bounds;
            const bodyMin = bounds.min;
            const bodyMax = bounds.max;
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
    queryPoint(point) {
        const p = point;
        const results = [];
        for (const [id, body] of this.bodies) {
            const bounds = body.bounds;
            const bodyMin = bounds.min;
            const bodyMax = bounds.max;
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
    checkCollision(bodyA, bodyB) {
        if (!(bodyA instanceof Cannon3DBody_1.Cannon3DBody) || !(bodyB instanceof Cannon3DBody_1.Cannon3DBody)) {
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
    getPerformanceMetrics() {
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
    enableDebugDraw(enabled) {
        // Debug drawing would be implemented here
        this.emit('debug-draw-changed', enabled);
    }
    /**
     * Set gravity
     */
    setGravity(gravity) {
        this.gravity = gravity;
    }
    /**
     * Set time step
     */
    setTimeStep(timeStep) {
        this.timeStep = timeStep;
    }
    /**
     * Optimize for mobile devices
     */
    optimizeForMobile() {
        // Reduce solver iterations for mobile
        this.world.solver.iterations = 5;
        // Use simpler broadphase for better performance
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        // Enable sleeping for better performance
        this.world.allowSleep = true;
        this.world.sleepSpeedLimit = 0.1;
        this.world.sleepTimeLimit = 1;
        this.emit('mobile-optimized');
    }
    /**
     * Destroy the world
     */
    destroy() {
        this.stop();
        this.clear();
        this.bodies.clear();
        this.constraints.clear();
        this.emit('destroyed');
    }
    /**
     * Get the native Cannon.js world
     */
    getNativeWorld() {
        return this.world;
    }
    /**
     * Initialize world properties
     */
    initializeWorld() {
        // Set gravity
        if (this.config.gravity) {
            this.setGravity(this.config.gravity);
        }
        else {
            // Default 3D gravity (Y is up)
            this.world.gravity.set(0, -9.82, 0);
        }
        // Configure solver
        this.world.solver.iterations = this.config.iterations?.velocity || 10;
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
            console.warn('World bounds not implemented for Cannon3DWorld');
        }
        // Enable CCD if requested
        if (this.config.enableCCD) {
            // Cannon.js doesn't have built-in CCD, but we could implement it
            console.warn('CCD not implemented for Cannon3DWorld');
        }
        // Optimize for mobile by default
        this.optimizeForMobile();
    }
    /**
     * Setup collision event handlers
     */
    setupCollisionEvents() {
        // Collision begin
        this.world.addEventListener('beginContact', (event) => {
            const contact = event.contact;
            const bodyA = this.findPhysicsBody(contact.bi);
            const bodyB = this.findPhysicsBody(contact.bj);
            if (bodyA && bodyB) {
                const collisionEvent = {
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
        this.world.addEventListener('endContact', (event) => {
            const contact = event.contact;
            const bodyA = this.findPhysicsBody(contact.bi);
            const bodyB = this.findPhysicsBody(contact.bj);
            if (bodyA && bodyB) {
                const collisionEvent = {
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
    setupBodyCollisionEvents(body) {
        // Additional body-specific collision setup could be added here
    }
    /**
     * Find the PhysicsBody wrapper for a native Cannon body
     */
    findPhysicsBody(nativeBody) {
        for (const [id, body] of this.bodies) {
            if (body.getNativeBody() === nativeBody) {
                return body;
            }
        }
        return null;
    }
}
exports.Cannon3DWorld = Cannon3DWorld;
