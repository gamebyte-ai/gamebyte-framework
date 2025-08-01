# GameByte Physics Integration System

The GameByte Framework includes a comprehensive physics integration system that provides unified 2D and 3D physics capabilities optimized for mobile games. The system supports both Matter.js (2D) and Cannon.js (3D) engines with seamless switching and advanced mobile optimizations.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [2D Physics (Matter.js)](#2d-physics-matterjs)
4. [3D Physics (Cannon.js)](#3d-physics-cannonjs)
5. [Game-Specific Helpers](#game-specific-helpers)
6. [Mobile Optimizations](#mobile-optimizations)
7. [Advanced Features](#advanced-features)
8. [Performance](#performance)
9. [API Reference](#api-reference)
10. [Examples](#examples)

## Quick Start

### Basic Setup

```typescript
import { createMobileGame, initializeFacades, Physics } from '@gamebyte/framework';

// Create game instance
const game = createMobileGame();
initializeFacades(game);

// Initialize physics for 2D
await Physics.initialize('2d', 'matter');

// Create a physics world
const world = Physics.createWorld({
  dimension: '2d',
  gravity: { x: 0, y: 9.82 },
  allowSleep: true
});

// Create a physics body
const body = Physics.createBody({
  type: 'dynamic',
  position: { x: 0, y: 0 },
  shapes: [{
    type: 'box',
    dimensions: { x: 1, y: 1 }
  }]
});

// Start simulation
Physics.start();
```

### Platformer Game Example

```typescript
// Create character with platformer helper
const character = Physics.createBody({
  type: 'dynamic',
  position: { x: 0, y: 0 },
  shapes: [{ type: 'box', dimensions: { x: 0.8, y: 1.6 } }],
  fixedRotation: true
});

const platformerHelper = Physics.createPlatformerHelper(character);

// Configure movement
platformerHelper.setMovementSettings({
  maxSpeed: 6,
  acceleration: 25,
  jumpForce: 12,
  coyoteTime: 0.15
});

// Enable advanced features
platformerHelper.enableDoubleJump(true);
platformerHelper.enableWallSliding(true);

// Handle input
platformerHelper.setHorizontalInput(-1); // Move left
platformerHelper.jump(); // Jump

// Update in game loop
platformerHelper.update(deltaTime);
```

## Core Concepts

### Physics Dimensions

The system supports both 2D and 3D physics with automatic engine selection:

- **2D Physics**: Uses Matter.js engine, optimized for platformers, puzzle games, and top-down games
- **3D Physics**: Uses Cannon.js engine, optimized for 3D games, racing games, and first-person experiences

### Unified API

All physics interactions use the same API regardless of dimension:

```typescript
// Works for both 2D and 3D
const body = Physics.createBody(config);
body.applyForce(force, point);
body.setVelocity(velocity);
```

### Engine Switching

Switch between physics engines dynamically:

```typescript
await Physics.switchEngine('cannon'); // Switch to 3D
await Physics.switchEngine('matter');  // Switch to 2D
```

## 2D Physics (Matter.js)

### Features

- High-performance 2D rigid body physics
- Advanced collision detection with continuous collision detection (CCD)
- Constraints and joints (distance, spring, revolute, etc.)
- Sleeping and optimization systems
- Mobile-optimized broadphase collision detection

### Body Types

```typescript
// Static body (immovable)
const ground = Physics.createBody({
  type: 'static',
  position: { x: 0, y: 10 },
  shapes: [{ type: 'box', dimensions: { x: 20, y: 1 } }]
});

// Dynamic body (movable, affected by forces)
const player = Physics.createBody({
  type: 'dynamic',
  position: { x: 0, y: 0 },
  shapes: [{ type: 'circle', radius: 0.5 }],
  mass: 1
});

// Sensor body (trigger, no collision response)
const trigger = Physics.createBody({
  type: 'static',
  position: { x: 5, y: 0 },
  shapes: [{ type: 'box', dimensions: { x: 2, y: 2 } }],
  isSensor: true
});
```

### Shape Types

```typescript
// Box shape
{ type: 'box', dimensions: { x: 2, y: 1 } }

// Circle shape
{ type: 'circle', radius: 0.5 }

// Custom polygon (via compound shapes)
// Complex shapes can be created by combining multiple simple shapes
```

## 3D Physics (Cannon.js)

### Features

- Full 3D rigid body physics simulation
- Support for complex 3D shapes (box, sphere, cylinder, mesh)
- Advanced constraint system
- Optimized for mobile 3D games
- Efficient broadphase algorithms (SAP, Grid, Naive)

### Body Types

```typescript
// 3D bodies work similarly to 2D but with 3D vectors
const box3D = Physics.createBody({
  type: 'dynamic',
  position: { x: 0, y: 0, z: 0 },
  shapes: [{
    type: 'box',
    dimensions: { x: 1, y: 1, z: 1 }
  }],
  mass: 1
});

// Apply 3D forces
box3D.applyForce({ x: 0, y: 10, z: 0 });
box3D.applyTorque({ x: 1, y: 0, z: 0 });
```

### 3D Shape Types

```typescript
// Box
{ type: 'box', dimensions: { x: 1, y: 1, z: 1 } }

// Sphere
{ type: 'sphere', radius: 0.5 }

// Cylinder/Capsule
{ type: 'cylinder', radius: 0.3, height: 2 }

// Heightfield (terrain)
{ type: 'heightfield', /* height data */ }
```

## Game-Specific Helpers

### Platformer Helper

Perfect for 2D platformer games with advanced movement mechanics:

```typescript
const platformerHelper = Physics.createPlatformerHelper(character);

// Movement settings
platformerHelper.setMovementSettings({
  maxSpeed: 6,
  acceleration: 25,
  deceleration: 20,
  airAcceleration: 15,
  jumpForce: 12,
  wallJumpForce: 10,
  coyoteTime: 0.15,      // Grace time for jumping after leaving ground
  jumpBufferTime: 0.15   // Grace time for jump input before landing
});

// Ground detection
platformerHelper.setGroundDetection({
  rayLength: 0.1,
  rayOffset: 0,
  groundMask: 1
});

// Advanced features
platformerHelper.enableDoubleJump(true);
platformerHelper.enableWallSliding(true);
platformerHelper.enableCoyoteTime(true);
platformerHelper.enableJumpBuffering(true);

// Events
platformerHelper.on('jump', () => console.log('Jumped!'));
platformerHelper.on('landed', () => console.log('Landed!'));
platformerHelper.on('wall-jump', (data) => console.log('Wall jumped!', data));

// Movement states
const state = platformerHelper.getMovementState();
// Returns: 'idle' | 'walking' | 'running' | 'jumping' | 'falling' | 'wall-sliding'
```

### Top-Down Helper

Ideal for top-down games, puzzle games, and twin-stick shooters:

```typescript
const topDownHelper = Physics.createTopDownHelper(character);

// Movement settings
topDownHelper.setMovementSettings({
  maxSpeed: 5,
  acceleration: 15,
  deceleration: 10,
  rotationSpeed: 5,
  dragCoefficient: 0.98
});

// Input handling
topDownHelper.setMovementInput({ x: 1, y: 0 }); // Move right
topDownHelper.dash({ x: 1, y: 0 }, 10); // Dash right with force 10

// Features
topDownHelper.enableRotation(true);  // Rotate towards movement
topDownHelper.enableMomentum(true);   // Physics-based movement

// State queries
const isMoving = topDownHelper.isMoving;
const speed = topDownHelper.getMovementSpeed();
const direction = topDownHelper.getMovementDirection();
```

### Trigger Zones

Create interactive areas for gameplay events:

```typescript
const goalTrigger = Physics.createTriggerZone({
  position: { x: 10, y: 0 },
  shapes: [{ type: 'box', dimensions: { x: 2, y: 2 } }],
  isSensor: true
});

// Event handling
goalTrigger.onEnter((body) => {
  if (body.id === 'player') {
    console.log('Player reached the goal!');
    // Trigger level completion, scene transition, etc.
  }
});

goalTrigger.onExit((body) => {
  console.log('Body left trigger zone');
});

goalTrigger.onStay((body) => {
  console.log('Body staying in trigger zone');
});

// Query
const bodiesInside = goalTrigger.getBodiesInside();
const isPlayerInside = goalTrigger.isBodyInside(playerBody);
```

### Particle System

Physics-based particle effects:

```typescript
const particleSystem = Physics.createParticleSystem({
  baseConfig: {
    shapes: [{ type: 'circle', radius: 0.02 }],
    mass: 0.1
  },
  emissionRate: 30,
  lifetime: { min: 1, max: 3 },
  velocity: {
    min: { x: -2, y: 0 },
    max: { x: 2, y: 4 }
  },
  forceOverTime: { x: 0, y: 9.82 }, // Gravity
  maxParticles: 100
});

// Emit particles
particleSystem.start();
particleSystem.emit(10, particleConfig);
particleSystem.burst(20, particleConfig);

// Update in game loop
particleSystem.update(deltaTime);
```

## Mobile Optimizations

### Automatic Optimization

```typescript
// Enable all mobile optimizations
Physics.enableMobileOptimizations();

// Or configure individually
const optimizer = Physics.getMobileOptimizer();
optimizer.enableCulling(true);
optimizer.setCullingDistance(50);
optimizer.enableAdaptiveQuality(true);
optimizer.setPerformanceTarget(60); // Target 60 FPS
optimizer.enableBatteryOptimization(true);
```

### Device Tier Detection

```typescript
// Automatic device tier detection
const tier = optimizer.detectDeviceTier(); // 'low' | 'medium' | 'high'

// Manual override
Physics.setDeviceTier('low'); // Force low-end optimizations
```

### Performance Features

- **Physics Culling**: Disable physics for off-screen objects
- **Level of Detail (LOD)**: Reduce physics quality with distance
- **Adaptive Quality**: Automatically adjust quality based on performance
- **Object Pooling**: Reuse physics bodies to reduce garbage collection
- **Sleeping System**: Put inactive bodies to sleep to save CPU
- **Battery Optimization**: Reduce update rates and quality for battery life

## Advanced Features

### Materials

Create custom physics materials:

```typescript
const bouncyMaterial = Physics.createMaterial({
  id: 'bouncy',
  name: 'Bouncy Ball',
  friction: 0.3,
  restitution: 0.9, // High bounciness
  density: 0.5
});

const iceMaterial = Physics.createMaterial({
  id: 'ice',
  name: 'Slippery Ice',
  friction: 0.05,   // Very slippery
  restitution: 0.1,
  density: 0.9
});

// Use materials in bodies
const ball = Physics.createBody({
  shapes: [{ type: 'circle', radius: 0.5 }],
  material: bouncyMaterial
});
```

### Constraints and Joints

Connect bodies with various constraint types:

```typescript
const world = Physics.getActiveWorld();

// Distance constraint
const rope = world.createConstraint({
  type: 'distance',
  bodyA: 'bodyA_id',
  bodyB: 'bodyB_id',
  length: 5,
  stiffness: 0.8,
  damping: 0.1
});

// Revolute joint (hinge)
const hinge = world.createConstraint({
  type: 'revolute',
  bodyA: 'bodyA_id',
  bodyB: 'bodyB_id',
  anchorA: { x: 0, y: 0 },
  anchorB: { x: 1, y: 0 },
  motorSpeed: 2,
  motorForce: 10,
  enableMotor: true
});

// Spring constraint
const spring = world.createConstraint({
  type: 'spring',
  bodyA: 'bodyA_id',
  bodyB: 'bodyB_id',
  length: 2,
  stiffness: 0.02,
  damping: 0.05
});
```

### Raycasting

Perform ray casting for line-of-sight, shooting, etc.:

```typescript
const results = Physics.raycast({
  from: { x: 0, y: 0 },
  to: { x: 10, y: 0 },
  collisionMask: 0xFFFFFFFF
});

results.forEach(result => {
  console.log('Hit body:', result.body.id);
  console.log('Hit point:', result.point);
  console.log('Hit normal:', result.normal);
  console.log('Distance:', result.distance);
});
```

### Spatial Queries

Query bodies in specific areas:

```typescript
// Query bodies in AABB
const bodiesInArea = Physics.queryAABB(
  { x: -5, y: -5 }, // min
  { x: 5, y: 5 }    // max
);

// Query bodies at point
const bodiesAtPoint = Physics.queryPoint({ x: 2, y: 3 });
```

## Performance

### Monitoring

```typescript
const metrics = Physics.getPerformanceMetrics();
console.log('Active bodies:', metrics.activeBodies);
console.log('Step time:', metrics.averageStepTime, 'ms');
console.log('Memory usage:', metrics.memoryUsage, 'bytes');
console.log('Sleeping bodies:', metrics.sleepingBodies);
```

### Optimization Tips

1. **Use Static Bodies**: For immovable objects like platforms and walls
2. **Enable Sleeping**: Allow inactive bodies to sleep automatically
3. **Compound Shapes**: Use multiple simple shapes instead of complex ones
4. **Collision Filtering**: Use collision groups and masks to avoid unnecessary collision checks
5. **Object Pooling**: Reuse bodies instead of creating/destroying them frequently
6. **Update Frequency**: Consider reducing physics update rate for less critical objects

## API Reference

### Physics Facade

```typescript
// Initialization
Physics.initialize(dimension: '2d' | '3d', engineType?: string): Promise<void>
Physics.isInitialized(): boolean
Physics.getDimension(): '2d' | '3d' | null

// World Management
Physics.createWorld(config: PhysicsWorldConfig): PhysicsWorld
Physics.getActiveWorld(): PhysicsWorld | null
Physics.setActiveWorld(world: PhysicsWorld): void

// Body Creation
Physics.createBody(config: PhysicsBodyConfig): PhysicsBody
Physics.createMaterial(config: Partial<PhysicsMaterial>): PhysicsMaterial

// Helpers
Physics.createPlatformerHelper(character: PhysicsBody): PlatformerPhysicsHelper
Physics.createTopDownHelper(character: PhysicsBody): TopDownPhysicsHelper
Physics.createTriggerZone(config: PhysicsBodyConfig): TriggerZone
Physics.createParticleSystem(config: any): PhysicsParticleSystem

// Optimization
Physics.enableMobileOptimizations(): void
Physics.getMobileOptimizer(): MobilePhysicsOptimizer
Physics.setDeviceTier(tier: 'low' | 'medium' | 'high'): void
Physics.getPerformanceMetrics(): PhysicsPerformanceMetrics

// Control
Physics.start(): void
Physics.stop(): void
Physics.pause(): void
Physics.resume(): void
Physics.clear(): void

// Queries
Physics.raycast(options: RaycastOptions): RaycastResult[]
Physics.queryAABB(min: Point | Vector3, max: Point | Vector3): PhysicsBody[]
Physics.queryPoint(point: Point | Vector3): PhysicsBody[]
```

### PhysicsBody Interface

```typescript
interface PhysicsBody {
  readonly id: string;
  readonly type: 'static' | 'dynamic' | 'kinematic';
  readonly dimension: '2d' | '3d';
  readonly isStatic: boolean;
  readonly isSensor: boolean;
  readonly isActive: boolean;
  readonly isSleeping: boolean;
  
  // Transform
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
  
  // Collision
  collisionGroup: number;
  collisionMask: number;
  bounds: { min: Point | Vector3; max: Point | Vector3 };
  
  // Methods
  applyForce(force: Point | Vector3, point?: Point | Vector3): void;
  applyImpulse(impulse: Point | Vector3, point?: Point | Vector3): void;
  applyTorque(torque: number | Vector3): void;
  setStatic(isStatic: boolean): void;
  setSensor(isSensor: boolean): void;
  wakeUp(): void;
  sleep(): void;
  destroy(): void;
}
```

## Examples

### Complete Platformer Game

See [physics-platformer-example.ts](../examples/physics-platformer-example.ts) for a complete 2D platformer implementation featuring:

- Character physics with ground detection
- Advanced movement mechanics (coyote time, jump buffering, wall jumping)
- Level creation with platforms and boundaries
- Trigger zones for goals and checkpoints
- Particle effects for visual feedback
- Mobile touch controls
- Performance monitoring

### Top-Down Racing Game

```typescript
// Create vehicle with top-down helper
const vehicle = Physics.createBody({
  type: 'dynamic',
  position: { x: 0, y: 0 },
  shapes: [{ type: 'box', dimensions: { x: 2, y: 1 } }],
  mass: 1000
});

const topDownHelper = Physics.createTopDownHelper(vehicle);

// Configure for racing
topDownHelper.setMovementSettings({
  maxSpeed: 15,
  acceleration: 20,
  deceleration: 15,
  rotationSpeed: 3,
  dragCoefficient: 0.95
});

topDownHelper.enableRotation(true);
topDownHelper.enableMomentum(true);

// Input handling for racing
function handleRacingInput(input: { throttle: number, steering: number }) {
  const movement = {
    x: Math.sin(vehicle.rotation) * input.throttle,
    y: -Math.cos(vehicle.rotation) * input.throttle
  };
  
  topDownHelper.setMovementInput(movement);
  
  // Apply steering torque
  vehicle.applyTorque(input.steering * 5);
}
```

### 3D Physics Demo

```typescript
// Initialize 3D physics
await Physics.initialize('3d', 'cannon');

const world3D = Physics.createWorld({
  dimension: '3d',
  gravity: { x: 0, y: -9.82, z: 0 },
  broadphaseType: 'sap'
});

// Create 3D objects
const ground = Physics.createBody({
  type: 'static',
  position: { x: 0, y: -5, z: 0 },
  shapes: [{ type: 'box', dimensions: { x: 10, y: 1, z: 10 } }]
});

const sphere = Physics.createBody({
  type: 'dynamic',
  position: { x: 0, y: 5, z: 0 },
  shapes: [{ type: 'sphere', radius: 0.5 }],
  mass: 1
});

// Apply 3D forces
sphere.applyForce({ x: 5, y: 0, z: 0 });
sphere.applyTorque({ x: 1, y: 0, z: 0 });
```

The GameByte Physics Integration System provides everything needed to create sophisticated physics-based mobile games with professional-grade performance and features. The unified API makes it easy to switch between 2D and 3D physics while maintaining consistent code patterns throughout your game development process.