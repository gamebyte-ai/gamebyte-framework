import { EventEmitter } from 'eventemitter3';
import {
  AudioSource,
  AudioEvents,
  SpatialAudioConfig,
  AudioEffectsConfig,
  AudioFadeType
} from '../../contracts/Audio';
import { Vector3 } from '../../contracts/Physics';

/**
 * GameByte Audio Source - Individual audio playback instance
 * 
 * Features:
 * - Web Audio API integration
 * - Spatial 3D positioning
 * - Real-time effects processing
 * - Volume and fade control
 * - Loop and seek functionality
 */
export class GameByteAudioSource extends EventEmitter<AudioEvents> implements AudioSource {
  private _id: string;
  private _buffer: AudioBuffer;
  private _context: AudioContext;
  private _masterGain: GainNode;
  
  // Audio nodes
  private _sourceNode: AudioBufferSourceNode | null = null;
  private _gainNode!: GainNode;
  private _pannerNode: PannerNode | null = null;
  private _analyserNode: AnalyserNode | null = null;
  private _effectNodes: Map<string, AudioNode> = new Map();
  
  // Playback state
  private _isPlaying = false;
  private _isPaused = false;
  private _isLooping = false;
  private _volume = 1.0;
  private _muted = false;
  private _startTime = 0;
  private _pauseTime = 0;
  private _playbackRate = 1.0;
  
  // Spatial audio
  private _position: Vector3 = { x: 0, y: 0, z: 0 };
  private _velocity: Vector3 = { x: 0, y: 0, z: 0 };
  private _spatialConfig: SpatialAudioConfig | null = null;
  
  // Fade control
  private _fadeTimeouts: Set<number> = new Set();
  
  constructor(
    id: string,
    buffer: AudioBuffer,
    context: AudioContext,
    masterGain: GainNode,
    options: {
      volume?: number;
      loop?: boolean;
      spatial?: boolean;
      playbackRate?: number;
    } = {}
  ) {
    super();
    
    this._id = id;
    this._buffer = buffer;
    this._context = context;
    this._masterGain = masterGain;
    
    // Apply options
    this._volume = options.volume ?? 1.0;
    this._isLooping = options.loop ?? false;
    this._playbackRate = options.playbackRate ?? 1.0;
    
    // Create audio nodes
    this.createAudioNodes(options.spatial ?? false);
  }

  get id(): string {
    return this._id;
  }

  get buffer(): AudioBuffer | null {
    return this._buffer;
  }

  get duration(): number {
    return this._buffer ? this._buffer.duration : 0;
  }

