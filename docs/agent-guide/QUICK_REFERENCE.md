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

## v1.5 Camera (2D)

```typescript
import { Camera } from 'gamebyte-framework';

const camera = new Camera({ viewportWidth: 800, viewportHeight: 600, bounds: { x: 0, y: 0, width: 2000, height: 2000 } });
camera.attach(worldContainer);
camera.follow(player, { lerp: 0.1, offsetY: -100 });
camera.unfollow();
camera.moveTo(500, 300);                // smooth move
camera.moveTo(500, 300, true);          // instant snap
camera.setZoom(1.5, 0.5);              // zoom to 1.5x over 0.5s
camera.zoomBy(0.5, 0.3);              // add 0.5 to zoom over 0.3s
camera.shake(8, 0.3);                  // screen shake (intensity, duration)
camera.update(dt);                      // call each frame (dt in seconds)
const wp = camera.screenToWorld(mx, my); // screen -> world coords
const sp = camera.worldToScreen(ex, ey); // world -> screen coords
camera.x; camera.y; camera.zoom;        // read-only state
camera.destroy();
```

---

## v1.5 HybridGame (3D + 2D HUD)

### HybridGame

```typescript
import { HybridGame } from '@gamebyte/framework/hybrid';

const game = await HybridGame.create({
  container: '#game',                   // CSS selector or HTMLElement
  width: 800, height: 600,             // Viewport size
  cameraMode: 'isometric',             // 'orbital' | 'topdown' | 'isometric' | 'front'
  enableRaycast: true,                 // 3D click detection (default: true)
  backgroundColor: 0x1a1a2e,           // Scene background
  shadowQuality: 'medium',             // 'low' | 'medium' | 'high'
});

game.world;                             // THREE.Scene — add 3D objects
game.hud;                               // PIXI.Container — add 2D UI
game.camera;                            // GameCameraManager
game.input;                             // RaycastInputManager

game.addDefaultLighting();              // Ambient + directional lights
game.addToWorld(mesh);                  // Add 3D object to scene
game.removeFromWorld(mesh);             // Remove 3D object
game.addToHUD(pixiElement);             // Add 2D element to HUD
game.removeFromHUD(pixiElement);        // Remove 2D element
game.onUpdate((dt) => {});              // Per-frame callback (dt in seconds)
game.followTarget(target);              // Smooth camera follow {x, y, z}
game.moveCameraTo(x, y, z);            // Instant camera move
game.makeInteractive(worldObj);         // Enable raycast on WorldObject3D
game.destroy();                         // Cleanup everything
```

### HybridHUD

```typescript
import { HybridHUD } from '@gamebyte/framework/hybrid';

const hud = new HybridHUD(game.hud, game.width, game.height);

hud.addTopBar({                         // Semi-transparent top status bar
  score: { initial: 0 },               // Score display
  lives: { initial: 3, max: 5 },       // Lives with max
  coins: { initial: 0 },               // Currency
  timer: { seconds: 60, countDown: true }, // Timer
  custom: [{ key: 'wave', label: 'WAVE', value: 1 }], // Custom fields
});

hud.addBottomBar({                      // Action button bar at bottom
  buttons: [
    { id: 'attack', label: 'Attack', onClick: () => {} },
    { id: 'skill', label: 'Skill' },
  ],
});

hud.setValue('score', 1500);            // Update top bar value by key
hud.showMessage('WAVE 1', { duration: 2000, fontSize: 48, color: 0xffffff });
hud.setVisible(false);                  // Show/hide entire HUD
hud.on('button:click', (id) => {});    // Listen for button clicks
hud.destroy();                          // Cleanup
```

### WorldObject3D

