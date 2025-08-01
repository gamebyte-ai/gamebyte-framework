import { EventEmitter } from 'eventemitter3';
import {
  AudioEffectsProcessor,
  AudioEvents,
  AudioEffectsConfig
} from '../../contracts/Audio';

/**
 * Audio effect presets for common game scenarios
 */
const EFFECT_PRESETS = {
  // Reverb presets
  room: {
    reverb: {
      roomSize: 0.3,
      damping: 0.5,
      wetness: 0.3,
      dryness: 0.7,
      width: 1.0,
      freezeMode: false
    }
  },
  hall: {
    reverb: {
      roomSize: 0.8,
      damping: 0.2,
      wetness: 0.5,
      dryness: 0.5,
      width: 1.0,
      freezeMode: false
    }
  },
  cave: {
    reverb: {
      roomSize: 0.9,
      damping: 0.1,
      wetness: 0.7,
      dryness: 0.3,
      width: 1.0,
      freezeMode: false
    }
  },
  
  // Filter presets
  underwater: {
    filter: {
      type: 'lowpass' as const,
      frequency: 400,
      Q: 2,
      gain: 0
    }
  },
  radio: {
    filter: {
      type: 'bandpass' as const,
      frequency: 1000,
      Q: 5,
      gain: 0
    }
  },
  telephone: {
    filter: {
      type: 'bandpass' as const,
      frequency: 800,
      Q: 10,
      gain: 0
    }
  },
  
  // Distortion presets
  overdrive: {
    distortion: {
      amount: 20,
      oversample: '2x' as const
    }
  },
  fuzz: {
    distortion: {
      amount: 50,
      oversample: '4x' as const
    }
  },
  
  // Delay presets
  echo: {
    delay: {
      delayTime: 0.3,
      feedback: 0.3,
      wetness: 0.3
    }
  },
  slap: {
    delay: {
      delayTime: 0.1,
      feedback: 0.1,
      wetness: 0.2
    }
  },
  
  // Compressor presets
  vocal: {
    compressor: {
      threshold: -18,
      knee: 12,
      ratio: 4,
      attack: 0.01,
      release: 0.1
    }
  },
  drums: {
    compressor: {
      threshold: -12,
      knee: 6,
      ratio: 8,
      attack: 0.003,
      release: 0.05
    }
  },
  limiter: {
    limiter: {
      threshold: -3,
      lookAhead: 0.005,
      release: 0.1
    }
  }
};

/**
 * GameByte Audio Effects Processor
 * 
 * Features:
 * - Comprehensive effects library (reverb, delay, filters, distortion, dynamics)
 * - Effect presets for common game scenarios
 * - Real-time parameter control
 * - Audio worklet support for custom processors
 * - Mobile-optimized processing
 * - Visual analysis and metering
 */
export class GameByteAudioEffectsProcessor extends EventEmitter<AudioEvents> implements AudioEffectsProcessor {
  private _context: AudioContext;
  private _effects = new Map<string, AudioNode>();
  private _presets = new Map<string, AudioEffectsConfig>();
  private _worklets = new Map<string, AudioWorkletNode>();
  private _convolutionBuffers = new Map<string, AudioBuffer>();
  
  // Analysis nodes
  private _analyzers = new Map<string, AnalyserNode>();
  
  // Worklet processors loaded
  private _workletProcessorsLoaded = new Set<string>();

  constructor(context: AudioContext) {
    super();
    this._context = context;
    
    // Load default presets
    Object.entries(EFFECT_PRESETS).forEach(([name, config]) => {
      this._presets.set(name, config);
    });
  }

  get context(): AudioContext {
    return this._context;
  }

  get effects(): Map<string, AudioNode> {
    return new Map(this._effects);
  }

  /**
   * Initialize the effects processor
   */
  async initialize(): Promise<void> {
    try {
      // Load audio worklet processors for advanced effects
      await this.loadWorkletProcessors();
      
      // Generate impulse responses for reverb
      await this.generateReverbImpulses();
      
      this.emit('effects:initialized', {} as any);
      
    } catch (error) {
      console.warn('Some effects features may not be available:', error);
      // Continue initialization even if some features fail
    }
  }

