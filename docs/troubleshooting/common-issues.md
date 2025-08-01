# Common Issues and Solutions

This guide covers the most frequently encountered issues when developing with GameByte Framework and provides practical solutions.

## Installation Issues

### NPM Installation Fails

**Problem:** `npm install @gamebyte/framework` fails with peer dependency warnings or errors.

**Solutions:**

1. **Install peer dependencies first:**
```bash
npm install pixi.js three matter-js cannon-es
npm install @gamebyte/framework
```

2. **Use legacy peer deps flag:**
```bash
npm install --legacy-peer-deps @gamebyte/framework
```

3. **Clear npm cache:**
```bash
npm cache clean --force
npm install
```

### TypeScript Compilation Errors

**Problem:** TypeScript errors about missing type definitions.

**Solutions:**

1. **Install type definitions:**
```bash
npm install -D @types/three @types/matter-js
```

2. **Update tsconfig.json:**
```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

3. **Add type declarations:**
```typescript
// types/global.d.ts
declare module '*.png';
declare module '*.jpg'; 
declare module '*.mp3';
declare module '*.wav';
```

## Framework Initialization Issues

### Canvas Not Found Error

**Problem:** `Cannot read property 'getContext' of null` or similar canvas errors.

**Solutions:**

1. **Ensure canvas exists in DOM:**
```html
<canvas id="game-canvas"></canvas>
```

2. **Wait for DOM to load:**
```typescript
// Wait for DOM
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  await app.initialize(canvas, RenderingMode.PIXI_2D);
});

// Or check if canvas exists
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}
```

3. **Check canvas ID matches:**
```typescript
// Make sure IDs match exactly
const canvas = document.getElementById('game-canvas'); // ID must match HTML
```

### WebGL Context Creation Failed

**Problem:** WebGL context cannot be created, falling back to Canvas 2D.

**Solutions:**

1. **Enable hardware acceleration in browser settings**

2. **Check WebGL support:**
```typescript
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

if (!checkWebGLSupport()) {
  console.warn('WebGL not supported, using fallback renderer');
}
```

3. **Use WebGL2 fallback:**
```typescript
await app.initialize(canvas, RenderingMode.PIXI_2D, {
  forceCanvas: !checkWebGLSupport(),
  powerPreference: 'high-performance'
});
```

### Service Provider Registration Errors

**Problem:** Services not found or "Service not bound" errors.

**Solutions:**

1. **Register providers before boot:**
```typescript
// Correct order
app.register(new MyServiceProvider());
await app.boot(); // Boot after all providers registered
await app.initialize(canvas, mode);
```

2. **Check service names:**
```typescript
// Make sure service names match
app.bind('my.service', () => new MyService());
const service = app.make('my.service'); // Same name
```

3. **Use singleton for stateful services:**
```typescript
// Use singleton for services that maintain state
app.singleton('game.state', () => new GameStateManager());
```

## Performance Issues

### Low Frame Rate (FPS)

**Problem:** Game running below target frame rate.

**Solutions:**

1. **Enable performance monitoring:**
```typescript
import { Performance } from '@gamebyte/framework';

Performance.enableDebugOverlay(true);
const stats = Performance.getStats();
console.log('FPS:', stats.fps);
console.log('Draw calls:', stats.drawCalls);
```

2. **Reduce rendering quality:**
```typescript
// Auto-adjust quality based on performance
Performance.enableAdaptiveQuality(true);
Performance.setTargetFPS(60);

// Manual quality adjustment
Renderer.setQualityLevel(0.8); // 80% quality
```

3. **Optimize object count:**
```typescript
// Use object pooling
class EntityPool {
  private pool: Entity[] = [];
  
  get(): Entity {
    return this.pool.pop() || new Entity();
  }
  
  release(entity: Entity): void {
    entity.reset();
    this.pool.push(entity);
  }
}
```

4. **Enable culling:**
```typescript
// Don't render off-screen objects
Renderer.enableCulling(true);
Renderer.setCullingBounds(screenBounds);
```

### Memory Leaks

**Problem:** Memory usage continuously increases.

**Solutions:**

1. **Properly destroy objects:**
```typescript
class GameScene implements Scene {
  destroy(): void {
    // Remove from parent
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    
    // Clear references
    this.sprite = null;
    this.entities.length = 0;
    
    // Remove event listeners
    this.removeAllListeners();
  }
}
```

2. **Use weak references for callbacks:**
```typescript
// Avoid strong references in callbacks
class Player {
  private boundUpdate = this.update.bind(this);
  
  start(): void {
    app.on('update', this.boundUpdate);
  }
  
