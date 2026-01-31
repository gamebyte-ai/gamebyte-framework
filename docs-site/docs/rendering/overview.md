---
id: overview
title: Rendering Overview
description: Understanding GameByte's rendering system
sidebar_position: 1
keywords: [rendering, 2d, 3d, hybrid, pixi, three.js]
llm_summary: "Three render modes: '2d' (Pixi.js), '3d' (Three.js), 'hybrid' (both). Initialize with game.initialize(canvas, mode). Access via game.make('renderer')."
---

<!-- llm-context: rendering, pixi-v8, three-js, 2d, 3d, hybrid-mode, webgl, webgpu -->

# Rendering Overview

GameByte supports three rendering modes to cover any game type.

## Rendering Modes

| Mode | Engine | Use Case |
|------|--------|----------|
| `'2d'` | Pixi.js v8 | 2D games, sprites, UI |
| `'3d'` | Three.js | 3D games, first-person, third-person |
| `'hybrid'` | Both | 3D world with 2D UI overlay |

## Quick Selection Guide

```
                    Need 3D graphics?
                          │
            ┌─────────────┼─────────────┐
            │ No          │             │ Yes
            ▼             │             ▼
        Use '2d'          │        Need 2D UI?
                          │             │
                          │   ┌─────────┼─────────┐
                          │   │ No      │         │ Yes
                          │   ▼         │         ▼
                          │ Use '3d'    │    Use 'hybrid'
                          └─────────────┘
```

## Initializing Renderers

### 2D Mode (Pixi.js)

```typescript
import { createGame } from '@gamebyte/framework';

const game = createGame();
await game.initialize(canvas, '2d');

// Access 2D renderer
const renderer = game.make('renderer');
```

### 3D Mode (Three.js)

```typescript
const game = createGame();
await game.initialize(canvas, '3d');

// Access Three.js objects
const renderer = game.make('renderer');
const scene = renderer.getScene();
const camera = renderer.getCamera();
```

### Hybrid Mode

```typescript
const game = createGame();
await game.initialize(canvas, 'hybrid');

// Access both renderers
const renderer2D = game.make('renderer.2d');
const renderer3D = game.make('renderer.3d');
```

## Renderer Features

### 2D Renderer (Pixi.js)

- **WebGL/WebGPU** - Hardware-accelerated rendering
- **Sprites & Textures** - Efficient sprite batching
- **Filters** - Blur, glow, displacement, custom shaders
- **Masks** - Alpha, graphics, and sprite masks
- **Graphics API** - Procedural shapes
- **Text** - Bitmap and canvas text
- **Particles** - High-performance particle systems

### 3D Renderer (Three.js)

- **WebGL/WebGPU** - Modern graphics APIs
- **Geometries** - Box, sphere, custom meshes
- **Materials** - PBR, standard, custom shaders
- **Lighting** - Ambient, directional, point, spot
- **Shadows** - Real-time shadow mapping
- **Post-processing** - Bloom, SSAO, color grading
- **Loaders** - GLTF, OBJ, FBX models

## Performance Considerations

### Mobile Optimization

```typescript
createGame({
    renderer: {
        // Lower resolution for performance
        resolution: Math.min(window.devicePixelRatio, 2),

        // Prefer power efficiency
        powerPreference: 'low-power',

        // Disable antialiasing on low-end devices
        antialias: !isMobile()
    }
});
```

### Batching

Pixi.js automatically batches sprites with the same texture:

```typescript
// Good: Same texture = batched
sprites.forEach(s => s.texture = sharedTexture);

// Bad: Different textures = separate draw calls
sprites.forEach((s, i) => s.texture = textures[i]);
```

### Culling

Only render what's visible:

```typescript
// Enable view culling
renderer.setConfig({
    culling: true,
    cullPadding: 100 // pixels outside viewport
});
```

## Renderer API

### Common Methods

```typescript
const renderer = game.make('renderer');

// Start/stop rendering
renderer.start();
renderer.stop();

// Resize handling
renderer.resize(width, height);

// Background color
renderer.setBackgroundColor(0x1a1a2e);

// Take screenshot
const dataUrl = renderer.screenshot();
```

### 2D-Specific

```typescript
const renderer = game.make('renderer');

// Get Pixi application
const app = renderer.getApp();

// Get root container
const stage = renderer.getStage();

// Add display object
renderer.add(sprite);
```

### 3D-Specific

```typescript
const renderer = game.make('renderer');

// Get Three.js objects
const scene = renderer.getScene();
const camera = renderer.getCamera();
const threeRenderer = renderer.getThreeRenderer();

// Add 3D object
renderer.add(mesh);
```

## Next Steps

- [2D Rendering](/rendering/2d-pixi) - Deep dive into Pixi.js
- [3D Rendering](/rendering/3d-three) - Deep dive into Three.js
- [Hybrid Mode](/rendering/hybrid-mode) - Combining 2D and 3D

## Live Demo

import LiveDemo from '@site/src/components/LiveDemo';

<LiveDemo src="/demos/hybrid-game.html" height="450" title="Hybrid Rendering Demo" />
