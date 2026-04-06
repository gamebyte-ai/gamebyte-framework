# GameByte Quick Reference

Command cheatsheet for rapid development.

<!-- keywords: reference, cheatsheet, commands, quick, api -->

---

## Initialization

| Command | Purpose |
|---------|---------|
| `createGame()` | Full game with all systems |
| `createMobileGame()` | Mobile-optimized variant |
| `game.initialize(canvas, '2d')` | Initialize 2D renderer |
| `game.initialize(canvas, '3d')` | Initialize 3D renderer |
| `game.start()` | Start game loop |
| `game.stop()` | Stop game loop |

---

## Service Access

| Service | Key | Quick Access |
|---------|-----|--------------|
| Renderer | `'renderer'` | `game.make('renderer')` |
| Scenes | `'scene.manager'` | `game.make('scene.manager')` |
| UI | `'ui.manager'` | `game.make('ui.manager')` |
| Assets | `'assets'` | `game.make('assets')` |
| Audio | `'audio'` | `game.make('audio')` |
| Input | `'input'` | `game.make('input')` |
| Physics | `'physics'` | `game.make('physics')` |
| Performance | `'performance'` | `game.make('performance')` |

---

## Common Operations

### Scene Management

```typescript
sceneManager.register('game', new GameScene());
await sceneManager.load('game');
await sceneManager.transition('menu', { duration: 500 });
```

### Asset Loading

```typescript
await assetManager.load({ id: 'sprite', url: './sprite.png', type: 'texture' });
const assets = await assetManager.loadBatch([{ id, url, type }, ...]);
const asset = assetManager.get('sprite');
```

### UI Creation

```typescript
const button = new UIButton({ text: 'Play', width: 200, height: 60 });
const menu = new ArcheroMenu({ sections: [...], activeSection: 0 });
const tooltip = new GameTooltip({ text: 'Coming Soon', tailPosition: 'bottom-left' });
```

### Audio Playback

```typescript
await audioManager.playMusic('bgm', { loop: true, volume: 0.5 });
await audioManager.playSFX('jump', { volume: 0.8 });
audioManager.pauseMusic();
audioManager.resumeMusic();
```

### Input Handling

```typescript
inputManager.on('pointerdown', (event) => { /* ... */ });
inputManager.on('keydown', (event) => { /* ... */ });
inputManager.on('swipe', (direction) => { /* ... */ });
```

### Reactive State

```typescript
import { createState, computed } from 'gamebyte-framework';

const state = createState({ score: 0, health: 100 });
state.score += 100;                                    // Direct update
state.on('score', (newVal, oldVal) => { /* ... */ }); // Subscribe
state.batch(s => { s.score++; s.health--; });         // Batch updates
state.reset();                                         // Reset to initial
const snapshot = state.value;                          // Plain object

const total = computed(() => state.score * 2);         // Computed value
console.log(total.value);                              // Access computed
```

---

## Pre-built Components

| Component | Import | Lines Saved |
|-----------|--------|-------------|
| `ArcheroMenu` | `gamebyte-framework` | ~670 |
| `UIButton` | `gamebyte-framework` | ~120 |
| `UIPanel` | `gamebyte-framework` | ~80 |
| `GameTooltip` | `gamebyte-framework` | ~200 |
| `UIProgressBar` | `gamebyte-framework` | ~100 |
| `SplashScreen` | `gamebyte-framework` | ~150 |

---

## UI Effects

### CelebrationManager (All-in-one)

```typescript
const celebration = new CelebrationManager(stage, width, height);
game.on('update', (dt) => celebration.update(dt));

celebration.victory();                          // Confetti rain
celebration.starEarned(x, y, 1);               // Burst + sparkle
celebration.addShimmer(icon, 'gold');          // Light sweep
celebration.addStarburst(icon, 'gold');        // Sparkle particles
```

### Effect Presets

| Type | Presets | Usage |
|------|---------|-------|
| Shimmer | `'gold'`, `'gem'`, `'star'` | `addShimmer(target, preset)` |
| Starburst | `'gold'`, `'gem'`, `'star'`, `'victory'` | `addStarburst(target, preset)` |
| Confetti | Built into `victory()`, `starEarned()`, etc. | Auto |

### Individual Systems

```typescript
// Direct access (when needed)
const confetti = new ConfettiSystem(container, w, h);
const shine = new ShineEffect(container);
const starburst = new StarBurstEffect(container);
```

See `docs/agent-guide/UI_EFFECTS.md` for full documentation.

---

## Default Values

| Setting | Default | Override |
|---------|---------|----------|
| Resolution | `devicePixelRatio` | `{ resolution: 2 }` |
| Antialias | Auto-detected | `{ antialias: true }` |
| Background | `0x000000` | `{ backgroundColor: 0x1a1a2e }` |
| Touch target | 44x44px | `{ width: 60, height: 60 }` |
| Asset timeout | 30s | `{ timeout: 60000 }` |
| Audio volume | 1.0 | `{ volume: 0.5 }` |

---

## File Paths

| Type | Path | Purpose |
|------|------|---------|
| Core API | `docs/agent-guide/CORE_API.md` | Load first |
| Quick Ref | `docs/agent-guide/QUICK_REFERENCE.md` | Command cheatsheet |
| UI Effects | `docs/agent-guide/UI_EFFECTS.md` | Celebration/sparkle effects |
| Examples | `docs/examples/*.md` | Component examples |
| Architecture | `docs/architecture/*.md` | System design |
| Components | `docs/components/*.md` | Component docs |
| UI | `docs/ui/*.md` | UI system docs |
| Demos | Root `demo-*.html` | Full games |

---

## v1.4 Game Primitives

### GameEntity

