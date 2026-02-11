import {
  InputPerformanceManager,
  InputPerformanceMetrics,
  RawInputEvent
} from '../contracts/Input';
import { Logger } from '../utils/Logger.js';

/**
 * Performance monitoring data
 */
interface PerformanceData {
  inputLatencies: number[];
  gestureRecognitionTimes: number[];
  eventCounts: number[];
  memoryUsages: number[];
  frameRates: number[];
  lastResetTime: number;
}

/**
 * Input prediction data for lag compensation
 */
interface PredictionData {
  enabled: boolean;
  lookAheadTime: number;
  confidence: number;
  predictedEvents: Array<{
    timestamp: number;
    event: any;
    confidence: number;
  }>;
}

/**
 * Event pool for memory optimization
 */
interface EventPool {
  enabled: boolean;
  maxSize: number;
  pool: any[];
  activeCount: number;
}

/**
 * Input performance manager with optimization and monitoring capabilities
 */
export class GameByteInputPerformanceManager implements InputPerformanceManager {
  private isInitialized: boolean = false;
  private isMonitoring: boolean = false;
  
  // Performance tracking
  private performanceData: PerformanceData;
  private metricsUpdateInterval: number | null = null;
  private metricsUpdateFrequency: number = 1000; // Update every second
  
  // Optimization settings
  private inputPrediction: PredictionData;
  private eventPool: EventPool;
  private batchSize: number = 10;
  private updateFrequency: number = 60; // Target 60 FPS
  private performanceTarget: 'battery' | 'performance' | 'balanced' = 'balanced';
  
  // Adaptive performance
  private adaptivePerformanceEnabled: boolean = false;
  private lastPerformanceCheck: number = 0;
  private performanceCheckInterval: number = 5000; // Check every 5 seconds
  private performanceHistory: number[] = [];
  
  // Battery optimization
  private batteryOptimizationEnabled: boolean = false;
  private batteryLevel: number = 1.0;
  private batteryMonitoringSupported: boolean = false;

  constructor() {
    this.performanceData = {
      inputLatencies: [],
      gestureRecognitionTimes: [],
      eventCounts: [],
      memoryUsages: [],
      frameRates: [],
      lastResetTime: performance.now()
    };
    
    this.inputPrediction = {
      enabled: false,
      lookAheadTime: 16, // One frame at 60fps
      confidence: 0.7,
      predictedEvents: []
    };
    
    this.eventPool = {
      enabled: true,
      maxSize: 100,
      pool: [],
      activeCount: 0
    };
    
    // Check for battery API support
    if ('getBattery' in navigator) {
      this.batteryMonitoringSupported = true;
      this.initializeBatteryMonitoring();
    }
  }

