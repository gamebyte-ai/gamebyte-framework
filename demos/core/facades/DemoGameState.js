/**
 * Demo Game State Facade - showcases state management through facade pattern
 * 
 * This facade demonstrates:
 * - Centralized state access through static API
 * - State validation and transition management
 * - Settings management with persistence
 * - Performance monitoring access
 */
export class DemoGameState {
  static app = null;
  
  /**
   * Set the GameByte application instance
   */
  static setApplication(app) {
    DemoGameState.app = app;
  }
  
  /**
   * Get the GameByte application instance
   */
  static getApplication() {
    if (!DemoGameState.app) {
      throw new Error('GameByte application not set on DemoGameState facade');
    }
    return DemoGameState.app;
  }
  
  /**
   * Get the service key that this facade represents
   */
  static getFacadeAccessor() {
    return 'demo.gamestate';
  }
  
  /**
   * Resolve the facade root instance from the service container
   */
  static resolveFacadeInstance() {
    const app = DemoGameState.getApplication();
    const accessor = DemoGameState.getFacadeAccessor();
    
    if (!app.getContainer().bound(accessor)) {
      throw new Error(`Service '${accessor}' not found in container`);
    }
    
    return app.make(accessor);
  }
  
  /**
   * Change game state
   * 
   * @example
   * DemoGameState.setState('playing');
   * DemoGameState.setState('paused', { reason: 'user_input' });
   */
  static setState(newState, data = {}) {
    const service = DemoGameState.resolveFacadeInstance();
    return service.setState(newState, data);
  }
  
