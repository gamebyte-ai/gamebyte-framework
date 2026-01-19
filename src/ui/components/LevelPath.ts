import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { HexagonLevelButton, LevelState } from './HexagonLevelButton';
import { numberToHex } from '../themes/GameStyleUITheme';

/**
 * Level data configuration
 */
export interface LevelData {
  level: number;
  state: LevelState;
  stars?: number;
}

/**
 * LevelPath configuration
 */
export interface LevelPathConfig {
  width: number;
  height: number;
  levels: LevelData[];
  currentLevel?: number;
  hexagonSize?: number;
  spacing?: number;
  pathWidth?: number;
  pathColors?: {
    completed: number;
    active: number;
    inactive: number;
  };
  scrollable?: boolean;
}

/**
 * LevelPath - Vertical level selection path like Candy Crush
 *
 * Features:
 * - Vertical scrolling level path
 * - Rainbow/gradient path trail
 * - Hexagon level buttons along the path
 * - Different states: locked, available, current, completed
 * - Smooth scrolling with touch/drag
 * - Auto-scroll to current level
 *
 * Inspired by: Candy Crush Saga, Homescapes level maps
 *
 * @example
 * ```typescript
 * const levelPath = new LevelPath({
 *   width: 300,
 *   height: 600,
 *   levels: [
 *     { level: 1, state: 'completed', stars: 3 },
 *     { level: 2, state: 'completed', stars: 2 },
 *     { level: 3, state: 'current' },
 *     { level: 4, state: 'available' },
 *     { level: 5, state: 'locked' }
 *   ],
 *   currentLevel: 3
 * });
 *
 * levelPath.on('level-click', (level) => startLevel(level));
 * stage.addChild(levelPath.getContainer());
 * ```
 */
export class LevelPath extends EventEmitter {
  private container: IContainer;
  private scrollContainer: IContainer;
  private pathGraphics: IGraphics;
  private hexagonButtons: Map<number, HexagonLevelButton> = new Map();

  private config: Required<LevelPathConfig>;
  private contentHeight: number = 0;
  private scrollY: number = 0;
  private isDragging: boolean = false;
  private lastDragY: number = 0;
  private velocity: number = 0;

  constructor(config: LevelPathConfig) {
    super();

    this.config = {
      width: config.width,
      height: config.height,
      levels: config.levels,
      currentLevel: config.currentLevel || this.findCurrentLevel(config.levels),
      hexagonSize: config.hexagonSize || 80,
      spacing: config.spacing || 120,
      pathWidth: config.pathWidth || 16,
      pathColors: config.pathColors || {
        completed: 0x4CAF50,
        active: 0xFFD54F,
        inactive: 0x5C6BC0
      },
      scrollable: config.scrollable ?? true
    };

    this.container = graphics().createContainer();
    this.scrollContainer = graphics().createContainer();
    this.pathGraphics = graphics().createGraphics();

    // Set up masking for scroll area
    const mask = graphics().createGraphics();
    mask.rect(0, 0, config.width, config.height);
    mask.fill({ color: 0xFFFFFF });
    this.container.addChild(mask);
    // Cast to any since PIXI containers do support mask but IContainer doesn't declare it
    (this.scrollContainer as any).mask = mask;

    // Build level path
    this.container.addChild(this.scrollContainer);
    this.scrollContainer.addChild(this.pathGraphics);

    this.createLevelPath();
    this.createHexagonButtons();

    // Setup scroll interactivity
    if (this.config.scrollable) {
      this.setupScrolling();
    }

    // Scroll to current level
    this.scrollToLevel(this.config.currentLevel, false);
  }

