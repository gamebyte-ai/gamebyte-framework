import { EventEmitter } from 'eventemitter3';
import { graphics } from '../../graphics/GraphicsEngine';
import { IContainer, IGraphics, ISprite } from '../../contracts/Graphics';

/**
 * Creates a horizontal gradient texture for slider track
 * @internal
 */
function createTrackGradient(
  width: number,
  height: number,
  colorTop: number,
  colorBottom: number,
  borderRadius: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const topHex = '#' + colorTop.toString(16).padStart(6, '0');
  const bottomHex = '#' + colorBottom.toString(16).padStart(6, '0');

  // Vertical gradient (top lighter, bottom darker)
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, topHex);
  gradient.addColorStop(1, bottomHex);

  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, borderRadius);
  ctx.fillStyle = gradient;
  ctx.fill();

  return canvas;
}

/**
 * Slider color scheme - game style
 */
export interface GameSliderColorScheme {
  trackTop: number;
  trackBottom: number;
  fillTop: number;
  fillBottom: number;
  thumbTop: number;
  thumbBottom: number;
  border: number;
  borderDepth: number;
}

/**
 * GameSlider configuration
 */
export interface GameSliderConfig {
  width?: number;
  height?: number;
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  colorScheme?: GameSliderColorScheme;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

/**
 * Game-style slider component for volume, progress, etc.
 * Polished mobile game style with gradients and depth
 *
 * Features:
 * - Gradient track with fill indicator
 * - Glossy draggable thumb
 * - Smooth drag interaction
 * - Touch-friendly size
 *
 * @example
 * ```typescript
 * const volumeSlider = new GameSlider({
 *   min: 0,
 *   max: 100,
 *   value: 75,
 *   onChange: (value) => setVolume(value / 100)
 * });
 *
 * stage.addChild(volumeSlider.getContainer());
 * ```
 */
export class GameSlider extends EventEmitter {
  private container: IContainer;
  private depthGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private trackGraphics: IGraphics;
  private fillGraphics: IGraphics;
  private thumbGraphics: IGraphics;
  private trackGradientSprite?: ISprite;
  private fillGradientSprite?: ISprite;

  private config: Required<GameSliderConfig>;
  private _value: number;
  private isDragging: boolean = false;
  private isPressed: boolean = false;

  // Default color scheme - blue game style
  private static readonly DEFAULT_SCHEME: GameSliderColorScheme = {
    trackTop: 0x4A5660,
    trackBottom: 0x3A4650,
    fillTop: 0x5DADE2,
    fillBottom: 0x2E86C1,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x3D4F5F,
    borderDepth: 0x2A3640,
  };

  constructor(config: GameSliderConfig = {}) {
    super();

    this.config = {
      width: config.width || 200,
      height: config.height || 36,
      min: config.min !== undefined ? config.min : 0,
      max: config.max !== undefined ? config.max : 100,
      value: config.value !== undefined ? config.value : 50,
      step: config.step !== undefined ? config.step : 1,
      colorScheme: config.colorScheme || GameSlider.DEFAULT_SCHEME,
      disabled: config.disabled || false,
      onChange: config.onChange || (() => {}),
    };

    // Clamp initial value
    this._value = Math.max(this.config.min, Math.min(this.config.max, this.config.value));

    const factory = graphics();

    // Create container
    this.container = factory.createContainer();

    // Create layers (order matters)
    this.depthGraphics = factory.createGraphics();
    this.borderGraphics = factory.createGraphics();
    this.trackGraphics = factory.createGraphics();
    this.fillGraphics = factory.createGraphics();
    this.thumbGraphics = factory.createGraphics();

    this.container.addChild(this.depthGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.trackGraphics);
    this.container.addChild(this.fillGraphics);
    this.container.addChild(this.thumbGraphics);

    // Render
    this.render();

    // Setup interaction
    this.setupInteraction();
  }

  /**
   * Get the normalized value (0-1)
   */
  private getNormalizedValue(): number {
    const range = this.config.max - this.config.min;
    if (range === 0) return 0;
    return (this._value - this.config.min) / range;
  }

  /**
   * Set value from normalized (0-1)
   */
  private setFromNormalized(normalized: number): void {
    const range = this.config.max - this.config.min;
    let newValue = this.config.min + normalized * range;

    // Apply step
    if (this.config.step > 0) {
      newValue = Math.round(newValue / this.config.step) * this.config.step;
    }

    // Clamp
    newValue = Math.max(this.config.min, Math.min(this.config.max, newValue));

    if (newValue !== this._value) {
      this._value = newValue;
      this.render();
      this.emit('change', this._value);
      this.config.onChange(this._value);
    }
  }

