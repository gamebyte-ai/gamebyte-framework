import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { GameByteAssetManager, AssetManagerConfig } from '../assets/GameByteAssetManager';
import { 
  AssetManager, 
  CacheEvictionStrategy, 
  DevicePerformanceTier,
  DeviceCapabilities 
} from '../contracts/AssetManager';

/**
 * Asset service provider configuration.
 */
export interface AssetServiceProviderConfig {
  /** Asset manager configuration */
  assetManager?: Partial<AssetManagerConfig>;
  /** Auto-detect device capabilities */
  autoDetectDevice?: boolean;
  /** Enable asset preloading */
  enablePreloading?: boolean;
  /** Preload asset configurations */
  preloadAssets?: Array<{
    id: string;
    type: string;
    src: string;
    priority?: number;
  }>;
  /** Custom cache configuration */
  cacheConfig?: {
    maxSizeMB?: number;
    maxItems?: number;
    enablePersistent?: boolean;
    evictionStrategy?: CacheEvictionStrategy;
    ttlMinutes?: number;
  };
}

/**
 * Asset service provider for the GameByte framework.
 * Integrates the asset management system with the framework's service container.
 */
export class AssetServiceProvider extends AbstractServiceProvider {
  private config: AssetServiceProviderConfig;
  
  constructor(config: AssetServiceProviderConfig = {}) {
    super();
    this.config = {
      autoDetectDevice: true,
      enablePreloading: false,
      ...config
    };
  }
  
  /**
   * Register asset management services in the container.
   */
  register(app: GameByte): void {
    // Register asset manager as singleton
    app.singleton('asset.manager', () => {
      const assetManagerConfig = this.createAssetManagerConfig();
      return new GameByteAssetManager(assetManagerConfig);
    });
    
    // Register alias for easier access
    app.getContainer().alias('AssetManager', 'asset.manager');
    app.getContainer().alias('assets', 'asset.manager');
    
    // Register device capabilities service
    app.singleton('device.capabilities', () => {
      if (this.config.autoDetectDevice) {
        return this.detectDeviceCapabilities();
      }
      return this.config.assetManager?.deviceCapabilities || this.getDefaultDeviceCapabilities();
    });
  }
  
  /**
   * Boot asset management services.
   */
  async boot(app: GameByte): Promise<void> {
    const assetManager = app.make<AssetManager>('asset.manager');
    
    // Setup event listeners for framework integration
    this.setupEventListeners(app, assetManager);
    
    // Preload assets if enabled
    if (this.config.enablePreloading && this.config.preloadAssets) {
      await this.preloadAssets(assetManager);
    }
    
    // Setup memory management integration
    this.setupMemoryManagement(app, assetManager);
    
    // Register cleanup handler
    this.setupCleanupHandler(app, assetManager);
  }
  
  /**
   * Define services this provider provides.
   */
  provides(): string[] {
    return [
      'asset.manager',
      'AssetManager',
      'assets',
      'device.capabilities'
    ];
  }
  
  /**
   * Create asset manager configuration.
   */
  private createAssetManagerConfig(): AssetManagerConfig {
    const deviceCapabilities = this.config.autoDetectDevice 
      ? this.detectDeviceCapabilities()
      : this.config.assetManager?.deviceCapabilities || this.getDefaultDeviceCapabilities();
    
    // Calculate cache size based on device tier
    const cacheConfig = this.createCacheConfig(deviceCapabilities);
    
    return {
      cache: cacheConfig,
      maxConcurrentLoads: this.getOptimalConcurrentLoads(deviceCapabilities),
      defaultTimeout: 30000,
      defaultRetries: 3,
      autoMemoryOptimization: true,
      memoryPressureThreshold: 0.8,
      deviceCapabilities,
      ...this.config.assetManager
    };
  }
  