```typescript
import { WorldObject3D } from '@gamebyte/framework/three/interaction';

const obj = new WorldObject3D();
obj.on('pointerdown', (e, isHit) => { if (isHit) console.log('clicked'); });
obj.on('pointerenter', () => {});       // Hover enter
obj.on('pointerleave', () => {});       // Hover leave
obj.interactive = true;                 // Enable/disable raycasting
obj.isHovered;                          // Read-only hover state
game.makeInteractive(obj);              // Register with input manager
obj.destroy();                          // Cleanup
```

---

## v1.7 Boilerplate

### QuickGameSetup (Hub -> Game -> Result in one config)

```typescript
import { QuickGameSetup } from '@gamebyte/framework/boilerplate';

const setup = new QuickGameSetup(stage, {
  title: 'My Game', width: 540, height: 960,
  game: {
    onCreateGame: (container) => { /* place game objects */ },
    onUpdate: (dt) => { /* game loop */ },
  },
  onRetry: () => resetGameState(),
});
setup.start();                          // Hub screen, flow is automatic
setup.endGame({ score: 100, stars: 3, type: 'victory' }); // -> Result screen
setup.trigger('retry');                 // -> Game screen
setup.showSettings();                   // Settings overlay
setup.currentScreen;                    // 'hub' | 'game' | 'result'
setup.on('screen-changed', (s) => {});
setup.on('game-start', () => {});
setup.on('game-end', (data) => {});
setup.on('setting-changed', (k, v) => {});
```

### GameFlow

```typescript
import { GameFlow } from '@gamebyte/framework/boilerplate';

const flow = new GameFlow(container, {
  start: 'menu',
  screens: { menu: { create: () => menuScreen }, game: { create: () => gameScreen } },
  flow: { play: 'game', home: 'menu' },
});
flow.start();                           // Navigate to start screen
flow.trigger('play');                   // Event -> screen
flow.goTo('menu', data);               // Direct navigation
flow.current;                           // Current screen name
flow.on('navigate', (from, to) => {});
```

### SettingsPanel

```typescript
import { SettingsPanel } from '@gamebyte/framework/boilerplate';

const settings = new SettingsPanel({
  sound: true, music: true, vibration: true,
  fields: [
    { key: 'volume', label: 'Volume', type: 'number', defaultValue: 0.8, min: 0, max: 1, step: 0.1 },
    { key: 'difficulty', label: 'Hard Mode', type: 'boolean', defaultValue: false },
  ],
  persistKey: 'my-game-settings', // auto-saves to localStorage
});
settings.show();  settings.hide();
settings.get('volume');                 // 0.8
settings.set('volume', 0.5);           // auto-persists, emits 'changed'
settings.getAll();                      // { sound, music, vibration, volume, difficulty }
settings.on('changed', (key, val) => {});
```

### TutorialOverlay

```typescript
import { TutorialOverlay } from '@gamebyte/framework/boilerplate';

const tut = new TutorialOverlay([
  { text: 'Tap here', x: 270, y: 480, spotlight: { x: 270, y: 480, radius: 60 } },
  { text: 'Swipe to move', x: 270, y: 300, position: 'below' },
], { skipButton: true, dimAlpha: 0.7 });
parent.addChild(tut.getContainer());
tut.start();  tut.next();  tut.skip();
tut.on('step', (i) => {});  tut.on('complete', () => {});
```

### Toast

```typescript
import { Toast } from '@gamebyte/framework/boilerplate';

Toast.show(parent, 'Level complete!');  // Simple string
Toast.show(parent, { text: 'Error', type: 'error', duration: 3000, y: 80 });
// Types: 'info' | 'success' | 'warning' | 'error'
```

### RewardFly

```typescript
import { RewardFly } from '@gamebyte/framework/boilerplate';

RewardFly.play({
  parent: stage,
  from: { x: 270, y: 400 }, to: { x: 50, y: 30 },
  count: 8, duration: 600, stagger: 50, size: 16, color: 0xffd700,
  onEachArrive: () => coinCount++,
  onComplete: () => updateUI(),
});
```

---

## v1.7 Genre Templates

### Puzzle

