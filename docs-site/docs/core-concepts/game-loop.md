---
id: game-loop
title: Game Loop
description: Understanding GameByte's update cycle and delta time
sidebar_position: 2
keywords: [game loop, update, delta time, fps, fixed timestep]
llm_summary: "Game loop runs at 60fps. update(deltaTime) called each frame. deltaTime in seconds (0.016 at 60fps). Use for frame-independent movement. Physics uses fixed timestep internally."
---

<!-- llm-context: game-loop, update-cycle, delta-time, fixed-timestep, fps, requestAnimationFrame -->

# Game Loop

The game loop is the heartbeat of your game, updating logic and rendering frames continuously.

## How It Works

GameByte's game loop:

1. Calculates delta time (time since last frame)
2. Calls `update(deltaTime)` on the active scene
3. Updates physics (if enabled)
4. Updates animations
5. Renders the frame
6. Repeats via `requestAnimationFrame`

```
┌─────────────────────────────────────┐
│           Game Loop                 │
│  ┌─────────────────────────────────┐│
│  │ 1. Calculate deltaTime          ││
│  │ 2. Scene.update(deltaTime)      ││
│  │ 3. Physics.update(deltaTime)    ││
│  │ 4. Animations.update(deltaTime) ││
│  │ 5. Renderer.render()            ││
│  │ 6. requestAnimationFrame(loop)  ││
│  └─────────────────────────────────┘│
│           ↻ 60 times/second         │
└─────────────────────────────────────┘
```

## Starting and Stopping

```typescript
const game = createGame();
await game.initialize(canvas, '2d');

// Start the loop
game.start();

// Pause (stops updates, keeps rendering)
game.pause();

// Resume
game.resume();

// Completely stop
game.stop();
```

## Delta Time

Delta time is the time elapsed since the last frame, measured in **seconds**.

| FPS | Delta Time |
|-----|------------|
| 60 | 0.0167s |
| 30 | 0.0333s |
| 120 | 0.0083s |

### Frame-Independent Movement

Always multiply movement by delta time:

```typescript
// Bad: Speed varies with frame rate
update() {
    this.x += 5; // 300 pixels/sec at 60fps, 150 at 30fps
}

// Good: Consistent speed at any frame rate
update(deltaTime: number) {
    const speed = 300; // pixels per second
    this.x += speed * deltaTime; // Always 300 pixels/sec
}
```

### Example: Moving Player

```typescript
class Player {
    x = 0;
    y = 0;
    speed = 200; // pixels per second

    update(deltaTime: number, keys: { left: boolean; right: boolean }) {
        if (keys.left) {
            this.x -= this.speed * deltaTime;
        }
        if (keys.right) {
            this.x += this.speed * deltaTime;
        }
    }
}
```

## Scene Update

Your scene's `update` method receives delta time:

```typescript
class GameScene extends BaseScene {
    private player: Player;
    private enemies: Enemy[] = [];

    update(deltaTime: number): void {
        super.update(deltaTime); // Important: call parent

        // Update player
        this.player.update(deltaTime);

        // Update all enemies
        this.enemies.forEach(enemy => enemy.update(deltaTime));

        // Check collisions
        this.checkCollisions();
    }
}
```

## Fixed Timestep (Physics)

For physics simulations, use fixed timestep to ensure consistent behavior:

```typescript
import { Physics } from 'gamebyte-framework';

// Physics automatically uses fixed timestep (1/60)
Physics.create2DWorld({
    gravity: { x: 0, y: 9.8 },
    timestep: 1/60 // Fixed 60 updates per second
});
```

### Why Fixed Timestep?

Variable delta time can cause physics instability:

```typescript
// Problem: Large delta time = objects pass through walls
// Frame drop: deltaTime = 0.5s, velocity = 1000
// Movement = 500 pixels in one frame → misses collision

// Solution: Fixed timestep with accumulator (handled internally)
```

## Performance Monitoring

GameByte tracks performance metrics:

```typescript
const game = createGame();

// Enable performance monitoring
game.setConfig({ debug: { showFPS: true } });

// Access metrics
game.on('tick', (metrics) => {
    console.log(`FPS: ${metrics.fps}`);
    console.log(`Frame time: ${metrics.frameTime}ms`);
    console.log(`Update time: ${metrics.updateTime}ms`);
    console.log(`Render time: ${metrics.renderTime}ms`);
});
```

### Target Frame Rate

```typescript
// Set target FPS (default: 60)
game.setConfig({ targetFPS: 60 });

// For mobile battery savings
game.setConfig({ targetFPS: 30 });

// Uncapped (not recommended)
game.setConfig({ targetFPS: 0 });
```

## Common Patterns

### Time-Based Events

```typescript
class GameScene extends BaseScene {
    private spawnTimer = 0;
    private spawnInterval = 2; // seconds

    update(deltaTime: number): void {
        super.update(deltaTime);

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }
}
```

### Smooth Interpolation

```typescript
// Smooth camera follow
class Camera {
    x = 0;
    y = 0;
    smoothing = 5; // Higher = faster

    update(deltaTime: number, targetX: number, targetY: number) {
        // Lerp towards target
        this.x += (targetX - this.x) * this.smoothing * deltaTime;
        this.y += (targetY - this.y) * this.smoothing * deltaTime;
    }
}
```

### Animation Timing

```typescript
class AnimatedSprite {
    private frameTime = 0;
    private frameIndex = 0;
    private frameDuration = 0.1; // 100ms per frame

    update(deltaTime: number): void {
        this.frameTime += deltaTime;
        if (this.frameTime >= this.frameDuration) {
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
            this.frameTime = 0;
        }
    }
}
```

## Best Practices

1. **Always use deltaTime** for movement and timers
2. **Call `super.update(deltaTime)`** in scene updates
3. **Keep update() lightweight** - heavy work in separate systems
4. **Profile regularly** - watch for frame time spikes
5. **Consider mobile** - target 30fps for battery life
