"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Matter2DConstraint = void 0;
const eventemitter3_1 = require("eventemitter3");
const matter_js_1 = require("matter-js");
const { Logger } = require("../../utils/Logger");
/**
 * Matter.js 2D physics constraint implementation
 */
class Matter2DConstraint extends eventemitter3_1.EventEmitter {
    constructor(config, bodyA, bodyB) {
        super();
        this._userData = null;
        this.id = config.id || `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = config.type;
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this._userData = config.userData;
        this.constraint = this.createMatterConstraint(config, bodyA, bodyB);
    }
    /**
     * Get/set stiffness
     */
    get stiffness() {
        return this.constraint.stiffness;
    }
    set stiffness(stiffness) {
        this.constraint.stiffness = Math.max(0, Math.min(1, stiffness));
        this.emit('stiffness-changed', stiffness);
    }
    /**
     * Get/set damping
     */
    get damping() {
        return this.constraint.damping;
    }
    set damping(damping) {
        this.constraint.damping = Math.max(0, Math.min(1, damping));
        this.emit('damping-changed', damping);
    }
    /**
     * Get/set motor speed (for motorized constraints)
     */
    get motorSpeed() {
        // Matter.js doesn't have built-in motors, so we store this in userData
        return this.constraint.render.motorSpeed || 0;
    }
    set motorSpeed(speed) {
        if (!this.constraint.render) {
            this.constraint.render = {};
        }
        this.constraint.render.motorSpeed = speed;
        this.emit('motor-speed-changed', speed);
    }
    /**
     * Get/set motor force (for motorized constraints)
     */
    get motorForce() {
        return this.constraint.render.motorForce || 0;
    }
    set motorForce(force) {
        if (!this.constraint.render) {
            this.constraint.render = {};
        }
        this.constraint.render.motorForce = force;
        this.emit('motor-force-changed', force);
    }
    /**
     * Get/set motor enabled state
     */
    get enableMotor() {
        return this.constraint.render?.motorEnabled || false;
    }
    set enableMotor(enabled) {
        if (!this.constraint.render) {
            this.constraint.render = {};
        }
        this.constraint.render.motorEnabled = enabled;
        this.emit('motor-enabled-changed', enabled);
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
     * Set stiffness
     */
    setStiffness(stiffness) {
        this.stiffness = stiffness;
    }
    /**
     * Set damping
     */
    setDamping(damping) {
        this.damping = damping;
    }
    /**
     * Set motor speed
     */
    setMotorSpeed(speed) {
        this.motorSpeed = speed;
    }
    /**
     * Set motor force
     */
    setMotorForce(force) {
        this.motorForce = force;
    }
    /**
     * Enable or disable motor
     */
    enableMotor(enabled) {
        this.enableMotor = enabled;
    }
    /**
     * Destroy the constraint
     */
    destroy() {
        this.emit('destroy');
        this.removeAllListeners();
    }
    /**
     * Get the native Matter.js constraint
     */
    getNativeConstraint() {
        return this.constraint;
    }
    /**
     * Create the Matter.js constraint from configuration
     */
    createMatterConstraint(config, bodyA, bodyB) {
        const nativeBodyA = bodyA.getNativeBody();
        const nativeBodyB = bodyB.getNativeBody();
        let constraint;
        const options = {
            bodyA: nativeBodyA,
            bodyB: nativeBodyB,
            stiffness: config.stiffness || 0.8,
            damping: config.damping || 0.1,
            length: config.length
        };
        // Set anchor points if provided
        if (config.anchorA) {
            const anchor = config.anchorA;
            options.pointA = { x: anchor.x, y: anchor.y };
        }
        if (config.anchorB) {
            const anchor = config.anchorB;
            options.pointB = { x: anchor.x, y: anchor.y };
        }
        switch (config.type) {
            case 'distance':
                // Standard distance constraint
                if (config.length === undefined) {
                    // Calculate distance between bodies if not specified
                    const dx = nativeBodyB.position.x - nativeBodyA.position.x;
                    const dy = nativeBodyB.position.y - nativeBodyA.position.y;
                    options.length = Math.sqrt(dx * dx + dy * dy);
                }
                constraint = matter_js_1.default.Constraint.create(options);
                break;
            case 'spring':
                // Spring constraint with higher stiffness
                options.stiffness = config.stiffness || 0.02;
                options.damping = config.damping || 0.05;
                constraint = matter_js_1.default.Constraint.create(options);
                break;
            case 'revolute':
                // Pin constraint (revolute joint)
                options.length = 0;
                options.stiffness = 1;
                constraint = matter_js_1.default.Constraint.create(options);
                break;
            case 'fixed':
                // Fixed constraint
                options.length = 0;
                options.stiffness = 1;
                options.damping = 0;
                constraint = matter_js_1.default.Constraint.create(options);
                break;
            case 'rope':
                // Rope constraint (distance with no compression)
                constraint = matter_js_1.default.Constraint.create(options);
                // Note: Matter.js doesn't have built-in rope physics, 
                // this would need custom implementation
                break;
            case 'mouse':
                // Mouse constraint for dragging
                options.stiffness = 0.2;
                options.length = 0;
                constraint = matter_js_1.default.Constraint.create(options);
                break;
            case 'prismatic':
            case 'gear':
            case 'pulley':
                // These constraint types are not directly supported by Matter.js
                // Fall back to distance constraint
                Logger.warn('Physics', `Constraint type '${config.type}' not fully supported in Matter.js, using distance constraint`);
                constraint = matter_js_1.default.Constraint.create(options);
                break;
            default:
                // Default to distance constraint
                constraint = matter_js_1.default.Constraint.create(options);
                break;
        }
        // Apply limits if specified
        if (config.lowerLimit !== undefined || config.upperLimit !== undefined) {
            // Matter.js doesn't have built-in constraint limits
            // This would need custom implementation
            Logger.warn('Physics', 'Constraint limits not supported in Matter.js');
        }
        // Apply motor settings if specified
        if (config.motorSpeed !== undefined || config.motorForce !== undefined) {
            // Store motor settings in render object for later use
            constraint.render = constraint.render || {};
            constraint.render.motorSpeed = config.motorSpeed || 0;
            constraint.render.motorForce = config.motorForce || 0;
            constraint.render.motorEnabled = config.enableMotor || false;
        }
        return constraint;
    }
}
exports.Matter2DConstraint = Matter2DConstraint;
