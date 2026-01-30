import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics.js';
import { graphics } from '../../graphics/GraphicsEngine.js';
import { GameStyleColors } from '../themes/GameStyleUITheme.js';
import { getFrameworkFontFamily, loadFrameworkFont } from '../utils/FontLoader.js';

/**
 * Color scheme for game-style select
 */
export interface GameSelectColorScheme {
  triggerBg: number;
  triggerBorder: number;
  triggerShadow: number;
  triggerHighlight: number;
  dropdownBg: number;
  dropdownBorder: number;
  dropdownShadow: number;
  itemHover: number;
  itemSelected: number;
  text: number;
  arrow: number;
}

/**
 * Select option definition
 */
export interface GameSelectOption {
  label: string;
  value: string;
}

/**
 * GameSelect configuration
 */
export interface GameSelectConfig {
  width?: number;
  height?: number;
  placeholder?: string;
  options?: GameSelectOption[];
  selectedValue?: string;
  fontSize?: number;
  colorScheme?: GameSelectColorScheme;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

/**
 * Game-style dropdown select component with jellybean styling
 *
 * Features:
 * - Jellybean trigger button (like GameStyleButton)
 * - Dropdown panel with game styling
 * - Item hover and selection states
 * - Arrow indicator
 *
 * @example
 * ```typescript
 * const levelSelect = new GameSelect({
 *   placeholder: 'Select Level',
 *   options: [
 *     { label: 'Level 1', value: '1' },
 *     { label: 'Level 2', value: '2' },
 *     { label: 'Level 3', value: '3' }
 *   ],
 *   onChange: (value) => loadLevel(value)
 * });
 * stage.addChild(levelSelect.getContainer());
 * ```
 */
export class GameSelect extends EventEmitter {
  private container: IContainer;

  // Trigger button graphics
  private triggerContainer: IContainer;
  private triggerShadow: IGraphics;
  private triggerBorder: IGraphics;
  private triggerBg: IGraphics;
  private triggerHighlight: IGraphics;
  private triggerText: IText;
  private arrowGraphics: IGraphics;

  // Dropdown graphics
  private dropdownContainer: IContainer;
  private dropdownShadow: IGraphics;
  private dropdownBorder: IGraphics;
  private dropdownBg: IGraphics;
  private dropdownItems: Array<{
    container: IContainer;
    bg: IGraphics;
    text: IText;
    option: GameSelectOption;
  }> = [];

  private config: Required<GameSelectConfig>;
  private _selectedValue: string;
  private _isOpen: boolean = false;
  private isPressed: boolean = false;
  private hoveredIndex: number = -1;
  private globalClickHandler: ((event: any) => void) | null = null;

  constructor(config: GameSelectConfig = {}) {
    super();

    loadFrameworkFont();

    this.config = {
      width: config.width || 200,
      height: config.height || 44,
      placeholder: config.placeholder || 'Select...',
      options: config.options || [],
      selectedValue: config.selectedValue || '',
      fontSize: config.fontSize || 18,
      colorScheme: config.colorScheme || GameStyleColors.GAME_SELECT,
      disabled: config.disabled || false,
      onChange: config.onChange || (() => {})
    };

    this.config.height = Math.max(this.config.height, 44);
    this._selectedValue = this.config.selectedValue;

    const factory = graphics();

    // Create containers
    this.container = factory.createContainer();
    this.triggerContainer = factory.createContainer();
    this.dropdownContainer = factory.createContainer();

    // Create trigger graphics
    this.triggerShadow = factory.createGraphics();
    this.triggerBorder = factory.createGraphics();
    this.triggerBg = factory.createGraphics();
    this.triggerHighlight = factory.createGraphics();
    this.arrowGraphics = factory.createGraphics();

    // Build trigger hierarchy
    this.triggerContainer.addChild(this.triggerShadow);
    this.triggerContainer.addChild(this.triggerBorder);
    this.triggerContainer.addChild(this.triggerBg);
    this.triggerContainer.addChild(this.triggerHighlight);
    this.triggerContainer.addChild(this.arrowGraphics);

    // Create trigger text
    this.triggerText = factory.createText(this.getDisplayText(), {
      fontFamily: getFrameworkFontFamily(),
      fontSize: this.config.fontSize,
      fontWeight: '600',
      fill: this.config.colorScheme.text
    });
    if (this.triggerText.anchor) this.triggerText.anchor.set(0, 0.5);
    this.triggerText.x = 12;
    this.triggerText.y = this.config.height / 2;
    this.triggerContainer.addChild(this.triggerText);

    // Create dropdown graphics
    this.dropdownShadow = factory.createGraphics();
    this.dropdownBorder = factory.createGraphics();
    this.dropdownBg = factory.createGraphics();

    this.dropdownContainer.addChild(this.dropdownShadow);
    this.dropdownContainer.addChild(this.dropdownBorder);
    this.dropdownContainer.addChild(this.dropdownBg);
    this.dropdownContainer.visible = false;
    this.dropdownContainer.y = this.config.height + 4;

    // Build hierarchy
    this.container.addChild(this.triggerContainer);
    this.container.addChild(this.dropdownContainer);

    // Create dropdown items
    this.createDropdownItems();

    // Render and setup
    this.render();
    this.setupInteraction();
  }

