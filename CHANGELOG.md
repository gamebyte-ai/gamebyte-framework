# Changelog

All notable changes to GameByte Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-02-06

### Overview

**Comprehensive Feature Expansion** — 10 new feature modules following the Laravel-inspired ServiceProvider + Facade + Contract pattern. Each module is tree-shakeable, mobile-optimized, and designed for AI-agent usage (1-3 lines of code to use any feature).

This release adds 50+ new files, 15,000+ lines of production code, 5 new facades, and 2,200+ lines of AI-agent API documentation.

---

### Added - Component-Level Render Loop (TickSystem)

Per-component render loop with priority ordering, replacing the scene-level-only `update()` pattern.

```typescript
import { Tick } from '@gamebyte/framework';

Tick.subscribe(({ delta }) => player.move(delta));
Tick.subscribe(updatePhysics, -10);   // high priority (runs first)
Tick.subscribe(updateParticles, 10);  // low priority (runs last)
Tick.runOnce(({ elapsed }) => console.log('Time:', elapsed));
```

**Key features:**
- Priority-ordered subscriber array with dirty-flag re-sorting
- EMA-based FPS calculation (O(1) per frame, zero allocations)
- `for` loop iteration (not `forEach`) for 15-30% faster hot path
- Pre-allocated `TickState` object mutated in-place (zero GC pressure)
- Delta clamped to 100ms max (prevents frame spikes on tab background)
- `document.hidden` visibility API pause/resume
- Fixed timestep option for deterministic physics (`fixedStep: 1/60`)

**New exports:** `TickSystem`, `TickServiceProvider`, `Tick` (facade)
**New types:** `ITickSystem`, `TickState`, `TickSubscriptionHandle`, `TickSubscribeOptions`
**Service key:** `tick`

---

### Added - Auto-Dispose / Resource Lifecycle Management (ResourceTracker)

Scoped resource lifecycle management with automatic disposal, preventing memory leaks for AI agents who may not call cleanup manually.

```typescript
import { Resources } from '@gamebyte/framework';

const scope = Resources.createScope('level-1');
const geo = scope.track(new THREE.BoxGeometry(1, 1, 1));
const mat = scope.track(new THREE.MeshStandardMaterial());
Resources.disposeScope('level-1'); // both auto-disposed
```

**Key features:**
- Hierarchical scopes (child scopes dispose before parent)
- Pre-registered disposers for THREE.BufferGeometry, THREE.Material, THREE.Texture, PIXI.* objects
- Duck-type fallback for `.dispose()` or `.destroy()` methods
- Reference counting for shared resources
- Deferred disposal via microtask batching (prevents mid-frame GPU stalls)
- Scene switch auto-disposes scene scope via `scene:deactivated` event

**New exports:** `ResourceTracker`, `ResourceScope`, `DisposableRegistry`, `ResourceServiceProvider`, `Resources` (facade)
**New types:** `IResourceTracker`, `IResourceScope`, `DisposerEntry`
**Service key:** `resources`

---

### Added - 3D Pointer Event System (RaycastEventSystem)

DOM-like click/hover/drag events on THREE.Object3D with bubble propagation, `stopPropagation()`, and touch-to-pointer translation.

```typescript
import { RaycastEventSystem } from '@gamebyte/framework/three-toolkit';

const events = new RaycastEventSystem();
events.setScene(scene, camera, canvas);
events.on(cube, 'click', (e) => console.log('Hit at', e.point));
events.on(cube, 'pointerenter', () => cube.scale.setScalar(1.1));
events.on(cube, 'pointerleave', () => cube.scale.setScalar(1.0));
```

**Supported events:** `click`, `dblclick`, `contextmenu`, `pointerdown`, `pointerup`, `pointermove`, `pointerenter`, `pointerleave`, `pointerover`, `pointerout`

