---
id: hybrid-mode
title: Hybrid Mode
description: Combining 2D and 3D rendering
sidebar_position: 4
keywords: [hybrid, 2d, 3d, overlay, ui, mixed rendering]
llm_summary: "Hybrid mode: 3D world + 2D UI. Initialize with 'hybrid'. Access: game.make('renderer.3d') for world, game.make('renderer.2d') for UI overlay."
---

<!-- llm-context: hybrid-mode, 2d-3d, overlay, ui-over-3d, mixed-rendering, pixi-three -->

import LiveDemo from '@site/src/components/LiveDemo';

# Hybrid Mode

Hybrid mode combines Three.js (3D world) with Pixi.js (2D UI overlay) for the best of both worlds.

## When to Use Hybrid Mode

- 3D games with complex UI (RPGs, strategy games)
- 3D environments with 2D HUD elements
- Games needing both 3D gameplay and 2D menus

## Setup

```typescript
import { createGame } from 'gamebyte-framework';
import * as THREE from 'three';
import * as PIXI from 'pixi.js';

const game = createGame();
await game.initialize(canvas, 'hybrid');

// Access both renderers
const renderer3D = game.make('renderer.3d');
const renderer2D = game.make('renderer.2d');

// Get Three.js scene
const scene3D = renderer3D.getScene();
const camera = renderer3D.getCamera();

// Get Pixi.js stage (for UI)
const stage2D = renderer2D.getStage();
```

## Architecture

```
┌─────────────────────────────────────┐
│            Final Output              │
├─────────────────────────────────────┤
│   ┌───────────────────────────────┐ │
│   │     2D Layer (Pixi.js)        │ │ ← UI, HUD, Menus
│   │   [Health Bar] [Score] [Map]  │ │
│   └───────────────────────────────┘ │
│   ┌───────────────────────────────┐ │
│   │     3D Layer (Three.js)       │ │ ← Game World
│   │   [Characters] [Environment]   │ │
│   └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Example: 3D Game with 2D HUD

```typescript
import { BaseScene, UIButton, TopBar, TopBarItemType } from 'gamebyte-framework';
import * as THREE from 'three';

class GameScene extends BaseScene {
    private renderer3D: ThreeRenderer;
    private renderer2D: PixiRenderer;
    private scene3D: THREE.Scene;
    private topBar: TopBar;

    async initialize(): Promise<void> {
        await super.initialize();

        // Get renderers
        this.renderer3D = this.app.make('renderer.3d');
        this.renderer2D = this.app.make('renderer.2d');
        this.scene3D = this.renderer3D.getScene();

        // Setup 3D world
        this.setup3DWorld();

        // Setup 2D UI overlay
        this.setup2DUI();
    }

    private setup3DWorld(): void {
        // Add lights
        const ambient = new THREE.AmbientLight(0x404040);
        this.scene3D.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 1);
        directional.position.set(5, 10, 5);
        this.scene3D.add(directional);

        // Add ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50),
            new THREE.MeshStandardMaterial({ color: 0x228B22 })
        );
        ground.rotation.x = -Math.PI / 2;
        this.scene3D.add(ground);

        // Add player character
        const player = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.5, 1),
            new THREE.MeshStandardMaterial({ color: 0x4169E1 })
        );
        player.position.y = 1;
        this.scene3D.add(player);
    }

    private setup2DUI(): void {
        // Top bar with health and score
        this.topBar = new TopBar({
            width: 800,
            items: [
                {
                    id: 'health',
                    type: TopBarItemType.PROGRESS,
                    value: 100,
                    maxValue: 100,
                    color: 0xff4444
                },
                {
                    id: 'score',
                    type: TopBarItemType.RESOURCE,
                    icon: 'coin',
                    value: 0,
                    animated: true
                }
            ]
        });

        // Add to 2D container (on top of 3D)
        this.container.addChild(this.topBar.getContainer());

        // Pause button
        const pauseBtn = new UIButton({
            text: '⏸',
            width: 50,
            height: 50,
            backgroundColor: 0x333333
        });
        pauseBtn.setPosition(750, 550);
        pauseBtn.on('click', () => this.pauseGame());
        this.container.addChild(pauseBtn.getContainer());
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

        // Update 3D world
        // (rotate camera, move objects, etc.)

        // 2D UI updates automatically
    }
}
```

<LiveDemo
  src="/demos/hybrid-game.html"
  height={450}
  title="Hybrid 3D Game with 2D UI"
/>

## Layer Management

### Z-Order Control

```typescript
// 3D is always behind, 2D is always in front
// Within 2D, use Pixi's z-index:

uiContainer.sortableChildren = true;
background.zIndex = 0;
gameUI.zIndex = 10;
modal.zIndex = 100;
uiContainer.sortChildren();
```

### Transparency

The 2D layer has a transparent background by default:

```typescript
// 2D background is transparent (shows 3D behind)
renderer2D.setBackgroundColor(0x000000, 0); // alpha = 0

// For solid 2D areas (menus), use panels:
const menuBackground = new PIXI.Graphics();
menuBackground.beginFill(0x1a1a2e, 0.9);
menuBackground.drawRect(0, 0, 800, 600);
menuBackground.endFill();
```

## Input Handling

Input works across both layers:

```typescript
const input = game.make('input');

// 2D UI gets priority for clicks
// If UI doesn't handle it, 3D world receives it

// For 3D raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

input.on('click', (event) => {
    // Check if UI handled it
    if (event.handled) return;

    // Convert to 3D ray
    mouse.x = (event.x / width) * 2 - 1;
    mouse.y = -(event.y / height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene3D.children);

    if (intersects.length > 0) {
        console.log('Clicked 3D object:', intersects[0].object);
    }
});
```

## World-to-Screen Projection

Show 2D elements at 3D positions:

```typescript
function worldToScreen(position3D: THREE.Vector3): { x: number, y: number } {
    const projected = position3D.clone().project(camera);

    return {
        x: (projected.x + 1) * width / 2,
        y: (-projected.y + 1) * height / 2
    };
}

// Example: Health bar above 3D character
function updateHealthBar(character: THREE.Object3D, healthBar: UIProgressBar) {
    const worldPos = character.position.clone();
    worldPos.y += 2; // Above character

    const screenPos = worldToScreen(worldPos);
    healthBar.setPosition(screenPos.x, screenPos.y);
}
```

## Performance Considerations

### 1. Minimize Overdraw

```typescript
// Don't render 2D background if 3D fills screen
renderer2D.setBackgroundColor(0x000000, 0);
```

### 2. Batch UI Updates

```typescript
// Bad: Update every frame
update(dt) {
    this.scoreText.text = `Score: ${this.score}`;
}

// Good: Update only when changed
addScore(points: number) {
    this.score += points;
    this.scoreText.text = `Score: ${this.score}`;
}
```

### 3. Use Object Pools for Floating Text

```typescript
class DamageTextPool {
    private pool: PIXI.Text[] = [];

    showDamage(position: THREE.Vector3, amount: number) {
        const text = this.pool.pop() || this.createText();
        const screen = worldToScreen(position);

        text.text = `-${amount}`;
        text.position.set(screen.x, screen.y);
        text.visible = true;

        // Animate and return to pool
        gsap.to(text, {
            y: screen.y - 50,
            alpha: 0,
            duration: 1,
            onComplete: () => {
                text.visible = false;
                this.pool.push(text);
            }
        });
    }
}
```
