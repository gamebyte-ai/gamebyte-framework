---
id: button
title: UIButton
description: Touch-friendly button component with visual effects
sidebar_position: 2
keywords: [button, ui, click, touch, gradient, glow]
llm_summary: "UIButton: new UIButton({ text, width, height, backgroundColor, gradient, glowEffect, rippleEffect }). Events: on('click', handler). Methods: setText(), setEnabled()."
---

<!-- llm-context: ui-button, touch-friendly, gradient, glow-effect, ripple-effect, click-handler -->

import LiveDemo from '@site/src/components/LiveDemo';

# UIButton

A touch-friendly button with modern visual effects.

## Basic Usage

```typescript
import { UIButton } from 'gamebyte-framework';

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

<LiveDemo
  src="/demos/ui-button-basic.html"
  height={200}
  title="Basic Button"
/>

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
import { UIAnimations } from 'gamebyte-framework';

// Entrance animation
UIAnimations.scaleIn(button, { duration: 300, ease: 'back.out' });

// Click feedback (built-in, but customizable)
button.on('click', () => {
    UIAnimations.bounce(button, { scale: 0.95, duration: 100 });
});

// Attention grabber
UIAnimations.pulse(button, { scale: 1.05, repeat: 3 });
```
