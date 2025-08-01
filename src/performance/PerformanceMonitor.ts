import { EventEmitter } from 'eventemitter3';
import { 
  PerformanceManager,
  PerformanceConfig,
  PerformanceMetrics,
  PerformanceWarning,
  QualitySettings,
  DeviceCapabilities,
  ObjectPool,
  ObjectPoolConfig,
  DeviceThermalState
} from '../contracts/Performance';
import { DeviceDetector } from './DeviceDetector';
import { GameLoopOptimizer } from './GameLoopOptimizer';
import { FrameRateManager } from './FrameRateManager';
import { MemoryOptimizer } from './MemoryOptimizer';
import { RenderingOptimizer } from './RenderingOptimizer';
import { MobileOptimizer } from './MobileOptimizer';

/**
 * Profiling session data
 */
interface ProfilingSession {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  markers: Array<{ name: string; time: number }>;
  measures: Array<{ name: string; startMark: string; endMark: string; duration: number }>;
}

/**
 * Performance alert configuration
 */
interface AlertConfig {
  type: 'fps' | 'memory' | 'thermal' | 'battery' | 'drawcalls';
  threshold: number;
  duration: number; // Duration to maintain threshold before alerting
  cooldown: number; // Cooldown period after alert
  enabled: boolean;
}

/**
 * Comprehensive performance monitoring and management system
 * Integrates all performance optimization components
 */
export class PerformanceMonitor extends EventEmitter implements PerformanceManager {
  private config: PerformanceConfig;
  private isInitialized = false;
  private isRunning = false;
  
  // Core components
  private deviceDetector: DeviceDetector;
  private gameLoopOptimizer: GameLoopOptimizer;
  private frameRateManager: FrameRateManager;
  private memoryOptimizer: MemoryOptimizer;
  private renderingOptimizer: RenderingOptimizer;
  private mobileOptimizer: MobileOptimizer;
  
  // Monitoring intervals
  private metricsUpdateInterval: number | null = null;
  private warningCheckInterval: number | null = null;
  private autoOptimizationInterval: number | null = null;
  
  // Performance metrics
  private currentMetrics: PerformanceMetrics;
  private metricsHistory: PerformanceMetrics[] = [];
  private warnings: PerformanceWarning[] = [];
  
  // Profiling
  private profilingSessions = new Map<string, ProfilingSession>();
  private performanceMarks = new Map<string, number>();
  
  // Auto-optimization
  private autoQualityAdjustment = true;
  private autoGarbageCollection = true;
  private autoThermalThrottling = true;
  
  // Alert system
  private alertConfigs: AlertConfig[] = [];
  private activeAlerts = new Map<string, number>(); // type -> lastAlertTime
  
  // Feature flags
  private optimizationFeatures = new Map<string, boolean>([
    ['batching', true],
    ['culling', true],
    ['pooling', true],
    ['thermal', true],
    ['battery', true]
  ]);

  constructor() {
    super();
    
    // Initialize default configuration
    this.config = {
      metricsUpdateInterval: 1000,
      performanceHistorySize: 300,
      targetFps: 60,
      minFps: 30,
      maxMemoryUsage: 0.8,
      autoQualityAdjustment: true,
      autoGarbageCollection: true,
      autoThermalThrottling: true,
      enableWarnings: true,
      warningThresholds: {
        lowFps: 45,
        highMemory: 0.85,
        highDrawCalls: 100
      }
    };
    
    // Initialize current metrics
    this.currentMetrics = this.createEmptyMetrics();
    
    // Initialize components
    this.deviceDetector = new DeviceDetector();
    this.gameLoopOptimizer = new GameLoopOptimizer();
    this.frameRateManager = new FrameRateManager();
    this.memoryOptimizer = new MemoryOptimizer();
    this.renderingOptimizer = new RenderingOptimizer();
    this.mobileOptimizer = new MobileOptimizer();
    
    // Setup component event listeners
    this.setupComponentListeners();
    
    // Initialize default alert configurations
    this.setupDefaultAlerts();
  }

