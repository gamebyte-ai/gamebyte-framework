---
id: button
title: Buttons
description: Touch-friendly button components with game-style visual effects
sidebar_position: 2
keywords: [button, ui, click, touch, gradient, glow, game-style]
llm_summary: "GameStyleButton: Mobile game style buttons with multi-layer effects. UIButton: Basic buttons. GameStyleColors provides color schemes: YELLOW_BUTTON, GREEN_BUTTON, BLUE_BUTTON, RED_BUTTON, PURPLE_BUTTON."
---

<!-- llm-context: ui-button, game-style-button, touch-friendly, gradient, glow-effect, candy-crush-style -->

import LiveDemo from '@site/src/components/LiveDemo';

# Buttons

GameByte provides two button components: **GameStyleButton** for mobile game UIs, and **UIButton** for basic buttons.

## Live Demo

<LiveDemo
  src="/demos/game-button-demo.html"
  height={600}
  title="GameStyleButton - Raised vs Flat Styles"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the sun/moon button in the navigation bar!
:::

## GameStyleButton

A mobile-game style button with multi-layer effects inspired by Candy Crush, Brawl Stars, and Clash Royale.

**Features:**
- **Two visual styles:** `'raised'` (drop shadow) and `'flat'` (bottom edge)
- Multi-layer border (dark outer, light inner)
- Vertical gradient (light top, dark bottom)
- Top shine/highlight effect
- 3D bevel effect
- Press animation with feedback
- Bold text with stroke outline

### Button Styles

GameStyleButton supports two visual styles:

| Style | Description | Best For |
|-------|-------------|----------|
| `'raised'` | Classic 3D with drop shadow | Candy Crush, Brawl Stars style |
| `'flat'` | No shadow, thick bottom edge | Modern mobile games |

```typescript
// Raised style (default) - with drop shadow
const raisedBtn = new GameStyleButton({
    text: 'Play',
    buttonStyle: 'raised',  // Default
    colorScheme: GameStyleColors.YELLOW_BUTTON
});

// Flat style - bottom edge creates depth
const flatBtn = new GameStyleButton({
    text: 'Play',
    buttonStyle: 'flat',
    colorScheme: GameStyleColors.YELLOW_BUTTON
});
```

### Basic Usage

```typescript
import { GameStyleButton, GameStyleColors } from '@gamebyte/framework';

// Yellow Play Button (Candy Crush style)
const playButton = new GameStyleButton({
    text: 'Play',
    width: 220,
    height: 65,
    fontSize: 30,
    colorScheme: GameStyleColors.YELLOW_BUTTON
});

playButton.setPosition(100, 100);
playButton.on('click', () => startGame());
stage.addChild(playButton.getContainer());
```

### Color Schemes

GameByte includes pre-defined color schemes for common button types:

```typescript
import { GameStyleButton, GameStyleColors } from '@gamebyte/framework';

// Yellow (Play, Primary Action)
const yellow = new GameStyleButton({
    text: 'Play',
    colorScheme: GameStyleColors.YELLOW_BUTTON
});

// Green (Success, Continue)
const green = new GameStyleButton({
    text: 'Continue',
    colorScheme: GameStyleColors.GREEN_BUTTON
});

// Blue (Shop, Secondary)
const blue = new GameStyleButton({
    text: 'Shop',
    colorScheme: GameStyleColors.BLUE_BUTTON
});

// Red (Cancel, Danger)
const red = new GameStyleButton({
    text: 'Cancel',
    colorScheme: GameStyleColors.RED_BUTTON
});

// Purple (Special, Premium)
const purple = new GameStyleButton({
    text: 'Special',
    colorScheme: GameStyleColors.PURPLE_BUTTON
});
```

### Configuration Options

```typescript
interface GameStyleButtonConfig {
    text?: string;
    width?: number;              // Default: 200
    height?: number;             // Default: 70
    fontSize?: number;           // Default: 28
    fontFamily?: string;         // Default: 'Fredoka One'
    colorScheme?: GameButtonColorScheme;
    buttonStyle?: 'raised' | 'flat';  // Default: 'raised'
    borderRadius?: number;       // Default: 18
    borderWidth?: number;        // Default: 5
    shadowOffset?: number;       // Default: 5 (raised style only)
    disabled?: boolean;
}

interface GameButtonColorScheme {
    gradientTop: number;
    gradientBottom: number;
    border: number;
    shadow: number;
    highlight: number;
    text: number;
    textStroke: number;
}
```

### Factory Functions

Quick button creation with `GameButtons`:

```typescript
import { GameButtons } from '@gamebyte/framework';

const play = GameButtons.play('Play', 220, 70);
const success = GameButtons.success('Continue', 160, 56);
const secondary = GameButtons.secondary('Shop', 160, 56);
const danger = GameButtons.danger('Cancel', 160, 56);
const special = GameButtons.special('Premium', 160, 56);
```

---

## UIButton (Basic)

For simpler button needs, use `UIButton`:

```typescript
import { UIButton } from '@gamebyte/framework';

const button = new UIButton({
    text: 'PLAY',
    width: 200,
    height: 60,
    backgroundColor: 0x4CAF50
});

button.setPosition(300, 270);
button.on('click', () => console.log('Button clicked!'));

scene.addChild(button.getContainer());
```

