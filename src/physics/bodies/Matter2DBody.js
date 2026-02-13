"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Matter2DBody = void 0;
const eventemitter3_1 = require("eventemitter3");
const matter_js_1 = require("matter-js");
const { Logger } = require("../../utils/Logger");
/**
 * Matter.js 2D physics body implementation
 */
class Matter2DBody extends eventemitter3_1.EventEmitter {
    constructor(engine, config) {
        super();
        this.dimension = '2d';
        this._userData = null;
        this.engine = engine;
        this.id = config.id || `body_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = config.type;
        this.isStatic = config.isStatic || config.type === 'static';
        this.isSensor = config.isSensor || false;
        this._material = config.material || engine.getDefaultMaterial();
        this._userData = config.userData;
        this.body = this.createMatterBody(config);
        this.applyConfiguration(config);
    }
    /**
     * Get if body is active (not sleeping)
     */
    get isActive() {
        return !this.body.isSleeping;
    }
    /**
     * Get if body is sleeping
     */
    get isSleeping() {
        return this.body.isSleeping;
    }
    /**
     * Get/set position
     */
    get position() {
        return { x: this.body.position.x, y: this.body.position.y };
    }
    set position(position) {
        const pos = position;
        matter_js_1.default.Body.setPosition(this.body, pos);
        this.emit('position-changed', pos);
    }
    /**
     * Get/set rotation (angle in radians)
     */
    get rotation() {
        return this.body.angle;
    }
    set rotation(rotation) {
        const angle = typeof rotation === 'number' ? rotation : 0; // For 2D, ignore quaternion
        matter_js_1.default.Body.setAngle(this.body, angle);
        this.emit('rotation-changed', angle);
    }
    /**
     * Get/set velocity
     */
    get velocity() {
        return { x: this.body.velocity.x, y: this.body.velocity.y };
    }
    set velocity(velocity) {
        const vel = velocity;
        matter_js_1.default.Body.setVelocity(this.body, vel);
        this.emit('velocity-changed', vel);
    }
    /**
     * Get/set angular velocity
     */
    get angularVelocity() {
        return this.body.angularVelocity;
    }
    set angularVelocity(angularVelocity) {
        const angVel = typeof angularVelocity === 'number' ? angularVelocity : 0;
        matter_js_1.default.Body.setAngularVelocity(this.body, angVel);
        this.emit('angular-velocity-changed', angVel);
    }
    /**
     * Get/set mass
     */
    get mass() {
        return this.body.mass;
    }
    set mass(mass) {
        matter_js_1.default.Body.setMass(this.body, mass);
        this.emit('mass-changed', mass);
    }
    /**
     * Get/set material
     */
    get material() {
        return this._material;
    }
    set material(material) {
        this._material = material;
        this.applyMaterial(material);
        this.emit('material-changed', material);
    }
    /**
     * Get/set gravity scale
     */
    get gravityScale() {
        return this.body.render.gravityScale || 1;
    }
    set gravityScale(scale) {
        // Matter.js doesn't have built-in gravity scale, so we store it in render data
        this.body.render.gravityScale = scale;
        this.emit('gravity-scale-changed', scale);
    }
    /**
     * Get/set linear damping
     */
    get linearDamping() {
        return this.body.frictionAir;
    }
    set linearDamping(damping) {
        this.body.frictionAir = damping;
        this.emit('linear-damping-changed', damping);
    }
    /**
     * Get/set angular damping
     */
    get angularDamping() {
        return this.body.frictionAir; // Matter.js uses same value for both
    }
    set angularDamping(damping) {
        this.body.frictionAir = damping;
        this.emit('angular-damping-changed', damping);
    }
    /**
     * Get/set collision group
     */
    get collisionGroup() {
        return this.body.collisionFilter.group || 0;
    }
    set collisionGroup(group) {
        this.body.collisionFilter.group = group;
        this.emit('collision-group-changed', group);
    }
    /**
     * Get/set collision mask
     */
    get collisionMask() {
        return this.body.collisionFilter.mask || 0xFFFFFFFF;
    }
    set collisionMask(mask) {
        this.body.collisionFilter.mask = mask;
        this.emit('collision-mask-changed', mask);
    }
    /**
     * Get body bounds
     */
    get bounds() {
        return {
            min: { x: this.body.bounds.min.x, y: this.body.bounds.min.y },
            max: { x: this.body.bounds.max.x, y: this.body.bounds.max.y }
        };
    }
    /**
     * Get/set user data
     */
    get userData() {
        return this._userData;
    }
    set userData(data) {
        this._userData = data;
        this.emit('user-data-changed', data);
    }
    /**
     * Apply force at a point
     */
    applyForce(force, point) {
        const f = force;
        const p = point ? point : this.body.position;
        matter_js_1.default.Body.applyForce(this.body, p, f);
        this.emit('force-applied', { force: f, point: p });
    }
    /**
     * Apply impulse at a point
     */
    applyImpulse(impulse, point) {
        const imp = impulse;
        const p = point ? point : this.body.position;
        // Convert impulse to force (impulse = force * deltaTime, assuming 1/60 deltaTime)
        const force = { x: imp.x * 60, y: imp.y * 60 };
        matter_js_1.default.Body.applyForce(this.body, p, force);
        this.emit('impulse-applied', { impulse: imp, point: p });
    }
    /**
     * Apply torque
     */
    applyTorque(torque) {
        const t = typeof torque === 'number' ? torque : 0;
        // Apply torque by applying forces at the edges
        const radius = Math.max(this.body.bounds.max.x - this.body.bounds.min.x, this.body.bounds.max.y - this.body.bounds.min.y) / 2;
        const force = t / radius;
        const offset = { x: 0, y: radius };
        const forcePoint1 = { x: this.body.position.x + offset.x, y: this.body.position.y + offset.y };
        const forcePoint2 = { x: this.body.position.x - offset.x, y: this.body.position.y - offset.y };
        matter_js_1.default.Body.applyForce(this.body, forcePoint1, { x: force, y: 0 });
        matter_js_1.default.Body.applyForce(this.body, forcePoint2, { x: -force, y: 0 });
        this.emit('torque-applied', t);
    }
    /**
     * Set body as static/dynamic
     */
    setStatic(isStatic) {
        matter_js_1.default.Body.setStatic(this.body, isStatic);
        this.isStatic = isStatic;
        this.emit('static-changed', isStatic);
    }
    /**
     * Set body as sensor
     */
    setSensor(isSensor) {
        this.body.isSensor = isSensor;
        this.isSensor = isSensor;
        this.emit('sensor-changed', isSensor);
    }
    /**
     * Set body active state
     */
    setActive(active) {
        if (active) {
            this.wakeUp();
        }
        else {
            this.sleep();
        }
    }
    /**
     * Wake up the body
     */
    wakeUp() {
        matter_js_1.default.Sleeping.set(this.body, false);
        this.emit('wake-up');
    }
    /**
     * Put body to sleep
     */
    sleep() {
        matter_js_1.default.Sleeping.set(this.body, true);
        this.emit('sleep');
    }
    /**
     * Add a shape to the body
     */
    addShape(config) {
        // For Matter.js, we would need to create a compound body
        // This is a simplified implementation
        Logger.warn('Physics', 'addShape not fully implemented for Matter2DBody');
        this.emit('shape-added', config);
    }
    /**
     * Remove a shape from the body
     */
    removeShape(index) {
        // For Matter.js, this would require reconstructing the body
        Logger.warn('Physics', 'removeShape not fully implemented for Matter2DBody');
        this.emit('shape-removed', index);
    }
    /**
     * Update transform (force bounds recalculation)
     */
    updateTransform() {
        matter_js_1.default.Body.update(this.body, 1000 / 60); // Assume 60 FPS
        this.emit('transform-updated');
    }
    /**
     * Destroy the body
     */
    destroy() {
        this.emit('destroy');
        this.removeAllListeners();
    }
    /**
     * Get the native Matter.js body
     */
    getNativeBody() {
        return this.body;
    }
    /**
     * Create the Matter.js body from configuration
     */
    createMatterBody(config) {
        let body;
        // Use the first shape to create the body
        const primaryShape = config.shapes[0];
        if (!primaryShape) {
            throw new Error('Body must have at least one shape');
        }
        const position = config.position;
        const options = {
            isStatic: this.isStatic,
            isSensor: this.isSensor,
            angle: typeof config.rotation === 'number' ? config.rotation : 0,
            frictionAir: config.linearDamping || 0.01,
            friction: this._material.friction,
            restitution: this._material.restitution,
            density: this._material.density,
            sleepThreshold: config.sleepSpeedLimit || 60,
            sleepTimeLimit: config.sleepTimeLimit || 1000
        };
        // Create body based on shape type
        switch (primaryShape.type) {
            case 'box':
                const dimensions = primaryShape.dimensions;
                body = matter_js_1.default.Bodies.rectangle(position.x, position.y, dimensions.x, dimensions.y, options);
                break;
            case 'circle':
                const radius = primaryShape.radius || primaryShape.dimensions.x / 2;
                body = matter_js_1.default.Bodies.circle(position.x, position.y, radius, options);
                break;
            default:
                // Default to box
                body = matter_js_1.default.Bodies.rectangle(position.x, position.y, 32, 32, options);
                break;
        }
        // Set initial velocity if provided
        if (config.velocity) {
            const vel = config.velocity;
            matter_js_1.default.Body.setVelocity(body, vel);
        }
        // Set initial angular velocity if provided
        if (config.angularVelocity) {
            const angVel = typeof config.angularVelocity === 'number' ? config.angularVelocity : 0;
            matter_js_1.default.Body.setAngularVelocity(body, angVel);
        }
        // Set collision filtering
        if (config.collisionGroup !== undefined || config.collisionMask !== undefined) {
            body.collisionFilter = {
                category: 0x0001,
                mask: config.collisionMask || 0xFFFFFFFF,
                group: config.collisionGroup || 0
            };
        }
        return body;
    }
    /**
     * Apply configuration to the body
     */
    applyConfiguration(config) {
        // Set mass if provided
        if (config.mass !== undefined) {
            this.mass = config.mass;
        }
        // Set gravity scale if provided
        if (config.gravityScale !== undefined) {
            this.gravityScale = config.gravityScale;
        }
        // Set damping values
        if (config.linearDamping !== undefined) {
            this.linearDamping = config.linearDamping;
        }
        if (config.angularDamping !== undefined) {
            this.angularDamping = config.angularDamping;
        }
        // Set fixed rotation
        if (config.fixedRotation) {
            this.body.inertia = Infinity;
        }
        // Configure sleeping
        if (config.allowSleep !== undefined) {
            // Matter.js bodies can sleep by default, so we don't need to do anything special
            if (!config.allowSleep) {
                this.body.sleepThreshold = Infinity;
            }
        }
    }
    /**
     * Apply material properties to the body
     */
    applyMaterial(material) {
        this.body.friction = material.friction;
        this.body.restitution = material.restitution;
        this.body.density = material.density;
        if (material.frictionAir !== undefined) {
            this.body.frictionAir = material.frictionAir;
        }
        // Update mass based on new density
        matter_js_1.default.Body.setMass(this.body, this.body.area * material.density);
    }
}
exports.Matter2DBody = Matter2DBody;
