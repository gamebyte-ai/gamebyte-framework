# Examples Refactoring Design

**Date:** 2025-01-18
**Status:** Approved
**Goal:** Refactor all examples to use GameByte framework properly instead of raw Pixi.js/Three.js

---

## Overview

All example games will be refactored to:
1. Use GameByte framework's simplified APIs (not raw Pixi.js/Three.js)
2. Use canvas-based UI (no HTML elements)
3. Include complete game flow: Splash → Loading → Menu → Game → GameOver
4. Demonstrate framework capabilities properly

---

## Screen Flow

### 1. Splash Screen
- **Content:** GameByte logo centered
- **Background:** Gradient (#1a1a2e → #0f0f23)
- **Duration:** 2 seconds (static, no animation)
- **Transition:** Auto-switch to Loading

### 2. Loading Screen
- **Content:** "Loading" text at bottom center
- **Background:** Same gradient as splash
- **Behavior:** Static (no animation, no percentage)
- **Transition:** Switch to Menu when assets loaded

### 3. Menu Screen
- **Content:** Game title, Play button, Settings button (optional)
- **Layout:** Centered vertical flex
- **Transition:** Play button → Game

### 4. Game Screen
- **Content:** Game-specific gameplay + HUD (TopBar)
- **HUD:** Score, lives/energy as needed
- **Transition:** Death/win → GameOver

### 5. GameOver Screen
- **Content:** "Game Over" text, final score, Retry button
- **Transition:** Retry → Game, Menu → Menu

---

## UI Components

### Existing Framework Components
- `Button` - Clickable buttons with hover/press states
- `Panel` - Container panels
- `Text` - Text display
- `TopBar` - Score, currency display
- `ProgressBar` - Health, energy bars

### pixi-layout Integration
```typescript
// New layout system addition to UIManager
createLayout(type: 'flex' | 'grid', config): Layout;

// Usage example
const menuLayout = ui.createLayout('flex', {
  direction: 'column',
  gap: 20,
  align: 'center'
});
```

---

## Example Games

### 1. Platformer (Existing - Refactor)
**Type:** 2D Physics Platformer
**Renderer:** 2D (Pixi.js via framework)

**Gameplay:**
- Character movement (A/D or arrows)
- Variable jump (Space, hold for higher)
- 3 platform levels
- Coin collection (score system)
- Simple enemy (touch = game over)

**Screens:** Splash → Loading → Menu → Game (TopBar: score) → GameOver

---

### 2. Merge Puzzle (Existing - Refactor)
**Type:** Mobile Merge Game
**Renderer:** 2D (Pixi.js via framework)

**Gameplay:**
- Grid-based drag-drop
- Merge same-tier items
- Tier progression (1 → 2 → 3 → ...)
- Score system

**Screens:** Splash → Loading → Menu → Game (TopBar: score + tier) → GameOver

---

### 3. Space Shooter (New)
**Type:** Top-down Shooter
**Renderer:** 2D (Pixi.js via framework)

**Gameplay:**
- Spaceship control (arrow keys)
- Shooting (Space)
- Enemy waves
- Power-ups

**Screens:** Splash → Loading → Menu → Game (TopBar: score + lives) → GameOver

---

### 4. 3D Runner (New)
**Type:** Endless Runner
**Renderer:** Hybrid (Three.js + Pixi.js UI)

**Gameplay:**
- Auto-forward movement
- Left/right dodge (A/D)
- Jump (Space)
- Obstacles and coins

**Screens:** Splash → Loading → Menu → Game (TopBar: score + distance) → GameOver

---

## Technical Structure

### File Structure (Per Example)
```
examples/
├── platformer/
│   ├── index.html          # Entry point
│   ├── game.js             # Main game code
│   ├── scenes/
│   │   ├── SplashScene.js
│   │   ├── LoadingScene.js
│   │   ├── MenuScene.js
│   │   ├── GameScene.js
│   │   └── GameOverScene.js
│   └── assets/
│       └── logo.svg
```

### Scene Management
```javascript
const game = createGame();
await game.initialize(canvas, '2d');

const sceneManager = game.make('scenes');

// Register scenes
sceneManager.register('splash', new SplashScene(game));
sceneManager.register('loading', new LoadingScene(game));
sceneManager.register('menu', new MenuScene(game));
sceneManager.register('game', new GameScene(game));
sceneManager.register('gameover', new GameOverScene(game));

// Start with splash
sceneManager.switchTo('splash');
game.start();
```

### Base Scene Class
```javascript
class BaseScene {
  constructor(game) {
    this.game = game;
    this.ui = game.make('ui');
    this.renderer = game.make('renderer');
    this.container = new PIXI.Container();
  }

  onEnter() {}   // Called when entering scene
  onExit() {}    // Called when leaving scene
  update(dt) {}  // Called every frame
}
```

---

## Implementation Plan

### Phase 1: Infrastructure
1. Create Splash/Loading scene templates
2. Implement BaseScene class
3. Test UI components (Button, Panel, TopBar)
4. Copy logo asset to examples

### Phase 2: Platformer (Reference Implementation)
1. Refactor existing code to scene structure
2. Implement Splash → Loading → Menu → Game → GameOver flow
3. Add TopBar with score system
4. Add coin collection mechanic
5. Test and validate

### Phase 3: Merge Puzzle
1. Convert to scene structure
2. Make UI canvas-based
3. Add score and tier display

### Phase 4: Space Shooter
1. Basic shooter mechanics
2. Enemy spawn system
3. Score and lives system

### Phase 5: 3D Runner (Hybrid)
1. Set up HybridRenderer for 3D scene
2. Pixi.js UI overlay
3. Endless runner mechanics

---

## Deliverables
- 4 fully working example games
- 100% framework usage (no raw Pixi.js/Three.js)
- All UI canvas-based (no HTML)
- Live demos on docs-site
