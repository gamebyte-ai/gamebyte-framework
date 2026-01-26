---
id: first-game-tutorial
title: First Game Tutorial
description: Build a complete platformer game step by step
sidebar_position: 3
keywords: [tutorial, platformer, complete game, step by step]
llm_summary: "Complete platformer tutorial: Setup project -> Create player with physics -> Add platforms -> Implement controls -> Add collectibles -> Polish with UI."
---

<!-- llm-context: tutorial, platformer, physics, controls, collectibles, complete-game -->

import LiveDemo from '@site/src/components/LiveDemo';

# First Game Tutorial

Build a complete platformer game from scratch. This tutorial covers all the essential GameByte features.

## What We're Building

A simple platformer with:
- Player character with physics
- Platforms to jump on
- Collectible coins
- Score display
- Game over screen

<LiveDemo
  src="/demos/platformer-tutorial.html"
  height={450}
  title="Complete Platformer"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Project Setup

### 1. Create Project Structure

```
my-platformer/
├── index.html
├── src/
│   ├── main.ts
│   ├── scenes/
│   │   ├── MenuScene.ts
│   │   └── GameScene.ts
│   └── entities/
│       ├── Player.ts
│       └── Coin.ts
└── assets/
    ├── player.png
    └── coin.png
```

### 2. Initialize Project

```bash
npm init -y
npm install @gamebyte/framework pixi.js matter-js
npm install -D typescript vite
```

## Step 1: Main Entry Point

```typescript
// src/main.ts
import { createGame, SceneManager } from '@gamebyte/framework';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

async function main() {
    const game = createGame();
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    canvas.width = 800;
    canvas.height = 600;

    await game.initialize(canvas, '2d');

    // Register scenes
    const sceneManager = game.make<SceneManager>('scene.manager');
    sceneManager.add(new MenuScene());
    sceneManager.add(new GameScene());

    // Start with menu
    await sceneManager.switchTo('menu');
    game.start();
}

main();
```

## Step 2: Menu Scene

```typescript
// src/scenes/MenuScene.ts
import { BaseScene, UIButton, UIText } from '@gamebyte/framework';

export class MenuScene extends BaseScene {
    constructor() {
        super('menu', 'Main Menu');
    }

    async initialize(): Promise<void> {
        await super.initialize();

        // Title
        const title = new UIText({
            text: 'PLATFORMER',
            fontSize: 48,
            fontWeight: 'bold',
            color: 0xffffff
        });
        title.setPosition(400, 150);
        this.container.addChild(title.getContainer());

        // Play button
        const playButton = new UIButton({
            text: 'PLAY',
            width: 200,
            height: 60,
            backgroundColor: 0x22c55e,
            gradient: { enabled: true, colorTop: 0x4ade80, colorBottom: 0x16a34a },
            glowEffect: true,
            rippleEffect: true
        });

        playButton.setPosition(300, 300);
        playButton.on('click', () => {
            const sceneManager = this.app.make('scene.manager');
            sceneManager.switchTo('game', { type: 'fade', duration: 500 });
        });

        this.container.addChild(playButton.getContainer());
    }
}
```

## Step 3: Player Entity

```typescript
// src/entities/Player.ts
import * as PIXI from 'pixi.js';
import { Physics } from '@gamebyte/framework';

export class Player {
    public sprite: PIXI.Sprite;
    public body: Matter.Body;

    private speed = 5;
    private jumpForce = -12;
    private isGrounded = false;

    constructor(x: number, y: number) {
        // Create sprite
        this.sprite = PIXI.Sprite.from('assets/player.png');
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(x, y);

        // Create physics body
        this.body = Physics.createBody({
            x, y,
            width: 32,
            height: 48,
            options: {
                friction: 0.1,
                restitution: 0,
                label: 'player'
            }
        });
    }

    update(keys: { left: boolean; right: boolean; jump: boolean }): void {
        // Horizontal movement
        let velocityX = 0;
        if (keys.left) velocityX = -this.speed;
        if (keys.right) velocityX = this.speed;

        Physics.setVelocityX(this.body, velocityX);

        // Jump
        if (keys.jump && this.isGrounded) {
            Physics.setVelocityY(this.body, this.jumpForce);
            this.isGrounded = false;
        }

        // Sync sprite with physics
        this.sprite.position.set(this.body.position.x, this.body.position.y);
    }

    setGrounded(grounded: boolean): void {
        this.isGrounded = grounded;
    }
}
```

## Step 4: Game Scene

