/**
 * Responsive Helper Utilities
 *
 * Provides automatic responsive scaling for game UI elements based on viewport size.
 * Uses a mobile-first approach with a base design size and calculates scale factors.
 */

export interface ResponsiveConfig {
  /**
   * Base design width (typically mobile width, e.g., 1080)
   */
  baseWidth: number;

  /**
   * Base design height (typically mobile height, e.g., 1920)
   */
  baseHeight: number;

  /**
   * Minimum scale factor (default: 0.5)
   */
  minScale?: number;

  /**
   * Maximum scale factor (default: 2.0)
   */
  maxScale?: number;
}

export interface ResponsiveSize {
  width: number;
  height: number;
  scale: number;
}

/**
 * ResponsiveScaleCalculator
 *
 * Calculates scale factors based on viewport size relative to base design size.
 * Uses mobile-first approach: designs are created at base size (e.g., 1080x1920)
 * and scaled up/down based on actual viewport dimensions.
 */
export class ResponsiveScaleCalculator {
  private config: Required<ResponsiveConfig>;
  private currentSize: ResponsiveSize;
  private resizeCallbacks: Array<(size: ResponsiveSize) => void> = [];

  constructor(config: ResponsiveConfig) {
    this.config = {
      baseWidth: config.baseWidth,
      baseHeight: config.baseHeight,
      minScale: config.minScale ?? 0.5,
      maxScale: config.maxScale ?? 2.0
    };

    this.currentSize = this.calculate();
    this.setupResizeObserver();
  }

  /**
   * Calculate current responsive size and scale factor
   */
  calculate(): ResponsiveSize {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Calculate scale factor based on width (mobile-first)
    const scale = Math.max(
      this.config.minScale,
      Math.min(width / this.config.baseWidth, this.config.maxScale)
    );

    return { width, height, scale };
  }

  /**
   * Get current responsive size
   */
  getSize(): ResponsiveSize {
    return { ...this.currentSize };
  }

  /**
   * Get current scale factor
   */
  getScale(): number {
    return this.currentSize.scale;
  }

  /**
   * Scale a base value by the current scale factor
   * Use this method for all responsive scaling (size, font, position, padding, stroke, etc.)
   */
  scale(baseValue: number): number {
    return baseValue * this.currentSize.scale;
  }

  /**
   * Register a callback for resize events
   */
  onResize(callback: (size: ResponsiveSize) => void): void {
    this.resizeCallbacks.push(callback);
  }

  /**
   * Remove a resize callback
   */
  offResize(callback: (size: ResponsiveSize) => void): void {
    const index = this.resizeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.resizeCallbacks.splice(index, 1);
    }
  }

  /**
   * Set up window resize observer
   */
  private setupResizeObserver(): void {
    window.addEventListener('resize', () => {
      const oldScale = this.currentSize.scale;
      this.currentSize = this.calculate();

      // Only trigger callbacks if scale changed significantly
      if (Math.abs(this.currentSize.scale - oldScale) > 0.01) {
        this.resizeCallbacks.forEach(callback => callback(this.currentSize));
      }
    });
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    this.resizeCallbacks = [];
  }
}

/**
 * ResponsiveContainer
 *
 * A wrapper for Pixi containers that automatically applies responsive scaling
 * to all child elements and their properties.
 */
export class ResponsiveContainer {
  private calculator: ResponsiveScaleCalculator;
  private container: any; // Pixi.Container
  private baseValues: Map<any, any> = new Map();

  constructor(calculator: ResponsiveScaleCalculator, container: any) {
    this.calculator = calculator;
    this.container = container;

    // Listen for resize events
    this.calculator.onResize((size) => {
      this.updateScale();
    });
  }

  /**
   * Store base values for an element before scaling
   */
  storeBaseValues(element: any, values: any): void {
    this.baseValues.set(element, { ...values });
  }

  /**
   * Get the Pixi container
   */
  getContainer(): any {
    return this.container;
  }

  /**
   * Apply responsive scaling to an element's properties
   */
  applyScale(element: any, properties: string[]): void {
    const baseValues = this.baseValues.get(element);
    if (!baseValues) {
      console.warn('No base values stored for element. Call storeBaseValues() first.');
      return;
    }

    const scale = this.calculator.getScale();

    properties.forEach(prop => {
      if (baseValues[prop] !== undefined) {
        element[prop] = baseValues[prop] * scale;
      }
    });
  }

  /**
   * Apply responsive scaling to text style
   */
  applyTextScale(text: any, baseStyle: any): void {
    const scale = this.calculator.getScale();

    if (text.style) {
      if (baseStyle.fontSize !== undefined) {
        text.style.fontSize = baseStyle.fontSize * scale;
      }

      // Pixi v8: stroke is an object with { color, width }
      if (baseStyle.stroke && baseStyle.stroke.width !== undefined) {
        if (!text.style.stroke) {
          text.style.stroke = { width: baseStyle.stroke.width * scale };
        } else {
          text.style.stroke.width = baseStyle.stroke.width * scale;
        }
      }

      if (baseStyle.dropShadow) {
        if (baseStyle.dropShadow.distance !== undefined) {
          text.style.dropShadow.distance = baseStyle.dropShadow.distance * scale;
        }
        if (baseStyle.dropShadow.blur !== undefined) {
          text.style.dropShadow.blur = baseStyle.dropShadow.blur * scale;
        }
      }
    }
  }

  /**
   * Update scale for all stored elements
   */
  private updateScale(): void {
    // This should be implemented by the user to update their specific elements
    // Or we can provide a mechanism to register auto-update callbacks
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    this.baseValues.clear();
  }
}

/**
 * Helper class for managing responsive canvas sizing
 */
export class ResponsiveCanvas {
  private calculator: ResponsiveScaleCalculator;
  private canvas: HTMLCanvasElement;

  constructor(calculator: ResponsiveScaleCalculator, canvas: HTMLCanvasElement) {
    this.calculator = calculator;
    this.canvas = canvas;

    // Initial sizing
    this.updateSize();

    // Listen for resize events
    this.calculator.onResize(() => {
      this.updateSize();
    });
  }

  /**
   * Update canvas size to match current viewport
   */
  updateSize(): void {
    const size = this.calculator.getSize();

    // Update canvas internal resolution
    this.canvas.width = size.width;
    this.canvas.height = size.height;

    // Update canvas CSS display size
    this.canvas.style.width = size.width + 'px';
    this.canvas.style.height = size.height + 'px';
  }

  /**
   * Get current canvas size
   */
  getSize(): ResponsiveSize {
    return this.calculator.getSize();
  }
}

/**
 * Create a responsive scale calculator with common mobile-first defaults
 */
export function createResponsiveCalculator(config?: Partial<ResponsiveConfig>): ResponsiveScaleCalculator {
  return new ResponsiveScaleCalculator({
    baseWidth: config?.baseWidth ?? 1080,
    baseHeight: config?.baseHeight ?? 1920,
    minScale: config?.minScale ?? 0.5,
    maxScale: config?.maxScale ?? 2.0
  });
}
