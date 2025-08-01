# Physics System Overview

GameByte Framework provides a comprehensive physics system that unifies 2D and 3D physics engines with mobile-optimized performance. The system supports Matter.js for 2D physics and Cannon.js for 3D physics, with specialized helpers for common game mechanics.

## Architecture

The physics system uses a unified API that abstracts the underlying physics engines:

```typescript
import { Physics } from '@gamebyte/framework';

// Initialize 2D physics
await Physics.initialize('2d', 'matter');

// Or initialize 3D physics
await Physics.initialize('3d', 'cannon');

// Create physics world
const world = Physics.createWorld({
  dimension: '2d',
  gravity: { x: 0, y: 9.82 },
  allowSleep: true
});
```

## Core Features

### Unified API
- **Consistent Interface**: Same API for both 2D and 3D physics
- **Engine Abstraction**: Switch between physics engines without code changes
- **Type Safety**: Full TypeScript support with proper type definitions

### Mobile Optimization
- **Performance Scaling**: Automatic quality adjustment based on device performance
- **Object Culling**: Disable physics for off-screen objects
- **Adaptive Quality**: Dynamic physics quality based on frame rate
- **Battery Optimization**: Reduce physics complexity for better battery life

### Game-Specific Helpers
- **Platformer Helper**: Advanced character movement for 2D platformers
- **Top-Down Helper**: Movement system for top-down games
- **Trigger Zones**: Interactive areas for gameplay events
- **Particle Systems**: Physics-based particle effects

## Supported Physics Engines

### Matter.js (2D Physics)
- **Rigid Body Physics**: High-performance 2D simulation
- **Collision Detection**: Advanced collision with continuous collision detection
- **Constraints**: Distance, spring, revolute, and custom constraints
- **Sensors**: Trigger zones and non-physical collision detection

### Cannon.js (3D Physics)
- **3D Rigid Bodies**: Full 3D physics simulation
- **Complex Shapes**: Box, sphere, cylinder, heightfield, and mesh shapes
- **Advanced Constraints**: Point-to-point, hinge, and custom 3D constraints
- **Broadphase Algorithms**: SAP, Grid, and Naive broadphase for optimization

## Quick Start Examples

### 2D Platformer Physics

```typescript
import { Physics } from '@gamebyte/framework';

// Initialize 2D physics
await Physics.initialize('2d', 'matter');

// Create world
const world = Physics.createWorld({
  dimension: '2d',
  gravity: { x: 0, y: 9.82 }
});

// Create ground
const ground = Physics.createBody({
  type: 'static',
  position: { x: 0, y: 10 },
  shapes: [{ type: 'box', dimensions: { x: 20, y: 1 } }]
});

// Create player
const player = Physics.createBody({
  type: 'dynamic',
  position: { x: 0, y: 0 },
  shapes: [{ type: 'box', dimensions: { x: 1, y: 2 } }],
  fixedRotation: true
});

// Use platformer helper for advanced movement
const platformerHelper = Physics.createPlatformerHelper(player);
platformerHelper.setMovementSettings({
  maxSpeed: 6,
  jumpForce: 12,
  acceleration: 25
});

// Enable advanced features
platformerHelper.enableCoyoteTime(true);
platformerHelper.enableJumpBuffering(true);

// Start physics simulation
Physics.start();
```

### 3D Physics Scene

```typescript
import { Physics } from '@gamebyte/framework';

// Initialize 3D physics
await Physics.initialize('3d', 'cannon');

// Create 3D world
const world = Physics.createWorld({
  dimension: '3d',
  gravity: { x: 0, y: -9.82, z: 0 },
  broadphaseType: 'sap'
});

// Create ground plane
const ground = Physics.createBody({
  type: 'static',
  position: { x: 0, y: -5, z: 0 },
  shapes: [{ type: 'box', dimensions: { x: 10, y: 1, z: 10 } }]
});

// Create dynamic sphere
const sphere = Physics.createBody({
  type: 'dynamic',
  position: { x: 0, y: 5, z: 0 },
  shapes: [{ type: 'sphere', radius: 0.5 }],
  mass: 1
});

// Apply forces
sphere.applyForce({ x: 5, y: 0, z: 0 });
sphere.applyTorque({ x: 0, y: 1, z: 0 });

// Start simulation
Physics.start();
```

