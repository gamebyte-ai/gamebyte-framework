---
id: modal
title: Modal
description: Centered modal panel with scale animation and overlay
sidebar_position: 18
keywords: [modal, dialog, popup, overlay, panel, game-style]
llm_summary: "GameModalPanel: Centered modal panel with scale in/out animation, dark overlay, close on overlay tap. Extends GamePanel with modal-specific positioning and animations."
---

<!-- llm-context: game-modal, dialog-popup, modal-panel, overlay-dialog -->

import LiveDemo from '@site/src/components/LiveDemo';

# Modal

GameModalPanel is a centered modal panel with scale animation and dark overlay for dialogs, confirmations, and popups.

## Live Demo

<LiveDemo
  src="/demos/game-modal-panel-demo.html"
  height={600}
  title="GameModalPanel Component"
/>

## Features

- **Centered positioning** on screen
- **Scale in/out animation** with easing
- **Dark overlay** background
- **Close on overlay tap** (optional)
- **Title and close button** support
- **Extends GamePanel** with all panel features

## Basic Usage

```typescript
import { GameModalPanel, PanelManager } from '@gamebyte/framework';

const modal = new GameModalPanel({
  width: 350,
  height: 400,
  title: 'Settings',
  showCloseButton: true,
  closeOnOverlay: true,
  onClose: () => console.log('Modal closed')
});

// Add content
const label = graphics().createText('Volume: 75%', { fontSize: 18 });
modal.addContent(label);

// Show modal using PanelManager
const panelManager = new PanelManager(stage, app.screen.width, app.screen.height);
panelManager.show(modal);
```

## Configuration Options

GameModalPanel extends `GamePanelConfig`:

```typescript
interface GameModalPanelConfig extends GamePanelConfig {
  animationDuration?: number;   // Animation duration in ms (default: 250)
}

// Inherited from GamePanelConfig:
interface GamePanelConfig {
  width?: number;               // Panel width (default: 300)
  height?: number;              // Panel height (default: 400)
  title?: string;               // Optional title text
  showCloseButton?: boolean;    // Show X button (default: true)
  closeOnOverlay?: boolean;     // Close when clicking overlay (default: true)
  theme?: GamePanelTheme;       // Visual theme
  onClose?: () => void;         // Close callback
}
```

## Animation

GameModalPanel uses scale animation with easing:

```typescript
// Custom animation duration
const fastModal = new GameModalPanel({
  width: 300,
  height: 200,
  animationDuration: 150  // Faster animation
});

const slowModal = new GameModalPanel({
  width: 300,
  height: 200,
  animationDuration: 400  // Slower, more dramatic
});
```

Animation details:
- **Show**: Scale from 0.8 to 1.0 with `easeOutBack` easing
- **Hide**: Scale from 1.0 to 0.8 with `easeInCubic` easing
- **Overlay**: Fades in/out with panel

## Methods

### Show/Hide

```typescript
// Show modal (through PanelManager)
panelManager.show(modal);

// Close modal
modal.close();

// Or through PanelManager
panelManager.hide(modal);
```

### Content

```typescript
// Add content to modal body
modal.addContent(myComponent);

// Clear content
modal.clearContent();
```

## Confirmation Dialog Example

```typescript
import { GameModalPanel, GameStyleButton, GameStyleColors } from '@gamebyte/framework';

function showConfirmDialog(
  message: string,
  onConfirm: () => void,
  onCancel: () => void
): void {
  const modal = new GameModalPanel({
    width: 320,
    height: 200,
    title: 'Confirm',
    closeOnOverlay: false,  // Require explicit choice
    showCloseButton: false
  });

  // Message text
  const text = graphics().createText(message, {
    fontSize: 18,
    fill: 0xFFFFFF,
    wordWrap: true,
    wordWrapWidth: 280
  });
  text.y = 20;
  modal.addContent(text);

  // Buttons container
  const buttonsY = 80;

  const cancelBtn = new GameStyleButton({
    text: 'Cancel',
    width: 120,
    height: 50,
    colorScheme: GameStyleColors.RED_BUTTON
  });
  cancelBtn.setPosition(20, buttonsY);
  cancelBtn.on('click', () => {
    onCancel();
    modal.close();
  });

  const confirmBtn = new GameStyleButton({
    text: 'Confirm',
    width: 120,
    height: 50,
    colorScheme: GameStyleColors.GREEN_BUTTON
  });
  confirmBtn.setPosition(160, buttonsY);
  confirmBtn.on('click', () => {
    onConfirm();
    modal.close();
  });

  modal.addContent(cancelBtn.getContainer());
  modal.addContent(confirmBtn.getContainer());

  panelManager.show(modal);
}

// Usage
showConfirmDialog(
  'Are you sure you want to restart the level?',
  () => restartLevel(),
  () => console.log('Cancelled')
);
```