  /**
   * Render the slider with game-style polish
   */
  private render(): void {
    const { width, height, colorScheme, disabled } = this.config;
    const radius = height / 2;
    const borderWidth = 3;
    const depthOffset = 3;
    const trackPadding = 4;

    // Clear
    this.depthGraphics.clear();
    this.borderGraphics.clear();
    this.trackGraphics.clear();
    this.fillGraphics.clear();
    this.thumbGraphics.clear();

    // Remove old gradient sprites
    if (this.trackGradientSprite) {
      this.container.removeChild(this.trackGradientSprite);
      this.trackGradientSprite = undefined;
    }
    if (this.fillGradientSprite) {
      this.container.removeChild(this.fillGradientSprite);
      this.fillGradientSprite = undefined;
    }

    const alpha = disabled ? 0.5 : 1;
    const thumbScale = this.isPressed ? 0.9 : 1.0;

    // Calculate thumb position
    const trackX = borderWidth + trackPadding;
    const trackY = borderWidth + trackPadding;
    const trackWidth = width - (borderWidth + trackPadding) * 2;
    const trackHeight = height - (borderWidth + trackPadding) * 2;
    const trackRadius = trackHeight / 2;

    const thumbBaseRadius = (height - 8) / 2;
    const thumbRadius = thumbBaseRadius * thumbScale;
    const thumbMinX = trackX + thumbBaseRadius;
    const thumbMaxX = width - trackX - thumbBaseRadius;
    const thumbRange = thumbMaxX - thumbMinX;
    const thumbX = thumbMinX + this.getNormalizedValue() * thumbRange;
    const thumbY = height / 2;

    // Layer 1: Depth (extends below)
    this.depthGraphics.roundRect(0, 0, width, height + depthOffset, radius);
    this.depthGraphics.fill({ color: colorScheme.borderDepth, alpha });

    // Layer 2: Border
    this.borderGraphics.roundRect(0, 0, width, height, radius);
    this.borderGraphics.fill({ color: colorScheme.border, alpha });

    // Layer 3: Track background with gradient
    const trackBgCanvas = createTrackGradient(
      trackWidth,
      trackHeight,
      colorScheme.trackTop,
      colorScheme.trackBottom,
      trackRadius
    );
    const trackBgTexture = graphics().createTexture(trackBgCanvas);
    this.trackGradientSprite = graphics().createSprite(trackBgTexture);
    this.trackGradientSprite.x = trackX;
    this.trackGradientSprite.y = trackY;
    if (disabled) this.trackGradientSprite.alpha = alpha;

    // Insert after trackGraphics
    const trackIndex = this.container.getChildIndex(this.trackGraphics);
    this.container.addChild(this.trackGradientSprite);
    this.container.setChildIndex(this.trackGradientSprite, trackIndex + 1);

    // Layer 4: Fill (progress) with gradient
    const fillWidth = Math.max(trackHeight, (thumbX - trackX + thumbRadius));
    if (fillWidth > trackHeight) {
      const fillCanvas = createTrackGradient(
        fillWidth,
        trackHeight,
        colorScheme.fillTop,
        colorScheme.fillBottom,
        trackRadius
      );
      const fillTexture = graphics().createTexture(fillCanvas);
      this.fillGradientSprite = graphics().createSprite(fillTexture);
      this.fillGradientSprite.x = trackX;
      this.fillGradientSprite.y = trackY;
      if (disabled) this.fillGradientSprite.alpha = alpha;

      // Insert after track gradient
      const fillIndex = this.container.getChildIndex(this.trackGradientSprite);
      this.container.addChild(this.fillGradientSprite);
      this.container.setChildIndex(this.fillGradientSprite, fillIndex + 1);
    }

    // Inner shadow on track (subtle)
    this.trackGraphics.roundRect(trackX + 2, trackY + 1, trackWidth - 4, 3, 1.5);
    this.trackGraphics.fill({ color: 0x000000, alpha: 0.15 * alpha });

    // Layer 5: Thumb
    // Thumb shadow
    this.thumbGraphics.circle(thumbX + 1, thumbY + 2, thumbRadius);
    this.thumbGraphics.fill({ color: 0x000000, alpha: 0.3 * alpha });

    // Thumb base (darker bottom color)
    this.thumbGraphics.circle(thumbX, thumbY, thumbRadius);
    this.thumbGraphics.fill({ color: colorScheme.thumbBottom, alpha });

    // Thumb gradient effect (lighter top half)
    this.thumbGraphics.ellipse(thumbX, thumbY - thumbRadius * 0.15, thumbRadius * 0.9, thumbRadius * 0.7);
    this.thumbGraphics.fill({ color: colorScheme.thumbTop, alpha });

    // Thumb specular highlight (small bright spot)
    this.thumbGraphics.ellipse(thumbX - thumbRadius * 0.25, thumbY - thumbRadius * 0.35, thumbRadius * 0.35, thumbRadius * 0.2);
    this.thumbGraphics.fill({ color: 0xFFFFFF, alpha: 0.6 * alpha });

    // Rim light on thumb
    this.thumbGraphics.roundRect(thumbX - thumbRadius * 0.6, thumbY - thumbRadius + 2, thumbRadius * 1.2, 2, 1);
    this.thumbGraphics.fill({ color: 0xFFFFFF, alpha: 0.3 * alpha });
  }

