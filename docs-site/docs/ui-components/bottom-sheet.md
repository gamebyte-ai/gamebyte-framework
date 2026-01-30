---
id: bottom-sheet
title: Bottom Sheet
description: Slide-up panel from bottom with drag-to-close support
sidebar_position: 19
keywords: [bottom-sheet, drawer, slide-up, panel, mobile, game-style]
llm_summary: "GameBottomSheet: Slide-up panel with drag handle, swipe down to close, height options (fixed, auto, half, full). Extends GamePanel with bottom-sheet positioning and animations."
---

<!-- llm-context: game-bottom-sheet, slide-up-drawer, mobile-sheet, swipe-panel -->

import LiveDemo from '@site/src/components/LiveDemo';

# Bottom Sheet

GameBottomSheet is a slide-up panel from the bottom edge, commonly used in mobile games for menus, selections, and information displays.

## Live Demo

<LiveDemo
  src="/demos/game-bottom-sheet-demo.html"
  height={600}
  title="GameBottomSheet Component"
/>

## Features

- **Slides up from bottom** of screen
- **Drag handle** for visual affordance
- **Swipe down to close** gesture
- **Height options**: fixed pixel, auto, half screen, full screen
- **Top-only rounded corners** for native feel
- **Extends GamePanel** with all panel features

## Basic Usage

```typescript
import { GameBottomSheet, PanelManager } from '@gamebyte/framework';

const sheet = new GameBottomSheet({
  height: 'half',
  title: 'Select Item',
  showHandle: true,
  dragToClose: true
});

// Add content
const button = new GameStyleButton({ text: 'Option 1', width: 280 });
sheet.addContent(button.getContainer());

// Show using PanelManager
const panelManager = new PanelManager(stage, app.screen.width, app.screen.height);
panelManager.show(sheet);
```

## Configuration Options

GameBottomSheet extends `GamePanelConfig` with bottom-sheet specific options:

```typescript
interface GameBottomSheetConfig extends Omit<GamePanelConfig, 'height'> {
  height?: BottomSheetHeight;      // Height option (default: 'auto')
  showHandle?: boolean;            // Show drag handle (default: true)
  dragToClose?: boolean;           // Enable swipe to close (default: true)
  animationDuration?: number;      // Animation duration in ms (default: 300)
}

type BottomSheetHeight = number | 'auto' | 'half' | 'full';
```

### Height Options

```typescript
// Fixed pixel height
const fixedSheet = new GameBottomSheet({
  height: 400  // 400 pixels tall
});

// Auto height (default: 400px)
const autoSheet = new GameBottomSheet({
  height: 'auto'
});

// Half screen height (50%)
const halfSheet = new GameBottomSheet({
  height: 'half'
});

// Full screen height (90%)
const fullSheet = new GameBottomSheet({
  height: 'full'
});
```

## Drag Handle

The drag handle is a visual indicator that the sheet can be dragged:

```typescript
// With handle (default)
const withHandle = new GameBottomSheet({
  showHandle: true,
  dragToClose: true
});

// Without handle
const noHandle = new GameBottomSheet({
  showHandle: false,
  dragToClose: false  // Usually disable drag too
});
```

## Animation

GameBottomSheet slides in from the bottom:

```typescript
// Faster animation
const fastSheet = new GameBottomSheet({
  height: 'half',
  animationDuration: 200
});

// Slower animation
const slowSheet = new GameBottomSheet({
  height: 'half',
  animationDuration: 500
});
```

Animation details:
- **Show**: Slides up from below screen with `easeOutCubic`
- **Hide**: Slides down with `easeInCubic`
- **Snap back**: If dragged but not far enough to close

## Methods

### Show/Hide

```typescript
// Show sheet
panelManager.show(sheet);

// Close sheet
sheet.close();
```

### Content

```typescript
// Add content
sheet.addContent(myComponent);

// Clear content
sheet.clearContent();
```

## Item Selection Sheet Example

```typescript
import { GameBottomSheet, GameList, GameStyleButton } from '@gamebyte/framework';

function showItemPicker(
  items: Item[],
  onSelect: (item: Item) => void
): void {
  const sheet = new GameBottomSheet({
    height: 'half',
    title: 'Select Item',
    showHandle: true
  });

  const list = new GameList({ direction: 'vertical', gap: 12 });

  items.forEach(item => {
    const btn = new GameStyleButton({
      text: item.name,
      width: sheet.config.width - 40,
      height: 60
    });
    btn.on('click', () => {
      onSelect(item);
      sheet.close();
    });
    list.addItem(btn.getContainer());
  });

  sheet.addContent(list.getContainer());
  panelManager.show(sheet);
}

// Usage
showItemPicker(weapons, (weapon) => {
  player.equip(weapon);
});
```

