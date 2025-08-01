import { Facade } from './Facade';
import {
  AudioManager,
  MusicSystem,
  SFXSystem,
  SpatialAudioSystem,
  MobileAudioManager,
  AudioAnalyticsSystem,
  AudioEffectsProcessor,
  ProceduralAudioGenerator,
  AudioSource,
  AudioBus,
  AudioBusConfig,
  MobileAudioConfig,
  AudioPerformanceMetrics,
  AudioZoneConfig,
  AudioZone
} from '../contracts/Audio';
import { Vector3 } from '../contracts/Physics';

/**
 * Static Audio Facade for GameByte Framework
 * 
 * Provides convenient static access to the audio system without needing
 * to resolve services from the container manually.
 * 
 * Usage:
 * ```typescript
 * import { Audio } from 'gamebyte-framework';
 * 
 * // Play background music
 * await Audio.music.playTrack('main-theme');
 * 
 * // Play sound effect
 * await Audio.sfx.play('jump-sound', { volume: 0.8 });
 * 
 * // Set master volume
 * Audio.setMasterVolume(0.7);
 * 
 * // Create spatial audio source
 * const spatialSound = await Audio.spatial.createSource('footsteps', { x: 10, y: 0, z: 5 });
 * ```
 */
export class Audio extends Facade {
  /**
   * Get the audio manager service name
   */
  protected static getFacadeAccessor(): string {
    return 'audio.manager';
  }

  /**
   * Get the audio manager instance
   */
  private static getManager(): AudioManager {
    return this.resolve<AudioManager>();
  }

  // === CORE AUDIO MANAGEMENT ===

  /**
   * Initialize the audio system with optional configuration
   */
  static async initialize(config?: Partial<MobileAudioConfig>): Promise<void> {
    return this.getManager().initialize(config);
  }

  /**
   * Check if audio system is initialized
   */
  static isInitialized(): boolean {
    return this.getManager().isInitialized;
  }

  /**
   * Get current performance tier
   */
  static getPerformanceTier() {
    return this.getManager().performanceTier;
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(): AudioPerformanceMetrics {
    return this.getManager().getPerformanceMetrics();
  }

  // === MASTER CONTROLS ===

  /**
   * Set master volume (0.0 to 1.0)
   */
  static setMasterVolume(volume: number, fadeTime = 0): void {
    this.getManager().setMasterVolume(volume, fadeTime);
  }

  /**
   * Get master volume
   */
  static getMasterVolume(): number {
    return this.getManager().getMasterVolume();
  }

  /**
   * Mute or unmute all audio
   */
  static setMasterMuted(muted: boolean): void {
    this.getManager().setMasterMuted(muted);
  }

  /**
   * Check if master audio is muted
   */
  static isMasterMuted(): boolean {
    return this.getManager().isMasterMuted();
  }

  // === ASSET MANAGEMENT ===

  /**
   * Load an audio asset
   */
  static async loadAudio(name: string, url: string, options?: any): Promise<AudioSource> {
    return this.getManager().loadAudio(name, url, options);
  }

  /**
   * Preload multiple audio assets
   */
  static async preloadAudio(urls: Array<{ name: string; url: string; options?: any }>): Promise<void> {
    return this.getManager().preloadAudio(urls);
  }

  /**
   * Unload an audio asset
   */
  static unloadAudio(name: string): void {
    this.getManager().unloadAudio(name);
  }

  /**
   * Get a loaded audio asset
   */
  static getLoadedAudio(name: string): AudioSource | null {
    return this.getManager().getLoadedAudio(name);
  }

  // === BUS MANAGEMENT ===

  /**
   * Create an audio bus
   */
  static createBus(config: AudioBusConfig): AudioBus {
    return this.getManager().createBus(config);
  }

  /**
   * Get an audio bus by name
   */
  static getBus(name: string): AudioBus | null {
    return this.getManager().getBus(name);
  }

  /**
   * Remove an audio bus
   */
  static removeBus(name: string): void {
    this.getManager().removeBus(name);
  }

  /**
   * Get the master bus
   */
  static getMasterBus(): AudioBus {
    return this.getManager().getMasterBus();
  }

  // === MUSIC SYSTEM ACCESS ===

  /**
   * Access to the music system
   */
  static get music(): MusicSystemFacade {
    return new MusicSystemFacade(this.getManager().getMusicSystem());
  }

  // === SFX SYSTEM ACCESS ===

  /**
   * Access to the SFX system
   */
  static get sfx(): SFXSystemFacade {
    return new SFXSystemFacade(this.getManager().getSFXSystem());
  }

  // === SPATIAL AUDIO ACCESS ===

  /**
   * Access to the spatial audio system
   */
  static get spatial(): SpatialAudioFacade {
    return new SpatialAudioFacade(this.getManager().getSpatialAudioSystem());
  }

  // === EFFECTS PROCESSOR ACCESS ===

  /**
   * Access to the effects processor
   */
  static get effects(): AudioEffectsProcessor {
    return this.getManager().getEffectsProcessor();
  }

  // === MOBILE MANAGER ACCESS ===

  /**
   * Access to the mobile audio manager
   */
  static get mobile(): MobileAudioManager {
    return this.getManager().getMobileManager();
  }

  // === ANALYTICS ACCESS ===

  /**
   * Access to the analytics system
   */
  static get analytics(): AudioAnalyticsSystem {
    return this.getManager().getAnalyticsSystem();
  }

  // === PROCEDURAL AUDIO ACCESS ===

  /**
   * Access to the procedural audio generator
   */
  static get procedural(): ProceduralAudioGenerator {
    return this.getManager().getProceduralGenerator();
  }

  // === UTILITY METHODS ===

  /**
   * Optimize audio system for current device
   */
  static optimizeForDevice(): void {
    this.getManager().optimizeForDevice();
  }

  /**
   * Adapt audio system to current performance
   */
  static adaptToPerformance(): void {
    this.getManager().adaptToPerformance();
  }

  /**
   * Destroy the audio system
   */
  static destroy(): void {
    this.getManager().destroy();
  }
}

/**
 * Music System Facade
 */
class MusicSystemFacade {
  constructor(private musicSystem: MusicSystem) {}

