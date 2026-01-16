import { EventEmitter } from 'eventemitter3';
import { Point } from './UI';

// Re-export Point for physics modules
export type { Point } from './UI';

/**
 * Physics dimension types for the unified physics system
 */
export type PhysicsDimension = '2d' | '3d';

/**
 * Physics engine types supported by the framework
 */
export type PhysicsEngineType = 'matter' | 'cannon' | 'ammo';

/**
 * Physics body types
 */
export type PhysicsBodyType = 'static' | 'dynamic' | 'kinematic';

/**
 * Physics shape types
 */
export type PhysicsShapeType = 'box' | 'circle' | 'sphere' | 'capsule' | 'mesh' | 'heightfield' | 'compound';

/**
 * Physics material properties
 */
export interface PhysicsMaterial {
  id: string;
  name: string;
  friction: number;
  restitution: number;
  density: number;
  frictionAir?: number;
  frictionStatic?: number;
  damping?: number;
  angularDamping?: number;
}

/**
 * 3D vector for physics calculations
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Quaternion for 3D rotations
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Physics shape configuration
 */
export interface PhysicsShapeConfig {
  type: PhysicsShapeType;
  dimensions: Point | Vector3;
  radius?: number;
  height?: number;
  material?: PhysicsMaterial;
  isSensor?: boolean;
  collisionGroup?: number;
  collisionMask?: number;
  offset?: Point | Vector3;
  rotation?: number | Quaternion;
}

/**
 * Physics body configuration
 */
export interface PhysicsBodyConfig {
  id?: string;
  type: PhysicsBodyType;
  position: Point | Vector3;
  rotation?: number | Quaternion;
  velocity?: Point | Vector3;
  angularVelocity?: number | Vector3;
  mass?: number;
  shapes: PhysicsShapeConfig[];
  material?: PhysicsMaterial;
  isStatic?: boolean;
  isSensor?: boolean;
  allowSleep?: boolean;
  sleepTimeLimit?: number;
  sleepSpeedLimit?: number;
  fixedRotation?: boolean;
  gravityScale?: number;
  linearDamping?: number;
  angularDamping?: number;
  collisionGroup?: number;
  collisionMask?: number;
  userData?: any;
}

/**
 * Simplified body configuration for quick setup
 * Provides a more intuitive API for common use cases
 */
export interface SimpleBodyConfig {
  /** Shape type */
  shape: 'rectangle' | 'circle' | 'polygon';
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width (for rectangle) */
  width?: number;
  /** Height (for rectangle) */
  height?: number;
  /** Radius (for circle) */
  radius?: number;
  /** Vertices (for polygon) */
  vertices?: Point[];
  /** Additional options */
  options?: {
    isStatic?: boolean;
    isSensor?: boolean;
    friction?: number;
    frictionAir?: number;
    frictionStatic?: number;
    restitution?: number;
    density?: number;
    mass?: number;
    label?: string;
    angle?: number;
    angularVelocity?: number;
    collisionGroup?: number;
    collisionMask?: number;
    fixedRotation?: boolean;
    gravityScale?: number;
  };
}

/**
 * Physics constraint/joint types
 */
export type PhysicsConstraintType = 
  | 'distance' | 'spring' | 'revolute' | 'prismatic' 
  | 'fixed' | 'rope' | 'gear' | 'pulley' | 'mouse';

/**
 * Physics constraint configuration
 */
export interface PhysicsConstraintConfig {
  id?: string;
  type: PhysicsConstraintType;
  bodyA: string; // Body ID
  bodyB: string; // Body ID
  anchorA?: Point | Vector3;
  anchorB?: Point | Vector3;
  axis?: Point | Vector3;
  length?: number;
  stiffness?: number;
  damping?: number;
  lowerLimit?: number;
  upperLimit?: number;
  motorSpeed?: number;
  motorForce?: number;
  enableMotor?: boolean;
  userData?: any;
}

/**
 * Collision event data
 */
export interface CollisionEvent {
  type: 'collision-start' | 'collision-end' | 'collision-active' | 'trigger-enter' | 'trigger-exit';
  bodyA: PhysicsBody;
  bodyB: PhysicsBody;
  contactPoint?: Point | Vector3;
  contactNormal?: Point | Vector3;
  impulse?: number;
  timestamp: number;
  userData?: any;
}

/**
 * Ray casting result
 */
export interface RaycastResult {
  hit: boolean;
  body?: PhysicsBody;
  point?: Point | Vector3;
  normal?: Point | Vector3;
  distance?: number;
  fraction?: number;
}

