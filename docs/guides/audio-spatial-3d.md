# Audio: 3D Spatial Audio

Implement positional audio with distance attenuation and panning.

<!-- keywords: audio, spatial, 3d, positional, distance, attenuation, panning, stereo -->

---

## Basic Spatial Audio

```typescript
const audioManager = game.make('audio');

// Play sound at position
await audioManager.playSFX('explosion', {
  position: { x: 10, y: 0, z: 5 },
  rolloffFactor: 1,      // How quickly volume decreases with distance
  refDistance: 10,       // Distance where volume = 1.0
  maxDistance: 100       // Max audible distance
});
```

---

## Listener Position

Update player/camera position:

```typescript
// Update listener to follow player
game.on('update', () => {
  const playerPos = player.getPosition();
  audioManager.setListenerPosition(
    playerPos.x,
    playerPos.y,
    playerPos.z
  );
});
```

---

## Distance Attenuation Models

### Linear Model

```typescript
audioManager.setDistanceModel('linear');
// Volume decreases linearly with distance
```

### Inverse Model (Default)

```typescript
audioManager.setDistanceModel('inverse');
// Realistic falloff (inverse square law)
```

### Exponential Model

```typescript
audioManager.setDistanceModel('exponential');
// Rapid falloff at distance
```

---

## Moving Sound Sources

```typescript
class MovingEnemy {
  private soundId: string;

  async init() {
    // Start looping sound
    this.soundId = await audioManager.playSFX('enemy-idle', {
      loop: true,
      position: this.position
    });
  }

  update() {
    // Update sound position
    audioManager.updateSoundPosition(this.soundId, this.position);
  }

  destroy() {
    audioManager.stopSFX(this.soundId);
  }
}
```

---

## Stereo Panning (2D Games)

```typescript
// Simple left-right panning
const pan = (playerX - enemyX) / screenWidth;  // -1 to 1

await audioManager.playSFX('footstep', {
  pan: pan,      // -1 (left) to 1 (right)
  volume: 0.5
});
```

---

## Doppler Effect

```typescript
audioManager.enableDoppler({
  speedOfSound: 343,     // meters per second
  dopplerFactor: 1.0     // 0 = disabled, 1 = realistic
});
```

---

## Performance Optimization

### Max Concurrent Sounds

```typescript
audioManager.setMaxConcurrentSounds(32);  // Limit CPU usage
```

### Distance Culling

```typescript
// Don't play sounds too far away
const distance = calculateDistance(player, enemy);
if (distance < 50) {  // Only play within 50 units
  await audioManager.playSFX('enemy-attack', {
    position: enemy.position
  });
}
```

---

## Related Guides

- `audio-music-layers.md` - Layered music system
- `audio-mobile-optimization.md` - Mobile audio performance
- `performance-optimization-mobile.md` - General optimization

---
