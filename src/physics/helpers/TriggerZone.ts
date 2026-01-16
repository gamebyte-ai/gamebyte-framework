import { EventEmitter } from 'eventemitter3';
import {
  TriggerZone,
  PhysicsBody,
  PhysicsWorld,
  PhysicsBodyConfig,
  CollisionEvent
} from '../../contracts/Physics';

/**
 * Trigger zone implementation for game events
 */
export class GameByteTriggerZone extends EventEmitter implements TriggerZone {
  public readonly id: string;
  public readonly body: PhysicsBody;
  public readonly enteredBodies: Set<PhysicsBody> = new Set();

  // Private backing field for mutable state
  private _isActive: boolean = true;

  private world: PhysicsWorld;
  private triggerMask = 0xFFFFFFFF;
  private enterCallbacks: ((body: PhysicsBody) => void)[] = [];
  private exitCallbacks: ((body: PhysicsBody) => void)[] = [];
  private stayCallbacks: ((body: PhysicsBody) => void)[] = [];

  constructor(world: PhysicsWorld, config: PhysicsBodyConfig) {
    super();
    this.world = world;
    this.id = config.id || `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create trigger body (sensor)
    const triggerConfig: PhysicsBodyConfig = {
      ...config,
      id: this.id,
      type: 'static',
      isSensor: true
    };
    
    this.body = world.createBody(triggerConfig);
    this.setupCollisionEvents();
  }

  // Public getter for readonly access
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Set trigger zone active state
   */
  setActive(active: boolean): void {
    this._isActive = active;
    this.emit('active-changed', active);
  }

  /**
   * Set collision mask for trigger detection
   */
  setTriggerMask(mask: number): void {
    this.triggerMask = mask;
    this.body.collisionMask = mask;
    this.emit('trigger-mask-changed', mask);
  }

  /**
   * Add callback for body entering trigger
   */
  onEnter(callback: (body: PhysicsBody) => void): void {
    this.enterCallbacks.push(callback);
  }

  /**
   * Add callback for body exiting trigger
   */
  onExit(callback: (body: PhysicsBody) => void): void {
    this.exitCallbacks.push(callback);
  }

  /**
   * Add callback for body staying in trigger
   */
  onStay(callback: (body: PhysicsBody) => void): void {
    this.stayCallbacks.push(callback);
  }

  /**
   * Check if a body is inside the trigger
   */
  isBodyInside(body: PhysicsBody): boolean {
    return this.enteredBodies.has(body);
  }

  /**
   * Get all bodies currently inside the trigger
   */
  getBodiesInside(): PhysicsBody[] {
    return Array.from(this.enteredBodies);
  }

  /**
   * Destroy the trigger zone
   */
  destroy(): void {
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
  private setupCollisionEvents(): void {
    // Handle collision start (body enters trigger)
    this.body.on('collision-start', (event: CollisionEvent) => {
      if (!this.isActive) return;
      
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
          } catch (error) {
            this.emit('error', error);
          }
        }
      }
    });

    // Handle collision end (body exits trigger)
    this.body.on('collision-end', (event: CollisionEvent) => {
      if (!this.isActive) return;
      
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
          } catch (error) {
            this.emit('error', error);
          }
        }
      }
    });

    // Handle collision active (body stays in trigger)
    this.body.on('collision-active', (event: CollisionEvent) => {
      if (!this.isActive) return;
      
      const otherBody = event.bodyA === this.body ? event.bodyB : event.bodyA;
      
      // Check if body is in entered bodies set
      if (this.enteredBodies.has(otherBody)) {
        // Emit stay event
        this.emit('stay', otherBody);
        
        // Call stay callbacks
        for (const callback of this.stayCallbacks) {
          try {
            callback(otherBody);
          } catch (error) {
            this.emit('error', error);
          }
        }
      }
    });
  }
}