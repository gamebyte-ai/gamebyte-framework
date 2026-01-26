---
id: transitions
title: Scene Transitions
description: Smooth transitions between scenes
sidebar_position: 2
keywords: [transitions, fade, slide, animations]
llm_summary: "Transitions: fade, slide, zoom, custom. Use switchTo('scene', { type: 'fade', duration: 500 }). Create custom with SceneTransition class."
---

<!-- llm-context: scene-transitions, fade, slide, zoom, animation -->

import LiveDemo from '@site/src/components/LiveDemo';

# Scene Transitions

Smooth transitions create polish and hide loading.

## Built-in Transitions

```typescript
// Fade (default)
await sceneManager.switchTo('game', {
    type: 'fade',
    duration: 500
});

// Slide
await sceneManager.switchTo('settings', {
    type: 'slide',
    direction: 'left', // left, right, up, down
    duration: 400
});

// Zoom
await sceneManager.switchTo('game', {
    type: 'zoom',
    zoomOut: 0.8,
    duration: 600
});

// None (instant)
await sceneManager.switchTo('menu', {
    type: 'none'
});
```

<LiveDemo
  src="/demos/scene-transitions.html"
  height={350}
  title="Scene Transitions"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Transition Options

```typescript
interface TransitionOptions {
    type: 'none' | 'fade' | 'slide' | 'zoom' | 'custom';
    duration?: number;        // ms, default: 500
    easing?: string;          // default: 'power2.inOut'
    direction?: 'left' | 'right' | 'up' | 'down';
    color?: number;           // fade color, default: 0x000000
    onStart?: () => void;
    onComplete?: () => void;
}
```

## Fade Transition

```typescript
await sceneManager.switchTo('game', {
    type: 'fade',
    duration: 800,
    color: 0xffffff,  // White fade
    easing: 'power3.out'
});
```

## Slide Transition

```typescript
// Slide left (new scene comes from right)
await sceneManager.switchTo('next-level', {
    type: 'slide',
    direction: 'left',
    duration: 400
});

// Slide up (new scene comes from bottom)
await sceneManager.switchTo('shop', {
    type: 'slide',
    direction: 'up',
    duration: 300
});
```

## Custom Transitions

```typescript
import { SceneTransition } from '@gamebyte/framework';

class CircleWipeTransition extends SceneTransition {
    async execute(
        fromScene: BaseScene,
        toScene: BaseScene
    ): Promise<void> {
        const { width, height } = this.renderer;

        // Create circular mask (Pixi v8 API)
        const mask = new PIXI.Graphics();
        mask.circle(width / 2, height / 2, 0);
        mask.fill(0xffffff);

        toScene.container.mask = mask;
        toScene.container.visible = true;

        // Animate mask growing
        await gsap.to(mask, {
            pixi: { radius: Math.max(width, height) },
            duration: this.duration / 1000,
            ease: 'power2.out'
        });

        // Cleanup
        toScene.container.mask = null;
        mask.destroy();
    }
}

// Register custom transition
sceneManager.registerTransition('circle-wipe', CircleWipeTransition);

// Use it
await sceneManager.switchTo('game', {
    type: 'circle-wipe',
    duration: 800
});
```

## Loading Screen

```typescript
// Show loading screen during transition
await sceneManager.switchTo('game', {
    type: 'fade',
    duration: 500,
    showLoading: true,
    loadingComponent: LoadingScreen
});

// Custom loading screen
class LoadingScreen {
    private container: PIXI.Container;
    private progressBar: UIProgressBar;

    constructor() {
        this.container = new PIXI.Container();
        this.progressBar = new UIProgressBar({
            width: 300,
            height: 10,
            value: 0,
            maxValue: 100
        });
    }

    setProgress(percent: number): void {
        this.progressBar.setValue(percent, true);
    }

    getContainer(): PIXI.Container {
        return this.container;
    }
}
```

## Transition Events

```typescript
sceneManager.on('transition:start', (from, to) => {
    console.log(`Transitioning from ${from} to ${to}`);
});

sceneManager.on('transition:complete', (from, to) => {
    console.log(`Transition complete`);
});

// Or inline
await sceneManager.switchTo('game', {
    type: 'fade',
    onStart: () => {
        Audio.play('whoosh');
    },
    onComplete: () => {
        console.log('Ready to play!');
    }
});
```