  destroy(): void {
    app.off('update', this.boundUpdate);
  }
}
```

3. **Monitor memory usage:**
```typescript
// Check memory periodically
setInterval(() => {
  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1048576; // MB
    console.log('Memory usage:', used.toFixed(2), 'MB');
    
    if (used > 100) { // Alert if over 100MB
      console.warn('High memory usage detected');
    }
  }
}, 5000);
```

## Physics Issues

### Bodies Not Colliding

**Problem:** Physics bodies pass through each other.

**Solutions:**

1. **Check collision groups and masks:**
```typescript
const COLLISION_GROUPS = {
  PLAYER: 1,
  ENEMY: 2,
  ENVIRONMENT: 4
};

const player = Physics.createBody({
  collisionGroup: COLLISION_GROUPS.PLAYER,
  collisionMask: COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.ENVIRONMENT
});
```

2. **Ensure proper body types:**
```typescript
// Static bodies don't move
const ground = Physics.createBody({
  type: 'static', // Won't move
  position: { x: 0, y: 10 }
});

// Dynamic bodies are affected by forces
const player = Physics.createBody({
  type: 'dynamic', // Can move
  position: { x: 0, y: 0 }
});
```

3. **Check physics timestep:**
```typescript
// Smaller timestep for better collision detection
Physics.setFixedTimeStep(1/120); // 120 FPS physics
Physics.setMaxSubSteps(8);
```

### Unstable Physics Simulation

**Problem:** Objects jitter, bounce uncontrollably, or behave erratically.

**Solutions:**

1. **Adjust physics settings:**
```typescript
const world = Physics.createWorld({
  gravity: { x: 0, y: 9.82 }, // Reasonable gravity
  allowSleep: true, // Let inactive bodies sleep
  enableCCD: true // Continuous collision detection
});
```

2. **Use appropriate damping:**
```typescript
const body = Physics.createBody({
  type: 'dynamic',
  linearDamping: 0.1,  // Reduces linear velocity over time
  angularDamping: 0.1  // Reduces rotation over time
});
```

3. **Limit velocities:**
```typescript
// Clamp velocities to prevent instability
function limitVelocity(body: PhysicsBody, maxSpeed: number): void {
  const vel = body.velocity;
  const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
  
  if (speed > maxSpeed) {
    body.velocity = {
      x: (vel.x / speed) * maxSpeed,
      y: (vel.y / speed) * maxSpeed
    };
  }
}
```

## Asset Loading Issues

### Assets Not Loading

**Problem:** Images, sounds, or other assets fail to load.

**Solutions:**

1. **Check file paths:**
```typescript
// Use absolute paths or proper relative paths
await Assets.load('/assets/player.png'); // Absolute
await Assets.load('./assets/player.png'); // Relative to current file
```

2. **Verify CORS settings:**
```typescript
// For cross-origin assets
Assets.configure({
  crossOrigin: 'anonymous'
});
```

3. **Add error handling:**
```typescript
try {
  await Assets.load('player.png');
} catch (error) {
  console.error('Failed to load asset:', error);
  // Load fallback asset or show error message
  await Assets.load('fallback-player.png');
}
```

4. **Check network tab in browser dev tools** to see actual HTTP requests and responses.

### Slow Asset Loading

**Problem:** Assets take too long to load.

**Solutions:**

1. **Preload critical assets:**
```typescript
// Load essential assets first
await Assets.loadCritical(['player.png', 'ui.json']);

// Show loading screen
Scenes.switchTo('loading');

// Load remaining assets in background
Assets.loadBackground(['music.mp3', 'environment.png'])
  .then(() => Scenes.switchTo('menu'));
```

2. **Use asset compression:**
```typescript
// Use appropriate formats
const config = {
  images: 'webp', // Smaller than PNG
  audio: 'ogg',   // Smaller than WAV
  compress: true
};
```

3. **Implement progressive loading:**
```typescript
// Load assets by priority
const priorities = [
  ['critical.png', 'essential.json'], // Priority 1
  ['gameplay.png', 'sounds.ogg'],     // Priority 2
  ['extras.png', 'music.mp3']         // Priority 3
];

for (const batch of priorities) {
  await Assets.loadBatch(batch);
  updateLoadingProgress();
}
```

## Audio Issues

### No Sound Playing

**Problem:** Audio files not playing or no sound output.

**Solutions:**

1. **Check browser autoplay policy:**
```typescript
// Wait for user interaction before playing audio
let audioUnlocked = false;

document.addEventListener('click', () => {
  if (!audioUnlocked) {
    Audio.unlock(); // Unlock audio context
    audioUnlocked = true;
  }
});
```

2. **Verify audio format support:**
```typescript
// Check format support
const canPlayMP3 = Audio.canPlayType('audio/mpeg');
const canPlayOGG = Audio.canPlayType('audio/ogg');

