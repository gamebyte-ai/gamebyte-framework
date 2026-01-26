---
id: navigation
title: Navigation
description: Bottom navigation components for mobile game main menus
sidebar_position: 7
keywords: [navigation, bottom-nav, menu, mobile, game, shop, play, settings, archero, gold-gradient, animated]
llm_summary: "GameBottomNav: Simple bottom navigation with shop/play/settings icons. ArcheroMenu: Premium Archero-style navigation with gold gradient buttons, GSAP animations, particle effects, swipe gestures, per-section styling."
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

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the sun/moon button in the navigation bar!
:::

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
import { GameBottomNav } from '@gamebyte/framework';

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
import { GameBottomNav } from '@gamebyte/framework';

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

---

## ArcheroMenu

A premium Archero-style bottom navigation menu with glossy gold gradient buttons, GSAP-powered animations, and particle effects. Perfect for game main menus with multiple sections.

### Live Demo

<LiveDemo
  src="/demos/archero-menu-demo.html"
  height={500}
  title="Archero Menu Demo"
/>

:::tip Features
- Gold gradient animated buttons
- GSAP-powered smooth transitions
- Particle effects on section change
- Swipe gesture navigation
- Per-section style customization
:::

### Basic Usage

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

const menu = new ArcheroMenu({
    sections: [
        { name: 'Shop', icon: '🏪', iconColor: ARCHERO_COLORS.red },
        { name: 'Gear', icon: '⚔️', iconColor: ARCHERO_COLORS.purple },
        { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
        { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green },
        { name: 'Chest', icon: '🎁', iconColor: ARCHERO_COLORS.blue }
    ],
    activeSection: 2,  // Start with Campaign
    callbacks: {
        onSectionChange: (index, section) => {
            console.log('Section changed:', section.name);
            loadContent(section.name);
        }
    },
    enableSwipe: true,
    canvasWidth: 1080,
    canvasHeight: 1920
});

stage.addChild(menu.getContainer());

// Update particles in game loop
game.on('update', (dt) => menu.update(dt));
```

### Configuration Options

```typescript
interface ArcheroMenuOptions {
    sections: MenuSection[];
    activeSection?: number;        // Default: 0
    style?: ArcheroMenuStyleConfig;
    callbacks?: ArcheroMenuCallbacks;
    canvasWidth?: number;          // Default: 1080
    canvasHeight?: number;         // Default: 1920
    enableSwipe?: boolean;         // Default: true
    responsive?: boolean;          // Default: false
}

interface MenuSection {
    name: string;                  // Section display name
    icon: string;                  // Emoji or symbol
    iconColor?: number;            // For particles and effects
    customStyle?: SectionStyleOverride;  // Per-section style
}
```

### Style Customization

```typescript
const menu = new ArcheroMenu({
    sections: [...],
    style: {
        // Button sizes
        buttonSize: 130,
        activeButtonSize: 260,
        buttonRadius: 30,

        // Custom gradient (red theme)
        buttonGradient: {
            topColor: 0xFF6B6B,
            middleColor: 0xFF3B3B,
            bottomColor: 0xCC0000
        },

        // Navigation bar
        navBarColor: 0x1a1a2e,
        navHeight: 220,
        padding: 50,

        // Animation speeds
        transitionDuration: 0.4,
        iconAnimDuration: 0.25,

        // Particles
        enableParticles: true,
        particleCount: 30
    }
});
```

### Per-Section Style Overrides

```typescript
const sections = [
    {
        name: 'Fire',
        icon: '🔥',
        iconColor: 0xFF4500,
        customStyle: {
            buttonGradient: {
                topColor: 0xFF6B6B,
                middleColor: 0xFF4500,
                bottomColor: 0xCC0000
            },
            labelColor: 0xFFFFFF
        }
    },
    {
        name: 'Water',
        icon: '💧',
        iconColor: 0x1E90FF,
        customStyle: {
            buttonGradient: {
                topColor: 0x87CEEB,
                middleColor: 0x1E90FF,
                bottomColor: 0x0047AB
            }
        }
    }
];
```

### Event Callbacks

```typescript
const menu = new ArcheroMenu({
    sections: [...],
    callbacks: {
        // Before transition - can cancel by returning false
        onBeforeTransition: (fromIndex, toIndex) => {
            console.log(`Transitioning from ${fromIndex} to ${toIndex}`);
            return true;  // Allow transition
        },

        // Section changed (after animation)
        onSectionChange: (index, section) => {
            loadContentForSection(section.name);
        },

        // After transition completes
        onAfterTransition: (fromIndex, toIndex) => {
            console.log('Transition complete');
        },

        // Button pressed
        onButtonPress: (index) => {
            playSound('button_press');
        },

        // Swipe detected
        onSwipe: (direction) => {
            console.log('Swiped:', direction);
        }
    }
});
```

### Dynamic Section Management

```typescript
// Add a new section
menu.addSection({
    name: 'Events',
    icon: '🎉',
    iconColor: 0xFF69B4
});

// Add at specific index
menu.addSection({ name: 'Inventory', icon: '🎒' }, 2);

// Update a section
menu.updateSection(2, { name: 'Store', icon: '🛒' });

// Remove a section
menu.removeSection(3);

// Reorder sections
menu.reorderSections([3, 1, 2, 0, 4]);

// Get sections
const sections = menu.getSections();
```

### Methods

```typescript
// Get container for stage
menu.getContainer();

// Get/set active section
menu.getActiveSection();
menu.setActiveSection(2);

// Update style dynamically
menu.setStyle({
    buttonGradient: { topColor: 0x6495ED },
    navBarColor: 0x191970
});

// Get current style
const style = menu.getStyle();

// Update particles (call in game loop)
menu.update(deltaTime);

// Cleanup
menu.destroy();
```

### Archero Colors Palette

```typescript
import { ARCHERO_COLORS } from '@gamebyte/framework';

ARCHERO_COLORS.red          // 0xFF3B3B
ARCHERO_COLORS.blue         // 0x3B7BFF
ARCHERO_COLORS.purple       // 0x9B3BFF
ARCHERO_COLORS.green        // 0x3BFF7B
ARCHERO_COLORS.activeYellow // 0xFFD700
ARCHERO_COLORS.navBg        // 0x0f1624
ARCHERO_COLORS.separator    // 0x2d3f5f
```

### Complete Example

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

class GameMainMenu {
    private menu: ArcheroMenu;
    private contentContainer: PIXI.Container;

    constructor(stage: PIXI.Container) {
        this.contentContainer = new PIXI.Container();
        stage.addChild(this.contentContainer);

        this.menu = new ArcheroMenu({
            sections: [
                { name: 'Shop', icon: '🏪', iconColor: ARCHERO_COLORS.red },
                { name: 'Gear', icon: '⚔️', iconColor: ARCHERO_COLORS.purple },
                { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
                { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green },
                { name: 'Chest', icon: '🎁', iconColor: ARCHERO_COLORS.blue }
            ],
            activeSection: 2,
            callbacks: {
                onSectionChange: (index, section) => {
                    this.loadContent(section.name);
                }
            },
            style: {
                enableParticles: true,
                particleCount: 30,
                transitionDuration: 0.5
            },
            enableSwipe: true,
            canvasWidth: 1080,
            canvasHeight: 1920
        });

        stage.addChild(this.menu.getContainer());
        this.loadContent('Campaign');
    }

    private loadContent(sectionName: string): void {
        // Clear old content
        this.contentContainer.removeChildren();

        // Load new content based on section
        switch (sectionName) {
            case 'Shop':
                this.showShop();
                break;
            case 'Campaign':
                this.showCampaign();
                break;
            // ... other sections
        }
    }

    update(dt: number): void {
        this.menu.update(dt);
    }

    destroy(): void {
        this.menu.destroy();
    }
}
```
