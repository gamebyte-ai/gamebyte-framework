---
id: scene-management
title: Scene Management
description: Managing game scenes and their lifecycle
sidebar_position: 1
keywords: [scenes, lifecycle, states, game states]
llm_summary: "SceneManager: add(), switchTo(), remove(). BaseScene lifecycle: initialize() -> update() -> destroy(). Access via game.make('scene.manager')."
---

<!-- llm-context: scene-management, lifecycle, game-states, scene-switching -->

# Scene Management

Scenes organize your game into distinct states like menus, gameplay, and game over screens.

## Basic Usage

```typescript
import { createGame, BaseScene, SceneManager } from '@gamebyte/framework';

// Create a scene
class MenuScene extends BaseScene {
    constructor() {
        super('menu', 'Main Menu');
    }

    async initialize(): Promise<void> {
        await super.initialize();
        // Setup UI, load assets
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        // Update logic
    }

    destroy(): void {
        // Cleanup
        super.destroy();
    }
}

// Register and use
const game = createGame();
await game.initialize(canvas, '2d');

const sceneManager = game.make<SceneManager>('scene.manager');
sceneManager.add(new MenuScene());
sceneManager.add(new GameScene());
sceneManager.add(new GameOverScene());

await sceneManager.switchTo('menu');
```

## Scene Lifecycle

```
┌─────────────────────────────────────────────────┐
│                Scene Lifecycle                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │initialize│ -> │  update  │ -> │ destroy  │  │
│  │  (once)  │    │ (every   │    │  (once)  │  │
│  │          │    │  frame)  │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘  │
│       ▲                               │         │
│       │                               │         │
│       └───────────────────────────────┘         │
│           (if scene is reused)                  │
└─────────────────────────────────────────────────┘
```

## BaseScene Class

```typescript
abstract class BaseScene {
    readonly id: string;
    readonly name: string;
    readonly container: PIXI.Container;
    protected app: GameByte;

    constructor(id: string, name: string);

    // Lifecycle methods
    async initialize(): Promise<void>;
    update(deltaTime: number): void;
    pause(): void;
    resume(): void;
    destroy(): void;

    // Events
    onEnter(): void;
    onExit(): void;
}
```

## Creating Scenes

```typescript
import { BaseScene, UIButton, UIText } from '@gamebyte/framework';

class GameScene extends BaseScene {
    private player: Player;
    private enemies: Enemy[] = [];
    private score: number = 0;

    constructor() {
        super('game', 'Game');
    }

    async initialize(): Promise<void> {
        await super.initialize();

        // Load assets for this scene
        await Assets.load([
            { key: 'player', url: 'player.png', type: 'texture' },
            { key: 'enemy', url: 'enemy.png', type: 'texture' }
        ]);

        // Create player
        this.player = new Player();
        this.container.addChild(this.player.sprite);

        // Setup input
        this.setupInput();

        // Start spawning enemies
        this.startEnemySpawner();
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

        this.player.update(deltaTime);
        this.enemies.forEach(e => e.update(deltaTime));
        this.checkCollisions();
    }

    private checkCollisions(): void {
        // Collision logic
    }

    onEnter(): void {
        // Called when switching TO this scene
        Music.play('game-music');
    }

    onExit(): void {
        // Called when switching FROM this scene
        Music.stop();
    }

    destroy(): void {
        // Cleanup
        this.enemies.forEach(e => e.destroy());
        this.player.destroy();
        super.destroy();
    }
}
```

## Scene Manager API

```typescript
const sceneManager = game.make<SceneManager>('scene.manager');

// Add scene
sceneManager.add(new MenuScene());

// Switch to scene
await sceneManager.switchTo('game');

// Switch with transition
await sceneManager.switchTo('game', {
    type: 'fade',
    duration: 500
});

// Get current scene
const current = sceneManager.getCurrentScene();

// Get scene by ID
const menu = sceneManager.getScene('menu');

// Check if scene exists
if (sceneManager.hasScene('settings')) {
    // ...
}

// Remove scene
sceneManager.remove('old-scene');

// Pause/resume current scene
sceneManager.pause();
sceneManager.resume();
```

## Scene Data Passing

```typescript
// Pass data when switching
await sceneManager.switchTo('game-over', {
    data: {
        score: 1500,
        level: 5,
        reason: 'timeout'
    }
});

// Receive data in scene
class GameOverScene extends BaseScene {
    private finalScore: number;

    onEnter(data?: { score: number, level: number }): void {
        if (data) {
            this.finalScore = data.score;
            this.showScore(data.score);
        }
    }
}
```

## Preloading Scenes

```typescript
// Preload scene assets before switching
await sceneManager.preload('game');
await sceneManager.switchTo('game'); // Instant switch

// Or preload multiple
await sceneManager.preloadAll(['game', 'settings', 'shop']);
```

## Live Demo

import LiveDemo from '@site/src/components/LiveDemo';

<LiveDemo src="/demos/screen-manager-demo.html" height="600" title="Scene Management Demo" />