  /**
   * Initialize the performance manager
   */
  async initialize(config: Partial<PerformanceConfig> = {}): Promise<void> {
    if (this.isInitialized) return;
    
    this.config = { ...this.config, ...config };
    
    try {
      // Initialize all components
      await this.deviceDetector.initialize();
      
      this.gameLoopOptimizer.setAutoAdjustmentEnabled(this.config.autoQualityAdjustment);
      this.gameLoopOptimizer.setPerformanceTarget(this.config.targetFps);
      
      this.frameRateManager.initialize({
        targetFps: this.config.targetFps,
        adaptiveFrameRate: true,
        maxDeltaTime: 100,
        fixedTimeStep: false,
        vsyncEnabled: true,
        frameSkipping: false,
        maxFrameSkip: 0
      });
      
      this.memoryOptimizer.initialize();
      this.memoryOptimizer.setAutoGCEnabled(this.config.autoGarbageCollection);
      
      this.renderingOptimizer.initialize();
      
      await this.mobileOptimizer.initialize();
      
      // Set optimization features
      this.autoQualityAdjustment = this.config.autoQualityAdjustment;
      this.autoGarbageCollection = this.config.autoGarbageCollection;
      this.autoThermalThrottling = this.config.autoThermalThrottling;
      
      this.isInitialized = true;
      this.emit('initialized', this.config);
      
    } catch (error) {
      this.emit('initialization-error', error);
      throw error;
    }
  }

  /**
   * Start performance monitoring and optimization
   */
  start(): void {
    if (!this.isInitialized) {
      throw new Error('PerformanceMonitor must be initialized before starting');
    }
    
    if (this.isRunning) return;
    
    // Start all components
    this.frameRateManager.start();
    this.gameLoopOptimizer.start();
    
    // Start monitoring intervals
    this.startMetricsUpdate();
    this.startWarningChecks();
    this.startAutoOptimization();
    
    this.isRunning = true;
    this.emit('started');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isRunning) return;
    
    // Stop components
    this.frameRateManager.stop();
    this.gameLoopOptimizer.stop();
    
    // Stop monitoring intervals
    this.stopAllIntervals();
    
