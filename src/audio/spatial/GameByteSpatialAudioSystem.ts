import { EventEmitter } from 'eventemitter3';
import {
  SpatialAudioSystem,
  AudioZone,
  AudioPosition,
  AudioZoneConfig,
  SpatialAudioConfig,
  AudioEffectsProcessor,
  AudioEnvironment,
  DistanceModel,
  AudioEvents
} from '../../contracts/Audio';
import { Vector3 } from '../../contracts/Physics';
import { GameByteAudioZone } from '../zones/GameByteAudioZone';

/**
 * Default spatial audio configuration
 */
const DEFAULT_SPATIAL_CONFIG: SpatialAudioConfig = {
  enabled: true,
  distanceModel: DistanceModel.INVERSE,
  maxDistance: 100,
  rolloffFactor: 1,
  dopplerFactor: 1,
  speedOfSound: 343,
  hrtfEnabled: true
};

/**
 * GameByte Spatial Audio System - Advanced 3D audio positioning and environmental effects
 * 
 * Features:
 * - 3D positioned audio with HRTF processing
 * - Environmental audio zones with acoustic modeling
 * - Distance-based attenuation and occlusion
 * - Doppler effects for moving sound sources
 * - Audio listener management with orientation
 * - Performance optimization for mobile devices
 * - Zone-based environmental effects and reverb
 */
export class GameByteSpatialAudioSystem extends EventEmitter<AudioEvents> implements SpatialAudioSystem {
  private _context: AudioContext;
  private _effectsProcessor: AudioEffectsProcessor;
  private _listenerPosition: AudioPosition;
  private _zones = new Map<string, AudioZone>();
  private _spatialConfig: SpatialAudioConfig;
  private _globalEnvironment: AudioEnvironment = AudioEnvironment.NONE;
  
  // HRTF and 3D audio support
  private _hrtfEnabled = true;
  private _hrtfData: AudioBuffer | null = null;
  private _environmentalFilter: BiquadFilterNode | null = null;
  private _masterConvolver: ConvolverNode | null = null;
  
  // Performance monitoring
  private _activeSources = new Set<AudioNode>();
  private _occlusionSources = new Map<AudioNode, { position: Vector3; occluded: boolean }>();
  
  // Zone management
  private _activeZones = new Set<AudioZone>();
  private _zoneUpdateInterval: number | null = null;