## Settings Modal Example

```typescript
import {
  GameModalPanel,
  GameToggle,
  GameSlider,
  GameStyleButton
} from '@gamebyte/framework';

class SettingsModal extends GameModalPanel {
  constructor(onSave: (settings: GameSettings) => void) {
    super({
      width: 400,
      height: 450,
      title: 'Settings',
      onClose: () => this.onCancel()
    });

    this.buildUI(onSave);
  }

  private buildUI(onSave: (settings: GameSettings) => void): void {
    // Sound toggle
    const soundToggle = new GameToggle({
      value: currentSettings.soundEnabled,
      onChange: (val) => currentSettings.soundEnabled = val
    });
    const soundLabel = graphics().createText('Sound', { fontSize: 18 });
    soundLabel.x = 0;
    soundLabel.y = 0;
    soundToggle.setPosition(280, 0);

    // Music toggle
    const musicToggle = new GameToggle({
      value: currentSettings.musicEnabled,
      onChange: (val) => currentSettings.musicEnabled = val
    });
    const musicLabel = graphics().createText('Music', { fontSize: 18 });
    musicLabel.y = 50;
    musicToggle.setPosition(280, 50);

    // Volume slider
    const volumeSlider = new GameSlider({
      width: 280,
      min: 0,
      max: 100,
      value: currentSettings.volume,
      onChange: (val) => currentSettings.volume = val
    });
    const volumeLabel = graphics().createText('Volume', { fontSize: 18 });
    volumeLabel.y = 100;
    volumeSlider.setPosition(0, 130);

    // Save button
    const saveBtn = new GameStyleButton({
      text: 'Save',
      width: 160,
      height: 60,
      colorScheme: GameStyleColors.GREEN_BUTTON
    });
    saveBtn.setPosition(110, 250);
    saveBtn.on('click', () => {
      onSave(currentSettings);
      this.close();
    });

    // Add all to modal
    this.addContent(soundLabel);
    this.addContent(soundToggle.getContainer());
    this.addContent(musicLabel);
    this.addContent(musicToggle.getContainer());
    this.addContent(volumeLabel);
    this.addContent(volumeSlider.getContainer());
    this.addContent(saveBtn.getContainer());
  }

  private onCancel(): void {
    // Revert changes if needed
  }
}
```

## Reward Popup Example

```typescript
import { GameModalPanel, GameStyleButton } from '@gamebyte/framework';

function showRewardPopup(reward: Reward): void {
  const modal = new GameModalPanel({
    width: 350,
    height: 400,
    title: '🎉 Reward!',
    animationDuration: 300
  });

  // Reward icon (would be a sprite in real game)
  const icon = graphics().createText(reward.icon, { fontSize: 64 });
  icon.x = 125;
  icon.y = 20;

  // Reward name
  const name = graphics().createText(reward.name, {
    fontSize: 24,
    fontWeight: 'bold',
    fill: 0xFFD700
  });
  name.x = 100;
  name.y = 100;

  // Description
  const desc = graphics().createText(reward.description, {
    fontSize: 16,
    fill: 0xCCCCCC,
    wordWrap: true,
    wordWrapWidth: 300
  });
  desc.y = 140;

  // Claim button
  const claimBtn = new GameStyleButton({
    text: 'Claim!',
    width: 200,
    height: 60,
    colorScheme: GameStyleColors.YELLOW_BUTTON
  });
  claimBtn.setPosition(60, 220);
  claimBtn.on('click', () => {
    claimReward(reward);
    modal.close();
  });

  modal.addContent(icon);
  modal.addContent(name);
  modal.addContent(desc);
  modal.addContent(claimBtn.getContainer());

  panelManager.show(modal);
}
```

## Notes

- Modal is centered automatically when shown
- Scale animation creates a "pop" effect
- Overlay prevents interaction with content behind
- Use `closeOnOverlay: false` for important dialogs requiring explicit action
- Combine with GamePanel features like custom themes
