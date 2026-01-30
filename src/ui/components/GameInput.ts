import { EventEmitter } from 'eventemitter3';
import { Input } from '@pixi/ui';
import { IContainer, IGraphics } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors } from '../themes/GameStyleUITheme';
import { getFrameworkFontFamily, loadFrameworkFont } from '../utils/FontLoader';

/**
 * Color scheme for game-style input
 */
export interface GameInputColorScheme {
  background: number;
  backgroundFocus: number;
  border: number;
  borderInner: number;
  shadow: number;
  text: number;
  placeholder: number;
  cursor: number;
  selection: number;
  highlight: number;
}

/**
 * GameInput configuration
 */
export interface GameInputConfig {
  width?: number;
  height?: number;
  placeholder?: string;
  value?: string;
  maxLength?: number;
  fontSize?: number;
  colorScheme?: GameInputColorScheme;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
}

/**
 * Game-style text input component with jellybean styling
 *
 * Features:
 * - Black outer border with inner shadow (inset look)
 * - Focus state highlighting
 * - Placeholder text support
 * - Touch-friendly height (minimum 44px)
 *
 * @example
 * ```typescript
 * const nameInput = new GameInput({
 *   placeholder: 'Enter your name',
 *   width: 250,
 *   onChange: (value) => setPlayerName(value),
 *   onEnter: (value) => submitName(value)
 * });
 * stage.addChild(nameInput.getContainer());
 * ```
 */
export class GameInput extends EventEmitter {
  private container: IContainer;
  private shadowGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private backgroundGraphics: IGraphics;
  private highlightGraphics: IGraphics;
  private pixiInput: Input;

  private config: Required<GameInputConfig>;
  private _value: string;
  private isFocused: boolean = false;

  constructor(config: GameInputConfig = {}) {
    super();

    loadFrameworkFont();

    this.config = {
      width: config.width || 200,
      height: config.height || 44,
      placeholder: config.placeholder || '',
      value: config.value || '',
      maxLength: config.maxLength || 100,
      fontSize: config.fontSize || 18,
      colorScheme: config.colorScheme || GameStyleColors.GAME_INPUT,
      disabled: config.disabled || false,
      onChange: config.onChange || (() => {}),
      onEnter: config.onEnter || (() => {})
    };

    // Ensure minimum touch target
    this.config.height = Math.max(this.config.height, 44);

    this._value = this.config.value;

    const factory = graphics();

    // Create container and graphics
    this.container = factory.createContainer();
    this.shadowGraphics = factory.createGraphics();
    this.borderGraphics = factory.createGraphics();
    this.backgroundGraphics = factory.createGraphics();
    this.highlightGraphics = factory.createGraphics();

    // Build hierarchy
    this.container.addChild(this.shadowGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.backgroundGraphics);
    this.container.addChild(this.highlightGraphics);

    // Create @pixi/ui Input
    this.createPixiInput();

    // Initial render
    this.render();
  }

  private createPixiInput(): void {
    const { width, height, placeholder, value, maxLength, fontSize, colorScheme } = this.config;
    const padding = 12;

    // Create a transparent graphics for background (we draw our own styled background)
    const factory = graphics();
    const inputBg = factory.createGraphics();
    inputBg.rect(0, 0, width, height);
    inputBg.fill({ color: 0x000000, alpha: 0 });

    this.pixiInput = new Input({
      bg: inputBg as any,
      textStyle: {
        fontFamily: getFrameworkFontFamily(),
        fontSize: fontSize,
        fill: colorScheme.text
      },
      placeholder: placeholder,
      value: value,
      maxLength: maxLength,
      padding: [0, padding, 0, padding],
      align: 'left'
    });

    // Position inside our styled frame
    this.pixiInput.x = 0;
    this.pixiInput.y = 0;

    // Forward events using typed-signals connect
    this.pixiInput.onEnter.connect((val: string) => {
      this._value = val;
      this.emit('enter', val);
      this.config.onEnter(val);
    });

    this.pixiInput.onChange.connect((val: string) => {
      this._value = val;
      this.emit('change', val);
      this.config.onChange(val);
    });

    // Track focus state via pointer events on container
    this.container.eventMode = 'static';
    this.container.on('pointerdown', () => {
      this.isFocused = true;
      this.render();
      this.emit('focus');
    });

    // Listen for global clicks to detect blur
    // Note: In practice, the @pixi/ui Input handles native HTML input focus
    // We update visual state when user clicks away

    this.container.addChild(this.pixiInput as any);
  }

