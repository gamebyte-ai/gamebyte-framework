# GameByte Framework Documentation

Welcome to the comprehensive documentation for GameByte Framework - a unified JavaScript game engine that combines 2D and 3D game development with Laravel-inspired architecture.

## What is GameByte Framework?

GameByte Framework is a modern, TypeScript-first game engine designed specifically for mobile casual, hybrid casual, hyper casual, platformer, shooter, and puzzle games. It provides a unified API that seamlessly integrates 2D (Pixi.js) and 3D (Three.js) rendering while maintaining professional-grade performance standards suitable for Rollic/Voodoo quality games.

## Key Features

- **🎮 Unified API** - Seamlessly switch between 2D and 3D rendering
- **🏗️ Laravel-Inspired Architecture** - Service providers, dependency injection, and facades
- **🔌 Modular Plugin System** - Extensible architecture with npm-style package management
- **📱 Mobile-First** - Optimized for mobile devices with performance scaling
- **🎬 Scene Management** - Comprehensive scene lifecycle with smooth transitions
- **⚡ Performance Focused** - Built-in performance monitoring and optimization
- **📦 TypeScript** - Full type safety and modern development experience

## Documentation Structure

### Getting Started
- [Installation](./getting-started/installation.md) - Install and set up the framework
- [Quick Start Guide](./getting-started/quickstart.md) - Create your first game in minutes  
- [First Game Tutorial](./getting-started/first-game.md) - Build a complete simple game
- [Project Structure](./getting-started/project-structure.md) - Understand the recommended project layout

### Core Concepts
- [Framework Architecture](./core-concepts/architecture.md) - Laravel-inspired design patterns
- [Service Container](./core-concepts/service-container.md) - Dependency injection system
- [Service Providers](./core-concepts/service-providers.md) - Modular service registration
- [Facades](./core-concepts/facades.md) - Static access to framework services
- [Application Lifecycle](./core-concepts/lifecycle.md) - Boot process and service initialization

### Rendering System
- [Rendering Overview](./rendering/overview.md) - Unified 2D/3D rendering architecture
- [2D Rendering (Pixi.js)](./rendering/2d-rendering.md) - Pixi.js integration and features
- [3D Rendering (Three.js)](./rendering/3d-rendering.md) - Three.js integration and features  
- [Hybrid Rendering](./rendering/hybrid-mode.md) - Combining 2D and 3D elements
- [WebGL Optimization](./rendering/webgl-optimization.md) - Performance and compatibility

### Physics System
- [Physics Overview](./physics/overview.md) - Unified physics architecture
- [2D Physics](./physics/2d-physics.md) - Matter.js integration
- [3D Physics](./physics/3d-physics.md) - Cannon.js integration
- [Game Helpers](./physics/helpers.md) - Platformer, top-down, and specialized helpers
- [Mobile Optimization](./physics/mobile-optimization.md) - Performance scaling for mobile

### Input System
- [Input Overview](./input/overview.md) - Unified input handling
- [Touch Controls](./input/touch-controls.md) - Mobile touch interaction
- [Virtual Controls](./input/virtual-controls.md) - On-screen joysticks and buttons
- [Input Mapping](./input/input-mapping.md) - Customizable control schemes
- [Gesture Recognition](./input/gestures.md) - Advanced touch gestures

### Audio System
- [Audio Overview](./audio/overview.md) - Comprehensive audio architecture
- [Music System](./audio/music.md) - Background music and adaptive audio
- [Sound Effects](./audio/sound-effects.md) - SFX management and optimization
- [Spatial Audio](./audio/spatial-audio.md) - 3D positioned audio
- [Mobile Audio](./audio/mobile-optimization.md) - Battery and performance optimization

### User Interface
- [UI Overview](./ui/overview.md) - Mobile-first UI system
- [UI Components](./ui/components.md) - Buttons, panels, text, and containers
- [Screen Management](./ui/screens.md) - Menu screens and UI navigation
- [Animations](./ui/animations.md) - UI transitions and effects
- [Themes](./ui/themes.md) - Styling and customization
- [Responsive Design](./ui/responsive-design.md) - Multi-device UI adaptation

### Performance Optimization
- [Performance Overview](./performance/overview.md) - Framework optimization features
- [Mobile Performance](./performance/mobile-performance.md) - Device tier detection and scaling
- [Memory Management](./performance/memory-management.md) - Object pooling and garbage collection
- [Rendering Optimization](./performance/rendering-optimization.md) - Draw call batching and culling
- [Battery Optimization](./performance/battery-optimization.md) - Power-efficient game loops
- [Profiling Tools](./performance/profiling.md) - Performance monitoring and debugging

### Asset Management
- [Asset Overview](./assets/overview.md) - Comprehensive asset system
- [Asset Loading](./assets/loading.md) - Asynchronous loading strategies
- [Caching System](./assets/caching.md) - Memory and persistent caching
- [Asset Bundling](./assets/bundling.md) - Packaging and compression
- [Streaming Assets](./assets/streaming.md) - Dynamic loading for large games

