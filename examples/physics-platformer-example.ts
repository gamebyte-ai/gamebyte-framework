/**
 * GameByte Physics System Example - 2D Platformer Game
 * 
 * This example demonstrates how to use the comprehensive physics integration system
 * to create a 2D platformer game with advanced features like:
 * - Character physics with ground detection and jumping
 * - Mobile-optimized performance
 * - Collision detection and response
 * - Trigger zones for level progression
 * - Physics-based particles
 */

import {
  createMobileGame,
  initializeFacades,
  Physics,
  Input,
  RenderingMode,
  PhysicsBodyConfig,
  PhysicsWorldConfig,
  PlatformerPhysicsHelper,
  TriggerZone,
  PhysicsParticleSystem,
  PhysicsBody
} from '../src/index';

// Initialize the game
const game = createMobileGame();
initializeFacades(game);

class PlatformerGameExample {
  private character: PhysicsBody | null = null;
  private platformerHelper: PlatformerPhysicsHelper | null = null;
  private goalTrigger: TriggerZone | null = null;
  private particleSystem: PhysicsParticleSystem | null = null;

  async initialize() {
    // Initialize renderer for 2D
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    await game.initialize(canvas, RenderingMode.RENDERER_2D, {
      width: 800,
      height: 600,
      backgroundColor: 0x87CEEB // Sky blue
    });

    // Initialize physics system for 2D
    await Physics.initialize('2d', 'matter');

    // Create physics world with platformer-friendly settings
    const worldConfig: PhysicsWorldConfig = {
      dimension: '2d',
      gravity: { x: 0, y: 9.82 }, // Realistic gravity
      allowSleep: true,
      enableCCD: true,
      iterations: {
        velocity: 6,
        position: 4
      },
      timeStep: 1/60
    };

    const world = Physics.createWorld(worldConfig);
    Physics.setActiveWorld(world);

    // Enable mobile optimizations
    Physics.enableMobileOptimizations();

    // Create game objects
    this.createLevel();
    this.createCharacter();
    this.createTriggers();
    this.createParticleEffects();

    // Setup input handling
    this.setupInput();

    // Start physics simulation
    Physics.start();

    console.log('2D Platformer physics example initialized!');
  }

  private createLevel() {
    // Create ground material
    const groundMaterial = Physics.createMaterial({
      id: 'ground',
      name: 'Ground',
      friction: 0.8,
      restitution: 0.1,
      density: 0
    });

    // Create ground platform
    const groundConfig: PhysicsBodyConfig = {
      id: 'ground',
      type: 'static',
      position: { x: 0, y: 10 },
      shapes: [{
        type: 'box',
        dimensions: { x: 20, y: 1 }
      }],
      material: groundMaterial,
      collisionGroup: 1,
      collisionMask: 0xFFFFFFFF
    };

    Physics.createBody(groundConfig);

    // Create floating platforms
    const platforms = [
      { x: 5, y: 5, width: 3, height: 0.5 },
      { x: -5, y: 3, width: 3, height: 0.5 },
      { x: 10, y: 7, width: 2, height: 0.5 },
      { x: -8, y: 6, width: 2, height: 0.5 }
    ];

    platforms.forEach((platform, index) => {
      const platformConfig: PhysicsBodyConfig = {
        id: `platform_${index}`,
        type: 'static',
        position: { x: platform.x, y: platform.y },
        shapes: [{
          type: 'box',
          dimensions: { x: platform.width, y: platform.height }
        }],
        material: groundMaterial,
        collisionGroup: 1,
        collisionMask: 0xFFFFFFFF
      };

      Physics.createBody(platformConfig);
    });

    // Create walls to contain the player
    const wallConfigs = [
      { x: -12, y: 0, width: 1, height: 20 }, // Left wall
      { x: 12, y: 0, width: 1, height: 20 }   // Right wall
    ];

    wallConfigs.forEach((wall, index) => {
      const wallConfig: PhysicsBodyConfig = {
        id: `wall_${index}`,
        type: 'static',
        position: { x: wall.x, y: wall.y },
        shapes: [{
          type: 'box',
          dimensions: { x: wall.width, y: wall.height }
        }],
        material: groundMaterial,
        collisionGroup: 1,
        collisionMask: 0xFFFFFFFF
      };

      Physics.createBody(wallConfig);
    });
  }

