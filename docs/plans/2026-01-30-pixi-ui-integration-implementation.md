# @pixi/ui Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate @pixi/ui library with game-styled wrappers (GameInput, GameScrollBox, GameSelect, GameList, GameCheckBox, GameRadioGroup) using the jellybean visual style.

**Architecture:** Composition-based wrappers where each GameByte component wraps a @pixi/ui component internally. GameByte handles all visual rendering (borders, highlights, shadows) while @pixi/ui handles functionality (text input, scrolling, dropdowns).

**Tech Stack:** TypeScript, @pixi/ui v2.x, Pixi.js v8, EventEmitter3

---

## Task 1: Add @pixi/ui Dependency

**Files:**
- Modify: `package.json`

**Step 1: Add the dependency**

```bash
npm install @pixi/ui@^2.0.0
```

**Step 2: Verify installation**

Run: `npm ls @pixi/ui`
Expected: Shows `@pixi/ui@2.x.x`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @pixi/ui dependency for UI components"
```

---

## Task 2: Add Color Schemes to GameStyleUITheme

**Files:**
- Modify: `src/ui/themes/GameStyleUITheme.ts`

**Step 1: Add color scheme interfaces and constants**

Add after line 365 (after `BOTTOM_NAV` color scheme), before the utility functions:

```typescript
  // ═══════════════════════════════════════════════════════════════
  // @pixi/ui Wrapper Component Colors (Jellybean Style)
  // ═══════════════════════════════════════════════════════════════

  // Input field colors
  GAME_INPUT: {
    background: 0x2A3A4A,
    backgroundFocus: 0x3A4A5A,
    border: 0x000000,
    borderInner: 0x1A2A3A,
    shadow: 0x1A2530,
    text: 0xFFFFFF,
    placeholder: 0x8A9AAA,
    cursor: 0xFFFFFF,
    selection: 0x4DA6FF,
    highlight: 0xFFFFFF
  },

  // ScrollBox colors
  GAME_SCROLLBOX: {
    background: 0x2A3A4A,
    border: 0x000000,
    borderInner: 0x1A2A3A,
    shadow: 0x1A2530,
    scrollbarTrack: 0x1A2A3A,
    scrollbarThumb: 0x5A6A7A,
    scrollbarThumbHover: 0x7A8A9A,
    highlight: 0xFFFFFF
  },

  // Select/Dropdown colors
  GAME_SELECT: {
    triggerBg: 0x4DA6FF,
    triggerBorder: 0x000000,
    triggerShadow: 0x2E7BC9,
    triggerHighlight: 0xFFFFFF,
    dropdownBg: 0x2A3A4A,
    dropdownBorder: 0x000000,
    dropdownShadow: 0x1A2530,
    itemHover: 0x3A4A5A,
    itemSelected: 0x4DA6FF,
    text: 0xFFFFFF,
    arrow: 0xFFFFFF
  },

  // CheckBox colors
  GAME_CHECKBOX: {
    boxBg: 0x2A3A4A,
    boxBorder: 0x000000,
    boxShadow: 0x1A2530,
    boxChecked: 0x4DA6FF,
    checkmark: 0xFFFFFF,
    highlight: 0xFFFFFF,
    text: 0xFFFFFF
  },

  // RadioGroup colors
  GAME_RADIO: {
    circleBg: 0x2A3A4A,
    circleBorder: 0x000000,
    circleShadow: 0x1A2530,
    circleSelected: 0x4DA6FF,
    dot: 0xFFFFFF,
    highlight: 0xFFFFFF,
    text: 0xFFFFFF
  },

  // List colors (minimal - mostly container)
  GAME_LIST: {
    background: 0x2A3A4A,
    border: 0x000000,
    divider: 0x3A4A5A
  }
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/ui/themes/GameStyleUITheme.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/themes/GameStyleUITheme.ts
git commit -m "feat(ui): add color schemes for @pixi/ui wrapper components"
```

---

## Task 3: Implement GameCheckBox

**Files:**
- Create: `src/ui/components/GameCheckBox.ts`

**Step 1: Create the GameCheckBox component**

```typescript
import { EventEmitter } from 'eventemitter3';
import { CheckBox } from '@pixi/ui';
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
    const borderWidth = 3;
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
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/ui/components/GameCheckBox.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/components/GameCheckBox.ts
git commit -m "feat(ui): add GameCheckBox component with jellybean styling"
```

---

## Task 4: Implement GameRadioGroup

**Files:**
- Create: `src/ui/components/GameRadioGroup.ts`

**Step 1: Create the GameRadioGroup component**

```typescript
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
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/ui/components/GameRadioGroup.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/components/GameRadioGroup.ts
git commit -m "feat(ui): add GameRadioGroup component with jellybean styling"
```

---

## Task 5: Implement GameList

**Files:**
- Create: `src/ui/components/GameList.ts`

**Step 1: Create the GameList component**

```typescript
import { EventEmitter } from 'eventemitter3';
import { List } from '@pixi/ui';
import { IContainer, IGraphics } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors } from '../themes/GameStyleUITheme';