```typescript
// src/scenes/GameScene.ts
import { BaseScene, Physics, TopBar, TopBarItemType } from '@gamebyte/framework';
import { Player } from '../entities/Player';

export class GameScene extends BaseScene {
    private player!: Player;
    private score = 0;
    private topBar!: TopBar;
    private keys = { left: false, right: false, jump: false };

    constructor() {
        super('game', 'Game');
    }

    async initialize(): Promise<void> {
        await super.initialize();

        // Initialize physics
        Physics.create2DWorld({ gravity: { x: 0, y: 1 } });

        // Create player
        this.player = new Player(100, 300);
        this.container.addChild(this.player.sprite);

        // Create platforms
        this.createPlatforms();

        // Create UI
        this.createUI();

        // Setup input
        this.setupInput();

        // Setup collision detection
        this.setupCollisions();
    }

    private createPlatforms(): void {
        const platforms = [
            { x: 400, y: 550, width: 800, height: 40 },  // Ground
            { x: 200, y: 400, width: 150, height: 20 },
            { x: 500, y: 300, width: 150, height: 20 },
            { x: 300, y: 200, width: 150, height: 20 },
        ];

        platforms.forEach(p => {
            // Visual (Pixi v8 API)
            const graphics = new PIXI.Graphics();
            graphics.rect(-p.width/2, -p.height/2, p.width, p.height);
            graphics.fill(0x4a5568);
            graphics.position.set(p.x, p.y);
            this.container.addChild(graphics);

            // Physics
            Physics.createStaticBody({
                x: p.x, y: p.y,
                width: p.width, height: p.height,
                options: { label: 'platform' }
            });
        });
    }

    private createUI(): void {
        this.topBar = new TopBar({
            width: 800,
            items: [
                {
                    id: 'score',
                    type: TopBarItemType.RESOURCE,
                    icon: 'coin',
                    value: 0,
                    format: 'number',
                    animated: true
                }
            ]
        });
        this.container.addChild(this.topBar.getContainer());
    }

    private setupInput(): void {
        const input = this.app.make('input');

        input.keyboard.on('KeyA', (pressed: boolean) => this.keys.left = pressed);
        input.keyboard.on('KeyD', (pressed: boolean) => this.keys.right = pressed);
        input.keyboard.on('Space', (pressed: boolean) => this.keys.jump = pressed);
        input.keyboard.on('ArrowLeft', (pressed: boolean) => this.keys.left = pressed);
        input.keyboard.on('ArrowRight', (pressed: boolean) => this.keys.right = pressed);
    }

    private setupCollisions(): void {
        Physics.onCollision('player', 'platform', () => {
            this.player.setGrounded(true);
        });

        Physics.onCollision('player', 'coin', (_, coinBody) => {
            this.collectCoin(coinBody);
        });
    }

    private collectCoin(coinBody: Matter.Body): void {
        this.score += 10;
        this.topBar.updateItem('score', this.score, true);
        Physics.removeBody(coinBody);
        // Remove visual (implementation depends on how you track coin sprites)
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        Physics.update(deltaTime);
        this.player.update(this.keys);
    }
}
```

## Step 5: Add Polish

### Screen Shake on Coin Collect

```typescript
import { gsap } from 'gsap';

private collectCoin(coinBody: Matter.Body): void {
    this.score += 10;
    this.topBar.updateItem('score', this.score, true);

    // Screen shake with GSAP
    const originalX = this.container.x;
    const originalY = this.container.y;
    gsap.to(this.container, {
        x: originalX + 5,
        duration: 0.05,
        repeat: 3,
        yoyo: true,
        onComplete: () => {
            this.container.x = originalX;
            this.container.y = originalY;
        }
    });

    Physics.removeBody(coinBody);
}
```

### Background Music

```typescript
import { Music, SFX } from '@gamebyte/framework';

async initialize(): Promise<void> {
    // ... existing code

    // Play background music
    Music.play('assets/music.mp3', { loop: true, volume: 0.5 });
}

private collectCoin(): void {
    // Play coin sound
    SFX.play('assets/coin.mp3');
    // ... rest of code
}
```

## Complete Code

See the [full example on GitHub](https://github.com/gamebyte-ai/gamebyte-framework/tree/main/examples/platformer).

## Next Steps

- [Core Concepts](/core-concepts/architecture) - Understand the service container
- [Physics](/physics/2d-matter) - Deep dive into Matter.js integration
- [UI Components](/ui-components/overview) - Explore all UI options
