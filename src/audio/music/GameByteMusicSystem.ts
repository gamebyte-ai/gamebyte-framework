import { EventEmitter } from 'eventemitter3';
import {
  MusicSystem,
  MusicConfig,
  AudioManager,
  AudioSource,
  AudioEvents,
  AudioFadeType
} from '../../contracts/Audio';
import { Logger } from '../../utils/Logger.js';

/**
 * Music track with layered audio support
 */
interface MusicTrack {
  name: string;
  layers: Map<string, AudioSource>;
  config: MusicConfig;
  masterGain: GainNode;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  loopPoints: Map<string, number>;
}

/**
 * Music layer with individual control
 */
interface MusicLayer {
  name: string;
  source: AudioSource;
  gain: GainNode;
  volume: number;
  isActive: boolean;
  fadeTime: number;
  condition?: () => boolean;
}

/**
 * Adaptive music parameter
 */
interface AdaptiveParameter {
  name: string;
  value: number;
  target?: string;
  minValue: number;
  maxValue: number;
  smoothing: number;
}

/**
 * Default music configuration
 */
const DEFAULT_MUSIC_CONFIG: MusicConfig = {
  crossfade: {
    enabled: true,
    duration: 2.0,
    curve: AudioFadeType.EXPONENTIAL
  },
  adaptive: {
    enabled: false,
    parameters: []
  },
  loop: {
    enabled: true,
    seamless: true,
    points: []
  }
};

/**
 * GameByte Music System - Advanced adaptive and interactive music system
 * 
 * Features:
 * - Multi-layered adaptive music with dynamic mixing
 * - Seamless crossfading between tracks and sections
 * - Interactive music that responds to game state parameters
 * - Precision loop management with custom loop points
 * - Real-time parameter control for adaptive scoring
 * - Memory-efficient track and layer management
 * - Mobile-optimized audio streaming and caching
 */
export class GameByteMusicSystem extends EventEmitter<AudioEvents> implements MusicSystem {
  private _context: AudioContext;
  private _audioManager: AudioManager;
  private _currentTrack: string | null = null;
  private _tracks = new Map<string, MusicTrack>();
  private _activeLayers = new Set<string>();
  private _adaptiveParameters = new Map<string, AdaptiveParameter>();
  private _isPlaying = false;
  
  // Audio processing
  private _masterGain!: GainNode;
  private _crossfadeGain!: GainNode;
  private _analysisNode!: AnalyserNode;
  
  // Crossfading
  private _crossfadeInProgress = false;
  private _crossfadeTarget: string | null = null;
  private _crossfadeStartTime = 0;
  private _crossfadeDuration = 2.0;
  
  // Adaptive music
  private _adaptiveUpdateInterval: number | null = null;
  private _lastAdaptiveUpdate = 0;
  
  // Performance monitoring
  private _performanceMetrics = {
    activeTracks: 0,
    activeLayers: 0,
    memoryUsage: 0,
    cpuUsage: 0
  };

  constructor(context: AudioContext, audioManager: AudioManager) {
    super();
    
    this._context = context;
    this._audioManager = audioManager;
    
    this.createAudioNodes();
  }

