/**
 * ItemCard — Compact inventory grid cell
 *
 * A small, square card for displaying items in inventory grids,
 * shop displays, or collection screens. Features level badge,
 * quantity indicator, and equipped state.
 *
 * @example
 * ```typescript
 * const item = new ItemCard({
 *   iconText: '\u2694\ufe0f',
 *   level: 5,
 *   quantity: 3,
 *   rarity: 'rare',
 *   equipped: true,
 *   size: 'medium'
 * });
 * stage.addChild(item.getContainer());
 * ```
 */

import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics } from '../../../contracts/Graphics.js';
import { graphics } from '../../../graphics/GraphicsEngine.js';
import { Gradients } from '../../../graphics/GradientFactory.js';
import { getFrameworkFontFamily, loadFrameworkFont } from '../../utils/FontLoader.js';
import {
  CardRarity,
  CardStyle,
  CardColorScheme,
  CardRarityColors,
  getDefaultCardColors
} from './CardColors.js';

export type ItemCardSize = 'small' | 'medium' | 'large';

const ITEM_SIZES: Record<ItemCardSize, number> = {
  small: 64,
  medium: 80,
  large: 96
};

export interface ItemCardConfig {
  iconText?: string;
  level?: number;
  quantity?: number;
  equipped?: boolean;
  rarity?: CardRarity;
  style?: CardStyle;
  size?: ItemCardSize;
  colorScheme?: CardColorScheme;
  selected?: boolean;
}

export class ItemCard extends EventEmitter {
  private container: IContainer;
  private backgroundGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private glowGraphics: IGraphics;
  private equippedGraphics: IGraphics;
  private selectedGraphics: IGraphics;

  private config: Required<ItemCardConfig>;
  private colors: CardColorScheme;
  private cardSize: number;

  constructor(config: ItemCardConfig = {}) {
    super();
    loadFrameworkFont();

    this.config = {
      iconText: config.iconText ?? '\u2b50',
      level: config.level ?? 0,
      quantity: config.quantity ?? 1,
      equipped: config.equipped ?? false,
      rarity: config.rarity ?? 'common',
      style: config.style ?? 'game',
      size: config.size ?? 'medium',
      colorScheme: config.colorScheme ?? getDefaultCardColors(config.style ?? 'game'),
      selected: config.selected ?? false
    };

    this.colors = this.config.colorScheme;
    this.cardSize = ITEM_SIZES[this.config.size];

    const factory = graphics();
    this.container = factory.createContainer();
    this.glowGraphics = factory.createGraphics();
    this.backgroundGraphics = factory.createGraphics();
    this.borderGraphics = factory.createGraphics();
    this.equippedGraphics = factory.createGraphics();
    this.selectedGraphics = factory.createGraphics();

    this.container.addChild(this.glowGraphics);
    this.container.addChild(this.backgroundGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.equippedGraphics);
    this.container.addChild(this.selectedGraphics);

    this.render();
    this.setupInteractivity();
  }

  private setupInteractivity(): void {
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.on('pointerdown', () => this.emit('press'));
    this.container.on('pointerup', () => this.emit('click'));
  }