```typescript
import { MatchDetector, BoardGravity } from '@gamebyte/framework/genre/puzzle';

const det = new MatchDetector({ rule: 'row-col-3' });
const matches = det.findMatches(grid, rows, cols);  // [{cells, value, size}]
det.wouldMatch(grid, r1, c1, r2, c2);              // Swap check

const result = BoardGravity.apply(grid, rows, cols); // Mutates grid
// result.moves: [{fromRow,fromCol,toRow,toCol}]
// result.spawns: [{row,col}]  — top cells needing new pieces
```

### Survivors

```typescript
import { AutoAttack, UpgradeSystem, XPSystem } from '@gamebyte/framework/genre/survivors';

const atk = new AutoAttack({ range: 200, fireRate: 3, damage: 25, targeting: 'nearest' });
atk.update(dt, player, enemies);        // Call each frame
atk.on('fire', (target, dmg) => {});
atk.configure({ damage: 40 });          // Runtime reconfigure

const upgrades = new UpgradeSystem([
  { id: 'atk', name: 'ATK+', description: '+10', maxLevel: 5, effect: { damage: 10 }, weight: 1 },
]);
const choices = upgrades.getChoices(3); // Weighted random, no maxed
upgrades.choose('atk');                 // Apply, emits 'upgrade-chosen'

const xp = new XPSystem({ xpCurve: (l) => 100 * l });
xp.addXP(150);                         // Auto level-ups
xp.on('level-up', (lv, total) => {});
xp.level;  xp.currentXP;  xp.xpToNextLevel;  xp.progress;                // Current level, 0-1 progress
```

### Idle

```typescript
import { IdleEngine, PrestigeSystem } from '@gamebyte/framework/genre/idle';

const engine = new IdleEngine({
  resources: ['gold'],
  generators: [{ id: 'miner', name: 'Miner', baseCost: 10, baseProduction: 1 }],
});
engine.update(dt);                      // Tick each frame
engine.buy('miner');                    // Purchase generator
engine.getCost('miner');                // Next cost (exponential)
engine.getProductionRate('gold');       // Total gold/sec
engine.applyOfflineEarnings(3600);      // 1 hour offline
engine.getState();  engine.loadState(s);  engine.reset();
engine.on('tick', (prod) => {});
engine.on('purchase', (id, count) => {});

const prestige = new PrestigeSystem({ threshold: 1000, resource: 'gold' });
prestige.prestige(5000);               // Execute, returns new multiplier
prestige.multiplier;  prestige.totalPrestiges;
prestige.on('prestige', (mult, count) => engine.reset());
```

### Tower Defense

```typescript
import { PathFollower, TowerManager } from '@gamebyte/framework/genre/td';

const enemy = new PathFollower([{ x: 0, y: 300 }, { x: 400, y: 100 }], 100);
const pos = enemy.update(dt);          // Returns {x, y}
enemy.progress;  enemy.isComplete;      // 0-1 progress, path done?
enemy.on('path-complete', () => {});

const towers = new TowerManager([
  { id: 'archer', name: 'Archer', cost: 50, range: 150, damage: 10, fireRate: 2 },
]);
const t = towers.place('archer', 200, 300, { spend: (a) => eco.spend('gold', a) });
towers.upgrade(t.id, { spend: (a) => eco.spend('gold', a) });
towers.sell(t.id);                      // 50% refund
towers.update(dt, enemies);             // Auto-fire each frame
towers.on('tower-fire', (tower, target) => {});
```

### RPG