**Key features:**
- Layer-based filtering via `THREE.Layers` (only interactive objects are tested)
- `firstHitOnly` optimization for click events (skip sorting all intersections)
- Pointer move throttling: 20Hz on mobile, 60Hz on desktop
- Reused event object pool (zero GC in hot path)
- Bubble propagation through parent chain with `stopPropagation()`
- Automatic touch-to-pointer translation
- Hover tracking with per-object enter/leave state
- Fires synthetic `pointerleave`/`pointerout` on `destroy()` for cleanup

**New exports (three-toolkit):** `RaycastEventSystem`
**New types:** `IRaycastEventSystem`, `PointerEvent3DType`, `PointerEvent3DData`, `PointerEvent3DHandler`

---

### Added - Adaptive Performance System (PerformanceAdvisor)

Reactive quality tier adjustment with hysteresis, thermal protection, and exponential upgrade backoff.

```typescript
import { PerformanceAdvisor } from '@gamebyte/framework';

const advisor = new PerformanceAdvisor();
advisor.enable({ targetFps: 55, downgradeThreshold: 45, upgradeThreshold: 58 });
advisor.onQualityChange((tier, dir) => console.log(tier.name, dir));
advisor.regress(); // manual quality drop during heavy interaction
```

**Default quality tiers:** `ultra-low` > `low` > `medium` > `high` > `ultra`

**Key features:**
- Separate up/down thresholds with dead zone (prevents oscillation)
- EMA-based FPS tracking (from TickSystem)
- Exponential backoff for upgrades (2s > 4s > 8s > 16s max)
- Thermal throttling detection (monitors FPS degradation over 30+ seconds)
- Per-tier settings: DPR, shadow map size, shadows enabled, post-processing, draw distance, particle multiplier, texture resolution, antialiasing, max lights
- Priority-ordered degradation: shadows > post-processing > DPR > draw distance
- Integrates with TickSystem for FPS sampling

**New exports:** `PerformanceAdvisor`, `QualityTierManager`
**New types:** `QualityTier`, `AdaptiveConfig`

---

### Added - GPU Instancing (InstanceManager)

Automatic GPU instancing that switches from regular meshes to `THREE.InstancedMesh` at 3+ copies.

```typescript
import { InstanceManager } from '@gamebyte/framework/three-toolkit';

const im = new InstanceManager(scene);
for (let i = 0; i < 100; i++) {
  const tree = im.createInstance('tree', treeModel);
  tree.setPosition(Math.random() * 100, 0, Math.random() * 100);
}
// Auto-switches to InstancedMesh at 3+ copies
```

**Key features:**
- Below threshold (< 3): regular `THREE.Mesh` clone
- At/above threshold: `THREE.InstancedMesh` with capacity = count * 1.5
- Per-instance transforms via `setMatrixAt()` with reused Matrix4
- Per-instance colors via `InstancedBufferAttribute`
- O(1) removal (swap-with-last pattern)
- Batch matrix updates with dirty flags
- Material sharing (one material per unique key)

**New exports (three-toolkit):** `InstanceManager`
**New types:** `IInstanceManager`, `IInstanceHandle`

---

### Added - Post-Processing Pipeline

Effect merging pipeline using `pmndrs/postprocessing` (NOT Three.js EffectComposer) for ~80% fewer render operations.

```typescript
import { PostProcessing } from '@gamebyte/framework';

PostProcessing.add('bloom', { intensity: 0.5, threshold: 0.8 });
PostProcessing.add('vignette', { darkness: 0.3 });
PostProcessing.add('fxaa');
PostProcessing.get('bloom')?.setParams({ intensity: 1.0 });
```

**Built-in effects (with priority order):**
- SSAO (5), Bloom (10), DOF (20), ChromaticAberration (40), Vignette (50), ToneMapping (90), FXAA (100)

**Key features:**
- Automatic effect merging: compatible effects compiled into single shader pass
- Half-resolution for expensive effects (Bloom, SSAO at 50% resolution)
- Lazy effect compilation (shaders compiled on first enable, not on add)
- PerformanceAdvisor integration (auto-disable on low quality tiers)
- Mobile tier presets: `mobile-low` (FXAA only) through `desktop` (full pipeline)
- Custom effects via `registerEffect(name, factory)`