  /**
   * Initialize performance manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.setupPerformanceMonitoring();
    this.initializeEventPool();
    this.applyPerformanceTarget();
    
    this.isInitialized = true;
  }

  /**
   * Destroy performance manager
   */
  destroy(): void {
    this.stopMonitoring();
    this.clearEventPool();
    this.isInitialized = false;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.performanceData.lastResetTime = performance.now();
    
    // Start metrics update interval
    this.metricsUpdateInterval = window.setInterval(() => {
      this.updateMetrics();
      
      if (this.adaptivePerformanceEnabled) {
        this.checkAdaptivePerformance();
      }
    }, this.metricsUpdateFrequency);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): InputPerformanceMetrics {
    const now = performance.now();
    const duration = now - this.performanceData.lastResetTime;
    
    // Calculate averages
    const avgLatency = this.calculateAverage(this.performanceData.inputLatencies);
    const avgGestureTime = this.calculateAverage(this.performanceData.gestureRecognitionTimes);
    const avgFrameRate = this.calculateAverage(this.performanceData.frameRates);
    const totalEvents = this.performanceData.eventCounts.reduce((sum, count) => sum + count, 0);
    
    // Estimate memory usage
    const estimatedMemory = this.estimateMemoryUsage();
    
    // Calculate battery impact
    const batteryImpact = this.calculateBatteryImpact();
    
    return {
      averageLatency: avgLatency,
      inputEventCount: totalEvents,
      gestureRecognitionTime: avgGestureTime,
      memoryUsage: estimatedMemory,
      droppedInputs: 0, // This would be tracked by InputManager
      frameRate: avgFrameRate,
      batteryImpact
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceData = {
      inputLatencies: [],
      gestureRecognitionTimes: [],
      eventCounts: [],
      memoryUsages: [],
      frameRates: [],
      lastResetTime: performance.now()
    };
  }

  /**
   * Enable or disable input prediction
   */
  enableInputPrediction(enabled: boolean): void {
    this.inputPrediction.enabled = enabled;
    
    if (!enabled) {
      this.inputPrediction.predictedEvents = [];
    }
  }

  /**
   * Set batch size for input processing
   */
  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(100, size));
  }

  /**
   * Set update frequency for input processing
   */
  setUpdateFrequency(frequency: number): void {
    this.updateFrequency = Math.max(30, Math.min(120, frequency));
  }

  /**
   * Enable or disable adaptive performance
   */
  enableAdaptivePerformance(enabled: boolean): void {
    this.adaptivePerformanceEnabled = enabled;
    
    if (enabled) {
      this.performanceHistory = [];
      this.lastPerformanceCheck = performance.now();
    }
  }

  /**
   * Set performance target mode
   */
  setPerformanceTarget(target: 'battery' | 'performance' | 'balanced'): void {
    this.performanceTarget = target;
    this.applyPerformanceTarget();
  }

  /**
   * Set performance mode (alias for setPerformanceTarget for facade compatibility)
   */
  setPerformanceMode(mode: 'battery' | 'performance' | 'balanced'): void {
    this.setPerformanceTarget(mode);
  }

  /**
   * Enable input prediction (alias for enableInputPrediction for facade compatibility)
   */
  enablePrediction(enabled: boolean): void {
    this.enableInputPrediction(enabled);
  }

  /**
   * Process input event with prediction optimization
   */
  processWithPrediction(event: RawInputEvent): RawInputEvent {
    if (!this.inputPrediction.enabled) {
      return event;
    }

    // Apply prediction if possible
    const predictedEvent = this.predictInput(event, 16); // 16ms delta time for 60fps
    
    if (predictedEvent) {
      // Use predicted event for smoother input
      return predictedEvent;
    }

    return event;
  }

  /**
   * Optimize for battery life
   */
  optimizeForBattery(): void {
    this.setPerformanceTarget('battery');
    this.batteryOptimizationEnabled = true;
    this.adjustForBatteryLevel();
  }

  /**
   * Optimize for performance
   */
  optimizeForPerformance(): void {
    this.setPerformanceTarget('performance');
    this.batteryOptimizationEnabled = false;
  }

  /**
   * Enable or disable event pooling
   */
  enableEventPooling(enabled: boolean): void {
    this.eventPool.enabled = enabled;
    
    if (!enabled) {
      this.clearEventPool();
    } else {
      this.initializeEventPool();
    }
  }

  /**
   * Set maximum pool size for event pooling
   */
  setMaxPoolSize(size: number): void {
    this.eventPool.maxSize = Math.max(10, Math.min(1000, size));
    
    // Trim pool if necessary
    if (this.eventPool.pool.length > this.eventPool.maxSize) {
      this.eventPool.pool = this.eventPool.pool.slice(0, this.eventPool.maxSize);
    }
  }

  /**
   * Clean up memory by clearing caches and pools
   */
  cleanupMemory(): void {
    // Clear event pool
    this.clearEventPool();
    this.initializeEventPool();
    
    // Clear prediction data
    this.inputPrediction.predictedEvents = [];
    
    // Trim performance data arrays
    this.trimPerformanceArrays();
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * Update performance tracking (called by InputManager)
   */
  update(): void {
    if (!this.isMonitoring) {
      return;
    }

    // Track frame rate
    const now = performance.now();
    if (this.performanceData.frameRates.length > 0) {
      const lastFrameTime = this.performanceData.frameRates[this.performanceData.frameRates.length - 1];
      const frameTime = now - lastFrameTime;
      const fps = 1000 / frameTime;
      this.performanceData.frameRates.push(fps);
    } else {
      this.performanceData.frameRates.push(60); // Initial estimate
    }
    
    // Limit array sizes
    this.trimPerformanceArrays();
  }

  /**
   * Record input latency (called by InputManager)
   */
  recordInputLatency(latency: number): void {
    if (this.isMonitoring) {
      this.performanceData.inputLatencies.push(latency);
    }
  }

  /**
   * Record gesture recognition time (called by TouchInputHandler)
   */
  recordGestureTime(time: number): void {
    if (this.isMonitoring) {
      this.performanceData.gestureRecognitionTimes.push(time);
    }
  }

  /**
   * Get event from pool or create new one
   */
  getPooledEvent(): any {
    if (!this.eventPool.enabled || this.eventPool.pool.length === 0) {
      return {};
    }
    
    const event = this.eventPool.pool.pop();
    this.eventPool.activeCount++;
    return event;
  }

  /**
   * Return event to pool
   */
  returnPooledEvent(event: any): void {
    if (!this.eventPool.enabled || this.eventPool.pool.length >= this.eventPool.maxSize) {
      return;
    }
    
    // Clear event properties
    for (const key in event) {
      delete event[key];
    }
    
    this.eventPool.pool.push(event);
    this.eventPool.activeCount = Math.max(0, this.eventPool.activeCount - 1);
  }

  /**
   * Predict next input based on current patterns
   */
  predictInput(currentEvent: any, deltaTime: number): any | null {
    if (!this.inputPrediction.enabled) {
      return null;
    }
    
    // Simple prediction based on velocity and patterns
    // This is a basic implementation - more sophisticated ML-based prediction could be added
    
    const now = performance.now();
    const lookAhead = now + this.inputPrediction.lookAheadTime;
    
    // For now, just predict continuation of movement
    if (currentEvent.type === 'move' && currentEvent.velocity) {
      const predictedPosition = {
        x: currentEvent.position.x + (currentEvent.velocity.x * this.inputPrediction.lookAheadTime),
        y: currentEvent.position.y + (currentEvent.velocity.y * this.inputPrediction.lookAheadTime)
      };
      
      const predictedEvent = {
        ...currentEvent,
        position: predictedPosition,
        timestamp: lookAhead,
        predicted: true
      };
      
      this.inputPrediction.predictedEvents.push({
        timestamp: lookAhead,
        event: predictedEvent,
        confidence: this.inputPrediction.confidence
      });
      
      return predictedEvent;
    }
    
    return null;
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor memory usage if supported
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      this.performanceData.memoryUsages.push(memoryInfo.usedJSHeapSize);
    }
  }

  /**
   * Initialize event pool
   */
  private initializeEventPool(): void {
    if (!this.eventPool.enabled) {
      return;
    }

    this.eventPool.pool = [];
    this.eventPool.activeCount = 0;
    
    // Pre-populate pool
    for (let i = 0; i < Math.min(this.eventPool.maxSize, 20); i++) {
      this.eventPool.pool.push({});
    }
  }

  /**
   * Clear event pool
   */
  private clearEventPool(): void {
    this.eventPool.pool = [];
    this.eventPool.activeCount = 0;
  }

  /**
   * Apply performance target settings
   */
  private applyPerformanceTarget(): void {
    switch (this.performanceTarget) {
      case 'battery':
        this.updateFrequency = 30;
        this.batchSize = 5;
        this.inputPrediction.enabled = false;
        this.batteryOptimizationEnabled = true;
        break;
        
      case 'performance':
        this.updateFrequency = 120;
        this.batchSize = 20;
        this.inputPrediction.enabled = true;
        this.batteryOptimizationEnabled = false;
        break;
        
      case 'balanced':
        this.updateFrequency = 60;
        this.batchSize = 10;
        this.inputPrediction.enabled = false;
        this.batteryOptimizationEnabled = false;
        break;
    }
  }

  /**
   * Initialize battery monitoring
   */
  private async initializeBatteryMonitoring(): Promise<void> {
    if (!this.batteryMonitoringSupported) {
      return;
    }

    try {
      const battery = await (navigator as any).getBattery();
      this.batteryLevel = battery.level;
      
      battery.addEventListener('levelchange', () => {
        this.batteryLevel = battery.level;
        this.adjustForBatteryLevel();
      });
      
      battery.addEventListener('chargingchange', () => {
        this.adjustForBatteryLevel();
      });
      
    } catch (error) {
      Logger.warn('Input', 'Battery monitoring not available:', error);
      this.batteryMonitoringSupported = false;
    }
  }

  /**
   * Adjust performance based on battery level
   */
  private adjustForBatteryLevel(): void {
    if (!this.batteryOptimizationEnabled) {
      return;
    }

    if (this.batteryLevel < 0.2) {
      // Low battery - aggressive optimization
      this.updateFrequency = Math.min(this.updateFrequency, 30);
      this.batchSize = Math.min(this.batchSize, 5);
      this.inputPrediction.enabled = false;
    } else if (this.batteryLevel < 0.5) {
      // Medium battery - moderate optimization
      this.updateFrequency = Math.min(this.updateFrequency, 45);
      this.batchSize = Math.min(this.batchSize, 8);
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    // Record current memory usage
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      this.performanceData.memoryUsages.push(memoryInfo.usedJSHeapSize);
    }
    
    // Trim arrays to prevent memory leaks
    this.trimPerformanceArrays();
  }

  /**
   * Check adaptive performance and adjust settings
   */
  private checkAdaptivePerformance(): void {
    const now = performance.now();
    
    if (now - this.lastPerformanceCheck < this.performanceCheckInterval) {
      return;
    }
    
    this.lastPerformanceCheck = now;
    
    // Calculate recent average frame rate
    const recentFrameRates = this.performanceData.frameRates.slice(-60); // Last 60 samples
    const avgFrameRate = this.calculateAverage(recentFrameRates);
    
    this.performanceHistory.push(avgFrameRate);
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift();
    }
    
    // Adjust settings based on performance
    if (avgFrameRate < 45) {
      // Performance is poor - reduce quality
      this.updateFrequency = Math.max(30, this.updateFrequency - 5);
      this.batchSize = Math.max(3, this.batchSize - 1);
      this.inputPrediction.enabled = false;
    } else if (avgFrameRate > 55 && this.performanceTarget === 'performance') {
      // Performance is good - can increase quality
      this.updateFrequency = Math.min(120, this.updateFrequency + 5);
      this.batchSize = Math.min(20, this.batchSize + 1);
      this.inputPrediction.enabled = true;
    }
  }

  /**
   * Calculate average of number array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Estimate memory usage of input system
   */
  private estimateMemoryUsage(): number {
    let estimated = 0;
    
    // Estimate based on tracked data
    estimated += this.performanceData.inputLatencies.length * 8; // 8 bytes per number
    estimated += this.performanceData.gestureRecognitionTimes.length * 8;
    estimated += this.performanceData.frameRates.length * 8;
    estimated += this.eventPool.pool.length * 100; // Rough estimate per event object
    estimated += this.inputPrediction.predictedEvents.length * 200; // Larger objects
    
    return estimated;
  }

  /**
   * Calculate battery impact based on current settings
   */
  private calculateBatteryImpact(): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // Factor in update frequency
    if (this.updateFrequency > 90) score += 2;
    else if (this.updateFrequency > 60) score += 1;
    
    // Factor in input prediction
    if (this.inputPrediction.enabled) score += 1;
    
    // Factor in batch size
    if (this.batchSize > 15) score += 1;
    
    // Factor in event pooling (reduces impact)
    if (this.eventPool.enabled) score -= 1;
    
    if (score <= 0) return 'low';
    else if (score <= 2) return 'medium';
    else return 'high';
  }

  /**
   * Trim performance data arrays to prevent memory leaks
   */
  private trimPerformanceArrays(): void {
    const maxLength = 1000;
    
    if (this.performanceData.inputLatencies.length > maxLength) {
      this.performanceData.inputLatencies = this.performanceData.inputLatencies.slice(-maxLength);
    }
    
    if (this.performanceData.gestureRecognitionTimes.length > maxLength) {
      this.performanceData.gestureRecognitionTimes = this.performanceData.gestureRecognitionTimes.slice(-maxLength);
    }
    
    if (this.performanceData.frameRates.length > maxLength) {
      this.performanceData.frameRates = this.performanceData.frameRates.slice(-maxLength);
    }
    
    if (this.performanceData.memoryUsages.length > maxLength) {
      this.performanceData.memoryUsages = this.performanceData.memoryUsages.slice(-maxLength);
    }
    
    // Clean up old predictions
    const now = performance.now();
    this.inputPrediction.predictedEvents = this.inputPrediction.predictedEvents.filter(
      prediction => now - prediction.timestamp < 1000 // Keep predictions for 1 second
    );
  }
}