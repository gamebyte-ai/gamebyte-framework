/**
 * CharacterCard — RPG/gacha character display card
 *
 * Shows a character with star rating, avatar area, name, and stat bars.
 * Supports both vibrant game style and clean flat style.
 *
 * @example
 * ```typescript
 * const hero = new CharacterCard({
 *   name: 'Dark Knight',
 *   stars: 4,
 *   maxStars: 5,
 *   rarity: 'epic',
 *   stats: [
 *     { label: 'HP', value: 85, maxValue: 100, colors: StatColors.HP },
 *     { label: 'ATK', value: 120, maxValue: 150, colors: StatColors.ATK }
 *   ]
 * });
 * stage.addChild(hero.getContainer());
 * ```
 */

import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../../contracts/Graphics.js';
import { graphics } from '../../../graphics/GraphicsEngine.js';
import { Gradients } from '../../../graphics/GradientFactory.js';
import { getFrameworkFontFamily, loadFrameworkFont } from '../../utils/FontLoader.js';
import {
  CardRarity,
  CardStyle,
  CardColorScheme,
  CardRarityColors,
  StatBarColors,
  StatColors,
  getDefaultCardColors
} from './CardColors.js';

export interface CharacterStat {
  label: string;
  value: number;
  maxValue: number;
  colors?: StatBarColors;
}

export interface CharacterCardConfig {
  name?: string;
  stars?: number;
  maxStars?: number;
  stats?: CharacterStat[];
  rarity?: CardRarity;
  avatarSize?: number;
  avatarColor?: number;
  width?: number;
  height?: number;
  style?: CardStyle;
  colorScheme?: CardColorScheme;
}

export class CharacterCard extends EventEmitter {
  private container: IContainer;
  private backgroundGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private glowGraphics: IGraphics;
  private avatarGraphics: IGraphics;
  private starsContainer: IContainer;
  private statsContainer: IContainer;
  private nameText?: IText;

  private config: Required<CharacterCardConfig>;
  private colors: CardColorScheme;

  constructor(config: CharacterCardConfig = {}) {
    super();
    loadFrameworkFont();

    this.config = {
      name: config.name ?? 'Hero',
      stars: config.stars ?? 3,
      maxStars: config.maxStars ?? 5,
      stats: config.stats ?? [
        { label: 'HP', value: 75, maxValue: 100, colors: StatColors.HP },
        { label: 'ATK', value: 60, maxValue: 100, colors: StatColors.ATK }
      ],
      rarity: config.rarity ?? 'common',
      avatarSize: config.avatarSize ?? 80,
      avatarColor: config.avatarColor ?? 0x5C6BC0,
      width: config.width ?? 180,
      height: config.height ?? 280,
      style: config.style ?? 'game',
      colorScheme: config.colorScheme ?? getDefaultCardColors(config.style ?? 'game')
    };

    this.colors = this.config.colorScheme;

    const factory = graphics();
    this.container = factory.createContainer();
    this.glowGraphics = factory.createGraphics();
    this.backgroundGraphics = factory.createGraphics();
    this.borderGraphics = factory.createGraphics();
    this.avatarGraphics = factory.createGraphics();
    this.starsContainer = factory.createContainer();
    this.statsContainer = factory.createContainer();

    this.container.addChild(this.glowGraphics);
    this.container.addChild(this.backgroundGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.starsContainer);
    this.container.addChild(this.avatarGraphics);
    this.container.addChild(this.statsContainer);

    this.render();
  }