  /**
   * Create cache configuration based on device capabilities.
   */
  private createCacheConfig(deviceCapabilities: DeviceCapabilities) {
    const config = this.config.cacheConfig || {};
    
    // Calculate optimal cache size based on device tier
    let maxSizeMB: number;
    switch (deviceCapabilities.performanceTier) {
      case DevicePerformanceTier.LOW:
        maxSizeMB = config.maxSizeMB || 25;
        break;
      case DevicePerformanceTier.MEDIUM:
        maxSizeMB = config.maxSizeMB || 50;
        break;
      case DevicePerformanceTier.HIGH:
        maxSizeMB = config.maxSizeMB || 100;
        break;
      case DevicePerformanceTier.PREMIUM:
        maxSizeMB = config.maxSizeMB || 200;
        break;
      default:
        maxSizeMB = config.maxSizeMB || 50;
    }
    
    const maxItems = config.maxItems || Math.floor(maxSizeMB / 2); // Estimate 2MB per asset average
    const ttl = config.ttlMinutes ? config.ttlMinutes * 60 * 1000 : undefined;
    
    return {
      maxSize: maxSizeMB * 1024 * 1024, // Convert to bytes
      maxItems,
      evictionStrategy: config.evictionStrategy || CacheEvictionStrategy.LRU,
      ttl,
      persistent: config.enablePersistent !== false, // Default to true
      version: '1.0.0'
    };
  }
  
  /**
   * Get optimal concurrent loads based on device capabilities.
   */
  private getOptimalConcurrentLoads(deviceCapabilities: DeviceCapabilities): number {
    const baseConcurrency = deviceCapabilities.screen.width > 1024 ? 8 : 6;
    
    switch (deviceCapabilities.performanceTier) {
      case DevicePerformanceTier.LOW:
        return Math.min(baseConcurrency - 2, 3);
      case DevicePerformanceTier.MEDIUM:
        return baseConcurrency - 1;
      case DevicePerformanceTier.HIGH:
        return baseConcurrency;
      case DevicePerformanceTier.PREMIUM:
        return baseConcurrency + 2;
      default:
        return baseConcurrency;
    }
  }
  
  /**
   * Detect device capabilities.
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const screen = window.screen;
    const nav = navigator as any;
    
    // Detect available memory
    const deviceMemory = nav.deviceMemory || this.estimateDeviceMemory();
    const hardwareConcurrency = nav.hardwareConcurrency || 4;
    
    // Detect performance tier
    let performanceTier: DevicePerformanceTier = DevicePerformanceTier.MEDIUM;
    
    // Use multiple heuristics for performance detection
    const pixelRatio = window.devicePixelRatio || 1;
    const screenSize = screen.width * screen.height;
    const connectionType = nav.connection?.effectiveType || '4g';
    
    if (deviceMemory >= 8 && hardwareConcurrency >= 8 && pixelRatio >= 2) {
      performanceTier = DevicePerformanceTier.PREMIUM;
    } else if (deviceMemory >= 6 && hardwareConcurrency >= 6) {
      performanceTier = DevicePerformanceTier.HIGH;
    } else if (deviceMemory <= 2 || hardwareConcurrency <= 2 || connectionType === 'slow-2g') {
      performanceTier = DevicePerformanceTier.LOW;
    }
    
    return {
      performanceTier,
      availableMemory: deviceMemory * 1024, // Convert to MB
      gpuTier: this.detectGPUTier(),
      supportedTextureFormats: this.detectTextureFormats(),
      supportedAudioFormats: this.detectAudioFormats(),
      connectionType: connectionType as any,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio
      },
      platform: this.detectPlatform()
    };
  }
  
  /**
   * Estimate device memory if not available.
   */
  private estimateDeviceMemory(): number {
    const ua = navigator.userAgent.toLowerCase();
    
    // Very rough estimates based on user agent
    if (/iphone|ipad/.test(ua)) {
      if (/iphone.*15|ipad.*15/.test(ua)) return 6; // iPhone 15 series
      if (/iphone.*14|ipad.*14/.test(ua)) return 6; // iPhone 14 series
      if (/iphone.*13|ipad.*13/.test(ua)) return 4; // iPhone 13 series
      return 3; // Older iPhones
    }
    
    if (/android/.test(ua)) {
      // Most Android devices have 4-8GB RAM
      return 4;
    }
    
    // Desktop/other
    return 8;
  }
  
  /**
   * Detect GPU tier.
   */
  private detectGPUTier(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return 'none';
      
      const webglContext = gl as WebGLRenderingContext;
      const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        
        if (/nvidia|geforce/i.test(renderer)) return 'high';
        if (/amd|radeon/i.test(renderer)) return 'high';
        if (/intel/i.test(renderer)) return 'medium';
        if (/apple/i.test(renderer)) return 'high';
        if (/mali|adreno|powerVR/i.test(renderer)) return 'medium';
      }
      
