import { SimpleScreen } from './SimpleScreen.js';
import { IContainer, IGraphics, ITexture } from '../../contracts/Graphics.js';
import { graphics } from '../../graphics/GraphicsEngine.js';
import { GameStyleButton } from '../components/GameStyleButton.js';
import { GameStyleColors } from '../themes/GameStyleUITheme.js';
import { animate, Easing, lerp } from '../utils/animation.js';
import { formatNumber } from '../utils/format.js';
import { darkenColor } from '../themes/GameStyleUITheme.js';
import { getFrameworkFontFamily } from '../utils/FontLoader.js';

/**
 * Result type
 */
export type ResultType = 'victory' | 'defeat';

/**
 * Reward item configuration
 */
export interface RewardItem {
  icon: string | ITexture;
  amount: number;
  label?: string;
}

/**
 * Result action button
 */
export interface ResultAction {
  text: string;
  style?: 'primary' | 'secondary';
  onClick: () => void;
}

/**
 * ResultScreen configuration
 */
export interface ResultScreenConfig {
  type: ResultType;
  score?: number;
  bestScore?: number;
  stars?: number; // 0-3
  rewards?: RewardItem[];
  actions?: ResultAction[];
  title?: string;
  backgroundColor?: number;
}

/**
 * ResultScreen - Game result/end screen
 *
 * Features:
 * - Victory/Defeat display
 * - Star rating (0-3)
 * - Score display with best score
 * - Reward items
 * - Action buttons (Retry, Next, Home)
 *
 * @example
 * ```typescript
 * const result = new ResultScreen({
 *   type: 'victory',
 *   score: 12450,
 *   bestScore: 15230,
 *   stars: 3,
 *   rewards: [
 *     { icon: '💰', amount: 500 },
 *     { icon: '💎', amount: 10 }
 *   ],
 *   actions: [
 *     { text: 'Retry', style: 'secondary', onClick: () => retry() },
 *     { text: 'Next Level', style: 'primary', onClick: () => nextLevel() }
 *   ]
 * });
 *
 * screenManager.replace(result, 'fade');
 * ```
 */
export class ResultScreen extends SimpleScreen {
  private background: IGraphics;
  private contentContainer: IContainer;

  private resultConfig: ResultScreenConfig;

  constructor(config: ResultScreenConfig) {
    super('ResultScreen');

    this.resultConfig = {
      type: config.type,
      score: config.score,
      bestScore: config.bestScore,
      stars: config.stars ?? 0,
      rewards: config.rewards || [],
      actions: config.actions || [],
      title: config.title,
      backgroundColor: config.backgroundColor || 0x1a1a2e,
    };

    const factory = graphics();

    // Create background
    this.background = factory.createGraphics();
    this.container.addChild(this.background);

    // Create content container
    this.contentContainer = factory.createContainer();
    this.container.addChild(this.contentContainer);
  }

  /**
   * Setup the screen
   */
  protected setup(): void {
    const width = this._width;
    const height = this._height;

    // Draw background
    this.drawBackground(width, height);

    // Create content
    this.createContent(width, height);
  }

  /**
   * Draw background with gradient
   */
  private drawBackground(width: number, height: number): void {
    this.background.clear();
    this.background.rect(0, 0, width, height);
    this.background.fill({ color: this.resultConfig.backgroundColor || 0x1a1a2e });

    // Add gradient overlay
    const isVictory = this.resultConfig.type === 'victory';
    const overlayColor = isVictory ? 0x4CAF50 : 0xE84C4C;

    // Top gradient
    this.background.rect(0, 0, width, height * 0.4);
    this.background.fill({ color: overlayColor, alpha: 0.2 });
  }

