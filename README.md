<div align="center">

<!-- Logo placeholder - GameByte Framework logo will be added here -->
<img src="https://via.placeholder.com/200x200/1a1a2e/16213e?text=GameByte" alt="GameByte Framework" width="200" height="200">

# GameByte Framework

**🎮 Enterprise-Grade Mobile Game Development Framework**

[![npm version](https://badge.fury.io/js/%40gamebyte%2Fframework.svg)](https://badge.fury.io/js/%40gamebyte%2Fframework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Build Status](https://github.com/gamebyte-framework/framework/workflows/CI/badge.svg)](https://github.com/gamebyte-framework/framework/actions)
[![Coverage Status](https://codecov.io/gh/gamebyte-framework/framework/branch/main/graph/badge.svg)](https://codecov.io/gh/gamebyte-framework/framework)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A comprehensive JavaScript game engine framework that unifies 2D and 3D game development with Laravel-inspired architecture. Built for mobile casual, hybrid casual, hyper casual, platformer, shooter, and puzzle games targeting Rollic/Voodoo quality standards.

[📖 **Documentation**](https://docs.gamebyte-framework.dev) | [🎮 **Live Demo**](https://demo.gamebyte-framework.dev) | [💬 **Discord**](https://discord.gg/gamebyte) | [🐦 **Twitter**](https://twitter.com/gamebytefw)

</div>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎮 **Core Features**
- **Unified 2D/3D API** - Clean abstraction over Pixi.js & Three.js
- **Laravel-Inspired Architecture** - Service providers, DI, facades
- **Modular Design** - Tree-shakeable bundles for optimal performance
- **TypeScript First** - 100% type safety with modern tooling
- **Mobile Optimized** - Performance tiers & adaptive quality scaling

</td>
<td width="50%">

### 🚀 **Advanced Features**
- **Scene Management** - Smooth transitions & lifecycle hooks
- **Plugin System** - Extensible npm-style architecture
- **Performance Monitoring** - Built-in FPS tracking & optimization
- **Cross-Platform** - Web, mobile, desktop support
- **Enterprise Ready** - Comprehensive testing & documentation

</td>
</tr>
</table>

### 🎯 **Game Types Supported**

| Type | Description | Key Features |
|------|-------------|-------------|
| 🎲 **Mobile Casual** | Touch-optimized gameplay | Responsive UI, haptic feedback |
| ⚡ **Hybrid Casual** | Progressive complexity | Retention hooks, analytics |
| 🏃 **Hyper Casual** | Ultra-lightweight | Instant playability, minimal bundle |
| 🏗️ **Platformer** | Physics-based games | Collision detection, movement helpers |
| 🔫 **Shooter** | High-performance action | Optimized rendering, input handling |
| 🧩 **Puzzle** | Logic-based games | State management, turn-based systems |

## 🚀 Quick Start

### Installation

```bash
# Install the framework
npm install @gamebyte/framework

# Or with yarn
yarn add @gamebyte/framework

# Or with pnpm
pnpm add @gamebyte/framework
```

### Basic Usage

#### 🎮 Full Framework (All Features)
```typescript
import { createGame, initializeFacades, RenderingMode } from '@gamebyte/framework';

// Create GameByte application with all features
const app = createGame();

// Initialize facades for static access
initializeFacades(app);

// Get canvas element
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

// Initialize with 2D rendering
await app.initialize(canvas, RenderingMode.RENDERER_2D, {
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb
});

// Start the game loop
app.start();
```

#### 🎯 Lightweight 2D Games
```typescript
import { create2DGame, initializeGame } from '@gamebyte/framework/2d';
import { add2DPhysics } from '@gamebyte/framework/physics2d';

// Create lightweight 2D game instance
const app = create2DGame();

// Optional: Add 2D physics if needed
add2DPhysics(app);

// Initialize 2D game
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
await initializeGame(app, canvas, {
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb
});

app.start();
```

#### 🚀 Lightweight 3D Games
```typescript
import { create3DGame, initializeGame } from '@gamebyte/framework/3d';
import { add3DPhysics } from '@gamebyte/framework/physics3d';

// Create lightweight 3D game instance
const app = create3DGame();

// Optional: Add 3D physics if needed
add3DPhysics(app);

// Initialize 3D game
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
await initializeGame(app, canvas, {
  width: 800,
  height: 600
});

app.start();
```

### Scene Management

```typescript
import { Scene, Scenes } from '@gamebyte/framework';

class MainMenuScene implements Scene {
  public readonly id = 'main-menu';
  public readonly name = 'Main Menu';
  public isActive = false;

  async initialize(): Promise<void> {
    // Initialize scene assets
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  update(deltaTime: number): void {
    // Update scene logic
  }

  render(renderer: any): void {
    // Render scene objects
  }

  destroy(): void {
    // Clean up resources
  }
}

// Register and switch scenes
const mainMenu = new MainMenuScene();
Scenes.add(mainMenu);
await Scenes.switchTo('main-menu');
```

## Architecture Overview

### Core Components

#### 1. GameByte Application (`GameByte`)
The main application class that orchestrates the entire framework:

```typescript
const app = GameByte.create();

// Register service providers
app.register(new CustomServiceProvider());

// Boot the application
await app.boot();

// Access services
const renderer = app.make('renderer');
```

#### 2. Service Container (`ServiceContainer`)
Laravel-inspired dependency injection container:

```typescript
// Bind services
app.bind('custom.service', () => new CustomService());
app.singleton('global.service', () => new GlobalService());

// Resolve services
const service = app.make('custom.service');
```

#### 3. Service Providers (`ServiceProvider`)
Modular service registration system:

```typescript
import { AbstractServiceProvider } from '@gamebyte/framework';

export class CustomServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.bind('custom.feature', () => new CustomFeature());
  }

  boot(app: GameByte): void {
    // Bootstrap services after registration
  }
}
```

#### 4. Unified Rendering API (`Renderer`)
Abstraction layer over Pixi.js and Three.js:

```typescript
import { RendererFactory, RenderingMode } from '@gamebyte/framework';

// Create 2D renderer
const renderer2D = RendererFactory.create(RenderingMode.PIXI_2D);

// Create 3D renderer
const renderer3D = RendererFactory.create(RenderingMode.THREE_3D);

// Use facade for static access
import { Renderer } from '@gamebyte/framework';
Renderer.start();
Renderer.resize(1024, 768);
```

#### 5. Scene Management (`SceneManager`)
Comprehensive scene lifecycle management:

```typescript
import { Scenes } from '@gamebyte/framework';

// Scene transitions with effects
await Scenes.switchTo('game', {
  type: 'fade',
  duration: 1000,
  easing: (t) => t * t
});
```

#### 6. Plugin System (`PluginManager`)
npm-style plugin architecture:

```typescript
import { Plugins } from '@gamebyte/framework';

// Register plugin
Plugins.register({
  name: 'my-plugin',
  version: '1.0.0',
  provider: MyPluginProvider,
  dependencies: ['core-plugin']
});

// Load plugins
await Plugins.loadAll();
```

### Facades

Static access to framework services:

```typescript
import { Renderer, Scenes, Plugins } from '@gamebyte/framework';

// Renderer facade
Renderer.start();
const stats = Renderer.getStats();

// Scenes facade
await Scenes.switchTo('game');
const currentScene = Scenes.getCurrentScene();

// Plugins facade
await Plugins.load('my-plugin');
const isLoaded = Plugins.isLoaded('my-plugin');
```

## Mobile Game Optimization

The framework is specifically designed for mobile game development with built-in optimizations:

### Performance Tiers
```typescript
import { PerformanceTier } from '@gamebyte/framework';

// Automatic performance detection and scaling
const tier = detectPerformanceTier();
adjustQualitySettings(tier);
```

### Game Types Support
- **Mobile Casual** - Touch-optimized UI and simple mechanics
- **Hybrid Casual** - Progressive complexity with retention hooks
- **Hyper Casual** - Ultra-lightweight with instant playability
- **Platformer** - Physics-based movement and collision detection
- **Shooter** - High-performance rendering and input handling
- **Puzzle** - Turn-based logic and state management

## Directory Structure

```
gamebyte-framework/
├── src/
│   ├── core/                    # Core framework classes
│   │   ├── GameByte.ts         # Main application class
│   │   ├── ServiceContainer.ts  # Dependency injection
│   │   └── DefaultSceneManager.ts
│   ├── contracts/               # TypeScript interfaces
│   │   ├── ServiceProvider.ts
│   │   ├── Container.ts
│   │   ├── Renderer.ts
│   │   └── Scene.ts
│   ├── rendering/               # Rendering system
│   │   ├── PixiRenderer.ts     # 2D renderer implementation
│   │   ├── ThreeRenderer.ts    # 3D renderer implementation
│   │   └── RendererFactory.ts
│   ├── services/                # Core service providers
│   │   ├── RenderingServiceProvider.ts
│   │   ├── SceneServiceProvider.ts
│   │   └── PluginServiceProvider.ts
│   ├── plugins/                 # Plugin system
│   │   └── PluginManager.ts
│   ├── facades/                 # Static access facades
│   │   ├── Facade.ts
│   │   ├── Renderer.ts
│   │   ├── Scenes.ts
│   │   └── Plugins.ts
│   ├── types/                   # TypeScript type definitions
│   └── index.ts                 # Main entry point
├── examples/                    # Usage examples
│   ├── basic-usage.ts
│   └── index.html
├── dist/                        # Compiled output
├── package.json
├── tsconfig.json
├── rollup.config.js
└── README.md
```

## Building the Framework

```bash
# Install dependencies
npm install

# Build the framework
npm run build

# Development mode with watch
npm run dev

# Run tests
npm run test

# Lint code
npm run lint
```

## 🎮 Interactive Demo

Experience the GameByte Framework with our comprehensive demo that showcases Laravel-inspired architecture patterns in action:

```bash
# Quick start - builds and serves the demo
npm run demo:serve

# Or manually build and serve
npm run demo:build
npx http-server demos/dist -p 9000 -o
```

**Demo Features:**
- ✅ **Dependency Injection & IoC** - Service container with automatic resolution
- ✅ **Service Providers** - Laravel-inspired service registration and lifecycle  
- ✅ **Facade Pattern** - Clean static APIs (DemoScore, DemoGameState, DemoNotifications)
- ✅ **Scene Management** - Smooth transitions between splash, menu, and gameplay
- ✅ **Event-Driven Architecture** - Cross-service communication via events
- ✅ **Mobile-First UI** - Touch-optimized responsive design with haptic feedback
- ✅ **Performance Monitoring** - FPS tracking and automatic quality scaling

The demo runs at `http://localhost:9000` and works on both desktop and mobile devices.

> 💡 **Tip**: The demo showcases enterprise patterns like dependency injection, service providers, and facades in action. Perfect for understanding the framework's architecture!

## 🎯 **Clean API Examples:**

### **2D Game Development**
```typescript
// Clean, abstracted 2D API - no Pixi.js references
import { 
  create2DGame, 
  initializeGame, 
  Renderer2D, 
  AssetManager2D 
} from '@gamebyte/framework/2d';

import { 
  add2DPhysics, 
  PlatformerHelper, 
  PhysicsWorld2D 
} from '@gamebyte/framework/physics2d';

const app = create2DGame();
add2DPhysics(app);
await initializeGame(app, canvas);
```

### **3D Game Development**
```typescript
// Clean, abstracted 3D API - no Three.js references
import { 
  create3DGame, 
  initializeGame, 
  Renderer3D, 
  SpatialAudio 
} from '@gamebyte/framework/3d';

import { 
  add3DPhysics, 
  ParticleSystem, 
  PhysicsWorld3D 
} from '@gamebyte/framework/physics3d';

const app = create3DGame();
add3DPhysics(app);
await initializeGame(app, canvas);
```

## Example Projects

Check the `examples/` directory for:
- Basic framework setup
- Scene management examples
- Plugin development guide
- Mobile optimization techniques
- Performance monitoring setup

## API Reference

### Core Classes

- **`GameByte`** - Main application class
- **`ServiceContainer`** - Dependency injection container
- **`RendererFactory`** - Renderer creation and management
- **`PluginManager`** - Plugin registration and lifecycle

### Rendering

- **`RenderingMode`** - Supported rendering modes (2D, 3D, Hybrid)
- **`PixiRenderer`** - Pixi.js implementation
- **`ThreeRenderer`** - Three.js implementation

### Scene Management

- **`Scene`** - Scene interface
- **`SceneManager`** - Scene lifecycle management
- **`SceneTransition`** - Transition configuration

### Service Providers

- **`RenderingServiceProvider`** - Rendering services
- **`SceneServiceProvider`** - Scene management services
- **`PluginServiceProvider`** - Plugin system services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] Asset management system
- [ ] Input handling system
- [ ] Audio system integration
- [ ] Physics engine integration
- [ ] UI component library
- [ ] Animation system
- [ ] Particle effects
- [ ] Mobile platform plugins (iOS/Android)
- [ ] Cloud save integration
- [ ] Analytics and telemetry
- [ ] A/B testing framework

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### 🌟 Contributors Hall of Fame

<a href="https://github.com/gamebyte-framework/framework/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=gamebyte-framework/framework" />
</a>

## 📊 Project Stats

![Alt](https://repobeats.axiom.co/api/embed/your-repo-id.svg "GameByte Framework analytics")

## 🔗 Links & Resources

- 📖 [Documentation](https://docs.gamebyte-framework.dev)
- 🎮 [Interactive Demo](https://demo.gamebyte-framework.dev)
- 💬 [Discord Community](https://discord.gg/gamebyte)
- 🐦 [Twitter Updates](https://twitter.com/gamebytefw)
- 📝 [Blog & Tutorials](https://blog.gamebyte-framework.dev)
- 🎓 [Video Courses](https://learn.gamebyte-framework.dev)

## 📄 License

GameByte Framework is [MIT licensed](./LICENSE).

## 🙏 Acknowledgments

- Built on top of amazing libraries: [Pixi.js](https://pixijs.com/), [Three.js](https://threejs.org/)
- Inspired by [Laravel Framework](https://laravel.com/) architecture patterns

---

<div align="center">

**Built with ❤️ for mobile game developers targeting Rollic/Voodoo quality standards.**

⭐ Star us on GitHub — it motivates us a lot!

</div>