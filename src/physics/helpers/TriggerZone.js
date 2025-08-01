"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameByteTriggerZone = void 0;
const eventemitter3_1 = require("eventemitter3");
/**
 * Trigger zone implementation for game events
 */
class GameByteTriggerZone extends eventemitter3_1.EventEmitter {
    constructor(world, config) {
        super();
        this.isActive = true;
        this.enteredBodies = new Set();
        this.triggerMask = 0xFFFFFFFF;
        this.enterCallbacks = [];
        this.exitCallbacks = [];
        this.stayCallbacks = [];
        this.world = world;
        this.id = config.id || `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Create trigger body (sensor)
        const triggerConfig = {
            ...config,
            id: this.id,
            type: 'static',
            isSensor: true
        };
        this.body = world.createBody(triggerConfig);
        this.setupCollisionEvents();
    }
    /**
     * Set trigger zone active state
     */
    setActive(active) {
        this.isActive = active;
        this.emit('active-changed', active);
    }
    /**
     * Set collision mask for trigger detection
     */
    setTriggerMask(mask) {
        this.triggerMask = mask;
        this.body.collisionMask = mask;
        this.emit('trigger-mask-changed', mask);
    }
    /**
     * Add callback for body entering trigger
     */
    onEnter(callback) {
        this.enterCallbacks.push(callback);
    }
    /**
     * Add callback for body exiting trigger
     */
    onExit(callback) {
        this.exitCallbacks.push(callback);
    }
    /**
     * Add callback for body staying in trigger
     */
    onStay(callback) {
        this.stayCallbacks.push(callback);
    }
    /**
     * Check if a body is inside the trigger
     */
    isBodyInside(body) {
        return this.enteredBodies.has(body);
    }
    /**
     * Get all bodies currently inside the trigger
     */
    getBodiesInside() {
        return Array.from(this.enteredBodies);
    }
    /**
     * Destroy the trigger zone
     */
    destroy() {
        // Remove collision event listeners
        this.body.removeAllListeners();
        // Remove body from world
        this.world.removeBody(this.body);
        // Clear callbacks and references
        this.enterCallbacks.length = 0;
        this.exitCallbacks.length = 0;
        this.stayCallbacks.length = 0;
        this.enteredBodies.clear();
        this.emit('destroyed');
        this.removeAllListeners();
    }
    /**
     * Setup collision event handling
     */
    setupCollisionEvents() {
        // Handle collision start (body enters trigger)
        this.body.on('collision-start', (event) => {
            if (!this.isActive)
                return;
            const otherBody = event.bodyA === this.body ? event.bodyB : event.bodyA;
            // Check if body matches trigger mask
            if ((otherBody.collisionGroup & this.triggerMask) === 0) {
                return;
            }
            // Add to entered bodies set
            if (!this.enteredBodies.has(otherBody)) {
                this.enteredBodies.add(otherBody);
                // Emit enter event
                this.emit('enter', otherBody);
                // Call enter callbacks
                for (const callback of this.enterCallbacks) {
                    try {
                        callback(otherBody);
                    }
                    catch (error) {
                        this.emit('error', error);
                    }
                }
            }
        });
        // Handle collision end (body exits trigger)
        this.body.on('collision-end', (event) => {
            if (!this.isActive)
                return;
            const otherBody = event.bodyA === this.body ? event.bodyB : event.bodyA;
            // Remove from entered bodies set
            if (this.enteredBodies.has(otherBody)) {
                this.enteredBodies.delete(otherBody);
                // Emit exit event
                this.emit('exit', otherBody);
                // Call exit callbacks
                for (const callback of this.exitCallbacks) {
                    try {
                        callback(otherBody);
                    }
                    catch (error) {
                        this.emit('error', error);
                    }
                }
            }
        });
        // Handle collision active (body stays in trigger)
        this.body.on('collision-active', (event) => {
            if (!this.isActive)
                return;
            const otherBody = event.bodyA === this.body ? event.bodyB : event.bodyA;
            // Check if body is in entered bodies set
            if (this.enteredBodies.has(otherBody)) {
                // Emit stay event
                this.emit('stay', otherBody);
                // Call stay callbacks
                for (const callback of this.stayCallbacks) {
                    try {
                        callback(otherBody);
                    }
                    catch (error) {
                        this.emit('error', error);
                    }
                }
            }
        });
    }
}
exports.GameByteTriggerZone = GameByteTriggerZone;
