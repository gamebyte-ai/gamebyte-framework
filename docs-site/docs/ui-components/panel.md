---
id: panel
title: UIPanel
description: Container component with background and border
sidebar_position: 3
keywords: [panel, container, background, border, card]
llm_summary: "UIPanel: container with styled background. new UIPanel({ width, height, backgroundColor, borderRadius, shadowEffect }). Use addChild() to add content."
---

<!-- llm-context: ui-panel, container, background, border, card, modal, dialog -->

import LiveDemo from '@site/src/components/LiveDemo';

# UIPanel

A styled container for grouping UI elements.

## Basic Usage

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

<LiveDemo
  src="/demos/ui-panel-basic.html"
  height={300}
  title="Basic Panel"
/>

## Configuration Options

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

## Adding Content

```typescript
const panel = new UIPanel({
    width: 300,
    height: 400,
    backgroundColor: 0x1a1a2e,
    layout: 'vertical',
    gap: 16,
    padding: 24
});

// Add title
const title = new UIText({
    text: 'Settings',
    fontSize: 28,
    fontWeight: 'bold'
});
panel.addChild(title.getContainer());

// Add buttons
const soundBtn = new UIButton({ text: 'Sound: ON', width: 250, height: 50 });
const musicBtn = new UIButton({ text: 'Music: ON', width: 250, height: 50 });
const backBtn = new UIButton({ text: 'Back', width: 250, height: 50 });

panel.addChild(soundBtn.getContainer());
panel.addChild(musicBtn.getContainer());
panel.addChild(backBtn.getContainer());
```

## Panel Variants

### Card Style

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

### Glass Effect

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

### Gradient Header

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

<LiveDemo
  src="/demos/ui-panel-variants.html"
  height={350}
  title="Panel Variants"
/>

## Layout System

### Vertical Layout

```typescript
const menu = new UIPanel({
    width: 250,
    height: 300,
    backgroundColor: 0x1a1a2e,
    layout: 'vertical',
    gap: 12,
    alignItems: 'center',
    padding: 20
});

// Children stack vertically
menu.addChild(btn1.getContainer());
menu.addChild(btn2.getContainer());
menu.addChild(btn3.getContainer());
```

### Horizontal Layout

```typescript
const toolbar = new UIPanel({
    width: 300,
    height: 60,
    backgroundColor: 0x2d3748,
    layout: 'horizontal',
    gap: 8,
    alignItems: 'center',
    padding: 8
});

toolbar.addChild(iconBtn1.getContainer());
toolbar.addChild(iconBtn2.getContainer());
toolbar.addChild(iconBtn3.getContainer());
```

## Modal Dialog

```typescript
function showModal(title: string, message: string): UIPanel {
    // Backdrop
    const backdrop = new UIPanel({
        width: 800,
        height: 600,
        backgroundColor: 0x000000,
        backgroundAlpha: 0.7
    });

    // Dialog
    const dialog = new UIPanel({
        width: 350,
        height: 200,
        backgroundColor: 0x1f2937,
        borderRadius: 16,
        shadowEffect: true,
        layout: 'vertical',
        gap: 16,
        padding: 24,
        alignItems: 'center'
    });

    dialog.setPosition(225, 200);

    // Title
    const titleText = new UIText({
        text: title,
        fontSize: 24,
        fontWeight: 'bold'
    });
    dialog.addChild(titleText.getContainer());

    // Message
    const messageText = new UIText({
        text: message,
        fontSize: 16,
        color: 0xcccccc
    });
    dialog.addChild(messageText.getContainer());

    // Buttons
    const buttonRow = new UIPanel({
        width: 300,
        height: 50,
        backgroundColor: 0x1f2937,
        backgroundAlpha: 0,
        layout: 'horizontal',
        gap: 16,
        alignItems: 'center'
    });

    const cancelBtn = new UIButton({
        text: 'Cancel',
        width: 140,
        height: 44,
        backgroundColor: 0x4b5563
    });

    const confirmBtn = new UIButton({
        text: 'Confirm',
        width: 140,
        height: 44,
        backgroundColor: 0x22c55e
    });

    buttonRow.addChild(cancelBtn.getContainer());
    buttonRow.addChild(confirmBtn.getContainer());
    dialog.addChild(buttonRow.getContainer());

    backdrop.addChild(dialog.getContainer());

    return backdrop;
}
```

## Methods

```typescript
// Add/remove children
panel.addChild(component.getContainer());
panel.removeChild(component.getContainer());
panel.removeAllChildren();

// Position
panel.setPosition(x, y);

// Size
panel.setSize(width, height);

// Background
panel.setBackgroundColor(0x2d3748);
panel.setBackgroundAlpha(0.8);

// Visibility
panel.show();
panel.hide();
```
