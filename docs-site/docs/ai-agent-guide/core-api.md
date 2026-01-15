---
id: core-api
title: Core API
description: Essential API for AI agents
sidebar_position: 2
keywords: [core, api, essential, minimal]
llm_summary: "Essential GameByte API. createGame() -> initialize(canvas, mode) -> start(). Services: renderer, scene.manager, input, audio. UI: UIButton, TopBar. Scenes: BaseScene."
---

<!-- llm-context: core-api, essential, minimal-context, ai-optimized -->

# Core API

Essential GameByte API (~2000 tokens).

## Setup

```typescript
import { createGame, BaseScene, UIButton } from 'gamebyte-framework';

const game = createGame();
await game.initialize(canvas, '2d'); // '2d' | '3d' | 'hybrid'
game.start();
```

## Services

```typescript
// Get services
const renderer = game.make('renderer');
const sceneManager = game.make('scene.manager');
const input = game.make('input');
const assets = game.make('assets');
```

## Scenes

```typescript
class GameScene extends BaseScene {
    constructor() {
        super('game', 'Game Scene');
    }

    async initialize(): Promise<void> {
        await super.initialize();
        // Setup code
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        // Game logic
    }
}

// Register and switch
sceneManager.add(new GameScene());
await sceneManager.switchTo('game');
```

## UI Components

### Button

```typescript
const btn = new UIButton({
    text: 'PLAY',
    width: 200,
    height: 60,
    backgroundColor: 0x4CAF50
});
btn.setPosition(300, 270);
btn.on('click', () => console.log('clicked'));
scene.container.addChild(btn.getContainer());
```

### TopBar

```typescript
const topBar = new TopBar({
    width: 800,
    items: [
        { id: 'coins', type: TopBarItemType.RESOURCE, icon: coinTexture, value: 0 }
    ]
});
topBar.updateItem('coins', 100, true);
```

### ProgressBar

```typescript
const health = new UIProgressBar({
    width: 150, height: 16,
    value: 100, maxValue: 100,
    color: 0x22c55e
});
health.setValue(75, true);
```

## Input

```typescript
// Keyboard
input.keyboard.on('Space', (pressed) => { if (pressed) jump(); });

// Touch
input.touch.on('tap', (e) => handleTap(e.x, e.y));

// Polling
if (input.keyboard.isPressed('KeyW')) moveForward();
```

## Physics

```typescript
// 2D
Physics.create2DWorld({ gravity: { x: 0, y: 1 } });
const body = Physics.createBody({ x: 100, y: 100, width: 32, height: 48 });
Physics.onCollision('player', 'enemy', (a, b) => takeDamage());

// Update in loop
Physics.update(deltaTime);
```

## Audio

```typescript
// Music
Music.play('bgm', { loop: true, volume: 0.7 });

// SFX
SFX.play('click');

// Volume
Audio.setMasterVolume(0.8);
```

## Assets

```typescript
await Assets.load([
    { key: 'player', url: 'player.png', type: 'texture' },
    { key: 'bgm', url: 'music.mp3', type: 'audio' }
]);
const texture = Assets.get('player');
```

## Transitions

```typescript
await sceneManager.switchTo('game', {
    type: 'fade',
    duration: 500
});
```

## Key Types

```typescript
type RenderMode = '2d' | '3d' | 'hybrid';
type TransitionType = 'none' | 'fade' | 'slide' | 'zoom';

interface Vector2 { x: number; y: number; }
interface Vector3 { x: number; y: number; z: number; }
```
