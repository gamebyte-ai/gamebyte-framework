import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { GameStyleColors, numberToHex, darkenColor } from '../themes/GameStyleUITheme';

/**
 * Level button state
 */
export type LevelState = 'locked' | 'available' | 'current' | 'completed';

/**
 * Hexagon level button color scheme
 */
export interface HexagonColorScheme {
  fill: number;
  fillBottom?: number; // Optional bottom gradient color (defaults to darker fill)
  border: number;
  highlight: number;
  text: number;
  textStroke: number;
  outerBorder?: number; // Golden outer border for candy crush style
  glow?: number; // Glow color for current level
}

/**
 * HexagonLevelButton configuration
 */
export interface HexagonLevelButtonConfig {
  level: number;
  size?: number;
  state?: LevelState;
  colorScheme?: HexagonColorScheme;
  showStars?: boolean;
  stars?: number; // 0-3 stars
  fontSize?: number;
  fontFamily?: string;
}

/**
 * HexagonLevelButton - Game-style hexagonal level selector
 *
 * Features:
 * - Hexagon shape with multi-layer border
 * - Level number centered
 * - States: locked, available, current, completed
 * - Optional star rating display
 * - 3D depth effect
 * - Press animation
 *
 * Inspired by: Candy Crush, Homescapes level maps
 *
 * @example
 * ```typescript
 * const levelButton = new HexagonLevelButton({
 *   level: 19,
 *   size: 80,
 *   state: 'current'
 * });
 *
 * levelButton.on('click', () => startLevel(19));
 * stage.addChild(levelButton.getContainer());
 * ```
 */
export class HexagonLevelButton extends EventEmitter {
  private container: IContainer;
  private shadowGraphics: IGraphics;
  private borderGraphics: IGraphics;
  private fillGraphics: IGraphics;
  private highlightGraphics: IGraphics;
  private levelText: IText;
  private lockIcon?: IGraphics;
  private starsContainer?: IContainer;
  private glowGraphics?: IGraphics;

  private config: Required<HexagonLevelButtonConfig>;
  private isPressed: boolean = false;

  constructor(config: HexagonLevelButtonConfig) {
    super();

    // Default configuration
    this.config = {
      level: config.level,
      size: config.size || 80,
      state: config.state || 'available',
      colorScheme: config.colorScheme || this.getDefaultColorScheme(config.state || 'available'),
      showStars: config.showStars ?? true,
      stars: config.stars || 0,
      fontSize: config.fontSize || Math.round((config.size || 80) * 0.35),
      fontFamily: config.fontFamily || '"Lilita One", "Arial Black", sans-serif'
    };

    // Create container and graphics layers
    this.container = graphics().createContainer();
    this.shadowGraphics = graphics().createGraphics();
    this.borderGraphics = graphics().createGraphics();
    this.fillGraphics = graphics().createGraphics();
    this.highlightGraphics = graphics().createGraphics();

    // Build layers (z-order)
    this.container.addChild(this.shadowGraphics);
    this.container.addChild(this.borderGraphics);
    this.container.addChild(this.fillGraphics);
    this.container.addChild(this.highlightGraphics);

    // Create level text
    this.levelText = this.createLevelText();
    this.container.addChild(this.levelText);

    // Create lock icon if locked
    if (this.config.state === 'locked') {
      this.createLockIcon();
    }

    // Create stars if enabled and completed
    if (this.config.showStars && this.config.state === 'completed') {
      this.createStars();
    }

    // Create glow for current level
    if (this.config.state === 'current' && this.config.colorScheme.glow) {
      this.createGlow();
    }

    // Initial render
    this.render();

    // Setup interactivity
    this.setupInteractivity();
  }

  /**
   * Get default color scheme based on state
   */
  private getDefaultColorScheme(state: LevelState): HexagonColorScheme {
    switch (state) {
      case 'locked':
        return GameStyleColors.HEXAGON_LOCKED;
      case 'completed':
        return GameStyleColors.HEXAGON_COMPLETED;
      case 'current':
        return GameStyleColors.HEXAGON_CURRENT;
      case 'available':
      default:
        return GameStyleColors.HEXAGON_BLUE;
    }
  }

