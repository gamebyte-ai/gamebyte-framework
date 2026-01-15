<div align="center">

# 🎮 GameByte Framework

**Modern Mobile-First Game Development Framework**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Pixi.js v8](https://img.shields.io/badge/Pixi.js-v8-ff69b4)](https://pixijs.com/)

A comprehensive JavaScript game framework that unifies 2D and 3D game development with Laravel-inspired architecture.

**✨ [View Live Demos](./index.html) • 📖 [Quick Start](#-quick-start) • 🎨 [UI Components](#-ui-components)**

</div>

---

## ✨ Features

- 🎨 **Modern UI System** - Beautiful components with gradients, glow, shadows, animations
- 🚀 **Laravel Architecture** - Service providers, dependency injection, facades
- 🎬 **Scene Management** - Smooth transitions & lifecycle management
- ⚡ **Physics Integration** - Matter.js (2D) & Cannon.js (3D)
- 🔊 **Audio System** - Spatial audio, music, SFX with mobile optimization
- 📱 **Mobile-First** - 44px touch targets, performance optimizations
- 🎯 **TypeScript** - 100% type safety
- 🎮 **Dual Rendering** - Pixi.js v8 (2D) & Three.js (3D)

---

## 🚀 Quick Start

### Installation

```bash
npm install gamebyte-framework
```

### Basic 2D Game

```typescript
import { createGame } from 'gamebyte-framework';
import * as PIXI from 'pixi.js';

// Create and initialize
const game = createGame();
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

await game.initialize(canvas, '2d');

// Get services
const renderer = game.make('renderer');
const sceneManager = game.make('scene.manager');

// Start game loop
game.start();
```

### UMD Build (Browser)

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
</head>
<body>
    <!-- Load Pixi.js from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>

    <!-- Load GameByte -->
    <script src="./dist/gamebyte.umd.js"></script>

    <script>
        const game = GameByteFramework.createGame();
        // Your game code...
    </script>
</body>
</html>
```

---

## 🤖 For AI Agents & Code Assistants

GameByte is optimized for AI-driven development with tiered documentation and discoverable patterns.

### Quick Start for Agents

**1. Load Core Knowledge (Required)**
- Read: [`docs/agent-guide/CORE_API.md`](./docs/agent-guide/CORE_API.md) (~2000 tokens)
- Cheatsheet: [`docs/agent-guide/QUICK_REFERENCE.md`](./docs/agent-guide/QUICK_REFERENCE.md) (~500 tokens)

**2. Discover Advanced Topics (As Needed)**
```bash
# Search guides by keyword
grep -r "physics" docs/guides/
grep -r "mobile.*optimization" docs/guides/
```

**3. Reference Working Examples**
- Platformer: `examples/platformer/`
- UI Components: `examples/ui-showcase/`

### Documentation Tiers

| Tier | Content | When to Load |
|------|---------|--------------|
| **Tier 1** | Core API (~2000 tokens) | Always (pre-loaded) |
| **Tier 2** | Advanced guides | On-demand (grep/semantic search) |
| **Tier 3** | Working examples | For patterns/templates |

### Key Features for AI

- **Minimal context** - Core API is ~2000 tokens
- **Smart defaults** - 40+ auto-configured settings
- **Discoverable** - Keyword-enriched markdown for grep
- **Type-rich** - JSDoc examples for autocomplete
- **4-line games** - `createGame()` → `initialize()` → `start()`

### Integration with RAG Systems

All markdown docs include semantic keywords for vector search:

```markdown
<!-- keywords: physics, collision, 2d, 3d, matter, cannon -->
```

---

## 🎨 UI Components

### Modern Button

```typescript
import { UIButton } from 'gamebyte-framework';

const button = new UIButton({
    text: 'PLAY',
    width: 200,
    height: 60,
    backgroundColor: 0x4CAF50,
    gradient: { enabled: true, colorTop: 0x66BB6A, colorBottom: 0x388E3C },
    glowEffect: true,
    shadowEffect: true,
    rippleEffect: true
});

button.on('click', () => console.log('Clicked!'));
scene.addChild(button.getContainer());
```

### TopBar with Resources

```typescript
import { TopBar, TopBarItemType } from 'gamebyte-framework';

const topBar = new TopBar({
    width: 800,
    items: [
        {
            id: 'coins',
            type: TopBarItemType.RESOURCE,
            icon: coinTexture,
            value: 1000,
            format: 'abbreviate', // "1K"
            animated: true
        },
        {
            id: 'timer',
            type: TopBarItemType.TIMER,
            value: 60,
            format: 'time' // "1:00"
        }
    ]
});

scene.addChild(topBar.getContainer());
topBar.updateItem('coins', 1500, true);
```

---

## 🎬 Scene Management

```typescript
import { BaseScene } from 'gamebyte-framework';

class MyScene extends BaseScene {
    constructor() {
        super('my-scene', 'My Scene');
    }

    async initialize() {
        await super.initialize();
        // Setup your scene
    }

    update(deltaTime: number) {
        super.update(deltaTime);
        // Update game logic
    }
}

// Add and switch scenes
const scene = new MyScene();
sceneManager.add(scene);
await sceneManager.switchTo('my-scene', {
    type: 'fade',
    duration: 500
});
```

---

## 🏗️ Architecture

### Service Container

```typescript
// Bind services
game.bind('my.service', () => new MyService());
game.singleton('global.service', () => new GlobalService());

// Resolve services
const service = game.make('my.service');
```

### Service Providers

```typescript
import { AbstractServiceProvider } from 'gamebyte-framework';

export class MyServiceProvider extends AbstractServiceProvider {
    register(app: GameByte): void {
        app.singleton('my.feature', () => new MyFeature());
    }
}

game.register(new MyServiceProvider());
```

### Facades

```typescript
import { Renderer, Scenes, UI, Audio } from 'gamebyte-framework';

Renderer.start();
await Scenes.switchTo('game');
const button = UI.createButton({...});
Audio.playMusic('background');
```

---

## 🎮 Core Systems

### Physics

```typescript
import { Physics } from 'gamebyte-framework';

// 2D Physics (Matter.js)
Physics.create2DWorld({ gravity: { x: 0, y: 1 } });
const body = Physics.createBody({ x: 100, y: 100, width: 50, height: 50 });

// 3D Physics (Cannon.js)
Physics.create3DWorld({ gravity: { x: 0, y: -9.8, z: 0 } });
```

### Audio

```typescript
import { Music, SFX, Spatial } from 'gamebyte-framework';

Music.play('background', { loop: true, volume: 0.7 });
SFX.play('click');
Spatial.play('explosion', { position: { x: 10, y: 0, z: 5 } });
```

### Input

```typescript
import { Input } from 'gamebyte-framework';

Input.keyboard.on('KeyW', () => console.log('W pressed'));
Input.touch.on('tap', (e) => console.log('Tapped at:', e.x, e.y));
Input.gamepad.on('button-a', () => console.log('A pressed'));
```

### Assets

```typescript
import { Assets } from 'gamebyte-framework';

await Assets.load([
    { key: 'player', url: 'player.png', type: 'texture' },
    { key: 'music', url: 'music.mp3', type: 'audio' }
]);

const texture = Assets.get('player');
```

---

## 🌐 3D Rendering

GameByte supports 3D rendering with Three.js:

- **UMD Build**: Use direct Three.js API (see `docs/guides/rendering-3d-setup.md`)
- **ESM/CJS**: Import `ThreeRenderer` and `BaseScene3D` directly

```typescript
// ESM/CJS approach
import { createGame } from 'gamebyte-framework';
import * as THREE from 'three';

const game = createGame();
await game.initialize(canvas, '3d');

// Use Three.js API directly for 3D scenes
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
// ... rest of Three.js setup
```

📖 **[Full 3D Rendering Guide →](docs/guides/rendering-3d-setup.md)**

---

## 📁 Project Structure

```
gamebyte-framework/
├── src/
│   ├── core/              # Framework core
│   ├── rendering/         # 2D/3D renderers
│   ├── ui/                # UI components
│   ├── scenes/            # Scene management
│   ├── physics/           # Physics engines
│   ├── audio/             # Audio system
│   ├── input/             # Input handling
│   ├── assets/            # Asset management
│   ├── services/          # Service providers
│   ├── facades/           # Static facades
│   └── index.ts           # Main entry
├── dist/
│   ├── index.js           # ES module
│   ├── index.cjs.js       # CommonJS
│   ├── gamebyte.umd.js    # UMD bundle (2D only)
│   └── renderers/
│       └── three3d.js     # 3D renderer bundle
├── docs/
│   └── guides/
│       └── rendering-3d-setup.md
├── index.html             # Demo hub
├── test-*.html            # Demo pages
└── README.md
```

---

## 🎓 Live Demos

- **[Demo Hub](./index.html)** - All demos in one place
- **[Modern UI](./test-ui-modern.html)** - Beautiful button components
- **[TopBar System](./test-ui-umd.html)** - Complete UI system
- **[2D Simple](./test-umd-simple.html)** - Basic 2D rendering
- **[3D Direct API](./test-3d-simple.html)** - Three.js integration
- **[Graphics API](./test-graphics-api.html)** - Graphics abstraction

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build framework
npm run build

# Development mode (watch)
npm run dev

# Run tests
npm test

# Start demo server
npx http-server -p 8080
```

---

## 📚 Documentation

- 📖 **[3D Rendering Guide](docs/guides/rendering-3d-setup.md)** - Complete 3D setup guide
- 📝 **[Changelog](CHANGELOG.md)** - Version history
- 🤝 **[Contributing](CONTRIBUTING.md)** - Contribution guidelines
- 🗺️ **[Roadmap](ROADMAP.md)** - Development roadmap

---

## 🎯 Roadmap

### ✅ v1.0 - Core Framework (Current)
- ✅ Service container & providers
- ✅ 2D rendering (Pixi.js v8)
- ✅ 3D rendering (Three.js)
- ✅ Scene management
- ✅ Modern UI components
- ✅ Physics (Matter.js, Cannon.js)
- ✅ Audio system
- ✅ Input handling
- ✅ Asset management

### 🚧 v1.1 - Enhanced UI (In Progress)
- Enhanced animations
- More components (Slider, Toggle, Modal)
- Visual effects system

### 📋 v2.0 - Tools & Services (Planned)
- Level editor
- Analytics integration
- Cloud save system
- A/B testing framework

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

Built on amazing open-source libraries:
- [Pixi.js](https://pixijs.com/) - 2D rendering
- [Three.js](https://threejs.org/) - 3D rendering
- [Matter.js](https://brm.io/matter-js/) - 2D physics
- [Cannon.js](https://schteppe.github.io/cannon.js/) - 3D physics

Inspired by [Laravel Framework](https://laravel.com/) architecture.

---

<div align="center">

**Built with ❤️ for Game Developers**

⭐ Star us on GitHub — it helps!

**[Live Demos](./index.html) • [Quick Start](#-quick-start) • [Documentation](#-documentation)**

</div>
