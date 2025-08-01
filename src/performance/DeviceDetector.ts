import { EventEmitter } from 'eventemitter3';
import { 
  DeviceCapabilities, 
  DevicePerformanceTier, 
  DeviceThermalState 
} from '../contracts/Performance';

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
   * Detect comprehensive device capabilities
   */
  private async detectCapabilities(): Promise<DeviceCapabilities> {
    const canvas = document.createElement('canvas');
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    const capabilities: DeviceCapabilities = {
      // Hardware info
      deviceType: this.detectDeviceType(),
      performanceTier: DevicePerformanceTier.UNKNOWN, // Will be calculated later
      cores: this.getCoreCount(),
      memory: this.getMemorySize(),
      
      // Graphics capabilities
      webglVersion: this.getWebGLVersion(),
      maxTextureSize: this.getMaxTextureSize(),
      maxViewportDims: this.getMaxViewportDims(),
      supportedExtensions: this.getSupportedExtensions(),
      
      // Display info
      pixelRatio: window.devicePixelRatio || 1,
      screenSize: {
        width: screen.width,
        height: screen.height
      },
      refreshRate: this.getRefreshRate(),
      
      // Battery and thermal
      supportsBatteryAPI: 'getBattery' in navigator,
      supportsThermalAPI: this.supportsThermalAPI(),
      
      // Performance features
      supportsWebWorkers: typeof Worker !== 'undefined',
      supportsOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      supportsImageBitmap: typeof createImageBitmap !== 'undefined',
      supportsWebAssembly: typeof WebAssembly !== 'undefined'
    };

    canvas.remove();
    return capabilities;
  }

  /**
   * Detect device type based on user agent and screen size
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    if (isMobile) {
      // Distinguish between phone and tablet based on screen size
      const minDimension = Math.min(screen.width, screen.height);
      const maxDimension = Math.max(screen.width, screen.height);
      const aspectRatio = maxDimension / minDimension;
      
      // Tablets typically have larger screens and different aspect ratios
      if (minDimension >= 768 || (minDimension >= 600 && aspectRatio < 2)) {
        return 'tablet';
      }
      return 'mobile';
    }
    
    return 'desktop';
  }

  /**
   * Get estimated CPU core count
   */
  private getCoreCount(): number {
    return navigator.hardwareConcurrency || 2;
  }

  /**
   * Estimate device memory size
   */
  private getMemorySize(): number {
    // Use deviceMemory API if available
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory * 1024; // Convert GB to MB
    }
    
    // Fallback estimation based on device type and performance
    const deviceType = this.detectDeviceType();
    switch (deviceType) {
      case 'mobile':
        return 2048; // 2GB typical for mobile
      case 'tablet': 
        return 4096; // 4GB typical for tablets
      case 'desktop':
        return 8192; // 8GB typical for desktop
      default:
        return 2048;
    }
  }

  /**
   * Get WebGL version
   */
  private getWebGLVersion(): number {
    if (!this.gl) return 0;
    
    if (this.gl instanceof WebGL2RenderingContext) {
      return 2;
    } else if (this.gl instanceof WebGLRenderingContext) {
      return 1;
    }
    
    return 0;
  }

  /**
   * Get maximum texture size
   */
  private getMaxTextureSize(): number {
    if (!this.gl) return 0;
    return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
  }

  /**
   * Get maximum viewport dimensions
   */
  private getMaxViewportDims(): [number, number] {
    if (!this.gl) return [0, 0];
    const dims = this.gl.getParameter(this.gl.MAX_VIEWPORT_DIMS);
    return [dims[0], dims[1]];
  }

  /**
   * Get supported WebGL extensions
   */
  private getSupportedExtensions(): string[] {
    if (!this.gl) return [];
    return this.gl.getSupportedExtensions() || [];
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
   * Check if thermal API is supported
   */
  private supportsThermalAPI(): boolean {
    return 'connection' in navigator && 
           'thermalState' in (navigator as any).connection;
  }

  /**
   * Calculate performance tier based on detected capabilities
   */
  private calculatePerformanceTier(): DevicePerformanceTier {
    if (!this.capabilities) return DevicePerformanceTier.UNKNOWN;
    
    let score = 0;
    
    // CPU cores contribution (0-20 points)
    score += Math.min(this.capabilities.cores * 3, 20);
    
    // Memory contribution (0-25 points)
    const memoryGB = this.capabilities.memory / 1024;
    if (memoryGB >= 8) score += 25;
    else if (memoryGB >= 4) score += 20;
    else if (memoryGB >= 2) score += 15;
    else score += 10;
    
    // WebGL contribution (0-20 points)
    if (this.capabilities.webglVersion === 2) score += 20;
    else if (this.capabilities.webglVersion === 1) score += 15;
    
    // Texture size contribution (0-15 points)
    const textureSize = this.capabilities.maxTextureSize;
    if (textureSize >= 8192) score += 15;
    else if (textureSize >= 4096) score += 12;
    else if (textureSize >= 2048) score += 8;
    else score += 5;
    
    // Device type contribution (0-10 points)
    switch (this.capabilities.deviceType) {
      case 'desktop': score += 10; break;
      case 'tablet': score += 7; break;
      case 'mobile': score += 5; break;
    }
    
    // Advanced features contribution (0-10 points)
    let featureScore = 0;
    if (this.capabilities.supportsWebWorkers) featureScore += 2;
    if (this.capabilities.supportsOffscreenCanvas) featureScore += 2;
    if (this.capabilities.supportsImageBitmap) featureScore += 2;
    if (this.capabilities.supportsWebAssembly) featureScore += 2;
    if (this.capabilities.supportedExtensions.length > 20) featureScore += 2;
    score += featureScore;
    
    // Classify based on total score
    if (score >= 75) return DevicePerformanceTier.HIGH;
    else if (score >= 50) return DevicePerformanceTier.MID;
    else return DevicePerformanceTier.LOW;
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