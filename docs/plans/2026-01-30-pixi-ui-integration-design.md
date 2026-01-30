# @pixi/ui Integration Design

**Date:** 2026-01-30
**Status:** Approved

## Overview

Integrate @pixi/ui library into GameByte framework to add missing UI primitives (Input, ScrollBox, Select, List, CheckBox, RadioGroup) while preserving the existing game-styled visual aesthetic.

## Decisions

| Decision | Choice |
|----------|--------|
| Integration approach | Composition-based wrappers |
| Visual style | GameStyleButton "jellybean" (black borders, solid colors, specular highlights) |
| Export structure | Unified namespace (direct exports from gamebyte-framework) |

## Dependencies

```json
{
  "@pixi/ui": "^2.x"
}
```

Note: v2.x is required for Pixi.js v8 compatibility.

## New Components

| Component | Wraps | Purpose |
|-----------|-------|---------|
| `GameInput` | `@pixi/ui Input` | Text entry with game styling |
| `GameScrollBox` | `@pixi/ui ScrollBox` | Scrollable content area |
| `GameSelect` | `@pixi/ui Select` | Dropdown menu |
| `GameList` | `@pixi/ui List` | Auto-layout list |
| `GameCheckBox` | `@pixi/ui CheckBox` | Checkbox with checkmark |
| `GameRadioGroup` | `@pixi/ui RadioGroup` | Radio button group |

## File Structure

```
src/ui/components/
├── GameInput.ts        # NEW
├── GameScrollBox.ts    # NEW
├── GameSelect.ts       # NEW
├── GameList.ts         # NEW
├── GameCheckBox.ts     # NEW
├── GameRadioGroup.ts   # NEW
├── GameSlider.ts       # EXISTING (unchanged)
├── GameToggle.ts       # EXISTING (unchanged)
├── GameStyleButton.ts  # EXISTING (unchanged)
└── ...
```

## Color Schemes

Add to `GameStyleUITheme.ts`:

```typescript
// Input field colors
GAME_INPUT: {
  background: 0x2A3A4A,      // Dark inset background
  backgroundFocus: 0x3A4A5A, // Slightly lighter when focused
  border: 0x000000,          // Black outer border
  borderInner: 0x1A2A3A,     // Inner depth border
  text: 0xFFFFFF,
  placeholder: 0x8A9AAA,
  cursor: 0xFFFFFF,
  selection: 0x4DA6FF,
  highlight: 0xFFFFFF        // Top edge highlight
}

// ScrollBox colors
GAME_SCROLLBOX: {
  background: 0x2A3A4A,
  border: 0x000000,
  scrollbarTrack: 0x1A2A3A,
  scrollbarThumb: 0x5A6A7A,
  scrollbarThumbHover: 0x6A7A8A,
  highlight: 0xFFFFFF
}

// Select/Dropdown colors
GAME_SELECT: {
  triggerBg: 0x4DA6FF,
  triggerBorder: 0x000000,
  triggerShadow: 0x2E7BC9,
  dropdownBg: 0x2A3A4A,
  dropdownBorder: 0x000000,
  itemHover: 0x3A4A5A,
  itemSelected: 0x4DA6FF
}

// CheckBox colors
GAME_CHECKBOX: {
  boxBg: 0x2A3A4A,
  boxBorder: 0x000000,
  boxChecked: 0x4DA6FF,
  checkmark: 0xFFFFFF,
  highlight: 0xFFFFFF
}

// RadioGroup colors
GAME_RADIO: {
  circleBg: 0x2A3A4A,
  circleBorder: 0x000000,
  circleSelected: 0x4DA6FF,
  dot: 0xFFFFFF,
  highlight: 0xFFFFFF
}
```

## Component APIs

### GameInput

```typescript
interface GameInputConfig {
  width?: number;           // Default: 200
  height?: number;          // Default: 44 (touch-friendly)
  placeholder?: string;
  value?: string;
  maxLength?: number;
  type?: 'text' | 'password' | 'number';
  colorScheme?: GameInputColorScheme;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
}

// Events: 'change', 'enter', 'focus', 'blur'
```

### GameScrollBox

