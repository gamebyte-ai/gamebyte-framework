# 3D Demo Architecture (demo-archero-3d.html)

## Overview

The 3D demo (`demo-archero-3d.html`) uses a **hybrid rendering architecture** that combines **Three.js for 3D background** and **Pixi.js for 2D UI overlay**. Both frameworks work together seamlessly using a **stacked canvas approach**.

## Architecture: Stacked Canvas System

### Canvas Layers

The demo uses **two separate canvases** stacked on top of each other:

```html
<div id="game-container">
    <!-- Layer 1: 3D Background (Three.js) -->
    <canvas id="three-canvas" style="z-index: 1"></canvas>

    <!-- Layer 2: 2D UI Overlay (Pixi.js) -->
    <canvas id="pixi-canvas" style="z-index: 2; pointer-events: auto"></canvas>
</div>
```

### Layer Responsibilities

**Layer 1 - Three.js (z-index: 1)**
- Renders 3D background scene
- Rotating 3D objects per section
- Metallic materials and lighting
- Camera animations and transitions
- Background effects

**Layer 2 - Pixi.js (z-index: 2)**
- Renders 2D UI elements (Archero menu)
- Handles all touch/mouse interactions
- Transparent canvas background
- Overlays on top of 3D scene
- All menu interactions and animations

## Why Both Frameworks?

### Three.js Purpose
- **3D Scene Rendering**: Provides WebGL-based 3D rendering capabilities
- **Camera Control**: Smooth camera movements and perspective
- **3D Objects**: Rotating cubes, spheres, and other meshes
- **Lighting**: Point lights, ambient lights, shadows
- **Materials**: Metallic, standard materials with proper shading

### Pixi.js Purpose
- **2D UI System**: Efficient 2D rendering for UI elements
- **Interaction Handling**: Touch events, gestures, button clicks
- **Text Rendering**: High-quality text with stroke and shadows
- **Gradient Support**: Complex gradients for glossy buttons
- **Animation Integration**: Works seamlessly with GSAP

## Technical Implementation

### Canvas Setup

```javascript
// Three.js Canvas (3D Background)
const threeCanvas = document.createElement('canvas');
threeCanvas.id = 'three-canvas';
threeCanvas.style.position = 'absolute';
threeCanvas.style.zIndex = '1';

// Pixi.js Canvas (2D UI Overlay)
const pixiCanvas = document.createElement('canvas');
pixiCanvas.id = 'pixi-canvas';
pixiCanvas.style.position = 'absolute';
pixiCanvas.style.zIndex = '2';
pixiCanvas.style.pointerEvents = 'auto';
```

### Rendering Pipeline

```
User Interaction
       ↓
  Pixi.js Layer (2D UI)
       ↓
  Touch/Click Events
       ↓
Section Change Triggered
       ↓
  ┌──────────────┬──────────────┐
  ↓              ↓              ↓
Pixi.js         Three.js      Content
Animation       Camera        Updates
(Buttons)       Transition    (Data)
```

### Synchronization

Both renderers run in their own animation loops:

```javascript
// Three.js Animation Loop
function threeAnimate() {
    requestAnimationFrame(threeAnimate);

    // Update 3D objects
    updateRotatingObjects();

    // Render 3D scene
    threeRenderer.render(scene, camera);
}

// Pixi.js Animation Loop
function pixiAnimate(deltaTime) {
    // Update UI animations
    menu.update(deltaTime);

    // Render 2D UI
    pixiApp.renderer.render(pixiApp.stage);
}
```

## Benefits of This Architecture

### 1. **Separation of Concerns**
- 3D rendering logic isolated in Three.js
- 2D UI logic isolated in Pixi.js
- Each framework does what it does best

### 2. **Performance**
- Independent render loops
- Optimized for their respective tasks
- No overhead from hybrid frameworks

### 3. **Flexibility**
- Easy to update 3D scene without touching UI
- Easy to change UI without affecting 3D
- Can disable 3D layer for performance mode

### 4. **Transparent UI**
- Pixi.js canvas has transparent background
- 3D scene visible through UI gaps
- Creates immersive layered effect

### 5. **Mobile Optimized**
- Touch events only on UI layer
- 3D layer doesn't process interactions
- Efficient event handling

## Section-Specific 3D Objects

Each menu section displays unique 3D objects:

| Section | 3D Object | Color |
|---------|-----------|-------|
| Shop | Rotating Cube | Red |
| Gear | Rotating Torus | Purple |
| Campaign | Rotating Icosahedron | Yellow |
| Trophy | Rotating Octahedron | Green |
| Chest | Rotating Dodecahedron | Blue |

