---
id: touch
title: Touch Input
description: Mobile touch and gesture handling
sidebar_position: 3
keywords: [touch, mobile, gesture, swipe, pinch]
llm_summary: "Touch events: tap, doubletap, hold, swipe, pinch. Virtual joystick: Input.createVirtualJoystick(). Multi-touch: on('touch', { touches }). 44px touch targets."
---

<!-- llm-context: touch-input, mobile-input, gestures, swipe, pinch, virtual-joystick -->

import LiveDemo from '@site/src/components/LiveDemo';

# Touch Input

Mobile-optimized touch handling with gesture support.

## Basic Touch

```typescript
const touch = game.make('input').touch;

// Tap
touch.on('tap', (event) => {
    handleTap(event.x, event.y);
});

// Double tap
touch.on('doubletap', (event) => {
    zoom(event.x, event.y);
});

// Long press
touch.on('hold', (event) => {
    showContextMenu(event.x, event.y);
});
```

<LiveDemo
  src="/demos/input-touch.html"
  height={400}
  title="Touch Input Demo"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Gestures

### Swipe

```typescript
touch.on('swipe', (event) => {
    console.log('Direction:', event.direction); // 'left', 'right', 'up', 'down'
    console.log('Velocity:', event.velocity);

    if (event.direction === 'left') nextPage();
    if (event.direction === 'right') prevPage();
});
```

### Pinch (Zoom)

```typescript
touch.on('pinch', (event) => {
    const scale = event.scale; // 1 = no change, <1 = pinch in, >1 = pinch out
    camera.zoom *= scale;
});
```

### Pan (Drag)

```typescript
touch.on('pan', (event) => {
    camera.x -= event.deltaX;
    camera.y -= event.deltaY;
});
```

## Virtual Joystick

```typescript
import { VirtualJoystick } from '@gamebyte/framework';

const joystick = new VirtualJoystick({
    position: { x: 100, y: 500 },
    size: 120,
    innerSize: 50,
    backgroundColor: 0x333333,
    innerColor: 0x666666
});

scene.addChild(joystick.getContainer());

// Get input
function update(deltaTime: number) {
    const input = joystick.getInput();
    // input = { x: -1 to 1, y: -1 to 1, magnitude: 0 to 1 }

    player.move(input.x * speed * deltaTime, input.y * speed * deltaTime);
}
```

## Multi-Touch

```typescript
touch.on('touch', (event) => {
    event.touches.forEach((t, index) => {
        console.log(`Touch ${index}: (${t.x}, ${t.y})`);
    });
});
```

## Touch Areas

```typescript
// Define touch area
const attackButton = touch.createTouchArea({
    x: 700, y: 500,
    width: 80, height: 80
});

attackButton.on('tap', () => {
    player.attack();
});

attackButton.on('hold', () => {
    player.chargedAttack();
});
```
