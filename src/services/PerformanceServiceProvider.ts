import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';
import { DeviceDetector } from '../performance/DeviceDetector';
import { GameLoopOptimizer } from '../performance/GameLoopOptimizer';
import { FrameRateManager } from '../performance/FrameRateManager';
import { MemoryOptimizer } from '../performance/MemoryOptimizer';
import { RenderingOptimizer } from '../performance/RenderingOptimizer';
import { MobileOptimizer } from '../performance/MobileOptimizer';
import { PerformanceDebugOverlay, PerformanceProfiler } from '../performance/PerformanceDebugOverlay';
import { PerformanceConfig, QualityLevel } from '../contracts/Performance';
import { Logger } from '../utils/Logger.js';

/**
 * Service provider for performance optimization and monitoring
 * Integrates all performance components with the GameByte framework
 */
export class PerformanceServiceProvider extends AbstractServiceProvider {
  /**
   * Register performance services in the container
   */
  register(app: GameByte): void {
    // Register core performance monitor (singleton)
    app.singleton('performance', () => new PerformanceMonitor());
    
    // Register individual performance components (singletons)
    app.singleton('performance.device', () => new DeviceDetector());
    app.singleton('performance.gameloop', () => new GameLoopOptimizer());
    app.singleton('performance.framerate', () => new FrameRateManager());
    app.singleton('performance.memory', () => new MemoryOptimizer());
    app.singleton('performance.rendering', () => new RenderingOptimizer());
    app.singleton('performance.mobile', () => new MobileOptimizer());
    
    // Register developer tools
    app.singleton('performance.overlay', () => new PerformanceDebugOverlay());
    app.singleton('performance.profiler', () => new PerformanceProfiler());
    
    // Register performance configuration factory
    app.bind('performance.config', () => this.createDefaultConfig());
    
    // Register quality settings factory
    app.bind('performance.quality', () => this.createDefaultQualitySettings());
    
    // Register device tier detection helper
    app.bind('performance.detectTier', () => async () => {
      const deviceDetector = app.make<DeviceDetector>('performance.device');
      await deviceDetector.initialize();
      return deviceDetector.getPerformanceTier();
    });
    
    // Register performance optimization helpers
    app.bind('performance.optimize', () => ({
      // Quick optimization methods
      enableBatteryMode: () => {
        const mobile = app.make<MobileOptimizer>('performance.mobile');
        mobile.optimizeForBattery();
      },
      
      enablePerformanceMode: () => {
        const mobile = app.make<MobileOptimizer>('performance.mobile');
        mobile.optimizeForPerformance();
      },
      
      enableLowEndMode: () => {
        const performance = app.make<PerformanceMonitor>('performance');
        performance.setQualitySettings({
          renderScale: 0.7,
          textureQuality: QualityLevel.LOW,
          shadowQuality: QualityLevel.LOW,
          effectsQuality: QualityLevel.LOW,
          antialiasing: false,
          particleCount: 200,
          maxAudioSources: 8
        });
      },
      
      enableHighEndMode: () => {
        const performance = app.make<PerformanceMonitor>('performance');
        performance.setQualitySettings({
          renderScale: 1.0,
          textureQuality: QualityLevel.ULTRA_HIGH,
          shadowQuality: QualityLevel.HIGH,
          effectsQuality: QualityLevel.HIGH,
          antialiasing: true,
          particleCount: 2000,
          maxAudioSources: 32
        });
      },
      
      forceGC: () => {
        const performance = app.make<PerformanceMonitor>('performance');
        performance.forceGC();
      },
      
      autoAdjustQuality: () => {
        const performance = app.make<PerformanceMonitor>('performance');
        performance.autoAdjustQuality();
      }
    }));
    
    // Register debug utilities
    app.bind('performance.debug', () => ({
      showOverlay: () => {
        const overlay = app.make<PerformanceDebugOverlay>('performance.overlay');
        overlay.show();
      },
      
      hideOverlay: () => {
        const overlay = app.make<PerformanceDebugOverlay>('performance.overlay');
        overlay.hide();
      },
      
      toggleOverlay: () => {
        const overlay = app.make<PerformanceDebugOverlay>('performance.overlay');
        overlay.toggle();
      },
      
      startProfiling: (name: string) => {
        const profiler = app.make<PerformanceProfiler>('performance.profiler');
        profiler.startProfiling(name);
      },
      
      endProfiling: (name: string) => {
        const profiler = app.make<PerformanceProfiler>('performance.profiler');
        return profiler.endProfiling(name);
      },
      
      exportData: () => {
        const performance = app.make<PerformanceMonitor>('performance');
        return performance.exportPerformanceData();
      },
      
      getReport: () => {
        const performance = app.make<PerformanceMonitor>('performance');
        return performance.getPerformanceReport();
      }
    }));
    
    // Register auto-initialization helper
    app.bind('performance.autoInit', () => async (config?: Partial<PerformanceConfig>) => {
      const performance = app.make<PerformanceMonitor>('performance');
      const defaultConfig = app.make<PerformanceConfig>('performance.config');
      const finalConfig = { ...defaultConfig, ...config };
      
      await performance.initialize(finalConfig);
      
      // Auto-detect device tier and apply optimizations
      const deviceDetector = app.make<DeviceDetector>('performance.device');
      const tier = deviceDetector.getPerformanceTier();
      
      const optimizers = app.make('performance.optimize');
      switch (tier) {
        case 'low':
          if (typeof optimizers.enableLowEndMode === 'function') {
            optimizers.enableLowEndMode();
          }
          if (typeof optimizers.enableBatteryMode === 'function') {
            optimizers.enableBatteryMode();
          }
          break;
        case 'mid':
          // Use balanced settings (default)
          break;
        case 'high':
          if (typeof optimizers.enableHighEndMode === 'function') {
            optimizers.enableHighEndMode();
          }
          if (typeof optimizers.enablePerformanceMode === 'function') {
            optimizers.enablePerformanceMode();
          }
          break;
      }
      
      // Start performance monitoring
      performance.start();
      
      return performance;
    });
  }

