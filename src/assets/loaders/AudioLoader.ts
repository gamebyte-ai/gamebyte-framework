import { BaseAssetLoader } from './BaseAssetLoader';
import { AssetConfig, AssetType } from '../../contracts/AssetManager';
import { detectAudioFormats, AudioFormats } from '../../utils/FormatDetectionUtils';
import { getAudioDeviceTier } from '../../utils/DeviceDetectionUtils';

// AudioFormats interface is re-exported from FormatDetectionUtils
export type { AudioFormats } from '../../utils/FormatDetectionUtils';

/**
 * Processed audio data.
 */
export interface ProcessedAudio {
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  size: number;
  format: string;
  compressed: boolean;
}

/**
 * Audio loading options.
 */
export interface AudioLoadOptions {
  /** Load as streaming audio for large files */
  streaming?: boolean;
  /** Preferred audio format */
  preferredFormat?: 'mp3' | 'ogg' | 'webm' | 'aac';
  /** Audio quality for compression */
  quality?: 'low' | 'medium' | 'high';
  /** Normalize audio volume */
  normalize?: boolean;
  /** Fade in/out duration in seconds */
  fade?: {
    in?: number;
    out?: number;
  };
}

/**
 * Audio asset loader optimized for mobile devices.
 * Supports multiple formats, streaming, and Web Audio API integration.
 */
export class AudioLoader extends BaseAssetLoader<ProcessedAudio> {
  readonly supportedTypes = [AssetType.AUDIO];
  
  private audioContext: AudioContext | null = null;
  private supportedFormats: AudioFormats;
  
  constructor() {
    super();
    this.supportedFormats = this.detectSupportedFormats();
    this.initializeAudioContext();
  }
  
  /**
   * Load and process an audio asset.
   */
  async load(config: AssetConfig): Promise<ProcessedAudio> {
    if (!this.canLoad(config.type)) {
      throw new Error(`AudioLoader cannot load assets of type: ${config.type}`);
    }
    
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }
    
    // Get optimal source based on supported formats
    const optimizedSrc = this.getOptimizedSource(config);
    const optimizedConfig = { ...config, src: optimizedSrc };
    
