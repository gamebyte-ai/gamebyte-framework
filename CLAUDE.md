# GameByte Framework - Claude Code Instructions

## ⚠️ User Rules (MUST FOLLOW)

1. **Her ne olursa olsun workaround yapmamalısın ben onay vermeden.** - Workaround yapmadan önce kullanıcıya sor ve onay al.

## 🌳 CRITICAL: Tree-Shaking Architecture (MUST FOLLOW)

**Bu framework React gibi çalışmalı** - Kullanıcılar sadece ihtiyaç duydukları modülleri import eder ve bundler (Vite/Webpack) sadece kullanılanları final bundle'a dahil eder.

### Temel Prensipler

1. **Modüler Export Yapısı** - Her alt sistem kendi entry point'ine sahip olmalı:
   ```typescript
   // DOĞRU - Granüler import
   import { GameByte } from '@gamebyte/framework/core';
   import { UIButton } from '@gamebyte/framework/ui';
   import { PixiRenderer } from '@gamebyte/framework/rendering';

   // YANLIŞ - Tüm framework'ü çekmek
   import { GameByte, UIButton, PixiRenderer } from '@gamebyte/framework';
   ```

2. **Side Effects Yok** - Modüller import edildiğinde otomatik kod çalıştırmamalı
   - Global state değiştirme ❌
   - DOM manipülasyonu ❌
   - Event listener ekleme ❌

3. **Bağımlılık İzolasyonu**:
   - 2D modüller Three.js'e bağımlı olmamalı
   - 3D modüller ayrı bundle'da (`three-toolkit`)
   - Her modül sadece gerçekten ihtiyaç duyduğunu import etmeli

4. **Package.json Exports** - Tüm sub-path'ler tanımlanmalı:
   ```json
   {
     "sideEffects": false,
     "exports": {
       "./core": "./dist/core/index.js",
       "./ui": "./dist/ui/index.js",
       "./rendering": "./dist/rendering/index.js"
     }
   }
   ```

### Yeni Modül Eklerken

