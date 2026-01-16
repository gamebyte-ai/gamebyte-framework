import { EventEmitter } from 'eventemitter3';
import { IContainer, ITexture } from '../contracts/Graphics';
import { graphics } from '../graphics/GraphicsEngine';
import { MergeGrid, MergeGridConfig } from '../ui/components/merge/MergeGrid';
import { MergeCell } from '../ui/components/merge/MergeCell';
import { MergeItem, MergeItemConfig } from '../ui/components/merge/MergeItem';

/**
 * Merge Game Configuration
 *
 * Complete configuration for creating a merge puzzle game
 */
export interface MergeGameConfig {
  /** Grid dimensions */
  rows?: number;
  cols?: number;

  /** Cell dimensions */
  cellWidth?: number;
  cellHeight?: number;

  /** Spacing */
  gap?: number;
  padding?: number;

  /** Visual styling */
  backgroundColor?: number;
  cellBackgroundColor?: number;
  cellBorderColor?: number;

  /** Gameplay settings */
  maxTier?: number;
  autoSpawn?: boolean;
  initialItems?: number;
  initialTier?: number;

  /** Locked cells for progression */
  lockedCells?: Array<[number, number]>;

  /** Custom tier colors */
  tierColors?: number[];

  /** Custom tier textures */
  tierTextures?: Map<number, ITexture>;

  /** Score multiplier per tier */
  scoreMultiplier?: number;

  /** Enable haptic feedback on mobile */
  hapticFeedback?: boolean;

  /** Enable sound effects */
  soundEnabled?: boolean;

  /** Custom merge animation duration (ms) */
  mergeAnimationDuration?: number;

  /** Custom spawn animation duration (ms) */
  spawnAnimationDuration?: number;
}

/**
 * Merge Game State
 */
export interface MergeGameState {
  score: number;
  highestTier: number;
  totalMerges: number;
  itemsSpawned: number;
  isGameOver: boolean;
  isPaused: boolean;
}

/**
 * Events emitted by MergeManager
 */
export interface MergeManagerEvents {
  'game-started': (state: MergeGameState) => void;
  'game-over': (state: MergeGameState) => void;
  'game-paused': (state: MergeGameState) => void;
  'game-resumed': (state: MergeGameState) => void;
  'game-reset': (state: MergeGameState) => void;
  'score-changed': (score: number, delta: number) => void;
  'merge': (resultItem: MergeItem, tier: number, score: number) => void;
  'max-tier': (item: MergeItem) => void;
  'grid-full': () => void;
  'item-spawned': (item: MergeItem) => void;
  'state-changed': (state: MergeGameState) => void;
}

/**
 * MergeManager - Core manager for merge puzzle games
 *
 * Provides high-level API for creating and managing merge games.
 * Handles game state, scoring, and lifecycle.
 *
 * @example
 * ```typescript
 * const manager = new MergeManager();
 * const grid = manager.createGame({
 *   rows: 5,
 *   cols: 5,
 *   maxTier: 10,
 *   initialItems: 3
 * });
 *
 * manager.on('merge', (item, tier, score) => {
 *   console.log(`Merged to tier ${tier}! Score: ${score}`);
 * });
 *
 * manager.start();
 * ```
 */
export class MergeManager extends EventEmitter<MergeManagerEvents> {
  private grid: MergeGrid | null = null;
  private container: IContainer;
  private config: Required<MergeGameConfig>;
  private state: MergeGameState;

  private static readonly DEFAULT_CONFIG: Required<MergeGameConfig> = {
    rows: 5,
    cols: 5,
    cellWidth: 80,
    cellHeight: 80,
    gap: 8,
    padding: 16,
    backgroundColor: 0x1a1a1a,
    cellBackgroundColor: 0x2a2a2a,
    cellBorderColor: 0x444444,
    maxTier: 10,
    autoSpawn: false,
    initialItems: 3,
    initialTier: 1,
    lockedCells: [],
    tierColors: [
      0x9E9E9E,  // Tier 0: Gray
      0x4CAF50,  // Tier 1: Green
      0x2196F3,  // Tier 2: Blue
      0x9C27B0,  // Tier 3: Purple
      0xFF9800,  // Tier 4: Orange
      0xF44336,  // Tier 5: Red
      0xFFEB3B,  // Tier 6: Yellow/Gold
      0x00BCD4,  // Tier 7: Cyan
      0xE91E63,  // Tier 8: Pink
      0x673AB7,  // Tier 9: Deep Purple
      0xFFD700,  // Tier 10+: Gold
    ],
    tierTextures: new Map(),
    scoreMultiplier: 100,
    hapticFeedback: true,
    soundEnabled: true,
    mergeAnimationDuration: 200,
    spawnAnimationDuration: 150
  };

