/**
 * RewardCard — Loot/chest reward reveal card
 *
 * Displays a reward item with icon, quantity, and name.
 * Features a flip animation (Y-axis) for reveal and a diagonal
 * shine sweep effect for epic/legendary items.
 *
 * @example
 * ```typescript
 * const reward = new RewardCard({
 *   iconText: '\ud83d\udc8e',
 *   quantity: 500,
 *   name: 'Diamonds',
 *   rarity: 'legendary',
 *   flipOnReveal: true
 * });
 * stage.addChild(reward.getContainer());
 *
 * // Trigger the reveal animation
 * await reward.reveal();
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

export interface RewardCardConfig {
  iconText?: string;
  quantity?: number;
  name?: string;
  rarity?: CardRarity;
  width?: number;
  height?: number;
  style?: CardStyle;
  colorScheme?: CardColorScheme;
  flipOnReveal?: boolean;
  shineEffect?: boolean;
}

export class RewardCard extends EventEmitter {
  private container: IContainer;
  private frontContainer: IContainer;
  private backContainer: IContainer;
  private shineGraphics: IGraphics;

  private config: Required<RewardCardConfig>;
  private colors: CardColorScheme;
  private isRevealed: boolean = false;
  private isAnimating: boolean = false;

  constructor(config: RewardCardConfig = {}) {
    super();
    loadFrameworkFont();

    this.config = {
      iconText: config.iconText ?? '\u2b50',
      quantity: config.quantity ?? 1,
      name: config.name ?? 'Reward',
      rarity: config.rarity ?? 'common',
      width: config.width ?? 160,
      height: config.height ?? 220,
      style: config.style ?? 'game',
      colorScheme: config.colorScheme ?? getDefaultCardColors(config.style ?? 'game'),
      flipOnReveal: config.flipOnReveal ?? true,
      shineEffect: config.shineEffect ?? true
    };

    this.colors = this.config.colorScheme;

    const factory = graphics();
    this.container = factory.createContainer();
    this.frontContainer = factory.createContainer();
    this.backContainer = factory.createContainer();
    this.shineGraphics = factory.createGraphics();

    this.container.addChild(this.backContainer);
    this.container.addChild(this.frontContainer);
    this.container.addChild(this.shineGraphics);

    this.renderBack();
    this.renderFront();

    // Start showing back (unrevealed)
    if (this.config.flipOnReveal) {
      this.frontContainer.visible = false;
      this.backContainer.visible = true;
    } else {
      this.frontContainer.visible = true;
      this.backContainer.visible = false;
      this.isRevealed = true;
    }
  }

  private renderBack(): void {
    const { width, height, style } = this.config;
    const isGame = style === 'game';
    const borderRadius = isGame ? 16 : 12;

    const bg = graphics().createGraphics();
    if (isGame) {
      const bgGrad = Gradients.linear.vertical(0x3949AB, 0x1A237E);
      bg.roundRect(0, 0, width, height, borderRadius);
      bg.fill(bgGrad);
      bg.roundRect(0, 0, width, height, borderRadius);
      bg.stroke({ color: 0x000000, width: 3 });

      // Question mark
      const inner = graphics().createGraphics();
      const inset = 16;
      inner.roundRect(inset, inset, width - inset * 2, height - inset * 2, borderRadius - 4);
      inner.stroke({ color: 0x5C6BC0, width: 2 });
      this.backContainer.addChild(bg);
      this.backContainer.addChild(inner);
    } else {
      bg.roundRect(0, 0, width, height, borderRadius);
      bg.fill({ color: 0xE0E0E0 });
      bg.roundRect(0, 0, width, height, borderRadius);
      bg.stroke({ color: 0xBDBDBD, width: 1 });
      this.backContainer.addChild(bg);
    }

    const questionMark = graphics().createText('?', {
      fontFamily: isGame ? getFrameworkFontFamily() : 'Arial',
      fontSize: isGame ? 64 : 48,
      fontWeight: '700',
      fill: isGame ? 0x7986CB : 0x9E9E9E
    });
    if (questionMark.anchor) questionMark.anchor.set(0.5, 0.5);
    questionMark.x = width / 2;
    questionMark.y = height / 2;
    this.backContainer.addChild(questionMark);
  }

  private renderFront(): void {
    const { width, height, style, rarity, iconText, quantity, name } = this.config;
    const rarityColors = CardRarityColors[rarity];
    const isGame = style === 'game';
    const borderRadius = isGame ? 16 : 12;

    // Glow for rare+
    if (rarityColors.glowAlpha > 0) {
      const glow = graphics().createGraphics();
      const gs = isGame ? 6 : 3;
      glow.roundRect(-gs, -gs, width + gs * 2, height + gs * 2, borderRadius + gs);
      glow.fill({ color: rarityColors.glow, alpha: rarityColors.glowAlpha });
      this.frontContainer.addChild(glow);
    }

    // Background
    const bg = graphics().createGraphics();
    if (isGame) {
      const bgGrad = Gradients.linear.vertical(this.colors.background, this.colors.backgroundBottom);
      bg.roundRect(0, 0, width, height, borderRadius);
      bg.fill(bgGrad);
    } else {
      bg.roundRect(0, 0, width, height, borderRadius);
      bg.fill({ color: this.colors.background });
    }
    this.frontContainer.addChild(bg);

    // Border
    const border = graphics().createGraphics();
    const borderColor = rarity !== 'common' ? rarityColors.border : this.colors.border;
    border.roundRect(0, 0, width, height, borderRadius);
    border.stroke({ color: borderColor, width: this.colors.borderWidth });
    this.frontContainer.addChild(border);

    // Icon (large, centered)
    const iconY = height * 0.28;
    const icon = graphics().createText(iconText, {
      fontFamily: 'Arial',
      fontSize: isGame ? 56 : 44
    });
    if (icon.anchor) icon.anchor.set(0.5, 0.5);
    icon.x = width / 2;
    icon.y = iconY;
    this.frontContainer.addChild(icon);

    // Quantity badge
    if (quantity > 1) {
      const qtyText = graphics().createText(`x ${quantity}`, {
        fontFamily: isGame ? getFrameworkFontFamily() : '-apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: isGame ? 24 : 18,
        fontWeight: '700',
        fill: this.colors.bodyText,
        ...(isGame ? {
          stroke: { color: this.colors.headerTextStroke, width: 2 }
        } : {})
      });
      if (qtyText.anchor) qtyText.anchor.set(0.5, 0.5);
      qtyText.x = width / 2;
      qtyText.y = height * 0.55;
      this.frontContainer.addChild(qtyText);
    }

    // Name
    const nameText = graphics().createText(name, {
      fontFamily: isGame ? getFrameworkFontFamily() : '-apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: isGame ? 16 : 13,
      fontWeight: '600',
      fill: isGame ? rarityColors.accent : this.colors.bodyText
    });
    if (nameText.anchor) nameText.anchor.set(0.5, 0.5);
    nameText.x = width / 2;
    nameText.y = height * 0.75;
    this.frontContainer.addChild(nameText);

    // Rarity label
    const rarityLabel = graphics().createText(rarity.toUpperCase(), {
      fontFamily: isGame ? getFrameworkFontFamily() : 'Arial',
      fontSize: isGame ? 11 : 10,
      fontWeight: '700',
      fill: rarityColors.accent
    });
    if (rarityLabel.anchor) rarityLabel.anchor.set(0.5, 0.5);
    rarityLabel.x = width / 2;
    rarityLabel.y = height * 0.88;
    this.frontContainer.addChild(rarityLabel);
  }

  /**
   * Reveal the card with flip animation.
   * Uses scaleX tween to simulate Y-axis rotation.
   */
  public async reveal(): Promise<void> {
    if (this.isRevealed || this.isAnimating) return;
    this.isAnimating = true;

    const duration = 400; // ms
    const halfDuration = duration / 2;

    // Phase 1: Scale X from 1 → 0 (hide back)
    await this.tweenScaleX(this.container, 1, 0, halfDuration);
    this.backContainer.visible = false;
    this.frontContainer.visible = true;

    // Phase 2: Scale X from 0 → 1 (show front)
    await this.tweenScaleX(this.container, 0, 1, halfDuration);

    this.isRevealed = true;
    this.isAnimating = false;

    // Shine effect for epic/legendary
    if (this.config.shineEffect && (this.config.rarity === 'epic' || this.config.rarity === 'legendary')) {
      this.playShineEffect();
    }

    this.emit('revealed');
  }

  private tweenScaleX(target: IContainer, from: number, to: number, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // Ease in-out
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        target.scale.x = from + (to - from) * eased;
        // Keep pivot centered for visual flip
        target.x = this.config.width * (1 - target.scale.x) / 2;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          target.scale.x = to;
          target.x = this.config.width * (1 - to) / 2;
          resolve();
        }
      };
      tick();
    });
  }

  private playShineEffect(): void {
    const { width, height, rarity } = this.config;
    const rarityColors = CardRarityColors[rarity];

    // Diagonal shine sweep
    this.shineGraphics.clear();
    let shineX = -40;

    const animate = () => {
      this.shineGraphics.clear();
      if (shineX > width + 40) {
        this.shineGraphics.clear();
        return;
      }

      // Clip to card bounds using mask-like approach: just draw a narrow diagonal stripe
      const stripeWidth = 30;
      this.shineGraphics.moveTo(shineX, 0);
      this.shineGraphics.lineTo(shineX + stripeWidth, 0);
      this.shineGraphics.lineTo(shineX + stripeWidth - height * 0.3, height);
      this.shineGraphics.lineTo(shineX - height * 0.3, height);
      this.shineGraphics.closePath();
      this.shineGraphics.fill({ color: rarityColors.accent, alpha: 0.25 });

      shineX += 4;
      requestAnimationFrame(animate);
    };
    animate();
  }

  /** Reset card to unrevealed state */
  public reset(): this {
    this.isRevealed = false;
    this.isAnimating = false;
    this.shineGraphics.clear();
    this.container.scale.x = 1;
    this.container.x = 0;
    if (this.config.flipOnReveal) {
      this.frontContainer.visible = false;
      this.backContainer.visible = true;
    }
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

  public getWidth(): number {
    return this.config.width;
  }

  public getHeight(): number {
    return this.config.height;
  }

  public isCardRevealed(): boolean {
    return this.isRevealed;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