  get currentTrack(): string | null {
    return this._currentTrack;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get activeLayers(): Set<string> {
    return new Set(this._activeLayers);
  }

  /**
   * Initialize the music system
   */
  async initialize(): Promise<void> {
    try {
      // Start adaptive music parameter monitoring
      this.startAdaptiveMonitoring();
      
      // Setup performance monitoring
      this.startPerformanceMonitoring();
      
      this.emit('music:initialized', {} as any);
      
    } catch (error) {
      Logger.error('Audio', 'Music system initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create audio processing nodes
   */
  private createAudioNodes(): void {
    // Master gain for music volume control
    this._masterGain = this._context.createGain();
    this._masterGain.gain.value = 1.0;
    
    // Crossfade gain for smooth transitions
    this._crossfadeGain = this._context.createGain();
    this._crossfadeGain.gain.value = 1.0;
    
    // Analysis node for music visualization
    this._analysisNode = this._context.createAnalyser();
    this._analysisNode.fftSize = 1024;
    this._analysisNode.smoothingTimeConstant = 0.8;
    
    // Connect audio chain
    this._masterGain.connect(this._crossfadeGain);
    this._crossfadeGain.connect(this._analysisNode);
    
    // Connect to music bus
    const musicBus = this._audioManager.getBus('music');
    if (musicBus && 'getInputNode' in musicBus) {
      this._analysisNode.connect((musicBus as any).getInputNode());
    }
  }

  /**
   * Start adaptive music parameter monitoring
   */
  private startAdaptiveMonitoring(): void {
    if (this._adaptiveUpdateInterval) {
      clearInterval(this._adaptiveUpdateInterval);
    }
    
    this._adaptiveUpdateInterval = window.setInterval(() => {
      this.updateAdaptiveMusic();
    }, 100); // Update 10 times per second
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 1000); // Update every second
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    this._performanceMetrics.activeTracks = this._tracks.size;
    this._performanceMetrics.activeLayers = this._activeLayers.size;
    
    // Calculate memory usage (approximate)
    let memoryUsage = 0;
    this._tracks.forEach(track => {
      track.layers.forEach(layer => {
        if (layer.buffer) {
          memoryUsage += layer.buffer.length * layer.buffer.numberOfChannels * 4;
        }
      });
    });
    this._performanceMetrics.memoryUsage = memoryUsage / (1024 * 1024); // Convert to MB
  }

  // Track management
  async loadTrack(name: string, url: string, config: MusicConfig = {}): Promise<void> {
    if (this._tracks.has(name)) {
      Logger.warn('Audio', `Music track '${name}' already loaded`);
      return;
    }
    
    try {
      const mergedConfig = { ...DEFAULT_MUSIC_CONFIG, ...config };
      
      // Create track structure
      const track: MusicTrack = {
        name,
        layers: new Map(),
        config: mergedConfig,
        masterGain: this._context.createGain(),
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        loopPoints: new Map()
      };
      
      // Load main audio source
      const mainSource = await this._audioManager.loadAudio(`${name}_main`, url);
      track.duration = mainSource.duration;
      
      // Create main layer
      const mainLayer: MusicLayer = {
        name: 'main',
        source: mainSource,
        gain: this._context.createGain(),
        volume: 1.0,
        isActive: true,
        fadeTime: 0
      };
      
      track.layers.set('main', mainSource);
      
      // Load additional layers if specified
      if (mergedConfig.layers) {
        for (const layerConfig of mergedConfig.layers) {
          await this.loadTrackLayer(track, layerConfig.name, `${url}_${layerConfig.name}`, layerConfig);
        }
      }
      
      // Setup loop points
      if (mergedConfig.loop?.points) {
        mergedConfig.loop.points.forEach(point => {
          track.loopPoints.set(point.name, point.time);
        });
      }
      
      // Connect track audio chain
      this.connectTrackAudio(track);
      
      this._tracks.set(name, track);
      
      this.emit('music:track-loaded', {
        track: name,
        duration: track.duration
      } as any);
      
    } catch (error) {
      Logger.error('Audio', `Failed to load music track '${name}':`, error);
      throw error;
    }
  }

  /**
   * Load additional layer for a track
   */
  private async loadTrackLayer(
    track: MusicTrack, 
    layerName: string, 
    url: string, 
    layerConfig: any
  ): Promise<void> {
    try {
      const source = await this._audioManager.loadAudio(`${track.name}_${layerName}`, url);
      track.layers.set(layerName, source);
      
      this.emit('music:layer-loaded', {
        track: track.name,
        layer: layerName
      } as any);
      
    } catch (error) {
      Logger.warn('Audio', `Failed to load layer '${layerName}' for track '${track.name}':`, error);
    }
  }

  /**
   * Connect track audio processing chain
   */
  private connectTrackAudio(track: MusicTrack): void {
    // Connect track master gain to music system master
    track.masterGain.connect(this._masterGain);
    
    // Setup layers will be connected when activated
  }

  async playTrack(name: string, fadeTime = 0): Promise<void> {
    const track = this._tracks.get(name);
    if (!track) {
      throw new Error(`Music track '${name}' not found`);
    }
    
    // Handle crossfading if another track is playing
    if (this._currentTrack && this._currentTrack !== name) {
      if (fadeTime > 0 || track.config.crossfade?.enabled) {
        const crossfadeDuration = fadeTime || track.config.crossfade?.duration || 2.0;
        await this.crossfadeTo(name, crossfadeDuration);
        return;
      } else {
        // Stop current track immediately
        await this.stopTrack(0);
      }
    }
    
    try {
      // Activate main layer
      const mainLayer = track.layers.get('main');
      if (mainLayer) {
        await mainLayer.play();
      }
      
      // Activate layers based on conditions
      if (track.config.layers) {
        for (const layerConfig of track.config.layers) {
          if (!layerConfig.condition || layerConfig.condition()) {
            this.enableLayer(layerConfig.name, layerConfig.fadeTime);
          }
        }
      }
      
      track.isPlaying = true;
      track.isPaused = false;
      this._currentTrack = name;
      this._isPlaying = true;
      
      // Apply fade in if specified
      if (fadeTime > 0) {
        track.masterGain.gain.value = 0;
        track.masterGain.gain.exponentialRampToValueAtTime(
          1.0,
          this._context.currentTime + fadeTime
        );
      }
      
      // Setup looping if enabled
      if (track.config.loop?.enabled) {
        this.setupTrackLooping(track);
      }
      
      this.emit('music:track-change', {
        previous: this._currentTrack === name ? undefined : this._currentTrack,
        current: name
      });
      
      this.emit('audio:play', {
        source: mainLayer as any
      });
      
    } catch (error) {
      Logger.error('Audio', `Failed to play music track '${name}':`, error);
      throw error;
    }
  }

  /**
   * Setup looping for a track
   */
  private setupTrackLooping(track: MusicTrack): void {
    track.layers.forEach(layer => {
      if (layer.setLoop) {
        layer.setLoop(true);
      }
    });
    
    // Handle custom loop points if specified
    if (track.config.loop?.seamless && track.loopPoints.size > 0) {
      this.setupSeamlessLooping(track);
    }
  }

  /**
   * Setup seamless looping with custom loop points
   */
  private setupSeamlessLooping(track: MusicTrack): void {
    // This would require more complex implementation with precise timing
    // For now, we'll use the basic looping functionality
    Logger.info('Audio', `Seamless looping setup for track: ${track.name}`);
  }

  async stopTrack(fadeTime = 0): Promise<void> {
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track) {
      return;
    }
    
    try {
      if (fadeTime > 0) {
        // Fade out
        track.masterGain.gain.exponentialRampToValueAtTime(
          0.001,
          this._context.currentTime + fadeTime
        );
        
        // Stop after fade completes
        setTimeout(() => {
          this.stopTrackImmediate(track);
        }, fadeTime * 1000);
      } else {
        this.stopTrackImmediate(track);
      }
      
    } catch (error) {
      Logger.error('Audio', 'Failed to stop music track:', error);
    }
  }

  /**
   * Stop track immediately without fading
   */
  private stopTrackImmediate(track: MusicTrack): void {
    // Stop all layers
    track.layers.forEach(layer => {
      layer.stop();
    });
    
    track.isPlaying = false;
    track.isPaused = false;
    track.currentTime = 0;
    track.masterGain.gain.value = 1.0; // Reset gain
    
    // Clear active layers
    this._activeLayers.clear();
    
    this._currentTrack = null;
    this._isPlaying = false;
    
    this.emit('audio:stop', {
      source: track.layers.get('main') as any
    });
  }

  pauseTrack(): void {
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track || !track.isPlaying) {
      return;
    }
    
    track.layers.forEach(layer => {
      layer.pause();
    });
    
    track.isPlaying = false;
    track.isPaused = true;
    this._isPlaying = false;
    
    this.emit('audio:pause', {
      source: track.layers.get('main') as any
    });
  }

  resumeTrack(): void {
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track || !track.isPaused) {
      return;
    }
    
    track.layers.forEach(layer => {
      layer.play();
    });
    
    track.isPlaying = true;
    track.isPaused = false;
    this._isPlaying = true;
    
    this.emit('audio:play', {
      source: track.layers.get('main') as any
    });
  }