**New exports:** `PostProcessingPipeline`, `PostProcessingServiceProvider`, `PostProcessing` (facade)
**New types:** `IPostProcessingPipeline`, `IPostProcessingEffect`
**Service key:** `postprocessing`

---

### Added - Environment & Skybox System

Complete 3D environment management with presets, smooth transitions, HDRI loading, and fog control.

```typescript
import { Environment } from '@gamebyte/framework';

Environment.preset('sunset');
await Environment.transitionTo('night', 5.0); // 5s smooth lerp
await Environment.setHDRI('/hdris/studio.hdr');
Environment.setFog({ color: '#aaccee', near: 10, far: 100, type: 'linear' });
```

**Built-in presets:** `day`, `sunset`, `night`, `overcast`

**Key features:**
- Manages DirectionalLight (sun), HemisphereLight (ambient), Fog
- `transitionTo()` uses TickSystem to lerp colors/positions over duration
- Bakes sky to static cubemap after transition completes (0ms/frame when static)
- Resolution tiers per device: 128px (mobile) to 1024px (ultra)
- Procedural sky via Three.js Sky shader with simplified mobile variant

**New exports:** `EnvironmentSystem`, `EnvironmentServiceProvider`, `Environment` (facade)
**New types:** `IEnvironmentSystem`, `EnvironmentConfig`
**Service key:** `environment` (deferred)

---

### Added - Prefab / Entity Component System

JSON-driven prefabs with template inheritance, ECS-lite components, tag-based queries, and state serialization.

```typescript
import { Prefabs } from '@gamebyte/framework';

Prefabs.register({
  id: 'enemy', name: 'Enemy',
  visual: { type: 'model', url: '/models/enemy.glb' },
  tags: ['npc']
});
const enemy = await Prefabs.spawn('enemy', { position: [0, 0, 5] });
enemy.addComponent('health', { current: 100, max: 100 });
const npcs = Prefabs.getEntitiesByTag('npc');
```

**Key features:**
- `extends` field for template inheritance (deep-merge parent > child)
- Components are plain objects with lifecycle hooks (`onAttach`, `onDetach`, `onUpdate`, `onDestroy`)
- Tag-based queries via `Map<string, Set<Entity>>` (O(1) lookups)
- Entity pooling with free-list for spawn/despawn without GC
- Async spawn with microtask batching (prevents frame drops at 50+ entities)
- `serialize()`/`deserialize()` for save/load
- TickSystem integration for components with `onUpdate`

**New exports:** `PrefabSystem`, `PrefabServiceProvider`, `Prefabs` (facade)
**New types:** `IPrefabSystem`, `IEntity`, `PrefabConfig`, `PrimitiveConfig`, `ComponentLifecycle`
**Service key:** `prefabs` (deferred)

---

### Added - Smart Asset Pipeline

Priority-based asset loading with memory budgets, LRU eviction, format fallback, and abort-on-scene-switch.

```typescript
import { SmartAssetPipeline } from '@gamebyte/framework';

const pipeline = new SmartAssetPipeline();
pipeline.registerManifest({
  scenes: { level1: ['player', 'bg', 'music'] },
  assets: {
    player: { url: '/textures/player.png', type: 'texture', priority: 'critical' },
    bg: { url: '/textures/bg.png', type: 'texture', priority: 'normal' },
    music: { url: '/audio/bgm.mp3', type: 'audio', priority: 'low' }
  }
});
pipeline.on('progress', (p) => loadingBar.setProgress(p));
await pipeline.loadScene('level1');
pipeline.setMemoryBudget(256); // 256MB max, LRU eviction
```

**Key features:**
- Priority queue: critical assets load first
- Adaptive concurrency: 2-4 on mobile, 4-8 on desktop (adjusts for network speed)
- Memory budgeting with LRU eviction (access frequency weighting)
- Format fallback: WebP > PNG, KTX2 > standard (feature detection)
- AbortController: cancels pending loads on scene switch
- Progress events per-asset and overall
- Error resilience: continues loading if individual assets fail

