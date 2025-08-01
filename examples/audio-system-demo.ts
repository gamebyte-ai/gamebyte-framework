/**
 * GameByte Framework - Comprehensive Audio System Demo
 * 
 * This example demonstrates all the advanced features of the GameByte Audio System:
 * - Music system with adaptive layers and crossfading
 * - Sound effects with pooling and spatial positioning
 * - 3D spatial audio with environmental zones
 * - Mobile optimizations and performance monitoring
 * - Audio analytics and user preference tracking
 * - Procedural audio generation
 * - Professional audio effects processing
 */

import {
  createMobileGame,
  Audio,
  RenderingMode,
  AudioEnvironment,
  AudioQuality,
  AudioPerformanceTier
} from 'gamebyte-framework';

/**
 * Audio System Demo Application
 */
class AudioSystemDemo {
  private app: any;
  private canvas: HTMLCanvasElement;
  private currentScene: 'menu' | 'gameplay' | 'battle' = 'menu';
  private playerPosition = { x: 0, y: 0, z: 0 };
  private isRunning = false;

  constructor() {
    this.canvas = this.createCanvas();
    this.setupUI();
  }

  /**
   * Initialize the demo application
   */
  async initialize(): Promise<void> {
    console.log('🎵 Initializing GameByte Audio System Demo...');

    // Create GameByte app with all systems including audio
    this.app = createMobileGame();
    
    // Initialize the framework
    await this.app.initialize(this.canvas, RenderingMode.MODE_2D, {
      backgroundColor: 0x1a1a2e,
      antialias: true
    });

    // Wait for audio system to be ready
    console.log('🔊 Audio System Status:', {
      initialized: Audio.isInitialized(),
      performanceTier: Audio.getPerformanceTier(),
      metrics: Audio.getPerformanceMetrics()
    });

    // Load audio assets
    await this.loadAudioAssets();

    // Setup audio system features
    await this.setupAudioSystem();

    // Setup spatial audio
    this.setupSpatialAudio();

    // Setup music system
    await this.setupMusicSystem();

    // Setup procedural audio
    this.setupProceduralAudio();

    // Start the application
    this.app.start();
    this.isRunning = true;

    console.log('🎮 GameByte Audio System Demo is ready!');
    this.startDemoLoop();
  }

  /**
   * Create canvas element
   */
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.border = '2px solid #333';
    canvas.style.backgroundColor = '#1a1a2e';
    