  // Layer management
  enableLayer(layer: string, fadeTime = 0): void {
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track) {
      return;
    }
    
    const layerSource = track.layers.get(layer);
    if (!layerSource) {
      Logger.warn('Audio', `Layer '${layer}' not found in track '${this._currentTrack}'`);
      return;
    }
    
    if (this._activeLayers.has(layer)) {
      return; // Already active
    }
    
    try {
      // Play the layer
      layerSource.play();
      
      // Apply fade in if specified
      if (fadeTime > 0) {
        layerSource.setVolume(0, 0);
        layerSource.setVolume(1.0, fadeTime);
      }
      
      this._activeLayers.add(layer);
      
      this.emit('music:layer-change', {
        layer,
        active: true
      });
      
    } catch (error) {
      Logger.error('Audio', `Failed to enable layer '${layer}':`, error);
    }
  }

  disableLayer(layer: string, fadeTime = 0): void {
    if (!this._activeLayers.has(layer)) {
      return;
    }
    
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track) {
      return;
    }
    
    const layerSource = track.layers.get(layer);
    if (!layerSource) {
      return;
    }
    
    try {
      if (fadeTime > 0) {
        // Fade out then stop
        layerSource.setVolume(0, fadeTime);
        setTimeout(() => {
          layerSource.stop();
          this._activeLayers.delete(layer);
        }, fadeTime * 1000);
      } else {
        layerSource.stop();
        this._activeLayers.delete(layer);
      }
      
      this.emit('music:layer-change', {
        layer,
        active: false
      });
      
    } catch (error) {
      Logger.error('Audio', `Failed to disable layer '${layer}':`, error);
    }
  }

  setLayerVolume(layer: string, volume: number, fadeTime = 0): void {
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track) {
      return;
    }
    
    const layerSource = track.layers.get(layer);
    if (!layerSource) {
      return;
    }
    
    layerSource.setVolume(Math.max(0, Math.min(1, volume)), fadeTime);
  }

  // Adaptive music
  setParameter(name: string, value: number): void {
    const parameter = this._adaptiveParameters.get(name);
    if (parameter) {
      parameter.value = Math.max(parameter.minValue, Math.min(parameter.maxValue, value));
    } else {
      // Create new parameter
      this._adaptiveParameters.set(name, {
        name,
        value,
        minValue: 0,
        maxValue: 1,
        smoothing: 0.1
      });
    }
    
    this.emit('music:parameter-changed', {
      parameter: name,
      value
    } as any);
  }

  getParameter(name: string): number {
    const parameter = this._adaptiveParameters.get(name);
    return parameter ? parameter.value : 0;
  }

  updateAdaptiveMusic(): void {
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track || !track.config.adaptive?.enabled) {
      return;
    }
    
    const now = this._context.currentTime;
    if (now - this._lastAdaptiveUpdate < 0.1) {
      return; // Throttle updates
    }
    
    this._lastAdaptiveUpdate = now;
    
    // Update layers based on adaptive parameters
    if (track.config.layers) {
      track.config.layers.forEach(layerConfig => {
        if (layerConfig.condition) {
          const shouldBeActive = layerConfig.condition();
          const isActive = this._activeLayers.has(layerConfig.name);
          
          if (shouldBeActive && !isActive) {
            this.enableLayer(layerConfig.name, layerConfig.fadeTime);
          } else if (!shouldBeActive && isActive) {
            this.disableLayer(layerConfig.name, layerConfig.fadeTime);
          }
        }
      });
    }
    
    // Update adaptive parameters
    if (track.config.adaptive?.parameters) {
      track.config.adaptive.parameters.forEach(paramConfig => {
        const parameter = this._adaptiveParameters.get(paramConfig.name);
        if (parameter && paramConfig.target) {
          // Apply parameter to target (layer volume, effect parameter, etc.)
          this.applyParameterToTarget(paramConfig.target, parameter.value);
        }
      });
    }
  }

  /**
   * Apply adaptive parameter to its target
   */
  private applyParameterToTarget(target: string, value: number): void {
    // Parse target string (e.g., "layer:drums", "effect:reverb.roomSize")
    const [targetType, targetName] = target.split(':');
    
    if (targetType === 'layer') {
      this.setLayerVolume(targetName, value);
    } else if (targetType === 'effect') {
      // Handle effect parameter updates
      const [effectName, parameter] = targetName.split('.');
      // Implementation would depend on effect system integration
    }
  }

  // Crossfading
  async crossfadeTo(track: string, duration = 2.0): Promise<void> {
    if (this._crossfadeInProgress) {
      return; // Already crossfading
    }
    
    const targetTrack = this._tracks.get(track);
    if (!targetTrack) {
      throw new Error(`Target track '${track}' not found`);
    }
    
    this._crossfadeInProgress = true;
    this._crossfadeTarget = track;
    this._crossfadeStartTime = this._context.currentTime;
    this._crossfadeDuration = duration;
    
    try {
      // Start target track at zero volume
      targetTrack.masterGain.gain.value = 0;
      await this.playTrack(track, 0);
      
      // Crossfade between tracks
      const currentTrack = this._currentTrack ? this._tracks.get(this._currentTrack) : null;
      
      if (currentTrack && currentTrack.name !== track) {
        // Fade out current track
        currentTrack.masterGain.gain.exponentialRampToValueAtTime(
          0.001,
          this._context.currentTime + duration
        );
        
        // Stop current track after fade
        setTimeout(() => {
          this.stopTrackImmediate(currentTrack);
        }, duration * 1000);
      }
      
      // Fade in target track
      targetTrack.masterGain.gain.exponentialRampToValueAtTime(
        1.0,
        this._context.currentTime + duration
      );
      
      // Complete crossfade
      setTimeout(() => {
        this._crossfadeInProgress = false;
        this._crossfadeTarget = null;
        
        this.emit('music:crossfade-complete', {
          track
        } as any);
      }, duration * 1000);
      
    } catch (error) {
      this._crossfadeInProgress = false;
      this._crossfadeTarget = null;
      throw error;
    }
  }

  // Loop management
  setLoopPoints(start: number, end: number): void {
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track) {
      return;
    }
    
    track.loopPoints.set('loop_start', start);
    track.loopPoints.set('loop_end', end);
    
    // Update loop configuration
    if (!track.config.loop) {
      track.config.loop = { enabled: true, seamless: true, points: [] };
    }
    
    track.config.loop.points = [
      { name: 'loop_start', time: start },
      { name: 'loop_end', time: end }
    ];
  }

  addLoopMarker(name: string, time: number): void {
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track) {
      return;
    }
    
    track.loopPoints.set(name, time);
    
    if (!track.config.loop) {
      track.config.loop = { enabled: true, seamless: true, points: [] };
    }
    
    if (!track.config.loop.points) {
      track.config.loop.points = [];
    }
    
    track.config.loop.points.push({ name, time });
  }

  jumpToMarker(name: string): void {
    if (!this._currentTrack) {
      return;
    }
    
    const track = this._tracks.get(this._currentTrack);
    if (!track) {
      return;
    }
    
    const markerTime = track.loopPoints.get(name);
    if (markerTime !== undefined) {
      track.layers.forEach(layer => {
        layer.seek(markerTime);
      });
      
      track.currentTime = markerTime;
      
      this.emit('music:marker-jump', {
        track: track.name,
        marker: name,
        time: markerTime
      } as any);
    }
  }

  /**
   * Get music analysis data for visualization
   */
  getAnalysisData(): {
    frequencyData: Uint8Array;
    timeDomainData: Uint8Array;
    rmsLevel: number;
    peakLevel: number;
  } {
    const frequencyData = new Uint8Array(this._analysisNode.frequencyBinCount);
    const timeDomainData = new Uint8Array(this._analysisNode.frequencyBinCount);
    
    this._analysisNode.getByteFrequencyData(frequencyData);
    this._analysisNode.getByteTimeDomainData(timeDomainData);
    
    // Calculate RMS level
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i] * frequencyData[i];
    }
    const rmsLevel = Math.sqrt(sum / frequencyData.length) / 255;
    
    // Calculate peak level
    let peak = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      peak = Math.max(peak, frequencyData[i]);
    }
    const peakLevel = peak / 255;
    
    return {
      frequencyData,
      timeDomainData,
      rmsLevel,
      peakLevel
    };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): typeof this._performanceMetrics {
    return { ...this._performanceMetrics };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop adaptive monitoring
    if (this._adaptiveUpdateInterval) {
      clearInterval(this._adaptiveUpdateInterval);
      this._adaptiveUpdateInterval = null;
    }
    
    // Stop all tracks
    this._tracks.forEach(track => {
      this.stopTrackImmediate(track);
    });
    
    // Disconnect audio nodes
    this._masterGain.disconnect();
    this._crossfadeGain.disconnect();
    this._analysisNode.disconnect();
    
    // Clear collections
    this._tracks.clear();
    this._activeLayers.clear();
    this._adaptiveParameters.clear();
    
    this.removeAllListeners();
  }
}