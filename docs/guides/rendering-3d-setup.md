# 3D Rendering in GameByte Framework

<!-- keywords: rendering, 3d, three.js, setup, initialization, scene, camera -->

## Live Example

<div style="border: 1px solid #333; border-radius: 8px; overflow: hidden; margin: 20px 0;">
  <iframe src="../examples/3d-rendering-example.html" width="100%" height="500" style="border: none;"></iframe>
</div>

> **Interactive Demo**: Rotating 3D objects with lighting using Three.js + GameByte Framework. The scene includes a main cube and orbiting torus objects with physics-based materials.

## Overview

GameByte Framework supports 3D rendering through **direct Three.js API usage**, not through the graphics abstraction layer. This is an intentional architectural decision.

## Architecture Decision

### Graphics Abstraction Layer = 2D Only

The graphics abstraction layer (`graphics()`, `GraphicsEngine`, `IGraphics`, etc.) is **intentionally limited to 2D rendering** with Pixi.js for these reasons:

1. **UI Component Focus**: The abstraction is designed for UI components (buttons, panels, text) which are primarily 2D
2. **3D Complexity**: 3D rendering with Three.js involves scene graphs, cameras, lights - a fundamentally different paradigm from 2D UI
3. **Bundle Size**: Avoiding Three.js JSM dependencies in UMD keeps the main bundle smaller and faster
4. **Use Case Separation**:
   - **2D games**: Use graphics abstraction for renderer-independent UI
   - **3D games**: Use ThreeRenderer with direct THREE API calls

This is a **feature, not a limitation** - it provides:
- ✅ Cleaner architecture
- ✅ Smaller UMD bundles
- ✅ Proper separation of concerns
- ✅ No runtime/build-time dependency issues

## How to Use 3D Rendering

### UMD Build Approach

When using the UMD build (`dist/gamebyte.umd.js`), follow this pattern:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>My 3D Game</title>
</head>
<body>
    <div id="game-container"></div>

    <!-- 1. Load Three.js from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>

    <!-- 2. Load GameByte UMD Build -->
    <script src="./dist/gamebyte.umd.js"></script>

    <script>
        async function initGame() {
            // 3. Create GameByte instance
            const game = GameByteFramework.createGame();

            // 4. Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            document.getElementById('game-container').appendChild(canvas);

            // 5. Initialize with 3D renderer
            await game.initialize(canvas, '3d');

            // 6. Get renderer
            const renderer = game.make('renderer');

            // 7. Create THREE.js scene directly
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1a1a2e);

            // 8. Create camera
            const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
            camera.position.z = 5;

            // 9. Add lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);

            // 10. Create 3D objects using THREE.js API
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshPhongMaterial({
                color: 0x4ecca3,
                emissive: 0x1a3a5e,
                shininess: 100
            });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            // 11. Set scene and camera on GameByte renderer
            renderer.setScene(scene);
            renderer.setCamera(camera);

            // 12. Add game loop logic
            renderer.on('tick', (deltaTime) => {
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                // Renderer automatically renders scene and camera
            });

            // 13. Start game loop
            game.start();
        }

        window.addEventListener('load', initGame);
    </script>
</body>
</html>
```

### ESM/CJS Import Approach

When using ES modules or CommonJS, you can import directly:

```typescript
import { createGame } from 'gamebyte-framework';
import * as THREE from 'three';

async function initGame() {
    const game = createGame();

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    await game.initialize(canvas, '3d');

    const renderer = game.make('renderer');

    // Use THREE.js API directly
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    // ... rest of setup
}
```

## Key Points

### ✅ What Works

- ✅ **ThreeRenderer**: Full 3D rendering support via `game.initialize(canvas, '3d')`
- ✅ **Direct THREE.js API**: Use all Three.js features directly
- ✅ **Scene Management**: GameByte provides scene lifecycle, you provide THREE.Scene
- ✅ **Game Loop Integration**: Renderer handles the game loop, you handle scene updates
- ✅ **Performance**: No abstraction overhead for 3D rendering

### ❌ What Doesn't Work (By Design)

- ❌ **Graphics Abstraction for 3D**: `graphics()` is 2D-only
- ❌ **BaseScene3D in UMD**: Not exported to avoid THREE.js bundling
- ❌ **ThreeGraphicsFactory in UMD**: CSS2DRenderer not bundled in main UMD

### 💡 Use ESM/CJS for Advanced 3D Features

If you need `BaseScene3D` or `ThreeGraphicsFactory`, use ESM or CJS imports:

```typescript
import { BaseScene3D } from 'gamebyte-framework/dist/scenes/BaseScene';
import { ThreeGraphicsFactory } from 'gamebyte-framework/dist/graphics/ThreeGraphicsFactory';
```

## Why This Approach?

### Problem We Solved

Initial attempts to include 3D support in the UMD bundle caused:

1. **CSS2DRenderer bundling issues**: JSM modules being included in UMD
2. **Module load-time errors**: `Class extends value undefined`
3. **Broken demos**: UMD bundle throwing errors before exports were assigned
4. **Large bundle size**: Three.js code being bundled unnecessarily

### Solution Benefits

By separating 3D from the UMD bundle:

1. ✅ **Clean UMD bundle**: Only 2D dependencies, no THREE.js code
2. ✅ **Smaller size**: Main bundle stays lightweight
3. ✅ **No conflicts**: THREE.js loaded separately from CDN
4. ✅ **Full flexibility**: Use any THREE.js version you want
5. ✅ **Better debugging**: Clear separation between framework and rendering engine

## Examples

See working examples in the project:

- **test-3d-simple.html**: Basic 3D cube with rotation
- **test-ui-modern.html**: 2D UI components with graphics abstraction
- **test-ui-umd.html**: Complex 2D UI system with TopBar

## Troubleshooting

### Error: "3D renderer not available in main bundle"

This means you're trying to use `RendererFactory.create(RenderingMode.RENDERER_3D)` in UMD.

**Solution**: Use `game.initialize(canvas, '3d')` instead, which handles 3D renderer creation correctly.

### Error: "BaseScene3D is not exported"

BaseScene3D is not available in UMD builds.

**Solution**:
- Use ESM/CJS imports: `import { BaseScene3D } from 'gamebyte-framework/dist/scenes/BaseScene'`
- Or create your own scene class using `BaseScene` as template

### Error: "Cannot read properties of undefined (reading 'Object3D')"

This means CSS2DRenderer was bundled incorrectly (shouldn't happen after our fixes).

**Solution**: Ensure you're using the latest build and loading THREE.js before GameByte UMD.

## Summary

- **2D games**: Use graphics abstraction (`graphics()`) for renderer-independent UI
- **3D games**: Use direct THREE.js API with GameByte's ThreeRenderer
- **UMD builds**: Load THREE.js from CDN, use direct API
- **ESM/CJS builds**: Import THREE.js, use direct API or BaseScene3D

This architecture provides the best of both worlds: clean abstractions where they make sense (2D UI), and full power where needed (3D rendering).
