import { EventEmitter } from 'eventemitter3';
import { Vector3 } from './Physics';
import { Point } from './UI';

/**
 * Audio system performance tiers for mobile optimization
 */
export enum AudioPerformanceTier {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  PREMIUM = 'premium'
}

/**
 * Audio quality levels for adaptive audio
 */
export enum AudioQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  LOSSLESS = 'lossless'
}

/**
 * Audio bus types for mixing system
 */
export enum AudioBusType {
  MASTER = 'master',
  MUSIC = 'music',
  SFX = 'sfx',
  VOICE = 'voice',
  UI = 'ui',
  AMBIENT = 'ambient',
  CUSTOM = 'custom'
}

/**
 * Spatial audio distance models
 */
export enum DistanceModel {
  LINEAR = 'linear',
  INVERSE = 'inverse',
  EXPONENTIAL = 'exponential'
}

/**
 * Audio environment types for reverb and acoustic modeling
 */
export enum AudioEnvironment {
  NONE = 'none',
  ROOM = 'room',
  HALL = 'hall',
  CAVE = 'cave',
  FOREST = 'forest',
  UNDERWATER = 'underwater',
  SPACE = 'space',
  CUSTOM = 'custom'
}

/**
 * Audio interruption types for mobile handling
 */
export enum AudioInterruption {
  PHONE_CALL = 'phone_call',
  NOTIFICATION = 'notification',
  SYSTEM_SOUND = 'system_sound',
  OTHER_APP = 'other_app',
  HARDWARE = 'hardware'
}

/**
 * Audio fade types
 */
export enum AudioFadeType {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  LOGARITHMIC = 'logarithmic',
  SMOOTH_STEP = 'smooth_step'
}

/**
 * 3D audio position information
 */
export interface AudioPosition {
  position: Vector3;
  velocity?: Vector3;
  orientation?: {
    forward: Vector3;
    up: Vector3;
  };
}

/**
 * Spatial audio configuration
 */
export interface SpatialAudioConfig {
  enabled: boolean;
  distanceModel: DistanceModel;
  maxDistance: number;
  rolloffFactor: number;
  dopplerFactor: number;
  speedOfSound: number;
  hrtfEnabled?: boolean;
}

/**
 * Audio effects configuration
 */
export interface AudioEffectsConfig {
  reverb?: {
    roomSize: number;
    damping: number;
    wetness: number;
    dryness: number;
    width: number;
    freezeMode: boolean;
  };
  delay?: {
    delayTime: number;
    feedback: number;
    wetness: number;
  };
  filter?: {
    type: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
    frequency: number;
    Q: number;
    gain?: number;
  };
  distortion?: {
    amount: number;
    oversample: '2x' | '4x' | 'none';
  };
  compressor?: {
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
  };
  limiter?: {
    threshold: number;
    lookAhead: number;
    release: number;
  };
}

/**
 * Audio bus configuration
 */
export interface AudioBusConfig {
  name: string;
  type: AudioBusType;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects?: AudioEffectsConfig;
  sends?: Array<{
    bus: string;
    amount: number;
  }>;
}

/**
 * Music system configuration
 */
export interface MusicConfig {
  layers?: Array<{
    name: string;
    volume: number;
    fadeTime: number;
    condition?: () => boolean;
  }>;
  crossfade?: {
    enabled: boolean;
    duration: number;
    curve: AudioFadeType;
  };
  adaptive?: {
    enabled: boolean;
    parameters: Array<{
      name: string;
      value: number;
      target?: string; // Layer or effect parameter
    }>;
  };
  loop?: {
    enabled: boolean;
    seamless: boolean;
    points?: Array<{
      name: string;
      time: number;
    }>;
  };
}

/**
 * Audio zone configuration for environmental audio
 */
export interface AudioZoneConfig {
  name: string;
  shape: 'sphere' | 'box' | 'cylinder';
  position: Vector3;
  size: Vector3 | number;
  environment: AudioEnvironment;
  effects?: AudioEffectsConfig;
  fadeDistance: number;
  priority: number;
}

/**
 * Mobile audio optimization settings
 */
