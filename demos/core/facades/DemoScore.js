/**
 * Demo Score Facade - showcases Laravel-inspired facade pattern
 * 
 * This facade demonstrates:
 * - Static API access to services through DI container
 * - Clean, expressive syntax for common operations
 * - Service method proxying with type safety
 * - Facade root resolution from container
 */
export class DemoScore {
  static app = null;
  
  /**
   * Set the GameByte application instance
   */
  static setApplication(app) {
    DemoScore.app = app;
  }
  
  /**
   * Get the GameByte application instance
   */
  static getApplication() {
    if (!DemoScore.app) {
      throw new Error('GameByte application not set on DemoScore facade');
    }
    return DemoScore.app;
  }
  
  /**
   * Get the service key that this facade represents
   */
  static getFacadeAccessor() {
    return 'demo.score';
  }
  
  /**
   * Resolve the facade root instance from the service container
   */
  static resolveFacadeInstance() {
    const app = DemoScore.getApplication();
    const accessor = DemoScore.getFacadeAccessor();
    
    if (!app.getContainer().bound(accessor)) {
      throw new Error(`Service '${accessor}' not found in container`);
    }
    
    return app.make(accessor);
  }
  
  /**
   * Add points to the current score
   * 
   * @example
   * DemoScore.addScore(100, 'enemy_killed');
   * DemoScore.addScore(50); // Uses default reason
   */
  static addScore(points, reason = 'default') {
    const service = DemoScore.resolveFacadeInstance();
    return service.addScore(points, reason);
  }
  
  /**
   * Set score multiplier for bonus periods
   * 
   * @example
   * DemoScore.setMultiplier(2, 5000); // 2x multiplier for 5 seconds
   * DemoScore.setMultiplier(1.5); // Permanent 1.5x multiplier
   */
  static setMultiplier(multiplier, duration = null) {
    const service = DemoScore.resolveFacadeInstance();
    return service.setMultiplier(multiplier, duration);
  }
  
  /**
   * Reset current score for new game
   * 
   * @example
   * DemoScore.resetScore();
   */
  static resetScore() {
    const service = DemoScore.resolveFacadeInstance();
    return service.resetScore();
  }
  
  /**
   * End current game session
   * 
   * @example
   * DemoScore.endGame();
   */
  static endGame() {
    const service = DemoScore.resolveFacadeInstance();
    return service.endGame();
  }
  
  /**
   * Get current score
   * 
   * @example
   * const score = DemoScore.getCurrentScore();
   */
  static getCurrentScore() {
    const service = DemoScore.resolveFacadeInstance();
    return service.currentScore;
  }
  
  /**
   * Get high score
   * 
   * @example
   * const highScore = DemoScore.getHighScore();
   */
  static getHighScore() {
    const service = DemoScore.resolveFacadeInstance();
    return service.highScore;
  }
  
  /**
   * Get current multiplier
   * 
   * @example
   * const multiplier = DemoScore.getMultiplier();
   */
  static getMultiplier() {
    const service = DemoScore.resolveFacadeInstance();
    return service.multiplier;
  }
  
  /**
   * Get complete game statistics
   * 
   * @example
   * const stats = DemoScore.getStats();
   * console.log(`Current: ${stats.currentScore}, High: ${stats.highScore}`);
   */
  static getStats() {
    const service = DemoScore.resolveFacadeInstance();
    return service.getStats();
  }
  
  /**
   * Add event listener to score service
   * 
   * @example
   * DemoScore.on('score:changed', (data) => {
   *   console.log(`Score changed to ${data.current}`);
   * });
   */
  static on(event, listener) {
    const service = DemoScore.resolveFacadeInstance();
    return service.on(event, listener);
  }
  
  /**
   * Remove event listener from score service
   * 
   * @example
   * DemoScore.off('score:changed', myListener);
   */
  static off(event, listener) {
    const service = DemoScore.resolveFacadeInstance();
    return service.off(event, listener);
  }
  
  /**
   * Listen for event once
   * 
   * @example
   * DemoScore.once('highscore:achieved', (data) => {
   *   console.log(`New high score: ${data.newScore}!`);
   * });
   */
  static once(event, listener) {
    const service = DemoScore.resolveFacadeInstance();
    return service.once(event, listener);
  }
  
  /**
   * Get the underlying service instance for advanced usage
   * 
   * @example
   * const scoreService = DemoScore.getInstance();
   * scoreService.someAdvancedMethod();
   */
  static getInstance() {
    return DemoScore.resolveFacadeInstance();
  }
  
  // Convenience methods for common score operations
  
  /**
   * Add points for killing an enemy
   */
  static enemyKilled(points = 10) {
    return DemoScore.addScore(points, 'enemy_killed');
  }
  
  /**
   * Add points for collecting an item
   */
  static itemCollected(points = 5) {
    return DemoScore.addScore(points, 'item_collected');
  }
  
  /**
   * Add points for completing a level
   */
  static levelCompleted(points = 100) {
    return DemoScore.addScore(points, 'level_completed');
  }
  
  /**
   * Add points for achieving a combo
   */
  static comboAchieved(comboCount, basePoints = 10) {
    const points = basePoints * comboCount;
    return DemoScore.addScore(points, `combo_x${comboCount}`);
  }
  
  /**
   * Activate double score multiplier for limited time
   */
  static activateDoubleScore(duration = 10000) {
    return DemoScore.setMultiplier(2, duration);
  }
  
  /**
   * Check if current score is a new high score
   */
  static isNewHighScore() {
    const service = DemoScore.resolveFacadeInstance();
    return service.currentScore > service.highScore;
  }
  
  /**
   * Get score formatted as string with commas
   */
  static getFormattedScore() {
    const score = DemoScore.getCurrentScore();
    return score.toLocaleString();
  }
  
  /**
   * Get high score formatted as string with commas
   */
  static getFormattedHighScore() {
    const highScore = DemoScore.getHighScore();
    return highScore.toLocaleString();
  }
  
  /**
   * Get score progress towards next milestone
   */
  static getMilestoneProgress() {
    const service = DemoScore.resolveFacadeInstance();
    const score = service.currentScore;
    const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    
    for (const milestone of milestones) {
      if (score < milestone) {
        return {
          current: score,
          target: milestone,
          progress: score / milestone,
          remaining: milestone - score
        };
      }
    }
    
    // Beyond all milestones
    return {
      current: score,
      target: null,
      progress: 1,
      remaining: 0
    };
  }
}