  /**
   * Bootstrap performance services
   */
  async boot(app: GameByte): Promise<void> {
    // Setup global performance monitoring if enabled
    const container = app.getContainer();
    
    // Register global error handlers for performance monitoring
    window.addEventListener('error', (event) => {
      if (container.bound('performance')) {
        const performance = app.make<PerformanceMonitor>('performance');
        // Log performance-related errors
        app.emit('performance:error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      }
    });
    
    // Register unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (container.bound('performance')) {
        app.emit('performance:promise-rejection', {
          reason: event.reason,
          promise: event.promise
        });
      }
    });
    
    // Setup renderer integration if available
    if (container.bound('renderer')) {
      const renderer = app.make('renderer');
      
      // Listen for renderer events and forward to performance monitor
      renderer.on('render', (deltaTime: number) => {
        if (container.bound('performance')) {
          const performance = app.make<PerformanceMonitor>('performance');
          const overlay = app.make<PerformanceDebugOverlay>('performance.overlay');
          
          // Update overlay if visible
          if (overlay.isVisible()) {
            const metrics = performance.getMetrics();
            overlay.updateMetrics(metrics);
          }
        }
      });
      
      renderer.on('resize', (width: number, height: number) => {
        if (container.bound('performance')) {
          app.emit('performance:renderer-resize', { width, height });
        }
      });
    }
    
    // Setup keyboard shortcuts for debug overlay
    document.addEventListener('keydown', (event) => {
      // F1 to toggle performance overlay
      if (event.key === 'F1' && !event.altKey && !event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        
        if (container.bound('performance.debug')) {
          const debug = app.make('performance.debug');
          debug.toggleOverlay();
        }
      }
      
      // Ctrl+Shift+P for performance profiling toggle
      if (event.key === 'P' && event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        
        if (container.bound('performance.debug')) {
          const debug = app.make('performance.debug');
          Logger.info('Performance', 'Performance Report:', debug.getReport());
        }
      }
    });
    
    // Setup automatic quality adjustment based on device capabilities
    if (container.bound('performance') && container.bound('performance.device')) {
      try {
        const deviceDetector = app.make<DeviceDetector>('performance.device');
        await deviceDetector.initialize();
        
        const recommendations = deviceDetector.getOptimizationRecommendations();
        if (recommendations.length > 0) {
          app.emit('performance:optimization-recommendations', recommendations);
        }
      } catch (error) {
        Logger.warn('Performance', 'Failed to initialize device detection:', error);
      }
    }
    
