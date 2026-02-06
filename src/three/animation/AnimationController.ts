/**
 * AnimationController - Wrapper for Three.js AnimationMixer
 *
 * Provides easy control over 3D model animations with play, pause,
 * blend, and transition support.
 *
 * @example
 * ```typescript
 * // Create controller for a loaded model
 * const controller = new AnimationController(model.scene, model.animations);
 *
 * // Play an animation by name
 * controller.play('walk');
 *
 * // Crossfade to another animation
 * controller.crossFadeTo('run', 0.5);
 *
 * // Update in game loop
 * controller.update(deltaTime);
 *
 * // Clean up
 * controller.dispose();
 * ```
 */

import * as THREE from 'three';
import { EventEmitter } from 'eventemitter3';

export interface AnimationControllerConfig {
  /** Default transition duration in seconds (default: 0.5) */
  defaultTransitionDuration?: number;
  /** Default animation time scale (default: 1) */
  timeScale?: number;
  /** Clamp animations when finished (default: false) */
  clampWhenFinished?: boolean;
}

export interface PlayOptions {
  /** Loop mode (default: LoopRepeat) */
  loop?: THREE.AnimationActionLoopStyles;
  /** Number of repetitions for LoopRepeat (default: Infinity) */
  repetitions?: number;
  /** Clamp when finished (default: config setting) */
  clampWhenFinished?: boolean;
  /** Time scale for this animation (default: 1) */
  timeScale?: number;
  /** Start time offset in seconds (default: 0) */
  startAt?: number;
  /** Crossfade from current animation (default: false) */
  crossFade?: boolean;
  /** Crossfade duration in seconds (default: config setting) */
  crossFadeDuration?: number;
  /** Weight of the animation 0-1 (default: 1) */
  weight?: number;
}

export interface AnimationControllerEvents {
  /** Fired when animation starts playing */
  play: [name: string];
  /** Fired when animation is paused */
  pause: [name: string];
  /** Fired when animation finishes (non-looping) */
  finished: [name: string];
  /** Fired when animation loops */
  loop: [name: string];
  /** Fired when crossfade completes */
  crossfadeComplete: [from: string, to: string];
}

export class AnimationController extends EventEmitter<AnimationControllerEvents> {
  private mixer: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private clips: Map<string, THREE.AnimationClip> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private config: Required<AnimationControllerConfig>;

  constructor(
    root: THREE.Object3D,
    animations: THREE.AnimationClip[],
    config: AnimationControllerConfig = {}
  ) {
    super();

    this.config = {
      defaultTransitionDuration: config.defaultTransitionDuration ?? 0.5,
      timeScale: config.timeScale ?? 1,
      clampWhenFinished: config.clampWhenFinished ?? false,
    };

    this.mixer = new THREE.AnimationMixer(root);
    this.mixer.timeScale = this.config.timeScale;

    // Register animations
    for (const clip of animations) {
      this.clips.set(clip.name, clip);
      const action = this.mixer.clipAction(clip);
      action.clampWhenFinished = this.config.clampWhenFinished;
      this.actions.set(clip.name, action);
    }

    // Listen for finished events
    this.mixer.addEventListener('finished', (e) => {
      const clip = (e as any).action.getClip();
      this.emit('finished', clip.name);
    });

    this.mixer.addEventListener('loop', (e) => {
      const clip = (e as any).action.getClip();
      this.emit('loop', clip.name);
    });
  }

  /**
   * Get all animation names
   */
  getAnimationNames(): string[] {
    return Array.from(this.clips.keys());
  }

  /**
   * Check if an animation exists
   */
  hasAnimation(name: string): boolean {
    return this.clips.has(name);
  }

  /**
   * Get animation duration in seconds
   */
  getDuration(name: string): number {
    const clip = this.clips.get(name);
    return clip ? clip.duration : 0;
  }