export interface MobileAudioConfig {
  batteryOptimization: boolean;
  backgroundAudio: boolean;
  interruptionHandling: boolean;
  hardwareAcceleration: boolean;
  adaptiveQuality: boolean;
  maxConcurrentSounds: number;
  memoryLimit: number; // In MB
  cpuLimit: number; // Percentage
}

/**
 * Audio analytics data
 */
export interface AudioAnalytics {
  totalPlaytime: number;
  musicVolume: number;
  sfxVolume: number;
  environmentalAudio: boolean;
  preferredQuality: AudioQuality;
  interruptionEvents: number;
  batteryOptimizationEnabled: boolean;
  deviceInfo: {
    audioContextSampleRate: number;
    maxChannelCount: number;
    latency: number;
    performanceTier: AudioPerformanceTier;
  };
}

/**
 * Audio performance metrics
 */
export interface AudioPerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
  activeSources: number;
  droppedFrames: number;
  contextState: AudioContextState;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  batteryLevel?: number;
}

/**
 * Audio event types
 */
export interface AudioEvents {
  'audio:loaded': { source: AudioSource };
  'audio:play': { source: AudioSource };
  'audio:pause': { source: AudioSource };
  'audio:stop': { source: AudioSource };
  'audio:end': { source: AudioSource };
  'audio:error': { source: AudioSource; error: Error };
  'audio:volume-change': { source: AudioSource; volume: number };
  'music:track-change': { previous?: string; current: string };
  'music:layer-change': { layer: string; active: boolean };
  'audio:interruption': { type: AudioInterruption; action: 'begin' | 'end' };
  'audio:zone-enter': { zone: AudioZone; position: Vector3 };
  'audio:zone-exit': { zone: AudioZone; position: Vector3 };
  'audio:performance-warning': { metric: string; value: number; threshold: number };
  'audio:initialized': { success: boolean };
  'audio:mute-change': { bus: string; muted: boolean };
  'audio:solo-change': { bus: string; solo: boolean };
  'source:added': { source: AudioSource };
  'source:removed': { source: AudioSource };
  'effect:added': { effect: string; bus: string };
  'effect:removed': { effect: string; bus: string };
  'effect:updated': { effect: string; bus: string };
  'send:added': { send: string; bus: string };
  'send:removed': { send: string; bus: string };
  'send:updated': { send: string; bus: string };
  'analytics:playback-tracked': { data: any };
  'analytics:volume-tracked': { data: any };
  'analytics:interruption-tracked': { data: any };
  'analytics:preferences-updated': { data: any };
  'analytics:reset': { data: any };
  'audio:unlocked': { success: boolean };
  'audio:destroyed': { timestamp: number };
  'effects:initialized': { context: AudioContext };
  'effect:created': { name: string; type: string };
  'preset:loaded': { name: string };
  'mobile:initialized': { success: boolean };
  'battery:low': { level: number };
  'battery:critical': { level: number };
  'battery:normal': { level: number };
  'thermal:critical': { temperature: number };
  'thermal:serious': { temperature: number };
  'thermal:fair': { temperature: number };
  'thermal:nominal': { temperature: number };
  'app:state-change': { state: 'active' | 'background' | 'suspended' };
  'background-audio:toggled': { enabled: boolean };
  'music:initialized': { success: boolean };
  'music:track-loaded': { track: string };
  'music:layer-loaded': { layer: string };
  'music:parameter-changed': { param: string; value: number };
  'music:crossfade-complete': { from: string; to: string };
  'music:marker-jump': { marker: string };
  'procedural:initialized': { success: boolean };
  'realtime-effect:added': { effect: string };
  'realtime-effect:removed': { effect: string };
  'sfx:initialized': { success: boolean };
  'sfx:preloaded': { sounds: string[] };
  'spatial:initialized': { success: boolean };
  'listener:moved': { position: AudioPosition };
  'zone:entered': { zone: string };
  'zone:exited': { zone: string };
  'zone:created': { zone: string };
  'zone:removed': { zone: string };
  'zone:influence-changed': { zone: string; influence: number };
  'hrtf:toggled': { enabled: boolean };
  'hrtf:loaded': { success: boolean };
  'environment:changed': { environment: AudioEnvironment };
  'zone:moved': { zone: string };
  'zone:resized': { zone: string };
  'zone:environment-changed': { zone: string };
  'zone:effects-updated': { zone: string };
}

