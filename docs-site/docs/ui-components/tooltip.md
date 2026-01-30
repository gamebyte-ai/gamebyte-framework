---
id: tooltip
title: Tooltip
description: Speech bubble style tooltip/popover component
sidebar_position: 17
keywords: [tooltip, popover, bubble, hint, info, game-style]
llm_summary: "GameTooltip: Speech bubble tooltip with customizable tail position (12 positions + none), multiple color scheme presets (CYAN, YELLOW, GREEN, RED, PURPLE, DARK, WHITE), auto-sizing."
---

<!-- llm-context: game-tooltip, speech-bubble, popover, info-hint -->

import LiveDemo from '@site/src/components/LiveDemo';

# Tooltip

GameTooltip is a speech bubble style tooltip/popover component for informational hints, status indicators, and tutorial messages.

## Live Demo

<LiveDemo
  src="/demos/game-tooltip-demo.html"
  height={500}
  title="GameTooltip Component"
/>

## Features

- **Customizable tail/pointer position** (12 positions + none)
- **Multiple color scheme presets**
- **Auto-sizing** based on text content
- **Optional drop shadow**
- **Word wrapping** with max width
- **Mobile-optimized rendering**

## Basic Usage

```typescript
import { GameTooltip, GameTooltipColors } from '@gamebyte/framework';

const tooltip = new GameTooltip({
  text: 'Coming Soon',
  tailPosition: 'bottom-left',
  colorScheme: GameTooltipColors.CYAN
});

tooltip.setPosition(100, 50);
stage.addChild(tooltip.getContainer());
```

## Configuration Options

```typescript
interface GameTooltipConfig {
  text?: string;                // Tooltip text (default: 'Tooltip')
  maxWidth?: number;            // Max width before wrapping (default: 200)
  padding?: number;             // Inner padding (default: 12)
  fontSize?: number;            // Text size (default: 16)
  fontFamily?: string;          // Font family
  colorScheme?: GameTooltipColorScheme;
  borderRadius?: number;        // Corner radius (default: 10)
  borderWidth?: number;         // Border thickness (default: 3)
  tailPosition?: TooltipTailPosition;  // Tail direction (default: 'bottom-left')
  tailSize?: number;            // Tail triangle size (default: 10)
  showShadow?: boolean;         // Show drop shadow (default: true)
  shadowOffset?: number;        // Shadow offset (default: 4)
  shadowAlpha?: number;         // Shadow opacity (default: 0.3)
}

interface GameTooltipColorScheme {
  background: number;
  border: number;
  text: number;
  textStroke?: number;   // Optional text outline
  shadow?: number;
}
```

## Tail Positions

```typescript
type TooltipTailPosition =
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'top-left' | 'top-center' | 'top-right'
  | 'left-top' | 'left-center' | 'left-bottom'
  | 'right-top' | 'right-center' | 'right-bottom'
  | 'none';
```

```typescript
// Tail pointing down (tooltip above target)
const topTooltip = new GameTooltip({
  text: 'Click here!',
  tailPosition: 'bottom-center'
});

// Tail pointing up (tooltip below target)
const bottomTooltip = new GameTooltip({
  text: 'New feature!',
  tailPosition: 'top-center'
});

// Tail pointing left (tooltip to right of target)
const rightTooltip = new GameTooltip({
  text: 'Settings',
  tailPosition: 'left-center'
});

// No tail
const noTailTooltip = new GameTooltip({
  text: 'Info',
  tailPosition: 'none'
});
```

## Color Schemes

GameTooltip provides pre-defined color schemes:

```typescript
import { GameTooltip, GameTooltipColors } from '@gamebyte/framework';

// Cyan (default - matches "Coming Soon" style)
const cyan = new GameTooltip({
  text: 'Info',
  colorScheme: GameTooltipColors.CYAN
});

// Yellow (warning)
const yellow = new GameTooltip({
  text: 'Warning!',
  colorScheme: GameTooltipColors.YELLOW
});

// Green (success)
const green = new GameTooltip({
  text: 'Success!',
  colorScheme: GameTooltipColors.GREEN
});

// Red (error)
const red = new GameTooltip({
  text: 'Error!',
  colorScheme: GameTooltipColors.RED
});

// Purple (special)
const purple = new GameTooltip({
  text: 'Premium',
  colorScheme: GameTooltipColors.PURPLE
});

// Dark (for light backgrounds)
const dark = new GameTooltip({
  text: 'Hint',
  colorScheme: GameTooltipColors.DARK
});

// White (for dark backgrounds)
const white = new GameTooltip({
  text: 'Tip',
  colorScheme: GameTooltipColors.WHITE
});
```