  /**
   * Play an animation by name
   */
  play(name: string, options: PlayOptions = {}): THREE.AnimationAction | null {
    const action = this.actions.get(name);
    if (!action) {
      console.warn(`AnimationController: Animation "${name}" not found`);
      return null;
    }

    // Apply options
    if (options.loop !== undefined) {
      action.loop = options.loop;
    }
    if (options.repetitions !== undefined) {
      action.repetitions = options.repetitions;
    }
    if (options.clampWhenFinished !== undefined) {
      action.clampWhenFinished = options.clampWhenFinished;
    }
    if (options.timeScale !== undefined) {
      action.timeScale = options.timeScale;
    }
    if (options.weight !== undefined) {
      action.setEffectiveWeight(options.weight);
    }

    // Handle crossfade
    if (options.crossFade && this.currentAction && this.currentAction !== action) {
      const duration = options.crossFadeDuration ?? this.config.defaultTransitionDuration;
      this.currentAction.crossFadeTo(action, duration, true);
    }

    // Reset and play
    if (options.startAt !== undefined) {
      action.time = options.startAt;
    } else {
      action.reset();
    }

    action.play();
    this.currentAction = action;
    this.emit('play', name);

    return action;
  }

  /**
   * Pause the currently playing animation
   */
  pause(name?: string): void {
    if (name) {
      const action = this.actions.get(name);
      if (action) {
        action.paused = true;
        this.emit('pause', name);
      }
    } else if (this.currentAction) {
      this.currentAction.paused = true;
      this.emit('pause', this.currentAction.getClip().name);
    }
  }

  /**
   * Resume a paused animation
   */
  resume(name?: string): void {
    if (name) {
      const action = this.actions.get(name);
      if (action) {
        action.paused = false;
      }
    } else if (this.currentAction) {
      this.currentAction.paused = false;
    }
  }

  /**
   * Stop an animation (resets to start)
   */
  stop(name?: string): void {
    if (name) {
      const action = this.actions.get(name);
      if (action) {
        action.stop();
      }
    } else if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
    }
  }

  /**
   * Stop all animations
   */
  stopAll(): void {
    this.mixer.stopAllAction();
    this.currentAction = null;
  }

  /**
   * Crossfade to another animation
   */
  crossFadeTo(name: string, duration?: number, options: PlayOptions = {}): THREE.AnimationAction | null {
    return this.play(name, {
      ...options,
      crossFade: true,
      crossFadeDuration: duration ?? this.config.defaultTransitionDuration,
    });
  }

  /**
   * Set the weight of an animation (for blending)
   */
  setWeight(name: string, weight: number): void {
    const action = this.actions.get(name);
    if (action) {
      action.setEffectiveWeight(weight);
    }
  }

  /**
   * Set the time scale of an animation
   */
  setTimeScale(name: string, scale: number): void {
    const action = this.actions.get(name);
    if (action) {
      action.timeScale = scale;
    }
  }

  /**
   * Set global time scale for all animations
   */
  setGlobalTimeScale(scale: number): void {
    this.mixer.timeScale = scale;
  }

  /**
   * Get current animation time
   */
  getTime(name?: string): number {
    if (name) {
      const action = this.actions.get(name);
      return action ? action.time : 0;
    }
    return this.currentAction ? this.currentAction.time : 0;
  }

  /**
   * Set animation time
   */
  setTime(time: number, name?: string): void {
    if (name) {
      const action = this.actions.get(name);
      if (action) {
        action.time = time;
      }
    } else if (this.currentAction) {
      this.currentAction.time = time;
    }
  }

  /**
   * Check if animation is playing
   */
  isPlaying(name?: string): boolean {
    if (name) {
      const action = this.actions.get(name);
      return action ? action.isRunning() : false;
    }
    return this.currentAction ? this.currentAction.isRunning() : false;
  }

  /**
   * Get the currently playing animation name
   */
  getCurrentAnimation(): string | null {
    return this.currentAction ? this.currentAction.getClip().name : null;
  }

  /**
   * Update the animation mixer (call in game loop)
   */
  update(deltaTime: number): void {
    this.mixer.update(deltaTime);
  }

  /**
   * Dispose of the animation controller
   */
  dispose(): void {
    this.mixer.stopAllAction();
    this.actions.clear();
    this.clips.clear();
    (this.mixer as any).uncacheRoot(this.mixer.getRoot());
  }
}