```typescript
import { StatsSystem, InventorySystem, DialogueSystem } from '@gamebyte/framework/genre/rpg';

const stats = new StatsSystem({ hp: 100, attack: 20, defense: 10 });
stats.get('attack');                    // base + bonuses
stats.addBonus('sword', 'attack', 15); // Named bonus
stats.removeBonus('sword');
stats.on('stat-changed', (stat, nv, ov) => {});

const inv = new InventorySystem({ maxSlots: 50, equipSlots: ['weapon', 'armor'] });
inv.add({ id: 'sword', name: 'Sword', type: 'weapon', stats: { attack: 10 } });
inv.equip('weapon', 'sword');           // Equip to slot
inv.unequip('weapon');                  // Returns ItemDef | null
inv.isFull;  inv.slotCount;  inv.maxSlots;

const dlg = new DialogueSystem([
  { id: 'start', text: 'Hello!', speaker: 'NPC', next: 'ask' },
  { id: 'ask', text: 'Help?', choices: [{ text: 'Yes', next: 'yes' }, { text: 'No', next: 'no' }] },
]);
dlg.start('start');  dlg.advance();  dlg.choose(0);
dlg.on('node', (n) => showUI(n));
dlg.on('end', () => hideUI());
```

### Card

```typescript
import { DeckManager, TurnEngine } from '@gamebyte/framework/genre/card';

const deck = new DeckManager({ maxHandSize: 7 });
deck.addToDeck([{ id: 'fireball', name: 'Fireball', cost: 3 }]);
deck.shuffle();
deck.draw(5);                           // Draw into hand
deck.play('fireball');                  // Remove from hand
deck.discard('shield');                 // Hand -> discard
deck.discardHand();                     // Discard all
deck.hand;  deck.drawPileCount;  deck.discardPileCount;
deck.on('card-drawn', (c) => {});  deck.on('deck-empty', () => {});

const turns = new TurnEngine(['player', 'enemy']);
turns.start();                          // Round 1
turns.currentTurn;  turns.round;
turns.endTurn();                        // Next participant
turns.on('turn-start', (who) => {});
turns.on('round-start', (n) => {});
```

### Platformer

```typescript
import { PlatformerController, ObstaclePattern } from '@gamebyte/framework/genre/platformer';

const ctrl = new PlatformerController({
  moveSpeed: 200, jumpForce: -400, gravity: 800, doubleJump: true, coyoteTime: 100,
});
ctrl.setPosition(100, 400);
const state = ctrl.update(dt, { left, right, jump }, groundY);
// state: { x, y, vx, vy, isGrounded, isJumping, canDoubleJump, facing }
ctrl.on('jump', () => {});  ctrl.on('land', () => {});

const patterns = new ObstaclePattern([
  { id: 'gap', width: 300, difficulty: 0.2, obstacles: [{ type: 'platform', x: 0, y: 400 }] },
]);
const next = patterns.getNext(0.5);     // Random, difficulty <= 0.5
const obs = patterns.generate(5, 0, 0.5); // 5 patterns, absolute positions
```

---

## Utilities

### UnsubscribeBag

```typescript
import { UnsubscribeBag } from 'gamebyte-framework';

const subs = new UnsubscribeBag();
subs.add(emitter.on('event', handler));
subs.add(otherEmitter.on('change', callback));
subs.count;                             // 2
subs.flush();                           // LIFO cleanup, safe (try/catch per callback)
subs.count;                             // 0 (idempotent)
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

# Find v1.5 camera and hybrid game docs
grep -r "Camera\|UnsubscribeBag" docs/
grep -r "HybridGame\|HybridHUD\|WorldObject3D" docs/

# Find v1.7 boilerplate docs
grep -r "QuickGameSetup\|GameFlow\|SettingsPanel\|TutorialOverlay\|Toast\|RewardFly" docs/

# Find v1.7 genre template docs
grep -r "MatchDetector\|BoardGravity\|AutoAttack\|UpgradeSystem\|XPSystem" docs/
grep -r "IdleEngine\|PrestigeSystem\|PathFollower\|TowerManager" docs/
grep -r "StatsSystem\|InventorySystem\|DialogueSystem\|DeckManager\|TurnEngine" docs/
grep -r "PlatformerController\|ObstaclePattern" docs/
```

---

*Last updated: 2026-04-06*
*Estimated reading: 2-3 minutes*
