import { EventEmitter } from 'eventemitter3';
import {
  AudioBus,
  AudioSource,
  AudioBusConfig,
  AudioBusType,
  AudioEvents,
  AudioEffectsConfig
} from '../../contracts/Audio';

/**
 * GameByte Audio Bus - Audio mixing and routing system
 * 
 * Features:
 * - Volume and mute control
 * - Solo functionality
 * - Audio effects processing
 * - Send/return system
 * - Real-time audio analysis
 * - Source management
 */
export class GameByteAudioBus extends EventEmitter<AudioEvents> implements AudioBus {
  private _name: string;
  private _type: AudioBusType;
  private _context: AudioContext;
  private _masterGain: GainNode;
  
  // Audio nodes
  private _inputGain!: GainNode;
  private _outputGain!: GainNode;
  private _muteGain!: GainNode;
  private _soloGain!: GainNode;
  private _analyserNode!: AnalyserNode;
  private _effectNodes: Map<string, AudioNode> = new Map();
  
  // Send/return system
  private _sendGains: Map<string, GainNode> = new Map();
  
  // Bus state
  private _volume = 1.0;
  private _muted = false;
  private _solo = false;
  private _sources = new Set<AudioSource>();
  
  // Performance monitoring
  private _rmsLevel = 0;
  private _peakLevel = 0;
  private _analysisInterval: number | null = null;

  constructor(
    context: AudioContext,
    config: AudioBusConfig,
    masterGain: GainNode
  ) {
    super();
    
    this._name = config.name;
    this._type = config.type;
    this._context = context;
    this._masterGain = masterGain;
    this._volume = config.volume;
    this._muted = config.muted;
    this._solo = config.solo;
    
    this.createAudioNodes();
    this.connectAudioNodes();
    this.startAnalysis();
    
    // Apply initial effects if provided
    if (config.effects) {
      Object.entries(config.effects).forEach(([name, effectConfig]) => {
        this.addEffect(name, { [name]: effectConfig });
      });
    }
    
    // Setup initial sends if provided
    if (config.sends) {
      config.sends.forEach(send => {
        this.addSend(send.bus, send.amount);
      });
    }
  }

  get name(): string {
    return this._name;
  }

  get type(): AudioBusType {
    return this._type;
  }

  get sources(): Set<AudioSource> {
    return new Set(this._sources);
  }

  /**
   * Create audio processing nodes
   */
  private createAudioNodes(): void {
    // Input gain for sources
    this._inputGain = this._context.createGain();
    this._inputGain.gain.value = 1.0;
    
    // Mute control
    this._muteGain = this._context.createGain();
    this._muteGain.gain.value = this._muted ? 0 : 1;
    
    // Solo control
    this._soloGain = this._context.createGain();
    this._soloGain.gain.value = this._solo ? 1 : 1; // Solo is handled at mixer level
    
    // Output gain for volume control
    this._outputGain = this._context.createGain();
    this._outputGain.gain.value = this._volume;
    
    // Analyzer for level monitoring
    this._analyserNode = this._context.createAnalyser();
    this._analyserNode.fftSize = 256;
    this._analyserNode.smoothingTimeConstant = 0.8;
  }

  /**
   * Connect audio nodes in processing chain
   */
  private connectAudioNodes(): void {
    let currentNode: AudioNode = this._inputGain;
    
    // Connect effects chain
    this._effectNodes.forEach(effectNode => {
      currentNode.connect(effectNode);
      currentNode = effectNode;
    });
    
    // Connect control chain
    currentNode.connect(this._muteGain);
    this._muteGain.connect(this._soloGain);
    this._soloGain.connect(this._outputGain);
    
    // Connect to analyzer and master output
    this._outputGain.connect(this._analyserNode);
    this._analyserNode.connect(this._masterGain);
    
    // Connect sends
    this._sendGains.forEach(sendGain => {
      this._outputGain.connect(sendGain);
    });
  }

  /**
   * Disconnect all audio nodes
   */
  private disconnectAudioNodes(): void {
    this._inputGain.disconnect();
    this._muteGain.disconnect();
    this._soloGain.disconnect();
    this._outputGain.disconnect();
    this._analyserNode.disconnect();
    
    this._effectNodes.forEach(node => node.disconnect());
    this._sendGains.forEach(sendGain => sendGain.disconnect());
  }

  /**
   * Start real-time audio analysis
   */
  private startAnalysis(): void {
    if (this._analysisInterval) {
      clearInterval(this._analysisInterval);
    }
    
    this._analysisInterval = window.setInterval(() => {
      this.updateAnalysis();
    }, 100); // Update 10 times per second
  }

