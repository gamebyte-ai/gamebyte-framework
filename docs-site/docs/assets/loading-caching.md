---
id: loading-caching
title: Asset Loading & Caching
description: Loading and managing game assets
sidebar_position: 1
keywords: [assets, loading, caching, textures, audio]
llm_summary: "Assets.load([{ key, url, type }]). Types: texture, audio, json, model. Caches automatically. Progress: on('progress', callback). Bundles for organized loading."
---

<!-- llm-context: asset-management, loading, caching, textures, audio, preload -->

# Asset Loading & Caching

GameByte's asset system handles loading, caching, and memory management.

## Basic Loading

```typescript
import { Assets } from '@gamebyte/framework';

// Load single asset
const texture = await Assets.load({ key: 'player', url: 'player.png', type: 'texture' });

// Load multiple
await Assets.load([
    { key: 'player', url: 'player.png', type: 'texture' },
    { key: 'enemy', url: 'enemy.png', type: 'texture' },
    { key: 'bgm', url: 'music.mp3', type: 'audio' },
    { key: 'config', url: 'config.json', type: 'json' }
]);

// Get loaded asset
const playerTexture = Assets.get('player');
```

## Asset Types

| Type | Extensions | Returns |
|------|------------|---------|
| `texture` | png, jpg, webp | PIXI.Texture |
| `audio` | mp3, ogg, wav | AudioBuffer |
| `json` | json | Object |
| `model` | gltf, glb | GLTF |
| `font` | ttf, woff | FontFace |
| `spritesheet` | json | PIXI.Spritesheet |

## Loading Progress

```typescript
Assets.on('progress', (progress) => {
    loadingBar.setValue(progress * 100);
    console.log(`Loading: ${Math.round(progress * 100)}%`);
});

Assets.on('complete', () => {
    console.log('All assets loaded!');
    startGame();
});

Assets.on('error', (error, asset) => {
    console.error(`Failed to load ${asset.key}:`, error);
});

await Assets.load(assetList);
```

## Asset Bundles

```typescript
// Define bundles
Assets.addBundle('menu', [
    { key: 'logo', url: 'logo.png', type: 'texture' },
    { key: 'menu-bg', url: 'menu-bg.jpg', type: 'texture' },
    { key: 'menu-music', url: 'menu.mp3', type: 'audio' }
]);

Assets.addBundle('game', [
    { key: 'player', url: 'player.png', type: 'texture' },
    { key: 'enemies', url: 'enemies.json', type: 'spritesheet' },
    { key: 'game-music', url: 'game.mp3', type: 'audio' }
]);

// Load bundle
await Assets.loadBundle('menu');

// Later, load game bundle
await Assets.loadBundle('game');
```

## Caching

```typescript
// Assets are cached automatically
const tex1 = await Assets.load({ key: 'player', url: 'player.png', type: 'texture' });
const tex2 = Assets.get('player'); // Returns cached, no network request

// Check if cached
if (Assets.has('player')) {
    // Already loaded
}

// Unload to free memory
Assets.unload('player');

// Unload bundle
Assets.unloadBundle('menu');
```

## Background Loading

```typescript
// Load in background while playing
Assets.loadBundle('level-2', { background: true });

// Check if ready
if (Assets.isBundleLoaded('level-2')) {
    proceedToLevel2();
}
```
