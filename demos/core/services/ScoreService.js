import { EventEmitter } from 'eventemitter3';

/**
 * Demo Score Service - showcases Laravel-inspired service architecture
 * 
 * This service demonstrates:
 * - Singleton pattern through DI container
 * - Event-driven architecture
 * - Service lifecycle management
 * - Clean separation of concerns
 */
export class ScoreService extends EventEmitter {
  constructor() {
    super();
    
    // Service state
    this.currentScore = 0;
    this.highScore = this.loadHighScore();
    this.multiplier = 1;
    this.scoreHistory = [];
    
    // Performance tracking
    this.startTime = null;
    this.totalPlayTime = 0;
    
    console.log('✅ ScoreService: Initialized with high score:', this.highScore);
  }
  
  /**
   * Add points to the current score
   * Demonstrates event emission and business logic
   */
  addScore(points, reason = 'default') {
    const previousScore = this.currentScore;
    const earnedPoints = Math.floor(points * this.multiplier);
    
    this.currentScore += earnedPoints;
    
    // Track score event
    this.scoreHistory.push({
      timestamp: Date.now(),
      points: earnedPoints,
      reason,
      multiplier: this.multiplier,
      totalScore: this.currentScore
    });
    
    // Emit events for UI updates and achievements
    this.emit('score:changed', {
      previous: previousScore,
      current: this.currentScore,
      added: earnedPoints,
      reason
    });
    
    // Check for high score
    if (this.currentScore > this.highScore) {
      const oldHighScore = this.highScore;
      this.highScore = this.currentScore;
      this.saveHighScore();
      
      this.emit('highscore:achieved', {
        newScore: this.highScore,
        previousScore: oldHighScore
      });
    }
    
    // Check for score milestones
    this.checkMilestones(previousScore, this.currentScore);
    
    console.log(`💰 ScoreService: +${earnedPoints} points (${reason}), Total: ${this.currentScore}`);
  }
  
  /**
   * Set score multiplier for bonus periods
   */
  setMultiplier(multiplier, duration = null) {
    const previousMultiplier = this.multiplier;
    this.multiplier = multiplier;
    
    this.emit('multiplier:changed', {
      previous: previousMultiplier,
      current: this.multiplier,
      duration
    });
    
    // Auto-reset multiplier after duration
    if (duration) {
      setTimeout(() => {
        this.setMultiplier(1);
      }, duration);
    }
    
    console.log(`🚀 ScoreService: Multiplier set to ${multiplier}x`);
  }
  
  /**
   * Reset current score for new game
   */
  resetScore() {
    const previousScore = this.currentScore;
    this.currentScore = 0;
    this.multiplier = 1;
    this.scoreHistory = [];
    this.startTime = Date.now();
    
    this.emit('score:reset', {
      previousScore,
      timestamp: this.startTime
    });
    
    console.log('🔄 ScoreService: Score reset for new game');
  }
  
  /**
   * End current game session
   */
  endGame() {
    if (this.startTime) {
      const sessionTime = Date.now() - this.startTime;
      this.totalPlayTime += sessionTime;
      
      const gameSession = {
        score: this.currentScore,
        playTime: sessionTime,
        scoreHistory: [...this.scoreHistory],
        averageScorePerMinute: this.currentScore / (sessionTime / 60000)
      };
      
      this.emit('game:ended', gameSession);
      
      console.log(`🎮 ScoreService: Game ended - Score: ${this.currentScore}, Time: ${Math.round(sessionTime/1000)}s`);
      
      this.startTime = null;
    }
  }
  
  /**
   * Get current game statistics
   */
  getStats() {
    return {
      currentScore: this.currentScore,
      highScore: this.highScore,
      multiplier: this.multiplier,
      scoreHistory: [...this.scoreHistory],
      totalPlayTime: this.totalPlayTime,
      gamesPlayed: this.getGamesPlayed(),
      averageScore: this.getAverageScore()
    };
  }
  
  /**
   * Check for score milestones and emit achievements
   */
  checkMilestones(previousScore, currentScore) {
    const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    
    for (const milestone of milestones) {
      if (previousScore < milestone && currentScore >= milestone) {
        this.emit('milestone:reached', {
          milestone,
          currentScore,
          achievement: this.getMilestoneAchievement(milestone)
        });
        
        console.log(`🏆 ScoreService: Milestone reached - ${milestone} points!`);
      }
    }
  }
  
  /**
   * Get achievement info for milestone
   */
  getMilestoneAchievement(milestone) {
    const achievements = {
      100: { name: 'First Steps', description: 'Score your first 100 points' },
      500: { name: 'Getting Started', description: 'Reach 500 points' },
      1000: { name: 'Breaking Barriers', description: 'Score 1,000 points' },
      2500: { name: 'Rising Star', description: 'Achieve 2,500 points' },
      5000: { name: 'High Achiever', description: 'Reach 5,000 points' },
      10000: { name: 'Master Player', description: 'Score 10,000 points' },
      25000: { name: 'Elite Gamer', description: 'Achieve 25,000 points' },
      50000: { name: 'Legendary', description: 'Reach 50,000 points' },
      100000: { name: 'Ultimate Champion', description: 'Score 100,000 points' }
    };
    
    return achievements[milestone] || { name: 'Achievement', description: `Reach ${milestone} points` };
  }
  
  /**
   * Load high score from localStorage
   */
  loadHighScore() {
    try {
      const saved = localStorage.getItem('gamebyte-demo-highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      console.warn('⚠️ ScoreService: Could not load high score from localStorage');
      return 0;
    }
  }
  
  /**
   * Save high score to localStorage
   */
  saveHighScore() {
    try {
      localStorage.setItem('gamebyte-demo-highscore', this.highScore.toString());
    } catch (error) {
      console.warn('⚠️ ScoreService: Could not save high score to localStorage');
    }
  }
  
  /**
   * Get total games played (simplified)
   */
  getGamesPlayed() {
    try {
      const saved = localStorage.getItem('gamebyte-demo-games-played');
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Get average score across all games
   */
  getAverageScore() {
    const gamesPlayed = this.getGamesPlayed();
    return gamesPlayed > 0 ? Math.round(this.highScore / gamesPlayed) : 0;
  }
  
  /**
   * Increment games played counter
   */
  incrementGamesPlayed() {
    try {
      const current = this.getGamesPlayed();
      localStorage.setItem('gamebyte-demo-games-played', (current + 1).toString());
    } catch (error) {
      console.warn('⚠️ ScoreService: Could not save games played counter');
    }
  }
  
  /**
   * Service cleanup - demonstrates proper service lifecycle
   */
  destroy() {
    this.endGame();
    this.removeAllListeners();
    console.log('🧹 ScoreService: Service destroyed and cleaned up');
  }
}