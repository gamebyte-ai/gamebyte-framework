---
id: overview
title: Layout System Overview
description: Yoga-powered flexbox layout system for responsive game UI
sidebar_position: 1
keywords: [layout, flexbox, yoga, responsive, pixi-layout]
llm_summary: "GameByte uses @pixi/layout (Yoga flexbox engine) for responsive UI layouts. Supports flex direction, justify content, align items, gap, wrap, and percentage sizing."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Layout System

GameByte integrates [@pixi/layout](https://layout.pixijs.io/) - a powerful Yoga-based flexbox layout system for PixiJS. This enables CSS-like flexbox layouts for game UI.

<LiveDemo src="/demos/2048-demo.html" height="600" title="2048 - Grid Layout in Action" />

<LiveDemo src="/demos/layout-demo.html" height="800" title="Layout System Demo" />

## Why Flexbox for Games?

- **Responsive Design**: Automatically adapts to different screen sizes
- **Familiar API**: Uses CSS flexbox properties developers already know
- **Powerful Nesting**: Complex layouts through nested containers
- **Performance**: Yoga layout engine is highly optimized

## Quick Example

```typescript
import { Application, Container, Graphics } from 'pixi.js';
import '@pixi/layout'; // Enables layout property on containers

const app = new Application();
await app.init({ width: 800, height: 600 });

// Enable flexbox on stage
app.stage.layout = {
  width: 800,
  height: 600,
  justifyContent: 'center',
  alignItems: 'center'
};

// Create a centered box
const box = new Container();
box.layout = { width: 200, height: 200 };

const bg = new Graphics();
bg.roundRect(0, 0, 200, 200, 12);
bg.fill({ color: 0x4ecca3 });
box.addChild(bg);

app.stage.addChild(box);
```

## Key Features

### Flex Direction

```typescript
// Horizontal row
container.layout = {
  flexDirection: 'row',
  gap: 20
};

// Vertical column
container.layout = {
  flexDirection: 'column',
  gap: 10
};
```

### Justify & Align

```typescript
container.layout = {
  justifyContent: 'space-between', // Main axis distribution
  alignItems: 'center'             // Cross axis alignment
};
```

### Flex Wrap (Grid-like)

```typescript
container.layout = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8
};
```

### Percentage Sizing

```typescript
child.layout = {
  width: '50%',
  height: '100%'
};
```

## Framework Integration

GameByte provides additional utilities:

- **LayoutManager**: Centralized layout management with responsive scaling
- **LayoutPresets**: Pre-defined layouts for common UI patterns
- **GameLayoutPresets**: Game-specific layouts (HUD, menus, etc.)

```typescript
import {
  LayoutManager,
  LayoutPresets,
  GameLayoutPresets
} from 'gamebyte-framework';

// Use presets
container.layout = LayoutPresets.center;
hudContainer.layout = GameLayoutPresets.gameScreen;
```

## Next Steps

- [Layout Presets](./presets) - Pre-defined layout configurations
- [LayoutManager API](./layout-manager) - Advanced layout management
- [Examples](./examples) - Common layout patterns for games