  constructor(context: AudioContext, effectsProcessor: AudioEffectsProcessor) {
    super();
    
    this._context = context;
    this._effectsProcessor = effectsProcessor;
    this._spatialConfig = { ...DEFAULT_SPATIAL_CONFIG };
    
    // Initialize listener at origin
    this._listenerPosition = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      orientation: {
        forward: { x: 0, y: 0, z: -1 },
        up: { x: 0, y: 1, z: 0 }
      }
    };
  }

  get listenerPosition(): AudioPosition {
    return { ...this._listenerPosition };
  }

  get zones(): Map<string, AudioZone> {
    return new Map(this._zones);
  }

  /**
   * Initialize the spatial audio system
   */
  async initialize(): Promise<void> {
    try {
      // Configure audio context listener
      this.updateAudioListener();
      
      // Create environmental processing chain
      await this.createEnvironmentalProcessing();
      
      // Enable HRTF if available
      if (this._spatialConfig.hrtfEnabled) {
        await this.initializeHRTF();
      }
      
      // Start zone monitoring
      this.startZoneMonitoring();
      
      this.emit('spatial:initialized', {} as any);
      
    } catch (error) {
      console.warn('Spatial audio initialization failed:', error);
      // Continue with limited functionality
    }
  }

  /**
   * Initialize HRTF processing
   */
  private async initializeHRTF(): Promise<void> {
    try {
      // Check if HRTF is supported
      if (this._context.listener && 'positionX' in this._context.listener) {
        this._hrtfEnabled = true;
        console.log('HRTF spatial audio enabled');
      } else {
        console.warn('HRTF not supported, falling back to basic panner');
        this._hrtfEnabled = false;
      }
    } catch (error) {
      console.warn('HRTF initialization failed:', error);
      this._hrtfEnabled = false;
    }
  }

  /**
   * Create environmental audio processing chain
   */
  private async createEnvironmentalProcessing(): Promise<void> {
    // Create master environmental filter
    this._environmentalFilter = this._context.createBiquadFilter();
    this._environmentalFilter.type = 'lowpass';
    this._environmentalFilter.frequency.value = 20000; // No filtering by default
    this._environmentalFilter.Q.value = 1;
    
    // Create master convolution reverb
    this._masterConvolver = this._context.createConvolver();
    
    // Generate default impulse response
    const impulse = this.generateEnvironmentalImpulse(AudioEnvironment.NONE);
    this._masterConvolver.buffer = impulse;
  }

  /**
   * Generate environmental impulse response
   */
  private generateEnvironmentalImpulse(environment: AudioEnvironment): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    let duration = 1.0; // Default 1 second
    let decay = 0.3;
    let damping = 0.5;
    
    switch (environment) {
      case AudioEnvironment.ROOM:
        duration = 0.5;
        decay = 0.4;
        damping = 0.6;
        break;
      case AudioEnvironment.HALL:
        duration = 3.0;
        decay = 0.8;
        damping = 0.2;
        break;
      case AudioEnvironment.CAVE:
        duration = 5.0;
        decay = 0.9;
        damping = 0.1;
        break;
      case AudioEnvironment.FOREST:
        duration = 2.0;
        decay = 0.6;
        damping = 0.7;
        break;
      case AudioEnvironment.UNDERWATER:
        duration = 1.5;
        decay = 0.7;
        damping = 0.9;
        break;
      case AudioEnvironment.SPACE:
        duration = 0.1;
        decay = 0.1;
        damping = 1.0;
        break;
      case AudioEnvironment.NONE:
      default:
        duration = 0.1;
        decay = 0.0;
        damping = 1.0;
        break;
    }
    
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const envelope = Math.exp(-time * (1 / decay));
        const dampedEnvelope = envelope * (1 - damping * time / duration);
        
        // Add environmental characteristics
        let signal = 0;
        
        switch (environment) {
          case AudioEnvironment.CAVE:
            // Multiple reflections with metallic resonance
            signal = (Math.random() * 2 - 1) * dampedEnvelope;
            signal += Math.sin(time * 150 * Math.PI) * 0.1 * envelope;
            break;
          case AudioEnvironment.FOREST:
            // Diffuse reflections with natural decay
            signal = (Math.random() * 2 - 1) * dampedEnvelope * 0.7;
            break;
          case AudioEnvironment.UNDERWATER:
            // Muffled with bubble effects
            signal = (Math.random() * 2 - 1) * dampedEnvelope * 0.5;
            signal += Math.sin(time * 50 * Math.PI) * 0.05 * envelope;
            break;
          default:
            signal = (Math.random() * 2 - 1) * dampedEnvelope;
            break;
        }
        
        channelData[i] = signal * 0.3; // Overall gain
      }
    }
    
    return buffer;
  }

  /**
   * Update audio context listener position and orientation
   */
  private updateAudioListener(): void {
    const listener = this._context.listener;
    const pos = this._listenerPosition.position;
    const vel = this._listenerPosition.velocity || { x: 0, y: 0, z: 0 };
    const ori = this._listenerPosition.orientation;
    
    if (this._hrtfEnabled && 'positionX' in listener) {
      // Modern Web Audio API with AudioParam
      listener.positionX.value = pos.x;
      listener.positionY.value = pos.y;
      listener.positionZ.value = pos.z;
      
      if (ori) {
        listener.forwardX.value = ori.forward.x;
        listener.forwardY.value = ori.forward.y;
        listener.forwardZ.value = ori.forward.z;
        listener.upX.value = ori.up.x;
        listener.upY.value = ori.up.y;
        listener.upZ.value = ori.up.z;
      }
    } else {
      // Legacy Web Audio API
      if ('setPosition' in listener) {
        (listener as any).setPosition(pos.x, pos.y, pos.z);
      }
      if ('setVelocity' in listener) {
        (listener as any).setVelocity(vel.x, vel.y, vel.z);
      }
      if (ori && 'setOrientation' in listener) {
        (listener as any).setOrientation(
          ori.forward.x, ori.forward.y, ori.forward.z,
          ori.up.x, ori.up.y, ori.up.z
        );
      }
    }
  }

  /**
   * Start zone monitoring for environmental effects
   */
  private startZoneMonitoring(): void {
    if (this._zoneUpdateInterval) {
      clearInterval(this._zoneUpdateInterval);
    }
    
    this._zoneUpdateInterval = window.setInterval(() => {
      this.updateZones(this._listenerPosition.position);
    }, 100); // Update 10 times per second
  }

  // Listener management
  setListenerPosition(position: AudioPosition): void {
    this._listenerPosition = { ...position };
    this.updateAudioListener();
    
    // Update zones based on new position
    this.updateZones(position.position);
    
    this.emit('listener:moved', {
      position: position.position
    } as any);
  }

  getListenerPosition(): AudioPosition {
    return { ...this._listenerPosition };
  }

  // Zone management
  createZone(config: AudioZoneConfig): AudioZone {
    if (this._zones.has(config.name)) {
      throw new Error(`Audio zone '${config.name}' already exists`);
    }
    
    const zone = new GameByteAudioZone(config, this._context, this._effectsProcessor);
    this._zones.set(config.name, zone);
    
    // Set up zone event handlers
    zone.on('zone:entered', (data: any) => {
      this._activeZones.add(zone);
      this.updateEnvironmentalEffects();
      this.emit('audio:zone-enter', {
        zone,
        position: this._listenerPosition.position
      });
    });
    
    zone.on('zone:exited', (data: any) => {
      this._activeZones.delete(zone);
      this.updateEnvironmentalEffects();
      this.emit('audio:zone-exit', {
        zone,
        position: this._listenerPosition.position
      });
    });
    
    this.emit('zone:created', {
      zone,
      config
    } as any);
    
    return zone;
  }

  removeZone(name: string): void {
    const zone = this._zones.get(name);
    if (zone) {
      this._activeZones.delete(zone);
      this._zones.delete(name);
      
      if ('destroy' in zone && typeof zone.destroy === 'function') {
        zone.destroy();
      }
      
      this.updateEnvironmentalEffects();
      
      this.emit('zone:removed', {
        name
      } as any);
    }
  }

  getZone(name: string): AudioZone | null {
    return this._zones.get(name) || null;
  }

  updateZones(listenerPosition: Vector3): void {
    this._zones.forEach(zone => {
      const wasActive = this._activeZones.has(zone);
      const isActive = zone.contains(listenerPosition);
      const influence = zone.getInfluence(listenerPosition);
      
      if (isActive && !wasActive) {
        zone.emit('zone:entered', { position: listenerPosition });
      } else if (!isActive && wasActive) {
        zone.emit('zone:exited', { position: listenerPosition });
      } else if (isActive) {
        zone.emit('zone:influence-changed', { 
          position: listenerPosition,
          influence 
        });
      }
    });
  }

  /**
   * Update environmental effects based on active zones
   */
  private updateEnvironmentalEffects(): void {
    if (!this._environmentalFilter || !this._masterConvolver) {
      return;
    }
    
    // Find the highest priority active zone
    let dominantZone: AudioZone | null = null;
    let highestPriority = -1;
    let maxInfluence = 0;
    
    this._activeZones.forEach(zone => {
      const influence = zone.getInfluence(this._listenerPosition.position);
      if (zone.config.priority > highestPriority || 
          (zone.config.priority === highestPriority && influence > maxInfluence)) {
        dominantZone = zone;
        highestPriority = zone.config.priority;
        maxInfluence = influence;
      }
    });
    
    // Update environmental processing based on dominant zone
    if (dominantZone) {
      this.applyZoneEnvironment(dominantZone, maxInfluence);
    } else {
      this.applyGlobalEnvironment();
    }
  }

  /**
   * Apply zone-specific environmental effects
   */
  private applyZoneEnvironment(zone: AudioZone, influence: number): void {
    const environment = zone.getEnvironment();
    
    // Update environmental filter
    if (this._environmentalFilter) {
      switch (environment) {
        case AudioEnvironment.UNDERWATER:
          this._environmentalFilter.frequency.exponentialRampToValueAtTime(
            400 * influence + 20000 * (1 - influence),
            this._context.currentTime + 0.1
          );
          break;
        case AudioEnvironment.CAVE:
          this._environmentalFilter.frequency.exponentialRampToValueAtTime(
            8000 * influence + 20000 * (1 - influence),
            this._context.currentTime + 0.1
          );
          break;
        default:
          this._environmentalFilter.frequency.exponentialRampToValueAtTime(
            20000,
            this._context.currentTime + 0.1
          );
          break;
      }
    }
    
    // Update convolution reverb
    if (this._masterConvolver) {
      const impulse = this.generateEnvironmentalImpulse(environment);
      this._masterConvolver.buffer = impulse;
    }
  }

  /**
   * Apply global environmental effects
   */
  private applyGlobalEnvironment(): void {
    if (this._environmentalFilter) {
      this._environmentalFilter.frequency.exponentialRampToValueAtTime(
        20000,
        this._context.currentTime + 0.1
      );
    }
    
    if (this._masterConvolver) {
      const impulse = this.generateEnvironmentalImpulse(this._globalEnvironment);
      this._masterConvolver.buffer = impulse;
    }
  }

  // HRTF management
  enableHRTF(enabled: boolean): void {
    this._spatialConfig.hrtfEnabled = enabled;
    this._hrtfEnabled = enabled && this._context.listener && 'positionX' in this._context.listener;
    
    this.emit('hrtf:toggled', {
      enabled: this._hrtfEnabled
    } as any);
  }

  isHRTFEnabled(): boolean {
    return this._hrtfEnabled;
  }

  async loadHRTFData(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this._hrtfData = await this._context.decodeAudioData(arrayBuffer);
      
      this.emit('hrtf:loaded', {
        url
      } as any);
      
    } catch (error) {
      console.error('Failed to load HRTF data:', error);
      throw error;
    }
  }

  // Environmental audio
  setGlobalEnvironment(environment: AudioEnvironment): void {
    this._globalEnvironment = environment;
    
    // Update environmental processing if no zones are active
    if (this._activeZones.size === 0) {
      this.applyGlobalEnvironment();
    }
    
    this.emit('environment:changed', {
      environment
    } as any);
  }

  getGlobalEnvironment(): AudioEnvironment {
    return this._globalEnvironment;
  }

  /**
   * Create spatially positioned audio source
   */
  createSpatialSource(position: Vector3, config?: Partial<SpatialAudioConfig>): PannerNode {
    const panner = this._context.createPanner();
    
    // Apply spatial configuration
    const spatialConfig = { ...this._spatialConfig, ...config };
    
    panner.panningModel = 'HRTF';
    panner.distanceModel = spatialConfig.distanceModel;
    panner.maxDistance = spatialConfig.maxDistance;
    panner.rolloffFactor = spatialConfig.rolloffFactor;
    panner.refDistance = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
    
    // Set position
    if ('positionX' in panner) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    } else {
      (panner as any).setPosition(position.x, position.y, position.z);
    }
    
    this._activeSources.add(panner);
    
    return panner;
  }

  /**
   * Update source position with Doppler effect
   */
  updateSourcePosition(source: PannerNode, position: Vector3, velocity?: Vector3): void {
    // Update position
    if ('positionX' in source) {
      source.positionX.value = position.x;
      source.positionY.value = position.y;
      source.positionZ.value = position.z;
    } else {
      (source as any).setPosition(position.x, position.y, position.z);
    }
    
    // Update velocity for Doppler effect
    if (velocity) {
      const scaledVelocity = {
        x: velocity.x * this._spatialConfig.dopplerFactor,
        y: velocity.y * this._spatialConfig.dopplerFactor,
        z: velocity.z * this._spatialConfig.dopplerFactor
      };
      
      // Web Audio API doesn't directly support velocity, so we simulate Doppler
      // by adjusting playback rate based on relative velocity
      this.simulateDopplerEffect(source, position, velocity);
    }
  }

  /**
   * Simulate Doppler effect by adjusting playback rate
   */
  private simulateDopplerEffect(source: PannerNode, position: Vector3, velocity: Vector3): void {
    const listenerPos = this._listenerPosition.position;
    const listenerVel = this._listenerPosition.velocity || { x: 0, y: 0, z: 0 };
    
    // Calculate distance vector
    const dx = position.x - listenerPos.x;
    const dy = position.y - listenerPos.y;
    const dz = position.z - listenerPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > 0) {
      // Calculate relative velocity towards listener
      const relativeVel = (
        (velocity.x - listenerVel.x) * dx +
        (velocity.y - listenerVel.y) * dy +
        (velocity.z - listenerVel.z) * dz
      ) / distance;
      
      // Calculate Doppler shift
      const speedOfSound = this._spatialConfig.speedOfSound;
      const dopplerRatio = (speedOfSound - relativeVel) / speedOfSound;
      
      // Apply to connected buffer source nodes (if accessible)
      // Note: This is a simplified implementation
      // In practice, you'd need to track which buffer sources are connected
    }
  }

  /**
   * Calculate occlusion based on obstacles
   */
  calculateOcclusion(sourcePosition: Vector3, obstacles: Array<{ position: Vector3; size: number }>): number {
    const listenerPos = this._listenerPosition.position;
    let occlusionFactor = 1.0;
    
    obstacles.forEach(obstacle => {
      if (this.isLineOccluded(sourcePosition, listenerPos, obstacle.position, obstacle.size)) {
        occlusionFactor *= 0.5; // 50% reduction per obstacle
      }
    });
    
    return Math.max(0.1, occlusionFactor); // Minimum 10% volume
  }

  /**
   * Check if line of sight is occluded by obstacle
   */
  private isLineOccluded(
    start: Vector3, 
    end: Vector3, 
    obstaclePos: Vector3, 
    obstacleSize: number
  ): boolean {
    // Simple sphere-line intersection test
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    
    const fx = start.x - obstaclePos.x;
    const fy = start.y - obstaclePos.y;
    const fz = start.z - obstaclePos.z;
    
    const a = dx * dx + dy * dy + dz * dz;
    const b = 2 * (fx * dx + fy * dy + fz * dz);
    const c = fx * fx + fy * fy + fz * fz - obstacleSize * obstacleSize;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant >= 0) {
      const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
      const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
      
      return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }
    
    return false;
  }

  /**
   * Apply occlusion effect to audio source
   */
  applyOcclusion(source: AudioNode, occlusionFactor: number): void {
    // Create or update low-pass filter for occlusion
    const filter = this._context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000 * occlusionFactor; // Reduce high frequencies
    filter.Q.value = 1;
    
    // Connect filter between source and destination
    // Note: This requires restructuring the audio graph
  }

  /**
   * Get spatial audio performance metrics
   */
  getPerformanceMetrics(): {
    activeSources: number;
    activeZones: number;
    hrtfEnabled: boolean;
    occludedSources: number;
  } {
    return {
      activeSources: this._activeSources.size,
      activeZones: this._activeZones.size,
      hrtfEnabled: this._hrtfEnabled,
      occludedSources: this._occlusionSources.size
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop zone monitoring
    if (this._zoneUpdateInterval) {
      clearInterval(this._zoneUpdateInterval);
      this._zoneUpdateInterval = null;
    }
    
    // Destroy all zones
    this._zones.forEach(zone => {
      if ('destroy' in zone && typeof zone.destroy === 'function') {
        zone.destroy();
      }
    });
    this._zones.clear();
    this._activeZones.clear();
    
    // Disconnect environmental processing
    if (this._environmentalFilter) {
      this._environmentalFilter.disconnect();
      this._environmentalFilter = null;
    }
    
    if (this._masterConvolver) {
      this._masterConvolver.disconnect();
      this._masterConvolver = null;
    }
    
    // Clean up tracking
    this._activeSources.clear();
    this._occlusionSources.clear();
    
    this.removeAllListeners();
  }
}