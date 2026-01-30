import { EventEmitter } from 'eventemitter3';
import { graphics } from '../../graphics/GraphicsEngine';
import { IContainer, IGraphics } from '../../contracts/Graphics';
import { Gradients } from '../../graphics/GradientFactory';

/**
 * Toggle color scheme - enhanced for game style
 */
export interface GameToggleColorScheme {
  trackOnTop: number;
  trackOnBottom: number;
  trackOffTop: number;
  trackOffBottom: number;
  thumbTop: number;
  thumbBottom: number;
  border: number;
  borderDepth: number;
}

/**
 * GameToggle configuration
 */
export interface GameToggleConfig {
  width?: number;
  height?: number;
  value?: boolean;
  colorScheme?: GameToggleColorScheme;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}

/**
 * Game-style toggle switch component
 * Polished mobile game style with gradients and depth
 *
 * Features:
 * - Gradient track with depth effect
 * - Glossy thumb with specular highlight
 * - Smooth press animation
 * - Touch-friendly size
 *
 * @example
 * ```typescript
 * const musicToggle = new GameToggle({
 *   value: true,
 *   onChange: (value) => setMusicEnabled(value)
 * });
 *
 * stage.addChild(musicToggle.getContainer());
 * ```
 */
export class GameToggle extends EventEmitter {
  private container: IContainer;
  private depthGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private trackGraphics: IGraphics;
  private thumbGraphics: IGraphics;

  private config: Required<GameToggleConfig>;
  private _value: boolean;
  private isPressed: boolean = false;

  // Default color scheme - green/gray game style
  private static readonly DEFAULT_SCHEME: GameToggleColorScheme = {
    trackOnTop: 0x7ED321,
    trackOnBottom: 0x5BA017,
    trackOffTop: 0x6B7C8A,
    trackOffBottom: 0x4A5660,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x3D4F5F,
    borderDepth: 0x2A3640,
  };

  constructor(config: GameToggleConfig = {}) {
    super();

    this.config = {
      width: config.width || 70,
      height: config.height || 36,
      value: config.value !== undefined ? config.value : false,
      colorScheme: config.colorScheme || GameToggle.DEFAULT_SCHEME,
      disabled: config.disabled || false,
      onChange: config.onChange || (() => {}),
    };

    this._value = this.config.value;

    const factory = graphics();

    // Create container
    this.container = factory.createContainer();

    // Create layers (order matters)
    this.depthGraphics = factory.createGraphics();
    this.borderGraphics = factory.createGraphics();
    this.trackGraphics = factory.createGraphics();
    this.thumbGraphics = factory.createGraphics();

    this.container.addChild(this.depthGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.trackGraphics);
    this.container.addChild(this.thumbGraphics);

    // Render
    this.render();

    // Setup interaction
    this.setupInteraction();
  }

