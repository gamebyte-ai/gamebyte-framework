"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Matter2DWorld = void 0;
const eventemitter3_1 = require("eventemitter3");
const matter_js_1 = require("matter-js");
const Matter2DBody_1 = require("../bodies/Matter2DBody");
const Matter2DConstraint_1 = require("../constraints/Matter2DConstraint");
/**
 * Matter.js 2D physics world implementation
 */
class Matter2DWorld extends eventemitter3_1.EventEmitter {
    constructor(engine, config) {
        super();
        this.dimension = '2d';
        this.engineType = 'matter';
        this.isRunning = false;
        this.runner = null;
        this.bodies = new Map();
        this.constraints = new Map();
        this.lastStepTime = 0;
        this.paused = false;
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
            y: this.world.gravity.y
        };
    }
    /**
     * Set gravity
     */
    set gravity(gravity) {
        const point = gravity;
        this.world.gravity.x = point.x;
        this.world.gravity.y = point.y;
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
    set iterations(iterations) {
        const nativeEngine = this.engine.getNativeEngine();
        if (nativeEngine) {
            nativeEngine.velocityIterations = iterations.velocity;
            nativeEngine.positionIterations = iterations.position;
        }
    }
    /**
     * Step the physics simulation
     */
    step(deltaTime) {
        if (this.paused)
            return;
        const startTime = performance.now();
        const nativeEngine = this.engine.getNativeEngine();
        if (nativeEngine) {
            // Update engine timing
            nativeEngine.timing.timestamp += deltaTime * 1000;
            // Step the engine
            matter_js_1.default.Engine.update(nativeEngine, deltaTime * 1000);
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
    start() {
        if (this.isRunning)
            return;
        const nativeEngine = this.engine.getNativeEngine();
        if (nativeEngine) {
            this.runner = matter_js_1.default.Runner.create();
            matter_js_1.default.Runner.run(this.runner, nativeEngine);
            this.isRunning = true;
            this.emit('started');
        }
    }
    /**
     * Stop the physics simulation
     */
    stop() {
        if (!this.isRunning)
            return;
        if (this.runner) {
            matter_js_1.default.Runner.stop(this.runner);
            this.runner = null;
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
        const body = new Matter2DBody_1.Matter2DBody(this.engine, config);
        this.addBody(body);
        return body;
    }
    /**
     * Add a body to the world
     */
    addBody(body) {
        if (!(body instanceof Matter2DBody_1.Matter2DBody)) {
            throw new Error('Body must be a Matter2DBody');
        }
        this.bodies.set(body.id, body);
        matter_js_1.default.World.add(this.world, body.getNativeBody());
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
            matter_js_1.default.World.remove(this.world, bodyInstance.getNativeBody());
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
        const constraint = new Matter2DConstraint_1.Matter2DConstraint(config, bodyA, bodyB);
        this.addConstraint(constraint);
        return constraint;
    }
    /**
     * Add a constraint to the world
     */
    addConstraint(constraint) {
        if (!(constraint instanceof Matter2DConstraint_1.Matter2DConstraint)) {
            throw new Error('Constraint must be a Matter2DConstraint');
        }
        this.constraints.set(constraint.id, constraint);
        matter_js_1.default.World.add(this.world, constraint.getNativeConstraint());
        this.emit('constraint-added', constraint);
    }
    /**
     * Remove a constraint from the world
     */
    removeConstraint(constraint) {
        const constraintId = typeof constraint === 'string' ? constraint : constraint.id;
        const constraintInstance = this.constraints.get(constraintId);
        if (constraintInstance) {
            matter_js_1.default.World.remove(this.world, constraintInstance.getNativeConstraint());
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
        const results = [];
        const allBodies = this.world.bodies;
        for (const body of allBodies) {
            // Simple ray-body intersection test
            const hit = this.rayIntersectBody(options.from, options.to, body);
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
    queryAABB(min, max) {
        const minPoint = min;
        const maxPoint = max;
        const results = [];
        for (const [id, body] of this.bodies) {
            const bounds = body.bounds;
            const bodyMin = bounds.min;
            const bodyMax = bounds.max;
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
    queryPoint(point) {
        const p = point;
        const results = [];
        for (const [id, body] of this.bodies) {
            const nativeBody = body.getNativeBody();
            if (matter_js_1.default.Bounds.contains(nativeBody.bounds, p)) {
                // More precise point-in-body test could be added here
                results.push(body);
            }
        }
        return results;
    }
    /**
     * Check collision between two bodies
     */
    checkCollision(bodyA, bodyB) {
        if (!(bodyA instanceof Matter2DBody_1.Matter2DBody) || !(bodyB instanceof Matter2DBody_1.Matter2DBody)) {
            return false;
        }
        const nativeA = bodyA.getNativeBody();
        const nativeB = bodyB.getNativeBody();
        // Check bounds overlap first
        if (!matter_js_1.default.Bounds.overlaps(nativeA.bounds, nativeB.bounds)) {
            return false;
        }
        // Use Matter.js collision detection
        const collision = matter_js_1.default.SAT.collides(nativeA, nativeB);
        return collision.collided;
    }
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const metrics = this.engine.getPerformanceMetrics();
        metrics.contactCount = this.world.bodies.length; // Simplified
        return metrics;
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
    destroy() {
        this.stop();
        this.clear();
        this.bodies.clear();
        this.constraints.clear();
        this.emit('destroyed');
    }
    /**
     * Get the native Matter.js world
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
    setupCollisionEvents() {
        const nativeEngine = this.engine.getNativeEngine();
        if (!nativeEngine)
            return;
        // Collision start
        matter_js_1.default.Events.on(nativeEngine, 'collisionStart', (event) => {
            for (const pair of event.pairs) {
                const bodyA = this.findPhysicsBody(pair.bodyA);
                const bodyB = this.findPhysicsBody(pair.bodyB);
                if (bodyA && bodyB) {
                    const collisionEvent = {
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
        matter_js_1.default.Events.on(nativeEngine, 'collisionEnd', (event) => {
            for (const pair of event.pairs) {
                const bodyA = this.findPhysicsBody(pair.bodyA);
                const bodyB = this.findPhysicsBody(pair.bodyB);
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
            }
        });
        // Collision active
        matter_js_1.default.Events.on(nativeEngine, 'collisionActive', (event) => {
            for (const pair of event.pairs) {
                const bodyA = this.findPhysicsBody(pair.bodyA);
                const bodyB = this.findPhysicsBody(pair.bodyB);
                if (bodyA && bodyB) {
                    const collisionEvent = {
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
    setupBodyCollisionEvents(body) {
        // Additional body-specific collision setup could be added here
    }
    /**
     * Find the PhysicsBody wrapper for a native Matter body
     */
    findPhysicsBody(nativeBody) {
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
    rayIntersectBody(from, to, body) {
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
    rayIntersectBounds(from, to, bounds) {
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
exports.Matter2DWorld = Matter2DWorld;
