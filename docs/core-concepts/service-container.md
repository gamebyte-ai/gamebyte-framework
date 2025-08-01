# Service Container

The Service Container is the heart of GameByte Framework's dependency injection system. Inspired by Laravel's IoC container, it manages service registration, resolution, and lifecycle, enabling clean, testable, and maintainable code.

## Container Basics

### What is a Service Container?

A Service Container (also known as an IoC Container or Dependency Injection Container) is a tool for managing class dependencies and performing dependency injection. It automatically resolves dependencies when creating objects, promoting loose coupling and easier testing.

```typescript
import { GameByte, ServiceContainer } from '@gamebyte/framework';

// Get the application's service container
const app = GameByte.create();
const container = app.getContainer();

// Register a service
container.bind('logger', () => new Logger());

// Resolve the service
const logger = container.make<Logger>('logger');
```

### Key Benefits

- **Dependency Injection**: Automatic resolution of constructor dependencies
- **Loose Coupling**: Services depend on abstractions, not concrete implementations
- **Testability**: Easy to mock dependencies for unit testing
- **Configuration**: Centralized service configuration and setup
- **Lifecycle Management**: Singleton and factory patterns built-in

## Service Registration

### Basic Binding

Register services using the `bind()` method:

```typescript
// Simple factory binding
app.bind('http.client', () => new HttpClient());

// Binding with configuration
app.bind('database', () => new Database({
  host: 'localhost',
  port: 5432,
  database: 'gamedb'
}));

// Binding with dependencies
app.bind('user.service', () => {
  const database = app.make<Database>('database');
  const logger = app.make<Logger>('logger');
  return new UserService(database, logger);
});
```

### Singleton Binding

Register singleton services that are created once and reused:

```typescript
// Singleton registration
app.singleton('cache', () => new CacheService());
app.singleton('config', () => new ConfigurationService());

// Both calls return the same instance
const cache1 = app.make<CacheService>('cache');
const cache2 = app.make<CacheService>('cache');
console.log(cache1 === cache2); // true
```

### Instance Binding

Register existing instances directly:

```typescript
const existingConfig = new Configuration();
app.instance('config', existingConfig);

// Or bind primitive values
app.instance('app.version', '1.0.0');
app.instance('debug.mode', true);
```

### Interface Binding

Bind interfaces to concrete implementations:

```typescript
// Define an interface
interface Logger {
  log(message: string): void;
  error(message: string): void;
}

// Concrete implementation
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
  
  error(message: string): void {
    console.error(message);
  }
}

// Bind interface to implementation
app.bind<Logger>('logger', () => new ConsoleLogger());

// Resolve using interface type
const logger = app.make<Logger>('logger');
```

## Service Resolution

### Basic Resolution

Resolve services using the `make()` method:

```typescript
// Resolve a service
const renderer = app.make<RendererService>('renderer');

// Check if service is bound
if (app.bound('optional.service')) {
  const service = app.make('optional.service');
}

// Resolve with fallback
const service = app.makeWith('service.name', () => new DefaultService());
```

### Automatic Constructor Injection

The container can automatically resolve constructor dependencies:

```typescript
class GameManager {
  constructor(
    private renderer: RendererService,
    private physics: PhysicsService,
    private audio: AudioService
  ) {}
}

// Register with automatic dependency resolution
app.bind('game.manager', () => {
  return app.resolve(GameManager);
});

// Or use the auto-resolution helper
app.bind('game.manager', GameManager);
```

### Method Injection

Resolve dependencies for method calls:

```typescript
class SceneManager {
  switchTo(sceneId: string, renderer: RendererService, audio: AudioService): void {
    // Method implementation
  }
}

const sceneManager = new SceneManager();

// Inject dependencies into method call
app.call(sceneManager, 'switchTo', ['main-menu']);
```

## Advanced Container Features

### Contextual Binding

Bind different implementations based on the requesting context:

```typescript
// Different loggers for different services
app.when('user.service')
   .needs('logger')
   .give(() => new DatabaseLogger());

app.when('auth.service')
   .needs('logger')
   .give(() => new SecurityLogger());

app.when('game.service')
   .needs('logger')
   .give(() => new GameLogger());
```

### Tagged Services

Group related services with tags:

```typescript
// Register services with tags
app.bind('email.smtp', () => new SMTPMailer()).tag('mailer');
app.bind('email.sendgrid', () => new SendGridMailer()).tag('mailer');
app.bind('email.mailgun', () => new MailgunMailer()).tag('mailer');

// Resolve all tagged services
const mailers = app.tagged<Mailer>('mailer');
```

### Extending Services

Extend existing service registrations:

```typescript
// Initial registration
app.singleton('config', () => new Configuration());

// Extend the service
app.extend('config', (config: Configuration) => {
  config.addPlugin(new MyPlugin());
  return config;
});

// Multiple extensions are applied in order
app.extend('config', (config: Configuration) => {
  config.setEnvironment('production');
  return config;
});
```

### Aliases

Create aliases for service names:

```typescript
// Register with full name
app.singleton('application.renderer.service', () => new RendererService());

// Create aliases for convenience
app.alias('application.renderer.service', 'renderer');
app.alias('renderer', 'gfx');

// All of these resolve to the same service
const renderer1 = app.make('application.renderer.service');
const renderer2 = app.make('renderer');
const renderer3 = app.make('gfx');
```

## Container in Practice

### Game Service Example

Here's a complete example of using the container for a game service:

```typescript
// Define interfaces
interface AssetLoader {
  load(path: string): Promise<any>;
}

interface SceneRenderer {
  render(scene: Scene): void;
}

// Implement services
class GameAssetLoader implements AssetLoader {
  async load(path: string): Promise<any> {
    // Implementation
  }
}

class PixiSceneRenderer implements SceneRenderer {
  render(scene: Scene): void {
    // Implementation
  }
}

// Main game service
class GameEngine {
  constructor(
    private assetLoader: AssetLoader,
    private renderer: SceneRenderer,
    private config: GameConfiguration
  ) {}
  
  async start(): Promise<void> {
    // Use injected dependencies
    await this.assetLoader.load('initial-assets.json');
    this.renderer.render(this.currentScene);
  }
}

// Register all services
app.bind('asset.loader', () => new GameAssetLoader());
app.bind('scene.renderer', () => new PixiSceneRenderer());
app.singleton('game.config', () => new GameConfiguration());

// Register the main service with automatic dependency injection
app.bind('game.engine', () => {
  return new GameEngine(
    app.make<AssetLoader>('asset.loader'),
    app.make<SceneRenderer>('scene.renderer'),
    app.make<GameConfiguration>('game.config')
  );
});

// Start the game
const game = app.make<GameEngine>('game.engine');
await game.start();
```

### Service Provider Integration

Service providers work seamlessly with the container:

```typescript
export class GameServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    // Register core services
    app.singleton('game.state', () => new GameStateManager());
    app.singleton('save.system', () => new SaveSystem());
    
    // Register with dependencies
    app.bind('achievement.manager', () => {
      return new AchievementManager(
        app.make('game.state'),
        app.make('save.system')
      );
    });
  }
  
  async boot(app: GameByte): Promise<void> {
    // Configure services after registration
    const achievements = app.make<AchievementManager>('achievement.manager');
    await achievements.loadDefinitions();
  }
}
```

## Testing with the Container

### Mocking Dependencies

The container makes testing easier by allowing dependency mocking:

```typescript
describe('GameEngine', () => {
  let app: GameByte;
  let mockAssetLoader: jest.Mocked<AssetLoader>;
  let mockRenderer: jest.Mocked<SceneRenderer>;
  
  beforeEach(() => {
    app = GameByte.create();
    
    // Create mocks
    mockAssetLoader = {
      load: jest.fn().mockResolvedValue({})
    };
    
    mockRenderer = {
      render: jest.fn()
    };
    
    // Bind mocks to container
    app.instance('asset.loader', mockAssetLoader);
    app.instance('scene.renderer', mockRenderer);
    app.singleton('game.config', () => new GameConfiguration());
    
    // Register service under test
    app.bind('game.engine', () => {
      return new GameEngine(
        app.make('asset.loader'),
        app.make('scene.renderer'),
        app.make('game.config')
      );
    });
  });
  
  it('should load assets on start', async () => {
    const engine = app.make<GameEngine>('game.engine');
    await engine.start();
    
    expect(mockAssetLoader.load).toHaveBeenCalledWith('initial-assets.json');
  });
});
```

### Test Containers

Create isolated containers for testing:

```typescript
describe('Service Integration Tests', () => {
  let testContainer: ServiceContainer;
  
  beforeEach(() => {
    testContainer = new ServiceContainer();
    
    // Register test-specific services
    testContainer.singleton('test.database', () => new InMemoryDatabase());
    testContainer.bind('test.logger', () => new NullLogger());
  });
  
  afterEach(() => {
    testContainer.flush(); // Clean up
  });
  
  it('should resolve dependencies correctly', () => {
    const service = testContainer.make('test.service');
    expect(service).toBeInstanceOf(TestService);
  });
});
```

## Performance Considerations

### Lazy Loading

Services are resolved lazily - only when requested:

```typescript
// Service is registered but not created yet
app.bind('expensive.service', () => {
  console.log('Creating expensive service...'); // Only runs when resolved
  return new ExpensiveService();
});

// Service is created now
const service = app.make('expensive.service');
```

### Circular Dependencies

Avoid circular dependencies by using lazy resolution:

```typescript
// Problematic: Direct circular dependency
class ServiceA {
  constructor(private serviceB: ServiceB) {}
}

class ServiceB {
  constructor(private serviceA: ServiceA) {}
}

// Solution: Lazy resolution
class ServiceA {
  constructor(private container: ServiceContainer) {}
  
  getServiceB(): ServiceB {
    return this.container.make<ServiceB>('service.b');
  }
}

class ServiceB {
  constructor(private container: ServiceContainer) {}
  
  getServiceA(): ServiceA {
    return this.container.make<ServiceA>('service.a');
  }
}
```

### Memory Management

Clean up services when needed:

```typescript
// Flush all services (useful for testing)
app.getContainer().flush();

// Remove specific service
app.getContainer().forget('temporary.service');

// Check container state
console.log('Resolved services:', app.getContainer().getResolved());
console.log('Bound services:', app.getContainer().getBindings());
```

## Container Events

Listen to container events for debugging and monitoring:

```typescript
// Listen to service resolution
app.on('service:resolved', (serviceName, instance) => {
  console.log(`Service resolved: ${serviceName}`);
});

// Listen to service binding
app.on('service:bound', (serviceName, binding) => {
  console.log(`Service bound: ${serviceName}`);
});

// Listen to container flush
app.on('container:flushed', () => {
  console.log('Container flushed');
});
```

## Best Practices

### 1. Use Interfaces

Always bind to interfaces rather than concrete classes:

```typescript
// Good: Binding to interface
app.bind<Logger>('logger', () => new ConsoleLogger());

// Less ideal: Binding to concrete class
app.bind('logger', () => new ConsoleLogger());
```

### 2. Prefer Singletons for Stateful Services

Use singletons for services that maintain state:

```typescript
// Stateful services should be singletons
app.singleton('game.state', () => new GameStateManager());
app.singleton('user.session', () => new UserSession());

// Stateless services can be regular bindings
app.bind('math.utils', () => new MathUtils());
```

### 3. Use Service Providers

Register related services together in service providers:

```typescript
export class AudioServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('audio.context', () => new AudioContext());
    app.bind('audio.loader', () => new AudioAssetLoader());
    app.bind('audio.mixer', () => new AudioMixer());
  }
}
```

### 4. Meaningful Service Names

Use clear, hierarchical service names:

```typescript
// Good: Clear hierarchy
app.bind('rendering.pixi.service', () => new PixiRenderer());
app.bind('rendering.three.service', () => new ThreeRenderer());
app.bind('physics.matter.service', () => new MatterPhysics());

// Less clear: Flat names
app.bind('pixi', () => new PixiRenderer());
app.bind('three', () => new ThreeRenderer());
```

### 5. Configuration Through Container

Use the container for configuration management:

```typescript
// Register configuration
app.singleton('config.game', () => ({
  targetFPS: 60,
  enablePhysics: true,
  debugMode: process.env.NODE_ENV === 'development'
}));

// Use configuration in services
app.bind('game.loop', () => {
  const config = app.make('config.game');
  return new GameLoop(config.targetFPS, config.debugMode);
});
```

## API Reference

### ServiceContainer Methods

```typescript
interface ServiceContainer {
  // Binding
  bind<T>(key: string, concrete: T | (() => T), singleton?: boolean): void;
  singleton<T>(key: string, concrete: T | (() => T)): void;
  instance<T>(key: string, instance: T): void;
  
  // Resolution
  make<T>(key: string): T;
  makeWith<T>(key: string, fallback: () => T): T;
  resolve<T>(constructor: new (...args: any[]) => T): T;
  call<T>(instance: T, method: string, parameters?: any[]): any;
  
  // Utilities
  bound(key: string): boolean;
  alias(original: string, alias: string): void;
  tag(services: string[], tags: string[]): void;
  tagged<T>(tag: string): T[];
  
  // Advanced
  when(concrete: string): ContextualBindingBuilder;
  extend<T>(key: string, extender: (service: T) => T): void;
  
  // Lifecycle
  flush(): void;
  forget(key: string): void;
  getBindings(): { [key: string]: any };
  getResolved(): { [key: string]: any };
}
```

## Summary

The Service Container is a powerful tool that enables:

- **Clean Architecture**: Dependency injection promotes SOLID principles
- **Testability**: Easy mocking and isolation for unit tests
- **Flexibility**: Runtime service replacement and configuration
- **Maintainability**: Centralized service management and clear dependencies

Understanding and effectively using the Service Container is crucial for building scalable GameByte Framework applications.

## Next Steps

- [Service Providers Guide](./service-providers.md) - Learn how to organize service registration
- [Facades Documentation](./facades.md) - Static interfaces to container services
- [Application Lifecycle](./lifecycle.md) - How services are initialized and managed