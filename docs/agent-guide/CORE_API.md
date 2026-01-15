# GameByte Core API for AI Agents

> **Load this first** - Essential API knowledge for rapid game prototyping (~2000 tokens)

<!-- keywords: core, api, essential, quick-start, initialization, agent, ai -->

---

## Table of Contents

1. [Initialization Patterns](#initialization-patterns)
2. [Core Services](#core-services)
3. [Common Patterns](#common-patterns)
4. [Mobile-First Defaults](#mobile-first-defaults)
5. [Anti-Patterns](#anti-patterns)

---

## Initialization Patterns

### Pattern 1: Minimal Game (4 lines)

```typescript
import { createGame } from 'gamebyte-framework';

const game = createGame();                    // All systems auto-registered
await game.initialize(canvas, '2d');          // Smart defaults applied
game.start();                                 // Game loop starts
```

**What happens:**
- ✅ 9 service providers registered (rendering, scene, UI, audio, physics, input, assets, performance, plugins)
- ✅ Optimal pixel ratio detected
- ✅ Mobile-first defaults applied (44px touch targets)
- ✅ Performance tier auto-detected
- ✅ Responsive scaling configured

**When to use:** Quick prototypes, simple 2D games, learning

---

### Pattern 2: With Configuration

```typescript
import { createGame } from 'gamebyte-framework';

const game = createGame();
await game.initialize(canvas, '2d', {
  antialias: true,          // Default: auto-detected
  resolution: 2,            // Default: devicePixelRatio
  backgroundColor: 0x1a1a2e // Default: 0x000000
});
game.start();
```

**When to use:** Custom rendering settings, specific visual requirements

---

### Pattern 3: Mobile-Optimized

```typescript
import { createMobileGame } from 'gamebyte-framework';

const game = createMobileGame();  // Mobile-specific optimizations
await game.initialize(canvas, '2d', {
  autoDensity: true,              // Handles device pixel ratio
  responsive: true                 // Enables responsive scaling
});
game.start();
```

**Mobile optimizations:**
- ✅ Touch event handling (44px minimum)
- ✅ Battery-conscious rendering
- ✅ Performance tier detection
- ✅ Memory pressure monitoring
- ✅ Responsive layout helpers

**When to use:** All mobile games, touch-first experiences

---

### Pattern 4: 3D Game

```typescript
import { createGame } from 'gamebyte-framework';

const game = createGame();
await game.initialize(canvas, '3d', {
  antialias: true,
  shadowMap: { enabled: true, type: 'PCFSoftShadowMap' }
});

const renderer = game.make('renderer');
const scene = renderer.getScene();  // THREE.Scene
const camera = renderer.getCamera(); // THREE.PerspectiveCamera

game.start();
```

**When to use:** 3D games, hybrid 2D/3D experiences

---

## Core Services

All services are lazily loaded via the service container.

### Access Pattern

```typescript
const service = game.make<ServiceType>('service.name');
```

### Available Services

| Service | Key | Type | Purpose |
|---------|-----|------|---------|
| **Renderer** | `'renderer'` | `Renderer` | 2D/3D rendering |
| **Scene Manager** | `'scene.manager'` | `SceneManager` | Scene lifecycle |
| **UI Manager** | `'ui.manager'` | `GameByteUIManager` | UI components |
| **Asset Manager** | `'assets'` | `GameByteAssetManager` | Asset loading/caching |
| **Audio Manager** | `'audio'` | `GameByteAudioManager` | Audio playback |
| **Input Manager** | `'input'` | `InputManager` | Input handling |
| **Physics Manager** | `'physics'` | `PhysicsManager` | Physics simulation |
| **Performance Monitor** | `'performance'` | `PerformanceMonitor` | FPS/memory tracking |

### Quick Access Examples

```typescript
// Rendering
const renderer = game.make('renderer');
const stage = renderer.getStage();  // PIXI.Container or THREE.Scene

// Scenes
const sceneManager = game.make('scene.manager');
await sceneManager.load('main-menu');

// UI
const uiManager = game.make('ui.manager');
const button = uiManager.createComponent('button', { text: 'Play' });

// Assets
const assetManager = game.make('assets');
await assetManager.load({ id: 'player', url: './player.png', type: 'texture' });

// Audio
const audioManager = game.make('audio');
await audioManager.playMusic('bgm', { loop: true, volume: 0.5 });

// Input
const inputManager = game.make('input');
inputManager.on('pointerdown', (event) => { /* ... */ });
```

---