    try {
      // Load audio data
      const arrayBuffer = await this.loadWithXHR(optimizedConfig, 'arraybuffer');
      
      // Decode audio buffer
      const audioBuffer = await this.decodeAudioData(arrayBuffer as ArrayBuffer);
      
      // Process audio based on options
      const processed = await this.processAudio(audioBuffer, config);
      
      this.emit('loaded', { assetId: config.id, audio: processed });
      return processed;
      
    } catch (error) {
      this.emit('failed', { assetId: config.id, error });
      throw error;
    }
  }
  
  /**
   * Initialize Web Audio API context.
   */
  private initializeAudioContext(): void {
    try {
      // Create audio context with mobile-friendly settings
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass({
          latencyHint: 'interactive',
          sampleRate: 44100 // Standard sample rate for compatibility
        });
        
        // Handle iOS audio context requirements
        this.setupIOSAudioUnlock();
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }
  
  /**
   * Setup iOS audio context unlock on user interaction.
   */
  private setupIOSAudioUnlock(): void {
    if (!this.audioContext) return;
    
    const unlockAudio = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          document.removeEventListener('touchstart', unlockAudio);
          document.removeEventListener('touchend', unlockAudio);
          document.removeEventListener('click', unlockAudio);
        });
      }
    };
    
    // Add event listeners for user interaction
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('touchend', unlockAudio);
    document.addEventListener('click', unlockAudio);
  }
  
  /**
   * Decode audio data using Web Audio API.
   */
  private async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }
    
    try {
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      // Fallback for older browsers
      return new Promise((resolve, reject) => {
        this.audioContext!.decodeAudioData(
          arrayBuffer,
          resolve,
          reject
        );
      });
    }
  }
  
  /**
   * Process audio buffer with optimization options.
   */
  private async processAudio(audioBuffer: AudioBuffer, config: AssetConfig): Promise<ProcessedAudio> {
    const options = config.options as AudioLoadOptions || {};
    
    let processedBuffer = audioBuffer;
    
    // Apply audio processing if needed
    if (options.normalize || options.fade) {
      processedBuffer = await this.applyAudioEffects(audioBuffer, options);
    }
    
    // Detect format from source
    const format = this.detectAudioFormat(config.src);
    
    // Calculate estimated size
    const size = this.estimateAudioSize(processedBuffer);
    
    return {
      buffer: processedBuffer,
      duration: processedBuffer.duration,
      sampleRate: processedBuffer.sampleRate,
      numberOfChannels: processedBuffer.numberOfChannels,
      size,
      format,
      compressed: ['mp3', 'ogg', 'webm', 'aac'].includes(format)
    };
  }
  
  /**
   * Apply audio effects like normalization and fade.
   */
  private async applyAudioEffects(audioBuffer: AudioBuffer, options: AudioLoadOptions): Promise<AudioBuffer> {
    if (!this.audioContext) return audioBuffer;
    
    // Create new buffer for processing
    const processedBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Process each channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = processedBuffer.getChannelData(channel);
      
      // Copy original data
      outputData.set(inputData);
      
      // Apply normalization
      if (options.normalize) {
        this.normalizeAudioChannel(outputData);
      }
      
      // Apply fade effects
      if (options.fade) {
        this.applyFadeEffects(outputData, audioBuffer.sampleRate, options.fade);
      }
    }
    
    return processedBuffer;
  }
  
  /**
   * Normalize audio channel volume.
   */
  private normalizeAudioChannel(channelData: Float32Array): void {
    // Find peak amplitude
    let peak = 0;
    for (let i = 0; i < channelData.length; i++) {
      peak = Math.max(peak, Math.abs(channelData[i]));
    }
    
    // Normalize to prevent clipping (leave some headroom)
    if (peak > 0) {
      const normalizeRatio = 0.95 / peak;
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] *= normalizeRatio;
      }
    }
  }
  
  /**
   * Apply fade in/out effects.
   */
  private applyFadeEffects(channelData: Float32Array, sampleRate: number, fade: { in?: number; out?: number }): void {
    const { in: fadeIn, out: fadeOut } = fade;
    
    // Apply fade in
    if (fadeIn && fadeIn > 0) {
      const fadeInSamples = Math.min(fadeIn * sampleRate, channelData.length);
      for (let i = 0; i < fadeInSamples; i++) {
        const ratio = i / fadeInSamples;
        channelData[i] *= ratio;
      }
    }
    
    // Apply fade out
    if (fadeOut && fadeOut > 0) {
      const fadeOutSamples = Math.min(fadeOut * sampleRate, channelData.length);
      const startIndex = channelData.length - fadeOutSamples;
      
      for (let i = 0; i < fadeOutSamples; i++) {
        const ratio = 1 - (i / fadeOutSamples);
        channelData[startIndex + i] *= ratio;
      }
    }
  }
  
  /**
   * Get optimized source URL based on supported formats.
   */
  private getOptimizedSource(config: AssetConfig): string {
    if (!config.sources) {
      return config.src;
    }
    
    const options = config.options as AudioLoadOptions || {};
    const quality = options.quality || 'medium';
    
    // Try to find the best supported format
    const formats = ['ogg', 'webm', 'mp3', 'aac'] as const;
    
    for (const format of formats) {
      if (this.supportedFormats[format]) {
        const sourceKey = this.getSourceKeyForQuality(quality);
        const source = config.sources[sourceKey];
        
        if (source && source.includes(`.${format}`)) {
          return source;
        }
      }
    }
    
    // Fall back to device-appropriate quality
    return this.getOptimalSource(config, this.getDeviceTier());
  }
  
  /**
   * Get source key based on quality setting.
   */
  private getSourceKeyForQuality(quality: string): 'low' | 'medium' | 'high' {
    switch (quality) {
      case 'low': return 'low';
      case 'high': return 'high';
      default: return 'medium';
    }
  }
  
  /**
   * Detect supported audio formats.
   * Uses centralized FormatDetectionUtils.
   */
  private detectSupportedFormats(): AudioFormats {
    return detectAudioFormats();
  }
  
  /**
   * Detect audio format from source URL.
   */
  private detectAudioFormat(src: string): string {
    const extension = src.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp3': return 'mp3';
      case 'ogg': return 'ogg';
      case 'webm': return 'webm';
      case 'aac':
      case 'm4a': return 'aac';
      case 'wav': return 'wav';
      default: return 'unknown';
    }
  }
  
  /**
   * Estimate audio memory size.
   */
  private estimateAudioSize(audioBuffer: AudioBuffer): number {
    // Uncompressed audio size: samples * channels * bytes per sample
    return audioBuffer.length * audioBuffer.numberOfChannels * 4; // Float32 = 4 bytes
  }
  
  /**
   * Get device performance tier.
   * Uses centralized DeviceDetectionUtils.
   */
  private getDeviceTier(): string {
    return getAudioDeviceTier(this.audioContext);
  }
  
  /**
   * Get audio context for advanced audio processing.
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
  
  /**
   * Clean up audio context and resources.
   */
  destroy(): void {
    super.destroy();
    
    if (this.audioContext && this.audioContext.close) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}