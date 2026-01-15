# GameByte Quick Reference

Command cheatsheet for rapid development.

<!-- keywords: reference, cheatsheet, commands, quick, api -->

---

## Initialization

| Command | Purpose |
|---------|---------|
| `createGame()` | Full game with all systems |
| `createMobileGame()` | Mobile-optimized variant |
| `game.initialize(canvas, '2d')` | Initialize 2D renderer |
| `game.initialize(canvas, '3d')` | Initialize 3D renderer |
| `game.start()` | Start game loop |
| `game.stop()` | Stop game loop |

---

## Service Access

| Service | Key | Quick Access |
|---------|-----|--------------|
| Renderer | `'renderer'` | `game.make('renderer')` |
| Scenes | `'scene.manager'` | `game.make('scene.manager')` |
| UI | `'ui.manager'` | `game.make('ui.manager')` |
| Assets | `'assets'` | `game.make('assets')` |
| Audio | `'audio'` | `game.make('audio')` |
| Input | `'input'` | `game.make('input')` |
| Physics | `'physics'` | `game.make('physics')` |
| Performance | `'performance'` | `game.make('performance')` |

---

## Common Operations

### Scene Management

```typescript
sceneManager.register('game', new GameScene());
await sceneManager.load('game');
await sceneManager.transition('menu', { duration: 500 });
```

### Asset Loading

```typescript
await assetManager.load({ id: 'sprite', url: './sprite.png', type: 'texture' });
const assets = await assetManager.loadBatch([{ id, url, type }, ...]);
const asset = assetManager.get('sprite');
```

### UI Creation

```typescript
const button = new UIButton({ text: 'Play', width: 200, height: 60 });
const menu = new ArcheroMenu({ sections: [...], activeSection: 0 });
```

### Audio Playback

```typescript
await audioManager.playMusic('bgm', { loop: true, volume: 0.5 });
await audioManager.playSFX('jump', { volume: 0.8 });
audioManager.pauseMusic();
audioManager.resumeMusic();
```

### Input Handling

```typescript
inputManager.on('pointerdown', (event) => { /* ... */ });
inputManager.on('keydown', (event) => { /* ... */ });
inputManager.on('swipe', (direction) => { /* ... */ });
```

---

## Pre-built Components

| Component | Import | Lines Saved |
|-----------|--------|-------------|
| `ArcheroMenu` | `gamebyte-framework` | ~670 |
| `UIButton` | `gamebyte-framework` | ~120 |
| `UIPanel` | `gamebyte-framework` | ~80 |
| `UIProgressBar` | `gamebyte-framework` | ~100 |
| `SplashScreen` | `gamebyte-framework` | ~150 |

---

## Default Values

| Setting | Default | Override |
|---------|---------|----------|
| Resolution | `devicePixelRatio` | `{ resolution: 2 }` |
| Antialias | Auto-detected | `{ antialias: true }` |
| Background | `0x000000` | `{ backgroundColor: 0x1a1a2e }` |
| Touch target | 44x44px | `{ width: 60, height: 60 }` |
| Asset timeout | 30s | `{ timeout: 60000 }` |
| Audio volume | 1.0 | `{ volume: 0.5 }` |

---

## File Paths

| Type | Path | Purpose |
|------|------|---------|
| Core API | `docs/agent-guide/CORE_API.md` | Load first |
| Quick Ref | `docs/agent-guide/QUICK_REFERENCE.md` | Command cheatsheet |
| Examples | `docs/examples/*.md` | Component examples |
| Architecture | `docs/architecture/*.md` | System design |
| Components | `docs/components/*.md` | Component docs |
| UI | `docs/ui/*.md` | UI system docs |
| Demos | Root `demo-*.html` | Full games |

---

## Grep Patterns

Search docs efficiently:

```bash
# Find physics-related docs
grep -r "physics" docs/

# Find collision examples
grep -r "collision" docs/

# Find UI component documentation
grep -r "UIButton\|UIPanel\|ArcheroMenu" docs/

# Find mobile optimization docs
grep -r "mobile.*optimi\|createMobileGame" docs/
```

---

*Estimated reading: 2 minutes*
