import { EventEmitter } from 'eventemitter3';
import {
  MobileOptimizer as IMobileOptimizer,
  DevicePerformanceTier,
  DeviceThermalState,
  BatteryOptimizationMode,
  QualitySettings,
  QualityLevel
} from '../contracts/Performance';
import { DeviceDetector } from './DeviceDetector';
import { Logger } from '../utils/Logger.js';

/**
 * Battery information interface
 */
interface BatteryInfo {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

/**
 * Network information for optimization
 */
interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Thermal throttling configuration
 */
interface ThermalConfig {
  normalTemp: number;
  warmTemp: number;
  hotTemp: number;
  criticalTemp: number;
  throttleSteps: Array<{
    temperature: number;
    qualityReduction: number;
    fpsReduction: number;
  }>;
}

/**
 * Mobile-specific performance optimizer
 * Handles device tier detection, thermal management, and battery optimization
 */
export class MobileOptimizer extends EventEmitter implements IMobileOptimizer {
  private isInitialized = false;
  private deviceTier: DevicePerformanceTier = DevicePerformanceTier.UNKNOWN;
  private thermalState: DeviceThermalState = DeviceThermalState.NORMAL;
  private batteryOptimizationMode: BatteryOptimizationMode = BatteryOptimizationMode.BALANCED;
  
  // Battery monitoring
  private battery: any = null;
  private batteryLevel = 1.0;
  private isCharging = false;
  private batteryMonitorInterval: number | null = null;
  
  // Thermal monitoring
  private thermalMonitorInterval: number | null = null;
  private thermalThrottlingEnabled = true;
  private currentTemperature = 0;
  private thermalConfig: ThermalConfig;
  
  // Network monitoring
  private networkInfo: NetworkInfo | null = null;
  private networkMonitorInterval: number | null = null;
  
  // Performance scaling
  private baseQualitySettings: QualitySettings | null = null;
  private currentQualitySettings: QualitySettings | null = null;
  private performanceScale = 1.0;
  
  // Mobile-specific optimizations
  private touchOptimizationsEnabled = true;
  private backgroundThrottlingEnabled = true;
  private memoryPressureOptimizations = true;
  private lowPowerModeEnabled = false;
  
  // Performance monitoring
  private frameTimeTarget = 16.67; // 60fps
  private thermalThrottleHistory: number[] = [];
  private performanceHistory: Array<{
    timestamp: number;
    fps: number;
    temperature: number;
    batteryLevel: number;
    thermalState: DeviceThermalState;
  }> = [];

  constructor() {
    super();
    
    // Initialize thermal configuration
    this.thermalConfig = {
      normalTemp: 40,
      warmTemp: 50,
      hotTemp: 60,
      criticalTemp: 70,
      throttleSteps: [
        { temperature: 45, qualityReduction: 0.1, fpsReduction: 0 },
        { temperature: 55, qualityReduction: 0.25, fpsReduction: 0.1 },
        { temperature: 65, qualityReduction: 0.5, fpsReduction: 0.25 },
        { temperature: 75, qualityReduction: 0.75, fpsReduction: 0.5 }
      ]
    };
  }

  /**
   * Initialize mobile optimizer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Detect device tier
      this.deviceTier = this.detectDeviceTier();
      
      // Initialize battery monitoring
      await this.initializeBatteryMonitoring();
      
      // Initialize network monitoring
      this.initializeNetworkMonitoring();
      
      // Start thermal monitoring
      this.startThermalMonitoring();
      
      // Set initial optimization mode based on device
      this.setOptimalBatteryMode();
      
      // Listen for visibility changes
      this.setupVisibilityChangeHandling();
      
      this.isInitialized = true;
      this.emit('initialized', {
        deviceTier: this.deviceTier,
        batterySupported: !!this.battery,
        thermalSupported: this.supportsThermalAPI()
      });
      
    } catch (error) {
      this.emit('initialization-error', error);
      throw error;
    }
  }

  /**
   * Detect device performance tier using centralized DeviceDetector
   */
  detectDeviceTier(): DevicePerformanceTier {
    let score = 0;

    // Use centralized DeviceDetector for hardware info
    const cores = DeviceDetector.getCoreCount();
    const deviceMemory = DeviceDetector.getDeviceMemory();

    // CPU cores (0-20 points)
    score += Math.min(cores * 3, 20);

    // Memory (0-25 points)
    if (deviceMemory >= 8) score += 25;
    else if (deviceMemory >= 4) score += 20;
    else if (deviceMemory >= 2) score += 15;
    else score += 10;
    
    // WebGL capabilities (0-20 points)
    const webglScore = this.assessWebGLCapabilities();
    score += webglScore;
    
    // Performance benchmark (0-25 points)
    const benchmarkScore = this.runPerformanceBenchmark();
    score += benchmarkScore;
    
    // Device type adjustment (0-10 points)
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad/.test(userAgent)) {
      // iOS devices tend to have better optimization
      score += 8;
    } else if (/android/.test(userAgent)) {
      // Android varies widely
      score += 5;
    }
    
