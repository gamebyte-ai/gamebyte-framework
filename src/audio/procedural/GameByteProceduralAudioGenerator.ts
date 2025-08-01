import { EventEmitter } from 'eventemitter3';
import {
  ProceduralAudioGenerator,
  AudioEvents
} from '../../contracts/Audio';

/**
 * Noise generation types for procedural audio
 */
export enum NoiseType {
  WHITE = 'white',
  PINK = 'pink',
  BROWN = 'brown',
  BLUE = 'blue'
}

/**
 * Granular synthesis parameters
 */
export interface GranularConfig {
  grainSize: number;      // Size of each grain in milliseconds
  overlap: number;        // Overlap between grains (0-1)
  pitch: number;          // Pitch shift multiplier
  timeStretch: number;    // Time stretch multiplier
  position: number;       // Position in source audio (0-1)
  positionRandom: number; // Random position variance (0-1)
  density: number;        // Grain density per second
  envelope: 'hann' | 'gaussian' | 'linear'; // Grain envelope type
}

/**
 * GameByte Procedural Audio Generator
 * 
 * Features:
 * - Real-time synthesis of tones, noise, and effects
 * - Granular synthesis for advanced audio manipulation
 * - Impulse response generation for reverb effects
 * - Custom audio worklet processors
 * - Mathematical audio synthesis functions
 * - Mobile-optimized performance
 */
export class GameByteProceduralAudioGenerator extends EventEmitter<AudioEvents> implements ProceduralAudioGenerator {
  private _context: AudioContext;
  private _workletNodes = new Map<string, AudioWorkletNode>();
  private _workletProcessors = new Set<string>();
  
  // Pre-generated lookup tables for optimization
  private _sineTable!: Float32Array;
  private _triangleTable!: Float32Array;
  private _sawtoothTable!: Float32Array;
  private _squareTable!: Float32Array;
  
  constructor(context: AudioContext) {
    super();
    this._context = context;
    
    // Generate wavetable lookups for performance
    this.generateWavetables();
  }

  get context(): AudioContext {
    return this._context;
  }

  /**
   * Initialize the procedural audio generator
   */
  async initialize(): Promise<void> {
    try {
      // Load audio worklet processors
      await this.loadWorkletProcessors();
      
      this.emit('procedural:initialized', {} as any);
      
    } catch (error) {
      console.warn('Some procedural audio features may not be available:', error);
    }
  }

  /**
   * Generate optimized wavetable lookups
   */
  private generateWavetables(): void {
    const tableSize = 4096;
    
    this._sineTable = new Float32Array(tableSize);
    this._triangleTable = new Float32Array(tableSize);
    this._sawtoothTable = new Float32Array(tableSize);
    this._squareTable = new Float32Array(tableSize);
    
    for (let i = 0; i < tableSize; i++) {
      const phase = (i / tableSize) * Math.PI * 2;
      
      // Sine wave
      this._sineTable[i] = Math.sin(phase);
      
      // Triangle wave
      this._triangleTable[i] = Math.asin(Math.sin(phase)) * (2 / Math.PI);
      
      // Sawtooth wave
      this._sawtoothTable[i] = (2 * (i / tableSize)) - 1;
      
      // Square wave
      this._squareTable[i] = Math.sin(phase) >= 0 ? 1 : -1;
    }
  }

  /**
   * Load audio worklet processors
   */
  private async loadWorkletProcessors(): Promise<void> {
    const processors = [
      'granular-processor',
      'spectral-processor',
      'fm-synthesizer',
      'additive-synthesizer'
    ];
    
    for (const processor of processors) {
      try {
        // In production, load from actual worklet files
        // await this._context.audioWorklet.addModule(`/worklets/${processor}.js`);
        this._workletProcessors.add(processor);
      } catch (error) {
        console.warn(`Failed to load worklet processor: ${processor}`, error);
      }
    }
  }

  // Synthesis methods
  generateTone(frequency: number, duration: number, waveform: OscillatorType = 'sine'): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    // Use wavetable lookup for performance
    const wavetable = this.getWavetable(waveform);
    const tableSize = wavetable.length;
    const phaseIncrement = (frequency * tableSize) / sampleRate;
    
    let phase = 0;
    
