---
id: progress-bar
title: UIProgressBar
description: Progress and health bar component
sidebar_position: 6
keywords: [progress, health, bar, loading, energy]
llm_summary: "UIProgressBar: new UIProgressBar({ width, height, value, maxValue, color }). Update with setValue(value, animate). Supports gradients and segments."
---

<!-- llm-context: progress-bar, health-bar, loading, energy, percentage -->

import LiveDemo from '@site/src/components/LiveDemo';

# UIProgressBar

A versatile progress bar for health, loading, energy, and more.

## Basic Usage

```typescript
import { UIProgressBar } from 'gamebyte-framework';

const healthBar = new UIProgressBar({
    width: 200,
    height: 20,
    value: 75,
    maxValue: 100,
    color: 0xff4444
});

healthBar.setPosition(100, 50);
scene.addChild(healthBar.getContainer());
```

<LiveDemo
  src="/demos/ui-progress-bar.html"
  height={200}
  title="Progress Bar Variants"
/>

## Configuration Options

```typescript
interface UIProgressBarConfig {
    // Size
    width: number;
    height: number;

    // Values
    value: number;
    maxValue: number;

    // Colors
    color: number;             // Fill color
    backgroundColor?: number;  // Track color
    gradient?: {
        enabled: boolean;
        colorStart?: number;
        colorEnd?: number;
    };

    // Shape
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: number;

    // Style
    showLabel?: boolean;
    labelFormat?: 'percentage' | 'value' | 'fraction';
    labelColor?: number;
    labelFontSize?: number;

    // Animation
    animationDuration?: number;
    easing?: string;

    // Segments
    segments?: number;         // Divide bar into segments
    segmentGap?: number;
}
```

## Variants

### Health Bar

```typescript
const health = new UIProgressBar({
    width: 150,
    height: 16,
    value: 80,
    maxValue: 100,
    color: 0x22c55e,
    gradient: {
        enabled: true,
        colorStart: 0x4ade80,
        colorEnd: 0x16a34a
    },
    borderRadius: 8,
    showLabel: true,
    labelFormat: 'fraction'  // "80/100"
});
```

### Loading Bar

```typescript
const loading = new UIProgressBar({
    width: 300,
    height: 8,
    value: 0,
    maxValue: 100,
    color: 0x6366f1,
    backgroundColor: 0x1f2937,
    borderRadius: 4,
    showLabel: true,
    labelFormat: 'percentage'  // "75%"
});

// Animate loading
async function loadAssets() {
    const assets = ['a.png', 'b.png', 'c.png'];
    for (let i = 0; i < assets.length; i++) {
        await loadAsset(assets[i]);
        loading.setValue((i + 1) / assets.length * 100, true);
    }
}
```

### Energy Bar (Segmented)

```typescript
const energy = new UIProgressBar({
    width: 200,
    height: 24,
    value: 3,
    maxValue: 5,
    color: 0xfbbf24,
    backgroundColor: 0x374151,
    segments: 5,
    segmentGap: 4,
    borderRadius: 4
});
```

### Experience Bar

```typescript
const xpBar = new UIProgressBar({
    width: 400,
    height: 12,
    value: 2500,
    maxValue: 5000,
    color: 0x8b5cf6,
    gradient: {
        enabled: true,
        colorStart: 0xa78bfa,
        colorEnd: 0x7c3aed
    },
    borderRadius: 6,
    showLabel: true,
    labelFormat: 'value'  // "2500"
});
```

## Methods

```typescript
// Set value (with optional animation)
progressBar.setValue(50, true);

// Get current value
const value = progressBar.getValue();

// Set max value
progressBar.setMaxValue(200);

// Set color (for dynamic health colors)
progressBar.setColor(health > 25 ? 0x22c55e : 0xef4444);

// Get percentage
const percent = progressBar.getPercentage(); // 0-100
```

## Dynamic Health Color

```typescript
class HealthBar {
    private bar: UIProgressBar;

    constructor() {
        this.bar = new UIProgressBar({
            width: 150,
            height: 16,
            value: 100,
            maxValue: 100,
            color: 0x22c55e
        });
    }

    setHealth(value: number): void {
        this.bar.setValue(value, true);

        // Change color based on health
        if (value > 60) {
            this.bar.setColor(0x22c55e); // Green
        } else if (value > 30) {
            this.bar.setColor(0xfbbf24); // Yellow
        } else {
            this.bar.setColor(0xef4444); // Red
        }
    }
}
```

## Boss Health Bar

```typescript
const bossHealth = new UIProgressBar({
    width: 600,
    height: 24,
    value: 100,
    maxValue: 100,
    color: 0xef4444,
    gradient: {
        enabled: true,
        colorStart: 0xf87171,
        colorEnd: 0xdc2626
    },
    backgroundColor: 0x1f2937,
    borderWidth: 2,
    borderColor: 0x991b1b,
    borderRadius: 4,
    showLabel: true,
    labelFormat: 'percentage'
});

// Center at top of screen
bossHealth.setPosition(100, 30);
```