    // Classify tier based on score
    if (score >= 70) return DevicePerformanceTier.HIGH;
    else if (score >= 45) return DevicePerformanceTier.MID;
    else return DevicePerformanceTier.LOW;
  }

  /**
   * Assess WebGL capabilities for performance scoring
   */
  private assessWebGLCapabilities(): number {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return 0;
    
    let score = 0;
    
    // WebGL version
    if (gl instanceof WebGL2RenderingContext) {
      score += 8;
    } else {
      score += 5;
    }
    
    // Texture size
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (maxTextureSize >= 4096) score += 6;
    else if (maxTextureSize >= 2048) score += 4;
    else score += 2;
    
    // Extensions
    const extensions = gl.getSupportedExtensions() || [];
    if (extensions.length > 20) score += 4;
    else if (extensions.length > 10) score += 2;
    
    // Vertex shader precision
    const vertexPrecision = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
    if (vertexPrecision && vertexPrecision.precision > 0) score += 2;
    
    canvas.remove();
    return Math.min(score, 20);
  }

  /**
   * Run performance benchmark
   */
  private runPerformanceBenchmark(): number {
    const startTime = performance.now();
    let operationCount = 0;
    const maxOperations = 100000; // Fixed number of operations
    
    // CPU benchmark - synchronous
    for (let i = 0; i < maxOperations; i++) {
      Math.sin(i) * Math.cos(i) + Math.sqrt(i);
      operationCount++;
    }
    
    const elapsed = performance.now() - startTime;
    const opsPerSecond = (operationCount / elapsed) * 1000;
    
    // Calculate score based on operations per second
    if (opsPerSecond > 500000) return 25;
    else if (opsPerSecond > 300000) return 20;
    else if (opsPerSecond > 150000) return 15;
    else if (opsPerSecond > 75000) return 10;
    else return 5;
  }

