import { EventEmitter } from 'eventemitter3';
import { Scene } from '../contracts/Scene';
import * as PIXI from 'pixi.js';
import { graphics } from '../graphics/GraphicsEngine';

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
    // Use graphics abstraction but cast to PIXI.Container for type compatibility
    this.container = graphics().createContainer() as unknown as PIXI.Container;
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

// NOTE: BaseScene3D is available in the Three.js toolkit bundle (gamebyte-three.umd.js)
// For ESM/bundlers: import { BaseScene3D } from 'gamebyte-framework/three-toolkit'
