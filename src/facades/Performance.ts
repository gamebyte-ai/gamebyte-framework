import { Facade } from './Facade';
import { PerformanceFacade } from '../services/PerformanceServiceProvider';

/**
 * Performance facade for static access to performance optimization features
 * 
 * @example
 * ```typescript
 * import { Performance } from 'gamebyte-framework';
 * 
 * // Get current performance metrics
 * const metrics = Performance.getMetrics();
 * console.log(`FPS: ${metrics.fps}, Memory: ${metrics.memoryUsage.percentage}%`);
 * 
 * // Show debug overlay
 * Performance.showDebugOverlay();
 * 
 * // Auto-adjust quality based on performance
 * Performance.autoAdjustQuality();
 * 
 * // Enable battery optimization mode
 * Performance.enableBatteryMode();
 * 
 * // Start/end profiling
 * Performance.startProfiling('update-loop');
 * // ... code to profile ...
 * const duration = Performance.endProfiling('update-loop');
 * ```
 */
export class Performance extends Facade {
  /**
   * Get the service key for the facade
   */
  protected static getFacadeAccessor(): string {
    return 'performance';
  }

  /**
   * Get current performance metrics
   */
  static getMetrics() {
    return PerformanceFacade.getMetrics();
  }

  /**
   * Get device capabilities
   */
  static getDeviceCapabilities() {
    return PerformanceFacade.getDeviceCapabilities();
  }

  /**
   * Get current quality settings
   */
  static getQualitySettings() {
    return PerformanceFacade.getQualitySettings();
  }

  /**
   * Set quality settings
   */
  static setQualitySettings(settings: any) {
    return PerformanceFacade.setQualitySettings(settings);
  }

  /**
   * Auto-adjust quality based on current performance
   */
  static autoAdjustQuality() {
    return PerformanceFacade.autoAdjustQuality();
  }

  /**
   * Force garbage collection
   */
  static forceGC() {
    return PerformanceFacade.forceGC();
  }

  /**
   * Show performance debug overlay
   */
  static showDebugOverlay() {
    return PerformanceFacade.showDebugOverlay();
  }

  /**
   * Hide performance debug overlay
   */
  static hideDebugOverlay() {
    return PerformanceFacade.hideDebugOverlay();
  }

  /**
   * Toggle performance debug overlay visibility
   */
  static toggleDebugOverlay() {
    return PerformanceFacade.toggleDebugOverlay();
  }

  /**
   * Start profiling a named section
   */
  static startProfiling(name: string) {
    return PerformanceFacade.startProfiling(name);
  }

  /**
   * End profiling a named section and return duration
   */
  static endProfiling(name: string) {
    return PerformanceFacade.endProfiling(name);
  }

  /**
   * Get comprehensive performance report
   */
  static getReport() {
    return PerformanceFacade.getReport();
  }

  /**
   * Export performance data as JSON string
   */
  static exportData() {
    return PerformanceFacade.exportData();
  }

  /**
   * Enable battery optimization mode
   */
  static enableBatteryMode() {
    return PerformanceFacade.enableBatteryMode();
  }

  /**
   * Enable performance mode
   */
  static enablePerformanceMode() {
    return PerformanceFacade.enablePerformanceMode();
  }

  /**
   * Enable low-end device optimizations
   */
  static enableLowEndMode() {
    return PerformanceFacade.enableLowEndMode();
  }

  /**
   * Enable high-end device optimizations
   */
  static enableHighEndMode() {
    return PerformanceFacade.enableHighEndMode();
  }

  /**
   * Auto-initialize performance system with device detection
   */
  static async autoInit(config?: any) {
    return PerformanceFacade.autoInit(config);
  }

  /**
   * Utility method to profile a function
   */
  static async profile<T>(name: string, fn: () => T | Promise<T>): Promise<{ result: T; duration: number }> {
    Performance.startProfiling(name);
    
    try {
      const result = await fn();
      const duration = Performance.endProfiling(name);
      return { result, duration };
    } catch (error) {
      Performance.endProfiling(name);
      throw error;
    }
  }

  /**
   * Monitor performance for a duration and return statistics
   */
  static async monitor(durationMs: number): Promise<{
    averageFps: number;
    minFps: number;
    maxFps: number;
    averageMemory: number;
    peakMemory: number;
    warnings: number;
  }> {
    const startTime = Date.now();
    const samples: any[] = [];
    
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const metrics = Performance.getMetrics();
        samples.push(metrics);
        
        if (Date.now() - startTime >= durationMs) {
          clearInterval(interval);
          
          if (samples.length === 0) {
            resolve({
              averageFps: 0,
              minFps: 0,
              maxFps: 0,
              averageMemory: 0,
              peakMemory: 0,
              warnings: 0
            });
            return;
          }
          
          const avgFps = samples.reduce((sum, s) => sum + s.fps, 0) / samples.length;
          const minFps = Math.min(...samples.map(s => s.fps));
          const maxFps = Math.max(...samples.map(s => s.fps));
          const avgMemory = samples.reduce((sum, s) => sum + s.memoryUsage.percentage, 0) / samples.length;
          const peakMemory = Math.max(...samples.map(s => s.memoryUsage.percentage));
          const warnings = samples.reduce((sum, s) => sum + s.warnings.length, 0);
          
          resolve({
            averageFps: Math.round(avgFps),
            minFps: Math.round(minFps),
            maxFps: Math.round(maxFps),
            averageMemory: Math.round(avgMemory),
            peakMemory: Math.round(peakMemory),
            warnings
          });
        }
      }, 100); // Sample every 100ms
    });
  }

  /**
   * Run a performance benchmark
   */
  static async benchmark(): Promise<{
    cpuScore: number;
    memoryScore: number;
    renderScore: number;
    overallScore: number;
    tier: 'low' | 'mid' | 'high';
  }> {
    // CPU benchmark
    const cpuResult = await Performance.profile('cpu-benchmark', () => {
      let result = 0;
      for (let i = 0; i < 100000; i++) {
        result += Math.sin(i) * Math.cos(i) + Math.sqrt(i);
      }
      return result;
    });
    
    const cpuScore = Math.max(0, Math.min(100, 100 - (cpuResult.duration / 10)));
    
    // Memory benchmark
    const memoryBefore = Performance.getMetrics().memoryUsage.percentage;
    const arrays = [];
    for (let i = 0; i < 1000; i++) {
      arrays.push(new Array(1000).fill(Math.random()));
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    const memoryAfter = Performance.getMetrics().memoryUsage.percentage;
    const memoryDiff = memoryAfter - memoryBefore;
    const memoryScore = Math.max(0, Math.min(100, 100 - memoryDiff));
    
    // Cleanup
    arrays.length = 0;
    Performance.forceGC();
    
    // Render benchmark (simplified)
    const renderMetrics = Performance.getMetrics();
    const renderScore = Math.min(100, renderMetrics.fps * 1.5);
    
    const overallScore = (cpuScore + memoryScore + renderScore) / 3;
    
    let tier: 'low' | 'mid' | 'high';
    if (overallScore >= 75) tier = 'high';
    else if (overallScore >= 45) tier = 'mid';
    else tier = 'low';
    
    return {
      cpuScore: Math.round(cpuScore),
      memoryScore: Math.round(memoryScore),
      renderScore: Math.round(renderScore),
      overallScore: Math.round(overallScore),
      tier
    };
  }
}