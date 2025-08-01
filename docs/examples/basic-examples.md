# Basic Examples

This collection provides simple, focused examples that demonstrate core GameByte Framework concepts. Each example is designed to be clear, concise, and immediately runnable.

## Hello World Example

The simplest possible GameByte Framework application:

```typescript
import { createGame, initializeFacades, RenderingMode } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

// Create and initialize the framework
async function main() {
  const app = createGame();
  initializeFacades(app);
  
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  // Initialize with 2D rendering
  await app.initialize(canvas, RenderingMode.PIXI_2D, {
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb
  });
  
  // Get Pixi application and add some content
  const pixiApp = app.make('renderer').getPixiApp();
  
  // Create a simple text object
  const text = new PIXI.Text('Hello GameByte!', {
    fontFamily: 'Arial',
    fontSize: 36,
    fill: 0xffffff,
    align: 'center'
  });
  
  text.anchor.set(0.5);
  text.x = pixiApp.screen.width / 2;
  text.y = pixiApp.screen.height / 2;
  
  pixiApp.stage.addChild(text);
  
  // Start the application
  app.start();
}

main().catch(console.error);
```

## Moving Sprite Example

A sprite that moves around the screen with keyboard input:

```typescript
import { createGame, initializeFacades, RenderingMode, Input } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

class MovingSpriteExample {
  private app: any;
  private sprite: PIXI.Sprite;
  private speed = 200; // pixels per second
  
  async initialize() {
    this.app = createGame();
    initializeFacades(this.app);
    
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    await this.app.initialize(canvas, RenderingMode.PIXI_2D, {
      width: 800,
      height: 600,
      backgroundColor: 0x2c3e50
    });
    
    await this.createSprite();
    this.setupInput();
    
    // Start game loop
    this.app.start();
    this.startUpdateLoop();
  }
  
  private async createSprite() {
    const pixiApp = this.app.make('renderer').getPixiApp();
    
    // Create a simple colored rectangle as our sprite
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xe74c3c);
    graphics.drawRect(0, 0, 50, 50);
    graphics.endFill();
    
    const texture = pixiApp.renderer.generateTexture(graphics);
    this.sprite = new PIXI.Sprite(texture);
    
    this.sprite.anchor.set(0.5);
    this.sprite.x = 400;
    this.sprite.y = 300;
    
    pixiApp.stage.addChild(this.sprite);
  }
  
  private setupInput() {
    // Set up keyboard input
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }
  
  private keys: { [key: string]: boolean } = {};
  
  private handleKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true;
  }
  
  private handleKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }
  
  private startUpdateLoop() {
    let lastTime = performance.now();
    
    const update = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      this.updateSprite(deltaTime);
      
      requestAnimationFrame(update);
    };
    
    requestAnimationFrame(update);
  }
  
  private updateSprite(deltaTime: number) {
    const moveDistance = this.speed * deltaTime;
    
    // Handle movement input
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.sprite.x -= moveDistance;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.sprite.x += moveDistance;
    }
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.sprite.y -= moveDistance;
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      this.sprite.y += moveDistance;
    }
    
    // Keep sprite within screen bounds
    const pixiApp = this.app.make('renderer').getPixiApp();
    this.sprite.x = Math.max(25, Math.min(pixiApp.screen.width - 25, this.sprite.x));
    this.sprite.y = Math.max(25, Math.min(pixiApp.screen.height - 25, this.sprite.y));
  }
}

// Start the example
const example = new MovingSpriteExample();
example.initialize().catch(console.error);
```

## Scene Switching Example

Demonstrates how to create and switch between different scenes:

```typescript
import { createGame, initializeFacades, RenderingMode, Scenes, Scene } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

// Menu Scene
class MenuScene implements Scene {
  public readonly id = 'menu';
  public readonly name = 'Main Menu';
  public isActive = false;
  
  private container: PIXI.Container;
  
  async initialize(): Promise<void> {
    const pixiApp = Scenes.getRenderer().getPixiApp();
    this.container = new PIXI.Container();
    
    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x3498db);
    bg.drawRect(0, 0, pixiApp.screen.width, pixiApp.screen.height);
    bg.endFill();
    this.container.addChild(bg);
    
    // Title
    const title = new PIXI.Text('Main Menu', {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xffffff
    });
    title.anchor.set(0.5);
    title.x = pixiApp.screen.width / 2;
    title.y = 150;
    this.container.addChild(title);
    
    // Start button
    const button = this.createButton('Start Game', pixiApp.screen.width / 2, 300, () => {
      Scenes.switchTo('game');
    });
    this.container.addChild(button);
    
    pixiApp.stage.addChild(this.container);
  }
  
  private createButton(text: string, x: number, y: number, onClick: () => void): PIXI.Container {
    const button = new PIXI.Container();
    
    const bg = new PIXI.Graphics();
    bg.beginFill(0x2ecc71);
    bg.lineStyle(2, 0x27ae60);
    bg.drawRoundedRect(-80, -20, 160, 40, 10);
    bg.endFill();
    
    const label = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff
    });
    label.anchor.set(0.5);
    
    button.addChild(bg);
    button.addChild(label);
    button.x = x;
    button.y = y;
    
    button.interactive = true;
    button.buttonMode = true;
    button.on('pointerdown', onClick);
    
    return button;
  }
  
  activate(): void {
    this.isActive = true;
    this.container.visible = true;
  }
  
  deactivate(): void {
    this.isActive = false;
    this.container.visible = false;
  }
  
  update(deltaTime: number): void {
    // Menu doesn't need updates
  }
  
  render(renderer: any): void {
    // Rendering handled automatically
  }
  
  destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
  }
}

// Game Scene
class GameScene implements Scene {
  public readonly id = 'game';
  public readonly name = 'Game Scene';
  public isActive = false;
  
  private container: PIXI.Container;
  private player: PIXI.Sprite;
  
  async initialize(): Promise<void> {
    const pixiApp = Scenes.getRenderer().getPixiApp();
    this.container = new PIXI.Container();
    
    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x2c3e50);
    bg.drawRect(0, 0, pixiApp.screen.width, pixiApp.screen.height);
    bg.endFill();
    this.container.addChild(bg);
    
    // Player
    const playerGraphics = new PIXI.Graphics();
    playerGraphics.beginFill(0xe74c3c);
    playerGraphics.drawCircle(0, 0, 25);
    playerGraphics.endFill();
    
    const playerTexture = pixiApp.renderer.generateTexture(playerGraphics);
    this.player = new PIXI.Sprite(playerTexture);
    this.player.anchor.set(0.5);
    this.player.x = pixiApp.screen.width / 2;
    this.player.y = pixiApp.screen.height / 2;
    
    this.container.addChild(this.player);
    
    // Back button
    const backButton = this.createButton('Back to Menu', 100, 50, () => {
      Scenes.switchTo('menu');
    });
    this.container.addChild(backButton);
    
    pixiApp.stage.addChild(this.container);
  }
  
  private createButton(text: string, x: number, y: number, onClick: () => void): PIXI.Container {
    const button = new PIXI.Container();
    
    const bg = new PIXI.Graphics();
    bg.beginFill(0x95a5a6);
    bg.lineStyle(2, 0x7f8c8d);
    bg.drawRoundedRect(-60, -15, 120, 30, 5);
    bg.endFill();
    
    const label = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff
    });
    label.anchor.set(0.5);
    
    button.addChild(bg);
    button.addChild(label);
    button.x = x;
    button.y = y;
    
    button.interactive = true;
    button.buttonMode = true;
    button.on('pointerdown', onClick);
    
    return button;
  }
  
  activate(): void {
    this.isActive = true;
    this.container.visible = true;
  }
  
  deactivate(): void {
    this.isActive = false;
    this.container.visible = false;
  }
  
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    // Rotate the player
    this.player.rotation += deltaTime * 0.002;
  }
  
  render(renderer: any): void {
    // Rendering handled automatically
  }
  
  destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
  }
}

// Main application
async function main() {
  const app = createGame();
  initializeFacades(app);
  
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  await app.initialize(canvas, RenderingMode.PIXI_2D, {
    width: 800,
    height: 600,
    backgroundColor: 0x34495e
  });
  
  // Create and register scenes
  const menuScene = new MenuScene();
  const gameScene = new GameScene();
  
  Scenes.add(menuScene);
  Scenes.add(gameScene);
  
  // Start with menu scene
  await Scenes.switchTo('menu');
  
  app.start();
}

main().catch(console.error);
```

## Physics Example

A simple physics simulation with bouncing balls:

```typescript
import { createGame, initializeFacades, RenderingMode, Physics } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

class PhysicsExample {
  private app: any;
  private pixiApp: PIXI.Application;
  private balls: { sprite: PIXI.Sprite; body: any }[] = [];
  
  async initialize() {
    this.app = createGame();
    initializeFacades(this.app);
    
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    await this.app.initialize(canvas, RenderingMode.PIXI_2D, {
      width: 800,
      height: 600,
      backgroundColor: 0x2c3e50
    });
    
    this.pixiApp = this.app.make('renderer').getPixiApp();
    
    // Initialize physics
    await Physics.initialize('2d', 'matter');
    
    const world = Physics.createWorld({
      dimension: '2d',
      gravity: { x: 0, y: 9.82 }
    });
    
    await this.createBoundaries();
    await this.createBalls();
    
    Physics.start();
    this.app.start();
    this.startUpdateLoop();
  }
  
  private async createBoundaries() {
    // Ground
    Physics.createBody({
      type: 'static',
      position: { x: 12.5, y: 19 }, // 400px, 608px in physics units (32px = 1 unit)
      shapes: [{ type: 'box', dimensions: { x: 25, y: 1 } }]
    });
    
    // Left wall
    Physics.createBody({
      type: 'static',
      position: { x: -0.5, y: 9.375 },
      shapes: [{ type: 'box', dimensions: { x: 1, y: 18.75 } }]
    });
    
    // Right wall
    Physics.createBody({
      type: 'static',
      position: { x: 25.5, y: 9.375 },
      shapes: [{ type: 'box', dimensions: { x: 1, y: 18.75 } }]
    });
    
    // Ceiling
    Physics.createBody({
      type: 'static',
      position: { x: 12.5, y: -0.5 },
      shapes: [{ type: 'box', dimensions: { x: 25, y: 1 } }]
    });
  }
  
  private async createBalls() {
    const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6];
    
    for (let i = 0; i < 5; i++) {
      // Create physics body
      const body = Physics.createBody({
        type: 'dynamic',
        position: { 
          x: 3 + i * 3, // Spread balls horizontally
          y: 3 + i * 2  // Stack vertically
        },
        shapes: [{ type: 'circle', radius: 0.5 }],
        mass: 1,
        restitution: 0.8 // Bounciness
      });
      
      // Create sprite
      const graphics = new PIXI.Graphics();
      graphics.beginFill(colors[i]);
      graphics.drawCircle(0, 0, 16); // 16px radius = 0.5 physics units
      graphics.endFill();
      
      const texture = this.pixiApp.renderer.generateTexture(graphics);
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);
      
      this.pixiApp.stage.addChild(sprite);
      
      this.balls.push({ sprite, body });
    }
  }
  
  private startUpdateLoop() {
    let lastTime = performance.now();
    
    const update = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Update physics
      Physics.step(deltaTime);
      
      // Sync sprites with physics bodies
      this.balls.forEach(({ sprite, body }) => {
        sprite.x = body.position.x * 32; // Convert physics units to pixels
        sprite.y = body.position.y * 32;
        sprite.rotation = body.rotation;
      });
      
      requestAnimationFrame(update);
    };
    
    requestAnimationFrame(update);
  }
}

// Start the example
const example = new PhysicsExample();
example.initialize().catch(console.error);
```

## Audio Example

Playing sound effects and background music:

```typescript
import { createGame, initializeFacades, RenderingMode, Audio } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

class AudioExample {
  private app: any;
  private pixiApp: PIXI.Application;
  
  async initialize() {
    this.app = createGame();
    initializeFacades(this.app);
    
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    await this.app.initialize(canvas, RenderingMode.PIXI_2D, {
      width: 800,
      height: 600,
      backgroundColor: 0x2c3e50
    });
    
    this.pixiApp = this.app.make('renderer').getPixiApp();
    
    // Initialize audio system
    await Audio.initialize({
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 0.8
    });
    
    await this.createUI();
    
    this.app.start();
  }
  
  private async createUI() {
    // Title
    const title = new PIXI.Text('Audio Example', {
      fontFamily: 'Arial',
      fontSize: 36,
      fill: 0xffffff
    });
    title.anchor.set(0.5);
    title.x = this.pixiApp.screen.width / 2;
    title.y = 100;
    this.pixiApp.stage.addChild(title);
    
    // Music button
    const musicButton = this.createButton('Play Music', 200, 250, async () => {
      // For this example, we'll create a simple tone
      // In a real game, you'd load actual audio files
      const oscillator = Audio.createOscillator();
      oscillator.frequency.setValueAtTime(440, 0); // A4 note
      oscillator.type = 'sine';
      oscillator.start();
      
      setTimeout(() => oscillator.stop(), 2000); // Play for 2 seconds
    });
    this.pixiApp.stage.addChild(musicButton);
    
    // SFX button
    const sfxButton = this.createButton('Play SFX', 600, 250, async () => {
      // Create a simple click sound
      const oscillator = Audio.createOscillator();
      const gainNode = Audio.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(Audio.getDestination());
      
      oscillator.frequency.setValueAtTime(800, 0);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, 0);
      gainNode.gain.exponentialRampToValueAtTime(0.01, 0.1);
      
      oscillator.start();
      oscillator.stop(0.1);
    });
    this.pixiApp.stage.addChild(sfxButton);
    
    // Volume controls
    const volumeText = new PIXI.Text('Master Volume: 100%', {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff
    });
    volumeText.anchor.set(0.5);
    volumeText.x = this.pixiApp.screen.width / 2;
    volumeText.y = 400;
    this.pixiApp.stage.addChild(volumeText);
    
    // Volume up button
    const volumeUpButton = this.createButton('+', 500, 450, () => {
      const currentVolume = Audio.getMasterVolume();
      const newVolume = Math.min(1.0, currentVolume + 0.1);
      Audio.setMasterVolume(newVolume);
      volumeText.text = `Master Volume: ${Math.round(newVolume * 100)}%`;
    });
    this.pixiApp.stage.addChild(volumeUpButton);
    
    // Volume down button
    const volumeDownButton = this.createButton('-', 300, 450, () => {
      const currentVolume = Audio.getMasterVolume();
      const newVolume = Math.max(0.0, currentVolume - 0.1);
      Audio.setMasterVolume(newVolume);
      volumeText.text = `Master Volume: ${Math.round(newVolume * 100)}%`;
    });
    this.pixiApp.stage.addChild(volumeDownButton);
  }
  
  private createButton(text: string, x: number, y: number, onClick: () => void): PIXI.Container {
    const button = new PIXI.Container();
    
    const bg = new PIXI.Graphics();
    bg.beginFill(0x3498db);
    bg.lineStyle(2, 0x2980b9);
    bg.drawRoundedRect(-60, -25, 120, 50, 10);
    bg.endFill();
    
    const label = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff
    });
    label.anchor.set(0.5);
    
    button.addChild(bg);
    button.addChild(label);
    button.x = x;
    button.y = y;
    
    button.interactive = true;
    button.buttonMode = true;
    button.on('pointerdown', onClick);
    
    // Hover effects
    button.on('pointerover', () => {
      bg.tint = 0x5dade2;
    });
    
    button.on('pointerout', () => {
      bg.tint = 0xffffff;
    });
    
    return button;
  }
}

// Start the example
const example = new AudioExample();
example.initialize().catch(console.error);
```

## Mobile Touch Example

A mobile-optimized example with touch controls:

```typescript
import { createMobileGame, initializeFacades, RenderingMode, Input } from '@gamebyte/framework';
import * as PIXI from 'pixi.js';

class MobileTouchExample {
  private app: any;
  private pixiApp: PIXI.Application;
  private player: PIXI.Sprite;
  private joystick: any;
  private jumpButton: any;
  private velocity = { x: 0, y: 0 };
  private onGround = true;
  
  async initialize() {
    // Create mobile-optimized game
    this.app = createMobileGame({
      adaptiveQuality: true,
      touchControls: true
    });
    
    initializeFacades(this.app);
    
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    await this.app.initialize(canvas, RenderingMode.PIXI_2D, {
      width: 800,
      height: 600,
      backgroundColor: 0x2c3e50,
      resizeTo: window // Auto-resize for mobile
    });
    
    this.pixiApp = this.app.make('renderer').getPixiApp();
    
    await this.createPlayer();
    await this.createTouchControls();
    
    this.app.start();
    this.startUpdateLoop();
  }
  
  private async createPlayer() {
    // Create player sprite
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xe74c3c);
    graphics.drawRect(0, 0, 40, 60);
    graphics.endFill();
    
    const texture = this.pixiApp.renderer.generateTexture(graphics);
    this.player = new PIXI.Sprite(texture);
    this.player.anchor.set(0.5, 1);
    this.player.x = this.pixiApp.screen.width / 2;
    this.player.y = this.pixiApp.screen.height - 50;
    
    this.pixiApp.stage.addChild(this.player);
    
    // Create ground
    const ground = new PIXI.Graphics();
    ground.beginFill(0x27ae60);
    ground.drawRect(0, this.pixiApp.screen.height - 50, this.pixiApp.screen.width, 50);
    ground.endFill();
    this.pixiApp.stage.addChild(ground);
  }
  
  private async createTouchControls() {
    // Virtual joystick
    this.joystick = Input.createVirtualJoystick({
      position: { x: 100, y: this.pixiApp.screen.height - 100 },
      size: 80,
      deadZone: 0.2,
      color: 0x3498db,
      knobColor: 0x2980b9
    });
    
    // Jump button
    this.jumpButton = Input.createTouchButton({
      position: { x: this.pixiApp.screen.width - 100, y: this.pixiApp.screen.height - 100 },
      size: 60,
      text: 'JUMP',
      color: 0xe74c3c,
      textColor: 0xffffff
    });
    
    // Handle jump button
    this.jumpButton.on('press', () => {
      if (this.onGround) {
        this.velocity.y = -400; // Jump velocity
        this.onGround = false;
      }
    });
    
    // Enable gesture recognition
    Input.enableGestures(['tap', 'swipe']);
    
    // Handle swipe gestures
    Input.on('swipe', (gesture) => {
      if (gesture.direction === 'up' && this.onGround) {
        this.velocity.y = -400; // Swipe up to jump
        this.onGround = false;
      }
    });
  }
  
  private startUpdateLoop() {
    let lastTime = performance.now();
    
    const update = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      this.updatePlayer(deltaTime);
      
      requestAnimationFrame(update);
    };
    
    requestAnimationFrame(update);
  }
  
  private updatePlayer(deltaTime: number) {
    // Get joystick input
    const joystickInput = this.joystick.getValue();
    
    // Horizontal movement
    if (Math.abs(joystickInput.x) > 0.1) {
      this.velocity.x = joystickInput.x * 200; // Max speed 200 px/s
    } else {
      this.velocity.x *= 0.8; // Friction
    }
    
    // Gravity
    if (!this.onGround) {
      this.velocity.y += 980 * deltaTime; // Gravity acceleration
    }
    
    // Update position
    this.player.x += this.velocity.x * deltaTime;
    this.player.y += this.velocity.y * deltaTime;
    
    // Screen boundaries
    this.player.x = Math.max(20, Math.min(this.pixiApp.screen.width - 20, this.player.x));
    
    // Ground collision
    const groundY = this.pixiApp.screen.height - 50;
    if (this.player.y >= groundY) {
      this.player.y = groundY;
      this.velocity.y = 0;
      this.onGround = true;
    }
    
    // Visual feedback - tilt player based on movement
    if (this.velocity.x > 10) {
      this.player.rotation = 0.1;
    } else if (this.velocity.x < -10) {
      this.player.rotation = -0.1;
    } else {
      this.player.rotation = 0;
    }
  }
}

// Start the example
const example = new MobileTouchExample();
example.initialize().catch(console.error);
```

## HTML Template

Use this HTML template for all the examples above:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>GameByte Framework Example</title>
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
        }
        
        #game-canvas {
            display: block;
            border: 2px solid #333;
            max-width: 100vw;
            max-height: 100vh;
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
    <canvas id="game-canvas"></canvas>
    <script type="module" src="./main.ts"></script>
</body>
</html>
```

## Running the Examples

1. **Set up a new project:**
```bash
npx create-gamebyte-app my-example
cd my-example
```

2. **Replace the contents of `src/main.ts` with any example code above**

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser to `http://localhost:3000`**

## Next Steps

Once you're comfortable with these basic examples:

- **[Game Templates](./game-templates.md)** - Complete starter projects
- **[Advanced Tutorials](./advanced-tutorials.md)** - Complex game mechanics
- **[Best Practices](./best-practices.md)** - Code organization and optimization

These examples provide a solid foundation for understanding GameByte Framework concepts. Each example is self-contained and demonstrates specific features you can build upon in your own games.