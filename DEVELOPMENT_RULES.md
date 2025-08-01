# GameByte Framework Development Rules

## Overview

This document establishes strict development rules for the GameByte Framework. These rules ensure code quality, maintainability, and consistency across all contributions.

## Core Development Principles

### 1. Test-Driven Development (TDD)

**MANDATORY: 100% Test Coverage**

```typescript
// ✅ REQUIRED: Every public method must be tested
export class ServiceContainer {
  public bind() {} // ✅ Must have test
  public make() {} // ✅ Must have test
  public bound() {} // ✅ Must have test
  
  private resolve() {} // ✅ Must be covered via public method tests
}

// ✅ REQUIRED: Every branch must be tested
if (condition) {
  // ✅ This branch needs test coverage
  return result;
} else {
  // ✅ This branch needs test coverage
  throw new Error('Invalid condition');
}

// ✅ REQUIRED: Every error path must be tested
try {
  riskyOperation();
} catch (error) {
  // ✅ This catch block needs test coverage
  handleError(error);
}
```

**Test Requirements:**
- All functions: 100% coverage
- All branches: 100% coverage  
- All statements: 100% coverage
- All lines: 100% coverage

### 2. Type Safety Requirements

**MANDATORY: Strict TypeScript Usage**

```typescript
// ✅ CORRECT: Explicit types for public APIs
public make<T = any>(key: string): T {
  return this.container.resolve<T>(key);
}

// ✅ CORRECT: Proper generic constraints
interface Container {
  bind<T>(key: string, concrete: T | Factory<T>): void;
  make<T>(key: string): T;
}

// ❌ FORBIDDEN: Using 'any' without justification
function process(data: any): any { // ❌ Not allowed
  return data.whatever();
}

// ✅ CORRECT: Proper typing
function process<T extends Processable>(data: T): ProcessResult<T> {
  return data.process();
}
```

**Type Safety Rules:**
- No `any` types without explicit justification in comments
- All public APIs must have explicit type annotations
- Use proper generic constraints
- Implement proper error types

### 3. Laravel-Inspired Architecture

**MANDATORY: Follow Laravel Patterns**

#### Service Container Pattern
```typescript
// ✅ CORRECT: Dependency injection container
class GameByte {
  private container: ServiceContainer;
  
  constructor() {
    this.container = new ServiceContainer();
    this.registerCoreServices();
  }
  
  public make<T>(key: string): T {
    return this.container.make<T>(key);
  }
}
```

#### Service Provider Pattern
```typescript
// ✅ CORRECT: Service provider implementation
export class AudioServiceProvider extends AbstractServiceProvider {
  register(app: GameByte): void {
    app.singleton('audio.manager', () => new AudioManager());
    app.bind('audio.context', () => new AudioContext());
  }
  
  async boot(app: GameByte): Promise<void> {
    const manager = app.make<AudioManager>('audio.manager');
    await manager.initialize();
  }
  
  provides(): string[] {
    return ['audio.manager', 'audio.context'];
  }
}
```

#### Facade Pattern
```typescript
// ✅ CORRECT: Facade implementation
export class Audio extends Facade {
  protected static getFacadeAccessor(): string {
    return 'audio.manager';
  }
}

// Usage
Audio.play('sound.mp3');
Audio.setVolume(0.8);
```

### 4. Mobile-First Development

**MANDATORY: Optimize for Mobile**

```typescript
// ✅ CORRECT: Device-aware optimization
class PerformanceOptimizer {
  optimizeForDevice(deviceTier: DeviceTier): Settings {
    switch (deviceTier) {
      case DeviceTier.HIGH:
        return {
          particleCount: 1000,
          shadowQuality: 'high',
          textureResolution: '2048x2048'
        };
      case DeviceTier.MEDIUM:
        return {
          particleCount: 500,
          shadowQuality: 'medium',
          textureResolution: '1024x1024'
        };
      case DeviceTier.LOW:
        return {
          particleCount: 100,
          shadowQuality: 'low',
          textureResolution: '512x512'
        };
    }
  }
}

// ✅ CORRECT: Touch-first input handling
class InputManager {
  handleInput(event: Event): void {
    if (event instanceof TouchEvent) {
      // Prioritize touch events
      this.handleTouch(event);
    } else if (event instanceof MouseEvent && !this.hasTouchCapability()) {
      // Fallback to mouse only if no touch
      this.handleMouse(event);
    }
  }
}
```

