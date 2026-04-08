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
7. [v1.4 Game Primitives](#v14-game-primitives)
8. [v1.5 HybridGame (3D + 2D HUD)](#v15-hybridgame-3d--2d-hud)
9. [v1.7 Boilerplate](#v17-boilerplate)
10. [v1.7 Genre Templates](#v17-genre-templates)

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

## v1.4 Game Primitives

New in v1.4: a set of ready-made game building blocks for entities, pooling, configuration, effects, waves, grids, gestures, save data, and economy.

---

### GameEntity

Base class for all game objects with health, collision, velocity, and lifecycle events.

```typescript
import { GameEntity } from 'gamebyte-framework';

const player = new GameEntity({
  x: 100, y: 200,
  health: 100,
  collisionRadius: 16,
  tags: ['player']
});
player.on('died', () => console.log('Game over'));
player.update(dt); // call each frame
scene.addChild(player.getContainer());

// Collision
if (player.collidesWith(enemy)) enemy.damage(25);
```

**Subclassing:**

```typescript
class Enemy extends GameEntity {
  constructor(x: number, y: number) {
    super({ x, y, health: 30, collisionRadius: 12, tags: ['enemy'] });
  }
  update(dt: number) {
    this.vx = -50; // move left
    super.update(dt);
  }
}
```

**Properties:** `x`, `y`, `vx`, `vy`, `speed`, `health`, `maxHealth`, `isAlive`, `active`, `tags`, `collisionRadius`, `collisionRect`

**Methods:** `update(dt)`, `damage(amount)`, `heal(amount)`, `collidesWith(other)`, `distanceTo(other)`, `getContainer()`, `destroy()`

**Events:** `'damaged'`, `'healed'`, `'died'`, `'destroyed'`

---

### ObjectPool\<T\>

Generic object recycling to avoid garbage collection spikes.

```typescript
import { ObjectPool } from 'gamebyte-framework';

const bulletPool = new ObjectPool({
  create: () => ({ x: 0, y: 0, active: false }),
  reset: (b) => { b.x = 0; b.y = 0; b.active = false; },
  initialSize: 20,
  maxSize: 100,
});

const bullet = bulletPool.acquire();
bullet.x = player.x;
bulletPool.release(bullet);
console.log(bulletPool.activeCount, bulletPool.availableCount);
```

**Constructor options:** `create` (factory fn), `reset` (reset fn), `initialSize`, `maxSize`

**Methods:** `acquire()`, `release(obj)`, `releaseAll()`, `clear()`

**Properties:** `activeCount`, `availableCount`, `totalCreated`

---

### GameConfigStore\<T\>

Typed game configuration with difficulty scaling and change events.

```typescript
import { createGameConfig } from 'gamebyte-framework';

const config = createGameConfig({
  playerSpeed: 200, enemySpeed: 80, spawnRate: 2.0, maxEnemies: 30
});

config.get('playerSpeed'); // 200
config.set('playerSpeed', 250);
config.on('changed', (key, newVal, oldVal) => { /* update UI */ });

// Difficulty: each level multiplies default by factor^level
config.applyDifficulty(3, { enemySpeed: 1.1, spawnRate: 0.95 });
config.reset(); // back to defaults
```

**Methods:** `get(key)`, `set(key, value)`, `applyDifficulty(level, factors)`, `reset()`, `getAll()`

**Events:** `'changed'`

---

### screenShake()

Camera/container shake effect for impacts and explosions.

```typescript
import { screenShake } from 'gamebyte-framework';

// Simple usage
screenShake(gameContainer, 8, 300);

// Advanced usage
screenShake({
  target: gameContainer,
  intensity: 12,
  duration: 500,
  decay: 'exponential',
  direction: 'horizontal'
});
```

**Simple signature:** `screenShake(target, intensity, duration)`

**Advanced options:** `target`, `intensity`, `duration`, `decay` (`'linear'` | `'exponential'`), `direction` (`'both'` | `'horizontal'` | `'vertical'`)

---

### FloatingText2D

Animated damage numbers, score popups, and coin indicators.

```typescript
import { FloatingText2D } from 'gamebyte-framework';

FloatingText2D.damage(container, enemy.x, enemy.y, 25);
FloatingText2D.score(container, x, y, 100);
FloatingText2D.coin(container, x, y, 5);

// Custom spawn
FloatingText2D.spawn({
  text: 'CRITICAL!', x: 200, y: 300,
  parent: container, style: 'damage',
  duration: 1200, distance: 80
});
```

**Static methods:** `damage(parent, x, y, amount)`, `score(parent, x, y, amount)`, `coin(parent, x, y, amount)`, `heal(parent, x, y, amount)`, `spawn(options)`

**Presets:** `'damage'` (red), `'heal'` (green), `'score'` (yellow), `'coin'` (orange)

**Directions:** `'up'`, `'down'`, `'left'`, `'right'`

---

### WaveManager

Wave/spawn system for tower defense, roguelike, and survival games.

```typescript
import { WaveManager } from 'gamebyte-framework';

const wm = new WaveManager({
  waves: [
    { enemies: [{ type: 'zombie', count: 5, spawnInterval: 800 }], intermission: 3000 },
    { enemies: [{ type: 'zombie', count: 3 }, { type: 'boss', count: 1, delay: 2000 }], isBoss: true }
  ],
  onSpawn: (type, waveIdx) => spawnEnemy(type),
  onWaveStart: (idx) => showBanner(`Wave ${idx + 1}`),
  onAllWavesComplete: () => showVictory(),
});
wm.start();
// game loop: wm.update(deltaMs);
```

**Methods:** `start()`, `pause()`, `resume()`, `skipToWave(n)`, `update(dt)`, `destroy()`

**Properties:** `currentWave`, `totalWaves`, `isActive`, `isIntermission`, `intermissionTimeLeft`

---

### Grid\<T\> & HexGrid\<T\>

2D grid and hex grid data structures with pixel conversion.

```typescript
import { Grid, HexGrid } from 'gamebyte-framework';

const grid = new Grid({ rows: 8, cols: 8, cellSize: 64 });
grid.setCell(0, 0, 'player');
grid.getNeighbors(2, 3); // [{row, col, value}, ...]
const px = grid.cellToPixel(2, 3); // {x, y} center of cell
const cell = grid.pixelToCell(150, 200); // {row, col} | null

const hex = new HexGrid({ rows: 10, cols: 10, cellSize: 48 });
hex.hexDistance(0, 0, 3, 2); // hex distance
hex.getRing(5, 5, 2); // cells at distance 2
```

**Grid methods:** `setCell(row, col, value)`, `getCell(row, col)`, `getNeighbors(row, col)`, `cellToPixel(row, col)`, `pixelToCell(x, y)`, `forEach(callback)`, `clear()`

**HexGrid methods:** all Grid methods + `hexDistance(r1, c1, r2, c2)`, `getRing(row, col, radius)`, `getArea(row, col, radius)`

---

### GestureDetector

Touch gesture recognition for mobile games.

```typescript
import { GestureDetector } from 'gamebyte-framework';

const gesture = new GestureDetector({ target: canvas, swipeThreshold: 50 });
gesture.on('tap', (x, y) => shoot(x, y));
gesture.on('swipe', (dir, velocity) => movePlayer(dir));
gesture.on('long-press', (x, y) => openMenu(x, y));
gesture.on('drag-move', (x, y, dx, dy) => panCamera(dx, dy));
gesture.on('pinch', (scale, cx, cy) => zoom(scale));
gesture.destroy(); // cleanup
```

**Constructor options:** `target` (HTMLElement), `swipeThreshold`, `longPressDelay`, `doubleTapDelay`

**Events:** `'tap'`, `'double-tap'`, `'long-press'`, `'swipe'`, `'drag-start'`, `'drag-move'`, `'drag-end'`, `'pinch'`

---

### SaveSystem\<T\>

Persistent save with versioned migrations and auto-save.

```typescript
import { SaveSystem } from 'gamebyte-framework';

const save = new SaveSystem({
  key: 'my-game',
  version: 2,
  defaults: { score: 0, level: 1, inventory: [] },
  migrations: {
    1: (old) => ({ ...old, inventory: old.items ?? [] }) // v1 -> v2
  }
});

const data = save.load();
save.set('score', 500); // auto-saves
save.get('level'); // 1
save.reset(); // clear save
```

**Constructor options:** `key` (localStorage key), `version`, `defaults`, `migrations`

**Methods:** `load()`, `save()`, `get(key)`, `set(key, value)`, `reset()`, `export()`, `import(data)`

---

### EconomyManager

Currency management and shop system with price scaling.

```typescript
import { EconomyManager } from 'gamebyte-framework';

const economy = new EconomyManager([
  { id: 'gold', name: 'Gold', initial: 100 },
  { id: 'gems', name: 'Gems', initial: 0, max: 9999 }
]);

economy.add('gold', 50);
economy.spend('gold', 30); // true
economy.canAfford('gold', 200); // false
economy.on('insufficient-funds', (curr, needed, have) => showWarning());

// Shop items
economy.registerItems([
  { id: 'sword', name: 'Iron Sword', cost: { currency: 'gold', amount: 50 }, maxPurchases: 1 }
]);
economy.purchase('sword'); // true, deducts gold

// Exponential upgrade cost
EconomyManager.getUpgradeCost(100, 3, 1.15); // 100 * 1.15^3 = 152
```

**Constructor params:** array of `{ id, name, initial, max? }`

**Methods:** `add(currency, amount)`, `spend(currency, amount)`, `canAfford(currency, amount)`, `getBalance(currency)`, `registerItems(items)`, `purchase(itemId)`

**Static:** `EconomyManager.getUpgradeCost(baseCost, level, factor)`

**Events:** `'balance-changed'`, `'insufficient-funds'`, `'item-purchased'`

---

## v1.5 HybridGame (3D + 2D HUD)

New in v1.5: one-call setup for 3D world + 2D HUD overlay games. Wraps GameByte hybrid mode, GameCameraManager, and RaycastInputManager into a single ergonomic API.

---

### HybridGame

Creates a fully configured 3D game with a 2D HUD overlay in a single async call.

```typescript
import { HybridGame, HybridHUD } from '@gamebyte/framework/hybrid';

// One call creates everything: 3D world + 2D HUD + camera + input
const game = await HybridGame.create({
  container: '#game',
  width: 800,
  height: 600,
  cameraMode: 'isometric',
  enableRaycast: true,
  backgroundColor: 0x1a1a2e,
});

// 3D World
game.addDefaultLighting();
game.addToWorld(myMesh);

// 2D HUD overlay
const hud = new HybridHUD(game.hud, 800, 600);
hud.addTopBar({ score: { initial: 0 }, lives: { initial: 3 } });
hud.addBottomBar({ buttons: [
  { id: 'attack', label: 'Attack' },
  { id: 'skill', label: 'Skill' },
]});

// Update loop
game.onUpdate((dt) => {
  // game logic here
});

// Update HUD values
hud.setValue('score', 1500);

// Camera control
game.followTarget(player);
game.moveCameraTo(10, 0, 10);

// 3D interaction
const obj = new WorldObject3D();
obj.on('pointerdown', (e, isHit) => {
  if (isHit) console.log('Clicked!');
});
game.makeInteractive(obj);
```

**Properties:**
- `world` — THREE.Scene, add 3D meshes/lights/groups here
- `hud` — PIXI.Container (stage), add 2D UI elements here
- `camera` — GameCameraManager controlling the 3D view
- `input` — RaycastInputManager for 3D object interaction
- `threeRenderer` — The underlying Three.js WebGLRenderer
- `app` — The underlying GameByte instance
- `width` / `height` — Viewport dimensions

**HybridGameConfig options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `string \| HTMLElement` | required | Container element or CSS selector |
| `width` | `number` | `800` | Canvas width |
| `height` | `number` | `600` | Canvas height |
| `backgroundColor` | `number` | `0x1a1a2e` | Background color for the 3D scene |
| `cameraMode` | `'orbital' \| 'topdown' \| 'isometric' \| 'front'` | `'orbital'` | Camera preset |
| `orthoSize` | `number` | `10` | World units visible vertically (ortho cameras) |
| `enableRaycast` | `boolean` | `true` | Enable 3D raycasting input |
| `shadowQuality` | `'low' \| 'medium' \| 'high'` | `'medium'` | Shadow quality |
| `autoStart` | `boolean` | `true` | Auto-start the render loop |

**Methods:**
- `onUpdate(fn: (dt: number) => void): void` — Register a per-frame callback
- `addToWorld(object: Object3D): void` — Add a Three.js object to the world scene
- `removeFromWorld(object: Object3D): void` — Remove a Three.js object from the world scene
- `addToHUD(element: DisplayObject): void` — Add a Pixi.js display object to the HUD
- `removeFromHUD(element: DisplayObject): void` — Remove a Pixi.js display object from the HUD
- `makeInteractive(object: WorldObject3D): void` — Register a WorldObject3D for raycasting
- `followTarget(target: {x, y, z}, easing?: number): void` — Smoothly follow a world position
- `moveCameraTo(x, y, z): void` — Instantly move camera focus to a world position
- `addDefaultLighting(): void` — Add ambient + directional lights (sensible defaults)
- `destroy(): void` — Destroy the game and release all resources

**Events:**
- `'update'` — `(dt: number)` Fired every frame with delta time in seconds
- `'ready'` — `()` Fired once after `create()` resolves

**When to use:** 3D games with 2D UI overlays, isometric games, hybrid rendering

---

### HybridHUD

Pre-built 2D HUD configurations for hybrid 3D+2D games. Renders on top of the 3D scene using the Pixi.js overlay layer.

```typescript
import { HybridHUD } from '@gamebyte/framework/hybrid';

const hud = new HybridHUD(game.hud, game.width, game.height);

// Top bar with score, lives, coins, timer
hud.addTopBar({
  score: { initial: 0 },
  lives: { initial: 3, max: 5 },
  coins: { initial: 0 },
  timer: { seconds: 60, countDown: true },
});

// Bottom bar with action buttons
hud.addBottomBar({
  buttons: [
    { id: 'pause', label: 'Pause', onClick: () => pauseGame() },
    { id: 'attack', label: 'Attack' },
  ],
});

// Update values at runtime
hud.setValue('score', 1500);
hud.setValue('lives', 2);

// Show a temporary center message
hud.showMessage('WAVE 1', { duration: 2000 });
hud.showMessage('GAME OVER', { fontSize: 64, color: 0xff0000 });

// Toggle visibility
hud.setVisible(false);

// Listen for button clicks
hud.on('button:click', (id) => console.log(id + ' clicked'));

// Cleanup
hud.destroy();
```

**Constructor:** `new HybridHUD(hudContainer: Container, width: number, height: number)`

**TopBarConfig fields:**

| Field | Type | Description |
|-------|------|-------------|
| `score` | `{ label?: string; initial?: number }` | Score display |
| `lives` | `{ label?: string; initial?: number; max?: number }` | Lives/health display |
| `coins` | `{ label?: string; initial?: number; icon?: string }` | Currency display |
| `timer` | `{ label?: string; seconds?: number; countDown?: boolean }` | Timer display |
| `custom` | `Array<{ key: string; label: string; value: string \| number }>` | Arbitrary text fields |

**BottomBarConfig:** `{ buttons: Array<{ id: string; label: string; icon?: string; onClick?: () => void }> }`

**Methods:**
- `addTopBar(config: TopBarConfig): void` — Add a semi-transparent status bar at the top
- `addBottomBar(config: BottomBarConfig): void` — Add a button bar anchored to the bottom
- `setValue(key: string, value: string | number): void` — Update any labelled value in the top bar
- `showMessage(text: string, config?: { duration?: number; fontSize?: number; color?: number }): void` — Display a centered message that auto-removes
- `setVisible(visible: boolean): void` — Show or hide the entire HUD
- `destroy(): void` — Remove all HUD elements and release resources

**Events:**
- `'button:click'` — `(id: string)` Emitted when a bottom bar button is clicked

---

### WorldObject3D

Base class for interactive 3D objects. Event-emitting controller that composes with Three.js meshes/groups.

```typescript
import { WorldObject3D } from '@gamebyte/framework/three/interaction';

const obj = new WorldObject3D();
obj.on('pointerdown', (event, isRaycasted) => {
  if (isRaycasted) console.log('directly hit!');
});
obj.on('pointerenter', () => console.log('hover'));
obj.on('pointerleave', () => console.log('unhover'));

game.makeInteractive(obj);
```

**Properties:** `interactive: boolean` (default: true), `isHovered: boolean` (read-only)

**Events:** `'pointerdown'`, `'pointermove'`, `'pointerup'` — `(event, isRaycasted: boolean)`, `'pointerenter'`, `'pointerleave'` — `()`

**Methods:** `destroy(): void`

---

## v1.7 Boilerplate

New in v1.7: pre-built game scaffolding components. Build a complete mobile game (Hub -> Game -> Result) from a single config object.

Import path: `@gamebyte/framework/boilerplate`

---

### QuickGameSetup

The single most important boilerplate class. Assembles the standard mobile game flow (Hub -> Game -> Result -> Hub) from one config object. Agents write ZERO screen-management code.

```typescript
import { QuickGameSetup } from '@gamebyte/framework/boilerplate';

const setup = new QuickGameSetup(stage, {
  title: 'My Puzzle Game',
  width: 540,
  height: 960,
  hub: {
    resources: [{ type: 'coins', value: 500, showAddButton: true }],
    tabs: [
      { id: 'play', label: 'Play', highlighted: true },
      { id: 'shop', label: 'Shop' },
    ],
    defaultTab: 'play',
  },
  game: {
    showScore: true,
    showPause: true,
    onCreateGame: (gameContainer) => {
      // Place your game objects here
      const grid = new Grid({ rows: 8, cols: 8, cellSize: 56 });
      gameContainer.addChild(grid.view);
    },
    onUpdate: (dt) => {
      // Your game loop runs here each frame
      gameLoop(dt);
    },
  },
  result: {
    actions: [
      { text: 'Retry', event: 'retry', style: 'primary' },
      { text: 'Home', event: 'home', style: 'secondary' },
    ],
  },
  settings: { sound: true, music: true, vibration: true },
  onPlay: () => resetGameState(),
  onRetry: () => resetGameState(),
  onHome: () => {},
});

setup.start(); // Shows hub screen, flow is automatic from here

// End the game when the player wins/loses:
setup.endGame({ score: 1500, stars: 3, type: 'victory' });
```

**Constructor:** `new QuickGameSetup(container: any, config: QuickGameSetupConfig)`

**QuickGameSetupConfig:**

| Option | Type | Description |
|--------|------|-------------|
| `title` | `string` | Game title on hub screen |
| `width` | `number` | Canvas width in pixels |
| `height` | `number` | Canvas height in pixels |
| `hub.resources` | `Array<{type, value, showAddButton?}>` | Resource bar items |
| `hub.tabs` | `Array<{id, label, type?, highlighted?}>` | Bottom nav tabs |
| `hub.defaultTab` | `string` | Default selected tab |
| `hub.tabContents` | `Record<string, () => any>` | Custom content per tab |
| `game.showScore` | `boolean` | Show score in HUD |
| `game.showTimer` | `boolean` | Show timer in HUD |
| `game.showLives` | `boolean` | Show lives in HUD |
| `game.showPause` | `boolean` | Show pause button |
| `game.showProgress` | `boolean` | Show progress bar |
| `game.onCreateGame` | `(container) => void` | Called once -- place game objects |
| `game.onUpdate` | `(dt: number) => void` | Called each frame |
| `game.onGameEnd` | `() => {score, stars?, rewards?}` | Returns result data |
| `result.actions` | `Array<{text, event, style?}>` | Result screen buttons |
| `settings` | `{sound?, music?, vibration?}` | Initial settings |
| `onPlay` | `() => void` | Called when Play pressed |
| `onRetry` | `() => void` | Called when Retry pressed |
| `onHome` | `() => void` | Called when Home pressed |

**Methods:**
- `start(): void` -- Show hub screen, begin the flow
- `trigger(event: string, data?: any): void` -- Fire a flow event ('play', 'retry', 'home', 'game-over')
- `endGame(data?: {score?, stars?, type?}): void` -- End game, transition to result screen
- `showSettings(): void` -- Overlay the settings panel
- `destroy(): void` -- Cleanup everything

**Properties:**
- `gameContainer: any` -- Container for game objects (available after game screen is created)
- `settings: SettingsPanel` -- Direct access to the settings panel
- `currentScreen: string` -- Currently visible screen ('hub' | 'game' | 'result')

**Events:**
- `'screen-changed'` -- `(screen: string)` Fired on navigation
- `'game-start'` -- `()` Fired when game screen is entered
- `'game-end'` -- `(data: any)` Fired when endGame() is called
- `'setting-changed'` -- `(key: string, value: boolean)` Fired on settings toggle

---

### GameFlow

Event-to-screen flow mapping. Not a full state machine -- just maps named events to screen transitions.

```typescript
import { GameFlow } from '@gamebyte/framework/boilerplate';

const flow = new GameFlow(container, {
  start: 'menu',
  screens: {
    menu: { create: () => createMenuScreen() },
    game: { create: () => createGameScreen() },
    result: { create: () => createResultScreen() },
  },
  flow: {
    play: 'game',
    retry: 'game',
    home: 'menu',
    'game-over': 'result',
  },
});

flow.start();                  // Show the start screen
flow.trigger('play');          // Navigate to 'game'
flow.goTo('result', { score: 100 }); // Direct navigation with data
flow.current;                  // Current screen name
flow.getScreen('game');        // Get screen instance (null if not yet created)
flow.destroy();                // Cleanup all screens
```

**Methods:** `start()`, `trigger(event, data?)`, `goTo(screenName, data?)`, `getScreen(name)`, `destroy()`

**Properties:** `current: string`

**Events:** `'navigate'` -- `(from: string, to: string)`

---

### SettingsPanel

Modal with boolean toggles for sound/music/vibration. Self-contained -- no external UI dependencies.

```typescript
import { SettingsPanel } from '@gamebyte/framework/boilerplate';

const settings = new SettingsPanel({
  sound: true,
  music: true,
  vibration: true,
  custom: [{ key: 'notifications', label: 'Notifications', value: true }],
});

parent.addChild(settings.getContainer());
settings.show();
settings.hide();
settings.get('sound');         // true
settings.set('sound', false);  // Emits 'changed'
settings.getAll();             // { sound: false, music: true, vibration: true, notifications: true }

settings.on('changed', (key, value) => {
  if (key === 'sound') toggleSoundEffects(value);
});
settings.on('close', () => {});
```

**Methods:** `show()`, `hide()`, `get(key)`, `set(key, value)`, `getAll()`, `getContainer()`, `destroy()`

**Events:** `'changed'` -- `(key: string, value: boolean)`, `'close'` -- `()`

---

### TutorialOverlay

Step-through tutorial with dim overlay and optional spotlight. Tap anywhere to advance.

```typescript
import { TutorialOverlay } from '@gamebyte/framework/boilerplate';

const tutorial = new TutorialOverlay([
  { text: 'Tap here to start', x: 270, y: 480, spotlight: { x: 270, y: 480, radius: 60 } },
  { text: 'Swipe to move', x: 270, y: 300, position: 'below' },
  { text: 'Collect all stars!', x: 270, y: 200 },
], { skipButton: true, dimAlpha: 0.7 });

parent.addChild(tutorial.getContainer());
tutorial.start();              // Begin at step 0
tutorial.next();               // Advance manually (also advances on tap)

tutorial.on('step', (index) => console.log('Step', index));
tutorial.on('complete', () => console.log('Tutorial done'));
tutorial.on('skip', () => console.log('Skipped'));
```

**Constructor:** `new TutorialOverlay(steps: TutorialStep[], options?: TutorialOptions)`

**TutorialStep:** `{ text, x, y, spotlight?: {x, y, radius}, position?: 'above' | 'below' }`

**TutorialOptions:** `{ skipButton?: boolean, dimAlpha?: number }`

**Methods:** `start()`, `next()`, `skip()`, `getContainer()`, `destroy()`

**Properties:** `currentStep: number`

**Events:** `'step'` -- `(index: number)`, `'complete'` -- `()`, `'skip'` -- `()`

---

### Toast

Auto-dismissing notification overlay. Static API -- no instance needed.

```typescript
import { Toast } from '@gamebyte/framework/boilerplate';

// Simple string
Toast.show(parent, 'Level completed!');

// With options
Toast.show(parent, {
  text: 'Connection lost',
  type: 'error',      // 'info' | 'success' | 'warning' | 'error'
  duration: 3000,     // ms (default: 2000)
  y: 80,              // vertical position (default: 80)
});
```

**Static method:** `Toast.show(parent: any, config: ToastConfig | string): void`

**ToastConfig:** `{ text, duration?, type?, y? }`

**Type colors:** `info` (white), `success` (green), `warning` (yellow), `error` (red)

---

### RewardFly

Coin/gem fly-to-target animation with bezier arc and stagger. Static API.

```typescript
import { RewardFly } from '@gamebyte/framework/boilerplate';

RewardFly.play({
  parent: stage,
  from: { x: 270, y: 400 },     // Source position (e.g., defeated enemy)
  to: { x: 50, y: 30 },         // Target position (e.g., coin counter)
  count: 8,                       // Number of particles (default: 8)
  duration: 600,                  // Per-particle duration ms (default: 600)
  stagger: 50,                    // Delay between particles ms (default: 50)
  size: 16,                       // Particle radius (default: 16)
  color: 0xffd700,                // Particle color (default: gold)
  onEachArrive: () => updateCoinCounter(),
  onComplete: () => console.log('All arrived'),
});
```

**Static method:** `RewardFly.play(config: RewardFlyConfig): void`

**RewardFlyConfig:** `{ parent, from: {x,y}, to: {x,y}, count?, duration?, stagger?, size?, color?, onEachArrive?, onComplete? }`

---

## v1.7 Genre Templates

New in v1.7: pure-logic game systems for common genres. No rendering dependencies -- they emit events for the game to render. Each genre has its own sub-path import.

---

### Puzzle (`@gamebyte/framework/genre/puzzle`)

#### MatchDetector

Grid match finding for match-3 and sorting games. Supports row-3, col-3, row-col-3, adjacent-group (BFS flood fill), and custom matchers.

```typescript
import { MatchDetector } from '@gamebyte/framework/genre/puzzle';

const detector = new MatchDetector({ rule: 'row-col-3' });
// or: { rule: 'adjacent-group', minGroupSize: 3 }
// or: { rule: 'custom', customMatcher: (grid, rows, cols) => [...] }

const matches = detector.findMatches(grid, rows, cols);
// Returns: Array<{ cells: [{row, col}, ...], value: any, size: number }>

const willMatch = detector.wouldMatch(grid, r1, c1, r2, c2);
// Checks if swapping two cells produces at least one match
```

**Constructor:** `new MatchDetector(config: { rule: MatchRule, minGroupSize?, customMatcher? })`

**MatchRule:** `'row-3' | 'col-3' | 'row-col-3' | 'adjacent-group' | 'custom'`

**Methods:** `findMatches(grid, rows, cols): MatchResult[]`, `wouldMatch(grid, r1, c1, r2, c2): boolean`

#### BoardGravity

Drops pieces downward after matches are cleared. Static API, mutates grid in-place.

```typescript
import { BoardGravity } from '@gamebyte/framework/genre/puzzle';

const result = BoardGravity.apply(grid, rows, cols, null);
// result.moves: [{ fromRow, fromCol, toRow, toCol }, ...]
// result.spawns: [{ row, col }, ...]  -- empty top cells needing new pieces
```

**Static method:** `BoardGravity.apply(grid, rows, cols, emptyValue?): GravityResult`

---

### Survivors (`@gamebyte/framework/genre/survivors`)

#### AutoAttack

Manages auto-targeting and fire rate. Emits events when firing.

```typescript
import { AutoAttack } from '@gamebyte/framework/genre/survivors';

const attack = new AutoAttack({
  range: 200,
  fireRate: 3,           // Attacks per second
  damage: 25,
  targeting: 'nearest',  // 'nearest' | 'lowest-hp' | 'random'
});

// Call each frame
attack.update(dt, player, enemies);

attack.on('fire', (target, damage) => {
  target.health -= damage;
  showBulletEffect(player, target);
});
attack.on('target-changed', (target) => updateTargetIndicator(target));

// Reconfigure at runtime (e.g., after upgrade)
attack.configure({ damage: 40, fireRate: 5 });
```

**Methods:** `update(dt, owner: {x,y}, enemies: {x,y,health?}[])`, `configure(partial)`

**Properties:** `target: any | null`

**Events:** `'fire'` -- `(target, damage)`, `'target-changed'` -- `(target | null)`

#### UpgradeSystem

Weighted random upgrade choices. Tracks per-upgrade levels, filters maxed-out.

```typescript
import { UpgradeSystem } from '@gamebyte/framework/genre/survivors';

const upgrades = new UpgradeSystem([
  { id: 'atk', name: 'Attack+', description: '+10 damage', maxLevel: 5, effect: { damage: 10 }, weight: 1 },
  { id: 'spd', name: 'Speed+', description: '+20 speed', maxLevel: 3, effect: { speed: 20 }, weight: 2 },
]);

const choices = upgrades.getChoices(3);   // 3 weighted random choices (no maxed-out)
upgrades.choose('atk');                    // Apply upgrade, emits 'upgrade-chosen'
upgrades.getLevel('atk');                  // 1
upgrades.getAllLevels();                   // { atk: 1, spd: 0 }
upgrades.reset();                          // Reset all to level 0
```

**Methods:** `getChoices(count?)`, `choose(id)`, `getLevel(id)`, `getAllLevels()`, `reset()`

**Events:** `'upgrade-chosen'` -- `(upgrade: UpgradeDef, newLevel: number)`

#### XPSystem

XP accumulation with configurable level curve.

```typescript
import { XPSystem } from '@gamebyte/framework/genre/survivors';

const xp = new XPSystem({
  xpCurve: (level) => 100 * level,  // XP needed per level (default)
  startLevel: 1,
});

xp.addXP(150);           // May trigger multiple level-ups
xp.level;                // Current level
xp.currentXP;            // XP toward next level
xp.xpToNextLevel;        // XP needed for next level
xp.progress;             // 0-1 progress toward next level

xp.on('level-up', (newLevel, totalXP) => showUpgradeChoices());
xp.on('xp-gained', (amount, current, needed) => updateXPBar());
xp.reset();
```

**Methods:** `addXP(amount)`, `reset()`

**Properties:** `level`, `currentXP`, `xpToNextLevel`, `progress` (0-1)

**Events:** `'level-up'` -- `(newLevel, totalXP)`, `'xp-gained'` -- `(amount, current, needed)`

---

### Idle (`@gamebyte/framework/genre/idle`)

#### IdleEngine

Core idle/tycoon engine. Generators produce resources per second with exponential cost scaling. Supports offline earnings and save/load.

```typescript
import { IdleEngine } from '@gamebyte/framework/genre/idle';

const engine = new IdleEngine({
  resources: ['gold', 'gems'],
  initialAmounts: { gold: 100 },
  generators: [
    { id: 'miner', name: 'Gold Miner', baseCost: 10, baseProduction: 1, costMultiplier: 1.15 },
    { id: 'alchemist', name: 'Alchemist', baseCost: 100, baseProduction: 5, costMultiplier: 1.2 },
  ],
});

// Each frame
engine.update(dt);

// Buy generators
if (engine.canBuy('miner')) engine.buy('miner');
engine.getCost('miner');              // Next purchase cost
engine.getOwned('miner');             // How many owned
engine.getProductionRate('gold');     // Total gold/sec

// Resources
engine.getResource('gold');
engine.addResource('gold', 50);

// Offline earnings
const earnings = engine.calculateOfflineEarnings(3600); // 1 hour
engine.applyOfflineEarnings(3600);

// Save/Load
const state = engine.getState();
engine.loadState(state);
engine.reset();

engine.on('tick', (production) => updateUI(production));
engine.on('purchase', (genId, count) => playBuySound());
engine.on('resource-changed', (resId, amount) => updateDisplay(resId, amount));
```

**Methods:** `update(dt)`, `buy(genId)`, `canBuy(genId)`, `getCost(genId)`, `getOwned(genId)`, `getResource(id)`, `addResource(id, amount)`, `getProductionRate(resId)`, `calculateOfflineEarnings(seconds)`, `applyOfflineEarnings(seconds)`, `getState()`, `loadState(state)`, `reset()`

**Events:** `'tick'` -- `(production)`, `'purchase'` -- `(genId, count)`, `'resource-changed'` -- `(resId, amount)`

#### PrestigeSystem

Soft-reset mechanic: reset progress for a permanent multiplier.

```typescript
import { PrestigeSystem } from '@gamebyte/framework/genre/idle';

const prestige = new PrestigeSystem({
  threshold: 1000,         // Minimum gold to prestige
  resource: 'gold',
  maxMultiplier: 1000,
  // Default formula: 1 + log10(amount / threshold)
});

prestige.canPrestige(5000);              // true
prestige.getMultiplierPreview(5000);     // Preview multiplier
const mult = prestige.prestige(5000);    // Execute prestige, returns new multiplier
prestige.multiplier;                      // Current permanent multiplier
prestige.totalPrestiges;                  // Total prestige count

// Save/Load
prestige.getState();    // { multiplier, count }
prestige.loadState(state);

prestige.on('prestige', (newMultiplier, totalPrestiges) => {
  engine.reset();
  showPrestigeScreen(newMultiplier);
});
```

**Methods:** `canPrestige(amount)`, `getMultiplierPreview(amount)`, `prestige(amount)`, `getState()`, `loadState(state)`

**Properties:** `multiplier`, `totalPrestiges`

**Events:** `'prestige'` -- `(newMultiplier, totalPrestiges)`

---

### Tower Defense (`@gamebyte/framework/genre/td`)

#### PathFollower

Entity that follows a waypoint path at configurable speed. Smooth interpolation between waypoints.

```typescript
import { PathFollower } from '@gamebyte/framework/genre/td';

const path = [
  { x: 0, y: 300 },
  { x: 200, y: 300 },
  { x: 200, y: 100 },
  { x: 400, y: 100 },
];

const enemy = new PathFollower(path, 100); // speed: 100 px/sec

// Each frame
const pos = enemy.update(dt);
sprite.x = pos.x;
sprite.y = pos.y;

enemy.x;  enemy.y;               // Current position
enemy.progress;                    // 0-1 along entire path
enemy.isComplete;                  // Reached end?

enemy.setSpeed(150);               // Change speed
enemy.pause();  enemy.resume();    // Pause/resume
enemy.reset();                     // Return to start

enemy.on('waypoint-reached', (index) => {});
enemy.on('path-complete', () => dealDamageToBase());
```

**Constructor:** `new PathFollower(path: Waypoint[], speed?: number)`

**Methods:** `update(dt): {x, y}`, `setSpeed(speed)`, `pause()`, `resume()`, `reset()`

**Properties:** `x`, `y`, `progress` (0-1), `isComplete`

**Events:** `'waypoint-reached'` -- `(index)`, `'path-complete'` -- `()`

#### TowerManager

Manages tower placement, upgrades, targeting, and firing. Towers auto-target nearest enemy in range. Sell returns 50% invested cost.

```typescript
import { TowerManager } from '@gamebyte/framework/genre/td';

const towers = new TowerManager([
  {
    id: 'archer', name: 'Archer Tower',
    cost: 50, range: 150, damage: 10, fireRate: 2,
    upgrades: [
      { cost: 75, damage: 15, range: 175, fireRate: 2.5 },
      { cost: 150, damage: 25, range: 200, fireRate: 3 },
    ],
  },
]);

// Place tower (currency object must have spend(amount) => boolean)
const currency = { spend: (amt) => economy.spend('gold', amt) };
const tower = towers.place('archer', 200, 300, currency);

// Upgrade
towers.upgrade(tower.id, currency);
towers.getUpgradeCost(tower.id);   // Next upgrade cost (null if maxed)

// Sell (returns 50% of total invested)
const refund = towers.sell(tower.id);

// Each frame -- auto-fires at enemies in range
towers.update(dt, enemies);

towers.getTowers();                 // All placed towers
towers.getDef('archer');            // Get tower definition

towers.on('tower-placed', (tower) => renderTower(tower));
towers.on('tower-fire', (tower, target) => showProjectile(tower, target));
towers.on('tower-upgraded', (tower) => updateTowerSprite(tower));
towers.on('tower-sold', (tower) => removeTowerSprite(tower));
```

**Constructor:** `new TowerManager(towerDefs: TowerDef[])`

**Methods:** `place(defId, x, y, currency)`, `upgrade(towerId, currency)`, `sell(towerId)`, `update(dt, enemies)`, `getTowers()`, `getDef(defId)`, `getUpgradeCost(towerId)`, `destroy()`

**Events:** `'tower-placed'`, `'tower-upgraded'`, `'tower-sold'`, `'tower-fire'` -- `(tower, target)`

---

### RPG (`@gamebyte/framework/genre/rpg`)

#### StatsSystem

Character stats with base values + named bonuses. Bonuses stack additively.

```typescript
import { StatsSystem } from '@gamebyte/framework/genre/rpg';

const stats = new StatsSystem({ hp: 100, attack: 20, defense: 10, speed: 5 });

stats.get('attack');               // 20 (base + bonuses)
stats.getBase('attack');           // 20 (base only)
stats.setBase('attack', 25);      // Change base

stats.addBonus('sword-equip', 'attack', 15);    // Named bonus
stats.addBonus('buff-potion', 'attack', 5);      // Stacks
stats.get('attack');               // 45 (25 + 15 + 5)

stats.removeBonus('buff-potion');
stats.clearBonuses('attack');      // Remove all attack bonuses
stats.getStatNames();              // ['hp', 'attack', 'defense', 'speed']
stats.getAll();                    // All effective stats as object

stats.on('stat-changed', (stat, newVal, oldVal) => updateStatUI(stat, newVal));
```

**Methods:** `get(stat)`, `getBase(stat)`, `setBase(stat, value)`, `addBonus(id, stat, value)`, `removeBonus(id)`, `clearBonuses(stat)`, `getStatNames()`, `getAll()`

**Events:** `'stat-changed'` -- `(stat, newValue, oldValue)`

#### InventorySystem

Slot-based inventory with equip/unequip support. Stackable items, configurable max slots and equip slots.

```typescript
import { InventorySystem } from '@gamebyte/framework/genre/rpg';

const inventory = new InventorySystem({
  maxSlots: 50,
  equipSlots: ['weapon', 'armor', 'accessory'],
});

const sword = { id: 'iron-sword', name: 'Iron Sword', type: 'weapon', stats: { attack: 10 } };
inventory.add(sword);                  // Add to inventory
inventory.has('iron-sword');           // true
inventory.getCount('iron-sword');      // 1

inventory.equip('weapon', 'iron-sword');
inventory.getEquipped('weapon');       // sword ItemDef
inventory.unequip('weapon');           // Returns item or null

inventory.remove('iron-sword');        // Remove from inventory
inventory.getItems();                  // All inventory slots
inventory.isFull;                      // Is at max capacity?
inventory.slotCount;                   // Used slots
inventory.maxSlots;                    // Max slots

inventory.on('item-added', (item, count) => {});
inventory.on('item-removed', (item, count) => {});
inventory.on('item-equipped', (slot, item) => stats.addBonus(slot, 'attack', item.stats.attack));
inventory.on('item-unequipped', (slot, item) => stats.removeBonus(slot));
```

**Methods:** `add(item, count?)`, `remove(itemId, count?)`, `has(itemId)`, `getCount(itemId)`, `equip(slot, itemId)`, `unequip(slot)`, `getEquipped(slot)`, `getItems()`

**Properties:** `isFull`, `slotCount`, `maxSlots`

**Events:** `'item-added'`, `'item-removed'`, `'item-equipped'`, `'item-unequipped'`

#### DialogueSystem

Branching dialogue tree with linear advance and choice-based branching. Supports conditional choices and onEnter callbacks.

```typescript
import { DialogueSystem } from '@gamebyte/framework/genre/rpg';

const dialogue = new DialogueSystem([
  { id: 'start', text: 'Welcome, adventurer!', speaker: 'Elder', next: 'quest' },
  {
    id: 'quest', text: 'Will you help us?', speaker: 'Elder',
    choices: [
      { text: 'Yes', next: 'accept' },
      { text: 'No', next: 'decline', condition: () => reputation > 0 },
    ],
  },
  { id: 'accept', text: 'Thank you!', speaker: 'Elder', onEnter: () => addQuest('village') },
  { id: 'decline', text: 'Very well...', speaker: 'Elder' },
]);

dialogue.start('start');           // Begin dialogue from node
dialogue.advance();                // Next node (linear, no choices)
dialogue.choose(0);                // Pick a choice option

dialogue.current;                  // Current DialogueNode
dialogue.isActive;                 // Is dialogue running?

dialogue.on('node', (node) => showDialogueUI(node.speaker, node.text, node.choices));
dialogue.on('choice-made', (index, nextId) => {});
dialogue.on('end', () => hideDialogueUI());
```

**Methods:** `start(nodeId?)`, `advance()`, `choose(index)`

**Properties:** `current: DialogueNode | null`, `isActive: boolean`

**Events:** `'node'` -- `(node)`, `'choice-made'` -- `(index, nextId)`, `'end'` -- `()`

---

### Card (`@gamebyte/framework/genre/card`)

#### DeckManager

Draw pile, hand, and discard pile management with Fisher-Yates shuffle. Auto-reshuffles discard when draw pile is empty.

```typescript
import { DeckManager } from '@gamebyte/framework/genre/card';

const deck = new DeckManager({ maxHandSize: 7 });

// Build deck
deck.addToDeck([
  { id: 'fireball', name: 'Fireball', type: 'spell', cost: 3 },
  { id: 'shield', name: 'Shield', type: 'defense', cost: 2 },
  // ... more cards
]);
deck.shuffle();

// Draw cards
const drawn = deck.draw(5);           // Draw 5 cards into hand

// Play and discard
deck.play('fireball');                 // Remove from hand (does NOT discard)
deck.discard('shield');                // Hand -> discard pile
deck.discardHand();                    // Discard entire hand

// Reshuffle
deck.reshuffleDiscard();               // Discard -> draw pile, then shuffle

// State
deck.hand;                             // Current hand (copy)
deck.drawPileCount;                    // Cards in draw pile
deck.discardPileCount;                 // Cards in discard pile
deck.reset();                          // Clear everything

deck.on('card-drawn', (card) => addCardToHandUI(card));
deck.on('card-played', (card) => applyCardEffect(card));
deck.on('card-discarded', (card) => {});
deck.on('deck-empty', () => {});
deck.on('hand-full', () => {});
deck.on('shuffle', () => playShuffleAnimation());
```

**Methods:** `addToDeck(cards)`, `shuffle()`, `draw(count?)`, `play(cardId)`, `discard(cardId)`, `discardHand()`, `reshuffleDiscard()`, `reset()`

**Properties:** `hand: CardDef[]`, `drawPileCount`, `discardPileCount`

**Events:** `'card-drawn'`, `'card-played'`, `'card-discarded'`, `'deck-empty'`, `'hand-full'`, `'shuffle'`

#### TurnEngine

Simple round-based turn manager. Manages participant order and round counting.

```typescript
import { TurnEngine } from '@gamebyte/framework/genre/card';

const turns = new TurnEngine(['player', 'enemy1', 'enemy2']);

turns.start();                         // Round 1, first participant
turns.currentTurn;                     // 'player'
turns.round;                           // 1
turns.isTurn('player');                // true

turns.endTurn();                       // Advance to next participant
turns.currentTurn;                     // 'enemy1'

// After all participants: round increments automatically
turns.reset();

turns.on('turn-start', (owner) => enableControls(owner === 'player'));
turns.on('turn-end', (owner) => {});
turns.on('round-start', (roundNum) => showRoundBanner(roundNum));
turns.on('round-end', (roundNum) => {});
```

**Constructor:** `new TurnEngine(participants: string[])`

**Methods:** `start()`, `endTurn()`, `reset()`

**Properties:** `currentTurn: string`, `round: number`

**Events:** `'turn-start'`, `'turn-end'` -- `(owner)`, `'round-start'`, `'round-end'` -- `(roundNumber)`

---

### Platformer (`@gamebyte/framework/genre/platformer`)

#### PlatformerController

2D platformer movement logic: run, jump, double jump, gravity, coyote time, ground detection.

```typescript
import { PlatformerController } from '@gamebyte/framework/genre/platformer';

const controller = new PlatformerController({
  moveSpeed: 200,       // px/sec (default: 200)
  jumpForce: -400,      // Upward velocity (default: -400)
  gravity: 800,         // px/sec^2 (default: 800)
  maxFallSpeed: 600,    // Terminal velocity (default: 600)
  doubleJump: true,     // Allow double jump (default: false)
  coyoteTime: 100,      // Grace period ms after leaving edge (default: 100)
});

controller.setPosition(100, 400);

// Each frame
const state = controller.update(dt, { left, right, jump }, groundY);
sprite.x = state.x;
sprite.y = state.y;
// state: { x, y, vx, vy, isGrounded, isJumping, canDoubleJump, facing }

// External ground detection (from your own collision system)
controller.setGrounded(true, platformY);

controller.on('jump', () => playSFX('jump'));
controller.on('double-jump', () => playSFX('double-jump'));
controller.on('land', () => spawnDustEffect());
controller.reset();
```

**Constructor:** `new PlatformerController(config?: PlatformerConfig)`

**Methods:** `update(dt, input: {left, right, jump}, groundY?): PlatformerState`, `setGrounded(grounded, groundY?)`, `setPosition(x, y)`, `reset()`

**Properties:** `state: PlatformerState`

**Events:** `'jump'`, `'double-jump'`, `'land'`

#### ObstaclePattern

Repeatable obstacle patterns for infinite runners and level generators. Difficulty filtering for progressive challenge.

```typescript
import { ObstaclePattern } from '@gamebyte/framework/genre/platformer';

const patterns = new ObstaclePattern([
  {
    id: 'easy-gap', width: 300, difficulty: 0.2,
    obstacles: [
      { type: 'platform', x: 0, y: 400, width: 100, height: 20 },
      { type: 'platform', x: 200, y: 400, width: 100, height: 20 },
    ],
  },
  {
    id: 'spike-run', width: 400, difficulty: 0.6,
    obstacles: [
      { type: 'spike', x: 100, y: 380 },
      { type: 'spike', x: 200, y: 380 },
      { type: 'coin', x: 150, y: 300 },
    ],
  },
]);

const next = patterns.getNext(0.5);    // Random pattern with difficulty <= 0.5
patterns.getPattern('easy-gap');       // Get specific pattern
patterns.getAll();                     // All registered patterns

// Generate a sequence of patterns with absolute positions
const obstacles = patterns.generate(5, startX, 0.5);
// Returns: Array<ObstacleDef & { patternId: string }>
// Each obstacle has absolute x position

patterns.on('pattern-spawned', (pattern, offsetX) => {});
```

**Constructor:** `new ObstaclePattern(patterns: PatternDef[])`

**Methods:** `getNext(maxDifficulty?)`, `getPattern(id)`, `getAll()`, `generate(count, startX?, maxDifficulty?)`

**Events:** `'pattern-spawned'` -- `(pattern, offsetX)`

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

*Last updated: 2026-04-06*
*Target audience: AI agents, autonomous game builders*
*Estimated reading: 6-8 minutes*
