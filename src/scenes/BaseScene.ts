import { EventEmitter } from 'eventemitter3';
import { Scene } from '../contracts/Scene';
import * as PIXI from 'pixi.js';
import * as THREE from 'three';

/**
 * Base scene implementation for 2D games (Pixi.js)
 *
 * Provides:
 * - Pixi container management
 * - Lifecycle methods (initialize, activate, deactivate, update, render, destroy)
 * - Event handling
 * - Ready-to-extend base for game scenes
 *
 * @example
 * ```typescript
 * class GameplayScene extends BaseScene {
 *     constructor() {
 *         super('gameplay', 'Gameplay Scene');
 *     }
 *
 *     async initialize() {
 *         await super.initialize();
 *         // Add your game objects to this.container
 *         const sprite = PIXI.Sprite.from('player.png');
 *         this.container.addChild(sprite);
 *     }
 *
 *     update(deltaTime: number) {
 *         super.update(deltaTime);
 *         // Update your game logic
 *     }
 * }
 * ```
 */
export class BaseScene extends EventEmitter implements Scene {
  public readonly id: string;
  public readonly name: string;
  protected _isActive: boolean = false;
  protected container: PIXI.Container;
  protected initialized: boolean = false;

  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
    this.container = new PIXI.Container();
  }

  /**
   * Whether the scene is currently active
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Get the Pixi container for this scene
   */
  getContainer(): PIXI.Container {
    return this.container;
  }

  /**
   * Initialize the scene
   * Override this in your scene to add initialization logic
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.emit('initializing');
    // Override in subclass to add game objects
    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Called when the scene becomes active
   * Override this to add activation logic
   */
  activate(): void {
    this._isActive = true;
    this.container.visible = true;
    this.emit('activated');
  }

  /**
   * Called when the scene becomes inactive
   * Override this to add deactivation logic
   */
  deactivate(): void {
    this._isActive = false;
    this.container.visible = false;
    this.emit('deactivated');
  }

  /**
   * Update the scene logic
   * Override this to add game logic
   *
   * @param deltaTime Time since last frame in milliseconds
   */
  update(deltaTime: number): void {
    if (!this._isActive) {
      return;
    }

    this.emit('update', deltaTime);
  }

  /**
   * Render the scene
   * Default implementation renders the Pixi container
   *
   * @param renderer The renderer instance
   */
  render(renderer: any): void {
    if (!this._isActive || !this.container) {
      return;
    }

    // Get Pixi renderer and render container
    const pixiRenderer = renderer.getRenderer();
    if (pixiRenderer && pixiRenderer.render) {
      pixiRenderer.render(this.container);
    }

    this.emit('render', renderer);
  }

  /**
   * Clean up scene resources
   * Override this to add cleanup logic
   */
  destroy(): void {
    this.emit('destroying');

    if (this.container) {
      this.container.destroy({ children: true });
    }

    this.removeAllListeners();
    this.initialized = false;
    this._isActive = false;

    this.emit('destroyed');
  }
}

/**
 * Base scene implementation for 3D games (Three.js)
 *
 * Provides:
 * - Three.js scene management
 * - Camera management
 * - Lifecycle methods
 * - Ready-to-extend base for 3D game scenes
 *
 * @example
 * ```typescript
 * class Gameplay3DScene extends BaseScene3D {
 *     constructor() {
 *         super('gameplay3d', 'Gameplay 3D Scene');
 *     }
 *
 *     async initialize() {
 *         await super.initialize();
 *
 *         // Setup camera
 *         this.setupCamera(75, 800/600, 0.1, 1000);
 *         this.camera.position.z = 5;
 *
 *         // Add objects to scene
 *         const geometry = new THREE.BoxGeometry();
 *         const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
 *         const cube = new THREE.Mesh(geometry, material);
 *         this.scene.add(cube);
 *     }
 * }
 * ```
 */
export class BaseScene3D extends EventEmitter implements Scene {
  public readonly id: string;
  public readonly name: string;
  protected _isActive: boolean = false;
  protected scene: THREE.Scene;
  protected camera: THREE.Camera | null = null;
  protected initialized: boolean = false;

  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
    this.scene = new THREE.Scene();
  }

  /**
   * Whether the scene is currently active
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Get the Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera
   */
  getCamera(): THREE.Camera | null {
    return this.camera;
  }

  /**
   * Setup a perspective camera
   */
  protected setupCamera(
    fov: number = 75,
    aspect: number = 1,
    near: number = 0.1,
    far: number = 1000
  ): void {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  }

  /**
   * Setup an orthographic camera
   */
  protected setupOrthographicCamera(
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number = 0.1,
    far: number = 1000
  ): void {
    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
  }

  /**
   * Initialize the scene
   * Override this in your scene to add initialization logic
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.emit('initializing');
    // Override in subclass to add game objects and setup camera
    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Called when the scene becomes active
   * Override this to add activation logic
   */
  activate(): void {
    this._isActive = true;
    this.emit('activated');
  }

  /**
   * Called when the scene becomes inactive
   * Override this to add deactivation logic
   */
  deactivate(): void {
    this._isActive = false;
    this.emit('deactivated');
  }

  /**
   * Update the scene logic
   * Override this to add game logic
   *
   * @param deltaTime Time since last frame in milliseconds
   */
  update(deltaTime: number): void {
    if (!this._isActive) {
      return;
    }

    this.emit('update', deltaTime);
  }

  /**
   * Render the scene
   * Default implementation sets the scene and camera on the renderer
   *
   * @param renderer The renderer instance
   */
  render(renderer: any): void {
    if (!this._isActive || !this.scene || !this.camera) {
      return;
    }

    // Set scene and camera on renderer
    if (renderer.setScene) {
      renderer.setScene(this.scene);
    }
    if (renderer.setCamera && this.camera) {
      renderer.setCamera(this.camera);
    }

    this.emit('render', renderer);
  }

  /**
   * Clean up scene resources
   * Override this to add cleanup logic
   */
  destroy(): void {
    this.emit('destroying');

    // Dispose of Three.js objects
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    this.scene.clear();
    this.camera = null;

    this.removeAllListeners();
    this.initialized = false;
    this._isActive = false;

    this.emit('destroyed');
  }
}
