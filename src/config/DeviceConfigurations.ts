/**
 * Centralized device-specific configurations for the GameByte framework.
 * Provides tier-based configurations for cache, audio, and other systems.
 *
 * @module DeviceConfigurations
 */

import { DevicePerformanceTier, CacheEvictionStrategy } from '../contracts/AssetManager';
import { AudioPerformanceTier } from '../contracts/Audio';

/**
 * Cache configuration by device tier.
 */
export interface TierCacheConfig {
  maxSizeMB: number;
  maxItems: number;
  evictionStrategy: CacheEvictionStrategy;
  ttlMinutes?: number;
  persistent: boolean;
}

/**
 * Audio configuration by device tier.
 */
export interface TierAudioConfig {
  maxConcurrentSounds: number;
  memoryLimit: number;
  cpuLimit: number;
  backgroundAudio: boolean;
  adaptiveQuality: boolean;
  hardwareAcceleration: boolean;
}

/**
 * Concurrent load configuration by device tier.
 */
export interface TierConcurrencyConfig {
  maxConcurrentLoads: number;
  maxRetries: number;
  defaultTimeout: number;
}

/**
 * Input configuration by device tier.
 */
export interface TierInputConfig {
  maxQueueSize: number;
  performanceTarget: 'battery' | 'balanced' | 'performance';
  enableInputPrediction: boolean;
}

/**
 * Get cache configuration based on device performance tier.
 *
 * @param tier - The device performance tier
 * @param overrides - Optional configuration overrides
 * @returns Cache configuration for the tier
 */
export function getCacheConfigForTier(
  tier: DevicePerformanceTier,
  overrides?: Partial<TierCacheConfig>
): TierCacheConfig {
  const baseConfig: TierCacheConfig = {
    maxSizeMB: 50,
    maxItems: 25,
    evictionStrategy: CacheEvictionStrategy.LRU,
    persistent: true,
  };

  let tierConfig: Partial<TierCacheConfig>;

  switch (tier) {
    case DevicePerformanceTier.LOW:
      tierConfig = {
        maxSizeMB: 25,
        maxItems: 12,
      };
      break;

    case DevicePerformanceTier.MEDIUM:
      tierConfig = {
        maxSizeMB: 50,
        maxItems: 25,
      };
      break;

    case DevicePerformanceTier.HIGH:
      tierConfig = {
        maxSizeMB: 100,
        maxItems: 50,
      };
      break;

    case DevicePerformanceTier.PREMIUM:
      tierConfig = {
        maxSizeMB: 200,
        maxItems: 100,
      };
      break;

    default:
      tierConfig = {};
  }

  return { ...baseConfig, ...tierConfig, ...overrides };
}

/**
 * Get audio configuration based on audio performance tier.
 *
 * @param tier - The audio performance tier
 * @returns Audio configuration for the tier
 */
export function getAudioConfigForTier(tier: AudioPerformanceTier): TierAudioConfig {
  const baseConfig: TierAudioConfig = {
    maxConcurrentSounds: 32,
    memoryLimit: 64,
    cpuLimit: 15,
    backgroundAudio: false,
    adaptiveQuality: true,
    hardwareAcceleration: true,
  };

  switch (tier) {
    case AudioPerformanceTier.LOW:
      return {
        ...baseConfig,
        maxConcurrentSounds: 16,
        memoryLimit: 32,
        cpuLimit: 10,
        adaptiveQuality: true,
      };

    case AudioPerformanceTier.MEDIUM:
      return {
        ...baseConfig,
        maxConcurrentSounds: 32,
        memoryLimit: 64,
        cpuLimit: 15,
      };

    case AudioPerformanceTier.HIGH:
      return {
        ...baseConfig,
        maxConcurrentSounds: 64,
        memoryLimit: 128,
        cpuLimit: 20,
        backgroundAudio: true,
      };

    case AudioPerformanceTier.PREMIUM:
      return {
        ...baseConfig,
        maxConcurrentSounds: 128,
        memoryLimit: 256,
        cpuLimit: 25,
        backgroundAudio: true,
        hardwareAcceleration: true,
      };

    default:
      return baseConfig;
  }
}

/**
 * Get concurrent load configuration based on device performance tier.
 *
 * @param tier - The device performance tier
 * @param screenWidth - Screen width for additional optimization
 * @returns Concurrency configuration for the tier
 */
