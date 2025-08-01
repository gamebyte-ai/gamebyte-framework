# Core API Reference

This document provides comprehensive API reference for GameByte Framework's core classes and interfaces.

## GameByte Class

The main application class that orchestrates the entire framework.

### Constructor

```typescript
constructor()
```

Creates a new GameByte application instance. Usually accessed through static factory methods.

### Static Methods

#### `create()`
```typescript
static create(): GameByte
```
Creates a new GameByte application instance.

**Returns:** New GameByte instance

**Example:**
```typescript
const app = GameByte.create();
```

#### `getInstance()`
```typescript
static getInstance(): GameByte
```
Gets the singleton instance of the framework.

**Returns:** Singleton GameByte instance

### Instance Methods

#### `register()`
```typescript
register(provider: ServiceProvider | (new () => ServiceProvider), name?: string): this
```
Registers a service provider with the application.

**Parameters:**
- `provider` - Service provider instance or constructor
- `name` - Optional provider name

**Returns:** GameByte instance for chaining

**Example:**
```typescript
app.register(new CustomServiceProvider());
app.register(CustomServiceProvider, 'custom-provider');
```

#### `boot()`
```typescript
async boot(): Promise<this>
```
Boots all registered service providers.

**Returns:** Promise resolving to GameByte instance

**Example:**
```typescript
await app.boot();
```

#### `initialize()`
```typescript
async initialize(
  canvas: HTMLCanvasElement, 
  mode: RenderingMode, 
  options?: RendererOptions
): Promise<this>
```
Initializes the framework with a canvas element.

**Parameters:**
- `canvas` - HTML canvas element for rendering
- `mode` - Rendering mode (PIXI_2D, THREE_3D, HYBRID)
- `options` - Optional renderer configuration

**Returns:** Promise resolving to GameByte instance

**Example:**
```typescript
await app.initialize(canvas, RenderingMode.PIXI_2D, {
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb
});
```

#### `start()`
```typescript
start(): this
```
Starts the game loop.

**Returns:** GameByte instance for chaining

#### `stop()`
```typescript
stop(): this
```
Stops the game loop.

**Returns:** GameByte instance for chaining

#### `make()`
```typescript
make<T = any>(key: string): T
```
Resolves a service from the container.

**Type Parameters:**
- `T` - Type of the service to resolve

**Parameters:**
- `key` - Service identifier

**Returns:** Resolved service instance

**Example:**
```typescript
const renderer = app.make<RendererService>('renderer');
```

#### `bind()`
```typescript
bind<T = any>(key: string, concrete: T | (() => T), singleton = false): this
```
Binds a service to the container.

**Type Parameters:**
- `T` - Type of the service

**Parameters:**
- `key` - Service identifier
- `concrete` - Service instance or factory function
- `singleton` - Whether to register as singleton

**Returns:** GameByte instance for chaining

#### `singleton()`
```typescript
singleton<T = any>(key: string, concrete: T | (() => T)): this
```
Binds a singleton service to the container.

**Type Parameters:**
- `T` - Type of the service

**Parameters:**
- `key` - Service identifier
- `concrete` - Service instance or factory function

**Returns:** GameByte instance for chaining

### Properties

#### `VERSION`
```typescript
static readonly VERSION: string
```
Framework version string.

### Events

The GameByte class extends EventEmitter and emits the following events:

#### `'initialized'`
Emitted when the framework is initialized.

**Event Data:**
```typescript
{
  canvas: HTMLCanvasElement;
  mode: RenderingMode;
  options?: RendererOptions;
}
```

#### `'started'`
Emitted when the game loop starts.

#### `'stopped'`
Emitted when the game loop stops.

#### `'provider:registered'`
Emitted when a service provider is registered.

**Event Data:**
```typescript
{
  name: string;
  provider: ServiceProvider;
}
```

## ServiceContainer Class

The dependency injection container that manages service registration and resolution.

### Methods

#### `bind()`
```typescript
bind<T>(key: string, concrete: T | (() => T), singleton?: boolean): void
```
Binds a service to the container.

#### `singleton()`
```typescript
singleton<T>(key: string, concrete: T | (() => T)): void
```
Binds a singleton service to the container.

#### `instance()`
```typescript
instance<T>(key: string, instance: T): void
```
Binds an existing instance to the container.

#### `make()`
```typescript
make<T>(key: string): T
```
Resolves a service from the container.

#### `bound()`
```typescript
bound(key: string): boolean
```
Checks if a service is bound to the container.

#### `alias()`
```typescript
alias(original: string, alias: string): void
```
Creates an alias for a service.

#### `flush()`
```typescript
flush(): void
```
Clears all bindings and resolved instances.

## ServiceProvider Interface

Base interface for all service providers.

```typescript
interface ServiceProvider {
  register(app: GameByte): void;
  boot?(app: GameByte): void | Promise<void>;
}
```

### Methods

#### `register()`
```typescript
register(app: GameByte): void
```
Registers services with the application container.

**Parameters:**
- `app` - GameByte application instance

#### `boot()` (Optional)
```typescript
boot?(app: GameByte): void | Promise<void>
```
Boots the service provider after all providers are registered.

**Parameters:**
- `app` - GameByte application instance

**Returns:** Void or Promise for async operations

## AbstractServiceProvider Class

Abstract base class for service providers with common functionality.

```typescript
abstract class AbstractServiceProvider implements ServiceProvider {
  abstract register(app: GameByte): void;
  boot?(app: GameByte): void | Promise<void>;
}
```

## Scene Interface

Interface that all game scenes must implement.