// Use appropriate format
const audioFile = canPlayOGG ? 'sound.ogg' : 'sound.mp3';
```

3. **Initialize audio system:**
```typescript
// Ensure audio is initialized
await Audio.initialize({
  masterVolume: 1.0,
  audioContext: new AudioContext()
});
```

### Audio Stuttering or Crackling

**Problem:** Audio playback is choppy or distorted.

**Solutions:**

1. **Adjust buffer size:**
```typescript
Audio.configure({
  bufferSize: 4096, // Larger buffer for stability
  sampleRate: 44100
});
```

2. **Use audio pooling:**
```typescript
// Pool audio sources for frequent sounds
const audioPool = Audio.createSoundPool('laser.wav', 10);
audioPool.play(); // Reuses pooled instances
```

3. **Reduce audio quality on low-end devices:**
```typescript
if (Performance.getDeviceTier() === 'low') {
  Audio.setQuality('low');
  Audio.setMaxConcurrentSounds(4);
}
```

## Mobile-Specific Issues

### Touch Controls Not Working

**Problem:** Touch input not registering on mobile devices.

**Solutions:**

1. **Add touch event listeners:**
```typescript
// Ensure touch events are handled
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
```

2. **Prevent default touch behavior:**
```css
/* CSS */
#game-canvas {
  touch-action: none; /* Prevent scrolling */
}
```

```typescript
// JavaScript
function handleTouchStart(event: TouchEvent): void {
  event.preventDefault(); // Prevent default behavior
  // Handle touch input
}
```

3. **Use virtual controls:**
```typescript
// Create touch-friendly controls
const joystick = Input.createVirtualJoystick({
  size: 80,
  position: { x: 100, y: 400 },
  deadZone: 0.2
});
```

### Performance Issues on Mobile

**Problem:** Game runs slowly on mobile devices.

**Solutions:**

1. **Enable mobile optimizations:**
```typescript
// Auto-detect device capabilities
const deviceTier = Performance.getDeviceTier();

if (deviceTier === 'low') {
  Renderer.setQualityLevel(0.5);
  Physics.setUpdateRate(30);
  Audio.setMaxConcurrentSounds(2);
}
```

2. **Reduce particle count:**
```typescript
// Limit particles on mobile
const maxParticles = Platform.isMobile() ? 50 : 200;
const particleSystem = new ParticleSystem({ maxParticles });
```

3. **Use texture atlases:**
```typescript
// Combine multiple textures to reduce draw calls
await Assets.loadAtlas('game-sprites.json');
const sprite = new PIXI.Sprite(atlas.textures['player.png']);
```

## Debug Tools and Monitoring

### Enable Debug Mode

```typescript
// Enable comprehensive debugging
if (process.env.NODE_ENV === 'development') {
  // Framework debug mode
  app.setDebugMode(true);
  
  // Performance overlay
  Performance.showDebugOverlay(true);
  
  // Physics debug renderer
  Physics.enableDebugRenderer(true);
  
  // Audio debug info
  Audio.enableDebugMode(true);
  
  // Input debug visualization
  Input.showDebugOverlay(true);
}
```

### Performance Monitoring

```typescript
// Set up performance monitoring
const monitor = Performance.createMonitor({
  targetFPS: 60,
  alertThreshold: 0.8, // Alert if FPS drops below 80% of target
  memoryThreshold: 100 // Alert if memory usage exceeds 100MB
});

monitor.on('fps-drop', (currentFPS) => {
  console.warn('FPS dropped to:', currentFPS);
  Performance.enablePerformanceMode(true);
});

monitor.on('memory-high', (memoryUsage) => {
  console.warn('High memory usage:', memoryUsage, 'MB');
  // Trigger garbage collection or reduce quality
});
```

### Error Logging

```typescript
// Set up comprehensive error logging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to logging service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Send to logging service
});

// Framework error handling
app.on('error', (error, context) => {
  console.error(`Framework error in ${context}:`, error);
  // Attempt recovery or show user-friendly message
});
```

## Getting Additional Help

### Community Resources

1. **GitHub Issues**: [Report bugs](https://github.com/gamebyte/framework/issues)
2. **Discord Community**: [Join discussion](https://discord.gg/gamebyte)
3. **Documentation**: [Complete docs](https://docs.gamebyte.dev)
4. **Stack Overflow**: Tag questions with `gamebyte-framework`

### Debug Information to Include

When reporting issues, include:

```typescript
// Collect debug information
const debugInfo = {
  framework: GameByte.VERSION,
  userAgent: navigator.userAgent,
  webglSupport: checkWebGLSupport(),
  deviceTier: Performance.getDeviceTier(),
  memoryInfo: performance.memory ? {
    used: performance.memory.usedJSHeapSize,
    total: performance.memory.totalJSHeapSize,
    limit: performance.memory.jsHeapSizeLimit
  } : null,
  performanceStats: Performance.getStats(),
  console: 'Check browser console for error messages'
};

console.log('Debug Info:', debugInfo);
```

Remember: Most issues can be resolved by checking the browser console for error messages and following the solutions provided above. If you're still stuck, don't hesitate to reach out to the community for help!