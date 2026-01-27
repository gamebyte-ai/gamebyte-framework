# GameTooltip Component

> Speech bubble style tooltip/popover with customizable tail position and color schemes

<!-- keywords: tooltip, popover, speech-bubble, hint, tutorial, coming-soon, status -->

---

## Overview

`GameTooltip` is a versatile speech bubble component that can be used for:
- Informational tooltips on hover
- Popovers on click/tap
- Status indicators ("Coming Soon", "New", etc.)
- Tutorial hints
- Notification badges

## Quick Start

```typescript
import { GameTooltip, GameTooltipColors } from 'gamebyte-framework';

// Create a simple "Coming Soon" tooltip
const tooltip = new GameTooltip({
    text: 'Coming Soon',
    tailPosition: 'bottom-left',
    colorScheme: GameTooltipColors.CYAN
});

tooltip.setPosition(100, 50);
stage.addChild(tooltip.getContainer());
```

## Configuration

### GameTooltipConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | `string` | `'Tooltip'` | Text content |
| `maxWidth` | `number` | `200` | Max width before word wrap |
| `padding` | `number` | `12` | Inner padding |
| `fontSize` | `number` | `16` | Text font size |
| `fontFamily` | `string` | Framework font | Font family |
| `colorScheme` | `GameTooltipColorScheme` | `CYAN` | Color scheme |
| `borderRadius` | `number` | `10` | Corner radius |
| `borderWidth` | `number` | `3` | Border thickness |
| `tailPosition` | `TooltipTailPosition` | `'bottom-left'` | Tail/pointer position |
| `tailSize` | `number` | `10` | Size of the tail triangle |
| `showShadow` | `boolean` | `true` | Show drop shadow |
| `shadowOffset` | `number` | `4` | Shadow offset in pixels |
| `shadowAlpha` | `number` | `0.3` | Shadow transparency |

## Tail Positions

The tooltip supports 12 tail positions plus a "none" option:

```
                 top-left    top-center    top-right
                    ▼           ▼            ▼
               ┌─────────────────────────────────┐
   left-top ▶  │                                 │  ◀ right-top
               │                                 │
left-center ▶  │          TOOLTIP TEXT           │  ◀ right-center
               │                                 │
left-bottom ▶  │                                 │  ◀ right-bottom
               └─────────────────────────────────┘
                    ▲           ▲            ▲
              bottom-left  bottom-center  bottom-right
```

```typescript
type TooltipTailPosition =
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'top-left'    | 'top-center'    | 'top-right'
  | 'left-top'    | 'left-center'   | 'left-bottom'
  | 'right-top'   | 'right-center'  | 'right-bottom'
  | 'none';
```

## Color Schemes

### Built-in Presets

```typescript
import { GameTooltipColors } from 'gamebyte-framework';

// Available presets
GameTooltipColors.CYAN    // Light blue (default)
GameTooltipColors.YELLOW  // Warning/attention
GameTooltipColors.GREEN   // Success
GameTooltipColors.RED     // Error/danger
GameTooltipColors.PURPLE  // Pro tip/special
GameTooltipColors.DARK    // Dark (for light backgrounds)
GameTooltipColors.WHITE   // White (for dark backgrounds)
```

### Custom Color Scheme

```typescript
interface GameTooltipColorScheme {
  background: number;    // Bubble fill color
  border: number;        // Border color
  text: number;          // Text color
  textStroke?: number;   // Optional text outline
  shadow?: number;       // Shadow color
}

// Example custom scheme
const myScheme: GameTooltipColorScheme = {
    background: 0xFF6B6B,
    border: 0x8B0000,
    text: 0xFFFFFF,
    textStroke: 0x8B0000
};

const tooltip = new GameTooltip({
    text: 'Custom!',
    colorScheme: myScheme
});
```

## Methods

### Content & Appearance

```typescript
// Set text content
tooltip.setText('New text');
tooltip.getText(); // Returns current text

// Change tail position
tooltip.setTailPosition('top-center');

// Change color scheme
tooltip.setColorScheme(GameTooltipColors.GREEN);
```

### Position & Visibility

```typescript
// Position the tooltip
tooltip.setPosition(x, y);
tooltip.getPosition(); // { x, y }

// Visibility control
tooltip.show();
tooltip.hide();
tooltip.toggle();
tooltip.isVisible();
tooltip.setVisible(true/false);
```

### Size & Bounds

```typescript
// Get bubble dimensions
tooltip.getSize(); // { width, height }

// Get total bounds (including tail and shadow)
tooltip.getTotalBounds(); // { width, height, tailOffset }
```

### Container Access

```typescript
// Get the PIXI container for adding to stage
const container = tooltip.getContainer();
stage.addChild(container);
```

### Cleanup

```typescript
tooltip.destroy(); // Clean up resources
```

## Events

```typescript
tooltip.on('show', () => console.log('Tooltip shown'));
tooltip.on('hide', () => console.log('Tooltip hidden'));
```

## Use Cases

### Status Indicator

```typescript
// "Coming Soon" badge on a locked feature
const comingSoon = new GameTooltip({
    text: 'Coming Soon',
    tailPosition: 'bottom-left',
    colorScheme: GameTooltipColors.CYAN
});
comingSoon.setPosition(button.x + button.width - 20, button.y - 30);
```

### Tutorial Hint

```typescript
// Tutorial tip pointing to a button
const hint = new GameTooltip({
    text: 'Tap here to start!',
    tailPosition: 'bottom-center',
    colorScheme: GameTooltipColors.YELLOW
});
hint.setPosition(targetButton.x, targetButton.y - 50);
```

### Error Message

```typescript
// Error feedback
const error = new GameTooltip({
    text: 'Not enough coins!',
    tailPosition: 'left-center',
    colorScheme: GameTooltipColors.RED
});
error.setPosition(priceLabel.x + priceLabel.width + 10, priceLabel.y);
```

### Interactive Popover

```typescript
// Toggle on button click
const popover = new GameTooltip({
    text: 'More info here...',
    tailPosition: 'top-center'
});
popover.hide(); // Start hidden

infoButton.on('click', () => {
    popover.toggle();
});
```

### Multi-line Content

```typescript
const tooltip = new GameTooltip({
    text: 'This is a longer tooltip\nwith multiple lines',
    maxWidth: 180,
    tailPosition: 'bottom-left'
});
```

## Demo

Live demo: `/docs-site/static/demos/game-tooltip-demo.html`

```bash
npx http-server -p 8080
# Open: http://localhost:8080/docs-site/static/demos/game-tooltip-demo.html
```

## Best Practices

1. **Position relative to target** - Place tooltip so the tail points to the relevant element
2. **Use appropriate colors** - Match color scheme to the message type (success=green, error=red, etc.)
3. **Keep text concise** - Tooltips should be brief; use panels for longer content
4. **Consider mobile** - Ensure tooltips don't go off-screen on smaller devices
5. **Hide when not needed** - Don't clutter the UI with persistent tooltips
