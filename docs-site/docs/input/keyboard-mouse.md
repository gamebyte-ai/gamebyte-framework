---
id: keyboard-mouse
title: Keyboard & Mouse
description: Keyboard and mouse input handling
sidebar_position: 2
keywords: [keyboard, mouse, desktop, controls]
llm_summary: "Keyboard: on('KeyW'), isPressed('Space'). Mouse: on('click'), on('move'). Uses KeyboardEvent.code for key names (KeyW, Space, ArrowUp)."
---

<!-- llm-context: keyboard-input, mouse-input, desktop-controls, key-codes -->

import LiveDemo from '@site/src/components/LiveDemo';

# Keyboard & Mouse

## Live Demo

Try this Breakout game - use arrow keys or mouse to control the paddle:

<LiveDemo
  src="/demos/breakout-demo.html"
  height={580}
  title="Breakout - Keyboard & Mouse Demo"
/>

## Keyboard

### Event-Based

```typescript
const keyboard = game.make('input').keyboard;

// Key down/up
keyboard.on('KeyW', (pressed) => {
    if (pressed) console.log('W pressed');
    else console.log('W released');
});

// Specific events
keyboard.onKeyDown('Space', () => jump());
keyboard.onKeyUp('Space', () => stopJump());

// Multiple keys
['KeyW', 'ArrowUp'].forEach(key => {
    keyboard.on(key, (pressed) => {
        if (pressed) moveUp();
    });
});
```

### Polling

```typescript
function update(deltaTime: number) {
    if (keyboard.isPressed('KeyA') || keyboard.isPressed('ArrowLeft')) {
        player.moveLeft(deltaTime);
    }
    if (keyboard.isPressed('KeyD') || keyboard.isPressed('ArrowRight')) {
        player.moveRight(deltaTime);
    }
}
```

### Key Codes

Common key codes (use `KeyboardEvent.code`):

| Key | Code |
|-----|------|
| W, A, S, D | `KeyW`, `KeyA`, `KeyS`, `KeyD` |
| Arrow keys | `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` |
| Space | `Space` |
| Enter | `Enter` |
| Escape | `Escape` |
| Shift | `ShiftLeft`, `ShiftRight` |

## Mouse

### Click Events

```typescript
const mouse = game.make('input').mouse;

mouse.on('click', (event) => {
    console.log('Clicked at:', event.x, event.y);
    console.log('Button:', event.button); // 0=left, 1=middle, 2=right
});

mouse.on('rightclick', (event) => {
    showContextMenu(event.x, event.y);
});
```

### Movement

```typescript
mouse.on('move', (event) => {
    cursor.position.set(event.x, event.y);
});

// Delta movement (for first-person camera)
mouse.on('move', (event) => {
    camera.rotateY(-event.deltaX * sensitivity);
    camera.rotateX(-event.deltaY * sensitivity);
});
```

### Pointer Lock (FPS games)

```typescript
// Request pointer lock
mouse.requestPointerLock();

mouse.on('move', (event) => {
    if (mouse.isLocked()) {
        // Use delta for camera control
        rotateCamera(event.deltaX, event.deltaY);
    }
});

// Release on Escape
keyboard.on('Escape', () => {
    mouse.exitPointerLock();
});
```

### Scroll Wheel

```typescript
mouse.on('wheel', (event) => {
    zoom(event.deltaY);
});
```
