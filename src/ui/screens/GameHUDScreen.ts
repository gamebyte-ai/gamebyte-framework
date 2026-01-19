import { SimpleScreen } from './SimpleScreen';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleButton } from '../components/GameStyleButton';
import { GameStyleColors } from '../themes/GameStyleUITheme';

/**
 * HUD configuration
 */
export interface GameHUDConfig {
  showScore?: boolean;
  showTimer?: boolean;
  showPauseButton?: boolean;
  showLives?: boolean;
  livesMax?: number;
  showProgress?: boolean;
  progressMax?: number;
}

/**
 * GameHUDScreen configuration
 */
export interface GameHUDScreenConfig {
  hudConfig?: GameHUDConfig;
  backgroundColor?: number;
  onPause?: () => void;
  onResume?: () => void;
}

/**
 * GameHUDScreen - Game screen with HUD overlay
 *
 * Features:
 * - Score display
 * - Timer display
 * - Pause button
 * - Lives/hearts display
 * - Progress bar
 * - Game content area
 * - Pause overlay
 *
 * @example
 * ```typescript
 * const gameScreen = new GameHUDScreen({
 *   hudConfig: {
 *     showScore: true,
 *     showPauseButton: true,
 *     showLives: true,
 *     livesMax: 3
 *   },
 *   onPause: () => showPauseMenu()
 * });
 *
 * // Add game content
 * gameScreen.getGameContainer().addChild(myGame);
 *
 * screenManager.push(gameScreen);
 * ```
 */
export class GameHUDScreen extends SimpleScreen {
  private background: IGraphics;
  private hudContainer: IContainer;
  private gameContainer: IContainer;
  private pauseOverlay?: IContainer;

  private scoreText?: IText;
  private timerText?: IText;
  private pauseButton?: GameStyleButton;
  private livesContainer?: IContainer;
  private progressBar?: IGraphics;

  private config: GameHUDScreenConfig;
  private hudConfig: Required<GameHUDConfig>;

  private _score: number = 0;
  private _time: number = 0;
  private _lives: number = 0;
  private _progress: number = 0;
  private _isPaused: boolean = false;

  // Layout constants
  private readonly HUD_HEIGHT = 60;
  private readonly HUD_PADDING = 15;

  constructor(config: GameHUDScreenConfig = {}) {
    super('GameHUDScreen');

    this.config = config;

    this.hudConfig = {
      showScore: config.hudConfig?.showScore ?? true,
      showTimer: config.hudConfig?.showTimer ?? false,
      showPauseButton: config.hudConfig?.showPauseButton ?? true,
      showLives: config.hudConfig?.showLives ?? false,
      livesMax: config.hudConfig?.livesMax ?? 3,
      showProgress: config.hudConfig?.showProgress ?? false,
      progressMax: config.hudConfig?.progressMax ?? 100,
    };

    const factory = graphics();

    // Create background
    this.background = factory.createGraphics();
    this.container.addChild(this.background);

    // Create game container (where actual game goes)
    this.gameContainer = factory.createContainer();
    this.container.addChild(this.gameContainer);

    // Create HUD container (on top)
    this.hudContainer = factory.createContainer();
    this.container.addChild(this.hudContainer);
  }

  /**
   * Setup the screen
   */
  protected setup(): void {
    const width = this._width;
    const height = this._height;

    // Draw background
    this.drawBackground(width, height);

    // Position game container
    this.gameContainer.y = this.HUD_HEIGHT;

    // Create HUD elements
    this.createHUD(width);
  }

  /**
   * Draw background
   */
  private drawBackground(width: number, height: number): void {
    this.background.clear();
    this.background.rect(0, 0, width, height);
    this.background.fill({ color: this.config.backgroundColor || 0x1a1a2e });
  }