## Game Helpers

### Platformer Helper

Advanced 2D character movement with realistic platformer mechanics:

```typescript
const platformerHelper = Physics.createPlatformerHelper(playerBody);

// Configure movement
platformerHelper.setMovementSettings({
  maxSpeed: 6,           // Maximum horizontal speed
  acceleration: 25,      // Ground acceleration
  deceleration: 20,      // Ground deceleration
  airAcceleration: 15,   // Air control
  jumpForce: 12,         // Jump strength
  wallJumpForce: 10,     // Wall jump strength
  coyoteTime: 0.15,      // Grace time after leaving ground
  jumpBufferTime: 0.15   // Grace time for early jump input
});

// Enable advanced features
platformerHelper.enableDoubleJump(true);
platformerHelper.enableWallSliding(true);
platformerHelper.enableCoyoteTime(true);
platformerHelper.enableJumpBuffering(true);

// Handle input
platformerHelper.setHorizontalInput(horizontalInput); // -1 to 1
platformerHelper.jump();

// Listen to events
platformerHelper.on('jump', () => console.log('Player jumped!'));
platformerHelper.on('landed', () => console.log('Player landed!'));
platformerHelper.on('wall-jump', (data) => console.log('Wall jumped!'));

// Update in game loop
platformerHelper.update(deltaTime);
```

### Top-Down Helper

Movement system for top-down games, twin-stick shooters, and racing games:

```typescript
const topDownHelper = Physics.createTopDownHelper(vehicleBody);

// Configure movement
topDownHelper.setMovementSettings({
  maxSpeed: 8,           // Maximum speed
  acceleration: 15,      // Acceleration rate
  deceleration: 10,      // Deceleration rate
  rotationSpeed: 5,      // Rotation speed
  dragCoefficient: 0.98  // Air resistance
});

// Movement options
topDownHelper.enableRotation(true);   // Rotate towards movement
topDownHelper.enableMomentum(true);   // Physics-based movement
topDownHelper.enableDrifting(true);   // Racing-style drifting

// Handle input
topDownHelper.setMovementInput({ x: 1, y: 0 }); // Move right
topDownHelper.dash({ x: 1, y: 0 }, 15); // Dash with force

// Query state
const isMoving = topDownHelper.isMoving;
const speed = topDownHelper.getMovementSpeed();
const direction = topDownHelper.getMovementDirection();
```

### Trigger Zones

Create interactive areas for gameplay events:

```typescript
const goalZone = Physics.createTriggerZone({
  position: { x: 10, y: 0 },
  shapes: [{ type: 'box', dimensions: { x: 2, y: 2 } }],
  isSensor: true
});

// Event handling
goalZone.onEnter((body) => {
  if (body.userData?.type === 'player') {
    console.log('Player reached the goal!');
    // Trigger level completion
  }
});

goalZone.onExit((body) => {
  console.log('Body left the goal zone');
});

goalZone.onStay((body) => {
  console.log('Body staying in goal zone');
});

// Query bodies inside
const bodiesInside = goalZone.getBodiesInside();
const isPlayerInside = goalZone.isBodyInside(playerBody);
```

## Mobile Optimizations

### Automatic Performance Scaling

```typescript
// Enable mobile optimizations
Physics.enableMobileOptimizations();

// Configure performance settings
const optimizer = Physics.getMobileOptimizer();
optimizer.enableCulling(true);
optimizer.setCullingDistance(50);
optimizer.enableAdaptiveQuality(true);
optimizer.setPerformanceTarget(60); // Target 60 FPS
optimizer.enableBatteryOptimization(true);
```

### Device Tier Detection

