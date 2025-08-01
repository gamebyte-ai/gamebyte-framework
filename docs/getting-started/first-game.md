# First Game Tutorial: 2D Platformer

In this comprehensive tutorial, you'll build a complete 2D platformer game using GameByte Framework. This game will feature player movement, physics, collectibles, enemies, and multiple levels.

## What You'll Build

By the end of this tutorial, you'll have:
- A character that can run, jump, and interact with the environment
- Physics-based gameplay with platforms and obstacles
- Collectible items and scoring system
- Simple enemies with AI
- Multiple game scenes (menu, gameplay, game over)
- Mobile-optimized touch controls
- Sound effects and background music

## Prerequisites

- Complete the [Quick Start Guide](./quickstart.md)
- Basic understanding of JavaScript/TypeScript
- Familiarity with game development concepts

## Project Setup

Start by creating a new GameByte project:

```bash
npx create-gamebyte-app platformer-game
cd platformer-game
npm install
```

## Step 1: Project Structure

Let's organize our code properly. Create this folder structure:

```
src/
├── main.ts                 # Entry point
├── scenes/                 # Game scenes
│   ├── MenuScene.ts        # Main menu
│   ├── GameScene.ts        # Main gameplay
│   └── GameOverScene.ts    # Game over screen
├── entities/               # Game objects
│   ├── Player.ts           # Player character
│   ├── Enemy.ts            # Enemy entities
│   └── Collectible.ts      # Collectible items
├── systems/                # Game systems
│   ├── InputSystem.ts      # Input handling
│   └── CameraSystem.ts     # Camera management
├── utils/                  # Utility functions
│   └── AssetLoader.ts      # Asset loading
└── assets/                 # Game assets
    ├── sprites/            # Sprite images
    ├── sounds/             # Sound files
    └── levels/             # Level data
```

## Step 2: Asset Loading System

First, let's create an asset loading system. Create `src/utils/AssetLoader.ts`:

```typescript
import { Assets } from '@gamebyte/framework';

export interface GameAssets {
  player: {
    idle: PIXI.Texture;
    run: PIXI.Texture[];
    jump: PIXI.Texture;
  };
  platforms: {
    grass: PIXI.Texture;
    stone: PIXI.Texture;
  };
  collectibles: {
    coin: PIXI.Texture;
    gem: PIXI.Texture;
  };
  enemies: {
    goomba: PIXI.Texture[];
  };
  background: PIXI.Texture;
}

export class AssetLoader {
  private static assets: GameAssets;
  
  static async loadGameAssets(): Promise<GameAssets> {
    console.log('Loading game assets...');
    
    // For this tutorial, we'll create simple colored rectangles
    // In a real game, you'd load actual image files
    const assets: GameAssets = {
      player: {
        idle: AssetLoader.createColorTexture(0x4CAF50, 32, 48), // Green player
        run: [
          AssetLoader.createColorTexture(0x4CAF50, 32, 48),
          AssetLoader.createColorTexture(0x45A049, 32, 48)
        ],
        jump: AssetLoader.createColorTexture(0x388E3C, 32, 48)
      },
      platforms: {
        grass: AssetLoader.createColorTexture(0x8BC34A, 64, 32), // Light green platform
        stone: AssetLoader.createColorTexture(0x757575, 64, 32)  // Gray platform
      },
      collectibles: {
        coin: AssetLoader.createColorTexture(0xFFEB3B, 16, 16),  // Yellow coin
        gem: AssetLoader.createColorTexture(0xE91E63, 20, 20)    // Pink gem
      },
      enemies: {
        goomba: [
          AssetLoader.createColorTexture(0xFF5722, 24, 16),      // Orange enemy
          AssetLoader.createColorTexture(0xF4511E, 24, 16)
        ]
      },
      background: AssetLoader.createColorTexture(0x87CEEB, 800, 600) // Sky blue
    };
    
    AssetLoader.assets = assets;
    console.log('Assets loaded successfully!');
    return assets;
  }
  
  static getAssets(): GameAssets {
    return AssetLoader.assets;
  }
  
  private static createColorTexture(color: number, width: number, height: number): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    
    const texture = PIXI.RenderTexture.create({ width, height });
    const renderer = PIXI.Renderer.shared || new PIXI.Renderer();
    renderer.render(graphics, { renderTexture: texture });
    
    return texture;
  }
}
```