  /**
   * Create all content
   */
  private createContent(width: number, height: number): void {
    const factory = graphics();
    const isVictory = this.resultConfig.type === 'victory';
    let currentY = height * 0.1;

    // Title
    const titleText = this.resultConfig.title || (isVictory ? 'VICTORY!' : 'DEFEAT');
    const title = factory.createText(titleText, {
      fontFamily: '"Lilita One", "Arial Black", sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: isVictory ? 0x4CAF50 : 0xE84C4C,
      stroke: { color: 0x000000, width: 4 },
    });
    if (title.anchor) title.anchor.set(0.5, 0.5);
    title.x = width / 2;
    title.y = currentY;
    this.contentContainer.addChild(title);

    currentY += 80;

    // Stars
    if (this.resultConfig.stars !== undefined) {
      const starsContainer = this.createStars(this.resultConfig.stars);
      starsContainer.x = width / 2;
      starsContainer.y = currentY;
      this.contentContainer.addChild(starsContainer);

      currentY += 80;
    }

    // Score
    if (this.resultConfig.score !== undefined) {
      const scoreContainer = this.createScoreDisplay(width);
      scoreContainer.y = currentY;
      this.contentContainer.addChild(scoreContainer);

      currentY += 120;
    }

    // Rewards
    if (this.resultConfig.rewards && this.resultConfig.rewards.length > 0) {
      const rewardsContainer = this.createRewards(width);
      rewardsContainer.y = currentY;
      this.contentContainer.addChild(rewardsContainer);

      currentY += 100;
    }

    // Action buttons
    if (this.resultConfig.actions && this.resultConfig.actions.length > 0) {
      const actionsContainer = this.createActions(width, height);
      this.contentContainer.addChild(actionsContainer);
    }
  }

  /**
   * Create star rating display
   */
  private createStars(starCount: number): IContainer {
    const factory = graphics();
    const container = factory.createContainer();

    const starSize = 50;
    const spacing = 15;
    const totalWidth = 3 * starSize + 2 * spacing;
    let x = -totalWidth / 2 + starSize / 2;

    for (let i = 0; i < 3; i++) {
      const star = factory.createGraphics();
      const isFilled = i < starCount;

      this.drawStar(star, starSize, isFilled ? 0xFFD700 : 0x444444);
      star.x = x;
      container.addChild(star);

      x += starSize + spacing;
    }

    return container;
  }

  /**
   * Draw a star shape
   */
  private drawStar(g: IGraphics, size: number, color: number): void {
    const points = 5;
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    const vertices: number[] = [];

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      vertices.push(Math.cos(angle) * radius);
      vertices.push(Math.sin(angle) * radius);
    }