  private createCharacter() {
    // Create player material
    const playerMaterial = Physics.createMaterial({
      id: 'player',
      name: 'Player',
      friction: 0.1,
      restitution: 0.0,
      density: 1.0,
      frictionAir: 0.01
    });

    // Create character physics body
    const characterConfig: PhysicsBodyConfig = {
      id: 'player',
      type: 'dynamic',
      position: { x: 0, y: 0 },
      shapes: [{
        type: 'box',
        dimensions: { x: 0.8, y: 1.6 }
      }],
      material: playerMaterial,
      mass: 1,
      fixedRotation: true, // Prevent character from rotating
      allowSleep: false,   // Keep character always active
      collisionGroup: 2,
      collisionMask: 0xFFFFFFFF
    };

    this.character = Physics.createBody(characterConfig);

    // Create platformer helper for advanced movement
    this.platformerHelper = Physics.createPlatformerHelper(this.character);

    // Configure platformer settings
    this.platformerHelper.setMovementSettings({
      maxSpeed: 6,
      acceleration: 25,
      deceleration: 20,
      airAcceleration: 15,
      jumpForce: 12,
      wallJumpForce: 10,
      coyoteTime: 0.15,
      jumpBufferTime: 0.15
    });

    // Configure ground detection
    this.platformerHelper.setGroundDetection({
      rayLength: 0.1,
      rayOffset: 0,
      groundMask: 1
    });

    // Configure wall detection
    this.platformerHelper.setWallDetection({
      rayLength: 0.1,
      rayOffset: 0,
      wallMask: 1
    });

    // Enable advanced features
    this.platformerHelper.enableDoubleJump(true);
    this.platformerHelper.enableWallSliding(true);
    this.platformerHelper.enableCoyoteTime(true);
    this.platformerHelper.enableJumpBuffering(true);

    // Listen to platformer events
    this.platformerHelper.on('jump', () => {
      console.log('Player jumped!');
      this.createJumpParticles();
    });

    this.platformerHelper.on('wall-jump', (data) => {
      console.log('Player wall jumped!', data);
      this.createJumpParticles();
    });

    this.platformerHelper.on('landed', () => {
      console.log('Player landed!');
      this.createLandingParticles();
    });

    this.platformerHelper.on('grounded-changed', (grounded) => {
      console.log('Player grounded state:', grounded);
    });
  }

  private createTriggers() {
    // Create goal trigger zone
    const goalConfig: PhysicsBodyConfig = {
      id: 'goal',
      type: 'static',
      position: { x: 10, y: 2 },
      shapes: [{
        type: 'box',
        dimensions: { x: 1, y: 2 }
      }],
      isSensor: true,
      collisionGroup: 4,
      collisionMask: 2 // Only collide with player
    };

    this.goalTrigger = Physics.createTriggerZone(goalConfig);

    // Setup trigger events
    this.goalTrigger.onEnter((body) => {
      if (body.id === 'player') {
        console.log('Player reached the goal!');
        this.createWinParticles();
        // Could trigger level completion, scene transition, etc.
      }
    });

    // Create checkpoint triggers
    const checkpoints = [
      { x: 5, y: 3, id: 'checkpoint_1' },
      { x: -5, y: 1, id: 'checkpoint_2' }
    ];

    checkpoints.forEach((checkpoint) => {
      const checkpointConfig: PhysicsBodyConfig = {
        id: checkpoint.id,
        type: 'static',
        position: { x: checkpoint.x, y: checkpoint.y },
        shapes: [{
          type: 'circle',
          dimensions: { x: 0.5, y: 0.5 },
          radius: 0.5
        }],
        isSensor: true,
        collisionGroup: 4,
        collisionMask: 2
      };

      const checkpointTrigger = Physics.createTriggerZone(checkpointConfig);
      
      checkpointTrigger.onEnter((body) => {
        if (body.id === 'player') {
          console.log(`Checkpoint ${checkpoint.id} activated!`);
          this.createCheckpointParticles(checkpoint.x, checkpoint.y);
        }
      });
    });
  }

  private createParticleEffects() {
    // Create main particle system for various effects
    const particleConfig = {
      baseConfig: {
        type: 'dynamic',
        position: { x: 0, y: 0 },
        shapes: [{
          type: 'circle',
          dimensions: { x: 0.05, y: 0.05 },
          radius: 0.025
        }],
        mass: 0.1,
        material: Physics.getMaterial('bouncy') || undefined
      },
      emissionRate: 0, // We'll emit manually
      lifetime: { min: 0.5, max: 1.5 },
      velocity: {
        min: { x: -2, y: 0 },
        max: { x: 2, y: 4 }
      },
      forceOverTime: { x: 0, y: 9.82 }, // Gravity
      maxParticles: 50,
      burstMode: true
    };

    this.particleSystem = Physics.createParticleSystem(particleConfig);
  }