/**
 * Ray casting configuration
 */
export interface RaycastOptions {
  from: Point | Vector3;
  to: Point | Vector3;
  collisionGroup?: number;
  collisionMask?: number;
  skipBackfaces?: boolean;
  userData?: any;
}

/**
 * Physics world configuration
 */
export interface PhysicsWorldConfig {
  dimension: PhysicsDimension;
  gravity: Point | Vector3;
  allowSleep?: boolean;
  enableCCD?: boolean; // Continuous Collision Detection
  broadphaseType?: 'naive' | 'sap' | 'grid';
  iterations?: {
    velocity: number;
    position: number;
  };
  timeStep?: number;
  maxSubSteps?: number;
  bounds?: {
    min: Point | Vector3;
    max: Point | Vector3;
  };
}

/**
 * Physics performance metrics
 */
export interface PhysicsPerformanceMetrics {
  averageStepTime: number;
  bodyCount: number;
  constraintCount: number;
  contactCount: number;
  broadphaseTime: number;
  narrowphaseTime: number;
  solverTime: number;
  memoryUsage: number;
  sleepingBodies: number;
  activeBodies: number;
  culledBodies: number;
}

/**
 * Physics body interface
 */
export interface PhysicsBody extends EventEmitter {
  readonly id: string;
  readonly type: PhysicsBodyType;
  readonly dimension: PhysicsDimension;
  readonly isStatic: boolean;
  readonly isSensor: boolean;
  readonly isActive: boolean;
  readonly isSleeping: boolean;
  
  // Transform properties
  position: Point | Vector3;
  rotation: number | Quaternion;
  velocity: Point | Vector3;
  angularVelocity: number | Vector3;
  
  // Physical properties
  mass: number;
  material: PhysicsMaterial;
  gravityScale: number;
  linearDamping: number;
  angularDamping: number;
  
  // Collision properties
  collisionGroup: number;
  collisionMask: number;
  bounds: { min: Point | Vector3; max: Point | Vector3 };
  
  // User data
  userData: any;
  
  // Methods
  applyForce(force: Point | Vector3, point?: Point | Vector3): void;
  applyImpulse(impulse: Point | Vector3, point?: Point | Vector3): void;
  applyTorque(torque: number | Vector3): void;
  setStatic(isStatic: boolean): void;
  setSensor(isSensor: boolean): void;
  setActive(active: boolean): void;
  wakeUp(): void;
  sleep(): void;
  addShape(config: PhysicsShapeConfig): void;
  removeShape(index: number): void;
  updateTransform(): void;
  destroy(): void;
}

/**
 * Physics constraint interface
 */
export interface PhysicsConstraint extends EventEmitter {
  readonly id: string;
  readonly type: PhysicsConstraintType;
  readonly bodyA: PhysicsBody;
  readonly bodyB: PhysicsBody;
  
  // Configuration
  stiffness: number;
  damping: number;
  motorSpeed: number;
  motorForce: number;
  isMotorEnabled: boolean;
  
  // User data
  userData: any;
  
  // Methods
  setStiffness(stiffness: number): void;
  setDamping(damping: number): void;
  setMotorSpeed(speed: number): void;
  setMotorForce(force: number): void;
  enableMotor(enabled: boolean): void;
  destroy(): void;
}

/**
 * Physics world interface
 */
export interface PhysicsWorld extends EventEmitter {
  readonly dimension: PhysicsDimension;
  readonly engineType: PhysicsEngineType;
  readonly isRunning: boolean;
  readonly bodyCount: number;
  readonly constraintCount: number;
  
  // World properties
  gravity: Point | Vector3;
  timeStep: number;
  iterations: { velocity: number; position: number };
  
  // World management
  step(deltaTime: number): void;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  clear(): void;
  
  // Body management
  createBody(config: PhysicsBodyConfig): PhysicsBody;
  addBody(body: PhysicsBody): void;
  removeBody(body: PhysicsBody | string): void;
  getBody(id: string): PhysicsBody | null;
  getAllBodies(): PhysicsBody[];
  getActiveBodies(): PhysicsBody[];
  getSleepingBodies(): PhysicsBody[];
  
  // Constraint management
  createConstraint(config: PhysicsConstraintConfig): PhysicsConstraint;
  addConstraint(constraint: PhysicsConstraint): void;
  removeConstraint(constraint: PhysicsConstraint | string): void;
  getConstraint(id: string): PhysicsConstraint | null;
  getAllConstraints(): PhysicsConstraint[];
  
