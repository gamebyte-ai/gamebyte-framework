---
id: slider
title: Slider
description: Game-style slider component for volume, progress, and numeric input
sidebar_position: 11
keywords: [slider, range, volume, progress, form, game-style]
llm_summary: "GameSlider: Game-style slider with gradient track, fill indicator, glossy draggable thumb. GameSliderColors provides DEFAULT (blue), GREEN, ORANGE, PURPLE, RED color schemes."
---

<!-- llm-context: game-slider, range-input, volume-control, progress-slider -->

import LiveDemo from '@site/src/components/LiveDemo';

# Slider

GameSlider is a polished game-style slider component for volume controls, progress indicators, and numeric input.

## Live Demo

<LiveDemo
  src="/demos/pixi-ui-components-demo.html"
  height={600}
  title="@pixi/ui Components - Slider"
/>

## Features

- **Gradient track** with depth effect
- **Fill indicator** showing current value
- **Glossy draggable thumb** with specular highlight
- **Smooth drag interaction**
- **Step support** for discrete values
- **Native FillGradient** using Pixi.js v8
- **Touch-friendly size**

## Basic Usage

```typescript
import { GameSlider } from '@gamebyte/framework';

const volumeSlider = new GameSlider({
  min: 0,
  max: 100,
  value: 75,
  onChange: (value) => setVolume(value / 100)
});

volumeSlider.setPosition(50, 100);
stage.addChild(volumeSlider.getContainer());
```

## Configuration Options

```typescript
interface GameSliderConfig {
  width?: number;              // Default: 200
  height?: number;             // Default: 36
  min?: number;                // Minimum value (default: 0)
  max?: number;                // Maximum value (default: 100)
  value?: number;              // Initial value (default: 50)
  step?: number;               // Step increment (default: 1)
  colorScheme?: GameSliderColorScheme;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

interface GameSliderColorScheme {
  trackTop: number;        // Track gradient top
  trackBottom: number;     // Track gradient bottom
  fillTop: number;         // Fill gradient top
  fillBottom: number;      // Fill gradient bottom
  thumbTop: number;        // Thumb gradient top
  thumbBottom: number;     // Thumb gradient bottom
  border: number;          // Border color
  borderDepth: number;     // Border depth/shadow color
}
```

## Color Schemes

GameSlider provides pre-defined color schemes:

```typescript
import { GameSlider, GameSliderColors } from '@gamebyte/framework';

// Default (blue fill)
const defaultSlider = new GameSlider({
  colorScheme: GameSliderColors.DEFAULT
});

// Green fill
const greenSlider = new GameSlider({
  colorScheme: GameSliderColors.GREEN
});

// Orange fill
const orangeSlider = new GameSlider({
  colorScheme: GameSliderColors.ORANGE
});

// Purple fill
const purpleSlider = new GameSlider({
  colorScheme: GameSliderColors.PURPLE
});

// Red fill
const redSlider = new GameSlider({
  colorScheme: GameSliderColors.RED
});
```

## Methods

### Value

```typescript
// Get current value
const volume = slider.getValue();

// Set value programmatically
slider.setValue(50);
```

### State

```typescript
// Disable/enable
slider.setDisabled(true);
slider.setDisabled(false);

// Check if disabled
if (slider.isDisabled()) { /* ... */ }
```

### Position & Size

```typescript
slider.setPosition(100, 200);
const pos = slider.getPosition(); // { x: 100, y: 200 }
const size = slider.getSize();    // { width: 200, height: 36 }
```

### Appearance

```typescript
// Change color scheme at runtime
slider.setColorScheme(GameSliderColors.GREEN);
```

## Events

```typescript
// Value changed (fires during drag and on release)
slider.on('change', (value) => {
  console.log('Slider value:', value);
});
```

## Step Values

Use `step` for discrete value increments:

```typescript
// Slider that snaps to values: 0, 25, 50, 75, 100
const qualitySlider = new GameSlider({
  min: 0,
  max: 100,
  step: 25,
  value: 50,
  onChange: (value) => {
    const quality = ['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'][value / 25];
    setQuality(quality);
  }
});

// Slider with decimal steps: 0.0, 0.1, 0.2, ... 1.0
const opacitySlider = new GameSlider({
  min: 0,
  max: 1,
  step: 0.1,
  value: 1,
  onChange: (value) => setOpacity(value)
});
```

## Audio Settings Example

```typescript
import { GameSlider, GameSliderColors, GameList } from '@gamebyte/framework';

// Master volume
const masterSlider = new GameSlider({
  min: 0,
  max: 100,
  value: audioSettings.masterVolume,
  colorScheme: GameSliderColors.DEFAULT,
  onChange: (value) => {
    audioSettings.masterVolume = value;
    audioManager.setMasterVolume(value / 100);
  }
});

// Music volume
const musicSlider = new GameSlider({
  min: 0,
  max: 100,
  value: audioSettings.musicVolume,
  colorScheme: GameSliderColors.GREEN,
  onChange: (value) => {
    audioSettings.musicVolume = value;
    audioManager.setMusicVolume(value / 100);
  }
});

// SFX volume
const sfxSlider = new GameSlider({
  min: 0,
  max: 100,
  value: audioSettings.sfxVolume,
  colorScheme: GameSliderColors.ORANGE,
  onChange: (value) => {
    audioSettings.sfxVolume = value;
    audioManager.setSfxVolume(value / 100);
  }
});
```

## Visual Structure

GameSlider uses a multi-layer rendering approach:

1. **Depth layer** - Extends below for 3D effect
2. **Border** - Rounded rectangle border
3. **Track** - Background gradient (gray by default)
4. **Fill** - Progress fill gradient (colored)
5. **Inner shadow** - Subtle shadow on track
6. **Thumb shadow** - Drop shadow under thumb
7. **Thumb base** - Darker color for bottom
8. **Thumb gradient** - Lighter color for top
9. **Specular highlight** - Bright spot for gloss
10. **Rim light** - Top edge highlight

## Custom Color Scheme

```typescript
const customScheme: GameSliderColorScheme = {
  trackTop: 0x4A5660,        // Gray track top
  trackBottom: 0x3A4650,     // Gray track bottom
  fillTop: 0x00BCD4,         // Cyan fill top
  fillBottom: 0x0097A7,      // Cyan fill bottom
  thumbTop: 0xFFFFFF,        // White thumb top
  thumbBottom: 0xE8E8E8,     // Light gray thumb bottom
  border: 0x3D4F5F,          // Border color
  borderDepth: 0x2A3640,     // Border depth
};

const customSlider = new GameSlider({
  colorScheme: customScheme,
  value: 75
});
```