  private getDisplayText(): string {
    if (this._selectedValue) {
      const option = this.config.options.find(o => o.value === this._selectedValue);
      return option?.label || this._selectedValue;
    }
    return this.config.placeholder;
  }

  private createDropdownItems(): void {
    const { options, width, height, fontSize, colorScheme } = this.config;
    const factory = graphics();
    const itemHeight = height - 4;

    options.forEach((option, index) => {
      const itemContainer = factory.createContainer();
      itemContainer.y = index * itemHeight;

      const bg = factory.createGraphics();
      const text = factory.createText(option.label, {
        fontFamily: getFrameworkFontFamily(),
        fontSize: fontSize,
        fontWeight: '600',
        fill: colorScheme.text
      });

      if (text.anchor) text.anchor.set(0, 0.5);
      text.x = 12;
      text.y = itemHeight / 2;

      itemContainer.addChild(bg);
      itemContainer.addChild(text);
      this.dropdownContainer.addChild(itemContainer);

      this.dropdownItems.push({ container: itemContainer, bg, text, option });
    });
  }

  private render(): void {
    this.renderTrigger();
    this.renderDropdown();
  }

  private renderTrigger(): void {
    const { width, height, colorScheme, disabled } = this.config;
    const radius = 8;
    const shadowOffset = 3;

    // Clear
    this.triggerShadow.clear();
    this.triggerBorder.clear();
    this.triggerBg.clear();
    this.triggerHighlight.clear();
    this.arrowGraphics.clear();

    const alpha = disabled ? 0.5 : 1;
    const triggerY = this.isPressed ? shadowOffset - 1 : 0;
    const currentShadow = this.isPressed ? 1 : shadowOffset;

    // 1. Shadow
    this.triggerShadow.roundRect(0, currentShadow, width, height, radius);
    this.triggerShadow.fill({ color: colorScheme.triggerShadow, alpha });

    // 2. Border
    this.triggerBorder.roundRect(-1, triggerY - 1, width + 2, height + currentShadow + 2, radius + 1);
    this.triggerBorder.stroke({ color: colorScheme.triggerBorder, width: 1, alpha });

    // 3. Background
    this.triggerBg.roundRect(0, triggerY, width, height, radius);
    this.triggerBg.fill({ color: colorScheme.triggerBg, alpha });

    // 4. Highlight
    if (!this.isPressed) {
      this.triggerHighlight.roundRect(3, triggerY + 3, width - 6, height * 0.4, radius - 2);
      this.triggerHighlight.fill({ color: colorScheme.triggerHighlight, alpha: 0.25 * alpha });
    }

    // 5. Arrow
    const arrowX = width - 24;
    const arrowY = triggerY + height / 2;
    const arrowSize = 6;

    this.arrowGraphics.moveTo(arrowX, arrowY - arrowSize / 2);
    this.arrowGraphics.lineTo(arrowX + arrowSize, arrowY - arrowSize / 2);
    this.arrowGraphics.lineTo(arrowX + arrowSize / 2, arrowY + arrowSize / 2);
    this.arrowGraphics.closePath();
    this.arrowGraphics.fill({ color: colorScheme.arrow, alpha });

    // Update text position
    this.triggerText.y = triggerY + height / 2;
  }

