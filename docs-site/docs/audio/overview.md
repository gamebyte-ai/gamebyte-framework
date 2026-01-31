---
id: overview
title: Audio Overview
description: GameByte audio system overview
sidebar_position: 1
keywords: [audio, sound, music, sfx]
llm_summary: "Audio system: Music (background loops), SFX (effects), Spatial (3D positioned). Use Music.play(), SFX.play(), Spatial.play(). Mobile-optimized with unlock handling."
---

<!-- llm-context: audio-system, music, sfx, spatial-audio, mobile-audio -->

# Audio Overview

GameByte's audio system handles music, sound effects, and spatial audio.

## Audio Types

| Type | Use Case | Example |
|------|----------|---------|
| Music | Background loops | `Music.play('bgm.mp3')` |
| SFX | Short effects | `SFX.play('click.mp3')` |
| Spatial | 3D positioned audio | `Spatial.play('explosion', position)` |

## Quick Start

```typescript
import { Music, SFX, Audio } from '@gamebyte/framework';

// Play background music
Music.play('assets/music.mp3', { loop: true, volume: 0.7 });

// Play sound effect
SFX.play('assets/click.mp3');

// Global volume
Audio.setMasterVolume(0.8);
```

## Mobile Considerations

Audio on mobile requires user interaction to unlock:

```typescript
import { Audio } from '@gamebyte/framework';

// GameByte handles unlock automatically
// Audio plays after first touch/click

// Or manually control
if (Audio.isLocked()) {
    // Show "Tap to enable sound" message
}

Audio.on('unlocked', () => {
    Music.play('assets/music.mp3');
});
```

## Volume Control

```typescript
// Master (affects all)
Audio.setMasterVolume(0.8);

// Category volumes
Audio.setMusicVolume(0.5);
Audio.setSFXVolume(1.0);

// Mute/unmute
Audio.mute();
Audio.unmute();
Audio.toggle();
```

## Live Demo

import LiveDemo from '@site/src/components/LiveDemo';

<LiveDemo src="/demos/audio-demo.html" height="550" title="Audio System Demo" />
