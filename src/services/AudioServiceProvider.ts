import { AbstractServiceProvider } from '../contracts/ServiceProvider';
import { GameByte } from '../core/GameByte';
import { GameByteAudioManager } from '../audio/core/GameByteAudioManager';
import {
  AudioManager,
  MobileAudioConfig,
  AudioPerformanceTier,
  AudioBusType,
  AudioFadeType,
} from '../contracts/Audio';
import { getAudioConfigForTier, mapToAudioPerformanceTier } from '../config/DeviceConfigurations';
import { Logger } from '../utils/Logger.js';

/**
 * Audio Service Provider for GameByte Framework
 * 
 * Registers and bootstraps the comprehensive audio system including:
 * - Main audio manager with mobile optimization
 * - Music system with adaptive layers
 * - Sound effects system with pooling
 * - Spatial 3D audio system
 * - Mobile-specific optimizations
 * - Audio analytics and performance monitoring
 * - Procedural audio generation
 * - Audio effects processing
 */
export class AudioServiceProvider extends AbstractServiceProvider {
  private audioManager: GameByteAudioManager | null = null;

  /**
   * Register audio services in the container
   */
  register(app: GameByte): void {
    // Register audio manager as singleton
    app.singleton<AudioManager>('audio.manager', () => {
      // Get mobile configuration from app if available
      const mobileConfig = this.getMobileAudioConfig(app);
      
      this.audioManager = new GameByteAudioManager(mobileConfig);
      return this.audioManager;
    });
    
    // Register audio manager with alias
    app.bind('audio', () => app.make<AudioManager>('audio.manager'));
    
    // Register individual audio subsystems for direct access
    app.bind('audio.music', () => {
      const audioManager = app.make<AudioManager>('audio.manager');
      return audioManager.getMusicSystem();
    });
    
    app.bind('audio.sfx', () => {
      const audioManager = app.make<AudioManager>('audio.manager');
      return audioManager.getSFXSystem();
    });
    
    app.bind('audio.spatial', () => {
      const audioManager = app.make<AudioManager>('audio.manager');
      return audioManager.getSpatialAudioSystem();
    });
    
    app.bind('audio.effects', () => {
      const audioManager = app.make<AudioManager>('audio.manager');
      return audioManager.getEffectsProcessor();
    });
    
    app.bind('audio.mobile', () => {
      const audioManager = app.make<AudioManager>('audio.manager');
      return audioManager.getMobileManager();
    });
    
    app.bind('audio.analytics', () => {
      const audioManager = app.make<AudioManager>('audio.manager');
      return audioManager.getAnalyticsSystem();
    });
    
    app.bind('audio.procedural', () => {
      const audioManager = app.make<AudioManager>('audio.manager');
      return audioManager.getProceduralGenerator();
    });
  }

  /**
   * Bootstrap audio services after all providers are registered
   */
  async boot(app: GameByte): Promise<void> {
    try {
      // Initialize the audio manager
      const audioManager = app.make<AudioManager>('audio.manager');
      await audioManager.initialize();
      
      // Setup framework event integration
      this.setupFrameworkIntegration(app, audioManager);
      
      // Setup performance integration
      this.setupPerformanceIntegration(app, audioManager);
      
      // Setup scene integration
      this.setupSceneIntegration(app, audioManager);
      
      // Optimize for detected device
      audioManager.optimizeForDevice();
      
      Logger.info('Audio', `GameByte Audio System initialized (Performance Tier: ${audioManager.performanceTier})`);
      
    } catch (error) {
      Logger.error('Audio', 'Failed to initialize GameByte Audio System:', error);
      throw error;
    }
  }

