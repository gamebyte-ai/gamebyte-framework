# Project Structure

This guide explains the recommended project structure for GameByte Framework projects, helping you organize your code effectively for scalable game development.

## Overview

GameByte Framework follows Laravel-inspired conventions with a focus on mobile game development. The structure promotes separation of concerns, modular architecture, and maintainable code.

## Basic Project Structure

Here's the recommended structure for a GameByte project:

```
my-game/
├── public/                 # Static assets served directly
│   ├── index.html         # Main HTML file
│   ├── assets/            # Game assets
│   │   ├── sprites/       # Sprite images
│   │   ├── sounds/        # Audio files
│   │   ├── textures/      # Texture files
│   │   └── fonts/         # Font files
│   └── manifest.json      # Web app manifest
├── src/                   # Source code
│   ├── main.ts            # Application entry point
│   ├── config/            # Configuration files
│   ├── scenes/            # Game scenes
│   ├── entities/          # Game entities/objects
│   ├── systems/           # Game systems
│   ├── components/        # UI components
│   ├── services/          # Service classes
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── assets/            # Asset definitions
├── tests/                 # Test files
├── docs/                  # Project documentation
├── dist/                  # Built output (generated)
├── node_modules/          # Dependencies (generated)
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Build tool configuration
└── README.md              # Project README
```

## Detailed Structure Breakdown

### Source Directory (`src/`)

The source directory contains all your game's source code, organized by functionality:

#### Entry Point (`main.ts`)
```typescript
// src/main.ts
import { createGame, initializeFacades, RenderingMode } from '@gamebyte/framework';
import { GameServiceProvider } from './services/GameServiceProvider';
import { MenuScene } from './scenes/MenuScene';

async function main() {
  const app = createGame();
  
  // Register custom services
  app.register(new GameServiceProvider());
  
  // Initialize facades
  initializeFacades(app);
  
  // Bootstrap the application
  await app.boot();
  
  // Initialize with canvas
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  await app.initialize(canvas, RenderingMode.PIXI_2D);
  
  // Start the game
  app.start();
}

main().catch(console.error);
```

#### Configuration (`config/`)
```
src/config/
├── game.ts               # Game configuration
├── rendering.ts          # Rendering settings
├── physics.ts            # Physics configuration
├── audio.ts              # Audio settings
└── input.ts              # Input configuration
```

Example configuration file:
```typescript
// src/config/game.ts
export const GameConfig = {
  name: 'My Awesome Game',
  version: '1.0.0',
  targetFPS: 60,
  resolution: {
    width: 800,
    height: 600,
    autoResize: true
  },
  physics: {
    enabled: true,
    gravity: { x: 0, y: 9.82 }
  },
  audio: {
    masterVolume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 0.8
  },
  mobile: {
    enableTouchControls: true,
    adaptiveQuality: true
  }
};
```

#### Scenes (`scenes/`)
```
src/scenes/
├── BaseScene.ts          # Base scene class
├── MenuScene.ts          # Main menu
├── GameScene.ts          # Main gameplay
├── PauseScene.ts         # Pause overlay
├── GameOverScene.ts      # Game over screen
├── SettingsScene.ts      # Settings menu
└── LoadingScene.ts       # Asset loading screen
```

Scene structure example:
```typescript
// src/scenes/GameScene.ts
import { Scene } from '@gamebyte/framework';
import { Player } from '../entities/Player';
import { GameUI } from '../components/GameUI';

export class GameScene implements Scene {
  public readonly id = 'game';
  public readonly name = 'Game Scene';
  public isActive = false;
  
  private player: Player;
  private gameUI: GameUI;
  
  async initialize(): Promise<void> {
    // Scene initialization
  }
  
  // ... other scene methods
}
```

#### Entities (`entities/`)
```
src/entities/
├── BaseEntity.ts         # Base entity class
├── Player.ts             # Player character
├── Enemy.ts              # Enemy entities
├── Collectible.ts        # Collectible items
├── Platform.ts           # Platform objects
├── Projectile.ts         # Bullets/projectiles
└── PowerUp.ts            # Power-up items
```

Entity structure example:
```typescript
// src/entities/Player.ts
import { BaseEntity } from './BaseEntity';
import { Physics } from '@gamebyte/framework';

export class Player extends BaseEntity {
  public health: number = 100;
  public score: number = 0;
  
  constructor(x: number, y: number) {
    super('player', x, y);
    this.setupPhysics();
    this.setupAnimation();
  }
  
  private setupPhysics(): void {
    // Physics setup
  }
  
  public update(deltaTime: number): void {
    // Update logic
  }
}
```

