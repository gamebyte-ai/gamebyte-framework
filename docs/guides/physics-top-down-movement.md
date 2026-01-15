# Physics: Top-Down Movement

Implement physics for top-down games with 8-directional movement, friction, and collision.

<!-- keywords: physics, top-down, movement, wasd, 8-direction, friction, rotation, velocity, drag -->

---

## Basic Top-Down Controller

```typescript
class TopDownController {
  private body: Matter.Body;
  private speed = 5;
  private friction = 0.15;

  constructor(physicsManager: PhysicsManager) {
    this.body = physicsManager.createBody({
      shape: 'circle',
      radius: 20,
      x: 400,
      y: 300,
      options: {
        friction: this.friction,
        frictionAir: this.friction,
        label: 'player'
      }
    });

    // Disable gravity for top-down
    physicsManager.setGravity(0, 0);
  }

  move(direction: { x: number; y: number }) {
    // Normalize diagonal movement
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0) {
      const normalizedX = (direction.x / length) * this.speed;
      const normalizedY = (direction.y / length) * this.speed;

      Matter.Body.setVelocity(this.body, {
        x: normalizedX,
        y: normalizedY
      });
    }
  }

  stop() {
    // Apply friction to stop smoothly
    const velocity = this.body.velocity;
    Matter.Body.setVelocity(this.body, {
      x: velocity.x * (1 - this.friction),
      y: velocity.y * (1 - this.friction)
    });
  }

  update() {
    // Optional: clamp max velocity
    const velocity = this.body.velocity;
    const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    if (currentSpeed > this.speed) {
      const scale = this.speed / currentSpeed;
      Matter.Body.setVelocity(this.body, {
        x: velocity.x * scale,
        y: velocity.y * scale
      });
    }
  }
}
```

---

## 8-Directional Movement

### WASD Input

```typescript
class InputController {
  private keys = {
    w: false,
    a: false,
    s: false,
    d: false
  };

  constructor(inputManager: InputManager, player: TopDownController) {
    inputManager.on('keydown', (event) => {
      if (event.key in this.keys) {
        this.keys[event.key] = true;
      }
    });

    inputManager.on('keyup', (event) => {
      if (event.key in this.keys) {
        this.keys[event.key] = false;
      }
    });
  }

  update(player: TopDownController) {
    const direction = { x: 0, y: 0 };

    if (this.keys.w) direction.y -= 1;
    if (this.keys.s) direction.y += 1;
    if (this.keys.a) direction.x -= 1;
    if (this.keys.d) direction.x += 1;

    if (direction.x !== 0 || direction.y !== 0) {
      player.move(direction);
    } else {
      player.stop();
    }
  }
}
```

### Joystick Input

```typescript
// Virtual joystick for mobile
const joystick = createVirtualJoystick({
  x: 100,
  y: window.innerHeight - 100,
  radius: 50
});

joystick.on('move', (direction) => {
  player.move(direction);
});

joystick.on('end', () => {
  player.stop();
});
```

---

## Rotation Handling

### Face Movement Direction

```typescript
class TopDownController {
  private body: Matter.Body;
  private rotationSpeed = 0.1;

  move(direction: { x: number; y: number }) {
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0) {
      // Calculate target angle
      const targetAngle = Math.atan2(direction.y, direction.x);

      // Smooth rotation
      Matter.Body.setAngle(this.body, targetAngle);

      // Apply velocity
      const normalizedX = (direction.x / length) * this.speed;
      const normalizedY = (direction.y / length) * this.speed;
      Matter.Body.setVelocity(this.body, {
        x: normalizedX,
        y: normalizedY
      });
    }
  }
}
```

### Tank Controls

Separate rotation and movement:

```typescript
class TankController {
  private body: Matter.Body;
  private rotation = 0;
  private rotationSpeed = 0.05;
  private moveSpeed = 5;

  rotateLeft() {
    this.rotation -= this.rotationSpeed;
    Matter.Body.setAngle(this.body, this.rotation);
  }

  rotateRight() {
    this.rotation += this.rotationSpeed;
    Matter.Body.setAngle(this.body, this.rotation);
  }

  moveForward() {
    const vx = Math.cos(this.rotation) * this.moveSpeed;
    const vy = Math.sin(this.rotation) * this.moveSpeed;
    Matter.Body.setVelocity(this.body, { x: vx, y: vy });
  }

  moveBackward() {
    const vx = Math.cos(this.rotation) * -this.moveSpeed;
    const vy = Math.sin(this.rotation) * -this.moveSpeed;
    Matter.Body.setVelocity(this.body, { x: vx, y: vy });
  }
}
```

---

## Advanced Features

### Dash Ability

```typescript
class TopDownController {
  private dashSpeed = 15;
  private dashDuration = 200;  // ms
  private dashCooldown = 1000;  // ms
  private isDashing = false;
  private canDash = true;

  dash(direction: { x: number; y: number }) {
    if (!this.canDash) return;

    this.isDashing = true;
    this.canDash = false;

    // Normalize direction
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    const dashVelocity = {
      x: (direction.x / length) * this.dashSpeed,
      y: (direction.y / length) * this.dashSpeed
    };

    Matter.Body.setVelocity(this.body, dashVelocity);

    // End dash after duration
    setTimeout(() => {
      this.isDashing = false;
    }, this.dashDuration);

    // Reset cooldown
    setTimeout(() => {
      this.canDash = true;
    }, this.dashCooldown);
  }
}
```

### Collision-Based Stopping

```typescript
class TopDownController {
  constructor(physicsManager: PhysicsManager) {
    // ... body creation ...

    // Stop on wall collision
    physicsManager.on('collision:start', (bodyA, bodyB) => {
      if (bodyA === this.body && bodyB.label === 'wall') {
        // Reduce velocity on collision
        const velocity = this.body.velocity;
        Matter.Body.setVelocity(this.body, {
          x: velocity.x * 0.5,
          y: velocity.y * 0.5
        });
      }
    });
  }
}
```

### Smooth Camera Follow

```typescript
class CameraFollow {
  private camera: { x: number; y: number };
  private target: Matter.Body;
  private smoothing = 0.1;

  constructor(target: Matter.Body) {
    this.target = target;
    this.camera = {
      x: target.position.x,
      y: target.position.y
    };
  }

  update() {
    // Lerp camera to target
    this.camera.x += (this.target.position.x - this.camera.x) * this.smoothing;
    this.camera.y += (this.target.position.y - this.camera.y) * this.smoothing;

    // Update camera position
    renderer.setViewport(this.camera.x, this.camera.y);
  }
}
```

---

## Performance Optimization

### Distance-Based Updates

```typescript
class EntityManager {
  private entities: TopDownController[] = [];
  private player: TopDownController;
  private updateRadius = 500;

  update() {
    const playerPos = this.player.body.position;

    this.entities.forEach(entity => {
      const distance = Math.sqrt(
        Math.pow(entity.body.position.x - playerPos.x, 2) +
        Math.pow(entity.body.position.y - playerPos.y, 2)
      );

      // Only update entities within radius
      if (distance < this.updateRadius) {
        entity.update();
      }
    });
  }
}
```

---

## Related Guides

- `physics-collision-2d-3d.md` - Collision detection
- `input-handling-gestures.md` - Mobile input patterns
- `ui-components-mobile-first.md` - Virtual joystick UI
- `performance-optimization-mobile.md` - Physics optimization

---
