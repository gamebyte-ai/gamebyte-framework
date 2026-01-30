import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors } from '../themes/GameStyleUITheme';
import { getFrameworkFontFamily, loadFrameworkFont } from '../utils/FontLoader';

/**
 * Color scheme for game-style checkbox
 */
export interface GameCheckBoxColorScheme {
  boxBg: number;
  boxBorder: number;
  boxShadow: number;
  boxChecked: number;
  checkmark: number;
  highlight: number;
  text: number;
}

/**
 * GameCheckBox configuration
 */
export interface GameCheckBoxConfig {
  label?: string;
  checked?: boolean;
  size?: number;
  fontSize?: number;
  colorScheme?: GameCheckBoxColorScheme;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

/**
 * Game-style checkbox component with jellybean styling
 *
 * Features:
 * - Black outer border with inner shadow
 * - Checkmark animation on toggle
 * - Optional text label
 * - Touch-friendly size (minimum 32px)
 *
 * @example
 * ```typescript
 * const checkbox = new GameCheckBox({
 *   label: 'Enable Sound',
 *   checked: true,
 *   onChange: (checked) => setSoundEnabled(checked)
 * });
 * stage.addChild(checkbox.getContainer());
 * ```
 */
export class GameCheckBox extends EventEmitter {
  private container: IContainer;
  private boxContainer: IContainer;
  private shadowGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private backgroundGraphics: IGraphics;
  private highlightGraphics: IGraphics;
  private checkmarkGraphics: IGraphics;
  private labelText?: IText;

  private config: Required<GameCheckBoxConfig>;
  private _checked: boolean;
  private isPressed: boolean = false;

  constructor(config: GameCheckBoxConfig = {}) {
    super();

    loadFrameworkFont();

    this.config = {
      label: config.label || '',
      checked: config.checked !== undefined ? config.checked : false,
      size: config.size || 32,
      fontSize: config.fontSize || 18,
      colorScheme: config.colorScheme || GameStyleColors.GAME_CHECKBOX,
      disabled: config.disabled || false,
      onChange: config.onChange || (() => {})
    };

    // Ensure minimum touch target
    this.config.size = Math.max(this.config.size, 32);

    this._checked = this.config.checked;

    const factory = graphics();

    // Create containers
    this.container = factory.createContainer();
    this.boxContainer = factory.createContainer();

    // Create graphics layers
    this.shadowGraphics = factory.createGraphics();
    this.borderGraphics = factory.createGraphics();
    this.backgroundGraphics = factory.createGraphics();
    this.highlightGraphics = factory.createGraphics();
    this.checkmarkGraphics = factory.createGraphics();

    // Build hierarchy
    this.boxContainer.addChild(this.shadowGraphics);
    this.boxContainer.addChild(this.borderGraphics);
    this.boxContainer.addChild(this.backgroundGraphics);
    this.boxContainer.addChild(this.highlightGraphics);
    this.boxContainer.addChild(this.checkmarkGraphics);
    this.container.addChild(this.boxContainer);

    // Create label if provided
    if (this.config.label) {
      this.createLabel();
    }

    // Render and setup interaction
    this.render();
    this.setupInteraction();
  }

  private createLabel(): void {
    const { label, size, fontSize, colorScheme } = this.config;

    this.labelText = graphics().createText(label, {
      fontFamily: getFrameworkFontFamily(),
      fontSize: fontSize,
      fontWeight: '600',
      fill: colorScheme.text
    });

    this.labelText.x = size + 12;
    this.labelText.y = size / 2;
    if (this.labelText.anchor) this.labelText.anchor.set(0, 0.5);

    this.container.addChild(this.labelText);
  }

