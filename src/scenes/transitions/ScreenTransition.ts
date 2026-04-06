/**
 * ScreenTransition — Smooth scene-change animations using the Tween system.
 *
 * Supports fade, slide (4 directions), zoom, and instant transitions.
 * Works with any container object that has x, y, alpha, and scale properties.
 *
 * @example
 * ```typescript
 * import { ScreenTransition } from './transitions';
 *
 * await ScreenTransition.play(outgoingContainer, incomingContainer,
 *   { width: 480, height: 852 },
 *   ScreenTransition.SLIDE_LEFT
 * );
 * ```
 */

import { EventEmitter } from 'eventemitter3';
import { Tween, Ease } from '../../tween/index.js';
import { TweenManager } from '../../tween/TweenManager.js';

// ---- Types -----------------------------------------------------------------

export type TransitionType =
  | 'instant'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom';

export interface TransitionConfig {
  type: TransitionType;
  /** Duration in milliseconds. Default: 300 */
  duration?: number;
  /** Easing function. Default: Ease.quadInOut */
  ease?: (t: number) => number;
  /** Overlay color for fade (currently reserved). Default: 0x000000 */
  color?: number;
}

// ---- Helpers ---------------------------------------------------------------

/**
 * Returns a Promise that resolves when the given Tween fires 'complete'.
 * If the tween is already finished, resolves on the next microtask.
 */
function tweenToPromise(tween: Tween): Promise<void> {
  return new Promise<void>((resolve) => {
    if (tween._isFinished) {
      resolve();
      return;
    }
    tween.once('complete', () => resolve());
  });
}

/**
 * Drive TweenManager in a rAF-style loop until `predicate` returns true.
 * Used internally to advance tweens when a game loop may not be running.
 *
 * NOTE: In a real game context TweenManager is driven by the game loop.
 * This helper is provided so standalone transition calls work without one.
 */
