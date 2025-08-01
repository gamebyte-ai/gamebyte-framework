# Quick Start Guide

Get up and running with GameByte Framework in under 10 minutes! This guide will help you create your first game and understand the core concepts.

## Step 1: Create Your Project

```bash
# Create a new GameByte project
npx create-gamebyte-app my-first-game

# Navigate to your project
cd my-first-game

# Install dependencies
npm install

# Start development server
npm run dev
```

Your development server will start at `http://localhost:3000`.

## Step 2: Basic Game Setup

Let's create a simple 2D game. Replace the contents of `src/main.ts`:

```typescript
import { 
  createGame, 
  initializeFacades, 
  RenderingMode,
  Renderer,
  Scenes 
} from '@gamebyte/framework';

// Create the game application
const app = createGame();

// Initialize facades for static access
initializeFacades(app);

async function main() {
  // Get the canvas element
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  // Initialize the framework with 2D rendering
  await app.initialize(canvas, RenderingMode.PIXI_2D, {
    width: 800,
    height: 600,
    backgroundColor: 0x222222,
    resizeTo: window // Auto-resize to window
  });
  
  // Create and add our first scene
  const gameScene = new GameScene();
  Scenes.add(gameScene);
  
  // Switch to the game scene
  await Scenes.switchTo('game');
  
  // Start the game loop
  app.start();
  
  console.log('Game started successfully!');
}

// Call main function
main().catch(console.error);
```

## Step 3: Create Your First Scene

Add this scene class to `src/main.ts`:

```typescript
import { Scene } from '@gamebyte/framework';

class GameScene implements Scene {
  public readonly id = 'game';
  public readonly name = 'Game Scene';
  public isActive = false;
  
  private ball: any;
  private ballVelocity = { x: 2, y: 2 };

  async initialize(): Promise<void> {
    console.log('Initializing game scene...');
    
    // Get the Pixi.js application
    const app = Renderer.getPixiApp();
    
    if (app) {
      // Create a simple ball sprite
      this.ball = new PIXI.Graphics();
      this.ball.beginFill(0xff6b6b);
      this.ball.drawCircle(0, 0, 20);
      this.ball.endFill();
      
      // Position the ball
      this.ball.x = 400;
      this.ball.y = 300;
      
      // Add to stage
      app.stage.addChild(this.ball);
    }
  }

  activate(): void {
    this.isActive = true;
    console.log('Game scene activated');
  }

  deactivate(): void {
    this.isActive = false;
    console.log('Game scene deactivated');
  }

  update(deltaTime: number): void {
    if (!this.isActive || !this.ball) return;
    
    // Move the ball
    this.ball.x += this.ballVelocity.x;
    this.ball.y += this.ballVelocity.y;
    
    // Bounce off edges
    if (this.ball.x <= 20 || this.ball.x >= 780) {
      this.ballVelocity.x *= -1;
    }
    if (this.ball.y <= 20 || this.ball.y >= 580) {
      this.ballVelocity.y *= -1;
    }
  }

  render(renderer: any): void {
    // Rendering is handled automatically by Pixi.js
  }

  destroy(): void {
    if (this.ball && this.ball.parent) {
      this.ball.parent.removeChild(this.ball);
    }
    console.log('Game scene destroyed');
  }
}
```

Don't forget to import Pixi.js at the top of your file:

```typescript
import * as PIXI from 'pixi.js';
```

## Step 4: Add Interactivity

Let's add mouse/touch interaction to make the ball follow your cursor:

```typescript
class GameScene implements Scene {
  // ... previous code ...
  
  private isFollowingMouse = false;

  async initialize(): Promise<void> {
    console.log('Initializing game scene...');
    
    const app = Renderer.getPixiApp();
    
    if (app) {
      // Create the ball
      this.ball = new PIXI.Graphics();
      this.ball.beginFill(0xff6b6b);
      this.ball.drawCircle(0, 0, 20);
      this.ball.endFill();
      
      this.ball.x = 400;
      this.ball.y = 300;
      
      // Make the ball interactive
      this.ball.interactive = true;
      this.ball.buttonMode = true;
      
      // Add click/touch event
      this.ball.on('pointerdown', () => {
        this.isFollowingMouse = !this.isFollowingMouse;
        this.ball.tint = this.isFollowingMouse ? 0x6bcf7f : 0xff6b6b;
      });
      
      app.stage.addChild(this.ball);
      
      // Add global mouse move listener
      app.stage.interactive = true;
      app.stage.on('pointermove', (event: any) => {
        if (this.isFollowingMouse && this.ball) {
          const pos = event.data.global;
          this.ball.x = pos.x;
          this.ball.y = pos.y;
        }
      });
    }
  }

  update(deltaTime: number): void {
    if (!this.isActive || !this.ball || this.isFollowingMouse) return;
    
    // Only bounce when not following mouse
    this.ball.x += this.ballVelocity.x;
    this.ball.y += this.ballVelocity.y;
    
    // Bounce off edges
    if (this.ball.x <= 20 || this.ball.x >= 780) {
      this.ballVelocity.x *= -1;
    }
    if (this.ball.y <= 20 || this.ball.y >= 580) {
      this.ballVelocity.y *= -1;
    }
  }
  
  // ... rest of the code ...
}
```

