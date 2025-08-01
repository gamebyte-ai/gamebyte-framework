/**
 * GameByte Framework - Input System Demo
 * 
 * This example demonstrates how to use the comprehensive input system
 * for mobile game development with virtual controls, gesture recognition,
 * and game-specific input handlers.
 */

import { createGame, initializeFacades, Input } from '../src/index';

// Create the game instance
const app = createGame();

// Initialize the framework
app.initialize({
  canvas: '#gameCanvas',
  width: 800,
  height: 600,
  backgroundColor: '#2c3e50'
});

// Initialize facades for static access
initializeFacades(app);

// === Basic Input Setup ===

// Initialize input system with the canvas
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (canvas) {
  Input.initialize(canvas);
}

// Set up platformer controls (automatically configures virtual controls for mobile)
Input.setupPlatformerControls();

// === Input Event Listeners ===

// Listen for specific actions
Input.onAction('jump', (data, source) => {
  console.log(`Jump action from ${source}:`, data);
  // Handle jump logic here
});

Input.onAction('move-left', (data, source) => {
  console.log(`Move left from ${source}`);
  // Handle left movement
});

Input.onAction('move-right', (data, source) => {
  console.log(`Move right from ${source}`);
  // Handle right movement
});

// Listen for camera controls
Input.onAction('camera-pan', (data) => {
  console.log('Camera pan:', data);
  // Handle camera panning
});

Input.onAction('camera-zoom', (data) => {
  console.log('Camera zoom:', data);
  // Handle camera zoom
});

// === Context Management ===

// Switch to gameplay context
Input.setContext('gameplay');

// Listen for context changes
Input.onContextChange((context) => {
  console.log(`Input context changed from ${context.previous} to ${context.current}`);
  
  // Adjust UI based on context
  switch (context.current) {
    case 'menu':
      Input.setVirtualControlsVisible(false);
      break;
    case 'gameplay':
      Input.setVirtualControlsVisible(Input.isMobile());
      break;
    case 'pause':
      // Keep controls visible but maybe reduce opacity
      break;
  }
});

// === Custom Virtual Controls ===

// Add a custom virtual control for mobile devices
if (Input.isMobile()) {
  // Add a pause button
  Input.addVirtualControl('pause-button', {
    type: 'button',
    position: { x: 20, y: 20 }, // Top-left corner
    size: { width: 50, height: 50 },
    visible: true,
    alpha: 0.8,
    action: 'pause'
  } as any);
  
  // Add an attack button
  Input.addVirtualControl('attack-button', {
    type: 'button',
    position: { x: window.innerWidth - 150, y: window.innerHeight - 80 },
    size: { width: 60, height: 60 },
    visible: true,
    alpha: 0.7,
    action: 'attack'
  } as any);
}

// === Game Loop Integration ===

let lastTime = 0;
let player = {
  x: 400,
  y: 300,
  vx: 0,
  vy: 0,
  onGround: false,
  speed: 200 // pixels per second
};

function gameLoop(currentTime: number) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Update player based on input
  updatePlayer(deltaTime);
  
  // Render game
  render();
  
  requestAnimationFrame(gameLoop);
}

function updatePlayer(deltaTime: number) {
  const dt = deltaTime / 1000; // Convert to seconds
  
  // Get movement vector from input system
  const movement = Input.getMovementVector();
  
  // Apply horizontal movement
  player.vx = movement.x * player.speed;
  
  // Handle jumping with platformer input handler
  if (Input.wasJumpJustPressed() && player.onGround) {
    player.vy = -500; // Jump velocity
    player.onGround = false;
    
    // Trigger haptic feedback on mobile
    if (Input.isMobile()) {
      Input.vibrate(50); // 50ms vibration
    }
  }
  
  // Apply gravity
  if (!player.onGround) {
    player.vy += 1000 * dt; // Gravity
  }
  
  // Update position
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  
  // Simple ground collision
  if (player.y > 500) {
    player.y = 500;
    player.vy = 0;
    player.onGround = true;
  }
  
  // Keep player in bounds
  player.x = Math.max(0, Math.min(player.x, 800));
}