    this.isRunning = false;
    this.emit('stopped');
  }

  /**
   * Setup component event listeners
   */
  private setupComponentListeners(): void {
    // Frame rate manager events
    this.frameRateManager.on('metrics-updated', (metrics) => {
      this.updateFrameRateMetrics(metrics);
    });
    
    this.frameRateManager.on('frame-drop', (data) => {
      this.handleFrameDrop(data);
    });
    
    // Memory optimizer events
    this.memoryOptimizer.on('memory-warning', (warning) => {
      this.addWarning('memory', warning.level, warning.message, warning.percentage);
    });
    
    this.memoryOptimizer.on('memory-leak-detected', (leak) => {
      this.addWarning('memory', 'high', `Memory leak detected: ${leak.type}`, leak.size);
    });
    
    // Mobile optimizer events
    this.mobileOptimizer.on('thermal-state-changed', (data) => {
      this.handleThermalStateChange(data);
    });
    
    this.mobileOptimizer.on('battery-changed', (data) => {
      this.handleBatteryChange(data);
    });
    
    // Rendering optimizer events
    this.renderingOptimizer.on('render-completed', (data) => {
      this.updateRenderingMetrics(data);
    });
    
    // Game loop optimizer events
    this.gameLoopOptimizer.on('quality-adjusted', (settings) => {
      this.handleQualityAdjustment(settings);
    });
  }

  /**
   * Setup default alert configurations
   */
  private setupDefaultAlerts(): void {
    this.alertConfigs = [
      {
        type: 'fps',
        threshold: this.config.warningThresholds.lowFps,
        duration: 3000, // 3 seconds
        cooldown: 10000, // 10 seconds
        enabled: true
      },
      {
        type: 'memory',
        threshold: this.config.warningThresholds.highMemory,
        duration: 5000, // 5 seconds
        cooldown: 15000, // 15 seconds
        enabled: true
      },
      {
        type: 'drawcalls',
        threshold: this.config.warningThresholds.highDrawCalls,
        duration: 2000, // 2 seconds
        cooldown: 8000, // 8 seconds
        enabled: true
      }
    ];
  }

  /**
   * Start metrics update interval
   */
  private startMetricsUpdate(): void {
    this.metricsUpdateInterval = window.setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsUpdateInterval);
  }

  /**
   * Start warning checks interval
   */
  private startWarningChecks(): void {
    if (!this.config.enableWarnings) return;
    
    this.warningCheckInterval = window.setInterval(() => {
      this.checkForWarnings();
    }, 2000); // Check every 2 seconds
  }

  /**
   * Start auto-optimization interval
   */
  private startAutoOptimization(): void {
    this.autoOptimizationInterval = window.setInterval(() => {
      this.performAutoOptimization();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop all monitoring intervals
   */
  private stopAllIntervals(): void {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }
    
    if (this.warningCheckInterval) {
      clearInterval(this.warningCheckInterval);
      this.warningCheckInterval = null;
    }
    
    if (this.autoOptimizationInterval) {
      clearInterval(this.autoOptimizationInterval);
      this.autoOptimizationInterval = null;
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const frameMetrics = this.frameRateManager.getPerformanceReport();
    const memoryInfo = this.memoryOptimizer.getMemoryUsage();
    const renderStats = this.renderingOptimizer.getRenderStats();
    const deviceCapabilities = this.deviceDetector.getCapabilities();
    
    this.currentMetrics = {
      // Frame rate metrics
      fps: frameMetrics.fps,
      averageFps: frameMetrics.averageFps,
      minFps: Math.min(this.currentMetrics.minFps || frameMetrics.fps, frameMetrics.fps),
      maxFps: Math.max(this.currentMetrics.maxFps || frameMetrics.fps, frameMetrics.fps),
      frameTime: frameMetrics.frameTime,
      averageFrameTime: frameMetrics.averageFrameTime,
      frameTimeVariance: this.calculateFrameTimeVariance(),
      
      // Memory metrics
      memoryUsage: {
        used: memoryInfo.used,
        total: memoryInfo.total,
        percentage: memoryInfo.percentage,
        jsHeapSizeUsed: memoryInfo.jsHeapSizeUsed,
        jsHeapSizeTotal: memoryInfo.jsHeapSizeTotal,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit
      },
      
      // Rendering metrics
      drawCalls: renderStats.drawCalls,
      triangles: renderStats.triangles,
      textureMemory: this.estimateTextureMemory(),
      geometryMemory: this.estimateGeometryMemory(),
      batchCount: renderStats.batchedObjects,
      
      // CPU/GPU metrics (estimated)
      cpuUsage: this.estimateCPUUsage(),
      gpuUsage: this.estimateGPUUsage(),
      thermalState: this.mobileOptimizer.getThermalState(),
      
      // Warnings
      warnings: [...this.warnings]
    };
    
    // Add to history
    this.metricsHistory.push({ ...this.currentMetrics });
    
    // Limit history size
    if (this.metricsHistory.length > this.config.performanceHistorySize) {
      this.metricsHistory.shift();
    }
    
    // Update mobile optimizer with current FPS
    this.mobileOptimizer.updatePerformanceMetrics(this.currentMetrics.fps);
    
    this.emit('metrics-updated', this.currentMetrics);
  }

  /**
   * Check for performance warnings
   */
  private checkForWarnings(): void {
    if (!this.config.enableWarnings) return;
    
    const now = Date.now();
    
    for (const alertConfig of this.alertConfigs) {
      if (!alertConfig.enabled) continue;
      
      const lastAlert = this.activeAlerts.get(alertConfig.type) || 0;
      if (now - lastAlert < alertConfig.cooldown) continue;
      
      let shouldAlert = false;
      let value = 0;
      
      switch (alertConfig.type) {
        case 'fps':
          value = this.currentMetrics.fps;
          shouldAlert = value < alertConfig.threshold;
          break;
        case 'memory':
          value = this.currentMetrics.memoryUsage.percentage;
          shouldAlert = value > alertConfig.threshold * 100;
          break;
        case 'drawcalls':
          value = this.currentMetrics.drawCalls;
          shouldAlert = value > alertConfig.threshold;
          break;
      }
      
      if (shouldAlert) {
        this.activeAlerts.set(alertConfig.type, now);
        this.addWarning(alertConfig.type, 'medium', 
          `${alertConfig.type} threshold exceeded`, value, alertConfig.threshold);
      }
    }
  }

  /**
   * Perform automatic optimizations
   */
  private performAutoOptimization(): void {
    // Auto quality adjustment
    if (this.autoQualityAdjustment) {
      this.gameLoopOptimizer.forceQualityAdjustment();
    }
    
    // Auto garbage collection
    if (this.autoGarbageCollection && this.currentMetrics.memoryUsage.percentage > 70) {
      this.memoryOptimizer.optimizeMemory();
    }
    
    // Auto thermal throttling
    if (this.autoThermalThrottling) {
      const thermalState = this.mobileOptimizer.getThermalState();
      if (thermalState !== 'normal') {
        this.mobileOptimizer.optimizeForBattery();
      }
    }
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      averageFps: 0,
      minFps: 0,
      maxFps: 0,
      frameTime: 0,
      averageFrameTime: 0,
      frameTimeVariance: 0,
      memoryUsage: {
        used: 0,
        total: 0,
        percentage: 0,
        jsHeapSizeUsed: 0,
        jsHeapSizeTotal: 0,
        jsHeapSizeLimit: 0
      },
      drawCalls: 0,
      triangles: 0,
      textureMemory: 0,
      geometryMemory: 0,
      batchCount: 0,
      cpuUsage: 0,
      gpuUsage: 0,
      thermalState: DeviceThermalState.NORMAL,
      warnings: []
    };
  }

  /**
   * Calculate frame time variance
   */
  private calculateFrameTimeVariance(): number {
    // This would use frame time history from frame rate manager
    return this.frameRateManager.getStabilityScore() * 100;
  }

  /**
   * Estimate texture memory usage
   */
  private estimateTextureMemory(): number {
    // Simplified estimation - in real implementation would track actual textures
    return this.currentMetrics.drawCalls * 1024; // Estimate 1KB per draw call
  }

  /**
   * Estimate geometry memory usage
   */
  private estimateGeometryMemory(): number {
    // Simplified estimation - in real implementation would track actual geometry
    return this.currentMetrics.triangles * 48; // Estimate 48 bytes per triangle
  }

  /**
   * Estimate CPU usage
   */
  private estimateCPUUsage(): number {
    // Estimate based on frame time and target
    const targetFrameTime = 1000 / this.config.targetFps;
    const usage = Math.min(100, (this.currentMetrics.frameTime / targetFrameTime) * 100);
    return Math.round(usage);
  }

  /**
   * Estimate GPU usage
   */
  private estimateGPUUsage(): number {
    // Estimate based on draw calls and triangles
    const drawCallFactor = Math.min(100, this.currentMetrics.drawCalls * 2);
    const triangleFactor = Math.min(100, this.currentMetrics.triangles / 1000);
    return Math.round((drawCallFactor + triangleFactor) / 2);
  }

  /**
   * Add performance warning
   */
  private addWarning(
    type: 'fps' | 'memory' | 'thermal' | 'battery' | 'drawcalls',
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    value?: number,
    threshold?: number
  ): void {
    const warning: PerformanceWarning = {
      type,
      severity,
      message,
      timestamp: Date.now(),
      value,
      threshold
    };
    
    this.warnings.push(warning);
    
    // Limit warnings array size
    if (this.warnings.length > 50) {
      this.warnings.shift();
    }
    
    this.emit('warning', warning);
  }

  /**
   * Event handlers
   */
  private updateFrameRateMetrics(metrics: any): void {
    // Frame rate metrics are handled in updateMetrics()
  }

  private handleFrameDrop(data: any): void {
    this.addWarning('fps', data.severity, `Frame drop detected: ${data.frameTime}ms`, data.frameTime, data.expectedTime);
  }

  private updateRenderingMetrics(data: any): void {
    // Rendering metrics are handled in updateMetrics()
  }

  private handleThermalStateChange(data: any): void {
    if (data.state !== 'normal') {
      this.addWarning('thermal', 'high', `Thermal state changed to ${data.state}`, data.temperature);
    }
  }

  private handleBatteryChange(data: any): void {
    if (!data.charging && data.level < 0.2) {
      this.addWarning('battery', 'medium', `Low battery: ${Math.round(data.level * 100)}%`, data.level);
    }
  }

  private handleQualityAdjustment(settings: QualitySettings): void {
    this.emit('quality-adjusted', settings);
  }

  /**
   * Public API methods
   */

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    const capabilities = this.deviceDetector.getCapabilities();
    if (!capabilities) {
      throw new Error('Device capabilities not available - ensure PerformanceMonitor is initialized');
    }
    return capabilities;
  }

  /**
   * Get current quality settings
   */
  getQualitySettings(): QualitySettings {
    return this.gameLoopOptimizer.getQualitySettings();
  }

  /**
   * Set quality settings
   */
  setQualitySettings(settings: Partial<QualitySettings>): void {
    this.gameLoopOptimizer.setQualitySettings(settings);
    const fullSettings = this.gameLoopOptimizer.getQualitySettings();
    this.mobileOptimizer.setQualitySettings(fullSettings);
  }

  /**
   * Auto-adjust quality based on performance
   */
  autoAdjustQuality(): void {
    this.gameLoopOptimizer.forceQualityAdjustment();
  }

  /**
   * Force garbage collection
   */
  forceGC(): void {
    this.memoryOptimizer.optimizeMemory();
  }

  /**
   * Create an object pool
   */
  createObjectPool<T>(name: string, config: ObjectPoolConfig): ObjectPool<T> {
    return this.memoryOptimizer.registerPool<T>(name, config);
  }

  /**
   * Get an object pool by name
   */
  getObjectPool<T>(name: string): ObjectPool<T> | null {
    return this.memoryOptimizer.getPool<T>(name);
  }

  /**
   * Enable/disable performance optimization features
   */
  setOptimizationEnabled(feature: string, enabled: boolean): void {
    this.optimizationFeatures.set(feature, enabled);
    
    switch (feature) {
      case 'batching':
        if (enabled) {
          this.renderingOptimizer.enableBatching();
        } else {
          this.renderingOptimizer.disableBatching();
        }
        break;
      case 'culling':
        if (enabled) {
          this.renderingOptimizer.enableCulling();
        } else {
          this.renderingOptimizer.disableCulling();
        }
        break;
      case 'thermal':
        if (enabled) {
          this.mobileOptimizer.enableThermalThrottling();
        } else {
          this.mobileOptimizer.disableThermalThrottling();
        }
        break;
      case 'battery':
        // Battery optimization is handled by mode setting
        break;
    }
    
    this.emit('optimization-feature-changed', { feature, enabled });
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(count?: number): PerformanceMetrics[] {
    if (count) {
      return this.metricsHistory.slice(-count);
    }
    return [...this.metricsHistory];
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): any {
    return {
      current: this.getMetrics(),
      device: this.getDeviceCapabilities(),
      quality: this.getQualitySettings(),
      components: {
        frameRate: this.frameRateManager.getPerformanceReport(),
        memory: this.memoryOptimizer.getReport(),
        rendering: this.renderingOptimizer.getPerformanceReport(),
        mobile: this.mobileOptimizer.getOptimizationReport()
      },
      configuration: this.config,
      warnings: this.warnings.slice(-10), // Last 10 warnings
      optimizationFeatures: Object.fromEntries(this.optimizationFeatures)
    };
  }

  /**
   * Export performance data
   */
  exportPerformanceData(): string {
    const data = {
      timestamp: Date.now(),
      report: this.getPerformanceReport(),
      history: this.metricsHistory,
      profilingSessions: Array.from(this.profilingSessions.values())
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    
    // Destroy all components
    this.deviceDetector.destroy();
    this.gameLoopOptimizer.destroy();
    this.frameRateManager.destroy();
    this.memoryOptimizer.destroy();
    this.renderingOptimizer.destroy();
    this.mobileOptimizer.destroy();
    
    // Clear data
    this.metricsHistory.length = 0;
    this.warnings.length = 0;
    this.profilingSessions.clear();
    this.performanceMarks.clear();
    this.activeAlerts.clear();
    this.optimizationFeatures.clear();
    
    this.removeAllListeners();
    this.isInitialized = false;
  }
}