  /**
   * Create HUD elements
   */
  private createHUD(width: number): void {
    const factory = graphics();

    // HUD background
    const hudBg = factory.createGraphics();
    hudBg.rect(0, 0, width, this.HUD_HEIGHT);
    hudBg.fill({ color: 0x000000, alpha: 0.3 });
    this.hudContainer.addChild(hudBg);

    let leftX = this.HUD_PADDING;

    // Score
    if (this.hudConfig.showScore) {
      this.scoreText = factory.createText('Score: 0', {
        fontFamily: '"Fredoka One", "Arial Black", sans-serif',
        fontSize: 22,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      if (this.scoreText.anchor) this.scoreText.anchor.set(0, 0.5);
      this.scoreText.x = leftX;
      this.scoreText.y = this.HUD_HEIGHT / 2;
      this.hudContainer.addChild(this.scoreText);

      leftX += 150;
    }

    // Timer
    if (this.hudConfig.showTimer) {
      this.timerText = factory.createText('0:00', {
        fontFamily: '"Fredoka One", "Arial Black", sans-serif',
        fontSize: 22,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      if (this.timerText.anchor) this.timerText.anchor.set(0.5, 0.5);
      this.timerText.x = width / 2;
      this.timerText.y = this.HUD_HEIGHT / 2;
      this.hudContainer.addChild(this.timerText);
    }

    // Lives (hearts)
    if (this.hudConfig.showLives) {
      this.livesContainer = factory.createContainer();
      this.livesContainer.x = leftX;
      this.livesContainer.y = this.HUD_HEIGHT / 2;
      this.hudContainer.addChild(this.livesContainer);

      this._lives = this.hudConfig.livesMax;
      this.renderLives();
    }

    // Pause button (right side)
    if (this.hudConfig.showPauseButton) {
      this.pauseButton = new GameStyleButton({
        text: '||',
        width: 44,
        height: 44,
        fontSize: 18,
        buttonStyle: 'flat',
        colorScheme: GameStyleColors.BLUE_BUTTON,
      });
      this.pauseButton.setPosition(width - 44 - this.HUD_PADDING, (this.HUD_HEIGHT - 44) / 2);
      this.pauseButton.on('click', () => this.togglePause());
      this.hudContainer.addChild(this.pauseButton.getContainer());
    }

    // Progress bar
    if (this.hudConfig.showProgress) {
      this.progressBar = factory.createGraphics();
      this.progressBar.y = this.HUD_HEIGHT - 6;
      this.hudContainer.addChild(this.progressBar);
      this.renderProgress(width);
    }
  }

  /**
   * Render lives hearts
   */
  private renderLives(): void {
    if (!this.livesContainer) return;

    this.livesContainer.removeChildren();

    const factory = graphics();
    const heartSize = 20;
    const spacing = 5;

    for (let i = 0; i < this.hudConfig.livesMax; i++) {
      const heart = factory.createGraphics();
      const isFilled = i < this._lives;

      this.drawHeart(heart, heartSize, isFilled ? 0xFF4081 : 0x444444);
      heart.x = i * (heartSize + spacing);
      this.livesContainer.addChild(heart);
    }
  }

  /**
   * Draw a heart shape
   */
  private drawHeart(g: IGraphics, size: number, color: number): void {
    const vertices: number[] = [];

    for (let i = 0; i <= 32; i++) {
      const t = (i / 32) * 2 * Math.PI;
      const x = (size / 2) * 0.8 * Math.sin(t) ** 3;
      const y = -(size / 2) * 0.65 * (
        Math.cos(t) -
        0.35 * Math.cos(2 * t) -
        0.14 * Math.cos(3 * t) -
        0.07 * Math.cos(4 * t)
      );
      vertices.push(x, y);
    }

    g.poly(vertices);
    g.fill({ color });
  }

  /**
   * Render progress bar
   */
  private renderProgress(width: number): void {
    if (!this.progressBar) return;

    const barHeight = 6;
    const progress = this._progress / this.hudConfig.progressMax;

    this.progressBar.clear();

    // Background
    this.progressBar.rect(0, 0, width, barHeight);
    this.progressBar.fill({ color: 0x333333 });

    // Progress
    this.progressBar.rect(0, 0, width * progress, barHeight);
    this.progressBar.fill({ color: 0x4CAF50 });
  }

  /**
   * Toggle pause state
   */
  public togglePause(): void {
    if (this._isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Pause the game
   */
  public pause(): void {
    if (this._isPaused) return;

    this._isPaused = true;
    this.showPauseOverlay();
    this.config.onPause?.();
    this.emit('pause');
  }

  /**
   * Resume the game
   */
  public resume(): void {
    if (!this._isPaused) return;

    this._isPaused = false;
    this.hidePauseOverlay();
    this.config.onResume?.();
    this.emit('resume');
  }

  /**
   * Show pause overlay
   */
  private showPauseOverlay(): void {
    if (this.pauseOverlay) return;

    const factory = graphics();
    const width = this._width;
    const height = this._height;

    this.pauseOverlay = factory.createContainer();

    // Dark overlay
    const overlay = factory.createGraphics();
    overlay.rect(0, 0, width, height);
    overlay.fill({ color: 0x000000, alpha: 0.7 });
    this.pauseOverlay.addChild(overlay);

    // Paused text
    const pausedText = factory.createText('PAUSED', {
      fontFamily: '"Fredoka One", "Arial Black", sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 4,
    });
    if (pausedText.anchor) pausedText.anchor.set(0.5, 0.5);
    pausedText.x = width / 2;
    pausedText.y = height / 2 - 60;
    this.pauseOverlay.addChild(pausedText);

    // Resume button
    const resumeBtn = new GameStyleButton({
      text: 'Resume',
      width: 180,
      height: 60,
      fontSize: 24,
      colorScheme: GameStyleColors.GREEN_BUTTON,
    });
    resumeBtn.setPosition(width / 2 - 90, height / 2);
    resumeBtn.on('click', () => this.resume());
    this.pauseOverlay.addChild(resumeBtn.getContainer());

    // Home button
    const homeBtn = new GameStyleButton({
      text: 'Home',
      width: 180,
      height: 60,
      fontSize: 24,
      colorScheme: GameStyleColors.RED_BUTTON,
    });
    homeBtn.setPosition(width / 2 - 90, height / 2 + 80);
    homeBtn.on('click', () => this.emit('home'));
    this.pauseOverlay.addChild(homeBtn.getContainer());

    this.container.addChild(this.pauseOverlay);
  }

  /**
   * Hide pause overlay
   */
  private hidePauseOverlay(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy({ children: true });
      this.pauseOverlay = undefined;
    }
  }

  /**
   * Public API
   */

  /**
   * Get the game container for adding game content
   */
  public getGameContainer(): IContainer {
    return this.gameContainer;
  }

  /**
   * Get game area dimensions
   */
  public getGameAreaSize(): { width: number; height: number } {
    return {
      width: this._width,
      height: this._height - this.HUD_HEIGHT,
    };
  }

  /**
   * Set score
   */
  public setScore(score: number): void {
    this._score = score;
    if (this.scoreText) {
      this.scoreText.text = `Score: ${this.formatNumber(score)}`;
    }
    this.emit('score-changed', score);
  }

  /**
   * Add to score
   */
  public addScore(amount: number): void {
    this.setScore(this._score + amount);
  }

  /**
   * Get current score
   */
  public getScore(): number {
    return this._score;
  }

  /**
   * Set time (in seconds)
   */
  public setTime(seconds: number): void {
    this._time = seconds;
    if (this.timerText) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      this.timerText.text = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Get current time
   */
  public getTime(): number {
    return this._time;
  }

  /**
   * Set lives
   */
  public setLives(lives: number): void {
    this._lives = Math.max(0, Math.min(lives, this.hudConfig.livesMax));
    this.renderLives();
    this.emit('lives-changed', this._lives);
  }

  /**
   * Lose a life
   */
  public loseLife(): void {
    this.setLives(this._lives - 1);
  }

  /**
   * Get current lives
   */
  public getLives(): number {
    return this._lives;
  }

  /**
   * Set progress
   */
  public setProgress(progress: number): void {
    this._progress = Math.max(0, Math.min(progress, this.hudConfig.progressMax));
    this.renderProgress(this._width);
    this.emit('progress-changed', this._progress);
  }

  /**
   * Check if paused
   */
  public isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Format large numbers
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Handle resize
   */
  protected onResize(width: number, height: number): void {
    this.drawBackground(width, height);
  }

  /**
   * Handle back button
   */
  public onBackButton(): boolean {
    if (this._isPaused) {
      this.resume();
      return true;
    }
    this.pause();
    return true;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.pauseButton?.destroy();
    this.hidePauseOverlay();
    super.destroy();
  }
}
