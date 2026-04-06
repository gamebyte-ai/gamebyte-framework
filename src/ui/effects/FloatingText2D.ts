/**
 * FloatingText2D - 2D floating text effect for damage numbers, scores, and coins
 *
 * Provides a clean, statically-factory-driven API for spawning animated text
 * that floats in a direction and fades out. Built on the graphics abstraction
 * layer — renderer-agnostic, works with Pixi.js v8.
 *
 * @example
 * ```typescript
 * // Convenience factory methods
 * FloatingText2D.damage(gameContainer, 100, 200, 42);
 * FloatingText2D.score(gameContainer, 100, 200, 150);
 * FloatingText2D.coin(gameContainer, 100, 200, 5);
 *
 * // Full control
 * FloatingText2D.spawn({
 *   text: 'CRITICAL!',
 *   x: 200, y: 300,
 *   parent: gameContainer,
 *   style: 'damage',
 *   direction: 'up',
 *   duration: 1200,
 *   distance: 80,
 * });
 * ```
 */

import { graphics } from '../../graphics/GraphicsEngine.js';
import { IContainer, IText, ITextStyle } from '../../contracts/Graphics.js';

// ---------------------------------------------------------------------------
// Config interfaces
// ---------------------------------------------------------------------------

export interface FloatingTextConfig {
  /** The string to display */
  text: string;
  /** Spawn X position */
  x: number;
  /** Spawn Y position */
  y: number;
  /** Parent container to add the text to */
  parent: any; // IContainer
  /** Style preset name or custom style record */
  style?: 'damage' | 'heal' | 'score' | 'coin' | Record<string, any>;
  /** Float direction (default: 'up') */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Duration in ms (default: 800) */
  duration?: number;
  /** How far to float in pixels (default: 60) */
  distance?: number;
  /** Enable scale animation from 1.2 → 0.8 (default: true) */
  scaleAnimation?: boolean;
  /** Remove from parent when animation finishes (default: true) */
  autoDestroy?: boolean;
}

// ---------------------------------------------------------------------------
// Preset styles
// ---------------------------------------------------------------------------

/** Built-in named text styles for common game feedback */
const STYLE_PRESETS: Record<string, ITextStyle> = {
  damage: {
    fontSize: 28,
    fontWeight: 'bold',
    fill: 0xFF4444,
    stroke: { color: 0x000000, width: 3 },
  },
  heal: {
    fontSize: 24,
    fontWeight: 'bold',
    fill: 0x44FF44,
    stroke: { color: 0x000000, width: 2 },
  },
  score: {
    fontSize: 26,
    fontWeight: 'bold',
    fill: 0xFFDD44,
    stroke: { color: 0x000000, width: 2 },
  },
  coin: {
    fontSize: 22,
    fontWeight: 'bold',
    fill: 0xFFAA00,
    stroke: { color: 0x000000, width: 2 },
  },
};

/** Default configuration values */
const DEFAULT_CONFIG = {
  direction: 'up' as const,
  duration: 800,
  distance: 60,
  scaleAnimation: true,
  autoDestroy: true,
};

// ---------------------------------------------------------------------------
// FloatingText2D class
// ---------------------------------------------------------------------------

export class FloatingText2D {
  private container: IContainer;
  private text: IText;
  private rafId: number = 0;
  private startTime: number | null = null;
  private readonly config: Required<Omit<FloatingTextConfig, 'style'>> & { style: ITextStyle };

  /** Private constructor — use static factory methods */
  private constructor(config: Required<Omit<FloatingTextConfig, 'style'>> & { style: ITextStyle }) {
    this.config = config;

    const factory = graphics();

    // Create wrapper container for position + alpha control
    this.container = factory.createContainer();
    this.container.x = config.x;
    this.container.y = config.y;

    // Create text object
    this.text = factory.createText(config.text, config.style);

    // Center the text anchor if the method exists
    if (this.text.anchor && typeof this.text.anchor.set === 'function') {
      this.text.anchor.set(0.5, 0.5);
    }

    this.container.addChild(this.text);
    config.parent.addChild(this.container);

    // Begin animation
    this.animate();
  }

