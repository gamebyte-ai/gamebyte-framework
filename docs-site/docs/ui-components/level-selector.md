---
id: level-selector
title: Level Selector
description: Hexagon level buttons and level path for game level selection screens
sidebar_position: 6
keywords: [level, selector, hexagon, button, path, map, candy-crush, game]
llm_summary: "HexagonLevelButton: Candy Crush style hexagon level buttons with states (current, completed, available, locked), stars, golden borders. LevelPath: Golden path connecting level buttons. GameStyleColors provides color schemes."
---

<!-- llm-context: level-selector, hexagon-button, level-path, candy-crush-style, game-map -->

import LiveDemo from '@site/src/components/LiveDemo';

# Level Selector

GameByte provides **HexagonLevelButton** for Candy Crush style level selection screens with golden borders, stars, and level states.

## Live Demo

<LiveDemo
  src="/demos/hexagon-level-demo.html"
  height={470}
  title="HexagonLevelButton Demo"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the sun/moon button in the navigation bar!
:::

## HexagonLevelButton

A hexagon-shaped level button with multiple states, star ratings, and Candy Crush style golden borders.

**Features:**
- Hexagon shape with beveled 3D effect
- Golden outer border (Candy Crush style)
- Multiple states: current, completed, available, locked
- Star rating display (1-3 stars)
- Glow effect for current level
- Lock icon for locked levels
- Animated press feedback

### Basic Usage

```typescript
import { HexagonLevelButton, GameStyleColors } from '@gamebyte/framework';

// Current level with golden border
const currentLevel = new HexagonLevelButton({
    level: 17,
    size: 70,
    state: 'current',
    colorScheme: GameStyleColors.HEXAGON_CANDY_CURRENT
});

currentLevel.setPosition(200, 150);
currentLevel.on('click', ({ level }) => playLevel(level));
stage.addChild(currentLevel.getContainer());
```

### Configuration Options

```typescript
interface HexagonLevelButtonConfig {
    level: number;              // Level number to display
    size?: number;              // Hexagon size (default: 60)
    state?: 'current' | 'completed' | 'available' | 'locked';
    stars?: number;             // 0-3 stars for completed levels
    showStars?: boolean;        // Show star display (default: true for completed)
    colorScheme?: HexagonColorScheme;
}

interface HexagonColorScheme {
    fill: number;           // Main fill color
    border: number;         // Inner border color
    highlight: number;      // Top highlight color
    text: number;           // Level number color
    textStroke: number;     // Text stroke color
    outerBorder?: number;   // Golden outer border
    glow?: number;          // Glow color for current level
}
```

### Level States

```typescript
// Current level - glowing, golden border
const current = new HexagonLevelButton({
    level: 17,
    size: 70,
    state: 'current',
    colorScheme: GameStyleColors.HEXAGON_CANDY_CURRENT
});

// Completed level - with stars
const completed = new HexagonLevelButton({
    level: 16,
    size: 70,
    state: 'completed',
    stars: 3,
    showStars: true,
    colorScheme: GameStyleColors.HEXAGON_CANDY_BLUE
});

// Available level - clickable, no glow
const available = new HexagonLevelButton({
    level: 18,
    size: 70,
    state: 'available',
    colorScheme: GameStyleColors.HEXAGON_CANDY_BLUE
});

// Locked level - greyed out, lock icon
const locked = new HexagonLevelButton({
    level: 19,
    size: 70,
    state: 'locked',
    colorScheme: GameStyleColors.HEXAGON_CANDY_LOCKED
});
```

### Color Schemes

GameByte includes pre-defined Candy Crush style color schemes:

```typescript
import { GameStyleColors } from '@gamebyte/framework';

// Blue hexagon with golden border
GameStyleColors.HEXAGON_CANDY_BLUE

// Current level (blue with cyan glow)
GameStyleColors.HEXAGON_CANDY_CURRENT

// Locked level (grey)
GameStyleColors.HEXAGON_CANDY_LOCKED
```

### Custom Color Scheme

