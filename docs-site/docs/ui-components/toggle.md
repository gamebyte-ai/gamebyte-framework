---
id: toggle
title: Toggle
description: Game-style toggle switch component with gradient track and glossy thumb
sidebar_position: 10
keywords: [toggle, switch, on-off, form, game-style]
llm_summary: "GameToggle: Game-style toggle switch with gradient track, glossy thumb, smooth animation. GameToggleColors provides DEFAULT (green), BLUE, ORANGE, PURPLE color schemes."
---

<!-- llm-context: game-toggle, switch-control, on-off-toggle, settings-toggle -->

import LiveDemo from '@site/src/components/LiveDemo';

# Toggle

GameToggle is a polished game-style toggle switch component with gradient track and glossy thumb.

## Live Demo

<LiveDemo
  src="/demos/pixi-ui-components-demo.html"
  height={600}
  title="@pixi/ui Components - Toggle"
/>

## Features

- **Gradient track** with depth effect
- **Glossy thumb** with specular highlight and rim light
- **Smooth press animation** - thumb scales on press
- **Native FillGradient** using Pixi.js v8
- **Touch-friendly size**

## Basic Usage

```typescript
import { GameToggle } from '@gamebyte/framework';

const musicToggle = new GameToggle({
  value: true,
  onChange: (value) => setMusicEnabled(value)
});

musicToggle.setPosition(50, 100);
stage.addChild(musicToggle.getContainer());
```

## Configuration Options

```typescript
interface GameToggleConfig {
  width?: number;              // Default: 70
  height?: number;             // Default: 36
  value?: boolean;             // Initial state (default: false)
  colorScheme?: GameToggleColorScheme;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}

interface GameToggleColorScheme {
  trackOnTop: number;      // Track gradient top (when ON)
  trackOnBottom: number;   // Track gradient bottom (when ON)
  trackOffTop: number;     // Track gradient top (when OFF)
  trackOffBottom: number;  // Track gradient bottom (when OFF)
  thumbTop: number;        // Thumb gradient top
  thumbBottom: number;     // Thumb gradient bottom
  border: number;          // Border color
  borderDepth: number;     // Border depth/shadow color
}
```

## Color Schemes

GameToggle provides pre-defined color schemes:

```typescript
import { GameToggle, GameToggleColors } from '@gamebyte/framework';

// Default (green when ON)
const defaultToggle = new GameToggle({
  colorScheme: GameToggleColors.DEFAULT
});

// Blue when ON
const blueToggle = new GameToggle({
  colorScheme: GameToggleColors.BLUE
});

// Orange when ON
const orangeToggle = new GameToggle({
  colorScheme: GameToggleColors.ORANGE
});

// Purple when ON
const purpleToggle = new GameToggle({
  colorScheme: GameToggleColors.PURPLE
});
```

## Methods

### Value

```typescript
// Toggle the switch
toggle.toggle();

// Get current value
const isOn = toggle.getValue();

// Set value programmatically
toggle.setValue(true);
toggle.setValue(false);
```

### State

```typescript
// Disable/enable
toggle.setDisabled(true);
toggle.setDisabled(false);

// Check if disabled
if (toggle.isDisabled()) { /* ... */ }
```

### Position

```typescript
toggle.setPosition(100, 200);
const pos = toggle.getPosition(); // { x: 100, y: 200 }
```

### Appearance

```typescript
// Change color scheme at runtime
toggle.setColorScheme(GameToggleColors.BLUE);
```

## Events

```typescript
// Value changed
toggle.on('change', (value) => {
  console.log('Toggle is now:', value ? 'ON' : 'OFF');
});
```

## Settings Panel Example

```typescript
import { GameToggle, GameList, GameStyleColors } from '@gamebyte/framework';

// Create settings toggles
const settingsContainer = new GameList({ direction: 'vertical', gap: 24 });

// Sound effects toggle
const sfxToggle = new GameToggle({
  value: settings.soundEnabled,
  onChange: (val) => {
    settings.soundEnabled = val;
    if (!val) audioManager.stopAllSfx();
  }
});

// Music toggle
const musicToggle = new GameToggle({
  value: settings.musicEnabled,
  onChange: (val) => {
    settings.musicEnabled = val;
    val ? audioManager.playMusic() : audioManager.pauseMusic();
  }
});

// Notifications toggle
const notifyToggle = new GameToggle({
  value: settings.notificationsEnabled,
  onChange: (val) => settings.notificationsEnabled = val
});

// Add toggles with labels...
```

## Visual Structure

GameToggle uses a multi-layer rendering approach:

1. **Depth layer** - Extends below the toggle for 3D effect
2. **Border** - Rounded rectangle border
3. **Track** - Gradient fill that changes color based on state
4. **Inner shadow** - Subtle shadow on track for depth
5. **Thumb shadow** - Drop shadow under the thumb
6. **Thumb base** - Darker color for bottom of thumb
7. **Thumb gradient** - Lighter color for top half
8. **Specular highlight** - Bright spot for glossy effect
9. **Rim light** - Top edge highlight

## Custom Color Scheme

```typescript
const customScheme: GameToggleColorScheme = {
  trackOnTop: 0xFF6B6B,      // Red-pink gradient top
  trackOnBottom: 0xEE5A5A,   // Red-pink gradient bottom
  trackOffTop: 0x6B7C8A,     // Gray gradient top
  trackOffBottom: 0x4A5660,  // Gray gradient bottom
  thumbTop: 0xFFFFFF,        // White thumb top
  thumbBottom: 0xE8E8E8,     // Light gray thumb bottom
  border: 0x3D4F5F,          // Border color
  borderDepth: 0x2A3640,     // Border depth
};

const customToggle = new GameToggle({
  colorScheme: customScheme,
  value: true
});
```