/**
 * Core audio source interface
 */
export interface AudioSource extends EventEmitter<AudioEvents> {
  readonly id: string;
  readonly buffer: AudioBuffer | null;
  readonly duration: number;
  readonly currentTime: number;
  readonly isPlaying: boolean;
  readonly isPaused: boolean;
  readonly isLooping: boolean;

  // Playback control
  play(when?: number): Promise<void>;
  pause(): void;
  stop(): void;
  seek(time: number): void;

  // Volume and effects
  setVolume(volume: number, fadeTime?: number): void;
  getVolume(): number;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  
  // Loop control
  setLoop(loop: boolean): void;

  // Spatial audio
  setPosition(position: Vector3): void;
  getPosition(): Vector3;
  setVelocity(velocity: Vector3): void;
  setSpatialConfig(config: Partial<SpatialAudioConfig>): void;

  // Effects
  addEffect(name: string, config: AudioEffectsConfig): void;
  removeEffect(name: string): void;
  updateEffect(name: string, config: Partial<AudioEffectsConfig>): void;

  // Cleanup
  destroy(): void;
}

/**
 * Audio bus for mixing and routing
 */
export interface AudioBus extends EventEmitter<AudioEvents> {
  readonly name: string;
  readonly type: AudioBusType;
  readonly sources: Set<AudioSource>;

  // Volume control
  setVolume(volume: number, fadeTime?: number): void;
  getVolume(): number;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  setSolo(solo: boolean): void;
  isSolo(): boolean;

  // Source management
  addSource(source: AudioSource): void;
  removeSource(source: AudioSource): void;
  removeAllSources(): void;

  // Effects processing
  addEffect(name: string, config: AudioEffectsConfig): void;
  removeEffect(name: string): void;
  updateEffect(name: string, config: Partial<AudioEffectsConfig>): void;

  // Send/return system
  addSend(targetBus: string, amount: number): void;
  removeSend(targetBus: string): void;
  updateSend(targetBus: string, amount: number): void;

  // Analysis
  getAnalyzer(): AnalyserNode | null;
  getRMSLevel(): number;
  getPeakLevel(): number;
}

/**
 * Music system for adaptive and interactive music
 */
export interface MusicSystem extends EventEmitter<AudioEvents> {
  readonly currentTrack: string | null;
  readonly isPlaying: boolean;
  readonly activeLayers: Set<string>;

  // Initialization
  initialize(context: AudioContext): Promise<void>;

  // Track management
  loadTrack(name: string, url: string, config?: MusicConfig): Promise<void>;
  playTrack(name: string, fadeTime?: number): Promise<void>;
  stopTrack(fadeTime?: number): Promise<void>;
  pauseTrack(): void;
  resumeTrack(): void;

  // Layer management
  enableLayer(layer: string, fadeTime?: number): void;
  disableLayer(layer: string, fadeTime?: number): void;
  setLayerVolume(layer: string, volume: number, fadeTime?: number): void;

  // Adaptive music
  setParameter(name: string, value: number): void;
  getParameter(name: string): number;
  updateAdaptiveMusic(): void;

  // Crossfading
  crossfadeTo(track: string, duration?: number): Promise<void>;
  
  // Loop management
  setLoopPoints(start: number, end: number): void;
  addLoopMarker(name: string, time: number): void;
  jumpToMarker(name: string): void;
}

/**
 * Sound effects system
 */
export interface SFXSystem extends EventEmitter<AudioEvents> {
  // Initialization
  initialize(context: AudioContext): Promise<void>;

  // Playback
  play(name: string, options?: {
    volume?: number;
    pitch?: number;
    position?: Vector3;
    loop?: boolean;
    bus?: string;
  }): Promise<AudioSource>;

  // Pool management
  preload(sounds: string[]): Promise<void>;
  setPoolSize(sound: string, size: number): void;
  warmUp(): void;
  stopLowPrioritySounds(): void;

  // Variation system
  addVariation(baseName: string, variations: string[]): void;
  playVariation(baseName: string, options?: any): Promise<AudioSource>;

  // Priority system
  setPriority(sound: string, priority: number): void;
  setMaxConcurrent(sound: string, max: number): void;
}