    // Emit bootstrap completion
    app.emit('performance:service-booted', {
      services: this.provides(),
      timestamp: Date.now()
    });
  }

  /**
   * Create default performance configuration
   */
  private createDefaultConfig(): PerformanceConfig {
    return {
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
  }

  /**
   * Create default quality settings
   */
  private createDefaultQualitySettings() {
    return {
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
   * Services provided by this provider
   */
  provides(): string[] {
    return [
      'performance',
      'performance.device',
      'performance.gameloop',
      'performance.framerate',
      'performance.memory',
      'performance.rendering',
      'performance.mobile',
      'performance.overlay',
      'performance.profiler',
      'performance.config',
      'performance.quality',
      'performance.detectTier',
      'performance.optimize',
      'performance.debug',
      'performance.autoInit'
    ];
  }

  /**
   * Indicates this provider should be loaded immediately
   */
  isDeferred(): boolean {
    return false;
  }
}

/**
 * Performance facade for static access
 */
export class PerformanceFacade {
  private static app: GameByte | null = null;

  /**
   * Set the application instance
   */
  static setApplication(app: GameByte): void {
    PerformanceFacade.app = app;
  }

  /**
   * Get performance monitor instance
   */
  static getMonitor(): PerformanceMonitor {
    if (!PerformanceFacade.app) {
      throw new Error('GameByte application not set on PerformanceFacade');
    }
    return PerformanceFacade.app.make<PerformanceMonitor>('performance');
  }

  /**
   * Get current performance metrics
   */
  static getMetrics() {
    return PerformanceFacade.getMonitor().getMetrics();
  }

  /**
   * Get device capabilities
   */
  static getDeviceCapabilities() {
    return PerformanceFacade.getMonitor().getDeviceCapabilities();
  }

  /**
   * Get quality settings
   */
  static getQualitySettings() {
    return PerformanceFacade.getMonitor().getQualitySettings();
  }

  /**
   * Set quality settings
   */
  static setQualitySettings(settings: any) {
    return PerformanceFacade.getMonitor().setQualitySettings(settings);
  }

  /**
   * Auto-adjust quality
   */
  static autoAdjustQuality() {
    return PerformanceFacade.getMonitor().autoAdjustQuality();
  }

  /**
   * Force garbage collection
   */
  static forceGC() {
    return PerformanceFacade.getMonitor().forceGC();
  }

  /**
   * Show debug overlay
   */
  static showDebugOverlay() {
    if (!PerformanceFacade.app) return;
    const debug = PerformanceFacade.app.make('performance.debug');
    debug.showOverlay();
  }

  /**
   * Hide debug overlay
   */
  static hideDebugOverlay() {
    if (!PerformanceFacade.app) return;
    const debug = PerformanceFacade.app.make('performance.debug');
    debug.hideOverlay();
  }

  /**
   * Toggle debug overlay
   */
  static toggleDebugOverlay() {
    if (!PerformanceFacade.app) return;
    const debug = PerformanceFacade.app.make('performance.debug');
    debug.toggleOverlay();
  }

  /**
   * Start profiling
   */
  static startProfiling(name: string) {
    if (!PerformanceFacade.app) return;
    const debug = PerformanceFacade.app.make('performance.debug');
    debug.startProfiling(name);
  }

  /**
   * End profiling
   */
  static endProfiling(name: string) {
    if (!PerformanceFacade.app) return 0;
    const debug = PerformanceFacade.app.make('performance.debug');
    return debug.endProfiling(name);
  }

  /**
   * Get performance report
   */
  static getReport() {
    if (!PerformanceFacade.app) return null;
    const debug = PerformanceFacade.app.make('performance.debug');
    return debug.getReport();
  }

  /**
   * Export performance data
   */
  static exportData() {
    if (!PerformanceFacade.app) return '';
    const debug = PerformanceFacade.app.make('performance.debug');
    return debug.exportData();
  }

  /**
   * Enable battery optimization mode
   */
  static enableBatteryMode() {
    if (!PerformanceFacade.app) return;
    const optimize = PerformanceFacade.app.make('performance.optimize');
    optimize.enableBatteryMode();
  }

  /**
   * Enable performance mode
   */
  static enablePerformanceMode() {
    if (!PerformanceFacade.app) return;
    const optimize = PerformanceFacade.app.make('performance.optimize');
    optimize.enablePerformanceMode();
  }

  /**
   * Enable low-end device mode
   */
  static enableLowEndMode() {
    if (!PerformanceFacade.app) return;
    const optimize = PerformanceFacade.app.make('performance.optimize');
    optimize.enableLowEndMode();
  }

  /**
   * Enable high-end device mode
   */
  static enableHighEndMode() {
    if (!PerformanceFacade.app) return;
    const optimize = PerformanceFacade.app.make('performance.optimize');
    optimize.enableHighEndMode();
  }

  /**
   * Auto-initialize performance system
   */
  static async autoInit(config?: any) {
    if (!PerformanceFacade.app) return null;
    const autoInit = PerformanceFacade.app.make('performance.autoInit');
    return await autoInit(config);
  }
}