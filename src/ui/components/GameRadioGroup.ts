import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors } from '../themes/GameStyleUITheme';
import { getFrameworkFontFamily, loadFrameworkFont } from '../utils/FontLoader';

/**
 * Color scheme for game-style radio buttons
 */
export interface GameRadioColorScheme {
  circleBg: number;
  circleBorder: number;
  circleShadow: number;
  circleSelected: number;
  dot: number;
  highlight: number;
  text: number;
}

/**
 * Radio option definition
 */
export interface GameRadioOption {
  label: string;
  value: string;
}

/**
 * GameRadioGroup configuration
 */
export interface GameRadioGroupConfig {
  options: GameRadioOption[];
  selectedValue?: string;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  size?: number;
  fontSize?: number;
  colorScheme?: GameRadioColorScheme;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

/**
 * Game-style radio button group with jellybean styling
 *
 * Features:
 * - Circular radio buttons with dot indicator
 * - Black outer border with inner shadow
 * - Vertical or horizontal layout
 * - Touch-friendly size
 *
 * @example
 * ```typescript
 * const difficulty = new GameRadioGroup({
 *   options: [
 *     { label: 'Easy', value: 'easy' },
 *     { label: 'Medium', value: 'medium' },
 *     { label: 'Hard', value: 'hard' }
 *   ],
 *   selectedValue: 'medium',
 *   onChange: (value) => setDifficulty(value)
 * });
 * stage.addChild(difficulty.getContainer());
 * ```
 */
export class GameRadioGroup extends EventEmitter {
  private container: IContainer;
  private radioItems: Array<{
    container: IContainer;
    option: GameRadioOption;
    graphics: {
      shadow: IGraphics;
      border: IGraphics;
      background: IGraphics;
      highlight: IGraphics;
      dot: IGraphics;
    };
    label: IText;
  }> = [];

  private config: Required<GameRadioGroupConfig>;
  private _selectedValue: string;
  private pressedIndex: number = -1;

  constructor(config: GameRadioGroupConfig) {
    super();

    loadFrameworkFont();

    this.config = {
      options: config.options || [],
      selectedValue: config.selectedValue || (config.options[0]?.value ?? ''),
      direction: config.direction || 'vertical',
      gap: config.gap || 16,
      size: config.size || 28,
      fontSize: config.fontSize || 18,
      colorScheme: config.colorScheme || GameStyleColors.GAME_RADIO,
      disabled: config.disabled || false,
      onChange: config.onChange || (() => {})
    };

    this.config.size = Math.max(this.config.size, 28);
    this._selectedValue = this.config.selectedValue;

    this.container = graphics().createContainer();

    this.createRadioItems();
    this.render();
    this.setupInteraction();
  }

  private createRadioItems(): void {
    const { options, direction, gap, size, fontSize, colorScheme } = this.config;
    const factory = graphics();

    let offsetX = 0;
    let offsetY = 0;

    options.forEach((option, index) => {
      const itemContainer = factory.createContainer();
      itemContainer.x = offsetX;
      itemContainer.y = offsetY;

      // Create graphics layers
      const gfx = {
        shadow: factory.createGraphics(),
        border: factory.createGraphics(),
        background: factory.createGraphics(),
        highlight: factory.createGraphics(),
        dot: factory.createGraphics()
      };

      itemContainer.addChild(gfx.shadow);
      itemContainer.addChild(gfx.border);
      itemContainer.addChild(gfx.background);
      itemContainer.addChild(gfx.highlight);
      itemContainer.addChild(gfx.dot);

      // Create label
      const label = factory.createText(option.label, {
        fontFamily: getFrameworkFontFamily(),
        fontSize: fontSize,
        fontWeight: '600',
        fill: colorScheme.text
      });
      label.x = size + 12;
      label.y = size / 2;
      if (label.anchor) label.anchor.set(0, 0.5);
      itemContainer.addChild(label);

      this.container.addChild(itemContainer);
      this.radioItems.push({ container: itemContainer, option, graphics: gfx, label });

      // Update offset for next item
      if (direction === 'horizontal') {
        offsetX += size + 12 + (label.width || 60) + gap;
      } else {
        offsetY += size + gap;
      }
    });
  }