  /**
   * Get mobile audio configuration based on detected device.
   * Uses centralized DeviceConfigurations for tier-based settings.
   */
  private getMobileAudioConfig(app: GameByte): Partial<MobileAudioConfig> {
    // Try to get performance manager for device detection
    let performanceTier = AudioPerformanceTier.MEDIUM;

    try {
      if (app.getContainer().bound('performance.manager')) {
        const performanceManager = app.make('performance.manager');
        if (performanceManager && performanceManager.getDeviceCapabilities) {
          const capabilities = performanceManager.getDeviceCapabilities();
          performanceTier = mapToAudioPerformanceTier(capabilities.tier);
        }
      }
    } catch {
      // Performance manager not available, use defaults
    }

    // Get tier-based configuration from centralized config
    const tierConfig = getAudioConfigForTier(performanceTier);

    // Base mobile-specific config
    const baseConfig: Partial<MobileAudioConfig> = {
      batteryOptimization: true,
      interruptionHandling: true,
    };

    return {
      ...baseConfig,
      maxConcurrentSounds: tierConfig.maxConcurrentSounds,
      memoryLimit: tierConfig.memoryLimit,
      cpuLimit: tierConfig.cpuLimit,
      backgroundAudio: tierConfig.backgroundAudio,
      adaptiveQuality: tierConfig.adaptiveQuality,
      hardwareAcceleration: tierConfig.hardwareAcceleration,
    };
  }