## Step 3: Player Entity

Create the player character in `src/entities/Player.ts`:

```typescript
import { Physics } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';
import { GameAssets } from '../utils/AssetLoader';

export class Player {
  public sprite: PIXI.Sprite;
  public physicsBody: any;
  public platformerHelper: any;
  
  private assets: GameAssets;
  private runAnimation: PIXI.Texture[];
  private currentFrame = 0;
  private animationTimer = 0;
  private facingDirection = 1; // 1 for right, -1 for left
  
  // Player stats
  public health = 100;
  public score = 0;
  public lives = 3;
  
  constructor(assets: GameAssets, x: number, y: number) {
    this.assets = assets;
    this.runAnimation = assets.player.run;
    
    // Create sprite
    this.sprite = new PIXI.Sprite(assets.player.idle);
    this.sprite.anchor.set(0.5, 1); // Anchor at bottom center
    this.sprite.x = x;
    this.sprite.y = y;
    
    // Create physics body
    this.createPhysicsBody(x, y);
  }
  
  private async createPhysicsBody(x: number, y: number): Promise<void> {
    // Create physics body for the player
    this.physicsBody = Physics.createBody({
      type: 'dynamic',
      position: { x: x / 32, y: y / 32 }, // Convert pixels to physics units
      shapes: [{
        type: 'box',
        dimensions: { x: 1, y: 1.5 } // 32x48 pixels = 1x1.5 physics units
      }],
      mass: 1,
      fixedRotation: true // Prevent player from rotating
    });
    
    // Create platformer helper for advanced movement
    this.platformerHelper = Physics.createPlatformerHelper(this.physicsBody);
    
    // Configure movement settings
    this.platformerHelper.setMovementSettings({
      maxSpeed: 6,          // Maximum horizontal speed
      acceleration: 25,     // Ground acceleration
      deceleration: 20,     // Ground deceleration
      airAcceleration: 15,  // Air acceleration (lower than ground)
      jumpForce: 12,        // Jump strength
      coyoteTime: 0.15,     // Grace time for jumping after leaving ground
      jumpBufferTime: 0.15  // Grace time for jump input before landing
    });
    
    // Enable advanced platformer features
    this.platformerHelper.enableCoyoteTime(true);
    this.platformerHelper.enableJumpBuffering(true);
    
    // Listen to platformer events
    this.platformerHelper.on('jump', () => {
      console.log('Player jumped!');
      // Play jump sound effect here
    });
    
    this.platformerHelper.on('landed', () => {
      console.log('Player landed!');
      // Play landing sound effect here
    });
  }
  
  public update(deltaTime: number, input: any): void {
    // Update platformer helper
    this.platformerHelper.update(deltaTime);
    
    // Handle input
    this.handleInput(input);
    
    // Update sprite position based on physics body
    this.updateSpritePosition();
    
    // Update animation
    this.updateAnimation(deltaTime);
    
    // Check for out of bounds
    this.checkBounds();
  }
  
  private handleInput(input: any): void {
    let horizontalInput = 0;
    
    // Handle movement input
    if (input.left) {
      horizontalInput = -1;
      this.facingDirection = -1;
    } else if (input.right) {
      horizontalInput = 1;
      this.facingDirection = 1;
    }
    
    // Set horizontal movement
    this.platformerHelper.setHorizontalInput(horizontalInput);
    
    // Handle jump input
    if (input.jump) {
      this.platformerHelper.jump();
    }
    
    // Update sprite facing direction
    this.sprite.scale.x = Math.abs(this.sprite.scale.x) * this.facingDirection;
  }
  
  private updateSpritePosition(): void {
    if (this.physicsBody) {
      // Convert physics position back to pixels
      this.sprite.x = this.physicsBody.position.x * 32;
      this.sprite.y = this.physicsBody.position.y * 32;
    }
  }
  
  private updateAnimation(deltaTime: number): void {
    const movementState = this.platformerHelper.getMovementState();
    
    // Set appropriate texture based on movement state
    switch (movementState) {
      case 'idle':
        this.sprite.texture = this.assets.player.idle;
        break;
        
      case 'walking':
      case 'running':
        // Animate running
        this.animationTimer += deltaTime;
        if (this.animationTimer > 200) { // Change frame every 200ms
          this.currentFrame = (this.currentFrame + 1) % this.runAnimation.length;
          this.sprite.texture = this.runAnimation[this.currentFrame];
          this.animationTimer = 0;
        }
        break;
        
      case 'jumping':
      case 'falling':
        this.sprite.texture = this.assets.player.jump;
        break;
    }
  }
  
  private checkBounds(): void {
    // Check if player fell off the world
    if (this.sprite.y > 1000) {
      this.takeDamage(25); // Lose health for falling
      this.respawn();
    }
  }
  
  public takeDamage(amount: number): void {
    this.health -= amount;
    console.log(`Player took ${amount} damage. Health: ${this.health}`);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  public die(): void {
    this.lives--;
    console.log(`Player died! Lives remaining: ${this.lives}`);
    
    if (this.lives > 0) {
      this.health = 100;
      this.respawn();
    } else {
      // Game over
      console.log('Game Over!');
    }
  }
  
  public respawn(): void {
    // Reset position to spawn point
    this.physicsBody.position = { x: 2, y: 15 }; // 64, 480 in pixels
    this.physicsBody.velocity = { x: 0, y: 0 };
    console.log('Player respawned');
  }
  
  public addScore(points: number): void {
    this.score += points;
    console.log(`Score: ${this.score}`);
  }
  
  public getPosition(): { x: number; y: number } {
    return {
      x: this.sprite.x,
      y: this.sprite.y
    };
  }
  
  public destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    if (this.physicsBody) {
      Physics.removeBody(this.physicsBody);
    }
  }
}
```

