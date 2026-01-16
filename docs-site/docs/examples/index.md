---
sidebar_position: 1
title: Examples & Demos
description: Interactive examples and demos showcasing GameByte Framework features
---

# Examples & Demos

Explore interactive demos and code examples to learn GameByte Framework.

## Game Examples

### Platformer Game
A complete 2D platformer with physics-based movement, jumping, and collision detection.

<a href="/demos/platformer-physics.html" target="_blank" class="button button--primary button--lg">
  Play Platformer Demo
</a>

**Features:**
- Physics-based player movement
- Variable jump height (hold to jump higher)
- Ground detection via collision events
- Multiple platforms

**Source:** [`examples/platformer/`](https://github.com/gamebyte-ai/gamebyte-framework/tree/main/examples/platformer)

---

### Merge Puzzle Game
A mobile-style merge puzzle with drag-and-drop mechanics and tier progression.

<a href="/demos/merge-puzzle.html" target="_blank" class="button button--primary button--lg">
  Play Merge Puzzle Demo
</a>

**Features:**
- Grid-based merge mechanics
- Drag and drop interactions
- Tier-based progression
- Smooth animations

**Source:** [`examples/merge-game/`](https://github.com/gamebyte-ai/gamebyte-framework/tree/main/examples/merge-game)

---

## Feature Demos

| Demo | Description | Link |
|------|-------------|------|
| **Physics 2D** | Matter.js physics simulation | [Open](/demos/physics-2d.html) |
| **Physics 3D** | Cannon.js 3D physics | [Open](/demos/physics-3d.html) |
| **Hybrid Game** | 2D + 3D combined rendering | [Open](/demos/hybrid-game.html) |
| **3D Shapes** | Three.js basic shapes | [Open](/demos/3d-basic-shapes.html) |
| **Spatial Audio** | 3D positional audio | [Open](/demos/audio-spatial.html) |

---

## UI Component Demos

| Component | Description | Link |
|-----------|-------------|------|
| **Button** | Interactive buttons | [Open](/demos/ui-button-basic.html) |
| **Button Effects** | Button animations | [Open](/demos/ui-button-effects.html) |
| **Panel** | Container panels | [Open](/demos/ui-panel-basic.html) |
| **Progress Bar** | Progress indicators | [Open](/demos/ui-progress-bar.html) |
| **Top Bar** | Game HUD top bar | [Open](/demos/ui-topbar.html) |

---

## Running Examples Locally

```bash
# Clone the repository
git clone https://github.com/gamebyte-ai/gamebyte-framework.git
cd gamebyte-framework

# Install dependencies
npm install

# Build the framework
npm run build

# Run examples locally
cd examples/platformer
npx serve .
```

---

## Creating Your Own

Use these examples as templates for your own games:

```typescript
import { createGame } from '@gamebyte/framework';

const game = createGame();

game.on('initialized', async () => {
  const physics = game.make('physics');
  const renderer = game.make('renderer');

  // Your game code here...
});

await game.initialize(canvas, '2d');
game.start();
```

See [Getting Started](/getting-started/quick-start) for more details.
