---
id: overview
title: Input Overview
description: GameByte input handling system
sidebar_position: 1
keywords: [input, keyboard, mouse, touch, gamepad]
llm_summary: "Unified input: Input.keyboard, Input.touch, Input.gamepad. Event-based: on('KeyW', callback). Supports all platforms with consistent API."
---

<!-- llm-context: input-system, keyboard, mouse, touch, gamepad, mobile-input -->

import LiveDemo from '@site/src/components/LiveDemo';

# Input Overview

GameByte provides a unified input system for all platforms.

<LiveDemo src="/demos/whack-a-mole-demo.html" height="600" title="Whack-a-Mole - Touch, Click & Keyboard Input" />

<LiveDemo src="/demos/keyboard-demo.html" height="500" title="Keyboard Input Demo" />

<LiveDemo src="/demos/input-touch.html" height="500" title="Touch Input - Tap, Swipe, Pinch & Long Press" />

## Input Sources

| Source | Use Case |
|--------|----------|
| Keyboard | Desktop controls |
| Mouse | Desktop pointing |
| Touch | Mobile/tablet |
| Gamepad | Controller support |

## Quick Start

```typescript
import { Input } from '@gamebyte/framework';

const input = game.make('input');

// Keyboard
input.keyboard.on('KeyW', (pressed) => {
    if (pressed) moveForward();
});

// Touch
input.touch.on('tap', (event) => {
    handleTap(event.x, event.y);
});

// Gamepad
input.gamepad.on('button-a', () => {
    jump();
});
```

## Polling vs Events

```typescript
// Event-based (recommended)
input.keyboard.on('Space', (pressed) => {
    if (pressed) jump();
});

// Polling (for continuous actions)
function update(deltaTime: number) {
    if (input.keyboard.isPressed('KeyA')) {
        moveLeft(deltaTime);
    }
}
```

