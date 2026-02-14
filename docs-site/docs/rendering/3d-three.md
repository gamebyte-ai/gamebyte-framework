---
id: 3d-three
title: 3D Rendering (Three.js)
description: 3D game rendering with Three.js
sidebar_position: 3
keywords: [3d, three.js, mesh, geometry, materials, lighting]
llm_summary: "Three.js renderer. Get scene: renderer.getScene(). Create mesh: new THREE.Mesh(geometry, material). Add lights for visibility. Use OrbitControls for camera."
---

<!-- llm-context: 3d-rendering, three-js, mesh, geometry, material, lighting, camera, webgl -->

import LiveDemo from '@site/src/components/LiveDemo';

# 3D Rendering (Three.js)

GameByte uses Three.js for 3D game rendering with WebGL/WebGPU support.

## Basic Setup

```typescript
import { createGame } from '@gamebyte/framework';
import * as THREE from 'three';

const game = createGame();
await game.initialize(canvas, '3d');

const renderer = game.make('renderer');
const scene = renderer.getScene();
const camera = renderer.getCamera();
```

## Creating Meshes

### Basic Geometries

```typescript
// Box
const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
);
scene.add(box);

// Sphere
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x2196F3 })
);
sphere.position.set(2, 0, 0);
scene.add(sphere);

// Plane (ground)
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
scene.add(ground);
```

<LiveDemo
  src="/demos/3d-basic-shapes.html"
  height={400}
  title="3D Basic Shapes"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Materials

### Standard Material (PBR)

```typescript
const material = new THREE.MeshStandardMaterial({
    color: 0x4CAF50,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x222222,
    emissiveIntensity: 0.2
});
```

### Physical Material (Advanced PBR)

```typescript
const material = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0,
    roughness: 0,
    transmission: 0.9, // Glass-like
    thickness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0
});
```

### Basic Material (No Lighting)

```typescript
// Unlit, always visible
const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: false
});
```

## Lighting

**Important:** 3D scenes need lights to be visible!

```typescript
// Ambient light (base illumination)
const ambient = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambient);

// Directional light (sun-like)
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(5, 10, 5);
directional.castShadow = true;
scene.add(directional);

// Point light (bulb-like)
const point = new THREE.PointLight(0xff6600, 1, 10);
point.position.set(0, 3, 0);
scene.add(point);

// Spot light (flashlight-like)
const spot = new THREE.SpotLight(0xffffff, 1);
spot.position.set(0, 5, 0);
spot.angle = Math.PI / 6;
spot.castShadow = true;
scene.add(spot);
```

## Shadows

```typescript
// Enable shadows on renderer
const threeRenderer = renderer.getThreeRenderer();
threeRenderer.shadowMap.enabled = true;
threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Light casts shadows
directional.castShadow = true;
directional.shadow.mapSize.width = 1024;
directional.shadow.mapSize.height = 1024;

// Mesh casts shadow
mesh.castShadow = true;

// Ground receives shadow
ground.receiveShadow = true;
```

## Camera

### Perspective Camera

```typescript
const camera = new THREE.PerspectiveCamera(
    75,                    // FOV
    width / height,        // Aspect ratio
    0.1,                   // Near plane
    1000                   // Far plane
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);
```

### Camera Controls

```typescript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 20;
controls.minDistance = 2;

// Update in game loop
function update(deltaTime: number) {
    controls.update();
}
```

## Loading 3D Models

### GLTF/GLB Models

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();

loader.load('assets/character.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5);
    scene.add(model);

    // Access animations
    const mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
});
```

### With GameByte Assets

```typescript
import { Assets } from '@gamebyte/framework';

await Assets.load([
    { key: 'character', url: 'assets/character.glb', type: 'model' }
]);

const model = Assets.get('character');
scene.add(model.scene.clone());
```

## Post-Processing

```typescript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const composer = new EffectComposer(threeRenderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.5,  // strength
    0.4,  // radius
    0.85  // threshold
));

// Use composer instead of renderer
function render() {
    composer.render();
}
```

<LiveDemo
  src="/demos/3d-post-processing.html"
  height={400}
  title="Post-Processing Effects"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Animation

### Using AnimationMixer

```typescript
const mixer = new THREE.AnimationMixer(model);
const action = mixer.clipAction(animation);

action.play();
action.setLoop(THREE.LoopRepeat, Infinity);
action.timeScale = 1.5; // Speed up

// Update in game loop
function update(deltaTime: number) {
    mixer.update(deltaTime);
}
```

### Tween Animation

```typescript
import { gsap } from 'gsap';

// Animate position
gsap.to(mesh.position, {
    x: 5,
    y: 2,
    duration: 2,
    ease: 'power2.inOut'
});

// Animate rotation
gsap.to(mesh.rotation, {
    y: Math.PI * 2,
    duration: 3,
    repeat: -1,
    ease: 'none'
});
```

## Performance Tips

### 1. Use InstancedMesh for Many Similar Objects

```typescript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000);

const matrix = new THREE.Matrix4();
for (let i = 0; i < 1000; i++) {
    matrix.setPosition(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);
    instancedMesh.setMatrixAt(i, matrix);
}

scene.add(instancedMesh);
```

### 2. Level of Detail (LOD)

```typescript
const lod = new THREE.LOD();

lod.addLevel(highDetailMesh, 0);    // Close
lod.addLevel(mediumDetailMesh, 20); // Medium distance
lod.addLevel(lowDetailMesh, 50);    // Far

scene.add(lod);
```

### 3. Frustum Culling

```typescript
// Enabled by default
mesh.frustumCulled = true;

// Disable for always-visible objects
skybox.frustumCulled = false;
```

## More 3D Demos

### Camera Controls

<LiveDemo src="/demos/3d-camera-demo.html" height="400" title="3D Camera Controls Demo" />

### Pathfinding in 3D

<LiveDemo src="/demos/three-pathfinder-demo.html" height="400" title="3D Pathfinding Demo" />
