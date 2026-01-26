---
id: virtual-joystick
title: Virtual Joystick
description: Touch-based joystick for mobile game controls
sidebar_position: 4
keywords: [joystick, virtual, mobile, touch, controls, movement, analog]
llm_summary: "VirtualJoystick: mode='dynamic'|'fixed', activationZone for touch area, outputs vector/angle/magnitude/direction. Events: move, start, end."
---

<!-- llm-context: virtual-joystick, mobile-controls, touch-joystick, analog-stick, character-movement -->

import LiveDemo from '@site/src/components/LiveDemo';

# Virtual Joystick

Touch-based analog joystick for mobile game character movement and controls.

## 2D Demo

<LiveDemo
  src="/demos/virtual-joystick-demo.html"
  height={500}
  title="Virtual Joystick 2D Demo"
/>

## 3D Demo

<LiveDemo
  src="/demos/virtual-joystick-3d-demo.html"
  height={500}
  title="Virtual Joystick 3D Demo - Move the cube!"
/>

## Dual Joystick Demo

Twin-stick shooter style controls: left joystick for movement, right joystick for aiming and shooting.

<LiveDemo
  src="/demos/dual-joystick-demo.html"
  height={500}
  title="Dual Joystick Demo - Move & Shoot!"
/>

## Features

- **Two modes**: Fixed position or dynamic (appears where user touches)
- **Customizable activation zone**: Define where joystick can be activated
- **Rich output data**: Vector, angle, magnitude, and 8-way direction
- **Dead zone support**: Filter out small unintentional movements
- **Smooth animations**: Fade in/out transitions
- **Fully customizable**: Colors, sizes, opacity

## Quick Start

```typescript
import { VirtualJoystick } from '@gamebyte/framework';

// Create a dynamic joystick (appears on touch)
const joystick = new VirtualJoystick({
  mode: 'dynamic',
  activationZone: { x: 0, y: 0, width: 0.5, height: 1 } // Left half of screen
});

// Add to your scene
scene.addChild(joystick.getContainer());

// Handle movement
joystick.on('move', (data) => {
  player.velocity.x = data.vector.x * speed;
  player.velocity.y = data.vector.y * speed;
});
```

## Modes

### Dynamic Mode

Joystick appears where the user touches and disappears when released. Ideal for hyper-casual and runner games.

```typescript
const joystick = new VirtualJoystick({
  mode: 'dynamic',
  activationZone: { x: 0, y: 0, width: 0.5, height: 1 },
  hideWhenIdle: true,  // Default: true
  fadeInDuration: 100,  // ms
  fadeOutDuration: 200  // ms
});
```

### Fixed Mode

Joystick stays at a fixed position, always visible. Classic arcade-style controls.

```typescript
const joystick = new VirtualJoystick({
  mode: 'fixed',
  position: { x: 100, y: window.innerHeight - 180 },
  size: 120
});
```

## Configuration

### Full Options

```typescript
interface VirtualJoystickConfig {
  // Mode (required)
  mode: 'fixed' | 'dynamic';

  // Position (required for fixed mode)
  position?: { x: number; y: number };

  // Activation zone for dynamic mode (normalized 0-1 values)
  activationZone?: {
    x: number;      // Left edge (0 = screen left)
    y: number;      // Top edge (0 = screen top)
    width: number;  // Width (1 = full screen width)
    height: number; // Height (1 = full screen height)
  };

  // Size
  size?: number;      // Base diameter (default: 120)
  knobSize?: number;  // Knob diameter (default: size * 0.4)

  // Behavior
  deadZone?: number;     // 0-1 threshold (default: 0.1)
  maxDistance?: number;  // Max knob travel (default: size * 0.4)

  // Visual style
  style?: {
    baseColor?: number;    // Default: 0x000000
    baseAlpha?: number;    // Default: 0.3
    knobColor?: number;    // Default: 0xFFFFFF
    knobAlpha?: number;    // Default: 0.8
    borderColor?: number;  // Default: 0xFFFFFF
    borderWidth?: number;  // Default: 2
    borderAlpha?: number;  // Default: 0.5
  };

  // Animation (dynamic mode)
  hideWhenIdle?: boolean;     // Default: true
  fadeInDuration?: number;    // Default: 100ms
  fadeOutDuration?: number;   // Default: 200ms
}
```

## Events

### move

Fired continuously while joystick is active.

```typescript
joystick.on('move', (data: JoystickMoveData) => {
  // data.vector: { x: -1..1, y: -1..1 }
  // data.angle: 0-360 degrees (0 = right, 90 = down)
  // data.magnitude: 0-1 (distance from center)
  // data.direction: 'idle' | 'up' | 'down' | 'left' | 'right' |
  //                 'up-left' | 'up-right' | 'down-left' | 'down-right'
  // data.rawPosition: { x, y } in pixels

  player.velocity.x = data.vector.x * speed;
  player.velocity.y = data.vector.y * speed;
});
```

