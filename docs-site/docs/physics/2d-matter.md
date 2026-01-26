---
id: 2d-matter
title: 2D Physics (Matter.js)
description: 2D physics with Matter.js
sidebar_position: 2
keywords: [2d, physics, matter.js, collision, platformer]
llm_summary: "Matter.js 2D physics. Bodies: createBody(), createStaticBody(). Forces: applyForce(), setVelocity(). Collisions: onCollision(labelA, labelB, callback)."
---

<!-- llm-context: 2d-physics, matter-js, rigid-body, collision, platformer, forces -->

import LiveDemo from '@site/src/components/LiveDemo';

# 2D Physics (Matter.js)

GameByte wraps Matter.js for easy 2D physics.

## World Setup

```typescript
import { Physics } from '@gamebyte/framework';

Physics.create2DWorld({
    gravity: { x: 0, y: 1 },    // Earth-like gravity
    enableSleeping: true,        // Bodies can sleep when still
    timestep: 1/60               // Fixed timestep
});
```

<LiveDemo
  src="/demos/physics-2d.html"
  height={400}
  title="2D Physics Demo"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Creating Bodies

### Dynamic Body

```typescript
const player = Physics.createBody({
    x: 100,
    y: 100,
    width: 32,
    height: 48,
    options: {
        label: 'player',
        friction: 0.1,
        restitution: 0,      // No bounce
        frictionAir: 0.01,   // Air resistance
        mass: 1
    }
});
```

### Static Body (Platforms)

```typescript
const platform = Physics.createStaticBody({
    x: 400,
    y: 500,
    width: 200,
    height: 20,
    options: {
        label: 'platform'
    }
});
```

### Circle Body

```typescript
const ball = Physics.createCircleBody({
    x: 200,
    y: 100,
    radius: 25,
    options: {
        label: 'ball',
        restitution: 0.8  // Bouncy
    }
});
```

## Applying Forces

```typescript
// Set velocity directly
Physics.setVelocity(player, { x: 5, y: 0 });
Physics.setVelocityX(player, 5);
Physics.setVelocityY(player, -10); // Jump

// Apply force (acceleration)
Physics.applyForce(player, { x: 0.01, y: 0 });

// Apply force at point
Physics.applyForceAtPosition(player, { x: 0, y: -0.1 }, { x: 100, y: 100 });
```

## Collision Detection

```typescript
// Collision between labels
Physics.onCollision('player', 'enemy', (playerBody, enemyBody) => {
    console.log('Player hit enemy!');
    takeDamage();
});

// Collision with any body
Physics.onCollisionStart('player', (playerBody, otherBody) => {
    if (otherBody.label === 'ground') {
        canJump = true;
    }
});

Physics.onCollisionEnd('player', (playerBody, otherBody) => {
    if (otherBody.label === 'ground') {
        canJump = false;
    }
});
```

## Platformer Controller

```typescript
class PlatformerController {
    private body: Matter.Body;
    private speed = 5;
    private jumpForce = -12;
    private isGrounded = false;

    constructor() {
        this.body = Physics.createBody({
            x: 100, y: 100,
            width: 32, height: 48,
            options: { label: 'player', friction: 0.1 }
        });

        this.setupCollisions();
    }

    private setupCollisions(): void {
        Physics.onCollisionStart('player', (_, other) => {
            if (other.label === 'platform') {
                this.isGrounded = true;
            }
        });

        Physics.onCollisionEnd('player', (_, other) => {
            if (other.label === 'platform') {
                this.isGrounded = false;
            }
        });
    }

    update(input: { left: boolean, right: boolean, jump: boolean }): void {
        // Horizontal movement
        let vx = 0;
        if (input.left) vx = -this.speed;
        if (input.right) vx = this.speed;
        Physics.setVelocityX(this.body, vx);

        // Jump
        if (input.jump && this.isGrounded) {
            Physics.setVelocityY(this.body, this.jumpForce);
            this.isGrounded = false;
        }
    }

    getPosition(): { x: number, y: number } {
        return this.body.position;
    }
}
```

## Sensors (Triggers)

```typescript
// Sensor doesn't collide but detects overlap
const trigger = Physics.createBody({
    x: 300, y: 300,
    width: 100, height: 100,
    options: {
        label: 'coin-area',
        isSensor: true  // No physical collision
    }
});

Physics.onCollision('player', 'coin-area', () => {
    collectCoin();
});
```

## Constraints (Joints)

```typescript
// Distance constraint (rope/spring)
const rope = Physics.createConstraint(bodyA, bodyB, {
    length: 100,
    stiffness: 0.1
});

// Pin constraint (hinge)
const hinge = Physics.createConstraint(door, null, {
    pointA: { x: -50, y: 0 },  // Relative to body
    pointB: { x: 100, y: 200 } // World position
});
```

## Syncing with Sprites

```typescript
class PhysicsSprite {
    public sprite: PIXI.Sprite;
    public body: Matter.Body;

    constructor(texture: PIXI.Texture, x: number, y: number) {
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.anchor.set(0.5);

        this.body = Physics.createBody({
            x, y,
            width: texture.width,
            height: texture.height
        });
    }

    update(): void {
        // Sync sprite with physics body
        this.sprite.position.set(this.body.position.x, this.body.position.y);
        this.sprite.rotation = this.body.angle;
    }
}
```

## Debug Rendering

```typescript
// Enable physics debug view
game.setConfig({
    debug: {
        showPhysics: true
    }
});

// Or manually
Physics.setDebug(true);
```