/**
 * GameList configuration
 */
export interface GameListConfig {
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  padding?: number;
}

/**
 * Game-style list component for arranging children
 *
 * Features:
 * - Automatic layout with configurable gap
 * - Vertical or horizontal arrangement
 * - Dynamic add/remove items
 *
 * @example
 * ```typescript
 * const menu = new GameList({ direction: 'vertical', gap: 12 });
 * menu.addItem(button1.getContainer());
 * menu.addItem(button2.getContainer());
 * menu.addItem(button3.getContainer());
 * stage.addChild(menu.getContainer());
 * ```
 */
export class GameList extends EventEmitter {
  private container: IContainer;
  private pixiList: List;
  private items: IContainer[] = [];

  private config: Required<GameListConfig>;

  constructor(config: GameListConfig = {}) {
    super();

    this.config = {
      direction: config.direction || 'vertical',
      gap: config.gap || 8,
      padding: config.padding || 0
    };

    // Create our wrapper container
    this.container = graphics().createContainer();

    // Create @pixi/ui List for layout logic
    this.pixiList = new List({
      type: this.config.direction,
      elementsMargin: this.config.gap,
      padding: this.config.padding
    });

    // Add pixi list to our container
    this.container.addChild(this.pixiList as any);
  }

  /** Add an item to the list */
  public addItem(item: IContainer): void {
    this.items.push(item);
    this.pixiList.addChild(item as any);
    this.emit('itemAdded', item);
  }

  /** Remove an item from the list */
  public removeItem(item: IContainer): void {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.pixiList.removeChild(item as any);
      this.emit('itemRemoved', item);
    }
  }

  /** Get all items */
  public getItems(): IContainer[] {
    return [...this.items];
  }

  /** Clear all items */
  public clear(): void {
    this.items.forEach(item => {
      this.pixiList.removeChild(item as any);
    });
    this.items = [];
    this.emit('cleared');
  }

  /** Get item count */
  public getItemCount(): number {
    return this.items.length;
  }

  /** Set gap between items */
  public setGap(gap: number): void {
    this.config.gap = gap;
    this.pixiList.elementsMargin = gap;
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
    this.clear();
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/ui/components/GameList.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/components/GameList.ts
git commit -m "feat(ui): add GameList component wrapping @pixi/ui List"
```

---

## Task 6: Implement GameInput

**Files:**
- Create: `src/ui/components/GameInput.ts`

**Step 1: Create the GameInput component**

```typescript
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

    this.pixiInput = new Input({
      bg: undefined, // We draw our own background
      textStyle: {
        fontFamily: getFrameworkFontFamily(),
        fontSize: fontSize,
        fill: colorScheme.text
      },
      placeholder: placeholder,
      value: value,
      maxLength: maxLength,
      padding: [0, padding],
      align: 'left'
    });

    // Position inside our styled frame
    this.pixiInput.x = padding;
    this.pixiInput.y = (height - fontSize) / 2;
    this.pixiInput.width = width - padding * 2;

    // Forward events
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

    // Track focus state
    const originalOnFocus = this.pixiInput['onFocus'];
    const originalOnBlur = this.pixiInput['onBlur'];

    if (originalOnFocus) {
      this.pixiInput['onFocus'] = () => {
        this.isFocused = true;
        this.render();
        this.emit('focus');
        originalOnFocus.call(this.pixiInput);
      };
    }

    if (originalOnBlur) {
      this.pixiInput['onBlur'] = () => {
        this.isFocused = false;
        this.render();
        this.emit('blur');
        originalOnBlur.call(this.pixiInput);
      };
    }

    this.container.addChild(this.pixiInput as any);
  }

  private render(): void {
    const { width, height, colorScheme, disabled } = this.config;
    const radius = 8;
    const borderWidth = 3;
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
    this.pixiInput.placeholder = placeholder;
  }

  /** Set disabled state */
  public setDisabled(disabled: boolean): void {
    this.config.disabled = disabled;
    this.pixiInput.disabled = disabled;
    this.render();
  }

  /** Check if disabled */
  public isDisabled(): boolean {
    return this.config.disabled;
  }

  /** Focus the input */
  public focus(): void {
    // Note: @pixi/ui Input doesn't expose focus() directly
    // This would need DOM interaction in practice
  }

  /** Blur the input */
  public blur(): void {
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
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/ui/components/GameInput.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/components/GameInput.ts
git commit -m "feat(ui): add GameInput component wrapping @pixi/ui Input"
```

---

## Task 7: Implement GameScrollBox

**Files:**
- Create: `src/ui/components/GameScrollBox.ts`

**Step 1: Create the GameScrollBox component**

```typescript
import { EventEmitter } from 'eventemitter3';
import { ScrollBox } from '@pixi/ui';
import { IContainer, IGraphics } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors } from '../themes/GameStyleUITheme';

