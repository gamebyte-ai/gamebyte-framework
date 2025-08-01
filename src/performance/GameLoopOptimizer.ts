import { EventEmitter } from 'eventemitter3';
import { GameLoopConfig, QualitySettings, QualityLevel } from '../contracts/Performance';

/**
 * Optimized game loop with adaptive performance scaling
 * Maintains stable 60fps with dynamic quality adjustment
 */
export class GameLoopOptimizer extends EventEmitter {
  private config: GameLoopConfig;
  private isRunning = false;
  private animationFrameId: number | null = null;
  
  // Timing variables
  private lastTime = 0;
  private accumulator = 0;
  private fixedDeltaTime = 1000 / 60; // 16.67ms for 60fps
  private frameCount = 0;
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  
  // Performance tracking
  private currentFps = 60;
  private averageFps = 60;
  private frameTime = 16.67;
  private averageFrameTime = 16.67;
  private frameSkipCount = 0;
  private isFrameRateStable = true;
  
  // Adaptive scaling
  private qualitySettings: QualitySettings;
  private autoAdjustmentEnabled = true;
  private performanceTarget = 58; // Target 58fps to allow buffer
  private adjustmentCooldown = 0;
  private lastQualityAdjustment = 0;
  
  // Update callbacks
  private updateCallbacks: Array<(deltaTime: number) => void> = [];
  private renderCallbacks: Array<(deltaTime: number) => void> = [];
  private fixedUpdateCallbacks: Array<(deltaTime: number) => void> = [];

  constructor(config: Partial<GameLoopConfig> = {}) {
    super();
    
    this.config = {
      targetFps: 60,
      maxDeltaTime: 100, // 100ms max to prevent spiral of death
      fixedTimeStep: false,
      adaptiveFrameRate: true,
      vsyncEnabled: true,
      frameSkipping: true,
      maxFrameSkip: 5,
      ...config
    };
    
    this.fixedDeltaTime = 1000 / this.config.targetFps;
    
    // Initialize default quality settings
    this.qualitySettings = {
      renderScale: 1.0,
      textureQuality: QualityLevel.HIGH,
      shadowQuality: QualityLevel.HIGH,
      effectsQuality: QualityLevel.HIGH,
      antialiasing: true,
      physicsTimestep: 1000 / 60,
      physicsIterations: 10,
      maxPhysicsObjects: 1000,
      audioQuality: QualityLevel.HIGH,
      maxAudioSources: 32,
      uiAnimationQuality: QualityLevel.HIGH,
      particleCount: 1000
    };
  }

  /**
   * Start the optimized game loop
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.accumulator = 0;
    
    this.loop();
    this.emit('started');
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.emit('stopped');
  }

  /**
   * Main game loop implementation
   */
  private loop(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Clamp delta time to prevent spiral of death
    deltaTime = Math.min(deltaTime, this.config.maxDeltaTime);
    
    // Update performance metrics
    this.updatePerformanceMetrics(deltaTime);
    
    // Handle frame skipping if performance is poor
    if (this.config.frameSkipping && this.shouldSkipFrame()) {
      this.frameSkipCount++;
      this.scheduleNextFrame();
      return;
    }
    
    this.frameSkipCount = 0;
    
    if (this.config.fixedTimeStep) {
      this.runFixedTimeStep(deltaTime);
    } else {
      this.runVariableTimeStep(deltaTime);
    }
    
    // Adaptive quality adjustment
    if (this.autoAdjustmentEnabled && this.shouldAdjustQuality()) {
      this.adjustQualityBasedOnPerformance();
    }
    
    this.scheduleNextFrame();
  }

  /**
   * Run fixed timestep loop
   */
  private runFixedTimeStep(deltaTime: number): void {
    this.accumulator += deltaTime;
    
    // Run fixed updates
    while (this.accumulator >= this.fixedDeltaTime) {
      // Execute fixed update callbacks (physics, etc.)
      this.fixedUpdateCallbacks.forEach(callback => {
        try {
          callback(this.fixedDeltaTime);
        } catch (error) {
          this.emit('update-error', error);
        }
      });
      
      this.accumulator -= this.fixedDeltaTime;
    }
    
    // Calculate interpolation alpha for smooth rendering
    const alpha = this.accumulator / this.fixedDeltaTime;
    
    // Run variable update (input, UI, etc.)
    this.updateCallbacks.forEach(callback => {
      try {
        callback(deltaTime);
      } catch (error) {
        this.emit('update-error', error);
      }
    });
    
    // Run render callbacks with interpolation
    this.renderCallbacks.forEach(callback => {
      try {
        callback(alpha);
      } catch (error) {
        this.emit('render-error', error);
      }
    });
    
    this.emit('frame', { deltaTime, alpha, type: 'fixed' });
  }