  /**
   * Create level number text
   */
  private createLevelText(): IText {
    const { level, fontSize, fontFamily, state, colorScheme } = this.config;

    const text = graphics().createText(state === 'locked' ? '' : level.toString(), {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: 'bold',
      fill: colorScheme.text,
      stroke: colorScheme.textStroke,
      strokeThickness: Math.max(2, fontSize / 10),
      dropShadow: true,
      dropShadowAlpha: 0.4,
      dropShadowAngle: Math.PI / 2,
      dropShadowBlur: 2,
      dropShadowColor: 0x000000,
      dropShadowDistance: 2
    });

    if (text.anchor) text.anchor.set(0.5, 0.5);
    text.x = 0;
    text.y = 0;

    return text;
  }

  /**
   * Create lock icon for locked levels
   */
  private createLockIcon(): void {
    const { size } = this.config;
    const iconSize = size * 0.35;

    this.lockIcon = graphics().createGraphics();

    // Lock body
    this.lockIcon.roundRect(-iconSize / 2, -iconSize / 4, iconSize, iconSize * 0.7, 4);
    this.lockIcon.fill({ color: 0xE0E0E0 });
    this.lockIcon.stroke({ color: 0x9E9E9E, width: 2 });

    // Lock shackle (using poly to simulate arc - U shape)
    const shackleR = iconSize * 0.35;
    const shackleY = -iconSize / 4;
    const shacklePoints: number[] = [];
    for (let i = 0; i <= 12; i++) {
      const angle = Math.PI + (Math.PI * i) / 12;
      shacklePoints.push(Math.cos(angle) * shackleR, shackleY + Math.sin(angle) * shackleR);
    }
    this.lockIcon.poly(shacklePoints);
    this.lockIcon.stroke({ color: 0x9E9E9E, width: 4 });

    // Keyhole
    this.lockIcon.circle(0, iconSize * 0.1, iconSize * 0.08);
    this.lockIcon.fill({ color: 0x616161 });

    this.lockIcon.y = 2;
    this.container.addChild(this.lockIcon);
  }

  /**
   * Create star rating display
   */
  private createStars(): void {
    const { size, stars } = this.config;
    this.starsContainer = graphics().createContainer();
    this.starsContainer.y = size / 2 + 8;

    const starSize = size * 0.2;
    const starSpacing = starSize * 1.1;

    for (let i = 0; i < 3; i++) {
      const star = graphics().createGraphics();
      const filled = i < stars;

      this.drawStar(star, (i - 1) * starSpacing, 0, starSize / 2, filled);
      this.starsContainer.addChild(star);
    }

    this.container.addChild(this.starsContainer);
  }

  /**
   * Create glow effect for current level
   */
  private createGlow(): void {
    const { size, colorScheme } = this.config;
    const glowColor = colorScheme.glow || 0x00FFFF;

    this.glowGraphics = graphics().createGraphics();

    // Multiple glow layers for soft effect
    for (let i = 4; i >= 0; i--) {
      const alpha = 0.15 - (i * 0.025);
      const glowSize = size + (i * 25);

      this.glowGraphics.circle(0, 0, glowSize / 2);
      this.glowGraphics.fill({ color: glowColor, alpha: alpha });
    }

    // Add glow behind everything
    this.container.addChild(this.glowGraphics);
    this.container.setChildIndex(this.glowGraphics, 0);
  }

  /**
   * Animate glow pulsing (call from game update loop)
   */
  public updateGlow(time: number): void {
    if (this.glowGraphics) {
      this.glowGraphics.alpha = 0.6 + Math.sin(time * 0.003) * 0.25;
      const glowScale = 0.95 + Math.sin(time * 0.0024) * 0.05;
      this.glowGraphics.scale.x = glowScale;
      this.glowGraphics.scale.y = glowScale;
    }
  }

  /**
   * Draw a 5-pointed star
   */
  private drawStar(g: IGraphics, x: number, y: number, radius: number, filled: boolean): void {
    const points = 5;
    const innerRadius = radius * 0.4;
    const vertices: number[] = [];

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? radius : innerRadius;
      vertices.push(x + Math.cos(angle) * r);
      vertices.push(y + Math.sin(angle) * r);
    }

