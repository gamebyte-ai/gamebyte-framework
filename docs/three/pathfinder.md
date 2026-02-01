# Pathfinder - A* Pathfinding for Grids

The `Pathfinder` class provides efficient A* pathfinding for grid-based games. It works seamlessly with both `SquareGrid` and `HexGrid` through the `IGridSystem` interface.

## Features

- **A* Algorithm**: Optimal pathfinding with configurable heuristics
- **Grid-Agnostic**: Works with square and hexagonal grids
- **Diagonal Movement**: Optional diagonal movement for square grids
- **Obstacle Avoidance**: Respects grid walkability and custom avoid lists
- **Movement Range**: Calculate reachable cells within a cost limit
- **Visual Debug**: Create Three.js lines to visualize paths
- **Performance**: Configurable max iterations and early termination

## Basic Usage

```typescript
import { Pathfinder } from 'gamebyte-framework/three';
import { SquareGrid } from 'gamebyte-framework/three';

// Create a grid
const grid = new SquareGrid({
  width: 20,
  height: 20,
  cellSize: 1,
  origin: { x: 0, y: 0, z: 0 }
});

// Block some cells
grid.setWalkable({ x: 5, y: 5 }, false);
grid.setWalkable({ x: 5, y: 6 }, false);

// Create pathfinder
const pathfinder = new Pathfinder({
  grid,
  allowDiagonals: true,
  diagonalCost: 1.414, // √2
  heuristic: 'euclidean',
  maxIterations: 1000
});

// Find a path
const path = pathfinder.findPath(
  { x: 0, y: 0 },
  { x: 10, y: 10 }
);

if (path) {
  console.log(`Path found with ${path.length} steps`);
  path.forEach(coord => {
    console.log(`  Step: (${coord.x}, ${coord.y})`);
  });
}
```

## Configuration

### PathfinderConfig

```typescript
interface PathfinderConfig<C extends Coord> {
  grid: IGridSystem<any, C>;      // Required: Grid to pathfind on
  allowDiagonals?: boolean;       // Default: true (square grids only)
  diagonalCost?: number;          // Default: 1.414 (√2)
  heuristic?: HeuristicType;      // Default: 'manhattan'
  maxIterations?: number;         // Default: 1000
}
```

### Heuristic Types

Choose the best heuristic for your movement style:

- **`manhattan`**: Best for 4-directional movement (up, down, left, right)
  - Formula: `|dx| + |dy|`
  - Fastest computation
  - Optimal for grid-locked movement

- **`euclidean`**: Best for diagonal movement and realistic distances
  - Formula: `sqrt(dx² + dy²)`
  - Most realistic distance
  - Good for 8-directional movement

- **`chebyshev`**: Best for 8-directional with equal diagonal cost
  - Formula: `max(|dx|, |dy|)`
  - Fast computation
  - Optimal when diagonals cost the same as cardinal moves

## API Reference

### findPath()

Find the optimal path from start to end.

```typescript
findPath(
  start: Coord,
  end: Coord,
  options?: FindPathOptions
): Coord[] | null
```

**Options:**
```typescript
interface FindPathOptions {
  avoidCoords?: Coord[];    // Coordinates to avoid
  maxCost?: number;         // Maximum total path cost
}
```

**Returns:** Array of coordinates from start to end, or `null` if no path exists.

**Example:**
```typescript
// Simple path
const path = pathfinder.findPath(
  { x: 0, y: 0 },
  { x: 5, y: 5 }
);

// Avoid specific cells
const pathWithAvoid = pathfinder.findPath(
  { x: 0, y: 0 },
  { x: 10, y: 10 },
  {
    avoidCoords: [
      { x: 5, y: 5 },
      { x: 6, y: 6 }
    ]
  }
);

// Limited movement range
const shortPath = pathfinder.findPath(
  { x: 0, y: 0 },
  { x: 10, y: 10 },
  { maxCost: 10 }  // Only paths with total cost ≤ 10
);
```

### canReach()