```typescript
import { GameEntity } from 'gamebyte-framework';

const entity = new GameEntity({ x: 100, y: 200, health: 100, collisionRadius: 16, tags: ['player'] });
entity.update(dt);                          // Update position from velocity
entity.damage(25);                          // Reduce health, emits 'damaged'/'died'
entity.heal(10);                            // Restore health, emits 'healed'
entity.collidesWith(other);                 // Circle/rect collision check
entity.distanceTo(other);                   // Distance between entities
scene.addChild(entity.getContainer());      // Add to scene
```

### ObjectPool\<T\>

```typescript
import { ObjectPool } from 'gamebyte-framework';

const pool = new ObjectPool({ create: () => obj, reset: (o) => {}, initialSize: 20, maxSize: 100 });
const item = pool.acquire();                // Get or create object
pool.release(item);                         // Return to pool
pool.activeCount;                           // Currently in use
pool.availableCount;                        // Ready to acquire
```

### GameConfigStore\<T\>

```typescript
import { createGameConfig } from 'gamebyte-framework';

const config = createGameConfig({ speed: 200, spawnRate: 2.0 });
config.get('speed');                        // Read value
config.set('speed', 250);                   // Write value, emits 'changed'
config.applyDifficulty(3, { speed: 1.1 }); // Scale values by factor^level
config.reset();                             // Restore defaults
```

### screenShake()

```typescript
import { screenShake } from 'gamebyte-framework';

screenShake(container, 8, 300);             // Simple: target, intensity, duration(ms)
screenShake({ target: container, intensity: 12, duration: 500, decay: 'exponential' });
```

### FloatingText2D

```typescript
import { FloatingText2D } from 'gamebyte-framework';

FloatingText2D.damage(parent, x, y, 25);   // Red damage number
FloatingText2D.score(parent, x, y, 100);   // Yellow score popup
FloatingText2D.coin(parent, x, y, 5);      // Orange coin text
FloatingText2D.heal(parent, x, y, 10);     // Green heal text
FloatingText2D.spawn({ text: 'CRITICAL!', x, y, parent, style: 'damage' });
```

### WaveManager

```typescript
import { WaveManager } from 'gamebyte-framework';

const wm = new WaveManager({
  waves: [{ enemies: [{ type: 'zombie', count: 5, spawnInterval: 800 }], intermission: 3000 }],
  onSpawn: (type, waveIdx) => spawn(type),
  onWaveStart: (idx) => showBanner(idx),
  onAllWavesComplete: () => victory(),
});
wm.start();  wm.update(dt);                // Start and tick each frame
wm.currentWave;  wm.totalWaves;            // Progress tracking
```

### Grid\<T\> & HexGrid\<T\>

```typescript
import { Grid, HexGrid } from 'gamebyte-framework';

const grid = new Grid({ rows: 8, cols: 8, cellSize: 64 });
grid.setCell(0, 0, 'player');              // Set cell value
grid.getNeighbors(2, 3);                   // Adjacent cells
grid.cellToPixel(2, 3);                    // {x, y} center
grid.pixelToCell(150, 200);                // {row, col} | null

const hex = new HexGrid({ rows: 10, cols: 10, cellSize: 48 });
hex.hexDistance(0, 0, 3, 2);               // Hex distance
hex.getRing(5, 5, 2);                      // Ring of cells
```

### GestureDetector

```typescript
import { GestureDetector } from 'gamebyte-framework';

const gesture = new GestureDetector({ target: canvas, swipeThreshold: 50 });
gesture.on('tap', (x, y) => { });          // Single tap
gesture.on('swipe', (dir, vel) => { });    // Swipe direction + velocity
gesture.on('long-press', (x, y) => { });   // Long press
gesture.on('drag-move', (x, y, dx, dy) => { });  // Drag with delta
gesture.on('pinch', (scale, cx, cy) => { }); // Pinch zoom
gesture.destroy();                          // Cleanup listeners
```

### SaveSystem\<T\>

```typescript
import { SaveSystem } from 'gamebyte-framework';

const save = new SaveSystem({ key: 'my-game', version: 2, defaults: { score: 0 }, migrations: { 1: (old) => ({ ...old }) } });
save.load();                                // Load from localStorage (runs migrations)
save.set('score', 500);                     // Auto-saves
save.get('score');                          // Read value
save.reset();                               // Clear save data
```

### EconomyManager

```typescript
import { EconomyManager } from 'gamebyte-framework';

const eco = new EconomyManager([{ id: 'gold', name: 'Gold', initial: 100 }]);
eco.add('gold', 50);                       // Add currency
eco.spend('gold', 30);                     // Deduct (returns bool)
eco.canAfford('gold', 200);                // Check balance
eco.registerItems([{ id: 'sword', name: 'Sword', cost: { currency: 'gold', amount: 50 } }]);
eco.purchase('sword');                      // Buy item (deducts cost)
EconomyManager.getUpgradeCost(100, 3, 1.15); // Exponential cost scaling
```

---

## Grep Patterns

Search docs efficiently:

```bash
# Find physics-related docs
grep -r "physics" docs/

# Find collision examples
grep -r "collision" docs/

# Find UI component documentation
grep -r "UIButton\|UIPanel\|GameTooltip\|ArcheroMenu" docs/

# Find mobile optimization docs
grep -r "mobile.*optimi\|createMobileGame" docs/

# Find effects/celebration docs
grep -r "CelebrationManager\|Confetti\|Shimmer\|StarBurst" docs/

# Find v1.4 game primitives
grep -r "GameEntity\|ObjectPool\|WaveManager\|Grid\|HexGrid" docs/
grep -r "GestureDetector\|SaveSystem\|EconomyManager\|FloatingText2D\|screenShake" docs/
```

---

*Last updated: 2026-04-06*
*Estimated reading: 2-3 minutes*
