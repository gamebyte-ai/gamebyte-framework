---
id: radio-group
title: Radio Group
description: Game-style radio button group with circular buttons and dot indicator
sidebar_position: 8
keywords: [radio, radio-group, form, selection, game-style, pixi-ui]
llm_summary: "GameRadioGroup: Game-style radio button group with circular buttons, dot indicator, vertical/horizontal layout. GameRadioColors provides DEFAULT, GREEN, ORANGE, PURPLE color schemes."
---

<!-- llm-context: game-radio, radio-buttons, single-selection, form-radio -->

import LiveDemo from '@site/src/components/LiveDemo';

# Radio Group

GameRadioGroup is a game-style radio button group with circular buttons and dot indicator for single-selection options.

## Live Demo

<LiveDemo
  src="/demos/pixi-ui-components-demo.html"
  height={600}
  title="@pixi/ui Components - Radio Group"
/>

## Features

- **Circular radio buttons** with dot indicator when selected
- **Jellybean styling** with black outer border and inner shadow
- **Vertical or horizontal layout**
- **Touch-friendly size** (minimum 28px)
- **Press feedback** animation

## Basic Usage

```typescript
import { GameRadioGroup } from '@gamebyte/framework';

const difficulty = new GameRadioGroup({
  options: [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' }
  ],
  selectedValue: 'medium',
  onChange: (value) => setDifficulty(value)
});

difficulty.setPosition(50, 100);
stage.addChild(difficulty.getContainer());
```

## Configuration Options

```typescript
interface GameRadioGroupConfig {
  options: GameRadioOption[];        // Array of options
  selectedValue?: string;            // Initially selected value
  direction?: 'vertical' | 'horizontal';  // Layout direction (default: 'vertical')
  gap?: number;                      // Space between options (default: 16)
  size?: number;                     // Circle size (default: 28, minimum: 28)
  fontSize?: number;                 // Label font size (default: 18)
  colorScheme?: GameRadioColorScheme;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

interface GameRadioOption {
  label: string;   // Display text
  value: string;   // Internal value
}

interface GameRadioColorScheme {
  circleBg: number;        // Unselected background
  circleBorder: number;    // Border color
  circleShadow: number;    // Drop shadow color
  circleSelected: number;  // Selected background
  dot: number;             // Center dot color
  highlight: number;       // Top shine effect
  text: number;            // Label text color
}
```

## Layout Direction

```typescript
// Vertical layout (default)
const verticalRadio = new GameRadioGroup({
  options: [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c' }
  ],
  direction: 'vertical',
  gap: 16
});

// Horizontal layout
const horizontalRadio = new GameRadioGroup({
  options: [
    { label: 'S', value: 'small' },
    { label: 'M', value: 'medium' },
    { label: 'L', value: 'large' }
  ],
  direction: 'horizontal',
  gap: 24
});
```

## Color Schemes

GameRadioGroup provides pre-defined color schemes:

```typescript
import { GameRadioGroup, GameRadioColors } from '@gamebyte/framework';

// Default (blue when selected)
const defaultRadio = new GameRadioGroup({
  options: [...],
  colorScheme: GameRadioColors.DEFAULT
});

// Green when selected
const greenRadio = new GameRadioGroup({
  options: [...],
  colorScheme: GameRadioColors.GREEN
});

// Orange when selected
const orangeRadio = new GameRadioGroup({
  options: [...],
  colorScheme: GameRadioColors.ORANGE
});

// Purple when selected
const purpleRadio = new GameRadioGroup({
  options: [...],
  colorScheme: GameRadioColors.PURPLE
});
```

## Methods

### Value

```typescript
// Get selected value
const selected = radioGroup.getValue();

// Set selected value programmatically
radioGroup.setValue('hard');
```

### State

```typescript
// Disable/enable
radioGroup.setDisabled(true);
radioGroup.setDisabled(false);

// Check if disabled
if (radioGroup.isDisabled()) { /* ... */ }
```

### Position

```typescript
radioGroup.setPosition(100, 200);
```

## Events

```typescript
// Selection changed
radioGroup.on('change', (value) => {
  console.log('Selected:', value);
});
```

## Game Settings Example

```typescript
import { GameRadioGroup, GamePanel } from '@gamebyte/framework';

// Difficulty selection
const difficultyRadio = new GameRadioGroup({
  options: [
    { label: 'Easy - More lives, slower enemies', value: 'easy' },
    { label: 'Normal - Balanced gameplay', value: 'normal' },
    { label: 'Hard - Fewer lives, faster enemies', value: 'hard' },
    { label: 'Nightmare - One life, maximum speed', value: 'nightmare' }
  ],
  selectedValue: gameSettings.difficulty,
  direction: 'vertical',
  gap: 20,
  onChange: (value) => {
    gameSettings.difficulty = value;
    updateDifficultyPreview(value);
  }
});

// Graphics quality
const qualityRadio = new GameRadioGroup({
  options: [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' }
  ],
  selectedValue: 'high',
  direction: 'horizontal',
  gap: 30,
  onChange: (value) => setGraphicsQuality(value)
});
```

## Visual Structure

GameRadioGroup uses a multi-layer rendering approach for each radio button:

1. **Shadow** - Creates depth effect below the circle
2. **Border** - Black outline around the circle
3. **Background** - Fill color (changes when selected)
4. **Highlight** - Subtle top shine effect (ellipse shape)
5. **Dot** - Center filled circle (visible when selected)
6. **Label** - Text positioned to the right of each circle
