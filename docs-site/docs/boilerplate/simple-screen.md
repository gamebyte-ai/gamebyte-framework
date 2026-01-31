# SimpleScreen

A lightweight base class for creating game screens that work directly with the graphics abstraction layer.

## When to Use

Use `SimpleScreen` instead of `BaseUIScreen` when you need:
- Direct control over rendering
- Lightweight screens without full UIComponent lifecycle
- Game-style screens with custom animations

## Creating a Custom Screen

```typescript
import { SimpleScreen } from '@gamebyte/framework';
import { graphics } from '@gamebyte/framework';

class MyGameScreen extends SimpleScreen {
  private background: IGraphics;

  constructor() {
    super('MyGameScreen');

    this.background = graphics().createGraphics();
    this.container.addChild(this.background);
  }

  // Required: Setup screen content
  protected setup(): void {
    this.background.rect(0, 0, this._width, this._height);
    this.background.fill({ color: 0x1a1a2e });

    // Add your game content here
  }

  // Optional: Handle resize
  protected onResize(width: number, height: number): void {
    this.background.clear();
    this.background.rect(0, 0, width, height);
    this.background.fill({ color: 0x1a1a2e });
  }

  // Optional: Handle back button (return true if handled)
  public onBackButton(): boolean {
    // Show pause menu instead of going back
    this.showPauseMenu();
    return true;
  }

  // Optional: Custom show animation
  protected async animateIn(): Promise<void> {
    // Default is fade in over 300ms
    return super.animateIn();
  }

  // Optional: Custom hide animation
  protected async animateOut(): Promise<void> {
    // Default is fade out over 200ms
    return super.animateOut();
  }
}
```

## Lifecycle

```
constructor()
    ↓
initialize(width, height)  → setup()
    ↓
show(data?)  → animateIn()  → 'shown' event
    ↓
[screen is visible]
    ↓
hide()  → animateOut()  → 'hidden' event
    ↓
destroy()
```

## API Reference

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `screenName` | `string` | Unique identifier for the screen |
| `container` | `IContainer` | The screen's root container |

### Methods

| Method | Description |
|--------|-------------|
| `initialize(width, height)` | Initialize with dimensions, calls `setup()` |
| `show(data?)` | Show the screen with animation |
| `hide()` | Hide the screen with animation |
| `resize(width, height)` | Resize the screen |
| `onBackButton()` | Handle back button, return `true` if handled |
| `getContainer()` | Get the root container |
| `getSize()` | Get `{ width, height }` |
| `isVisible()` | Check if screen is visible |
| `destroy()` | Clean up resources |

### Events

```typescript
screen.on('initialized', () => { });
screen.on('shown', (data) => { });
screen.on('hidden', () => { });
```

## Example: Loading Screen

```typescript
class LoadingScreen extends SimpleScreen {
  private progressBar: IGraphics;
  private progressText: IText;

  constructor() {
    super('LoadingScreen');
    const factory = graphics();

    this.progressBar = factory.createGraphics();
    this.progressText = factory.createText('Loading...', {
      fontSize: 24,
      fill: 0xffffff,
    });

    this.container.addChild(this.progressBar);
    this.container.addChild(this.progressText);
  }

  protected setup(): void {
    this.progressText.x = this._width / 2;
    this.progressText.y = this._height / 2 - 40;
    if (this.progressText.anchor) {
      this.progressText.anchor.set(0.5);
    }

    this.updateProgress(0);
  }

  public updateProgress(percent: number): void {
    const barWidth = this._width * 0.6;
    const barHeight = 20;
    const x = (this._width - barWidth) / 2;
    const y = this._height / 2;

    this.progressBar.clear();

    // Background
    this.progressBar.roundRect(x, y, barWidth, barHeight, 10);
    this.progressBar.fill({ color: 0x333333 });

    // Progress
    this.progressBar.roundRect(x, y, barWidth * percent, barHeight, 10);
    this.progressBar.fill({ color: 0x4CAF50 });

    this.progressText.text = `Loading... ${Math.round(percent * 100)}%`;
  }
}
```

## Live Demo

import LiveDemo from '@site/src/components/LiveDemo';

<LiveDemo src="/demos/screen-manager-demo.html" height="600" title="Screen Management Demo" />
