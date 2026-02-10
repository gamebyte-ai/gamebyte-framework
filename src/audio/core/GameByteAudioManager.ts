import { EventEmitter } from 'eventemitter3';
import {
  AudioManager,
  AudioBus,
  AudioSource,
  MusicSystem,
  SFXSystem,
  SpatialAudioSystem,
  MobileAudioManager,
  AudioAnalyticsSystem,
  AudioEffectsProcessor,
  ProceduralAudioGenerator,
  AudioBusConfig,
  AudioBusType,
  MobileAudioConfig,
  AudioPerformanceMetrics,
  AudioPerformanceTier,
  AudioEvents,
  AudioQuality
} from '../../contracts/Audio';
import { GameByteMusicSystem } from '../music/GameByteMusicSystem';
import { GameByteSFXSystem } from '../sfx/GameByteSFXSystem';
import { GameByteSpatialAudioSystem } from '../spatial/GameByteSpatialAudioSystem';
import { GameByteMobileAudioManager } from '../mobile/GameByteMobileAudioManager';
import { GameByteAudioAnalytics } from '../analytics/GameByteAudioAnalytics';
import { GameByteAudioEffectsProcessor } from '../effects/GameByteAudioEffectsProcessor';
import { GameByteProceduralAudioGenerator } from '../procedural/GameByteProceduralAudioGenerator';
import { GameByteAudioBus } from './GameByteAudioBus';
import { GameByteAudioSource } from './GameByteAudioSource';
import { DeviceDetector } from '../../performance/DeviceDetector';
import { Logger } from '../../utils/Logger.js';

/**
 * Default mobile audio configuration
 */
const DEFAULT_MOBILE_CONFIG: MobileAudioConfig = {
  batteryOptimization: true,
  backgroundAudio: false,
  interruptionHandling: true,
  hardwareAcceleration: true,
  adaptiveQuality: true,
  maxConcurrentSounds: 32,
  memoryLimit: 64, // 64MB
  cpuLimit: 15 // 15% CPU usage limit
};

/**
 * GameByte Audio Manager - Professional audio system for mobile games
 * 
 * Features:
 * - High-performance Web Audio API integration
 * - Mobile-optimized audio processing
 * - Comprehensive mixing system with buses
 * - Spatial 3D audio with HRTF support
 * - Adaptive music system
 * - Battery and performance optimization
 * - Analytics and player preference tracking
 */
export class GameByteAudioManager extends EventEmitter<AudioEvents> implements AudioManager {
  private _context: AudioContext | null = null;
  private _isInitialized = false;
  private _performanceTier: AudioPerformanceTier = AudioPerformanceTier.MEDIUM;
  private _buses = new Map<string, AudioBus>();
  private _loadedAudio = new Map<string, AudioSource>();
  private _config: MobileAudioConfig;
  
  // Audio subsystems
  private _musicSystem: MusicSystem;
  private _sfxSystem: SFXSystem;
  private _spatialAudioSystem: SpatialAudioSystem;
  private _mobileManager: MobileAudioManager;
  private _analyticsSystem: AudioAnalyticsSystem;
  private _effectsProcessor: AudioEffectsProcessor;
  private _proceduralGenerator: ProceduralAudioGenerator;
  
  // Performance monitoring
  private _performanceMetrics: AudioPerformanceMetrics;
  private _performanceMonitorInterval: number | null = null;
  
  // Master controls
  private _masterVolume = 1.0;
  private _masterMuted = false;
  private _masterGain: GainNode | null = null;
  private _masterLimiter: DynamicsCompressorNode | null = null;

  constructor(config: Partial<MobileAudioConfig> = {}) {
    super();
    
    this._config = { ...DEFAULT_MOBILE_CONFIG, ...config };
    
    // Initialize performance metrics
    this._performanceMetrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      latency: 0,
      activeSources: 0,
      droppedFrames: 0,
      contextState: 'suspended',
      thermalState: 'nominal'
    };
    
