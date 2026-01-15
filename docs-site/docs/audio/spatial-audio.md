---
id: spatial-audio
title: Spatial Audio
description: 3D positional audio
sidebar_position: 3
keywords: [spatial, 3d audio, positional, panning]
llm_summary: "Spatial audio: Spatial.play(key, { position }). Set listener: Spatial.setListener(camera). Sounds pan and attenuate based on distance."
---

<!-- llm-context: spatial-audio, 3d-audio, positional-sound, panning, attenuation -->

import LiveDemo from '@site/src/components/LiveDemo';

# Spatial Audio

3D positioned audio for immersive sound.

## Basic Usage

```typescript
import { Spatial } from 'gamebyte-framework';

// Set listener position (usually camera)
Spatial.setListener({
    position: camera.position,
    orientation: camera.quaternion
});

// Play sound at position
Spatial.play('explosion', {
    position: { x: 10, y: 0, z: 5 }
});
```

<LiveDemo
  src="/demos/audio-spatial.html"
  height={400}
  title="Spatial Audio Demo"
/>

## Configuration

```typescript
Spatial.play('footstep', {
    position: { x: 5, y: 0, z: 3 },
    volume: 1.0,
    refDistance: 1,      // Full volume distance
    maxDistance: 50,     // Sound cutoff
    rolloffFactor: 1,    // Attenuation curve
    loop: false
});
```

## Updating Listener

```typescript
// Update every frame for moving listener
function update(deltaTime: number) {
    Spatial.setListener({
        position: player.position,
        orientation: player.quaternion
    });
}
```

## Sound Sources

```typescript
// Create persistent sound source
const ambience = Spatial.createSource('forest-ambience', {
    position: { x: 0, y: 0, z: 0 },
    loop: true,
    volume: 0.5
});

ambience.play();

// Update position
ambience.setPosition({ x: 10, y: 0, z: 5 });

// Stop
ambience.stop();
```

## 2D Panning (For 2D Games)

```typescript
import { Spatial } from 'gamebyte-framework';

// Enable 2D mode (left/right panning only)
Spatial.setMode('2d');

// Play with panning based on X position
Spatial.play('hit', {
    position: { x: -100, y: 0 }  // Left side
});
```