    g.poly(vertices);
    g.fill({ color: filled ? 0xFFD700 : 0x5A5A5A });
    g.stroke({ color: filled ? 0xCC9900 : 0x404040, width: 1 });
  }

  /**
   * Setup touch/mouse events
   */
  private setupInteractivity(): void {
    const { state } = this.config;

    this.container.eventMode = 'static';
    this.container.cursor = state === 'locked' ? 'default' : 'pointer';

    if (state !== 'locked') {
      this.container.on('pointerdown', this.onPointerDown.bind(this));
      this.container.on('pointerup', this.onPointerUp.bind(this));
      this.container.on('pointerupoutside', this.onPointerUpOutside.bind(this));
    }
  }

  /**
   * Render hexagon graphics
   */
  private render(): void {
    const { size, colorScheme } = this.config;

    // Clear graphics
    this.shadowGraphics.clear();
    this.borderGraphics.clear();
    this.fillGraphics.clear();
    this.highlightGraphics.clear();

    const pressOffset = this.isPressed ? 2 : 0;
    const shadowOffset = this.isPressed ? 2 : 6;
    const borderWidth = colorScheme.outerBorder ? 6 : 4; // Thicker border for candy style

    // Get colors
    const colors = colorScheme;

    // 1. Shadow
    this.drawHexagon(this.shadowGraphics, 0, shadowOffset, size - 4);
    this.shadowGraphics.fill({ color: 0x000000, alpha: 0.4 });

    // 2. Outer border (golden for candy style, dark otherwise)
    if (colors.outerBorder) {
      // Draw darker outer ring first (3D effect)
      this.drawHexagon(this.borderGraphics, 0, pressOffset + 2, size + 4);
      this.borderGraphics.fill({ color: colors.outerBorder });

      // Then golden border
      this.drawHexagon(this.borderGraphics, 0, pressOffset, size);
      this.borderGraphics.fill({ color: colors.border });
    } else {
      this.drawHexagon(this.borderGraphics, 0, pressOffset, size);
      this.borderGraphics.fill({ color: colors.border });
    }

    // 3. Main fill with gradient (top lighter, bottom darker)
    const fillSize = size - borderWidth * 2;
    const fillTop = colors.fill;
    const fillBottom = colors.fillBottom || darkenColor(colors.fill, 0.15);

    // Draw hexagon shape
    this.drawHexagon(this.fillGraphics, 0, pressOffset, fillSize);

    // Create gradient texture for fill
    const textureSize = Math.ceil(fillSize);
    const gradientTexture = graphics().createCanvasTexture(
      textureSize,
      textureSize,
      (ctx: CanvasRenderingContext2D) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, textureSize);
        gradient.addColorStop(0, numberToHex(fillTop));
        gradient.addColorStop(0.35, numberToHex(fillTop));
        gradient.addColorStop(1, numberToHex(fillBottom));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, textureSize, textureSize);
      }
    );

    // Apply texture fill with matrix transform to center it
    try {
      const matrix = {
        a: 1, b: 0, c: 0, d: 1,
        tx: -fillSize / 2,
        ty: pressOffset - fillSize / 2
      };
      this.fillGraphics.fill({ texture: gradientTexture as any, matrix: matrix as any });
    } catch {
      // Fallback to solid color if texture fill not supported
      this.fillGraphics.fill({ color: colors.fill });
    }

    // 3.5 Inner bevel effect for 3D look
    if (colors.outerBorder) {
      // Top inner highlight (subtle white glow)
      this.drawHexagonBevel(
        this.fillGraphics,
        0,
        pressOffset - 3,
        fillSize - 6,
        0xFFFFFF,
        0.25
      );
      // Bottom inner shadow
      this.drawHexagonBevel(
        this.fillGraphics,
        0,
        pressOffset + 3,
        fillSize - 6,
        0x000000,
        0.2
      );
    }

    // 4. Inner highlight (top shine)
    if (!this.isPressed) {
      this.drawHexagonHighlight(
        this.highlightGraphics,
        0,
        pressOffset - 2,
        fillSize - 4,
        colors.highlight
      );
    }

    // Update text position
    this.levelText.y = pressOffset;
    if (this.lockIcon) {
      this.lockIcon.y = pressOffset + 2;
    }
  }

  /**
   * Draw hexagon bevel effect for 3D depth
   */
  private drawHexagonBevel(
    g: IGraphics,
    cx: number,
    cy: number,
    size: number,
    color: number,
    alpha: number
  ): void {
    const vertices: number[] = [];
    const sides = 6;
    const angleOffset = Math.PI / 6;

    // Only draw top portion for highlight, bottom for shadow
    for (let i = 0; i <= 3; i++) {
      const angle = (i * 2 * Math.PI) / sides + angleOffset;
      vertices.push(cx + Math.cos(angle) * (size / 2));
      vertices.push(cy + Math.sin(angle) * (size / 2));
    }

    g.poly(vertices);
    g.fill({ color: color, alpha: alpha });
  }

  /**
   * Draw hexagon path
   */
  private drawHexagon(g: IGraphics, cx: number, cy: number, size: number): void {
    const vertices: number[] = [];
    const sides = 6;
    const angleOffset = Math.PI / 6; // Flat top orientation

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides + angleOffset;
      vertices.push(cx + Math.cos(angle) * (size / 2));
      vertices.push(cy + Math.sin(angle) * (size / 2));
    }

    g.poly(vertices);
  }

  /**
   * Draw hexagon highlight (top portion only)
   */
  private drawHexagonHighlight(
    g: IGraphics,
    cx: number,
    cy: number,
    size: number,
    _color: number
  ): void {
    // Create a highlight that covers top half of hexagon
    const halfSize = size / 2;
    const angleOffset = Math.PI / 6;

    // Get top 4 vertices of hexagon
    const topVertices: number[] = [];
    for (let i = 0; i <= 3; i++) {
      const angle = (i * 2 * Math.PI) / 6 + angleOffset;
      topVertices.push(cx + Math.cos(angle) * halfSize * 0.85);
      topVertices.push(cy + Math.sin(angle) * halfSize * 0.85 - halfSize * 0.1);
    }

    g.poly(topVertices);
    g.fill({ color: 0xFFFFFF, alpha: 0.25 });
  }

  /**
   * Pointer event handlers
   */
  private onPointerDown(event: any): void {
    if (this.config.state === 'locked') return;

    this.isPressed = true;
    this.render();
    this.container.scale.x = 0.95;
    this.container.scale.y = 0.95;

    this.emit('press', { level: this.config.level, event });
  }

  private onPointerUp(event: any): void {
    if (this.config.state === 'locked') return;

    this.isPressed = false;
    this.render();
    this.container.scale.x = 1;
    this.container.scale.y = 1;

    this.emit('click', { level: this.config.level, event });
  }

  private onPointerUpOutside(): void {
    if (this.config.state === 'locked') return;

    this.isPressed = false;
    this.render();
    this.container.scale.x = 1;
    this.container.scale.y = 1;

    this.emit('cancel');
  }

  /**
   * Public API
   */

  public setLevel(level: number): this {
    this.config.level = level;
    if (this.config.state !== 'locked') {
      this.levelText.text = level.toString();
    }
    return this;
  }

  public setState(state: LevelState): this {
    this.config.state = state;
    this.config.colorScheme = this.getDefaultColorScheme(state);

    // Update text visibility and lock icon
    if (state === 'locked') {
      this.levelText.text = '';
      if (!this.lockIcon) {
        this.createLockIcon();
      }
    } else {
      this.levelText.text = this.config.level.toString();
      if (this.lockIcon) {
        this.container.removeChild(this.lockIcon);
        this.lockIcon.destroy();
        this.lockIcon = undefined;
      }
    }

    // Update interactivity
    this.container.cursor = state === 'locked' ? 'default' : 'pointer';

    // Handle glow for current state
    if (state === 'current' && this.config.colorScheme.glow) {
      if (!this.glowGraphics) {
        this.createGlow();
      }
    } else if (this.glowGraphics) {
      this.container.removeChild(this.glowGraphics);
      this.glowGraphics.destroy();
      this.glowGraphics = undefined;
    }

    this.render();
    return this;
  }

  public setStars(stars: number): this {
    this.config.stars = Math.min(3, Math.max(0, stars));

    // Recreate stars if needed
    if (this.starsContainer) {
      this.container.removeChild(this.starsContainer);
      this.starsContainer.destroy({ children: true });
    }

    if (this.config.showStars && this.config.state === 'completed') {
      this.createStars();
    }

    return this;
  }

  public setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  public getLevel(): number {
    return this.config.level;
  }

  public getState(): LevelState {
    return this.config.state;
  }

  public getContainer(): IContainer {
    return this.container;
  }

  public getSize(): number {
    return this.config.size;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