**New exports:** `SmartAssetPipeline`, `AssetPipelineServiceProvider`
**New types:** `IAssetPipeline`, `AssetManifest`
**Service key:** `asset.pipeline` (deferred)

---

### Added - Procedural Audio Presets (GameSoundPresets)

15 built-in procedural game sounds with zero audio file dependencies.

```typescript
import { GameSoundPresets } from '@gamebyte/framework';

const sounds = new GameSoundPresets();
sounds.play('explosion');
sounds.play('coin', { volume: 0.5, pitch: 1.2, variation: 0.3 });
```

**Built-in sound types (15):**
`hit`, `pickup`, `explosion`, `laser`, `powerUp`, `death`, `click`, `jump`, `land`, `coin`, `error`, `success`, `whoosh`, `thrust`, `nearMiss`

**Key features:**
- Fully procedural via Web Audio API oscillators + gain envelopes
- Lazy AudioContext initialization (browser autoplay policy)
- `variation` parameter adds random pitch/timing shifts for natural feel
- AudioNode pooling (max 8 concurrent sounds, 4 on mobile)
- Custom sounds via `register(name, generator)`

**New exports:** `GameSoundPresets`
**New types:** `GameSoundType`, `GameSoundConfig`

---

### Added - New Facades

Five new static facades following the Laravel pattern:

| Facade | Service Key | Module |
|--------|-------------|--------|
| `Tick` | `tick` | Component-level render loop |
| `Resources` | `resources` | Resource lifecycle management |
| `PostProcessing` | `postprocessing` | Post-processing pipeline |
| `Environment` | `environment` | 3D environment system |
| `Prefabs` | `prefabs` | Prefab/entity system |

All facades are auto-initialized via `initializeFacades(app)` and available on the default `GameByteFramework` export.

---

### Added - Three.js Toolkit Expansion

New modules available via `@gamebyte/framework/three-toolkit` sub-path:

- `RaycastEventSystem` — DOM-like 3D pointer events
- `InstanceManager` — Automatic GPU instancing
- `AnimationController` — GLB/GLTF animation management with crossfade support
- Full light system: `AmbientLight`, `DirectionalLight`, `HemisphereLight`, `PointLight`, `SpotLight`
- `LightHelper` — Debug visualization for all light types
- `ModelLoader` — GLB/GLTF loading with caching and progress events
- `TextureLoader3D` — Enhanced texture loading with cubemap support

---

### Added - Comprehensive AI-Agent Documentation

- `llms-full.txt` expanded from ~1,200 to **2,200+ lines** with complete API reference
- 35 new documentation sections covering all UI components, visual effects, Three.js toolkit, utilities, and factory functions
- Every exported class/function includes copy-pasteable code examples
- `llms.txt` updated with all new module entries and service keys

---

### Changed

**`resizeToContainer` behavior (QuickGameConfig):**
- Now automatically enables responsive mode via `ResponsiveScaleCalculator` with container-based `ResizeObserver`
- Uses `config.width`/`config.height` as base design dimensions for scale calculation
- Old behavior: directly mutated `canvas.width`/`canvas.height` via `ResizeObserver`
- New behavior: passes responsive config to renderer, which handles both resize and scale calculation
- **Migration:** No code changes needed for basic usage. If you were listening to the `resize` event, it still fires. If you were accessing `canvas.width`/`canvas.height` directly after resize, they are still updated but now via the responsive system.

**New `responsive` option (QuickGameConfig):**
- `responsive: true` — Window-based responsive with config.width/height as base dimensions
- `responsive: { baseWidth, baseHeight, minScale, maxScale }` — Custom responsive config
- When combined with `resizeToContainer`, container is tracked automatically

**`ResponsiveScaleCalculator`:**
- New `container` option in `ResponsiveConfig` for container-based tracking
- Uses `ResizeObserver` on container instead of `window.addEventListener('resize')`
- `destroy()` now properly cleans up `ResizeObserver` and window event listeners