  private render(): void {
    const { size, colorScheme, disabled } = this.config;
    const radius = size / 2;
    const shadowOffset = 2;

    this.radioItems.forEach((item, index) => {
      const { graphics: gfx, option } = item;
      const isSelected = option.value === this._selectedValue;
      const isPressed = index === this.pressedIndex;

      // Clear all
      Object.values(gfx).forEach(g => g.clear());

      const alpha = disabled ? 0.5 : 1;
      const circleY = isPressed ? shadowOffset - 1 : 0;
      const currentShadow = isPressed ? 1 : shadowOffset;

      // 1. Shadow
      gfx.shadow.circle(radius, radius + currentShadow, radius);
      gfx.shadow.fill({ color: colorScheme.circleShadow, alpha });

      // 2. Border
      gfx.border.circle(radius, radius + circleY, radius + 1);
      gfx.border.stroke({ color: colorScheme.circleBorder, width: 1, alpha });

      // 3. Background
      const bgColor = isSelected ? colorScheme.circleSelected : colorScheme.circleBg;
      gfx.background.circle(radius, radius + circleY, radius);
      gfx.background.fill({ color: bgColor, alpha });

      // 4. Highlight
      if (!isPressed) {
        gfx.highlight.ellipse(radius, radius + circleY - radius * 0.2, radius * 0.7, radius * 0.35);
        gfx.highlight.fill({ color: colorScheme.highlight, alpha: 0.2 * alpha });
      }

      // 5. Inner dot (if selected)
      if (isSelected) {
        gfx.dot.circle(radius, radius + circleY, radius * 0.4);
        gfx.dot.fill({ color: colorScheme.dot, alpha });
      }
    });
  }

  private setupInteraction(): void {
    this.radioItems.forEach((item, index) => {
      item.container.eventMode = 'static';
      item.container.cursor = this.config.disabled ? 'default' : 'pointer';

      const size = this.config.size;
      const labelWidth = item.label.width || 60;

      item.container.hitArea = {
        contains: (x: number, y: number) => {
          return x >= -4 && x <= size + 12 + labelWidth + 4 && y >= -4 && y <= size + 8;
        }
      };

      item.container.on('pointerdown', () => this.onPointerDown(index));
      item.container.on('pointerup', () => this.onPointerUp(index));
      item.container.on('pointerupoutside', () => this.onPointerUpOutside());
    });
  }

  private onPointerDown(index: number): void {
    if (this.config.disabled) return;
    this.pressedIndex = index;
    this.render();
  }

  private onPointerUp(index: number): void {
    if (this.config.disabled) return;
    this.pressedIndex = -1;
    this.selectIndex(index);
  }

  private onPointerUpOutside(): void {
    if (this.config.disabled) return;
    this.pressedIndex = -1;
    this.render();
  }

  private selectIndex(index: number): void {
    const option = this.radioItems[index]?.option;
    if (option && option.value !== this._selectedValue) {
      this._selectedValue = option.value;
      this.render();
      this.emit('change', this._selectedValue);
      this.config.onChange(this._selectedValue);
    }
  }

  /** Get selected value */
  public getValue(): string {
    return this._selectedValue;
  }

  /** Set selected value */
  public setValue(value: string): void {
    const exists = this.config.options.some(o => o.value === value);
    if (exists && this._selectedValue !== value) {
      this._selectedValue = value;
      this.render();
      this.emit('change', this._selectedValue);
    }
  }

  /** Set disabled state */
  public setDisabled(disabled: boolean): void {
    this.config.disabled = disabled;
    this.radioItems.forEach(item => {
      item.container.cursor = disabled ? 'default' : 'pointer';
    });
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
 * Pre-defined radio color schemes
 */
export const GameRadioColors = {
  DEFAULT: GameStyleColors.GAME_RADIO,

  GREEN: {
    ...GameStyleColors.GAME_RADIO,
    circleSelected: 0x4CAF50
  } as GameRadioColorScheme,

  ORANGE: {
    ...GameStyleColors.GAME_RADIO,
    circleSelected: 0xF5B041
  } as GameRadioColorScheme,

  PURPLE: {
    ...GameStyleColors.GAME_RADIO,
    circleSelected: 0x9C27B0
  } as GameRadioColorScheme
};
