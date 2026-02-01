---
id: overview
title: UI Components Overview
description: GameByte's mobile-first UI component system
sidebar_position: 1
keywords: [ui, components, mobile, touch, buttons, panels]
llm_summary: "Mobile-first UI: 44px touch targets, gradients, glow effects. Components: UIButton, UIPanel, UIText, TopBar, UIProgressBar. All extend BaseUIComponent."
---

<!-- llm-context: ui-system, mobile-first, touch-targets, components, gradients, glow-effects -->

import LiveDemo from '@site/src/components/LiveDemo';

# UI Components Overview

GameByte provides a comprehensive UI system optimized for mobile games with **game-style components** inspired by hit titles like Candy Crush, Brawl Stars, and Clash Royale.

## Live Demo

<LiveDemo
  src="/demos/game-ui-showcase.html"
  height={700}
  title="Game UI Showcase"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the sun/moon button in the navigation bar!
:::

### Snake Game Example

This classic Snake game showcases game UI elements in action - score display, high score tracking, and grid-based visuals:

<LiveDemo
  src="/demos/snake-demo.html"
  height={580}
  title="Snake Game - UI Elements Demo"
/>

## Design Principles

### Mobile-First

- **44px minimum touch targets** (Apple HIG recommendation)
- **Clear visual feedback** on touch
- **Large, readable text** at default sizes
- **High contrast** for outdoor visibility

### Modern Visuals

- **Gradients** for depth and polish
- **Glow effects** for emphasis
- **Shadow effects** for elevation
- **Smooth animations** for responsiveness

## Available Components

### Game-Style Components

Mobile game UI components with polished visuals:

| Component | Description |
|-----------|-------------|
| [`GameStyleButton`](/ui-components/button) | Candy Crush style buttons with multi-layer effects |
| [`GameTopBar`](/ui-components/topbar) | Resource bar with lives, coins, gems, settings |
| [`HexagonLevelButton`](/ui-components/level-selector) | Hexagon level buttons with stars and states |
| [`LevelPath`](/ui-components/level-selector) | Level map path connecting hexagon buttons |
| [`GameBottomNav`](/ui-components/navigation) | Bottom navigation with shop, play, settings |

### Basic Components

Simple UI building blocks:

| Component | Description |
|-----------|-------------|
| [`UIButton`](/ui-components/button) | Touch-friendly button with effects |
| [`UIPanel`](/ui-components/panel) | Container with background/border |
| [`UIText`](/ui-components/text) | Styled text display |
| [`TopBar`](/ui-components/topbar) | Basic resource/timer bar |
| [`UIProgressBar`](/ui-components/progress-bar) | Progress/health indicators |
| [`UIContainer`](/ui-components/responsive-layout) | Flexible layout container |

## Quick Example

```typescript
import {
    GameStyleButton,
    GameStyleColors,
    GameTopBar,
    HexagonLevelButton,
    GameBottomNav
} from '@gamebyte/framework';

// Game-style play button (Candy Crush style)
const playButton = new GameStyleButton({
    text: 'Play',
    width: 220,
    height: 70,
    fontSize: 32,
    colorScheme: GameStyleColors.YELLOW_BUTTON
});
playButton.on('click', () => startGame());

// Resource bar with lives and coins
const topBar = new GameTopBar({
    width: 400,
    height: 55,
    resources: [
        { type: 'lives', value: 5, label: 'MAX', icon: 'heart' },
        { type: 'coins', value: 1340, showAddButton: true, icon: 'coin' }
    ],
    showSettings: true
});

// Hexagon level button
const levelButton = new HexagonLevelButton({
    level: 17,
    size: 70,
    state: 'current',
    colorScheme: GameStyleColors.HEXAGON_CANDY_CURRENT
});

// Bottom navigation
const bottomNav = new GameBottomNav({
    width: 400,
    height: 85,
    items: [
        { id: 'shop', type: 'shop' },
        { id: 'play', type: 'play', highlighted: true },
        { id: 'settings', type: 'settings' }
    ]
});

// Add to stage
stage.addChild(topBar.getContainer());
stage.addChild(playButton.getContainer());
stage.addChild(levelButton.getContainer());
stage.addChild(bottomNav.getContainer());
```

## Component Architecture

All UI components extend `BaseUIComponent`:

```typescript
abstract class BaseUIComponent {
    protected container: PIXI.Container;
    protected config: ComponentConfig;

    // Position
    setPosition(x: number, y: number): void;
    getPosition(): { x: number, y: number };

    // Visibility
    show(): void;
    hide(): void;
    setAlpha(alpha: number): void;

    // Enable/Disable
    setEnabled(enabled: boolean): void;
    isEnabled(): boolean;

    // Container access
    getContainer(): PIXI.Container;

    // Cleanup
    destroy(): void;
}
```

## Theming

Apply consistent styles across components:

```typescript
import { Themes } from '@gamebyte/framework';

// Set global theme
Themes.set({
    primaryColor: 0x6366f1,
    secondaryColor: 0x22c55e,
    backgroundColor: 0x1a1a2e,
    textColor: 0xffffff,
    fontFamily: 'Arial',
    borderRadius: 8,
    touchTargetSize: 44
});

// Components automatically use theme
const button = new UIButton({ text: 'OK' }); // Uses primaryColor
```

## Event System

Components emit events for interactivity:

```typescript
button.on('click', () => console.log('Clicked!'));
button.on('pointerdown', () => console.log('Pressed'));
button.on('pointerup', () => console.log('Released'));
button.on('pointerover', () => console.log('Hover in'));
button.on('pointerout', () => console.log('Hover out'));

// Remove listener
button.off('click', handler);

// One-time listener
button.once('click', () => console.log('First click only'));
```

## Animation Helpers

```typescript
import { Animations } from '@gamebyte/framework';

// Fade in
Animations.fadeIn(button, { duration: 300 });

// Slide in from bottom
Animations.slideIn(panel, { from: 'bottom', duration: 500 });

// Scale bounce
Animations.bounce(button, { scale: 1.1, duration: 200 });

// Shake (error feedback)
Animations.shake(input, { intensity: 5, duration: 300 });
```

## Accessibility

```typescript
const button = new UIButton({
    text: 'Submit',
    ariaLabel: 'Submit form', // Screen reader label
    focusable: true,          // Keyboard navigation
    highContrast: true        // Enhanced visibility
});
```

## Performance Tips

1. **Reuse components** instead of creating/destroying
2. **Use object pools** for dynamic UI elements
3. **Batch updates** - don't update text every frame
4. **Lazy load** complex UI until needed

```typescript
// Good: Pool and reuse
class ButtonPool {
    private pool: UIButton[] = [];

    get(): UIButton {
        return this.pool.pop() || new UIButton({ text: '' });
    }

    release(btn: UIButton): void {
        btn.hide();
        this.pool.push(btn);
    }
}
```
