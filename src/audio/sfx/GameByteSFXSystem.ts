import { EventEmitter } from 'eventemitter3';
import {
  SFXSystem,
  AudioManager,
  AudioSource,
  AudioEvents
} from '../../contracts/Audio';
import { Vector3 } from '../../contracts/Physics';

/**
 * Sound effect pool for efficient memory management
 */
interface SoundPool {
  name: string;
  sources: AudioSource[];
  maxSize: number;
  currentIndex: number;
  priority: number;
  variations: string[];
  maxConcurrent: number;
  activeSources: Set<AudioSource>;
}

/**
 * Active sound instance for tracking and management
 */
interface ActiveSound {
  source: AudioSource;
  name: string;
  priority: number;
  startTime: number;
  options: SoundPlayOptions;
}

/**
 * Sound play options
 */
interface SoundPlayOptions {
  volume?: number;
  pitch?: number;
  position?: Vector3;
  loop?: boolean;
  bus?: string;
  priority?: number;
  fadeIn?: number;
  delay?: number;
}

/**
 * Sound variation configuration
 */
interface SoundVariation {
  baseName: string;
  variations: string[];
  playPattern: 'random' | 'sequential' | 'weighted';
  weights?: number[];
  lastPlayedIndex: number;
}

/**
 * Performance optimization settings
 */
interface SFXPerformanceConfig {
  maxConcurrentSounds: number;
  maxPoolSize: number;
  priorityThreshold: number;
  distanceCulling: boolean;
  maxDistance: number;
  memoryLimit: number; // MB
  adaptiveQuality: boolean;
}

/**
 * Default performance configuration
 */
const DEFAULT_PERFORMANCE_CONFIG: SFXPerformanceConfig = {
  maxConcurrentSounds: 32,
  maxPoolSize: 8,
  priorityThreshold: 0.5,
  distanceCulling: true,
  maxDistance: 100,
  memoryLimit: 32,
  adaptiveQuality: true
};

/**
 * GameByte SFX System - High-performance sound effects management
 * 
 * Features:
 * - Intelligent sound effect pooling for memory efficiency
 * - Priority-based playback system with automatic culling
 * - Sound variation system for dynamic and varied audio
 * - Concurrent sound limiting with smart voice management
 * - Mobile-optimized performance with adaptive quality
 * - Distance-based culling and 3D spatial positioning
 * - Real-time performance monitoring and optimization
 */
export class GameByteSFXSystem extends EventEmitter<AudioEvents> implements SFXSystem {
  private _context: AudioContext;
  private _audioManager: AudioManager;
  private _soundPools = new Map<string, SoundPool>();
  private _activeSounds = new Map<string, ActiveSound>();
  private _variations = new Map<string, SoundVariation>();
  private _performanceConfig: SFXPerformanceConfig;
  
  // Audio processing
  private _masterGain!: GainNode;
  private _compressor!: DynamicsCompressorNode;
  
  // Performance monitoring
  private _performanceMetrics = {
    activeSounds: 0,
    pooledSounds: 0,
    memoryUsage: 0,
    droppedSounds: 0,
    cpuUsage: 0
  };
  
  // Culling and optimization
  private _listenerPosition: Vector3 = { x: 0, y: 0, z: 0 };
  private _cullUpdateInterval: number | null = null;
  private _lastCullUpdate = 0;
  
  // Priority queue for sound management
  private _soundQueue: Array<{ name: string; options: SoundPlayOptions; timestamp: number }> = [];

  constructor(context: AudioContext, audioManager: AudioManager) {
    super();
    
    this._context = context;
    this._audioManager = audioManager;
    this._performanceConfig = { ...DEFAULT_PERFORMANCE_CONFIG };
    
    this.createAudioNodes();
  }