Quick check if destination is reachable (faster than findPath).

```typescript
canReach(
  start: Coord,
  end: Coord,
  options?: FindPathOptions
): boolean
```

**Example:**
```typescript
if (pathfinder.canReach({ x: 0, y: 0 }, { x: 10, y: 10 })) {
  console.log('Destination is reachable!');
}
```

### getReachableCells()

Get all cells reachable within a movement cost limit. Perfect for strategy games showing movement range.

```typescript
getReachableCells(
  start: Coord,
  maxCost: number
): Coord[]
```

**Example:**
```typescript
// Show all cells a unit with 5 movement can reach
const reachable = pathfinder.getReachableCells({ x: 5, y: 5 }, 5);

// Highlight them
reachable.forEach(coord => {
  const worldPos = grid.cellToWorld(coord);
  // Draw highlight at worldPos
});
```

### createPathLine()

Create a Three.js Line object to visualize the path.

```typescript
createPathLine(
  path: Coord[],
  options?: PathLineOptions
): THREE.Line
```

**Options:**
```typescript
interface PathLineOptions {
  color?: number;      // Default: 0x00ff00 (green)
  lineWidth?: number;  // Default: 2
  yOffset?: number;    // Default: 0.1 (prevents z-fighting)
}
```

**Example:**
```typescript
const path = pathfinder.findPath(start, end);
if (path) {
  const line = pathfinder.createPathLine(path, {
    color: 0x00ff00,
    lineWidth: 3,
    yOffset: 0.2
  });
  scene.add(line);
}
```

### Configuration Methods

Update or retrieve pathfinder settings at runtime.

```typescript
// Update configuration
pathfinder.setConfig({
  heuristic: 'euclidean',
  allowDiagonals: false
});

// Get current configuration
const config = pathfinder.getConfig();
console.log(`Using ${config.heuristic} heuristic`);
```

## Performance Considerations

### Max Iterations

The `maxIterations` setting prevents infinite loops in edge cases:

```typescript
const pathfinder = new Pathfinder({
  grid,
  maxIterations: 500  // Lower for faster failure on impossible paths
});
```

### Diagonal Movement Cost

For realistic movement, diagonal moves should cost more:

```typescript
const pathfinder = new Pathfinder({
  grid,
  allowDiagonals: true,
  diagonalCost: 1.414  // √2 for accurate distance
});
```

### Heuristic Selection

- Use `manhattan` for simple 4-directional grids (fastest)
- Use `euclidean` for diagonal movement (most accurate)
- Use `chebyshev` for 8-directional with equal costs (balanced)

## Real-World Examples

### Strategy Game Movement

```typescript
// Show unit's movement range
function showMovementRange(unit, scene) {
  const reachable = pathfinder.getReachableCells(
    unit.gridPosition,
    unit.movementPoints
  );

  reachable.forEach(coord => {
    const worldPos = grid.cellToWorld(coord);
    const highlight = createHighlightMesh(worldPos);
    scene.add(highlight);
  });
}

// Move unit along path
function moveUnit(unit, destination) {
  const path = pathfinder.findPath(
    unit.gridPosition,
    destination,
    { maxCost: unit.movementPoints }
  );

  if (path) {
    animateAlongPath(unit, path);
  }
}
```

### Tower Defense

```typescript
// Find enemy path from spawn to goal
function getEnemyPath(spawnPoint, goalPoint, obstacles) {
  // Mark obstacles as unwalkable
  obstacles.forEach(obstacle => {
    grid.setWalkable(obstacle.gridPosition, false);
  });

  const path = pathfinder.findPath(spawnPoint, goalPoint);

  // Clear obstacles for next calculation
  obstacles.forEach(obstacle => {
    grid.setWalkable(obstacle.gridPosition, true);
  });

  return path;
}
```

### Roguelike Dungeon