  private render(): void {
    const { width, height, colorScheme, disabled } = this.config;
    const radius = 8;
    const shadowOffset = 3;

    // Clear all
    this.shadowGraphics.clear();
    this.borderGraphics.clear();
    this.backgroundGraphics.clear();
    this.highlightGraphics.clear();

    const alpha = disabled ? 0.5 : 1;
    const bgColor = this.isFocused ? colorScheme.backgroundFocus : colorScheme.background;

    // 1. Inner shadow (inset effect - drawn at bottom/right)
    this.shadowGraphics.roundRect(shadowOffset, shadowOffset, width, height, radius);
    this.shadowGraphics.fill({ color: colorScheme.shadow, alpha: alpha * 0.5 });

    // 2. Black border
    this.borderGraphics.roundRect(-1, -1, width + 2, height + 2, radius + 1);
    this.borderGraphics.stroke({ color: colorScheme.border, width: 1, alpha });

    // 3. Background
    this.backgroundGraphics.roundRect(0, 0, width, height, radius);
    this.backgroundGraphics.fill({ color: bgColor, alpha });

    // 4. Inner border (subtle depth)
    this.backgroundGraphics.roundRect(1, 1, width - 2, height - 2, radius - 1);
    this.backgroundGraphics.stroke({ color: colorScheme.borderInner, width: 1, alpha: alpha * 0.5 });

    // 5. Focus highlight
    if (this.isFocused && !disabled) {
      this.highlightGraphics.roundRect(-2, -2, width + 4, height + 4, radius + 2);
      this.highlightGraphics.stroke({ color: colorScheme.selection, width: 2, alpha: 0.6 });
    }
  }

  /** Get current value */
  public getValue(): string {
    return this._value;
  }

  /** Set value */
  public setValue(value: string): void {
    this._value = value;
    this.pixiInput.value = value;
  }

  /** Set placeholder */
  public setPlaceholder(placeholder: string): void {
    this.config.placeholder = placeholder;
    // Note: @pixi/ui Input doesn't expose a setter for placeholder after construction
    // This would require recreating the input in practice
  }

  /** Set disabled state */
  public setDisabled(disabled: boolean): void {
    this.config.disabled = disabled;
    // @pixi/ui Input v2.x uses eventMode instead of disabled property
    this.pixiInput.eventMode = disabled ? 'none' : 'static';
    this.render();
  }

  /** Check if disabled */
  public isDisabled(): boolean {
    return this.config.disabled;
  }

  /** Focus the input */
  public focus(): void {
    this.isFocused = true;
    this.render();
    this.emit('focus');
    // Note: @pixi/ui Input doesn't expose focus() directly
    // The actual HTML input focus is handled internally by the component
  }

  /** Blur the input */
  public blur(): void {
    this.isFocused = false;
    this.render();
    this.emit('blur');
    // Note: @pixi/ui Input doesn't expose blur() directly
  }

  /** Set position */
  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /** Get the container */
  public getContainer(): IContainer {
    return this.container;
  }

  /** Destroy the component */
  public destroy(): void {
    this.pixiInput.destroy();
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}

/**
 * Pre-defined input color schemes
 */
export const GameInputColors = {
  DEFAULT: GameStyleColors.GAME_INPUT,

  DARK: {
    ...GameStyleColors.GAME_INPUT,
    background: 0x1A2530,
    backgroundFocus: 0x2A3540
  } as GameInputColorScheme,

  LIGHT: {
    ...GameStyleColors.GAME_INPUT,
    background: 0x4A5A6A,
    backgroundFocus: 0x5A6A7A,
    text: 0xFFFFFF
  } as GameInputColorScheme
};
