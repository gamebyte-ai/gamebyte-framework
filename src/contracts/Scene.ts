import { EventEmitter } from 'eventemitter3';

/**
 * Base interface for all scenes in the framework.
 */
export interface Scene extends EventEmitter {
  /**
   * Unique identifier for the scene.
   */
  readonly id: string;

  /**
   * Human-readable name for the scene.
   */
  readonly name: string;

  /**
   * Whether the scene is currently active.
   */
  readonly isActive: boolean;

  /**
   * Initialize the scene.
   */
  initialize(): Promise<void>;

  /**
   * Called when the scene becomes active.
   */
  activate(): void;

  /**
   * Called when the scene becomes inactive.
   */
  deactivate(): void;

  /**
   * Update the scene logic.
   */
  update(deltaTime: number): void;

  /**
   * Render the scene.
   */
  render(renderer: any): void;

  /**
   * Clean up scene resources.
   */
  destroy(): void;
}

/**
 * Scene management interface.
 */
export interface SceneManager extends EventEmitter {
  /**
   * Register a scene with the manager.
   */
  add(scene: Scene): void;

  /**
   * Remove a scene from the manager.
   */
  remove(sceneId: string): void;

  /**
   * Switch to a different scene.
   */
  switchTo(sceneId: string, transition?: SceneTransition): Promise<void>;

  /**
   * Get the currently active scene.
   */
  getCurrentScene(): Scene | null;

  /**
   * Get a scene by its ID.
   */
  getScene(sceneId: string): Scene | null;

  /**
   * Check if a scene exists.
   */
  hasScene(sceneId: string): boolean;

  /**
   * Update the current scene.
   */
  update(deltaTime: number): void;

  /**
   * Render the current scene.
   */
  render(renderer: any): void;
}

/**
 * Scene transition configuration.
 */
export interface SceneTransition {
  type: 'fade' | 'slide' | 'instant';
  duration?: number;
  easing?: (t: number) => number;
}