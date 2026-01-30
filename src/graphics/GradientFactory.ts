/**
 * Gradient Factory
 *
 * Provides native Pixi.js v8 FillGradient helpers for creating
 * linear and radial gradients with ease.
 *
 * Uses native PIXI.FillGradient API which works correctly with ALL shapes
 * including polygons, hexagons, circles, and rectangles.
 *
 * @example
 * ```typescript
 * import { Gradients } from 'gamebyte-framework';
 *
 * // Simple vertical gradient
 * const gradient = Gradients.linear.vertical(0x4DA6FF, 0x2E7BC9);
 * graphics.roundRect(0, 0, 100, 50, 10).fill(gradient);
 *
 * // Hexagon with gradient
 * graphics.poly(hexagonVertices).fill(Gradients.linear.vertical(0x4DA6FF, 0x2E7BC9));
 *
 * // Button depth effect
 * const buttonGrad = Gradients.presets.buttonDepth(0x2DE45A, 0x28A165);
 * graphics.roundRect(0, 0, 200, 60, 12).fill(buttonGrad);
 * ```
 */

import * as PIXI from 'pixi.js';

/**
 * Color stop definition for gradients
 */
export interface GradientColorStop {
  offset: number;
  color: number | string;
}

/**
 * Linear gradient options
 */
export interface LinearGradientOptions {
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  colorStops: GradientColorStop[];
  textureSpace?: 'local' | 'global';
}

/**
 * Radial gradient options
 */
export interface RadialGradientOptions {
  center?: { x: number; y: number };
  innerRadius?: number;
  outerCenter?: { x: number; y: number };
  outerRadius?: number;
  colorStops: GradientColorStop[];
  textureSpace?: 'local' | 'global';
}

/**
 * Type for gradient fill (compatible with PIXI.FillGradient)
 */
export type GradientFill = PIXI.FillGradient;

/**
 * Create a linear gradient
 */
export function createLinearGradient(options: LinearGradientOptions): GradientFill {
  return new PIXI.FillGradient({
    type: 'linear',
    start: options.start ?? { x: 0, y: 0 },
    end: options.end ?? { x: 0, y: 1 },
    colorStops: options.colorStops,
    textureSpace: options.textureSpace ?? 'local'
  });
}

/**
 * Create a radial gradient
 */
export function createRadialGradient(options: RadialGradientOptions): GradientFill {
  return new PIXI.FillGradient({
    type: 'radial',
    center: options.center ?? { x: 0.5, y: 0.5 },
    innerRadius: options.innerRadius ?? 0,
    outerCenter: options.outerCenter ?? { x: 0.5, y: 0.5 },
    outerRadius: options.outerRadius ?? 0.5,
    colorStops: options.colorStops,
    textureSpace: options.textureSpace ?? 'local'
  });
}

/**
 * Gradient Factory with preset helpers
 */
