# GameByte UI Effects for AI Agents

> **Visual polish system** - Celebration effects, sparkles, and shine for mobile games (~1500 tokens)

<!-- keywords: effects, celebration, confetti, sparkle, shine, shimmer, starburst, particles, visual, polish -->

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [CelebrationManager (Recommended)](#celebrationmanager-recommended)
3. [Individual Effect Systems](#individual-effect-systems)
4. [Presets Reference](#presets-reference)
5. [Common Patterns](#common-patterns)

---

## Quick Start

**Simplest usage - 3 lines:**

```typescript
import { CelebrationManager } from 'gamebyte-framework';

const celebration = new CelebrationManager(stage, screenWidth, screenHeight);
game.on('update', (dt) => celebration.update(dt));

// Now use any effect:
celebration.victory();                           // Confetti rain
celebration.addShimmer(coinIcon, 'gold');       // Light sweep on item
celebration.addStarburst(starIcon, 'star');     // Sparkle particles around item
```

**What you get:**
- ✅ Confetti rain/burst/fountain
- ✅ Shimmer light sweep on items
- ✅ Starburst sparkle particles
- ✅ Pre-configured presets for common scenarios
- ✅ Automatic cleanup and memory management

---

## CelebrationManager (Recommended)

The orchestrator for all visual effects. Use this instead of individual systems.

### Constructor

```typescript
const celebration = new CelebrationManager(
  container,      // PIXI.Container or stage
  screenWidth,    // Default: 360
  screenHeight,   // Default: 640
  audioManager?   // Optional: for sound effects
);
```

### Core Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `victory()` | Confetti rain + sound | `void` |
| `defeat()` | Sound only (no confetti) | `void` |
| `levelComplete()` | Confetti rain | `void` |
| `starEarned(x, y, starIndex)` | Burst + sparkle at position | `Promise<void>` |
| `rewardReceived(x, y)` | Burst + sparkle | `Promise<void>` |
| `jackpot(x, y)` | Fountain + multiple sparkles | `Promise<void>` |

### Shimmer Effects (Light Sweep)

Add continuous diagonal light sweep to valuable items:

```typescript
// Using preset
const instance = celebration.addShimmer(coinIcon, 'gold');
celebration.addShimmer(gemIcon, 'gem');
celebration.addShimmer(starIcon, 'star');

// Custom config
celebration.addShimmer(item, {
  width: 20,        // Light streak width
  angle: -30,       // Diagonal angle
  speed: 2000,      // Sweep duration (ms)
  color: 0xFFFFFF,  // Light color
  alpha: 0.5,       // Opacity
  loopDelay: 1500   // Delay between sweeps
});

// Remove
celebration.removeShimmer(coinIcon);

// Control instance
instance.pause();
instance.resume();
instance.stop();
```

### Starburst Effects (Sparkle Particles)

Add continuous sparkle particles around items:

```typescript
// Using preset
const instance = celebration.addStarburst(coinIcon, 'gold');
celebration.addStarburst(gemIcon, 'gem');
celebration.addStarburst(starIcon, 'star');
celebration.addStarburst(trophy, 'victory');

// Custom config
celebration.addStarburst(item, {
  radius: 40,       // Spread radius around item
  count: 5,         // Max concurrent sparkles
  colors: [0xFFD700, 0xFFFFFF],  // Sparkle colors
  duration: 800,    // Single sparkle lifetime (ms)
  spawnDelayMin: 100,  // Min delay between spawns
  spawnDelayMax: 400,  // Max delay between spawns
  scale: { min: 0.2, max: 0.6 },  // Size range
  rotationSpeed: 0.025  // Rotation speed
});

// Remove
celebration.removeStarburst(coinIcon);

// Control instance
instance.pause();
instance.resume();
instance.stop();
instance.setConfig({ count: 8 });  // Update config
```

### Confetti Direct Access

```typescript
celebration.confettiRain(config?);              // Fall from top
celebration.confettiBurst(x, y, config?);       // Explode from point
celebration.confettiFountain(x, y, config?);    // Shoot up then fall
```

### Lifecycle

```typescript
// REQUIRED: Call every frame
game.on('update', (dt) => celebration.update(dt));

// Cleanup
celebration.clear();    // Stop all active effects
celebration.destroy();  // Full cleanup
```

---

## Individual Effect Systems

Use these when you need fine-grained control.

### ConfettiSystem

```typescript
import { ConfettiSystem } from 'gamebyte-framework';

const confetti = new ConfettiSystem(container, screenWidth, screenHeight);

confetti.rain({ particleCount: 80, duration: 3000 });
confetti.burst(x, y, { spread: 60, colors: [0xFFD700] });
confetti.fountain(x, y, { particleCount: 100 });

// Events
confetti.on('complete', () => console.log('Confetti done'));

// Lifecycle
game.on('update', (dt) => confetti.update(dt));
confetti.clear();
confetti.destroy();
```

### ShineEffect

```typescript
import { ShineEffect } from 'gamebyte-framework';

const shine = new ShineEffect(container);

// Shimmer (continuous light sweep)
const shimmerInstance = shine.shimmer(target, config);

// Sparkle (one-time burst at point)
await shine.sparkle(x, y, { particleCount: 8, radius: 30 });

// Lifecycle
game.on('update', (dt) => shine.update(dt));
shine.clear();
shine.destroy();
```

### StarBurstEffect

```typescript
import { StarBurstEffect } from 'gamebyte-framework';

const starburst = new StarBurstEffect(container);

// Add zone around target
const zone = starburst.addZone(target, {
  radius: 40,
  count: 5,
  colors: [0xFFFFFF, 0xFFD700]
});

// Control
zone.pause();
zone.resume();
zone.setConfig({ count: 8 });
zone.stop();

// Query
starburst.hasZone(target);      // boolean
starburst.getZoneCount();       // number
starburst.getParticleCount();   // total particles

// Lifecycle
game.on('update', (dt) => starburst.update(dt));
starburst.removeZoneByTarget(target);
starburst.clear();
starburst.destroy();
```

---

## Presets Reference

### CelebrationPresets

Import and use:

```typescript
import { CelebrationPresets } from 'gamebyte-framework';
```

#### Confetti Presets

| Preset | Particles | Duration | Best For |
|--------|-----------|----------|----------|
| `VICTORY` | 80 | 3000ms | Victory screen |
| `STAR_EARNED` | 25 | 1500ms | Star collection |
| `LEVEL_COMPLETE` | 60 | 2500ms | Level end |
| `REWARD` | 35 | 2000ms | Reward popup |
| `JACKPOT` | 100 | 3500ms | Big win |

#### Shimmer Presets

| Preset | Width | Speed | Best For |
|--------|-------|-------|----------|
| `GOLD_SHIMMER` | 15px | 2000ms | Coins, gold items |
| `GEM_SHIMMER` | 12px | 1800ms | Gems, crystals |
| `STAR_SHIMMER` | 18px | 2200ms | Stars, achievements |

#### Starburst Presets

| Preset | Radius | Count | Best For |
|--------|--------|-------|----------|
| `GOLD_STARBURST` | 35px | 4 | Coins, gold items |
| `GEM_STARBURST` | 30px | 3 | Gems, crystals |
| `STAR_STARBURST` | 40px | 5 | Stars, achievements |
| `VICTORY_STARBURST` | 50px | 6 | Trophy, big rewards |

---

## Common Patterns

### Pattern 1: Result Screen Polish

```typescript
// Victory celebration
celebration.victory();

// Add sparkles to reward icons
rewards.forEach((reward, i) => {
  setTimeout(() => {
    celebration.addShimmer(reward.icon, reward.type);
    celebration.addStarburst(reward.icon, reward.type);
  }, 1500 + i * 200);  // Staggered appearance
});

// Star animations
stars.forEach((star, i) => {
  setTimeout(() => {
    const worldPos = star.getGlobalPosition();
    celebration.starEarned(worldPos.x, worldPos.y, i + 1);
  }, 300 + i * 400);
});
```

### Pattern 2: Item Collection

```typescript
// When coin collected
celebration.confettiBurst(coin.x, coin.y, {
  particleCount: 15,
  colors: [0xFFD700, 0xFFFFFF]
});

// When gem collected
celebration.rewardReceived(gem.x, gem.y);
```

### Pattern 3: Shop Item Highlight

```typescript
// Premium items get continuous sparkle
premiumItems.forEach(item => {
  celebration.addShimmer(item, 'gem');
  celebration.addStarburst(item, 'gem');
});

// On purchase
celebration.jackpot(item.x, item.y);
```

### Pattern 4: Achievement Unlock

```typescript
// Big celebration
celebration.victory();
celebration.jackpot(badge.x, badge.y);

// Add permanent sparkle to badge
celebration.addStarburst(badge, 'victory');
```

---

## Performance Notes

- **Particle limits:** Each system caps concurrent particles
- **Auto-cleanup:** Dead particles removed automatically
- **Memory:** Graphics objects pooled and reused
- **Mobile-safe:** Tested on low-end devices
- **Update required:** Must call `update(dt)` every frame

---

## Events

```typescript
celebration.on('confetti-complete', () => { /* ... */ });
celebration.on('sparkle-complete', ({ x, y }) => { /* ... */ });
celebration.on('starburst-added', (target) => { /* ... */ });
celebration.on('starburst-removed', () => { /* ... */ });
celebration.on('shimmer-added', (target) => { /* ... */ });
celebration.on('shimmer-removed', (target) => { /* ... */ });
celebration.on('cleared', () => { /* ... */ });
```

---

*Last updated: 2026-01-24*
*Target audience: AI agents, autonomous game builders*
*Estimated reading: 4-5 minutes*
