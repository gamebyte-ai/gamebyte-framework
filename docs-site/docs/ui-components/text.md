---
id: text
title: UIText
description: Styled text display component
sidebar_position: 4
keywords: [text, label, font, typography]
llm_summary: "UIText: styled text display. new UIText({ text, fontSize, color, fontWeight }). Methods: setText(), setColor(). Supports multiline and alignment."
---

<!-- llm-context: ui-text, typography, font, label, styled-text -->

# UIText

A styled text component for labels, titles, and body text.

## Basic Usage

```typescript
import { UIText } from '@gamebyte/framework';

const text = new UIText({
    text: 'Hello World!',
    fontSize: 24,
    color: 0xffffff
});

text.setPosition(100, 100);
scene.addChild(text.getContainer());
```

## Configuration Options

```typescript
interface UITextConfig {
    // Content
    text: string;

    // Typography
    fontSize?: number;         // Default: 16
    fontFamily?: string;       // Default: 'Arial'
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    letterSpacing?: number;
    lineHeight?: number;

    // Color
    color?: number;            // Default: 0xffffff
    alpha?: number;

    // Alignment
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';

    // Size constraints
    maxWidth?: number;         // Word wrap if exceeded
    maxLines?: number;         // Truncate with ellipsis

    // Effects
    stroke?: number;           // Outline color
    strokeThickness?: number;
    dropShadow?: boolean;
    dropShadowColor?: number;
    dropShadowDistance?: number;
}
```

## Text Styles

### Heading

```typescript
const heading = new UIText({
    text: 'Game Over',
    fontSize: 48,
    fontWeight: 'bold',
    color: 0xffffff,
    dropShadow: true,
    dropShadowDistance: 3
});
```

### Body Text

```typescript
const body = new UIText({
    text: 'Press any key to continue...',
    fontSize: 18,
    color: 0xcccccc,
    fontStyle: 'italic'
});
```

### Score Display

```typescript
const score = new UIText({
    text: '1,234,567',
    fontSize: 36,
    fontWeight: 'bold',
    color: 0xffd700,
    stroke: 0x000000,
    strokeThickness: 4
});
```

## Methods

```typescript
// Update text
text.setText('New text');
const content = text.getText();

// Styling
text.setColor(0xff0000);
text.setFontSize(32);
text.setAlpha(0.5);

// Position
text.setPosition(x, y);
text.setAnchor(0.5, 0.5); // Center anchor
```

## Multiline Text

```typescript
const multiline = new UIText({
    text: 'This is a long text that will\nwrap to multiple lines\nif needed.',
    fontSize: 16,
    maxWidth: 200,
    align: 'center',
    lineHeight: 24
});
```

## Dynamic Updates

```typescript
class ScoreDisplay {
    private text: UIText;
    private score: number = 0;

    constructor() {
        this.text = new UIText({
            text: 'Score: 0',
            fontSize: 24,
            fontWeight: 'bold'
        });
    }

    addScore(points: number): void {
        this.score += points;
        this.text.setText(`Score: ${this.score.toLocaleString()}`);
    }
}
```