  private render(): void {
    const { width, height, style, rarity, name, stars, maxStars, avatarSize, avatarColor, stats } = this.config;
    const rarityColors = CardRarityColors[rarity];
    const isGame = style === 'game';
    const borderRadius = isGame ? 16 : 12;
    const padding = isGame ? 12 : 14;

    // Clear
    this.glowGraphics.clear();
    this.backgroundGraphics.clear();
    this.borderGraphics.clear();
    this.avatarGraphics.clear();

    // Remove old children from dynamic containers
    this.starsContainer.removeChildren();
    this.statsContainer.removeChildren();

    // Glow
    if (rarityColors.glowAlpha > 0) {
      const gs = isGame ? 6 : 3;
      this.glowGraphics.roundRect(-gs, -gs, width + gs * 2, height + gs * 2, borderRadius + gs);
      this.glowGraphics.fill({ color: rarityColors.glow, alpha: rarityColors.glowAlpha });
    }

    // Background
    if (isGame) {
      const bgGrad = Gradients.linear.vertical(this.colors.background, this.colors.backgroundBottom);
      this.backgroundGraphics.roundRect(0, 0, width, height, borderRadius);
      this.backgroundGraphics.fill(bgGrad);
    } else {
      this.backgroundGraphics.roundRect(0, 0, width, height, borderRadius);
      this.backgroundGraphics.fill({ color: this.colors.background });
    }

    // Border
    const borderColor = rarity !== 'common' ? rarityColors.border : this.colors.border;
    this.borderGraphics.roundRect(0, 0, width, height, borderRadius);
    this.borderGraphics.stroke({ color: borderColor, width: this.colors.borderWidth });

    // Stars row
    let cursorY = padding;
    const starSize = isGame ? 16 : 14;
    const starGap = 4;
    const totalStarWidth = maxStars * starSize + (maxStars - 1) * starGap;
    const starStartX = (width - totalStarWidth) / 2;

    for (let i = 0; i < maxStars; i++) {
      const star = graphics().createText(i < stars ? '\u2605' : '\u2606', {
        fontFamily: isGame ? getFrameworkFontFamily() : 'Arial',
        fontSize: starSize,
        fill: i < stars ? 0xFFD700 : 0x666666
      });
      star.x = starStartX + i * (starSize + starGap);
      star.y = 0;
      this.starsContainer.addChild(star);
    }
    this.starsContainer.x = 0;
    this.starsContainer.y = cursorY;
    cursorY += starSize + padding;

    // Avatar placeholder
    const avatarX = (width - avatarSize) / 2;
    if (isGame) {
      const avGrad = Gradients.linear.vertical(
        avatarColor,
        (avatarColor & 0xFEFEFE) >> 1 // darken
      );
      this.avatarGraphics.roundRect(avatarX, cursorY, avatarSize, avatarSize, 12);
      this.avatarGraphics.fill(avGrad);
      this.avatarGraphics.roundRect(avatarX, cursorY, avatarSize, avatarSize, 12);
      this.avatarGraphics.stroke({ color: 0x000000, width: 2 });
    } else {
      this.avatarGraphics.roundRect(avatarX, cursorY, avatarSize, avatarSize, 10);
      this.avatarGraphics.fill({ color: avatarColor, alpha: 0.15 });
      this.avatarGraphics.roundRect(avatarX, cursorY, avatarSize, avatarSize, 10);
      this.avatarGraphics.stroke({ color: avatarColor, width: 1 });
    }
    cursorY += avatarSize + padding;

    // Name
    if (this.nameText) {
      this.container.removeChild(this.nameText);
    }
    this.nameText = graphics().createText(name, {
      fontFamily: isGame ? getFrameworkFontFamily() : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: isGame ? 18 : 15,
      fontWeight: isGame ? '700' : '600',
      fill: this.colors.bodyText,
      ...(isGame ? {
        stroke: { color: this.colors.headerTextStroke, width: 2 },
        dropShadow: { alpha: 0.3, angle: Math.PI / 2, blur: 1, color: 0x000000, distance: 1 }
      } : {})
    });
    if (this.nameText.anchor) this.nameText.anchor.set(0.5, 0);
    this.nameText.x = width / 2;
    this.nameText.y = cursorY;
    this.container.addChild(this.nameText);
    cursorY += (isGame ? 24 : 22) + 8;

    // Stats bars
    const barWidth = width - padding * 2;
    const barHeight = isGame ? 14 : 10;
    const barGap = isGame ? 10 : 8;

    stats.forEach((stat, idx) => {
      const statY = idx * (barHeight + barGap);
      const colors = stat.colors ?? StatColors.HP;
      const fillRatio = Math.min(1, stat.value / stat.maxValue);

      // Bar background
      const barBg = graphics().createGraphics();
      barBg.roundRect(0, 0, barWidth, barHeight, barHeight / 2);
      barBg.fill({ color: colors.background, alpha: isGame ? 1 : 0.3 });

      // Bar fill
      const fillWidth = Math.max(barHeight, barWidth * fillRatio); // min width = height for round ends
      barBg.roundRect(0, 0, fillWidth, barHeight, barHeight / 2);
      barBg.fill({ color: colors.fill });

      // Label
      const label = graphics().createText(`${stat.label} ${stat.value}`, {
        fontFamily: isGame ? getFrameworkFontFamily() : 'Arial',
        fontSize: isGame ? 10 : 9,
        fontWeight: '600',
        fill: colors.text
      });
      if (label.anchor) label.anchor.set(0, 0.5);
      label.x = 6;
      label.y = barHeight / 2;

      const statContainer = graphics().createContainer();
      statContainer.addChild(barBg);
      statContainer.addChild(label);
      statContainer.x = padding;
      statContainer.y = statY;
      this.statsContainer.addChild(statContainer);
    });

    this.statsContainer.y = cursorY;
  }

  public getContainer(): IContainer {
    return this.container;
  }

  public setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  public setStars(stars: number): this {
    this.config.stars = Math.max(0, Math.min(stars, this.config.maxStars));
    this.render();
    return this;
  }

  public setRarity(rarity: CardRarity): this {
    this.config.rarity = rarity;
    this.render();
    return this;
  }

  public updateStats(stats: CharacterStat[]): this {
    this.config.stats = stats;
    this.render();
    return this;
  }

  public getWidth(): number {
    return this.config.width;
  }

  public getHeight(): number {
    return this.config.height;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