/**
 * Spatial audio system for 3D audio
 */
export interface SpatialAudioSystem extends EventEmitter<AudioEvents> {
  readonly listenerPosition: AudioPosition;
  readonly zones: Map<string, AudioZone>;

  // Initialization
  initialize(context: AudioContext): Promise<void>;

  // Listener management
  setListenerPosition(position: AudioPosition): void;
  getListenerPosition(): AudioPosition;

  // Zone management
  createZone(config: AudioZoneConfig): AudioZone;
  removeZone(name: string): void;
  getZone(name: string): AudioZone | null;
  updateZones(listenerPosition: Vector3): void;

  // HRTF management
  enableHRTF(enabled: boolean): void;
  isHRTFEnabled(): boolean;
  loadHRTFData(url: string): Promise<void>;

  // Environmental audio
  setGlobalEnvironment(environment: AudioEnvironment): void;
  getGlobalEnvironment(): AudioEnvironment;
}

/**
 * Audio zone for environmental audio
 */
export interface AudioZone extends EventEmitter<AudioEvents> {
  readonly name: string;
  readonly config: AudioZoneConfig;
  readonly isActive: boolean;
  readonly influence: number; // 0-1 based on listener position

  // Position and shape
  setPosition(position: Vector3): void;
  getPosition(): Vector3;
  setSize(size: Vector3 | number): void;
  contains(position: Vector3): boolean;
  getInfluence(position: Vector3): number;

  // Effects and environment
  setEnvironment(environment: AudioEnvironment): void;
  getEnvironment(): AudioEnvironment;
  updateEffects(config: AudioEffectsConfig): void;
}

/**
 * Audio effects processor
 */
export interface AudioEffectsProcessor extends EventEmitter<AudioEvents> {
  readonly context: AudioContext;
  readonly effects: Map<string, AudioNode>;

  // Initialization
  initialize(context: AudioContext): Promise<void>;

  // Effect management
  createEffect(name: string, type: string, config: AudioEffectsConfig): AudioNode;
  connectEffect(name: string, input: AudioNode, output: AudioNode): void;
  disconnectEffect(name: string): void;
  updateEffect(name: string, config: Partial<AudioEffectsConfig>): void;

  // Presets
  loadPreset(name: string, config: AudioEffectsConfig): void;
  applyPreset(name: string, target: AudioNode): void;
  savePreset(name: string, config: AudioEffectsConfig): void;

  // Analysis
  createAnalyzer(fftSize?: number): AnalyserNode;
  getFrequencyData(analyzer: AnalyserNode): Uint8Array;
  getTimeDomainData(analyzer: AnalyserNode): Uint8Array;
}

/**
 * Mobile audio manager for device-specific optimizations
 */
export interface MobileAudioManager extends EventEmitter<AudioEvents> {
  readonly config: MobileAudioConfig;
  readonly performanceMetrics: AudioPerformanceMetrics;

  // Initialization
  initialize(manager: AudioManager): Promise<void>;

  // Background audio
  handleAppStateChange(state: 'active' | 'background' | 'suspended'): void;
  enableBackgroundAudio(enabled: boolean): void;
  isBackgroundAudioEnabled(): boolean;

  // Interruption handling
  handleInterruption(type: AudioInterruption, action: 'begin' | 'end'): void;
  setInterruptionHandler(handler: (type: AudioInterruption, action: 'begin' | 'end') => void): void;

  // Performance optimization
  adaptToPerformance(metrics: AudioPerformanceMetrics): void;
  enableBatteryOptimization(enabled: boolean): void;
  isBatteryOptimizationEnabled(): boolean;
  setThermalThrottling(enabled: boolean): void;

  // Hardware optimization
  enableHardwareAcceleration(enabled: boolean): void;
  optimizeForDevice(): void;
  getDeviceCapabilities(): {
    maxChannels: number;
    sampleRate: number;
    latency: number;
    hardwareAcceleration: boolean;
  };
}

/**
 * Audio analytics system
 */
export interface AudioAnalyticsSystem extends EventEmitter<AudioEvents> {
  readonly analytics: AudioAnalytics;

  // Session management
  startSession(): void;
  endSession(): void;