  /**
   * Initialize the SFX system
   */
  async initialize(): Promise<void> {
    try {
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Start culling system
      this.startCullingSystem();
      
      this.emit('sfx:initialized', {} as any);
      
    } catch (error) {
      console.error('SFX system initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create audio processing nodes
   */
  private createAudioNodes(): void {
    // Master gain for SFX volume control
    this._masterGain = this._context.createGain();
    this._masterGain.gain.value = 1.0;
    
    // Master compressor to prevent clipping with many sounds
    this._compressor = this._context.createDynamicsCompressor();
    this._compressor.threshold.value = -12;
    this._compressor.knee.value = 6;
    this._compressor.ratio.value = 4;
    this._compressor.attack.value = 0.003;
    this._compressor.release.value = 0.1;
    
    // Connect audio chain
    this._masterGain.connect(this._compressor);
    
    // Connect to SFX bus
    const sfxBus = this._audioManager.getBus('sfx');
    if (sfxBus && 'getInputNode' in sfxBus) {
      this._compressor.connect((sfxBus as any).getInputNode());
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
      this.optimizePerformance();
    }, 1000); // Update every second
  }

  /**
   * Start distance culling system
   */
  private startCullingSystem(): void {
    if (this._cullUpdateInterval) {
      clearInterval(this._cullUpdateInterval);
    }
    
    this._cullUpdateInterval = window.setInterval(() => {
      if (this._performanceConfig.distanceCulling) {
        this.updateDistanceCulling();
      }
    }, 100); // Update 10 times per second
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    this._performanceMetrics.activeSounds = this._activeSounds.size;
    this._performanceMetrics.pooledSounds = Array.from(this._soundPools.values())
      .reduce((total, pool) => total + pool.sources.length, 0);
    
    // Calculate memory usage
    let memoryUsage = 0;
    this._soundPools.forEach(pool => {
      pool.sources.forEach(source => {
        if (source.buffer) {
          memoryUsage += source.buffer.length * source.buffer.numberOfChannels * 4;
        }
      });
    });
    this._performanceMetrics.memoryUsage = memoryUsage / (1024 * 1024); // Convert to MB
  }

  /**
   * Optimize performance based on current metrics
   */
  private optimizePerformance(): void {
    const metrics = this._performanceMetrics;
    
    // Reduce concurrent sounds if memory usage is high
    if (metrics.memoryUsage > this._performanceConfig.memoryLimit * 0.8) {
      this.cullLowPrioritySounds();
    }
    
    // Adjust quality if too many sounds are playing
    if (metrics.activeSounds > this._performanceConfig.maxConcurrentSounds * 0.8) {
      this.cullDistantSounds();
    }
    
    // Clean up finished sounds
    this.cleanupFinishedSounds();
  }

  /**
   * Update distance-based culling
   */
  private updateDistanceCulling(): void {
    const now = this._context.currentTime;
    if (now - this._lastCullUpdate < 0.1) {
      return; // Throttle updates
    }
    
    this._lastCullUpdate = now;
    
    this._activeSounds.forEach((activeSound, id) => {
      if (activeSound.options.position) {
        const distance = this.calculateDistance(
          this._listenerPosition,
          activeSound.options.position
        );
        
        if (distance > this._performanceConfig.maxDistance) {
          this.stopSound(activeSound.source);
          this._activeSounds.delete(id);
        }
      }
    });
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(pos1: Vector3, pos2: Vector3): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Cull low priority sounds
   */
  private cullLowPrioritySounds(): void {
    const soundsToStop: string[] = [];
    
    this._activeSounds.forEach((activeSound, id) => {
      if (activeSound.priority < this._performanceConfig.priorityThreshold) {
        soundsToStop.push(id);
      }
    });
    
    soundsToStop.forEach(id => {
      const activeSound = this._activeSounds.get(id);
      if (activeSound) {
        this.stopSound(activeSound.source);
        this._activeSounds.delete(id);
        this._performanceMetrics.droppedSounds++;
      }
    });
  }

  /**
   * Cull distant sounds
   */
  private cullDistantSounds(): void {
    const soundsWithDistance: Array<{ id: string; sound: ActiveSound; distance: number }> = [];
    
    this._activeSounds.forEach((activeSound, id) => {
      if (activeSound.options.position) {
        const distance = this.calculateDistance(
          this._listenerPosition,
          activeSound.options.position
        );
        soundsWithDistance.push({ id, sound: activeSound, distance });
      }
    });
    
    // Sort by distance and stop the farthest sounds
    soundsWithDistance.sort((a, b) => b.distance - a.distance);
    const soundsToStop = soundsWithDistance.slice(0, Math.floor(soundsWithDistance.length * 0.3));
    
    soundsToStop.forEach(({ id, sound }) => {
      this.stopSound(sound.source);
      this._activeSounds.delete(id);
      this._performanceMetrics.droppedSounds++;
    });
  }

  /**
   * Clean up finished sounds
   */
  private cleanupFinishedSounds(): void {
    const finishedSounds: string[] = [];
    
    this._activeSounds.forEach((activeSound, id) => {
      if (!activeSound.source.isPlaying && !activeSound.source.isPaused) {
        finishedSounds.push(id);
      }
    });
    
    finishedSounds.forEach(id => {
      this._activeSounds.delete(id);
    });
  }

  // Main playback methods
  async play(name: string, options: SoundPlayOptions = {}): Promise<AudioSource> {
    try {
      // Check if we're at the concurrent sound limit
      if (this._activeSounds.size >= this._performanceConfig.maxConcurrentSounds) {
        // Try to make room by stopping low priority sounds
        this.cullLowPrioritySounds();
        
        // If still at limit, queue the sound or reject based on priority
        if (this._activeSounds.size >= this._performanceConfig.maxConcurrentSounds) {
          const priority = options.priority || 0.5;
          if (priority < this._performanceConfig.priorityThreshold) {
            throw new Error('Sound rejected due to low priority and resource constraints');
          }
          
          // Queue high priority sound
          this._soundQueue.push({
            name,
            options,
            timestamp: this._context.currentTime
          });
          
          // Process queue asynchronously
          setTimeout(() => this.processQueue(), 10);
          
          // Return a placeholder for now
          return this.createPlaceholderSource();
        }
      }
      
      // Get or create sound pool
      const pool = await this.getOrCreatePool(name);
      
      // Get available source from pool
      const source = this.getPooledSource(pool);
      
      // Configure source
      this.configureSource(source, options);
      
      // Play the source
      await source.play(options.delay ? this._context.currentTime + options.delay : undefined);
      
      // Track active sound
      const activeSound: ActiveSound = {
        source,
        name,
        priority: options.priority || 0.5,
        startTime: this._context.currentTime,
        options
      };
      
      const soundId = `${name}_${Date.now()}_${Math.random()}`;
      this._activeSounds.set(soundId, activeSound);
      
      // Setup cleanup when sound ends
      source.on('audio:end', () => {
        this._activeSounds.delete(soundId);
        this.returnSourceToPool(pool, source);
      });
      
      this.emit('audio:play', { source });
      
      return source;
      
    } catch (error) {
      console.error(`Failed to play sound '${name}':`, error);
      throw error;
    }
  }

  /**
   * Process queued sounds
   */
  private processQueue(): void {
    if (this._soundQueue.length === 0) {
      return;
    }
    
    // Sort queue by priority and timestamp
    this._soundQueue.sort((a, b) => {
      const priorityDiff = (b.options.priority || 0.5) - (a.options.priority || 0.5);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp; // Earlier sounds first for same priority
    });
    
    // Try to play queued sounds
    while (this._soundQueue.length > 0 && 
           this._activeSounds.size < this._performanceConfig.maxConcurrentSounds) {
      const queuedSound = this._soundQueue.shift()!;
      
      try {
        this.play(queuedSound.name, queuedSound.options);
      } catch (error) {
        console.warn('Failed to play queued sound:', error);
      }
    }
  }

  /**
   * Create placeholder source for queued sounds
   */
  private createPlaceholderSource(): AudioSource {
    // This would return a mock AudioSource that represents a queued sound
    // Implementation depends on your AudioSource interface
    throw new Error('Sound queued - will play when resources available');
  }

  /**
   * Get or create sound pool
   */
  private async getOrCreatePool(name: string): Promise<SoundPool> {
    let pool = this._soundPools.get(name);
    
    if (!pool) {
      // Create new pool
      pool = {
        name,
        sources: [],
        maxSize: this._performanceConfig.maxPoolSize,
        currentIndex: 0,
        priority: 0.5,
        variations: [],
        maxConcurrent: 4,
        activeSources: new Set()
      };
      
      // Load initial source
      const source = await this._audioManager.loadAudio(name, `sounds/${name}.ogg`);
      pool.sources.push(source);
      
      this._soundPools.set(name, pool);
    }
    
    return pool;
  }

  /**
   * Get available source from pool
   */
  private getPooledSource(pool: SoundPool): AudioSource {
    // Find an inactive source
    for (const source of pool.sources) {
      if (!source.isPlaying && !source.isPaused) {
        return source;
      }
    }
    
    // If pool not full, create new source
    if (pool.sources.length < pool.maxSize) {
      try {
        // Clone the first source's buffer for new instances
        const originalSource = pool.sources[0];
        if (originalSource.buffer) {
          const newSource = this.createSourceFromBuffer(originalSource.buffer, pool.name);
          pool.sources.push(newSource);
          return newSource;
        }
      } catch (error) {
        console.warn('Failed to create new pooled source:', error);
      }
    }
    
    // Pool is full, use round-robin selection
    const source = pool.sources[pool.currentIndex];
    pool.currentIndex = (pool.currentIndex + 1) % pool.sources.length;
    
    // Stop the source if it's playing
    if (source.isPlaying) {
      source.stop();
    }
    
    return source;
  }

  /**
   * Create new AudioSource from buffer
   */
  private createSourceFromBuffer(buffer: AudioBuffer, name: string): AudioSource {
    // Implementation depends on your AudioSource constructor
    // This is a simplified version
    const { GameByteAudioSource } = require('../core/GameByteAudioSource');
    return new GameByteAudioSource(
      `${name}_${Date.now()}`,
      buffer,
      this._context,
      this._masterGain
    );
  }

  /**
   * Configure source with play options
   */
  private configureSource(source: AudioSource, options: SoundPlayOptions): void {
    if (options.volume !== undefined) {
      source.setVolume(options.volume, options.fadeIn || 0);
    }
    
    if (options.pitch !== undefined && 'setPlaybackRate' in source) {
      (source as any).setPlaybackRate(options.pitch);
    }
    
    if (options.position) {
      source.setPosition(options.position);
    }
    
    if (options.loop !== undefined && 'setLoop' in source) {
      (source as any).setLoop(options.loop);
    }
  }

  /**
   * Return source to pool
   */
  private returnSourceToPool(pool: SoundPool, source: AudioSource): void {
    pool.activeSources.delete(source);
    
    // Reset source state
    source.setVolume(1.0, 0);
    if ('setPlaybackRate' in source) {
      (source as any).setPlaybackRate(1.0);
    }
    if ('setLoop' in source) {
      (source as any).setLoop(false);
    }
  }

  /**
   * Stop a specific sound source
   */
  private stopSound(source: AudioSource): void {
    try {
      source.stop();
    } catch (error) {
      console.warn('Error stopping sound:', error);
    }
  }

  // Pool management
  async preload(sounds: string[]): Promise<void> {
    const loadPromises = sounds.map(async (sound) => {
      try {
        await this.getOrCreatePool(sound);
      } catch (error) {
        console.warn(`Failed to preload sound '${sound}':`, error);
      }
    });
    
    await Promise.all(loadPromises);
    
    this.emit('sfx:preloaded', {
      sounds,
      count: sounds.length
    } as any);
  }

  setPoolSize(sound: string, size: number): void {
    const pool = this._soundPools.get(sound);
    if (pool) {
      pool.maxSize = Math.max(1, Math.min(size, 16)); // Clamp between 1 and 16
      
      // Trim pool if needed
      if (pool.sources.length > pool.maxSize) {
        const toRemove = pool.sources.splice(pool.maxSize);
        toRemove.forEach(source => {
          if ('destroy' in source) {
            (source as any).destroy();
          }
        });
      }
    }
  }

  warmUp(): void {
    // Pre-initialize pools with multiple sources
    this._soundPools.forEach(async (pool) => {
      while (pool.sources.length < Math.min(pool.maxSize, 2)) {
        try {
          const originalSource = pool.sources[0];
          if (originalSource.buffer) {
            const newSource = this.createSourceFromBuffer(originalSource.buffer, pool.name);
            pool.sources.push(newSource);
          }
        } catch (error) {
          console.warn('Failed to warm up pool:', error);
          break;
        }
      }
    });
  }

  // Variation system
  addVariation(baseName: string, variations: string[]): void {
    const variation: SoundVariation = {
      baseName,
      variations,
      playPattern: 'random',
      lastPlayedIndex: -1
    };
    
    this._variations.set(baseName, variation);
    
    // Preload variation sounds
    this.preload(variations);
  }

  async playVariation(baseName: string, options: SoundPlayOptions = {}): Promise<AudioSource> {
    const variation = this._variations.get(baseName);
    if (!variation) {
      // Fall back to base sound
      return this.play(baseName, options);
    }
    
    let soundName: string;
    
    switch (variation.playPattern) {
      case 'sequential':
        variation.lastPlayedIndex = (variation.lastPlayedIndex + 1) % variation.variations.length;
        soundName = variation.variations[variation.lastPlayedIndex];
        break;
      case 'weighted':
        soundName = this.selectWeightedVariation(variation);
        break;
      case 'random':
      default:
        soundName = variation.variations[Math.floor(Math.random() * variation.variations.length)];
        break;
    }
    
    return this.play(soundName, options);
  }

  /**
   * Select variation based on weights
   */
  private selectWeightedVariation(variation: SoundVariation): string {
    if (!variation.weights || variation.weights.length !== variation.variations.length) {
      // Fall back to random selection
      return variation.variations[Math.floor(Math.random() * variation.variations.length)];
    }
    
    const totalWeight = variation.weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (let i = 0; i < variation.variations.length; i++) {
      currentWeight += variation.weights[i];
      if (random <= currentWeight) {
        return variation.variations[i];
      }
    }
    
    // Fallback
    return variation.variations[variation.variations.length - 1];
  }

  // Priority system
  setPriority(sound: string, priority: number): void {
    const pool = this._soundPools.get(sound);
    if (pool) {
      pool.priority = Math.max(0, Math.min(1, priority));
    }
  }

  setMaxConcurrent(sound: string, max: number): void {
    const pool = this._soundPools.get(sound);
    if (pool) {
      pool.maxConcurrent = Math.max(1, max);
    }
  }

  /**
   * Stop low priority sounds to make room for higher priority ones
   */
  stopLowPrioritySounds(): void {
    this.cullLowPrioritySounds();
  }

  /**
   * Set listener position for distance culling
   */
  setListenerPosition(position: Vector3): void {
    this._listenerPosition = { ...position };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): typeof this._performanceMetrics {
    return { ...this._performanceMetrics };
  }

  /**
   * Update performance configuration
   */
  updatePerformanceConfig(config: Partial<SFXPerformanceConfig>): void {
    this._performanceConfig = { ...this._performanceConfig, ...config };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop culling system
    if (this._cullUpdateInterval) {
      clearInterval(this._cullUpdateInterval);
      this._cullUpdateInterval = null;
    }
    
    // Stop all active sounds
    this._activeSounds.forEach(activeSound => {
      this.stopSound(activeSound.source);
    });
    this._activeSounds.clear();
    
    // Destroy all pools
    this._soundPools.forEach(pool => {
      pool.sources.forEach(source => {
        if ('destroy' in source) {
          (source as any).destroy();
        }
      });
    });
    this._soundPools.clear();
    
    // Disconnect audio nodes
    this._masterGain.disconnect();
    this._compressor.disconnect();
    
    // Clear collections
    this._variations.clear();
    this._soundQueue.length = 0;
    
    this.removeAllListeners();
  }
}