/**
 * Color scheme for game-style scrollbox
 */
export interface GameScrollBoxColorScheme {
  background: number;
  border: number;
  borderInner: number;
  shadow: number;
  scrollbarTrack: number;
  scrollbarThumb: number;
  scrollbarThumbHover: number;
  highlight: number;
}

/**
 * GameScrollBox configuration
 */
export interface GameScrollBoxConfig {
  width?: number;
  height?: number;
  padding?: number;
  scrollDirection?: 'vertical' | 'horizontal' | 'both';
  colorScheme?: GameScrollBoxColorScheme;
  showScrollbar?: boolean;
}

/**
 * Game-style scrollable container with jellybean styling
 *
 * Features:
 * - Black outer border with inner shadow
 * - Custom styled scrollbar
 * - Smooth scroll behavior
 * - Content masking
 *
 * @example
 * ```typescript
 * const scrollBox = new GameScrollBox({ width: 300, height: 400 });
 * scrollBox.addItem(item1);
 * scrollBox.addItem(item2);
 * scrollBox.addItem(item3);
 * stage.addChild(scrollBox.getContainer());
 * ```
 */
export class GameScrollBox extends EventEmitter {
  private container: IContainer;
  private shadowGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private backgroundGraphics: IGraphics;
  private pixiScrollBox: ScrollBox;
  private items: IContainer[] = [];

  private config: Required<GameScrollBoxConfig>;

  constructor(config: GameScrollBoxConfig = {}) {
    super();

    this.config = {
      width: config.width || 300,
      height: config.height || 200,
      padding: config.padding || 8,
      scrollDirection: config.scrollDirection || 'vertical',
      colorScheme: config.colorScheme || GameStyleColors.GAME_SCROLLBOX,
      showScrollbar: config.showScrollbar !== false
    };

    const factory = graphics();

    // Create container and graphics
    this.container = factory.createContainer();
    this.shadowGraphics = factory.createGraphics();
    this.borderGraphics = factory.createGraphics();
    this.backgroundGraphics = factory.createGraphics();

    // Build hierarchy
    this.container.addChild(this.shadowGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.backgroundGraphics);

    // Create @pixi/ui ScrollBox
    this.createPixiScrollBox();

    // Initial render
    this.render();
  }

  private createPixiScrollBox(): void {
    const { width, height, padding, scrollDirection, colorScheme, showScrollbar } = this.config;
    const borderWidth = 3;
    const contentWidth = width - borderWidth * 2 - padding * 2;
    const contentHeight = height - borderWidth * 2 - padding * 2;

    this.pixiScrollBox = new ScrollBox({
      width: contentWidth,
      height: contentHeight,
      type: scrollDirection === 'both' ? undefined : scrollDirection,
      padding: padding,
      globalScroll: true,
      shiftScroll: scrollDirection === 'horizontal',
      disableEasing: false,
      dragTrashHold: 10
    });

    // Position inside our styled frame
    this.pixiScrollBox.x = borderWidth + padding;
    this.pixiScrollBox.y = borderWidth + padding;

    // Forward scroll events
    this.pixiScrollBox.onScroll.connect((scrollY: number) => {
      this.emit('scroll', { y: scrollY, x: 0 });
    });

    this.container.addChild(this.pixiScrollBox as any);
  }