  /**
   * Render the toggle with game-style polish
   */
  private render(): void {
    const { width, height, colorScheme, disabled } = this.config;
    const radius = height / 2;
    const borderWidth = 3;
    const depthOffset = 3;

    // Clear
    this.depthGraphics.clear();
    this.borderGraphics.clear();
    this.trackGraphics.clear();
    this.thumbGraphics.clear();

    const alpha = disabled ? 0.5 : 1;
    const thumbScale = this.isPressed ? 0.9 : 1.0;

    // Determine track colors based on state
    const trackTopColor = this._value ? colorScheme.trackOnTop : colorScheme.trackOffTop;
    const trackBottomColor = this._value ? colorScheme.trackOnBottom : colorScheme.trackOffBottom;

    // Layer 1: Depth (extends below)
    this.depthGraphics.roundRect(0, 0, width, height + depthOffset, radius);
    this.depthGraphics.fill({ color: colorScheme.borderDepth, alpha });

    // Layer 2: Border
    this.borderGraphics.roundRect(0, 0, width, height, radius);
    this.borderGraphics.fill({ color: colorScheme.border, alpha });

    // Layer 3: Track fill with native FillGradient
    const trackX = borderWidth;
    const trackY = borderWidth;
    const trackWidth = width - borderWidth * 2;
    const trackHeight = height - borderWidth * 2;
    const trackRadius = radius - borderWidth;

    // Use native FillGradient for track background
    const trackGradient = Gradients.linear.vertical(trackTopColor, trackBottomColor);
    this.trackGraphics.roundRect(trackX, trackY, trackWidth, trackHeight, trackRadius);
    this.trackGraphics.fill(trackGradient as any);
    if (disabled) this.trackGraphics.alpha = alpha;

    // Inner shadow on track (subtle) - draw as separate graphics on top
    const innerShadow = graphics().createGraphics();
    innerShadow.roundRect(trackX + 2, trackY + 1, trackWidth - 4, 4, 2);
    innerShadow.fill({ color: 0x000000, alpha: 0.15 * alpha });
    this.container.addChild(innerShadow);

    // Layer 4: Thumb
    const thumbBaseRadius = (height - 10) / 2;
    const thumbRadius = thumbBaseRadius * thumbScale;
    const thumbX = this._value ? width - thumbBaseRadius - 7 : thumbBaseRadius + 7;
    const thumbY = height / 2;

    // Thumb shadow
    this.thumbGraphics.circle(thumbX + 1, thumbY + 2, thumbRadius);
    this.thumbGraphics.fill({ color: 0x000000, alpha: 0.25 * alpha });

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
    this.container.on('pointerup', this.onPointerUp.bind(this));
    this.container.on('pointerupoutside', this.onPointerUpOutside.bind(this));
  }

  private onPointerDown(): void {
    if (this.config.disabled) return;
    this.isPressed = true;
    this.render();
  }

  private onPointerUp(): void {
    if (this.config.disabled) return;
    this.isPressed = false;
    this.toggle();
  }

  private onPointerUpOutside(): void {
    if (this.config.disabled) return;
    this.isPressed = false;
    this.render();
  }

  /**
   * Toggle the value
   */
  public toggle(): void {
    this._value = !this._value;
    this.render();
    this.emit('change', this._value);
    this.config.onChange(this._value);
  }

  /**
   * Get current value
   */
  public getValue(): boolean {
    return this._value;
  }

  /**
   * Set value
   */
  public setValue(value: boolean): void {
    if (this._value !== value) {
      this._value = value;
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
  public setColorScheme(scheme: GameToggleColorScheme): void {
    this.config.colorScheme = scheme;
    this.render();
  }

  /**
   * Destroy the toggle
   */
  public destroy(): void {
    this.container.destroy();
    this.removeAllListeners();
  }
}

/**
 * Pre-defined toggle color schemes - game style
 */
export const GameToggleColors = {
  // Default green toggle
  DEFAULT: {
    trackOnTop: 0x7ED321,
    trackOnBottom: 0x5BA017,
    trackOffTop: 0x6B7C8A,
    trackOffBottom: 0x4A5660,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x3D4F5F,
    borderDepth: 0x2A3640,
  } as GameToggleColorScheme,

  // Blue toggle
  BLUE: {
    trackOnTop: 0x5DADE2,
    trackOnBottom: 0x2E86C1,
    trackOffTop: 0x6B7C8A,
    trackOffBottom: 0x4A5660,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x1A5276,
    borderDepth: 0x0E3249,
  } as GameToggleColorScheme,

  // Orange toggle
  ORANGE: {
    trackOnTop: 0xF5B041,
    trackOnBottom: 0xD68910,
    trackOffTop: 0x6B7C8A,
    trackOffBottom: 0x4A5660,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0xB7950B,
    borderDepth: 0x7D6608,
  } as GameToggleColorScheme,

  // Purple toggle
  PURPLE: {
    trackOnTop: 0xBB8FCE,
    trackOnBottom: 0x8E44AD,
    trackOffTop: 0x6B7C8A,
    trackOffBottom: 0x4A5660,
    thumbTop: 0xFFFFFF,
    thumbBottom: 0xE8E8E8,
    border: 0x6C3483,
    borderDepth: 0x4A235A,
  } as GameToggleColorScheme,
};