function driveUntil(predicate: () => boolean): Promise<void> {
  return new Promise<void>((resolve) => {
    let last = performance.now();

    function tick(): void {
      const now = performance.now();
      const dt = now - last;
      last = now;
      TweenManager.update(dt);

      if (predicate()) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  });
}

// ---- ScreenTransition -------------------------------------------------------

export class ScreenTransition extends EventEmitter {
  private static readonly DEFAULT_DURATION = 300;

  // ---- Presets -------------------------------------------------------------

  static readonly FADE: TransitionConfig = { type: 'fade', duration: 400 };
  static readonly SLIDE_LEFT: TransitionConfig = { type: 'slide-left', duration: 300 };
  static readonly SLIDE_RIGHT: TransitionConfig = { type: 'slide-right', duration: 300 };
  static readonly SLIDE_UP: TransitionConfig = { type: 'slide-up', duration: 300 };
  static readonly SLIDE_DOWN: TransitionConfig = { type: 'slide-down', duration: 300 };
  static readonly ZOOM: TransitionConfig = { type: 'zoom', duration: 350 };
  static readonly INSTANT: TransitionConfig = { type: 'instant', duration: 0 };

  // ---- Main API ------------------------------------------------------------

  /**
   * Play a transition between two containers.
   *
   * @param outgoing - Container leaving the screen (null if none)
   * @param incoming - Container entering the screen
   * @param viewport - Screen dimensions { width, height }
   * @param config   - Transition configuration
   * @returns Promise that resolves when the full transition completes
   */
  static async play(
    outgoing: any | null,
    incoming: any,
    viewport: { width: number; height: number },
    config: TransitionConfig
  ): Promise<void> {
    const duration = config.duration ?? ScreenTransition.DEFAULT_DURATION;
    const ease = config.ease ?? Ease.quadInOut;

    switch (config.type) {
      case 'instant':
        ScreenTransition._applyInstant(outgoing, incoming);
        return;

      case 'fade':
        return ScreenTransition._playFade(outgoing, incoming, duration, ease);

      case 'slide-left':
        return ScreenTransition._playSlide(outgoing, incoming, viewport, duration, ease, 'left');

      case 'slide-right':
        return ScreenTransition._playSlide(outgoing, incoming, viewport, duration, ease, 'right');

      case 'slide-up':
        return ScreenTransition._playSlide(outgoing, incoming, viewport, duration, ease, 'up');

      case 'slide-down':
        return ScreenTransition._playSlide(outgoing, incoming, viewport, duration, ease, 'down');

      case 'zoom':
        return ScreenTransition._playZoom(outgoing, incoming, duration, ease);

      default:
        // Unknown type — fall back to instant
        ScreenTransition._applyInstant(outgoing, incoming);
        return;
    }
  }

  // ---- Private transition implementations ----------------------------------

  private static _applyInstant(outgoing: any | null, incoming: any): void {
    if (outgoing) {
      outgoing.visible = false;
      outgoing.alpha = 0;
    }
    incoming.alpha = 1;
    incoming.visible = true;
    if (incoming.x !== undefined) incoming.x = 0;
    if (incoming.y !== undefined) incoming.y = 0;
    if (incoming.scale) {
      incoming.scale.x = 1;
      incoming.scale.y = 1;
    }
  }

  private static async _playFade(
    outgoing: any | null,
    incoming: any,
    duration: number,
    ease: (t: number) => number
  ): Promise<void> {
    const halfDuration = duration / 2;
    const tweens: Tween[] = [];

    // Phase 1: fade outgoing out
    if (outgoing) {
      outgoing.alpha = 1;
      const t = Tween.to(outgoing, { alpha: 0 }, { duration: halfDuration, ease });
      tweens.push(t);
      await tweenToPromise(t);
      if (outgoing.visible !== undefined) outgoing.visible = false;
    }

    // Phase 2: fade incoming in
    incoming.alpha = 0;
    if (incoming.visible !== undefined) incoming.visible = true;
    const tIn = Tween.to(incoming, { alpha: 1 }, { duration: halfDuration, ease });
    tweens.push(tIn);
    await tweenToPromise(tIn);
  }

  private static async _playSlide(
    outgoing: any | null,
    incoming: any,
    viewport: { width: number; height: number },
    duration: number,
    ease: (t: number) => number,
    direction: 'left' | 'right' | 'up' | 'down'
  ): Promise<void> {
    // Determine axis and offset values
    const isHorizontal = direction === 'left' || direction === 'right';
    const axis = isHorizontal ? 'x' : 'y';
    const size = isHorizontal ? viewport.width : viewport.height;

    // incoming slides in from the opposite side of the direction label:
    //   slide-left  → incoming enters from the right  (+size)
    //   slide-right → incoming enters from the left   (-size)
    //   slide-up    → incoming enters from the bottom (+size)
    //   slide-down  → incoming enters from the top    (-size)
    const incomingStart = (direction === 'left' || direction === 'up') ? size : -size;
    const outgoingEnd = -incomingStart;

    // Set initial positions
    incoming[axis] = incomingStart;
    if (incoming.visible !== undefined) incoming.visible = true;
    if (incoming.alpha !== undefined) incoming.alpha = 1;

    const tweenProps: Record<string, number> = {};
    tweenProps[axis] = 0;

    const incomingProps: Record<string, number> = {};
    incomingProps[axis] = 0;

    const outgoingProps: Record<string, number> = {};
    outgoingProps[axis] = outgoingEnd;

    // Build parallel tweens
    const tweenList: Tween[] = [];

    if (outgoing) {
      outgoing[axis] = 0;
      tweenList.push(Tween.to(outgoing, outgoingProps, { duration, ease }));
    }
    tweenList.push(Tween.to(incoming, incomingProps, { duration, ease }));

    if (tweenList.length === 1) {
      await tweenToPromise(tweenList[0]);
    } else {
      const par = Tween.parallel(tweenList);
      await tweenToPromise(par);
    }
  }

  private static async _playZoom(
    outgoing: any | null,
    incoming: any,
    duration: number,
    ease: (t: number) => number
  ): Promise<void> {
    const halfDuration = duration / 2;

    // Phase 1: outgoing shrinks and fades
    if (outgoing) {
      const scaleObj = outgoing.scale ?? outgoing;
      // Use a proxy object to drive both scale axes simultaneously
      const scaleProxy = { v: 1 };
      const alphaProxy = { alpha: outgoing.alpha ?? 1 };

      const scaleOut = Tween.to(scaleProxy, { v: 0.8 }, {
        duration: halfDuration,
        ease,
        onUpdate: () => {
          if (outgoing.scale) {
            outgoing.scale.x = scaleProxy.v;
            outgoing.scale.y = scaleProxy.v;
          }
        }
      });
      const alphaOut = Tween.to(outgoing, { alpha: 0 }, { duration: halfDuration, ease });

      const par = Tween.parallel([scaleOut, alphaOut]);
      await tweenToPromise(par);

      if (outgoing.visible !== undefined) outgoing.visible = false;
    }

    // Phase 2: incoming zooms in from 1.2 and fades in
    incoming.alpha = 0;
    if (incoming.visible !== undefined) incoming.visible = true;
    if (incoming.scale) {
      incoming.scale.x = 1.2;
      incoming.scale.y = 1.2;
    }

    const scaleProxy = { v: 1.2 };
    const scaleIn = Tween.to(scaleProxy, { v: 1 }, {
      duration: halfDuration,
      ease,
      onUpdate: () => {
        if (incoming.scale) {
          incoming.scale.x = scaleProxy.v;
          incoming.scale.y = scaleProxy.v;
        }
      }
    });
    const alphaIn = Tween.to(incoming, { alpha: 1 }, { duration: halfDuration, ease });

    const par = Tween.parallel([scaleIn, alphaIn]);
    await tweenToPromise(par);
  }
}
