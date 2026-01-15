# Audio: 3D Spatial Audio

Implement positional audio with distance attenuation and panning.

<!-- keywords: audio, spatial, 3d, positional, distance, attenuation, panning, stereo -->

---

## Basic Spatial Audio

```typescript
const audioManager = game.make('audio');

// Play sound at position with basic configuration
const source = await audioManager.playSFX('explosion', {
  position: { x: 10, y: 0, z: 5 }
});

// Configure spatial audio parameters (optional, per-source)
source.setSpatialConfig({
  rolloffFactor: 1,      // How quickly volume decreases with distance
  refDistance: 10,       // Distance where volume = 1.0
  maxDistance: 100,      // Max audible distance
  distanceModel: 'inverse'
});
```

---

## Listener Position

Update player/camera position:

```typescript
// Update listener to follow player
game.on('update', () => {
  const playerPos = player.getPosition();
  audioManager.spatial.setListenerPosition({
    position: playerPos  // playerPos should be a Vector3 { x, y, z }
  });
});
```

---

## Distance Attenuation Models

Configure per-source using `setSpatialConfig`:

### Linear Model

```typescript
source.setSpatialConfig({
  distanceModel: 'linear'
});
// Volume decreases linearly with distance
```

### Inverse Model (Default)

```typescript
source.setSpatialConfig({
  distanceModel: 'inverse'
});
// Realistic falloff (inverse square law)
```

### Exponential Model

```typescript
source.setSpatialConfig({
  distanceModel: 'exponential'
});
// Rapid falloff at distance
```

---

## Moving Sound Sources

```typescript
class MovingEnemy {
  private audioSource: AudioSource;

  async init() {
    // Start looping sound
    this.audioSource = await audioManager.playSFX('enemy-idle', {
      loop: true,
      position: this.position
    });
  }

  update() {
    // Update sound position
    this.audioSource.setPosition(this.position);
  }

  destroy() {
    this.audioSource.stop();
  }
}
```

---

## Stereo Panning (2D Games)

```typescript
// Simple left-right panning using 3D position with z=0
const panX = (enemyX - playerX) / screenWidth * 10;  // Scale to reasonable distance

const source = await audioManager.playSFX('footstep', {
  position: { x: panX, y: 0, z: 0 },  // Use X axis for left-right panning
  volume: 0.5
});
```

---

## Doppler Effect

```typescript
// Configure Doppler effect per-source
source.setSpatialConfig({
  speedOfSound: 343,     // meters per second
  dopplerFactor: 1.0     // 0 = disabled, 1 = realistic
});

// Update velocity for Doppler calculation
source.setVelocity({ x: velocityX, y: velocityY, z: velocityZ });
```

---

## Performance Optimization

### Max Concurrent Sounds

```typescript
// Configure during initialization
await audioManager.initialize({
  maxConcurrentSounds: 32  // Limit CPU usage
});
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