## Code Organization Rules

### 1. File Structure Standards

```
src/
├── core/                    # Core framework components
│   ├── GameByte.ts         # Main framework class
│   └── ServiceContainer.ts # DI container
├── contracts/              # Interfaces and types
│   ├── Container.ts
│   └── ServiceProvider.ts
├── services/               # Service providers
│   ├── AudioServiceProvider.ts
│   └── RenderingServiceProvider.ts
├── facades/                # Facade implementations
│   ├── Facade.ts
│   └── Audio.ts
└── index.ts               # Main export file
```

### 2. Import Organization

```typescript
// ✅ CORRECT: Import order
// 1. External libraries
import { EventEmitter } from 'eventemitter3';
import * as PIXI from 'pixi.js';

// 2. Internal core imports
import { ServiceContainer } from '../core/ServiceContainer';
import { AbstractServiceProvider } from '../contracts/ServiceProvider';

// 3. Internal feature imports
import { AudioManager } from '../audio/AudioManager';
import { RenderingEngine } from '../rendering/RenderingEngine';

// 4. Type-only imports (use 'import type')
import type { Container } from '../contracts/Container';
import type { ServiceProvider } from '../contracts/ServiceProvider';
```

### 3. Class Structure Standards

```typescript
// ✅ CORRECT: Class organization
export class GameByte extends EventEmitter {
  // 1. Static properties
  public static readonly VERSION = '1.0.0';
  private static instance: GameByte;
  
  // 2. Instance properties (private first)
  private readonly container: ServiceContainer;
  private readonly providers: Map<string, ServiceProvider>;
  private booted = false;
  
  // 3. Public properties
  public readonly startTime: number;
  
  // 4. Constructor
  constructor() {
    super();
    this.container = new ServiceContainer();
    this.providers = new Map();
    this.startTime = Date.now();
    this.registerCoreServices();
  }
  
  // 5. Static methods
  static getInstance(): GameByte {
    if (!GameByte.instance) {
      GameByte.instance = new GameByte();
    }
    return GameByte.instance;
  }
  
  // 6. Private methods
  private registerCoreServices(): void {
    this.container.instance('app', this);
    this.container.instance('container', this.container);
  }
  
  // 7. Public methods
  public register(provider: ServiceProvider): this {
    // Implementation
    return this;
  }
}
```

## Error Handling Rules

### 1. Custom Error Types

```typescript
// ✅ CORRECT: Specific error types
export class ServiceNotFoundError extends Error {
  constructor(serviceName: string) {
    super(`Service '${serviceName}' not found in container`);
    this.name = 'ServiceNotFoundError';
  }
}

export class CircularDependencyError extends Error {
  constructor(dependencyChain: string[]) {
    super(`Circular dependency detected: ${dependencyChain.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}

// ✅ CORRECT: Use specific errors
public make<T>(key: string): T {
  if (!this.bound(key)) {
    throw new ServiceNotFoundError(key);
  }
  return this.resolve<T>(key);
}
```

### 2. Input Validation

```typescript
// ✅ CORRECT: Validate all inputs
public bind<T>(key: string, concrete: T | Factory<T>): void {
  if (!key || typeof key !== 'string') {
    throw new Error('Service key must be a non-empty string');
  }
  
  if (concrete === undefined) {
    throw new Error('Service concrete cannot be undefined');
  }
  
  if (key.trim().length === 0) {
    throw new Error('Service key cannot be empty or whitespace');
  }
  
  // Implementation continues...
}
```

### 3. Error Recovery

```typescript
// ✅ CORRECT: Graceful error handling
public async initializeRenderer(canvas: HTMLCanvasElement): Promise<void> {
  try {
    const renderer = this.createRenderer();
    await renderer.initialize(canvas);
  } catch (error) {
    console.error('Renderer initialization failed:', error);
    
    // Attempt fallback
    try {
      const fallbackRenderer = this.createFallbackRenderer();
      await fallbackRenderer.initialize(canvas);
      console.warn('Using fallback renderer');
    } catch (fallbackError) {
      throw new Error(`All renderer initialization attempts failed: ${error.message}`);
    }
  }
}
```

## Performance Rules

### 1. Memory Management

```typescript
// ✅ CORRECT: Proper cleanup
export class GameByte {
  private listeners: Map<string, Function[]> = new Map();
  
