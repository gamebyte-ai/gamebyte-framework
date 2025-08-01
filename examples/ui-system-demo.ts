/**
 * GameByte Framework UI System Demo
 * 
 * This example demonstrates the comprehensive mobile-optimized UI system
 * with Rollic/Voodoo game standards.
 */

import { 
  createMobileGame, 
  initializeFacades, 
  UI, 
  Animations, 
  Themes,
  SplashScreen,
  MainMenuScreen,
  UIButton,
  UIText,
  UIPanel,
  UIProgressBar,
  VibrantUITheme
} from '../src/index';

// Create and configure the game instance
const game = createMobileGame();

// Initialize facades for static access
initializeFacades(game);

async function initializeGame() {
  // Get canvas element
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Initialize the framework with 2D rendering
  await game.initialize(canvas, 'pixi', {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000
  });

  // Setup UI system
  setupUISystem();

  // Start the game
  game.start();
}

function setupUISystem() {
  // Set a vibrant theme
  const vibrantTheme = new VibrantUITheme();
  UI.setTheme(vibrantTheme);

  // Create and register splash screen
  const splashScreen = new SplashScreen({
    brandName: 'GameByte Demo',
    backgroundColor: { r: 15, g: 15, b: 25, a: 1 },
    textColor: { r: 255, g: 255, b: 255, a: 1 },
    duration: 3000,
    showProgressBar: true,
    loadingText: 'Loading amazing game...'
  });

  UI.registerScreen(splashScreen);

  // Create main menu screen
  const mainMenu = new MainMenuScreen({
    title: 'GameByte Demo',
    backgroundColor: { r: 25, g: 35, b: 45, a: 1 },
    buttons: [
      { text: 'Start Game', id: 'start', style: 'primary' },
      { text: 'Settings', id: 'settings', style: 'secondary' },
      { text: 'Leaderboard', id: 'leaderboard', style: 'outline' },
      { text: 'Shop', id: 'shop', style: 'secondary' }
    ],
    showVersion: true,
    version: '1.0.0',
    socialButtons: true
  });

  UI.registerScreen(mainMenu);

  // Setup screen event handlers
  setupScreenHandlers();

  // Show splash screen first
  UI.showScreen('splash');
}

function setupScreenHandlers() {
  // Splash screen events
  UI.manager().on('screen-shown', (screenName: string) => {
    console.log(`Screen shown: ${screenName}`);
    
    if (screenName === 'splash') {
      // Simulate loading progress
      simulateLoading();
    }
  });

  // Handle splash screen auto-advance
  const splashScreen = UI.manager()._screens.get('splash') as SplashScreen;
  if (splashScreen) {
    splashScreen.on('auto-advance', () => {
      console.log('Splash screen auto-advance triggered');
      transitionToMainMenu();
    });

    splashScreen.on('advance', () => {
      console.log('Splash screen manually advanced');
      transitionToMainMenu();
    });
  }

  // Main menu events
  const mainMenu = UI.manager()._screens.get('main-menu') as MainMenuScreen;
  if (mainMenu) {
    mainMenu.on('button-clicked', (buttonId: string) => {
      console.log(`Main menu button clicked: ${buttonId}`);
      handleMainMenuAction(buttonId);
    });

    mainMenu.on('social-clicked', (socialId: string) => {
      console.log(`Social button clicked: ${socialId}`);
      // Handle social media integration
    });

    mainMenu.on('settings-clicked', () => {
      console.log('Settings button clicked');
      // Show settings screen
    });
  }
}

function simulateLoading() {
  const splashScreen = UI.manager()._screens.get('splash') as SplashScreen;
  if (!splashScreen) return;

  let progress = 0;
  const loadingSteps = [
    { progress: 0.2, text: 'Loading assets...' },
    { progress: 0.4, text: 'Initializing game systems...' },
    { progress: 0.6, text: 'Setting up audio...' },
    { progress: 0.8, text: 'Preparing game world...' },
    { progress: 1.0, text: 'Ready to play!' }
  ];

  let currentStep = 0;

  const updateProgress = () => {
    if (currentStep >= loadingSteps.length) return;

    const step = loadingSteps[currentStep];
    splashScreen.setLoadingProgress(step.progress);
    splashScreen.setLoadingText(step.text);

    if (step.progress >= 1.0) {
      splashScreen.showComplete();
    }

    currentStep++;
  };

  // Update progress every 600ms
  const progressInterval = setInterval(() => {
    updateProgress();
    
    if (currentStep >= loadingSteps.length) {
      clearInterval(progressInterval);
    }
  }, 600);
}

