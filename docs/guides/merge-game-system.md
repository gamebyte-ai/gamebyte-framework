# Merge Game System

<!-- keywords: merge, puzzle, candy crush, match, drag, drop, tier, combine, mobile game -->

Build merge puzzle games like "World Tour Merge", "Goddess Merge", "Candy Crush" and similar mobile games with GameByte's built-in merge system.

## Quick Start

### Using the Merge Facade (Recommended)

```typescript
import { createGame, Merge, initializeFacades, MergeServiceProvider } from 'gamebyte-framework';

// Create and configure game
const game = createGame();
game.register(new MergeServiceProvider());
await game.initialize(canvas, '2d');
initializeFacades(game);

// Create a 5x5 merge grid
Merge.createGame({
  rows: 5,
  cols: 5,
  maxTier: 10,
  initialItems: 3
});

// Listen for game events
Merge.on('merge', (item, tier, score) => {
  console.log(`Merged! Tier: ${tier}, Score: ${score}`);
});

Merge.on('game-over', (state) => {
  console.log(`Game Over! Final Score: ${state.score}`);
});

// Add to scene and start
scene.addChild(Merge.getContainer());
Merge.start();
```

### Using MergeGameScene (Scene-Based)

```typescript
import { MergeGameScene } from 'gamebyte-framework';

// Create a complete merge game scene
const mergeScene = new MergeGameScene({
  rows: 6,
  cols: 6,
  showScoreUI: true,
  showTierUI: true,
  onMerge: (item, tier, score) => {
    playMergeSound(tier);
  },
  onGameOver: (state) => {
    showGameOverModal(state.score);
  }
});

// Add to scene manager
sceneManager.add(mergeScene);
await sceneManager.switchTo('merge-game');
```

---

## API Reference

### Merge Facade

The `Merge` facade provides static methods for quick access to merge game functionality.

#### Game Creation

```typescript
// Create a new merge game
Merge.createGame(config?: MergeGameConfig): MergeGrid

// Quick presets
Merge.quick()                    // 5x5 grid, 3 items
Merge.createCandyStyle(6, 5)     // Candy Crush style
Merge.createMobileCompact()      // 4x4 compact grid
```

#### Game Control

```typescript
Merge.start()      // Start the game
Merge.pause()      // Pause the game
Merge.resume()     // Resume the game
Merge.reset()      // Reset the game
Merge.restart()    // Reset + Start
```

#### Item Management

```typescript
Merge.spawnItem(tier?: number): MergeItem | null
Merge.spawnItems(count: number, tier?: number): MergeItem[]
```

#### State & Getters

```typescript
Merge.getGrid(): MergeGrid | null
Merge.getContainer(): IContainer
Merge.getState(): MergeGameState
Merge.getScore(): number
Merge.getHighestTier(): number
Merge.isGameOver(): boolean
Merge.isPaused(): boolean
Merge.getDimensions(): { width: number; height: number }
```

#### Positioning

```typescript
Merge.setPosition(x: number, y: number)
Merge.centerIn(width: number, height: number)
```

#### Events

```typescript
Merge.on('merge', (item, tier, score) => { ... })
Merge.on('game-over', (state) => { ... })
Merge.on('max-tier', (item) => { ... })
Merge.on('score-changed', (score, delta) => { ... })
Merge.on('item-spawned', (item) => { ... })
Merge.on('grid-full', () => { ... })
```

---

## Configuration

### MergeGameConfig

```typescript
interface MergeGameConfig {
  // Grid dimensions
  rows?: number;              // Default: 5
  cols?: number;              // Default: 5
  cellWidth?: number;         // Default: 80
  cellHeight?: number;        // Default: 80
  gap?: number;               // Default: 8
  padding?: number;           // Default: 16

  // Visual styling
  backgroundColor?: number;       // Grid background
  cellBackgroundColor?: number;   // Cell background
  cellBorderColor?: number;       // Cell border

  // Gameplay settings
  maxTier?: number;           // Default: 10
  autoSpawn?: boolean;        // Default: false
  initialItems?: number;      // Default: 3
  initialTier?: number;       // Default: 1
  scoreMultiplier?: number;   // Default: 100

  // Custom visuals
  tierColors?: number[];      // Color per tier
  tierTextures?: Map<number, ITexture>;

  // Locked cells for progression
  lockedCells?: Array<[number, number]>;

  // Effects
  hapticFeedback?: boolean;   // Default: true
  soundEnabled?: boolean;     // Default: true
  mergeAnimationDuration?: number;
  spawnAnimationDuration?: number;
}
```

### Default Tier Colors

```typescript
const DEFAULT_TIER_COLORS = [
  0x9E9E9E,  // Tier 0: Gray
  0x4CAF50,  // Tier 1: Green
  0x2196F3,  // Tier 2: Blue
  0x9C27B0,  // Tier 3: Purple
  0xFF9800,  // Tier 4: Orange
  0xF44336,  // Tier 5: Red
  0xFFEB3B,  // Tier 6: Yellow/Gold
  0x00BCD4,  // Tier 7: Cyan
  0xE91E63,  // Tier 8: Pink
  0x673AB7,  // Tier 9: Deep Purple
  0xFFD700,  // Tier 10+: Gold
];
```

---

## Components

### MergeGrid

The main container that manages the grid of cells.

