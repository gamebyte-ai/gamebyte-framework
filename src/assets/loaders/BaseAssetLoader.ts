import { EventEmitter } from 'eventemitter3';
import {
  AssetLoader,
  AssetConfig,
  AssetType,
  AssetLoadingProgress,
  AssetLoadingState,
} from '../../contracts/AssetManager';
import { withRetry, ASSET_LOADING_RETRY_OPTIONS, RetryOptions } from '../../utils/RetryUtils';

/**
 * Abstract base class for asset loaders with common functionality.
 */
export abstract class BaseAssetLoader<T = any> extends EventEmitter implements AssetLoader<T> {
  protected loadingAssets = new Map<string, XMLHttpRequest>();
  protected progressMap = new Map<string, AssetLoadingProgress>();
  
  abstract readonly supportedTypes: AssetType[];
  
  /**
   * Load an asset with the specific loader implementation.
   */
  abstract load(config: AssetConfig): Promise<T>;
  
  /**
   * Check if this loader can handle the given asset type.
   */
  canLoad(type: AssetType): boolean {
    return this.supportedTypes.includes(type);
  }
  
  /**
   * Get loading progress for an asset.
   */
  getProgress(assetId: string): AssetLoadingProgress | null {
    return this.progressMap.get(assetId) || null;
  }
  
  /**
   * Cancel asset loading.
   */
  cancel(assetId: string): void {
    const xhr = this.loadingAssets.get(assetId);
    if (xhr) {
      xhr.abort();
      this.loadingAssets.delete(assetId);
      this.progressMap.delete(assetId);
      this.emit('cancelled', assetId);
    }
  }
  
  /**
   * Clean up resources.
   */
  destroy(): void {
    // Cancel all ongoing loads
    for (const [assetId] of this.loadingAssets) {
      this.cancel(assetId);
    }
    
    this.loadingAssets.clear();
    this.progressMap.clear();
    this.removeAllListeners();
  }
  
  /**
   * Create an XMLHttpRequest with common configuration.
   */
  protected createXHR(config: AssetConfig): XMLHttpRequest {
    const xhr = new XMLHttpRequest();
    
    // Configure timeout
    if (config.options?.timeout) {
      xhr.timeout = config.options.timeout;
    }
    
    // Configure cross-origin (note: crossOrigin is not a standard XHR property)
    // This would typically be handled by the server's CORS headers
    
    return xhr;
  }
  
  /**
   * Setup progress tracking for an asset.
   */
  protected setupProgressTracking(xhr: XMLHttpRequest, config: AssetConfig): void {
    const assetId = config.id;
    
    // Initialize progress
    this.progressMap.set(assetId, {
      assetId,
      progress: 0,
      loaded: 0,
      total: config.size || 0,
      state: AssetLoadingState.LOADING
    });
    
    // Track upload progress if available
    if (xhr.upload) {
      xhr.upload.addEventListener('progress', (event) => {
        this.updateProgress(assetId, event);
      });
    }
    
    // Track download progress
    xhr.addEventListener('progress', (event) => {
      this.updateProgress(assetId, event);
    });
    
    // Handle load completion
    xhr.addEventListener('load', () => {
      this.updateProgress(assetId, { loaded: xhr.response?.byteLength || 0, total: xhr.response?.byteLength || 0 });
    });
    
    // Handle errors
    xhr.addEventListener('error', () => {
      const progress = this.progressMap.get(assetId);
      if (progress) {
        progress.state = AssetLoadingState.FAILED;
        this.emit('progress', progress);
      }
    });
  }
  
  /**
   * Update loading progress for an asset.
   */
  protected updateProgress(assetId: string, event: { loaded: number; total: number }): void {
    const progress = this.progressMap.get(assetId);
    if (!progress) return;
    
    progress.loaded = event.loaded;
    progress.total = event.total || progress.total;
    progress.progress = progress.total > 0 ? event.loaded / progress.total : 0;
    
    this.emit('progress', progress);
  }
  
  /**
   * Load data using XMLHttpRequest with retry logic.
   * Uses centralized RetryUtils for retry handling.
   */
  protected async loadWithXHR<T>(
    config: AssetConfig,
    responseType: XMLHttpRequestResponseType = 'blob',
    processor?: (data: any) => T | Promise<T>
  ): Promise<T> {
    const retryOptions: RetryOptions = {
      ...ASSET_LOADING_RETRY_OPTIONS,
      maxRetries: config.options?.maxRetries || ASSET_LOADING_RETRY_OPTIONS.maxRetries,
    };

    return withRetry(
      async () => {
        const data = await this.performXHRRequest(config, responseType);
        return processor ? await processor(data) : data;
      },
      retryOptions
    );
  }
  
  /**
   * Perform the actual XMLHttpRequest.
   */
  private performXHRRequest(config: AssetConfig, responseType: XMLHttpRequestResponseType): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = this.createXHR(config);
      
      // Store reference for cancellation
      this.loadingAssets.set(config.id, xhr);
      
      // Setup progress tracking
      this.setupProgressTracking(xhr, config);
      
      xhr.responseType = responseType;
      
      xhr.addEventListener('load', () => {
        this.loadingAssets.delete(config.id);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          const progress = this.progressMap.get(config.id);
          if (progress) {
            progress.state = AssetLoadingState.LOADED;
            progress.progress = 1;
            this.emit('progress', progress);
          }
          resolve(xhr.response);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        this.loadingAssets.delete(config.id);
        reject(new Error('Network error occurred'));
      });
      
      xhr.addEventListener('timeout', () => {
        this.loadingAssets.delete(config.id);
        reject(new Error('Request timeout'));
      });
      
      xhr.addEventListener('abort', () => {
        this.loadingAssets.delete(config.id);
        reject(new Error('Request aborted'));
      });
      
      // Set custom headers
      if (config.options?.headers) {
        Object.entries(config.options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
      
      xhr.open('GET', config.src);
      xhr.send();
    });
  }
  
  /**
   * Get optimal asset quality based on device capabilities.
   */
  protected getOptimalSource(config: AssetConfig, deviceTier: string = 'medium'): string {
    if (!config.sources) {
      return config.src;
    }
    
    const quality = config.options?.quality || 'auto';
    
    if (quality === 'auto') {
      switch (deviceTier) {
        case 'low':
          return config.sources.low || config.sources.medium || config.src;
        case 'high':
        case 'premium':
          return config.sources.high || config.sources.medium || config.src;
        default:
          return config.sources.medium || config.src;
      }
    }
    
    return config.sources[quality as keyof typeof config.sources] || config.src;
  }
}