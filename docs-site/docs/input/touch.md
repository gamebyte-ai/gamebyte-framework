---
id: touch
title: Touch Input
description: Mobile touch and gesture handling
sidebar_position: 3
keywords: [touch, mobile, gesture, swipe, pinch]
llm_summary: "Touch events: tap, doubletap, hold, swipe, pinch. VirtualJoystick: mode='dynamic'|'fixed', on('move', data => {vector, angle, magnitude, direction}). Multi-touch: on('touch', { touches }). 44px touch targets."
---

<!-- llm-context: touch-input, mobile-input, gestures, swipe, pinch, virtual-joystick -->

import LiveDemo from '@site/src/components/LiveDemo';

# Touch Input

Mobile-optimized touch handling with gesture support.

<LiveDemo
  src="/demos/input-touch.html"
  height={500}
  title="Touch Input - Tap, Swipe, Pinch & Long Press"
/>

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
  src="/demos/flappy-demo.html"
  height={600}
  title="Flappy Bird - Tap to Fly Demo"
/>

**This Flappy Bird clone demonstrates tap-based input** - each tap makes the bird flap upward. Perfect example of simple touch/click handling for mobile games.

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

For mobile games requiring analog movement controls, use the `VirtualJoystick` component:

```typescript
import { VirtualJoystick } from '@gamebyte/framework';

const joystick = new VirtualJoystick({
  mode: 'dynamic', // Appears where user touches
  activationZone: { x: 0, y: 0, width: 0.5, height: 1 } // Left half of screen
});

scene.addChild(joystick.getContainer());

joystick.on('move', (data) => {
  player.velocity.x = data.vector.x * speed;
  player.velocity.y = data.vector.y * speed;
});
```

:::tip Full Documentation
See the **[Virtual Joystick](./virtual-joystick)** page for complete configuration options, events, and examples including dual-joystick setups.
:::

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
