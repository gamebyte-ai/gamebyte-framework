---
id: music-sfx
title: Music & Sound Effects
description: Playing music and sound effects
sidebar_position: 2
keywords: [music, sfx, sound effects, background music]
llm_summary: "Music: play(), pause(), resume(), stop(), crossFade(). SFX: play(), playRandom(). Both support volume, loop, and pitch. Use Assets for preloading."
---

<!-- llm-context: music, sfx, sound-effects, audio-playback, crossfade -->

# Music & Sound Effects

## Music

### Basic Playback

```typescript
import { Music } from '@gamebyte/framework';

// Play music
Music.play('assets/music.mp3', {
    volume: 0.7,
    loop: true
});

// Control playback
Music.pause();
Music.resume();
Music.stop();
```

### Crossfade

```typescript
// Fade between tracks
await Music.crossFade('new-track.mp3', {
    duration: 2000,
    volume: 0.7
});
```

### Multiple Tracks

```typescript
// Switch tracks with fade
await Music.play('menu-music.mp3');

// Later...
await Music.crossFade('game-music.mp3', {
    duration: 1000
});
```

## Sound Effects

### Basic Playback

```typescript
import { SFX } from '@gamebyte/framework';

// Play sound
SFX.play('click.mp3');

// With options
SFX.play('explosion.mp3', {
    volume: 1.0,
    pitch: 1.0
});
```

### Variations

```typescript
// Random pitch variation
SFX.play('hit.mp3', {
    pitch: 0.9 + Math.random() * 0.2  // 0.9-1.1
});

// Play random from array
SFX.playRandom(['step1.mp3', 'step2.mp3', 'step3.mp3']);
```

### Preloading

```typescript
import { Assets } from '@gamebyte/framework';

// Preload for instant playback
await Assets.load([
    { key: 'bgm', url: 'music.mp3', type: 'audio' },
    { key: 'click', url: 'click.mp3', type: 'audio' }
]);

// Play preloaded
Music.play('bgm');
SFX.play('click');
```

## Audio Pool

```typescript
// For frequently played sounds, use pooling
const explosionPool = SFX.createPool('explosion.mp3', 5);

// Plays from pool, reusing finished sounds
explosionPool.play();
```