  private setupInput() {
    if (!this.platformerHelper) return;

    // Handle keyboard input for desktop testing
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.platformerHelper!.setHorizontalInput(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.platformerHelper!.setHorizontalInput(1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ': // Spacebar
          event.preventDefault();
          this.platformerHelper!.jump();
          break;
      }
    });

    document.addEventListener('keyup', (event) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.platformerHelper!.setHorizontalInput(0);
          break;
      }
    });

    // Touch input for mobile (simplified)
    let touchStartX = 0;
    let isJumping = false;

    document.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      
      // If touch is in upper half, jump
      if (touch.clientY < window.innerHeight / 2) {
        isJumping = true;
        this.platformerHelper!.jump();
      }
    });

    document.addEventListener('touchmove', (event) => {
      event.preventDefault();
      if (isJumping) return;
      
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const sensitivity = 0.01;
      
      // Calculate horizontal input based on touch movement
      let horizontalInput = Math.max(-1, Math.min(1, deltaX * sensitivity));
      this.platformerHelper!.setHorizontalInput(horizontalInput);
    });

    document.addEventListener('touchend', (event) => {
      event.preventDefault();
      isJumping = false;
      this.platformerHelper!.setHorizontalInput(0);
    });
  }

  private createJumpParticles() {
    if (!this.particleSystem || !this.character) return;
    
    const position = this.character.position;
    this.particleSystem.burst(8, {
      type: 'dynamic',
      position: { x: position.x, y: position.y + 0.8 },
      shapes: [{
        type: 'circle',
        dimensions: { x: 0.03, y: 0.03 },
        radius: 0.015
      }],
      mass: 0.05,
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 2 + 1
      }
    });
  }

  private createLandingParticles() {
    if (!this.particleSystem || !this.character) return;
    
    const position = this.character.position;
    this.particleSystem.burst(5, {
      type: 'dynamic',
      position: { x: position.x, y: position.y + 0.8 },
      shapes: [{
        type: 'circle',
        dimensions: { x: 0.02, y: 0.02 },
        radius: 0.01
      }],
      mass: 0.03,
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: Math.random() * 1
      }
    });
  }

  private createWinParticles() {
    if (!this.particleSystem || !this.character) return;
    
    const position = this.character.position;
    this.particleSystem.burst(20, {
      type: 'dynamic',
      position: { x: position.x, y: position.y },
      shapes: [{
        type: 'circle',
        dimensions: { x: 0.04, y: 0.04 },
        radius: 0.02
      }],
      mass: 0.02,
      velocity: {
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 8 + 2
      }
    });
  }

  private createCheckpointParticles(x: number, y: number) {
    if (!this.particleSystem) return;
    
    this.particleSystem.burst(10, {
      type: 'dynamic',
      position: { x, y },
      shapes: [{
        type: 'circle',
        dimensions: { x: 0.03, y: 0.03 },
        radius: 0.015
      }],
      mass: 0.03,
      velocity: {
        x: (Math.random() - 0.5) * 3,
        y: Math.random() * 3 + 1
      }
    });
  }

  // Game loop update
  update(deltaTime: number) {
    // Update platformer helper (handles movement, ground detection, etc.)
    if (this.platformerHelper) {
      this.platformerHelper.update(deltaTime);
    }

    // Update particle system
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }

    // Debug output
    if (this.character && this.platformerHelper) {
      const state = this.platformerHelper.getMovementState();
      const position = this.character.position;
      const velocity = this.character.velocity;
      
      // Update debug info every 60 frames
      if (Math.random() < 0.016) { // ~60fps
        console.log(`Player State: ${state}, Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}), Velocity: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)})`);
        
        // Performance metrics
        const metrics = Physics.getPerformanceMetrics();
        console.log(`Physics Performance: ${metrics.activeBodies} active bodies, ${metrics.averageStepTime.toFixed(2)}ms step time`);
      }
    }
  }

  destroy() {
    // Clean up resources
    if (this.platformerHelper) {
      this.platformerHelper.removeAllListeners();
    }
    
    if (this.goalTrigger) {
      this.goalTrigger.destroy();
    }
    
    if (this.particleSystem) {
      this.particleSystem.destroy();
    }
    
    Physics.clear();
  }
}

// Create and initialize the example
const platformerExample = new PlatformerGameExample();

// Start the example when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await platformerExample.initialize();
    
    // Start game loop
    let lastTime = 0;
    function gameLoop(currentTime: number) {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      platformerExample.update(deltaTime);
      requestAnimationFrame(gameLoop);
    }
    
    requestAnimationFrame(gameLoop);
    
  } catch (error) {
    console.error('Failed to initialize platformer example:', error);
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  platformerExample.destroy();
});

export default platformerExample;