## Configuration Options

```typescript
interface UIButtonConfig {
    // Content
    text: string;
    icon?: PIXI.Texture;
    iconPosition?: 'left' | 'right';

    // Size
    width: number;
    height: number;
    padding?: number;

    // Colors
    backgroundColor: number;
    textColor?: number;        // Default: 0xffffff
    disabledColor?: number;    // Default: 0x666666

    // Text
    fontSize?: number;         // Default: 18
    fontFamily?: string;       // Default: 'Arial'
    fontWeight?: string;       // Default: 'bold'

    // Effects
    gradient?: {
        enabled: boolean;
        colorTop?: number;     // Lighter
        colorBottom?: number;  // Darker
    };
    glowEffect?: boolean;
    glowColor?: number;
    glowIntensity?: number;    // Default: 0.5
    shadowEffect?: boolean;
    rippleEffect?: boolean;

    // Shape
    borderRadius?: number;     // Default: 8
    borderWidth?: number;
    borderColor?: number;

    // State
    enabled?: boolean;         // Default: true
}
```

## Visual Effects

### Gradient

```typescript
const button = new UIButton({
    text: 'GRADIENT',
    width: 200,
    height: 60,
    backgroundColor: 0x4CAF50,
    gradient: {
        enabled: true,
        colorTop: 0x66BB6A,    // Lighter green
        colorBottom: 0x388E3C  // Darker green
    }
});
```

### Glow Effect

```typescript
const button = new UIButton({
    text: 'GLOW',
    width: 200,
    height: 60,
    backgroundColor: 0x6366f1,
    glowEffect: true,
    glowColor: 0x818cf8,
    glowIntensity: 0.8
});
```

### Ripple Effect

```typescript
const button = new UIButton({
    text: 'RIPPLE',
    width: 200,
    height: 60,
    backgroundColor: 0x2196F3,
    rippleEffect: true  // Material-style ripple on click
});
```

### Combined Effects

```typescript
const button = new UIButton({
    text: 'ALL EFFECTS',
    width: 220,
    height: 70,
    backgroundColor: 0x9C27B0,
    gradient: { enabled: true },
    glowEffect: true,
    shadowEffect: true,
    rippleEffect: true,
    borderRadius: 35  // Pill shape
});
```

<LiveDemo
  src="/demos/ui-button-effects.html"
  height={300}
  title="Button Effects"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the sun/moon button in the navigation bar!
:::

## Methods

### Text

```typescript
button.setText('NEW TEXT');
const text = button.getText();
```

### Enabled State

```typescript
button.setEnabled(false);  // Grayed out, no interaction
button.setEnabled(true);

if (button.isEnabled()) {
    // Handle enabled state
}
```

### Position

```typescript
button.setPosition(100, 200);
const pos = button.getPosition(); // { x: 100, y: 200 }
```

### Visibility

```typescript
button.hide();
button.show();
button.setAlpha(0.5);
```

### Icon

```typescript
button.setIcon(texture);
button.setIcon(null);  // Remove icon
```

## Events

```typescript
// Primary click/tap
button.on('click', (event) => {
    console.log('Clicked at:', event.x, event.y);
});

// Touch states
button.on('pointerdown', () => {
    console.log('Pressed');
});

button.on('pointerup', () => {
    console.log('Released');
});

// Hover (desktop)
button.on('pointerover', () => {
    console.log('Mouse entered');
});

button.on('pointerout', () => {
    console.log('Mouse left');
});
```

## Button Variants

### Primary Button

```typescript
const primary = new UIButton({
    text: 'PRIMARY',
    width: 200,
    height: 50,
    backgroundColor: 0x6366f1,
    gradient: { enabled: true },
    glowEffect: true
});
```

### Secondary Button

```typescript
const secondary = new UIButton({
    text: 'SECONDARY',
    width: 200,
    height: 50,
    backgroundColor: 0x374151,
    borderWidth: 2,
    borderColor: 0x6366f1
});
```

### Danger Button

```typescript
const danger = new UIButton({
    text: 'DELETE',
    width: 200,
    height: 50,
    backgroundColor: 0xef4444,
    gradient: { enabled: true }
});
```

### Icon Button

```typescript
const iconBtn = new UIButton({
    text: '',
    icon: pauseTexture,
    width: 50,
    height: 50,
    backgroundColor: 0x333333,
    borderRadius: 25  // Circle
});
```

### Text with Icon

```typescript
const buyBtn = new UIButton({
    text: 'BUY 100',
    icon: coinTexture,
    iconPosition: 'left',
    width: 150,
    height: 50,
    backgroundColor: 0x22c55e
});
```

## Accessibility

```typescript
const button = new UIButton({
    text: 'Submit',
    // ... other config
    ariaLabel: 'Submit contact form',
    focusable: true
});

// Keyboard support
button.on('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        button.emit('click');
    }
});
```

## Animation

```typescript
import { Animations } from '@gamebyte/framework';

// Entrance animation
Animations.scaleIn(button, { duration: 300, ease: 'back.out' });

// Click feedback (built-in, but customizable)
button.on('click', () => {
    Animations.bounce(button, { scale: 0.95, duration: 100 });
});

// Attention grabber
Animations.pulse(button, { scale: 1.05, repeat: 3 });
```