```typescript
// Automatic device detection
const deviceTier = optimizer.detectDeviceTier(); // 'low', 'medium', 'high'

// Adjust settings based on device capability
switch (deviceTier) {
  case 'low':
    Physics.setFixedTimeStep(1/30); // 30 FPS physics
    Physics.setMaxSubSteps(3);
    break;
  case 'medium':
    Physics.setFixedTimeStep(1/45); // 45 FPS physics
    Physics.setMaxSubSteps(5);
    break;
  case 'high':
    Physics.setFixedTimeStep(1/60); // 60 FPS physics
    Physics.setMaxSubSteps(8);
    break;
}
```

### Performance Features

- **Object Culling**: Automatically disable physics for off-screen objects
- **Level of Detail**: Reduce physics quality with distance from camera
- **Adaptive Quality**: Automatically adjust physics quality based on performance
- **Object Pooling**: Reuse physics bodies to reduce garbage collection
- **Sleeping System**: Put inactive bodies to sleep to save CPU
- **Battery Optimization**: Reduce update rates when battery is low

## Advanced Features

### Custom Materials

Create physics materials with custom properties:

```typescript
const bouncyMaterial = Physics.createMaterial({
  id: 'bouncy-ball',
  friction: 0.3,
  restitution: 0.9,  // High bounciness
  density: 0.5
});

const iceMaterial = Physics.createMaterial({
  id: 'slippery-ice',
  friction: 0.05,    // Very slippery
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
// Distance constraint (rope)
const rope = world.createConstraint({
  type: 'distance',
  bodyA: bodyA,
  bodyB: bodyB,
  length: 5,
  stiffness: 0.8
});

// Revolute joint (hinge)
const hinge = world.createConstraint({
  type: 'revolute',
  bodyA: bodyA,
  bodyB: bodyB,
  anchorA: { x: 0, y: 0 },
  anchorB: { x: 1, y: 0 },
  enableMotor: true,
  motorSpeed: 2
});

// Spring constraint
const spring = world.createConstraint({
  type: 'spring',
  bodyA: bodyA,
  bodyB: bodyB,
  stiffness: 0.02,
  damping: 0.05
});
```

### Raycasting and Queries

Perform spatial queries for line-of-sight, shooting, and collision detection:

```typescript
// Raycast for shooting mechanics
const rayResults = Physics.raycast({
  from: { x: 0, y: 0 },
  to: { x: 10, y: 0 },
  collisionMask: 0xFFFFFFFF
});

rayResults.forEach(result => {
  console.log('Hit body:', result.body.id);
  console.log('Hit point:', result.point);
  console.log('Hit normal:', result.normal);
  console.log('Distance:', result.distance);
});

// Area queries
const bodiesInArea = Physics.queryAABB(
  { x: -5, y: -5 }, // min
  { x: 5, y: 5 }    // max
);

const bodiesAtPoint = Physics.queryPoint({ x: 2, y: 3 });
```

## Performance Monitoring

### Physics Metrics

```typescript
// Get performance statistics
const metrics = Physics.getPerformanceMetrics();
console.log('Active bodies:', metrics.activeBodies);
console.log('Sleeping bodies:', metrics.sleepingBodies);
console.log('Step time:', metrics.averageStepTime, 'ms');
console.log('Memory usage:', metrics.memoryUsage, 'bytes');
console.log('Constraints:', metrics.activeConstraints);

// Monitor frame rate impact
const frameImpact = metrics.stepTime / (1000/60); // Percentage of 60fps frame
if (frameImpact > 0.3) { // More than 30% of frame time
  console.warn('Physics taking too much CPU time');
  Physics.enablePerformanceMode(true);
}
```

### Debug Visualization

```typescript
// Enable debug rendering
Physics.enableDebugRenderer(true);

// Configure debug options
Physics.setDebugOptions({
  showBodies: true,
  showConstraints: true,
  showVelocity: true,
  showAABB: true,
  showSleeping: true
});

// Custom debug colors
Physics.setDebugColors({
  dynamic: 0x00ff00,    // Green for dynamic bodies
  static: 0x0000ff,     // Blue for static bodies
  sleeping: 0x888888,   // Gray for sleeping bodies
  constraint: 0xff0000  // Red for constraints
});
```