```typescript
const customScheme = {
    fill: 0xFF6B6B,        // Red fill
    border: 0xFFB300,      // Golden border
    highlight: 0xFF8E8E,   // Light red highlight
    text: 0xFFFFFF,        // White text
    textStroke: 0x8B0000,  // Dark red stroke
    outerBorder: 0xCC8800, // Golden outer
    glow: 0xFF0000         // Red glow
};

const redLevel = new HexagonLevelButton({
    level: 1,
    size: 70,
    state: 'current',
    colorScheme: customScheme
});
```

### Events

```typescript
// Level clicked
levelButton.on('click', ({ level, state }) => {
    if (state !== 'locked') {
        startLevel(level);
    }
});
```

---

## LevelPath

A golden path that connects level buttons on a level selection map.

### Basic Usage

```typescript
import { LevelPath } from '@gamebyte/framework';

const path = new LevelPath({
    points: [
        { x: 100, y: 400 },
        { x: 200, y: 350 },
        { x: 150, y: 280 },
        { x: 250, y: 230 }
    ],
    width: 25,
    color: 0xFFB300,      // Golden
    borderColor: 0xCC8800,
    borderWidth: 4
});

stage.addChild(path.getContainer());
```

### Configuration Options

```typescript
interface LevelPathConfig {
    points: { x: number; y: number }[];
    width?: number;           // Path width (default: 20)
    color?: number;           // Path fill color
    borderColor?: number;     // Path border color
    borderWidth?: number;     // Border width (default: 3)
    dashed?: boolean;         // Dashed line style
    dashLength?: number;      // Dash length
    gapLength?: number;       // Gap between dashes
}
```

---

## Complete Level Map Example

```typescript
import {
    HexagonLevelButton,
    LevelPath,
    GameStyleColors
} from '@gamebyte/framework';

class LevelMap {
    private levels: HexagonLevelButton[] = [];
    private path: LevelPath;

    constructor(stage: PIXI.Container) {
        // Define level positions
        const positions = [
            { x: 100, y: 400, level: 1, state: 'completed', stars: 3 },
            { x: 200, y: 350, level: 2, state: 'completed', stars: 2 },
            { x: 150, y: 280, level: 3, state: 'completed', stars: 3 },
            { x: 250, y: 230, level: 4, state: 'current', stars: 0 },
            { x: 200, y: 160, level: 5, state: 'locked', stars: 0 }
        ];

        // Create path
        this.path = new LevelPath({
            points: positions.map(p => ({ x: p.x, y: p.y })),
            width: 25,
            color: 0xFFB300,
            borderColor: 0xCC8800
        });
        stage.addChild(this.path.getContainer());

        // Create level buttons
        positions.forEach(pos => {
            const colorScheme = pos.state === 'current'
                ? GameStyleColors.HEXAGON_CANDY_CURRENT
                : pos.state === 'locked'
                ? GameStyleColors.HEXAGON_CANDY_LOCKED
                : GameStyleColors.HEXAGON_CANDY_BLUE;

            const level = new HexagonLevelButton({
                level: pos.level,
                size: 70,
                state: pos.state as any,
                stars: pos.stars,
                showStars: pos.state === 'completed',
                colorScheme
            });

            level.setPosition(pos.x, pos.y);
            level.on('click', ({ level }) => this.onLevelClick(level));
            stage.addChild(level.getContainer());
            this.levels.push(level);
        });
    }

    private onLevelClick(levelNum: number): void {
        const level = this.levels.find(l => l.getLevel() === levelNum);
        if (level && level.getState() !== 'locked') {
            console.log(`Starting level ${levelNum}`);
        }
    }
}
```

## Styling Tips

### Candy Crush Style
- Use golden outer borders (`outerBorder` property)
- Add glow effect for current level
- Use rounded hexagons with bevel effect
- Bright, saturated colors

### Classic Style
- Skip the outer border
- Use simpler color schemes
- Show star ratings for completed levels

```typescript
// Classic style (no golden border)
const classic = new HexagonLevelButton({
    level: 5,
    size: 70,
    state: 'current',
    showStars: false
    // No colorScheme = default classic colors
});
```
