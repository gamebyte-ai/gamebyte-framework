---
id: configuration
title: Configuration
description: Configuring GameByte Framework settings
sidebar_position: 3
keywords: [configuration, settings, options, debug, mobile]
llm_summary: "Configure via createGame({ config }) or game.setConfig(). Key options: renderer (antialias, resolution), debug (showFPS), mobile (touchTargetSize: 44px), physics (gravity)."
---

<!-- llm-context: configuration, settings, options, debug-mode, mobile-optimization, renderer-settings -->

import LiveDemo from '@site/src/components/LiveDemo';

# Configuration

GameByte provides sensible defaults with full customization options.

<LiveDemo
  src="/demos/config-playground-demo.html"
  height={480}
  title="Configuration Playground - Live Settings Editor"
/>

## Configuration Methods

### At Creation

```typescript
const game = createGame({
    debug: true,
    renderer: {
        antialias: true,
        resolution: window.devicePixelRatio
    },
    mobile: {
        touchTargetSize: 44
    }
});
```

### After Creation

```typescript
const game = createGame();

game.setConfig({
    debug: { showFPS: true }
});
```

## Configuration Reference

### Core Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | boolean | `false` | Enable debug mode |
| `version` | string | `'1.0.0'` | Game version |
| `name` | string | `'GameByte App'` | Game name |

```typescript
createGame({
    name: 'My Awesome Game',
    version: '1.2.0',
    debug: process.env.NODE_ENV === 'development'
});
```

### Renderer Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `renderer.antialias` | boolean | `true` | Smooth edges |
| `renderer.resolution` | number | `1` | Pixel density |
| `renderer.backgroundColor` | number | `0x1a1a2e` | Background color |
| `renderer.autoDensity` | boolean | `true` | Match device pixel ratio |
| `renderer.powerPreference` | string | `'default'` | GPU preference |

```typescript
createGame({
    renderer: {
        antialias: true,
        resolution: window.devicePixelRatio,
        backgroundColor: 0x000000,
        autoDensity: true,
        powerPreference: 'high-performance' // or 'low-power'
    }
});
```

### Mobile Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mobile.enabled` | boolean | `true` | Enable mobile optimizations |
| `mobile.touchTargetSize` | number | `44` | Minimum touch target (px) |
| `mobile.preventZoom` | boolean | `true` | Disable pinch zoom |
| `mobile.preventScroll` | boolean | `true` | Disable scroll |
| `mobile.hapticFeedback` | boolean | `true` | Enable vibration |

```typescript
createGame({
    mobile: {
        enabled: true,
        touchTargetSize: 44,
        preventZoom: true,
        preventScroll: true,
        hapticFeedback: true
    }
});
```

### Physics Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `physics.engine` | string | `'matter'` | 2D engine ('matter') |
| `physics.gravity.x` | number | `0` | Horizontal gravity |
| `physics.gravity.y` | number | `1` | Vertical gravity |
| `physics.timestep` | number | `1/60` | Fixed timestep |

```typescript
createGame({
    physics: {
        engine: 'matter',
        gravity: { x: 0, y: 9.8 },
        timestep: 1/60
    }
});
```

### Audio Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `audio.masterVolume` | number | `1` | Master volume (0-1) |
| `audio.musicVolume` | number | `0.7` | Music volume (0-1) |
| `audio.sfxVolume` | number | `1` | SFX volume (0-1) |
| `audio.muted` | boolean | `false` | Global mute |

```typescript
createGame({
    audio: {
        masterVolume: 1,
        musicVolume: 0.7,
        sfxVolume: 1,
        muted: false
    }
});
```

### Debug Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug.showFPS` | boolean | `false` | Show FPS counter |
| `debug.showPhysics` | boolean | `false` | Draw physics bodies |
| `debug.showTouchAreas` | boolean | `false` | Highlight touch targets |
| `debug.logLevel` | string | `'warn'` | Console log level |

```typescript
createGame({
    debug: {
        showFPS: true,
        showPhysics: true,
        showTouchAreas: true,
        logLevel: 'debug' // 'none' | 'error' | 'warn' | 'info' | 'debug'
    }
});
```

## Environment-Based Config

```typescript
const isDev = process.env.NODE_ENV === 'development';

createGame({
    debug: isDev,
    renderer: {
        // Lower resolution in dev for faster iteration
        resolution: isDev ? 1 : window.devicePixelRatio
    },
    debug: {
        showFPS: isDev,
        showPhysics: isDev,
        logLevel: isDev ? 'debug' : 'error'
    }
});
```

## Runtime Configuration

### Reading Config

```typescript
const config = game.getConfig();
console.log(config.renderer.resolution);
```

### Updating Config

```typescript
// Update single value
game.setConfig({ debug: { showFPS: false } });

// Update multiple values
game.setConfig({
    audio: { muted: true },
    renderer: { backgroundColor: 0x000000 }
});
```

### Config Events

```typescript
game.on('config:changed', (key, newValue, oldValue) => {
    console.log(`${key} changed from ${oldValue} to ${newValue}`);
});
```

## Full Default Configuration

```typescript
const defaultConfig = {
    name: 'GameByte App',
    version: '1.0.0',
    debug: false,

    renderer: {
        antialias: true,
        resolution: 1,
        backgroundColor: 0x1a1a2e,
        autoDensity: true,
        powerPreference: 'default'
    },

    mobile: {
        enabled: true,
        touchTargetSize: 44,
        preventZoom: true,
        preventScroll: true,
        hapticFeedback: true
    },

    physics: {
        engine: 'matter',
        gravity: { x: 0, y: 1 },
        timestep: 1/60
    },

    audio: {
        masterVolume: 1,
        musicVolume: 0.7,
        sfxVolume: 1,
        muted: false
    },

    debug: {
        showFPS: false,
        showPhysics: false,
        showTouchAreas: false,
        logLevel: 'warn'
    }
};
```
