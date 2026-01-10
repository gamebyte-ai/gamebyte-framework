import { EventEmitter } from 'eventemitter3';
import {
  PhysicsParticleSystem,
  PhysicsWorld,
  PhysicsBody,
  PhysicsBodyConfig,
  Point,
  Vector3
} from '../../contracts/Physics';

/**
 * Particle data for tracking individual particles
 */
interface Particle {
  body: PhysicsBody;
  lifetime: number;
  maxLifetime: number;
  age: number;
}

/**
 * Physics-based particle system implementation
 */
export class GameByteParticleSystem extends EventEmitter implements PhysicsParticleSystem {
  // Private backing fields for mutable state properties
  private _particleCount: number = 0;
  private _isActive: boolean = false;

  private world: PhysicsWorld;
  private particles: Particle[] = [];
  private emissionRate = 10; // particles per second
  private emissionTimer = 0;
  private minLifetime = 1;
  private maxLifetime = 3;
  private velocityMin: Point | Vector3 = { x: -1, y: 1 };
  private velocityMax: Point | Vector3 = { x: 1, y: 3 };
  private forceOverTime: Point | Vector3 = { x: 0, y: -9.82 };
  private baseConfig: PhysicsBodyConfig = {
    type: 'dynamic',
    position: { x: 0, y: 0 },
    shapes: [{
      type: 'circle',
      dimensions: { x: 0.1, y: 0.1 },
      radius: 0.05
    }],
    mass: 0.1
  };
  private maxParticles = 100;
  private burstMode = false;

  // Public getters for readonly access
  get particleCount(): number {
    return this._particleCount;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  constructor(world: PhysicsWorld, config: any) {
    super();
    this.world = world;
    this.parseConfig(config);
  }

  /**
   * Emit particles continuously
   */
  emitParticles(count: number, config: PhysicsBodyConfig): void {
    if (!this.isActive) return;
    
    const actualCount = Math.min(count, this.maxParticles - this.particles.length);
    
    for (let i = 0; i < actualCount; i++) {
      this.createParticle(config);
    }
    
    this.updateParticleCount();
    super.emit('particles-emitted', actualCount);
  }

  /**
   * Emit a burst of particles
   */
  burst(count: number, config: PhysicsBodyConfig): void {
    const actualCount = Math.min(count, this.maxParticles - this.particles.length);
    
    for (let i = 0; i < actualCount; i++) {
      this.createParticle(config);
    }
    
    this.updateParticleCount();
    super.emit('particles-burst', actualCount);
  }

  /**
   * Clear all particles
   */
  clear(): void {
    for (const particle of this.particles) {
      this.world.removeBody(particle.body);
    }
    
    this.particles.length = 0;
    this.updateParticleCount();
    super.emit('particles-cleared');
  }

  /**
   * Set emission rate (particles per second)
   */
  setEmissionRate(rate: number): void {
    this.emissionRate = Math.max(0, rate);
    super.emit('emission-rate-changed', this.emissionRate);
  }

  /**
   * Set particle lifetime range
   */
  setLifetime(min: number, max: number): void {
    this.minLifetime = Math.max(0, min);
    this.maxLifetime = Math.max(this.minLifetime, max);
    super.emit('lifetime-changed', { min: this.minLifetime, max: this.maxLifetime });
  }

  /**
   * Set particle velocity range
   */
  setVelocityRange(min: Point | Vector3, max: Point | Vector3): void {
    this.velocityMin = { ...min };
    this.velocityMax = { ...max };
    super.emit('velocity-range-changed', { min: this.velocityMin, max: this.velocityMax });
  }

  /**
   * Set force applied to particles over time (e.g., gravity)
   */
  setForceOverTime(force: Point | Vector3): void {
    this.forceOverTime = { ...force };
    super.emit('force-over-time-changed', this.forceOverTime);
  }

  /**
   * Start the particle system
   */
  start(): void {
    this._isActive = true;
    super.emit('started');
  }

  /**
   * Stop the particle system
   */
  stop(): void {
    this._isActive = false;
    super.emit('stopped');
  }

  /**
   * Pause the particle system
   */
  pause(): void {
    this._isActive = false;
    super.emit('paused');
  }

  /**
   * Update the particle system (call every frame)
   */
  update(deltaTime: number): void {
    // Update emission timer
    if (this.isActive && !this.burstMode) {
      this.emissionTimer += deltaTime;
      
      if (this.emissionTimer >= 1 / this.emissionRate) {
        this.emitParticles(1, this.baseConfig);
        this.emissionTimer = 0;
      }
    }
    
    // Update existing particles
    this.updateParticles(deltaTime);
    
    // Remove dead particles
    this.removeDeadParticles();
    
    super.emit('updated', deltaTime);
  }

  /**
   * Destroy the particle system
   */
  destroy(): void {
    this.stop();
    this.clear();
    super.emit('destroyed');
    this.removeAllListeners();
  }

  /**
   * Create a new particle
   */
  private createParticle(config: PhysicsBodyConfig): void {
    // Clone config to avoid modifying original
    const particleConfig: PhysicsBodyConfig = {
      ...config,
      id: `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      velocity: this.randomizeVelocity()
    };
    
    // Create physics body
    const body = this.world.createBody(particleConfig);
    
    // Create particle data
    const particle: Particle = {
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
  private updateParticles(deltaTime: number): void {
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
  private removeDeadParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      if (particle.age >= particle.lifetime) {
        // Remove from physics world
        this.world.removeBody(particle.body);
        
        // Remove from particles array
        this.particles.splice(i, 1);
        
        super.emit('particle-died', particle);
      }
    }
    
    this.updateParticleCount();
  }

  /**
   * Generate random velocity within range
   */
  private randomizeVelocity(): Point | Vector3 {
    if (this.world.dimension === '2d') {
      const min = this.velocityMin as Point;
      const max = this.velocityMax as Point;
      
      return {
        x: min.x + Math.random() * (max.x - min.x),
        y: min.y + Math.random() * (max.y - min.y)
      };
    } else {
      const min = this.velocityMin as Vector3;
      const max = this.velocityMax as Vector3;
      
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
  private randomLifetime(): number {
    return this.minLifetime + Math.random() * (this.maxLifetime - this.minLifetime);
  }

  /**
   * Update particle count property
   */
  private updateParticleCount(): void {
    this._particleCount = this.particles.length;
  }

  /**
   * Parse configuration object
   */
  private parseConfig(config: any): void {
    // Override base config if provided
    if (config.baseConfig) {
      this.baseConfig = { ...this.baseConfig, ...config.baseConfig };
    }
    
    // Parse emission settings
    if (config.emissionRate !== undefined) {
      this.setEmissionRate(config.emissionRate);
    }
    
    // Parse lifetime settings
    if (config.lifetime) {
      this.setLifetime(
        config.lifetime.min || this.minLifetime,
        config.lifetime.max || this.maxLifetime
      );
    }
    
    // Parse velocity settings
    if (config.velocity) {
      this.setVelocityRange(
        config.velocity.min || this.velocityMin,
        config.velocity.max || this.velocityMax
      );
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