  /**
   * Get current state
   * 
   * @example
   * const currentState = DemoGameState.getCurrentState();
   * if (currentState === 'playing') { ... }
   */
  static getCurrentState() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.currentState;
  }
  
  /**
   * Get previous state
   * 
   * @example
   * const previousState = DemoGameState.getPreviousState();
   */
  static getPreviousState() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.previousState;
  }
  
  /**
   * Check if game is paused
   * 
   * @example
   * if (DemoGameState.isPaused()) {
   *   // Show pause menu
   * }
   */
  static isPaused() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.isPaused;
  }
  
  /**
   * Toggle pause state
   * 
   * @example
   * const wasPaused = DemoGameState.togglePause();
   */
  static togglePause() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.togglePause();
  }
  
  /**
   * Get complete state information
   * 
   * @example
   * const stateInfo = DemoGameState.getState();
   * console.log(`Current: ${stateInfo.current}, Can pause: ${stateInfo.canPause}`);
   */
  static getState() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.getState();
  }
  
  /**
   * Check if game can be paused in current state
   * 
   * @example
   * if (DemoGameState.canPause()) {
   *   // Show pause button
   * }
   */
  static canPause() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.canPause();
  }
  
  /**
   * Update a game setting
   * 
   * @example
   * DemoGameState.updateSetting('soundEnabled', false);
   * DemoGameState.updateSetting('difficulty', 'hard');
   */
  static updateSetting(key, value) {
    const service = DemoGameState.resolveFacadeInstance();
    return service.updateSetting(key, value);
  }
  
  /**
   * Get a setting value
   * 
   * @example
   * const soundEnabled = DemoGameState.getSetting('soundEnabled', true);
   * const volume = DemoGameState.getSetting('soundVolume', 0.8);
   */
  static getSetting(key, defaultValue = null) {
    const service = DemoGameState.resolveFacadeInstance();
    return service.getSetting(key, defaultValue);
  }
  
  /**
   * Get all settings
   * 
   * @example
   * const allSettings = DemoGameState.getSettings();
   */
  static getSettings() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.getSettings();
  }
  
  /**
   * Update FPS tracking (called by game loop)
   * 
   * @example
   * // In game loop:
   * DemoGameState.updateFPS();
   */
  static updateFPS() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.updateFPS();
  }
  
  /**
   * Get performance statistics
   * 
   * @example
   * const perfStats = DemoGameState.getPerformanceStats();
   * console.log(`FPS: ${perfStats.fps}`);
   */
  static getPerformanceStats() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.getPerformanceStats();
  }
  
  /**
   * Get current FPS
   * 
   * @example
   * const fps = DemoGameState.getFPS();
   */
  static getFPS() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.fps;
  }
  
  /**
   * Reset game state for new game
   * 
   * @example
   * DemoGameState.resetGame();
   */
  static resetGame() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.resetGame();
  }
  
  /**
   * Get state transition history
   * 
   * @example
   * const history = DemoGameState.getStateHistory();
   * console.log(`Last transition: ${history[history.length - 1].from} -> ${history[history.length - 1].to}`);
   */
  static getStateHistory() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.getStateHistory();
  }
  
  /**
   * Check if we can return to previous state
   * 
   * @example
   * if (DemoGameState.canGoBack()) {
   *   // Show back button
   * }
   */
  static canGoBack() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.canGoBack();
  }
  
  /**
   * Return to previous state if possible
   * 
   * @example
   * const success = DemoGameState.goBack();
   */
  static goBack() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.goBack();
  }
  
  /**
   * Add event listener to game state service
   * 
   * @example
   * DemoGameState.on('state:changed', (data) => {
   *   console.log(`State changed from ${data.previous} to ${data.current}`);
   * });
   */
  static on(event, listener) {
    const service = DemoGameState.resolveFacadeInstance();
    return service.on(event, listener);
  }
  
  /**
   * Remove event listener
   */
  static off(event, listener) {
    const service = DemoGameState.resolveFacadeInstance();
    return service.off(event, listener);
  }
  
  /**
   * Listen for event once
   */
  static once(event, listener) {
    const service = DemoGameState.resolveFacadeInstance();
    return service.once(event, listener);
  }
  
  /**
   * Export complete state for debugging
   * 
   * @example
   * const stateExport = DemoGameState.exportState();
   * console.log('Current game state:', stateExport);
   */
  static exportState() {
    const service = DemoGameState.resolveFacadeInstance();
    return service.exportState();
  }
  
  /**
   * Import game state (for debugging/testing)
   * 
   * @example
   * const success = DemoGameState.importState(previousStateData);
   */
  static importState(stateData) {
    const service = DemoGameState.resolveFacadeInstance();
    return service.importState(stateData);
  }
  
  /**
   * Get the underlying service instance
   */
  static getInstance() {
    return DemoGameState.resolveFacadeInstance();
  }
  
  // Convenience methods for common state operations
  
  /**
   * Start a new game
   */
  static startGame() {
    return DemoGameState.setState('playing', { started: Date.now() });
  }
  
  /**
   * Pause the game
   */
  static pauseGame() {
    return DemoGameState.setState('paused', { pausedAt: Date.now() });
  }
  
  /**
   * Resume the game
   */
  static resumeGame() {
    return DemoGameState.setState('playing', { resumedAt: Date.now() });
  }
  
  /**
   * End the game
   */
  static endGame(finalScore = 0) {
    return DemoGameState.setState('gameover', { 
      endedAt: Date.now(),
      finalScore 
    });
  }
  
  /**
   * Go to main menu
   */
  static showMenu() {
    return DemoGameState.setState('menu', { returnedAt: Date.now() });
  }
  
  /**
   * Show settings screen
   */
  static showSettings() {
    return DemoGameState.setState('settings', { openedAt: Date.now() });
  }
  
  /**
   * Check if currently playing
   */
  static isPlaying() {
    return DemoGameState.getCurrentState() === 'playing';
  }
  
  /**
   * Check if in menu
   */
  static isInMenu() {
    return DemoGameState.getCurrentState() === 'menu';
  }
  
  /**
   * Check if game is over
   */
  static isGameOver() {
    return DemoGameState.getCurrentState() === 'gameover';
  }
  
  /**
   * Check if in settings
   */
  static isInSettings() {
    return DemoGameState.getCurrentState() === 'settings';
  }
  
  /**
   * Toggle sound setting
   */
  static toggleSound() {
    const currentValue = DemoGameState.getSetting('soundEnabled', true);
    DemoGameState.updateSetting('soundEnabled', !currentValue);
    return !currentValue;
  }
  
  /**
   * Toggle music setting
   */
  static toggleMusic() {
    const currentValue = DemoGameState.getSetting('musicEnabled', true);
    DemoGameState.updateSetting('musicEnabled', !currentValue);
    return !currentValue;
  }
  
  /**
   * Set volume level (0.0 to 1.0)
   */
  static setSoundVolume(volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    DemoGameState.updateSetting('soundVolume', clampedVolume);
    return clampedVolume;
  }
  
  /**
   * Set music volume level (0.0 to 1.0)
   */
  static setMusicVolume(volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    DemoGameState.updateSetting('musicVolume', clampedVolume);
    return clampedVolume;
  }
  
  /**
   * Get formatted FPS string for UI display
   */
  static getFPSString() {
    const fps = DemoGameState.getFPS();
    return `${fps} FPS`;
  }
  
  /**
   * Check if performance is good (FPS above threshold)
   */
  static isPerformanceGood(threshold = 50) {
    return DemoGameState.getFPS() >= threshold;
  }
}