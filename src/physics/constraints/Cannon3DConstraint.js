"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cannon3DConstraint = void 0;
const eventemitter3_1 = require("eventemitter3");
const CANNON = require("cannon-es");
/**
 * Cannon.js 3D physics constraint implementation
 */
class Cannon3DConstraint extends eventemitter3_1.EventEmitter {
    constructor(config, bodyA, bodyB) {
        super();
        this._userData = null;
        this.id = config.id || `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = config.type;
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this._userData = config.userData;
        this.constraint = this.createCannonConstraint(config, bodyA, bodyB);
    }
    /**
     * Get/set stiffness (not directly supported by Cannon.js)
     */
    get stiffness() {
        return this.constraint.stiffness || 1;
    }
    set stiffness(stiffness) {
        this.constraint.stiffness = Math.max(0, Math.min(1, stiffness));
        this.emit('stiffness-changed', stiffness);
    }
    /**
     * Get/set damping (not directly supported by Cannon.js)
     */
    get damping() {
        return this.constraint.damping || 0;
    }
    set damping(damping) {
        this.constraint.damping = Math.max(0, Math.min(1, damping));
        this.emit('damping-changed', damping);
    }
    /**
     * Get/set motor speed (for motorized constraints)
     */
    get motorSpeed() {
        if (this.constraint instanceof CANNON.HingeConstraint) {
            return this.constraint.motorTargetVelocity;
        }
        return this.constraint.motorSpeed || 0;
    }
    set motorSpeed(speed) {
        if (this.constraint instanceof CANNON.HingeConstraint) {
            this.constraint.motorTargetVelocity = speed;
        }
        else {
            this.constraint.motorSpeed = speed;
        }
        this.emit('motor-speed-changed', speed);
    }
    /**
     * Get/set motor force (for motorized constraints)
     */
    get motorForce() {
        if (this.constraint instanceof CANNON.HingeConstraint) {
            return this.constraint.motorMaxForce;
        }
        return this.constraint.motorForce || 0;
    }
    set motorForce(force) {
        if (this.constraint instanceof CANNON.HingeConstraint) {
            this.constraint.motorMaxForce = force;
        }
        else {
            this.constraint.motorForce = force;
        }
        this.emit('motor-force-changed', force);
    }
    /**
     * Get/set motor enabled state
     */
    get enableMotor() {
        if (this.constraint instanceof CANNON.HingeConstraint) {
            return this.constraint.motorEnabled;
        }
        return this.constraint.motorEnabled || false;
    }
    set enableMotor(enabled) {
        if (this.constraint instanceof CANNON.HingeConstraint) {
            this.constraint.motorEnabled = enabled;
        }
        else {
            this.constraint.motorEnabled = enabled;
        }
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
     * Get the native Cannon.js constraint
     */
    getNativeConstraint() {
        return this.constraint;
    }
    /**
     * Create the Cannon.js constraint from configuration
     */
    createCannonConstraint(config, bodyA, bodyB) {
        const nativeBodyA = bodyA.getNativeBody();
        const nativeBodyB = bodyB.getNativeBody();
        let constraint;
        switch (config.type) {
            case 'distance':
                // Distance constraint
                const distance = config.length || this.calculateDistance(bodyA, bodyB);
                constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, distance);
                break;
            case 'spring':
                // Spring constraint (distance constraint with custom properties)
                const springDistance = config.length || this.calculateDistance(bodyA, bodyB);
                constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, springDistance);
                constraint.stiffness = config.stiffness || 0.02;
                constraint.damping = config.damping || 0.05;
                break;
            case 'revolute':
                // Hinge constraint (revolute joint)
                const pivotA = config.anchorA ? this.toVector3(config.anchorA) : { x: 0, y: 0, z: 0 };
                const pivotB = config.anchorB ? this.toVector3(config.anchorB) : { x: 0, y: 0, z: 0 };
                const axisA = config.axis ? this.toVector3(config.axis) : { x: 0, y: 0, z: 1 };
                const axisB = config.axis ? this.toVector3(config.axis) : { x: 0, y: 0, z: 1 };
                constraint = new CANNON.HingeConstraint(nativeBodyA, nativeBodyB, {
                    pivotA: new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
                    axisA: new CANNON.Vec3(axisA.x, axisA.y, axisA.z),
                    pivotB: new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z),
                    axisB: new CANNON.Vec3(axisB.x, axisB.y, axisB.z)
                });
                // Configure motor if specified
                if (config.motorSpeed !== undefined || config.enableMotor) {
                    constraint.motorEnabled = config.enableMotor || false;
                    constraint.motorTargetVelocity = config.motorSpeed || 0;
                    constraint.motorMaxForce = config.motorForce || 1;
                }
                break;
            case 'prismatic':
                // Prismatic constraint (linear movement along axis)
                console.warn('Prismatic constraint not fully supported in Cannon.js, using distance constraint');
                constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, config.length || 1);
                break;
            case 'fixed':
                // Lock constraint (fixed joint)
                constraint = new CANNON.LockConstraint(nativeBodyA, nativeBodyB);
                break;
            case 'rope':
                // Rope constraint (distance with no compression)
                const ropeDistance = config.length || this.calculateDistance(bodyA, bodyB);
                constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, ropeDistance);
                // Note: Cannon.js distance constraint doesn't prevent compression
                break;
            case 'gear':
            case 'pulley':
            case 'mouse':
                // These constraint types are not directly supported by Cannon.js
                console.warn(`Constraint type '${config.type}' not supported in Cannon.js, using distance constraint`);
                constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, config.length || 1);
                break;
            default:
                // Default to distance constraint
                constraint = new CANNON.DistanceConstraint(nativeBodyA, nativeBodyB, config.length || 1);
                break;
        }
        // Store configuration for later use
        constraint.stiffness = config.stiffness || 1;
        constraint.damping = config.damping || 0;
        constraint.motorSpeed = config.motorSpeed || 0;
        constraint.motorForce = config.motorForce || 0;
        constraint.motorEnabled = config.enableMotor || false;
        // Apply limits if specified (only supported by HingeConstraint)
        if (constraint instanceof CANNON.HingeConstraint) {
            if (config.lowerLimit !== undefined) {
                constraint.lowerLimit = config.lowerLimit;
            }
            if (config.upperLimit !== undefined) {
                constraint.upperLimit = config.upperLimit;
            }
        }
        return constraint;
    }
    /**
     * Calculate distance between two bodies
     */
    calculateDistance(bodyA, bodyB) {
        const posA = bodyA.position;
        const posB = bodyB.position;
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const dz = posB.z - posA.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    /**
     * Convert Point or Vector3 to Vector3
     */
    toVector3(input) {
        if ('z' in input) {
            return input;
        }
        else {
            const point = input;
            return { x: point.x, y: point.y, z: 0 };
        }
    }
}
exports.Cannon3DConstraint = Cannon3DConstraint;
