import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { numberToHex } from '../themes/GameStyleUITheme';
import { getFrameworkFontFamily } from '../utils/FontLoader';

/**
 * Resource display type
 */
export type ResourceType = 'lives' | 'coins' | 'gems' | 'energy' | 'custom';

/**
 * Resource item configuration
 */
export interface ResourceItemConfig {
  type: ResourceType;
  value: number;
  max?: number; // For lives/energy with max display
  icon?: 'heart' | 'coin' | 'gem' | 'energy' | 'custom';
  iconColor?: number;
  backgroundColor?: number;
  borderColor?: number; // Custom border color
  addButtonColor?: number; // Custom add button background
  labelBackgroundColor?: number; // Custom label background
  pillWidth?: number; // Allow custom width
  showAddButton?: boolean;
  label?: string; // e.g., "MAX" label
  onClick?: () => void;
  onAddClick?: () => void;
}

/**
 * GameTopBar configuration
 */
export interface GameTopBarConfig {
  width: number;
  height?: number;
  padding?: number;
  resources?: ResourceItemConfig[];
  showSettings?: boolean;
  onSettingsClick?: () => void;
}

/**
 * GameTopBar - Game-style top bar with resource displays
 *
 * Features:
 * - Settings gear button (circular, dark background)
 * - Lives display with heart icon and MAX label
 * - Coins display with coin icon and add button
 * - Gems display with gem icon
 * - Pill-shaped containers with game styling
 * - Animated value changes
 *
 * Inspired by: Brawl Stars, Candy Crush, mobile game top bars
 *
 * @example
 * ```typescript
 * const topBar = new GameTopBar({
 *   width: 400,
 *   resources: [
 *     { type: 'lives', value: 5, max: 5, label: 'MAX' },
 *     { type: 'coins', value: 1340, showAddButton: true }
 *   ],
 *   showSettings: true,
 *   onSettingsClick: () => openSettings()
 * });
 *
 * stage.addChild(topBar.getContainer());
 * ```
 */
export class GameTopBar extends EventEmitter {
  private container: IContainer;
  private settingsButton?: IContainer;
  private resourceContainers: Map<ResourceType, IContainer> = new Map();
  private resourceTexts: Map<ResourceType, IText> = new Map();

  private config: Required<GameTopBarConfig>;

  constructor(config: GameTopBarConfig) {
    super();

    this.config = {
      width: config.width,
      height: config.height || 60,
      padding: config.padding || 15,
      resources: config.resources || [],
      showSettings: config.showSettings ?? true,
      onSettingsClick: config.onSettingsClick || (() => {}),
    };

    this.container = graphics().createContainer();

    // Create UI elements
    if (this.config.showSettings) {
      this.createSettingsButton();
    }

    this.createResourceDisplays();
  }

  /**
   * Create circular settings button
   */
  private createSettingsButton(): void {
    const buttonSize = this.config.height - 10;
    this.settingsButton = graphics().createContainer();
    this.settingsButton.x = this.config.padding;
    this.settingsButton.y = this.config.height / 2;

    // Background circle
    const bg = graphics().createGraphics();
    bg.circle(0, 0, buttonSize / 2);
    bg.fill({ color: 0x2A2A3A, alpha: 0.95 });
    bg.stroke({ color: 0x1A1A2A, width: 3 });
    this.settingsButton.addChild(bg);

    // Gear icon
    const gear = graphics().createGraphics();
    this.drawGearIcon(gear, buttonSize * 0.35);
    this.settingsButton.addChild(gear);

    // Interactivity
    this.settingsButton.eventMode = 'static';
    this.settingsButton.cursor = 'pointer';

    this.settingsButton.on('pointerdown', () => {
      this.settingsButton!.scale.x = 0.9;
      this.settingsButton!.scale.y = 0.9;
    });

    this.settingsButton.on('pointerup', () => {
      this.settingsButton!.scale.x = 1;
      this.settingsButton!.scale.y = 1;
      this.config.onSettingsClick();
      this.emit('settings-click');
    });

    this.settingsButton.on('pointerupoutside', () => {
      this.settingsButton!.scale.x = 1;
      this.settingsButton!.scale.y = 1;
    });

    this.container.addChild(this.settingsButton);
  }

