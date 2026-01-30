# Pixi.js v8 Quick Reference

> **CRITICAL**: GameByte Framework uses Pixi.js v8. All code MUST follow v8 patterns.
> Legacy v7 APIs (beginFill, drawRect, endFill) are DEPRECATED and will NOT work.

## Table of Contents
- [Graphics API](#graphics-api)
- [Fill & Stroke](#fill--stroke)
- [FillGradient](#fillgradient)
- [Text](#text)
- [Container](#container)
- [Sprite](#sprite)
- [Migration from v7](#migration-from-v7)
- [Best Practices](#best-practices)

---

## Graphics API

### Shape Methods (v8 Modern API)

```javascript
// ✅ CORRECT - Pixi v8 style
graphics.rect(x, y, width, height);
graphics.roundRect(x, y, width, height, radius);
graphics.circle(x, y, radius);
graphics.ellipse(x, y, radiusX, radiusY);
graphics.poly([x1, y1, x2, y2, x3, y3, ...]);

// Path drawing
graphics.moveTo(x, y);
graphics.lineTo(x, y);
graphics.arc(cx, cy, radius, startAngle, endAngle, anticlockwise?);
graphics.closePath();

// Apply fill/stroke AFTER shape
graphics.fill(color);
graphics.fill({ color: 0xFF0000, alpha: 0.5 });
graphics.stroke({ color: 0x000000, width: 2 });
```

### Complete Shape Drawing Pattern

```javascript
const graphics = new PIXI.Graphics();

// Draw shape, then fill/stroke
graphics.roundRect(0, 0, 200, 60, 12);
graphics.fill(0x4CAF50);
graphics.stroke({ color: 0x2E7D32, width: 2 });

// Multiple shapes in one Graphics object
graphics.circle(100, 100, 50);
graphics.fill({ color: 0x2196F3, alpha: 0.8 });

graphics.rect(200, 50, 80, 40);
graphics.fill(0xFFC107);
```

### Path Drawing with moveTo/lineTo

```javascript
// Draw custom polygon using paths
graphics.moveTo(0, 0);
graphics.lineTo(100, 0);
graphics.lineTo(100, 100);
graphics.lineTo(0, 100);
graphics.closePath();
graphics.fill({ color: 0xFF5722, alpha: 0.6 });

// Arc segment
graphics.moveTo(50, 50);
graphics.arc(50, 50, 40, 0, Math.PI / 2);
graphics.closePath();
graphics.fill(0x9C27B0);
```

---

## Fill & Stroke

### Color Formats

```javascript
// All valid color formats
graphics.fill(0xFF0000);           // Hex number
graphics.fill('#FF0000');          // Hex string
graphics.fill('red');              // CSS color name
graphics.fill('rgb(255, 0, 0)');   // RGB string
graphics.fill([255, 0, 0]);        // Array [R, G, B]
```

### Fill with Options

```javascript
graphics.fill({
    color: 0x4CAF50,
    alpha: 0.8
});
```

### Stroke Options

```javascript
graphics.stroke({
    color: 0x000000,
    width: 3,
    alpha: 1,
    alignment: 0.5  // 0 = inner, 0.5 = center, 1 = outer
});
```

---

## FillGradient

### Linear Gradient

```javascript
import { FillGradient } from 'pixi.js';

// Vertical gradient (top to bottom)
const gradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },     // Top (normalized 0-1)
    end: { x: 0, y: 1 },       // Bottom
    colorStops: [
        { offset: 0, color: 0x4DA6FF },   // Top color
        { offset: 1, color: 0x2E7BC9 }    // Bottom color
    ],
    textureSpace: 'local'  // 'local' = relative to shape bounds
});

graphics.roundRect(0, 0, 200, 60, 12);
graphics.fill(gradient);
```

### Horizontal Gradient

```javascript
const gradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },     // Left
    end: { x: 1, y: 0 },       // Right
    colorStops: [
        { offset: 0, color: 0xFF6B6B },
        { offset: 1, color: 0x4ECDC4 }
    ],
    textureSpace: 'local'
});
```

### Diagonal Gradient

```javascript
const gradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },     // Top-left
    end: { x: 1, y: 1 },       // Bottom-right
    colorStops: [
        { offset: 0, color: 0xFFA500 },
        { offset: 1, color: 0xFF4500 }
    ],
    textureSpace: 'local'
});
```

### Multi-Stop Gradient

```javascript
const gradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
        { offset: 0, color: 0x0066CC },
        { offset: 0.3, color: 0x0088EE },
        { offset: 0.6, color: 0x00AAFF },
        { offset: 1, color: 0x66CCFF }
    ],
    textureSpace: 'local'
});
```

### Radial Gradient

```javascript
const gradient = new FillGradient({
    type: 'radial',
    center: { x: 0.5, y: 0.5 },        // Inner circle center
    innerRadius: 0,                     // Inner radius
    outerCenter: { x: 0.5, y: 0.5 },   // Outer circle center
    outerRadius: 0.5,                   // Outer radius
    colorStops: [
        { offset: 0, color: 0xFFFFFF },
        { offset: 1, color: 0x000000 }
    ],
    textureSpace: 'local'
});
```

### textureSpace Options

- `'local'` (default): Gradient coordinates (0-1) are relative to shape bounds
- `'global'`: Coordinates relative to Graphics object's coordinate system

### Gradient Performance Tips

```javascript
// ✅ GOOD - Reuse gradients
const buttonGradient = new FillGradient({ ... });
button1.fill(buttonGradient);
button2.fill(buttonGradient);

// ✅ GOOD - Destroy when done
gradient.destroy();

// ❌ BAD - Creating new gradient every frame
function animate() {
    const gradient = new FillGradient({ ... }); // Memory leak!
}
```

---

## Text

### Basic Text

```javascript
import { Text, TextStyle } from 'pixi.js';

const text = new Text({
    text: 'Hello World',
    style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
    }
});

text.anchor.set(0.5);  // Center anchor
text.x = 100;
text.y = 50;
```

### TextStyle Options

```javascript
const style = new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 36,
    fontWeight: 'bold',
    fontStyle: 'italic',
    fill: 0xFFFFFF,
    align: 'center',                    // 'left', 'center', 'right'

    // Stroke (v8 object format)
    stroke: {
        color: 0x000000,
        width: 4
    },

    // Drop Shadow (v8 object format)
    dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 2,
        angle: Math.PI / 4,
        alpha: 0.5
    },

    // Word wrap
    wordWrap: true,
    wordWrapWidth: 200,
    lineHeight: 28
});

const text = new Text({ text: 'Styled Text', style });
```

---

## Container

### Creating Containers

```javascript
import { Container } from 'pixi.js';

const container = new Container();
container.x = 100;
container.y = 50;
container.scale.set(1.5);
container.rotation = Math.PI / 4;
container.alpha = 0.8;
```

### Child Management

```javascript
// Add children
container.addChild(sprite);
container.addChild(graphics);
container.addChildAt(text, 0);  // At specific index

// Remove children
container.removeChild(sprite);
container.removeChildAt(0);
container.removeChildren();  // Remove all

// Access children
const child = container.getChildAt(0);
const index = container.getChildIndex(sprite);

// Find by label (v8 uses 'label' instead of 'name')
container.label = 'myContainer';
const found = parent.getChildByLabel('myContainer');
```

### v8 Container Features

```javascript
// Use 'label' property for naming
container.label = 'playerSprite';
const found = parent.getChildByLabel('playerSprite');

// Cache as texture for performance
container.cacheAsTexture();
container.updateCacheTexture();
container.cacheAsTexture(false);  // Disable
```

---

## Sprite

### Creating Sprites

```javascript
import { Assets, Sprite } from 'pixi.js';

// Load texture first
const texture = await Assets.load('path/to/image.png');

// Create sprite
const sprite = new Sprite(texture);
sprite.anchor.set(0.5);      // Center anchor
sprite.position.set(100, 100);
sprite.scale.set(2);
sprite.rotation = Math.PI / 4;
sprite.tint = 0xFF0000;      // Color tint
```

### Sprite from existing texture

```javascript
// If texture already loaded
const sprite = new Sprite(PIXI.Texture.from('myTexture'));
```

---

## API Reference

### Graphics Methods

| Method | Description |
|--------|-------------|
| `rect(x, y, w, h)` | Draw rectangle |
| `roundRect(x, y, w, h, r)` | Draw rounded rectangle |
| `circle(x, y, r)` | Draw circle |
| `ellipse(x, y, w, h)` | Draw ellipse |
| `poly(points)` | Draw polygon |
| `fill(color)` | Fill shape with color |
| `stroke({ width, color })` | Stroke shape outline |

### Application Initialization

```javascript
// Async initialization required
const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });
```

### Graphics Pattern

```javascript
// Draw shape first, then apply fill/stroke
graphics.rect(0, 0, 100, 50);
graphics.fill(0xFF0000);
graphics.stroke({ color: 0x000000, width: 2 });
```

---

## Best Practices

### Graphics Performance

```javascript
// ✅ GOOD - Reuse GraphicsContext
const context = new GraphicsContext()
    .circle(0, 0, 50)
    .fill('red');

const circle1 = new Graphics(context);
const circle2 = new Graphics(context);

// ✅ GOOD - Don't rebuild every frame
// Build once, transform as needed
graphics.x = newX;
graphics.rotation = newRotation;

// ❌ BAD - Rebuilding graphics every frame
function animate() {
    graphics.clear();
    graphics.circle(x, y, 50);  // Rebuilding geometry
    graphics.fill('red');
}
```

### Memory Management

```javascript
// Always destroy when removing
sprite.destroy();
graphics.destroy();
container.destroy({ children: true });  // Destroy children too

// Destroy gradients
gradient.destroy();
```

### Interaction (v8)

```javascript
// ✅ v8 - Use eventMode
graphics.eventMode = 'static';   // For interactive elements
graphics.eventMode = 'dynamic';  // For moving interactive elements
graphics.eventMode = 'none';     // Disable interaction
graphics.cursor = 'pointer';

// Events
graphics.on('pointerdown', (event) => { });
graphics.on('pointerup', (event) => { });
graphics.on('pointerover', (event) => { });
graphics.on('pointerout', (event) => { });
```

### Common Patterns

```javascript
// Rounded button with gradient
const button = new Graphics();
const gradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
        { offset: 0, color: 0x4CAF50 },
        { offset: 1, color: 0x388E3C }
    ],
    textureSpace: 'local'
});
button.roundRect(0, 0, 200, 60, 12);
button.fill(gradient);
button.eventMode = 'static';
button.cursor = 'pointer';

// Light rays with fade effect
for (let i = 0; i < rayCount; i++) {
    const ray = new Graphics();
    for (let s = 0; s < segments; s++) {
        const alpha = 0.5 * (1 - s / segments);
        ray.moveTo(/* inner point */);
        ray.lineTo(/* outer point */);
        ray.lineTo(/* outer point */);
        ray.lineTo(/* inner point */);
        ray.closePath();
        ray.fill({ color: 0xFFFFFF, alpha });
    }
}
```

---

## Framework Integration

### GameByte Graphics Factory

The framework provides `IGraphics` interface that wraps Pixi.js v8:

```javascript
import { graphics } from 'gamebyte-framework';

const gfx = graphics();

// All methods follow v8 patterns
const container = gfx.createContainer();
const g = gfx.createGraphics();
const text = gfx.createText('Hello', { fontSize: 24 });

// Graphics methods
g.roundRect(0, 0, 100, 50, 10);
g.fill({ color: 0x4CAF50, alpha: 0.8 });
g.stroke({ color: 0x2E7D32, width: 2 });
```

### Gradients Helper

```javascript
import { Gradients } from 'gamebyte-framework';

// Quick gradient creation
const vertical = Gradients.linear.vertical(0x4DA6FF, 0x2E7BC9);
const horizontal = Gradients.linear.horizontal(0xFF6B6B, 0x4ECDC4);
const diagonal = Gradients.linear.diagonal(0xFFA500, 0xFF4500);

// Use with graphics
graphics.roundRect(0, 0, 200, 60, 12);
graphics.fill(vertical);
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    PIXI.JS v8 QUICK REF                     │
├─────────────────────────────────────────────────────────────┤
│  SHAPES                                                     │
│  rect(x, y, w, h)          roundRect(x, y, w, h, r)        │
│  circle(x, y, r)           ellipse(x, y, rx, ry)           │
│  poly([x1,y1,x2,y2...])                                    │
├─────────────────────────────────────────────────────────────┤
│  PATHS                                                      │
│  moveTo(x, y)              lineTo(x, y)                    │
│  arc(cx, cy, r, start, end)   closePath()                  │
├─────────────────────────────────────────────────────────────┤
│  FILL & STROKE (after shape!)                              │
│  fill(color)               fill({ color, alpha })          │
│  stroke({ color, width, alpha })                           │
├─────────────────────────────────────────────────────────────┤
│  GRADIENT                                                   │
│  new FillGradient({                                        │
│    type: 'linear',                                         │
│    start: { x: 0, y: 0 }, end: { x: 0, y: 1 },            │
│    colorStops: [{ offset: 0, color }, ...],                │
│    textureSpace: 'local'                                   │
│  })                                                         │
├─────────────────────────────────────────────────────────────┤
│  INTERACTION                                                │
│  eventMode = 'static' | 'dynamic' | 'none'                 │
│  cursor = 'pointer'                                        │
│  on('pointerdown', handler)                                │
└─────────────────────────────────────────────────────────────┘
```