function render() {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const ctx = canvas?.getContext('2d');
  
  if (!ctx) return;
  
  // Clear canvas
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, 800, 600);
  
  // Draw ground
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(0, 500, 800, 100);
  
  // Draw player
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(player.x - 15, player.y - 30, 30, 30);
  
  // Draw debug info
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '12px monospace';
  ctx.fillText(`Position: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, 20);
  ctx.fillText(`Velocity: (${Math.round(player.vx)}, ${Math.round(player.vy)})`, 10, 35);
  ctx.fillText(`Context: ${Input.getContext()}`, 10, 50);
  ctx.fillText(`Mobile: ${Input.isMobile()}`, 10, 65);
  
  // Display input debug info in development
  if (process.env.NODE_ENV === 'development') {
    const debugInfo = Input.getDebugInfo();
    const metrics = Input.getPerformanceMetrics();
    
    ctx.fillText(`FPS: ${metrics.frameRate.toFixed(1)}`, 10, 85);
    ctx.fillText(`Input Latency: ${metrics.averageLatency.toFixed(1)}ms`, 10, 100);
    ctx.fillText(`Events/s: ${metrics.inputEventsPerSecond}`, 10, 115);
  }
}

// === Advanced Features Demo ===

// Performance optimization
Input.setPerformanceMode('balanced');

// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  Input.enableDebugMode();
}

// Custom input mapping
Input.addInputMapping({
  context: 'gameplay',
  deviceType: 'keyboard',
  trigger: 'KeyR',
  action: 'reload'
});

// Listen for the custom action
Input.onAction('reload', () => {
  console.log('Reload action triggered!');
  // Reset player to starting position
  player.x = 400;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
});

// === Scene Integration Demo ===

// Simulated scene changes
let currentScene = 'menu';

function switchScene(sceneName: string) {
  currentScene = sceneName;
  
  switch (sceneName) {
    case 'menu':
      Input.setupMenuNavigation();
      console.log('Switched to menu - UI navigation enabled');
      break;
      
    case 'gameplay':
      Input.setupPlatformerControls();
      console.log('Switched to gameplay - platformer controls enabled');
      break;
      
    case 'pause':
      Input.setupPauseMenu();
      console.log('Switched to pause menu');
      break;
  }
}

// Keyboard shortcut to switch scenes for demo
Input.onAction('pause', () => {
  if (currentScene === 'gameplay') {
    switchScene('pause');
  } else if (currentScene === 'pause') {
    switchScene('gameplay');
  }
});

// === Mobile-Specific Features ===

// Handle orientation changes
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    // Update virtual controls layout
    Input.updateVirtualControlsLayout({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Reposition virtual controls for new orientation
    if (Input.isMobile()) {
      Input.updateVirtualControl('pause-button', {
        position: { x: 20, y: 20 }
      });
      
      Input.updateVirtualControl('attack-button', {
        position: { x: window.innerWidth - 150, y: window.innerHeight - 80 }
      });
    }
  }, 100);
});

// Battery optimization
if ('getBattery' in navigator) {
  (navigator as any).getBattery().then((battery: any) => {
    if (battery.level < 0.2) {
      // Low battery - optimize for battery life
      Input.optimizeForBattery();
      console.log('Low battery detected - optimizing input system for battery life');
    }
  });
}

// === Start the Game ===

// Start the app
app.start().then(() => {
  console.log('GameByte app started with comprehensive input system!');
  console.log('Input system capabilities:', Input.getDeviceCapabilities());
  
  // Start the game loop
  requestAnimationFrame(gameLoop);
  
  // Initial scene
  switchScene('gameplay');
});

// === Usage Instructions ===

console.log(`
=== GameByte Input System Demo ===

Controls:
- WASD or Arrow Keys: Move player
- Space: Jump  
- R: Reset player position
- Escape: Toggle pause menu

Mobile Controls:
- Virtual joystick (bottom-left): Move player
- Jump button (bottom-right): Jump
- Attack button: Custom action
- Pause button (top-left): Pause game

Features Demonstrated:
✓ Unified input handling (keyboard, touch, mouse, gamepad)
✓ Virtual controls with haptic feedback
✓ Context-based input switching
✓ Game-specific input handlers (platformer)
✓ Input prediction and performance optimization
✓ Mobile-first design with responsive controls
✓ Advanced gesture recognition
✓ Input mapping and profiles
✓ Performance monitoring and battery optimization

Open browser console to see input events and debug information.
`);

export { app, Input };