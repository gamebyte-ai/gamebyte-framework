# Physics: Collision Detection in 2D and 3D

Comprehensive guide to collision detection using Matter.js (2D) and Cannon.js (3D).

<!-- keywords: physics, collision, detection, matter, cannon, 2d, 3d, raycast, overlap -->

---

## 2D Collision (Matter.js)

### Basic Setup

```typescript
const physicsManager = game.make('physics');

// Create bodies
const player = physicsManager.createBody({
  shape: 'rectangle',
  width: 50,
  height: 50,
  x: 400,
  y: 300,
  options: { label: 'player' }
});

const ground = physicsManager.createBody({
  shape: 'rectangle',
  width: 800,
  height: 20,
  x: 400,
  y: 580,
  options: { isStatic: true, label: 'ground' }
});
```

### Collision Events

```typescript
physicsManager.on('collision:start', (bodyA, bodyB) => {
  if (bodyA.label === 'player' && bodyB.label === 'enemy') {
    handlePlayerEnemyCollision();
  }
});

physicsManager.on('collision:active', (bodyA, bodyB) => {
  // Continuous collision (every frame)
});

physicsManager.on('collision:end', (bodyA, bodyB) => {
  // Collision ended
});
```

### Collision Filtering

```typescript
// Create collision groups
const PLAYER_GROUP = 0x0001;
const ENEMY_GROUP = 0x0002;
const GROUND_GROUP = 0x0004;

const player = physicsManager.createBody({
  shape: 'rectangle',
  width: 50,
  height: 50,
  options: {
    collisionFilter: {
      category: PLAYER_GROUP,
      mask: ENEMY_GROUP | GROUND_GROUP  // Collides with enemies and ground
    }
  }
});
```

---

## 3D Collision (Cannon.js)

### Basic Setup

```typescript
const physicsManager = game.make('physics');

// Create 3D bodies
const sphere = physicsManager.createBody({
  shape: 'sphere',
  radius: 1,
  position: { x: 0, y: 10, z: 0 },
  mass: 1
});

const plane = physicsManager.createBody({
  shape: 'plane',
  position: { x: 0, y: 0, z: 0 },
  mass: 0  // Static body
});
```

### Collision Detection

```typescript
physicsManager.on('collision:begin', (bodyA, bodyB, contact) => {
  console.log('Collision at:', contact.contactPoint);
});
```

### Raycasting

```typescript
const from = { x: 0, y: 10, z: 0 };
const to = { x: 0, y: 0, z: 0 };

const result = physicsManager.raycast(from, to);
if (result.hasHit) {
  console.log('Hit body:', result.body);
  console.log('Hit point:', result.hitPoint);
  console.log('Hit normal:', result.hitNormal);
}
```

---

## Performance Optimization

### Broadphase Detection

```typescript
// Use spatial hashing for many objects
physicsManager.setBroadphase('grid', {
  cellSize: 50  // Adjust based on object sizes
});
```

### Sleep Detection

```typescript
// Allow bodies to sleep when not moving
const body = physicsManager.createBody({
  shape: 'rectangle',
  width: 50,
  height: 50,
  options: {
    sleepThreshold: 0.1,  // Sleep when velocity < 0.1
    timeToSleep: 1000      // After 1 second
  }
});
```

---

## Common Patterns

### One-Way Platforms

```typescript
physicsManager.on('collision:start', (bodyA, bodyB, collision) => {
  if (bodyB.label === 'platform' && bodyA.velocity.y > 0) {
    // Player moving up, disable collision
    collision.enabled = false;
  }
});
```

### Trigger Zones

```typescript
const trigger = physicsManager.createBody({
  shape: 'rectangle',
  width: 100,
  height: 100,
  options: {
    isSensor: true,  // No physical collision
    label: 'trigger'
  }
});

physicsManager.on('collision:start', (bodyA, bodyB) => {
  if (bodyB.label === 'trigger') {
    console.log('Player entered trigger zone');
  }
});
```

---

## Related Guides

- `physics-platformer-controller.md` - Player movement patterns
- `physics-top-down-movement.md` - Top-down game physics
- `performance-optimization-mobile.md` - Physics performance tuning

---
