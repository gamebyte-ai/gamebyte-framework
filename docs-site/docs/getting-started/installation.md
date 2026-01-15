---
id: installation
title: Installation
description: How to install GameByte Framework in your project
sidebar_position: 1
keywords: [install, npm, cdn, setup, typescript]
llm_summary: "Install via npm: 'npm install gamebyte-framework'. For browser: use UMD build with Pixi.js CDN. Supports ESM, CJS, and UMD formats."
---

<!-- llm-context: installation, npm, cdn, umd, esm, cjs, typescript, pixi-peer-dependency -->

# Installation

GameByte Framework can be installed via npm or used directly in the browser via CDN.

## npm (Recommended)

```bash
npm install gamebyte-framework
```

### Peer Dependencies

GameByte requires these peer dependencies based on your usage:

```bash
# For 2D games
npm install pixi.js

# For 3D games
npm install three

# For 2D physics
npm install matter-js

# For 3D physics
npm install cannon-es
```

### TypeScript Configuration

GameByte is written in TypeScript and includes type definitions. No additional @types packages needed.

```json
// tsconfig.json (recommended settings)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## CDN (Browser)

For quick prototyping or simple games, use the UMD build:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
    <style>
        body { margin: 0; overflow: hidden; }
        canvas { display: block; }
    </style>
</head>
<body>
    <!-- Load Pixi.js from CDN (required for 2D) -->
    <script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>

    <!-- Load GameByte -->
    <script src="https://cdn.jsdelivr.net/npm/gamebyte-framework/dist/gamebyte.umd.js"></script>

    <script>
        const game = GameByteFramework.createGame();
        // Your game code...
    </script>
</body>
</html>
```

### Optional CDN Dependencies

```html
<!-- For 3D rendering -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160/build/three.min.js"></script>

<!-- For 2D physics -->
<script src="https://cdn.jsdelivr.net/npm/matter-js@0.19/build/matter.min.js"></script>

<!-- For 3D physics -->
<script src="https://cdn.jsdelivr.net/npm/cannon-es@0.20/dist/cannon-es.js"></script>
```

## Module Formats

GameByte provides multiple module formats:

| Format | File | Use Case |
|--------|------|----------|
| ESM | `dist/index.js` | Modern bundlers (Vite, Webpack 5) |
| CJS | `dist/index.cjs.js` | Node.js, older bundlers |
| UMD | `dist/gamebyte.umd.js` | Browser script tag |

### ESM Import

```typescript
import { createGame, UIButton, BaseScene } from 'gamebyte-framework';
```

### Selective Imports

For smaller bundles, import specific modules:

```typescript
// Only 2D rendering
import { PixiRenderer } from 'gamebyte-framework/2d';

// Only 3D rendering
import { ThreeRenderer } from 'gamebyte-framework/3d';

// Only 2D physics
import { MatterPhysics } from 'gamebyte-framework/physics2d';
```

## Verification

Verify installation with a simple test:

```typescript
import { createGame } from 'gamebyte-framework';

const game = createGame();
console.log('GameByte version:', game.version);
// Should output: "GameByte version: 1.0.0"
```

## Next Steps

- [Quick Start](/getting-started/quick-start) - Build your first game
- [First Game Tutorial](/getting-started/first-game-tutorial) - Step-by-step guide
