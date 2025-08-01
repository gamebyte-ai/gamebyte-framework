/**
 * Demo Notifications Facade - showcases mobile-first notification system
 * 
 * This facade demonstrates:
 * - Static API for mobile-optimized notifications
 * - Toast message management with touch feedback
 * - Achievement notification system
 * - Cross-platform notification handling
 */
export class DemoNotifications {
  static app = null;
  
  /**
   * Set the GameByte application instance
   */
  static setApplication(app) {
    DemoNotifications.app = app;
  }
  
  /**
   * Get the GameByte application instance
   */
  static getApplication() {
    if (!DemoNotifications.app) {
      throw new Error('GameByte application not set on DemoNotifications facade');
    }
    return DemoNotifications.app;
  }
  
  /**
   * Get the service key that this facade represents
   */
  static getFacadeAccessor() {
    return 'demo.notifications';
  }
  
  /**
   * Resolve the facade root instance from the service container
   */
  static resolveFacadeInstance() {
    const app = DemoNotifications.getApplication();
    const accessor = DemoNotifications.getFacadeAccessor();
    
    if (!app.getContainer().bound(accessor)) {
      throw new Error(`Service '${accessor}' not found in container`);
    }
    
    return app.make(accessor);
  }
  
  /**
   * Initialize the notification system with UI container
   * 
   * @example
   * DemoNotifications.initialize(document.body);
   */
  static initialize(parentElement) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.initialize(parentElement);
  }
  
  /**
   * Show a toast notification
   * 
   * @example
   * DemoNotifications.showToast('Hello World!');
   * DemoNotifications.showToast('Error occurred', 'error', { persistent: true });
   */
  static showToast(message, type = 'info', options = {}) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.showToast(message, type, options);
  }
  
  /**
   * Show success notification
   * 
   * @example
   * DemoNotifications.showSuccess('Level completed!');
   */
  static showSuccess(message) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.showSuccess(message);
  }
  
  /**
   * Show error notification
   * 
   * @example
   * DemoNotifications.showError('Connection failed', errorDetails);
   */
  static showError(message, details = null) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.showError(message, details);
  }
  
  /**
   * Show warning notification
   * 
   * @example
   * DemoNotifications.showWarning('Low battery detected');
   */
  static showWarning(message) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.showWarning(message);
  }
  
  /**
   * Show info notification
   * 
   * @example
   * DemoNotifications.showInfo('Game saved successfully');
   */
  static showInfo(message) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.showInfo(message);
  }
  
  /**
   * Show achievement notification
   * 
   * @example
   * DemoNotifications.showAchievement({
   *   name: 'First Steps',
   *   description: 'Complete your first level'
   * });
   */
  static showAchievement(achievement) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.showAchievement(achievement);
  }
  
  /**
   * Dismiss a specific notification
   * 
   * @example
   * const toastId = DemoNotifications.showToast('Temporary message');
   * setTimeout(() => DemoNotifications.dismissToast(toastId), 1000);
   */
  static dismissToast(id) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.dismissToast(id);
  }
  
  /**
   * Clear all active notifications
   * 
   * @example
   * DemoNotifications.clearAll();
   */
  static clearAll() {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.clearAll();
  }
  
  /**
   * Get count of active notifications
   * 
   * @example
   * const activeCount = DemoNotifications.getActiveCount();
   * if (activeCount > 5) {
   *   DemoNotifications.clearAll();
   * }
   */
  static getActiveCount() {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.getActiveCount();
  }
  
  /**
   * Get achievement history
   * 
   * @example
   * const achievements = DemoNotifications.getAchievementHistory();
   * console.log(`Player has ${achievements.length} achievements`);
   */
  static getAchievementHistory() {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.getAchievementHistory();
  }
  
  /**
   * Update notification settings
   * 
   * @example
   * DemoNotifications.updateSettings({
   *   enableVibration: false,
   *   defaultDuration: 5000
   * });
   */
  static updateSettings(newSettings) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.updateSettings(newSettings);
  }
  
  /**
   * Add event listener to notification service
   * 
   * @example
   * DemoNotifications.on('toast:shown', (data) => {
   *   console.log(`Toast shown: ${data.message}`);
   * });
   */
  static on(event, listener) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.on(event, listener);
  }
  
  /**
   * Remove event listener
   */
  static off(event, listener) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.off(event, listener);
  }
  
  /**
   * Listen for event once
   */
  static once(event, listener) {
    const service = DemoNotifications.resolveFacadeInstance();
    return service.once(event, listener);
  }
  
  /**
   * Get the underlying service instance
   */
  static getInstance() {
    return DemoNotifications.resolveFacadeInstance();
  }
  
  // Convenience methods for common game notifications
  
  /**
   * Show level start notification
   */
  static levelStarted(levelNumber) {
    return DemoNotifications.showInfo(`Level ${levelNumber} started!`);
  }
  
  /**
   * Show level completed notification
   */
  static levelCompleted(levelNumber, score) {
    return DemoNotifications.showSuccess(`Level ${levelNumber} completed! Score: ${score.toLocaleString()}`);
  }
  
  /**
   * Show game over notification
   */
  static gameOver(finalScore, isHighScore = false) {
    const message = isHighScore 
      ? `New High Score! ${finalScore.toLocaleString()} points!`
      : `Game Over! Final Score: ${finalScore.toLocaleString()}`;
    
    const type = isHighScore ? 'achievement' : 'info';
    return DemoNotifications.showToast(message, type, { duration: 5000 });
  }
  
  /**
   * Show pause notification
   */
  static gamePaused() {
    return DemoNotifications.showToast('Game Paused', 'info', { 
      duration: 2000,
      vibrate: false // Don't vibrate for pause
    });
  }
  
  /**
   * Show resume notification
   */
  static gameResumed() {
    return DemoNotifications.showToast('Game Resumed', 'info', { 
      duration: 1500,
      vibrate: false
    });
  }
  
  /**
   * Show power-up collected notification
   */
  static powerUpCollected(powerUpName) {
    return DemoNotifications.showToast(`${powerUpName} collected!`, 'success', {
      duration: 2000
    });
  }
  
  /**
   * Show combo notification
   */
  static comboAchieved(comboCount, points) {
    return DemoNotifications.showToast(`${comboCount}x Combo! +${points} points`, 'success', {
      duration: 2500
    });
  }
  
  /**
   * Show multiplier activation notification
   */
  static multiplierActivated(multiplier, duration) {
    const durationText = duration ? ` for ${duration/1000}s` : '';
    return DemoNotifications.showToast(`${multiplier}x Score Multiplier activated${durationText}!`, 'info', {
      duration: 3000
    });
  }
  
  /**
   * Show save game notification
   */
  static gameSaved() {
    return DemoNotifications.showToast('Game Saved', 'success', {
      duration: 1500
    });
  }
  
  /**
   * Show load game notification
   */
  static gameLoaded() {
    return DemoNotifications.showToast('Game Loaded', 'info', {
      duration: 1500
    });
  }
  
  /**
   * Show connection error notification
   */
  static connectionError() {
    return DemoNotifications.showError('Connection lost. Playing offline.', null);
  }
  
  /**
   * Show connection restored notification
   */
  static connectionRestored() {
    return DemoNotifications.showSuccess('Connection restored!');
  }
  
  /**
   * Show low performance warning
   */
  static lowPerformanceWarning(fps) {
    return DemoNotifications.showWarning(`Performance warning: ${fps} FPS. Consider lowering graphics quality.`);
  }
  
  /**
   * Show settings saved notification
   */
  static settingsSaved() {
    return DemoNotifications.showSuccess('Settings saved successfully');
  }
  
  /**
   * Show tutorial tip
   */
  static showTutorialTip(message) {
    return DemoNotifications.showToast(message, 'info', {
      duration: 4000,
      action: {
        text: 'Got it',
        callback: () => console.log('Tutorial tip acknowledged')
      }
    });
  }
  
  /**
   * Show milestone reached notification
   */
  static milestoneReached(milestone, description) {
    return DemoNotifications.showAchievement({
      name: `${milestone.toLocaleString()} Points!`,
      description: description || `You've reached ${milestone.toLocaleString()} points!`
    });
  }
  
  /**
   * Show daily reward notification
   */
  static dailyReward(reward) {
    return DemoNotifications.showToast(`Daily reward: ${reward}`, 'success', {
      duration: 4000
    });
  }
  
  /**
   * Show update available notification
   */
  static updateAvailable() {
    return DemoNotifications.showToast('New version available!', 'info', {
      persistent: true,
      action: {
        text: 'Update',
        callback: () => window.location.reload()
      }
    });
  }
  
  /**
   * Batch show multiple notifications with delay
   */
  static showBatch(notifications, delayBetween = 500) {
    notifications.forEach((notification, index) => {
      setTimeout(() => {
        DemoNotifications.showToast(
          notification.message,
          notification.type || 'info',
          notification.options || {}
        );
      }, index * delayBetween);
    });
  }
}