  public destroy(): void {
    // Clean up event listeners
    this.removeAllListeners();
    
    // Clean up containers
    this.container.flush();
    this.providers.clear();
    
    // Clean up references
    this.listeners.clear();
    
    // Reset state
    this.booted = false;
    this.running = false;
  }
}
```

### 2. Lazy Loading

```typescript
// ✅ CORRECT: Lazy initialization
class AudioManager {
  private _audioContext?: AudioContext;
  
  get audioContext(): AudioContext {
    if (!this._audioContext) {
      this._audioContext = new AudioContext();
    }
    return this._audioContext;
  }
}
```

### 3. Object Pooling

```typescript
// ✅ CORRECT: Object pooling for frequently created objects
class ParticlePool {
  private pool: Particle[] = [];
  private activeParticles: Set<Particle> = new Set();
  
  acquire(): Particle {
    let particle = this.pool.pop();
    if (!particle) {
      particle = new Particle();
    }
    this.activeParticles.add(particle);
    return particle;
  }
  
  release(particle: Particle): void {
    if (this.activeParticles.has(particle)) {
      particle.reset();
      this.activeParticles.delete(particle);
      this.pool.push(particle);
    }
  }
}
```

## Documentation Rules

### 1. JSDoc Requirements

```typescript
/**
 * Service container implementation for dependency injection.
 * Provides Laravel-style service binding and resolution with support
 * for singletons, factories, and automatic dependency resolution.
 * 
 * @example Basic Usage
 * ```typescript
 * const container = new ServiceContainer();
 * 
 * // Bind a service
 * container.bind('logger', new ConsoleLogger());
 * 
 * // Resolve a service
 * const logger = container.make<Logger>('logger');
 * logger.log('Hello World');
 * ```
 * 
 * @example Singleton Binding
 * ```typescript
 * container.singleton('database', () => new Database());
 * const db1 = container.make('database');
 * const db2 = container.make('database');
 * console.log(db1 === db2); // true
 * ```
 */
export class ServiceContainer {
  /**
   * Register a binding in the container.
   * 
   * @param key - The service identifier (must be non-empty string)
   * @param concrete - The service implementation or factory function
   * @param singleton - Whether to register as singleton (default: false)
   * 
   * @throws {Error} When key is empty or concrete is undefined
   * @throws {ServiceAlreadyBoundError} When service is already bound and override is false
   * 
   * @example Value Binding
   * ```typescript
   * container.bind('config', { apiUrl: 'https://api.example.com' });
   * ```
   * 
   * @example Factory Binding
   * ```typescript
   * container.bind('api', () => new ApiClient(config));
   * ```
   * 
   * @example Singleton Binding
   * ```typescript
   * container.bind('cache', () => new RedisCache(), true);
   * ```
   */
  bind<T>(key: string, concrete: T | Factory<T>, singleton = false): void {
    // Implementation...
  }
}
```

### 2. README Requirements

Each major component must have:
- Clear purpose description
- Installation instructions
- Basic usage examples
- API reference links
- Performance considerations
- Mobile-specific notes

## Testing Rules

### 1. Test Structure

```typescript
describe('ServiceContainer', () => {
  let container: ServiceContainer;
  
  beforeEach(() => {
    container = new ServiceContainer();
  });
  
  afterEach(() => {
    container.flush();
  });
  
  describe('Basic Binding and Resolution', () => {
    it('should bind and resolve simple values', () => {
      // Arrange
      const testValue = 'test-value';
      
      // Act
      container.bind('test', testValue);
      const resolved = container.make('test');
      
      // Assert
      expect(resolved).toBe(testValue);
      expect(container.bound('test')).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should throw ServiceNotFoundError for unbound services', () => {
      // Act & Assert
      expect(() => container.make('nonexistent'))
        .toThrow(ServiceNotFoundError);
      expect(() => container.make('nonexistent'))
        .toThrow('Service \'nonexistent\' not found in container');
    });
  });
});
```

### 2. Coverage Requirements

```typescript
// ✅ REQUIRED: Test all public methods
export class ServiceContainer {
  public bind() {} // ✅ Must have direct test
  public make() {} // ✅ Must have direct test
  public bound() {} // ✅ Must have direct test
  public flush() {} // ✅ Must have direct test
  
