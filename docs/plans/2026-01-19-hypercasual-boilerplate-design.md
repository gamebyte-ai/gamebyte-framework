# Hyper-Casual Game Boilerplate Design

**Date:** 2026-01-19
**Status:** Draft
**Goal:** Create a ready-to-use boilerplate system for hyper-casual games with customizable screens, navigation, and panels.

---

## Overview

A complete screen and navigation system that provides:
- Hub-based navigation (Splash → Hub → Game → Result)
- Flexible top bar with configurable resources
- Dynamic bottom navigation with expandable tabs
- Multiple panel types (Modal, BottomSheet, FullScreen)
- Skinnable/customizable components

---

## Architecture

### Core Managers

```
GameApp
├── ScreenManager      → Stack-based screen navigation with transitions
├── PanelManager       → Overlay panel management (modal, sheet, fullscreen)
└── GameStateManager   → Resources, progress, settings persistence
```

### Screen Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        SCREEN FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│   │  Splash  │ ───► │   Hub    │ ───► │   Game   │        │
│   └──────────┘      └──────────┘      └──────────┘        │
│                           │                 │              │
│                           │                 ▼              │
│                           │           ┌──────────┐        │
│                           │           │  Result  │        │
│                           │           └──────────┘        │
│                           │                 │              │
│                           ◄─────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Hub Screen Structure

```
┌─────────────────────────────────────────┐
│              GameTopBar                 │
│  [💰 1,234] [💎 56] [⚡ 8/10]    [⚙️]  │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│            Content Area                 │
│     (changes based on active tab)       │
│                                         │
│         - ShopContent                   │
│         - PlayContent                   │
│         - EventsContent                 │
│                                         │
├─────────────────────────────────────────┤
│           GameBottomNav                 │
│    [🛒 Shop]  [▶️ Play]  [🎯 Events]   │
└─────────────────────────────────────────┘
```

---

## Component Interfaces

### TopBarResource

```typescript
interface TopBarResource {
  // Required
  id: string;
  icon: string | Texture;  // Emoji or asset texture

  // Display type (default: 'value')
  displayType?: 'value' | 'progress' | 'timer';

  // Value display
  value?: number | string;
  format?: (val: number) => string;  // e.g., "1.2K"

  // Progress display
  current?: number;
  max?: number;
  progressColor?: number;

  // Timer display
  endTime?: Date;
  timerFormat?: 'countdown' | 'clock';

  // Optional interactions
  onTap?: () => void;
  showAddButton?: boolean;
  onAddTap?: () => void;
}
```

### GameTopBar

```typescript
interface GameTopBarConfig {
  resources: TopBarResource[];
  showSettings?: boolean;  // Default: true
  onSettingsTap?: () => void;
  colorScheme?: TopBarColorScheme;
}
```

### GameBottomNav

```typescript
interface BottomNavTab {
  id: string;
  icon: string | Texture;
  label: string;
  badge?: number | string;  // Notification badge
}

interface GameBottomNavConfig {
  tabs: BottomNavTab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  colorScheme?: BottomNavColorScheme;
}
```

---

## Panel System

### Base Panel

```typescript
abstract class GamePanel extends EventEmitter {
  protected container: IContainer;
  protected overlay?: IGraphics;
  protected contentContainer: IContainer;

  abstract show(): Promise<void>;
  abstract hide(): Promise<void>;

  addContent(child: DisplayObject): void;
  removeContent(child: DisplayObject): void;
  clearContent(): void;

  setColorScheme(scheme: PanelColorScheme): void;
  destroy(): void;
}
```

### Panel Types

#### GameModalPanel
- Centered on screen
- Dark overlay behind
- Close button (optional)
- Scale-in/out animation

```typescript
interface GameModalPanelConfig {
  width?: number;
  height?: number;
  title?: string;
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;  // Tap outside to close
  colorScheme?: PanelColorScheme;
  onClose?: () => void;
}
```

#### GameBottomSheet
- Slides up from bottom
- Drag to close (swipe down)
- Handle bar at top
- Partial or full height

```typescript
interface GameBottomSheetConfig {
  height?: number | 'auto' | 'full';
  title?: string;
  showHandle?: boolean;  // Drag handle
  dragToClose?: boolean;
  colorScheme?: PanelColorScheme;
  onClose?: () => void;
}
```

#### GameFullScreenPanel
- Covers entire screen
- Slide or fade transition
- Back button or close

```typescript
interface GameFullScreenConfig {
  title?: string;
  showBackButton?: boolean;
  transition?: 'slide' | 'fade';
  colorScheme?: PanelColorScheme;
  onBack?: () => void;
}
```

---

## Game Screens

### GameScreen

```typescript
interface GameScreenConfig {
  showHUD?: boolean;
  hudConfig?: {
    showScore?: boolean;
    showPauseButton?: boolean;
    showLives?: boolean;
    livesMax?: number;
    customElements?: DisplayObject[];
  };
  onPause?: () => void;
  onResume?: () => void;
}
```

HUD Structure:
```
┌─────────────────────────────────────────┐
│  Score: 1,234          ❤️❤️❤️    [⏸️]  │
├─────────────────────────────────────────┤
│                                         │
│          Game Content Area              │
│      (inject your game here)            │
│                                         │
└─────────────────────────────────────────┘
```

### ResultScreen

