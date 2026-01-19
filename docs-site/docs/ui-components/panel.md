---
id: panel
title: Panels
description: Game-style and basic panel components for containers and dialogs
sidebar_position: 3
keywords: [panel, container, background, border, card, game-style, settings, dialog]
llm_summary: "GameStylePanel: Mobile game style skinnable panel with title bar, close button, gradient background. Color schemes: PANEL_BLUE, PANEL_PURPLE, PANEL_GREEN, PANEL_ORANGE, PANEL_DARK. UIPanel: Basic container."
---

<!-- llm-context: ui-panel, game-style-panel, container, background, border, card, modal, dialog, settings -->

import LiveDemo from '@site/src/components/LiveDemo';

# Panels

GameByte provides **GameStylePanel** for mobile game style dialogs with skinnable borders, and **UIPanel** for basic containers.

## Live Demo

<LiveDemo
  src="/demos/game-settings-panel.html"
  height={570}
  title="GameStylePanel Settings"
/>

## GameStylePanel

A mobile game style panel with multi-layer borders, gradient backgrounds, title bar, and close button. Inspired by Candy Crush, Brawl Stars, and Clash Royale.

**Features:**
- Multi-layer border effect (outer + inner)
- Vertical gradient background
- Title bar with bold text and stroke
- Close button (red X)
- Customizable color schemes
- Drop shadow
- Content area with padding

### Basic Usage

```typescript
import { GameStylePanel, GameStyleColors } from 'gamebyte-framework';

const settingsPanel = new GameStylePanel({
    width: 350,
    height: 400,
    title: 'SETTINGS',
    showCloseButton: true,
    colorScheme: GameStyleColors.PANEL_BLUE,
    onClose: () => settingsPanel.hide()
});

settingsPanel.setPosition(25, 100);
stage.addChild(settingsPanel.getContainer());
```

### Configuration Options

```typescript
interface GameStylePanelConfig {
    width?: number;           // Default: 350
    height?: number;          // Default: 400
    title?: string;           // Panel title
    showCloseButton?: boolean; // Default: true
    colorScheme?: GamePanelColorScheme;
    borderRadius?: number;    // Default: 24
    borderWidth?: number;     // Default: 8
    titleFontSize?: number;   // Default: 28
    padding?: number;         // Default: 20
    onClose?: () => void;     // Close button callback
}

interface GamePanelColorScheme {
    fillTop: number;          // Gradient top color
    fillBottom: number;       // Gradient bottom color
    borderOuter: number;      // Outer border color
    borderInner: number;      // Inner border color
    borderWidth: number;
    titleColor: number;       // Title text color
    titleStroke: number;      // Title stroke color
    closeButtonBg: number;    // Close button background
    closeButtonBorder: number;
    closeButtonX: number;     // X icon color
}
```

### Color Schemes

```typescript
import { GameStylePanel, GameStyleColors } from 'gamebyte-framework';

// Blue (default)
GameStyleColors.PANEL_BLUE

// Purple
GameStyleColors.PANEL_PURPLE

// Green
GameStyleColors.PANEL_GREEN

// Orange
GameStyleColors.PANEL_ORANGE

// Dark
GameStyleColors.PANEL_DARK

// Red
GameStyleColors.PANEL_RED
```

### Adding Content

```typescript
const panel = new GameStylePanel({
    width: 350,
    height: 400,
    title: 'SETTINGS'
});

// Get the content container
const content = panel.getContentContainer();

// Add your UI elements to content
const musicToggle = new GameToggle({ value: true });
musicToggle.setPosition(0, 0);
content.addChild(musicToggle.getContainer());

const playButton = new GameStyleButton({
    text: 'Play',
    colorScheme: GameStyleColors.GREEN_BUTTON
});
playButton.setPosition(0, 60);
content.addChild(playButton.getContainer());
```

### Methods

```typescript
// Position
panel.setPosition(x, y);
const pos = panel.getPosition();

// Visibility
panel.show();
panel.hide();
panel.setVisible(visible);

// Title
panel.setTitle('NEW TITLE');

// Color scheme
panel.setColorScheme(GameStyleColors.PANEL_PURPLE);

// Content
panel.addContent(component);
panel.removeContent(component);
panel.clearContent();
const contentContainer = panel.getContentContainer();

// Size info
const size = panel.getSize();
const contentSize = panel.getContentSize();

// Events
panel.on('close', () => console.log('Close button clicked'));
panel.on('show', () => console.log('Panel shown'));
panel.on('hide', () => console.log('Panel hidden'));
```