export const Gradients = {
  /**
   * Linear gradient helpers
   */
  linear: {
    /**
     * Vertical gradient (top to bottom)
     * Most common for buttons and UI elements
     */
    vertical(topColor: number, bottomColor: number, textureSpace: 'local' | 'global' = 'local'): GradientFill {
      return createLinearGradient({
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
          { offset: 0, color: topColor },
          { offset: 1, color: bottomColor }
        ],
        textureSpace
      });
    },

    /**
     * Vertical gradient with hard stop (3D button effect)
     * Creates a split appearance at the specified position
     */
    verticalHardStop(
      topColor: number,
      bottomColor: number,
      stopPosition: number = 0.5,
      textureSpace: 'local' | 'global' = 'local'
    ): GradientFill {
      return createLinearGradient({
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
          { offset: 0, color: topColor },
          { offset: stopPosition, color: topColor },
          { offset: stopPosition, color: bottomColor },
          { offset: 1, color: bottomColor }
        ],
        textureSpace
      });
    },

    /**
     * Vertical gradient with soft transition (game button style)
     * Keeps top color longer then fades to bottom
     */
    verticalSoft(
      topColor: number,
      bottomColor: number,
      holdPosition: number = 0.35,
      textureSpace: 'local' | 'global' = 'local'
    ): GradientFill {
      return createLinearGradient({
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
          { offset: 0, color: topColor },
          { offset: holdPosition, color: topColor },
          { offset: 1, color: bottomColor }
        ],
        textureSpace
      });
    },

    /**
     * Horizontal gradient (left to right)
     */
    horizontal(leftColor: number, rightColor: number, textureSpace: 'local' | 'global' = 'local'): GradientFill {
      return createLinearGradient({
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        colorStops: [
          { offset: 0, color: leftColor },
          { offset: 1, color: rightColor }
        ],
        textureSpace
      });
    },

    /**
     * Diagonal gradient (top-left to bottom-right)
     */
    diagonal(startColor: number, endColor: number, textureSpace: 'local' | 'global' = 'local'): GradientFill {
      return createLinearGradient({
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        colorStops: [
          { offset: 0, color: startColor },
          { offset: 1, color: endColor }
        ],
        textureSpace
      });
    },

    /**
     * Multi-stop gradient with custom color stops
     */
    multiStop(colorStops: GradientColorStop[], direction: 'vertical' | 'horizontal' = 'vertical', textureSpace: 'local' | 'global' = 'local'): GradientFill {
      return createLinearGradient({
        start: { x: 0, y: 0 },
        end: direction === 'vertical' ? { x: 0, y: 1 } : { x: 1, y: 0 },
        colorStops,
        textureSpace
      });
    }
  },

  /**
   * Radial gradient helpers
   */
  radial: {
    /**
     * Centered radial gradient (from center outward)
     */
    centered(innerColor: number, outerColor: number, textureSpace: 'local' | 'global' = 'local'): GradientFill {
      return createRadialGradient({
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        colorStops: [
          { offset: 0, color: innerColor },
          { offset: 1, color: outerColor }
        ],
        textureSpace
      });
    },

    /**
     * Spotlight effect (bright center, dark edges)
     */
    spotlight(color: number, fadeColor: number = 0x000000, textureSpace: 'local' | 'global' = 'local'): GradientFill {
      return createRadialGradient({
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        colorStops: [
          { offset: 0, color: color },
          { offset: 0.3, color: color },
          { offset: 1, color: fadeColor }
        ],
        textureSpace
      });
    },

    /**
     * Glow effect (white/light center fading outward)
     */
    glow(glowColor: number = 0xFFFFFF, midColor: number = 0xFFFAE6, edgeColor: number = 0x000000, textureSpace: 'local' | 'global' = 'local'): GradientFill {
      return createRadialGradient({
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        colorStops: [
          { offset: 0, color: glowColor },
          { offset: 0.3, color: midColor },
          { offset: 1, color: edgeColor }
        ],
        textureSpace
      });
    },

    /**
     * Multi-stop radial gradient
     */
    multiStop(colorStops: GradientColorStop[], textureSpace: 'local' | 'global' = 'local'): GradientFill {
      return createRadialGradient({
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        colorStops,
        textureSpace
      });
    }
  },

  /**
   * Preset gradients for common mobile game UI patterns
   */
  presets: {
    /**
     * Button depth effect gradient
     * Creates 3D appearance with lighter top and darker bottom
     */
    buttonDepth(topColor: number, bottomColor: number): GradientFill {
      return Gradients.linear.vertical(topColor, bottomColor);
    },

    /**
     * Button with soft hold (like HexagonLevelButton style)
     * Holds the top color for a bit before transitioning
     */
    buttonSoft(topColor: number, bottomColor: number): GradientFill {
      return Gradients.linear.verticalSoft(topColor, bottomColor, 0.35);
    },

    /**
     * Sky background gradient (blue tones)
     */
    sky(): GradientFill {
      return Gradients.linear.multiStop([
        { offset: 0, color: 0x0066CC },
        { offset: 0.3, color: 0x0088EE },
        { offset: 0.6, color: 0x00AAFF },
        { offset: 1, color: 0x66CCFF }
      ]);
    },

    /**
     * Sunset background gradient
     */
    sunset(): GradientFill {
      return Gradients.linear.multiStop([
        { offset: 0, color: 0x1a0533 },
        { offset: 0.3, color: 0x7b2d5b },
        { offset: 0.5, color: 0xf0724a },
        { offset: 0.7, color: 0xffc35e },
        { offset: 1, color: 0xfff8dc }
      ]);
    },

    /**
     * Night sky gradient
     */
    nightSky(): GradientFill {
      return Gradients.linear.multiStop([
        { offset: 0, color: 0x0f0c29 },
        { offset: 0.5, color: 0x302b63 },
        { offset: 1, color: 0x24243e }
      ]);
    },

    /**
     * Highlight shine effect (semi-transparent white)
     * Use alpha in fill options for transparency
     */
    highlight(): GradientFill {
      return Gradients.linear.vertical(0xFFFFFF, 0xFFFFFF);
    },

    /**
     * Track/slider gradient (dark inset look)
     */
    track(topColor: number, bottomColor: number): GradientFill {
      return Gradients.linear.vertical(topColor, bottomColor);
    }
  },

  /**
   * Create a custom gradient with full control
   */
  custom: {
    linear: createLinearGradient,
    radial: createRadialGradient
  }
};

/**
 * Export individual functions for direct use
 */
export { createLinearGradient as linearGradient, createRadialGradient as radialGradient };