    document.body.appendChild(canvas);
    return canvas;
  }

  /**
   * Setup demo UI controls
   */
  private setupUI(): void {
    const controlPanel = document.createElement('div');
    controlPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      min-width: 300px;
      z-index: 1000;
    `;

    controlPanel.innerHTML = `
      <h3>🎵 Audio System Controls</h3>
      
      <div style="margin: 10px 0;">
        <label>Master Volume: <span id="master-volume-display">100%</span></label>
        <input type="range" id="master-volume" min="0" max="100" value="100" style="width: 100%;">
      </div>
      
      <div style="margin: 10px 0;">
        <label>Music Volume: <span id="music-volume-display">80%</span></label>
        <input type="range" id="music-volume" min="0" max="100" value="80" style="width: 100%;">
      </div>
      
      <div style="margin: 10px 0;">
        <label>SFX Volume: <span id="sfx-volume-display">100%</span></label>
        <input type="range" id="sfx-volume" min="0" max="100" value="100" style="width: 100%;">
      </div>
      
      <div style="margin: 15px 0;">
        <button id="play-music">🎵 Play Music</button>
        <button id="stop-music">⏹️ Stop Music</button>
      </div>
      
      <div style="margin: 10px 0;">
        <button id="play-sfx">🔊 Play SFX</button>
        <button id="play-spatial">🌍 Spatial Audio</button>
      </div>
      
      <div style="margin: 10px 0;">
        <button id="switch-scene">🎬 Switch Scene</button>
        <button id="generate-audio">🛠️ Generate Audio</button>
      </div>
      
      <div style="margin: 15px 0;">
        <h4>Current Scene: <span id="current-scene">Menu</span></h4>
        <h4>Performance: <span id="performance-tier">Loading...</span></h4>
      </div>
      
      <div style="margin: 10px 0;">
        <h4>Audio Analytics:</h4>
        <div id="analytics-display" style="font-size: 12px; color: #aaa;"></div>
      </div>
    `;

    document.body.appendChild(controlPanel);
    this.setupEventListeners();
  }

  /**
   * Setup UI event listeners
   */
  private setupEventListeners(): void {
    // Volume controls
    document.getElementById('master-volume')?.addEventListener('input', (e) => {
      const volume = parseInt((e.target as HTMLInputElement).value) / 100;
      Audio.setMasterVolume(volume, 0.1);
      document.getElementById('master-volume-display')!.textContent = `${Math.round(volume * 100)}%`;
    });

    document.getElementById('music-volume')?.addEventListener('input', (e) => {
      const volume = parseInt((e.target as HTMLInputElement).value) / 100;
      const musicBus = Audio.getBus('music');
      if (musicBus) {
        musicBus.setVolume(volume, 0.1);
      }
      document.getElementById('music-volume-display')!.textContent = `${Math.round(volume * 100)}%`;
    });

    document.getElementById('sfx-volume')?.addEventListener('input', (e) => {
      const volume = parseInt((e.target as HTMLInputElement).value) / 100;
      const sfxBus = Audio.getBus('sfx');
      if (sfxBus) {
        sfxBus.setVolume(volume, 0.1);
      }
      document.getElementById('sfx-volume-display')!.textContent = `${Math.round(volume * 100)}%`;
    });

    // Music controls
    document.getElementById('play-music')?.addEventListener('click', () => {
      this.playCurrentSceneMusic();
    });

    document.getElementById('stop-music')?.addEventListener('click', () => {
      Audio.music.stopTrack(1.0);
    });

    // SFX controls
    document.getElementById('play-sfx')?.addEventListener('click', () => {
      this.playRandomSFX();
    });

    document.getElementById('play-spatial')?.addEventListener('click', () => {
      this.playSpatialAudio();
    });

    // Scene switching
    document.getElementById('switch-scene')?.addEventListener('click', () => {
      this.switchScene();
    });

    // Procedural audio generation
    document.getElementById('generate-audio')?.addEventListener('click', () => {
      this.generateProceduralAudio();
    });
  }

  /**
   * Load all audio assets for the demo
   */
  private async loadAudioAssets(): Promise<void> {
    console.log('📦 Loading audio assets...');

    // Note: In a real application, you would load actual audio files
    // For this demo, we'll use procedurally generated audio or web-compatible samples
    
    const audioAssets = [
      // Music tracks (would be actual URLs in production)
      { name: 'menu-music', url: '/audio/music/menu-theme.mp3' },
      { name: 'gameplay-music', url: '/audio/music/gameplay-theme.mp3' },
      { name: 'battle-music', url: '/audio/music/battle-theme.mp3' },
      
      // Sound effects
      { name: 'button-click', url: '/audio/sfx/button-click.mp3' },
      { name: 'button-hover', url: '/audio/sfx/button-hover.mp3' },
      { name: 'coin-collect', url: '/audio/sfx/coin-collect.mp3' },
      { name: 'jump', url: '/audio/sfx/jump.mp3' },
      { name: 'footsteps', url: '/audio/sfx/footsteps.mp3' },
      { name: 'sword-swing', url: '/audio/sfx/sword-swing.mp3' },
      { name: 'magic-cast', url: '/audio/sfx/magic-cast.mp3' },
      
      // Ambient sounds
      { name: 'forest-ambient', url: '/audio/ambient/forest.mp3' },
      { name: 'cave-ambient', url: '/audio/ambient/cave.mp3' },
      { name: 'water-flowing', url: '/audio/ambient/water.mp3' }
    ];

    try {
      // In a real demo, we would load actual files
      // For now, we'll generate procedural audio for demonstration
      await this.generateDemoAudioAssets();
      
      console.log('✅ Audio assets loaded successfully');
    } catch (error) {
      console.warn('⚠️ Some audio assets failed to load, using procedural alternatives:', error);
      await this.generateDemoAudioAssets();
    }
  }

  /**
   * Generate procedural audio assets for demo
   */
  private async generateDemoAudioAssets(): Promise<void> {
    const procedural = Audio.procedural;
    
    // Generate simple tones for SFX demonstration
    const buttonClickBuffer = procedural.generateTone(800, 0.1, 'square');
    await Audio.loadAudio('button-click', 'data:audio/wav;base64,', { buffer: buttonClickBuffer });
    
    const coinCollectBuffer = procedural.generateChirp(400, 800, 0.3);
    await Audio.loadAudio('coin-collect', 'data:audio/wav;base64,', { buffer: coinCollectBuffer });
    
    const jumpBuffer = procedural.generateTone(300, 0.2, 'sawtooth');
    await Audio.loadAudio('jump', 'data:audio/wav;base64,', { buffer: jumpBuffer });
    
    // Generate noise for ambient sounds
    const forestBuffer = procedural.generateNoise(5.0, 'pink');
    await Audio.loadAudio('forest-ambient', 'data:audio/wav;base64,', { buffer: forestBuffer });
  }

  /**
   * Setup comprehensive audio system features
   */
  private async setupAudioSystem(): Promise<void> {
    console.log('🔧 Setting up audio system features...');

    // Configure mobile optimizations
    Audio.mobile.enableBatteryOptimization(true);
    Audio.mobile.setThermalThrottling(true);
    Audio.mobile.optimizeForDevice();

    // Setup audio analytics
    Audio.analytics.startSession();
    
    // Setup audio event listeners
    this.setupAudioEventListeners();

    // Configure audio buses with effects
    this.setupAudioBuses();

    console.log('✅ Audio system features configured');
  }

  /**
   * Setup audio event listeners for monitoring
   */
  private setupAudioEventListeners(): void {
    Audio.getManager().on('audio:play', (data) => {
      console.log('🔊 Audio started:', data.source.id);
    });

    Audio.getManager().on('audio:performance-warning', (data) => {
      console.warn('⚠️ Audio performance warning:', data);
    });

    Audio.getManager().on('audio:interruption', (data) => {
      console.log('📞 Audio interruption:', data.type, data.action);
    });
  }

  /**
   * Setup audio buses with professional effects
   */
  private setupAudioBuses(): void {
    // Music bus with compression and EQ
    const musicBus = Audio.getBus('music');
    if (musicBus) {
      musicBus.addEffect('compressor', {
        compressor: {
          threshold: -18,
          knee: 12,
          ratio: 4,
          attack: 0.01,
          release: 0.1
        }
      });

      musicBus.addEffect('eq', {
        filter: {
          type: 'highpass',
          frequency: 40,
          Q: 1
        }
      });
    }

    // SFX bus with limiter
    const sfxBus = Audio.getBus('sfx');
    if (sfxBus) {
      sfxBus.addEffect('limiter', {
        limiter: {
          threshold: -3,
          lookAhead: 0.005,
          release: 0.1
        }
      });
    }
  }

  /**
   * Setup spatial audio system with environmental zones
   */
  private setupSpatialAudio(): void {
    console.log('🌍 Setting up spatial audio...');

    // Set initial listener position
    Audio.spatial.setListenerPosition({
      position: this.playerPosition,
      velocity: { x: 0, y: 0, z: 0 },
      orientation: {
        forward: { x: 0, y: 0, z: -1 },
        up: { x: 0, y: 1, z: 0 }
      }
    });

    // Create environmental audio zones
    this.createAudioZones();

    console.log('✅ Spatial audio configured');
  }

  /**
   * Create environmental audio zones
   */
  private createAudioZones(): void {
    // Forest zone
    Audio.spatial.createZone({
      name: 'forest',
      shape: 'sphere',
      position: { x: -20, y: 0, z: 0 },
      size: 15,
      environment: AudioEnvironment.FOREST,
      effects: {
        reverb: {
          roomSize: 0.7,
          damping: 0.6,
          wetness: 0.4,
          dryness: 0.6,
          width: 1.0,
          freezeMode: false
        }
      },
      fadeDistance: 5,
      priority: 1
    });

    // Cave zone
    Audio.spatial.createZone({
      name: 'cave',
      shape: 'sphere',
      position: { x: 20, y: 0, z: 0 },
      size: 12,
      environment: AudioEnvironment.CAVE,
      effects: {
        reverb: {
          roomSize: 0.9,
          damping: 0.2,
          wetness: 0.7,
          dryness: 0.3,
          width: 1.0,
          freezeMode: false
        }
      },
      fadeDistance: 8,
      priority: 2
    });

    // Underwater zone
    Audio.spatial.createZone({
      name: 'underwater',
      shape: 'box',
      position: { x: 0, y: -10, z: 10 },
      size: { x: 30, y: 5, z: 20 },
      environment: AudioEnvironment.UNDERWATER,
      effects: {
        filter: {
          type: 'lowpass',
          frequency: 400,
          Q: 2
        }
      },
      fadeDistance: 3,
      priority: 3
    });
  }

  /**
   * Setup adaptive music system
   */
  private async setupMusicSystem(): Promise<void> {
    console.log('🎵 Setting up music system...');

    // Configure music tracks with adaptive features
    const musicConfigs = {
      'menu-music': {
        loop: { enabled: true, seamless: true },
        crossfade: { enabled: true, duration: 2.0 },
        layers: [
          { name: 'base', volume: 1.0, fadeTime: 1.0 },
          { name: 'ambient', volume: 0.0, fadeTime: 2.0 }
        ]
      },
      'gameplay-music': {
        loop: { enabled: true, seamless: true },
        crossfade: { enabled: true, duration: 1.5 },
        adaptive: {
          enabled: true,
          parameters: [
            { name: 'intensity', value: 0.5, target: 'layers' },
            { name: 'danger', value: 0.0, target: 'effects' }
          ]
        },
        layers: [
          { name: 'calm', volume: 1.0, fadeTime: 1.0 },
          { name: 'tense', volume: 0.0, fadeTime: 1.5 },
          { name: 'action', volume: 0.0, fadeTime: 2.0 }
        ]
      },
      'battle-music': {
        loop: { enabled: true, seamless: true },
        crossfade: { enabled: true, duration: 0.5 },
        layers: [
          { name: 'drums', volume: 1.0, fadeTime: 0.5 },
          { name: 'brass', volume: 0.8, fadeTime: 1.0 },
          { name: 'strings', volume: 0.6, fadeTime: 1.5 }
        ]
      }
    };

    // Load music tracks (in production, these would be actual audio files)
    for (const [trackName, config] of Object.entries(musicConfigs)) {
      try {
        await Audio.music.loadTrack(trackName, `/audio/music/${trackName}.mp3`, config);
      } catch (error) {
        console.warn(`Failed to load ${trackName}, using generated placeholder`);
        // Generate placeholder music
        const buffer = Audio.procedural.generateTone(220, 10, 'sine');
        await Audio.loadAudio(trackName, 'data:audio/wav;base64,', { buffer });
      }
    }

    console.log('✅ Music system configured');
  }

  /**
   * Setup procedural audio generation
   */
  private setupProceduralAudio(): void {
    console.log('🛠️ Setting up procedural audio...');

    // Create granular processor for advanced effects
    try {
      const granularProcessor = Audio.procedural.createGranularProcessor(50, 0.5);
      Audio.procedural.addRealTimeEffect('granular', granularProcessor);
    } catch (error) {
      console.warn('Granular synthesis not available on this device');
    }

    console.log('✅ Procedural audio configured');
  }

  /**
   * Start the demo loop
   */
  private startDemoLoop(): void {
    const updatePerformanceDisplay = () => {
      if (!this.isRunning) return;

      // Update performance display
      const metrics = Audio.getPerformanceMetrics();
      document.getElementById('performance-tier')!.textContent = Audio.getPerformanceTier();

      // Update analytics display
      const analytics = Audio.analytics.getDetailedReport();
      document.getElementById('analytics-display')!.innerHTML = `
        Playtime: ${Math.round(analytics.summary.totalPlaytime / 1000)}s<br>
        CPU Usage: ${metrics.cpuUsage.toFixed(1)}%<br>
        Memory: ${metrics.memoryUsage.toFixed(1)}MB<br>
        Active Sources: ${metrics.activeSources}
      `;

      // Simulate player movement for spatial audio
      this.updatePlayerPosition();

      setTimeout(updatePerformanceDisplay, 1000);
    };

    // Start with menu music
    this.playCurrentSceneMusic();
    
    // Start performance monitoring
    updatePerformanceDisplay();
  }

  /**
   * Update player position for spatial audio demonstration
   */
  private updatePlayerPosition(): void {
    // Simulate circular movement
    const time = Date.now() / 1000;
    this.playerPosition.x = Math.cos(time * 0.1) * 10;
    this.playerPosition.z = Math.sin(time * 0.1) * 10;

    // Update spatial audio listener
    Audio.spatial.setListenerPosition({
      position: this.playerPosition,
      velocity: { 
        x: -Math.sin(time * 0.1) * 10 * 0.1,
        y: 0,
        z: Math.cos(time * 0.1) * 10 * 0.1
      }
    });

    // Update audio zones
    Audio.spatial.updateZones(this.playerPosition);
  }

  /**
   * Play current scene music
   */
  private async playCurrentSceneMusic(): Promise<void> {
    const trackMap = {
      menu: 'menu-music',
      gameplay: 'gameplay-music',
      battle: 'battle-music'
    };

    const trackName = trackMap[this.currentScene];
    
    try {
      if (Audio.music.isPlaying) {
        await Audio.music.crossfadeTo(trackName, 2.0);
      } else {
        await Audio.music.playTrack(trackName, 1.0);
      }
      
      console.log(`🎵 Playing ${trackName}`);
    } catch (error) {
      console.warn(`Failed to play ${trackName}:`, error);
    }
  }

  /**
   * Play random sound effect
   */
  private async playRandomSFX(): Promise<void> {
    const sfxOptions = ['button-click', 'coin-collect', 'jump'];
    const randomSFX = sfxOptions[Math.floor(Math.random() * sfxOptions.length)];
    
    try {
      await Audio.sfx.play(randomSFX, {
        volume: 0.7,
        pitch: 0.8 + Math.random() * 0.4, // Random pitch variation
        bus: 'sfx'
      });
      
      console.log(`🔊 Played ${randomSFX}`);
    } catch (error) {
      console.warn(`Failed to play ${randomSFX}:`, error);
    }
  }

  /**
   * Play spatial audio demonstration
   */
  private async playSpatialAudio(): Promise<void> {
    try {
      // Play footsteps at a random position
      const position = {
        x: (Math.random() - 0.5) * 40,
        y: 0,
        z: (Math.random() - 0.5) * 40
      };

      await Audio.sfx.play('footsteps', {
        position,
        volume: 0.8,
        loop: false,
        bus: 'ambient'
      });

      console.log(`🌍 Spatial audio at position:`, position);
    } catch (error) {
      console.warn('Failed to play spatial audio:', error);
    }
  }

  /**
   * Switch between different scenes
   */
  private switchScene(): void {
    const scenes: Array<'menu' | 'gameplay' | 'battle'> = ['menu', 'gameplay', 'battle'];
    const currentIndex = scenes.indexOf(this.currentScene);
    const nextIndex = (currentIndex + 1) % scenes.length;
    
    this.currentScene = scenes[nextIndex];
    document.getElementById('current-scene')!.textContent = 
      this.currentScene.charAt(0).toUpperCase() + this.currentScene.slice(1);
    
    // Switch music
    this.playCurrentSceneMusic();
    
    // Update adaptive music parameters based on scene
    if (this.currentScene === 'gameplay') {
      Audio.music.setParameter('intensity', Math.random());
      Audio.music.setParameter('danger', Math.random() * 0.5);
    } else if (this.currentScene === 'battle') {
      Audio.music.setParameter('intensity', 1.0);
      Audio.music.setParameter('danger', 1.0);
    }
    
    console.log(`🎬 Switched to ${this.currentScene} scene`);
  }

  /**
   * Generate and play procedural audio
   */
  private generateProceduralAudio(): void {
    const audioTypes = [
      () => {
        const buffer = Audio.procedural.generateTone(
          200 + Math.random() * 400,
          0.5,
          ['sine', 'triangle', 'sawtooth', 'square'][Math.floor(Math.random() * 4)] as OscillatorType
        );
        return { buffer, name: 'generated-tone' };
      },
      () => {
        const buffer = Audio.procedural.generateChirp(
          100 + Math.random() * 200,
          400 + Math.random() * 600,
          1.0
        );
        return { buffer, name: 'generated-chirp' };
      },
      () => {
        const buffer = Audio.procedural.generateNoise(0.5, 'white');
        return { buffer, name: 'generated-noise' };
      },
      () => {
        const buffer = Audio.procedural.generateFMSynthesis(
          220 + Math.random() * 440,
          1 + Math.random() * 10,
          Math.random() * 5,
          0.8
        );
        return { buffer, name: 'generated-fm' };
      }
    ];

    const audioGenerator = audioTypes[Math.floor(Math.random() * audioTypes.length)];
    const { buffer, name } = audioGenerator();
    
    // Load and play the generated audio
    Audio.loadAudio(name, 'data:audio/wav;base64,', { buffer })
      .then(() => {
        return Audio.sfx.play(name, { volume: 0.6 });
      })
      .then(() => {
        console.log(`🛠️ Generated and played: ${name}`);
      })
      .catch((error) => {
        console.warn('Failed to generate audio:', error);
      });
  }

  /**
   * Cleanup demo resources
   */
  destroy(): void {
    this.isRunning = false;
    
    if (this.app) {
      this.app.destroy();
    }
    
    // End analytics session
    Audio.analytics.endSession();
    
    console.log('🛑 Audio demo stopped');
  }
}

// Initialize and start the demo when page loads
document.addEventListener('DOMContentLoaded', async () => {
  const demo = new AudioSystemDemo();
  
  try {
    await demo.initialize();
  } catch (error) {
    console.error('Failed to initialize audio demo:', error);
    
    // Show error message to user
    document.body.innerHTML = `
      <div style="color: red; text-align: center; padding: 50px; font-family: monospace;">
        <h2>❌ Audio Demo Failed to Initialize</h2>
        <p>Error: ${error.message}</p>
        <p>Please check the console for more details.</p>
        <p>This demo requires Web Audio API support.</p>
      </div>
    `;
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    demo.destroy();
  });
});

// Export demo class for external access
(window as any).AudioSystemDemo = AudioSystemDemo;