  private render(): void {
    const { width, height, colorScheme } = this.config;
    const radius = 8;
    const shadowOffset = 3;

    // Clear all
    this.shadowGraphics.clear();
    this.borderGraphics.clear();
    this.backgroundGraphics.clear();

    // 1. Inner shadow (inset effect)
    this.shadowGraphics.roundRect(shadowOffset, shadowOffset, width, height, radius);
    this.shadowGraphics.fill({ color: colorScheme.shadow, alpha: 0.5 });

    // 2. Black border
    this.borderGraphics.roundRect(-1, -1, width + 2, height + 2, radius + 1);
    this.borderGraphics.stroke({ color: colorScheme.border, width: 1 });

    // 3. Background
    this.backgroundGraphics.roundRect(0, 0, width, height, radius);
    this.backgroundGraphics.fill({ color: colorScheme.background });

    // 4. Inner border
    this.backgroundGraphics.roundRect(1, 1, width - 2, height - 2, radius - 1);
    this.backgroundGraphics.stroke({ color: colorScheme.borderInner, width: 1, alpha: 0.5 });
  }

  /** Add an item to the scroll box */
  public addItem(item: IContainer): void {
    this.items.push(item);
    this.pixiScrollBox.addItem(item as any);
    this.emit('itemAdded', item);
  }

  /** Remove an item from the scroll box */
  public removeItem(item: IContainer): void {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.pixiScrollBox.removeItem(item as any);
      this.emit('itemRemoved', item);
    }
  }

  /** Get all items */
  public getItems(): IContainer[] {
    return [...this.items];
  }

  /** Scroll to a specific position */
  public scrollTo(position: number): void {
    this.pixiScrollBox.scrollTop = position;
  }

  /** Scroll to an item */
  public scrollToItem(index: number): void {
    const item = this.items[index];
    if (item) {
      this.pixiScrollBox.scrollToItem(index);
    }
  }

  /** Get current scroll position */
  public getScrollPosition(): number {
    return this.pixiScrollBox.scrollTop;
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
    this.items = [];
    this.pixiScrollBox.destroy();
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}

/**
 * Pre-defined scrollbox color schemes
 */
