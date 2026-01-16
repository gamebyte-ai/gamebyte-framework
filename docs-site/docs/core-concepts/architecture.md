---
id: architecture
title: Architecture
description: Understanding GameByte's Laravel-inspired architecture
sidebar_position: 1
keywords: [architecture, service container, providers, facades, dependency injection]
llm_summary: "Laravel-inspired DI container. game.bind(key, factory) registers services. game.make(key) resolves them. Use singleton() for shared instances. Facades provide static access."
---

<!-- llm-context: architecture, service-container, dependency-injection, providers, facades, laravel-style -->

# Architecture

GameByte uses a Laravel-inspired architecture with a service container, service providers, and facades.

## Service Container

The service container manages all game services and their dependencies.

### Basic Usage

```typescript
import { createGame } from 'gamebyte-framework';

const game = createGame();

// Bind a service
game.bind('my.service', () => new MyService());

// Resolve a service
const service = game.make('my.service');
```

### Binding Types

#### Factory Binding

Creates a new instance each time:

```typescript
game.bind('player', () => new Player());

const player1 = game.make('player'); // New instance
const player2 = game.make('player'); // Different instance
```

#### Singleton Binding

Creates one shared instance:

```typescript
game.singleton('score.manager', () => new ScoreManager());

const manager1 = game.make('score.manager');
const manager2 = game.make('score.manager');
// manager1 === manager2 (same instance)
```

#### Instance Binding

Binds an existing instance:

```typescript
const config = { debug: true, fps: 60 };
game.instance('config', config);
```

### Dependency Resolution

The container automatically resolves nested dependencies:

```typescript
game.singleton('logger', () => new Logger());
game.singleton('api', (app) => {
    const logger = app.make('logger');
    return new ApiClient(logger);
});
```

## Service Providers

Service providers organize service registration and boot logic.

### Creating a Provider

```typescript
import { AbstractServiceProvider, GameByte } from 'gamebyte-framework';

export class ScoreServiceProvider extends AbstractServiceProvider {
    register(app: GameByte): void {
        // Register services
        app.singleton('score.manager', () => new ScoreManager());
        app.singleton('leaderboard', (app) => {
            return new Leaderboard(app.make('score.manager'));
        });
    }

    boot(app: GameByte): void {
        // Run after all providers are registered
        const scoreManager = app.make('score.manager');
        scoreManager.loadSavedScores();
    }
}
```

### Registering Providers

```typescript
const game = createGame();

// Register custom providers
game.register(new ScoreServiceProvider());
game.register(new AudioServiceProvider());

await game.initialize(canvas, '2d');
```

### Built-in Providers

GameByte includes these providers by default:

| Provider | Services |
|----------|----------|
| `RenderServiceProvider` | `renderer`, `graphics` |
| `SceneServiceProvider` | `scene.manager` |
| `InputServiceProvider` | `input`, `input.keyboard`, `input.touch` |
| `AudioServiceProvider` | `audio`, `audio.music`, `audio.sfx` |
| `PhysicsServiceProvider` | `physics` |
| `AssetServiceProvider` | `assets` |

## Facades

Facades provide static access to services for convenience.

### Using Facades

```typescript
import { Renderer, Scenes, Audio, Input } from 'gamebyte-framework';

// Instead of:
const renderer = game.make('renderer');
renderer.start();

// You can use:
Renderer.start();

// Other facades:
await Scenes.switchTo('game');
Audio.playMusic('background.mp3');
Input.on('click', handleClick);
```

### Available Facades

| Facade | Service Key | Description |
|--------|-------------|-------------|
| `Renderer` | `renderer` | Rendering control |
| `Scenes` | `scene.manager` | Scene management |
| `UI` | `ui` | UI component creation |
| `Audio` | `audio` | Audio playback |
| `Music` | `audio.music` | Music control |
| `SFX` | `audio.sfx` | Sound effects |
| `Input` | `input` | Input handling |
| `Physics` | `physics` | Physics engine |
| `Assets` | `assets` | Asset loading |

### Creating Custom Facades

```typescript
import { Facade } from 'gamebyte-framework';

class Score extends Facade {
    protected static getFacadeAccessor(): string {
        return 'score.manager';
    }
}

// Usage:
Score.add(100);
Score.getTotal();
```

## Container Events

Listen to container lifecycle events:

```typescript
game.on('binding', (key, resolver) => {
    console.log(`Service bound: ${key}`);
});

game.on('resolved', (key, instance) => {
    console.log(`Service resolved: ${key}`);
});
```

## Best Practices

### 1. Use Providers for Organization

```typescript
// Good: Organized in providers
class GameServicesProvider extends AbstractServiceProvider {
    register(app: GameByte): void {
        app.singleton('inventory', () => new Inventory());
        app.singleton('quests', () => new QuestManager());
        app.singleton('achievements', () => new Achievements());
    }
}

// Avoid: Scattered bindings
game.singleton('inventory', ...);
// ... elsewhere in code
game.singleton('quests', ...);
```

### 2. Use Singletons for Shared State

```typescript
// Good: Shared score state
game.singleton('score', () => new ScoreManager());

// Avoid: Multiple instances causing state issues
game.bind('score', () => new ScoreManager());
```

### 3. Type Your Service Keys

```typescript
// Define service types
interface ServiceMap {
    'score.manager': ScoreManager;
    'inventory': Inventory;
    'player': Player;
}

// Type-safe resolution
const score = game.make<ServiceMap['score.manager']>('score.manager');
```

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                        Your Game                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                      Facades                         │ │
│  │   Renderer  │  Scenes  │  Audio  │  Input  │  UI    │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Service Container (GameByte)            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │ │
│  │  │ renderer │ │  scenes  │ │  audio   │  ...       │ │
│  │  └──────────┘ └──────────┘ └──────────┘            │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Service Providers                       │ │
│  │  RenderProvider │ SceneProvider │ AudioProvider     │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```
