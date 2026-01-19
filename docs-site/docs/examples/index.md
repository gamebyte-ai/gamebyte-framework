---
sidebar_position: 1
title: Examples & Demos
description: Interactive examples and demos showcasing GameByte Framework features
---

# Examples & Demos

Explore interactive demos and code examples to learn GameByte Framework. All examples demonstrate the complete game flow: Splash Screen -> Loading -> Menu -> Game -> Game Over.

## Complete Game Examples

### Platformer Game
A 2D physics platformer with coin collection, enemies, and multiple platforms.

<a href="/demos/platformer-physics.html" target="_blank" class="button button--primary button--lg">
  Play Platformer Demo
</a>

**Features:**
- Physics-based movement with Matter.js
- Variable jump height (hold Space for higher jump)
- Coin collection with score system
- Enemy AI with patrol behavior
- Complete game flow with menu and game over screens

**Source:** [`examples/platformer/`](https://github.com/gamebyte-ai/gamebyte-framework/tree/main/examples/platformer)

---

### Merge Puzzle Game
A mobile-style merge puzzle with drag-and-drop mechanics and tier progression.

<a href="/demos/merge-puzzle.html" target="_blank" class="button button--primary button--lg">
  Play Merge Puzzle Demo
</a>

**Features:**
- Grid-based merge mechanics (5x5 grid)
- Drag and drop item merging
- 10 tier progression system
- High score persistence with localStorage
- Canvas-based UI (no HTML elements)

**Source:** [`examples/merge-game/`](https://github.com/gamebyte-ai/gamebyte-framework/tree/main/examples/merge-game)

---

### Space Shooter
A classic top-down space shooter with waves of enemies and power-ups.

<a href="/demos/space-shooter.html" target="_blank" class="button button--primary button--lg">
  Play Space Shooter Demo
</a>

**Features:**
- Smooth ship movement (arrow keys/WASD)
- Continuous shooting (hold Space)
- Multiple enemy types (basic, fast, tank)
- Wave progression system
- Starfield background animation

**Source:** [`examples/space-shooter/`](https://github.com/gamebyte-ai/gamebyte-framework/tree/main/examples/space-shooter)

---

### 3D Runner
An endless runner demonstrating the Hybrid renderer (Three.js 3D + Pixi.js UI overlay).

<a href="/demos/3d-runner.html" target="_blank" class="button button--primary button--lg">
  Play 3D Runner Demo
</a>

**Features:**
- Three.js 3D graphics with Pixi.js UI overlay
- Lane-switching mechanics (A/D keys)
- Jump to avoid obstacles (Space)
- Coin collection in 3D space
- Distance-based scoring

**Source:** [`examples/3d-runner/`](https://github.com/gamebyte-ai/gamebyte-framework/tree/main/examples/3d-runner)

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
