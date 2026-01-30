---
id: scrollbox
title: ScrollBox
description: Game-style scrollable container with jellybean styling
sidebar_position: 13
keywords: [scrollbox, scroll, container, overflow, game-style, pixi-ui]
llm_summary: "GameScrollBox: Game-style scrollable container wrapping @pixi/ui ScrollBox with jellybean frame styling. GameScrollBoxColors provides DEFAULT, DARK, LIGHT color schemes."
---

<!-- llm-context: game-scrollbox, scrollable-container, overflow-scroll, pixi-ui-scroll -->

import LiveDemo from '@site/src/components/LiveDemo';

# ScrollBox

GameScrollBox is a game-style scrollable container with jellybean styling, wrapping the [@pixi/ui](https://github.com/pixijs/ui) ScrollBox component.

## Live Demo

<LiveDemo
  src="/demos/pixi-ui-components-demo.html"
  height={600}
  title="@pixi/ui Components - ScrollBox"
/>

## Features

- **Jellybean styling** with black outer border and inner shadow
- **Smooth scroll behavior** with easing
- **Content masking** - items outside bounds are hidden
- **Vertical, horizontal, or both** scroll directions
- **Scroll position control** - scroll to position, item, top, or bottom

## Basic Usage

```typescript
import { GameScrollBox, GameStyleButton } from '@gamebyte/framework';

const scrollBox = new GameScrollBox({
  width: 300,
  height: 400
});

// Add many items that will overflow
for (let i = 0; i < 20; i++) {
  const btn = new GameStyleButton({
    text: `Item ${i + 1}`,
    width: 260,
    height: 50
  });
  scrollBox.addItem(btn.getContainer());
}

scrollBox.setPosition(50, 50);
stage.addChild(scrollBox.getContainer());
```

## Configuration Options

```typescript
interface GameScrollBoxConfig {
  width?: number;              // Visible width (default: 300)
  height?: number;             // Visible height (default: 200)
  padding?: number;            // Content padding (default: 8)
  scrollDirection?: 'vertical' | 'horizontal' | 'both';  // Default: 'vertical'
  colorScheme?: GameScrollBoxColorScheme;
  showScrollbar?: boolean;     // Default: true
}

interface GameScrollBoxColorScheme {
  background: number;
  border: number;
  borderInner: number;
  shadow: number;
  scrollbarTrack: number;
  scrollbarThumb: number;
  scrollbarThumbHover: number;
  highlight: number;
}
```

## Scroll Direction

```typescript
// Vertical scroll (default)
const verticalScroll = new GameScrollBox({
  width: 300,
  height: 400,
  scrollDirection: 'vertical'
});

// Horizontal scroll
const horizontalScroll = new GameScrollBox({
  width: 600,
  height: 100,
  scrollDirection: 'horizontal'
});

// Both directions
const bothScroll = new GameScrollBox({
  width: 400,
  height: 400,
  scrollDirection: 'both'
});
```

## Color Schemes

GameScrollBox provides pre-defined color schemes:

```typescript
import { GameScrollBox, GameScrollBoxColors } from '@gamebyte/framework';

// Default
const defaultBox = new GameScrollBox({
  colorScheme: GameScrollBoxColors.DEFAULT
});

// Dark theme
const darkBox = new GameScrollBox({
  colorScheme: GameScrollBoxColors.DARK
});

// Light theme
const lightBox = new GameScrollBox({
  colorScheme: GameScrollBoxColors.LIGHT
});
```

## Methods

### Adding Items

```typescript
// Add item to scroll content
scrollBox.addItem(button.getContainer());
scrollBox.addItem(panel.getContainer());
```

### Removing Items

```typescript
// Remove specific item
scrollBox.removeItem(button.getContainer());
```

### Getting Items

```typescript
// Get all items
const items = scrollBox.getItems();
```

### Scroll Position

```typescript
// Get current scroll position
const scrollY = scrollBox.getScrollY();
const scrollX = scrollBox.getScrollX();

// Set scroll position
scrollBox.setScrollY(100);
scrollBox.setScrollX(50);

// Scroll to specific position
scrollBox.scrollToPosition(0, 200);

// Scroll to item by index
scrollBox.scrollToItem(5);

// Scroll to top/bottom
scrollBox.scrollToTop();
scrollBox.scrollToBottom();
```

### Position

```typescript
scrollBox.setPosition(100, 200);
```

## Events

```typescript
// Scroll position changed
scrollBox.on('scroll', ({ x, y }) => {
  console.log('Scroll position:', x, y);
});

// Item added
scrollBox.on('itemAdded', (item) => {
  console.log('Item added');
});

// Item removed
scrollBox.on('itemRemoved', (item) => {
  console.log('Item removed');
});
```

## Inventory Grid Example

```typescript
import { GameScrollBox, GameStyleButton } from '@gamebyte/framework';

class InventoryPanel {
  private scrollBox: GameScrollBox;

  constructor(container: Container) {
    this.scrollBox = new GameScrollBox({
      width: 400,
      height: 500,
      padding: 12
    });

    // Add inventory items
    const items = getPlayerInventory();
    items.forEach(item => {
      const itemButton = this.createItemButton(item);
      this.scrollBox.addItem(itemButton.getContainer());
    });

    container.addChild(this.scrollBox.getContainer());
  }

  private createItemButton(item: InventoryItem): GameStyleButton {
    return new GameStyleButton({
      text: `${item.name} x${item.quantity}`,
      width: 360,
      height: 60,
      fontSize: 18
    });
  }

  scrollToItem(index: number): void {
    this.scrollBox.scrollToItem(index);
  }
}
```

## Achievement List Example

```typescript
import { GameScrollBox, GameCheckBox, GameScrollBoxColors } from '@gamebyte/framework';

class AchievementList {
  private scrollBox: GameScrollBox;

  constructor(achievements: Achievement[]) {
    this.scrollBox = new GameScrollBox({
      width: 350,
      height: 400,
      colorScheme: GameScrollBoxColors.DARK
    });

    achievements.forEach(achievement => {
      const checkbox = new GameCheckBox({
        label: achievement.name,
        checked: achievement.unlocked,
        disabled: true // Display only
      });
      this.scrollBox.addItem(checkbox.getContainer());
    });
  }

  getContainer() {
    return this.scrollBox.getContainer();
  }
}
```

## Horizontal Gallery Example

```typescript
import { GameScrollBox } from '@gamebyte/framework';

const gallery = new GameScrollBox({
  width: 600,
  height: 200,
  scrollDirection: 'horizontal',
  padding: 16
});

// Add thumbnail images
thumbnails.forEach(texture => {
  const sprite = new Sprite(texture);
  sprite.width = 150;
  sprite.height = 150;
  gallery.addItem(sprite);
});

gallery.setPosition(100, 300);
stage.addChild(gallery.getContainer());
```

## Visual Structure

GameScrollBox uses a multi-layer rendering approach:

1. **Shadow** - Inner shadow for inset/depth effect
2. **Border** - Black stroke outline
3. **Background** - Fill color
4. **Inner border** - Subtle inner stroke for depth
5. **Content area** - Masked @pixi/ui ScrollBox for items

## Notes

- GameScrollBox wraps `@pixi/ui` ScrollBox for scroll handling
- Content is automatically masked to the visible area
- Scroll easing provides smooth movement
- Touch/drag scrolling works on mobile
- Mouse wheel scrolling works on desktop
