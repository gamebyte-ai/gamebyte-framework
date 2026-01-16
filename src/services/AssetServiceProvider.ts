import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { GameByteAssetManager, AssetManagerConfig } from '../assets/GameByteAssetManager';
import {
  AssetManager,
  DevicePerformanceTier,
  DeviceCapabilities,
  CacheEvictionStrategy,
} from '../contracts/AssetManager';
import {
  getUnifiedDeviceCapabilities,
  detectPlatform,
  detectGPUTier,
  getScreenInfo,
  detectConnectionType,
} from '../utils/DeviceDetectionUtils';
import { getSupportedTextureFormats, getSupportedAudioFormats } from '../utils/FormatDetectionUtils';
import {
  getCacheConfigForTier,
  getConcurrencyConfigForTier,
  TierCacheConfig,
} from '../config/DeviceConfigurations';

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
   * Uses centralized DeviceConfigurations for tier-based settings.
   */
  private createCacheConfig(deviceCapabilities: DeviceCapabilities) {
    const userConfig = this.config.cacheConfig || {};

    // Get tier-based config from centralized configuration
    const tierConfig: TierCacheConfig = getCacheConfigForTier(deviceCapabilities.performanceTier, {
      maxSizeMB: userConfig.maxSizeMB,
    });

    const maxItems = userConfig.maxItems || tierConfig.maxItems;
    const ttl = userConfig.ttlMinutes ? userConfig.ttlMinutes * 60 * 1000 : undefined;

    return {
      maxSize: tierConfig.maxSizeMB * 1024 * 1024, // Convert to bytes
      maxItems,
      evictionStrategy: userConfig.evictionStrategy || tierConfig.evictionStrategy,
      ttl,
      persistent: userConfig.enablePersistent !== false ? tierConfig.persistent : false,
      version: '1.0.0',
    };
  }
  
  /**
   * Get optimal concurrent loads based on device capabilities.
   * Uses centralized DeviceConfigurations for tier-based settings.
   */
  private getOptimalConcurrentLoads(deviceCapabilities: DeviceCapabilities): number {
    const concurrencyConfig = getConcurrencyConfigForTier(
      deviceCapabilities.performanceTier,
      deviceCapabilities.screen.width
    );
    return concurrencyConfig.maxConcurrentLoads;
  }
  
  /**
   * Detect device capabilities.
   * Uses centralized DeviceDetectionUtils and FormatDetectionUtils.
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const unified = getUnifiedDeviceCapabilities();
    const screenInfo = getScreenInfo();
    const gpuInfo = detectGPUTier();
    const connectionType = detectConnectionType();
    const platform = detectPlatform();

    return {
      performanceTier: unified.performanceTier,
      availableMemory: unified.availableMemory,
      gpuTier: gpuInfo.tier,
      supportedTextureFormats: getSupportedTextureFormats(),
      supportedAudioFormats: getSupportedAudioFormats(),
      connectionType: connectionType,
      screen: screenInfo,
      platform: platform,
    };
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