## Step 4: Input System

Create an input system in `src/systems/InputSystem.ts`:

```typescript
export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  action: boolean;
}

export class InputSystem {
  private inputState: InputState = {
    left: false,
    right: false,
    jump: false,
    action: false
  };
  
  private keys: { [key: string]: boolean } = {};
  private previousJumpState = false;
  
  constructor() {
    this.setupKeyboardEvents();
    this.setupTouchEvents();
  }
  
  private setupKeyboardEvents(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      e.preventDefault();
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      e.preventDefault();
    });
  }
  
  private setupTouchEvents(): void {
    // Create virtual controls for mobile
    this.createVirtualControls();
  }
  
  private createVirtualControls(): void {
    // Create touch control overlay
    const controlsContainer = document.createElement('div');
    controlsContainer.style.position = 'fixed';
    controlsContainer.style.bottom = '20px';
    controlsContainer.style.left = '0';
    controlsContainer.style.right = '0';
    controlsContainer.style.height = '120px';
    controlsContainer.style.pointerEvents = 'none';
    controlsContainer.style.zIndex = '1000';
    
    // Left/Right movement area (left side)
    const moveArea = document.createElement('div');
    moveArea.style.position = 'absolute';
    moveArea.style.left = '20px';
    moveArea.style.bottom = '0';
    moveArea.style.width = '200px';
    moveArea.style.height = '120px';
    moveArea.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    moveArea.style.borderRadius = '10px';
    moveArea.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    moveArea.style.pointerEvents = 'auto';
    
    // Jump button (right side)
    const jumpButton = document.createElement('div');
    jumpButton.style.position = 'absolute';
    jumpButton.style.right = '20px';
    jumpButton.style.bottom = '20px';
    jumpButton.style.width = '80px';
    jumpButton.style.height = '80px';
    jumpButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    jumpButton.style.borderRadius = '50%';
    jumpButton.style.border = '3px solid rgba(255, 255, 255, 0.5)';
    jumpButton.style.display = 'flex';
    jumpButton.style.alignItems = 'center';
    jumpButton.style.justifyContent = 'center';
    jumpButton.style.color = 'white';
    jumpButton.style.fontSize = '24px';
    jumpButton.style.fontWeight = 'bold';
    jumpButton.style.pointerEvents = 'auto';
    jumpButton.textContent = '↑';
    
    controlsContainer.appendChild(moveArea);
    controlsContainer.appendChild(jumpButton);
    document.body.appendChild(controlsContainer);
    
    // Touch events for movement area
    let moveTouch: Touch | null = null;
    let moveStartX = 0;
    
    moveArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      moveTouch = touch;
      moveStartX = touch.clientX;
    });
    
    moveArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!moveTouch) return;
      
      const touch = Array.from(e.touches).find(t => t.identifier === moveTouch!.identifier);
      if (!touch) return;
      
      const deltaX = touch.clientX - moveStartX;
      const threshold = 30;
      
      this.inputState.left = deltaX < -threshold;
      this.inputState.right = deltaX > threshold;
    });
    
    moveArea.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputState.left = false;
      this.inputState.right = false;
      moveTouch = null;
    });
    
    // Touch events for jump button
    jumpButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputState.jump = true;
    });
    
    jumpButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputState.jump = false;
    });
  }
  
  public update(): InputState {
    // Update keyboard input
    this.inputState.left = this.keys['ArrowLeft'] || this.keys['KeyA'];
    this.inputState.right = this.keys['ArrowRight'] || this.keys['KeyD'];
    
    // Handle jump input (only register on key press, not hold)
    const currentJumpState = this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'];
    this.inputState.jump = currentJumpState && !this.previousJumpState;
    this.previousJumpState = currentJumpState;
    
    this.inputState.action = this.keys['KeyE'] || this.keys['Enter'];
    
    return { ...this.inputState };
  }
  
  public getInputState(): InputState {
    return { ...this.inputState };
  }
}
```

