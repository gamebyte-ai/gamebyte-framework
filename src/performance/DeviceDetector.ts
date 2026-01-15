import { EventEmitter } from 'eventemitter3';
import { DeviceCapabilities, DevicePerformanceTier, DeviceThermalState } from '../contracts/Performance';
import {
  detectDeviceType,
  getHardwareConcurrency,
  estimateDeviceMemory,
  getWebGLVersion,
  getMaxTextureSize,
  getMaxViewportDims,
  getSupportedExtensions,
  getScreenInfo,
  calculatePerformanceTierForPerformanceContract,
  supportsBatteryAPI,
  supportsThermalAPI,
} from '../utils/DeviceDetectionUtils';

/**
 * Device detection and capabilities assessment system
 * Analyzes device hardware and capabilities for optimization
 */
export class DeviceDetector extends EventEmitter {
  private capabilities: DeviceCapabilities | null = null;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private performanceTier: DevicePerformanceTier = DevicePerformanceTier.UNKNOWN;
  private thermalState: DeviceThermalState = DeviceThermalState.NORMAL;
  private thermalMonitorInterval: number | null = null;

  /**
   * Initialize device detection
   */
  async initialize(): Promise<void> {
    this.capabilities = await this.detectCapabilities();
    this.performanceTier = this.calculatePerformanceTier();
    this.startThermalMonitoring();
    
    this.emit('initialized', this.capabilities);
  }

  /**
   * Get device capabilities
   */
  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get device performance tier
   */
  getPerformanceTier(): DevicePerformanceTier {
    return this.performanceTier;
  }

  /**
   * Get current thermal state
   */
  getThermalState(): DeviceThermalState {
    return this.thermalState;
  }

  /**
   * Force re-detection of capabilities
   */
  async refresh(): Promise<void> {
    this.capabilities = await this.detectCapabilities();
    this.performanceTier = this.calculatePerformanceTier();
    this.emit('capabilities-updated', this.capabilities);
  }

  /**
   * Detect comprehensive device capabilities.
   * Uses centralized DeviceDetectionUtils for most detection.
   */
  private async detectCapabilities(): Promise<DeviceCapabilities> {
    const canvas = document.createElement('canvas');
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    const screenInfo = getScreenInfo();

    const capabilities: DeviceCapabilities = {
      // Hardware info - using centralized utilities
      deviceType: detectDeviceType(),
      performanceTier: DevicePerformanceTier.UNKNOWN, // Will be calculated later
      cores: getHardwareConcurrency(),
      memory: estimateDeviceMemory() * 1024, // Convert GB to MB

      // Graphics capabilities - using centralized utilities
      webglVersion: getWebGLVersion(),
      maxTextureSize: getMaxTextureSize(),
      maxViewportDims: getMaxViewportDims(),
      supportedExtensions: getSupportedExtensions(),

      // Display info
      pixelRatio: screenInfo.pixelRatio,
      screenSize: {
        width: screenInfo.width,
        height: screenInfo.height,
      },
      refreshRate: this.getRefreshRate(),

      // Battery and thermal - using centralized utilities
      supportsBatteryAPI: supportsBatteryAPI(),
      supportsThermalAPI: supportsThermalAPI(),

      // Performance features
      supportsWebWorkers: typeof Worker !== 'undefined',
      supportsOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      supportsImageBitmap: typeof createImageBitmap !== 'undefined',
      supportsWebAssembly: typeof WebAssembly !== 'undefined',
    };

    canvas.remove();
    return capabilities;
  }

  /**
   * Get display refresh rate
   */
  private getRefreshRate(): number {
    // Try to detect refresh rate using requestAnimationFrame timing
    let refreshRate = 60; // Default fallback
    
    if ('getDisplayMedia' in navigator.mediaDevices) {
      // Modern browsers might have display info
      try {
        const displayInfo = (screen as any).orientation || {};
        refreshRate = displayInfo.refreshRate || 60;
      } catch (e) {
        // Fallback to 60Hz
      }
    }
    
    return refreshRate;
  }

  /**
   * Calculate performance tier based on detected capabilities.
   * Uses centralized utility for consistent tier calculation across the framework.
   */
  private calculatePerformanceTier(): DevicePerformanceTier {
    if (!this.capabilities) return DevicePerformanceTier.UNKNOWN;

    // Use centralized performance tier calculation
    return calculatePerformanceTierForPerformanceContract();
  }

  /**
   * Start monitoring thermal state
   */
  private startThermalMonitoring(): void {
    if (!this.capabilities?.supportsThermalAPI) return;
    
    // Monitor thermal state every 5 seconds
    this.thermalMonitorInterval = window.setInterval(() => {
      this.updateThermalState();
    }, 5000);
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
            break;
          case 'fair':
            this.thermalState = DeviceThermalState.FAIR;
            break;
          case 'serious':
            this.thermalState = DeviceThermalState.SERIOUS;
            break;
          case 'critical':
            this.thermalState = DeviceThermalState.CRITICAL;
            break;
          default:
            this.thermalState = DeviceThermalState.NORMAL;
        }
        
        this.emit('thermal-state-changed', this.thermalState);
      }
    } catch (error) {
      // Thermal API not available or failed
    }
  }

  /**
   * Run performance benchmark to refine tier detection
   */
  async runPerformanceBenchmark(): Promise<number> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        resolve(0);
        return;
      }
      
      // Simple rendering benchmark
      const startTime = performance.now();
      let frames = 0;
      const maxFrames = 100;
      
      const renderFrame = () => {
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Draw some geometry to stress test
        const vertices = new Float32Array([
          -1, -1, 1, -1, 0, 1,
          -1, -1, 0, 1, -1, 1
        ]);
        
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        frames++;
        
        if (frames < maxFrames) {
          requestAnimationFrame(renderFrame);
        } else {
          const endTime = performance.now();
          const totalTime = endTime - startTime;
          const fps = (frames * 1000) / totalTime;
          
          canvas.remove();
          resolve(fps);
        }
      };
      
      renderFrame();
    });
  }

  /**
   * Get device-specific optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.capabilities) return recommendations;
    
    switch (this.performanceTier) {
      case DevicePerformanceTier.LOW:
        recommendations.push('Enable aggressive culling');
        recommendations.push('Reduce texture quality');
        recommendations.push('Limit particle effects');
        recommendations.push('Reduce shadow quality');
        recommendations.push('Enable object pooling');
        break;
        
      case DevicePerformanceTier.MID:
        recommendations.push('Enable moderate culling');
        recommendations.push('Use medium texture quality');
        recommendations.push('Limit complex shaders');
        recommendations.push('Enable batching');
        break;
        
      case DevicePerformanceTier.HIGH:
        recommendations.push('Enable all visual effects');
        recommendations.push('Use high-quality textures');
        recommendations.push('Enable advanced lighting');
        break;
    }
    
    if (this.capabilities.deviceType === 'mobile') {
      recommendations.push('Enable battery optimization');
      recommendations.push('Reduce background processing');
      recommendations.push('Use touch-optimized controls');
    }
    
    if (this.thermalState !== DeviceThermalState.NORMAL) {
      recommendations.push('Enable thermal throttling');
      recommendations.push('Reduce rendering complexity');
    }
    
    return recommendations;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.thermalMonitorInterval) {
      clearInterval(this.thermalMonitorInterval);
      this.thermalMonitorInterval = null;
    }
    
    this.removeAllListeners();
    this.capabilities = null;
    this.gl = null;
  }
}