  /**
   * Setup interaction handlers
   */
  private setupInteraction(): void {
    this.container.eventMode = 'static';
    this.container.cursor = this.config.disabled ? 'default' : 'pointer';

    const { width, height } = this.config;
    this.container.hitArea = {
      contains: (x: number, y: number) => {
        return x >= 0 && x <= width && y >= 0 && y <= height + 3;
      }
    };

    this.container.on('pointerdown', this.onPointerDown.bind(this));
    this.container.on('pointermove', this.onPointerMove.bind(this));
    this.container.on('pointerup', this.onPointerUp.bind(this));
    this.container.on('pointerupoutside', this.onPointerUpOutside.bind(this));
  }

  private onPointerDown(event: any): void {
    if (this.config.disabled) return;
    this.isDragging = true;
    this.isPressed = true;
    this.updateValueFromPointer(event);
  }

  private onPointerMove(event: any): void {
    if (this.config.disabled || !this.isDragging) return;
    this.updateValueFromPointer(event);
  }

  private onPointerUp(): void {
    if (this.config.disabled) return;
    this.isDragging = false;
    this.isPressed = false;
    this.render();
  }

  private onPointerUpOutside(): void {
    if (this.config.disabled) return;
    this.isDragging = false;
    this.isPressed = false;
    this.render();
  }

  private updateValueFromPointer(event: any): void {
    const { width, height } = this.config;
    const borderWidth = 3;
    const trackPadding = 4;

    const thumbRadius = (height - 8) / 2;
    const thumbMinX = borderWidth + trackPadding + thumbRadius;
    const thumbMaxX = width - borderWidth - trackPadding - thumbRadius;
    const thumbRange = thumbMaxX - thumbMinX;

    // Get local position
    const localPos = event.getLocalPosition(this.container);
    const x = localPos.x;

    // Calculate normalized value
    let normalized = (x - thumbMinX) / thumbRange;
    normalized = Math.max(0, Math.min(1, normalized));

    this.setFromNormalized(normalized);
  }

  /**
   * Get current value
   */
  public getValue(): number {
    return this._value;
  }

  /**
   * Set value
   */
  public setValue(value: number): void {
    const clampedValue = Math.max(this.config.min, Math.min(this.config.max, value));
    if (this._value !== clampedValue) {
      this._value = clampedValue;
      this.render();
      this.emit('change', this._value);
    }
  }

  /**
   * Set disabled state
   */
  public setDisabled(disabled: boolean): void {
    this.config.disabled = disabled;
    this.container.cursor = disabled ? 'default' : 'pointer';
    this.render();
  }

  /**
   * Check if disabled
   */
  public isDisabled(): boolean {
    return this.config.disabled;
  }

  /**
   * Set position
   */
  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Get position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  /**
   * Get the container
   */
  public getContainer(): IContainer {
    return this.container;
  }

  /**
   * Set color scheme
   */
  public setColorScheme(scheme: GameSliderColorScheme): void {
    this.config.colorScheme = scheme;
    this.render();
  }

  /**
   * Get size
   */
  public getSize(): { width: number; height: number } {
    return { width: this.config.width, height: this.config.height };
  }

  /**
   * Destroy the slider
   */
  public destroy(): void {
    this.container.destroy();
    this.removeAllListeners();
  }
}

/**
 * Pre-defined slider color schemes - game style
 */
export const GameSliderColors = {
  // Default blue slider
  DEFAULT: {
    trackTop: 0x4A5660,
    trackBottom: 0x3A4650,
    fillTop: 0x5DADE2,
    fillBottom: 0x2E86C1,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x3D4F5F,
    borderDepth: 0x2A3640,
  } as GameSliderColorScheme,

  // Green slider
  GREEN: {
    trackTop: 0x4A5660,
    trackBottom: 0x3A4650,
    fillTop: 0x7ED321,
    fillBottom: 0x5BA017,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x3D4F5F,
    borderDepth: 0x2A3640,
  } as GameSliderColorScheme,

  // Orange slider
  ORANGE: {
    trackTop: 0x4A5660,
    trackBottom: 0x3A4650,
    fillTop: 0xF5B041,
    fillBottom: 0xD68910,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x3D4F5F,
    borderDepth: 0x2A3640,
  } as GameSliderColorScheme,

  // Purple slider
  PURPLE: {
    trackTop: 0x4A5660,
    trackBottom: 0x3A4650,
    fillTop: 0xBB8FCE,
    fillBottom: 0x8E44AD,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x3D4F5F,
    borderDepth: 0x2A3640,
  } as GameSliderColorScheme,

  // Red slider
  RED: {
    trackTop: 0x4A5660,
    trackBottom: 0x3A4650,
    fillTop: 0xE74C3C,
    fillBottom: 0xC0392B,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x3D4F5F,
    borderDepth: 0x2A3640,
  } as GameSliderColorScheme,
};
