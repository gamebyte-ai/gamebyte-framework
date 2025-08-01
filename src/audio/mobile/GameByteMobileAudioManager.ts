import { EventEmitter } from 'eventemitter3';
import {
  MobileAudioManager,
  MobileAudioConfig,
  AudioManager,
  AudioPerformanceMetrics,
  AudioInterruption,
  AudioEvents,
  AudioPerformanceTier
} from '../../contracts/Audio';

/**
 * Device capability information
 */
interface DeviceCapabilities {
  maxChannels: number;
  sampleRate: number;
  latency: number;
  hardwareAcceleration: boolean;
  supportsWebAudio: boolean;
  supportsSpatialAudio: boolean;
  batteryAPI: boolean;
  thermalAPI: boolean;
}

/**
 * Battery status information
 */
interface BatteryStatus {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

/**
 * Thermal management state
 */
type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical';

/**
 * App state for background audio handling
 */
type AppState = 'active' | 'background' | 'suspended';

/**
 * Audio session configuration for mobile platforms
 */
interface AudioSessionConfig {
  category: 'ambient' | 'playback' | 'record' | 'playAndRecord';
  mode: 'default' | 'gameChat' | 'measurement' | 'moviePlayback';
  options: string[];
}

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
  memoryLimit: 64,
  cpuLimit: 15
};

/**
 * GameByte Mobile Audio Manager - Device-specific audio optimizations
 * 
 * Features:
 * - Intelligent background audio handling with app state management
 * - Comprehensive interruption management (calls, notifications, system sounds)
 * - Advanced battery optimization with adaptive performance scaling
 * - Thermal throttling and hardware acceleration management
 * - Device-specific optimizations for iOS and Android
 * - Real-time performance monitoring and automatic quality adjustment
 * - Web Audio API fallbacks and compatibility layers
 */
export class GameByteMobileAudioManager extends EventEmitter<AudioEvents> implements MobileAudioManager {
  private _config: MobileAudioConfig;
  private _audioManager: AudioManager;
  private _deviceCapabilities!: DeviceCapabilities;
  private _performanceMetrics: AudioPerformanceMetrics;
  
  // App state management
  private _currentAppState: AppState = 'active';
  private _wasPlayingBeforeBackground = false;
  private _backgroundAudioEnabled = false;
  
  // Interruption handling
  private _interruptionHandler: ((type: AudioInterruption, action: 'begin' | 'end') => void) | null = null;
  private _activeInterruptions = new Set<AudioInterruption>();
  private _audioStateBeforeInterruption: {
    masterVolume: number;
    musicPlaying: boolean;
    sfxEnabled: boolean;
  } | null = null;
  
  // Battery and thermal management
  private _batteryStatus: BatteryStatus | null = null;
  private _thermalState: ThermalState = 'nominal';
  private _batteryMonitorInterval: number | null = null;
  private _thermalMonitorInterval: number | null = null;
  
  // Performance adaptation
  private _performanceMonitorInterval: number | null = null;
  private _lastPerformanceUpdate = 0;
  private _performanceHistory: number[] = [];
  
  // Hardware optimization
  private _hardwareAccelerationEnabled = true;
  private _originalConfig: Partial<MobileAudioConfig> = {};
  
  // Platform detection
  private _platform: 'ios' | 'android' | 'web' = 'web';
  private _isWebView = false;

  constructor(config: Partial<MobileAudioConfig>, audioManager: AudioManager) {
    super();
    
    this._config = { ...DEFAULT_MOBILE_CONFIG, ...config };
    this._audioManager = audioManager;
    this._originalConfig = { ...this._config };
    
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
    
    // Detect platform and device capabilities
    this.detectPlatform();
    this.detectDeviceCapabilities();
  }

  get config(): MobileAudioConfig {
    return { ...this._config };
  }

  get performanceMetrics(): AudioPerformanceMetrics {
    return { ...this._performanceMetrics };
  }

