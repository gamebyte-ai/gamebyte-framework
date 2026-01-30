# GameByte Core API for AI Agents

> **Load this first** - Essential API knowledge for rapid game prototyping (~2000 tokens)

<!-- keywords: core, api, essential, quick-start, initialization, agent, ai -->

---

## Table of Contents

1. [Initialization Patterns](#initialization-patterns)
2. [Core Services](#core-services)
3. [Reactive State](#reactive-state)
4. [Common Patterns](#common-patterns)
5. [Mobile-First Defaults](#mobile-first-defaults)
6. [Anti-Patterns](#anti-patterns)

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

## Reactive State

Vue/Svelte-inspired reactive state management for automatic UI updates.

### Basic Usage

```typescript
import { createState } from 'gamebyte-framework';

// Create reactive state
const gameState = createState({
  score: 0,
  health: 100,
  level: 1
});

// Direct property access/modification
gameState.score += 100;
console.log(gameState.score); // 100

// Subscribe to specific property changes
const unsubscribe = gameState.on('score', (newVal, oldVal, key) => {
  updateScoreDisplay(newVal);
});

// Subscribe to any change
gameState.onChange((state) => {
  console.log('State changed:', state);
});

// Later: unsubscribe
unsubscribe();
```

### Batch Updates

```typescript
// Multiple updates with single notification
gameState.batch(state => {
  state.score += 50;
  state.health -= 10;
  state.level++;
});
// Listeners notified once at end, not 3 times
```

### Reset State

```typescript
// Reset to initial values
gameState.reset();
// score: 0, health: 100, level: 1
```

### Computed Values

```typescript
import { createState, computed } from 'gamebyte-framework';

const state = createState({ base: 10, bonus: 5 });
const total = computed(() => state.base + state.bonus);

console.log(total.value); // 15
state.bonus = 10;
console.log(total.value); // 20 (auto-updates)
```

### Helper Functions

```typescript
import { isReactive, resolveValue } from 'gamebyte-framework';

// Check if value is a reactive getter
const maybeReactive = () => gameState.score;
if (isReactive(maybeReactive)) {
  console.log('Is reactive');
}

// Resolve potentially reactive values
const value = resolveValue(maybeReactive); // Returns actual value
```

**When to use:** Game state (score, health, inventory), UI state, settings

---

## Common Patterns

### Scene Creation

```typescript
import { BaseScene } from 'gamebyte-framework';
import * as PIXI from 'pixi.js';

class GameScene extends BaseScene {
  async onEnter() {
    // Scene initialization
    const sprite = PIXI.Sprite.from('player');
    sprite.x = 400;
    sprite.y = 300;
    this.addChild(sprite);
  }

  update(deltaTime: number) {
    // Update logic (60 FPS by default)
  }

  async onExit() {
    // Cleanup
  }
}

// Register and load
const sceneManager = game.make('scene.manager');
sceneManager.register('game', new GameScene());
await sceneManager.load('game');
```

---

### UI Component Usage

**Pre-built Components:**
- `UIButton` - Buttons with gradients, glow, shadows
- `UIPanel` - Panels with borders, backgrounds
- `UIText` - Styled text labels
- `UIProgressBar` - Animated progress bars
- `UIContainer` - Layout containers
- `GameTooltip` - Speech bubble tooltips/popovers with customizable tail
- `ArcheroMenu` - Full-featured bottom navigation (670 lines → 3 lines)

**Example: Button**

```typescript
import { UIButton } from 'gamebyte-framework';

const button = new UIButton({
  text: 'PLAY',
  width: 200,
  height: 60,
  backgroundColor: 0x4CAF50,
  onClick: () => console.log('Play clicked')
});

const renderer = game.make('renderer');
renderer.getStage().addChild(button.getContainer());
```

**Example: ArcheroMenu (Minimal)**

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from 'gamebyte-framework';

const menu = new ArcheroMenu({
  sections: [
    { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
    { name: 'Play', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
    { name: 'Stats', icon: '📊', iconColor: ARCHERO_COLORS.green }
  ],
  activeSection: 1,
  callbacks: {
    onSectionChange: (index, section) => console.log('Changed to:', section.name)
  }
});

renderer.getStage().addChild(menu.getContainer());
```

**Result:** Production-quality menu in 3 lines

**Example: GameTooltip (Speech Bubble)**

```typescript
import { GameTooltip, GameTooltipColors } from 'gamebyte-framework';

const tooltip = new GameTooltip({
  text: 'Coming Soon',
  tailPosition: 'bottom-left', // 12 positions + 'none'
  colorScheme: GameTooltipColors.CYAN
});

tooltip.setPosition(100, 50);
renderer.getStage().addChild(tooltip.getContainer());
tooltip.show(); // or tooltip.hide(), tooltip.toggle()
```

**Available Color Schemes:** `CYAN`, `YELLOW`, `GREEN`, `RED`, `PURPLE`, `DARK`, `WHITE`

---

### Asset Loading

**Single Asset:**

```typescript
const assetManager = game.make('assets');

const asset = await assetManager.load({
  id: 'player-sprite',
  url: './assets/player.png',
  type: 'texture'
});

const sprite = PIXI.Sprite.from(asset.data);
```

**Batch Loading:**

```typescript
const assets = await assetManager.loadBatch([
  { id: 'player', url: './player.png', type: 'texture' },
  { id: 'enemy', url: './enemy.png', type: 'texture' },
  { id: 'bgm', url: './music.mp3', type: 'audio' }
]);

// Access loaded assets
const playerTexture = assetManager.get('player').data;
```

**Progress Tracking:**

```typescript
assetManager.on('batch:progress', (progress) => {
  console.log(`${progress.progress * 100}% loaded`);
});
```

---

### Audio Playback

```typescript
const audioManager = game.make('audio');

// Background music
await audioManager.playMusic('bgm', {
  loop: true,
  volume: 0.5,
  fadeIn: 1000  // 1 second fade-in
});

// Sound effects
await audioManager.playSFX('jump', {
  volume: 0.8,
  playbackRate: 1.0
});

// 3D spatial audio
await audioManager.playSFX('explosion', {
  position: { x: 10, y: 0, z: 5 },
  rolloffFactor: 1,
  refDistance: 10
});
```

---

### Input Handling

```typescript
const inputManager = game.make('input');

// Mouse/Touch
inputManager.on('pointerdown', (event) => {
  console.log('Click at:', event.global.x, event.global.y);
});

// Keyboard
inputManager.on('keydown', (event) => {
  if (event.key === 'Space') {
    player.jump();
  }
});

// Gesture detection (mobile)
inputManager.on('swipe', (direction) => {
  console.log('Swiped:', direction); // 'left', 'right', 'up', 'down'
});
```

---

### Physics Integration

**2D (Matter.js):**

```typescript
const physicsManager = game.make('physics');

// Create physics body
const body = physicsManager.createBody({
  shape: 'rectangle',
  width: 50,
  height: 50,
  x: 400,
  y: 300,
  options: { restitution: 0.8 }
});

// Collision detection
physicsManager.on('collision:start', (bodyA, bodyB) => {
  console.log('Collision!');
});
```

**3D (Cannon.js):**

```typescript
const physicsBody = physicsManager.createBody({
  shape: 'box',
  size: { x: 1, y: 1, z: 1 },
  position: { x: 0, y: 10, z: 0 },
  mass: 1
});
```

---

## Mobile-First Defaults

GameByte applies these defaults automatically when using `createGame()` or `createMobileGame()`:

### Touch Targets
- **Minimum size:** 44x44px (Apple HIG standard)
- **Tap delay:** Eliminated via `touch-action: manipulation`
- **Gesture support:** Swipe, pinch, long-press detection built-in

### Performance
- **Auto-detection:** Device tier (LOW/MID/HIGH/UNKNOWN)
- **Quality scaling:** Automatic texture/audio quality based on tier
- **Memory management:** Aggressive cache eviction on mobile
- **Battery optimization:** Rendering pauses when backgrounded

### Resolution
- **Pixel ratio:** Auto-detects `window.devicePixelRatio`
- **Base resolution:** 1080x1920 (9:16 portrait) for mobile
- **Scaling:** Maintains aspect ratio, no distortion

### Asset Loading
- **Max concurrent:** 6 parallel loads
- **Retry logic:** 3 attempts with exponential backoff
- **Timeout:** 30 seconds per asset
- **Caching:** Persistent cache with LRU eviction

### Audio
- **Auto-unlock:** iOS audio unlock handled automatically
- **Compression:** Lower bitrate on LOW tier devices
- **Context management:** Single AudioContext, reused across scenes

---

## Anti-Patterns

### ❌ DON'T: Manually register service providers

```typescript
// ❌ Bad - too much boilerplate
const game = GameByte.create();
game.register(new RenderingServiceProvider());
game.register(new SceneServiceProvider());
// ... 7 more providers
await game.boot();
```

```typescript
// ✅ Good - use Quick API
const game = createGame();  // All providers auto-registered
```

---

### ❌ DON'T: Ignore smart defaults

```typescript
// ❌ Bad - fighting the framework
await game.initialize(canvas, '2d', {
  antialias: false,  // Framework detects best value
  resolution: 1,     // Ignores device pixel ratio
  autoDensity: false // Manual DPI handling
});
```

```typescript
// ✅ Good - trust smart defaults
await game.initialize(canvas, '2d');  // Optimal settings applied
```

---

### ❌ DON'T: Create assets without caching

```typescript
// ❌ Bad - no caching, slow
const texture = await PIXI.Assets.load('./player.png');
const sprite = PIXI.Sprite.from(texture);
```

```typescript
// ✅ Good - cached, fast, progress tracking
const assetManager = game.make('assets');
await assetManager.load({ id: 'player', url: './player.png', type: 'texture' });
const sprite = PIXI.Sprite.from(assetManager.get('player').data);
```

---

### ❌ DON'T: Build UI from scratch

```typescript
// ❌ Bad - manual UI code instead of using components
const button = new PIXI.Container();
const bg = new PIXI.Graphics();
bg.roundRect(0, 0, 200, 60, 8);
bg.fill({ color: 0x4CAF50 });
// ... many more lines for hover, click, text, etc.
```

```typescript
// ✅ Good - 3 lines with ArcheroMenu or UIButton
import { UIButton } from 'gamebyte-framework';
const button = new UIButton({ text: 'PLAY', width: 200, height: 60 });
```

---

### ❌ DON'T: Hardcode values for mobile

```typescript
// ❌ Bad - fixed sizes, breaks on different devices
button.width = 200;
button.height = 60;
```

```typescript
// ✅ Good - responsive scaling
import { ResponsiveScaleCalculator } from 'gamebyte-framework';
const calculator = new ResponsiveScaleCalculator({ baseWidth: 1080, baseHeight: 1920 });
button.width = calculator.scale(200);
button.height = calculator.scale(60);
```

---

### ❌ DON'T: Skip lifecycle hooks

```typescript
// ❌ Bad - no cleanup
class GameScene extends BaseScene {
  async onEnter() {
    this.interval = setInterval(() => this.update(), 16);
  }
  // Missing onExit - memory leak!
}
```

```typescript
// ✅ Good - proper cleanup
class GameScene extends BaseScene {
  async onEnter() {
    this.interval = setInterval(() => this.update(), 16);
  }

  async onExit() {
    clearInterval(this.interval);  // Cleanup
  }
}
```

---

## Next Steps

**Tier 2 Docs:** When you need advanced features:
- Search: `grep -r "keyword" docs/guides/`
- Topics: physics, audio-spatial, ui-responsive, asset-bundles, performance-optimization

**Tier 3 Examples:** Working code patterns:
- `examples/platformer/` - Physics + player controller
- `examples/puzzle/` - Match-3 game mechanics
- `examples/shooter/` - Top-down 2D shooter

**Quick Reference:** See `QUICK_REFERENCE.md` for command cheatsheet

---

*Last updated: 2026-01-30*
*Target audience: AI agents, autonomous game builders*
*Estimated reading: 6-8 minutes*
