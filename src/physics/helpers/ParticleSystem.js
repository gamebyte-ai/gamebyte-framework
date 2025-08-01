"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameByteParticleSystem = void 0;
const eventemitter3_1 = require("eventemitter3");
/**
 * Physics-based particle system implementation
 */
class GameByteParticleSystem extends eventemitter3_1.EventEmitter {
    constructor(world, config) {
        super();
        this.particleCount = 0;
        this.isActive = false;
        this.particles = [];
        this.emissionRate = 10; // particles per second
        this.emissionTimer = 0;
        this.minLifetime = 1;
        this.maxLifetime = 3;
        this.velocityMin = { x: -1, y: 1 };
        this.velocityMax = { x: 1, y: 3 };
        this.forceOverTime = { x: 0, y: -9.82 };
        this.maxParticles = 100;
        this.burstMode = false;
        this.world = world;
        this.parseConfig(config);
    }
    /**
     * Emit particles continuously
     */
    emit(count, config) {
        if (!this.isActive)
            return;
        const actualCount = Math.min(count, this.maxParticles - this.particles.length);
        for (let i = 0; i < actualCount; i++) {
            this.createParticle(config);
        }
        this.updateParticleCount();
        this.emit('particles-emitted', actualCount);
    }
    /**
     * Emit a burst of particles
     */
    burst(count, config) {
        const actualCount = Math.min(count, this.maxParticles - this.particles.length);
        for (let i = 0; i < actualCount; i++) {
            this.createParticle(config);
        }
        this.updateParticleCount();
        this.emit('particles-burst', actualCount);
    }
    /**
     * Clear all particles
     */
    clear() {
        for (const particle of this.particles) {
            this.world.removeBody(particle.body);
        }
        this.particles.length = 0;
        this.updateParticleCount();
        this.emit('particles-cleared');
    }
    /**
     * Set emission rate (particles per second)
     */
    setEmissionRate(rate) {
        this.emissionRate = Math.max(0, rate);
        this.emit('emission-rate-changed', this.emissionRate);
    }
    /**
     * Set particle lifetime range
     */
    setLifetime(min, max) {
        this.minLifetime = Math.max(0, min);
        this.maxLifetime = Math.max(this.minLifetime, max);
        this.emit('lifetime-changed', { min: this.minLifetime, max: this.maxLifetime });
    }
    /**
     * Set particle velocity range
     */
    setVelocityRange(min, max) {
        this.velocityMin = { ...min };
        this.velocityMax = { ...max };
        this.emit('velocity-range-changed', { min: this.velocityMin, max: this.velocityMax });
    }
    /**
     * Set force applied to particles over time (e.g., gravity)
     */
    setForceOverTime(force) {
        this.forceOverTime = { ...force };
        this.emit('force-over-time-changed', this.forceOverTime);
    }
    /**
     * Start the particle system
     */
    start() {
        this.isActive = true;
        this.emit('started');
    }
    /**
     * Stop the particle system
     */
    stop() {
        this.isActive = false;
        this.emit('stopped');
    }
    /**
     * Pause the particle system
     */
    pause() {
        this.isActive = false;
        this.emit('paused');
    }
    /**
     * Update the particle system (call every frame)
     */
    update(deltaTime) {
        // Update emission timer
        if (this.isActive && !this.burstMode) {
            this.emissionTimer += deltaTime;
            if (this.emissionTimer >= 1 / this.emissionRate) {
                this.emit(1, this.baseConfig);
                this.emissionTimer = 0;
            }
        }
        // Update existing particles
        this.updateParticles(deltaTime);
        // Remove dead particles
        this.removeDeadParticles();
        this.emit('updated', deltaTime);
    }
    /**
     * Destroy the particle system
     */
    destroy() {
        this.stop();
        this.clear();
        this.emit('destroyed');
        this.removeAllListeners();
    }
    /**
     * Create a new particle
     */
    createParticle(config) {
        // Clone config to avoid modifying original
        const particleConfig = {
            ...config,
            id: `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            velocity: this.randomizeVelocity()
        };
        // Create physics body
        const body = this.world.createBody(particleConfig);
        // Create particle data
        const particle = {
            body,
            lifetime: this.randomLifetime(),
            maxLifetime: this.randomLifetime(),
            age: 0
        };
        this.particles.push(particle);
    }
    /**
     * Update all particles
     */
    updateParticles(deltaTime) {
        for (const particle of this.particles) {
            // Update age
            particle.age += deltaTime;
            // Apply force over time
            particle.body.applyForce(this.forceOverTime);
            // Apply any particle-specific updates here
            // (could add size scaling, color changes, etc.)
        }
    }
    /**
     * Remove particles that have exceeded their lifetime
     */
    removeDeadParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            if (particle.age >= particle.lifetime) {
                // Remove from physics world
                this.world.removeBody(particle.body);
                // Remove from particles array
                this.particles.splice(i, 1);
                this.emit('particle-died', particle);
            }
        }
        this.updateParticleCount();
    }
    /**
     * Generate random velocity within range
     */
    randomizeVelocity() {
        if (this.world.dimension === '2d') {
            const min = this.velocityMin;
            const max = this.velocityMax;
            return {
                x: min.x + Math.random() * (max.x - min.x),
                y: min.y + Math.random() * (max.y - min.y)
            };
        }
        else {
            const min = this.velocityMin;
            const max = this.velocityMax;
            return {
                x: min.x + Math.random() * (max.x - min.x),
                y: min.y + Math.random() * (max.y - min.y),
                z: min.z + Math.random() * (max.z - min.z)
            };
        }
    }
    /**
     * Generate random lifetime within range
     */
    randomLifetime() {
        return this.minLifetime + Math.random() * (this.maxLifetime - this.minLifetime);
    }
    /**
     * Update particle count property
     */
    updateParticleCount() {
        this.particleCount = this.particles.length;
    }
    /**
     * Parse configuration object
     */
    parseConfig(config) {
        // Set default base config for particles
        this.baseConfig = config.baseConfig || {
            type: 'dynamic',
            position: { x: 0, y: 0 },
            shapes: [{
                    type: 'circle',
                    dimensions: { x: 0.1, y: 0.1 },
                    radius: 0.05
                }],
            mass: 0.1
        };
        // Parse emission settings
        if (config.emissionRate !== undefined) {
            this.setEmissionRate(config.emissionRate);
        }
        // Parse lifetime settings
        if (config.lifetime) {
            this.setLifetime(config.lifetime.min || this.minLifetime, config.lifetime.max || this.maxLifetime);
        }
        // Parse velocity settings
        if (config.velocity) {
            this.setVelocityRange(config.velocity.min || this.velocityMin, config.velocity.max || this.velocityMax);
        }
        // Parse force settings
        if (config.forceOverTime !== undefined) {
            this.setForceOverTime(config.forceOverTime);
        }
        // Parse limits
        if (config.maxParticles !== undefined) {
            this.maxParticles = Math.max(1, config.maxParticles);
        }
        // Parse mode
        if (config.burstMode !== undefined) {
            this.burstMode = config.burstMode;
        }
    }
}
exports.GameByteParticleSystem = GameByteParticleSystem;