#### Systems (`systems/`)
```
src/systems/
├── InputSystem.ts        # Input handling
├── CameraSystem.ts       # Camera management
├── CollisionSystem.ts    # Collision detection
├── AnimationSystem.ts    # Animation management
├── ParticleSystem.ts     # Particle effects
├── SaveSystem.ts         # Game saving/loading
└── AnalyticsSystem.ts    # Analytics tracking
```

System structure example:
```typescript
// src/systems/InputSystem.ts
export class InputSystem {
  private inputMap: Map<string, boolean> = new Map();
  
  constructor() {
    this.setupEventListeners();
  }
  
  public isPressed(key: string): boolean {
    return this.inputMap.get(key) || false;
  }
  
  public update(): void {
    // Update input state
  }
}
```

#### Components (`components/`)
```
src/components/
├── ui/                   # UI components
│   ├── Button.ts         # Interactive buttons
│   ├── Panel.ts          # UI panels
│   ├── ProgressBar.ts    # Progress indicators
│   ├── Menu.ts           # Menu components
│   └── HUD.ts            # Heads-up display
├── gameplay/             # Gameplay components
│   ├── HealthBar.ts      # Health display
│   ├── Inventory.ts      # Inventory system
│   └── Dialog.ts         # Dialog system
└── effects/              # Visual effects
    ├── Explosion.ts      # Explosion effects
    ├── Trail.ts          # Trail effects
    └── Shake.ts          # Camera shake
```

#### Services (`services/`)
```
src/services/
├── GameServiceProvider.ts    # Main service provider
├── AssetService.ts          # Asset management
├── AudioService.ts          # Audio management
├── SaveService.ts           # Save/load functionality
├── NetworkService.ts        # Network operations
├── AnalyticsService.ts      # Analytics tracking
└── NotificationService.ts   # Push notifications
```

Service provider example:
```typescript
// src/services/GameServiceProvider.ts
import { AbstractServiceProvider, GameByte } from '@gamebyte/framework';
import { AssetService } from './AssetService';

export class GameServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('asset.service', () => new AssetService());
    app.singleton('audio.service', () => new AudioService());
  }
  
  async boot(app: GameByte): Promise<void> {
    const assetService = app.make<AssetService>('asset.service');
    await assetService.preloadCriticalAssets();
  }
}
```

#### Utilities (`utils/`)
```
src/utils/
├── MathUtils.ts          # Mathematical utilities
├── ColorUtils.ts         # Color manipulation
├── StringUtils.ts        # String operations
├── ArrayUtils.ts         # Array operations
├── DeviceUtils.ts        # Device detection
├── ValidationUtils.ts    # Input validation
└── PerformanceUtils.ts   # Performance helpers
```

#### Types (`types/`)
```
src/types/
├── index.ts              # Type exports
├── game.ts               # Game-specific types
├── entities.ts           # Entity types
├── events.ts             # Event types
└── api.ts                # API types
```

#### Assets (`assets/`)
```
src/assets/
├── index.ts              # Asset exports
├── sprites.ts            # Sprite definitions
├── sounds.ts             # Sound definitions
├── textures.ts           # Texture definitions
└── animations.ts         # Animation definitions
```

## Framework-Specific Patterns

### Service Registration Pattern

GameByte uses Laravel-inspired service providers:

```typescript
// src/services/CustomServiceProvider.ts
import { AbstractServiceProvider, GameByte } from '@gamebyte/framework';

export class CustomServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    // Register services
    app.bind('custom.service', () => new CustomService());
  }
  
  async boot(app: GameByte): Promise<void> {
    // Boot services after registration
    const service = app.make('custom.service');
    await service.initialize();
  }
}
```

### Scene Management Pattern

Organize scenes with clear separation:

```typescript
// src/scenes/BaseScene.ts
export abstract class BaseScene implements Scene {
  protected app: GameByte;
  protected assets: GameAssets;
  
  constructor(app: GameByte) {
    this.app = app;
  }
  
  abstract async initialize(): Promise<void>;
  abstract update(deltaTime: number): void;
  abstract render(renderer: any): void;
  abstract destroy(): void;
}
```

### Entity Component System

Use composition over inheritance:

```typescript
// src/entities/BaseEntity.ts
export class BaseEntity {
  public id: string;
  public position: Vector2;
  public components: Map<string, Component> = new Map();
  
  public addComponent<T extends Component>(component: T): T {
    this.components.set(component.name, component);
    return component;
  }
  
  public getComponent<T extends Component>(name: string): T | null {
    return this.components.get(name) as T || null;
  }
}
```