  /**
   * Load a music track
   */
  async loadTrack(name: string, url: string, config?: any): Promise<void> {
    return this.musicSystem.loadTrack(name, url, config);
  }

  /**
   * Play a music track
   */
  async playTrack(name: string, fadeTime?: number): Promise<void> {
    return this.musicSystem.playTrack(name, fadeTime);
  }

  /**
   * Stop current track
   */
  async stopTrack(fadeTime?: number): Promise<void> {
    return this.musicSystem.stopTrack(fadeTime);
  }

  /**
   * Pause current track
   */
  pauseTrack(): void {
    this.musicSystem.pauseTrack();
  }

  /**
   * Resume current track
   */
  resumeTrack(): void {
    this.musicSystem.resumeTrack();
  }

  /**
   * Crossfade to another track
   */
  async crossfadeTo(track: string, duration?: number): Promise<void> {
    return this.musicSystem.crossfadeTo(track, duration);
  }

  /**
   * Enable a music layer
   */
  enableLayer(layer: string, fadeTime?: number): void {
    this.musicSystem.enableLayer(layer, fadeTime);
  }

  /**
   * Disable a music layer
   */
  disableLayer(layer: string, fadeTime?: number): void {
    this.musicSystem.disableLayer(layer, fadeTime);
  }

  /**
   * Set adaptive music parameter
   */
  setParameter(name: string, value: number): void {
    this.musicSystem.setParameter(name, value);
  }

  /**
   * Get current track name
   */
  get currentTrack(): string | null {
    return this.musicSystem.currentTrack;
  }

  /**
   * Check if music is playing
   */
  get isPlaying(): boolean {
    return this.musicSystem.isPlaying;
  }
}

/**
 * SFX System Facade
 */
class SFXSystemFacade {
  constructor(private sfxSystem: SFXSystem) {}

  /**
   * Play a sound effect
   */
  async play(name: string, options?: {
    volume?: number;
    pitch?: number;
    position?: Vector3;
    loop?: boolean;
    bus?: string;
  }): Promise<AudioSource> {
    return this.sfxSystem.play(name, options);
  }

  /**
   * Preload sound effects
   */
  async preload(sounds: string[]): Promise<void> {
    return this.sfxSystem.preload(sounds);
  }

  /**
   * Set pool size for a sound
   */
  setPoolSize(sound: string, size: number): void {
    this.sfxSystem.setPoolSize(sound, size);
  }

  /**
   * Warm up the SFX system
   */
  warmUp(): void {
    this.sfxSystem.warmUp();
  }

  /**
   * Add sound variations
   */
  addVariation(baseName: string, variations: string[]): void {
    this.sfxSystem.addVariation(baseName, variations);
  }

  /**
   * Play sound variation
   */
  async playVariation(baseName: string, options?: any): Promise<AudioSource> {
    return this.sfxSystem.playVariation(baseName, options);
  }

  /**
   * Set sound priority
   */
  setPriority(sound: string, priority: number): void {
    this.sfxSystem.setPriority(sound, priority);
  }

  /**
   * Set maximum concurrent instances
   */
  setMaxConcurrent(sound: string, max: number): void {
    this.sfxSystem.setMaxConcurrent(sound, max);
  }
}

/**
 * Spatial Audio System Facade
 */
class SpatialAudioFacade {
  constructor(private spatialSystem: SpatialAudioSystem) {}

  /**
   * Set listener position
   */
  setListenerPosition(position: { position: Vector3; velocity?: Vector3; orientation?: any }): void {
    this.spatialSystem.setListenerPosition(position);
  }

  /**
   * Get listener position
   */
  getListenerPosition() {
    return this.spatialSystem.getListenerPosition();
  }

  /**
   * Create an audio zone
   */
  createZone(config: AudioZoneConfig): AudioZone {
    return this.spatialSystem.createZone(config);
  }

  /**
   * Remove an audio zone
   */
  removeZone(name: string): void {
    this.spatialSystem.removeZone(name);
  }

  /**
   * Get an audio zone
   */
  getZone(name: string): AudioZone | null {
    return this.spatialSystem.getZone(name);
  }

  /**
   * Update audio zones based on listener position
   */
  updateZones(listenerPosition: Vector3): void {
    this.spatialSystem.updateZones(listenerPosition);
  }

  /**
   * Enable or disable HRTF
   */
  enableHRTF(enabled: boolean): void {
    this.spatialSystem.enableHRTF(enabled);
  }

  /**
   * Check if HRTF is enabled
   */
  isHRTFEnabled(): boolean {
    return this.spatialSystem.isHRTFEnabled();
  }

  /**
   * Set global audio environment
   */
  setGlobalEnvironment(environment: any): void {
    this.spatialSystem.setGlobalEnvironment(environment);
  }

  /**
   * Get current zones
   */
  get zones(): Map<string, AudioZone> {
    return this.spatialSystem.zones;
  }
}

// Export individual facades for direct access
export { MusicSystemFacade as Music };
export { SFXSystemFacade as SFX };
export { SpatialAudioFacade as Spatial };

// Export the main Audio facade as default
export default Audio;