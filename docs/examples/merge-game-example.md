# Merge Game Example

A mobile-style merge puzzle game with drag-and-drop mechanics and tier progression.

<!-- keywords: merge, puzzle, drag, drop, mobile, grid, tier, progression -->

---

## Features

- Grid-based merge puzzle mechanics
- Drag and drop item movement
- Tier-based progression system
- Smooth animations (scale, position)
- Score and level tracking
- Mobile-optimized touch interactions

---

## Quick Start

```bash
cd examples/merge-game
npx serve .
# Open http://localhost:3000
```

---

## Controls

| Action | Description |
|--------|-------------|
| Drag item | Pick up and move |
| Drop on empty cell | Place item |
| Drop on same tier | Merge into higher tier |
| Spawn button | Add new random item |

---

## Code Overview

### Grid Configuration

```javascript
const GRID_ROWS = 5;
const GRID_COLS = 5;
const CELL_SIZE = 70;
const CELL_GAP = 10;

// Tier colors (vibrant mobile game palette)
const TIER_COLORS = [
  0x9E9E9E,  // Tier 0: Gray
  0x4CAF50,  // Tier 1: Green
  0x2196F3,  // Tier 2: Blue
  0x9C27B0,  // Tier 3: Purple
  0xFF9800,  // Tier 4: Orange
  0xF44336,  // Tier 5: Red
  0xFFEB3B,  // Tier 6: Yellow/Gold
  // ...
];
```

### Creating Merge Items

```javascript
function createItem(tier, cell) {
  const container = new PIXI.Container();
  container.x = cell.x + CELL_SIZE / 2;
  container.y = cell.y + CELL_SIZE / 2;

  // Draw colored shape based on tier
  const graphics = new PIXI.Graphics();
  const color = TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)];
  graphics.roundRect(-size/2, -size/2, size, size, size * 0.2);
  graphics.fill({ color });

  // Add tier label
  const label = new PIXI.Text({ text: tier.toString(), ... });
  container.addChild(graphics, label);

  // Make draggable
  container.eventMode = 'static';
  container.on('pointerdown', (e) => onDragStart(e, item));
  container.on('pointermove', (e) => onDragMove(e, item));
  container.on('pointerup', (e) => onDragEnd(e, item));

  return item;
}
```

### Drag and Drop

```javascript
function onDragStart(e, item) {
  draggedItem = item;
  draggedFromCell = item.cell;

  // Remove from cell
  item.cell.item = null;
  item.cell = null;

  // Scale up for visual feedback
  animateScale(item.container, 1.1, 0.1);
}

function onDragMove(e, item) {
  if (draggedItem !== item) return;

  const pos = e.getLocalPosition(gridContainer);
  item.container.x = pos.x;
  item.container.y = pos.y;

  // Highlight cell under cursor
  const cellUnder = getCellAt(pos.x, pos.y);
  if (cellUnder) {
    const canDrop = !cellUnder.item || cellUnder.item.tier === item.tier;
    highlightCell(cellUnder, canDrop);
  }
}

function onDragEnd(e, item) {
  const targetCell = getCellAt(pos.x, pos.y);

  if (targetCell && !targetCell.item) {
    placeItemInCell(item, targetCell);
  } else if (targetCell?.item?.tier === item.tier) {
    performMerge(item, targetCell.item, targetCell);
  } else {
    returnToCell(item, draggedFromCell);
  }
}
```

### Merge Logic

```javascript
function performMerge(droppedItem, existingItem, cell) {
  const newTier = existingItem.tier + 1;

  // Animate both items shrinking
  animateScale(droppedItem.container, 0, 0.2);
  animateScale(existingItem.container, 0, 0.2);

  setTimeout(() => {
    // Remove old items
    removeItem(droppedItem);
    removeItem(existingItem);

    // Create merged item
    createItem(newTier, cell);

    // Update score
    score += newTier * 100;
    mergeCount++;
    updateUI();
  }, 200);
}
```

### Animations

```javascript
function animateScale(target, toScale, duration) {
  const startScale = target.scale.x;
  const startTime = performance.now();

  function update() {
    const progress = (performance.now() - startTime) / (duration * 1000);
    if (progress >= 1) {
      target.scale.set(toScale);
      return;
    }

    // Back-out easing for bounce effect
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);

    target.scale.set(startScale + (toScale - startScale) * eased);
    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}
```

---

## Game Mechanics

### Spawn System

- New items spawn with weighted random tiers
- Lower tiers (1-2) more common than higher (3)
- Spawn disabled when grid is full

```javascript
function spawnRandomItem() {
  const emptyCells = findEmptyCells();
  if (emptyCells.length === 0) return;

  const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

  // Weighted tier selection
  const tierRoll = Math.random();
  let tier = 1;
  if (tierRoll > 0.9) tier = 3;
  else if (tierRoll > 0.7) tier = 2;

  createItem(tier, cell);
}
```

### Progression

- Score increases based on merged tier level
- Level up after N merges
- Max tier (10) triggers celebration

---

## Mobile Optimization

The example includes several mobile-friendly features:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<style>
  #game-canvas {
    touch-action: none;  /* Prevent browser gestures */
  }
</style>
```

---

## Related

- [Merge Game System Guide](../guides/merge-game-system.md)
- [Platformer Example](./platformer-example.md)
- [UI Components Guide](../guides/ui-components-mobile-first.md)

---