1. Modül için `index.ts` oluştur (sadece o modülün export'ları)
2. `package.json` exports'a ekle
3. Ana `src/index.ts`'e de ekle (backwards compatibility)
4. Rollup config'de preserve modules aktif olmalı

### Bundle Boyutu Hedefleri

| Kullanım | Hedef Boyut |
|----------|-------------|
| Minimal 2D oyun | ~50-100KB |
| UI ile 2D oyun | ~150-250KB |
| Full 2D + Physics | ~300-400KB |
| 3D oyun (Three.js) | +150-200KB |

**UMD bundle'lar tree-shake edilemez** - Sadece hızlı prototipleme için kullanılmalı.

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
├── layout/         # @pixi/layout integration (Yoga flexbox)
│   ├── types.ts    # LayoutConfig, FlexDirection, etc.
│   ├── LayoutStyles.ts  # LayoutPresets, GameLayoutPresets, helpers
│   └── LayoutManager.ts # Core layout management
├── ui/             # UI components, screens, panels, themes, state
│   ├── components/ # UIButton, UIPanel, GameStyleButton, TopBar, etc.
│   ├── screens/    # BaseUIScreen, HubScreen, ResultScreen
│   ├── panels/     # GameModalPanel, GameBottomSheet
│   ├── themes/     # DefaultUITheme, GameStyleUITheme
│   └── state/      # Reactive state management (createState, computed)
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

### Reactive State Management

Vue/Svelte-inspired reactive state system for automatic UI updates:

```typescript
import { createState, computed } from 'gamebyte-framework';

// Create reactive state
const gameState = createState({ score: 0, health: 100 });

// Direct property access triggers updates
gameState.score += 100;

// Subscribe to changes
gameState.on('score', (newVal, oldVal) => updateUI(newVal));

// Batch updates (single notification)
gameState.batch(s => { s.score += 50; s.health -= 10; });

// Computed values
const total = computed(() => gameState.score * 2);
```

**State exports**: `createState`, `computed`, `isReactive`, `resolveValue`, `StateListener`, `ReactiveState`

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
// Pixi v8 API
graphics.roundRect(x, y, width, height, radius);
graphics.fill({ color: 0xFF0000, alpha: 0.8 });
graphics.stroke({ color: 0x000000, width: 2 });
```

### IGraphics Interface Methods

- `rect()`, `roundRect()`, `circle()`, `ellipse()`, `poly()`
- `fill()`, `stroke()`
- `moveTo()`, `lineTo()`, `arc()`, `closePath()`
- `clear()`

## Layout System (@pixi/layout)

The framework integrates @pixi/layout for Yoga-powered flexbox layouts:

```typescript
import {
  LayoutManager, getLayoutManager,
  LayoutPresets, GameLayoutPresets,
  createFlexRow, createFlexColumn
} from 'gamebyte-framework';

// Enable flexbox on any container
container.layout = {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 20
};

// Use presets for common patterns
topBar.layout = LayoutPresets.topBar;
gameScreen.layout = GameLayoutPresets.gameScreen;

// Helper functions
row.layout = createFlexRow({ gap: 16, justify: 'space-between' });
column.layout = createFlexColumn({ gap: 10, align: 'stretch' });
```

### Key Layout Presets

| Preset | Use Case |
|--------|----------|
| `LayoutPresets.center` | Center content |
| `LayoutPresets.row` | Horizontal row |
| `LayoutPresets.column` | Vertical column |
| `LayoutPresets.grid` | Wrapping grid |
| `LayoutPresets.topBar` | Top HUD bar |
| `LayoutPresets.bottomBar` | Bottom navigation |
| `GameLayoutPresets.gameScreen` | Full game HUD |
| `GameLayoutPresets.touchButton` | 44pt min touch target |
| `GameLayoutPresets.levelButton` | Level select button |

### Note on ESM

@pixi/layout requires ESM modules (no UMD build). For bundled projects (Vite, Webpack), it works automatically. For HTML demos, use ESM imports with import maps.

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

## Documentation Site - Demo Placement Rule

When adding or editing documentation pages in `docs-site/docs/`:
- **Primary LiveDemo must appear right after the page title** (before any code blocks or detailed text)
- `import LiveDemo` goes after frontmatter, before the `# Title`
- Each page should have at least one relevant demo
- Demo HTML files live in `docs-site/static/demos/`
- New demos should follow the existing pattern: Pixi CDN + `../gamebyte.umd.js`, dark theme, self-contained

## Documentation

- Main README: `README.md`
- Agent-specific docs: `docs/agent-guide/CORE_API.md` - includes reactive state
- Quick reference: `docs/agent-guide/QUICK_REFERENCE.md`
- **Common Mistakes**: `docs/agent-guide/COMMON_MISTAKES.md` - **MUST READ** before coding
- **Pixi.js v8 Reference**: `docs/PIXI_V8_REFERENCE.md` - **MUST READ** for all rendering code
- 3D setup guide: `docs/guides/rendering-3d-setup.md`
- Live demos: `docs-site/static/demos/`

### Pixi.js v8 Quick Reference

**CRITICAL**: Always use Pixi.js v8 API, never legacy v7 patterns. Key differences:

```typescript
// Pixi v8 API
graphics.rect(0, 0, 100, 50);
graphics.fill({ color: 0xFF0000, alpha: 0.8 });
graphics.stroke({ color: 0x000000, width: 2 });
```

**FillGradient** (v8 native gradients):
```typescript
import { FillGradient } from 'pixi.js';

const gradient = new FillGradient({
    type: 'linear',
    colorStops: [
        { offset: 0, color: 'red' },
        { offset: 1, color: 'blue' }
    ],
    textureSpace: 'local'  // IMPORTANT for shape-relative gradients
});
graphics.rect(0, 0, 100, 100).fill(gradient);
```

See `docs/PIXI_V8_REFERENCE.md` for complete API reference, migration guide, and best practices.