  /**
   * Draw gear/cog icon
   */
  private drawGearIcon(g: IGraphics, size: number): void {
    const teeth = 8;
    const outerRadius = size;
    const innerRadius = size * 0.7;
    const centerRadius = size * 0.35;

    // Draw gear teeth
    const vertices: number[] = [];
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      vertices.push(Math.cos(angle) * r);
      vertices.push(Math.sin(angle) * r);
    }

    g.poly(vertices);
    g.fill({ color: 0xE0E0E0 });

    // Center hole
    g.circle(0, 0, centerRadius);
    g.fill({ color: 0x2A2A3A });
  }

  /**
   * Create resource displays (lives, coins, gems, etc.)
   */
  private createResourceDisplays(): void {
    const { resources, width, height, padding, showSettings } = this.config;

    // Calculate starting X position (after settings button if present)
    let startX = showSettings ? padding + height : padding;
    const spacing = 10;

    // Calculate total width needed for resources
    const resourceWidths: number[] = [];
    resources.forEach((res) => {
      const w = this.calculateResourceWidth(res);
      resourceWidths.push(w);
    });

    // Position from center-right area
    const totalResourceWidth = resourceWidths.reduce((a, b) => a + b, 0) + spacing * (resources.length - 1);
    let currentX = width - padding - totalResourceWidth;

    resources.forEach((res, index) => {
      const container = this.createResourceDisplay(res, resourceWidths[index]);
      container.x = currentX + resourceWidths[index] / 2;
      container.y = height / 2;

      this.resourceContainers.set(res.type, container);
      this.container.addChild(container);

      currentX += resourceWidths[index] + spacing;
    });
  }

  /**
   * Calculate width needed for a resource display
   */
  private calculateResourceWidth(res: ResourceItemConfig): number {
    let width = 80; // Base width for icon + value

    if (res.label) width += 40;
    if (res.showAddButton) width += 35;
    if (res.max !== undefined) width += 10;

    return width;
  }

  /**
   * Create a single resource display
   */
  private createResourceDisplay(res: ResourceItemConfig, width: number): IContainer {
    const container = graphics().createContainer();
    // Use custom pillWidth if provided
    const actualWidth = res.pillWidth || width;
    const height = this.config.height - 16;
    const halfWidth = actualWidth / 2;
    const halfHeight = height / 2;

    // Background pill shape with configurable colors
    const bg = graphics().createGraphics();
    const bgColor = res.backgroundColor || this.getDefaultBgColor(res.type);
    const borderColor = res.borderColor || this.darkenColor(bgColor, 0.3);

    // Outer shadow for depth
    bg.roundRect(-halfWidth - 1, -halfHeight + 2, actualWidth + 2, height, height / 2);
    bg.fill({ color: 0x000000, alpha: 0.3 });

    // Main pill
    bg.roundRect(-halfWidth, -halfHeight, actualWidth, height, height / 2);
    bg.fill({ color: bgColor, alpha: 0.95 });
    bg.stroke({ color: borderColor, width: 2 });

    // Inner highlight at top
    bg.roundRect(-halfWidth + 4, -halfHeight + 3, actualWidth - 8, height * 0.4, (height * 0.4) / 2);
    bg.fill({ color: 0xFFFFFF, alpha: 0.15 });
    container.addChild(bg);

    // Icon
    const iconX = -halfWidth + 20;
    const icon = this.createResourceIcon(res);
    icon.x = iconX;
    container.addChild(icon);

    // Value text
    const valueText = graphics().createText(this.formatValue(res.value), {
      fontFamily: '"Lilita One", "Arial Black", sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      stroke: { color: 0x000000, width: 2 }
    });
    if (valueText.anchor) valueText.anchor.set(0, 0.5);
    valueText.x = iconX + 25;
    container.addChild(valueText);

    this.resourceTexts.set(res.type, valueText);

    // Max label (e.g., "MAX")
    if (res.label) {
      const labelBgColor = res.labelBackgroundColor || this.darkenColor(bgColor, 0.2);
      const labelBg = graphics().createGraphics();
      labelBg.roundRect(valueText.x + valueText.width + 5, -10, 36, 20, 5);
      labelBg.fill({ color: labelBgColor });
      container.addChild(labelBg);

      const labelText = graphics().createText(res.label, {
        fontFamily: '"Lilita One", "Arial Black", sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0xFFFFFF
      });
      if (labelText.anchor) labelText.anchor.set(0.5, 0.5);
      labelText.x = valueText.x + valueText.width + 23;
      container.addChild(labelText);
    }

    // Add button (+)
    if (res.showAddButton) {
      const addBtn = this.createAddButton(res);
      addBtn.x = halfWidth - 18;
      container.addChild(addBtn);
    }

    // Click handler
    if (res.onClick) {
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointerup', res.onClick);
    }

    return container;
  }

  /**
   * Create resource icon based on type
   */
  private createResourceIcon(res: ResourceItemConfig): IContainer {
    const iconContainer = graphics().createContainer();
    const g = graphics().createGraphics();
    const size = 16;

    switch (res.icon || res.type) {
      case 'heart':
      case 'lives':
        this.drawHeartIcon(g, size, res.iconColor || 0xFF4081);
        break;

      case 'coin':
      case 'coins':
        this.drawCoinIcon(g, size, res.iconColor || 0xFFD700);
        break;

      case 'gem':
      case 'gems':
        this.drawGemIcon(g, size, res.iconColor || 0x9C27B0);
        break;

      case 'energy':
        this.drawEnergyIcon(g, size, res.iconColor || 0x00BCD4);
        break;

      default:
        this.drawCoinIcon(g, size, res.iconColor || 0xFFD700);
    }

    iconContainer.addChild(g);
    return iconContainer;
  }

  /**
   * Draw heart icon
   */
  private drawHeartIcon(g: IGraphics, size: number, color: number): void {
    // Simple heart shape using polygon approximation
    const s = size;
    const vertices: number[] = [];

    // Generate heart shape points
    for (let i = 0; i <= 32; i++) {
      const t = (i / 32) * 2 * Math.PI;
      const x = s * 0.8 * Math.sin(t) ** 3;
      const y = -s * 0.65 * (
        Math.cos(t) -
        0.35 * Math.cos(2 * t) -
        0.14 * Math.cos(3 * t) -
        0.07 * Math.cos(4 * t)
      );
      vertices.push(x, y);
    }

    g.poly(vertices);
    g.fill({ color: color });
    g.stroke({ color: this.darkenColor(color, 0.3), width: 1.5 });
  }

  /**
   * Draw coin icon
   */
  private drawCoinIcon(g: IGraphics, size: number, color: number): void {
    // Outer circle
    g.circle(0, 0, size);
    g.fill({ color: color });
    g.stroke({ color: this.darkenColor(color, 0.3), width: 2 });

    // Inner highlight
    g.circle(-size * 0.2, -size * 0.2, size * 0.3);
    g.fill({ color: 0xFFFFFF, alpha: 0.4 });
  }

  /**
   * Draw gem icon
   */
  private drawGemIcon(g: IGraphics, size: number, color: number): void {
    // Diamond shape
    const vertices = [
      0, -size,
      size * 0.7, 0,
      0, size,
      -size * 0.7, 0
    ];
    g.poly(vertices);
    g.fill({ color: color });
    g.stroke({ color: this.darkenColor(color, 0.3), width: 1.5 });

    // Highlight
    const highlightVertices = [
      0, -size * 0.7,
      size * 0.35, -size * 0.1,
      0, size * 0.2,
      -size * 0.35, -size * 0.1
    ];
    g.poly(highlightVertices);
    g.fill({ color: 0xFFFFFF, alpha: 0.3 });
  }

  /**
   * Draw energy/lightning icon
   */
  private drawEnergyIcon(g: IGraphics, size: number, color: number): void {
    const vertices = [
      size * 0.2, -size,
      -size * 0.4, size * 0.1,
      size * 0.1, size * 0.1,
      -size * 0.2, size,
      size * 0.4, -size * 0.1,
      -size * 0.1, -size * 0.1
    ];
    g.poly(vertices);
    g.fill({ color: color });
    g.stroke({ color: this.darkenColor(color, 0.3), width: 1 });
  }

  /**
   * Create add/plus button
   */
  private createAddButton(res: ResourceItemConfig): IContainer {
    const container = graphics().createContainer();
    const size = 28;
    const addBtnColor = res.addButtonColor || 0x4CAF50;

    // Background
    const bg = graphics().createGraphics();
    bg.roundRect(-size / 2, -size / 2, size, size, 6);
    bg.fill({ color: addBtnColor });
    bg.stroke({ color: this.darkenColor(addBtnColor, 0.3), width: 2 });
    container.addChild(bg);

    // Plus sign
    const plus = graphics().createText('+', {
      fontFamily: getFrameworkFontFamily(),
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xFFFFFF
    });
    if (plus.anchor) plus.anchor.set(0.5, 0.5);
    container.addChild(plus);

    // Interactivity
    container.eventMode = 'static';
    container.cursor = 'pointer';

    container.on('pointerdown', () => {
      container.scale.x = 0.9;
      container.scale.y = 0.9;
    });

    container.on('pointerup', () => {
      container.scale.x = 1;
      container.scale.y = 1;
      if (res.onAddClick) {
        res.onAddClick();
      }
      this.emit('add-click', res.type);
    });

    container.on('pointerupoutside', () => {
      container.scale.x = 1;
      container.scale.y = 1;
    });

    return container;
  }

  /**
   * Get default background color for resource type
   */
  private getDefaultBgColor(type: ResourceType): number {
    switch (type) {
      case 'lives':
        return 0x1A1A2A; // Dark/black
      case 'coins':
        return 0x4CAF50; // Green
      case 'gems':
        return 0x7B1FA2; // Purple
      case 'energy':
        return 0x0288D1; // Blue
      default:
        return 0x2C3E50;
    }
  }

  /**
   * Darken a color
   */
  private darkenColor(color: number, amount: number): number {
    const r = Math.max(0, ((color >> 16) & 0xFF) - Math.floor(255 * amount));
    const g = Math.max(0, ((color >> 8) & 0xFF) - Math.floor(255 * amount));
    const b = Math.max(0, (color & 0xFF) - Math.floor(255 * amount));
    return (r << 16) | (g << 8) | b;
  }

  /**
   * Format value with abbreviation for large numbers
   */
  private formatValue(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  /**
   * Public API
   */

  public updateResource(type: ResourceType, value: number, animate: boolean = true): this {
    const text = this.resourceTexts.get(type);
    if (text) {
      const oldValue = parseInt(text.text.replace(/[KM]/g, '')) || 0;
      text.text = this.formatValue(value);

      if (animate && value !== oldValue) {
        // Pop animation
        const container = this.resourceContainers.get(type);
        if (container) {
          container.scale.x = 1.15;
          container.scale.y = 1.15;
          setTimeout(() => {
            container.scale.x = 1;
            container.scale.y = 1;
          }, 150);
        }
      }
    }

    this.emit('resource-updated', type, value);
    return this;
  }

  public setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  public getContainer(): IContainer {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.resourceContainers.clear();
    this.resourceTexts.clear();
    this.removeAllListeners();
  }
}