**`ModelLoader.cloneModel()` (internal):**
- Now deep-clones materials so each cached model clone is independent
- Previously clones shared materials (mutation of one affected all clones)
- This is a correctness fix, not a breaking change

**`ModelLoader.disposeModel()`:**
- Changed from `private` to `public` — users can now manually dispose cloned models
- Added comprehensive JSDoc with usage example

**`DirectionalLight.setShadowMapSize()`:**
- Now sets `shadow.needsUpdate = true` after disposing shadow map
- Guards against null shadow map before disposing

**Filter/Mask/Gradient interfaces (IFilter, IMask, IFillGradient):**
- Added `destroy()` method documentation with GPU memory leak warnings
- No API change, just improved JSDoc

**Filter fallback warnings:**
- `DropShadowFilter`, `GlowFilter`, `OutlineFilter` fallback warnings now include install instructions (`npm install pixi-filters`)

---

### Fixed

- **TypeScript 5.7+:** `ArrayBuffer`/`Float32Array` type mismatches in `AssetBundle.ts`, `GameByteAudioBus.ts`, `GameByteAudioEffectsProcessor.ts`, `TextureLoader.ts`
- **GameTopBar:** Settings button overflowing off-screen
- **CI/CD:** `@rollup/rollup-linux-arm64-gnu` removed from devDependencies (was breaking CI on non-ARM)
- **CI/CD:** Switched to `npm install` instead of `npm ci` for platform-specific dependency handling
- **CI/CD:** Added `continue-on-error` for Snyk and Dependency Review (non-blocking security checks)
- **Deploy docs:** Fixed `npm ci` issue in deploy-docs workflow

---

### Breaking Changes

> **Severity: Low** — Most users will not need to change any code.

#### 1. `resizeToContainer` now integrates with Responsive Mode

**What changed:** `createGame({ resizeToContainer: true })` previously attached a raw `ResizeObserver` that directly set `canvas.width`/`canvas.height`. It now delegates to `ResponsiveScaleCalculator` which provides both resize and scale factor calculation.

**Who is affected:** Only users who were relying on the exact internal resize mechanism (e.g., patching `ResizeObserver` behavior or expecting `canvas.width` to be set synchronously in the same microtask as the resize event).

**Migration:**
```typescript
// Before (v1.2.x) - still works in v1.3.0, no change needed:
const game = createGame({ resizeToContainer: true, width: 720, height: 1280 });

// New in v1.3.0 - optional responsive config:
const game = createGame({
  resizeToContainer: true,
  responsive: { baseWidth: 720, baseHeight: 1280, minScale: 0.5, maxScale: 2.0 },
  width: 720,
  height: 1280
});
```

#### 2. Model clones are now independent (material deep-clone)

**What changed:** `ModelLoader` now deep-clones materials when returning cached models. Previously, clones shared material references, so modifying one clone's material color would affect all clones.

**Who is affected:** Users who intentionally relied on shared materials across `ModelLoader` cached clones for synchronized material updates. This is unlikely but technically possible.

**Migration:** If you need shared materials, access the material directly after loading:
```typescript
const model = await loader.load('/model.glb');
// Materials are now independent per clone — modify freely
model.scene.traverse(child => {
  if (child instanceof THREE.Mesh) child.material.color.set(0xff0000);
});
```

---

### New Service Providers

| Provider | Service Key | Auto-Registered |
|----------|-------------|-----------------|
| `TickServiceProvider` | `tick` | Yes (via `createGame`) |
| `ResourceServiceProvider` | `resources` | Yes |
| `PostProcessingServiceProvider` | `postprocessing` | Yes |
| `EnvironmentServiceProvider` | `environment` | Yes (deferred) |
| `PrefabServiceProvider` | `prefabs` | Yes (deferred) |
| `AssetPipelineServiceProvider` | `asset.pipeline` | Yes (deferred) |

