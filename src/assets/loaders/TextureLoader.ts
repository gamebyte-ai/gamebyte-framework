import { BaseAssetLoader } from './BaseAssetLoader';
import { AssetConfig, AssetType } from '../../contracts/AssetManager';

/**
 * Supported texture formats with compression options.
 */
export interface TextureFormats {
  webp: boolean;
  avif: boolean;
  dxt: boolean;
  etc: boolean;
  astc: boolean;
}

/**
 * Processed texture data.
 */
export interface ProcessedTexture {
  image: HTMLImageElement;
  width: number;
  height: number;
  format: string;
  compressed: boolean;
  mipLevels?: number;
  size: number;
}

/**
 * Texture loading options.
 */
export interface TextureLoadOptions {
  /** Generate mipmaps */
  generateMipmaps?: boolean;
  /** Target texture size for mobile optimization */
  maxSize?: number;
  /** Compression quality (0-1) */
  quality?: number;
  /** Preferred format */
  preferredFormat?: 'webp' | 'avif' | 'jpg' | 'png';
}

/**
 * Texture asset loader optimized for mobile devices.
 * Supports automatic format detection, compression, and resolution scaling.
 */
export class TextureLoader extends BaseAssetLoader<ProcessedTexture> {
  readonly supportedTypes = [AssetType.TEXTURE, AssetType.SPRITE];
  
  private supportedFormats: TextureFormats;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  
  constructor() {
    super();
    this.supportedFormats = this.detectSupportedFormats();
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }
  
  /**
   * Load and process a texture asset.
   */
  async load(config: AssetConfig): Promise<ProcessedTexture> {
    if (!this.canLoad(config.type)) {
      throw new Error(`TextureLoader cannot load assets of type: ${config.type}`);
    }
    
    // Get optimal source based on supported formats and device capabilities
    const optimizedSrc = this.getOptimizedSource(config);
    const optimizedConfig = { ...config, src: optimizedSrc };
    
    try {
      // Load image data
      const blob = await this.loadWithXHR(optimizedConfig, 'blob') as Blob;
      const image = await this.createImageFromBlob(blob);
      
      // Process texture based on options
      const processed = await this.processTexture(image, config);
      
      this.emit('loaded', { assetId: config.id, texture: processed });
      return processed;
      
    } catch (error) {
      this.emit('failed', { assetId: config.id, error });
      throw error;
    }
  }
  