  // Data collection
  trackPlayback(source: AudioSource, duration: number): void;
  trackVolumeChange(type: 'music' | 'sfx', volume: number): void;
  trackInterruption(type: AudioInterruption): void;
  trackPerformance(metrics: AudioPerformanceMetrics): void;

  // Preferences
  updateUserPreferences(preferences: Partial<AudioAnalytics>): void;
  getUserPreferences(): AudioAnalytics;
  exportAnalytics(): string;

  // Insights
  getPlaytimeInsights(): {
    totalTime: number;
    averageSession: number;
    preferredTimes: number[];
  };
  getPerformanceInsights(): {
    averageCPU: number;
    peakMemory: number;
    interruptionRate: number;
  };
}

/**
 * Main audio manager interface
 */
export interface AudioManager {
  readonly context: AudioContext;
  readonly isInitialized: boolean;
  readonly performanceTier: AudioPerformanceTier;
  readonly buses: Map<string, AudioBus>;

  // Event emitter methods
  on<K extends keyof AudioEvents>(event: K, callback: (data: AudioEvents[K]) => void): this;
  off<K extends keyof AudioEvents>(event: K, callback: (data: AudioEvents[K]) => void): this;
  emit<K extends keyof AudioEvents>(event: K, data: AudioEvents[K]): boolean;

  // Initialization
  initialize(config?: Partial<MobileAudioConfig>): Promise<void>;
  destroy(): void;

  // System access
  getMusicSystem(): MusicSystem;
  getSFXSystem(): SFXSystem;
  getSpatialAudioSystem(): SpatialAudioSystem;
  getMobileManager(): MobileAudioManager;
  getProceduralGenerator(): ProceduralAudioGenerator;
  getAnalyticsSystem(): AudioAnalyticsSystem;
  getEffectsProcessor(): AudioEffectsProcessor;

  // Bus management
  createBus(config: AudioBusConfig): AudioBus;
  getBus(name: string): AudioBus | null;
  removeBus(name: string): void;
  getMasterBus(): AudioBus;

  // Global controls
  setMasterVolume(volume: number, fadeTime?: number): void;
  getMasterVolume(): number;
  setMasterMuted(muted: boolean): void;
  isMasterMuted(): boolean;

  // Performance
  getPerformanceMetrics(): AudioPerformanceMetrics;
  optimizeForDevice(): void;
  adaptToPerformance(): void;

  // Asset management
  loadAudio(name: string, url: string, options?: any): Promise<AudioSource>;
  preloadAudio(urls: Array<{ name: string; url: string; options?: any }>): Promise<void>;
  unloadAudio(name: string): void;
  getLoadedAudio(name: string): AudioSource | null;

  // Events and callbacks
  on<K extends keyof AudioEvents>(event: K, callback: (data: AudioEvents[K]) => void): this;
  off<K extends keyof AudioEvents>(event: K, callback: (data: AudioEvents[K]) => void): this;
  emit<K extends keyof AudioEvents>(event: K, data: AudioEvents[K]): boolean;
}

/**
 * Procedural audio generator
 */
export interface ProceduralAudioGenerator extends EventEmitter<AudioEvents> {
  readonly context: AudioContext;

  // Initialization
  initialize(context: AudioContext): Promise<void>;

  // Synthesis
  generateTone(frequency: number, duration: number, waveform?: OscillatorType): AudioBuffer;
  generateNoise(duration: number, type?: 'white' | 'pink' | 'brown' | 'blue'): AudioBuffer;
  generateChirp(startFreq: number, endFreq: number, duration: number): AudioBuffer;

  // Effects generation
  generateReverb(roomSize: number, decay: number): AudioBuffer;
  generateDelay(delayTime: number, feedback: number, duration: number): AudioBuffer;

  // Granular synthesis
  createGranularProcessor(grainSize: number, overlap: number): AudioWorkletNode;
  processGranular(buffer: AudioBuffer, config: {
    grainSize: number;
    overlap: number;
    pitch: number;
    timeStretch: number;
  }): AudioBuffer;

  // Real-time processing
  createRealTimeProcessor(processor: (input: Float32Array) => Float32Array): AudioWorkletNode;
  addRealTimeEffect(name: string, processor: AudioWorkletNode): void;
  removeRealTimeEffect(name: string): void;
}