## Asset Organization

### Public Assets Structure
```
public/assets/
├── sprites/
│   ├── characters/        # Character sprites
│   │   ├── player/        # Player animations
│   │   └── enemies/       # Enemy sprites
│   ├── environment/       # Environment tiles
│   │   ├── platforms/     # Platform tiles
│   │   ├── backgrounds/   # Background images
│   │   └── decorations/   # Decorative elements
│   └── ui/                # UI elements
│       ├── buttons/       # Button sprites
│       ├── panels/        # Panel backgrounds
│       └── icons/         # Icon sprites
├── sounds/
│   ├── music/             # Background music
│   ├── sfx/               # Sound effects
│   └── voice/             # Voice clips
├── textures/
│   ├── materials/         # 3D materials
│   └── effects/           # Effect textures
└── fonts/                 # Font files
    ├── ui/                # UI fonts
    └── game/              # In-game fonts
```

### Asset Loading Strategy

```typescript
// src/utils/AssetLoader.ts
export class AssetLoader {
  private static preloadAssets = [
    'sprites/ui/loading.png',
    'sounds/ui/click.wav'
  ];
  
  private static gameAssets = [
    'sprites/characters/player/idle.png',
    'sprites/environment/platforms/grass.png',
    'sounds/music/background.mp3'
  ];
  
  static async preloadCritical(): Promise<void> {
    // Load essential assets for loading screen
  }
  
  static async loadGameAssets(): Promise<void> {
    // Load main game assets
  }
}
```

## Build Configuration

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@/scenes/*": ["src/scenes/*"],
      "@/entities/*": ["src/entities/*"],
      "@/systems/*": ["src/systems/*"],
      "@/components/*": ["src/components/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/assets/*": ["src/assets/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

### Build Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/scenes': resolve(__dirname, 'src/scenes'),
      '@/entities': resolve(__dirname, 'src/entities'),
      '@/systems': resolve(__dirname, 'src/systems'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/assets': resolve(__dirname, 'src/assets')
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'gamebyte': ['@gamebyte/framework'],
          'pixi': ['pixi.js'],
          'three': ['three'],
          'physics': ['matter-js', 'cannon-es']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
```

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "type-check": "tsc --noEmit",
    "clean": "rimraf dist",
    "analyze": "vite-bundle-analyzer dist/stats.html"
  }
}
```

## Development Workflow

### 1. Project Creation
```bash
# Using the official template
npx create-gamebyte-app my-game

# Or start from scratch
mkdir my-game
cd my-game
npm init -y
npm install @gamebyte/framework pixi.js three matter-js cannon-es
```

### 2. Development Process
```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting and formatting
npm run lint:fix
npm run format
```

### 3. Build Process
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze
```

## Best Practices

### 1. **Separation of Concerns**
- Keep game logic separate from rendering
- Use services for cross-cutting concerns
- Separate data from presentation

### 2. **Dependency Injection**
- Use the service container for dependency management
- Register services in service providers
- Avoid tight coupling between classes

### 3. **Asset Management**
- Organize assets by type and usage
- Use consistent naming conventions
- Implement proper asset loading strategies

### 4. **Type Safety**
- Define interfaces for all major components
- Use TypeScript strict mode
- Document complex types

### 5. **Performance Considerations**
- Structure code for tree-shaking
- Use lazy loading for non-critical assets
- Implement object pooling where appropriate

### 6. **Mobile Optimization**
- Design for touch-first interaction
- Consider different screen sizes
- Implement adaptive quality settings

## Example Project Templates

### Minimal Project
```
src/
├── main.ts
├── scenes/
│   └── GameScene.ts
└── entities/
    └── Player.ts
```

### Medium Project
```
src/
├── main.ts
├── config/
├── scenes/
├── entities/
├── systems/
├── components/
└── utils/
```

### Large Project
```
src/
├── main.ts
├── config/
├── scenes/
├── entities/
├── systems/
├── components/
├── services/
├── utils/
├── types/
├── assets/
└── plugins/
```

## Resources

- [Getting Started Guide](./quickstart.md)
- [Core Concepts](../core-concepts/architecture.md)
- [Service Providers Guide](../core-concepts/service-providers.md)
- [Asset Management](../assets/overview.md)

---

This project structure provides a solid foundation for building scalable GameByte Framework games. Choose the structure that fits your project size and complexity, and expand as needed.