*Deferred providers only instantiate their service on first `app.make()` call.*

---

### New Contracts

| Contract File | Interfaces |
|---------------|------------|
| `src/contracts/Tick.ts` | `ITickSystem`, `TickState`, `TickSubscriptionHandle`, `TickSubscribeOptions` |
| `src/contracts/Resources.ts` | `IResourceTracker`, `IResourceScope`, `DisposerEntry` |
| `src/contracts/PointerEvents3D.ts` | `IRaycastEventSystem`, `PointerEvent3DType`, `PointerEvent3DData`, `PointerEvent3DHandler` |
| `src/contracts/Performance.ts` | `QualityTier`, `AdaptiveConfig` (added to existing) |
| `src/contracts/Instancing.ts` | `IInstanceManager`, `IInstanceHandle` |
| `src/contracts/PostProcessing.ts` | `IPostProcessingPipeline`, `IPostProcessingEffect` |
| `src/contracts/Environment.ts` | `IEnvironmentSystem`, `EnvironmentConfig` |
| `src/contracts/Prefab.ts` | `IPrefabSystem`, `IEntity`, `PrefabConfig`, `PrimitiveConfig`, `ComponentLifecycle` |
| `src/contracts/AssetPipeline.ts` | `IAssetPipeline`, `AssetManifest` |
| `src/contracts/Audio.ts` | `GameSoundType`, `GameSoundConfig` (added to existing) |
| `src/contracts/Graphics.ts` | Added `destroy()` JSDoc to `IFilter`, `IMask`, `IFillGradient` |

---

### Performance Budgets

| Feature | Mobile | Desktop |
|---------|--------|---------|
| TickSystem | < 0.1ms/frame | < 0.05ms/frame |
| ResourceTracker | < 0.01ms/frame | Same |
| RaycastEvents | < 1ms/frame (20Hz) | < 0.5ms/frame (60Hz) |
| PerformanceAdvisor | < 0.05ms/frame | Same |
| InstanceManager | < 0.5ms/frame | < 0.3ms/frame |
| PostProcessing | 1-2 passes max | Up to 5 passes |
| Environment | 0ms/frame (static cubemap) | Sky shader optional |
| PrefabSystem | Pooled spawn < 1ms | Same |
| AssetPipeline | 2-4 concurrent loads | 4-8 concurrent loads |
| AudioPresets | 4 concurrent sounds | 8 concurrent sounds |

---

## [1.2.1] - 2026-02-06

### Fixed
- CI/CD release workflow permissions and npm publish
- Platform-specific rollup dependency breaking CI
- Deprecated API calls in demos

### Added
- Comprehensive Pixi.js v8 and Three.js feature support
- 6 diverse game demos with different mechanics
- LiveDemo iframes in documentation pages
- A* Pathfinder for grid-based navigation
- CameraController component

---

## [1.2.0] - 2026-01-30

### Added - @pixi/ui Integration

