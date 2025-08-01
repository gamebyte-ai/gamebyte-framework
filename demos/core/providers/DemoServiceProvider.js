/**
 * Demo Service Provider - showcases Laravel-inspired service provider pattern
 * 
 * This service provider demonstrates:
 * - Service registration in DI container
 * - Service lifecycle management (register -> boot)
 * - Cross-service dependency resolution
 * - Event-driven service communication
 */
export class DemoServiceProvider {
  constructor() {
    this.services = [
      'demo.score',
      'demo.gamestate', 
      'demo.notifications'
    ];
  }
  
  /**
   * Register services in the DI container
   * This is called early in the application lifecycle
   */
  register(app) {
    console.log('📦 DemoServiceProvider: Registering services...');
    
    // Register ScoreService as singleton
    // Singleton ensures same instance is used throughout the application
    app.singleton('demo.score', () => {
      const { ScoreService } = require('../services/ScoreService.js');
      return new ScoreService();
    });
    
    // Register GameStateService as singleton
    app.singleton('demo.gamestate', () => {
      const { GameStateService } = require('../services/GameStateService.js');
      return new GameStateService();
    });
    
    // Register NotificationService as singleton
    app.singleton('demo.notifications', () => {
      const { NotificationService } = require('../services/NotificationService.js');
      return new NotificationService();
    });
    
    // Register convenient aliases for shorter access
    app.getContainer().alias('score', 'demo.score');
    app.getContainer().alias('gamestate', 'demo.gamestate');
    app.getContainer().alias('notifications', 'demo.notifications');
    
    // Register service factory for creating new instances if needed
    app.bind('demo.score.factory', () => {
      return () => {
        const { ScoreService } = require('../services/ScoreService.js');
        return new ScoreService();
      };
    });
    
    console.log('✅ DemoServiceProvider: Services registered successfully');
  }
  
  /**
   * Bootstrap services after all providers have been registered
   * This is called after all services are registered and available
   */
  boot(app) {
    console.log('🚀 DemoServiceProvider: Booting services...');
    
    // Resolve services from container to set up cross-service communication
    const scoreService = app.make('demo.score');
    const gameStateService = app.make('demo.gamestate');
    const notificationService = app.make('demo.notifications');
    
    // Set up cross-service event communication
    this.setupServiceCommunication(scoreService, gameStateService, notificationService);
    
    // Set up application-level event forwarding
    this.setupApplicationEvents(app, scoreService, gameStateService, notificationService);
    
    // Perform initial service configuration
    this.configureServices(scoreService, gameStateService, notificationService);
    
    console.log('✅ DemoServiceProvider: Services booted successfully');
  }
  
  /**
   * Set up communication between services via events
   * Demonstrates service decoupling through event-driven architecture
   */
  setupServiceCommunication(scoreService, gameStateService, notificationService) {
    // Score service -> Notification service communication
    scoreService.on('highscore:achieved', (data) => {
      notificationService.showAchievement({
        name: 'New High Score!',
        description: `You scored ${data.newScore} points!`
      });
    });
    
    scoreService.on('milestone:reached', (data) => {
      notificationService.showAchievement(data.achievement);
    });
    
    // Game state -> Score service communication
    gameStateService.on('game:started', () => {
      scoreService.resetScore();
      notificationService.showInfo('Game started! Good luck!');
    });
    
    gameStateService.on('game:ended', (sessionData) => {
      scoreService.endGame();
      scoreService.incrementGamesPlayed();
      
      notificationService.showSuccess(`Game over! Final score: ${sessionData.score || 0}`);
    });
    
    gameStateService.on('game:paused', () => {
      notificationService.showInfo('Game paused');
    });
    
    gameStateService.on('state:menu', () => {
      notificationService.showInfo('Welcome to the demo!');
    });
    
    // Game state -> Notification service for settings
    gameStateService.on('setting:changed', (data) => {
      if (data.key === 'soundEnabled') {
        const message = data.newValue ? 'Sound enabled' : 'Sound disabled';
        notificationService.showInfo(message);
      }
    });
    
    // Performance warnings
    gameStateService.on('performance:warning', (data) => {
      if (data.type === 'low_fps') {
        notificationService.showWarning(`Performance warning: FPS dropped to ${data.fps}`);
      }
    });
    
    console.log('🔗 DemoServiceProvider: Service communication configured');
  }
  
  /**
   * Set up application-level event forwarding
   * Demonstrates how services can communicate with the main application
   */
  setupApplicationEvents(app, scoreService, gameStateService, notificationService) {
    // Forward important service events to application level
    scoreService.on('score:changed', (data) => {
      app.emit('demo:score:changed', data);
    });
    
    gameStateService.on('state:changed', (data) => {
      app.emit('demo:state:changed', data);
    });
    
    notificationService.on('achievement:shown', (achievement) => {
      app.emit('demo:achievement:shown', achievement);
    });
    
    // Listen for application-level events
    app.on('demo:force:highscore', (score) => {
      // Debugging/testing feature
      scoreService.addScore(score, 'debug');
    });
    
    app.on('demo:force:state', (state) => {
      // Debugging/testing feature
      gameStateService.setState(state, { forced: true });
    });
    
    console.log('📡 DemoServiceProvider: Application events configured');
  }
  
  /**
   * Configure services with initial settings
   */
  configureServices(scoreService, gameStateService, notificationService) {
    // Configure notification service settings
    notificationService.updateSettings({
      maxToasts: 4,
      defaultDuration: 3500,
      enableVibration: gameStateService.getSetting('enableVibration', true),
      enableSound: gameStateService.getSetting('soundEnabled', true)
    });
    
    // Set up performance monitoring
    const performanceInterval = setInterval(() => {
      gameStateService.updateFPS();
    }, 1000);
    
    // Clean up interval when services are destroyed
    const originalDestroy = gameStateService.destroy;
    gameStateService.destroy = function() {
      clearInterval(performanceInterval);
      originalDestroy.call(this);
    };
    
    console.log('⚙️ DemoServiceProvider: Services configured');
  }
  
  /**
   * Get list of services provided by this provider
   * Used for debugging and service discovery
   */
  provides() {
    return this.services;
  }
  
  /**
   * Check if this provider provides a specific service
   */
  provides(serviceName) {
    return this.services.includes(serviceName);
  }
  
  /**
   * Get provider information for debugging
   */
  getInfo() {
    return {
      name: 'DemoServiceProvider',
      services: this.services,
      description: 'Provides core demo services for GameByte framework demonstration'
    };
  }
}