  private render(): void {
    const { size, colorScheme, disabled } = this.config;
    const radius = size * 0.2;
    const shadowOffset = 3;

    // Clear all graphics
    this.shadowGraphics.clear();
    this.borderGraphics.clear();
    this.backgroundGraphics.clear();
    this.highlightGraphics.clear();
    this.checkmarkGraphics.clear();

    const alpha = disabled ? 0.5 : 1;
    const boxY = this.isPressed ? shadowOffset - 1 : 0;
    const currentShadow = this.isPressed ? 1 : shadowOffset;

    // 1. Shadow (depth)
    this.shadowGraphics.roundRect(0, currentShadow, size, size, radius);
    this.shadowGraphics.fill({ color: colorScheme.boxShadow, alpha });

    // 2. Black border
    this.borderGraphics.roundRect(-1, boxY - 1, size + 2, size + currentShadow + 2, radius + 1);
    this.borderGraphics.stroke({ color: colorScheme.boxBorder, width: 1, alpha });

    // 3. Background
    const bgColor = this._checked ? colorScheme.boxChecked : colorScheme.boxBg;
    this.backgroundGraphics.roundRect(0, boxY, size, size, radius);
    this.backgroundGraphics.fill({ color: bgColor, alpha });

    // 4. Top highlight (subtle shine)
    if (!this.isPressed) {
      this.highlightGraphics.roundRect(2, boxY + 2, size - 4, size * 0.35, radius - 1);
      this.highlightGraphics.fill({ color: colorScheme.highlight, alpha: 0.2 * alpha });
    }

    // 5. Checkmark (if checked)
    if (this._checked) {
      this.renderCheckmark(size, boxY, colorScheme.checkmark, alpha);
    }
  }

  private renderCheckmark(size: number, boxY: number, color: number, alpha: number): void {
    const cx = size / 2;
    const cy = boxY + size / 2;
    const scale = size / 32;

    // Draw checkmark path
    this.checkmarkGraphics.moveTo(cx - 8 * scale, cy);
    this.checkmarkGraphics.lineTo(cx - 2 * scale, cy + 6 * scale);
    this.checkmarkGraphics.lineTo(cx + 8 * scale, cy - 6 * scale);
    this.checkmarkGraphics.stroke({ color, width: 3 * scale, alpha });
  }

  private setupInteraction(): void {
    this.container.eventMode = 'static';
    this.container.cursor = this.config.disabled ? 'default' : 'pointer';

    // Hit area covers box and label
    const totalWidth = this.config.label
      ? this.config.size + 12 + (this.labelText?.width || 0)
      : this.config.size;

    this.container.hitArea = {
      contains: (x: number, y: number) => {
        return x >= -4 && x <= totalWidth + 4 && y >= -4 && y <= this.config.size + 8;
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

  /** Toggle the checkbox state */
  public toggle(): void {
    this._checked = !this._checked;
    this.render();
    this.emit('change', this._checked);
    this.config.onChange(this._checked);
  }

  /** Get current checked state */
  public isChecked(): boolean {
    return this._checked;
  }

  /** Set checked state */
  public setChecked(checked: boolean): void {
    if (this._checked !== checked) {
      this._checked = checked;
      this.render();
      this.emit('change', this._checked);
    }
  }

  /** Set disabled state */
  public setDisabled(disabled: boolean): void {
    this.config.disabled = disabled;
    this.container.cursor = disabled ? 'default' : 'pointer';
    this.render();
  }

  /** Check if disabled */
  public isDisabled(): boolean {
    return this.config.disabled;
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
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}

/**
 * Pre-defined checkbox color schemes
 */
export const GameCheckBoxColors = {
  DEFAULT: GameStyleColors.GAME_CHECKBOX,

  GREEN: {
    ...GameStyleColors.GAME_CHECKBOX,
    boxChecked: 0x4CAF50
  } as GameCheckBoxColorScheme,

  ORANGE: {
    ...GameStyleColors.GAME_CHECKBOX,
    boxChecked: 0xF5B041
  } as GameCheckBoxColorScheme,

  PURPLE: {
    ...GameStyleColors.GAME_CHECKBOX,
    boxChecked: 0x9C27B0
  } as GameCheckBoxColorScheme,

  RED: {
    ...GameStyleColors.GAME_CHECKBOX,
    boxChecked: 0xE74C3C
  } as GameCheckBoxColorScheme
};