export function getConcurrencyConfigForTier(
  tier: DevicePerformanceTier,
  screenWidth: number = 1024
): TierConcurrencyConfig {
  const baseConcurrency = screenWidth > 1024 ? 8 : 6;

  switch (tier) {
    case DevicePerformanceTier.LOW:
      return {
        maxConcurrentLoads: Math.min(baseConcurrency - 2, 3),
        maxRetries: 2,
        defaultTimeout: 45000,
      };

    case DevicePerformanceTier.MEDIUM:
      return {
        maxConcurrentLoads: baseConcurrency - 1,
        maxRetries: 3,
        defaultTimeout: 30000,
      };

    case DevicePerformanceTier.HIGH:
      return {
        maxConcurrentLoads: baseConcurrency,
        maxRetries: 3,
        defaultTimeout: 30000,
      };

    case DevicePerformanceTier.PREMIUM:
      return {
        maxConcurrentLoads: baseConcurrency + 2,
        maxRetries: 3,
        defaultTimeout: 25000,
      };

    default:
      return {
        maxConcurrentLoads: baseConcurrency,
        maxRetries: 3,
        defaultTimeout: 30000,
      };
  }
}

/**
 * Get input configuration based on device performance tier.
 *
 * @param tier - The device performance tier (as string)
 * @returns Input configuration for the tier
 */
export function getInputConfigForTier(tier: 'low' | 'medium' | 'high'): TierInputConfig {
  switch (tier) {
    case 'low':
      return {
        maxQueueSize: 50,
        performanceTarget: 'battery',
        enableInputPrediction: false,
      };

    case 'medium':
      return {
        maxQueueSize: 75,
        performanceTarget: 'balanced',
        enableInputPrediction: false,
      };

    case 'high':
      return {
        maxQueueSize: 100,
        performanceTarget: 'performance',
        enableInputPrediction: true,
      };

    default:
      return {
        maxQueueSize: 75,
        performanceTarget: 'balanced',
        enableInputPrediction: false,
      };
  }
}

/**
 * Map framework performance tier string to AudioPerformanceTier enum.
 *
 * @param frameworkTier - The framework tier as string or enum
 * @returns AudioPerformanceTier enum value
 */
export function mapToAudioPerformanceTier(frameworkTier: string | unknown): AudioPerformanceTier {
  if (typeof frameworkTier === 'string') {
    switch (frameworkTier.toLowerCase()) {
      case 'low':
        return AudioPerformanceTier.LOW;
      case 'medium':
        return AudioPerformanceTier.MEDIUM;
      case 'high':
        return AudioPerformanceTier.HIGH;
      case 'premium':
        return AudioPerformanceTier.PREMIUM;
      default:
        return AudioPerformanceTier.MEDIUM;
    }
  }
  return AudioPerformanceTier.MEDIUM;
}

/**
 * Get memory limit for cache based on device capabilities.
 *
 * @param availableMemory - Available device memory in MB
 * @param memoryPressureThreshold - Threshold for memory pressure (0-1)
 * @returns Memory limit in bytes
 */
export function calculateMemoryLimit(availableMemory: number, memoryPressureThreshold: number = 0.5): number {
  return availableMemory * 1024 * 1024 * memoryPressureThreshold;
}

/**
 * Get texture quality settings based on device tier.
 */
export interface TextureQualityConfig {
  maxSize: number;
  quality: number;
  generateMipmaps: boolean;
}

/**
 * Get texture quality configuration based on device tier string.
 *
 * @param tier - The device tier as string
 * @returns Texture quality configuration
 */
export function getTextureQualityForTier(tier: 'low' | 'medium' | 'high' | 'premium'): TextureQualityConfig {
  switch (tier) {
    case 'low':
      return {
        maxSize: 1024,
        quality: 0.7,
        generateMipmaps: false,
      };

    case 'medium':
      return {
        maxSize: 2048,
        quality: 0.85,
        generateMipmaps: true,
      };

    case 'high':
      return {
        maxSize: 4096,
        quality: 0.9,
        generateMipmaps: true,
      };

    case 'premium':
      return {
        maxSize: 8192,
        quality: 1.0,
        generateMipmaps: true,
      };

    default:
      return {
        maxSize: 2048,
        quality: 0.85,
        generateMipmaps: true,
      };
  }
}

/**
 * Get audio quality settings based on device tier string.
 */
export interface AudioQualityConfig {
  sampleRate: number;
  bitrate: number;
  channels: number;
}

/**
 * Get audio quality configuration based on device tier string.
 *
 * @param tier - The device tier as string
 * @returns Audio quality configuration
 */
export function getAudioQualityForTier(tier: 'low' | 'medium' | 'high' | 'premium'): AudioQualityConfig {
  switch (tier) {
    case 'low':
      return {
        sampleRate: 22050,
        bitrate: 96,
        channels: 1,
      };

    case 'medium':
      return {
        sampleRate: 44100,
        bitrate: 128,
        channels: 2,
      };

    case 'high':
      return {
        sampleRate: 44100,
        bitrate: 192,
        channels: 2,
      };

    case 'premium':
      return {
        sampleRate: 48000,
        bitrate: 320,
        channels: 2,
      };

    default:
      return {
        sampleRate: 44100,
        bitrate: 128,
        channels: 2,
      };
  }
}
