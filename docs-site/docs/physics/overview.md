---
id: overview
title: Physics Overview
description: Physics engines in GameByte
sidebar_position: 1
keywords: [physics, collision, matter.js, cannon.js]
llm_summary: "2D: Matter.js via Physics.create2DWorld(). 3D: Cannon.js via Physics.create3DWorld(). Unified API for bodies, forces, and collision detection."
---

<!-- llm-context: physics, collision-detection, matter-js, cannon-js, rigid-body -->

# Physics Overview

GameByte integrates industry-standard physics engines for realistic simulations.

## Engines

| Dimension | Engine | Use Cases |
|-----------|--------|-----------|
| 2D | Matter.js | Platformers, puzzles, top-down games |
| 3D | Cannon.js | 3D games, vehicles, ragdolls |

## Quick Start

### 2D Physics

```typescript
import { Physics } from 'gamebyte-framework';

// Create world
Physics.create2DWorld({
    gravity: { x: 0, y: 1 }
});

// Create body
const player = Physics.createBody({
    x: 100, y: 100,
    width: 32, height: 48,
    options: { label: 'player' }
});

// Update in game loop
function update(deltaTime: number) {
    Physics.update(deltaTime);
}
```

### 3D Physics

```typescript
// Create 3D world
Physics.create3DWorld({
    gravity: { x: 0, y: -9.8, z: 0 }
});

// Create 3D body
const cube = Physics.create3DBody({
    x: 0, y: 5, z: 0,
    shape: 'box',
    size: { x: 1, y: 1, z: 1 },
    mass: 1
});
```

## Unified API

```typescript
// Works for both 2D and 3D
Physics.setVelocity(body, { x: 5, y: 0 });
Physics.applyForce(body, { x: 100, y: 0 });
Physics.setPosition(body, { x: 200, y: 100 });

// Collision detection
Physics.onCollision('player', 'enemy', (playerBody, enemyBody) => {
    takeDamage();
});
```

## Choosing an Engine

- **Platformers**: 2D (Matter.js)
- **Puzzle games**: 2D (Matter.js)
- **Racing games**: 3D (Cannon.js)
- **FPS/TPS**: 3D (Cannon.js)
- **Hybrid (3D world, 2D gameplay)**: Either based on gameplay needs
