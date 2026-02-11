/**
 * GameLoading - Canvas-based loading screen (Pixi.js)
 *
 * Shows after GameSplash, with:
 * - Game logo/background
 * - "Loading" text (Pixi UI style)
 * - Optional progress bar (Pixi UI style)
 *
 * Usage:
 * const loading = new GameLoading({ ... });
 * stage.addChild(loading.getContainer());
 * loading.setProgress(50);
 * await loading.hide();
 */

import { EventEmitter } from 'eventemitter3';
import { graphics } from '../../graphics/GraphicsEngine';
import type { IContainer, IGraphics, IText, ISprite } from '../../contracts/Graphics';
import { loadFrameworkFont, getFrameworkFontFamily } from '../utils/FontLoader';
import { Logger } from '../../utils/Logger.js';

export interface GameLoadingConfig {
  /** Screen width */
  width: number;
  /** Screen height */
  height: number;
  /** Background color */
  backgroundColor?: number;
  /** Background image URL (optional, covers full screen) */
  backgroundImage?: string;
  /** Game logo URL (optional) */
  logoUrl?: string;
  /** Game logo emoji (if no URL) */
  logoEmoji?: string;
  /** Game title (optional, shown above loading) */
  title?: string;
  /** Loading text */
  loadingText?: string;
  /** Show progress bar */
  showProgress?: boolean;
  /** Progress bar color */
  progressColor?: number;
  /** Progress bar background color */
  progressBgColor?: number;
}

const DEFAULT_CONFIG: Required<GameLoadingConfig> = {
  width: 400,
  height: 600,
  backgroundColor: 0x1a1a2e,
  backgroundImage: '',
  logoUrl: '',
  logoEmoji: '🎮',
  title: '',
  loadingText: 'Loading',
  showProgress: false,
  progressColor: 0x6366f1,
  progressBgColor: 0x2a2a4e
};

/**
 * GameLoading - Pixi.js based loading screen
 */
export class GameLoading extends EventEmitter {
  private config: Required<GameLoadingConfig>;
  private container: IContainer;
  private progressBar: IGraphics | null = null;
  private progressFill: IGraphics | null = null;
  private loadingText: IText | null = null;
  private currentProgress: number = 0;

  constructor(config: GameLoadingConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    const gfx = graphics();
    this.container = gfx.createContainer();

    // Ensure font is loaded
    loadFrameworkFont();

    this.createBackground();
    this.createLogo();
    this.createLoadingText();

    if (this.config.showProgress) {
      this.createProgressBar();
    }
  }

  private createBackground(): void {
    const gfx = graphics();

    // Solid color background (always shown as base)
    const bg = gfx.createGraphics();
    bg.rect(0, 0, this.config.width, this.config.height);
    bg.fill({ color: this.config.backgroundColor });
    this.container.addChild(bg);

    // Background image (optional, covers full screen)
    if (this.config.backgroundImage) {
      this.loadBackgroundImage();
    }
  }

  private loadBackgroundImage(): void {
    const gfx = graphics();
    const imageUrl = this.config.backgroundImage;

    // Load image first, then create sprite
    const img = new Image();
    img.onload = () => {
      try {
        // Create texture from loaded image
        const texture = gfx.createTexture(img);
        const bgSprite = gfx.createSprite(texture);

        // Scale to cover entire screen
        bgSprite.width = this.config.width;
        bgSprite.height = this.config.height;

        // Insert at back (index 1, after solid color bg at index 0)
        const container = this.container as any;
        if (container.addChildAt) {
          container.addChildAt(bgSprite, 1);
        } else {
          this.container.addChild(bgSprite as any);
        }
      } catch (e) {
        Logger.warn('UI', 'GameLoading: Failed to create background sprite', e);
      }
    };
    img.onerror = (e) => {
      Logger.warn('UI', 'GameLoading: Failed to load background image', e);
    };
    img.src = imageUrl;
  }