## Step 5: Game Scene

Now let's create the main game scene in `src/scenes/GameScene.ts`:

```typescript
import { Scene, Physics, Renderer } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';
import { Player } from '../entities/Player';
import { InputSystem } from '../systems/InputSystem';
import { AssetLoader, GameAssets } from '../utils/AssetLoader';

export class GameScene implements Scene {
  public readonly id = 'game';
  public readonly name = 'Game Scene';
  public isActive = false;
  
  private app: PIXI.Application | null = null;
  private assets: GameAssets | null = null;
  private player: Player | null = null;
  private inputSystem: InputSystem | null = null;
  
  // Level data
  private platforms: PIXI.Sprite[] = [];
  private collectibles: PIXI.Sprite[] = [];
  
  // UI elements
  private hudContainer: PIXI.Container | null = null;
  private scoreText: PIXI.Text | null = null;
  private healthText: PIXI.Text | null = null;
  private livesText: PIXI.Text | null = null;
  
  // Camera
  private cameraTarget: { x: number; y: number } = { x: 0, y: 0 };
  
  async initialize(): Promise<void> {
    console.log('Initializing game scene...');
    
    // Get Pixi app
    this.app = Renderer.getPixiApp();
    if (!this.app) {
      throw new Error('Pixi app not available');
    }
    
    // Load assets
    this.assets = await AssetLoader.loadGameAssets();
    
    // Initialize physics
    await Physics.initialize('2d', 'matter');
    const world = Physics.createWorld({
      dimension: '2d',
      gravity: { x: 0, y: 25 }, // Gravity strength
      allowSleep: true
    });
    
    // Create input system
    this.inputSystem = new InputSystem();
    
    // Build the level
    this.buildLevel();
    
    // Create player
    this.player = new Player(this.assets, 64, 480); // Start position
    this.app.stage.addChild(this.player.sprite);
    
    // Create HUD
    this.createHUD();
    
    console.log('Game scene initialized successfully');
  }
  
  private buildLevel(): void {
    if (!this.app || !this.assets) return;
    
    // Level design - simple platformer level
    const levelData = [
      // Ground platforms
      { x: 0, y: 550, width: 800, height: 50, type: 'grass' },
      
      // Floating platforms
      { x: 200, y: 450, width: 128, height: 32, type: 'grass' },
      { x: 400, y: 350, width: 128, height: 32, type: 'stone' },
      { x: 600, y: 250, width: 128, height: 32, type: 'grass' },
      { x: 150, y: 150, width: 64, height: 32, type: 'stone' },
      { x: 500, y: 150, width: 96, height: 32, type: 'grass' },
      
      // Walls (optional for enclosed feeling)
      { x: -32, y: 0, width: 32, height: 600, type: 'stone' },
      { x: 800, y: 0, width: 32, height: 600, type: 'stone' }
    ];
    
    // Create platform sprites and physics bodies
    levelData.forEach(platform => {
      // Create sprite
      const sprite = new PIXI.Sprite(this.assets!.platforms.grass);
      sprite.width = platform.width;
      sprite.height = platform.height;
      sprite.x = platform.x;
      sprite.y = platform.y;
      
      this.app!.stage.addChild(sprite);
      this.platforms.push(sprite);
      
      // Create physics body
      const physicsBody = Physics.createBody({
        type: 'static',
        position: {
          x: (platform.x + platform.width / 2) / 32, // Convert to physics units
          y: (platform.y + platform.height / 2) / 32
        },
        shapes: [{
          type: 'box',
          dimensions: {
            x: platform.width / 32,
            y: platform.height / 32
          }
        }]
      });
    });
    
    // Create collectibles
    const collectibleData = [
      { x: 250, y: 400, type: 'coin', points: 10 },
      { x: 450, y: 300, type: 'gem', points: 50 },
      { x: 650, y: 200, type: 'coin', points: 10 },
      { x: 180, y: 100, type: 'gem', points: 50 },
      { x: 530, y: 100, type: 'coin', points: 10 }
    ];
    
    collectibleData.forEach((collectible, index) => {
      const sprite = new PIXI.Sprite(
        collectible.type === 'coin' 
          ? this.assets!.collectibles.coin 
          : this.assets!.collectibles.gem
      );
      sprite.anchor.set(0.5);
      sprite.x = collectible.x;
      sprite.y = collectible.y;
      sprite.name = `collectible_${index}`;
      
      // Add some hover animation
      sprite.interactive = true;
      
      this.app!.stage.addChild(sprite);
      this.collectibles.push(sprite);
      
      // Create trigger zone for collision detection
      const trigger = Physics.createTriggerZone({
        position: { x: collectible.x / 32, y: collectible.y / 32 },
        shapes: [{ type: 'circle', radius: 0.5 }],
        isSensor: true
      });
      
      trigger.onEnter((body: any) => {
        if (body === this.player?.physicsBody) {
          this.collectItem(sprite, collectible.points);
        }
      });
    });
  }
  
  private createHUD(): void {
    if (!this.app) return;
    
    this.hudContainer = new PIXI.Container();
    
    // Score text
    this.scoreText = new PIXI.Text('Score: 0', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2
    });
    this.scoreText.x = 20;
    this.scoreText.y = 20;
    
    // Health text
    this.healthText = new PIXI.Text('Health: 100', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0x4CAF50,
      stroke: 0x000000,
      strokeThickness: 2
    });
    this.healthText.x = 20;
    this.healthText.y = 50;
    
    // Lives text
    this.livesText = new PIXI.Text('Lives: 3', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xFF5722,
      stroke: 0x000000,
      strokeThickness: 2
    });
    this.livesText.x = 20;
    this.livesText.y = 80;
    
    this.hudContainer.addChild(this.scoreText);
    this.hudContainer.addChild(this.healthText);
    this.hudContainer.addChild(this.livesText);
    
    this.app.stage.addChild(this.hudContainer);
  }
  
  private collectItem(sprite: PIXI.Sprite, points: number): void {
    if (!this.player) return;
    
    // Add score
    this.player.addScore(points);
    
    // Remove sprite
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    }
    
    // Remove from collectibles array
    const index = this.collectibles.indexOf(sprite);
    if (index > -1) {
      this.collectibles.splice(index, 1);
    }
    
    // Play collect sound effect (you would implement this)
    console.log(`Collected item worth ${points} points!`);
  }
  
  private updateHUD(): void {
    if (!this.player) return;
    
    if (this.scoreText) {
      this.scoreText.text = `Score: ${this.player.score}`;
    }
    
    if (this.healthText) {
      this.healthText.text = `Health: ${this.player.health}`;
      // Change color based on health
      if (this.player.health > 60) {
        this.healthText.style.fill = 0x4CAF50; // Green
      } else if (this.player.health > 30) {
        this.healthText.style.fill = 0xFF9800; // Orange
      } else {
        this.healthText.style.fill = 0xFF5722; // Red
      }
    }
    
    if (this.livesText) {
      this.livesText.text = `Lives: ${this.player.lives}`;
    }
  }
  
  private updateCamera(): void {
    if (!this.app || !this.player) return;
    
    const playerPos = this.player.getPosition();
    
    // Smooth camera following
    this.cameraTarget.x = -playerPos.x + this.app.screen.width / 2;
    this.cameraTarget.y = -playerPos.y + this.app.screen.height * 0.7;
    
    // Clamp camera to level bounds
    this.cameraTarget.x = Math.min(0, Math.max(this.cameraTarget.x, -1600 + this.app.screen.width));
    this.cameraTarget.y = Math.min(0, this.cameraTarget.y);
    
    // Apply camera position to stage (smooth interpolation)
    this.app.stage.x += (this.cameraTarget.x - this.app.stage.x) * 0.1;
    this.app.stage.y += (this.cameraTarget.y - this.app.stage.y) * 0.1;
    
    // Keep HUD fixed to camera
    if (this.hudContainer) {
      this.hudContainer.x = -this.app.stage.x;
      this.hudContainer.y = -this.app.stage.y;
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
    if (!this.isActive || !this.player || !this.inputSystem) return;
    
    // Update physics simulation
    Physics.step(deltaTime / 1000); // Convert to seconds
    
    // Get input
    const input = this.inputSystem.update();
    
    // Update player
    this.player.update(deltaTime, input);
    
    // Update camera
    this.updateCamera();
    
    // Update HUD
    this.updateHUD();
    
    // Animate collectibles
    this.animateCollectibles(deltaTime);
    
    // Check win condition
    if (this.collectibles.length === 0) {
      console.log('Level completed!');
      // Switch to next level or victory scene
    }
    
    // Check game over condition
    if (this.player.lives <= 0) {
      console.log('Game Over!');
      // Switch to game over scene
    }
  }
  
  private animateCollectibles(deltaTime: number): void {
    const time = Date.now() * 0.005;
    
    this.collectibles.forEach((collectible, index) => {
      // Floating animation
      collectible.y += Math.sin(time + index) * 0.5;
      
      // Subtle rotation
      collectible.rotation += 0.02;
    });
  }
  
  render(renderer: any): void {
    // Rendering is handled automatically by Pixi.js
  }
  
  destroy(): void {
    console.log('Destroying game scene...');
    
    // Clean up player
    if (this.player) {
      this.player.destroy();
    }
    
    // Clean up platforms
    this.platforms.forEach(platform => {
      if (platform.parent) {
        platform.parent.removeChild(platform);
      }
    });
    
    // Clean up collectibles
    this.collectibles.forEach(collectible => {
      if (collectible.parent) {
        collectible.parent.removeChild(collectible);
      }
    });
    
    // Clean up HUD
    if (this.hudContainer && this.hudContainer.parent) {
      this.hudContainer.parent.removeChild(this.hudContainer);
    }
    
    // Clear physics world
    Physics.clear();
    
    console.log('Game scene destroyed');
  }
}
```

