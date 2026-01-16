import { BaseScene } from './BaseScene';
import { MergeManager, MergeGameConfig, MergeGameState } from '../merge/MergeManager';
import { MergeGrid } from '../ui/components/merge/MergeGrid';
import { MergeItem } from '../ui/components/merge/MergeItem';
import { graphics } from '../graphics/GraphicsEngine';
import { IContainer, IText, IGraphics } from '../contracts/Graphics';

/**
 * MergeGameScene configuration
 */
export interface MergeGameSceneConfig extends MergeGameConfig {
  /** Scene identifier */
  sceneId?: string;

  /** Scene name */
  sceneName?: string;

  /** Show score UI */
  showScoreUI?: boolean;

  /** Show tier indicator */
  showTierUI?: boolean;

  /** Background color for the scene */
  sceneBackgroundColor?: number;

  /** Center grid automatically */
  autoCenter?: boolean;

  /** Grid offset from center */
  gridOffsetX?: number;
  gridOffsetY?: number;

  /** Score display position */
  scorePosition?: { x: number; y: number };

  /** Callbacks */
  onMerge?: (item: MergeItem, tier: number, score: number) => void;
  onGameOver?: (state: MergeGameState) => void;
  onMaxTier?: (item: MergeItem) => void;
  onScoreChange?: (score: number, delta: number) => void;
}

/**
 * MergeGameScene - Ready-to-use scene for merge puzzle games
 *
 * Provides a complete merge game experience with:
 * - Pre-configured merge grid
 * - Optional score display
 * - Event handling
 * - Game state management
 *
 * @example
 * ```typescript
 * // Simple usage
 * const mergeScene = new MergeGameScene({
 *   rows: 5,
 *   cols: 5,
 *   showScoreUI: true
 * });
 *
 * await sceneManager.add(mergeScene);
 * await sceneManager.switchTo('merge-game');
 *
 * // With callbacks
 * const mergeScene = new MergeGameScene({
 *   rows: 6,
 *   cols: 6,
 *   onMerge: (item, tier, score) => {
 *     playMergeSound(tier);
 *   },
 *   onGameOver: (state) => {
 *     showGameOverModal(state.score);
 *   }
 * });
 * ```
 */
export class MergeGameScene extends BaseScene {
  private mergeManager: MergeManager;
  private sceneConfig: Required<MergeGameSceneConfig>;
  private scoreText: IText | null = null;
  private tierText: IText | null = null;
  private uiContainer: IContainer | null = null;
  private backgroundGraphics: IGraphics | null = null;

  private static readonly DEFAULT_SCENE_CONFIG: Required<Omit<MergeGameSceneConfig, keyof MergeGameConfig>> = {
    sceneId: 'merge-game',
    sceneName: 'Merge Game',
    showScoreUI: true,
    showTierUI: true,
    sceneBackgroundColor: 0x0d0d1a,
    autoCenter: true,
    gridOffsetX: 0,
    gridOffsetY: 50,
    scorePosition: { x: 20, y: 20 },
    onMerge: () => {},
    onGameOver: () => {},
    onMaxTier: () => {},
    onScoreChange: () => {}
  };

  constructor(config: MergeGameSceneConfig = {}) {
    const sceneId = config.sceneId || 'merge-game';
    const sceneName = config.sceneName || 'Merge Game';

    super(sceneId, sceneName);

    // Merge configs
    this.sceneConfig = {
      ...MergeGameScene.DEFAULT_SCENE_CONFIG,
      ...config
    } as Required<MergeGameSceneConfig>;

    // Create merge manager with game config
    this.mergeManager = new MergeManager(config);
  }

