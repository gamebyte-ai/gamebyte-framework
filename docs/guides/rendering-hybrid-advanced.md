# HybridRenderer Guide

<!-- keywords: rendering, hybrid, advanced, optimization, stacking, canvas -->

## Live Example

<div style="border: 1px solid #333; border-radius: 8px; overflow: hidden; margin: 20px 0;">
  <iframe src="../examples/hybrid-renderer-example.html" width="100%" height="500" style="border: none;"></iframe>
</div>

> **Interactive Demo**: Three.js 3D background with Pixi.js 2D UI overlay. Click the "Toggle Rotation" button to control the 3D animation. Notice how both layers render independently.

## Overview

`HybridRenderer` combines **Three.js (3D)** and **Pixi.js (2D)** using a stacked canvas architecture. This enables games to have rich 3D backgrounds with performant 2D UI overlays.

## Architecture

```
┌──────────────────────────────────┐
│  Pixi.js Canvas (z-index: 2)     │ ← 2D UI Layer
│  - Interactive UI elements        │ ← Touch/Mouse events
│  - Transparent background         │ ← Shows 3D below
│  - ArcheroMenu, HUD, etc.        │
└──────────────────────────────────┘
           ↓ (stacked on top)
┌──────────────────────────────────┐
│  Three.js Canvas (z-index: 1)    │ ← 3D Background
│  - 3D scene rendering            │ ← Opaque background
│  - Rotating objects              │ ← Camera controls
│  - Lighting & materials          │
└──────────────────────────────────┘
```

## Quick Start

### Installation

```typescript
import { HybridRenderer } from '@gamebyte/framework/renderers/hybrid';
```

### Basic Setup

```typescript
// Get container element
const container = document.getElementById('game-container');

// Create hybrid renderer
const hybridRenderer = new HybridRenderer();

await hybridRenderer.initialize(container, {
  width: 1080,
  height: 1920,
  antialias: true,
  backgroundColor: 0x0a0e1a
});

// === THREE.JS (3D Layer) ===

// Get Three.js components
const scene = hybridRenderer.getThreeScene();
const camera = new THREE.PerspectiveCamera(75, 1080 / 1920, 0.1, 1000);
camera.position.z = 5;
hybridRenderer.setThreeCamera(camera);

// Add 3D objects
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// === PIXI.JS (2D Layer) ===

// Get Pixi.js stage
const pixiStage = hybridRenderer.getPixiStage();

// Add UI elements
const text = new PIXI.Text('Hello World!', {
  fontFamily: 'Arial',
  fontSize: 48,
  fill: 0xffffff
});
text.position.set(100, 100);
pixiStage.addChild(text);

// === START RENDERING ===

hybridRenderer.start();

// Update in render loop
hybridRenderer.on('tick', (deltaTime) => {
  // Rotate cube
  cube.rotation.x += deltaTime;
  cube.rotation.y += deltaTime;
});
```

## Configuration Options

```typescript
interface HybridRendererConfig {
  // Dimensions
  width?: number;              // Canvas width (default: 800)
  height?: number;             // Canvas height (default: 600)

  // Rendering
  antialias?: boolean;         // Enable antialiasing (default: true)
  transparent?: boolean;       // Three.js transparency (default: false)
  backgroundColor?: number;    // Three.js background color (default: 0x000000)
  resolution?: number;         // Pixel ratio (default: devicePixelRatio)

  // Performance
  renderMode?: 'continuous' | 'on-demand';  // Render mode (default: 'continuous')
  powerPreference?: 'default' | 'high-performance' | 'low-power';

  // Three.js specific
  shadowQuality?: 'low' | 'medium' | 'high';       // Shadow quality (default: 'medium')
  enableFrustumCulling?: boolean;                  // Frustum culling (default: true)

  // Pixi.js specific
  pixiPreference?: 'webgpu' | 'webgl2' | 'webgl';  // Renderer type preference

  // Advanced
  threeZIndex?: number;        // Three.js canvas z-index (default: 1)
  pixiZIndex?: number;         // Pixi.js canvas z-index (default: 2)
  enableStats?: boolean;       // Performance stats (default: false)
}
```

## API Reference

### Initialization

```typescript
await hybridRenderer.initialize(
  container: HTMLElement,
  options?: HybridRendererConfig
): Promise<void>
```

### Three.js Methods

