---
id: topbar
title: TopBar
description: Resource and timer display bar for game HUD
sidebar_position: 5
keywords: [topbar, hud, resources, timer, score, settings, coins, lives]
llm_summary: "GameTopBar: Mobile game style HUD with settings button, lives (heart icon with MAX label), coins with add button. Resources: lives, coins, gems, energy. Events: settings-click, add-click."
---

<!-- llm-context: topbar, hud, resources, timer, score-display, game-ui, settings-button, coins, lives -->

import LiveDemo from '@site/src/components/LiveDemo';

# TopBar

GameByte provides **GameTopBar** for mobile game style HUDs with settings button, lives, coins, and other resources.

## Live Demo

<LiveDemo
  src="/demos/game-topbar-demo.html"
  height={220}
  title="GameTopBar Demo"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the sun/moon button in the navigation bar!
:::

## GameTopBar

A game-style top bar with circular settings button, heart icon with lives, coin display with add button.

**Features:**
- Settings gear button (circular, dark background)
- Lives display with heart icon and MAX label
- Coins display with coin icon and add (+) button
- Gems display with gem icon
- Energy display with lightning icon
- Pill-shaped containers with game styling
- Animated value changes

### Basic Usage

```typescript
import { GameTopBar } from '@gamebyte/framework';

const topBar = new GameTopBar({
    width: 400,
    height: 55,
    resources: [
        { type: 'lives', value: 5, label: 'MAX', icon: 'heart' },
        { type: 'coins', value: 1340, showAddButton: true, icon: 'coin' }
    ],
    showSettings: true,
    onSettingsClick: () => openSettings()
});

topBar.setPosition(0, 10);
stage.addChild(topBar.getContainer());
```

### Configuration Options

```typescript
interface GameTopBarConfig {
    width: number;
    height?: number;           // Default: 60
    padding?: number;          // Default: 15
    resources?: ResourceItemConfig[];
    showSettings?: boolean;    // Default: true
    onSettingsClick?: () => void;
}

interface ResourceItemConfig {
    type: 'lives' | 'coins' | 'gems' | 'energy' | 'custom';
    value: number;
    max?: number;              // For lives/energy with max display
    icon?: 'heart' | 'coin' | 'gem' | 'energy' | 'custom';
    iconColor?: number;
    backgroundColor?: number;
    showAddButton?: boolean;
    label?: string;            // e.g., "MAX"
    onClick?: () => void;
    onAddClick?: () => void;
}
```

### Resource Types

```typescript
// Lives with MAX label
{
    type: 'lives',
    value: 5,
    label: 'MAX',
    icon: 'heart'
}

// Coins with add button
{
    type: 'coins',
    value: 1340,
    showAddButton: true,
    icon: 'coin',
    onAddClick: () => openShop()
}

// Gems
{
    type: 'gems',
    value: 250,
    showAddButton: true,
    icon: 'gem'
}

// Energy
{
    type: 'energy',
    value: 8,
    max: 10,
    icon: 'energy'
}
```

### Updating Resources

```typescript
// Update with animation (default)
topBar.updateResource('coins', 1500, true);

// Update without animation
topBar.updateResource('lives', 4, false);
```

### Events

```typescript
// Settings button clicked
topBar.on('settings-click', () => {
    openSettings();
});

// Add button clicked
topBar.on('add-click', (resourceType) => {
    if (resourceType === 'coins') {
        openCoinShop();
    }
});
```

---

## TopBar (Basic)

For simpler HUD needs, use the basic `TopBar` component:

```typescript
import { TopBar, TopBarItemType } from '@gamebyte/framework';

const topBar = new TopBar({
    width: 800,
    items: [
        {
            id: 'coins',
            type: TopBarItemType.RESOURCE,
            icon: coinTexture,
            value: 1000
        },
        {
            id: 'gems',
            type: TopBarItemType.RESOURCE,
            icon: gemTexture,
            value: 50
        }
    ]
});

scene.addChild(topBar.getContainer());
```

## Configuration Options