  get currentTime(): number {
    if (!this._isPlaying) {
      return this._pauseTime;
    }
    
    if (this._startTime === 0) {
      return 0;
    }
    
    return (this._context.currentTime - this._startTime) * this._playbackRate;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get isLooping(): boolean {
    return this._isLooping;
  }

  /**
   * Get the output gain node for routing to buses
   * This allows connecting this source to an AudioBus
   */
  getOutputNode(): GainNode {
    return this._gainNode;
  }

  /**
   * Disconnect from current destination and connect to a new target node
   * Used when routing through an AudioBus
   */
  connectToNode(targetNode: AudioNode): void {
    // Disconnect analyser from master (if connected)
    if (this._analyserNode) {
      try {
        this._analyserNode.disconnect(this._masterGain);
      } catch (e) {
        // Already disconnected or not connected
      }
      // Connect analyser to target node
      this._analyserNode.connect(targetNode);
    }
  }

  /**
   * Reconnect to the master gain (when removed from a bus)
   */
  reconnectToMaster(): void {
    if (this._analyserNode) {
      try {
        this._analyserNode.disconnect();
      } catch (e) {
        // Already disconnected
      }
      this._analyserNode.connect(this._masterGain);
    }
  }

  /**
   * Create and connect audio nodes
   */
  private createAudioNodes(spatial: boolean): void {
    // Create gain node for volume control
    this._gainNode = this._context.createGain();
    this._gainNode.gain.value = this._muted ? 0 : this._volume;
    
    // Create spatial audio nodes if enabled
    if (spatial) {
      this._pannerNode = this._context.createPanner();
      this._pannerNode.panningModel = 'HRTF';
      this._pannerNode.distanceModel = 'inverse';
      this._pannerNode.refDistance = 1;
      this._pannerNode.maxDistance = 100;
      this._pannerNode.rolloffFactor = 1;
      this._pannerNode.coneInnerAngle = 360;
      this._pannerNode.coneOuterAngle = 0;
      this._pannerNode.coneOuterGain = 0;
      
      // Set default position
      this.updatePannerPosition();
    }
    
    // Create analyser node for visualization
    this._analyserNode = this._context.createAnalyser();
    this._analyserNode.fftSize = 256;
    this._analyserNode.smoothingTimeConstant = 0.8;
    
    // Connect nodes
    this.connectAudioNodes();
  }

  /**
   * Connect audio nodes in the processing chain
   */
  private connectAudioNodes(): void {
    let currentNode: AudioNode = this._gainNode;
    
    // Connect effects chain
    this._effectNodes.forEach(effectNode => {
      currentNode.connect(effectNode);
      currentNode = effectNode;
    });
    
    // Connect spatial audio
    if (this._pannerNode) {
      currentNode.connect(this._pannerNode);
      currentNode = this._pannerNode;
    }
    
    // Connect analyser and master
    currentNode.connect(this._analyserNode!);
    this._analyserNode!.connect(this._masterGain);
  }

  /**
   * Disconnect all audio nodes
   */
  private disconnectAudioNodes(): void {
    if (this._sourceNode) {
      this._sourceNode.disconnect();
      this._sourceNode = null;
    }
    
    this._gainNode.disconnect();
    
    if (this._pannerNode) {
      this._pannerNode.disconnect();
    }
    
    if (this._analyserNode) {
      this._analyserNode.disconnect();
    }
    
    this._effectNodes.forEach(node => node.disconnect());
  }

  /**
   * Play the audio source
   */
  async play(when = 0): Promise<void> {
    if (this._isPlaying && !this._isPaused) {
      return;
    }
    
    try {
      // Stop current playback if any
      if (this._sourceNode) {
        this._sourceNode.stop();
        this._sourceNode.disconnect();
      }
      
      // Create new source node
      this._sourceNode = this._context.createBufferSource();
      this._sourceNode.buffer = this._buffer;
      this._sourceNode.loop = this._isLooping;
      this._sourceNode.playbackRate.value = this._playbackRate;
      
      // Connect source to gain node
      this._sourceNode.connect(this._gainNode);
      
      // Handle playback end
      this._sourceNode.onended = () => {
        if (!this._isLooping) {
          this._isPlaying = false;
          this._isPaused = false;
          this._startTime = 0;
          this._pauseTime = 0;
          this.emit('audio:end', { source: this });
        }
      };
      
      // Calculate start time
      const startTime = when > 0 ? when : this._context.currentTime;
      const offset = this._isPaused ? this._pauseTime : 0;
      
      // Start playback
      this._sourceNode.start(startTime, offset);
      
      this._isPlaying = true;
      this._isPaused = false;
      this._startTime = startTime - offset / this._playbackRate;
      
      this.emit('audio:play', { source: this });
      
    } catch (error) {
      this.emit('audio:error', { source: this, error: error as Error });
      throw error;
    }
  }

  /**
   * Pause the audio source
   */
  pause(): void {
    if (!this._isPlaying || this._isPaused) {
      return;
    }
    
    this._pauseTime = this.currentTime;
    this._isPaused = true;
    
    if (this._sourceNode) {
      this._sourceNode.stop();
      this._sourceNode.disconnect();
      this._sourceNode = null;
    }
    
    this.emit('audio:pause', { source: this });
  }

  /**
   * Stop the audio source
   */
  stop(): void {
    if (!this._isPlaying) {
      return;
    }
    
    this._isPlaying = false;
    this._isPaused = false;
    this._startTime = 0;
    this._pauseTime = 0;
    
    if (this._sourceNode) {
      this._sourceNode.stop();
      this._sourceNode.disconnect();
      this._sourceNode = null;
    }
    
    // Clear any active fades
    this._fadeTimeouts.forEach(timeout => clearTimeout(timeout));
    this._fadeTimeouts.clear();
    
    this.emit('audio:stop', { source: this });
  }

  /**
   * Seek to a specific time position
   */
  seek(time: number): void {
    const clampedTime = Math.max(0, Math.min(time, this.duration));
    
    if (this._isPlaying && !this._isPaused) {
      // Restart playback from new position
      this._pauseTime = clampedTime;
      this.pause();
      this.play();
    } else {
      this._pauseTime = clampedTime;
    }
  }

  /**
   * Set volume with optional fade
   */
  setVolume(volume: number, fadeTime = 0): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this._volume = clampedVolume;
    
    const targetVolume = this._muted ? 0 : clampedVolume;
    
    if (fadeTime > 0) {
      // Clear any existing fades
      this._fadeTimeouts.forEach(timeout => clearTimeout(timeout));
      this._fadeTimeouts.clear();
      
      // Perform exponential fade
      this._gainNode.gain.exponentialRampToValueAtTime(
        Math.max(0.001, targetVolume), // Avoid zero for exponential ramp
        this._context.currentTime + fadeTime
      );
      
      // Set final volume after fade completes
      const timeout = window.setTimeout(() => {
        this._gainNode.gain.value = targetVolume;
        this._fadeTimeouts.delete(timeout);
      }, fadeTime * 1000);
      
      this._fadeTimeouts.add(timeout);
      
    } else {
      this._gainNode.gain.value = targetVolume;
    }
    
    this.emit('audio:volume-change', { source: this, volume: clampedVolume });
  }