  /**
   * Find the current (most recent playable) level
   */
  private findCurrentLevel(levels: LevelData[]): number {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (levels[i].state === 'current' || levels[i].state === 'available') {
        return levels[i].level;
      }
    }
    return levels[0]?.level || 1;
  }

  /**
   * Create the path trail
   */
  private createLevelPath(): void {
    const { levels, width, spacing, pathWidth, pathColors, hexagonSize } = this.config;

    this.pathGraphics.clear();

    const centerX = width / 2;
    const startY = hexagonSize;

    // Calculate content height
    this.contentHeight = startY + (levels.length * spacing) + hexagonSize;

    // Create path segments with gradient colors
    for (let i = 0; i < levels.length - 1; i++) {
      const currentLevel = levels[i];
      const y1 = startY + (i * spacing);
      const y2 = startY + ((i + 1) * spacing);

      // Calculate x offset for zigzag pattern
      const x1 = this.getXOffset(i, centerX);
      const x2 = this.getXOffset(i + 1, centerX);

      // Determine path color based on level state
      let pathColor: number;
      if (currentLevel.state === 'completed') {
        pathColor = pathColors.completed;
      } else if (currentLevel.state === 'current') {
        pathColor = pathColors.active;
      } else {
        pathColor = pathColors.inactive;
      }

      // Draw thick path segment
      this.drawPathSegment(x1, y1, x2, y2, pathWidth, pathColor);
    }
  }

  /**
   * Get X offset for zigzag pattern
   */
  private getXOffset(index: number, centerX: number): number {
    // Create subtle zigzag pattern
    const amplitude = this.config.width * 0.15;
    const pattern = index % 4;

    switch (pattern) {
      case 0: return centerX;
      case 1: return centerX + amplitude;
      case 2: return centerX;
      case 3: return centerX - amplitude;
      default: return centerX;
    }
  }

  /**
   * Draw a path segment with rounded ends
   */
  private drawPathSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    color: number
  ): void {
    // Shadow/outline
    this.pathGraphics.moveTo(x1, y1);
    this.pathGraphics.lineTo(x2, y2);
    this.pathGraphics.stroke({ color: 0x1A1A2A, width: width + 6, cap: 'round' });

    // Main path
    this.pathGraphics.moveTo(x1, y1);
    this.pathGraphics.lineTo(x2, y2);
    this.pathGraphics.stroke({ color: color, width: width, cap: 'round' });

    // Highlight
    this.pathGraphics.moveTo(x1, y1 - 2);
    this.pathGraphics.lineTo(x2, y2 - 2);
    this.pathGraphics.stroke({ color: this.lightenColor(color, 0.3), width: width * 0.4, cap: 'round' });
  }

  /**
   * Create hexagon buttons for each level
   */
  private createHexagonButtons(): void {
    const { levels, width, spacing, hexagonSize } = this.config;

    const centerX = width / 2;
    const startY = hexagonSize;

    levels.forEach((levelData, index) => {
      const x = this.getXOffset(index, centerX);
      const y = startY + (index * spacing);

      const hexButton = new HexagonLevelButton({
        level: levelData.level,
        size: hexagonSize,
        state: levelData.state,
        stars: levelData.stars,
        showStars: levelData.state === 'completed'
      });

      hexButton.setPosition(x, y);

      // Handle click events
      hexButton.on('click', ({ level }) => {
        this.emit('level-click', level, levelData);
      });

      this.hexagonButtons.set(levelData.level, hexButton);
      this.scrollContainer.addChild(hexButton.getContainer());
    });
  }

  /**
   * Setup touch/mouse scrolling
   */
  private setupScrolling(): void {
    this.container.eventMode = 'static';

    this.container.on('pointerdown', (e: any) => {
      this.isDragging = true;
      this.lastDragY = e.global.y;
      this.velocity = 0;
    });

    this.container.on('pointermove', (e: any) => {
      if (!this.isDragging) return;

      const deltaY = e.global.y - this.lastDragY;
      this.velocity = deltaY;
      this.scroll(deltaY);
      this.lastDragY = e.global.y;
    });

    this.container.on('pointerup', () => {
      this.isDragging = false;
      // Apply momentum
      this.applyMomentum();
    });

    this.container.on('pointerupoutside', () => {
      this.isDragging = false;
      this.applyMomentum();
    });

    // Mouse wheel support
    this.container.on('wheel', (e: any) => {
      this.scroll(-e.deltaY * 0.5);
    });
  }

  /**
   * Apply momentum scrolling
   */
  private applyMomentum(): void {
    const friction = 0.95;
    const minVelocity = 0.5;

    const animate = () => {
      if (Math.abs(this.velocity) < minVelocity) return;

      this.scroll(this.velocity);
      this.velocity *= friction;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Scroll by delta amount
   */
  private scroll(deltaY: number): void {
    const maxScroll = 0;
    const minScroll = -(this.contentHeight - this.config.height);

    this.scrollY = Math.max(minScroll, Math.min(maxScroll, this.scrollY + deltaY));
    this.scrollContainer.y = this.scrollY;
  }

  /**
   * Scroll to a specific level
   */
  public scrollToLevel(level: number, animate: boolean = true): void {
    const { levels, spacing, hexagonSize, height } = this.config;

    const levelIndex = levels.findIndex(l => l.level === level);
    if (levelIndex === -1) return;

    const targetY = hexagonSize + (levelIndex * spacing);
    const targetScroll = -(targetY - height / 2);

    // Clamp to valid scroll range
    const maxScroll = 0;
    const minScroll = -(this.contentHeight - height);
    const clampedTarget = Math.max(minScroll, Math.min(maxScroll, targetScroll));

    if (animate) {
      this.animateScrollTo(clampedTarget);
    } else {
      this.scrollY = clampedTarget;
      this.scrollContainer.y = this.scrollY;
    }
  }

  /**
   * Animate scroll to position
   */
  private animateScrollTo(targetY: number): void {
    const startY = this.scrollY;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      this.scrollY = startY + (targetY - startY) * eased;
      this.scrollContainer.y = this.scrollY;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Lighten a color
   */
  private lightenColor(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xFF) + Math.floor(255 * amount));
    const g = Math.min(255, ((color >> 8) & 0xFF) + Math.floor(255 * amount));
    const b = Math.min(255, (color & 0xFF) + Math.floor(255 * amount));
    return (r << 16) | (g << 8) | b;
  }

  /**
   * Public API
   */

  public setLevelState(level: number, state: LevelState, stars?: number): this {
    const hexButton = this.hexagonButtons.get(level);
    if (hexButton) {
      hexButton.setState(state);
      if (stars !== undefined) {
        hexButton.setStars(stars);
      }
    }

    // Update path
    const levelData = this.config.levels.find(l => l.level === level);
    if (levelData) {
      levelData.state = state;
      if (stars !== undefined) levelData.stars = stars;
      this.createLevelPath();
    }

    this.emit('level-state-changed', level, state);
    return this;
  }

  public unlockLevel(level: number): this {
    return this.setLevelState(level, 'available');
  }

  public completeLevel(level: number, stars: number = 0): this {
    this.setLevelState(level, 'completed', stars);

    // Unlock next level if it exists and is locked
    const nextLevel = level + 1;
    const nextButton = this.hexagonButtons.get(nextLevel);
    if (nextButton && nextButton.getState() === 'locked') {
      this.setLevelState(nextLevel, 'available');
    }

    return this;
  }

  public setCurrentLevel(level: number): this {
    this.config.currentLevel = level;
    this.scrollToLevel(level);
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

  public destroy(): void {
    this.hexagonButtons.forEach(btn => btn.destroy());
    this.hexagonButtons.clear();
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
