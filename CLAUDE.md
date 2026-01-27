# GameByte Framework - Claude Code Instructions

## Project Overview

GameByte is a modern mobile-first game development framework that unifies 2D and 3D game development using **Laravel-inspired architecture**. Built with TypeScript, it provides service providers, dependency injection, facades, and a powerful abstraction layer over Pixi.js v8 (2D) and Three.js (3D).

## Quick Reference

### Build & Development

```bash
npm run build          # Build (TypeScript + Rollup ESM/CJS/UMD)
npm run dev            # Watch mode (TypeScript only)
npm test               # Run all tests
npm run test:watch     # Watch tests
npm run test:coverage  # Coverage report
npm run lint           # ESLint check
npx http-server -p 8080  # Serve demos locally
```

### Key Directories

```
src/
├── core/           # ServiceContainer, GameByte main class
├── contracts/      # TypeScript interfaces (Graphics, Audio, Physics, etc.)
├── facades/        # Static facades (Renderer, Scenes, UI, Audio, Input, etc.)
├── rendering/      # PixiRenderer, ThreeRenderer, HybridRenderer
├── ui/             # UI components, screens, panels, themes
│   ├── components/ # UIButton, UIPanel, GameStyleButton, TopBar, etc.
│   ├── screens/    # BaseUIScreen, HubScreen, ResultScreen
│   ├── panels/     # GameModalPanel, GameBottomSheet
│   └── themes/     # DefaultUITheme, GameStyleUITheme
├── scenes/         # BaseScene, scene management
├── physics/        # Matter.js (2D) & Cannon.js (3D) integration
├── audio/          # Audio system (music, SFX, spatial)
├── input/          # Touch, keyboard, gamepad handling
└── graphics/       # GraphicsEngine, PixiGraphicsFactory, ThreeGraphicsFactory
```

## Architecture Patterns

### Laravel-Inspired Service Container

```typescript
// Bind services
game.bind('my.service', () => new MyService());
game.singleton('global.service', () => new GlobalService());

// Resolve services
const service = game.make('my.service');
```

### Facades (Static Access)

```typescript
import { Renderer, Scenes, UI, Audio, Input, Physics } from 'gamebyte-framework';

Renderer.start();
await Scenes.switchTo('game');
Audio.playMusic('background');
```

### Graphics Abstraction Layer

The framework uses `IGraphics`, `IContainer`, `IText`, `ISprite` interfaces defined in `src/contracts/Graphics.ts` to abstract over Pixi.js and Three.js. This allows UI components to work with both renderers.

```typescript
import { graphics } from '../../graphics/GraphicsEngine';

const factory = graphics();
const container = factory.createContainer();
const text = factory.createText('Hello', { fontSize: 24 });
const gfx = factory.createGraphics();
gfx.roundRect(0, 0, 100, 50, 10).fill({ color: 0x4CAF50 });
```

## Testing

- **Framework**: Jest with jsdom
- **Config**: `jest.config.cjs`
- **Tests location**: `tests/__tests__/`
- **Mocking**: Create mock renderers for Pixi.js objects (see `tests/__tests__/core/GameByte.test.ts`)

Run specific test patterns:
```bash
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
```

## Common Patterns

### Creating UI Components

UI components extend `EventEmitter` and use the graphics factory:

```typescript
export class MyComponent extends EventEmitter {
  private container: IContainer;

  constructor() {
    super();
    const factory = graphics();
    this.container = factory.createContainer();
    // Build component...
  }

  getContainer(): IContainer {
    return this.container;
  }
}
```

### Font Loading

The framework uses Lilita One font loaded via `src/ui/utils/FontLoader.ts`:

```typescript
import { loadFrameworkFont, getFrameworkFontFamily } from '../utils/FontLoader';

// In constructor (non-blocking)
loadFrameworkFont();

// For text styles
const style = { fontFamily: getFrameworkFontFamily() };
```

## Rendering APIs

### Pixi.js v8 Graphics API (Modern)

Use the modern Pixi v8 API, NOT the legacy API:

```typescript
// CORRECT - Pixi v8 style
graphics.roundRect(x, y, width, height, radius);
graphics.fill({ color: 0xFF0000, alpha: 0.8 });
graphics.stroke({ color: 0x000000, width: 2 });

// WRONG - Legacy Pixi v7 style
graphics.beginFill(0xFF0000);  // Don't use
graphics.drawRoundedRect(...); // Don't use
graphics.endFill();            // Don't use
```

### IGraphics Interface Methods

- `rect()`, `roundRect()`, `circle()`, `ellipse()`, `poly()`
- `fill()`, `stroke()`
- `moveTo()`, `lineTo()`, `arc()`, `closePath()`
- `clear()`

## Important Notes

### Breaking Changes

When modifying interfaces in `src/contracts/`, ensure ALL implementations are updated:
- `src/graphics/PixiGraphicsFactory.ts`
- `src/graphics/ThreeGraphicsFactory.ts`
- Any UI components using those interfaces

### Module System

The project uses ESM with `.js` extensions in TypeScript imports. Jest is configured to handle this via `moduleNameMapper`:

```javascript
// jest.config.cjs
moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1'  // Maps .js imports to .ts files
}
```

### UMD Build

For browser usage without bundlers, use `dist/gamebyte.umd.js`. It exposes `window.GameByteFramework`.

## Code Style

- TypeScript strict mode
- EventEmitter3 for event handling
- Interfaces prefixed with `I` (e.g., `IContainer`, `IGraphics`)
- Constants in SCREAMING_SNAKE_CASE
- Private members prefixed with underscore or using `private` keyword

## Documentation

- Main README: `README.md`
- Agent-specific docs: `docs/agent-guide/CORE_API.md`
- 3D setup guide: `docs/guides/rendering-3d-setup.md`
- Live demos: `docs-site/static/demos/`
