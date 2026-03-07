/**
 * GameCard — Generic card container component
 *
 * A versatile card with optional header/footer areas, dual-style support
 * (game vibrant vs flat modern), and rarity-based border/glow effects.
 *
 * @example
 * ```typescript
 * const card = new GameCard({
 *   width: 200,
 *   height: 280,
 *   style: 'game',
 *   rarity: 'epic',
 *   headerText: 'Rewards'
 * });
 * stage.addChild(card.getContainer());
 *
 * // Add custom content to the body area
 * card.getBody().addChild(myContent);
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
  getDefaultCardColors
} from './CardColors.js';

export interface GameCardConfig {
  width?: number;
  height?: number;
  style?: CardStyle;
  rarity?: CardRarity;
  headerText?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  colorScheme?: CardColorScheme;
  borderRadius?: number;
}

export class GameCard extends EventEmitter {
  protected container: IContainer;
  protected backgroundGraphics: IGraphics;
  protected borderGraphics: IGraphics;
  protected glowGraphics: IGraphics;
  protected headerGraphics: IGraphics;
  protected headerText?: IText;
  protected bodyContainer: IContainer;
  protected footerContainer: IContainer;

  protected config: Required<GameCardConfig>;
  protected colors: CardColorScheme;

  constructor(config: GameCardConfig = {}) {
    super();
    loadFrameworkFont();

    this.config = {
      width: config.width ?? 200,
      height: config.height ?? 280,
      style: config.style ?? 'game',
      rarity: config.rarity ?? 'common',
      headerText: config.headerText ?? '',
      showHeader: config.showHeader ?? !!config.headerText,
      showFooter: config.showFooter ?? false,
      colorScheme: config.colorScheme ?? getDefaultCardColors(config.style ?? 'game'),
      borderRadius: config.borderRadius ?? (config.style === 'flat' ? 12 : 16)
    };

    this.colors = this.config.colorScheme;

    const factory = graphics();
    this.container = factory.createContainer();
    this.glowGraphics = factory.createGraphics();
    this.backgroundGraphics = factory.createGraphics();
    this.borderGraphics = factory.createGraphics();
    this.headerGraphics = factory.createGraphics();
    this.bodyContainer = factory.createContainer();
    this.footerContainer = factory.createContainer();

    this.container.addChild(this.glowGraphics);
    this.container.addChild(this.backgroundGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.headerGraphics);
    this.container.addChild(this.bodyContainer);
    this.container.addChild(this.footerContainer);

    if (this.config.showHeader && this.config.headerText) {
      this.createHeaderText();
    }

    this.render();
  }

  protected getHeaderHeight(): number {
    return this.config.showHeader ? 44 : 0;
  }

  protected getFooterHeight(): number {
    return this.config.showFooter ? 48 : 0;
  }

  private createHeaderText(): void {
    const { style } = this.config;
    const isGame = style === 'game';

    this.headerText = graphics().createText(this.config.headerText, {
      fontFamily: isGame ? getFrameworkFontFamily() : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: isGame ? 20 : 16,
      fontWeight: isGame ? '700' : '600',
      fill: this.colors.headerText,
      ...(isGame ? {
        stroke: { color: this.colors.headerTextStroke, width: 2 },
        dropShadow: { alpha: 0.3, angle: Math.PI / 2, blur: 1, color: 0x000000, distance: 1 }
      } : {})
    });

    if (this.headerText.anchor) this.headerText.anchor.set(0.5, 0.5);
    this.headerText.x = this.config.width / 2;
    this.headerText.y = this.getHeaderHeight() / 2;
    this.container.addChild(this.headerText);
  }

  protected render(): void {
    const { width, height, borderRadius, style, rarity } = this.config;
    const rarityColors = CardRarityColors[rarity];

    this.glowGraphics.clear();
    this.backgroundGraphics.clear();
    this.borderGraphics.clear();
    this.headerGraphics.clear();

    // Glow effect for rare+ cards
    if (rarityColors.glowAlpha > 0) {
      const glowSize = style === 'game' ? 6 : 3;
      this.glowGraphics.roundRect(
        -glowSize, -glowSize,
        width + glowSize * 2, height + glowSize * 2,
        borderRadius + glowSize
      );
      this.glowGraphics.fill({ color: rarityColors.glow, alpha: rarityColors.glowAlpha });
    }

    // Background
    if (style === 'game') {
      const bgGradient = Gradients.linear.vertical(this.colors.background, this.colors.backgroundBottom);
      this.backgroundGraphics.roundRect(0, 0, width, height, borderRadius);
      this.backgroundGraphics.fill(bgGradient);
    } else {
      this.backgroundGraphics.roundRect(0, 0, width, height, borderRadius);
      this.backgroundGraphics.fill({ color: this.colors.background });
    }

    // Border — use rarity color for rare+ cards
    const borderColor = rarity !== 'common' ? rarityColors.border : this.colors.border;
    this.borderGraphics.roundRect(0, 0, width, height, borderRadius);
    this.borderGraphics.stroke({ color: borderColor, width: this.colors.borderWidth });

    // Header area
    if (this.config.showHeader) {
      const hh = this.getHeaderHeight();
      if (style === 'game') {
        this.headerGraphics.roundRect(
          this.colors.borderWidth, this.colors.borderWidth,
          width - this.colors.borderWidth * 2, hh,
          borderRadius - 1
        );
        this.headerGraphics.fill({ color: this.colors.headerBg, alpha: 0.6 });
      } else {
        this.headerGraphics.rect(
          this.colors.borderWidth, this.colors.borderWidth,
          width - this.colors.borderWidth * 2, hh
        );
        this.headerGraphics.fill({ color: this.colors.headerBg });
      }
    }

    // Position body container
    const bodyY = this.getHeaderHeight();
    this.bodyContainer.y = bodyY;

    // Position footer container
    this.footerContainer.y = height - this.getFooterHeight();
  }

  /** Get the body container to add custom content */
  public getBody(): IContainer {
    return this.bodyContainer;
  }

  /** Get the footer container to add custom content */
  public getFooter(): IContainer {
    return this.footerContainer;
  }

  public getContainer(): IContainer {
    return this.container;
  }

  public setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  public getWidth(): number {
    return this.config.width;
  }

  public getHeight(): number {
    return this.config.height;
  }

  public setRarity(rarity: CardRarity): this {
    this.config.rarity = rarity;
    this.render();
    return this;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
