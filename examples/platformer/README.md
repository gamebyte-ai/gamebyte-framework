# Platformer Example

2D platformer with physics, player controller, and ground collision.

<!-- keywords: platformer, physics, player, controller, jump, collision, 2d, matter -->

---

## Features

- Player controller with left/right movement
- Variable jump height (hold for higher jump)
- Ground collision detection
- Physics-based movement with Matter.js

---

## Files

- `index.html` - Full implementation (~150 lines)

---

## Key Concepts

**Physics Setup:**
```typescript
const physicsManager = game.make('physics');
const player = physicsManager.createBody({
  shape: 'rectangle',
  width: 40,
  height: 60
});
```

**Ground Detection:**
```typescript
physicsManager.on('collision:active', (bodyA, bodyB) => {
  if (bodyB.label === 'ground') {
    isGrounded = true;
  }
});
```

**Input Handling:**
```typescript
inputManager.on('keydown', (event) => {
  if (event.key === ' ') player.jump();
});
```

---

## Related Guides

- `docs/guides/physics-platformer-controller.md` - Advanced controller patterns
- `docs/guides/physics-collision-2d-3d.md` - Collision detection
- `docs/guides/ui-components-mobile-first.md` - Touch controls

---