  /**
   * Update audio level analysis
   */
  private updateAnalysis(): void {
    const bufferLength = this._analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this._analyserNode.getByteFrequencyData(dataArray);
    
    // Calculate RMS level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    this._rmsLevel = Math.sqrt(sum / bufferLength) / 255;
    
    // Calculate peak level
    let peak = 0;
    for (let i = 0; i < bufferLength; i++) {
      peak = Math.max(peak, dataArray[i]);
    }
    this._peakLevel = peak / 255;
  }

  // Volume control
  setVolume(volume: number, fadeTime = 0): void {
    const clampedVolume = Math.max(0, Math.min(2, volume)); // Allow up to 200% volume
    this._volume = clampedVolume;
    
    if (fadeTime > 0) {
      this._outputGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, clampedVolume),
        this._context.currentTime + fadeTime
      );
    } else {
      this._outputGain.gain.value = clampedVolume;
    }
    
    this.emit('audio:volume-change', {
      source: null as any,
      volume: clampedVolume
    });
  }

  getVolume(): number {
    return this._volume;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this._muteGain.gain.value = muted ? 0 : 1;
    
    this.emit('audio:mute-change', {
      bus: this._name,
      muted
    } as any);
  }

  isMuted(): boolean {
    return this._muted;
  }

  setSolo(solo: boolean): void {
    this._solo = solo;
    // Solo handling is typically managed at the mixer level
    // This just tracks the solo state for the bus
    
    this.emit('audio:solo-change', {
      bus: this._name,
      solo
    } as any);
  }

  isSolo(): boolean {
    return this._solo;
  }

  // Source management
  addSource(source: AudioSource): void {
    if (this._sources.has(source)) {
      return;
    }
    
    this._sources.add(source);
    
    // Connect source to bus input
    // Note: This assumes the source has a method to connect to our input
    // In practice, sources would need to know about their target bus
    
    this.emit('source:added', {
      bus: this._name,
      source
    } as any);
  }

  removeSource(source: AudioSource): void {
    if (!this._sources.has(source)) {
      return;
    }
    
    this._sources.delete(source);
    
    // Disconnect source from bus
    // Note: Implementation depends on how sources are connected
    
    this.emit('source:removed', {
      bus: this._name,
      source
    } as any);
  }

  removeAllSources(): void {
    const sources = Array.from(this._sources);
    sources.forEach(source => this.removeSource(source));
  }

  // Effects processing
  addEffect(name: string, config: AudioEffectsConfig): void {
    // Remove existing effect if it exists
    this.removeEffect(name);
    
    const effectNode = this.createEffectNode(config);
    if (effectNode) {
      this._effectNodes.set(name, effectNode);
      
      // Reconnect audio chain with new effect
      this.disconnectAudioNodes();
      this.connectAudioNodes();
      
      this.emit('effect:added', {
        bus: this._name,
        effect: name
      } as any);
    }
  }

  removeEffect(name: string): void {
    const effectNode = this._effectNodes.get(name);
    if (effectNode) {
      effectNode.disconnect();
      this._effectNodes.delete(name);
      
      // Reconnect audio chain without removed effect
      this.disconnectAudioNodes();
      this.connectAudioNodes();
      
      this.emit('effect:removed', {
        bus: this._name,
        effect: name
      } as any);
    }
  }

  updateEffect(name: string, config: Partial<AudioEffectsConfig>): void {
    const effectNode = this._effectNodes.get(name);
    if (effectNode) {
      this.updateEffectNode(effectNode, config);
      
      this.emit('effect:updated', {
        bus: this._name,
        effect: name
      } as any);
    }
  }

  /**
   * Create effect node based on configuration
   */
  private createEffectNode(config: AudioEffectsConfig): AudioNode | null {
    if (config.reverb) {
      // Create reverb using convolution
      const convolver = this._context.createConvolver();
      // Note: Would need impulse response buffer for realistic reverb
      return convolver;
    }
    
    if (config.delay) {
      const delay = this._context.createDelay(1);
      const feedback = this._context.createGain();
      const wetGain = this._context.createGain();
      const dryGain = this._context.createGain();
      
      delay.delayTime.value = config.delay.delayTime;
      feedback.gain.value = config.delay.feedback;
      wetGain.gain.value = config.delay.wetness;
      dryGain.gain.value = 1 - config.delay.wetness;
      
      // Create delay feedback loop
      delay.connect(feedback);
      feedback.connect(delay);
      
      // Create wet/dry mix
      const mixer = this._context.createGain();
      delay.connect(wetGain);
      wetGain.connect(mixer);
      dryGain.connect(mixer);
      
      return delay;
    }
    
    if (config.filter) {
      const filter = this._context.createBiquadFilter();
      filter.type = config.filter.type;
      filter.frequency.value = config.filter.frequency;
      filter.Q.value = config.filter.Q;
      if (config.filter.gain !== undefined) {
        filter.gain.value = config.filter.gain;
      }
      return filter;
    }
    
    if (config.compressor) {
      const compressor = this._context.createDynamicsCompressor();
      compressor.threshold.value = config.compressor.threshold;
      compressor.knee.value = config.compressor.knee;
      compressor.ratio.value = config.compressor.ratio;
      compressor.attack.value = config.compressor.attack;
      compressor.release.value = config.compressor.release;
      return compressor;
    }
    
    if (config.distortion) {
      const waveshaper = this._context.createWaveShaper();
      waveshaper.curve = this.createDistortionCurve(config.distortion.amount);
      waveshaper.oversample = config.distortion.oversample;
      return waveshaper;
    }
    
    return null;
  }

  /**
   * Update effect node parameters
   */
  private updateEffectNode(node: AudioNode, config: Partial<AudioEffectsConfig>): void {
    if (config.filter && 'frequency' in node) {
      const filter = node as BiquadFilterNode;
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
    
    if (config.delay && 'delayTime' in node) {
      const delay = node as DelayNode;
      if (config.delay.delayTime !== undefined) {
        delay.delayTime.value = config.delay.delayTime;
      }
    }
    
    if (config.compressor && 'threshold' in node) {
      const compressor = node as DynamicsCompressorNode;
      if (config.compressor.threshold !== undefined) {
        compressor.threshold.value = config.compressor.threshold;
      }
      if (config.compressor.knee !== undefined) {
        compressor.knee.value = config.compressor.knee;
      }
      if (config.compressor.ratio !== undefined) {
        compressor.ratio.value = config.compressor.ratio;
      }
      if (config.compressor.attack !== undefined) {
        compressor.attack.value = config.compressor.attack;
      }
      if (config.compressor.release !== undefined) {
        compressor.release.value = config.compressor.release;
      }
    }
  }

  /**
   * Create distortion curve for waveshaper
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

  // Send/return system
  addSend(targetBus: string, amount: number): void {
    if (this._sendGains.has(targetBus)) {
      this.updateSend(targetBus, amount);
      return;
    }
    
    const sendGain = this._context.createGain();
    sendGain.gain.value = Math.max(0, Math.min(1, amount));
    
    this._sendGains.set(targetBus, sendGain);
    
    // Connect send to output (would need reference to target bus)
    this._outputGain.connect(sendGain);
    
    this.emit('send:added', {
      bus: this._name,
      targetBus,
      amount
    } as any);
  }

  removeSend(targetBus: string): void {
    const sendGain = this._sendGains.get(targetBus);
    if (sendGain) {
      sendGain.disconnect();
      this._sendGains.delete(targetBus);
      
      this.emit('send:removed', {
        bus: this._name,
        targetBus
      } as any);
    }
  }

  updateSend(targetBus: string, amount: number): void {
    const sendGain = this._sendGains.get(targetBus);
    if (sendGain) {
      sendGain.gain.value = Math.max(0, Math.min(1, amount));
      
      this.emit('send:updated', {
        bus: this._name,
        targetBus,
        amount
      } as any);
    }
  }

  // Analysis
  getAnalyzer(): AnalyserNode | null {
    return this._analyserNode;
  }

  getRMSLevel(): number {
    return this._rmsLevel;
  }

  getPeakLevel(): number {
    return this._peakLevel;
  }

  /**
   * Get frequency data for visualization
   */
  getFrequencyData(): Uint8Array {
    const bufferLength = this._analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this._analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Get time domain data for waveform visualization
   */
  getTimeDomainData(): Uint8Array {
    const bufferLength = this._analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this._analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Get input gain node for connecting sources
   */
  getInputNode(): GainNode {
    return this._inputGain;
  }

  /**
   * Get output gain node for connecting to other buses or master
   */
  getOutputNode(): GainNode {
    return this._outputGain;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop analysis
    if (this._analysisInterval) {
      clearInterval(this._analysisInterval);
      this._analysisInterval = null;
    }
    
    // Remove all sources
    this.removeAllSources();
    
    // Disconnect all nodes
    this.disconnectAudioNodes();
    
    // Clear collections
    this._effectNodes.clear();
    this._sendGains.clear();
    this._sources.clear();
    
    this.removeAllListeners();
  }
}