  private resolve() {} // ✅ Must be covered via public method tests
}

// ✅ REQUIRED: Test all branches
public make<T>(key: string): T {
  if (this.bound(key)) { // ✅ Test this branch
    return this.resolve(key);
  } else { // ✅ Test this branch  
    throw new ServiceNotFoundError(key);
  }
}

// ✅ REQUIRED: Test all error conditions
public bind(key: string, concrete: any): void {
  if (!key) { // ✅ Test this error case
    throw new Error('Key required');
  }
  if (concrete === undefined) { // ✅ Test this error case
    throw new Error('Concrete required');  
  }
  // ✅ Test successful binding
}
```

## Git and Version Control Rules

### 1. Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Examples:**
```
feat(core): add circular dependency detection to ServiceContainer

The ServiceContainer now detects circular dependencies during service
resolution and throws a CircularDependencyError with the full dependency
chain for debugging.

Closes #123
```

### 2. Branch Naming

```
feature/add-audio-system
bugfix/fix-memory-leak-in-renderer
hotfix/critical-touch-input-bug
docs/update-api-documentation
test/add-missing-coverage-for-facades
```

### 3. Pull Request Requirements

- [ ] All tests pass with 100% coverage
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint passes with no warnings
- [ ] All public APIs have JSDoc documentation
- [ ] Breaking changes are documented
- [ ] Performance impact is considered
- [ ] Mobile compatibility is verified

## Prohibited Patterns

### 1. Anti-Patterns

```typescript
// ❌ FORBIDDEN: Global state
window.gameInstance = new GameByte(); // Never do this

// ❌ FORBIDDEN: Mixing concerns
class AudioRenderer { // Audio and rendering should be separate
  playSound() {}
  renderSprite() {} // Wrong - mixing concerns
}

// ❌ FORBIDDEN: Hard dependencies
class GameScene {
  constructor() {
    this.audio = new AudioManager(); // Hard dependency - use DI instead
  }
}

// ✅ CORRECT: Dependency injection
class GameScene {
  constructor(private audio: AudioManager) {}
}
```

### 2. Performance Anti-Patterns

```typescript
// ❌ FORBIDDEN: Creating objects in render loops
function render() {
  const position = new Vector3(x, y, z); // Creates garbage
  sprite.position = position;
}

// ✅ CORRECT: Reuse objects
class Renderer {
  private tempVector = new Vector3();
  
  render() {
    this.tempVector.set(x, y, z); // Reuse existing object
    sprite.position = this.tempVector;
  }
}
```

### 3. Type Safety Anti-Patterns

```typescript
// ❌ FORBIDDEN: Loose typing
function process(data: any): any {
  return data.whatever();
}

// ❌ FORBIDDEN: Type assertions without checks
const service = container.make('service') as AudioService; // Unsafe

// ✅ CORRECT: Type guards
function isAudioService(service: unknown): service is AudioService {
  return service && typeof service === 'object' && 'play' in service;
}

const service = container.make('service');
if (isAudioService(service)) {
  service.play(); // Safe
}
```

## Enforcement

### Automated Checks

- **CI Pipeline**: All rules enforced in continuous integration
- **Pre-commit Hooks**: Test coverage and linting checks
- **Type Checking**: Strict TypeScript compilation
- **Code Coverage**: 100% coverage requirement enforced

### Manual Review

- **Architecture Review**: Laravel pattern compliance
- **Performance Review**: Mobile optimization verification  
- **Documentation Review**: JSDoc completeness check
- **Security Review**: Input validation and error handling

## Consequences

Violations of these rules will result in:

1. **Pull Request Rejection**: Non-compliant code will not be merged
2. **Required Fixes**: All issues must be addressed before approval
3. **Educational Feedback**: Explanation of correct patterns
4. **Documentation Updates**: Rules clarification if needed

---

These rules ensure the GameByte Framework maintains high quality, consistency, and performance standards. All contributors must follow these rules without exception.