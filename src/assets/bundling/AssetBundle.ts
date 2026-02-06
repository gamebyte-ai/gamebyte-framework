import { AssetBundle, AssetConfig, AssetType, LoadedAsset } from '../../contracts/AssetManager';

/**
 * Bundle manifest for deployment metadata.
 */
export interface BundleManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  tags?: string[];
  totalSize: number;
  assetCount: number;
  dependencies: string[];
  createdAt: number;
  assets: AssetManifestEntry[];
  compression?: {
    algorithm: 'gzip' | 'brotli' | 'none';
    originalSize: number;
    compressedSize: number;
    ratio: number;
  };
}

/**
 * Individual asset entry in bundle manifest.
 */
export interface AssetManifestEntry {
  id: string;
  type: AssetType;
  path: string;
  size: number;
  offset: number;
  checksum: string;
  mimeType?: string;
  dependencies?: string[];
}

/**
 * Bundle loading options.
 */
export interface BundleLoadOptions {
  /** Load bundle in streaming mode */
  streaming?: boolean;
  /** Preload specific assets from bundle */
  preloadAssets?: string[];
  /** Maximum concurrent asset loads */
  concurrency?: number;
  /** Verify checksums after loading */
  verifyChecksums?: boolean;
  /** Priority for bundle loading */
  priority?: number;
}

/**
 * Bundle builder configuration.
 */
export interface BundleBuilderConfig {
  /** Compression settings */
  compression?: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli';
    level: number;
  };
  /** Asset optimization settings */
  optimization?: {
    textureCompression: boolean;
    audioCompression: boolean;
    minifyJSON: boolean;
  };
  /** Bundle splitting strategy */
  splitting?: {
    maxSize: number;
    splitBy: 'size' | 'type' | 'usage';
  };
}

/**
 * Asset bundle implementation for efficient web deployment.
 * Supports compression, streaming, and dependency resolution.
 */
export class GameByteAssetBundle implements AssetBundle {
  readonly id: string;
  readonly name: string;
  readonly assets: AssetConfig[];
  readonly metadata?: {
    version: string;
    description?: string;
    tags?: string[];
  };
  readonly dependencies?: string[];
  readonly options?: any;
  
  private manifest: BundleManifest | null = null;
  private loadedAssets = new Map<string, LoadedAsset>();
  private bundleData: ArrayBuffer | null = null;
  