  /**
   * Initialize the scene
   */
  async initialize(): Promise<void> {
    await super.initialize();

    // Create background
    this.createBackground();

    // Create merge game
    this.mergeManager.createGame();

    // Add merge grid to scene
    const gridContainer = this.mergeManager.getContainer();
    this.container.addChild(gridContainer as any);

    // Setup UI if enabled
    if (this.sceneConfig.showScoreUI || this.sceneConfig.showTierUI) {
      this.createUI();
    }

    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Activate the scene
   */
  activate(): void {
    super.activate();

    // Auto center if enabled
    if (this.sceneConfig.autoCenter) {
      this.centerGrid();
    }

    // Start the game
    this.mergeManager.start();
  }

  /**
   * Deactivate the scene
   */
  deactivate(): void {
    super.deactivate();
    this.mergeManager.pause();
  }

  /**
   * Update the scene
   */
  update(deltaTime: number): void {
    super.update(deltaTime);

    // Update UI
    this.updateUI();
  }

  /**
   * Destroy the scene
   */
  destroy(): void {
    this.mergeManager.destroy();
    super.destroy();
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Get the merge manager
   */
  getMergeManager(): MergeManager {
    return this.mergeManager;
  }

  /**
   * Get the merge grid
   */
  getGrid(): MergeGrid | null {
    return this.mergeManager.getGrid();
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.mergeManager.getScore();
  }

  /**
   * Get game state
   */
  getState(): MergeGameState {
    return this.mergeManager.getState();
  }

  /**
   * Spawn an item
   */
  spawnItem(tier: number = 1): MergeItem | null {
    return this.mergeManager.spawnItem(tier);
  }

  /**
   * Restart the game
   */
  restart(): void {
    this.mergeManager.reset();
    this.mergeManager.start();
  }

  /**
   * Pause the game
   */
  pauseGame(): void {
    this.mergeManager.pause();
  }

  /**
   * Resume the game
   */
  resumeGame(): void {
    this.mergeManager.resume();
  }

  /**
   * Center the grid in the scene
   */
  centerGrid(): void {
    // Get viewport dimensions from renderer or use defaults
    const width = (this.container as any).width || 800;
    const height = (this.container as any).height || 600;

    this.mergeManager.centerIn(width, height);

    // Apply offset
    const container = this.mergeManager.getContainer();
    container.x += this.sceneConfig.gridOffsetX;
    container.y += this.sceneConfig.gridOffsetY;
  }

  /**
   * Set grid position
   */
  setGridPosition(x: number, y: number): void {
    this.mergeManager.setPosition(x, y);
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Create background
   */
  private createBackground(): void {
    try {
      this.backgroundGraphics = graphics().createGraphics();
      this.backgroundGraphics
        .rect(0, 0, 2000, 2000)
        .fill({ color: this.sceneConfig.sceneBackgroundColor });
      this.container.addChildAt(this.backgroundGraphics as any, 0);
    } catch {
      // Graphics engine might not be initialized
    }
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    try {
      this.uiContainer = graphics().createContainer();
      this.container.addChild(this.uiContainer as any);

      if (this.sceneConfig.showScoreUI) {
        this.scoreText = graphics().createText('Score: 0', {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: 0xFFFFFF
        });
        this.scoreText.x = this.sceneConfig.scorePosition.x;
        this.scoreText.y = this.sceneConfig.scorePosition.y;
        this.uiContainer.addChild(this.scoreText);
      }

      if (this.sceneConfig.showTierUI) {
        this.tierText = graphics().createText('Best Tier: 0', {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: 0xCCCCCC
        });
        this.tierText.x = this.sceneConfig.scorePosition.x;
        this.tierText.y = this.sceneConfig.scorePosition.y + 30;
        this.uiContainer.addChild(this.tierText);
      }
    } catch {
      // Graphics engine might not be initialized
    }
  }

  /**
   * Update UI elements
   */
  private updateUI(): void {
    const state = this.mergeManager.getState();

    if (this.scoreText) {
      this.scoreText.text = `Score: ${state.score.toLocaleString()}`;
    }

    if (this.tierText) {
      this.tierText.text = `Best Tier: ${state.highestTier}`;
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.mergeManager.on('merge', (item, tier, score) => {
      this.sceneConfig.onMerge(item, tier, score);
      this.emit('merge', item, tier, score);
    });

    this.mergeManager.on('game-over', (state) => {
      this.sceneConfig.onGameOver(state);
      this.emit('game-over', state);
    });

    this.mergeManager.on('max-tier', (item) => {
      this.sceneConfig.onMaxTier(item);
      this.emit('max-tier', item);
    });

    this.mergeManager.on('score-changed', (score, delta) => {
      this.sceneConfig.onScoreChange(score, delta);
      this.emit('score-changed', score, delta);
    });
  }
}

export default MergeGameScene;