  private renderDropdown(): void {
    const { width, height, options, colorScheme } = this.config;
    const radius = 8;
    const itemHeight = height - 4;
    const dropdownHeight = options.length * itemHeight + 8;
    const shadowOffset = 4;

    // Clear
    this.dropdownShadow.clear();
    this.dropdownBorder.clear();
    this.dropdownBg.clear();

    // 1. Shadow
    this.dropdownShadow.roundRect(shadowOffset, shadowOffset, width, dropdownHeight, radius);
    this.dropdownShadow.fill({ color: colorScheme.dropdownShadow, alpha: 0.5 });

    // 2. Border
    this.dropdownBorder.roundRect(-1, -1, width + 2, dropdownHeight + 2, radius + 1);
    this.dropdownBorder.stroke({ color: colorScheme.dropdownBorder, width: 1 });

    // 3. Background
    this.dropdownBg.roundRect(0, 0, width, dropdownHeight, radius);
    this.dropdownBg.fill({ color: colorScheme.dropdownBg });

    // Render items
    this.dropdownItems.forEach((item, index) => {
      item.bg.clear();

      const isHovered = index === this.hoveredIndex;
      const isSelected = item.option.value === this._selectedValue;

      if (isHovered || isSelected) {
        const bgColor = isSelected ? colorScheme.itemSelected : colorScheme.itemHover;
        item.bg.roundRect(4, 2, width - 8, itemHeight - 4, 4);
        item.bg.fill({ color: bgColor });
      }
    });
  }

  private setupInteraction(): void {
    // Trigger interaction
    this.triggerContainer.eventMode = 'static';
    this.triggerContainer.cursor = this.config.disabled ? 'default' : 'pointer';

    this.triggerContainer.hitArea = {
      contains: (x: number, y: number) => {
        return x >= 0 && x <= this.config.width && y >= 0 && y <= this.config.height + 4;
      }
    };

    this.triggerContainer.on('pointerdown', this.onTriggerDown.bind(this));
    this.triggerContainer.on('pointerup', this.onTriggerUp.bind(this));
    this.triggerContainer.on('pointerupoutside', this.onTriggerUpOutside.bind(this));

    // Dropdown item interactions
    this.dropdownItems.forEach((item, index) => {
      item.container.eventMode = 'static';
      item.container.cursor = 'pointer';

      item.container.hitArea = {
        contains: (x: number, y: number) => {
          return x >= 0 && x <= this.config.width && y >= 0 && y <= this.config.height - 4;
        }
      };

      item.container.on('pointerover', () => {
        this.hoveredIndex = index;
        this.renderDropdown();
      });

      item.container.on('pointerout', () => {
        this.hoveredIndex = -1;
        this.renderDropdown();
      });

      item.container.on('pointerup', () => {
        this.selectOption(item.option);
      });
    });
  }

  private onTriggerDown(): void {
    if (this.config.disabled) return;
    this.isPressed = true;
    this.renderTrigger();
  }

  private onTriggerUp(): void {
    if (this.config.disabled) return;
    this.isPressed = false;
    this.toggleDropdown();
  }

  private onTriggerUpOutside(): void {
    if (this.config.disabled) return;
    this.isPressed = false;
    this.renderTrigger();
  }

  private toggleDropdown(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
    this.renderTrigger();
  }

  /** Bring this component to the front of its parent container */
  private bringToFront(): void {
    const parent = (this.container as any).parent;
    if (parent && parent.children) {
      const index = parent.children.indexOf(this.container);
      if (index !== -1 && index < parent.children.length - 1) {
        // Re-adding moves it to the top in Pixi.js
        parent.addChild(this.container);
      }
    }
  }