```typescript
// Check if player can reach exit
function canEscapeDungeon(playerPos, exitPos) {
  return pathfinder.canReach(playerPos, exitPos);
}

// Find shortest path to item
function findNearestItem(playerPos, itemPositions) {
  let shortestPath = null;
  let nearestItem = null;

  for (const itemPos of itemPositions) {
    const path = pathfinder.findPath(playerPos, itemPos);
    if (path && (!shortestPath || path.length < shortestPath.length)) {
      shortestPath = path;
      nearestItem = itemPos;
    }
  }

  return { path: shortestPath, item: nearestItem };
}
```

### Hexagonal Grid

```typescript
import { HexGrid } from 'gamebyte-framework/three';

const hexGrid = new HexGrid({
  radius: 1,
  orientation: 'pointy',
  origin: { x: 0, y: 0, z: 0 }
});

const hexPathfinder = new Pathfinder({
  grid: hexGrid,
  heuristic: 'manhattan'  // Uses cube distance for hex
});

const hexPath = hexPathfinder.findPath(
  { q: 0, r: 0, s: 0 },
  { q: 3, r: -1, s: -2 }
);
```

## Demo

See `docs-site/static/demos/three-pathfinder-demo.html` for an interactive example:

- Click cells to set start (green) and end (red) points
- Shift+click to toggle obstacles
- Try different heuristics
- View movement range
- Watch paths update in real-time

## Integration with Other Systems

### With Object Pool

```typescript
import { ObjectPool3D } from 'gamebyte-framework/three';

const linePool = new ObjectPool3D(
  () => new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial()
  ),
  10
);

function showPath(path) {
  const line = linePool.get();
  line.geometry.setFromPoints(
    path.map(c => grid.cellToWorld(c))
  );
  scene.add(line);
}
```

### With State Machine

```typescript
import { StateMachine } from 'gamebyte-framework/three';

const enemyAI = new StateMachine({
  initial: 'idle',
  states: {
    idle: {
      onEnter: () => console.log('Idle'),
      onUpdate: (delta) => {
        if (playerDetected) {
          enemyAI.setState('chase');
        }
      }
    },
    chase: {
      onEnter: () => {
        const path = pathfinder.findPath(
          enemy.gridPosition,
          player.gridPosition
        );
        enemy.setPath(path);
      }
    }
  }
});
```

## Tips & Best Practices

1. **Cache Pathfinding Results**: Store paths and only recalculate when obstacles change
2. **Use canReach() First**: Quick validation before expensive findPath()
3. **Limit Max Cost**: Prevent searching the entire map unnecessarily
4. **Update Grid Efficiently**: Batch walkability changes before pathfinding
5. **Choose Right Heuristic**: Match heuristic to your movement rules
6. **Visual Debug**: Use createPathLine() during development
7. **Pool Path Lines**: Reuse Three.js objects to avoid garbage collection

## Common Patterns

### Avoiding Dynamic Obstacles

```typescript
const enemies = getEnemiesInArea();
const avoidList = enemies.map(e => e.gridPosition);

const path = pathfinder.findPath(start, end, {
  avoidCoords: avoidList
});
```

### Multi-Target Pathfinding

```typescript
function findNearestTarget(start, targets) {
  let best = null;
  let bestPath = null;

  for (const target of targets) {
    const path = pathfinder.findPath(start, target);
    if (path && (!bestPath || path.length < bestPath.length)) {
      best = target;
      bestPath = path;
    }
  }

  return { target: best, path: bestPath };
}
```

### Hierarchical Pathfinding

For large maps, combine with sectors:

```typescript
// High-level: Find sector path
const sectorPath = findSectorPath(startSector, endSector);

// Low-level: Find detailed path within sectors
const detailedPath = [];
for (let i = 0; i < sectorPath.length - 1; i++) {
  const sectorEntry = sectorPath[i].exit;
  const sectorExit = sectorPath[i + 1].entry;
  const localPath = pathfinder.findPath(sectorEntry, sectorExit);
  detailedPath.push(...localPath);
}
```

## See Also

- [Grid Systems](./grid-systems.md)
- [Object Pool 3D](./object-pool.md)
- [State Machine](./state-machine.md)