  /**
   * Initialize battery monitoring
   */
  private async initializeBatteryMonitoring(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        this.battery = await (navigator as any).getBattery();
        
        this.batteryLevel = this.battery.level;
        this.isCharging = this.battery.charging;
        
        // Listen for battery events
        this.battery.addEventListener('chargingchange', () => {
          this.isCharging = this.battery.charging;
          this.handleBatteryChange();
        });
        
        this.battery.addEventListener('levelchange', () => {
          this.batteryLevel = this.battery.level;
          this.handleBatteryChange();
        });
        
        // Start battery monitoring
        this.batteryMonitorInterval = window.setInterval(() => {
          this.updateBatteryInfo();
        }, 10000); // Check every 10 seconds
        
        this.emit('battery-initialized', {
          level: this.batteryLevel,
          charging: this.isCharging
        });
      }
    } catch (error) {
      Logger.warn('Performance', 'Battery API not available:', error);
    }
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    const connection = (navigator as any).connection;
    if (connection) {
      this.updateNetworkInfo();
      
      connection.addEventListener('change', () => {
        this.updateNetworkInfo();
      });
      
      this.networkMonitorInterval = window.setInterval(() => {
        this.updateNetworkInfo();
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Update network information
   */
  private updateNetworkInfo(): void {
    const connection = (navigator as any).connection;
    if (connection) {
      this.networkInfo = {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
        saveData: connection.saveData || false
      };
      
      // Adjust optimizations based on network
      if (this.networkInfo.saveData || this.networkInfo.effectiveType === '2g' || this.networkInfo.effectiveType === 'slow-2g') {
        this.enableDataSavingOptimizations();
      }
      
      this.emit('network-updated', this.networkInfo);
    }
  }

  /**
   * Start thermal monitoring
   */
  private startThermalMonitoring(): void {
    // Check for thermal API support
    if (this.supportsThermalAPI()) {
      this.thermalMonitorInterval = window.setInterval(() => {
        this.updateThermalState();
      }, 5000); // Check every 5 seconds
    } else {
      // Fallback: monitor performance metrics for thermal estimation
      this.thermalMonitorInterval = window.setInterval(() => {
        this.estimateThermalState();
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Check if thermal API is supported
   */
  private supportsThermalAPI(): boolean {
    const connection = (navigator as any).connection;
    return connection && 'thermalState' in connection;
  }

  /**
   * Update thermal state from system APIs
   */
  private updateThermalState(): void {
    try {
      const connection = (navigator as any).connection;
      if (connection && 'thermalState' in connection) {
        const thermalState = connection.thermalState;
        
        switch (thermalState) {
          case 'nominal':
            this.thermalState = DeviceThermalState.NORMAL;
            this.currentTemperature = 35;
            break;
          case 'fair':
            this.thermalState = DeviceThermalState.FAIR;
            this.currentTemperature = 45;
            break;
          case 'serious':
            this.thermalState = DeviceThermalState.SERIOUS;
            this.currentTemperature = 60;
            break;
          case 'critical':
            this.thermalState = DeviceThermalState.CRITICAL;
            this.currentTemperature = 75;
            break;
        }
        
        this.handleThermalStateChange();
      }
    } catch (error) {
      Logger.warn('Performance', 'Thermal API error:', error);
    }
  }

  /**
   * Estimate thermal state based on performance metrics
   */
  private estimateThermalState(): void {
    // Estimate thermal state based on performance degradation
    if (this.performanceHistory.length >= 10) {
      const recent = this.performanceHistory.slice(-5);
      const older = this.performanceHistory.slice(-10, -5);
      
      const recentAvgFps = recent.reduce((sum, p) => sum + p.fps, 0) / recent.length;
      const olderAvgFps = older.reduce((sum, p) => sum + p.fps, 0) / older.length;
      
      const fpsDropRatio = (olderAvgFps - recentAvgFps) / olderAvgFps;
      
      // Estimate thermal state based on performance drop
      if (fpsDropRatio > 0.3) {
        this.thermalState = DeviceThermalState.CRITICAL;
        this.currentTemperature = 70;
      } else if (fpsDropRatio > 0.2) {
        this.thermalState = DeviceThermalState.SERIOUS;
        this.currentTemperature = 60;
      } else if (fpsDropRatio > 0.1) {
        this.thermalState = DeviceThermalState.FAIR;
        this.currentTemperature = 45;
      } else {
        this.thermalState = DeviceThermalState.NORMAL;
        this.currentTemperature = 35;
      }
      
      this.handleThermalStateChange();
    }
  }

  /**
   * Handle thermal state changes
   */
  private handleThermalStateChange(): void {
    if (this.thermalThrottlingEnabled) {
      this.applyThermalThrottling();
    }
    
    this.thermalThrottleHistory.push(this.currentTemperature);
    if (this.thermalThrottleHistory.length > 60) {
      this.thermalThrottleHistory.shift();
    }
    
    this.emit('thermal-state-changed', {
      state: this.thermalState,
      temperature: this.currentTemperature
    });
  }

  /**
   * Apply thermal throttling optimizations
   */
  private applyThermalThrottling(): void {
    if (!this.currentQualitySettings) return;
    
    const throttleStep = this.thermalConfig.throttleSteps.find(step => 
      this.currentTemperature >= step.temperature
    );
    
    if (throttleStep) {
      const newSettings = { ...this.currentQualitySettings };
      
      // Reduce quality settings
      newSettings.renderScale = Math.max(0.5, 1.0 - throttleStep.qualityReduction);
      newSettings.textureQuality = Math.max(QualityLevel.LOW, 
        newSettings.textureQuality - Math.floor(throttleStep.qualityReduction * 2));
      newSettings.effectsQuality = Math.max(QualityLevel.LOW,
        newSettings.effectsQuality - Math.floor(throttleStep.qualityReduction * 2));
      newSettings.particleCount = Math.max(100,
        newSettings.particleCount * (1 - throttleStep.qualityReduction));
      
      this.currentQualitySettings = newSettings;
      
      this.emit('thermal-throttling-applied', {
        temperature: this.currentTemperature,
        qualityReduction: throttleStep.qualityReduction,
        settings: newSettings
      });
    }
  }

  /**
   * Handle battery level changes
   */
  private handleBatteryChange(): void {
    // Adjust optimization mode based on battery level
    if (!this.isCharging && this.batteryLevel < 0.2) {
      // Critical battery - enable power saving
      this.setBatteryOptimizationMode(BatteryOptimizationMode.POWER_SAVER);
    } else if (!this.isCharging && this.batteryLevel < 0.5) {
      // Low battery - use balanced mode
      this.setBatteryOptimizationMode(BatteryOptimizationMode.BALANCED);
    } else if (this.isCharging || this.batteryLevel > 0.8) {
      // Good battery - allow performance mode
      this.setBatteryOptimizationMode(BatteryOptimizationMode.PERFORMANCE);
    }
    
    this.emit('battery-changed', {
      level: this.batteryLevel,
      charging: this.isCharging,
      mode: this.batteryOptimizationMode
    });
  }

  /**
   * Update battery information
   */
  private updateBatteryInfo(): void {
    if (this.battery) {
      this.batteryLevel = this.battery.level;
      this.isCharging = this.battery.charging;
    }
  }

  /**
   * Setup visibility change handling for background optimization
   */
  private setupVisibilityChangeHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.backgroundThrottlingEnabled) {
          this.enableBackgroundOptimizations();
        }
      } else {
        this.disableBackgroundOptimizations();
      }
    });
  }

  /**
   * Enable optimizations when app goes to background
   */
  private enableBackgroundOptimizations(): void {
    this.emit('background-optimizations-enabled');
  }

  /**
   * Disable background optimizations when app becomes visible
   */
  private disableBackgroundOptimizations(): void {
    this.emit('background-optimizations-disabled');
  }

  /**
   * Enable data saving optimizations
   */
  private enableDataSavingOptimizations(): void {
    this.emit('data-saving-enabled', {
      networkType: this.networkInfo?.effectiveType,
      saveData: this.networkInfo?.saveData
    });
  }

  /**
   * Set optimal battery optimization mode
   */
  private setOptimalBatteryMode(): void {
    switch (this.deviceTier) {
      case DevicePerformanceTier.HIGH:
        this.setBatteryOptimizationMode(BatteryOptimizationMode.PERFORMANCE);
        break;
      case DevicePerformanceTier.MID:
        this.setBatteryOptimizationMode(BatteryOptimizationMode.BALANCED);
        break;
      case DevicePerformanceTier.LOW:
        this.setBatteryOptimizationMode(BatteryOptimizationMode.POWER_SAVER);
        break;
      default:
        this.setBatteryOptimizationMode(BatteryOptimizationMode.BALANCED);
    }
  }

  /**
   * Get current thermal state
   */
  getThermalState(): DeviceThermalState {
    return this.thermalState;
  }

  /**
   * Get battery level (0-1)
   */
  getBatteryLevel(): number {
    return this.batteryLevel;
  }

  /**
   * Get current battery optimization mode
   */
  getBatteryOptimizationMode(): BatteryOptimizationMode {
    return this.batteryOptimizationMode;
  }

  /**
   * Set battery optimization mode
   */
  setBatteryOptimizationMode(mode: BatteryOptimizationMode): void {
    const oldMode = this.batteryOptimizationMode;
    this.batteryOptimizationMode = mode;
    
    if (oldMode !== mode) {
      this.applyBatteryOptimizations(mode);
      this.emit('battery-mode-changed', { oldMode, newMode: mode });
    }
  }

  /**
   * Apply battery optimizations based on mode
   */
  private applyBatteryOptimizations(mode: BatteryOptimizationMode): void {
    if (!this.currentQualitySettings) return;
    
    const settings = { ...this.currentQualitySettings };
    
    switch (mode) {
      case BatteryOptimizationMode.POWER_SAVER:
        settings.renderScale = 0.7;
        settings.textureQuality = QualityLevel.LOW;
        settings.effectsQuality = QualityLevel.LOW;
        settings.shadowQuality = QualityLevel.LOW;
        settings.antialiasing = false;
        settings.particleCount = Math.min(settings.particleCount, 200);
        settings.maxAudioSources = Math.min(settings.maxAudioSources, 8);
        this.frameTimeTarget = 33.33; // 30fps
        break;
        
      case BatteryOptimizationMode.BALANCED:
        settings.renderScale = 0.85;
        settings.textureQuality = QualityLevel.MEDIUM;
        settings.effectsQuality = QualityLevel.MEDIUM;
        settings.shadowQuality = QualityLevel.MEDIUM;
        settings.antialiasing = true;
        settings.particleCount = Math.min(settings.particleCount, 500);
        settings.maxAudioSources = Math.min(settings.maxAudioSources, 16);
        this.frameTimeTarget = 16.67; // 60fps
        break;
        
      case BatteryOptimizationMode.PERFORMANCE:
        // Use base settings or even enhance them
        settings.renderScale = 1.0;
        settings.textureQuality = QualityLevel.HIGH;
        settings.effectsQuality = QualityLevel.HIGH;
        settings.shadowQuality = QualityLevel.HIGH;
        settings.antialiasing = true;
        // Don't limit particle count or audio sources
        this.frameTimeTarget = 16.67; // 60fps
        break;
    }
    
    this.currentQualitySettings = settings;
    this.emit('battery-optimizations-applied', { mode, settings });
  }

  /**
   * Enable thermal throttling
   */
  enableThermalThrottling(): void {
    this.thermalThrottlingEnabled = true;
    this.emit('thermal-throttling-enabled');
  }

  /**
   * Disable thermal throttling
   */
  disableThermalThrottling(): void {
    this.thermalThrottlingEnabled = false;
    this.emit('thermal-throttling-disabled');
  }

  /**
   * Optimize for battery life
   */
  optimizeForBattery(): void {
    this.setBatteryOptimizationMode(BatteryOptimizationMode.POWER_SAVER);
    this.enableBackgroundOptimizations();
    this.lowPowerModeEnabled = true;
    
    this.emit('battery-optimization-enabled');
  }

  /**
   * Optimize for performance
   */
  optimizeForPerformance(): void {
    this.setBatteryOptimizationMode(BatteryOptimizationMode.PERFORMANCE);
    this.lowPowerModeEnabled = false;
    
    this.emit('performance-optimization-enabled');
  }

  /**
   * Update performance metrics for thermal estimation
   */
  updatePerformanceMetrics(fps: number): void {
    this.performanceHistory.push({
      timestamp: Date.now(),
      fps,
      temperature: this.currentTemperature,
      batteryLevel: this.batteryLevel,
      thermalState: this.thermalState
    });
    
    // Limit history size
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Get mobile optimization report
   */
  getOptimizationReport(): any {
    return {
      device: {
        tier: this.deviceTier,
        userAgent: navigator.userAgent
      },
      thermal: {
        state: this.thermalState,
        temperature: this.currentTemperature,
        throttlingEnabled: this.thermalThrottlingEnabled,
        history: this.thermalThrottleHistory.slice(-10)
      },
      battery: {
        level: this.batteryLevel,
        charging: this.isCharging,
        optimizationMode: this.batteryOptimizationMode,
        lowPowerMode: this.lowPowerModeEnabled
      },
      network: this.networkInfo,
      optimizations: {
        touchOptimizations: this.touchOptimizationsEnabled,
        backgroundThrottling: this.backgroundThrottlingEnabled,
        memoryPressure: this.memoryPressureOptimizations
      },
      performance: {
        frameTimeTarget: this.frameTimeTarget,
        recentHistory: this.performanceHistory.slice(-5)
      }
    };
  }

  /**
   * Set quality settings reference for optimization
   */
  setQualitySettings(settings: QualitySettings): void {
    if (!this.baseQualitySettings) {
      this.baseQualitySettings = { ...settings };
    }
    this.currentQualitySettings = { ...settings };
  }

  /**
   * Get optimized quality settings
   */
  getOptimizedQualitySettings(): QualitySettings | null {
    return this.currentQualitySettings ? { ...this.currentQualitySettings } : null;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.batteryMonitorInterval) {
      clearInterval(this.batteryMonitorInterval);
      this.batteryMonitorInterval = null;
    }
    
    if (this.thermalMonitorInterval) {
      clearInterval(this.thermalMonitorInterval);
      this.thermalMonitorInterval = null;
    }
    
    if (this.networkMonitorInterval) {
      clearInterval(this.networkMonitorInterval);
      this.networkMonitorInterval = null;
    }
    
    // Clean up battery event listeners
    if (this.battery) {
      this.battery.removeEventListener('chargingchange', this.handleBatteryChange);
      this.battery.removeEventListener('levelchange', this.handleBatteryChange);
    }
    
    this.performanceHistory.length = 0;
    this.thermalThrottleHistory.length = 0;
    
    this.removeAllListeners();
    this.isInitialized = false;
  }
}