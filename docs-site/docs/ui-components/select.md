---
id: select
title: Select
description: Game-style dropdown select component with jellybean styling
sidebar_position: 9
keywords: [select, dropdown, picker, form, game-style, pixi-ui]
llm_summary: "GameSelect: Game-style dropdown select with jellybean trigger button, dropdown panel, hover/selection states. GameSelectColors provides DEFAULT, GREEN, PURPLE, ORANGE color schemes."
---

<!-- llm-context: game-select, dropdown-picker, form-select, combo-box -->

import LiveDemo from '@site/src/components/LiveDemo';

# Select

GameSelect is a game-style dropdown select component with jellybean styling for single-choice selection.

## Live Demo

<LiveDemo
  src="/demos/pixi-ui-components-demo.html"
  height={600}
  title="@pixi/ui Components - Select"
/>

## Features

- **Jellybean trigger button** matching GameStyleButton visual style
- **Dropdown panel** with game-style background and shadow
- **Item hover and selection states**
- **Arrow indicator** showing dropdown direction
- **Click-outside to close** using backdrop approach
- **Z-index management** - dropdown appears above other UI elements

## Basic Usage

```typescript
import { GameSelect } from '@gamebyte/framework';

const levelSelect = new GameSelect({
  placeholder: 'Select Level',
  options: [
    { label: 'Level 1', value: '1' },
    { label: 'Level 2', value: '2' },
    { label: 'Level 3', value: '3' }
  ],
  onChange: (value) => loadLevel(value)
});

levelSelect.setPosition(50, 100);
stage.addChild(levelSelect.getContainer());
```

## Configuration Options

```typescript
interface GameSelectConfig {
  width?: number;              // Default: 200
  height?: number;             // Default: 44 (minimum 44 for touch)
  placeholder?: string;        // Text when nothing selected
  options?: GameSelectOption[];
  selectedValue?: string;      // Initially selected value
  fontSize?: number;           // Default: 18
  colorScheme?: GameSelectColorScheme;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

interface GameSelectOption {
  label: string;   // Display text
  value: string;   // Internal value
}

interface GameSelectColorScheme {
  triggerBg: number;        // Trigger button background
  triggerBorder: number;    // Trigger border
  triggerShadow: number;    // Trigger drop shadow
  triggerHighlight: number; // Trigger top shine
  dropdownBg: number;       // Dropdown panel background
  dropdownBorder: number;   // Dropdown border
  dropdownShadow: number;   // Dropdown shadow
  itemHover: number;        // Item hover background
  itemSelected: number;     // Selected item background
  text: number;             // Text color
  arrow: number;            // Arrow indicator color
}
```

## Color Schemes

GameSelect provides pre-defined color schemes:

```typescript
import { GameSelect, GameSelectColors } from '@gamebyte/framework';

// Default (blue)
const defaultSelect = new GameSelect({
  options: [...],
  colorScheme: GameSelectColors.DEFAULT
});

// Green
const greenSelect = new GameSelect({
  options: [...],
  colorScheme: GameSelectColors.GREEN
});

// Purple
const purpleSelect = new GameSelect({
  options: [...],
  colorScheme: GameSelectColors.PURPLE
});

// Orange
const orangeSelect = new GameSelect({
  options: [...],
  colorScheme: GameSelectColors.ORANGE
});
```

## Methods

### Value

```typescript
// Get selected value
const selected = select.getValue();

// Set selected value programmatically
select.setValue('level-3');
```

### Options

```typescript
// Update options dynamically
select.setOptions([
  { label: 'New Option 1', value: '1' },
  { label: 'New Option 2', value: '2' }
]);
```

### Open/Close

```typescript
// Open dropdown
select.open();

// Close dropdown
select.close();

// Check if open
if (select.isOpen()) { /* ... */ }
```

### State

```typescript
// Disable/enable
select.setDisabled(true);
select.setDisabled(false);

// Check if disabled
if (select.isDisabled()) { /* ... */ }
```

### Position

```typescript
select.setPosition(100, 200);
```

## Events

```typescript
// Selection changed
select.on('change', (value) => {
  console.log('Selected:', value);
});

// Dropdown opened
select.on('open', () => {
  console.log('Dropdown opened');
});

// Dropdown closed
select.on('close', () => {
  console.log('Dropdown closed');
});
```

## Character Selection Example

```typescript
import { GameSelect, GamePanel } from '@gamebyte/framework';

// Character class selector
const classSelect = new GameSelect({
  placeholder: 'Choose Class',
  width: 250,
  options: [
    { label: '⚔️ Warrior', value: 'warrior' },
    { label: '🏹 Archer', value: 'archer' },
    { label: '🔮 Mage', value: 'mage' },
    { label: '🗡️ Rogue', value: 'rogue' }
  ],
  onChange: (value) => {
    updateCharacterPreview(value);
    showClassStats(value);
  }
});

// Difficulty selector
const difficultySelect = new GameSelect({
  placeholder: 'Difficulty',
  width: 200,
  options: [
    { label: 'Easy', value: 'easy' },
    { label: 'Normal', value: 'normal' },
    { label: 'Hard', value: 'hard' }
  ],
  selectedValue: 'normal',
  onChange: (value) => gameConfig.difficulty = value
});
```

## Z-Index Behavior

GameSelect automatically brings itself to the front when the dropdown opens, ensuring the dropdown panel appears above other UI elements. When closed, it returns to its normal position in the display list.

```typescript
// The dropdown will appear above buttons and other UI
const select = new GameSelect({ options: [...] });
const button = new GameStyleButton({ text: 'Click Me' });

// Even if button is added after select, dropdown still appears on top
container.addChild(select.getContainer());
container.addChild(button.getContainer());
```

## Click-Outside Behavior

GameSelect uses an invisible backdrop to detect clicks outside the dropdown. When the dropdown is open and you click anywhere outside it, the dropdown automatically closes.