  /**
   * Create an image element from blob data.
   */
  private createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(blob);
      
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to decode image'));
      };
      
      image.src = url;
    });
  }
  
  /**
   * Process texture for mobile optimization.
   */
  private async processTexture(image: HTMLImageElement, config: AssetConfig): Promise<ProcessedTexture> {
    const options = config.options as TextureLoadOptions || {};
    
    // Calculate optimal size for mobile
    const { width, height } = this.calculateOptimalSize(
      image.width, 
      image.height, 
      options.maxSize || 2048
    );
    
    // Resize if necessary
    let processedImage = image;
    if (width !== image.width || height !== image.height) {
      processedImage = await this.resizeImage(image, width, height, options.quality || 0.9);
    }
    
    // Detect format
    const format = this.detectImageFormat(processedImage.src);
    
    // Calculate file size estimate
    const size = this.estimateTextureSize(width, height, format);
    
    return {
      image: processedImage,
      width,
      height,
      format,
      compressed: format === 'webp' || format === 'avif',
      size
    };
  }
  
  /**
   * Calculate optimal texture size for mobile devices.
   */
  private calculateOptimalSize(originalWidth: number, originalHeight: number, maxSize: number): { width: number; height: number } {
    // Ensure power of 2 for better GPU compatibility
    const nextPowerOf2 = (n: number) => Math.pow(2, Math.ceil(Math.log2(n)));
    
    let width = originalWidth;
    let height = originalHeight;
    
    // Scale down if exceeds max size
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }
    
    // Optimize for power of 2 (optional, for WebGL compatibility)
    const devicePixelRatio = window.devicePixelRatio || 1;
    if (devicePixelRatio < 2) {
      // On lower DPI devices, use power of 2 textures for better performance
      width = Math.min(nextPowerOf2(width), maxSize);
      height = Math.min(nextPowerOf2(height), maxSize);
    }
    
    return { width, height };
  }
  
  /**
   * Resize image using canvas with quality optimization.
   */
  private async resizeImage(image: HTMLImageElement, width: number, height: number, quality: number): Promise<HTMLImageElement> {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Use better interpolation for high-quality scaling
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    
    // Draw resized image
    this.context.drawImage(image, 0, 0, width, height);
    
    // Convert to optimized format
    const format = this.getBestFormat();
    const dataUrl = this.canvas.toDataURL(`image/${format}`, quality);
    
    return this.createImageFromDataUrl(dataUrl);
  }
  
  /**
   * Create image from data URL.
   */
  private createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to create image from data URL'));
      image.src = dataUrl;
    });
  }
  
  /**
   * Get optimized source URL based on supported formats.
   */
  private getOptimizedSource(config: AssetConfig): string {
    if (!config.sources) {
      return config.src;
    }
    
    // Prefer modern formats if supported
    if (this.supportedFormats.avif && config.sources.high?.includes('.avif')) {
      return config.sources.high;
    }
    
    if (this.supportedFormats.webp && config.sources.medium?.includes('.webp')) {
      return config.sources.medium;
    }
    
    // Fall back to device-appropriate quality
    return this.getOptimalSource(config, this.getDeviceTier());
  }
  
  /**
   * Get the best supported format for encoding.
   */
  private getBestFormat(): string {
    if (this.supportedFormats.avif) return 'avif';
    if (this.supportedFormats.webp) return 'webp';
    return 'jpeg';
  }
  
  /**
   * Detect supported texture formats.
   */
  private detectSupportedFormats(): TextureFormats {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    
    return {
      webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
      avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
      dxt: this.checkWebGLExtension('WEBGL_compressed_texture_s3tc'),
      etc: this.checkWebGLExtension('WEBGL_compressed_texture_etc'),
      astc: this.checkWebGLExtension('WEBGL_compressed_texture_astc')
    };
  }
  
  /**
   * Check if WebGL extension is supported.
   */
  private checkWebGLExtension(extensionName: string): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl ? !!(gl as WebGLRenderingContext).getExtension(extensionName) : false;
    } catch {
      return false;
    }
  }
  
  /**
   * Detect image format from source URL.
   */
  private detectImageFormat(src: string): string {
    const extension = src.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'webp': return 'webp';
      case 'avif': return 'avif';
      case 'png': return 'png';
      case 'jpg':
      case 'jpeg': return 'jpeg';
      default: return 'unknown';
    }
  }
  
  /**
   * Estimate texture memory size.
   */
  private estimateTextureSize(width: number, height: number, format: string): number {
    let bytesPerPixel = 4; // RGBA default
    
    switch (format) {
      case 'webp':
      case 'avif':
        bytesPerPixel = 3; // Compressed formats use less memory
        break;
      case 'jpeg':
        bytesPerPixel = 3; // RGB
        break;
      case 'png':
        bytesPerPixel = 4; // RGBA
        break;
    }
    
    return width * height * bytesPerPixel;
  }
  
  /**
   * Get device performance tier for optimization.
   */
  private getDeviceTier(): string {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenSize = window.screen.width * window.screen.height;
    
    // Simple heuristic for device tier
    if (devicePixelRatio >= 3 && screenSize > 2000000) return 'premium';
    if (devicePixelRatio >= 2 && screenSize > 1000000) return 'high';
    if (devicePixelRatio >= 1.5) return 'medium';
    return 'low';
  }
  
  /**
   * Clean up canvas resources.
   */
  destroy(): void {
    super.destroy();
    this.canvas.width = this.canvas.height = 0;
  }
}