  // Collision detection
  raycast(options: RaycastOptions): RaycastResult[];
  queryAABB(min: Point | Vector3, max: Point | Vector3): PhysicsBody[];
  queryPoint(point: Point | Vector3): PhysicsBody[];
  checkCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): boolean;
  
  // Performance and debugging
  getPerformanceMetrics(): PhysicsPerformanceMetrics;
  enableDebugDraw(enabled: boolean): void;
  setGravity(gravity: Point | Vector3): void;
  setTimeStep(timeStep: number): void;
  optimizeForMobile(): void;
  destroy(): void;
}

/**
 * Physics engine wrapper interface
 */
export interface PhysicsEngine extends EventEmitter {
  readonly engineType: PhysicsEngineType;
  readonly dimension: PhysicsDimension;
  readonly isInitialized: boolean;
  
  // Lifecycle
  initialize(config?: any): Promise<void>;
  destroy(): void;
  
  // World creation
  createWorld(config: PhysicsWorldConfig): PhysicsWorld;
  destroyWorld(world: PhysicsWorld): void;
  
  // Factory methods
  createMaterial(config: Partial<PhysicsMaterial>): PhysicsMaterial;
  getDefaultMaterial(): PhysicsMaterial;
  
  // Performance
  optimizeForDevice(deviceTier: 'low' | 'medium' | 'high'): void;
  enableObjectPooling(enabled: boolean): void;
  setMaxBodies(maxBodies: number): void;
  getPerformanceMetrics(): PhysicsPerformanceMetrics;
}

/**
 * Game-specific physics helpers
 */

/**
 * Platformer physics helper interface
 */
export interface PlatformerPhysicsHelper extends EventEmitter {
  // Character properties
  readonly character: PhysicsBody;
  readonly isGrounded: boolean;
  readonly isOnWall: boolean;
  readonly canJump: boolean;
  readonly canWallJump: boolean;
  
  // Movement
  setHorizontalInput(input: number): void;
  jump(force?: number): boolean;
  wallJump(direction: number, force?: number): boolean;
  dash(direction: Point, force: number): void;
  
  // Configuration
  setGroundDetection(config: {
    rayLength: number;
    rayOffset: number;
    groundMask: number;
  }): void;
  setWallDetection(config: {
    rayLength: number;
    rayOffset: number;
    wallMask: number;
  }): void;
  setMovementSettings(config: {
    maxSpeed: number;
    acceleration: number;
    deceleration: number;
    airAcceleration: number;
    jumpForce: number;
    wallJumpForce: number;
    coyoteTime: number;
    jumpBufferTime: number;
  }): void;
  
  // State queries
  getGroundNormal(): Point;
  getWallNormal(): Point;
  getMovementState(): 'idle' | 'walking' | 'running' | 'jumping' | 'falling' | 'wall-sliding';
  
  // Physics update
  update(deltaTime: number): void;
  
  // Ground and wall detection
  checkGrounded(): boolean;
  checkWallContact(): boolean;
  
  // Special abilities
  enableDoubleJump(enabled: boolean): void;
  enableWallSliding(enabled: boolean): void;
  enableCoyoteTime(enabled: boolean): void;
  enableJumpBuffering(enabled: boolean): void;
}

/**
 * Top-down physics helper interface
 */
export interface TopDownPhysicsHelper extends EventEmitter {
  // Character properties
  readonly character: PhysicsBody;
  readonly isMoving: boolean;
  readonly currentSpeed: number;
  
  // Movement
  setMovementInput(input: Point): void;
  dash(direction: Point, force: number): void;
  brake(force?: number): void;
  
  // Configuration
  setMovementSettings(config: {
    maxSpeed: number;
    acceleration: number;
    deceleration: number;
    rotationSpeed: number;
    dragCoefficient: number;
  }): void;
  
  // State queries
  getMovementDirection(): Point;
  getMovementSpeed(): number;
  
  // Physics update
  update(deltaTime: number): void;
  
  // Special features
  enableRotation(enabled: boolean): void;
  enableMomentum(enabled: boolean): void;
}

/**
 * Trigger zone interface for game events
 */
export interface TriggerZone extends EventEmitter {
  readonly id: string;
  readonly body: PhysicsBody;
  readonly isActive: boolean;
  readonly enteredBodies: Set<PhysicsBody>;
  
