import { EventEmitter } from 'eventemitter3';
import {
  AudioZone,
  AudioZoneConfig,
  AudioEnvironment,
  AudioEffectsConfig,
  AudioEffectsProcessor,
  AudioEvents
} from '../../contracts/Audio';
import { Vector3 } from '../../contracts/Physics';
import { Logger } from '../../utils/Logger.js';

/**
 * GameByte Audio Zone - Environmental audio zone with spatial effects
 * 
 * Features:
 * - Geometric shape-based containment (sphere, box, cylinder)
 * - Environmental audio effects and reverb
 * - Distance-based influence calculation
 * - Seamless zone transitions with fading
 * - Priority-based zone mixing
 */
export class GameByteAudioZone extends EventEmitter<AudioEvents> implements AudioZone {
  private _name: string;
  private _config: AudioZoneConfig;
  private _context: AudioContext;
  private _effectsProcessor: AudioEffectsProcessor;
  private _isActive = false;
  private _influence = 0;
  
  // Audio processing nodes
  private _inputGain!: GainNode;
  private _outputGain!: GainNode;
  private _effectNodes = new Map<string, AudioNode>();
  
  // Zone geometry cache
  private _boundingSphere: { center: Vector3; radius: number };

  constructor(
    config: AudioZoneConfig,
    context: AudioContext,
    effectsProcessor: AudioEffectsProcessor
  ) {
    super();
    
    this._name = config.name;
    this._config = { ...config };
    this._context = context;
    this._effectsProcessor = effectsProcessor;
    
    // Create audio processing nodes
    this.createAudioNodes();
    
    // Calculate bounding sphere for optimization
    this._boundingSphere = this.calculateBoundingSphere();
    
    // Apply initial effects
    if (config.effects) {
      this.updateEffects(config.effects);
    }
  }

  get name(): string {
    return this._name;
  }