  /**
   * Initialize the mobile audio manager
   */
  async initialize(): Promise<void> {
    try {
      // Setup platform-specific optimizations
      await this.setupPlatformOptimizations();
      
      // Initialize battery monitoring
      this.initializeBatteryMonitoring();
      
      // Initialize thermal monitoring
      this.initializeThermalMonitoring();
      
      // Setup interruption handling
      this.setupInterruptionHandling();
      
      // Setup app state change handling
      this.setupAppStateHandling();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Apply initial optimizations
      this.optimizeForDevice();
      
      this.emit('mobile:initialized', {
        platform: this._platform,
        capabilities: this._deviceCapabilities
      } as any);
      
    } catch (error) {
      console.error('Mobile audio manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect the current platform
   */
  private detectPlatform(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check for iOS
    if (/iphone|ipad|ipod/.test(userAgent)) {
      this._platform = 'ios';
    }
    // Check for Android
    else if (/android/.test(userAgent)) {
      this._platform = 'android';
    }
    // Default to web
    else {
      this._platform = 'web';
    }
    
    // Check if running in a WebView
    this._isWebView = /; wv\)|webview/.test(userAgent) || 
                     (window as any).ReactNativeWebView !== undefined ||
                     (window as any).webkit?.messageHandlers !== undefined;
  }

  /**
   * Detect device audio capabilities
   */
  private detectDeviceCapabilities(): void {
    const audioContext = this._audioManager.context;
    
    this._deviceCapabilities = {
      maxChannels: audioContext.destination.maxChannelCount || 2,
      sampleRate: audioContext.sampleRate || 44100,
      latency: audioContext.baseLatency || 0,
      hardwareAcceleration: this.detectHardwareAcceleration(),
      supportsWebAudio: !!(window.AudioContext || (window as any).webkitAudioContext),
      supportsSpatialAudio: this.detectSpatialAudioSupport(),
      batteryAPI: 'getBattery' in navigator,
      thermalAPI: 'thermal' in navigator
    };
  }

  /**
   * Detect hardware acceleration support
   */
  private detectHardwareAcceleration(): boolean {
    // Check for WebGL support as a proxy for hardware acceleration
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect spatial audio support
   */
  private detectSpatialAudioSupport(): boolean {
    const audioContext = this._audioManager.context;
    return !!(audioContext.listener && 'positionX' in audioContext.listener);
  }

  /**
   * Setup platform-specific optimizations
   */
  private async setupPlatformOptimizations(): Promise<void> {
    switch (this._platform) {
      case 'ios':
        await this.setupIOSOptimizations();
        break;
      case 'android':
        await this.setupAndroidOptimizations();
        break;
      case 'web':
        await this.setupWebOptimizations();
        break;
    }
  }

  /**
   * Setup iOS-specific optimizations
   */
  private async setupIOSOptimizations(): Promise<void> {
    // iOS requires user interaction to unlock audio
    this.setupIOSAudioUnlock();
    
    // Configure audio session for iOS
    if (this._isWebView) {
      this.configureIOSAudioSession();
    }
    
    // Optimize for iOS battery life
    if (this._config.batteryOptimization) {
      this._config.maxConcurrentSounds = Math.min(this._config.maxConcurrentSounds, 16);
      this._config.memoryLimit = Math.min(this._config.memoryLimit, 32);
    }
  }

  /**
   * Setup audio unlock for iOS
   */
  private setupIOSAudioUnlock(): void {
    const unlockAudio = async () => {
      const audioContext = this._audioManager.context;
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
          
          // Remove listeners after successful unlock
          document.removeEventListener('touchstart', unlockAudio);
          document.removeEventListener('touchend', unlockAudio);
          
          this.emit('audio:unlocked', {
            platform: 'ios'
          } as any);
        } catch (error) {
          console.warn('Failed to unlock iOS audio:', error);
        }
      }
    };
    
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('touchend', unlockAudio, { passive: true });
  }

  /**
   * Configure iOS audio session
   */
  private configureIOSAudioSession(): void {
    // This would require native iOS integration
    // For web context, we can only make suggestions
    console.log('iOS audio session configuration suggested');
  }

  /**
   * Setup Android-specific optimizations
   */
  private async setupAndroidOptimizations(): Promise<void> {
    // Android-specific audio optimizations
    if (this._config.batteryOptimization) {
      this.setupAndroidBatteryOptimization();
    }
    
    // Handle Android audio focus
    this.setupAndroidAudioFocus();
    
    // Optimize for various Android device capabilities
    this.optimizeForAndroidDevice();
  }

  /**
   * Setup Android battery optimization
   */
  private setupAndroidBatteryOptimization(): void {
    // Reduce audio processing on low battery
    this.on('battery:low', () => {
      this._config.maxConcurrentSounds = Math.floor(this._config.maxConcurrentSounds * 0.7);
      this._config.memoryLimit = Math.floor(this._config.memoryLimit * 0.8);
    });
  }

  /**
   * Setup Android audio focus handling
   */
  private setupAndroidAudioFocus(): void {
    // Android audio focus would be handled through native integration
    // For web context, we simulate with page visibility
    this.setupPageVisibilityHandling();
  }

  /**
   * Optimize for Android device variations
   */
  private optimizeForAndroidDevice(): void {
    // Detect device performance tier based on hardware
    const memory = (navigator as any).deviceMemory || 2;
    const cores = navigator.hardwareConcurrency || 2;
    
    if (memory < 2 || cores < 4) {
      // Low-end device optimizations
      this._config.maxConcurrentSounds = Math.min(this._config.maxConcurrentSounds, 8);
      this._config.memoryLimit = Math.min(this._config.memoryLimit, 16);
      this._config.adaptiveQuality = true;
    }
  }

  /**
   * Setup web-specific optimizations
   */
  private async setupWebOptimizations(): Promise<void> {
    // Web-specific audio handling
    this.setupPageVisibilityHandling();
    
    // Handle tab switching
    this.setupTabSwitchHandling();
    
    // Setup web-based interruption simulation
    this.setupWebInterruptionHandling();
  }

  /**
   * Setup page visibility handling
   */
  private setupPageVisibilityHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleAppStateChange('background');
      } else {
        this.handleAppStateChange('active');
      }
    });
  }

  /**
   * Setup tab switching handling
   */
  private setupTabSwitchHandling(): void {
    window.addEventListener('blur', () => {
      this.handleAppStateChange('background');
    });
    
    window.addEventListener('focus', () => {
      this.handleAppStateChange('active');
    });
  }

  /**
   * Setup web-based interruption handling
   */
  private setupWebInterruptionHandling(): void {
    // Simulate interruptions for web context
    // In a real implementation, this might integrate with notification APIs
  }

  /**
   * Initialize battery monitoring
   */
  private initializeBatteryMonitoring(): void {
    if (!this._config.batteryOptimization || !this._deviceCapabilities.batteryAPI) {
      return;
    }
    
    // Modern battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this._batteryStatus = {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
        
        // Setup battery event listeners
        battery.addEventListener('levelchange', () => {
          this._batteryStatus!.level = battery.level;
          this.handleBatteryChange();
        });
        
        battery.addEventListener('chargingchange', () => {
          this._batteryStatus!.charging = battery.charging;
          this.handleBatteryChange();
        });
        
        this.handleBatteryChange();
      }).catch(() => {
        console.warn('Battery API not available');
      });
    }
  }

  /**
   * Handle battery level changes
   */
  private handleBatteryChange(): void {
    if (!this._batteryStatus) return;
    
    const level = this._batteryStatus.level;
    const charging = this._batteryStatus.charging;
    
    // Adjust performance based on battery level
    if (level < 0.2 && !charging) {
      // Critical battery level
      this.enableAggressiveBatteryOptimization();
      this.emit('battery:critical', { level } as any);
    } else if (level < 0.5 && !charging) {
      // Low battery level
      this.enableStandardBatteryOptimization();
      this.emit('battery:low', { level } as any);
    } else {
      // Normal battery level
      this.disableBatteryOptimization();
      this.emit('battery:normal', { level } as any);
    }
  }

  /**
   * Enable aggressive battery optimization
   */
  private enableAggressiveBatteryOptimization(): void {
    this._config.maxConcurrentSounds = Math.min(this._originalConfig.maxConcurrentSounds || 32, 4);
    this._config.memoryLimit = Math.min(this._originalConfig.memoryLimit || 64, 8);
    this._config.cpuLimit = Math.min(this._originalConfig.cpuLimit || 15, 5);
    
    // Reduce spatial audio processing
    const spatialSystem = this._audioManager.getSpatialAudioSystem();
    if (spatialSystem) {
      spatialSystem.enableHRTF(false);
    }
  }

  /**
   * Enable standard battery optimization
   */
  private enableStandardBatteryOptimization(): void {
    this._config.maxConcurrentSounds = Math.floor((this._originalConfig.maxConcurrentSounds || 32) * 0.7);
    this._config.memoryLimit = Math.floor((this._originalConfig.memoryLimit || 64) * 0.8);
    this._config.cpuLimit = Math.floor((this._originalConfig.cpuLimit || 15) * 0.8);
  }

  /**
   * Disable battery optimization
   */
  private disableBatteryOptimization(): void {
    this._config.maxConcurrentSounds = this._originalConfig.maxConcurrentSounds || 32;
    this._config.memoryLimit = this._originalConfig.memoryLimit || 64;
    this._config.cpuLimit = this._originalConfig.cpuLimit || 15;
    
    // Re-enable spatial audio processing
    const spatialSystem = this._audioManager.getSpatialAudioSystem();
    if (spatialSystem && this._originalConfig.hardwareAcceleration) {
      spatialSystem.enableHRTF(true);
    }
  }

  /**
   * Initialize thermal monitoring
   */
  private initializeThermalMonitoring(): void {
    // Check for thermal API support
    if ('thermal' in navigator) {
      // Modern thermal API (experimental)
      (navigator as any).thermal.addEventListener('change', (event: any) => {
        this._thermalState = event.state;
        this.handleThermalStateChange();
      });
    } else {
      // Simulate thermal monitoring based on performance
      this._thermalMonitorInterval = window.setInterval(() => {
        this.estimateThermalState();
      }, 5000); // Check every 5 seconds
    }
  }

  /**
   * Handle thermal state changes
   */
  private handleThermalStateChange(): void {
    this._performanceMetrics.thermalState = this._thermalState;
    
    switch (this._thermalState) {
      case 'critical':
        this.enableCriticalThermalThrottling();
        this.emit('thermal:critical', { state: this._thermalState } as any);
        break;
      case 'serious':
        this.enableSeriousThermalThrottling();
        this.emit('thermal:serious', { state: this._thermalState } as any);
        break;
      case 'fair':
        this.enableModerateThermalThrottling();
        this.emit('thermal:fair', { state: this._thermalState } as any);
        break;
      case 'nominal':
      default:
        this.disableThermalThrottling();
        this.emit('thermal:nominal', { state: this._thermalState } as any);
        break;
    }
  }

  /**
   * Estimate thermal state based on performance metrics
   */
  private estimateThermalState(): void {
    const cpuUsage = this._performanceMetrics.cpuUsage;
    
    if (cpuUsage > 80) {
      this._thermalState = 'critical';
    } else if (cpuUsage > 60) {
      this._thermalState = 'serious';
    } else if (cpuUsage > 40) {
      this._thermalState = 'fair';
    } else {
      this._thermalState = 'nominal';
    }
    
    this.handleThermalStateChange();
  }

  /**
   * Enable critical thermal throttling
   */
  private enableCriticalThermalThrottling(): void {
    this._config.maxConcurrentSounds = Math.min(this._config.maxConcurrentSounds, 2);
    this._config.memoryLimit = Math.min(this._config.memoryLimit, 8);
    
    // Disable spatial audio
    const spatialSystem = this._audioManager.getSpatialAudioSystem();
    if (spatialSystem) {
      spatialSystem.enableHRTF(false);
    }
    
    // Reduce music quality
    const musicSystem = this._audioManager.getMusicSystem();
    if (musicSystem && musicSystem.isPlaying) {
      // Disable non-essential layers
      musicSystem.activeLayers.forEach(layer => {
        if (layer !== 'main') {
          musicSystem.disableLayer(layer, 1.0);
        }
      });
    }
  }

  /**
   * Enable serious thermal throttling
   */
  private enableSeriousThermalThrottling(): void {
    this._config.maxConcurrentSounds = Math.floor(this._originalConfig.maxConcurrentSounds! * 0.3);
    this._config.memoryLimit = Math.floor(this._originalConfig.memoryLimit! * 0.5);
  }

  /**
   * Enable moderate thermal throttling
   */
  private enableModerateThermalThrottling(): void {
    this._config.maxConcurrentSounds = Math.floor(this._originalConfig.maxConcurrentSounds! * 0.7);
    this._config.memoryLimit = Math.floor(this._originalConfig.memoryLimit! * 0.8);
  }

  /**
   * Disable thermal throttling
   */
  private disableThermalThrottling(): void {
    this._config.maxConcurrentSounds = this._originalConfig.maxConcurrentSounds!;
    this._config.memoryLimit = this._originalConfig.memoryLimit!;
  }

  /**
   * Setup interruption handling
   */
  private setupInterruptionHandling(): void {
    // Handle phone calls (simulated for web)
    if ('onbeforecallstart' in window) {
      (window as any).onbeforecallstart = () => {
        this.handleInterruption(AudioInterruption.PHONE_CALL, 'begin');
      };
    }
    
    // Handle notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      // Listen for visibility changes that might indicate notifications
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.handleInterruption(AudioInterruption.NOTIFICATION, 'begin');
        } else {
          this.handleInterruption(AudioInterruption.NOTIFICATION, 'end');
        }
      });
    }
  }

  /**
   * Setup app state change handling
   */
  private setupAppStateHandling(): void {
    // Already handled in platform-specific setup
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
      this.adaptToPerformance(this._performanceMetrics);
    }, 1000); // Update every second
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const audioMetrics = this._audioManager.getPerformanceMetrics();
    
    this._performanceMetrics = {
      ...audioMetrics,
      thermalState: this._thermalState,
      batteryLevel: this._batteryStatus?.level
    };
    
    // Track performance history for trend analysis
    this._performanceHistory.push(this._performanceMetrics.cpuUsage);
    if (this._performanceHistory.length > 60) {
      this._performanceHistory.shift(); // Keep last 60 seconds
    }
  }

  // Background audio handling
  handleAppStateChange(state: AppState): void {
    const previousState = this._currentAppState;
    this._currentAppState = state;
    
    switch (state) {
      case 'background':
        this.handleAppGoingBackground();
        break;
      case 'suspended':
        this.handleAppSuspended();
        break;
      case 'active':
        this.handleAppReturningActive(previousState);
        break;
    }
    
    this.emit('app:state-change', {
      previous: previousState,
      current: state
    } as any);
  }

  /**
   * Handle app going to background
   */
  private handleAppGoingBackground(): void {
    const musicSystem = this._audioManager.getMusicSystem();
    const sfxSystem = this._audioManager.getSFXSystem();
    
    if (this._backgroundAudioEnabled) {
      // Keep music playing, stop SFX
      this._wasPlayingBeforeBackground = musicSystem.isPlaying;
      // SFX typically stops in background
    } else {
      // Stop all audio
      this._wasPlayingBeforeBackground = musicSystem.isPlaying;
      if (musicSystem.isPlaying) {
        musicSystem.pauseTrack();
      }
    }
  }

  /**
   * Handle app suspended
   */
  private handleAppSuspended(): void {
    // Force stop all audio when suspended
    const musicSystem = this._audioManager.getMusicSystem();
    if (musicSystem.isPlaying) {
      musicSystem.pauseTrack();
    }
  }

  /**
   * Handle app returning to active state
   */
  private handleAppReturningActive(previousState: AppState): void {
    if (previousState === 'background' || previousState === 'suspended') {
      const musicSystem = this._audioManager.getMusicSystem();
      
      if (this._wasPlayingBeforeBackground && !musicSystem.isPlaying) {
        musicSystem.resumeTrack();
      }
      
      this._wasPlayingBeforeBackground = false;
    }
  }

  enableBackgroundAudio(enabled: boolean): void {
    this._backgroundAudioEnabled = enabled;
    this._config.backgroundAudio = enabled;
    
    this.emit('background-audio:toggled', {
      enabled
    } as any);
  }

  isBackgroundAudioEnabled(): boolean {
    return this._backgroundAudioEnabled;
  }

  // Interruption handling
  handleInterruption(type: AudioInterruption, action: 'begin' | 'end'): void {
    if (action === 'begin') {
      this._activeInterruptions.add(type);
      
      if (this._activeInterruptions.size === 1) {
        // First interruption - save audio state
        this.saveAudioStateBeforeInterruption();
      }
      
      this.applyInterruptionBehavior(type);
    } else {
      this._activeInterruptions.delete(type);
      
      if (this._activeInterruptions.size === 0) {
        // Last interruption ended - restore audio state
        this.restoreAudioStateAfterInterruption();
      }
    }
    
    // Call custom interruption handler if set
    if (this._interruptionHandler) {
      this._interruptionHandler(type, action);
    }
    
    this.emit('audio:interruption', { type, action });
  }

  /**
   * Save audio state before interruption
   */
  private saveAudioStateBeforeInterruption(): void {
    const musicSystem = this._audioManager.getMusicSystem();
    
    this._audioStateBeforeInterruption = {
      masterVolume: this._audioManager.getMasterVolume(),
      musicPlaying: musicSystem.isPlaying,
      sfxEnabled: true // Assume SFX was enabled
    };
  }

  /**
   * Apply interruption-specific behavior
   */
  private applyInterruptionBehavior(type: AudioInterruption): void {
    const musicSystem = this._audioManager.getMusicSystem();
    
    switch (type) {
      case AudioInterruption.PHONE_CALL:
        // Pause all audio during phone calls
        if (musicSystem.isPlaying) {
          musicSystem.pauseTrack();
        }
        this._audioManager.setMasterMuted(true);
        break;
        
      case AudioInterruption.NOTIFICATION:
        // Temporarily duck audio volume
        this._audioManager.setMasterVolume(0.3, 0.1);
        break;
        
      case AudioInterruption.SYSTEM_SOUND:
        // Brief duck
        this._audioManager.setMasterVolume(0.5, 0.05);
        break;
        
      case AudioInterruption.OTHER_APP:
        // Pause music, keep SFX
        if (musicSystem.isPlaying) {
          musicSystem.pauseTrack();
        }
        break;
        
      case AudioInterruption.HARDWARE:
        // Handle hardware-based interruptions
        this._audioManager.setMasterMuted(true);
        break;
    }
  }

  /**
   * Restore audio state after interruption
   */
  private restoreAudioStateAfterInterruption(): void {
    if (!this._audioStateBeforeInterruption) return;
    
    const musicSystem = this._audioManager.getMusicSystem();
    const state = this._audioStateBeforeInterruption;
    
    // Restore master volume
    this._audioManager.setMasterVolume(state.masterVolume, 0.2);
    this._audioManager.setMasterMuted(false);
    
    // Restore music playback
    if (state.musicPlaying && !musicSystem.isPlaying) {
      setTimeout(() => {
        musicSystem.resumeTrack();
      }, 200); // Small delay for smooth transition
    }
    
    this._audioStateBeforeInterruption = null;
  }

  setInterruptionHandler(handler: (type: AudioInterruption, action: 'begin' | 'end') => void): void {
    this._interruptionHandler = handler;
  }

  // Performance optimization
  adaptToPerformance(metrics: AudioPerformanceMetrics): void {
    const now = Date.now();
    if (now - this._lastPerformanceUpdate < 1000) {
      return; // Throttle adaptation
    }
    
    this._lastPerformanceUpdate = now;
    
    // Adapt based on CPU usage
    if (metrics.cpuUsage > this._config.cpuLimit * 0.9) {
      this.reduceCPUUsage();
    } else if (metrics.cpuUsage < this._config.cpuLimit * 0.5) {
      this.increaseCPUUsage();
    }
    
    // Adapt based on memory usage
    if (metrics.memoryUsage > this._config.memoryLimit * 0.9) {
      this.reduceMemoryUsage();
    }
    
    // Emit performance warning if needed
    if (metrics.cpuUsage > this._config.cpuLimit || 
        metrics.memoryUsage > this._config.memoryLimit) {
      this.emit('audio:performance-warning', {
        metric: 'resource-limit',
        value: Math.max(metrics.cpuUsage, metrics.memoryUsage),
        threshold: Math.max(this._config.cpuLimit, this._config.memoryLimit)
      });
    }
  }

  /**
   * Reduce CPU usage by limiting audio processing
   */
  private reduceCPUUsage(): void {
    this._config.maxConcurrentSounds = Math.max(4, this._config.maxConcurrentSounds - 2);
    
    // Reduce spatial audio quality
    const spatialSystem = this._audioManager.getSpatialAudioSystem();
    if (spatialSystem) {
      spatialSystem.enableHRTF(false);
    }
  }

  /**
   * Increase CPU usage when resources are available
   */
  private increaseCPUUsage(): void {
    if (this._config.maxConcurrentSounds < this._originalConfig.maxConcurrentSounds!) {
      this._config.maxConcurrentSounds = Math.min(
        this._originalConfig.maxConcurrentSounds!,
        this._config.maxConcurrentSounds + 2
      );
    }
    
    // Re-enable spatial audio if originally enabled
    if (this._originalConfig.hardwareAcceleration) {
      const spatialSystem = this._audioManager.getSpatialAudioSystem();
      if (spatialSystem) {
        spatialSystem.enableHRTF(true);
      }
    }
  }

  /**
   * Reduce memory usage
   */
  private reduceMemoryUsage(): void {
    // Ask SFX system to clean up pools
    const sfxSystem = this._audioManager.getSFXSystem();
    if (sfxSystem && 'stopLowPrioritySounds' in sfxSystem) {
      (sfxSystem as any).stopLowPrioritySounds();
    }
  }

  enableBatteryOptimization(enabled: boolean): void {
    this._config.batteryOptimization = enabled;
    
    if (enabled) {
      this.handleBatteryChange();
    } else {
      this.disableBatteryOptimization();
    }
  }
  
  isBatteryOptimizationEnabled(): boolean {
    return this._config.batteryOptimization;
  }

  setThermalThrottling(enabled: boolean): void {
    if (enabled) {
      this.initializeThermalMonitoring();
    } else {
      if (this._thermalMonitorInterval) {
        clearInterval(this._thermalMonitorInterval);
        this._thermalMonitorInterval = null;
      }
      this.disableThermalThrottling();
    }
  }

  // Hardware optimization
  enableHardwareAcceleration(enabled: boolean): void {
    this._hardwareAccelerationEnabled = enabled;
    this._config.hardwareAcceleration = enabled;
    
    // Apply hardware acceleration settings
    const spatialSystem = this._audioManager.getSpatialAudioSystem();
    if (spatialSystem) {
      spatialSystem.enableHRTF(enabled && this._deviceCapabilities.supportsSpatialAudio);
    }
  }

  optimizeForDevice(): void {
    const tier = this._audioManager.performanceTier;
    
    switch (tier) {
      case AudioPerformanceTier.LOW:
        this.applyLowEndOptimizations();
        break;
      case AudioPerformanceTier.MEDIUM:
        this.applyMidRangeOptimizations();
        break;
      case AudioPerformanceTier.HIGH:
        this.applyHighEndOptimizations();
        break;
      case AudioPerformanceTier.PREMIUM:
        this.applyPremiumOptimizations();
        break;
    }
  }

  /**
   * Apply optimizations for low-end devices
   */
  private applyLowEndOptimizations(): void {
    this._config.maxConcurrentSounds = Math.min(this._config.maxConcurrentSounds, 8);
    this._config.memoryLimit = Math.min(this._config.memoryLimit, 16);
    this._config.adaptiveQuality = true;
    this.enableHardwareAcceleration(false);
  }

  /**
   * Apply optimizations for mid-range devices
   */
  private applyMidRangeOptimizations(): void {
    this._config.maxConcurrentSounds = Math.min(this._config.maxConcurrentSounds, 16);
    this._config.memoryLimit = Math.min(this._config.memoryLimit, 32);
    this.enableHardwareAcceleration(this._deviceCapabilities.hardwareAcceleration);
  }

  /**
   * Apply optimizations for high-end devices
   */
  private applyHighEndOptimizations(): void {
    this._config.maxConcurrentSounds = Math.min(this._config.maxConcurrentSounds, 32);
    this._config.memoryLimit = Math.min(this._config.memoryLimit, 64);
    this.enableHardwareAcceleration(true);
  }

  /**
   * Apply optimizations for premium devices
   */
  private applyPremiumOptimizations(): void {
    // No limits for premium devices - use original configuration
    this._config.maxConcurrentSounds = this._originalConfig.maxConcurrentSounds!;
    this._config.memoryLimit = this._originalConfig.memoryLimit!;
    this.enableHardwareAcceleration(true);
  }

  getDeviceCapabilities(): {
    maxChannels: number;
    sampleRate: number;
    latency: number;
    hardwareAcceleration: boolean;
  } {
    return {
      maxChannels: this._deviceCapabilities.maxChannels,
      sampleRate: this._deviceCapabilities.sampleRate,
      latency: this._deviceCapabilities.latency,
      hardwareAcceleration: this._deviceCapabilities.hardwareAcceleration
    };
  }

  /**
   * Get platform-specific information
   */
  getPlatformInfo(): {
    platform: string;
    isWebView: boolean;
    capabilities: DeviceCapabilities;
  } {
    return {
      platform: this._platform,
      isWebView: this._isWebView,
      capabilities: this._deviceCapabilities
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop monitoring intervals
    if (this._batteryMonitorInterval) {
      clearInterval(this._batteryMonitorInterval);
      this._batteryMonitorInterval = null;
    }
    
    if (this._thermalMonitorInterval) {
      clearInterval(this._thermalMonitorInterval);
      this._thermalMonitorInterval = null;
    }
    
    if (this._performanceMonitorInterval) {
      clearInterval(this._performanceMonitorInterval);
      this._performanceMonitorInterval = null;
    }
    
    // Clear collections
    this._activeInterruptions.clear();
    this._performanceHistory.length = 0;
    
    this.removeAllListeners();
  }
}