```typescript
// Scene management
getThreeScene(): THREE.Scene | null
setThreeScene(scene: THREE.Scene): void

// Camera management
getThreeCamera(): THREE.Camera | null
setThreeCamera(camera: THREE.Camera): void

// Get renderer instance
getThreeRenderer(): THREE.WebGLRenderer | any

// Get canvas
getThreeCanvas(): HTMLCanvasElement | null
```

### Pixi.js Methods

```typescript
// Stage management
getPixiStage(): PIXI.Container

// Get app instance
getPixiApp(): PIXI.Application

// Get canvas
getPixiCanvas(): HTMLCanvasElement | null
```

### Rendering Control

```typescript
// Start/Stop rendering
start(): void
stop(): void

// Manual render (for on-demand mode)
render(deltaTime?: number): void
requestRender(): void

// Resize both layers
resize(width: number, height: number): void
```

### Utilities

```typescript
// Get main canvas (Pixi layer - handles interactions)
getCanvas(): HTMLCanvasElement | null

// Performance stats
getStats(): RendererStats

// Cleanup
destroy(): void
```

## Events

```typescript
// Initialization complete
hybridRenderer.on('initialized', () => {
  console.log('HybridRenderer ready!');
});

// Render loop tick
hybridRenderer.on('tick', (deltaTime: number) => {
  // Update game objects
});

// Resize event
hybridRenderer.on('resize', (width: number, height: number) => {
  // Handle resize
});

// Renderer started
hybridRenderer.on('start', () => {
  console.log('Rendering started');
});

// Renderer stopped
hybridRenderer.on('stop', () => {
  console.log('Rendering stopped');
});
```

## Complete Example: Archero Menu with 3D Background

```typescript
import { HybridRenderer } from '@gamebyte/framework/renderers/hybrid';
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

const container = document.getElementById('game-container');

// Initialize hybrid renderer
const hybridRenderer = new HybridRenderer();
await hybridRenderer.initialize(container, {
  width: 1080,
  height: 1920,
  antialias: true,
  backgroundColor: 0x0a0e1a
});

// === THREE.JS 3D SCENE ===

const scene = hybridRenderer.getThreeScene();
const camera = new THREE.PerspectiveCamera(75, 1080 / 1920, 0.1, 1000);
camera.position.z = 5;
hybridRenderer.setThreeCamera(camera);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// 3D objects for each section
const objects = [
  createCube(0xFF3B3B),           // Shop
  createTorus(0x9B3BFF),          // Gear
  createIcosahedron(0xFFD700),    // Campaign
  createOctahedron(0x3BFF7B),     // Trophy
  createDodecahedron(0x3B7BFF)    // Chest
];

objects.forEach(obj => scene.add(obj));

function showOnly3DObject(index: number) {
  objects.forEach((obj, i) => {
    obj.visible = (i === index);
  });
}

showOnly3DObject(2); // Start with Campaign

// === PIXI.JS 2D UI ===

const pixiStage = hybridRenderer.getPixiStage();

const sections = [
  { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
  { name: 'Gear', icon: '⚙️', iconColor: ARCHERO_COLORS.purple },
  { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
  { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green },
  { name: 'Chest', icon: '📦', iconColor: ARCHERO_COLORS.blue }
];

const menu = new ArcheroMenu({
  sections,
  activeSection: 2,
  onSectionChange: (index, section) => {
    console.log('Section:', section.name);
    showOnly3DObject(index);

    // Animate camera
    gsap.to(camera.position, {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      duration: 0.5,
      ease: 'power2.out'
    });
  },
  canvasWidth: 1080,
  canvasHeight: 1920
});

pixiStage.addChild(menu.getContainer());

// === RENDER LOOP ===

hybridRenderer.start();

hybridRenderer.on('tick', (deltaTime) => {
  // Update menu
  menu.update(deltaTime);

  // Rotate visible 3D object
  objects.forEach((obj) => {
    if (obj.visible) {
      obj.rotation.x += deltaTime * 0.5;
      obj.rotation.y += deltaTime * 0.7;
    }
  });
});
```

## Performance Optimization

### On-Demand Rendering

For static scenes, use on-demand rendering to save battery:

```typescript
const hybridRenderer = new HybridRenderer();
await hybridRenderer.initialize(container, {
  renderMode: 'on-demand'
});

// Manually trigger render when needed
menu.on('section-changed', () => {
  hybridRenderer.requestRender();
});
```

### Mobile Optimization

```typescript
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

const hybridRenderer = new HybridRenderer();
await hybridRenderer.initialize(container, {
  antialias: !isMobile,         // Disable on mobile
  shadowQuality: isMobile ? 'low' : 'high',
  resolution: isMobile ? 1 : window.devicePixelRatio,
  powerPreference: isMobile ? 'low-power' : 'high-performance'
});
```

