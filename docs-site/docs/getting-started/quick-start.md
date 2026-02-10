---
id: quick-start
title: Quick Start
description: Build your first GameByte game in 5 minutes
sidebar_position: 2
keywords: [quick start, tutorial, first game, beginner]
llm_summary: "Minimal game setup: createGame() -> initialize(canvas, '2d') -> start(). Add scenes with sceneManager.add(scene). Switch scenes with sceneManager.switchTo('name')."
---

<!-- llm-context: quick-start, minimal-setup, game-loop, scene-creation, 5-minute-guide -->

import LiveDemo from '@site/src/components/LiveDemo';

# Quick Start

Build your first GameByte game in 5 minutes.

<LiveDemo
  src="/demos/quick-start.html"
  height={480}
  title="Quick Start - Star Collection Demo"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Step 1: Setup HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>My First Game</title>
    <style>
        body { margin: 0; background: #1a1a2e; }
        #game-canvas { display: block; }
    </style>
</head>
<body>
    <canvas id="game-canvas"></canvas>
    <script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@gamebyte/framework/dist/gamebyte.umd.js"></script>
    <script src="game.js"></script>
</body>
</html>
```

## Step 2: Create the Game

```javascript
// game.js
const { createGame, BaseScene, UIButton } = GameByteFramework;

// Create game instance
const game = createGame();

// Get canvas and set size
const canvas = document.getElementById('game-canvas');
canvas.width = 800;
canvas.height = 600;

// Initialize and start
async function main() {
    await game.initialize(canvas, '2d');

    // Create a simple scene
    const scene = new MenuScene();
    const sceneManager = game.make('scene.manager');
    sceneManager.add(scene);
    await sceneManager.switchTo('menu');

    // Start the game loop
    game.start();
}

// Define a scene
class MenuScene extends BaseScene {
    constructor() {
        super('menu', 'Main Menu');
    }

    async initialize() {
        await super.initialize();

        // Add a play button
        const button = new UIButton({
            text: 'PLAY',
            width: 200,
            height: 60,
            backgroundColor: 0x6366f1,
            gradient: { enabled: true },
            glowEffect: true
        });

        button.setPosition(300, 270);
        button.on('click', () => {
            console.log('Game started!');
        });

        this.container.addChild(button.getContainer());
    }
}

main().catch(console.error);
```

## Step 3: Run It

Open the HTML file in a browser or use a local server:

```bash
npx http-server -p 8080
```

## What's Happening?

1. **`createGame()`** - Creates the game instance with service container
2. **`initialize(canvas, '2d')`** - Sets up Pixi.js renderer
3. **`BaseScene`** - Provides lifecycle hooks (initialize, update, destroy)
4. **`UIButton`** - Creates a touch-friendly button with visual effects
5. **`game.start()`** - Begins the game loop (60 FPS)

## TypeScript Version

```typescript
import { createGame, BaseScene, UIButton, GameByte, SceneManager } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

class MenuScene extends BaseScene {
    async initialize(): Promise<void> {
        await super.initialize();

        const button = new UIButton({
            text: 'PLAY',
            width: 200,
            height: 60,
            backgroundColor: 0x6366f1
        });

        button.setPosition(300, 270);
        button.on('click', () => this.startGame());

        this.container.addChild(button.getContainer());
    }

    private startGame(): void {
        const sceneManager = this.app.make<SceneManager>('scene.manager');
        sceneManager.switchTo('game');
    }
}

async function main(): Promise<void> {
    const game = createGame();
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    await game.initialize(canvas, '2d');

    const sceneManager = game.make<SceneManager>('scene.manager');
    sceneManager.add(new MenuScene());
    await sceneManager.switchTo('menu');

    game.start();
}

main();
```

## Next Steps

- [First Game Tutorial](/getting-started/first-game-tutorial) - Build a complete platformer
- [Core Concepts](/core-concepts/architecture) - Understand the architecture
- [UI Components](/ui-components/overview) - Explore the UI system