  // -------------------------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------------------------

  private animate(): void {
    const startY = this.config.y;
    const startX = this.config.x;
    const { duration, distance, direction, scaleAnimation, autoDestroy } = this.config;
    const parent = this.config.parent;

    const step = (timestamp: number): void => {
      if (this.startTime === null) this.startTime = timestamp;

      const elapsed = timestamp - this.startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Positional movement
      switch (direction) {
        case 'up':
          this.container.y = startY - distance * progress;
          break;
        case 'down':
          this.container.y = startY + distance * progress;
          break;
        case 'left':
          this.container.x = startX - distance * progress;
          break;
        case 'right':
          this.container.x = startX + distance * progress;
          break;
      }

      // Alpha fade — begin at 60% through animation
      if (progress >= 0.6) {
        this.container.alpha = 1 - (progress - 0.6) / 0.4;
      } else {
        this.container.alpha = 1;
      }

      // Scale animation: 1.2 → 0.8
      if (scaleAnimation) {
        const scale = 1.2 - 0.4 * progress;
        this.container.scale.x = scale;
        this.container.scale.y = scale;
      }

      if (progress < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        // Animation complete
        if (autoDestroy) {
          parent.removeChild(this.container);
        }
      }
    };

    this.rafId = requestAnimationFrame(step);
  }

  // -------------------------------------------------------------------------
  // Static factory methods
  // -------------------------------------------------------------------------

  /**
   * Spawn a floating text with full configuration control.
   */
  static spawn(config: FloatingTextConfig): FloatingText2D {
    // Resolve style
    let resolvedStyle: ITextStyle;

    if (!config.style || typeof config.style === 'string') {
      const presetKey = config.style ?? 'score';
      resolvedStyle = STYLE_PRESETS[presetKey] ?? STYLE_PRESETS.score;
    } else {
      resolvedStyle = config.style as ITextStyle;
    }

    const resolved: Required<Omit<FloatingTextConfig, 'style'>> & { style: ITextStyle } = {
      text: config.text,
      x: config.x,
      y: config.y,
      parent: config.parent,
      style: resolvedStyle,
      direction: config.direction ?? DEFAULT_CONFIG.direction,
      duration: config.duration ?? DEFAULT_CONFIG.duration,
      distance: config.distance ?? DEFAULT_CONFIG.distance,
      scaleAnimation: config.scaleAnimation ?? DEFAULT_CONFIG.scaleAnimation,
      autoDestroy: config.autoDestroy ?? DEFAULT_CONFIG.autoDestroy,
    };

    return new FloatingText2D(resolved);
  }

  /**
   * Show a red damage number floating upward.
   */
  static damage(parent: any, x: number, y: number, amount: number): FloatingText2D {
    return FloatingText2D.spawn({
      text: `-${amount}`,
      x,
      y,
      parent,
      style: 'damage',
      direction: 'up',
    });
  }

  /**
   * Show a yellow score number floating upward.
   */
  static score(parent: any, x: number, y: number, points: number): FloatingText2D {
    return FloatingText2D.spawn({
      text: `+${points}`,
      x,
      y,
      parent,
      style: 'score',
      direction: 'up',
    });
  }

  /**
   * Show an orange coin count floating upward.
   */
  static coin(parent: any, x: number, y: number, amount: number): FloatingText2D {
    return FloatingText2D.spawn({
      text: `+${amount}`,
      x,
      y,
      parent,
      style: 'coin',
      direction: 'up',
    });
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Cancel the animation and remove from parent immediately.
   */
  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.config.parent) {
      this.config.parent.removeChild(this.container);
    }
  }

  /** The internal wrapper container, for advanced use. */
  getContainer(): IContainer {
    return this.container;
  }
}