```typescript
interface GameScrollBoxConfig {
  width?: number;
  height?: number;
  padding?: number;
  scrollDirection?: 'vertical' | 'horizontal' | 'both';
  colorScheme?: GameScrollBoxColorScheme;
  showScrollbar?: boolean;
}

// Methods: addItem(), removeItem(), scrollTo(), getItems()
// Events: 'scroll'
```

### GameSelect

```typescript
interface GameSelectConfig {
  width?: number;
  height?: number;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  selectedValue?: string;
  colorScheme?: GameSelectColorScheme;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

// Methods: setOptions(), getValue(), setValue(), open(), close()
// Events: 'change', 'open', 'close'
```

### GameCheckBox

```typescript
interface GameCheckBoxConfig {
  label?: string;
  checked?: boolean;
  size?: number;           // Default: 32
  colorScheme?: GameCheckBoxColorScheme;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

// Events: 'change'
```

### GameRadioGroup

```typescript
interface GameRadioGroupConfig {
  options: Array<{ label: string; value: string }>;
  selectedValue?: string;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  colorScheme?: GameRadioColorScheme;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

// Events: 'change'
```

### GameList

```typescript
interface GameListConfig {
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  padding?: number;
}

// Methods: addItem(), removeItem(), getItems(), clear()
```

## Architecture

### Wrapper Pattern

```typescript
export class GameInput extends EventEmitter {
  private container: IContainer;        // Our styled container
  private pixiInput: Input;             // @pixi/ui component inside
  private borderGraphics: IGraphics;    // Jellybean border
  private backgroundGraphics: IGraphics;
  private highlightGraphics: IGraphics; // Top edge shine

  constructor(config: GameInputConfig) {
    // 1. Create our styled container with jellybean visuals
    // 2. Create @pixi/ui Input for actual functionality
    // 3. Position @pixi/ui component inside our styled frame
    // 4. Forward events from @pixi/ui to our EventEmitter
  }

  getContainer(): IContainer {
    return this.container;  // Returns OUR container (with styling)
  }
}
```

### Responsibilities

| Layer | Handles |
|-------|---------|
| @pixi/ui | Text input, scrolling logic, dropdown behavior, focus management |
| GameByte wrappers | All visual rendering (jellybean borders, colors, highlights) |

### Existing Components

These remain **unchanged**:
- `GameSlider` - keeps current implementation
- `GameToggle` - keeps current implementation
- `GameStyleButton` - keeps current implementation
- `UIButton` - keeps current implementation

### Re-export for Advanced Users

```typescript
// src/index.ts
export * as PixiUI from '@pixi/ui';
```

## Visual Style

All new components use the "jellybean" style matching `GameStyleColors`:

- 3-4px black outer border
- Inner depth shadow (darker shade below)
- Top-edge white highlight (25% alpha)
- Solid colors (no gradients)
- Touch-friendly minimum 44px height

## Exports

```typescript
// src/index.ts

// New game-styled @pixi/ui wrappers
export { GameInput, GameInputConfig, GameInputColorScheme, GameInputColors } from './ui/components/GameInput';
export { GameScrollBox, GameScrollBoxConfig, GameScrollBoxColorScheme, GameScrollBoxColors } from './ui/components/GameScrollBox';
export { GameSelect, GameSelectConfig, GameSelectColorScheme, GameSelectColors } from './ui/components/GameSelect';
export { GameList, GameListConfig } from './ui/components/GameList';
export { GameCheckBox, GameCheckBoxConfig, GameCheckBoxColorScheme, GameCheckBoxColors } from './ui/components/GameCheckBox';
export { GameRadioGroup, GameRadioGroupConfig, GameRadioColorScheme, GameRadioColors } from './ui/components/GameRadioGroup';

// Raw @pixi/ui for advanced users
export * as PixiUI from '@pixi/ui';
```

## Implementation Order

1. Add `@pixi/ui` dependency
2. Add color schemes to `GameStyleUITheme.ts`
3. Implement `GameInput` (most commonly needed)
4. Implement `GameCheckBox` (simple, validates pattern)
5. Implement `GameRadioGroup` (builds on checkbox)
6. Implement `GameList` (utility component)
7. Implement `GameScrollBox` (complex scrolling)
8. Implement `GameSelect` (complex dropdown)
9. Add exports to `src/index.ts`
10. Create demo page
11. Update documentation
