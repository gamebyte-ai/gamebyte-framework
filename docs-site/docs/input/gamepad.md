---
id: gamepad
title: Gamepad
description: Game controller support
sidebar_position: 4
keywords: [gamepad, controller, joystick, xbox, playstation]
llm_summary: "Gamepad: on('button-a', callback), getAxis('left-stick'). Auto-detects Xbox/PS controllers. Supports vibration and multiple controllers."
---

<!-- llm-context: gamepad-input, controller, xbox, playstation, analog-sticks -->

import LiveDemo from '@site/src/components/LiveDemo';

# Gamepad

Support for Xbox, PlayStation, and other controllers.

## Live Demo

<LiveDemo
  src="/demos/gamepad-demo.html"
  height={640}
  title="Gamepad Input Demo"
/>

## Basic Usage

```typescript
const gamepad = game.make('input').gamepad;

// Button events
gamepad.on('button-a', () => jump());
gamepad.on('button-b', () => cancel());
gamepad.on('button-x', () => attack());
gamepad.on('button-y', () => interact());

// Triggers
gamepad.on('trigger-left', (value) => {
    // value: 0-1
    aim(value);
});

gamepad.on('trigger-right', (value) => {
    if (value > 0.5) shoot();
});
```

## Analog Sticks

```typescript
function update(deltaTime: number) {
    // Get stick values (-1 to 1)
    const leftStick = gamepad.getAxis('left-stick');
    const rightStick = gamepad.getAxis('right-stick');

    // Movement
    player.move(
        leftStick.x * speed * deltaTime,
        leftStick.y * speed * deltaTime
    );

    // Camera
    camera.rotate(
        rightStick.x * sensitivity,
        rightStick.y * sensitivity
    );
}
```

## Button Mapping

| Standard | Xbox | PlayStation |
|----------|------|-------------|
| `button-a` | A | X |
| `button-b` | B | Circle |
| `button-x` | X | Square |
| `button-y` | Y | Triangle |
| `shoulder-left` | LB | L1 |
| `shoulder-right` | RB | R1 |
| `trigger-left` | LT | L2 |
| `trigger-right` | RT | R2 |
| `dpad-up/down/left/right` | D-Pad | D-Pad |

## Vibration

```typescript
// Simple vibration
gamepad.vibrate(500); // 500ms

// Dual motor
gamepad.vibrate({
    duration: 200,
    weakMagnitude: 0.5,  // Right motor
    strongMagnitude: 1.0  // Left motor
});
```

## Multiple Controllers

```typescript
// Get specific gamepad
const player1Gamepad = gamepad.getGamepad(0);
const player2Gamepad = gamepad.getGamepad(1);

// Connection events
gamepad.on('connected', (index) => {
    console.log(`Controller ${index} connected`);
});

gamepad.on('disconnected', (index) => {
    console.log(`Controller ${index} disconnected`);
    pauseGame();
});
```