Complete integration of [@pixi/ui](https://github.com/pixijs/ui) library with game-style wrappers that maintain the framework's "jellybean" visual style.

**New UI Components:**
- `GameCheckBox` - Checkbox with jellybean styling, checkmark animation, touch-friendly (32px min)
- `GameRadioGroup` - Radio button group with circular buttons, dot indicator, horizontal/vertical layout
- `GameList` - Layout wrapper around @pixi/ui List for automatic child arrangement
- `GameInput` - Text input wrapping @pixi/ui Input with custom focus states and styled background
- `GameScrollBox` - Scrollable container wrapping @pixi/ui ScrollBox with styled frame
- `GameSelect` - Dropdown select with jellybean trigger button, dropdown panel, and click-outside-to-close

**New Color Schemes (GameStyleUITheme):**
- `GAME_INPUT` - Input field colors (background, focus, border, text, placeholder)
- `GAME_SCROLLBOX` - Scrollbox colors (background, border, scrollbar track/thumb)
- `GAME_SELECT` - Select dropdown colors (trigger, dropdown, items)
- `GAME_CHECKBOX` - Checkbox colors (box, checkmark, states)
- `GAME_RADIO` - Radio button colors (circle, dot, states)
- `GAME_LIST` - List container colors

**New Exports:**
- All new components exported directly from `gamebyte-framework`
- `PixiUI` namespace re-export for advanced users needing raw @pixi/ui access
- Type exports for all config interfaces and color schemes

**Demo:**
- `docs-site/static/demos/pixi-ui-components-demo.html` - Interactive demo showcasing all new components

### Added - GameStyleButton Enhancements

- `horizontalPadding` config option (default: 12px) for safe text padding from button edges
- Auto text scaling - text automatically scales down if it exceeds available button width
- Prevents text overflow on buttons with long labels or icons

### Fixed

**GameSelect:**
- Dropdown z-index issue - dropdown now brought to front when opened via `bringToFront()` method
- Click-outside-to-close - implemented invisible backdrop approach for reliable dropdown closing

**GameStyleButton:**
- Unified text styling across all button color schemes (yellow, green, blue, red, purple)
- All buttons now use identical drop shadow and stroke styling
- Removed `isLightColor` conditional logic - simpler, more predictable rendering

### Changed

**Pixi.js v8 Compatibility:**
- `ThreeGraphicsFactory` updated to handle Pixi v8 `dropShadow` object format
- Text style uses `stroke: { color, width }` object format (v8 standard)
- Removed deprecated v7-style text properties

### Dependencies

- Added `@pixi/ui: ^2.3.2` to dependencies and peerDependencies

---

## [1.1.0] - 2026-01-15

### Added - AI-Agent-Friendly Framework

**Tier 1: Core Knowledge**
- `docs/agent-guide/CORE_API.md` - Essential API guide (~2000 tokens)
- `docs/agent-guide/QUICK_REFERENCE.md` - Command cheatsheet
- Minimal context for rapid prototyping

**Tier 2: Discoverable Documentation**
- `docs/guides/` - 9+ advanced guides with semantic keywords
- Keyword-enriched markdown for grep/semantic search
- Physics, UI, Audio guides reorganized with discovery tags

**Tier 3: Working Examples**
- `examples/platformer/` - Physics-based platformer
- `examples/ui-showcase/` - UI component demonstration
- Self-contained HTML examples with inline code

**Developer Experience**
- Enhanced JSDoc examples in core classes
- README updated with "For AI Agents" section
- `npm run validate:agent-docs` validation script
- `docs/agent-guide/INTEGRATION.md` for RAG/LLM integration

---

## [Unreleased]

### Added
- Initial framework architecture with Laravel-inspired patterns
- Service Container with dependency injection and IoC
- Service Provider system for modular service registration
- Facade pattern for static access to services
- Comprehensive scene management with lifecycle hooks
- Modular rendering system supporting both 2D (Pixi.js) and 3D (Three.js)
- Plugin system with npm-style architecture
- Performance monitoring and optimization features
- Mobile-first design with adaptive quality scaling
- Complete TypeScript support with strict typing
- Interactive demo showcasing framework capabilities
- Comprehensive test suite with 100% coverage goals

### Technical Features
- Unified API abstraction hiding underlying technology details
- Tree-shakeable modular bundles for optimal performance
- Clean separation between 2D and 3D rendering paths
- Enterprise-ready architecture patterns
- Cross-platform compatibility (web, mobile, desktop)

### Documentation
- Complete README with usage examples
- API documentation and guides
- Contributing guidelines and code standards
- Release procedures and versioning workflow
- Interactive demo with live examples
- Conceptual GameByte V2 docs: API reference, Tetris quickstart, and extensibility guide

## [0.1.0] - 2025-01-XX (Initial Release)

### Added
- Core framework foundation
- Basic rendering capabilities
- Initial scene management
- Service container implementation
- TypeScript configuration and build system

---

**Note**: This is the initial development phase. The framework is not yet ready for production use. We recommend waiting for the 1.0.0 stable release for production applications.