  constructor(config: {
    id: string;
    name: string;
    assets: AssetConfig[];
    metadata?: {
      version: string;
      description?: string;
      tags?: string[];
    };
    dependencies?: string[];
    options?: any;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.assets = config.assets;
    this.metadata = config.metadata;
    this.dependencies = config.dependencies;
    this.options = config.options;
  }
  
  /**
   * Get bundle manifest.
   */
  getManifest(): BundleManifest | null {
    return this.manifest;
  }
  
  /**
   * Set bundle manifest (used during loading).
   */
  setManifest(manifest: BundleManifest): void {
    this.manifest = manifest;
  }
  
  /**
   * Get loaded asset from bundle.
   */
  getAsset<T = any>(assetId: string): LoadedAsset<T> | null {
    return this.loadedAssets.get(assetId) || null;
  }
  
  /**
   * Set loaded asset in bundle.
   */
  setAsset(assetId: string, asset: LoadedAsset): void {
    this.loadedAssets.set(assetId, asset);
  }
  
  /**
   * Check if asset is loaded in bundle.
   */
  hasAsset(assetId: string): boolean {
    return this.loadedAssets.has(assetId);
  }
  
  /**
   * Get all loaded assets.
   */
  getAllAssets(): Map<string, LoadedAsset> {
    return new Map(this.loadedAssets);
  }
  
  /**
   * Get bundle data.
   */
  getBundleData(): ArrayBuffer | null {
    return this.bundleData;
  }
  
  /**
   * Set bundle data.
   */
  setBundleData(data: ArrayBuffer): void {
    this.bundleData = data;
  }
  
  /**
   * Extract asset data from bundle.
   */
  extractAssetData(assetId: string): ArrayBuffer | null {
    if (!this.bundleData || !this.manifest) {
      return null;
    }
    
    const assetEntry = this.manifest.assets.find(asset => asset.id === assetId);
    if (!assetEntry) {
      return null;
    }
    
    // Extract asset data using offset and size
    return this.bundleData.slice(assetEntry.offset, assetEntry.offset + assetEntry.size);
  }
  
  /**
   * Get bundle statistics.
   */
  getStats(): {
    totalSize: number;
    assetCount: number;
    loadedCount: number;
    compressionRatio?: number;
  } {
    const stats = {
      totalSize: this.manifest?.totalSize || 0,
      assetCount: this.assets.length,
      loadedCount: this.loadedAssets.size,
      compressionRatio: undefined as number | undefined
    };
    
    if (this.manifest?.compression) {
      stats.compressionRatio = this.manifest.compression.ratio;
    }
    
    return stats;
  }
  
  /**
   * Validate bundle integrity.
   */
  async validateIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    if (!this.manifest) {
      errors.push('Bundle manifest is missing');
      return { valid: false, errors };
    }
    
    if (!this.bundleData) {
      errors.push('Bundle data is missing');
      return { valid: false, errors };
    }
    
    // Validate bundle size
    if (this.bundleData.byteLength !== this.manifest.totalSize) {
      errors.push(`Bundle size mismatch: expected ${this.manifest.totalSize}, got ${this.bundleData.byteLength}`);
    }
    
    // Validate asset count
    if (this.manifest.assets.length !== this.assets.length) {
      errors.push(`Asset count mismatch: expected ${this.assets.length}, got ${this.manifest.assets.length}`);
    }
    
    // Validate individual assets
    for (const assetEntry of this.manifest.assets) {
      const assetData = this.extractAssetData(assetEntry.id);
      
      if (!assetData) {
        errors.push(`Failed to extract asset: ${assetEntry.id}`);
        continue;
      }
      
      if (assetData.byteLength !== assetEntry.size) {
        errors.push(`Asset size mismatch for ${assetEntry.id}: expected ${assetEntry.size}, got ${assetData.byteLength}`);
      }
      
      // Verify checksum if available
      if (assetEntry.checksum) {
        const calculatedChecksum = await this.calculateChecksum(assetData);
        if (calculatedChecksum !== assetEntry.checksum) {
          errors.push(`Checksum mismatch for ${assetEntry.id}`);
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  /**
   * Calculate checksum for data.
   */
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    if ('crypto' in window && 'subtle' in crypto) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback: simple hash
    const view = new Uint8Array(data);
    let hash = 0;
    for (let i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash + view[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }
  
  /**
   * Unload bundle and free memory.
   */
  unload(): void {
    this.loadedAssets.clear();
    this.bundleData = null;
    this.manifest = null;
  }
}

/**
 * Asset bundle builder for creating optimized bundles.
 */
export class AssetBundleBuilder {
  private config: BundleBuilderConfig;
  
  constructor(config: BundleBuilderConfig = {}) {
    this.config = {
      compression: {
        enabled: true,
        algorithm: 'gzip',
        level: 6,
        ...config.compression
      },
      optimization: {
        textureCompression: true,
        audioCompression: true,
        minifyJSON: true,
        ...config.optimization
      },
      splitting: {
        maxSize: 10 * 1024 * 1024, // 10MB
        splitBy: 'size',
        ...config.splitting
      }
    };
  }
  
  /**
   * Build bundle from asset configurations.
   */
  async buildBundle(bundleConfig: {
    id: string;
    name: string;
    assets: AssetConfig[];
    metadata?: {
      version: string;
      description?: string;
      tags?: string[];
    };
  }): Promise<{
    bundle: GameByteAssetBundle;
    manifest: BundleManifest;
    data: ArrayBuffer;
  }> {
    const { id, name, assets, metadata } = bundleConfig;
    
    // Load and optimize assets
    const processedAssets = await this.processAssets(assets);
    
    // Create bundle data
    const { data, manifest } = await this.createBundleData(id, name, processedAssets, metadata);
    
    // Create bundle instance
    const bundle = new GameByteAssetBundle({
      id,
      name,
      assets,
      metadata
    });
    
    bundle.setManifest(manifest);
    bundle.setBundleData(data);
    
    return { bundle, manifest, data };
  }
  
  /**
   * Process and optimize assets for bundling.
   */
  private async processAssets(assets: AssetConfig[]): Promise<Array<{
    config: AssetConfig;
    data: ArrayBuffer;
    optimized: boolean;
  }>> {
    const processed: Array<{
      config: AssetConfig;
      data: ArrayBuffer;
      optimized: boolean;
    }> = [];
    
    for (const asset of assets) {
      const data = await this.loadAssetData(asset);
      const optimizedData = await this.optimizeAssetData(asset, data);
      
      processed.push({
        config: asset,
        data: optimizedData.data,
        optimized: optimizedData.optimized
      });
    }
    
    return processed;
  }
  
  /**
   * Load asset data for bundling.
   */
  private async loadAssetData(config: AssetConfig): Promise<ArrayBuffer> {
    const response = await fetch(config.src);
    if (!response.ok) {
      throw new Error(`Failed to load asset ${config.id}: ${response.statusText}`);
    }
    return await response.arrayBuffer();
  }
  
  /**
   * Optimize asset data based on type and configuration.
   */
  private async optimizeAssetData(config: AssetConfig, data: ArrayBuffer): Promise<{
    data: ArrayBuffer;
    optimized: boolean;
  }> {
    let optimized = false;
    let optimizedData = data;
    
    // Apply type-specific optimizations
    switch (config.type) {
      case AssetType.JSON:
        if (this.config.optimization?.minifyJSON) {
          optimizedData = await this.minifyJSON(data);
          optimized = true;
        }
        break;
      
      case AssetType.TEXTURE:
      case AssetType.SPRITE:
        if (this.config.optimization?.textureCompression) {
          // Texture optimization would go here
          // For now, just mark as potentially optimized
          optimized = true;
        }
        break;
      
      case AssetType.AUDIO:
        if (this.config.optimization?.audioCompression) {
          // Audio optimization would go here
          optimized = true;
        }
        break;
    }
    
    return { data: optimizedData, optimized };
  }
  
  /**
   * Minify JSON data.
   */
  private async minifyJSON(data: ArrayBuffer): Promise<ArrayBuffer> {
    const text = new TextDecoder().decode(data);
    try {
      const parsed = JSON.parse(text);
      const minified = JSON.stringify(parsed);
      return new TextEncoder().encode(minified).buffer as ArrayBuffer;
    } catch {
      return data; // Return original if parsing fails
    }
  }
  
  /**
   * Create bundle data and manifest.
   */
  private async createBundleData(
    id: string,
    name: string,
    processedAssets: Array<{ config: AssetConfig; data: ArrayBuffer; optimized: boolean }>,
    metadata?: { version: string; description?: string; tags?: string[] }
  ): Promise<{ data: ArrayBuffer; manifest: BundleManifest }> {
    // Calculate total size and create manifest entries
    let totalSize = 0;
    let currentOffset = 0;
    const manifestAssets: AssetManifestEntry[] = [];
    
    for (const { config, data } of processedAssets) {
      const checksum = await this.calculateChecksum(data);
      
      manifestAssets.push({
        id: config.id,
        type: config.type,
        path: config.src,
        size: data.byteLength,
        offset: currentOffset,
        checksum,
        mimeType: config.mimeType,
        dependencies: config.dependencies
      });
      
      currentOffset += data.byteLength;
      totalSize += data.byteLength;
    }
    
    // Create bundle data buffer
    const bundleData = new ArrayBuffer(totalSize);
    const bundleView = new Uint8Array(bundleData);
    
    // Copy asset data into bundle
    let offset = 0;
    for (const { data } of processedAssets) {
      const assetView = new Uint8Array(data);
      bundleView.set(assetView, offset);
      offset += data.byteLength;
    }
    
    // Create manifest
    const manifest: BundleManifest = {
      id,
      name,
      version: metadata?.version || '1.0.0',
      description: metadata?.description,
      tags: metadata?.tags,
      totalSize,
      assetCount: processedAssets.length,
      dependencies: [],
      createdAt: Date.now(),
      assets: manifestAssets
    };
    
    // Apply compression if enabled
    let finalData = bundleData;
    if (this.config.compression?.enabled) {
      const compressed = await this.compressData(bundleData);
      if (compressed) {
        manifest.compression = {
          algorithm: this.config.compression.algorithm,
          originalSize: bundleData.byteLength,
          compressedSize: compressed.byteLength,
          ratio: compressed.byteLength / bundleData.byteLength
        };
        finalData = compressed;
      }
    }
    
    return { data: finalData, manifest };
  }
  
  /**
   * Compress bundle data.
   */
  private async compressData(data: ArrayBuffer): Promise<ArrayBuffer | null> {
    try {
      // Use CompressionStream if available (modern browsers)
      if ('CompressionStream' in window) {
        const CompressionStreamClass = (window as any).CompressionStream;
        const cs = new CompressionStreamClass(this.config.compression!.algorithm);
        const writer = cs.writable.getWriter();
        const reader = cs.readable.getReader();
        
        writer.write(data);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressedSize = chunks.reduce((total, chunk) => total + chunk.length, 0);
        const compressed = new ArrayBuffer(compressedSize);
        const view = new Uint8Array(compressed);
        
        let offset = 0;
        for (const chunk of chunks) {
          view.set(chunk, offset);
          offset += chunk.length;
        }
        
        return compressed;
      }
    } catch (error) {
      console.warn('Compression failed:', error);
    }
    
    return null;
  }
  
  /**
   * Calculate checksum for data.
   */
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    if ('crypto' in window && 'subtle' in crypto) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback: simple hash
    const view = new Uint8Array(data);
    let hash = 0;
    for (let i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash + view[i]) & 0xffffffff;
    }
    return hash.toString(16);
  }
}