  /**
   * Load audio worklet processors
   */
  private async loadWorkletProcessors(): Promise<void> {
    const workletProcessors = [
      'reverb-processor',
      'granular-processor',
      'spectral-processor'
    ];
    
    for (const processor of workletProcessors) {
      try {
        // In a real implementation, you would load from actual worklet files
        // await this._context.audioWorklet.addModule(`/worklets/${processor}.js`);
        this._workletProcessorsLoaded.add(processor);
      } catch (error) {
        console.warn(`Failed to load worklet processor: ${processor}`, error);
      }
    }
  }

  /**
   * Generate impulse responses for reverb effects
   */
  private async generateReverbImpulses(): Promise<void> {
    const impulses = {
      room: this.generateRoomImpulse(0.3, 0.5, 2.0),
      hall: this.generateRoomImpulse(0.8, 0.2, 4.0),
      cave: this.generateRoomImpulse(0.9, 0.1, 6.0),
      plate: this.generatePlateImpulse(0.6, 0.3, 3.0),
      spring: this.generateSpringImpulse(0.4, 0.4, 1.5)
    };
    
    Object.entries(impulses).forEach(([name, buffer]) => {
      this._convolutionBuffers.set(name, buffer);
    });
  }

  /**
   * Generate room impulse response
   */
  private generateRoomImpulse(size: number, damping: number, duration: number): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const decay = Math.pow(1 - damping, time * 10);
        const noise = (Math.random() * 2 - 1) * decay;
        
        // Add early reflections
        const earlyReflection = this.calculateEarlyReflection(time, size, channel);
        