### start

Fired when joystick is activated (touch begins).

```typescript
joystick.on('start', () => {
  console.log('Joystick activated');
});
```

### end

Fired when joystick is released.

```typescript
joystick.on('end', () => {
  console.log('Joystick released');
  player.velocity.x = 0;
  player.velocity.y = 0;
});
```

## Methods

### getData()

Get current joystick state without event listener.

```typescript
function gameLoop() {
  const data = joystick.getData();

  if (data.magnitude > 0) {
    player.move(data.vector.x, data.vector.y);
  }
}
```

### getVector()

Shorthand to get just the vector.

```typescript
const { x, y } = joystick.getVector();
player.velocity.set(x * speed, y * speed);
```

### isPressed()

Check if joystick is currently active.

```typescript
if (joystick.isPressed()) {
  // Player is moving
}
```

### setPosition(x, y)

Update joystick position (fixed mode).

```typescript
window.addEventListener('resize', () => {
  joystick.setPosition(100, window.innerHeight - 180);
});
```

### setStyle(style)

Update visual style at runtime.

```typescript
joystick.setStyle({
  knobColor: 0xFF0000,
  baseAlpha: 0.5
});
```

### show() / hide()

Control visibility.

```typescript
// Hide during cutscenes
joystick.hide();

// Show when gameplay resumes
joystick.show();
```

### enable() / disable()

Enable or disable input handling.

```typescript
// Disable during pause menu
joystick.disable();

// Re-enable
joystick.enable();
```

### destroy()

Clean up resources.

```typescript
joystick.destroy();
```

## Examples

### Character Movement

```typescript
const joystick = new VirtualJoystick({
  mode: 'dynamic',
  activationZone: { x: 0, y: 0, width: 0.5, height: 1 }
});

scene.addChild(joystick.getContainer());

// In game loop
function update(deltaTime: number) {
  const data = joystick.getData();

  // Move character
  player.x += data.vector.x * playerSpeed * deltaTime;
  player.y += data.vector.y * playerSpeed * deltaTime;

  // Update animation based on direction
  if (data.direction !== 'idle') {
    player.playAnimation(`walk-${data.direction}`);
  } else {
    player.playAnimation('idle');
  }

  // Rotate character to face movement direction
  if (data.magnitude > 0.1) {
    player.rotation = data.angle * (Math.PI / 180);
  }
}
```

### Dual Joystick Setup

```typescript
// Movement joystick (left side)
const moveJoystick = new VirtualJoystick({
  mode: 'dynamic',
  activationZone: { x: 0, y: 0, width: 0.5, height: 1 }
});

// Aim joystick (right side)
const aimJoystick = new VirtualJoystick({
  mode: 'dynamic',
  activationZone: { x: 0.5, y: 0, width: 0.5, height: 1 },
  style: {
    knobColor: 0xFF6B6B,
    borderColor: 0xFF6B6B
  }
});

scene.addChild(moveJoystick.getContainer());
scene.addChild(aimJoystick.getContainer());

function update(deltaTime: number) {
  // Movement
  const move = moveJoystick.getData();
  player.x += move.vector.x * moveSpeed * deltaTime;
  player.y += move.vector.y * moveSpeed * deltaTime;

  // Aiming
  const aim = aimJoystick.getData();
  if (aim.magnitude > 0.1) {
    player.aimAngle = aim.angle;
    if (aim.magnitude > 0.8) {
      player.shoot();
    }
  }
}
```

### Custom Styling

```typescript
const joystick = new VirtualJoystick({
  mode: 'fixed',
  position: { x: 100, y: 500 },
  size: 140,
  knobSize: 60,
  deadZone: 0.15,
  style: {
    baseColor: 0x2196F3,
    baseAlpha: 0.4,
    knobColor: 0xFFFFFF,
    knobAlpha: 0.9,
    borderColor: 0x2196F3,
    borderWidth: 3,
    borderAlpha: 0.8
  }
});
```

## Best Practices

1. **Use dynamic mode for hyper-casual games** - Players expect joystick to appear where they touch
2. **Set appropriate dead zone** - 0.1-0.15 works well for most games
3. **Use activation zone wisely** - Leave room for other UI elements and buttons
4. **Handle the `end` event** - Stop player movement when joystick is released
5. **Consider screen orientation** - Update positions on resize/orientation change

```typescript
window.addEventListener('resize', () => {
  if (joystick.config.mode === 'fixed') {
    joystick.setPosition(100, window.innerHeight - 180);
  }
});
```
