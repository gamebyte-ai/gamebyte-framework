---
id: checkbox
title: Checkbox
description: Game-style checkbox component with jellybean styling and checkmark animation
sidebar_position: 7
keywords: [checkbox, toggle, form, check, game-style, pixi-ui]
llm_summary: "GameCheckBox: Game-style checkbox with jellybean styling, checkmark animation, optional label. GameCheckBoxColors provides DEFAULT, GREEN, ORANGE, PURPLE, RED color schemes."
---

<!-- llm-context: game-checkbox, toggle-check, form-checkbox, checkmark-animation -->

import LiveDemo from '@site/src/components/LiveDemo';

# Checkbox

GameCheckBox is a game-style checkbox component with jellybean styling and checkmark animation.

## Live Demo

<LiveDemo
  src="/demos/pixi-ui-components-demo.html"
  height={600}
  title="@pixi/ui Components - Checkbox"
/>

## Features

- **Jellybean styling** with black outer border and inner shadow
- **Checkmark animation** on toggle
- **Optional text label**
- **Touch-friendly size** (minimum 32px)
- **Press feedback** animation

## Basic Usage

```typescript
import { GameCheckBox } from '@gamebyte/framework';

const checkbox = new GameCheckBox({
  label: 'Enable Sound',
  checked: true,
  onChange: (checked) => setSoundEnabled(checked)
});

checkbox.setPosition(50, 100);
stage.addChild(checkbox.getContainer());
```

## Configuration Options

```typescript
interface GameCheckBoxConfig {
  label?: string;           // Optional text label
  checked?: boolean;        // Initial checked state (default: false)
  size?: number;            // Box size (default: 32, minimum: 32)
  fontSize?: number;        // Label font size (default: 18)
  colorScheme?: GameCheckBoxColorScheme;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

interface GameCheckBoxColorScheme {
  boxBg: number;           // Unchecked background
  boxBorder: number;       // Border color
  boxShadow: number;       // Drop shadow color
  boxChecked: number;      // Checked background
  checkmark: number;       // Checkmark color
  highlight: number;       // Top shine effect
  text: number;            // Label text color
}
```

## Color Schemes

GameCheckBox provides pre-defined color schemes:

```typescript
import { GameCheckBox, GameCheckBoxColors } from '@gamebyte/framework';

// Default (blue when checked)
const defaultCb = new GameCheckBox({
  label: 'Default',
  colorScheme: GameCheckBoxColors.DEFAULT
});

// Green when checked
const greenCb = new GameCheckBox({
  label: 'Success',
  colorScheme: GameCheckBoxColors.GREEN
});

// Orange when checked
const orangeCb = new GameCheckBox({
  label: 'Warning',
  colorScheme: GameCheckBoxColors.ORANGE
});

// Purple when checked
const purpleCb = new GameCheckBox({
  label: 'Special',
  colorScheme: GameCheckBoxColors.PURPLE
});

// Red when checked
const redCb = new GameCheckBox({
  label: 'Danger',
  colorScheme: GameCheckBoxColors.RED
});
```

## Methods

### State

```typescript
// Toggle the checkbox
checkbox.toggle();

// Check if checked
if (checkbox.isChecked()) { /* ... */ }

// Set checked state programmatically
checkbox.setChecked(true);
checkbox.setChecked(false);
```

### Disabled

```typescript
// Disable/enable
checkbox.setDisabled(true);
checkbox.setDisabled(false);

// Check if disabled
if (checkbox.isDisabled()) { /* ... */ }
```

### Position

```typescript
checkbox.setPosition(100, 200);
```

## Events

```typescript
// State changed
checkbox.on('change', (checked) => {
  console.log('Checkbox is now:', checked ? 'checked' : 'unchecked');
});
```

## Settings Example

```typescript
import { GameCheckBox, GameList } from '@gamebyte/framework';

// Create settings list
const settingsList = new GameList({ direction: 'vertical', gap: 16 });

// Sound settings
const soundCb = new GameCheckBox({
  label: 'Sound Effects',
  checked: settings.soundEnabled,
  onChange: (val) => settings.soundEnabled = val
});

const musicCb = new GameCheckBox({
  label: 'Background Music',
  checked: settings.musicEnabled,
  onChange: (val) => settings.musicEnabled = val
});

const vibrationCb = new GameCheckBox({
  label: 'Vibration',
  checked: settings.vibrationEnabled,
  onChange: (val) => settings.vibrationEnabled = val
});

// Add to list
settingsList.addItem(soundCb.getContainer());
settingsList.addItem(musicCb.getContainer());
settingsList.addItem(vibrationCb.getContainer());

stage.addChild(settingsList.getContainer());
```

## Visual Structure

GameCheckBox uses a multi-layer rendering approach:

1. **Shadow** - Creates depth effect below the box
2. **Border** - Black outline around the box
3. **Background** - Fill color (changes when checked)
4. **Highlight** - Subtle top shine effect
5. **Checkmark** - Animated path drawn when checked
6. **Label** - Optional text positioned to the right