```typescript
interface TopBarConfig {
    width: number;
    height?: number;           // Default: 60
    backgroundColor?: number;  // Default: 0x1a1a2e
    backgroundAlpha?: number;  // Default: 0.9
    padding?: number;          // Default: 16
    items: TopBarItem[];
}

interface TopBarItem {
    id: string;                // Unique identifier
    type: TopBarItemType;
    icon?: PIXI.Texture | string;
    value: number;
    maxValue?: number;         // For PROGRESS type
    format?: 'number' | 'abbreviate' | 'time';
    color?: number;
    animated?: boolean;        // Animate value changes
    position?: 'left' | 'center' | 'right';
}

enum TopBarItemType {
    RESOURCE,  // Coins, gems, energy
    TIMER,     // Countdown/countup timer
    PROGRESS,  // Health bar, progress
    TEXT       // Custom text
}
```

## Item Types

### Resource (Coins, Gems)

```typescript
{
    id: 'coins',
    type: TopBarItemType.RESOURCE,
    icon: coinTexture,
    value: 12500,
    format: 'abbreviate',  // Shows "12.5K"
    animated: true,
    position: 'left'
}
```

### Timer

```typescript
{
    id: 'timer',
    type: TopBarItemType.TIMER,
    icon: clockTexture,
    value: 180,            // Seconds
    format: 'time',        // Shows "3:00"
    position: 'center'
}
```

### Progress (Health/Energy)

```typescript
{
    id: 'health',
    type: TopBarItemType.PROGRESS,
    icon: heartTexture,
    value: 75,
    maxValue: 100,
    color: 0xff4444,
    position: 'right'
}
```

## Updating Values

```typescript
// Update with animation
topBar.updateItem('coins', 1500, true);

// Update without animation
topBar.updateItem('health', 50, false);

// Get current value
const coins = topBar.getItemValue('coins');
```

## Timer Control

```typescript
// Start countdown
topBar.startTimer('timer', {
    direction: 'down',
    onComplete: () => console.log('Time up!')
});

// Start countup
topBar.startTimer('timer', {
    direction: 'up',
    maxValue: 300
});

// Pause/resume
topBar.pauseTimer('timer');
topBar.resumeTimer('timer');

// Stop
topBar.stopTimer('timer');
```

## Complete Example

```typescript
import { TopBar, TopBarItemType } from '@gamebyte/framework';

class GameHUD {
    private topBar: TopBar;

    constructor(scene: BaseScene) {
        this.topBar = new TopBar({
            width: 800,
            height: 60,
            backgroundColor: 0x0f0f23,
            items: [
                {
                    id: 'coins',
                    type: TopBarItemType.RESOURCE,
                    icon: 'assets/coin.png',
                    value: 0,
                    format: 'abbreviate',
                    animated: true,
                    position: 'left'
                },
                {
                    id: 'level',
                    type: TopBarItemType.TEXT,
                    value: 1,
                    format: 'number',
                    position: 'center'
                },
                {
                    id: 'health',
                    type: TopBarItemType.PROGRESS,
                    icon: 'assets/heart.png',
                    value: 100,
                    maxValue: 100,
                    color: 0xff4444,
                    position: 'right'
                }
            ]
        });

        scene.container.addChild(this.topBar.getContainer());
    }

    addCoins(amount: number): void {
        const current = this.topBar.getItemValue('coins');
        this.topBar.updateItem('coins', current + amount, true);
    }

    takeDamage(amount: number): void {
        const current = this.topBar.getItemValue('health');
        const newHealth = Math.max(0, current - amount);
        this.topBar.updateItem('health', newHealth, true);

        if (newHealth === 0) {
            this.onGameOver();
        }
    }

    setLevel(level: number): void {
        this.topBar.updateItem('level', level, true);
    }
}
```

## Styling

```typescript
const topBar = new TopBar({
    width: 800,
    height: 70,
    backgroundColor: 0x1a1a2e,
    backgroundAlpha: 0.95,
    padding: 20,
    items: [...],
    style: {
        fontSize: 20,
        fontWeight: 'bold',
        iconSize: 32,
        gap: 24,
        progressBarHeight: 8,
        progressBarRadius: 4
    }
});
```
