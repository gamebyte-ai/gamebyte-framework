# Pre-built Screens

GameByte provides ready-to-use screens for common mobile game patterns.

## HubScreen

Main menu/hub screen with top bar, bottom navigation, and tab-based content.

```typescript
import { HubScreen } from '@gamebyte/framework';

const hub = new HubScreen({
  // Top bar resources
  topBarResources: [
    { type: 'coins', value: 1234, showAddButton: true },
    { type: 'gems', value: 50 },
    { type: 'energy', value: 5, max: 10 },
  ],

  // Settings button
  showSettings: true,
  onSettingsClick: () => panelManager.show(settingsPanel),

  // Bottom navigation
  bottomNavItems: [
    { id: 'shop', type: 'shop', label: 'Shop' },
    { id: 'play', type: 'play', label: 'Play', highlighted: true },
    { id: 'events', type: 'events', label: 'Events' },
  ],
  defaultTab: 'play',

  backgroundColor: 0x1a1a2e,
});

// Register tab content
hub.registerTabContent('shop', () => createShopContent());
hub.registerTabContent('play', () => createPlayContent());
hub.registerTabContent('events', () => createEventsContent());

screenManager.push(hub);
```

### HubScreen Methods

```typescript
// Switch tabs programmatically
hub.switchTab('shop');

// Get current tab
const tabId = hub.getCurrentTab();

// Update resources
hub.updateResource('coins', 2000);
hub.updateResource('gems', 100);

// Access content area
const contentArea = hub.getContentArea();
const { width, height } = hub.getContentAreaSize();
```

### HubScreen Events

```typescript
hub.on('tab-changed', (tabId) => {
  console.log('Switched to tab:', tabId);
});
```

---

## GameHUDScreen

In-game screen with HUD overlay showing score, timer, lives, and pause functionality.

```typescript
import { GameHUDScreen } from '@gamebyte/framework';

const gameScreen = new GameHUDScreen({
  hudConfig: {
    showScore: true,
    showTimer: true,
    showPauseButton: true,
    showLives: true,
    livesMax: 3,
    showProgress: true,
    progressMax: 100,
  },
  backgroundColor: 0x87CEEB,
  onPause: () => console.log('Game paused'),
  onResume: () => console.log('Game resumed'),
});

// Add your game content to the game container
const gameContainer = gameScreen.getGameContainer();
gameContainer.addChild(myGameWorld);

screenManager.push(gameScreen, 'slide');
```

### GameHUDScreen Methods

```typescript
// Score
gameScreen.setScore(1000);
gameScreen.addScore(100);
const score = gameScreen.getScore();

// Timer (in seconds)
gameScreen.setTime(120);
const time = gameScreen.getTime();

// Lives
gameScreen.setLives(2);
gameScreen.loseLife();
const lives = gameScreen.getLives();

// Progress
gameScreen.setProgress(50);

// Pause state
gameScreen.pause();
gameScreen.resume();
gameScreen.togglePause();
const isPaused = gameScreen.isPaused();

// Get game area dimensions (excludes HUD)
const { width, height } = gameScreen.getGameAreaSize();
```

### GameHUDScreen Events

```typescript
gameScreen.on('pause', () => { /* pause game logic */ });
gameScreen.on('resume', () => { /* resume game logic */ });
gameScreen.on('home', () => screenManager.popToRoot());
gameScreen.on('score-changed', (score) => { });
gameScreen.on('lives-changed', (lives) => {
  if (lives === 0) {
    screenManager.replace(defeatScreen);
  }
});
gameScreen.on('progress-changed', (progress) => { });
```

---

## ResultScreen

Victory or defeat screen with star rating, score display, rewards, and action buttons.

```typescript
import { ResultScreen } from '@gamebyte/framework';

const result = new ResultScreen({
  type: 'victory',  // or 'defeat'
  title: 'Level Complete!',  // Optional custom title
  score: 12450,
  bestScore: 15230,
  stars: 3,  // 0-3

  rewards: [
    { icon: '💰', amount: 500 },
    { icon: '💎', amount: 10 },
    { icon: '⭐', amount: 3, label: 'Stars' },
  ],

  actions: [
    {
      text: 'Retry',
      style: 'secondary',
      onClick: () => screenManager.replace(new GameScreen()),
    },
    {
      text: 'Next Level',
      style: 'primary',
      onClick: () => screenManager.replace(new GameScreen(), 'slide', { level: 6 }),
    },
  ],

  backgroundColor: 0x1a1a2e,
});

// Replace game screen with result
screenManager.replace(result, 'fade');
```

### ResultScreen Configuration

```typescript
interface ResultScreenConfig {
  type: 'victory' | 'defeat';
  score?: number;
  bestScore?: number;
  stars?: number;  // 0-3
  rewards?: RewardItem[];
  actions?: ResultAction[];
  title?: string;  // Custom title (default: 'VICTORY!' or 'DEFEAT')
  backgroundColor?: number;
}

interface RewardItem {
  icon: string | ITexture;  // Emoji or texture
  amount: number;
  label?: string;
}

interface ResultAction {
  text: string;
  style?: 'primary' | 'secondary';
  onClick: () => void;
}
```

### Result Types

| Type | Default Title | Color |
|------|---------------|-------|
| `'victory'` | VICTORY! | Green (#4CAF50) |
| `'defeat'` | DEFEAT | Red (#E84C4C) |

---

## Complete Game Flow Example

```typescript
// 1. Create screens
const hub = new HubScreen({ /* config */ });
const game = new GameHUDScreen({ /* config */ });

// 2. Start at hub
screenManager.push(hub);

// 3. User clicks Play
hub.on('tab-changed', (tabId) => {
  if (tabId === 'play') {
    // Show level selection or start game
  }
});

function startGame(level: number) {
  const gameScreen = new GameHUDScreen({
    hudConfig: { showScore: true, showLives: true, livesMax: 3 },
  });

  gameScreen.on('lives-changed', (lives) => {
    if (lives === 0) {
      showResult('defeat', gameScreen.getScore());
    }
  });

  screenManager.push(gameScreen, 'slide', { level });
}

function showResult(type: 'victory' | 'defeat', score: number) {
  const result = new ResultScreen({
    type,
    score,
    actions: [
      { text: 'Home', style: 'secondary', onClick: () => screenManager.popToRoot() },
      { text: 'Retry', style: 'primary', onClick: () => startGame(currentLevel) },
    ],
  });

  screenManager.replace(result, 'fade');
}
```