```typescript
interface Scene {
  readonly id: string;
  readonly name: string;
  isActive: boolean;
  
  initialize(): Promise<void>;
  activate(): void;
  deactivate(): void;
  update(deltaTime: number): void;
  render(renderer: any): void;
  destroy(): void;
}
```

### Properties

#### `id`
```typescript
readonly id: string
```
Unique identifier for the scene.

#### `name`
```typescript
readonly name: string
```
Human-readable name for the scene.

#### `isActive`
```typescript
isActive: boolean
```
Whether the scene is currently active.

### Methods

#### `initialize()`
```typescript
initialize(): Promise<void>
```
Initializes the scene. Called once when scene is first created.

#### `activate()`
```typescript
activate(): void
```
Activates the scene. Called when scene becomes active.

#### `deactivate()`
```typescript
deactivate(): void
```
Deactivates the scene. Called when scene becomes inactive.

#### `update()`
```typescript
update(deltaTime: number): void
```
Updates the scene logic.

**Parameters:**
- `deltaTime` - Time elapsed since last update in milliseconds

#### `render()`
```typescript
render(renderer: any): void
```
Renders the scene.

**Parameters:**
- `renderer` - Renderer instance

#### `destroy()`
```typescript
destroy(): void
```
Cleans up scene resources. Called when scene is destroyed.

## Enums

### RenderingMode

```typescript
enum RenderingMode {
  PIXI_2D = 'pixi-2d',
  THREE_3D = 'three-3d',
  HYBRID = 'hybrid'
}
```

Defines the available rendering modes.

- `PIXI_2D` - 2D rendering using Pixi.js
- `THREE_3D` - 3D rendering using Three.js
- `HYBRID` - Combined 2D and 3D rendering

## Type Definitions

### RendererOptions

```typescript
interface RendererOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  antialias?: boolean;
  transparent?: boolean;
  preserveDrawingBuffer?: boolean;
  resizeTo?: Window | HTMLElement;
}
```

Configuration options for renderer initialization.

### Vector2

```typescript
interface Vector2 {
  x: number;
  y: number;
}
```

2D vector type used throughout the framework.

### Vector3

```typescript
interface Vector3 {
  x: number;
  y: number;
  z: number;
}
```

3D vector type used for 3D operations.

## Factory Functions

### `createGame()`

```typescript
function createGame(options?: GameOptions): GameByte
```

Factory function to create a new GameByte application.

**Parameters:**
- `options` - Optional game configuration

**Returns:** New GameByte instance

**Example:**
```typescript
const app = createGame({
  debug: true,
  mobile: true
});
```

### `createMobileGame()`

```typescript
function createMobileGame(options?: MobileGameOptions): GameByte
```

Factory function to create a mobile-optimized GameByte application.

**Parameters:**
- `options` - Mobile-specific configuration

**Returns:** New GameByte instance with mobile optimizations

### `initializeFacades()`

```typescript
function initializeFacades(app: GameByte): void
```

Initializes all facade classes with the given application instance.

**Parameters:**
- `app` - GameByte application instance

**Example:**
```typescript
const app = createGame();
initializeFacades(app);

// Now facades can be used
import { Renderer, Scenes } from '@gamebyte/framework';
await Renderer.initialize(canvas, RenderingMode.PIXI_2D);
```

## Error Types

### GameError

```typescript
class GameError extends Error {
  public readonly code: string;
  public readonly userMessage?: string;
  
  constructor(message: string, code: string, userMessage?: string);
}
```

Base error class for framework-specific errors.

### InitializationError

```typescript
class InitializationError extends GameError {
  constructor(message: string, component: string);
}
```

Error thrown during framework initialization.

### ServiceResolutionError

```typescript
class ServiceResolutionError extends GameError {
  constructor(serviceName: string);
}
```

Error thrown when a service cannot be resolved from the container.

## Usage Examples

### Basic Application Setup

```typescript
import { createGame, initializeFacades, RenderingMode } from '@gamebyte/framework';

// Create application
const app = createGame();

// Initialize facades
initializeFacades(app);

// Register custom services
class MyServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('my.service', () => new MyService());
  }
}

app.register(new MyServiceProvider());

// Initialize and start
async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  
  await app.initialize(canvas, RenderingMode.PIXI_2D, {
    width: 800,
    height: 600
  });
  
  app.start();
}

main().catch(console.error);
```

### Custom Scene Implementation

```typescript
import { Scene } from '@gamebyte/framework';

class GameScene implements Scene {
  public readonly id = 'game';
  public readonly name = 'Game Scene';
  public isActive = false;
  
  async initialize(): Promise<void> {
    // Load scene assets
    await Assets.load(['player.png', 'background.png']);
    
    // Create scene objects
    this.setupPlayer();
    this.setupEnvironment();
  }
  
  activate(): void {
    this.isActive = true;
    console.log('Game scene activated');
  }
  
  deactivate(): void {
    this.isActive = false;
    console.log('Game scene deactivated');
  }
  
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    // Update game logic
    this.player.update(deltaTime);
    this.enemies.forEach(enemy => enemy.update(deltaTime));
  }
  
  render(renderer: any): void {
    // Rendering is handled automatically by the framework
  }
  
  destroy(): void {
    // Clean up resources
    this.player.destroy();
    this.enemies.forEach(enemy => enemy.destroy());
  }
  
  private setupPlayer(): void {
    // Player setup implementation
  }
  
  private setupEnvironment(): void {
    // Environment setup implementation
  }
}
```

## Next Steps

- [Service Container API](./service-container.md) - Detailed container documentation
- [Rendering API](./rendering.md) - Rendering system interfaces
- [Physics API](./physics.md) - Physics system interfaces
- [Scene API](./scenes.md) - Scene management interfaces