    // Will be initialized in initialize() method
    this._musicSystem = null as any;
    this._sfxSystem = null as any;
    this._spatialAudioSystem = null as any;
    this._mobileManager = null as any;
    this._analyticsSystem = null as any;
    this._effectsProcessor = null as any;
    this._proceduralGenerator = null as any;
  }

  get context(): AudioContext {
    if (!this._context) {
      throw new Error('AudioManager not initialized. Call initialize() first.');
    }
    return this._context;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get performanceTier(): AudioPerformanceTier {
    return this._performanceTier;
  }

  get buses(): Map<string, AudioBus> {
    return new Map(this._buses);
  }

  /**
   * Initialize the audio system
   */
  async initialize(config: Partial<MobileAudioConfig> = {}): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    try {
      // Update configuration
      this._config = { ...this._config, ...config };
      
      // Create audio context with mobile-optimized settings
      await this.createAudioContext();
      
      // Detect device performance tier
      this._performanceTier = this.detectPerformanceTier();
      
      // Create master audio chain
      this.createMasterChain();
      
      // Initialize subsystems
      await this.initializeSubsystems();
      
      // Create default audio buses
      this.createDefaultBuses();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Handle iOS audio unlock
      this.setupAudioUnlock();
      
      this._isInitialized = true;
      this.emit('audio:initialized', { manager: this } as any);
      
    } catch (error) {
      this.emit('audio:error', { source: null as any, error: error as Error });
      throw error;
    }
  }

  /**
   * Create and configure audio context
   */
  private async createAudioContext(): Promise<void> {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!AudioContextClass) {
      throw new Error('Web Audio API not supported');
    }

    // Create context with optimized settings
    this._context = new AudioContextClass({
      latencyHint: 'interactive',
      sampleRate: this.getOptimalSampleRate()
    });

    // Update performance metrics
    this._performanceMetrics.contextState = this._context.state;
    this._performanceMetrics.latency = this._context.baseLatency || 0;

    // Don't resume here - let setupAudioUnlock() handle it on user interaction
    // This follows Web Audio API best practice: create context early but resume after user gesture
  }

  /**
   * Get optimal sample rate based on device capabilities
   */
  private getOptimalSampleRate(): number {
    // Check if device supports high sample rates
    const highQuality = this._config.adaptiveQuality && 
                       this._performanceTier === AudioPerformanceTier.PREMIUM;
    
    return highQuality ? 48000 : 44100;
  }

  /**
   * Detect device performance tier using centralized DeviceDetector
   */
  private detectPerformanceTier(): AudioPerformanceTier {
    if (!this._context) return AudioPerformanceTier.LOW;

    const maxChannels = this._context.destination.maxChannelCount;
    const sampleRate = this._context.sampleRate;
    const baseLatency = this._context.baseLatency || 0;

    // Use centralized DeviceDetector for hardware capabilities
    const cpuCores = DeviceDetector.getCoreCount();
    const memory = DeviceDetector.getDeviceMemory();

    // Performance tier calculation
    let score = 0;

    // Audio context capabilities
    if (maxChannels >= 8) score += 3;
    else if (maxChannels >= 6) score += 2;
    else if (maxChannels >= 2) score += 1;

    if (sampleRate >= 48000) score += 2;
    else if (sampleRate >= 44100) score += 1;

    if (baseLatency < 0.02) score += 2; // < 20ms
    else if (baseLatency < 0.05) score += 1; // < 50ms

    // Hardware capabilities
    if (cpuCores >= 8) score += 3;
    else if (cpuCores >= 4) score += 2;
    else if (cpuCores >= 2) score += 1;

    if (memory >= 8) score += 3;
    else if (memory >= 4) score += 2;
    else if (memory >= 2) score += 1;

    // Determine tier
    if (score >= 12) return AudioPerformanceTier.PREMIUM;
    if (score >= 8) return AudioPerformanceTier.HIGH;
    if (score >= 4) return AudioPerformanceTier.MEDIUM;
    return AudioPerformanceTier.LOW;
  }

  /**
   * Create master audio processing chain
   */
  private createMasterChain(): void {
    if (!this._context) return;
    
    // Master gain node
    this._masterGain = this._context.createGain();
    this._masterGain.gain.value = this._masterVolume;
    
    // Master limiter for preventing clipping
    this._masterLimiter = this._context.createDynamicsCompressor();
    this._masterLimiter.threshold.value = -3; // dB
    this._masterLimiter.knee.value = 12;
    this._masterLimiter.ratio.value = 20;
    this._masterLimiter.attack.value = 0.003;
    this._masterLimiter.release.value = 0.1;
    
    // Connect master chain
    this._masterGain.connect(this._masterLimiter);
    this._masterLimiter.connect(this._context.destination);
  }

  /**
   * Initialize audio subsystems
   */
  private async initializeSubsystems(): Promise<void> {
    if (!this._context) return;
    
    // Initialize effects processor first (other systems depend on it)
    this._effectsProcessor = new GameByteAudioEffectsProcessor(this._context);
    await this._effectsProcessor.initialize(this._context);
    
    // Initialize mobile manager
    this._mobileManager = new GameByteMobileAudioManager(this._config, this);
    await this._mobileManager.initialize(this);
    
    // Initialize analytics system
    this._analyticsSystem = new GameByteAudioAnalytics();
    
    // Initialize spatial audio system
    this._spatialAudioSystem = new GameByteSpatialAudioSystem(this._context, this._effectsProcessor);
    await this._spatialAudioSystem.initialize(this._context);
    
    // Initialize music system
    this._musicSystem = new GameByteMusicSystem(this._context, this);
    await this._musicSystem.initialize(this._context);
    
    // Initialize SFX system
    this._sfxSystem = new GameByteSFXSystem(this._context, this);
    await this._sfxSystem.initialize(this._context);
    
    // Initialize procedural audio generator
    this._proceduralGenerator = new GameByteProceduralAudioGenerator(this._context);
    await this._proceduralGenerator.initialize(this._context);
  }

  /**
   * Create default audio buses
   */
  private createDefaultBuses(): void {
    // Master bus
    this.createBus({
      name: 'master',
      type: AudioBusType.MASTER,
      volume: 1.0,
      muted: false,
      solo: false
    });
    
    // Music bus
    this.createBus({
      name: 'music',
      type: AudioBusType.MUSIC,
      volume: 0.8,
      muted: false,
      solo: false
    });
    
    // SFX bus
    this.createBus({
      name: 'sfx',
      type: AudioBusType.SFX,
      volume: 1.0,
      muted: false,
      solo: false
    });
    
    // Voice bus
    this.createBus({
      name: 'voice',
      type: AudioBusType.VOICE,
      volume: 1.0,
      muted: false,
      solo: false
    });
    
    // UI bus
    this.createBus({
      name: 'ui',
      type: AudioBusType.UI,
      volume: 0.7,
      muted: false,
      solo: false
    });
    
    // Ambient bus
    this.createBus({
      name: 'ambient',
      type: AudioBusType.AMBIENT,
      volume: 0.6,
      muted: false,
      solo: false
    });
  }

  /**
   * Setup audio unlock for iOS devices
   */
  private setupAudioUnlock(): void {
    if (!this._context) return;
    
    const unlockAudio = async () => {
      if (this._context && this._context.state === 'suspended') {
        try {
          await this._context.resume();
          this._performanceMetrics.contextState = this._context.state;
          
          // Remove event listeners after successful unlock
          document.removeEventListener('touchstart', unlockAudio);
          document.removeEventListener('touchend', unlockAudio);
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
          
          this.emit('audio:unlocked', {} as any);
        } catch (error) {
          Logger.warn('Audio', 'Failed to unlock audio context:', error);
        }
      }
    };
    
    // Add event listeners for user interaction
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('touchend', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (this._performanceMonitorInterval) {
      clearInterval(this._performanceMonitorInterval);
    }
    
    this._performanceMonitorInterval = window.setInterval(() => {
      this.updatePerformanceMetrics();
    }, 1000); // Update every second
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    if (!this._context) return;
    
    // Update context state
    this._performanceMetrics.contextState = this._context.state;
    
    // Count active sources
    this._performanceMetrics.activeSources = this._loadedAudio.size;
    
    // Estimate memory usage (approximate)
    let memoryUsage = 0;
    this._loadedAudio.forEach(source => {
      if (source.buffer) {
        memoryUsage += source.buffer.length * source.buffer.numberOfChannels * 4; // Float32 = 4 bytes
      }
    });
    this._performanceMetrics.memoryUsage = memoryUsage / (1024 * 1024); // Convert to MB
    
    // Check for performance warnings
    this.checkPerformanceWarnings();
    
    // Adapt to performance if enabled
    if (this._config.adaptiveQuality) {
      this.adaptToPerformance();
    }
  }

  /**
   * Check for performance warnings
   */
  private checkPerformanceWarnings(): void {
    const metrics = this._performanceMetrics;
    
    // Memory usage warning
    if (metrics.memoryUsage > this._config.memoryLimit * 0.8) {
      this.emit('audio:performance-warning', {
        metric: 'memory',
        value: metrics.memoryUsage,
        threshold: this._config.memoryLimit * 0.8
      } as any);
    }
    
    // Active sources warning
    if (metrics.activeSources > this._config.maxConcurrentSounds * 0.8) {
      this.emit('audio:performance-warning', {
        metric: 'sources',
        value: metrics.activeSources,
        threshold: this._config.maxConcurrentSounds * 0.8
      } as any);
    }
  }

  // System access methods
  getMusicSystem(): MusicSystem {
    return this._musicSystem;
  }

  getSFXSystem(): SFXSystem {
    return this._sfxSystem;
  }

  getSpatialAudioSystem(): SpatialAudioSystem {
    return this._spatialAudioSystem;
  }

  getMobileManager(): MobileAudioManager {
    return this._mobileManager;
  }

  getAnalyticsSystem(): AudioAnalyticsSystem {
    return this._analyticsSystem;
  }

  getEffectsProcessor(): AudioEffectsProcessor {
    return this._effectsProcessor;
  }

  getProceduralGenerator(): ProceduralAudioGenerator {
    return this._proceduralGenerator;
  }

  // Bus management
  createBus(config: AudioBusConfig): AudioBus {
    if (this._buses.has(config.name)) {
      throw new Error(`Audio bus '${config.name}' already exists`);
    }
    
    const bus = new GameByteAudioBus(this._context!, config, this._masterGain!);
    this._buses.set(config.name, bus);
    
    return bus;
  }

  getBus(name: string): AudioBus | null {
    return this._buses.get(name) || null;
  }

  removeBus(name: string): void {
    const bus = this._buses.get(name);
    if (bus) {
      // Remove all sources from bus
      bus.removeAllSources();
      this._buses.delete(name);
    }
  }

  getMasterBus(): AudioBus {
    const masterBus = this._buses.get('master');
    if (!masterBus) {
      throw new Error('Master bus not found');
    }
    return masterBus;
  }

  // Global controls
  setMasterVolume(volume: number, fadeTime = 0): void {
    this._masterVolume = Math.max(0, Math.min(1, volume));
    
    if (this._masterGain) {
      if (fadeTime > 0) {
        this._masterGain.gain.exponentialRampToValueAtTime(
          this._masterVolume,
          this._context!.currentTime + fadeTime
        );
      } else {
        this._masterGain.gain.value = this._masterVolume;
      }
    }
    
    this.emit('audio:volume-change', {
      source: null as any,
      volume: this._masterVolume
    });
  }

  getMasterVolume(): number {
    return this._masterVolume;
  }

  setMasterMuted(muted: boolean): void {
    this._masterMuted = muted;
    
    if (this._masterGain) {
      this._masterGain.gain.value = muted ? 0 : this._masterVolume;
    }
  }

  isMasterMuted(): boolean {
    return this._masterMuted;
  }

  // Performance methods
  getPerformanceMetrics(): AudioPerformanceMetrics {
    return { ...this._performanceMetrics };
  }

  optimizeForDevice(): void {
    // Adjust settings based on performance tier
    switch (this._performanceTier) {
      case AudioPerformanceTier.LOW:
        this._config.maxConcurrentSounds = Math.min(this._config.maxConcurrentSounds, 16);
        this._config.memoryLimit = Math.min(this._config.memoryLimit, 32);
        break;
      case AudioPerformanceTier.MEDIUM:
        this._config.maxConcurrentSounds = Math.min(this._config.maxConcurrentSounds, 32);
        this._config.memoryLimit = Math.min(this._config.memoryLimit, 64);
        break;
      case AudioPerformanceTier.HIGH:
        this._config.maxConcurrentSounds = Math.min(this._config.maxConcurrentSounds, 64);
        this._config.memoryLimit = Math.min(this._config.memoryLimit, 128);
        break;
      case AudioPerformanceTier.PREMIUM:
        // No limits for premium devices
        break;
    }
    
    // Apply optimizations to subsystems
    if (this._mobileManager) {
      this._mobileManager.optimizeForDevice();
    }
  }

  adaptToPerformance(): void {
    const metrics = this._performanceMetrics;
    
    // Reduce quality if memory usage is high
    if (metrics.memoryUsage > this._config.memoryLimit * 0.9) {
      // Stop least important sounds
      this._sfxSystem?.stopLowPrioritySounds();
    }
    
    // Reduce concurrent sounds if CPU usage is high
    if (metrics.cpuUsage > this._config.cpuLimit * 0.9) {
      this._config.maxConcurrentSounds = Math.max(8, this._config.maxConcurrentSounds - 4);
    }
  }

  // Asset management
  async loadAudio(name: string, url: string, options: any = {}): Promise<AudioSource> {
    if (this._loadedAudio.has(name)) {
      return this._loadedAudio.get(name)!;
    }
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this._context!.decodeAudioData(arrayBuffer);
      
      const source = new GameByteAudioSource(
        name,
        audioBuffer,
        this._context!,
        this._masterGain!,
        options
      );
      
      this._loadedAudio.set(name, source);
      
      this.emit('audio:loaded', { source });
      return source;
      
    } catch (error) {
      this.emit('audio:error', { source: null as any, error: error as Error });
      throw error;
    }
  }

  async preloadAudio(urls: Array<{ name: string; url: string; options?: any }>): Promise<void> {
    const loadPromises = urls.map(({ name, url, options }) =>
      this.loadAudio(name, url, options)
    );
    
    await Promise.all(loadPromises);
  }

  unloadAudio(name: string): void {
    const source = this._loadedAudio.get(name);
    if (source) {
      source.destroy();
      this._loadedAudio.delete(name);
    }
  }

  getLoadedAudio(name: string): AudioSource | null {
    return this._loadedAudio.get(name) || null;
  }

  /**
   * Destroy the audio system and clean up resources
   */
  destroy(): void {
    // Stop performance monitoring
    if (this._performanceMonitorInterval) {
      clearInterval(this._performanceMonitorInterval);
      this._performanceMonitorInterval = null;
    }
    
    // Destroy all audio sources
    this._loadedAudio.forEach(source => source.destroy());
    this._loadedAudio.clear();
    
    // Destroy all buses
    this._buses.forEach(bus => {
      if ('destroy' in bus && typeof bus.destroy === 'function') {
        bus.destroy();
      }
    });
    this._buses.clear();
    
    // Destroy subsystems
    if (this._musicSystem && 'destroy' in this._musicSystem) {
      (this._musicSystem as any).destroy();
    }
    if (this._sfxSystem && 'destroy' in this._sfxSystem) {
      (this._sfxSystem as any).destroy();
    }
    if (this._spatialAudioSystem && 'destroy' in this._spatialAudioSystem) {
      (this._spatialAudioSystem as any).destroy();
    }
    if (this._mobileManager && 'destroy' in this._mobileManager) {
      (this._mobileManager as any).destroy();
    }
    if (this._analyticsSystem && 'destroy' in this._analyticsSystem) {
      (this._analyticsSystem as any).destroy();
    }
    if (this._effectsProcessor && 'destroy' in this._effectsProcessor) {
      (this._effectsProcessor as any).destroy();
    }
    if (this._proceduralGenerator && 'destroy' in this._proceduralGenerator) {
      (this._proceduralGenerator as any).destroy();
    }
    
    // Close audio context
    if (this._context && this._context.close) {
      this._context.close();
      this._context = null;
    }
    
    // Clean up master nodes
    this._masterGain = null;
    this._masterLimiter = null;
    
    this._isInitialized = false;
    this.removeAllListeners();
    
    this.emit('audio:destroyed', {} as any);
  }
}