---
id: quick-reference
title: Quick Reference
description: Cheatsheet for common GameByte patterns
sidebar_position: 3
keywords: [cheatsheet, quick, reference, patterns]
llm_summary: "GameByte cheatsheet. Setup: createGame() -> initialize() -> start(). UI: UIButton, TopBar. Scene: BaseScene.initialize/update. Physics: create2DWorld, createBody."
---

<!-- llm-context: cheatsheet, quick-reference, patterns, snippets -->

# Quick Reference

## Setup

```typescript
const game = createGame();
await game.initialize(canvas, '2d');
game.start();
```

## Scene

```typescript
class MyScene extends BaseScene {
    constructor() { super('id', 'Name'); }
    async initialize() { await super.initialize(); }
    update(dt) { super.update(dt); }
}
sceneManager.add(new MyScene());
await sceneManager.switchTo('id');
```

## UI

```typescript
// Button
new UIButton({ text: 'OK', width: 100, height: 50, backgroundColor: 0x4CAF50 })

// TopBar
new TopBar({ width: 800, items: [{ id: 'score', type: TopBarItemType.RESOURCE, value: 0 }] })

// Progress
new UIProgressBar({ width: 150, height: 16, value: 100, maxValue: 100, color: 0x22c55e })
```

## Input

```typescript
input.keyboard.on('Space', (pressed) => {});
input.touch.on('tap', (e) => {});
input.keyboard.isPressed('KeyW');
```

## Physics

```typescript
Physics.create2DWorld({ gravity: { x: 0, y: 1 } });
Physics.createBody({ x, y, width, height });
Physics.onCollision('a', 'b', callback);
```

## Audio

```typescript
Music.play('bgm', { loop: true });
SFX.play('click');
Audio.setMasterVolume(0.8);
```

## Assets

```typescript
await Assets.load([{ key: 'tex', url: 'img.png', type: 'texture' }]);
Assets.get('tex');
```

## Services

| Key | Type |
|-----|------|
| `renderer` | Renderer |
| `scene.manager` | SceneManager |
| `input` | InputManager |
| `audio` | AudioManager |
| `assets` | AssetManager |
| `physics` | PhysicsManager |