  // Configuration
  setActive(active: boolean): void;
  setTriggerMask(mask: number): void;
  
  // Events
  onEnter(callback: (body: PhysicsBody) => void): void;
  onExit(callback: (body: PhysicsBody) => void): void;
  onStay(callback: (body: PhysicsBody) => void): void;
  
  // Queries
  isBodyInside(body: PhysicsBody): boolean;
  getBodiesInside(): PhysicsBody[];
  
  // Lifecycle
  destroy(): void;
}

/**
 * Physics particle system interface
 */
export interface PhysicsParticleSystem extends EventEmitter {
  readonly particleCount: number;
  readonly isActive: boolean;
  
  // Particle management
  emitParticles(count: number, config: PhysicsBodyConfig): void;
  burst(count: number, config: PhysicsBodyConfig): void;
  clear(): void;
  
  // Configuration
  setEmissionRate(rate: number): void;
  setLifetime(min: number, max: number): void;
  setVelocityRange(min: Point | Vector3, max: Point | Vector3): void;
  setForceOverTime(force: Point | Vector3): void;
  
  // Lifecycle
  start(): void;
  stop(): void;
  pause(): void;
  update(deltaTime: number): void;
  destroy(): void;
}

/**
 * Mobile physics optimization interface
 */
export interface MobilePhysicsOptimizer {
  // Performance optimization
  enableCulling(enabled: boolean): void;
  setCullingDistance(distance: number): void;
  enableLOD(enabled: boolean): void;
  setLODLevels(levels: { distance: number; quality: number }[]): void;
  
  // Adaptive quality
  enableAdaptiveQuality(enabled: boolean): void;
  setPerformanceTarget(fps: number): void;
  setQualityLevels(levels: {
    low: { timeStep: number; iterations: number };
    medium: { timeStep: number; iterations: number };
    high: { timeStep: number; iterations: number };
  }): void;
  
  // Battery optimization
  enableBatteryOptimization(enabled: boolean): void;
  setSleepThresholds(linear: number, angular: number): void;
  enableAdaptiveSleep(enabled: boolean): void;
  
  // Memory management
  enableObjectPooling(enabled: boolean): void;
  setPoolSizes(bodies: number, constraints: number): void;
  forceGarbageCollection(): void;
  
  // Device detection
  detectDeviceTier(): 'low' | 'medium' | 'high';
  optimizeForDevice(): void;
  
  // Performance monitoring
  getPerformanceMetrics(): PhysicsPerformanceMetrics;
  enablePerformanceMonitoring(enabled: boolean): void;
}

/**
 * Main physics manager interface
 */
export interface PhysicsManager extends EventEmitter {
  readonly isInitialized: boolean;
  readonly currentWorld: PhysicsWorld | null;
  readonly dimension: PhysicsDimension | null;
  readonly performanceMetrics: PhysicsPerformanceMetrics;
  
  // Initialization
  initialize(dimension: PhysicsDimension, engineType?: PhysicsEngineType): Promise<void>;
  destroy(): void;
  
  // World management
  createWorld(config: PhysicsWorldConfig): PhysicsWorld;
  setActiveWorld(world: PhysicsWorld): void;
  getActiveWorld(): PhysicsWorld | null;
  destroyWorld(world: PhysicsWorld): void;
  
  // Engine management
  switchEngine(engineType: PhysicsEngineType): Promise<void>;
  getCurrentEngine(): PhysicsEngine | null;
  
  // Helper creation
  createPlatformerHelper(character: PhysicsBody): PlatformerPhysicsHelper;
  createTopDownHelper(character: PhysicsBody): TopDownPhysicsHelper;
  createTriggerZone(config: PhysicsBodyConfig): TriggerZone;
  createParticleSystem(config: any): PhysicsParticleSystem;
  
  // Mobile optimization
  getMobileOptimizer(): MobilePhysicsOptimizer;
  enableMobileOptimizations(): void;
  setDeviceTier(tier: 'low' | 'medium' | 'high'): void;
  
  // Material management
  createMaterial(config: Partial<PhysicsMaterial>): PhysicsMaterial;
  getMaterial(id: string): PhysicsMaterial | null;
  registerMaterial(material: PhysicsMaterial): void;
  
  // Global physics update
  update(deltaTime: number): void;
  
  // Performance and debugging
  getPerformanceMetrics(): PhysicsPerformanceMetrics;
  enableDebugMode(enabled: boolean): void;
  optimizeForMobile(): void;
}