    g.poly(vertices);
    g.fill({ color });
    g.stroke({ color: darkenColor(color, 0.3), width: 2 });
  }

  /**
   * Create score display
   */
  private createScoreDisplay(width: number): IContainer {
    const factory = graphics();
    const container = factory.createContainer();

    // Score label
    const scoreLabel = factory.createText('Score', {
      fontFamily: '"Lilita One", "Arial Black", sans-serif',
      fontSize: 24,
      fill: 0x888888,
    });
    if (scoreLabel.anchor) scoreLabel.anchor.set(0.5, 0.5);
    scoreLabel.x = width / 2;
    scoreLabel.y = 0;
    container.addChild(scoreLabel);

    // Score value
    const scoreValue = factory.createText(formatNumber(this.resultConfig.score || 0), {
      fontFamily: '"Lilita One", "Arial Black", sans-serif',
      fontSize: 56,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      stroke: { color: 0x000000, width: 3 },
    });
    if (scoreValue.anchor) scoreValue.anchor.set(0.5, 0.5);
    scoreValue.x = width / 2;
    scoreValue.y = 50;
    container.addChild(scoreValue);

    // Best score
    if (this.resultConfig.bestScore !== undefined) {
      const isNewBest = (this.resultConfig.score || 0) >= this.resultConfig.bestScore;
      const bestText = isNewBest ? 'NEW BEST!' : `Best: ${formatNumber(this.resultConfig.bestScore)}`;
      const bestLabel = factory.createText(bestText, {
        fontFamily: '"Lilita One", "Arial Black", sans-serif',
        fontSize: 18,
        fill: isNewBest ? 0xFFD700 : 0x888888,
      });
      if (bestLabel.anchor) bestLabel.anchor.set(0.5, 0.5);
      bestLabel.x = width / 2;
      bestLabel.y = 90;
      container.addChild(bestLabel);
    }

    return container;
  }

  /**
   * Create rewards display
   */
  private createRewards(width: number): IContainer {
    const factory = graphics();
    const container = factory.createContainer();

    const rewards = this.resultConfig.rewards || [];
    const itemWidth = 80;
    const spacing = 20;
    const totalWidth = rewards.length * itemWidth + (rewards.length - 1) * spacing;
    let x = (width - totalWidth) / 2 + itemWidth / 2;

    // Rewards label
    const rewardsLabel = factory.createText('Rewards', {
      fontFamily: '"Lilita One", "Arial Black", sans-serif',
      fontSize: 20,
      fill: 0x888888,
    });
    if (rewardsLabel.anchor) rewardsLabel.anchor.set(0.5, 0.5);
    rewardsLabel.x = width / 2;
    rewardsLabel.y = 0;
    container.addChild(rewardsLabel);

    rewards.forEach((reward) => {
      const rewardContainer = factory.createContainer();
      rewardContainer.x = x;
      rewardContainer.y = 50;

      // Background
      const bg = factory.createGraphics();
      bg.roundRect(-35, -35, 70, 70, 12);
      bg.fill({ color: 0x2A3142 });
      bg.stroke({ color: 0x3D4F5F, width: 2 });
      rewardContainer.addChild(bg);

      // Icon
      if (typeof reward.icon === 'string') {
        const iconText = factory.createText(reward.icon, {
          fontFamily: getFrameworkFontFamily(),
          fontSize: 32,
        });
        if (iconText.anchor) iconText.anchor.set(0.5, 0.5);
        iconText.y = -5;
        rewardContainer.addChild(iconText);
      }

      // Amount
      const amountText = factory.createText(`+${formatNumber(reward.amount)}`, {
        fontFamily: '"Lilita One", "Arial Black", sans-serif',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 2 },
      });
      if (amountText.anchor) amountText.anchor.set(0.5, 0.5);
      amountText.y = 22;
      rewardContainer.addChild(amountText);

      container.addChild(rewardContainer);
      x += itemWidth + spacing;
    });

    return container;
  }

  /**
   * Create action buttons
   */
  private createActions(width: number, height: number): IContainer {
    const factory = graphics();
    const container = factory.createContainer();

    const actions = this.resultConfig.actions || [];
    const buttonWidth = 200;
    const buttonHeight = 60;
    const spacing = 20;

    // Position buttons at bottom
    const startY = height - 150 - (actions.length - 1) * (buttonHeight + spacing);

    actions.forEach((action, index) => {
      const isPrimary = action.style !== 'secondary';
      const colorScheme = isPrimary
        ? GameStyleColors.GREEN_BUTTON
        : GameStyleColors.BLUE_BUTTON;

      const button = new GameStyleButton({
        text: action.text,
        width: buttonWidth,
        height: buttonHeight,
        fontSize: 24,
        colorScheme,
      });

      button.setPosition(
        (width - buttonWidth) / 2,
        startY + index * (buttonHeight + spacing)
      );
      button.on('click', action.onClick);

      container.addChild(button.getContainer());
    });

    return container;
  }

  /**
   * Handle resize
   */
  protected onResize(width: number, height: number): void {
    this.contentContainer.removeChildren();
    this.drawBackground(width, height);
    this.createContent(width, height);
  }

  /**
   * Animate in with scale
   */
  protected async animateIn(): Promise<void> {
    this.contentContainer.scale.x = 0.8;
    this.contentContainer.scale.y = 0.8;
    this.contentContainer.alpha = 0;

    return animate({
      duration: 400,
      easing: Easing.easeOutBack,
      onUpdate: (progress, eased) => {
        const scale = lerp(0.8, 1, eased);
        this.contentContainer.scale.x = scale;
        this.contentContainer.scale.y = scale;
        this.contentContainer.alpha = progress;
      },
    });
  }

  /**
   * Handle back button
   */
  public onBackButton(): boolean {
    return false;
  }
}