async function transitionToMainMenu() {
  // Smooth transition from splash to main menu
  await UI.hideScreen('splash');
  await UI.showScreen('main-menu');
}

function handleMainMenuAction(buttonId: string) {
  switch (buttonId) {
    case 'start':
      startGameDemo();
      break;
    case 'settings':
      showSettingsDemo();
      break;
    case 'leaderboard':
      showLeaderboardDemo();
      break;
    case 'shop':
      showShopDemo();
      break;
    default:
      console.log(`Unhandled button action: ${buttonId}`);
  }
}

function startGameDemo() {
  console.log('Starting game demo...');
  
  // Create a simple in-game UI demonstration
  const gameHUD = createGameHUD();
  UI.getRoot().addChild(gameHUD);
  
  // Hide main menu
  UI.hideScreen('main-menu');
  
  // Start a simple game loop demonstration
  startGameLoop();
}

function createGameHUD(): any {
  // Create HUD container
  const hud = UI.createComponent('container');
  hud.setPositionConstraint('safe-area', 'safe-area');
  hud.setSizeConstraint('fill', 'fill');

  // Score display
  const scoreText = UI.createComponent('text', {
    text: 'Score: 0',
    fontSize: 24,
    fontWeight: 'bold',
    color: { r: 255, g: 255, b: 255, a: 1 },
    textAlign: 'left'
  });
  scoreText.setPosition(20, 20);
  hud.addChild(scoreText);

  // Health bar
  const healthBar = UI.createComponent('progress-bar', {
    value: 1.0,
    backgroundColor: { r: 100, g: 100, b: 100, a: 0.8 },
    fillColor: { r: 255, g: 60, b: 60, a: 1 },
    borderRadius: 8,
    showText: true,
    textFormat: (value: number) => `Health: ${Math.round(value * 100)}%`
  });
  healthBar.setSize(200, 20);
  healthBar.setPosition(20, 60);
  hud.addChild(healthBar);

  // Pause button
  const pauseButton = UI.createComponent('button', {
    text: '⏸️',
    fontSize: 20,
    backgroundColor: { r: 0, g: 0, b: 0, a: 0.5 },
    borderRadius: 25,
    padding: 10
  });
  pauseButton.setSize(50, 50);
  pauseButton.setPositionConstraint('fixed', 'fixed');
  pauseButton.constraints.x.value = -70; // 70px from right
  pauseButton.constraints.y.value = 20;  // 20px from top
  
  pauseButton.on('click', () => {
    console.log('Game paused');
    showPauseMenu();
  });
  
  hud.addChild(pauseButton);

  return hud;
}

function showPauseMenu() {
  // Create pause overlay
  const pauseOverlay = UI.createComponent('panel', {
    backgroundColor: { r: 0, g: 0, b: 0, a: 0.8 }
  });
  pauseOverlay.setPositionConstraint('fixed', 'fixed');
  pauseOverlay.setSizeConstraint('fill', 'fill');
  pauseOverlay.setPosition(0, 0);

  // Pause menu content
  const pauseContainer = UI.createComponent('container');
  pauseContainer.setPositionConstraint('center', 'center');
  pauseContainer.setSizeConstraint('wrap', 'wrap');

  const pauseTitle = UI.createComponent('text', {
    text: 'Game Paused',
    fontSize: 32,
    fontWeight: 'bold',
    color: { r: 255, g: 255, b: 255, a: 1 },
    textAlign: 'center'
  });
  pauseContainer.addChild(pauseTitle);

  const resumeButton = UI.createComponent('button', {
    text: 'Resume',
    backgroundColor: { r: 0, g: 122, b: 255, a: 1 },
    borderRadius: 12,
    padding: 16
  });
  resumeButton.setPosition(0, 60);
  resumeButton.on('click', () => {
    pauseOverlay.removeFromParent();
  });
  pauseContainer.addChild(resumeButton);

  const mainMenuButton = UI.createComponent('button', {
    text: 'Main Menu',
    backgroundColor: { r: 100, g: 100, b: 100, a: 1 },
    borderRadius: 12,
    padding: 16
  });
  mainMenuButton.setPosition(0, 120);
  mainMenuButton.on('click', () => {
    pauseOverlay.removeFromParent();
    // Remove game HUD
    const hud = UI.getRoot().getChildById('game-hud');
    if (hud) hud.removeFromParent();
    // Show main menu
    UI.showScreen('main-menu');
  });
  pauseContainer.addChild(mainMenuButton);

  pauseOverlay.addChild(pauseContainer);
  UI.getRoot().addChild(pauseOverlay);

  // Animate in
  pauseOverlay.setAlpha(0);
  Animations.to(pauseOverlay, { alpha: 1 }, { duration: 300, easing: 'ease-out' });
}

