---
id: topbar
title: TopBar
description: Resource and timer display bar
sidebar_position: 5
keywords: [topbar, hud, resources, timer, score]
llm_summary: "TopBar: HUD for resources/timers. new TopBar({ width, items: [...] }). Item types: RESOURCE, TIMER, PROGRESS. Update with updateItem(id, value, animate)."
---

<!-- llm-context: topbar, hud, resources, timer, score-display, game-ui -->

import LiveDemo from '@site/src/components/LiveDemo';

# TopBar

A heads-up display bar for showing resources, timers, and game stats.

## Basic Usage

```typescript
import { TopBar, TopBarItemType } from 'gamebyte-framework';

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

<LiveDemo
  src="/demos/ui-topbar.html"
  height={150}
  title="TopBar Demo"
/>

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
import { TopBar, TopBarItemType } from 'gamebyte-framework';

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