  /** Find the root/stage by traversing up the parent chain */
  private getStage(): any {
    let current: any = this.container;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  /** Check if a display object is a descendant of this component */
  private isDescendant(target: any): boolean {
    let current = target;
    while (current) {
      if (current === this.container) return true;
      current = current.parent;
    }
    return false;
  }

  /** Add global click listener to close dropdown when clicking outside */
  private addGlobalClickListener(): void {
    if (this.globalClickHandler) return;

    const stage = this.getStage();
    if (!stage) return;

    this.globalClickHandler = (event: any) => {
      // Check if click was outside this component
      if (!this.isDescendant(event.target)) {
        this.close();
      }
    };

    // Use setTimeout to avoid closing immediately from the same click that opened
    setTimeout(() => {
      if (stage.eventMode === 'none') {
        stage.eventMode = 'static';
      }
      stage.on('pointerdown', this.globalClickHandler);
    }, 0);
  }

  /** Remove global click listener */
  private removeGlobalClickListener(): void {
    if (!this.globalClickHandler) return;

    const stage = this.getStage();
    if (stage) {
      stage.off('pointerdown', this.globalClickHandler);
    }
    this.globalClickHandler = null;
  }

  private selectOption(option: GameSelectOption): void {
    this._selectedValue = option.value;
    this.triggerText.text = option.label;
    this.close();
    this.emit('change', option.value);
    this.config.onChange(option.value);
  }

  /** Open the dropdown */
  public open(): void {
    if (!this._isOpen) {
      this._isOpen = true;
      this.dropdownContainer.visible = true;
      this.bringToFront();
      this.addGlobalClickListener();
      this.emit('open');
    }
  }

  /** Close the dropdown */
  public close(): void {
    if (this._isOpen) {
      this._isOpen = false;
      this.dropdownContainer.visible = false;
      this.removeGlobalClickListener();
      this.emit('close');
    }
  }

  /** Get selected value */
  public getValue(): string {
    return this._selectedValue;
  }

  /** Set selected value */
  public setValue(value: string): void {
    const option = this.config.options.find(o => o.value === value);
    if (option && this._selectedValue !== value) {
      this._selectedValue = value;
      this.triggerText.text = option.label;
      this.renderDropdown();
      this.emit('change', value);
    }
  }

  /** Set options */
  public setOptions(options: GameSelectOption[]): void {
    // Clear existing items
    this.dropdownItems.forEach(item => {
      item.container.destroy({ children: true });
    });
    this.dropdownItems = [];

    // Update config and recreate
    this.config.options = options;
    this.createDropdownItems();
    this.render();
    this.setupInteraction();
  }

  /** Set disabled state */
  public setDisabled(disabled: boolean): void {
    this.config.disabled = disabled;
    this.triggerContainer.cursor = disabled ? 'default' : 'pointer';
    this.render();
  }

  /** Check if disabled */
  public isDisabled(): boolean {
    return this.config.disabled;
  }

  /** Check if open */
  public isOpen(): boolean {
    return this._isOpen;
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
    this.removeGlobalClickListener();
    this.dropdownItems = [];
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}

/**
 * Pre-defined select color schemes
 */
export const GameSelectColors = {
  DEFAULT: GameStyleColors.GAME_SELECT,

  GREEN: {
    ...GameStyleColors.GAME_SELECT,
    triggerBg: 0x4CAF50,
    triggerShadow: 0x388E3C,
    itemSelected: 0x4CAF50
  } as GameSelectColorScheme,

  PURPLE: {
    ...GameStyleColors.GAME_SELECT,
    triggerBg: 0x9C27B0,
    triggerShadow: 0x7B1FA2,
    itemSelected: 0x9C27B0
  } as GameSelectColorScheme,

  ORANGE: {
    ...GameStyleColors.GAME_SELECT,
    triggerBg: 0xF5B041,
    triggerShadow: 0xD68910,
    itemSelected: 0xF5B041
  } as GameSelectColorScheme
};
