# Rendering System Overview

GameByte Framework provides a unified rendering system that seamlessly integrates 2D (Pixi.js) and 3D (Three.js) rendering engines. This system is designed for mobile-first game development with performance optimization and easy switching between rendering modes.

## Architecture

The rendering system follows a unified API pattern that abstracts the underlying rendering engines:

```typescript
import { Renderer, RenderingMode } from '@gamebyte/framework';

// Initialize 2D rendering
await Renderer.initialize(canvas, RenderingMode.PIXI_2D, {
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb
});

// Or initialize 3D rendering
await Renderer.initialize(canvas, RenderingMode.THREE_3D, {
  width: 800,
  height: 600,
  antialias: true
});
```

## Supported Rendering Modes

### 1. PIXI_2D Mode
- **Engine**: Pixi.js v7+
- **Use Cases**: 2D games, UI-heavy games, mobile casual games
- **Features**: Sprites, graphics, text, filters, particle systems
- **Performance**: Optimized for mobile devices with WebGL batching

### 2. THREE_3D Mode
- **Engine**: Three.js v0.150+
- **Use Cases**: 3D games, racing games, first-person experiences
- **Features**: Meshes, materials, lighting, shadows, post-processing
- **Performance**: Mobile-optimized with automatic LOD and culling

### 3. HYBRID Mode (Coming Soon)
- **Engines**: Pixi.js + Three.js
- **Use Cases**: 2.5D games, games with 3D backgrounds and 2D UI
- **Features**: Combines both rendering engines in a single viewport

## Quick Start Examples

### 2D Sprite Rendering

```typescript
import { Renderer, Assets } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

// Initialize 2D renderer
await Renderer.initialize(canvas, RenderingMode.PIXI_2D);

// Get Pixi application
const app = Renderer.getPixiApp();

// Load and create sprite
await Assets.load('player-sprite.png');
const playerSprite = new PIXI.Sprite(Assets.get('player-sprite.png'));
playerSprite.x = 100;
playerSprite.y = 100;

// Add to stage
app.stage.addChild(playerSprite);

// Start rendering
Renderer.start();
```

### 3D Mesh Rendering

```typescript
import { Renderer } from '@gamebyte/framework';
import * as THREE from 'three';

// Initialize 3D renderer
await Renderer.initialize(canvas, RenderingMode.THREE_3D);

// Get Three.js scene and renderer
const scene = Renderer.getThreeScene();
const camera = Renderer.getThreeCamera();

// Create a cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);

// Add to scene
scene.add(cube);

// Position camera
camera.position.z = 5;

// Start rendering
Renderer.start();
```

## Rendering Features

### Mobile Optimization
- **Automatic Device Detection**: Adjusts quality based on device capabilities
- **Performance Scaling**: Dynamic quality adjustment to maintain target FPS
- **Battery Optimization**: Reduces rendering load when device is low on battery
- **Thermal Management**: Prevents device overheating

### Cross-Platform Support
- **WebGL Fallback**: Automatic fallback to Canvas 2D on older devices
- **Browser Compatibility**: Supports all modern browsers
- **PWA Ready**: Works seamlessly in Progressive Web Apps
- **Mobile Browsers**: Optimized for mobile Safari and Chrome

### Advanced Features
- **Post-Processing**: Built-in effects like bloom, blur, and color correction
- **Particle Systems**: High-performance particle rendering
- **Animation Support**: Timeline-based animations and tweening
- **Multi-Camera**: Support for multiple cameras and viewports

## Performance Features

### Automatic Optimization
```typescript
// Enable mobile optimizations
Renderer.enableMobileOptimizations();

// Configure performance settings
Renderer.setPerformanceTarget(60); // Target 60 FPS
Renderer.enableAdaptiveQuality(true);
Renderer.enableBatteryOptimization(true);
```

### Manual Performance Control
```typescript
// Get performance metrics
const stats = Renderer.getPerformanceStats();
console.log('FPS:', stats.fps);
console.log('Draw calls:', stats.drawCalls);
console.log('Triangles:', stats.triangles);

// Adjust quality manually
Renderer.setQualityLevel(0.8); // 80% quality
Renderer.enableCulling(true);
Renderer.setLODDistance(100);
```

## Rendering Pipeline

### Frame Lifecycle
1. **Update Phase**: Scene objects update their properties
2. **Culling Phase**: Determine which objects are visible
3. **Sorting Phase**: Sort objects by depth/material
4. **Render Phase**: Render visible objects to the canvas
5. **Post-Process Phase**: Apply post-processing effects

### Custom Render Loop
```typescript
// Custom render loop with performance monitoring
class CustomRenderer {
  private lastTime = 0;
  
  render(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update game objects
    this.updateGameObjects(deltaTime);
    
    // Render frame
    Renderer.renderFrame();
    
    // Request next frame
    requestAnimationFrame((time) => this.render(time));
  }
}
```

## Integration with Other Systems

### Physics Integration
```typescript
import { Physics, Renderer } from '@gamebyte/framework';

// Sync rendering with physics
Physics.on('step', () => {
  // Update sprite positions from physics bodies
  gameObjects.forEach(obj => {
    obj.sprite.x = obj.physicsBody.position.x * PIXELS_PER_METER;
    obj.sprite.y = obj.physicsBody.position.y * PIXELS_PER_METER;
  });
});
```