  private render(): void {
    const { style, rarity, iconText, level, quantity, equipped, selected } = this.config;
    const size = this.cardSize;
    const rarityColors = CardRarityColors[rarity];
    const isGame = style === 'game';
    const borderRadius = isGame ? 10 : 8;

    // Clear
    this.glowGraphics.clear();
    this.backgroundGraphics.clear();
    this.borderGraphics.clear();
    this.equippedGraphics.clear();
    this.selectedGraphics.clear();

    // Remove dynamic text children (keep graphics layers)
    const graphicsLayers: Set<unknown> = new Set([
      this.glowGraphics, this.backgroundGraphics, this.borderGraphics,
      this.equippedGraphics, this.selectedGraphics
    ]);
    const children = this.container.children;
    for (let i = children.length - 1; i >= 0; i--) {
      if (!graphicsLayers.has(children[i])) {
        this.container.removeChild(children[i]);
      }
    }

    // Glow
    if (rarityColors.glowAlpha > 0) {
      const gs = isGame ? 4 : 2;
      this.glowGraphics.roundRect(-gs, -gs, size + gs * 2, size + gs * 2, borderRadius + gs);
      this.glowGraphics.fill({ color: rarityColors.glow, alpha: rarityColors.glowAlpha });
    }

    // Background
    if (isGame) {
      const bgGrad = Gradients.linear.vertical(this.colors.background, this.colors.backgroundBottom);
      this.backgroundGraphics.roundRect(0, 0, size, size, borderRadius);
      this.backgroundGraphics.fill(bgGrad);
    } else {
      this.backgroundGraphics.roundRect(0, 0, size, size, borderRadius);
      this.backgroundGraphics.fill({ color: this.colors.background });
    }

    // Border
    const borderColor = rarity !== 'common' ? rarityColors.border : this.colors.border;
    this.borderGraphics.roundRect(0, 0, size, size, borderRadius);
    this.borderGraphics.stroke({ color: borderColor, width: this.colors.borderWidth });

    // Selected highlight
    if (selected) {
      this.selectedGraphics.roundRect(0, 0, size, size, borderRadius);
      this.selectedGraphics.stroke({ color: 0xFFFFFF, width: 2 });
    }

    // Equipped indicator (corner triangle)
    if (equipped) {
      const eqSize = size * 0.25;
      this.equippedGraphics.moveTo(0, 0);
      this.equippedGraphics.lineTo(eqSize, 0);
      this.equippedGraphics.lineTo(0, eqSize);
      this.equippedGraphics.closePath();
      this.equippedGraphics.fill({ color: 0x4CAF50 });

      const eqText = graphics().createText('E', {
        fontFamily: isGame ? getFrameworkFontFamily() : 'Arial',
        fontSize: Math.max(8, eqSize * 0.5),
        fontWeight: '700',
        fill: 0xFFFFFF
      });
      eqText.x = 2;
      eqText.y = 1;
      this.container.addChild(eqText);
    }

    // Icon (centered)
    const iconFontSize = isGame ? size * 0.4 : size * 0.35;
    const icon = graphics().createText(iconText, {
      fontFamily: 'Arial',
      fontSize: iconFontSize
    });
    if (icon.anchor) icon.anchor.set(0.5, 0.5);
    icon.x = size / 2;
    icon.y = size * 0.42;
    this.container.addChild(icon);

    // Level badge (top-right)
    if (level > 0) {
      const badgeW = isGame ? 24 : 20;
      const badgeH = isGame ? 16 : 14;
      const badgeBg = graphics().createGraphics();
      badgeBg.roundRect(size - badgeW - 3, 3, badgeW, badgeH, 4);
      badgeBg.fill({ color: rarityColors.badge });
      this.container.addChild(badgeBg);

      const lvlText = graphics().createText(`Lv${level}`, {
        fontFamily: isGame ? getFrameworkFontFamily() : 'Arial',
        fontSize: isGame ? 9 : 8,
        fontWeight: '700',
        fill: 0xFFFFFF
      });
      if (lvlText.anchor) lvlText.anchor.set(0.5, 0.5);
      lvlText.x = size - badgeW / 2 - 3;
      lvlText.y = 3 + badgeH / 2;
      this.container.addChild(lvlText);
    }

    // Quantity badge (bottom-right)
    if (quantity > 1) {
      const qtyStr = `x${quantity}`;
      const qtyText = graphics().createText(qtyStr, {
        fontFamily: isGame ? getFrameworkFontFamily() : 'Arial',
        fontSize: isGame ? 11 : 10,
        fontWeight: '700',
        fill: this.colors.bodyText,
        ...(isGame ? {
          stroke: { color: 0x000000, width: 1 }
        } : {})
      });
      if (qtyText.anchor) qtyText.anchor.set(1, 1);
      qtyText.x = size - 5;
      qtyText.y = size - 4;
      this.container.addChild(qtyText);
    }
  }

  public setSelected(selected: boolean): this {
    this.config.selected = selected;
    this.render();
    return this;
  }

  public setEquipped(equipped: boolean): this {
    this.config.equipped = equipped;
    this.render();
    return this;
  }

  public setRarity(rarity: CardRarity): this {
    this.config.rarity = rarity;
    this.render();
    return this;
  }

  public getContainer(): IContainer {
    return this.container;
  }

  public setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  public getSize(): number {
    return this.cardSize;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
