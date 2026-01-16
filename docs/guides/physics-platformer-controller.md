# Physics: Platformer Controller

Build responsive player physics for 2D platformers using GameByte's physics wrapper API.

<!-- keywords: physics, platformer, player, controller, jump, movement, ground, detection -->

---

## Basic Player Controller

```typescript
class PlayerController {
  private body: PhysicsBody;
  private speed = 5;
  private jumpForce = -15;
  private isGrounded = false;

  constructor(physicsManager: PhysicsManager) {
    // Create player body using simplified API
    this.body = physicsManager.createBody({
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

    // Ground detection using world collision events
    const world = physicsManager.getActiveWorld();

    world.on('collision-active', (event) => {
      const { bodyA, bodyB } = event;
      const isPlayerCollision = bodyA === this.body || bodyB === this.body;
      const otherBody = bodyA === this.body ? bodyB : bodyA;

      if (isPlayerCollision && otherBody.userData?.label === 'ground') {
        this.isGrounded = true;
      }
    });

    world.on('collision-end', (event) => {
      const { bodyA, bodyB } = event;
      const isPlayerCollision = bodyA === this.body || bodyB === this.body;
      const otherBody = bodyA === this.body ? bodyB : bodyA;

      if (isPlayerCollision && otherBody.userData?.label === 'ground') {
        this.isGrounded = false;
      }
    });
  }

  moveLeft() {
    // Use wrapper's velocity setter
    this.body.velocity = {
      x: -this.speed,
      y: this.body.velocity.y
    };
  }

  moveRight() {
    this.body.velocity = {
      x: this.speed,
      y: this.body.velocity.y
    };
  }

  jump() {
    if (this.isGrounded) {
      this.body.velocity = {
        x: this.body.velocity.x,
        y: this.jumpForce
      };
    }
  }

  update() {
    // Clamp horizontal velocity
    const vel = this.body.velocity;
    if (Math.abs(vel.x) > this.speed) {
      this.body.velocity = {
        x: Math.sign(vel.x) * this.speed,
        y: vel.y
      };
    }
  }
}
```

---

## Creating Ground and Platforms

```typescript
// Create ground
const ground = physicsManager.createBody({
  shape: 'rectangle',
  x: 400,
  y: 580,
  width: 800,
  height: 40,
  options: {
    isStatic: true,
    label: 'ground'
  }
});

// Create floating platform
const platform = physicsManager.createBody({
  shape: 'rectangle',
  x: 300,
  y: 400,
  width: 200,
  height: 20,
  options: {
    isStatic: true,
    label: 'ground'  // Same label for ground detection
  }
});
```

---

## Advanced Features

### Coyote Time

Allow jumping shortly after leaving platform:

```typescript
class PlayerController {
  private coyoteTime = 0.15;  // 150ms
  private coyoteTimeCounter = 0;

  update(deltaTime: number) {
    if (this.isGrounded) {
      this.coyoteTimeCounter = this.coyoteTime;
    } else {
      this.coyoteTimeCounter -= deltaTime / 1000;
    }
  }

  jump() {
    if (this.coyoteTimeCounter > 0) {
      this.body.velocity = {
        x: this.body.velocity.x,
        y: this.jumpForce
      };
      this.coyoteTimeCounter = 0;
    }
  }
}
```

### Variable Jump Height

Hold jump button for higher jumps:

```typescript
class PlayerController {
  private jumpHoldTime = 0;
  private maxJumpHoldTime = 0.3;  // 300ms
  private isJumping = false;

  startJump() {
    if (this.isGrounded) {
      this.isJumping = true;
      this.jumpHoldTime = 0;
      this.body.velocity = {
        x: this.body.velocity.x,
        y: this.jumpForce
      };
    }
  }

  holdJump(deltaTime: number) {
    if (this.isJumping && this.jumpHoldTime < this.maxJumpHoldTime) {
      this.jumpHoldTime += deltaTime / 1000;
      // Apply extra upward force using wrapper method
      this.body.applyForce({ x: 0, y: -0.005 });
    }
  }

  releaseJump() {
    this.isJumping = false;
  }
}
```

---

## Complete Example

See the full working example at `examples/platformer/index.html`:

```typescript
import { GameByte } from '@gamebyte/framework';

const game = new GameByte();

game.on('initialized', async () => {
  const physicsManager = game.make('physics');
  const renderer = game.make('renderer');
  const stage = renderer.getStage();

  // Create player
  const playerBody = physicsManager.createBody({
    shape: 'rectangle',
    x: 400, y: 300,
    width: 40, height: 60,
    options: { friction: 0.1, label: 'player' }
  });

  // Create ground
  physicsManager.createBody({
    shape: 'rectangle',
    x: 400, y: 580,
    width: 800, height: 40,
    options: { isStatic: true, label: 'ground' }
  });

  // Game loop - sync sprite with physics
  game.on('update', () => {
    playerSprite.x = playerBody.position.x;
    playerSprite.y = playerBody.position.y;
    playerSprite.rotation = playerBody.rotation;
  });
});

game.initialize({ mode: '2d' });
```

---

## Input Integration

```typescript
const player = new PlayerController(physicsManager);

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
      player.moveLeft();
      break;
    case 'ArrowRight':
    case 'd':
      player.moveRight();
      break;
    case ' ':
    case 'w':
      player.startJump();
      break;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === ' ' || e.key === 'w') {
    player.releaseJump();
  }
});

game.on('update', (deltaTime) => {
  player.update(deltaTime);
});
```

---

## Mobile Touch Controls

```typescript
// Virtual joystick for movement
const joystick = createVirtualJoystick();

joystick.on('move', (direction) => {
  if (direction.x < -0.5) {
    player.moveLeft();
  } else if (direction.x > 0.5) {
    player.moveRight();
  }
});

// Jump button
const jumpButton = new UIButton({
  text: 'Jump',
  width: 100,
  height: 100,
  x: window.innerWidth - 120,
  y: window.innerHeight - 120
});

jumpButton.on('pointerdown', () => player.startJump());
jumpButton.on('pointerup', () => player.releaseJump());
```

---

## Related Guides

- [Collision Detection](physics-collision-2d-3d.md) - Collision events and sensors
- [UI Components](ui-components-mobile-first.md) - Touch UI patterns
- [Merge Game System](merge-game-system.md) - Another physics example

---