  private createLogo(): void {
    const gfx = graphics();
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2 - 60;

    if (this.config.logoEmoji) {
      const emoji = gfx.createText(this.config.logoEmoji, {
        fontSize: 80,
        fill: 0xFFFFFF
      });
      if (emoji.anchor) emoji.anchor.set(0.5);
      emoji.x = centerX;
      emoji.y = centerY;
      this.container.addChild(emoji);
    }

    // Title if provided
    if (this.config.title) {
      const title = gfx.createText(this.config.title, {
        fontSize: 36,
        fill: 0xFFFFFF,
        fontFamily: getFrameworkFontFamily(),
        fontWeight: 'bold'
      });
      if (title.anchor) title.anchor.set(0.5);
      title.x = centerX;
      title.y = centerY + 70;
      this.container.addChild(title);
    }
  }

  private createLoadingText(): void {
    const gfx = graphics();
    const centerX = this.config.width / 2;
    const bottomY = this.config.height - (this.config.showProgress ? 80 : 60);

    // "Loading" text with Pixi UI style (Lilita One font, white with shadow)
    this.loadingText = gfx.createText(this.config.loadingText, {
      fontSize: 24,
      fill: 0xFFFFFF,
      fontFamily: getFrameworkFontFamily(),
      fontWeight: 'bold',
      dropShadow: {
        alpha: 0.4,
        angle: Math.PI / 4,
        blur: 4,
        color: 0x000000,
        distance: 3
      }
    });
    if (this.loadingText.anchor) this.loadingText.anchor.set(0.5);
    this.loadingText.x = centerX;
    this.loadingText.y = bottomY;
    this.container.addChild(this.loadingText);
  }

  private createProgressBar(): void {
    const gfx = graphics();
    const centerX = this.config.width / 2;
    const bottomY = this.config.height - 40;
    const barWidth = Math.min(200, this.config.width - 60);
    const barHeight = 8;

    // Background bar
    this.progressBar = gfx.createGraphics();
    this.progressBar.roundRect(0, 0, barWidth, barHeight, 4);
    this.progressBar.fill({ color: this.config.progressBgColor });
    this.progressBar.x = centerX - barWidth / 2;
    this.progressBar.y = bottomY;
    this.container.addChild(this.progressBar);

    // Fill bar (starts at 0 width)
    this.progressFill = gfx.createGraphics();
    this.progressFill.x = centerX - barWidth / 2;
    this.progressFill.y = bottomY;
    this.container.addChild(this.progressFill);

    // Store bar width for progress updates
    (this.progressFill as any)._maxWidth = barWidth;
    (this.progressFill as any)._barHeight = barHeight;
  }

  /**
   * Set loading progress (0-100)
   */
  setProgress(progress: number): void {
    this.currentProgress = Math.min(100, Math.max(0, progress));

    if (this.progressFill) {
      const maxWidth = (this.progressFill as any)._maxWidth || 200;
      const barHeight = (this.progressFill as any)._barHeight || 8;
      const fillWidth = (this.currentProgress / 100) * maxWidth;

      this.progressFill.clear();
      if (fillWidth > 0) {
        this.progressFill.roundRect(0, 0, fillWidth, barHeight, 4);
        this.progressFill.fill({ color: this.config.progressColor });
      }
    }

    this.emit('progress', this.currentProgress);

    if (this.currentProgress >= 100) {
      this.emit('complete');
    }
  }

  /**
   * Get current progress
   */
  getProgress(): number {
    return this.currentProgress;
  }

  /**
   * Set loading text
   */
  setLoadingText(text: string): void {
    this.config.loadingText = text;
  }

  /**
   * Hide loading screen with fade animation
   */
  async hide(): Promise<void> {
    // Fade out animation
    return new Promise((resolve) => {
      let alpha = 1;
      const fadeOut = () => {
        alpha -= 0.05;
        this.container.alpha = alpha;

        if (alpha <= 0) {
          this.container.visible = false;
          this.emit('hidden');
          resolve();
        } else {
          requestAnimationFrame(fadeOut);
        }
      };
      fadeOut();
    });
  }

  /**
   * Show loading screen
   */
  show(): void {
    this.container.visible = true;
    this.container.alpha = 1;
  }

  /**
   * Get the container for adding to stage
   */
  getContainer(): IContainer {
    return this.container;
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}

export default GameLoading;