  get config(): AudioZoneConfig {
    return { ...this._config };
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get influence(): number {
    return this._influence;
  }

  /**
   * Create audio processing nodes for the zone
   */
  private createAudioNodes(): void {
    this._inputGain = this._context.createGain();
    this._inputGain.gain.value = 1.0;
    
    this._outputGain = this._context.createGain();
    this._outputGain.gain.value = 1.0;
    
    // Connect basic chain
    this._inputGain.connect(this._outputGain);
  }

  /**
   * Calculate bounding sphere for efficient containment testing
   */
  private calculateBoundingSphere(): { center: Vector3; radius: number } {
    const center = { ...this._config.position };
    let radius: number;
    
    switch (this._config.shape) {
      case 'sphere':
        radius = typeof this._config.size === 'number' ? 
          this._config.size : 
          Math.max(this._config.size.x, this._config.size.y, this._config.size.z);
        break;
      case 'box':
        if (typeof this._config.size === 'number') {
          radius = this._config.size * Math.sqrt(3); // Diagonal of cube
        } else {
          const { x, y, z } = this._config.size;
          radius = Math.sqrt(x * x + y * y + z * z) / 2; // Half diagonal
        }
        break;
      case 'cylinder':
        if (typeof this._config.size === 'number') {
          radius = this._config.size;
        } else {
          radius = Math.max(this._config.size.x, this._config.size.z);
        }
        break;
      default:
        radius = 10; // Default radius
        break;
    }
    
    // Add fade distance to bounding sphere
    radius += this._config.fadeDistance;
    
    return { center, radius };
  }

  /**
   * Check if a position is contained within the zone
   */
  contains(position: Vector3): boolean {
    // Quick bounding sphere test first
    const distToBounds = this.distanceToPoint(position, this._boundingSphere.center);
    if (distToBounds > this._boundingSphere.radius) {
      return false;
    }
    
    // Detailed shape-based containment test
    return this.containsDetailed(position);
  }

  /**
   * Detailed containment test based on zone shape
   */
  private containsDetailed(position: Vector3): boolean {
    const zonePos = this._config.position;
    const relativePos = {
      x: position.x - zonePos.x,
      y: position.y - zonePos.y,
      z: position.z - zonePos.z
    };
    
    switch (this._config.shape) {
      case 'sphere':
        const sphereRadius = typeof this._config.size === 'number' ? 
          this._config.size : 
          Math.max(this._config.size.x, this._config.size.y, this._config.size.z);
        const distanceFromCenter = Math.sqrt(
          relativePos.x * relativePos.x +
          relativePos.y * relativePos.y +
          relativePos.z * relativePos.z
        );
        return distanceFromCenter <= sphereRadius;
        
      case 'box':
        if (typeof this._config.size === 'number') {
          const halfSize = this._config.size / 2;
          return Math.abs(relativePos.x) <= halfSize &&
                 Math.abs(relativePos.y) <= halfSize &&
                 Math.abs(relativePos.z) <= halfSize;
        } else {
          const halfX = this._config.size.x / 2;
          const halfY = this._config.size.y / 2;
          const halfZ = this._config.size.z / 2;
          return Math.abs(relativePos.x) <= halfX &&
                 Math.abs(relativePos.y) <= halfY &&
                 Math.abs(relativePos.z) <= halfZ;
        }
        
      case 'cylinder':
        const cylinderRadius = typeof this._config.size === 'number' ? 
          this._config.size : 
          Math.max(this._config.size.x, this._config.size.z);
        const cylinderHeight = typeof this._config.size === 'number' ? 
          this._config.size * 2 : 
          this._config.size.y;
        
        const radialDistance = Math.sqrt(
          relativePos.x * relativePos.x + relativePos.z * relativePos.z
        );
        return radialDistance <= cylinderRadius && 
               Math.abs(relativePos.y) <= cylinderHeight / 2;
        
      default:
        return false;
    }
  }

  /**
   * Calculate influence factor based on distance and fade settings
   */
  getInfluence(position: Vector3): number {
    const distanceToEdge = this.distanceToEdge(position);
    
    if (distanceToEdge < 0) {
      // Inside the zone
      this._influence = 1.0;
      this._isActive = true;
    } else if (distanceToEdge < this._config.fadeDistance) {
      // In fade region
      const fadeProgress = distanceToEdge / this._config.fadeDistance;
      this._influence = 1.0 - fadeProgress;
      this._isActive = this._influence > 0.01; // Consider active if influence > 1%
    } else {
      // Outside fade region
      this._influence = 0.0;
      this._isActive = false;
    }
    
    return this._influence;
  }

  /**
   * Calculate distance from position to zone edge
   */
  private distanceToEdge(position: Vector3): number {
    const zonePos = this._config.position;
    const relativePos = {
      x: position.x - zonePos.x,
      y: position.y - zonePos.y,
      z: position.z - zonePos.z
    };
    
    switch (this._config.shape) {
      case 'sphere':
        const sphereRadius = typeof this._config.size === 'number' ? 
          this._config.size : 
          Math.max(this._config.size.x, this._config.size.y, this._config.size.z);
        const centerDistance = Math.sqrt(
          relativePos.x * relativePos.x +
          relativePos.y * relativePos.y +
          relativePos.z * relativePos.z
        );
        return centerDistance - sphereRadius;
        
      case 'box':
        let halfSizes: Vector3;
        if (typeof this._config.size === 'number') {
          const halfSize = this._config.size / 2;
          halfSizes = { x: halfSize, y: halfSize, z: halfSize };
        } else {
          halfSizes = {
            x: this._config.size.x / 2,
            y: this._config.size.y / 2,
            z: this._config.size.z / 2
          };
        }
        
        const dx = Math.max(0, Math.abs(relativePos.x) - halfSizes.x);
        const dy = Math.max(0, Math.abs(relativePos.y) - halfSizes.y);
        const dz = Math.max(0, Math.abs(relativePos.z) - halfSizes.z);
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
        
      case 'cylinder':
        const cylinderRadius = typeof this._config.size === 'number' ? 
          this._config.size : 
          Math.max(this._config.size.x, this._config.size.z);
        const cylinderHeight = typeof this._config.size === 'number' ? 
          this._config.size * 2 : 
          this._config.size.y;
        
        const radialDist = Math.sqrt(
          relativePos.x * relativePos.x + relativePos.z * relativePos.z
        );
        const radialExcess = Math.max(0, radialDist - cylinderRadius);
        const verticalExcess = Math.max(0, Math.abs(relativePos.y) - cylinderHeight / 2);
        
        return Math.sqrt(radialExcess * radialExcess + verticalExcess * verticalExcess);
        
      default:
        return Infinity;
    }
  }

  /**
   * Calculate distance between two points
   */
  private distanceToPoint(pos1: Vector3, pos2: Vector3): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Position and shape management
  setPosition(position: Vector3): void {
    this._config.position = { ...position };
    this._boundingSphere = this.calculateBoundingSphere();
    
    this.emit('zone:moved', {
      zone: this,
      position
    } as any);
  }

  getPosition(): Vector3 {
    return { ...this._config.position };
  }

  setSize(size: Vector3 | number): void {
    this._config.size = typeof size === 'number' ? size : { ...size };
    this._boundingSphere = this.calculateBoundingSphere();
    
    this.emit('zone:resized', {
      zone: this,
      size
    } as any);
  }

  // Environment management
  setEnvironment(environment: AudioEnvironment): void {
    this._config.environment = environment;
    
    // Update environmental effects
    this.updateEnvironmentalEffects();
    
    this.emit('zone:environment-changed', {
      zone: this,
      environment
    } as any);
  }

  getEnvironment(): AudioEnvironment {
    return this._config.environment;
  }

  /**
   * Update environmental effects based on environment type
   */
  private updateEnvironmentalEffects(): void {
    const environment = this._config.environment;
    
    // Remove existing environmental effects
    this.removeEffect('environmental-filter');
    this.removeEffect('environmental-reverb');
    
    // Apply environment-specific effects
    switch (environment) {
      case AudioEnvironment.UNDERWATER:
        this.addEffect('environmental-filter', {
          filter: {
            type: 'lowpass',
            frequency: 400,
            Q: 2
          }
        });
        break;
        
      case AudioEnvironment.CAVE:
        this.addEffect('environmental-reverb', {
          reverb: {
            roomSize: 0.9,
            damping: 0.1,
            wetness: 0.7,
            dryness: 0.3,
            width: 1.0,
            freezeMode: false
          }
        });
        break;
        
      case AudioEnvironment.FOREST:
        this.addEffect('environmental-filter', {
          filter: {
            type: 'highpass',
            frequency: 80,
            Q: 0.7
          }
        });
        break;
        
      case AudioEnvironment.HALL:
        this.addEffect('environmental-reverb', {
          reverb: {
            roomSize: 0.8,
            damping: 0.2,
            wetness: 0.5,
            dryness: 0.5,
            width: 1.0,
            freezeMode: false
          }
        });
        break;
    }
  }

  updateEffects(config: AudioEffectsConfig): void {
    this._config.effects = { ...config };
    
    // Clear existing effects
    this._effectNodes.forEach(node => node.disconnect());
    this._effectNodes.clear();
    
    // Recreate effects chain
    this.createEffectsChain(config);
    
    this.emit('zone:effects-updated', {
      zone: this,
      effects: config
    } as any);
  }

  /**
   * Create effects processing chain
   */
  private createEffectsChain(config: AudioEffectsConfig): void {
    let currentInput: AudioNode = this._inputGain;
    let currentOutput: AudioNode = this._outputGain;
    
    // Disconnect existing connections
    this._inputGain.disconnect();
    
    // Create effects in order
    const effects: AudioNode[] = [];
    
    if (config.filter) {
      const filter = this._context.createBiquadFilter();
      filter.type = config.filter.type;
      filter.frequency.value = config.filter.frequency;
      filter.Q.value = config.filter.Q;
      if (config.filter.gain !== undefined) {
        filter.gain.value = config.filter.gain;
      }
      effects.push(filter);
      this._effectNodes.set('filter', filter);
    }
    
    if (config.compressor) {
      const compressor = this._context.createDynamicsCompressor();
      compressor.threshold.value = config.compressor.threshold;
      compressor.knee.value = config.compressor.knee;
      compressor.ratio.value = config.compressor.ratio;
      compressor.attack.value = config.compressor.attack;
      compressor.release.value = config.compressor.release;
      effects.push(compressor);
      this._effectNodes.set('compressor', compressor);
    }
    
    if (config.delay) {
      const delayEffect = this.createDelayEffect(config.delay);
      effects.push(delayEffect);
      this._effectNodes.set('delay', delayEffect);
    }
    
    if (config.reverb) {
      const reverbEffect = this.createReverbEffect(config.reverb);
      effects.push(reverbEffect);
      this._effectNodes.set('reverb', reverbEffect);
    }
    
    // Chain effects together
    let previousNode: AudioNode = this._inputGain;
    effects.forEach(effect => {
      previousNode.connect(effect);
      previousNode = effect;
    });
    
    // Connect final effect to output
    if (effects.length > 0) {
      previousNode.connect(this._outputGain);
    } else {
      this._inputGain.connect(this._outputGain);
    }
  }

  /**
   * Create delay effect
   */
  private createDelayEffect(config: any): AudioNode {
    const delay = this._context.createDelay(1);
    const feedback = this._context.createGain();
    const wetGain = this._context.createGain();
    const dryGain = this._context.createGain();
    const mixer = this._context.createGain();
    
    delay.delayTime.value = config.delayTime;
    feedback.gain.value = config.feedback;
    wetGain.gain.value = config.wetness;
    dryGain.gain.value = 1 - config.wetness;
    
    // Create feedback loop
    delay.connect(feedback);
    feedback.connect(delay);
    
    // Create wet/dry mix
    delay.connect(wetGain);
    wetGain.connect(mixer);
    dryGain.connect(mixer);
    
    // Create input splitter
    const inputSplitter = this._context.createGain();
    inputSplitter.connect(delay);
    inputSplitter.connect(dryGain);
    
    // Store reference to input node
    (mixer as any)._inputNode = inputSplitter;
    
    return mixer;
  }

  /**
   * Create reverb effect
   */
  private createReverbEffect(config: any): AudioNode {
    const convolver = this._context.createConvolver();
    const wetGain = this._context.createGain();
    const dryGain = this._context.createGain();
    const mixer = this._context.createGain();
    
    wetGain.gain.value = config.wetness;
    dryGain.gain.value = config.dryness;
    
    // Generate impulse response
    const impulse = this.generateReverbImpulse(config);
    convolver.buffer = impulse;
    
    // Connect reverb chain
    convolver.connect(wetGain);
    wetGain.connect(mixer);
    dryGain.connect(mixer);
    
    // Create input splitter
    const inputSplitter = this._context.createGain();
    inputSplitter.connect(convolver);
    inputSplitter.connect(dryGain);
    
    (mixer as any)._inputNode = inputSplitter;
    
    return mixer;
  }

  /**
   * Generate reverb impulse response
   */
  private generateReverbImpulse(config: any): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const duration = config.roomSize * 3; // Scale duration with room size
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const envelope = Math.exp(-time * (1 / config.roomSize));
        const dampedEnvelope = envelope * (1 - config.damping * time / duration);
        
        channelData[i] = (Math.random() * 2 - 1) * dampedEnvelope * 0.3;
      }
    }
    
    return buffer;
  }

  /**
   * Add individual effect to the zone
   */
  private addEffect(name: string, config: AudioEffectsConfig): void {
    // This is a simplified version - in practice, you'd rebuild the entire chain
    Logger.info('Audio', `Adding effect ${name} to zone ${this._name}`);
  }

  /**
   * Remove individual effect from the zone
   */
  private removeEffect(name: string): void {
    const effect = this._effectNodes.get(name);
    if (effect) {
      effect.disconnect();
      this._effectNodes.delete(name);
    }
  }

  /**
   * Get audio input node for connecting sources
   */
  getInputNode(): GainNode {
    return this._inputGain;
  }

  /**
   * Get audio output node for connecting to master
   */
  getOutputNode(): GainNode {
    return this._outputGain;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Disconnect all audio nodes
    this._inputGain.disconnect();
    this._outputGain.disconnect();
    
    this._effectNodes.forEach(node => node.disconnect());
    this._effectNodes.clear();
    
    this.removeAllListeners();
  }
}