## Level Complete Sheet Example

```typescript
import {
  GameBottomSheet,
  GameStyleButton,
  GameStyleColors
} from '@gamebyte/framework';

function showLevelComplete(score: number, stars: number): void {
  const sheet = new GameBottomSheet({
    height: 400,
    title: '🎉 Level Complete!',
    showHandle: false,
    dragToClose: false,
    closeOnOverlay: false
  });

  // Stars display
  const starsText = graphics().createText('⭐'.repeat(stars), {
    fontSize: 48
  });
  starsText.x = 100;
  starsText.y = 20;

  // Score
  const scoreText = graphics().createText(`Score: ${score}`, {
    fontSize: 28,
    fill: 0xFFD700
  });
  scoreText.x = 120;
  scoreText.y = 90;

  // Buttons
  const nextBtn = new GameStyleButton({
    text: 'Next Level',
    width: 200,
    height: 60,
    colorScheme: GameStyleColors.GREEN_BUTTON
  });
  nextBtn.setPosition(90, 160);
  nextBtn.on('click', () => {
    sheet.close();
    loadNextLevel();
  });

  const replayBtn = new GameStyleButton({
    text: 'Replay',
    width: 140,
    height: 50,
    colorScheme: GameStyleColors.BLUE_BUTTON
  });
  replayBtn.setPosition(120, 240);
  replayBtn.on('click', () => {
    sheet.close();
    replayLevel();
  });

  sheet.addContent(starsText);
  sheet.addContent(scoreText);
  sheet.addContent(nextBtn.getContainer());
  sheet.addContent(replayBtn.getContainer());

  panelManager.show(sheet);
}
```

## Settings Sheet Example

```typescript
import {
  GameBottomSheet,
  GameToggle,
  GameSlider,
  GameRadioGroup
} from '@gamebyte/framework';

class SettingsSheet extends GameBottomSheet {
  constructor() {
    super({
      height: 'half',
      title: 'Settings',
      showHandle: true,
      onClose: () => this.saveSettings()
    });

    this.buildUI();
  }

  private buildUI(): void {
    let y = 0;

    // Sound toggle row
    const soundLabel = graphics().createText('Sound', { fontSize: 18 });
    soundLabel.y = y;

    const soundToggle = new GameToggle({
      value: settings.sound,
      onChange: (val) => settings.sound = val
    });
    soundToggle.setPosition(250, y);

    y += 50;

    // Music toggle row
    const musicLabel = graphics().createText('Music', { fontSize: 18 });
    musicLabel.y = y;

    const musicToggle = new GameToggle({
      value: settings.music,
      onChange: (val) => settings.music = val
    });
    musicToggle.setPosition(250, y);

    y += 60;

    // Difficulty selection
    const diffLabel = graphics().createText('Difficulty', { fontSize: 18 });
    diffLabel.y = y;

    y += 30;

    const diffRadio = new GameRadioGroup({
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Normal', value: 'normal' },
        { label: 'Hard', value: 'hard' }
      ],
      selectedValue: settings.difficulty,
      direction: 'horizontal',
      gap: 20,
      onChange: (val) => settings.difficulty = val
    });
    diffRadio.setPosition(0, y);

    // Add all content
    this.addContent(soundLabel);
    this.addContent(soundToggle.getContainer());
    this.addContent(musicLabel);
    this.addContent(musicToggle.getContainer());
    this.addContent(diffLabel);
    this.addContent(diffRadio.getContainer());
  }

  private saveSettings(): void {
    saveSettingsToStorage(settings);
  }
}
```

## Drag-to-Close Behavior

When `dragToClose` is enabled:
- Drag from the handle area (top 50px)
- Drag down to pull the sheet
- Release after dragging 100+ pixels to close
- Release before 100px to snap back

```typescript
// Disable drag to close for important content
const importantSheet = new GameBottomSheet({
  height: 'half',
  dragToClose: false,  // Must use close button or action
  closeOnOverlay: false
});
```

## Visual Structure

GameBottomSheet uses specific styling:

1. **Overlay** - Semi-transparent background
2. **Panel container** - Full width at bottom
3. **Background** - Top-only rounded corners (extends below screen)
4. **Drag handle** - Centered pill shape at top
5. **Title** - Positioned below handle
6. **Close button** - Top right (if enabled)
7. **Content area** - Scrollable area below title

## Notes

- Bottom sheet spans full screen width
- Top corners are rounded, bottom extends below screen
- Swipe gesture only works from handle area
- Combine with GameScrollBox for long content
- Use `height: 'full'` for content-heavy sheets