### Frustum Culling

Enable frustum culling to skip rendering off-screen objects:

```typescript
await hybridRenderer.initialize(container, {
  enableFrustumCulling: true  // Default
});
```

## Best Practices

### 1. Layer Responsibilities

**Three.js (3D Background):**
- Scene environments
- 3D character models
- Particle effects
- Background animations

**Pixi.js (2D UI Overlay):**
- HUD elements
- Menus and dialogs
- Touch/click interactions
- 2D UI animations

### 2. Interaction Handling

Always handle interactions on the **Pixi.js layer** (top layer):

```typescript
// ❌ Wrong: Three.js layer has pointer-events: none
threeCanvas.addEventListener('click', handleClick);

// ✅ Correct: Pixi.js v8 layer handles all interactions
const button = new PIXI.Sprite(texture);
button.eventMode = 'static';
button.cursor = 'pointer';
button.on('pointerdown', handleClick);
```

### 3. Synchronized Updates

Update both layers in the same tick:

```typescript
hybridRenderer.on('tick', (deltaTime) => {
  // Update 3D
  updateThreeScene(deltaTime);

  // Update 2D UI
  updatePixiUI(deltaTime);
});
```

### 4. Memory Management

Properly dispose resources when done:

```typescript
// Destroy renderer
hybridRenderer.destroy();

// This will:
// - Dispose Three.js renderer
// - Dispose all Three.js scene objects
// - Destroy Pixi.js application
// - Remove canvases from DOM
// - Clean up event listeners
```

## Troubleshooting

### Issue: 3D Scene Not Visible

**Problem:** Three.js scene is black or not rendering.

**Solution:**
1. Ensure camera is set: `hybridRenderer.setThreeCamera(camera)`
2. Check camera position: `camera.position.z = 5`
3. Add lighting to scene
4. Verify objects are within camera frustum

### Issue: UI Not Interactive

**Problem:** Pixi.js buttons don't respond to clicks.

**Solution:**
1. Ensure `interactive: true` on Pixi objects
2. Check z-index: Pixi canvas should be on top (default: 2)
3. Verify `pointerEvents: 'auto'` on Pixi canvas

### Issue: Poor Performance

**Problem:** Low FPS, laggy rendering.

**Solution:**
1. Enable frustum culling
2. Reduce shadow quality on mobile
3. Use on-demand rendering for static scenes
4. Limit particle counts
5. Use object pooling for frequently created/destroyed objects

### Issue: Canvases Not Aligned

**Problem:** 3D and 2D layers don't line up.

**Solution:**
1. Both canvases have the same dimensions
2. Container has `position: relative`
3. Canvases have `position: absolute`
4. Canvases have `top: 0; left: 0`

## Migration from Manual Approach

**Before (Manual Stacking):**
```javascript
// 800+ lines of manual Three.js + Pixi.js setup
const threeCanvas = document.createElement('canvas');
const pixiCanvas = document.createElement('canvas');
// ... manual styling, positioning, z-index management
// ... manual renderer creation with error handling
// ... manual render loop coordination
// ... manual resize handling
```

**After (HybridRenderer):**
```javascript
// ~10 lines with HybridRenderer
const hybridRenderer = new HybridRenderer();
await hybridRenderer.initialize(container, { width: 1080, height: 1920 });

const scene = hybridRenderer.getThreeScene();
const pixiStage = hybridRenderer.getPixiStage();

hybridRenderer.start();
```

**Savings:**
- **~90% less code**
- **Automatic error handling**
- **Built-in resize support**
- **Optimized render loop**
- **Memory management**
- **TypeScript types**

## Examples

See complete working examples:
- **Simple 2D Menu:** `/demo-archero-simple.html` (~100 lines)
- **Hybrid 3D + 2D:** `/demo-archero-hybrid.html` (~200 lines)
- **Vanilla Reference:** `/demo-archero-3d.html` (800+ lines, legacy)

## Further Reading

- [Mixing Three.js and Pixi.js Best Practices](./rendering-2d-3d-hybrid.md)
- [3D Demo Architecture](../components/3d-demo-architecture.md)
- [ArcheroMenu Guide](../ui/archero-menu-guide.md)

## Support

For issues or questions:
- GitHub: [gamebyte-framework/issues](https://github.com/your-org/gamebyte-framework/issues)
- Docs: [Full Documentation](../../README.md)