## Step 6: Menu Scene

Create a simple menu scene in `src/scenes/MenuScene.ts`:

```typescript
import { Scene, Renderer, Scenes } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

export class MenuScene implements Scene {
  public readonly id = 'menu';
  public readonly name = 'Main Menu';
  public isActive = false;
  
  private app: PIXI.Application | null = null;
  private menuContainer: PIXI.Container | null = null;
  
  async initialize(): Promise<void> {
    console.log('Initializing menu scene...');
    
    this.app = Renderer.getPixiApp();
    if (!this.app) {
      throw new Error('Pixi app not available');
    }
    
    this.createMenu();
  }
  
  private createMenu(): void {
    if (!this.app) return;
    
    this.menuContainer = new PIXI.Container();
    
    // Background
    const background = new PIXI.Graphics();
    background.beginFill(0x87CEEB);
    background.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    background.endFill();
    this.menuContainer.addChild(background);
    
    // Title
    const title = new PIXI.Text('Platformer Game', {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4,
      align: 'center'
    });
    title.anchor.set(0.5);
    title.x = this.app.screen.width / 2;
    title.y = 150;
    this.menuContainer.addChild(title);
    
    // Start button
    const startButton = this.createButton('Start Game', this.app.screen.width / 2, 300, () => {
      Scenes.switchTo('game');
    });
    this.menuContainer.addChild(startButton);
    
    // Instructions
    const instructions = new PIXI.Text(
      'Use ARROW KEYS or A/D to move\nSPACE or W to jump\nCollect all coins and gems!',
      {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2,
        align: 'center'
      }
    );
    instructions.anchor.set(0.5);
    instructions.x = this.app.screen.width / 2;
    instructions.y = 450;
    this.menuContainer.addChild(instructions);
    
    this.app.stage.addChild(this.menuContainer);
  }
  
  private createButton(text: string, x: number, y: number, onClick: () => void): PIXI.Container {
    const button = new PIXI.Container();
    
    // Button background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x4CAF50);
    bg.drawRoundedRect(-100, -25, 200, 50, 10);
    bg.endFill();
    
    // Button text
    const buttonText = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center'
    });
    buttonText.anchor.set(0.5);
    
    button.addChild(bg);
    button.addChild(buttonText);
    button.x = x;
    button.y = y;
    
    // Make interactive
    button.interactive = true;
    button.buttonMode = true;
    
    button.on('pointerdown', onClick);
    button.on('pointerover', () => {
      bg.tint = 0x45A049;
    });
    button.on('pointerout', () => {
      bg.tint = 0xffffff;
    });
    
    return button;
  }
  
  activate(): void {
    this.isActive = true;
    console.log('Menu scene activated');
  }
  
  deactivate(): void {
    this.isActive = false;
    console.log('Menu scene deactivated');
  }
  
  update(deltaTime: number): void {
    // Menu doesn't need complex updates
  }
  
  render(renderer: any): void {
    // Rendering handled automatically
  }
  
  destroy(): void {
    if (this.menuContainer && this.menuContainer.parent) {
      this.menuContainer.parent.removeChild(this.menuContainer);
    }
    console.log('Menu scene destroyed');
  }
}
```

