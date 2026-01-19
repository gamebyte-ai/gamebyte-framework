# Game Boilerplate

The GameByte Framework provides a complete boilerplate system for building hyper-casual and mobile games quickly. This includes pre-built screens, panels, and navigation systems that follow proven mobile game patterns.

## Architecture

```
┌─────────────────────────────────────────┐
│              ScreenManager              │
│  (Stack-based navigation + transitions) │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │HubScreen│→ │GameHUD  │→ │Result   │ │
│  │         │  │Screen   │  │Screen   │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
├─────────────────────────────────────────┤
│              PanelManager               │
│    (Modal, BottomSheet, Fullscreen)     │
└─────────────────────────────────────────┘
```

## Quick Start

```typescript
import {
  ScreenManager,
  PanelManager,
  HubScreen,
  GameHUDScreen,
  ResultScreen,
  GameModalPanel,
  GameBottomSheet,
} from '@gamebyte/framework';

// Create managers
const screenManager = new ScreenManager({
  container: stage,
  width: 720,
  height: 1280,
  defaultTransition: 'slide',
});

const panelManager = new PanelManager({
  container: stage,
  screenWidth: 720,
  screenHeight: 1280,
});

// Create and show hub screen
const hub = new HubScreen({
  topBarResources: [
    { type: 'coins', value: 1000, showAddButton: true },
    { type: 'gems', value: 50 },
  ],
  bottomNavItems: [
    { id: 'shop', type: 'shop', label: 'Shop' },
    { id: 'play', type: 'play', label: 'Play', highlighted: true },
    { id: 'profile', type: 'profile', label: 'Profile' },
  ],
});

screenManager.push(hub);
```

## Components

### Screen Management

- **[ScreenManager](./screen-manager)** - Stack-based navigation with animated transitions
- **[SimpleScreen](./simple-screen)** - Lightweight base class for game screens

### Pre-built Screens

- **[HubScreen](./screens#hubscreen)** - Main menu with TopBar, BottomNav, and tabs
- **[GameHUDScreen](./screens#gamehudscreen)** - In-game HUD with score, timer, lives
- **[ResultScreen](./screens#resultscreen)** - Victory/defeat display with rewards

### Panel System

- **[PanelManager](./panels#panelmanager)** - Overlay panel management
- **[GameModalPanel](./panels#gamemodalpanel)** - Centered modal with scale animation
- **[GameBottomSheet](./panels#gamebottomsheet)** - Slide-up panel with drag-to-close

## Typical Game Flow

```typescript
// 1. Start at Hub
screenManager.push(hubScreen);

// 2. User taps Play → Push Game Screen
screenManager.push(gameScreen, 'slide');

// 3. Game ends → Replace with Result
screenManager.replace(resultScreen, 'fade');

// 4. User taps Home → Pop to Hub
screenManager.popToRoot();

// Show settings panel anytime
panelManager.show(new GameModalPanel({ title: 'Settings' }));
```