### Scene Management
- [Scene Overview](./scenes/overview.md) - Scene lifecycle and architecture
- [Scene Transitions](./scenes/transitions.md) - Smooth scene switching with effects
- [Scene Lifecycle](./scenes/lifecycle.md) - Initialize, activate, update, and cleanup
- [Multi-Scene Support](./scenes/multi-scene.md) - Overlapping and parallel scenes

### Plugin System
- [Plugin Overview](./plugins/overview.md) - Extensible plugin architecture
- [Creating Plugins](./plugins/creating-plugins.md) - Build custom framework extensions
- [Plugin Marketplace](./plugins/marketplace.md) - Community plugins and distribution
- [Core Plugins](./plugins/core-plugins.md) - Built-in framework plugins

### Mobile Development
- [Mobile Overview](./mobile/overview.md) - Mobile-specific features and optimizations
- [Touch Controls](./mobile/touch-controls.md) - Advanced touch interaction patterns
- [Performance Scaling](./mobile/performance-scaling.md) - Adaptive quality for device tiers
- [Platform Integration](./mobile/platform-integration.md) - iOS and Android specific features
- [Distribution](./mobile/distribution.md) - App store deployment strategies

### API Reference
- [Core Classes](./api-reference/core.md) - GameByte, ServiceContainer, and base classes
- [Rendering API](./api-reference/rendering.md) - Renderer interfaces and implementations
- [Physics API](./api-reference/physics.md) - Physics bodies, worlds, and helpers
- [Input API](./api-reference/input.md) - Input managers and handlers
- [Audio API](./api-reference/audio.md) - Audio system interfaces
- [UI API](./api-reference/ui.md) - UI components and managers
- [Asset API](./api-reference/assets.md) - Asset management interfaces
- [Scene API](./api-reference/scenes.md) - Scene management interfaces

### Examples & Tutorials
- [Basic Examples](./examples/basic-examples.md) - Simple usage patterns
- [Game Templates](./examples/game-templates.md) - Complete starter projects
- [Advanced Tutorials](./examples/advanced-tutorials.md) - In-depth implementation guides
- [Best Practices](./examples/best-practices.md) - Recommended patterns and techniques

### Migration Guides
- [From Pixi.js](./migration/from-pixijs.md) - Migrate existing Pixi.js projects
- [From Three.js](./migration/from-threejs.md) - Migrate existing Three.js projects
- [From Other Engines](./migration/from-other-engines.md) - Phaser, Babylon.js, and more
- [Version Updates](./migration/version-updates.md) - Upgrade between framework versions

### Troubleshooting
- [Common Issues](./troubleshooting/common-issues.md) - Frequently encountered problems
- [Performance Problems](./troubleshooting/performance.md) - Debugging performance issues
- [Mobile-Specific Issues](./troubleshooting/mobile-issues.md) - Device and platform problems
- [Community Support](./troubleshooting/community-support.md) - Getting help from the community

## Quick Start

Get up and running with GameByte Framework in under 5 minutes:

```bash
# Install the framework
npm install @gamebyte/framework

# Create a new project
npx create-gamebyte-app my-game
cd my-game

# Start development
npm run dev
```

Or follow our comprehensive [Quick Start Guide](./getting-started/quickstart.md) for a detailed walkthrough.

## Framework Architecture

GameByte Framework follows Laravel-inspired architectural patterns:

```typescript
import { createGame, initializeFacades, RenderingMode } from '@gamebyte/framework';

// Create application instance
const app = createGame();

// Initialize facades for static access
initializeFacades(app);

// Initialize with canvas
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
await app.initialize(canvas, RenderingMode.PIXI_2D);

// Start the game loop
app.start();
```

## Target Game Types

GameByte Framework is optimized for:

- **Mobile Casual Games** - Touch-optimized UI and simple mechanics
- **Hybrid Casual Games** - Progressive complexity with retention hooks  
- **Hyper Casual Games** - Ultra-lightweight with instant playability
- **Platformer Games** - Physics-based movement and collision detection
- **Shooter Games** - High-performance rendering and input handling
- **Puzzle Games** - Turn-based logic and state management

## Community & Support

- **GitHub Repository**: [github.com/gamebyte/framework](https://github.com/gamebyte/framework)
- **Discord Community**: [Join our Discord](https://discord.gg/gamebyte)
- **Documentation**: [docs.gamebyte.dev](https://docs.gamebyte.dev)
- **Examples**: [examples.gamebyte.dev](https://examples.gamebyte.dev)
- **Blog**: [blog.gamebyte.dev](https://blog.gamebyte.dev)

## Contributing

We welcome contributions from the community! See our [Contributing Guide](../CONTRIBUTING.md) for details on:

- Reporting bugs and feature requests
- Contributing code and documentation
- Creating plugins and extensions
- Community guidelines and code of conduct

## License

GameByte Framework is released under the [MIT License](../LICENSE).

---

Built with ❤️ for mobile game developers targeting professional quality standards.

**Ready to get started?** Jump into our [Quick Start Guide](./getting-started/quickstart.md) and build your first game!