## Step 7: Main Application

Finally, update `src/main.ts` to tie everything together:

```typescript
import { 
  createGame, 
  initializeFacades, 
  RenderingMode,
  Scenes
} from '@gamebyte/framework';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

// Create the game application
const app = createGame();

// Initialize facades for static access
initializeFacades(app);

async function main() {
  try {
    console.log('Starting Platformer Game...');
    
    // Get the canvas element
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    // Initialize the framework with 2D rendering
    await app.initialize(canvas, RenderingMode.PIXI_2D, {
      width: 800,
      height: 600,
      backgroundColor: 0x87CEEB,
      resizeTo: window,
      antialias: true
    });
    
    // Create and register scenes
    const menuScene = new MenuScene();
    const gameScene = new GameScene();
    
    Scenes.add(menuScene);
    Scenes.add(gameScene);
    
    // Start with the menu scene
    await Scenes.switchTo('menu');
    
    // Start the game loop
    app.start();
    
    console.log('Platformer Game started successfully!');
    
  } catch (error) {
    console.error('Failed to start game:', error);
  }
}

// Start the game
main();
```

## Step 8: HTML Setup

Update your `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Platformer Game - GameByte Framework</title>
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
            touch-action: none;
            overflow: hidden;
        }
        
        #game-canvas {
            display: block;
            border: 2px solid #333;
            max-width: 100vw;
            max-height: 100vh;
        }
        
        /* Loading screen */
        #loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 24px;
            z-index: 1000;
        }
        
        @media (max-width: 768px) {
            #game-canvas {
                width: 100vw;
                height: 100vh;
                border: none;
            }
        }
    </style>
</head>
<body>
    <div id="loading">Loading GameByte Platformer...</div>
    <canvas id="game-canvas"></canvas>
    
    <script type="module">
        // Hide loading screen when page is loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
            }, 1000);
        });
    </script>
    <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

## Step 9: Run Your Game

Start the development server:

```bash
npm run dev
```

Open your browser to `http://localhost:3000` and you should see:

1. **Menu Screen**: Title, start button, and instructions
2. **Game Screen**: 2D platformer with:
   - Player character that can run and jump
   - Physics-based movement with realistic gravity
   - Platforms to jump on
   - Collectible coins and gems
   - Score, health, and lives display
   - Smooth camera following
   - Mobile touch controls

## Step 10: Game Features Walkthrough

### Player Movement
- **Keyboard**: Arrow keys or WASD for movement, Space/W for jumping
- **Mobile**: Touch areas for movement and jump button
- **Physics**: Realistic platformer physics with coyote time and jump buffering

### Collectibles
- **Coins**: Worth 10 points each (yellow squares)
- **Gems**: Worth 50 points each (pink squares)
- **Animation**: Floating and rotating animations

### HUD System
- **Score**: Tracks collected items
- **Health**: Shows player health (changes color based on amount)
- **Lives**: Remaining lives counter

### Camera System
- **Following**: Smoothly follows the player
- **Bounds**: Stays within level boundaries
- **HUD**: UI elements stay fixed to camera

## Next Steps

Congratulations! You've built a complete 2D platformer game. Here are some enhancements you can add:

### 1. Add Enemies
```typescript
// Create enemies with AI
class Enemy {
  // Implementation for moving enemies
}
```

### 2. Add Sound Effects
```typescript
import { Audio } from '@gamebyte/framework';

// In player jump
Audio.playSFX('jump.wav');

// Background music
Audio.playMusic('background.mp3', { loop: true });
```

