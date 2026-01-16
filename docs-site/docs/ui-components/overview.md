---
id: overview
title: UI Components Overview
description: GameByte's mobile-first UI component system
sidebar_position: 1
keywords: [ui, components, mobile, touch, buttons, panels]
llm_summary: "Mobile-first UI: 44px touch targets, gradients, glow effects. Components: UIButton, UIPanel, UIText, TopBar, UIProgressBar. All extend BaseUIComponent."
---

<!-- llm-context: ui-system, mobile-first, touch-targets, components, gradients, glow-effects -->

# UI Components Overview

GameByte provides a comprehensive UI system optimized for mobile games.

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

| Component | Description |
|-----------|-------------|
| [`UIButton`](/ui-components/button) | Touch-friendly button with effects |
| [`UIPanel`](/ui-components/panel) | Container with background/border |
| [`UIText`](/ui-components/text) | Styled text display |
| [`TopBar`](/ui-components/topbar) | Resource/timer bar at screen top |
| [`UIProgressBar`](/ui-components/progress-bar) | Progress/health indicators |
| [`UIContainer`](/ui-components/responsive-layout) | Flexible layout container |

## Quick Example

```typescript
import { UIButton, UIPanel, UIText, TopBar } from 'gamebyte-framework';

// Create a menu panel
const panel = new UIPanel({
    width: 300,
    height: 400,
    backgroundColor: 0x1a1a2e,
    borderRadius: 16,
    shadowEffect: true
});

// Add title
const title = new UIText({
    text: 'MAIN MENU',
    fontSize: 32,
    fontWeight: 'bold',
    color: 0xffffff
});

// Add play button
const playButton = new UIButton({
    text: 'PLAY',
    width: 200,
    height: 60,
    backgroundColor: 0x4CAF50,
    gradient: { enabled: true },
    glowEffect: true,
    rippleEffect: true
});

playButton.on('click', () => startGame());

// Add to scene
panel.addChild(title.getContainer());
panel.addChild(playButton.getContainer());
scene.addChild(panel.getContainer());
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
import { UITheme } from 'gamebyte-framework';

// Set global theme
UITheme.set({
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
import { UIAnimations } from 'gamebyte-framework';

// Fade in
UIAnimations.fadeIn(button, { duration: 300 });

// Slide in from bottom
UIAnimations.slideIn(panel, { from: 'bottom', duration: 500 });

// Scale bounce
UIAnimations.bounce(button, { scale: 1.1, duration: 200 });

// Shake (error feedback)
UIAnimations.shake(input, { intensity: 5, duration: 300 });
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