```typescript
import { MergeGrid } from 'gamebyte-framework';

const grid = new MergeGrid({
  rows: 5,
  cols: 5,
  cellWidth: 80,
  cellHeight: 80,
  gap: 8
});

// Spawn items
grid.spawnItem({ tier: 1 });
grid.spawnItemInCell(cell, { tier: 2 });

// Query
grid.getCell(row, col);
grid.getCellAtPosition(x, y);
grid.getEmptyCells();
grid.getAllItems();
grid.isFull();

// Cell management
grid.unlockCell(row, col);
grid.lockCell(row, col);

// Add to scene
scene.addChild(grid.getContainer());
```

### MergeCell

Individual cell that can hold items and detect drops.

```typescript
import { MergeCell } from 'gamebyte-framework';

const cell = new MergeCell({
  row: 0,
  col: 0,
  width: 80,
  height: 80,
  locked: false
});

// Item management
cell.placeItem(item);
cell.removeItem();
cell.hasItem();
cell.getItem();
cell.canAcceptItem(item);

// Drop handling
cell.handleDrop(item); // Returns: 'placed' | 'merged' | 'rejected'

// Events
cell.on('item-placed', (cell, item) => { ... });
cell.on('merge-attempt', (cell, droppedItem, existingItem) => { ... });
```

### MergeItem

Draggable, mergeable item with tier/level system.

```typescript
import { MergeItem } from 'gamebyte-framework';

const item = new MergeItem({
  tier: 1,
  size: 80,
  draggable: true,
  mergeable: true
});

// Properties
item.tier;
item.size;
item.isDragging;
item.canBeDragged;
item.canBeMerged;

// Merge operations
item.canMergeWith(otherItem);
item.mergeWith(otherItem); // Returns new higher-tier item

// Events
item.on('drag-start', (item, x, y) => { ... });
item.on('drag-end', (item, x, y) => { ... });
item.on('merge-complete', (resultItem, mergedItems) => { ... });
```

---

## Examples

### Basic Merge Game

```typescript
import { createGame, Merge, initializeFacades, MergeServiceProvider } from 'gamebyte-framework';

async function createMergeGame() {
  const game = createGame();
  game.register(new MergeServiceProvider());
  await game.initialize(canvas, '2d');
  initializeFacades(game);

  Merge.createGame({ rows: 5, cols: 5 });

  Merge.on('merge', (item, tier, score) => {
    updateScore(score);
    playMergeEffect(item.getPosition());
  });

  Merge.on('game-over', showGameOverScreen);

  const stage = game.make('renderer').getStage();
  stage.addChild(Merge.getContainer());

  Merge.centerIn(800, 600);
  Merge.start();
  game.start();
}
```

### With Progression System

```typescript
// Lock some cells initially
Merge.createGame({
  rows: 6,
  cols: 6,
  lockedCells: [
    [4, 0], [4, 1], [4, 4], [4, 5],
    [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5]
  ]
});

// Unlock cells when player reaches certain tiers
Merge.on('merge', (item, tier) => {
  if (tier >= 5) {
    const grid = Merge.getGrid();
    grid?.unlockCell(4, 0);
    grid?.unlockCell(4, 1);
  }
});
```

### Custom Tier Visuals

```typescript
// Load tier textures
const textures = new Map([
  [1, await Assets.load('tier1.png')],
  [2, await Assets.load('tier2.png')],
  [3, await Assets.load('tier3.png')],
]);

Merge.createGame({
  tierTextures: textures,
  maxTier: 10
});
```

### MergeGameScene with UI

```typescript
const mergeScene = new MergeGameScene({
  rows: 5,
  cols: 5,
  showScoreUI: true,
  showTierUI: true,
  sceneBackgroundColor: 0x0d0d1a,

  onMerge: (item, tier, score) => {
    // Play tier-specific sound
    SFX.play(`merge_tier_${Math.min(tier, 5)}`);
  },

  onGameOver: (state) => {
    // Save high score
    if (state.score > highScore) {
      saveHighScore(state.score);
    }

    // Show game over modal
    UI.showScreen('game-over', { score: state.score });
  }
});

sceneManager.add(mergeScene);
await sceneManager.switchTo('merge-game');
```

---

## Mobile Optimization

The merge system is optimized for mobile with:

- **Touch-friendly drag & drop**: Large touch targets with proper hit zones
- **Haptic feedback**: Vibration on merge (configurable)
- **Performance**: Efficient rendering with minimal draw calls
- **Responsive grid**: Auto-sizing cells based on screen

```typescript
// Compact mobile layout
Merge.createMobileCompact();

// Or custom mobile config
Merge.createGame({
  rows: 4,
  cols: 4,
  cellWidth: 85,
  cellHeight: 85,
  gap: 10,
  padding: 20,
  hapticFeedback: true
});
```

---

## Best Practices

1. **Start small**: Begin with 3-5 initial items, let players earn more
2. **Balanced tiers**: 8-12 tiers work well for casual games
3. **Score feedback**: Show score popups on merge for satisfaction
4. **Sound design**: Different sounds for different tier merges
5. **Progression**: Use locked cells to create meta-progression
6. **Mobile-first**: Test touch interactions early and often

---

## See Also

- [UI Components Guide](./ui-components-mobile-first.md)
- [Scene Management](../agent-guide/CORE_API.md)
- [Audio System](./audio-spatial-3d.md)
