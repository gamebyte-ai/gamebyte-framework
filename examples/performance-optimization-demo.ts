/**
 * GameByte Framework - Performance Optimization Demo
 * 
 * This example demonstrates the comprehensive performance optimization
 * and mobile scaling system for maintaining smooth 60fps gameplay.
 */

import { 
  createMobileGame, 
  initializeFacades, 
  Performance, 
  PerformanceConfig,
  DevicePerformanceTier,
  QualityLevel,
  BatteryOptimizationMode,
  RenderingMode 
} from '../src/index';

/**
 * Demo game with performance optimization
 */
class PerformanceOptimizedGame {
  private app: any;
  private gameObjects: any[] = [];
  private isRunning = false;

  async initialize() {
    // Create game with mobile optimizations
    this.app = createMobileGame();
    
    // Initialize facades for static access
    initializeFacades(this.app);
    
    // Initialize the canvas
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    
    // Initialize with 2D rendering
    await this.app.initialize(canvas, RenderingMode.RENDERER_2D, {
      antialias: true,
      powerPreference: 'high-performance'
    });
    
    // Auto-initialize performance system with device detection
    const performanceConfig: Partial<PerformanceConfig> = {
      targetFps: 60,
      autoQualityAdjustment: true,
      autoGarbageCollection: true,
      autoThermalThrottling: true,
      enableWarnings: true,
      warningThresholds: {
        lowFps: 45,
        highMemory: 85,
        highDrawCalls: 100
      }
    };
    
    await Performance.autoInit(performanceConfig);
    
    console.log('Performance system initialized!');
    console.log('Device capabilities:', Performance.getDeviceCapabilities());
    console.log('Initial quality settings:', Performance.getQualitySettings());
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Create game objects for testing
    this.createGameObjects();
    
    // Setup controls
    this.setupControls();
    
    console.log('Game initialized with performance optimization!');
  }

  /**
   * Setup performance monitoring and event handlers
   */
  private setupPerformanceMonitoring() {
    // Show debug overlay (can be toggled with F1)
    Performance.showDebugOverlay();
    
    // Listen for performance events (if using the service directly)
    const performanceMonitor = this.app.make('performance');
    
    performanceMonitor.on('warning', (warning: any) => {
      console.warn(`Performance Warning: ${warning.message}`, warning);
      
      // Handle specific warnings
      switch (warning.type) {
        case 'fps':
          console.log('FPS is low, auto-adjusting quality...');
          Performance.autoAdjustQuality();
          break;
        case 'memory':
          console.log('Memory usage is high, forcing GC...');
          Performance.forceGC();
          break;
        case 'thermal':
          console.log('Device is getting hot, enabling battery mode...');
          Performance.enableBatteryMode();
          break;
      }
    });
    
    performanceMonitor.on('quality-adjusted', (settings: any) => {
      console.log('Quality settings auto-adjusted:', settings);
    });
    
    performanceMonitor.on('thermal-state-changed', (data: any) => {
      console.log('Thermal state changed:', data);
      
      if (data.state !== 'normal') {
        // Reduce game complexity during thermal throttling
        this.reduceGameComplexity();
      }
    });
    
    performanceMonitor.on('battery-changed', (data: any) => {
      console.log('Battery status changed:', data);
      
      if (!data.charging && data.level < 0.3) {
        console.log('Low battery detected, enabling power saving mode');
        Performance.enableBatteryMode();
      }
    });
  }

  /**
   * Create game objects for performance testing
   */
  private createGameObjects() {
    const deviceTier = Performance.getDeviceCapabilities().performanceTier;
    
    // Adjust object count based on device tier
    let objectCount: number;
    switch (deviceTier) {
      case DevicePerformanceTier.HIGH:
        objectCount = 1000;
        break;
      case DevicePerformanceTier.MID:
        objectCount = 500;
        break;
      case DevicePerformanceTier.LOW:
        objectCount = 200;
        break;
      default:
        objectCount = 300;
    }
    
    console.log(`Creating ${objectCount} game objects for ${deviceTier} tier device`);
    
    // Create objects using object pooling for better memory management
    const objectPool = Performance.getMetrics ? 
      this.app.make('performance').createObjectPool('gameObjects', {
        initialSize: Math.min(100, objectCount),
        maxSize: objectCount,
        growthFactor: 1.5,
        shrinkThreshold: objectCount * 0.7,
        createFunction: () => ({
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          size: 5 + Math.random() * 10,
          active: true
        }),
        resetFunction: (obj: any) => {
          obj.x = Math.random() * 800;
          obj.y = Math.random() * 600;
          obj.vx = (Math.random() - 0.5) * 4;
          obj.vy = (Math.random() - 0.5) * 4;
          obj.active = true;
        }
      }) : null;
    
    // Create game objects
    for (let i = 0; i < objectCount; i++) {
      const obj = objectPool ? objectPool.get() : {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        size: 5 + Math.random() * 10,
        active: true
      };
      
      this.gameObjects.push(obj);
    }
  }