```typescript
interface ResultScreenConfig {
  type: 'victory' | 'defeat';
  score?: number;
  bestScore?: number;
  stars?: number;  // 0-3
  rewards?: Array<{ icon: string | Texture; amount: number; label?: string }>;
  buttons?: Array<{
    text: string;
    style: 'primary' | 'secondary';
    action: () => void;
  }>;
  colorScheme?: ResultScreenColorScheme;
}
```

Result Screen Structure:
```
┌─────────────────────────────────────────┐
│                                         │
│            🏆 VICTORY! 🏆               │
│               ⭐⭐⭐                     │
│                                         │
├─────────────────────────────────────────┤
│         Score: 12,450                   │
│         Best:  15,230                   │
│                                         │
│  Rewards:                               │
│  [💰 +500]  [💎 +10]  [🎁 Chest]       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   [  🔄 Retry  ]  [  ▶️ Next Level  ]   │
│                                         │
│            [🏠 Home]                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Screen Manager

```typescript
class ScreenManager {
  private screenStack: BaseUIScreen[] = [];

  // Navigation
  push(screen: BaseUIScreen, transition?: TransitionType): Promise<void>;
  pop(transition?: TransitionType): Promise<void>;
  replace(screen: BaseUIScreen, transition?: TransitionType): Promise<void>;
  popToRoot(transition?: TransitionType): Promise<void>;

  // Current screen
  getCurrentScreen(): BaseUIScreen | null;
  getScreenCount(): number;

  // Transitions
  setDefaultTransition(transition: TransitionType): void;
}

type TransitionType = 'slide' | 'fade' | 'none';
```

---

## Panel Manager

```typescript
class PanelManager {
  private activePanels: GamePanel[] = [];

  // Show panels
  showModal(config: GameModalPanelConfig): GameModalPanel;
  showBottomSheet(config: GameBottomSheetConfig): GameBottomSheet;
  showFullScreen(config: GameFullScreenConfig): GameFullScreenPanel;

  // Management
  closeTop(): Promise<void>;
  closeAll(): Promise<void>;
  hasActivePanels(): boolean;
}
```

---

## Usage Example

```typescript
import {
  GameApp,
  HubScreen,
  GameScreen,
  ResultScreen,
  GameTopBar,
  GameBottomNav,
  GameModalPanel,
  GameBottomSheet
} from 'gamebyte-framework';

// Initialize app
const app = new GameApp({
  width: 720,
  height: 1280
});

// Configure hub screen
const hub = new HubScreen({
  topBar: {
    resources: [
      { id: 'coins', icon: '💰', value: 1234, onTap: () => app.panels.showBottomSheet({ ... }) },
      { id: 'gems', icon: '💎', value: 56, showAddButton: true, onAddTap: () => openShop() },
      { id: 'energy', icon: '⚡', displayType: 'progress', current: 8, max: 10 }
    ]
  },
  bottomNav: {
    tabs: [
      { id: 'shop', icon: '🛒', label: 'Shop' },
      { id: 'play', icon: '▶️', label: 'Play' },
      { id: 'events', icon: '🎯', label: 'Events', badge: 'NEW' }
    ],
    defaultTab: 'play'
  }
});

// Start game flow
app.screens.push(hub);

// When play button tapped
hub.on('startGame', () => {
  const game = new GameScreen({
    showHUD: true,
    hudConfig: { showScore: true, showPauseButton: true }
  });
  app.screens.push(game, 'slide');
});

// When game ends
game.on('gameOver', (result) => {
  const resultScreen = new ResultScreen({
    type: result.won ? 'victory' : 'defeat',
    score: result.score,
    stars: result.stars,
    rewards: result.rewards,
    buttons: [
      { text: 'Retry', style: 'secondary', action: () => app.screens.replace(new GameScreen(...)) },
      { text: 'Next Level', style: 'primary', action: () => loadNextLevel() }
    ]
  });
  app.screens.replace(resultScreen, 'fade');
});
```

---

## Implementation Plan

### Phase 1: Core Infrastructure
1. ScreenManager with stack navigation
2. PanelManager with overlay system
3. Base classes (BaseUIScreen, GamePanel)

### Phase 2: Navigation Components
4. GameTopBar with flexible resources
5. GameBottomNav with dynamic tabs
6. Transition animations

### Phase 3: Panel Types
7. GameModalPanel
8. GameBottomSheet (with drag gesture)
9. GameFullScreenPanel

### Phase 4: Game Screens
10. HubScreen with tab content
11. GameScreen with HUD
12. ResultScreen with rewards

### Phase 5: Polish & Examples
13. Color scheme presets
14. Example implementations
15. Documentation

---

## File Structure

```
src/ui/
├── app/
│   ├── GameApp.ts
│   ├── ScreenManager.ts
│   └── PanelManager.ts
├── screens/
│   ├── BaseUIScreen.ts (existing)
│   ├── SplashScreen.ts (existing)
│   ├── HubScreen.ts
│   ├── GameScreen.ts
│   └── ResultScreen.ts
├── navigation/
│   ├── GameTopBar.ts
│   └── GameBottomNav.ts
├── panels/
│   ├── GamePanel.ts (base)
│   ├── GameModalPanel.ts
│   ├── GameBottomSheet.ts
│   └── GameFullScreenPanel.ts
└── themes/
    └── GameBoilerplateThemes.ts
```
