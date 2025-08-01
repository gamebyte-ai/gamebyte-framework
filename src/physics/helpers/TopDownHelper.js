"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameByteTopDownHelper = void 0;
const eventemitter3_1 = require("eventemitter3");
/**
 * Top-down game physics helper for movement, collision, and triggers
 */
class GameByteTopDownHelper extends eventemitter3_1.EventEmitter {
    constructor(character, world) {
        super();
        this.isMoving = false;
        this.currentSpeed = 0;
        this.movementInput = { x: 0, y: 0 };
        // Movement settings
        this.maxSpeed = 5;
        this.acceleration = 15;
        this.deceleration = 10;
        this.rotationSpeed = 5;
        this.dragCoefficient = 0.98;
        // Features
        this.rotationEnabled = false;
        this.momentumEnabled = true;
        this.targetRotation = 0;
        // State tracking
        this.velocity = { x: 0, y: 0 };
        this.lastMovementDirection = { x: 0, y: 1 };
        this.character = character;
        this.world = world;
    }
    /**
     * Set movement input (normalized -1 to 1 for each axis)
     */
    setMovementInput(input) {
        this.movementInput = {
            x: Math.max(-1, Math.min(1, input.x)),
            y: Math.max(-1, Math.min(1, input.y))
        };
        // Update target rotation if rotation is enabled
        if (this.rotationEnabled && (Math.abs(input.x) > 0.1 || Math.abs(input.y) > 0.1)) {
            this.targetRotation = Math.atan2(input.x, input.y);
            this.lastMovementDirection = this.normalizeVector(input);
        }
        this.emit('movement-input-changed', this.movementInput);
    }
    /**
     * Perform a dash move
     */
    dash(direction, force) {
        const normalizedDir = this.normalizeVector(direction);
        if (this.world.dimension === '2d') {
            this.character.applyImpulse({
                x: normalizedDir.x * force,
                y: normalizedDir.y * force
            });
        }
        else {
            this.character.applyImpulse({
                x: normalizedDir.x * force,
                y: 0,
                z: normalizedDir.y * force // Y becomes Z in 3D top-down
            });
        }
        this.emit('dash', { direction: normalizedDir, force });
    }
    /**
     * Apply braking force
     */
    brake(force) {
        const brakeForce = force || this.deceleration * 2;
        const velocity = this.character.velocity;
        if (this.world.dimension === '2d') {
            const vel = velocity;
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            if (speed > 0.1) {
                const brakeDirection = {
                    x: -vel.x / speed,
                    y: -vel.y / speed
                };
                this.character.applyForce({
                    x: brakeDirection.x * brakeForce,
                    y: brakeDirection.y * brakeForce
                });
            }
        }
        else {
            const vel = velocity;
            const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
            if (speed > 0.1) {
                const brakeDirection = {
                    x: -vel.x / speed,
                    y: 0,
                    z: -vel.z / speed
                };
                this.character.applyForce(brakeDirection);
            }
        }
        this.emit('brake', { force: brakeForce });
    }
    /**
     * Configure movement settings
     */
    setMovementSettings(config) {
        this.maxSpeed = config.maxSpeed;
        this.acceleration = config.acceleration;
        this.deceleration = config.deceleration;
        this.rotationSpeed = config.rotationSpeed;
        this.dragCoefficient = Math.max(0, Math.min(1, config.dragCoefficient));
        this.emit('movement-settings-changed', config);
    }
    /**
     * Get current movement direction
     */
    getMovementDirection() {
        return { ...this.lastMovementDirection };
    }
    /**
     * Get current movement speed
     */
    getMovementSpeed() {
        const velocity = this.character.velocity;
        if (this.world.dimension === '2d') {
            const vel = velocity;
            return Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        }
        else {
            const vel = velocity;
            return Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        }
    }
    /**
     * Update top-down physics (call every frame)
     */
    update(deltaTime) {
        // Handle movement
        this.handleMovement(deltaTime);
        // Handle rotation
        if (this.rotationEnabled) {
            this.handleRotation(deltaTime);
        }
        // Apply drag if momentum is disabled
        if (!this.momentumEnabled) {
            this.applyDrag();
        }
        // Update state
        this.updateMovementState();
        this.emit('update', deltaTime);
    }
    /**
     * Enable/disable rotation towards movement direction
     */
    enableRotation(enabled) {
        this.rotationEnabled = enabled;
        this.emit('rotation-changed', enabled);
    }
    /**
     * Enable/disable momentum (physics-based movement)
     */
    enableMomentum(enabled) {
        this.momentumEnabled = enabled;
        this.emit('momentum-changed', enabled);
    }
    /**
     * Handle movement input and physics
     */
    handleMovement(deltaTime) {
        const hasInput = Math.abs(this.movementInput.x) > 0.01 || Math.abs(this.movementInput.y) > 0.01;
        if (hasInput) {
            // Apply acceleration towards input direction
            this.applyAcceleration(deltaTime);
        }
        else {
            // Apply deceleration when no input
            this.applyDeceleration(deltaTime);
        }
    }
    /**
     * Apply acceleration based on input
     */
    applyAcceleration(deltaTime) {
        const targetVelocity = {
            x: this.movementInput.x * this.maxSpeed,
            y: this.movementInput.y * this.maxSpeed
        };
        const currentVelocity = this.world.dimension === '2d'
            ? this.character.velocity
            : { x: this.character.velocity.x, y: this.character.velocity.z };
        const velocityDiff = {
            x: targetVelocity.x - currentVelocity.x,
            y: targetVelocity.y - currentVelocity.y
        };
        const accelerationForce = {
            x: velocityDiff.x * this.acceleration,
            y: velocityDiff.y * this.acceleration
        };
        if (this.world.dimension === '2d') {
            this.character.applyForce(accelerationForce);
        }
        else {
            this.character.applyForce({
                x: accelerationForce.x,
                y: 0,
                z: accelerationForce.y
            });
        }
    }
    /**
     * Apply deceleration when no input
     */
    applyDeceleration(deltaTime) {
        const velocity = this.world.dimension === '2d'
            ? this.character.velocity
            : { x: this.character.velocity.x, y: this.character.velocity.z };
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > 0.1) {
            const decelerationForce = {
                x: -(velocity.x / speed) * this.deceleration,
                y: -(velocity.y / speed) * this.deceleration
            };
            if (this.world.dimension === '2d') {
                this.character.applyForce(decelerationForce);
            }
            else {
                this.character.applyForce({
                    x: decelerationForce.x,
                    y: 0,
                    z: decelerationForce.y
                });
            }
        }
    }
    /**
     * Handle character rotation towards movement direction
     */
    handleRotation(deltaTime) {
        let currentRotation;
        if (this.world.dimension === '2d') {
            currentRotation = this.character.rotation;
        }
        else {
            // Extract Y rotation from quaternion for 3D
            const quat = this.character.rotation;
            currentRotation = Math.atan2(2 * (quat.w * quat.y + quat.x * quat.z), 1 - 2 * (quat.y * quat.y + quat.z * quat.z));
        }
        // Calculate rotation difference
        let rotationDiff = this.targetRotation - currentRotation;
        // Normalize rotation difference to [-π, π]
        while (rotationDiff > Math.PI)
            rotationDiff -= 2 * Math.PI;
        while (rotationDiff < -Math.PI)
            rotationDiff += 2 * Math.PI;
        // Apply rotation
        if (Math.abs(rotationDiff) > 0.01) {
            const rotationAmount = Math.sign(rotationDiff) * this.rotationSpeed * deltaTime;
            // Clamp to target
            if (Math.abs(rotationAmount) > Math.abs(rotationDiff)) {
                this.character.rotation = this.targetRotation;
            }
            else {
                this.character.rotation = currentRotation + rotationAmount;
            }
        }
    }
    /**
     * Apply drag to reduce velocity
     */
    applyDrag() {
        const velocity = this.character.velocity;
        if (this.world.dimension === '2d') {
            const vel = velocity;
            this.character.velocity = {
                x: vel.x * this.dragCoefficient,
                y: vel.y * this.dragCoefficient
            };
        }
        else {
            const vel = velocity;
            this.character.velocity = {
                x: vel.x * this.dragCoefficient,
                y: vel.y,
                z: vel.z * this.dragCoefficient
            };
        }
    }
    /**
     * Update movement state flags
     */
    updateMovementState() {
        const speed = this.getMovementSpeed();
        const wasMoving = this.isMoving;
        this.isMoving = speed > 0.1;
        this.currentSpeed = speed;
        if (wasMoving !== this.isMoving) {
            this.emit('movement-state-changed', this.isMoving);
            if (this.isMoving) {
                this.emit('started-moving');
            }
            else {
                this.emit('stopped-moving');
            }
        }
    }
    /**
     * Normalize a 2D vector
     */
    normalizeVector(vector) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length === 0) {
            return { x: 0, y: 0 };
        }
        return {
            x: vector.x / length,
            y: vector.y / length
        };
    }
}
exports.GameByteTopDownHelper = GameByteTopDownHelper;