## Integration with Other Systems

### Rendering Integration

```typescript
// Sync sprites with physics bodies
gameObjects.forEach(obj => {
  if (obj.physicsBody && obj.sprite) {
    // Convert physics coordinates to pixels
    obj.sprite.x = obj.physicsBody.position.x * PIXELS_PER_METER;
    obj.sprite.y = obj.physicsBody.position.y * PIXELS_PER_METER;
    obj.sprite.rotation = obj.physicsBody.rotation;
  }
});
```

### Audio Integration

```typescript
// Play collision sounds
Physics.on('collision', (event) => {
  const { bodyA, bodyB, force } = event;
  
  if (force > 5) { // Only for significant collisions
    const volume = Math.min(force / 20, 1.0);
    Audio.playSFX('collision.wav', { volume });
  }
});
```

## Best Practices

### 1. **Use Appropriate Body Types**
- **Static**: For immovable objects like platforms and walls
- **Dynamic**: For objects affected by forces and gravity
- **Kinematic**: For moving platforms and scripted objects

### 2. **Optimize Collision Detection**
```typescript
// Use collision groups and masks to avoid unnecessary checks
const GROUPS = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  PROJECTILE: 0x0004,
  ENVIRONMENT: 0x0008
};

const playerBody = Physics.createBody({
  collisionGroup: GROUPS.PLAYER,
  collisionMask: GROUPS.ENEMY | GROUPS.ENVIRONMENT
});
```

### 3. **Implement Object Pooling**
```typescript
class PhysicsBodyPool {
  private pool: PhysicsBody[] = [];
  
  acquire(config: BodyConfig): PhysicsBody {
    let body = this.pool.pop();
    if (!body) {
      body = Physics.createBody(config);
    } else {
      this.resetBody(body, config);
    }
    return body;
  }
  
  release(body: PhysicsBody): void {
    body.setStatic(true);
    body.position = { x: 0, y: 0 };
    body.velocity = { x: 0, y: 0 };
    this.pool.push(body);
  }
}
```

### 4. **Use Sleeping for Inactive Objects**
```typescript
// Enable sleeping for better performance
const world = Physics.createWorld({
  allowSleep: true,
  sleepSpeedLimit: 0.1,
  sleepTimeLimit: 1
});

// Manually wake up bodies when needed
body.wakeUp();
```

## API Reference Summary

```typescript
interface PhysicsFacade {
  // Initialization
  initialize(dimension: '2d' | '3d', engine?: string): Promise<void>;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  
  // World Management
  createWorld(config: WorldConfig): PhysicsWorld;
  getActiveWorld(): PhysicsWorld | null;
  setActiveWorld(world: PhysicsWorld): void;
  
  // Body Management
  createBody(config: BodyConfig): PhysicsBody;
  removeBody(body: PhysicsBody): void;
  
  // Helpers
  createPlatformerHelper(body: PhysicsBody): PlatformerHelper;
  createTopDownHelper(body: PhysicsBody): TopDownHelper;
  createTriggerZone(config: BodyConfig): TriggerZone;
  
  // Queries
  raycast(options: RaycastOptions): RaycastResult[];
  queryAABB(min: Vector, max: Vector): PhysicsBody[];
  queryPoint(point: Vector): PhysicsBody[];
  
  // Performance
  enableMobileOptimizations(): void;
  getPerformanceMetrics(): PhysicsMetrics;
  setDeviceTier(tier: 'low' | 'medium' | 'high'): void;
}
```

## What's Next?

- **[2D Physics Guide](./2d-physics.md)** - Matter.js integration and features
- **[3D Physics Guide](./3d-physics.md)** - Cannon.js integration and features
- **[Game Helpers](./helpers.md)** - Platformer and top-down movement systems
- **[Mobile Optimization](./mobile-optimization.md)** - Performance scaling techniques
- **[Advanced Physics](./advanced-physics.md)** - Constraints, materials, and custom systems

The physics system provides the foundation for creating engaging, realistic game mechanics while maintaining excellent performance on mobile devices.