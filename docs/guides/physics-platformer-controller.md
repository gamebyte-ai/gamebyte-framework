# Physics: Platformer Controller

Build responsive player physics for 2D platformers.

<!-- keywords: physics, platformer, player, controller, jump, movement, ground, detection -->

---

## Basic Player Controller

```typescript
class PlayerController {
  private body: Matter.Body;
  private speed = 5;
  private jumpForce = -15;
  private isGrounded = false;

  constructor(physicsManager: PhysicsManager) {
    this.body = physicsManager.createBody({
      shape: 'rectangle',
      width: 40,
      height: 60,
      x: 100,
      y: 100,
      options: {
        friction: 0.1,
        frictionAir: 0.01,
        label: 'player'
      }
    });

    // Ground detection
    physicsManager.on('collision:active', (bodyA, bodyB) => {
      if (bodyA === this.body && bodyB.label === 'ground') {
        this.isGrounded = true;
      }
    });

    physicsManager.on('collision:end', (bodyA, bodyB) => {
      if (bodyA === this.body && bodyB.label === 'ground') {
        this.isGrounded = false;
      }
    });
  }

  moveLeft() {
    Matter.Body.setVelocity(this.body, {
      x: -this.speed,
      y: this.body.velocity.y
    });
  }

  moveRight() {
    Matter.Body.setVelocity(this.body, {
      x: this.speed,
      y: this.body.velocity.y
    });
  }

  jump() {
    if (this.isGrounded) {
      Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x,
        y: this.jumpForce
      });
    }
  }

  update() {
    // Clamp horizontal velocity
    if (Math.abs(this.body.velocity.x) > this.speed) {
      Matter.Body.setVelocity(this.body, {
        x: Math.sign(this.body.velocity.x) * this.speed,
        y: this.body.velocity.y
      });
    }
  }
}
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
      // Jump allowed
      Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x,
        y: this.jumpForce
      });
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
      Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x,
        y: this.jumpForce
      });
    }
  }

  holdJump(deltaTime: number) {
    if (this.isJumping && this.jumpHoldTime < this.maxJumpHoldTime) {
      this.jumpHoldTime += deltaTime / 1000;

      // Apply extra upward force
      Matter.Body.applyForce(this.body, this.body.position, {
        x: 0,
        y: -0.5
      });
    }
  }

  releaseJump() {
    this.isJumping = false;
  }
}
```

---

## Input Integration

```typescript
const inputManager = game.make('input');
const player = new PlayerController(physicsManager);

inputManager.on('keydown', (event) => {
  switch (event.key) {
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

inputManager.on('keyup', (event) => {
  if (event.key === ' ' || event.key === 'w') {
    player.releaseJump();
  }
});

// Game loop
game.on('update', (deltaTime) => {
  player.update(deltaTime);
});
```

---

## Mobile Touch Controls

```typescript
// Virtual joystick
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

- `physics-collision-2d-3d.md` - Collision detection
- `ui-components-mobile-first.md` - Touch UI patterns
- `input-handling-gestures.md` - Mobile input

---