## Methods

### Text

```typescript
// Set text
tooltip.setText('New text').render();

// Get text
const text = tooltip.getText();
```

### Appearance

```typescript
// Change tail position
tooltip.setTailPosition('top-center');

// Change color scheme
tooltip.setColorScheme(GameTooltipColors.GREEN);
```

### Position

```typescript
tooltip.setPosition(100, 200);
const pos = tooltip.getPosition(); // { x: 100, y: 200 }
```

### Visibility

```typescript
// Show/hide
tooltip.show();
tooltip.hide();
tooltip.toggle();

// Check visibility
if (tooltip.isVisible()) { /* ... */ }

// Set visibility
tooltip.setVisible(true);
```

### Size

```typescript
// Get bubble size (without tail/shadow)
const size = tooltip.getSize(); // { width, height }

// Get total bounds (including tail and shadow)
const bounds = tooltip.getTotalBounds(); // { width, height, tailOffset }
```

## Events

```typescript
// Visibility events
tooltip.on('show', () => console.log('Tooltip shown'));
tooltip.on('hide', () => console.log('Tooltip hidden'));
```

## Hover Tooltip Example

```typescript
import { GameTooltip, GameStyleButton } from '@gamebyte/framework';

function addTooltipToButton(button: GameStyleButton, text: string) {
  const tooltip = new GameTooltip({
    text,
    tailPosition: 'bottom-center',
    showShadow: true
  });

  tooltip.hide();

  // Position above button
  const btnPos = button.getPosition();
  const btnSize = button.getSize();
  const tooltipSize = tooltip.getSize();

  tooltip.setPosition(
    btnPos.x + (btnSize.width - tooltipSize.width) / 2,
    btnPos.y - tooltipSize.height - 15
  );

  // Show on hover
  button.on('pointerover', () => tooltip.show());
  button.on('pointerout', () => tooltip.hide());

  return tooltip;
}
```

## Status Badge Example

```typescript
import { GameTooltip, GameTooltipColors } from '@gamebyte/framework';

// "Coming Soon" badge
const comingSoon = new GameTooltip({
  text: 'Coming Soon',
  tailPosition: 'bottom-left',
  colorScheme: GameTooltipColors.CYAN
});

// "New!" badge
const newBadge = new GameTooltip({
  text: 'New!',
  tailPosition: 'none',
  colorScheme: GameTooltipColors.GREEN,
  fontSize: 14,
  padding: 8
});

// "Premium" indicator
const premium = new GameTooltip({
  text: '★ Premium',
  tailPosition: 'left-center',
  colorScheme: GameTooltipColors.PURPLE
});
```

## Tutorial Hint Example

```typescript
import { GameTooltip, GameTooltipColors } from '@gamebyte/framework';

class TutorialManager {
  private currentHint: GameTooltip | null = null;

  showHint(text: string, targetX: number, targetY: number, position: TooltipTailPosition): void {
    // Remove previous hint
    if (this.currentHint) {
      this.currentHint.destroy();
    }

    this.currentHint = new GameTooltip({
      text,
      tailPosition: position,
      colorScheme: GameTooltipColors.YELLOW,
      maxWidth: 250
    });

    // Position relative to target
    this.currentHint.setPosition(targetX, targetY);
    stage.addChild(this.currentHint.getContainer());
  }

  hideHint(): void {
    if (this.currentHint) {
      this.currentHint.hide();
    }
  }
}
```

## Visual Structure

GameTooltip uses a multi-layer rendering approach:

1. **Shadow layer** - Optional drop shadow offset from main bubble
2. **Border layer** - Colored outline (drawn as larger shape behind)
3. **Background** - Main fill color with rounded corners
4. **Tail** - Triangle pointer drawn as part of the path
5. **Text** - Centered text with optional stroke