## Step 5: Add UI Elements

Let's add some UI to make it feel more like a game:

```typescript
import { UI } from '@gamebyte/framework';

class GameScene implements Scene {
  // ... previous code ...
  
  private scoreText: any;
  private score = 0;

  async initialize(): Promise<void> {
    console.log('Initializing game scene...');
    
    const app = Renderer.getPixiApp();
    
    if (app) {
      // Create the ball (previous code)
      this.ball = new PIXI.Graphics();
      this.ball.beginFill(0xff6b6b);
      this.ball.drawCircle(0, 0, 20);
      this.ball.endFill();
      
      this.ball.x = 400;
      this.ball.y = 300;
      this.ball.interactive = true;
      this.ball.buttonMode = true;
      
      // Increment score when clicked
      this.ball.on('pointerdown', () => {
        this.isFollowingMouse = !this.isFollowingMouse;
        this.ball.tint = this.isFollowingMouse ? 0x6bcf7f : 0xff6b6b;
        this.score += 10;
        this.updateScoreText();
      });
      
      app.stage.addChild(this.ball);
      
      // Create score text
      this.scoreText = new PIXI.Text(`Score: ${this.score}`, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        align: 'left'
      });
      this.scoreText.x = 20;
      this.scoreText.y = 20;
      app.stage.addChild(this.scoreText);
      
      // Add global mouse move listener (previous code)
      app.stage.interactive = true;
      app.stage.on('pointermove', (event: any) => {
        if (this.isFollowingMouse && this.ball) {
          const pos = event.data.global;
          this.ball.x = pos.x;
          this.ball.y = pos.y;
        }
      });
    }
  }

  private updateScoreText(): void {
    if (this.scoreText) {
      this.scoreText.text = `Score: ${this.score}`;
    }
  }

  destroy(): void {
    if (this.ball && this.ball.parent) {
      this.ball.parent.removeChild(this.ball);
    }
    if (this.scoreText && this.scoreText.parent) {
      this.scoreText.parent.removeChild(this.scoreText);
    }
    console.log('Game scene destroyed');
  }
  
  // ... rest of the code ...
}
```

## Step 6: Run Your Game

Start your development server and open your browser:

```bash
npm run dev
```

Visit `http://localhost:3000` and you should see:
- A red ball bouncing around the screen
- Click the ball to toggle mouse-following mode (turns green)
- A score counter that increases when you click the ball

## Step 7: Add Mobile Support

To make your game work on mobile devices, add touch optimizations:

```typescript
// Add to your HTML head section
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">

// Add to your CSS
<style>
  body {
    margin: 0;
    padding: 0;
    background: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: Arial, sans-serif;
    touch-action: none; /* Prevent scrolling on touch */
  }
  
  #game-canvas {
    display: block;
    border: 1px solid #333;
    max-width: 100vw;
    max-height: 100vh;
  }
</style>
```

## Understanding What You Built

Congratulations! You've created your first GameByte game. Here's what you learned:

### 1. **Framework Initialization**
- Created a GameByte application instance
- Initialized facades for easy access to framework services
- Set up 2D rendering using Pixi.js

### 2. **Scene Management**
- Created a custom scene class implementing the `Scene` interface
- Learned about the scene lifecycle: `initialize()`, `activate()`, `update()`, `render()`, `destroy()`
- Used the `Scenes` facade to manage scene switching

### 3. **Rendering System**
- Accessed the underlying Pixi.js application through the `Renderer` facade
- Created graphics objects and added them to the stage
- Handled rendering automatically through the framework

### 4. **Input Handling**
- Set up mouse and touch interaction using Pixi.js event system
- Made objects interactive and responsive to user input

### 5. **Game Loop**
- Implemented the `update()` method for game logic
- Used `deltaTime` for frame-rate independent movement

## Next Steps

Now that you have a basic game working, you can:

### 1. **Add Physics**
Learn how to add physics simulation to your game:

```typescript
import { Physics } from '@gamebyte/framework';

// In your scene initialize method
await Physics.initialize('2d', 'matter');
const world = Physics.createWorld({
  dimension: '2d',
  gravity: { x: 0, y: 9.82 }
});
```