        channelData[i] = (noise + earlyReflection) * 0.5;
      }
    }
    
    return buffer;
  }

  /**
   * Calculate early reflection for reverb
   */
  private calculateEarlyReflection(time: number, roomSize: number, channel: number): number {
    const reflections = [
      { delay: 0.01 * roomSize, gain: 0.8 },
      { delay: 0.02 * roomSize, gain: 0.6 },
      { delay: 0.03 * roomSize, gain: 0.4 },
      { delay: 0.05 * roomSize, gain: 0.3 },
      { delay: 0.08 * roomSize, gain: 0.2 }
    ];
    
    let reflection = 0;
    
    reflections.forEach((ref, index) => {
      if (Math.abs(time - ref.delay) < 0.001) {
        // Stereo spread
        const stereoGain = channel === 0 ? 
          ref.gain * (1 - index * 0.1) : 
          ref.gain * (1 + index * 0.1);
        reflection += (Math.random() * 2 - 1) * stereoGain;
      }
    });
    
    return reflection;
  }

  /**
   * Generate plate reverb impulse response
   */
  private generatePlateImpulse(decay: number, diffusion: number, duration: number): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const envelope = Math.exp(-time * (1 / decay));
        
        // Plate characteristics: metallic resonance
        const resonance = Math.sin(time * 2000 * Math.PI) * 0.1 * envelope;
        const noise = (Math.random() * 2 - 1) * envelope * diffusion;
        
        channelData[i] = (resonance + noise) * 0.3;
      }
    }
    
    return buffer;
  }

  /**
   * Generate spring reverb impulse response
   */
  private generateSpringImpulse(tension: number, damping: number, duration: number): AudioBuffer {
    const sampleRate = this._context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this._context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const envelope = Math.exp(-time * (1 / damping));
        
        // Spring characteristics: bouncy resonance
        const spring = Math.sin(time * 150 * tension * Math.PI) * envelope;
        const flutter = Math.sin(time * 30 * Math.PI) * 0.1 * envelope;
        
        channelData[i] = (spring + flutter) * 0.4;
      }
    }
    
    return buffer;
  }

  // Effect management
  createEffect(name: string, type: string, config: AudioEffectsConfig): AudioNode {
    if (this._effects.has(name)) {
      throw new Error(`Effect '${name}' already exists`);
    }
    
    let effectNode: AudioNode;
    
    switch (type) {
      case 'reverb':
        effectNode = this.createReverbEffect(config);
        break;
      case 'delay':
        effectNode = this.createDelayEffect(config);
        break;
      case 'filter':
        effectNode = this.createFilterEffect(config);
        break;
      case 'distortion':
        effectNode = this.createDistortionEffect(config);
        break;
      case 'compressor':
        effectNode = this.createCompressorEffect(config);
        break;
      case 'limiter':
        effectNode = this.createLimiterEffect(config);
        break;
      case 'chorus':
        effectNode = this.createChorusEffect(config);
        break;
      case 'flanger':
        effectNode = this.createFlangerEffect(config);
        break;
      case 'phaser':
        effectNode = this.createPhaserEffect(config);
        break;
      default:
        throw new Error(`Unknown effect type: ${type}`);
    }
    
    this._effects.set(name, effectNode);
    
    this.emit('effect:created', {
      name,
      type,
      node: effectNode
    } as any);
    
    return effectNode;
  }

  /**
   * Create reverb effect using convolution
   */
  private createReverbEffect(config: AudioEffectsConfig): AudioNode {
    if (!config.reverb) {
      throw new Error('Reverb configuration required');
    }
    
    const convolver = this._context.createConvolver();
    const wetGain = this._context.createGain();
    const dryGain = this._context.createGain();
    const mixer = this._context.createGain();
    
    // Set wet/dry mix
    wetGain.gain.value = config.reverb.wetness;
    dryGain.gain.value = config.reverb.dryness;
    
    // Load appropriate impulse response
    const roomSize = config.reverb.roomSize;
    let impulseName = 'room';
    
    if (roomSize > 0.7) impulseName = 'hall';
    else if (roomSize > 0.5) impulseName = 'room';
    else impulseName = 'room';
    
    const impulse = this._convolutionBuffers.get(impulseName);
    if (impulse) {
      convolver.buffer = impulse;
    }
    
    // Connect wet signal
    convolver.connect(wetGain);
    wetGain.connect(mixer);
    
    // Dry signal bypasses convolver
    dryGain.connect(mixer);
    
    // Create custom node that handles both wet and dry
    const reverbNode = this._context.createGain();
    reverbNode.connect(convolver);
    reverbNode.connect(dryGain);
    
    return mixer;
  }

  /**
   * Create delay effect
   */
  private createDelayEffect(config: AudioEffectsConfig): AudioNode {
    if (!config.delay) {
      throw new Error('Delay configuration required');
    }
    
    const delay = this._context.createDelay(1); // Max 1 second
    const feedback = this._context.createGain();
    const wetGain = this._context.createGain();
    const dryGain = this._context.createGain();
    const mixer = this._context.createGain();
    
    // Configure delay
    delay.delayTime.value = config.delay.delayTime;
    feedback.gain.value = config.delay.feedback;
    wetGain.gain.value = config.delay.wetness;
    dryGain.gain.value = 1 - config.delay.wetness;
    
    // Create feedback loop
    delay.connect(feedback);
    feedback.connect(delay);
    
    // Mix wet and dry signals
    delay.connect(wetGain);
    wetGain.connect(mixer);
    dryGain.connect(mixer);
    
    // Input connects to both delay and dry path
    const inputNode = this._context.createGain();
    inputNode.connect(delay);
    inputNode.connect(dryGain);
    
    // Return mixer as the effect node
    (mixer as any)._inputNode = inputNode;
    return mixer;
  }

  /**
   * Create filter effect
   */
  private createFilterEffect(config: AudioEffectsConfig): AudioNode {
    if (!config.filter) {
      throw new Error('Filter configuration required');
    }
    
    const filter = this._context.createBiquadFilter();
    filter.type = config.filter.type;
    filter.frequency.value = config.filter.frequency;
    filter.Q.value = config.filter.Q;
    
    if (config.filter.gain !== undefined) {
      filter.gain.value = config.filter.gain;
    }
    
    return filter;
  }

  /**
   * Create distortion effect
   */
  private createDistortionEffect(config: AudioEffectsConfig): AudioNode {
    if (!config.distortion) {
      throw new Error('Distortion configuration required');
    }
    
    const waveshaper = this._context.createWaveShaper();
    waveshaper.curve = this.createDistortionCurve(config.distortion.amount);
    waveshaper.oversample = config.distortion.oversample;
    
    return waveshaper;
  }

  /**
   * Create distortion curve
   */
  private createDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    return curve;
  }

  /**
   * Create compressor effect
   */
  private createCompressorEffect(config: AudioEffectsConfig): AudioNode {
    if (!config.compressor) {
      throw new Error('Compressor configuration required');
    }
    
    const compressor = this._context.createDynamicsCompressor();
    compressor.threshold.value = config.compressor.threshold;
    compressor.knee.value = config.compressor.knee;
    compressor.ratio.value = config.compressor.ratio;
    compressor.attack.value = config.compressor.attack;
    compressor.release.value = config.compressor.release;
    
    return compressor;
  }

  /**
   * Create limiter effect
   */
  private createLimiterEffect(config: AudioEffectsConfig): AudioNode {
    if (!config.limiter) {
      throw new Error('Limiter configuration required');
    }
    
    const limiter = this._context.createDynamicsCompressor();
    limiter.threshold.value = config.limiter.threshold;
    limiter.knee.value = 0; // Hard knee for limiting
    limiter.ratio.value = 20; // High ratio for limiting
    limiter.attack.value = config.limiter.lookAhead;
    limiter.release.value = config.limiter.release;
    
    return limiter;
  }

  /**
   * Create chorus effect
   */
  private createChorusEffect(config: AudioEffectsConfig): AudioNode {
    const delay1 = this._context.createDelay(0.05);
    const delay2 = this._context.createDelay(0.05);
    const lfo1 = this._context.createOscillator();
    const lfo2 = this._context.createOscillator();
    const lfoGain1 = this._context.createGain();
    const lfoGain2 = this._context.createGain();
    const mixer = this._context.createGain();
    const dryGain = this._context.createGain();
    const wetGain = this._context.createGain();
    
    // Configure LFOs
    lfo1.frequency.value = 0.8;
    lfo2.frequency.value = 1.2;
    lfoGain1.gain.value = 0.002;
    lfoGain2.gain.value = 0.003;
    
    // Configure delays
    delay1.delayTime.value = 0.02;
    delay2.delayTime.value = 0.03;
    
    // Connect LFOs to delay times
    lfo1.connect(lfoGain1);
    lfo2.connect(lfoGain2);
    lfoGain1.connect(delay1.delayTime);
    lfoGain2.connect(delay2.delayTime);
    
    // Mix wet and dry
    wetGain.gain.value = 0.5;
    dryGain.gain.value = 0.7;
    
    delay1.connect(wetGain);
    delay2.connect(wetGain);
    wetGain.connect(mixer);
    dryGain.connect(mixer);
    
    // Start LFOs
    lfo1.start();
    lfo2.start();
    
    // Create input node
    const inputNode = this._context.createGain();
    inputNode.connect(delay1);
    inputNode.connect(delay2);
    inputNode.connect(dryGain);
    
    (mixer as any)._inputNode = inputNode;
    return mixer;
  }

  /**
   * Create flanger effect
   */
  private createFlangerEffect(config: AudioEffectsConfig): AudioNode {
    const delay = this._context.createDelay(0.02);
    const lfo = this._context.createOscillator();
    const lfoGain = this._context.createGain();
    const feedback = this._context.createGain();
    const mixer = this._context.createGain();
    const dryGain = this._context.createGain();
    const wetGain = this._context.createGain();
    
    // Configure LFO for flanging sweep
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 0.005;
    delay.delayTime.value = 0.005;
    
    // Configure feedback and mix
    feedback.gain.value = 0.6;
    wetGain.gain.value = 0.5;
    dryGain.gain.value = 0.7;
    
    // Connect LFO to delay time
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    
    // Create feedback loop
    delay.connect(feedback);
    feedback.connect(delay);
    
    // Mix signals
    delay.connect(wetGain);
    wetGain.connect(mixer);
    dryGain.connect(mixer);
    
    lfo.start();
    
    const inputNode = this._context.createGain();
    inputNode.connect(delay);
    inputNode.connect(dryGain);
    
    (mixer as any)._inputNode = inputNode;
    return mixer;
  }

  /**
   * Create phaser effect
   */
  private createPhaserEffect(config: AudioEffectsConfig): AudioNode {
    const stages = 4; // Number of all-pass filters
    const allPasses: BiquadFilterNode[] = [];
    const lfo = this._context.createOscillator();
    const lfoGain = this._context.createGain();
    const mixer = this._context.createGain();
    const dryGain = this._context.createGain();
    const wetGain = this._context.createGain();
    
    // Create all-pass filters
    for (let i = 0; i < stages; i++) {
      const allPass = this._context.createBiquadFilter();
      allPass.type = 'allpass';
      allPass.frequency.value = 1000;
      allPasses.push(allPass);
    }
    
    // Configure LFO
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 800;
    
    // Connect LFO to all-pass frequencies
    lfo.connect(lfoGain);
    allPasses.forEach(filter => {
      lfoGain.connect(filter.frequency);
    });
    
    // Chain all-pass filters
    for (let i = 1; i < stages; i++) {
      allPasses[i - 1].connect(allPasses[i]);
    }
    
    // Mix wet and dry
    wetGain.gain.value = 0.5;
    dryGain.gain.value = 0.7;
    
    allPasses[stages - 1].connect(wetGain);
    wetGain.connect(mixer);
    dryGain.connect(mixer);
    
    lfo.start();
    
    const inputNode = this._context.createGain();
    inputNode.connect(allPasses[0]);
    inputNode.connect(dryGain);
    
    (mixer as any)._inputNode = inputNode;
    return mixer;
  }

  connectEffect(name: string, input: AudioNode, output: AudioNode): void {
    const effect = this._effects.get(name);
    if (!effect) {
      throw new Error(`Effect '${name}' not found`);
    }
    
    // Handle effects with custom input nodes
    const inputNode = (effect as any)._inputNode || effect;
    
    input.connect(inputNode);
    effect.connect(output);
  }

  disconnectEffect(name: string): void {
    const effect = this._effects.get(name);
    if (effect) {
      effect.disconnect();
    }
  }

  updateEffect(name: string, config: Partial<AudioEffectsConfig>): void {
    const effect = this._effects.get(name);
    if (!effect) {
      throw new Error(`Effect '${name}' not found`);
    }
    
    // Update effect parameters based on type
    this.updateEffectParameters(effect, config);
    
    this.emit('effect:updated', {
      name,
      config
    } as any);
  }

  /**
   * Update effect parameters
   */
  private updateEffectParameters(effect: AudioNode, config: Partial<AudioEffectsConfig>): void {
    if (config.filter && 'frequency' in effect) {
      const filter = effect as BiquadFilterNode;
      if (config.filter.frequency !== undefined) {
        filter.frequency.value = config.filter.frequency;
      }
      if (config.filter.Q !== undefined) {
        filter.Q.value = config.filter.Q;
      }
      if (config.filter.gain !== undefined && 'gain' in filter) {
        filter.gain.value = config.filter.gain;
      }
    }
    
    if (config.compressor && 'threshold' in effect) {
      const compressor = effect as DynamicsCompressorNode;
      if (config.compressor.threshold !== undefined) {
        compressor.threshold.value = config.compressor.threshold;
      }
      // Update other compressor parameters...
    }
    
    // Add more parameter updates for other effect types...
  }

  // Preset management
  loadPreset(name: string, config: AudioEffectsConfig): void {
    this._presets.set(name, config);
    
    this.emit('preset:loaded', {
      name,
      config
    } as any);
  }

  applyPreset(name: string, target: AudioNode): void {
    const preset = this._presets.get(name);
    if (!preset) {
      throw new Error(`Preset '${name}' not found`);
    }
    
    // Apply preset configuration to target
    this.updateEffectParameters(target, preset);
  }

  savePreset(name: string, config: AudioEffectsConfig): void {
    this.loadPreset(name, config);
    
    // In a real implementation, you might save to localStorage or server
    localStorage.setItem(`gamebyte-audio-preset-${name}`, JSON.stringify(config));
  }

  // Analysis
  createAnalyzer(fftSize = 2048): AnalyserNode {
    const analyzer = this._context.createAnalyser();
    analyzer.fftSize = fftSize;
    analyzer.smoothingTimeConstant = 0.8;
    
    const analyzerId = `analyzer-${Date.now()}`;
    this._analyzers.set(analyzerId, analyzer);
    
    return analyzer;
  }

  getFrequencyData(analyzer: AnalyserNode): Uint8Array {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getTimeDomainData(analyzer: AnalyserNode): Uint8Array {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Get available effect presets
   */
  getAvailablePresets(): string[] {
    return Array.from(this._presets.keys());
  }

  /**
   * Get preset configuration
   */
  getPreset(name: string): AudioEffectsConfig | null {
    return this._presets.get(name) || null;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Disconnect all effects
    this._effects.forEach(effect => effect.disconnect());
    this._effects.clear();
    
    // Disconnect analyzers
    this._analyzers.forEach(analyzer => analyzer.disconnect());
    this._analyzers.clear();
    
    // Disconnect worklets
    this._worklets.forEach(worklet => worklet.disconnect());
    this._worklets.clear();
    
    // Clear collections
    this._presets.clear();
    this._convolutionBuffers.clear();
    this._workletProcessorsLoaded.clear();
    
    this.removeAllListeners();
  }
}