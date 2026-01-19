---
id: navigation
title: Navigation
description: Bottom navigation bar for mobile game main menus
sidebar_position: 7
keywords: [navigation, bottom-nav, menu, mobile, game, shop, play, settings]
llm_summary: "GameBottomNav: Mobile game style bottom navigation with shop, play, settings, leaderboard icons. Features: highlighted play button, badge counts, locked items. Events: item-click."
---

<!-- llm-context: navigation, bottom-nav, mobile-game, menu, shop, play, settings -->

import LiveDemo from '@site/src/components/LiveDemo';

# Navigation

GameByte provides **GameBottomNav** for mobile game style bottom navigation bars with shop, play, settings, and other menu items.

## Live Demo

<LiveDemo
  src="/demos/bottom-nav-demo.html"
  height={270}
  title="GameBottomNav Demo"
/>

## GameBottomNav

A mobile game style bottom navigation bar with icons for common game menu actions.

**Features:**
- Pre-built icons: shop, play, profile, settings, leaderboard
- Highlighted play button (larger, glowing)
- Badge counts for notifications
- Locked item states
- Custom labels
- Animated press feedback

### Basic Usage

```typescript
import { GameBottomNav } from 'gamebyte-framework';

const bottomNav = new GameBottomNav({
    width: 400,
    height: 85,
    items: [
        { id: 'shop', type: 'shop' },
        { id: 'play', type: 'play', label: 'Start', highlighted: true },
        { id: 'settings', type: 'settings' }
    ],
    backgroundColor: 0x1A237E
});

bottomNav.setPosition(0, screenHeight - 85);
bottomNav.on('item-click', (id) => handleNavClick(id));
stage.addChild(bottomNav.getContainer());
```

### Configuration Options

```typescript
interface GameBottomNavConfig {
    width: number;
    height?: number;              // Default: 80
    items: BottomNavItem[];
    backgroundColor?: number;     // Default: 0x1A237E
    backgroundAlpha?: number;     // Default: 1
}

interface BottomNavItem {
    id: string;                   // Unique identifier
    type: 'shop' | 'play' | 'profile' | 'settings' | 'leaderboard' | 'custom';
    label?: string;               // Text below icon
    icon?: PIXI.Texture;          // Custom icon (for type: 'custom')
    highlighted?: boolean;        // Larger, glowing (typically for play)
    badge?: number;               // Notification badge count
    locked?: boolean;             // Greyed out, not clickable
}
```

### Item Types

```typescript
// Shop - bag/cart icon
{ id: 'shop', type: 'shop', badge: 3 }  // With notification badge

// Play - play triangle icon (usually highlighted)
{ id: 'play', type: 'play', label: 'Play', highlighted: true }

// Profile - user/avatar icon
{ id: 'profile', type: 'profile', locked: true }  // Locked state

// Settings - gear icon
{ id: 'settings', type: 'settings' }

// Leaderboard - trophy/ranking icon
{ id: 'leaderboard', type: 'leaderboard' }

// Custom - your own icon
{ id: 'custom', type: 'custom', icon: myTexture, label: 'Events' }
```

### Navigation with 3 Items

```typescript
const nav3 = new GameBottomNav({
    width: 400,
    height: 85,
    items: [
        { id: 'shop', type: 'shop' },
        { id: 'play', type: 'play', label: 'Start', highlighted: true },
        { id: 'profile', type: 'profile', locked: true }
    ],
    backgroundColor: 0x1A237E
});
```

### Navigation with 4 Items

```typescript
const nav4 = new GameBottomNav({
    width: 400,
    height: 85,
    items: [
        { id: 'shop', type: 'shop', badge: 3 },
        { id: 'play', type: 'play', label: 'Play', highlighted: true },
        { id: 'leaderboard', type: 'leaderboard' },
        { id: 'settings', type: 'settings' }
    ],
    backgroundColor: 0x283593
});
```

### Events

```typescript
// Item clicked
bottomNav.on('item-click', (itemId) => {
    switch (itemId) {
        case 'shop':
            openShop();
            break;
        case 'play':
            startGame();
            break;
        case 'settings':
            openSettings();
            break;
        case 'leaderboard':
            showLeaderboard();
            break;
    }
});
```

### Methods

```typescript
// Update badge count
bottomNav.setBadge('shop', 5);
bottomNav.setBadge('shop', 0);  // Remove badge

// Lock/unlock item
bottomNav.setLocked('profile', true);
bottomNav.setLocked('profile', false);

// Highlight item
bottomNav.setHighlighted('play', true);
```

---

## Complete Example

```typescript
import { GameBottomNav } from 'gamebyte-framework';

class MainMenu {
    private bottomNav: GameBottomNav;

    constructor(stage: PIXI.Container, screenWidth: number, screenHeight: number) {
        this.bottomNav = new GameBottomNav({
            width: screenWidth,
            height: 85,
            items: [
                { id: 'shop', type: 'shop', badge: 2 },
                { id: 'play', type: 'play', label: 'Play', highlighted: true },
                { id: 'leaderboard', type: 'leaderboard' },
                { id: 'settings', type: 'settings' }
            ],
            backgroundColor: 0x1A237E
        });

        this.bottomNav.setPosition(0, screenHeight - 85);
        this.bottomNav.on('item-click', (id) => this.handleClick(id));
        stage.addChild(this.bottomNav.getContainer());
    }

    private handleClick(itemId: string): void {
        console.log(`${itemId} clicked`);

        switch (itemId) {
            case 'shop':
                this.openShop();
                break;
            case 'play':
                this.startGame();
                break;
            case 'leaderboard':
                this.showLeaderboard();
                break;
            case 'settings':
                this.openSettings();
                break;
        }
    }

    private openShop(): void {
        // Clear badge when shop is opened
        this.bottomNav.setBadge('shop', 0);
        // Show shop screen...
    }

    private startGame(): void {
        // Start the game...
    }

    private showLeaderboard(): void {
        // Show leaderboard...
    }

    private openSettings(): void {
        // Open settings...
    }

    // Call when new shop items are available
    updateShopBadge(count: number): void {
        this.bottomNav.setBadge('shop', count);
    }
}
```

## Styling

```typescript
// Dark blue (default)
backgroundColor: 0x1A237E

// Lighter blue
backgroundColor: 0x283593

// Dark purple
backgroundColor: 0x4A148C

// Near black
backgroundColor: 0x121212
```

## Accessibility

- Touch targets are minimum 44px
- Icons have clear visual distinction
- Highlighted items are easily identifiable
- Locked items are clearly greyed out
- Badge counts are high contrast
