# Platformer Example

A complete 2D platformer with physics-based movement, jumping, and collision detection.

<!-- keywords: platformer, physics, jump, movement, collision, 2d, game -->

---

## Features

- Physics-based player movement
- Variable jump height (hold to jump higher)
- Ground detection via collision events
- Multiple floating platforms
- Smooth sprite-physics synchronization

---

## Quick Start

```bash
# From project root
cd examples/platformer
# Open index.html in browser (or use a local server)
npx serve .
```

---

## Controls

| Key | Action |
|-----|--------|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Space / W | Jump |
| Hold Space/W | Jump higher |

---

## Code Overview

### 1. Create Player Body

```typescript
const playerBody = physicsManager.createBody({
  shape: 'rectangle',
  x: 100,
  y: 100,
  width: 40,
  height: 60,
  options: {
    friction: 0.1,
    frictionAir: 0.01,
    label: 'player'
  }
});
```

### 2. Create Platforms

```typescript
const platforms = [
  { x: 200, y: 450, width: 150, height: 20 },
  { x: 500, y: 350, width: 150, height: 20 },
  { x: 300, y: 250, width: 150, height: 20 }
];

platforms.forEach(platform => {
  physicsManager.createBody({
    shape: 'rectangle',
    x: platform.x,
    y: platform.y,
    width: platform.width,
    height: platform.height,
    options: {
      isStatic: true,
      label: 'ground'
    }
  });
});
```

### 3. Ground Detection

```typescript
const world = physicsManager.getActiveWorld();

world.on('collision-active', (event) => {
  const { bodyA, bodyB } = event;
  const isPlayerCollision = bodyA === playerBody || bodyB === playerBody;
  const otherBody = bodyA === playerBody ? bodyB : bodyA;

  if (isPlayerCollision && otherBody.userData?.label === 'ground') {
    isGrounded = true;
  }
});

world.on('collision-end', (event) => {
  // Similar logic to set isGrounded = false
});
```

### 4. Movement & Jumping

```typescript
// Movement
if (keys.left) {
  playerBody.velocity = { x: -speed, y: playerBody.velocity.y };
} else if (keys.right) {
  playerBody.velocity = { x: speed, y: playerBody.velocity.y };
}

// Jump
if (isGrounded) {
  playerBody.velocity = { x: playerBody.velocity.x, y: jumpForce };
}

// Variable jump height
if (isJumping && keys.jump) {
  playerBody.applyForce({ x: 0, y: -0.005 });
}
```

### 5. Sync Sprite with Physics

```typescript
game.on('update', () => {
  playerSprite.x = playerBody.position.x;
  playerSprite.y = playerBody.position.y;
  playerSprite.rotation = playerBody.rotation;
});
```

---

## Key Concepts

### Simplified Body API

GameByte provides a simplified `createBody()` API that's easier than raw Matter.js:

```typescript
// GameByte simplified API
physicsManager.createBody({
  shape: 'rectangle',
  x: 100, y: 100,
  width: 40, height: 60,
  options: { isStatic: true }
});

// vs. raw Matter.js
Matter.Bodies.rectangle(100, 100, 40, 60, { isStatic: true });
```

### Wrapper Methods

Physics bodies use wrapper methods instead of direct Matter.js calls:

```typescript
// GameByte wrapper (recommended)
body.velocity = { x: 5, y: body.velocity.y };
body.applyForce({ x: 0, y: -0.005 });

// Direct Matter.js (not recommended)
Matter.Body.setVelocity(body, { x: 5, y: body.velocity.y });
Matter.Body.applyForce(body, body.position, { x: 0, y: -0.005 });
```

---

## Related

- [Platformer Controller Guide](../guides/physics-platformer-controller.md)
- [Collision Detection Guide](../guides/physics-collision-2d-3d.md)
- [Merge Game Example](./merge-game-example.md)

---
