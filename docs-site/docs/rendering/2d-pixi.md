---
id: 2d-pixi
title: 2D Rendering (Pixi.js)
description: 2D game rendering with Pixi.js v8
sidebar_position: 2
keywords: [2d, pixi, sprites, textures, filters, graphics]
llm_summary: "Pixi.js v8 renderer. Create sprites: new PIXI.Sprite(texture). Add to scene: scene.container.addChild(sprite). Use Graphics for shapes. Filters for effects."
---

<!-- llm-context: 2d-rendering, pixi-v8, sprites, textures, graphics, filters, webgl, batching -->

import LiveDemo from '@site/src/components/LiveDemo';

# 2D Rendering (Pixi.js)

GameByte uses Pixi.js v8 for high-performance 2D rendering with WebGL/WebGPU.

## Basic Setup

```typescript
import { createGame } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

const game = createGame();
await game.initialize(canvas, '2d');

const renderer = game.make('renderer');
```

## Sprites

### Creating Sprites

```typescript
// From URL
const sprite = PIXI.Sprite.from('assets/player.png');

// From preloaded texture
const texture = await PIXI.Assets.load('assets/player.png');
const sprite = new PIXI.Sprite(texture);

// Set properties
sprite.anchor.set(0.5); // Center anchor
sprite.position.set(400, 300);
sprite.scale.set(2);
sprite.rotation = Math.PI / 4;
sprite.alpha = 0.8;

// Add to scene
scene.container.addChild(sprite);
```

### Sprite Sheet Animation

```typescript
// Load sprite sheet
const sheet = await PIXI.Assets.load('assets/player.json');

// Get animation frames
const frames = [];
for (let i = 0; i < 8; i++) {
    frames.push(PIXI.Texture.from(`walk_${i}.png`));
}

// Create animated sprite
const animated = new PIXI.AnimatedSprite(frames);
animated.animationSpeed = 0.15;
animated.play();

scene.container.addChild(animated);
```

<LiveDemo
  src="/demos/sprites-animation.html"
  height={300}
  title="Sprite Animation"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Graphics API

Draw shapes procedurally with Pixi v8 API:

```typescript
const graphics = new PIXI.Graphics();

// Rectangle
graphics.rect(0, 0, 100, 50);
graphics.fill(0x4CAF50);

// Rounded rectangle
graphics.roundRect(120, 0, 100, 50, 10);
graphics.fill(0x2196F3);

// Circle
graphics.circle(300, 25, 25);
graphics.fill(0xF44336);

// Line
graphics.moveTo(0, 100);
graphics.lineTo(400, 100);
graphics.stroke({ width: 4, color: 0xFFFFFF });

// Polygon
graphics.poly([350, 0, 400, 50, 350, 50]);
graphics.fill(0x9C27B0);

scene.container.addChild(graphics);
```

<LiveDemo
  src="/demos/graphics-shapes.html"
  height={200}
  title="Graphics Shapes"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Text

### Canvas Text

```typescript
// Pixi v8 Text constructor uses object format
const text = new PIXI.Text({
    text: 'Hello World!',
    style: {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 4 },
        dropShadow: {
            color: 0x000000,
            blur: 2,
            distance: 2
        }
    }
});

text.anchor.set(0.5);
text.position.set(400, 300);

scene.container.addChild(text);
```

### Bitmap Text (Better Performance)

```typescript
// Load bitmap font
await PIXI.Assets.load('assets/fonts/game-font.fnt');

const bitmapText = new PIXI.BitmapText('Score: 1000', {
    fontName: 'GameFont',
    fontSize: 32
});

scene.container.addChild(bitmapText);
```

## Filters

Apply visual effects:

```typescript
import { BlurFilter, GlowFilter, OutlineFilter } from 'pixi-filters';

// Blur
sprite.filters = [new PIXI.BlurFilter(4)];

// Glow (requires pixi-filters)
sprite.filters = [new GlowFilter({
    distance: 15,
    outerStrength: 2,
    color: 0xff0000
})];

// Multiple filters
sprite.filters = [
    new PIXI.BlurFilter(2),
    new GlowFilter({ color: 0x00ff00 })
];
```

<LiveDemo
  src="/demos/filters-effects.html"
  height={300}
  title="Filter Effects"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Containers

Organize display objects:

```typescript
// Group objects
const container = new PIXI.Container();
container.addChild(sprite1, sprite2, sprite3);
container.position.set(100, 100);

// All children move together
container.x += 50;

// Sorting (z-index)
container.sortableChildren = true;
sprite1.zIndex = 1;
sprite2.zIndex = 2;
container.sortChildren();
```

## Masks

Clip rendering to a shape:

```typescript
// Graphics mask (Pixi v8)
const mask = new PIXI.Graphics();
mask.circle(200, 200, 100);
mask.fill(0xffffff);

sprite.mask = mask;

// Sprite mask (alpha-based)
const alphaMask = PIXI.Sprite.from('assets/mask.png');
sprite.mask = alphaMask;
```

## Tiling Sprite

For backgrounds that repeat:

```typescript
const tilingSprite = new PIXI.TilingSprite(
    PIXI.Texture.from('assets/background.png'),
    800, // width
    600  // height
);

// Scroll the background
function update(deltaTime: number) {
    tilingSprite.tilePosition.x -= 100 * deltaTime;
}
```

## Render Textures

Render to texture for effects:

```typescript
// Create render texture
const renderTexture = PIXI.RenderTexture.create({
    width: 256,
    height: 256
});

// Render container to texture
renderer.render(container, { renderTexture });

// Use as sprite
const snapshot = new PIXI.Sprite(renderTexture);
```

## Performance Tips

### 1. Batch Similar Sprites

```typescript
// Good: Same texture atlas
sprites.forEach(s => {
    s.texture = atlas.textures['sprite.png'];
});
```

### 2. Use Sprite Pools

```typescript
class BulletPool {
    private pool: PIXI.Sprite[] = [];

    get(): PIXI.Sprite {
        return this.pool.pop() || new PIXI.Sprite(bulletTexture);
    }

    release(sprite: PIXI.Sprite): void {
        sprite.visible = false;
        this.pool.push(sprite);
    }
}
```

### 3. Minimize Filter Usage

```typescript
// Avoid: Filter on every sprite
sprites.forEach(s => s.filters = [new BlurFilter()]);

// Better: Filter on container
container.filters = [new BlurFilter()];
```

### 4. Use ParticleContainer for Many Similar Sprites

```typescript
const particles = new PIXI.ParticleContainer(10000, {
    position: true,
    rotation: true,
    alpha: true
});

// Add particles (faster than Container)
for (let i = 0; i < 10000; i++) {
    const particle = new PIXI.Sprite(particleTexture);
    particles.addChild(particle);
}
```