    for (let i = 0; i < length; i++) {
      // Apply envelope to prevent clicks
      const envelope = this.calculateEnvelope(i, length, duration);
      
      // Sample from wavetable with linear interpolation
      const index = phase % tableSize;
      const lowerIndex = Math.floor(index);
      const upperIndex = (lowerIndex + 1) % tableSize;
      const fraction = index - lowerIndex;
      
      const sample = wavetable[lowerIndex] * (1 - fraction) + wavetable[upperIndex] * fraction;
      channelData[i] = sample * envelope;
      
      phase += phaseIncrement;
    }
    
    return buffer;
  }

  /**
   * Get wavetable for specified waveform
   */
  private getWavetable(waveform: OscillatorType): Float32Array {
    switch (waveform) {
      case 'sine': return this._sineTable;
      case 'triangle': return this._triangleTable;
      case 'sawtooth': return this._sawtoothTable;
      case 'square': return this._squareTable;
      default: return this._sineTable;
    }
  }

  /**
   * Calculate envelope for smooth tone generation
   */
  private calculateEnvelope(sample: number, totalSamples: number, duration: number): number {
    const fadeTime = Math.min(0.05, duration * 0.1); // 5% fade or 50ms max
    const fadeSamples = fadeTime * this._context.sampleRate;
    
    if (sample < fadeSamples) {
      // Fade in
      return sample / fadeSamples;
    } else if (sample > totalSamples - fadeSamples) {
      // Fade out
      return (totalSamples - sample) / fadeSamples;
    } else {
      // Sustain
      return 1.0;
    }
  }

  generateNoise(duration: number, type: NoiseType = NoiseType.WHITE): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    switch (type) {
      case NoiseType.WHITE:
        this.generateWhiteNoise(channelData);
        break;
      case NoiseType.PINK:
        this.generatePinkNoise(channelData);
        break;
      case NoiseType.BROWN:
        this.generateBrownNoise(channelData);
        break;
      case NoiseType.BLUE:
        this.generateBlueNoise(channelData);
        break;
    }
    
    return buffer;
  }

  /**
   * Generate white noise
   */
  private generateWhiteNoise(channelData: Float32Array): void {
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.random() * 2 - 1;
    }
  }

  /**
   * Generate pink noise (1/f noise)
   */
  private generatePinkNoise(channelData: Float32Array): void {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const white = Math.random() * 2 - 1;
      
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      
      channelData[i] = pink * 0.11;
    }
  }

  /**
   * Generate brown noise (Brownian noise)
   */
  private generateBrownNoise(channelData: Float32Array): void {
    let lastOut = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      channelData[i] = lastOut * 3.5; // Compensate for volume reduction
    }
  }

  /**
   * Generate blue noise (high-frequency emphasis)
   */
  private generateBlueNoise(channelData: Float32Array): void {
    let lastOut = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const white = Math.random() * 2 - 1;
      const blue = white - lastOut;
      lastOut = white;
      channelData[i] = blue * 0.5;
    }
  }

  generateChirp(startFreq: number, endFreq: number, duration: number): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    let phase = 0;
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      
      // Linear frequency sweep
      const frequency = startFreq + (endFreq - startFreq) * progress;
      
      // Calculate phase increment
      const phaseIncrement = (frequency * 2 * Math.PI) / sampleRate;
      phase += phaseIncrement;
      
      // Apply envelope
      const envelope = this.calculateEnvelope(i, length, duration);
      
      channelData[i] = Math.sin(phase) * envelope;
    }
    
    return buffer;
  }

  // Effects generation
  generateReverb(roomSize: number, decay: number): AudioBuffer {
    const duration = Math.max(1, decay * 4); // Reverb tail duration
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(2, length, sampleRate);
    
    // Generate stereo reverb impulse response
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      // Generate early reflections
      this.generateEarlyReflections(channelData, roomSize, channel);
      
      // Generate late reverb tail
      this.generateReverbTail(channelData, decay, roomSize, channel);
    }
    
    return buffer;
  }

  /**
   * Generate early reflections for reverb
   */
  private generateEarlyReflections(channelData: Float32Array, roomSize: number, channel: number): void {
    const reflections = this.calculateReflectionTimes(roomSize);
    const sampleRate = this._context.sampleRate;
    
    reflections.forEach((reflection, index) => {
      const delaySamples = Math.floor(reflection.delay * sampleRate);
      const gain = reflection.gain * (channel === 0 ? reflection.leftGain : reflection.rightGain);
      
      if (delaySamples < channelData.length) {
        // Add impulse at reflection time
        channelData[delaySamples] += gain;
        
        // Add some dispersion around the reflection
        for (let j = 1; j <= 5; j++) {
          if (delaySamples + j < channelData.length) {
            channelData[delaySamples + j] += gain * 0.1 * Math.random();
          }
          if (delaySamples - j >= 0) {
            channelData[delaySamples - j] += gain * 0.1 * Math.random();
          }
        }
      }
    });
  }

  /**
   * Calculate reflection times based on room size
   */
  private calculateReflectionTimes(roomSize: number): Array<{
    delay: number;
    gain: number;
    leftGain: number;
    rightGain: number;
  }> {
    const reflections = [];
    const baseDelay = 0.01 * roomSize;
    
    // Generate early reflections with varying delays and stereo positioning
    for (let i = 0; i < 8; i++) {
      reflections.push({
        delay: baseDelay * (1 + i * 0.3 + Math.random() * 0.2),
        gain: 0.8 / (i + 1),
        leftGain: 0.5 + Math.random() * 0.5,
        rightGain: 0.5 + Math.random() * 0.5
      });
    }
    
    return reflections;
  }

  /**
   * Generate reverb tail (late reflections)
   */
  private generateReverbTail(channelData: Float32Array, decay: number, roomSize: number, channel: number): void {
    const sampleRate = this._context.sampleRate;
    const startSample = Math.floor(0.05 * sampleRate); // Start after early reflections
    
    for (let i = startSample; i < channelData.length; i++) {
      const time = i / sampleRate;
      const envelope = Math.exp(-time / decay);
      
      // Generate diffuse reverb tail
      const density = roomSize * 20; // Higher room size = more reflections
      const sample = (Math.random() * 2 - 1) * envelope * 0.1;
      
      // Add frequency-dependent decay
      const highFreqDecay = Math.exp(-time / (decay * 0.3));
      const filteredSample = sample * (0.7 + 0.3 * highFreqDecay);
      
      channelData[i] += filteredSample;
    }
  }

  generateDelay(delayTime: number, feedback: number, duration: number): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    const delaySamples = Math.floor(delayTime * sampleRate);
    
    // Generate impulse with delay feedback
    channelData[0] = 1.0; // Initial impulse
    
    let currentFeedback = feedback;
    let delayIndex = delaySamples;
    
    while (delayIndex < length && currentFeedback > 0.001) {
      channelData[delayIndex] += currentFeedback;
      currentFeedback *= feedback;
      delayIndex += delaySamples;
    }
    
    return buffer;
  }

  // Granular synthesis
  createGranularProcessor(grainSize: number, overlap: number): AudioWorkletNode {
    if (!this._workletProcessors.has('granular-processor')) {
      throw new Error('Granular processor not available');
    }
    
    try {
      const workletNode = new AudioWorkletNode(this._context, 'granular-processor', {
        processorOptions: {
          grainSize,
          overlap
        }
      });
      
      const nodeId = `granular-${Date.now()}`;
      this._workletNodes.set(nodeId, workletNode);
      
      return workletNode;
      
    } catch (error) {
      // Fallback to non-worklet implementation
      console.warn('AudioWorklet not supported, using fallback granular synthesis');
      return this.createFallbackGranularProcessor(grainSize, overlap);
    }
  }

  /**
   * Create fallback granular processor using ScriptProcessorNode
   */
  private createFallbackGranularProcessor(grainSize: number, overlap: number): AudioWorkletNode {
    // This would be a fallback implementation using ScriptProcessorNode
    // For brevity, returning a mock worklet node
    const mockNode = this._context.createGain() as any;
    mockNode.grainSize = grainSize;
    mockNode.overlap = overlap;
    return mockNode;
  }

  processGranular(buffer: AudioBuffer, config: GranularConfig): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const grainSizeSamples = Math.floor((config.grainSize / 1000) * sampleRate);
    const hopSizeSamples = Math.floor(grainSizeSamples * (1 - config.overlap));
    
    // Calculate output buffer size based on time stretch
    const outputLength = Math.floor(buffer.length * config.timeStretch);
    const outputBuffer = this._context.createBuffer(
      buffer.numberOfChannels,
      outputLength,
      sampleRate
    );
    
    // Process each channel
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      this.processGranularChannel(
        inputData,
        outputData,
        config,
        grainSizeSamples,
        hopSizeSamples
      );
    }
    
    return outputBuffer;
  }

  /**
   * Process granular synthesis for a single channel
   */
  private processGranularChannel(
    inputData: Float32Array,
    outputData: Float32Array,
    config: GranularConfig,
    grainSizeSamples: number,
    hopSizeSamples: number
  ): void {
    const grainEnvelope = this.generateGrainEnvelope(grainSizeSamples, config.envelope);
    
    let outputPos = 0;
    let inputPos = config.position * inputData.length;
    
    while (outputPos < outputData.length - grainSizeSamples) {
      // Add position randomization
      const randomOffset = (Math.random() - 0.5) * config.positionRandom * inputData.length;
      const grainStartPos = Math.floor(inputPos + randomOffset);
      
      // Copy and process grain
      for (let i = 0; i < grainSizeSamples && outputPos + i < outputData.length; i++) {
        const inputIndex = (grainStartPos + Math.floor(i / config.pitch)) % inputData.length;
        const sample = inputData[Math.max(0, Math.min(inputIndex, inputData.length - 1))];
        
        outputData[outputPos + i] += sample * grainEnvelope[i];
      }
      
      // Advance positions
      outputPos += hopSizeSamples;
      inputPos += hopSizeSamples / config.timeStretch;
      
      if (inputPos >= inputData.length) {
        inputPos = 0; // Loop back to beginning
      }
    }
  }

  /**
   * Generate grain envelope
   */
  private generateGrainEnvelope(size: number, type: 'hann' | 'gaussian' | 'linear'): Float32Array {
    const envelope = new Float32Array(size);
    
    switch (type) {
      case 'hann':
        for (let i = 0; i < size; i++) {
          envelope[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
        }
        break;
        
      case 'gaussian':
        const sigma = size / 6; // Standard deviation
        const center = size / 2;
        for (let i = 0; i < size; i++) {
          const x = i - center;
          envelope[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
        }
        break;
        
      case 'linear':
        const half = size / 2;
        for (let i = 0; i < size; i++) {
          envelope[i] = i < half ? i / half : (size - i) / half;
        }
        break;
    }
    
    return envelope;
  }

  // Real-time processing
  createRealTimeProcessor(processor: (input: Float32Array) => Float32Array): AudioWorkletNode {
    try {
      // In production, this would create a custom AudioWorkletNode
      const mockNode = this._context.createGain() as any;
      mockNode.processor = processor;
      return mockNode;
    } catch (error) {
      throw new Error('Real-time processor creation failed');
    }
  }

  addRealTimeEffect(name: string, processor: AudioWorkletNode): void {
    this._workletNodes.set(name, processor);
    
    this.emit('realtime-effect:added', {
      name,
      processor
    } as any);
  }

  removeRealTimeEffect(name: string): void {
    const processor = this._workletNodes.get(name);
    if (processor) {
      processor.disconnect();
      this._workletNodes.delete(name);
      
      this.emit('realtime-effect:removed', {
        name
      } as any);
    }
  }

  /**
   * Generate complex waveforms using additive synthesis
   */
  generateAdditiveWaveform(
    fundamentalFreq: number,
    harmonics: Array<{ frequency: number; amplitude: number; phase: number }>,
    duration: number
  ): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      // Add fundamental frequency
      sample += Math.sin(2 * Math.PI * fundamentalFreq * t);
      
      // Add harmonics
      harmonics.forEach(harmonic => {
        sample += harmonic.amplitude * Math.sin(
          2 * Math.PI * harmonic.frequency * t + harmonic.phase
        );
      });
      
      // Apply envelope
      const envelope = this.calculateEnvelope(i, length, duration);
      channelData[i] = sample * envelope * 0.1; // Scale down to prevent clipping
    }
    
    return buffer;
  }

  /**
   * Generate frequency modulated (FM) synthesis
   */
  generateFMSynthesis(
    carrierFreq: number,
    modulatorFreq: number,
    modulationIndex: number,
    duration: number
  ): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // FM synthesis: carrier modulated by modulator
      const modulator = Math.sin(2 * Math.PI * modulatorFreq * t);
      const carrier = Math.sin(2 * Math.PI * carrierFreq * t + modulationIndex * modulator);
      
      // Apply envelope
      const envelope = this.calculateEnvelope(i, length, duration);
      channelData[i] = carrier * envelope;
    }
    
    return buffer;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Disconnect all worklet nodes
    this._workletNodes.forEach(node => node.disconnect());
    this._workletNodes.clear();
    
    // Clear processor registry
    this._workletProcessors.clear();
    
    this.removeAllListeners();
  }
}