### Camera Transitions

When switching sections:
1. **Pixi.js**: Animates menu buttons (GSAP)
2. **Three.js**: Animates camera position
3. **Synchronized**: Both transitions happen simultaneously
4. **Duration**: ~0.5-0.7 seconds for smooth feel

## Code Organization

```
demo-archero-3d.html
├── Dependencies Loading
│   ├── Three.js (3D rendering)
│   ├── Pixi.js (2D rendering)
│   ├── GSAP (animations)
│   └── GameByte Framework (integration)
│
├── Three.js Setup
│   ├── Scene creation
│   ├── Camera setup
│   ├── Lighting configuration
│   ├── 3D objects per section
│   └── Animation loop
│
├── Pixi.js Setup
│   ├── Application initialization
│   ├── Archero menu creation
│   ├── Transparent canvas
│   └── Event handling
│
└── Synchronization
    ├── Section change events
    ├── Camera transitions
    └── Content updates
```

## Key Implementation Details

### 1. Transparent Pixi Canvas

```javascript
const pixiApp = new PIXI.Application({
    canvas: pixiCanvas,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    backgroundColor: 0x000000, // Black background
    backgroundAlpha: 0,        // Fully transparent
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
```

### 2. Three.js Scene Setup

```javascript
// Scene with dark background
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e1a);

// Camera with perspective
const camera = new THREE.PerspectiveCamera(
    75,
    BASE_WIDTH / BASE_HEIGHT,
    0.1,
    1000
);
camera.position.z = 5;
```

### 3. Section Change Coordination

```javascript
menu.on('section-changed', (index, section) => {
    // Update 3D scene
    transitionThreeScene(index);

    // Update content
    updateContentForSection(section);
});
```

## Performance Considerations

### Optimization Techniques

1. **3D Object Pooling**: Reuse geometries and materials
2. **Texture Caching**: Shared textures across objects
3. **Frustum Culling**: Only render visible 3D objects
4. **LOD (Level of Detail)**: Simpler models for distant objects
5. **Transparent Rendering**: Minimal overdraw on Pixi layer

### Mobile Optimization

- **60 FPS Target**: Both renderers optimized for mobile
- **Touch-Only Events**: No unnecessary mouse events
- **Simplified Shadows**: Reduced shadow quality on mobile
- **Particle Limits**: Fewer particles on low-end devices

## Use Cases

This architecture is ideal for:

1. **Mobile Games with 3D Backgrounds**: Rich 3D environments with 2D UI
2. **Menu Systems**: 3D visual flair with functional 2D controls
3. **Hybrid Experiences**: Games that blend 2D and 3D elements
4. **Cinematic Menus**: AAA-quality menu presentations

## Comparison to Alternatives

### Stacked Canvas (Current) vs Single Canvas

| Approach | Pros | Cons |
|----------|------|------|
| **Stacked Canvas** | Clean separation, optimized renderers, flexible | Two canvases to manage |
| **Single Canvas** | One render loop, simpler | Complex integration, performance trade-offs |

### Why We Chose Stacked Canvas

1. **Best of Both Worlds**: Each framework excels at its task
2. **Maintainability**: Clear boundaries between 3D and 2D code
3. **Performance**: Two specialized renderers > one hybrid
4. **Flexibility**: Easy to enable/disable 3D layer

## Extending the Architecture

### Adding More 3D Elements

```javascript
// Add new 3D object for custom section
const customGeometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
const customMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF6B6B,
    metalness: 0.8,
    roughness: 0.2
});
const customMesh = new THREE.Mesh(customGeometry, customMaterial);
scene.add(customMesh);
```

### Adding UI Effects

```javascript
// Add Pixi.js particle effects
const particleContainer = new PIXI.Container();
pixiApp.stage.addChild(particleContainer);
```

## Best Practices

1. **Keep Layers Separate**: Don't mix Three.js and Pixi.js rendering
2. **Transparent Background**: Always use transparent Pixi canvas
3. **Z-Index Management**: Ensure correct stacking order
4. **Event Handling**: Only UI layer should handle interactions
5. **Synchronized Updates**: Coordinate animations between layers

## Conclusion

The stacked canvas architecture provides a robust, performant solution for hybrid 2D/3D games. By leveraging **Three.js for 3D rendering** and **Pixi.js for 2D UI**, we achieve:

- Professional AAA-quality visuals
- Optimal performance on mobile devices
- Clean, maintainable code architecture
- Flexibility for future enhancements

This architecture is production-ready and scalable for complex game UIs.