export const GameScrollBoxColors = {
  DEFAULT: GameStyleColors.GAME_SCROLLBOX,

  DARK: {
    ...GameStyleColors.GAME_SCROLLBOX,
    background: 0x1A2530,
    scrollbarTrack: 0x0A1520
  } as GameScrollBoxColorScheme,

  LIGHT: {
    ...GameStyleColors.GAME_SCROLLBOX,
    background: 0x4A5A6A,
    scrollbarTrack: 0x3A4A5A
  } as GameScrollBoxColorScheme
};
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/ui/components/GameScrollBox.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/components/GameScrollBox.ts
git commit -m "feat(ui): add GameScrollBox component wrapping @pixi/ui ScrollBox"
```

---

## Task 8: Implement GameSelect

**Files:**
- Create: `src/ui/components/GameSelect.ts`

**Step 1: Create the GameSelect component**

```typescript
import { EventEmitter } from 'eventemitter3';
import { Select } from '@pixi/ui';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors } from '../themes/GameStyleUITheme';
import { getFrameworkFontFamily, loadFrameworkFont } from '../utils/FontLoader';

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
    this._isOpen = !this._isOpen;
    this.dropdownContainer.visible = this._isOpen;
    this.renderTrigger();
    this.emit(this._isOpen ? 'open' : 'close');
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
      this.emit('open');
    }
  }

  /** Close the dropdown */
  public close(): void {
    if (this._isOpen) {
      this._isOpen = false;
      this.dropdownContainer.visible = false;
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
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/ui/components/GameSelect.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/ui/components/GameSelect.ts
git commit -m "feat(ui): add GameSelect dropdown component with jellybean styling"
```

---

## Task 9: Add Exports to src/index.ts

**Files:**
- Modify: `src/index.ts`

**Step 1: Add new component exports**

Add after line 401 (after GameTooltip exports):

```typescript
// @pixi/ui Wrapper Components (Game-styled)
export { GameCheckBox, GameCheckBoxColors } from './ui/components/GameCheckBox';
export type { GameCheckBoxConfig, GameCheckBoxColorScheme } from './ui/components/GameCheckBox';

export { GameRadioGroup, GameRadioColors } from './ui/components/GameRadioGroup';
export type { GameRadioGroupConfig, GameRadioColorScheme, GameRadioOption } from './ui/components/GameRadioGroup';

export { GameList } from './ui/components/GameList';
export type { GameListConfig } from './ui/components/GameList';

export { GameInput, GameInputColors } from './ui/components/GameInput';
export type { GameInputConfig, GameInputColorScheme } from './ui/components/GameInput';

export { GameScrollBox, GameScrollBoxColors } from './ui/components/GameScrollBox';
export type { GameScrollBoxConfig, GameScrollBoxColorScheme } from './ui/components/GameScrollBox';

export { GameSelect, GameSelectColors } from './ui/components/GameSelect';
export type { GameSelectConfig, GameSelectColorScheme, GameSelectOption } from './ui/components/GameSelect';

// Raw @pixi/ui re-export for advanced users
export * as PixiUI from '@pixi/ui';
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/index.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat(ui): export @pixi/ui wrapper components from main index"
```

---

## Task 10: Create Demo Page

**Files:**
- Create: `docs-site/static/demos/pixi-ui-components-demo.html`

**Step 1: Create the demo HTML file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GameByte - @pixi/ui Components Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    h1 {
      color: #fff;
      margin-bottom: 10px;
      font-size: 24px;
    }
    p {
      color: #8892b0;
      margin-bottom: 20px;
      font-size: 14px;
    }
    #game-container {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    }
    canvas { display: block; }
    .info {
      color: #8892b0;
      margin-top: 20px;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>@pixi/ui Wrapper Components</h1>
  <p>Game-styled UI components wrapping @pixi/ui library</p>
  <div id="game-container"></div>
  <div class="info">
    Components: GameInput, GameCheckBox, GameRadioGroup, GameSelect, GameScrollBox, GameList
  </div>

  <script type="module">
    import {
      createGame,
      GameCheckBox,
      GameRadioGroup,
      GameInput,
      GameSelect,
      GameList,
      GameStyleButton,
      GameStyleColors,
      loadFrameworkFont
    } from '../gamebyte.esm.js';

    async function init() {
      // Load font first
      await loadFrameworkFont();

      // Create game
      const game = await createGame({
        container: '#game-container',
        width: 500,
        height: 600,
        mode: '2d',
        backgroundColor: 0x1a1a2e,
        autoStart: true
      });

      const stage = game.stage;
      let yOffset = 30;

      // Title
      const factory = game.graphics();
      const title = factory.createText('@pixi/ui Components', {
        fontFamily: 'Lilita One, Arial Black, sans-serif',
        fontSize: 28,
        fill: 0xFFFFFF
      });
      title.x = 250;
      title.y = yOffset;
      if (title.anchor) title.anchor.set(0.5, 0);
      stage.addChild(title);
      yOffset += 60;

      // GameInput
      const inputLabel = factory.createText('GameInput:', {
        fontSize: 16,
        fill: 0x8892b0
      });
      inputLabel.x = 30;
      inputLabel.y = yOffset;
      stage.addChild(inputLabel);
      yOffset += 30;

      const input = new GameInput({
        width: 300,
        placeholder: 'Enter your name...',
        onChange: (value) => console.log('Input:', value)
      });
      input.setPosition(30, yOffset);
      stage.addChild(input.getContainer());
      yOffset += 70;

      // GameCheckBox
      const checkLabel = factory.createText('GameCheckBox:', {
        fontSize: 16,
        fill: 0x8892b0
      });
      checkLabel.x = 30;
      checkLabel.y = yOffset;
      stage.addChild(checkLabel);
      yOffset += 30;

      const checkbox1 = new GameCheckBox({
        label: 'Enable Sound',
        checked: true,
        onChange: (checked) => console.log('Sound:', checked)
      });
      checkbox1.setPosition(30, yOffset);
      stage.addChild(checkbox1.getContainer());

      const checkbox2 = new GameCheckBox({
        label: 'Enable Music',
        checked: false,
        onChange: (checked) => console.log('Music:', checked)
      });
      checkbox2.setPosition(250, yOffset);
      stage.addChild(checkbox2.getContainer());
      yOffset += 60;

      // GameRadioGroup
      const radioLabel = factory.createText('GameRadioGroup:', {
        fontSize: 16,
        fill: 0x8892b0
      });
      radioLabel.x = 30;
      radioLabel.y = yOffset;
      stage.addChild(radioLabel);
      yOffset += 30;

      const radioGroup = new GameRadioGroup({
        options: [
          { label: 'Easy', value: 'easy' },
          { label: 'Medium', value: 'medium' },
          { label: 'Hard', value: 'hard' }
        ],
        selectedValue: 'medium',
        direction: 'horizontal',
        gap: 20,
        onChange: (value) => console.log('Difficulty:', value)
      });
      radioGroup.setPosition(30, yOffset);
      stage.addChild(radioGroup.getContainer());
      yOffset += 60;

      // GameSelect
      const selectLabel = factory.createText('GameSelect:', {
        fontSize: 16,
        fill: 0x8892b0
      });
      selectLabel.x = 30;
      selectLabel.y = yOffset;
      stage.addChild(selectLabel);
      yOffset += 30;

      const select = new GameSelect({
        width: 200,
        placeholder: 'Select Level',
        options: [
          { label: 'Level 1 - Tutorial', value: '1' },
          { label: 'Level 2 - Forest', value: '2' },
          { label: 'Level 3 - Castle', value: '3' },
          { label: 'Level 4 - Boss', value: '4' }
        ],
        onChange: (value) => console.log('Level:', value)
      });
      select.setPosition(30, yOffset);
      stage.addChild(select.getContainer());
      yOffset += 80;

      // GameList with buttons
      const listLabel = factory.createText('GameList:', {
        fontSize: 16,
        fill: 0x8892b0
      });
      listLabel.x = 30;
      listLabel.y = yOffset;
      stage.addChild(listLabel);
      yOffset += 30;

      const list = new GameList({
        direction: 'horizontal',
        gap: 12
      });
      list.setPosition(30, yOffset);

      const btn1 = new GameStyleButton({
        text: 'Play',
        width: 100,
        height: 44,
        colorScheme: GameStyleColors.GREEN_BUTTON
      });
      const btn2 = new GameStyleButton({
        text: 'Shop',
        width: 100,
        height: 44,
        colorScheme: GameStyleColors.BLUE_BUTTON
      });
      const btn3 = new GameStyleButton({
        text: 'Settings',
        width: 100,
        height: 44,
        colorScheme: GameStyleColors.PURPLE_BUTTON
      });

      list.addItem(btn1.getContainer());
      list.addItem(btn2.getContainer());
      list.addItem(btn3.getContainer());
      stage.addChild(list.getContainer());

      console.log('Demo initialized!');
    }

    init().catch(console.error);
  </script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add docs-site/static/demos/pixi-ui-components-demo.html
git commit -m "docs: add @pixi/ui components demo page"
```

---

## Task 11: Build and Verify

**Step 1: Run full build**

Run: `npm run build`
Expected: Build completes without errors

**Step 2: Run tests**

Run: `npm test`
Expected: All existing tests pass

**Step 3: Verify demo works**

Run: `npx http-server -p 8080`
Navigate to: `http://localhost:8080/docs-site/static/demos/pixi-ui-components-demo.html`
Expected: Demo loads, all components render with jellybean styling

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(ui): complete @pixi/ui integration with game-styled wrappers

- Add @pixi/ui v2 dependency
- Add color schemes for Input, ScrollBox, Select, CheckBox, RadioGroup, List
- Implement GameCheckBox with jellybean styling
- Implement GameRadioGroup with jellybean styling
- Implement GameList wrapping @pixi/ui List
- Implement GameInput wrapping @pixi/ui Input
- Implement GameScrollBox wrapping @pixi/ui ScrollBox
- Implement GameSelect with custom jellybean trigger and dropdown
- Export all new components from main index
- Re-export raw @pixi/ui as PixiUI for advanced users
- Add demo page showcasing all components"
```

---

## Summary

| Task | Component | Status |
|------|-----------|--------|
| 1 | Add @pixi/ui dependency | Pending |
| 2 | Add color schemes | Pending |
| 3 | GameCheckBox | Pending |
| 4 | GameRadioGroup | Pending |
| 5 | GameList | Pending |
| 6 | GameInput | Pending |
| 7 | GameScrollBox | Pending |
| 8 | GameSelect | Pending |
| 9 | Add exports | Pending |
| 10 | Create demo | Pending |
| 11 | Build & verify | Pending |
