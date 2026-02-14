---
id: responsive-layout
title: Responsive Layout
description: Mobile-first responsive layout system
sidebar_position: 7
keywords: [responsive, layout, mobile, flex, grid]
llm_summary: "ResponsiveLayoutManager handles screen adaptation. Use UIContainer for flex layouts. Safe areas for notches. Breakpoints for different devices."
---

<!-- llm-context: responsive-layout, mobile-first, flex-layout, safe-area, breakpoints -->

import LiveDemo from '@site/src/components/LiveDemo';

# Responsive Layout

GameByte's layout system adapts to any screen size.

<LiveDemo src="/demos/layout-demo.html" height="700" title="Responsive Layout Demo" />

## Screen Adaptation

```typescript
import { ResponsiveLayoutManager } from '@gamebyte/framework';

const layout = new ResponsiveLayoutManager({
    designWidth: 800,
    designHeight: 600,
    scaleMode: 'fit',  // 'fit' | 'fill' | 'stretch'
    alignX: 'center',
    alignY: 'middle'
});

// Apply to game
game.setLayoutManager(layout);
```

## Scale Modes

| Mode | Description |
|------|-------------|
| `fit` | Scales to fit, may have letterbox |
| `fill` | Scales to fill, may crop edges |
| `stretch` | Stretches to fill (distorts) |

```typescript
// Fit mode (recommended for most games)
// Maintains aspect ratio, adds letterbox if needed
layout.setScaleMode('fit');

// Fill mode (for fullscreen backgrounds)
// Maintains ratio, may crop edges
layout.setScaleMode('fill');
```

## Safe Areas

Handle notches and rounded corners:

```typescript
const safeArea = layout.getSafeArea();
// { top: 44, right: 0, bottom: 34, left: 0 }

// Position UI within safe area
topBar.setPosition(safeArea.left, safeArea.top);

// Get safe dimensions
const safeWidth = layout.getSafeWidth();
const safeHeight = layout.getSafeHeight();
```

## Breakpoints

Adapt layout for different screen sizes:

```typescript
import { Breakpoints } from '@gamebyte/framework';

// Define breakpoints
Breakpoints.define({
    phone: { maxWidth: 480 },
    tablet: { minWidth: 481, maxWidth: 1024 },
    desktop: { minWidth: 1025 }
});

// React to breakpoint changes
Breakpoints.on('change', (current) => {
    if (current === 'phone') {
        topBar.setCompact(true);
        sideMenu.hide();
    } else {
        topBar.setCompact(false);
        sideMenu.show();
    }
});

// Check current breakpoint
if (Breakpoints.is('phone')) {
    // Mobile layout
}
```

## UIContainer (Flex Layout)

```typescript
import { UIContainer } from '@gamebyte/framework';

// Horizontal row
const row = new UIContainer({
    width: 400,
    height: 60,
    direction: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: 8
});

row.addChild(btn1);
row.addChild(btn2);
row.addChild(btn3);

// Vertical column
const column = new UIContainer({
    width: 200,
    height: 400,
    direction: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 12
});
```

## Anchoring

Position elements relative to screen edges:

```typescript
import { Anchor } from '@gamebyte/framework';

// Top-right corner
Anchor.set(pauseButton, {
    anchor: 'top-right',
    offsetX: -20,
    offsetY: 20
});

// Center of screen
Anchor.set(logo, {
    anchor: 'center'
});

// Bottom, horizontally centered
Anchor.set(actionBar, {
    anchor: 'bottom-center',
    offsetY: -30
});

// Anchors update automatically on resize
```

## Grid Layout

```typescript
import { UIGrid } from '@gamebyte/framework';

const inventoryGrid = new UIGrid({
    columns: 4,
    rows: 3,
    cellWidth: 80,
    cellHeight: 80,
    gap: 8,
    padding: 16
});

// Add items
items.forEach((item, index) => {
    inventoryGrid.addChild(item, index);
});
```

## Responsive UI Example

```typescript
class ResponsiveMenu {
    private container: UIContainer;

    constructor(private layout: ResponsiveLayoutManager) {
        this.createUI();
        layout.on('resize', () => this.adaptToScreen());
    }

    private createUI(): void {
        this.container = new UIContainer({
            width: 300,
            direction: 'column',
            gap: 16,
            alignItems: 'center'
        });

        // ... add buttons
    }

    private adaptToScreen(): void {
        const width = this.layout.getWidth();

        if (width < 480) {
            // Phone: full width buttons
            this.container.setWidth(width - 40);
            this.buttons.forEach(b => b.setWidth(width - 60));
        } else if (width < 1024) {
            // Tablet: medium buttons
            this.container.setWidth(400);
            this.buttons.forEach(b => b.setWidth(350));
        } else {
            // Desktop: compact buttons
            this.container.setWidth(300);
            this.buttons.forEach(b => b.setWidth(250));
        }

        // Center container
        Anchor.set(this.container, { anchor: 'center' });
    }
}
```

## Orientation Handling

```typescript
layout.on('orientationchange', (orientation) => {
    if (orientation === 'portrait') {
        // Stack vertically
        gameUI.setLayout('vertical');
    } else {
        // Side by side
        gameUI.setLayout('horizontal');
    }
});

// Lock orientation (if supported)
layout.lockOrientation('landscape');
```