  getVolume(): number {
    return this._volume;
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this._muted = muted;
    this._gainNode.gain.value = muted ? 0 : this._volume;
  }

  isMuted(): boolean {
    return this._muted;
  }

  /**
   * Set 3D position
   */
  setPosition(position: Vector3): void {
    this._position = { ...position };
    this.updatePannerPosition();
  }

  getPosition(): Vector3 {
    return { ...this._position };
  }

  /**
   * Set velocity for Doppler effect
   */
  setVelocity(velocity: Vector3): void {
    this._velocity = { ...velocity };
    this.updatePannerVelocity();
  }

  /**
   * Set spatial audio configuration
   */
  setSpatialConfig(config: Partial<SpatialAudioConfig>): void {
    if (!this._pannerNode) {
      // Create panner node if spatial audio wasn't initially enabled
      this._pannerNode = this._context.createPanner();
      this.connectAudioNodes();
    }
    
    this._spatialConfig = { ...this._spatialConfig, ...config } as SpatialAudioConfig;
    
    // Apply spatial configuration
    if (config.distanceModel) {
      this._pannerNode.distanceModel = config.distanceModel;
    }
    if (config.maxDistance !== undefined) {
      this._pannerNode.maxDistance = config.maxDistance;
    }
    if (config.rolloffFactor !== undefined) {
      this._pannerNode.rolloffFactor = config.rolloffFactor;
    }
  }

  /**
   * Update panner node position
   */
  private updatePannerPosition(): void {
    if (this._pannerNode) {
      this._pannerNode.positionX.value = this._position.x;
      this._pannerNode.positionY.value = this._position.y;
      this._pannerNode.positionZ.value = this._position.z;
    }
  }

  /**
   * Update panner node velocity
   */
  private updatePannerVelocity(): void {
    if (this._pannerNode) {
      // Note: Web Audio API doesn't directly support velocity
      // This would need to be implemented using periodic position updates
      // for Doppler effect simulation
    }
  }

  /**
   * Add audio effect
   */
  addEffect(name: string, config: AudioEffectsConfig): void {
    // Remove existing effect if it exists
    this.removeEffect(name);
    
    const effectNode = this.createEffectNode(config);
    if (effectNode) {
      this._effectNodes.set(name, effectNode);
      this.connectAudioNodes();
    }
  }

  /**
   * Remove audio effect
   */
  removeEffect(name: string): void {
    const effectNode = this._effectNodes.get(name);
    if (effectNode) {
      effectNode.disconnect();
      this._effectNodes.delete(name);
      this.connectAudioNodes();
    }
  }

  /**
   * Update audio effect
   */
  updateEffect(name: string, config: Partial<AudioEffectsConfig>): void {
    const effectNode = this._effectNodes.get(name);
    if (effectNode) {
      // Update effect parameters
      this.updateEffectNode(effectNode, config);
    }
  }

  /**
   * Create effect node based on configuration
   */
  private createEffectNode(config: AudioEffectsConfig): AudioNode | null {
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
    
    if (config.delay) {
      const delay = this._context.createDelay(1); // Max 1 second delay
      const feedback = this._context.createGain();
      const wetGain = this._context.createGain();
      
      delay.delayTime.value = config.delay.delayTime;
      feedback.gain.value = config.delay.feedback;
      wetGain.gain.value = config.delay.wetness;
      
      // Connect delay feedback loop
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);
      
      return delay;
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
   * Get analyser node for visualization
   */
  getAnalyser(): AnalyserNode | null {
    return this._analyserNode;
  }

  /**
   * Get RMS level for volume metering
   */
  getRMSLevel(): number {
    if (!this._analyserNode) return 0;
    
    const bufferLength = this._analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this._analyserNode.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    
    return Math.sqrt(sum / bufferLength) / 255;
  }

  /**
   * Get peak level for volume metering
   */
  getPeakLevel(): number {
    if (!this._analyserNode) return 0;
    
    const bufferLength = this._analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this._analyserNode.getByteFrequencyData(dataArray);
    
    let peak = 0;
    for (let i = 0; i < bufferLength; i++) {
      peak = Math.max(peak, dataArray[i]);
    }
    
    return peak / 255;
  }

  /**
   * Set playback rate (pitch)
   */
  setPlaybackRate(rate: number): void {
    this._playbackRate = Math.max(0.1, Math.min(4, rate)); // Clamp between 0.1x and 4x
    
    if (this._sourceNode) {
      this._sourceNode.playbackRate.value = this._playbackRate;
    }
  }

  getPlaybackRate(): number {
    return this._playbackRate;
  }

  /**
   * Set loop state
   */
  setLoop(loop: boolean): void {
    this._isLooping = loop;
    
    if (this._sourceNode) {
      this._sourceNode.loop = loop;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.disconnectAudioNodes();
    
    // Clear fade timeouts
    this._fadeTimeouts.forEach(timeout => clearTimeout(timeout));
    this._fadeTimeouts.clear();
    
    this.removeAllListeners();
  }
}