# Merge Game Components

<!-- keywords: merge, puzzle, grid, cell, item, tier, drag, drop, candy, match -->

Ready-to-use components for building merge puzzle games.

## Overview

GameByte provides a complete merge game system with three levels of abstraction:

| Level | Component | Use Case |
|-------|-----------|----------|
| **High** | `Merge` facade | Quick setup, static API |
| **Medium** | `MergeGameScene` | Scene-based, automatic UI |
| **Low** | `MergeGrid/Cell/Item` | Full control, custom logic |

---

## Quick Reference

### Merge Facade (Quickest)

```typescript
import { Merge, MergeServiceProvider } from 'gamebyte-framework';

// Register provider
game.register(new MergeServiceProvider());

// Create and start
Merge.createGame({ rows: 5, cols: 5 });
Merge.on('merge', (item, tier, score) => console.log('Merged!'));
Merge.start();
scene.addChild(Merge.getContainer());
```

### MergeGameScene (Scene-Based)

```typescript
import { MergeGameScene } from 'gamebyte-framework';

const scene = new MergeGameScene({
  rows: 6, cols: 6,
  showScoreUI: true,
  onMerge: (item, tier) => playSFX('merge'),
  onGameOver: (state) => showModal(state.score)
});

sceneManager.add(scene);
sceneManager.switchTo('merge-game');
```

### Low-Level Components

```typescript
import { MergeGrid, MergeCell, MergeItem } from 'gamebyte-framework';

const grid = new MergeGrid({ rows: 5, cols: 5 });
grid.spawnItem({ tier: 1 });

grid.on('merge-completed', (g, item, cell) => {
  console.log(`New tier: ${item.tier}`);
});

scene.addChild(grid.getContainer());
```

---

## Component Details

### MergeGrid

Main container managing the grid layout and merge logic.

**Key Methods:**
- `spawnItem(config)` - Spawn in random empty cell
- `spawnItemInCell(cell, config)` - Spawn in specific cell
- `getCellAtPosition(x, y)` - Get cell at coordinates
- `getEmptyCells()` - Get all empty cells
- `unlockCell(row, col)` - Unlock a locked cell

**Events:**
- `merge-completed` - After successful merge
- `item-spawned` - After item spawn
- `grid-full` - No empty cells left
- `max-tier-reached` - Item hit max tier

### MergeCell

Single cell in the grid, acts as drop zone.

**Key Methods:**
- `placeItem(item)` - Place item in cell
- `removeItem()` - Remove and return item
- `handleDrop(item)` - Handle dropped item
- `canAcceptItem(item)` - Check if can accept

**Events:**
- `item-placed` - Item placed in cell
- `merge-attempt` - Merge about to happen
- `hover-enter/exit` - Drag hover states

### MergeItem

Draggable item with tier system.

**Key Methods:**
- `canMergeWith(other)` - Check merge compatibility
- `mergeWith(other)` - Perform merge
- `setPosition(x, y)` - Set position

**Events:**
- `drag-start/move/end` - Drag lifecycle
- `merge-complete` - After merge
- `tier-changed` - Tier updated

---

## Presets

### Quick Presets

```typescript
Merge.quick()                // 5x5, 3 initial items
Merge.createCandyStyle()     // 6x5, candy colors
Merge.createMobileCompact()  // 4x4, larger cells
```

### Custom Preset Example

```typescript
// "Goddess Merge" style
Merge.createGame({
  rows: 6,
  cols: 6,
  cellWidth: 70,
  cellHeight: 70,
  maxTier: 12,
  tierColors: [
    0xFFCDD2, 0xF8BBD9, 0xE1BEE7,
    0xD1C4E9, 0xC5CAE9, 0xBBDEFB,
    0xB3E5FC, 0xB2EBF2, 0xB2DFDB,
    0xC8E6C9, 0xDCEDC8, 0xF0F4C3
  ]
});
```

---

## Full Example

```typescript
import {
  createGame,
  Merge,
  MergeServiceProvider,
  initializeFacades
} from 'gamebyte-framework';

async function init() {
  // Setup
  const game = createGame();
  game.register(new MergeServiceProvider());
  await game.initialize(canvas, '2d');
  initializeFacades(game);

  // Create game
  Merge.createGame({
    rows: 5,
    cols: 5,
    initialItems: 3,
    maxTier: 10
  });

  // Events
  let score = 0;
  Merge.on('score-changed', (newScore) => {
    score = newScore;
    updateUI();
  });

  Merge.on('game-over', (state) => {
    alert(`Game Over! Score: ${state.score}`);
  });

  // Add to scene
  const stage = game.make('renderer').getStage();
  stage.addChild(Merge.getContainer());
  Merge.centerIn(800, 600);

  // Start
  Merge.start();
  game.start();

  // Spawn button
  spawnBtn.onclick = () => Merge.spawnItem(1);
}

init();
```

---

## See Also

- [Full Merge System Guide](../guides/merge-game-system.md)
- [UI Components](./ui-components-mobile-first.md)