### 2. **Add Audio**
Learn how to add sound effects and music:

```typescript
import { Audio } from '@gamebyte/framework';

// Play a sound effect
Audio.playSFX('click-sound.mp3');

// Play background music
Audio.playMusic('background-music.mp3', { loop: true });
```

### 3. **Improve UI**
Use the framework's UI system for better interfaces:

```typescript
import { UI } from '@gamebyte/framework';

// Create a button
const button = UI.createButton({
  text: 'Start Game',
  position: { x: 400, y: 300 },
  style: { backgroundColor: '#4CAF50' }
});
```

### 4. **Add More Scenes**
Create multiple scenes for menus, gameplay, and game over:

```typescript
// Menu scene
class MenuScene implements Scene {
  // ... implementation
}

// Game over scene
class GameOverScene implements Scene {
  // ... implementation
}
```

## Complete Code

Here's the complete code for your first game:

```typescript
import { 
  createGame, 
  initializeFacades, 
  RenderingMode,
  Renderer,
  Scenes,
  Scene
} from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

class GameScene implements Scene {
  public readonly id = 'game';
  public readonly name = 'Game Scene';
  public isActive = false;
  
  private ball: any;
  private ballVelocity = { x: 2, y: 2 };
  private isFollowingMouse = false;
  private scoreText: any;
  private score = 0;

  async initialize(): Promise<void> {
    console.log('Initializing game scene...');
    
    const app = Renderer.getPixiApp();
    
    if (app) {
      // Create the ball
      this.ball = new PIXI.Graphics();
      this.ball.beginFill(0xff6b6b);
      this.ball.drawCircle(0, 0, 20);
      this.ball.endFill();
      
      this.ball.x = 400;
      this.ball.y = 300;
      this.ball.interactive = true;
      this.ball.buttonMode = true;
      
      this.ball.on('pointerdown', () => {
        this.isFollowingMouse = !this.isFollowingMouse;
        this.ball.tint = this.isFollowingMouse ? 0x6bcf7f : 0xff6b6b;
        this.score += 10;
        this.updateScoreText();
      });
      
      app.stage.addChild(this.ball);
      
      // Create score text
      this.scoreText = new PIXI.Text(`Score: ${this.score}`, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        align: 'left'
      });
      this.scoreText.x = 20;
      this.scoreText.y = 20;
      app.stage.addChild(this.scoreText);
      
      // Mouse movement
      app.stage.interactive = true;
      app.stage.on('pointermove', (event: any) => {
        if (this.isFollowingMouse && this.ball) {
          const pos = event.data.global;
          this.ball.x = pos.x;
          this.ball.y = pos.y;
        }
      });
    }
  }

  activate(): void {
    this.isActive = true;
    console.log('Game scene activated');
  }

  deactivate(): void {
    this.isActive = false;
    console.log('Game scene deactivated');
  }

  update(deltaTime: number): void {
    if (!this.isActive || !this.ball || this.isFollowingMouse) return;
    
    this.ball.x += this.ballVelocity.x;
    this.ball.y += this.ballVelocity.y;
    
    if (this.ball.x <= 20 || this.ball.x >= 780) {
      this.ballVelocity.x *= -1;
    }
    if (this.ball.y <= 20 || this.ball.y >= 580) {
      this.ballVelocity.y *= -1;
    }
  }

  render(renderer: any): void {
    // Rendering handled automatically
  }

  private updateScoreText(): void {
    if (this.scoreText) {
      this.scoreText.text = `Score: ${this.score}`;
    }
  }

  destroy(): void {
    if (this.ball && this.ball.parent) {
      this.ball.parent.removeChild(this.ball);
    }
    if (this.scoreText && this.scoreText.parent) {
      this.scoreText.parent.removeChild(this.scoreText);
    }
    console.log('Game scene destroyed');
  }
}

// Create the game application
const app = createGame();
initializeFacades(app);

async function main() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  await app.initialize(canvas, RenderingMode.PIXI_2D, {
    width: 800,
    height: 600,
    backgroundColor: 0x222222,
    resizeTo: window
  });
  
  const gameScene = new GameScene();
  Scenes.add(gameScene);
  await Scenes.switchTo('game');
  
  app.start();
  console.log('Game started successfully!');
}

main().catch(console.error);
```

## Resources

- [First Game Tutorial](./first-game.md) - Build a complete platformer game
- [Core Concepts](../core-concepts/architecture.md) - Understand the framework architecture
- [API Reference](../api-reference/core.md) - Complete API documentation
- [Examples](../examples/basic-examples.md) - More code examples

---

**Great job!** You've successfully created your first GameByte game. Ready to build something more complex? Check out our [First Game Tutorial](./first-game.md) for a complete platformer game implementation.