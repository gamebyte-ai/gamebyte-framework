---
id: layout-manager
title: LayoutManager API
description: Core layout management class for responsive game UI
sidebar_position: 3
keywords: [layout-manager, responsive, breakpoints, scaling, api]
llm_summary: "LayoutManager handles layout initialization, responsive scaling, and breakpoints. Use getLayoutManager() for singleton access. Provides presets and responsive utilities."
---

import LiveDemo from '@site/src/components/LiveDemo';

# LayoutManager API

The `LayoutManager` class provides centralized layout management with responsive scaling support.

<LiveDemo src="/demos/layout-demo.html" height="700" title="Layout Manager Demo" />

## Basic Usage

```typescript
import { LayoutManager, getLayoutManager } from 'gamebyte-framework';

// Get singleton instance
const layoutManager = getLayoutManager();

// Initialize with PixiJS app
await layoutManager.initialize(app);

// Set stage layout
layoutManager.setStageLayout({
  width: 1080,
  height: 1920,
  justifyContent: 'center',
  alignItems: 'center'
});
```

## Constructor

```typescript
const layoutManager = new LayoutManager({
  autoUpdate: true,     // Auto-update layouts on changes
  enableDebug: false,   // Show debug visualization
  throttle: 100         // Throttle layout updates (ms)
});
```

## Methods

### initialize(app)

Initialize the layout system with a PixiJS application:

```typescript
await layoutManager.initialize(app);
```

### setStageLayout(config)

Set layout configuration on the application stage:

```typescript
layoutManager.setStageLayout({
  width: app.screen.width,
  height: app.screen.height,
  flexDirection: 'column',
  justifyContent: 'space-between'
});
```

### applyLayout(container, config)

Apply layout to any container:

```typescript
layoutManager.applyLayout(myContainer, {
  flexDirection: 'row',
  gap: 20,
  alignItems: 'center'
});

// Or enable layout participation
layoutManager.applyLayout(child, true);
```

### getPreset(name)

Get a copy of a standard preset:

```typescript
const centerLayout = layoutManager.getPreset('center');
const gridLayout = layoutManager.getPreset('grid');
```

### getGamePreset(name)

Get a copy of a game-specific preset:

```typescript
const hudLayout = layoutManager.getGamePreset('gameScreen');
const buttonLayout = layoutManager.getGamePreset('touchButton');
```

### createContainer(layout)

Create a new container with layout enabled:

```typescript
const flexRow = layoutManager.createContainer({
  flexDirection: 'row',
  gap: 16,
  alignItems: 'center'
});
```

## Responsive Configuration

### setResponsiveConfig(config)

Configure responsive behavior:

```typescript
layoutManager.setResponsiveConfig({
  baseWidth: 1080,
  baseHeight: 1920,
  scaleMode: 'fit',           // 'fit' | 'fill' | 'stretch' | 'none'
  maintainAspectRatio: true,
  breakpoints: [
    { name: 'xs', minWidth: 0, maxWidth: 479, scale: 0.75 },
    { name: 'sm', minWidth: 480, maxWidth: 767, scale: 0.875 },
    { name: 'md', minWidth: 768, maxWidth: 1023, scale: 1 },
    { name: 'lg', minWidth: 1024, maxWidth: 1439, scale: 1.125 },
    { name: 'xl', minWidth: 1440, scale: 1.25 }
  ]
});
```

### handleResize(width, height)

Manually trigger resize handling:

```typescript
window.addEventListener('resize', () => {
  layoutManager.handleResize(window.innerWidth, window.innerHeight);
});
```

### getScale()

Get current scale factor:

```typescript
const scale = layoutManager.getScale();
// Use for manual scaling
element.scale.set(scale);
```

### getCurrentBreakpoint()

Get the current responsive breakpoint:

```typescript
const breakpoint = layoutManager.getCurrentBreakpoint();
// { name: 'md', minWidth: 768, maxWidth: 1023, scale: 1 }

if (breakpoint?.name === 'xs') {
  // Mobile-specific adjustments
}
```

### scaleLayoutForScreen(config)

Scale a layout configuration for current screen:

```typescript
const baseLayout = { padding: 20, gap: 16 };
const scaledLayout = layoutManager.scaleLayoutForScreen(baseLayout);
// padding and gap are scaled by current scale factor
```

## Debug Mode

### setDebugMode(enabled)

Toggle debug visualization:

```typescript
// Enable to see layout boundaries
layoutManager.setDebugMode(true);
```

## Manual Updates

### update(container?)

Manually trigger layout update:

```typescript
// Update entire stage
layoutManager.update();

// Update specific container
layoutManager.update(myContainer);
```

## Events

LayoutManager extends EventEmitter:

```typescript
// Layout system initialized
layoutManager.on('initialized', () => {
  console.log('Layout ready');
});

// Screen resized
layoutManager.on('resize', (width, height, scale) => {
  console.log(`Resized to ${width}x${height}, scale: ${scale}`);
});

// Breakpoint changed
layoutManager.on('breakpoint-change', (current, previous) => {
  console.log(`Breakpoint: ${previous?.name} → ${current?.name}`);
});

// Layout updated
layoutManager.on('layout-update', () => {
  // Layout recalculated
});

// Manager destroyed
layoutManager.on('destroyed', () => {
  // Cleanup
});
```

## Singleton Access

```typescript
import { getLayoutManager, setLayoutManager } from 'gamebyte-framework';

// Get global instance
const manager = getLayoutManager();

// Set custom instance
const customManager = new LayoutManager({ enableDebug: true });
setLayoutManager(customManager);
```

## Utility Methods

### isReady()

Check if layout manager is initialized:

```typescript
if (layoutManager.isReady()) {
  // Safe to use layout features
}
```

### getApp()

Get the PixiJS application:

```typescript
const app = layoutManager.getApp();
```

### getResponsiveConfig()

Get current responsive configuration:

```typescript
const config = layoutManager.getResponsiveConfig();
```

### destroy()

Clean up the layout manager:

```typescript
layoutManager.destroy();
```

## Complete Example

```typescript
import {
  LayoutManager,
  getLayoutManager,
  LayoutPresets,
  GameLayoutPresets
} from 'gamebyte-framework';
import { Application, Container, Graphics, Text } from 'pixi.js';

async function createGame() {
  const app = new Application();
  await app.init({ width: 1080, height: 1920 });

  // Initialize layout manager
  const layout = getLayoutManager();
  await layout.initialize(app);

  // Configure responsive behavior
  layout.setResponsiveConfig({
    baseWidth: 1080,
    baseHeight: 1920,
    scaleMode: 'fit'
  });

  // Set up stage layout
  layout.setStageLayout(GameLayoutPresets.gameScreen);

  // Create top bar
  const topBar = layout.createContainer({
    ...LayoutPresets.topBar,
    height: 80
  });

  // Create content area
  const content = layout.createContainer({
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center'
  });

  // Create bottom bar
  const bottomBar = layout.createContainer({
    ...LayoutPresets.bottomBar,
    height: 100
  });

  // Add to stage
  app.stage.addChild(topBar);
  app.stage.addChild(content);
  app.stage.addChild(bottomBar);

  // Handle resize
  window.addEventListener('resize', () => {
    layout.handleResize(window.innerWidth, window.innerHeight);
  });

  // Listen for breakpoint changes
  layout.on('breakpoint-change', (current) => {
    if (current?.name === 'xs') {
      // Compact mobile layout
    }
  });
}
```

