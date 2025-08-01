import { EventEmitter } from 'eventemitter3';

/**
 * Demo Game State Service - showcases state management through DI
 * 
 * This service demonstrates:
 * - Centralized state management
 * - State persistence
 * - Cross-service communication via events
 * - Service provider integration
 */
export class GameStateService extends EventEmitter {
  constructor() {
    super();
    
    // Game state
    this.currentState = 'loading';
    this.previousState = null;
    this.stateHistory = [];
    this.isPaused = false;
    this.settings = this.loadSettings();
    
    // Performance tracking
    this.frameCount = 0;
    this.fps = 60;
    this.lastFpsUpdate = Date.now();
    
    console.log('✅ GameStateService: Initialized with settings:', this.settings);
  }
  
  /**
   * Change game state with validation and events
   */
  setState(newState, data = {}) {
    const validStates = ['loading', 'splash', 'menu', 'playing', 'paused', 'gameover', 'settings'];
    
    if (!validStates.includes(newState)) {
      console.error(`❌ GameStateService: Invalid state '${newState}'`);
      return false;
    }
    
    if (this.currentState === newState) {
      console.warn(`⚠️ GameStateService: Already in state '${newState}'`);
      return false;
    }
    
    // Store state transition
    this.previousState = this.currentState;
    this.stateHistory.push({
      from: this.currentState,
      to: newState,
      timestamp: Date.now(),
      data
    });
    
    this.currentState = newState;
    
    // Emit state change events
    this.emit('state:changed', {
      previous: this.previousState,
      current: this.currentState,
      data
    });
    
    this.emit(`state:${newState}`, data);
    
    console.log(`🔄 GameStateService: State changed from '${this.previousState}' to '${newState}'`);
    
    // Handle special state logic
    this.handleStateChange(newState, data);
    
    return true;
  }
  
  /**
   * Handle special logic for state changes
   */
  handleStateChange(newState, data) {
    switch (newState) {
      case 'playing':
        this.isPaused = false;
        this.emit('game:started', data);
        break;
        
      case 'paused':
        this.isPaused = true;
        this.emit('game:paused', data);
        break;
        
      case 'gameover':
        this.isPaused = false;
        this.emit('game:ended', data);
        break;
        
      case 'menu':
        this.isPaused = false;
        this.emit('menu:shown', data);
        break;
    }
  }
  
  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.currentState === 'playing') {
      this.setState('paused');
    } else if (this.currentState === 'paused') {
      this.setState('playing');
    }
    
    return this.isPaused;
  }
  
  /**
   * Get current state information
   */
  getState() {
    return {
      current: this.currentState,
      previous: this.previousState,
      isPaused: this.isPaused,
      canPause: this.canPause(),
      stateHistory: [...this.stateHistory]
    };
  }
  
  /**
   * Check if game can be paused in current state
   */
  canPause() {
    return ['playing'].includes(this.currentState);
  }
  
  /**
   * Update game settings
   */
  updateSetting(key, value) {
    const oldValue = this.settings[key];
    this.settings[key] = value;
    
    this.emit('setting:changed', {
      key,
      oldValue,
      newValue: value,
      settings: { ...this.settings }
    });
    
    this.saveSettings();
    
    console.log(`⚙️ GameStateService: Setting '${key}' changed from '${oldValue}' to '${value}'`);
  }
  
  /**
   * Get setting value
   */
  getSetting(key, defaultValue = null) {
    return this.settings.hasOwnProperty(key) ? this.settings[key] : defaultValue;
  }
  
  /**
   * Get all settings
   */
  getSettings() {
    return { ...this.settings };
  }
  
  /**
   * Update FPS tracking
   */
  updateFPS() {
    this.frameCount++;
    const now = Date.now();
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      this.emit('fps:updated', this.fps);
      
      // Warn about low FPS
      if (this.fps < 30) {
        console.warn(`⚠️ GameStateService: Low FPS detected: ${this.fps}`);
        this.emit('performance:warning', { fps: this.fps, type: 'low_fps' });
      }
    }
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      fps: this.fps,
      frameCount: this.frameCount,
      lastUpdate: this.lastFpsUpdate,
      averageFPS: this.calculateAverageFPS()
    };
  }
  
  /**
   * Calculate average FPS over recent history
   */
  calculateAverageFPS() {
    // Simplified calculation - in real implementation might track FPS history
    return this.fps;
  }
  
  /**
   * Reset game state for new game
   */
  resetGame() {
    this.setState('menu');
    this.isPaused = false;
    this.frameCount = 0;
    
    this.emit('game:reset', {
      timestamp: Date.now(),
      previousState: this.previousState
    });
    
    console.log('🔄 GameStateService: Game state reset');
  }
  
  /**
   * Get state transition history
   */
  getStateHistory() {
    return [...this.stateHistory];
  }
  
  /**
   * Check if we can return to previous state
   */
  canGoBack() {
    return this.previousState !== null && 
           this.previousState !== this.currentState &&
           ['menu', 'settings', 'paused'].includes(this.currentState);
  }
  
  /**
   * Return to previous state if possible
   */
  goBack() {
    if (this.canGoBack()) {
      const targetState = this.previousState;
      this.setState(targetState, { returnedFromState: this.currentState });
      return true;
    }
    return false;
  }
  
  /**
   * Load settings from localStorage
   */
  loadSettings() {
    const defaultSettings = {
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 0.8,
      musicVolume: 0.6,
      showFPS: false,
      enableVibration: true,
      graphicsQuality: 'high',
      language: 'en',
      difficul: 'normal',
      autoSave: true
    };
    
    try {
      const saved = localStorage.getItem('gamebyte-demo-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.warn('⚠️ GameStateService: Could not load settings from localStorage');
    }
    
    return defaultSettings;
  }
  
  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('gamebyte-demo-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('⚠️ GameStateService: Could not save settings to localStorage');
    }
  }
  
  /**
   * Export game state for debugging
   */
  exportState() {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
      isPaused: this.isPaused,
      settings: { ...this.settings },
      stateHistory: [...this.stateHistory],
      performance: this.getPerformanceStats(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Import game state (for debugging/testing)
   */
  importState(stateData) {
    try {
      this.currentState = stateData.currentState || 'menu';
      this.previousState = stateData.previousState || null;
      this.isPaused = stateData.isPaused || false;
      this.settings = { ...this.settings, ...stateData.settings };
      
      if (stateData.stateHistory) {
        this.stateHistory = [...stateData.stateHistory];
      }
      
      this.emit('state:imported', stateData);
      console.log('📥 GameStateService: State imported successfully');
      
      return true;
    } catch (error) {
      console.error('❌ GameStateService: Failed to import state:', error);
      return false;
    }
  }
  
  /**
   * Service cleanup - demonstrates proper service lifecycle
   */
  destroy() {
    this.saveSettings();
    this.removeAllListeners();
    console.log('🧹 GameStateService: Service destroyed and cleaned up');
  }
}