  /**
   * Setup performance monitoring controls
   */
  private setupControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 1000;
    `;
    
    controlsDiv.innerHTML = `
      <h3>Performance Controls</h3>
      <button id="toggleOverlay">Toggle Debug Overlay (F1)</button><br><br>
      <button id="runBenchmark">Run Benchmark</button><br><br>
      <button id="profileUpdate">Profile Update Loop</button><br><br>
      <button id="forceGC">Force Garbage Collection</button><br><br>
      <button id="batteryMode">Enable Battery Mode</button><br><br>
      <button id="performanceMode">Enable Performance Mode</button><br><br>
      <button id="autoAdjust">Auto Adjust Quality</button><br><br>
      <button id="addObjects">Add 100 Objects</button><br><br>
      <button id="removeObjects">Remove 100 Objects</button><br><br>
      <button id="exportData">Export Performance Data</button><br><br>
      <div id="status"></div>
    `;
    
    document.body.appendChild(controlsDiv);
    
    // Add event listeners
    document.getElementById('toggleOverlay')?.addEventListener('click', () => {
      Performance.toggleDebugOverlay();
    });
    
    document.getElementById('runBenchmark')?.addEventListener('click', async () => {
      const statusDiv = document.getElementById('status')!;
      statusDiv.innerHTML = 'Running benchmark...';
      
      const benchmark = await Performance.benchmark();
      statusDiv.innerHTML = `
        Benchmark Results:<br>
        CPU Score: ${benchmark.cpuScore}/100<br>
        Memory Score: ${benchmark.memoryScore}/100<br>
        Render Score: ${benchmark.renderScore}/100<br>
        Overall: ${benchmark.overallScore}/100 (${benchmark.tier})
      `;
    });
    
    document.getElementById('profileUpdate')?.addEventListener('click', () => {
      // Profile the update loop for 5 seconds
      console.log('Profiling update loop for 5 seconds...');
      
      Performance.startProfiling('update-loop');
      setTimeout(() => {
        const duration = Performance.endProfiling('update-loop');
        console.log(`Update loop profiling completed: ${duration.toFixed(2)}ms average`);
      }, 5000);
    });
    
    document.getElementById('forceGC')?.addEventListener('click', () => {
      Performance.forceGC();
      document.getElementById('status')!.innerHTML = 'Garbage collection forced';
    });
    
    document.getElementById('batteryMode')?.addEventListener('click', () => {
      Performance.enableBatteryMode();
      document.getElementById('status')!.innerHTML = 'Battery optimization mode enabled';
    });
    
    document.getElementById('performanceMode')?.addEventListener('click', () => {
      Performance.enablePerformanceMode();
      document.getElementById('status')!.innerHTML = 'Performance mode enabled';
    });
    
    document.getElementById('autoAdjust')?.addEventListener('click', () => {
      Performance.autoAdjustQuality();
      document.getElementById('status')!.innerHTML = 'Quality auto-adjusted based on performance';
    });
    
    document.getElementById('addObjects')?.addEventListener('click', () => {
      this.addGameObjects(100);
      document.getElementById('status')!.innerHTML = `Added 100 objects (Total: ${this.gameObjects.length})`;
    });
    
    document.getElementById('removeObjects')?.addEventListener('click', () => {
      this.removeGameObjects(100);
      document.getElementById('status')!.innerHTML = `Removed 100 objects (Total: ${this.gameObjects.length})`;
    });
    
    document.getElementById('exportData')?.addEventListener('click', () => {
      const data = Performance.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'performance-data.json';
      a.click();
      URL.revokeObjectURL(url);
      document.getElementById('status')!.innerHTML = 'Performance data exported';
    });
  }

  /**
   * Add game objects for stress testing
   */
  private addGameObjects(count: number) {
    const objectPool = this.app.make('performance').getObjectPool('gameObjects');
    
    for (let i = 0; i < count; i++) {
      const obj = objectPool ? objectPool.get() : {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        size: 5 + Math.random() * 10,
        active: true
      };
      
      this.gameObjects.push(obj);
    }
  }

  /**
   * Remove game objects
   */
  private removeGameObjects(count: number) {
    const objectPool = this.app.make('performance').getObjectPool('gameObjects');
    
    for (let i = 0; i < count && this.gameObjects.length > 0; i++) {
      const obj = this.gameObjects.pop();
      if (obj && objectPool) {
        objectPool.release(obj);
      }
    }
  }

  /**
   * Reduce game complexity during thermal throttling
   */
  private reduceGameComplexity() {
    // Remove half the objects during thermal throttling
    const removeCount = Math.floor(this.gameObjects.length / 2);
    this.removeGameObjects(removeCount);
    
    console.log(`Reduced game complexity: removed ${removeCount} objects`);
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.app.start();
    
    // Start game loop with performance profiling
    this.gameLoop();
    
    console.log('Game started with performance monitoring!');
  }

  /**
   * Game loop with performance optimization
   */
  private gameLoop() {
    if (!this.isRunning) return;
    
    // Profile the update loop
    Performance.startProfiling('game-update');
    
    // Update game objects
    const canvas = this.app.getCanvas();
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and render objects with culling for performance
    const viewportBounds = {
      left: -50,
      right: canvas.width + 50,
      top: -50,
      bottom: canvas.height + 50
    };
    
    let visibleObjects = 0;
    
    this.gameObjects.forEach(obj => {
      if (!obj.active) return;
      
      // Update position
      obj.x += obj.vx;
      obj.y += obj.vy;
      
      // Bounce off edges
      if (obj.x <= obj.size || obj.x >= canvas.width - obj.size) {
        obj.vx *= -1;
      }
      if (obj.y <= obj.size || obj.y >= canvas.height - obj.size) {
        obj.vy *= -1;
      }
      
      // Frustum culling for performance
      if (obj.x < viewportBounds.left || obj.x > viewportBounds.right ||
          obj.y < viewportBounds.top || obj.y > viewportBounds.bottom) {
        return;
      }
      
      visibleObjects++;
      
      // Render object
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // End profiling
    Performance.endProfiling('game-update');
    
    // Display performance info
    const metrics = Performance.getMetrics();
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`FPS: ${metrics.fps}`, 10, 30);
    ctx.fillText(`Objects: ${this.gameObjects.length} (${visibleObjects} visible)`, 10, 50);
    ctx.fillText(`Memory: ${metrics.memoryUsage.percentage.toFixed(1)}%`, 10, 70);
    ctx.fillText(`Draw Calls: ${metrics.drawCalls}`, 10, 90);
    ctx.fillText(`Thermal: ${metrics.thermalState}`, 10, 110);
    
    // Continue game loop
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Stop the game
   */
  stop() {
    this.isRunning = false;
    this.app.stop();
  }
}

// Initialize and start the demo
async function startDemo() {
  console.log('Starting Performance Optimization Demo...');
  
  try {
    const game = new PerformanceOptimizedGame();
    await game.initialize();
    game.start();
    
    // Monitor performance for 30 seconds and log results
    setTimeout(async () => {
      console.log('Performance monitoring results:');
      const monitoringResults = await Performance.monitor(30000);
      console.log(monitoringResults);
      
      // Run a quick benchmark
      const benchmark = await Performance.benchmark();
      console.log('Benchmark results:', benchmark);
      
      // Export performance data
      const performanceData = Performance.exportData();
      console.log('Performance data exported:', performanceData.length, 'characters');
      
    }, 5000); // Start monitoring after 5 seconds
    
  } catch (error) {
    console.error('Failed to start demo:', error);
  }
}

// Auto-start demo when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startDemo);
} else {
  startDemo();
}

export { PerformanceOptimizedGame };