### Audio Integration
```typescript
import { Audio, Renderer } from '@gamebyte/framework';

// Position audio based on camera
const camera = Renderer.getThreeCamera();
Audio.setListenerPosition(camera.position);
Audio.setListenerOrientation(camera.rotation);
```

### UI Integration
```typescript
import { UI, Renderer } from '@gamebyte/framework';

// Create UI overlay
const hudContainer = UI.createContainer();
const app = Renderer.getPixiApp();
app.stage.addChild(hudContainer);

// UI elements stay on top of game content
hudContainer.zIndex = 1000;
```

## Error Handling and Debugging

### WebGL Context Loss Recovery
```typescript
// Automatic context loss recovery
Renderer.on('context-lost', () => {
  console.warn('WebGL context lost, attempting recovery...');
});

Renderer.on('context-restored', () => {
  console.log('WebGL context restored successfully');
  // Reload textures and shaders
  Assets.reloadAll();
});
```

### Debug Tools
```typescript
// Enable debug mode
Renderer.setDebugMode(true);

// Show performance overlay
Renderer.showPerformanceOverlay(true);

// Enable wireframe mode (3D)
Renderer.setWireframeMode(true);

// Show bounding boxes
Renderer.showBoundingBoxes(true);
```

## Best Practices

### 1. **Object Pooling**
Reuse objects to reduce garbage collection:
```typescript
class SpritePool {
  private pool: PIXI.Sprite[] = [];
  
  get(): PIXI.Sprite {
    return this.pool.pop() || new PIXI.Sprite();
  }
  
  release(sprite: PIXI.Sprite): void {
    sprite.visible = false;
    this.pool.push(sprite);
  }
}
```

### 2. **Batch Rendering**
Group similar objects for efficient rendering:
```typescript
// Use ParticleContainer for many similar objects
const particles = new PIXI.ParticleContainer(10000, {
  scale: true,
  position: true,
  rotation: true,
  alpha: true
});
```

### 3. **Texture Atlasing**
Combine multiple textures into atlases:
```typescript
// Load texture atlas
await Assets.load('game-atlas.json');
const atlas = Assets.get('game-atlas.json');

// Use atlas textures
const sprite = new PIXI.Sprite(atlas.textures['player-idle.png']);
```

### 4. **Level of Detail (LOD)**
Use different quality models based on distance:
```typescript
class LODMesh {
  update(cameraDistance: number): void {
    if (cameraDistance < 10) {
      this.mesh.geometry = this.highDetailGeometry;
    } else if (cameraDistance < 50) {
      this.mesh.geometry = this.mediumDetailGeometry;
    } else {
      this.mesh.geometry = this.lowDetailGeometry;
    }
  }
}
```

## Mobile-Specific Considerations

### Device Detection
```typescript
import { DeviceDetector } from '@gamebyte/framework';

const deviceInfo = DeviceDetector.getDeviceInfo();

// Adjust rendering settings based on device
if (deviceInfo.tier === 'low') {
  Renderer.setQualityLevel(0.5);
  Renderer.disablePostProcessing();
} else if (deviceInfo.tier === 'high') {
  Renderer.setQualityLevel(1.0);
  Renderer.enableAdvancedEffects();
}
```

### Touch Optimization
```typescript
// Optimize for touch interactions
Renderer.enableTouchOptimization();
Renderer.setTouchSampleRate(60); // Hz
Renderer.enableTouchPrediction(true);
```

### Battery Awareness
```typescript
// Respond to battery level changes
navigator.getBattery?.().then(battery => {
  battery.addEventListener('levelchange', () => {
    if (battery.level < 0.2) {
      Renderer.enableBatteryOptimization(true);
      Renderer.setQualityLevel(0.6);
    }
  });
});
```

## API Reference Summary

### Core Methods
```typescript
interface RendererFacade {
  initialize(canvas: HTMLCanvasElement, mode: RenderingMode, options?: any): Promise<void>;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  resize(width: number, height: number): void;
  destroy(): void;
  
  // Engine-specific getters
  getPixiApp(): PIXI.Application | null;
  getThreeRenderer(): THREE.WebGLRenderer | null;
  getThreeScene(): THREE.Scene | null;
  getThreeCamera(): THREE.Camera | null;
  
  // Performance
  getPerformanceStats(): PerformanceStats;
  setQualityLevel(level: number): void;
  enableMobileOptimizations(): void;
  
  // Debug
  setDebugMode(enabled: boolean): void;
  showPerformanceOverlay(show: boolean): void;
}
```

## What's Next?

- **[2D Rendering Guide](./2d-rendering.md)** - Deep dive into Pixi.js features
- **[3D Rendering Guide](./3d-rendering.md)** - Comprehensive Three.js integration
- **[Hybrid Mode](./hybrid-mode.md)** - Combining 2D and 3D rendering
- **[WebGL Optimization](./webgl-optimization.md)** - Advanced performance techniques
- **[Mobile Rendering](../mobile/performance-scaling.md)** - Mobile-specific optimizations

The rendering system provides the foundation for creating visually stunning games that perform well across all devices. Choose the rendering mode that best fits your game's needs and leverage the mobile optimizations for the best player experience.