function startGameLoop() {
  let score = 0;
  let health = 1.0;
  
  const gameLoop = () => {
    // Simple game simulation
    score += Math.floor(Math.random() * 10);
    health = Math.max(0, health - 0.001);
    
    // Update UI
    const scoreText = UI.getRoot().getChildById('score-text');
    if (scoreText) {
      (scoreText as any).setText(`Score: ${score}`);
    }
    
    const healthBar = UI.getRoot().getChildById('health-bar');
    if (healthBar) {
      (healthBar as any).setValue(health);
    }
    
    // Game over condition
    if (health <= 0) {
      showGameOver(score);
      return;
    }
    
    requestAnimationFrame(gameLoop);
  };
  
  gameLoop();
}

function showGameOver(finalScore: number) {
  console.log(`Game Over! Final Score: ${finalScore}`);
  
  // Create game over screen with animations
  const gameOverOverlay = createGameOverScreen(finalScore);
  UI.getRoot().addChild(gameOverOverlay);
}

function createGameOverScreen(score: number): any {
  const overlay = UI.createComponent('panel', {
    backgroundColor: { r: 0, g: 0, b: 0, a: 0.9 },
    gradient: {
      type: 'radial',
      colors: [
        { color: { r: 50, g: 0, b: 50, a: 0.9 }, stop: 0 },
        { color: { r: 0, g: 0, b: 0, a: 0.9 }, stop: 1 }
      ]
    }
  });
  overlay.setPositionConstraint('fixed', 'fixed');
  overlay.setSizeConstraint('fill', 'fill');

  const container = UI.createComponent('container');
  container.setPositionConstraint('center', 'center');
  container.setSizeConstraint('wrap', 'wrap');

  // Game over title with dramatic effect
  const title = UI.createComponent('text', {
    text: 'GAME OVER',
    fontSize: 48,
    fontWeight: 'bold',
    color: { r: 255, g: 50, b: 50, a: 1 },
    textAlign: 'center',
    shadow: {
      color: { r: 0, g: 0, b: 0, a: 0.8 },
      offsetX: 4,
      offsetY: 4,
      blur: 8
    }
  });
  container.addChild(title);

  // Final score
  const scoreText = UI.createComponent('text', {
    text: `Final Score: ${score}`,
    fontSize: 24,
    color: { r: 255, g: 255, b: 255, a: 1 },
    textAlign: 'center'
  });
  scoreText.setPosition(0, 80);
  container.addChild(scoreText);

  // Buttons
  const restartButton = UI.createComponent('button', {
    text: 'Play Again',
    backgroundColor: { r: 0, g: 200, b: 0, a: 1 },
    borderRadius: 12,
    padding: 16,
    rippleEffect: true
  });
  restartButton.setPosition(0, 140);
  restartButton.on('click', () => {
    overlay.removeFromParent();
    startGameDemo();
  });
  container.addChild(restartButton);

  const menuButton = UI.createComponent('button', {
    text: 'Main Menu',
    backgroundColor: { r: 100, g: 100, b: 100, a: 1 },
    borderRadius: 12,
    padding: 16
  });
  menuButton.setPosition(0, 200);
  menuButton.on('click', () => {
    overlay.removeFromParent();
    const hud = UI.getRoot().getChildById('game-hud');
    if (hud) hud.removeFromParent();
    UI.showScreen('main-menu');
  });
  container.addChild(menuButton);

  overlay.addChild(container);

  // Dramatic entrance animation
  overlay.setAlpha(0);
  title.setScale(0.5);
  
  Animations.to(overlay, { alpha: 1 }, { duration: 500, easing: 'ease-out' });
  Animations.spring(title, { scale: { x: 1, y: 1 } }, { 
    tension: 300, 
    friction: 20,
    delay: 200 
  });

  return overlay;
}

function showSettingsDemo() {
  console.log('Settings demo - would show settings screen');
  // Implementation for settings screen
}

function showLeaderboardDemo() {
  console.log('Leaderboard demo - would show leaderboard screen');
  // Implementation for leaderboard screen
}

function showShopDemo() {
  console.log('Shop demo - would show shop screen');
  // Implementation for shop screen
}

// Handle window resize for responsive design
window.addEventListener('resize', () => {
  UI.handleOrientationChange(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );
});

// Initialize the game when the page loads
window.addEventListener('load', initializeGame);

// Export for external use
export { initializeGame };