  /**
   * Run variable timestep loop
   */
  private runVariableTimeStep(deltaTime: number): void {
    // Run update callbacks
    this.updateCallbacks.forEach(callback => {
      try {
        callback(deltaTime);
      } catch (error) {
        this.emit('update-error', error);
      }
    });
    
    // Run render callbacks
    this.renderCallbacks.forEach(callback => {
      try {
        callback(deltaTime);
      } catch (error) {
        this.emit('render-error', error);
      }
    });
    
    this.emit('frame', { deltaTime, type: 'variable' });
  }

  /**
   * Schedule next frame
   */
  private scheduleNextFrame(): void {
    if (this.config.vsyncEnabled) {
      this.animationFrameId = requestAnimationFrame(() => this.loop());
    } else {
      // Use setTimeout for custom frame rate
      const targetFrameTime = 1000 / this.config.targetFps;
      this.animationFrameId = window.setTimeout(() => this.loop(), targetFrameTime);
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(deltaTime: number): void {
    this.frameTime = deltaTime;
    this.frameCount++;
    
    // Calculate FPS
    this.currentFps = 1000 / deltaTime;
    
    // Update history buffers
    this.fpsHistory.push(this.currentFps);
    this.frameTimeHistory.push(deltaTime);
    
    // Limit history size
    const maxHistorySize = 120; // 2 seconds at 60fps
    if (this.fpsHistory.length > maxHistorySize) {
      this.fpsHistory.shift();
      this.frameTimeHistory.shift();
    }
    
    // Calculate averages
    this.averageFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    this.averageFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    
    // Check frame rate stability
    if (this.fpsHistory.length >= 60) { // 1 second of data
      const recentFps = this.fpsHistory.slice(-60);
      const variance = this.calculateVariance(recentFps);
      this.isFrameRateStable = variance < 100; // Low variance = stable
    }
    
    // Emit metrics every second
    if (this.frameCount % 60 === 0) {
      this.emit('metrics-updated', {
        fps: Math.round(this.currentFps),
        averageFps: Math.round(this.averageFps),
        frameTime: Math.round(this.frameTime * 100) / 100,
        averageFrameTime: Math.round(this.averageFrameTime * 100) / 100,
        isStable: this.isFrameRateStable,
        frameSkips: this.frameSkipCount
      });
    }
  }

  /**
   * Calculate variance for stability check
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  /**
   * Check if frame should be skipped for performance
   */
  private shouldSkipFrame(): boolean {
    if (!this.config.frameSkipping) return false;
    if (this.frameSkipCount >= this.config.maxFrameSkip) return false;
    
    // Skip if we're significantly behind target FPS
    return this.averageFps < (this.config.targetFps * 0.8) && this.frameTime > 25; // >25ms frame time
  }

  /**
   * Check if quality should be adjusted
   */
  private shouldAdjustQuality(): boolean {
    if (this.adjustmentCooldown > 0) {
      this.adjustmentCooldown--;
      return false;
    }
    
    // Need at least 2 seconds of data
    if (this.fpsHistory.length < 120) return false;
    
    // Check if performance is consistently poor or good
    const recentFps = this.fpsHistory.slice(-60); // Last 1 second
    const avgRecentFps = recentFps.reduce((sum, fps) => sum + fps, 0) / recentFps.length;
    
    // Adjust if significantly above or below target
    return Math.abs(avgRecentFps - this.performanceTarget) > 10;
  }

  /**
   * Adjust quality settings based on performance
   */
  private adjustQualityBasedOnPerformance(): void {
    const recentFps = this.fpsHistory.slice(-60);
    const avgRecentFps = recentFps.reduce((sum, fps) => sum + fps, 0) / recentFps.length;
    
    let needsAdjustment = false;
    
    if (avgRecentFps < this.performanceTarget - 5) {
      // Performance is poor, reduce quality
      needsAdjustment = this.reduceQuality();
    } else if (avgRecentFps > this.performanceTarget + 10) {
      // Performance is good, increase quality if not at max
      needsAdjustment = this.increaseQuality();
    }
    
    if (needsAdjustment) {
      this.adjustmentCooldown = 180; // 3 seconds cooldown
      this.lastQualityAdjustment = performance.now();
      this.emit('quality-adjusted', this.qualitySettings);
    }
  }

  /**
   * Reduce quality settings to improve performance
   */
  private reduceQuality(): boolean {
    let adjusted = false;
    
    // Progressive quality reduction
    if (this.qualitySettings.renderScale > 0.5) {
      this.qualitySettings.renderScale = Math.max(0.5, this.qualitySettings.renderScale - 0.1);
      adjusted = true;
    } else if (this.qualitySettings.effectsQuality > QualityLevel.LOW) {
      this.qualitySettings.effectsQuality--;
      adjusted = true;
    } else if (this.qualitySettings.shadowQuality > QualityLevel.LOW) {
      this.qualitySettings.shadowQuality--;
      adjusted = true;
    } else if (this.qualitySettings.textureQuality > QualityLevel.LOW) {
      this.qualitySettings.textureQuality--;
      adjusted = true;
    } else if (this.qualitySettings.antialiasing) {
      this.qualitySettings.antialiasing = false;
      adjusted = true;
    } else if (this.qualitySettings.particleCount > 100) {
      this.qualitySettings.particleCount = Math.max(100, this.qualitySettings.particleCount * 0.7);
      adjusted = true;
    }
    
    return adjusted;
  }

  /**
   * Increase quality settings when performance allows
   */
  private increaseQuality(): boolean {
    let adjusted = false;
    
    // Progressive quality increase (reverse order of reduction)
    if (this.qualitySettings.particleCount < 1000) {
      this.qualitySettings.particleCount = Math.min(1000, this.qualitySettings.particleCount * 1.3);
      adjusted = true;
    } else if (!this.qualitySettings.antialiasing) {
      this.qualitySettings.antialiasing = true;
      adjusted = true;
    } else if (this.qualitySettings.textureQuality < QualityLevel.HIGH) {
      this.qualitySettings.textureQuality++;
      adjusted = true;
    } else if (this.qualitySettings.shadowQuality < QualityLevel.HIGH) {
      this.qualitySettings.shadowQuality++;
      adjusted = true;
    } else if (this.qualitySettings.effectsQuality < QualityLevel.HIGH) {
      this.qualitySettings.effectsQuality++;
      adjusted = true;
    } else if (this.qualitySettings.renderScale < 1.0) {
      this.qualitySettings.renderScale = Math.min(1.0, this.qualitySettings.renderScale + 0.1);
      adjusted = true;
    }
    
    return adjusted;
  }

  /**
   * Add update callback
   */
  addUpdateCallback(callback: (deltaTime: number) => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Remove update callback
   */
  removeUpdateCallback(callback: (deltaTime: number) => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  /**
   * Add render callback
   */
  addRenderCallback(callback: (deltaTime: number) => void): void {
    this.renderCallbacks.push(callback);
  }

  /**
   * Remove render callback
   */
  removeRenderCallback(callback: (deltaTime: number) => void): void {
    const index = this.renderCallbacks.indexOf(callback);
    if (index > -1) {
      this.renderCallbacks.splice(index, 1);
    }
  }

  /**
   * Add fixed update callback
   */
  addFixedUpdateCallback(callback: (deltaTime: number) => void): void {
    this.fixedUpdateCallbacks.push(callback);
  }

  /**
   * Remove fixed update callback
   */
  removeFixedUpdateCallback(callback: (deltaTime: number) => void): void {
    const index = this.fixedUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      this.fixedUpdateCallbacks.splice(index, 1);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      fps: Math.round(this.currentFps),
      averageFps: Math.round(this.averageFps),
      frameTime: Math.round(this.frameTime * 100) / 100,
      averageFrameTime: Math.round(this.averageFrameTime * 100) / 100,
      isStable: this.isFrameRateStable,
      frameSkips: this.frameSkipCount,
      targetFps: this.config.targetFps
    };
  }

  /**
   * Get current quality settings
   */
  getQualitySettings(): QualitySettings {
    return { ...this.qualitySettings };
  }

  /**
   * Set quality settings
   */
  setQualitySettings(settings: Partial<QualitySettings>): void {
    this.qualitySettings = { ...this.qualitySettings, ...settings };
    this.emit('quality-changed', this.qualitySettings);
  }

  /**
   * Enable/disable auto quality adjustment
   */
  setAutoAdjustmentEnabled(enabled: boolean): void {
    this.autoAdjustmentEnabled = enabled;
    this.emit('auto-adjustment-changed', enabled);
  }

  /**
   * Set performance target FPS
   */
  setPerformanceTarget(fps: number): void {
    this.performanceTarget = Math.max(30, Math.min(120, fps));
    this.emit('target-changed', this.performanceTarget);
  }

  /**
   * Force quality adjustment
   */
  forceQualityAdjustment(): void {
    this.adjustmentCooldown = 0;
    if (this.shouldAdjustQuality()) {
      this.adjustQualityBasedOnPerformance();
    }
  }

  /**
   * Reset quality to defaults
   */
  resetQuality(): void {
    this.qualitySettings = {
      renderScale: 1.0,
      textureQuality: QualityLevel.HIGH,
      shadowQuality: QualityLevel.HIGH,
      effectsQuality: QualityLevel.HIGH,
      antialiasing: true,
      physicsTimestep: 1000 / 60,
      physicsIterations: 10,
      maxPhysicsObjects: 1000,
      audioQuality: QualityLevel.HIGH,
      maxAudioSources: 32,
      uiAnimationQuality: QualityLevel.HIGH,
      particleCount: 1000
    };
    
    this.emit('quality-reset', this.qualitySettings);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.updateCallbacks.length = 0;
    this.renderCallbacks.length = 0;
    this.fixedUpdateCallbacks.length = 0;
    this.fpsHistory.length = 0;
    this.frameTimeHistory.length = 0;
    this.removeAllListeners();
  }
}