  /**
   * Setup integration with framework events
   */
  private setupFrameworkIntegration(app: GameByte, audioManager: AudioManager): void {
    // Listen to framework lifecycle events
    app.on('started', () => {
      // Start audio analytics session when game starts
      const analytics = audioManager.getAnalyticsSystem();
      analytics.startSession();
    });
    
    app.on('stopped', () => {
      // End audio analytics session when game stops
      const analytics = audioManager.getAnalyticsSystem();
      analytics.endSession();
    });
    
    app.on('destroyed', () => {
      // Cleanup audio system when framework is destroyed
      audioManager.destroy();
    });
    
    // Handle app state changes for mobile
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        const mobileManager = audioManager.getMobileManager();
        const state = document.hidden ? 'background' : 'active';
        mobileManager.handleAppStateChange(state);
      });
    }
  }

  /**
   * Setup integration with performance system
   */
  private setupPerformanceIntegration(app: GameByte, audioManager: AudioManager): void {
    try {
      if (app.getContainer().bound('performance.manager')) {
        const performanceManager = app.make('performance.manager');
        
        if (performanceManager && performanceManager.on) {
          // Listen to performance warnings
          performanceManager.on('performance:warning', (data: any) => {
            if (data.metric === 'memory' || data.metric === 'cpu') {
              // Adapt audio quality when performance issues detected
              audioManager.adaptToPerformance();
            }
          });
          
          // Listen to device thermal state changes
          performanceManager.on('thermal:state-changed', (data: any) => {
            const mobileManager = audioManager.getMobileManager();
            if (data.state === 'serious' || data.state === 'critical') {
              // Enable aggressive optimization for thermal throttling
              mobileManager.setThermalThrottling(true);
            }
          });
        }
        
        // Share audio performance metrics with performance manager
        audioManager.on('audio:performance-warning', (data) => {
          if (performanceManager && performanceManager.reportWarning) {
            performanceManager.reportWarning({
              system: 'audio',
              metric: data.metric,
              value: data.value,
              threshold: data.threshold
            });
          }
        });
      }
    } catch (error) {
      // Performance integration not available, continue without it
      Logger.warn('Audio', 'Audio-Performance integration not available:', error);
    }
  }

  /**
   * Setup integration with scene system
   */
  private setupSceneIntegration(app: GameByte, audioManager: AudioManager): void {
    try {
      if (app.getContainer().bound('scene.manager')) {
        const sceneManager = app.make('scene.manager');
        
        if (sceneManager && sceneManager.on) {
          // Handle scene transitions
          sceneManager.on('scene:will-change', (data: any) => {
            // Fade out current music before scene change
            const musicSystem = audioManager.getMusicSystem();
            if (musicSystem.isPlaying) {
              // Quick fade out for scene transitions
              musicSystem.stopTrack(0.5);
            }
          });
          
          sceneManager.on('scene:changed', (fromScene: any, toScene: any) => {
            // Update spatial audio listener based on scene camera
            const spatialAudio = audioManager.getSpatialAudioSystem();

            // Reset audio zones for new scene
            spatialAudio.zones.forEach((zone, name) => {
              spatialAudio.removeZone(name);
            });

            // Scene-specific audio setup could be triggered here
            // Example: Load scene-specific audio assets
            // Note: scene:changed passes (fromScene, toScene) as separate params
            if (toScene && toScene.name) {
              this.loadSceneAudio(audioManager, toScene.name);
            }
          });
        }
      }
    } catch (error) {
      Logger.warn('Audio', 'Audio-Scene integration not available:', error);
    }
  }

  /**
   * Load scene-specific audio assets
   */
  private async loadSceneAudio(audioManager: AudioManager, sceneName: string): Promise<void> {
    // Define scene-specific audio assets
    const sceneAudioAssets = {
      'main-menu': [
        { name: 'menu-music', url: '/audio/music/menu-theme.mp3' },
        { name: 'menu-click', url: '/audio/sfx/ui-click.mp3' },
        { name: 'menu-hover', url: '/audio/sfx/ui-hover.mp3' }
      ],
      'gameplay': [
        { name: 'game-music', url: '/audio/music/gameplay-theme.mp3' },
        { name: 'jump-sound', url: '/audio/sfx/jump.mp3' },
        { name: 'collect-sound', url: '/audio/sfx/collect.mp3' },
        { name: 'ambient-forest', url: '/audio/ambient/forest.mp3' }
      ],
      'battle': [
        { name: 'battle-music', url: '/audio/music/battle-theme.mp3' },
        { name: 'sword-clash', url: '/audio/sfx/sword-clash.mp3' },
        { name: 'magic-cast', url: '/audio/sfx/magic-cast.mp3' }
      ]
    };
    
    const assets = sceneAudioAssets[sceneName as keyof typeof sceneAudioAssets];
    if (assets) {
      try {
        // Preload scene-specific audio assets
        await audioManager.preloadAudio(assets);
        
        // Setup default music for scene
        const musicSystem = audioManager.getMusicSystem();
        const musicAsset = assets.find(asset => asset.name.includes('music'));
        
        if (musicAsset) {
          // Load and configure scene music
          await musicSystem.loadTrack(sceneName, musicAsset.url, {
            loop: { enabled: true, seamless: true },
            crossfade: { enabled: true, duration: 1.0, curve: AudioFadeType.LINEAR }
          });
          
          // Start playing scene music with fade in
          await musicSystem.playTrack(sceneName, 1.0);
        }
        
      } catch (error) {
        Logger.warn('Audio', `Failed to load audio assets for scene '${sceneName}':`, error);
      }
    }
  }

  /**
   * Services provided by this provider
   */
  provides(): string[] {
    return [
      'audio.manager',
      'audio',
      'audio.music',
      'audio.sfx',
      'audio.spatial',
      'audio.effects',
      'audio.mobile',
      'audio.analytics',
      'audio.procedural'
    ];
  }

  /**
   * Get the audio manager instance
   */
  getAudioManager(): GameByteAudioManager | null {
    return this.audioManager;
  }

  /**
   * Create default audio buses configuration
   */
  static getDefaultBusConfiguration() {
    return [
      {
        name: 'master',
        type: AudioBusType.MASTER,
        volume: 1.0,
        muted: false,
        solo: false
      },
      {
        name: 'music',
        type: AudioBusType.MUSIC,
        volume: 0.8,
        muted: false,
        solo: false,
        effects: {
          compressor: {
            threshold: -18,
            knee: 12,
            ratio: 4,
            attack: 0.01,
            release: 0.1
          }
        }
      },
      {
        name: 'sfx',
        type: AudioBusType.SFX,
        volume: 1.0,
        muted: false,
        solo: false,
        effects: {
          limiter: {
            threshold: -3,
            lookAhead: 0.005,
            release: 0.1
          }
        }
      },
      {
        name: 'voice',
        type: AudioBusType.VOICE,
        volume: 1.0,
        muted: false,
        solo: false,
        effects: {
          compressor: {
            threshold: -12,
            knee: 6,
            ratio: 6,
            attack: 0.005,
            release: 0.05
          },
          filter: {
            type: 'highpass',
            frequency: 80,
            Q: 1
          }
        }
      },
      {
        name: 'ui',
        type: AudioBusType.UI,
        volume: 0.7,
        muted: false,
        solo: false
      },
      {
        name: 'ambient',
        type: AudioBusType.AMBIENT,
        volume: 0.6,
        muted: false,
        solo: false,
        effects: {
          filter: {
            type: 'lowpass',
            frequency: 8000,
            Q: 1
          }
        }
      }
    ];
  }
}