---
id: index
title: API Reference
description: Complete API documentation for GameByte Framework
sidebar_position: 1
keywords: [api, reference, classes, methods]
llm_summary: "API Reference for GameByte. Core: createGame(), GameByte class. UI: UIButton, UIPanel, UIText, TopBar. Rendering: PixiRenderer, ThreeRenderer. Physics, Audio, Input systems."
---

<!-- llm-context: api-reference, classes, methods, typescript, complete-api -->

# API Reference

Complete API documentation for GameByte Framework.

## Core

### createGame()

Creates a new GameByte application instance.

```typescript
function createGame(config?: GameConfig): GameByte
```

**Parameters:**
- `config` (optional): Initial configuration options

**Returns:** GameByte instance

**Example:**
```typescript
const game = createGame({
    debug: true,
    renderer: { antialias: true }
});
```

### GameByte

Main application class.

```typescript
class GameByte {
    // Lifecycle
    async initialize(canvas: HTMLCanvasElement, mode: '2d' | '3d' | 'hybrid'): Promise<void>
    start(): void
    stop(): void
    pause(): void
    resume(): void

    // Service Container
    bind(key: string, factory: () => any): void
    singleton(key: string, factory: () => any): void
    make<T>(key: string): T
    instance(key: string, value: any): void

    // Providers
    register(provider: ServiceProvider): void

    // Configuration
    setConfig(config: Partial<GameConfig>): void
    getConfig(): GameConfig

    // Properties
    readonly version: string
}
```

## UI Components

### UIButton

```typescript
class UIButton extends BaseUIComponent {
    constructor(config: UIButtonConfig)
    setText(text: string): void
    getText(): string
    setEnabled(enabled: boolean): void
    setIcon(texture: PIXI.Texture | null): void
    on(event: 'click' | 'pointerdown' | 'pointerup', handler: Function): void
}
```

### UIPanel

```typescript
class UIPanel extends BaseUIComponent {
    constructor(config: UIPanelConfig)
    addChild(child: PIXI.DisplayObject): void
    removeChild(child: PIXI.DisplayObject): void
    setBackgroundColor(color: number): void
}
```

### UIText

```typescript
class UIText extends BaseUIComponent {
    constructor(config: UITextConfig)
    setText(text: string): void
    getText(): string
    setColor(color: number): void
    setFontSize(size: number): void
}
```

### TopBar

```typescript
class TopBar extends BaseUIComponent {
    constructor(config: TopBarConfig)
    updateItem(id: string, value: number, animate?: boolean): void
    getItemValue(id: string): number
    startTimer(id: string, options: TimerOptions): void
    stopTimer(id: string): void
}
```

### UIProgressBar

```typescript
class UIProgressBar extends BaseUIComponent {
    constructor(config: UIProgressBarConfig)
    setValue(value: number, animate?: boolean): void
    getValue(): number
    setMaxValue(max: number): void
    getPercentage(): number
    setColor(color: number): void
}
```

## Scenes

### BaseScene

```typescript
abstract class BaseScene {
    readonly id: string
    readonly name: string
    readonly container: PIXI.Container
    protected app: GameByte

    constructor(id: string, name: string)

    async initialize(): Promise<void>
    update(deltaTime: number): void
    pause(): void
    resume(): void
    destroy(): void
    onEnter(data?: any): void
    onExit(): void
}
```

### SceneManager

```typescript
class SceneManager {
    add(scene: BaseScene): void
    remove(id: string): void
    async switchTo(id: string, options?: TransitionOptions): Promise<void>
    getCurrentScene(): BaseScene | null
    getScene(id: string): BaseScene | null
    hasScene(id: string): boolean
    pause(): void
    resume(): void
}
```

## Facades

### Physics

```typescript
namespace Physics {
    function create2DWorld(config: PhysicsConfig): void
    function create3DWorld(config: Physics3DConfig): void
    function createBody(config: BodyConfig): Matter.Body
    function createStaticBody(config: BodyConfig): Matter.Body
    function setVelocity(body: Body, velocity: Vector): void
    function applyForce(body: Body, force: Vector): void
    function onCollision(labelA: string, labelB: string, callback: CollisionCallback): void
    function update(deltaTime: number): void
}
```

### Audio

```typescript
namespace Audio {
    function setMasterVolume(volume: number): void
    function setMusicVolume(volume: number): void
    function setSFXVolume(volume: number): void
    function mute(): void
    function unmute(): void
    function isLocked(): boolean
}

namespace Music {
    function play(key: string, options?: PlayOptions): void
    function pause(): void
    function resume(): void
    function stop(): void
    function crossFade(key: string, options?: FadeOptions): Promise<void>
}

namespace SFX {
    function play(key: string, options?: PlayOptions): void
    function playRandom(keys: string[]): void
}

namespace Spatial {
    function setListener(config: ListenerConfig): void
    function play(key: string, options: SpatialOptions): void
}
```

### Assets

```typescript
namespace Assets {
    function load(assets: AssetConfig | AssetConfig[]): Promise<void>
    function get<T>(key: string): T
    function has(key: string): boolean
    function unload(key: string): void
    function addBundle(name: string, assets: AssetConfig[]): void
    function loadBundle(name: string): Promise<void>
    function unloadBundle(name: string): void
    function on(event: 'progress' | 'complete' | 'error', handler: Function): void
}
```

## Types

```typescript
interface GameConfig {
    name?: string
    version?: string
    debug?: boolean | DebugConfig
    renderer?: RendererConfig
    mobile?: MobileConfig
    physics?: PhysicsConfig
    audio?: AudioConfig
}

interface TransitionOptions {
    type: 'none' | 'fade' | 'slide' | 'zoom'
    duration?: number
    direction?: 'left' | 'right' | 'up' | 'down'
    color?: number
    easing?: string
}
```