### 3. Add Animations
```typescript
// Use sprite sheets for better animations
const playerRunAnimation = PIXI.AnimatedSprite.fromFrames([
  'player_run_01.png',
  'player_run_02.png',
  'player_run_03.png'
]);
```

### 4. Add Particle Effects
```typescript
import { Physics } from '@gamebyte/framework';

// Create particle system for jump dust
const jumpParticles = Physics.createParticleSystem({
  // Particle configuration
});
```

### 5. Add More Levels
```typescript
// Create level data files
const levels = [
  { id: 1, file: 'level1.json' },
  { id: 2, file: 'level2.json' }
];
```

## Complete Project Structure

Your final project should look like this:

```
src/
├── main.ts                 # ✅ Entry point
├── scenes/                 # ✅ Game scenes
│   ├── MenuScene.ts        # ✅ Main menu
│   └── GameScene.ts        # ✅ Main gameplay
├── entities/               # ✅ Game objects
│   └── Player.ts           # ✅ Player character
├── systems/                # ✅ Game systems
│   └── InputSystem.ts      # ✅ Input handling
└── utils/                  # ✅ Utility functions
    └── AssetLoader.ts      # ✅ Asset loading
```

## Resources

- [Physics System Documentation](../physics/overview.md)
- [Input System Documentation](../input/overview.md)
- [Scene Management Documentation](../scenes/overview.md)
- [Mobile Optimization Guide](../mobile/overview.md)

---

**Excellent work!** You've successfully created a complete 2D platformer game using GameByte Framework. This tutorial covered all the core concepts you need to build professional-quality mobile games. Ready for more advanced features? Check out our [Advanced Tutorials](../examples/advanced-tutorials.md)!