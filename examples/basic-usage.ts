/**
 * Basic usage example of the GameByte Framework
 * 
 * This example demonstrates how to create a simple game application
 * using the GameByte framework with Laravel-inspired patterns.
 */

import { 
  createGame, 
  initializeFacades, 
  RenderingMode, 
  Scene,
  Renderer as RendererFacade,
  Scenes,
  Plugins
} from '../src/index';

// Example Scene Implementation
class MainMenuScene implements Scene {
  public readonly id = 'main-menu';
  public readonly name = 'Main Menu';
  public isActive = false;

  async initialize(): Promise<void> {
    console.log('Initializing Main Menu Scene...');
    // Initialize scene assets, UI, etc.
  }

  activate(): void {
    this.isActive = true;
    console.log('Main Menu Scene activated');
  }

  deactivate(): void {
    this.isActive = false;
    console.log('Main Menu Scene deactivated');
  }

  update(deltaTime: number): void {
    // Update scene logic
    if (this.isActive) {
      // Handle input, update animations, etc.
    }
  }

  render(renderer: any): void {
    // Render scene objects
    if (this.isActive) {
      // Render UI, backgrounds, etc.
    }
  }

  destroy(): void {
    console.log('Main Menu Scene destroyed');
    // Clean up resources
  }
}

class GameScene implements Scene {
  public readonly id = 'game';
  public readonly name = 'Game';
  public isActive = false;

  async initialize(): Promise<void> {
    console.log('Initializing Game Scene...');
  }

  activate(): void {
    this.isActive = true;
    console.log('Game Scene activated');
  }

  deactivate(): void {
    this.isActive = false;
    console.log('Game Scene deactivated');
  }

  update(deltaTime: number): void {
    if (this.isActive) {
      // Game logic here
    }
  }

  render(renderer: any): void {
    if (this.isActive) {
      // Render game objects
    }
  }

  destroy(): void {
    console.log('Game Scene destroyed');
  }
}

// Main Application Setup
async function main() {
  // Create GameByte application
  const app = createGame();
  
  // Initialize facades for static access
  initializeFacades(app);
  
  // Get canvas element
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  // Configure rendering options
  const renderingOptions = {
    width: 800,
    height: 600,
    antialias: true,
    backgroundColor: 0x1099bb,
    resolution: window.devicePixelRatio || 1
  };

  try {
    // Initialize the framework with 2D rendering
    await app.initialize(canvas, RenderingMode.RENDERER_2D, renderingOptions);
    
    // Create and register scenes
    const mainMenu = new MainMenuScene();
    const gameScene = new GameScene();
    
    Scenes.add(mainMenu);
    Scenes.add(gameScene);
    
    // Start with main menu
    await Scenes.switchTo('main-menu');
    
    // Start the game loop
    app.start();
    
    console.log('GameByte application started successfully!');
    
    // Example: Switch to game scene after 3 seconds
    setTimeout(async () => {
      await Scenes.switchTo('game', {
        type: 'fade',
        duration: 1000
      });
    }, 3000);
    
    // Example: Access renderer statistics
    setInterval(() => {
      const stats = RendererFacade.getStats();
      console.log(`FPS: ${stats.fps}, Draw Calls: ${stats.drawCalls}`);
    }, 1000);
    
  } catch (error) {
    console.error('Failed to initialize GameByte application:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// Export for module usage
export { main };