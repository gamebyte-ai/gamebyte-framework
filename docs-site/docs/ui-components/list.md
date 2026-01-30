---
id: list
title: List
description: Layout component for automatic vertical or horizontal arrangement
sidebar_position: 12
keywords: [list, layout, vertical, horizontal, stack, pixi-ui]
llm_summary: "GameList: Layout wrapper around @pixi/ui List for automatic child arrangement with configurable gap and direction. Supports vertical and horizontal layouts."
---

<!-- llm-context: game-list, layout-stack, auto-layout, pixi-ui-list -->

import LiveDemo from '@site/src/components/LiveDemo';

# List

GameList is a layout component that automatically arranges child elements in a vertical or horizontal stack, wrapping the [@pixi/ui](https://github.com/pixijs/ui) List component.

## Live Demo

<LiveDemo
  src="/demos/pixi-ui-components-demo.html"
  height={600}
  title="@pixi/ui Components - List"
/>

## Features

- **Automatic layout** with configurable gap
- **Vertical or horizontal** arrangement
- **Dynamic add/remove** items
- **Wraps @pixi/ui List** for reliable layout logic

## Basic Usage

```typescript
import { GameList, GameStyleButton, GameStyleColors } from '@gamebyte/framework';

// Create a vertical button menu
const menu = new GameList({ direction: 'vertical', gap: 12 });

const playBtn = new GameStyleButton({
  text: 'Play',
  colorScheme: GameStyleColors.YELLOW_BUTTON
});

const settingsBtn = new GameStyleButton({
  text: 'Settings',
  colorScheme: GameStyleColors.BLUE_BUTTON
});

const quitBtn = new GameStyleButton({
  text: 'Quit',
  colorScheme: GameStyleColors.RED_BUTTON
});

menu.addItem(playBtn.getContainer());
menu.addItem(settingsBtn.getContainer());
menu.addItem(quitBtn.getContainer());

menu.setPosition(100, 100);
stage.addChild(menu.getContainer());
```

## Configuration Options

```typescript
interface GameListConfig {
  direction?: 'vertical' | 'horizontal';  // Layout direction (default: 'vertical')
  gap?: number;                            // Space between items (default: 8)
  padding?: number;                        // Padding around content (default: 0)
}
```

## Layout Direction

```typescript
// Vertical list (default)
const verticalList = new GameList({
  direction: 'vertical',
  gap: 16
});

// Horizontal list
const horizontalList = new GameList({
  direction: 'horizontal',
  gap: 24
});
```

## Methods

### Adding Items

```typescript
// Add item to end of list
list.addItem(button.getContainer());
list.addItem(panel.getContainer());

// Items are automatically positioned
```

### Removing Items

```typescript
// Remove specific item
list.removeItem(button.getContainer());
```

### Getting Items

```typescript
// Get all items
const items = list.getItems();

// Get item count
const count = list.getItemCount();
```

### Clearing

```typescript
// Remove all items
list.clear();
```

### Gap

```typescript
// Change gap at runtime
list.setGap(20);
```

### Position

```typescript
list.setPosition(100, 200);
```

## Events

```typescript
// Item added
list.on('itemAdded', (item) => {
  console.log('Item added:', item);
});

// Item removed
list.on('itemRemoved', (item) => {
  console.log('Item removed:', item);
});

// List cleared
list.on('cleared', () => {
  console.log('List cleared');
});
```

## Menu Example

```typescript
import { GameList, GameStyleButton, GameStyleColors } from '@gamebyte/framework';

class MainMenu {
  private list: GameList;

  constructor(stage: Container) {
    this.list = new GameList({ direction: 'vertical', gap: 16 });

    const buttons = [
      { text: 'New Game', color: GameStyleColors.YELLOW_BUTTON, action: () => this.startGame() },
      { text: 'Continue', color: GameStyleColors.GREEN_BUTTON, action: () => this.continueGame() },
      { text: 'Settings', color: GameStyleColors.BLUE_BUTTON, action: () => this.openSettings() },
      { text: 'Credits', color: GameStyleColors.PURPLE_BUTTON, action: () => this.showCredits() },
      { text: 'Exit', color: GameStyleColors.RED_BUTTON, action: () => this.exitGame() }
    ];

    buttons.forEach(({ text, color, action }) => {
      const btn = new GameStyleButton({
        text,
        width: 200,
        height: 60,
        colorScheme: color
      });
      btn.on('click', action);
      this.list.addItem(btn.getContainer());
    });

    // Center the menu
    this.list.setPosition(
      (stage.width - 200) / 2,
      (stage.height - buttons.length * 76) / 2
    );

    stage.addChild(this.list.getContainer());
  }
}
```

## Horizontal Toolbar Example

```typescript
import { GameList, GameStyleButton } from '@gamebyte/framework';

// Create horizontal toolbar
const toolbar = new GameList({ direction: 'horizontal', gap: 8 });

// Add tool buttons
const tools = ['Sword', 'Shield', 'Potion', 'Map'];
tools.forEach(tool => {
  const btn = new GameStyleButton({
    text: tool,
    width: 80,
    height: 40,
    fontSize: 14
  });
  toolbar.addItem(btn.getContainer());
});

toolbar.setPosition(10, 10);
stage.addChild(toolbar.getContainer());
```

## Dynamic List Example

```typescript
import { GameList, GameCheckBox } from '@gamebyte/framework';

class TaskList {
  private list: GameList;
  private tasks: Map<string, GameCheckBox> = new Map();

  constructor(container: Container) {
    this.list = new GameList({ direction: 'vertical', gap: 12 });
    container.addChild(this.list.getContainer());
  }

  addTask(id: string, label: string): void {
    const checkbox = new GameCheckBox({
      label,
      checked: false,
      onChange: (checked) => this.onTaskToggle(id, checked)
    });

    this.tasks.set(id, checkbox);
    this.list.addItem(checkbox.getContainer());
  }

  removeTask(id: string): void {
    const checkbox = this.tasks.get(id);
    if (checkbox) {
      this.list.removeItem(checkbox.getContainer());
      checkbox.destroy();
      this.tasks.delete(id);
    }
  }

  private onTaskToggle(id: string, completed: boolean): void {
    console.log(`Task ${id} is now ${completed ? 'completed' : 'pending'}`);
  }
}
```

## Notes

- GameList is a thin wrapper around `@pixi/ui` List
- Items are positioned automatically when added
- Removing items re-flows the remaining items
- Use `gap` to control spacing between items
- For scrollable lists, wrap GameList inside GameScrollBox
