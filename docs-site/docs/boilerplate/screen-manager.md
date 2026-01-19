# ScreenManager

import LiveDemo from '@site/src/components/LiveDemo';

Stack-based screen navigation with animated transitions, similar to mobile app navigation patterns.

## Live Demo

<LiveDemo
  src="/demos/screen-manager-demo.html"
  height={660}
  title="ScreenManager Navigation"
/>

## Features

- Push/pop/replace navigation
- Animated transitions (slide, fade, none)
- Back button handling
- Screen lifecycle management

## Basic Usage

```typescript
import { ScreenManager, SimpleScreen } from '@gamebyte/framework';

const screenManager = new ScreenManager({
  container: stage,
  width: 720,
  height: 1280,
  defaultTransition: 'slide',
  transitionDuration: 300,
});
```

## Navigation Methods

### Push

Add a new screen to the stack:

```typescript
// Push with default transition
screenManager.push(new GameScreen());

// Push with specific transition
screenManager.push(new GameScreen(), 'fade');

// Push with data
screenManager.push(new GameScreen(), 'slide', { level: 5 });
```

### Pop

Remove the current screen and return to previous:

```typescript
// Pop with default transition
await screenManager.pop();

// Pop with specific transition
await screenManager.pop('fade');
```

### Replace

Replace current screen without adding to stack:

```typescript
// Replace current screen
screenManager.replace(new ResultScreen(), 'fade', { score: 1000 });
```

### Pop to Root

Return to the first screen in the stack:

```typescript
await screenManager.popToRoot();
```

## Transition Types

| Type | Description |
|------|-------------|
| `'slide'` | New screen slides in from right (or left when popping) |
| `'fade'` | Cross-fade between screens |
| `'none'` | Instant switch, no animation |

## Configuration

```typescript
interface ScreenManagerConfig {
  container: IContainer;      // Parent container
  width: number;              // Screen width
  height: number;             // Screen height
  defaultTransition?: TransitionType;  // Default: 'slide'
  transitionDuration?: number;         // Default: 300ms
}
```

## Events

```typescript
screenManager.on('screen-pushed', (screen) => {
  console.log('Pushed:', screen.screenName);
});

screenManager.on('screen-popped', (screen) => {
  console.log('Popped:', screen.screenName);
});

screenManager.on('screen-replaced', ({ old, new: newScreen }) => {
  console.log('Replaced', old.screenName, 'with', newScreen.screenName);
});

screenManager.on('transition-complete', ({ from, to }) => {
  console.log('Transition complete');
});
```

## Back Button Handling

```typescript
// In your input handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Backspace') {
    screenManager.handleBackButton();
  }
});
```

The `handleBackButton()` method:
1. First asks the current screen if it wants to handle the back button
2. If not handled, pops the current screen (if stack has more than 1 screen)

## Utility Methods

```typescript
// Get current screen
const current = screenManager.getCurrentScreen();

// Get stack size
const count = screenManager.getScreenCount();

// Check if a screen type exists in stack
if (screenManager.hasScreen('GameScreen')) {
  // ...
}

// Resize all screens
screenManager.resize(newWidth, newHeight);

// Change defaults
screenManager.setDefaultTransition('fade');
screenManager.setTransitionDuration(500);
```