### Settings Panel Example

```typescript
import {
    GameStylePanel,
    GameStyleButton,
    GameToggle,
    GameStyleColors
} from 'gamebyte-framework';

class SettingsScreen {
    private panel: GameStylePanel;
    private musicToggle: GameToggle;
    private soundToggle: GameToggle;

    constructor(stage: PIXI.Container) {
        this.panel = new GameStylePanel({
            width: 350,
            height: 450,
            title: 'SETTINGS',
            colorScheme: GameStyleColors.PANEL_BLUE,
            onClose: () => this.close()
        });

        const content = this.panel.getContentContainer();

        // Music toggle
        this.musicToggle = new GameToggle({ value: true });
        this.musicToggle.setPosition(200, 0);
        this.musicToggle.on('change', (val) => this.setMusic(val));
        content.addChild(this.musicToggle.getContainer());

        // Sound toggle
        this.soundToggle = new GameToggle({ value: true });
        this.soundToggle.setPosition(200, 50);
        this.soundToggle.on('change', (val) => this.setSound(val));
        content.addChild(this.soundToggle.getContainer());

        // Save button
        const saveBtn = new GameStyleButton({
            text: 'Save',
            width: 200,
            height: 60,
            colorScheme: GameStyleColors.GREEN_BUTTON
        });
        saveBtn.setPosition(50, 150);
        saveBtn.on('click', () => this.save());
        content.addChild(saveBtn.getContainer());

        this.panel.setPosition(25, 75);
        stage.addChild(this.panel.getContainer());
    }

    show(): void {
        this.panel.show();
    }

    close(): void {
        this.panel.hide();
    }

    private setMusic(enabled: boolean): void {
        console.log('Music:', enabled);
    }

    private setSound(enabled: boolean): void {
        console.log('Sound:', enabled);
    }

    private save(): void {
        console.log('Settings saved');
        this.close();
    }
}
```

---

## UIPanel (Basic)

For simpler panel needs, use the basic `UIPanel` component.

<LiveDemo
  src="/demos/ui-panel-basic.html"
  height={300}
  title="Basic Panel"
/>

### Basic Usage

```typescript
import { UIPanel, UIText, UIButton } from 'gamebyte-framework';

const panel = new UIPanel({
    width: 300,
    height: 200,
    backgroundColor: 0x1a1a2e,
    borderRadius: 12
});

panel.setPosition(250, 200);
scene.addChild(panel.getContainer());
```

### Configuration Options

```typescript
interface UIPanelConfig {
    // Size
    width: number;
    height: number;
    padding?: number;          // Default: 16

    // Background
    backgroundColor: number;
    backgroundAlpha?: number;  // Default: 1
    gradient?: {
        enabled: boolean;
        colorTop?: number;
        colorBottom?: number;
        direction?: 'vertical' | 'horizontal';
    };

    // Border
    borderRadius?: number;     // Default: 8
    borderWidth?: number;
    borderColor?: number;

    // Effects
    shadowEffect?: boolean;
    shadowColor?: number;
    shadowBlur?: number;
    shadowOffset?: { x: number, y: number };

    // Layout
    layout?: 'none' | 'vertical' | 'horizontal';
    gap?: number;              // Space between children
    alignItems?: 'start' | 'center' | 'end';
}
```

### Panel Variants

<LiveDemo
  src="/demos/ui-panel-variants.html"
  height={350}
  title="Panel Variants"
/>

#### Card Style

```typescript
const card = new UIPanel({
    width: 280,
    height: 150,
    backgroundColor: 0x2d3748,
    borderRadius: 16,
    shadowEffect: true,
    padding: 20
});
```

#### Glass Effect

```typescript
const glass = new UIPanel({
    width: 300,
    height: 200,
    backgroundColor: 0xffffff,
    backgroundAlpha: 0.1,
    borderWidth: 1,
    borderColor: 0xffffff,
    borderRadius: 20
});
```

#### Gradient Header

```typescript
const headerPanel = new UIPanel({
    width: 400,
    height: 60,
    backgroundColor: 0x6366f1,
    gradient: {
        enabled: true,
        colorTop: 0x818cf8,
        colorBottom: 0x4f46e5
    },
    borderRadius: 12
});
```