  constructor(config: Partial<MergeGameConfig> = {}) {
    super();

    this.config = { ...MergeManager.DEFAULT_CONFIG, ...config };
    this.container = graphics().createContainer();
    this.state = this.createInitialState();
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Create a new merge game grid
   */
  createGame(config?: Partial<MergeGameConfig>): MergeGrid {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Destroy existing grid if any
    if (this.grid) {
      this.grid.destroy();
    }

    // Create new grid
    this.grid = new MergeGrid({
      rows: this.config.rows,
      cols: this.config.cols,
      cellWidth: this.config.cellWidth,
      cellHeight: this.config.cellHeight,
      gap: this.config.gap,
      padding: this.config.padding,
      backgroundColor: this.config.backgroundColor,
      maxTier: this.config.maxTier,
      autoSpawn: this.config.autoSpawn,
      lockedCells: this.config.lockedCells,
      cellConfig: {
        backgroundColor: this.config.cellBackgroundColor,
        borderColor: this.config.cellBorderColor
      }
    });

    // Setup event handlers
    this.setupGridEvents();

    // Add to container
    this.container.addChild(this.grid.getContainer());

    // Reset state
    this.state = this.createInitialState();

    return this.grid;
  }

  /**
   * Start the game (spawn initial items)
   */
  start(): void {
    if (!this.grid) {
      throw new Error('No game created. Call createGame() first.');
    }

    this.state.isPaused = false;
    this.state.isGameOver = false;

    // Spawn initial items
    for (let i = 0; i < this.config.initialItems; i++) {
      this.spawnItem(this.config.initialTier);
    }

    this.emit('game-started', { ...this.state });
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.state.isPaused = true;
    this.emit('game-paused', { ...this.state });
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.state.isPaused = false;
    this.emit('game-resumed', { ...this.state });
  }

  /**
   * Reset the game
   */
  reset(): void {
    if (this.grid) {
      this.grid.clearAllItems();
    }
    this.state = this.createInitialState();
    this.emit('game-reset', { ...this.state });
  }

  /**
   * Spawn a new item
   */
  spawnItem(tier: number = 1): MergeItem | null {
    if (!this.grid || this.state.isPaused || this.state.isGameOver) {
      return null;
    }

    const item = this.grid.spawnItem({
      tier,
      tierColors: this.config.tierColors,
      textures: this.config.tierTextures,
      maxTier: this.config.maxTier
    });

    if (item) {
      this.state.itemsSpawned++;
      this.emit('item-spawned', item);
      this.emit('state-changed', { ...this.state });
    }

    return item;
  }

  /**
   * Get the grid instance
   */
  getGrid(): MergeGrid | null {
    return this.grid;
  }

  /**
   * Get the container for adding to scene
   */
  getContainer(): IContainer {
    return this.container;
  }

  /**
   * Get current game state
   */
  getState(): MergeGameState {
    return { ...this.state };
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.state.score;
  }

  /**
   * Get highest tier achieved
   */
  getHighestTier(): number {
    return this.state.highestTier;
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.state.isGameOver;
  }

  /**
   * Check if game is paused
   */
  isPaused(): boolean {
    return this.state.isPaused;
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  /**
   * Center in area
   */
  centerIn(width: number, height: number): this {
    if (this.grid) {
      this.grid.centerIn(width, height);
    }
    return this;
  }

  /**
   * Get grid dimensions
   */
  getDimensions(): { width: number; height: number } {
    if (!this.grid) {
      return { width: 0, height: 0 };
    }
    return {
      width: this.grid.width,
      height: this.grid.height
    };
  }

  /**
   * Destroy the manager
   */
  destroy(): void {
    if (this.grid) {
      this.grid.destroy();
      this.grid = null;
    }
    this.container.destroy();
    this.removeAllListeners();
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Create initial game state
   */
  private createInitialState(): MergeGameState {
    return {
      score: 0,
      highestTier: 0,
      totalMerges: 0,
      itemsSpawned: 0,
      isGameOver: false,
      isPaused: false
    };
  }

  /**
   * Setup grid event handlers
   */
  private setupGridEvents(): void {
    if (!this.grid) return;

    this.grid.on('merge-completed', (grid, resultItem, cell) => {
      this.handleMerge(resultItem);
    });

    this.grid.on('max-tier-reached', (grid, item) => {
      this.emit('max-tier', item);
    });

    this.grid.on('grid-full', () => {
      this.handleGridFull();
    });
  }

  /**
   * Handle merge event
   */
  private handleMerge(resultItem: MergeItem): void {
    const tier = resultItem.tier;
    const scoreGain = tier * this.config.scoreMultiplier;

    // Update state
    this.state.totalMerges++;
    this.state.score += scoreGain;

    if (tier > this.state.highestTier) {
      this.state.highestTier = tier;
    }

    // Emit events
    this.emit('score-changed', this.state.score, scoreGain);
    this.emit('merge', resultItem, tier, scoreGain);
    this.emit('state-changed', { ...this.state });

    // Haptic feedback
    if (this.config.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  /**
   * Handle grid full event
   */
  private handleGridFull(): void {
    this.state.isGameOver = true;
    this.emit('grid-full');
    this.emit('game-over', { ...this.state });
  }
}

export default MergeManager;
