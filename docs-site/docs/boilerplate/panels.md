# Panel System

GameByte provides a complete panel system for overlays, modals, and bottom sheets.

## PanelManager

Manages panel display with z-order control and stacking support.

```typescript
import { PanelManager, GameModalPanel, GameBottomSheet } from '@gamebyte/framework';

const panelManager = new PanelManager({
  container: stage,
  screenWidth: 720,
  screenHeight: 1280,
});
```

### PanelManager Methods

```typescript
// Show a panel
await panelManager.show(panel);

// Close the top panel
await panelManager.closeTop();

// Close all panels
await panelManager.closeAll();

// Close a specific panel
await panelManager.close(panel);

// Check if any panels are open
if (panelManager.hasActivePanels()) { }

// Get panel count
const count = panelManager.getPanelCount();

// Get top panel
const topPanel = panelManager.getTopPanel();

// Handle back button (closes top panel)
panelManager.handleBackButton();

// Bring panel layer to front
panelManager.bringToFront();

// Handle resize
panelManager.resize(newWidth, newHeight);
```

### PanelManager Events

```typescript
panelManager.on('panel-shown', (panel) => { });
panelManager.on('panel-closed', (panel) => { });
panelManager.on('resize', ({ width, height }) => { });
```

---

## GameModalPanel

Centered modal panel with scale animation and dark overlay.

```typescript
import { GameModalPanel, GameStyleButton, GameStyleColors } from '@gamebyte/framework';

const settingsPanel = new GameModalPanel({
  width: 350,
  height: 400,
  title: 'Settings',
  showCloseButton: true,
  closeOnOverlay: true,
  borderRadius: 20,
  animationDuration: 250,
  theme: {
    background: 0x2A3142,
    border: 0x3D4F5F,
    overlay: 0x000000,
    overlayAlpha: 0.6,
  },
  onClose: () => console.log('Settings closed'),
});

// Add content
const content = settingsPanel.getContentContainer();
const { width, height } = settingsPanel.getContentSize();

// Add a button
const musicToggle = new GameStyleButton({
  text: 'Music: ON',
  width: width - 20,
  height: 50,
});
content.addChild(musicToggle.getContainer());

panelManager.show(settingsPanel);
```

### GameModalPanel Features

- Appears centered on screen
- Scale-in animation with overshoot (easeOutBack)
- Scale-out animation when closing
- Dark overlay background
- Click overlay to close (optional)
- Close button (optional)

---

## GameBottomSheet

Slide-up panel from the bottom with drag-to-close gesture.

```typescript
import { GameBottomSheet } from '@gamebyte/framework';

const itemSheet = new GameBottomSheet({
  height: 'half',  // 'auto' | 'half' | 'full' | number
  title: 'Select Item',
  showHandle: true,
  dragToClose: true,
  showCloseButton: true,
  closeOnOverlay: true,
  animationDuration: 300,
  onClose: () => console.log('Sheet closed'),
});

// Add content
const content = itemSheet.getContentContainer();

// Add items
items.forEach((item, index) => {
  const button = createItemButton(item);
  button.y = index * 70;
  content.addChild(button);
});

panelManager.show(itemSheet);
```

### Height Options

| Value | Description |
|-------|-------------|
| `'auto'` | Fixed 400px height |
| `'half'` | 50% of screen height |
| `'full'` | 90% of screen height |
| `number` | Exact pixel height |

### GameBottomSheet Features

- Slides up from bottom
- Drag handle for visual indication
- Swipe down to close (drag > 100px)
- Rounded top corners
- Overlay tap to close

---

## Creating Custom Panels

Extend `GamePanel` for custom panel types:

```typescript
import { GamePanel, GamePanelConfig } from '@gamebyte/framework';

interface MyPanelConfig extends GamePanelConfig {
  customOption?: boolean;
}

class MyCustomPanel extends GamePanel {
  constructor(config: MyPanelConfig = {}) {
    super(config);
    // Custom initialization
  }

  protected positionPanel(screenWidth: number, screenHeight: number): void {
    // Position your panel (required)
    this.panelContainer.x = screenWidth / 2 - this.config.width / 2;
    this.panelContainer.y = 100;
  }

  protected async animateShow(): Promise<void> {
    // Custom show animation (required)
    this.panelContainer.alpha = 0;
    // ... animate to alpha = 1
  }

  protected async animateHide(): Promise<void> {
    // Custom hide animation (required)
    // ... animate to alpha = 0
  }
}
```

---

## Panel Theming

All panels support theming via the `theme` option:

```typescript
interface GamePanelTheme {
  background: number;       // Panel background color
  backgroundAlpha?: number; // Background alpha (default: 0.98)
  border: number;           // Border color
  borderWidth?: number;     // Border width (default: 4)
  overlay?: number;         // Overlay color (default: 0x000000)
  overlayAlpha?: number;    // Overlay alpha (default: 0.6)
  title?: number;           // Title text color
  titleStroke?: number;     // Title stroke color
}

// Example: Dark blue theme
const darkTheme: GamePanelTheme = {
  background: 0x1a1a2e,
  border: 0x2d2d44,
  overlay: 0x000000,
  overlayAlpha: 0.7,
  title: 0xffffff,
  titleStroke: 0x000000,
};

const panel = new GameModalPanel({
  title: 'Dark Panel',
  theme: darkTheme,
});
```

---

## Complete Example: Settings Panel

```typescript
function createSettingsPanel() {
  const panel = new GameModalPanel({
    width: 320,
    height: 380,
    title: 'Settings',
  });

  const content = panel.getContentContainer();
  const { width } = panel.getContentSize();
  let y = 0;

  // Music toggle
  const musicToggle = new GameToggle({
    label: 'Music',
    width: width - 20,
    initialValue: true,
    onChange: (on) => Audio.setMusicEnabled(on),
  });
  musicToggle.setPosition(0, y);
  content.addChild(musicToggle.getContainer());
  y += 70;

  // SFX toggle
  const sfxToggle = new GameToggle({
    label: 'Sound Effects',
    width: width - 20,
    initialValue: true,
    onChange: (on) => Audio.setSFXEnabled(on),
  });
  sfxToggle.setPosition(0, y);
  content.addChild(sfxToggle.getContainer());
  y += 70;

  // Vibration toggle
  const vibrationToggle = new GameToggle({
    label: 'Vibration',
    width: width - 20,
    initialValue: true,
  });
  vibrationToggle.setPosition(0, y);
  content.addChild(vibrationToggle.getContainer());
  y += 90;

  // Credits button
  const creditsBtn = new GameStyleButton({
    text: 'Credits',
    width: width - 20,
    height: 50,
    colorScheme: GameStyleColors.BLUE_BUTTON,
  });
  creditsBtn.setPosition(0, y);
  creditsBtn.on('click', () => {
    panel.close();
    showCreditsPanel();
  });
  content.addChild(creditsBtn.getContainer());

  return panel;
}

// Usage
panelManager.show(createSettingsPanel());
```