      return 'unknown';
    } catch {
      return 'none';
    }
  }
  
  /**
   * Detect supported texture formats.
   */
  private detectTextureFormats(): string[] {
    const formats: string[] = [];
    const canvas = document.createElement('canvas');
    
    try {
      // Test WebP support
      if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
        formats.push('webp');
      }
      
      // Test AVIF support
      if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
        formats.push('avif');
      }
    } catch {
      // Ignore errors
    }
    
    // Always supported
    formats.push('jpeg', 'png');
    
    return formats;
  }
  
  /**
   * Detect supported audio formats.
   */
  private detectAudioFormats(): string[] {
    const formats: string[] = [];
    const audio = document.createElement('audio');
    
    if (audio.canPlayType('audio/mpeg;')) formats.push('mp3');
    if (audio.canPlayType('audio/ogg; codecs="vorbis"')) formats.push('ogg');
    if (audio.canPlayType('audio/webm; codecs="vorbis"')) formats.push('webm');
    if (audio.canPlayType('audio/aac;')) formats.push('aac');
    if (audio.canPlayType('audio/wav; codecs="1"')) formats.push('wav');
    
    return formats;
  }
  
  /**
   * Detect platform.
   */
  private detectPlatform(): 'ios' | 'android' | 'web' {
    const ua = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'web';
  }
  
  /**
   * Get default device capabilities.
   */
  private getDefaultDeviceCapabilities(): DeviceCapabilities {
    return {
      performanceTier: DevicePerformanceTier.MEDIUM,
      availableMemory: 4096, // 4GB
      gpuTier: 'medium',
      supportedTextureFormats: ['jpeg', 'png', 'webp'],
      supportedAudioFormats: ['mp3', 'ogg', 'aac'],
      connectionType: '4g',
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1
      },
      platform: 'web'
    };
  }
  
  /**
   * Setup event listeners for framework integration.
   */
  private setupEventListeners(app: GameByte, assetManager: AssetManager): void {
    // Forward asset manager events to framework
    assetManager.on('asset:loaded', (asset) => {
      app.emit('asset:loaded', asset);
    });
    
    assetManager.on('asset:failed', (assetId, error) => {
      app.emit('asset:failed', assetId, error);
    });
    
    assetManager.on('batch:completed', (results) => {
      app.emit('assets:batch:completed', results);
    });
    
    assetManager.on('memory:pressure', (usage, limit) => {
      app.emit('memory:pressure', usage, limit);
    });
    
    // Listen for framework events
    app.on('scene:changing', () => {
      // Trigger garbage collection on scene changes
      assetManager.optimizeMemory().catch(console.warn);
    });
    
    app.on('visibility:hidden', () => {
      // Aggressive cleanup when app goes to background
      assetManager.getCache().evict().catch(console.warn);
    });
  }
  
  /**
   * Preload configured assets.
   */
  private async preloadAssets(assetManager: AssetManager): Promise<void> {
    if (!this.config.preloadAssets) return;
    
    try {
      const assetConfigs = this.config.preloadAssets.map(asset => ({
        id: asset.id,
        type: asset.type as any,
        src: asset.src,
        options: {
          priority: asset.priority || 0,
          cache: true,
          preload: true
        }
      }));
      
      await assetManager.preload(assetConfigs);
    } catch (error) {
      console.warn('Asset preloading failed:', error);
    }
  }
  
  /**
   * Setup memory management integration.
   */
  private setupMemoryManagement(app: GameByte, assetManager: AssetManager): void {
    // Monitor memory pressure
    assetManager.on('memory:pressure', (usage, limit) => {
      console.warn(`Memory pressure detected: ${Math.round(usage / 1024 / 1024)}MB / ${Math.round(limit / 1024 / 1024)}MB`);
      
      // Emit framework-level memory warning
      app.emit('performance:memory:warning', { usage, limit });
    });
    
    // Setup periodic memory optimization
    setInterval(() => {
      const memoryUsage = assetManager.getMemoryUsage();
      const deviceCapabilities = app.make<DeviceCapabilities>('device.capabilities');
      
      // Calculate memory limit based on device
      const memoryLimit = deviceCapabilities.availableMemory * 1024 * 1024 * 0.5; // 50% of device memory
      
      if (memoryUsage.total > memoryLimit * 0.8) {
        assetManager.optimizeMemory().catch(console.warn);
      }
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Setup cleanup handler for framework destruction.
   */
  private setupCleanupHandler(app: GameByte, assetManager: AssetManager): void {
    app.on('destroyed', () => {
      assetManager.destroy().catch(console.warn);
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      assetManager.destroy().catch(console.warn);
    });
  }
}