/**
 * Safe Area Layout System
 *
 * Provides a "Safe Area + Letterbox" approach for responsive game layouts.
 * Similar to Candy Crush and other mobile games, this system:
 * - Defines a "design resolution" (e.g., 390x844)
 * - Scales content to fit the screen while maintaining aspect ratio
 * - Centers the game content
 * - Fills letterbox areas with background color/pattern
 */

import { graphics } from '../graphics/GraphicsEngine.js';

/**
 * Configuration for SafeAreaLayout
 */
export interface SafeAreaLayoutConfig {
  /**
   * Design width for the safe area (e.g., 390 for iPhone)
   */
  designWidth: number;

  /**
   * Design height for the safe area (e.g., 844 for iPhone)
   */
  designHeight: number;

  /**
   * Minimum aspect ratio allowed (narrower screens will be letterboxed)
   * Default: 0.4 (e.g., very tall/narrow devices)
   */
  minAspectRatio?: number;

  /**
   * Maximum aspect ratio allowed (wider screens will be pillarboxed)
   * Default: 1.0 (square-ish)
   */
  maxAspectRatio?: number;

  /**
   * Background color for letterbox areas
   * Default: 0x1a1a2e (dark blue)
   */
  backgroundColor?: number;

  /**
   * Whether to show a subtle pattern in letterbox areas
   * Default: false
   */
  showPattern?: boolean;

  /**
   * Opacity of the pattern (0-1)
   * Default: 0.05
   */
  patternOpacity?: number;
}

/**
 * Calculated bounds for the safe area
 */
export interface SafeAreaBounds {
  /**
   * X position of the safe area on screen
   */
  x: number;

  /**
   * Y position of the safe area on screen
   */
  y: number;

  /**
   * Width of the safe area on screen (scaled)
   */
  width: number;

  /**
   * Height of the safe area on screen (scaled)
   */
  height: number;

  /**
   * Scale factor applied to content
   */
  scale: number;

  /**
   * Current screen width
   */
  screenWidth: number;

  /**
   * Current screen height
   */
  screenHeight: number;

  /**
   * Whether letterboxing is vertical (top/bottom bars)
   * If false, letterboxing is horizontal (left/right bars)
   */
  isVerticalLetterbox: boolean;
}

/**
 * SafeAreaLayout
 *
 * Manages responsive game layout using the Safe Area + Letterbox approach.
 * Creates a PIXI container structure that automatically handles:
 * - Scaling to fit the screen
 * - Centering the game content
 * - Drawing letterbox areas
 */
export class SafeAreaLayout {
  private config: Required<SafeAreaLayoutConfig>;
  private currentBounds: SafeAreaBounds;
  private resizeCallbacks: Array<(bounds: SafeAreaBounds) => void> = [];

  // PIXI objects (typed as any to avoid PIXI dependency)
  private PIXI: any = null;
  private mainContainer: any = null;
  private letterboxGraphics: any = null;
  private gameContainer: any = null;
  private resizeHandler: (() => void) | null = null;

  constructor(config: SafeAreaLayoutConfig) {
    this.config = {
      designWidth: config.designWidth,
      designHeight: config.designHeight,
      minAspectRatio: config.minAspectRatio ?? 0.4,
      maxAspectRatio: config.maxAspectRatio ?? 1.0,
      backgroundColor: config.backgroundColor ?? 0x1a1a2e,
      showPattern: config.showPattern ?? false,
      patternOpacity: config.patternOpacity ?? 0.05
    };

    // Initialize with a placeholder bounds
    this.currentBounds = {
      x: 0,
      y: 0,
      width: this.config.designWidth,
      height: this.config.designHeight,
      scale: 1,
      screenWidth: this.config.designWidth,
      screenHeight: this.config.designHeight,
      isVerticalLetterbox: true
    };
  }

  /**
   * Initialize the layout system with PIXI
   * @param PIXI - The PIXI namespace object (kept for backward compatibility)
   */
  initialize(PIXI?: any): void {
    this.PIXI = PIXI;

    // Use graphics abstraction for container creation
    const factory = graphics();

    // Create main container that holds everything
    this.mainContainer = factory.createContainer();

    // Create graphics for letterbox background
    this.letterboxGraphics = factory.createGraphics();
    this.mainContainer.addChild(this.letterboxGraphics);

    // Create game container that will be positioned in the safe area
    this.gameContainer = factory.createContainer();
    this.mainContainer.addChild(this.gameContainer);

    // Set up resize handler
    this.resizeHandler = () => {
      this.updateLayout(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this.resizeHandler);

    // Initial layout
    this.updateLayout(window.innerWidth, window.innerHeight);
  }

  /**
   * Calculate the safe area bounds for given screen dimensions
   */
  calculateBounds(screenWidth: number, screenHeight: number): SafeAreaBounds {
    const designAspect = this.config.designWidth / this.config.designHeight;
    const screenAspect = screenWidth / screenHeight;

    let scale: number;
    let safeWidth: number;
    let safeHeight: number;
    let isVerticalLetterbox: boolean;

    // Determine scaling based on aspect ratio comparison
    if (screenAspect > designAspect) {
      // Screen is wider than design - fit to height, pillarbox (left/right bars)
      scale = screenHeight / this.config.designHeight;
      safeHeight = screenHeight;
      safeWidth = this.config.designWidth * scale;
      isVerticalLetterbox = false;
    } else {
      // Screen is taller than design - fit to width, letterbox (top/bottom bars)
      scale = screenWidth / this.config.designWidth;
      safeWidth = screenWidth;
      safeHeight = this.config.designHeight * scale;
      isVerticalLetterbox = true;
    }

    // Calculate centered position
    const x = (screenWidth - safeWidth) / 2;
    const y = (screenHeight - safeHeight) / 2;

    return {
      x,
      y,
      width: safeWidth,
      height: safeHeight,
      scale,
      screenWidth,
      screenHeight,
      isVerticalLetterbox
    };
  }

  /**
   * Update the layout for new screen dimensions
   */
  updateLayout(screenWidth: number, screenHeight: number): void {
    this.currentBounds = this.calculateBounds(screenWidth, screenHeight);

    // Update game container position and scale
    if (this.gameContainer) {
      this.gameContainer.x = this.currentBounds.x;
      this.gameContainer.y = this.currentBounds.y;
      this.gameContainer.scale.set(this.currentBounds.scale);
    }

    // Redraw letterbox
    this.drawLetterbox();

    // Notify listeners
    this.resizeCallbacks.forEach(callback => callback(this.currentBounds));
  }

  /**
   * Draw the letterbox background with optional pattern
   */
  drawLetterbox(): void {
    if (!this.letterboxGraphics || !this.PIXI) return;

    const g = this.letterboxGraphics;
    const bounds = this.currentBounds;

    g.clear();

    // Fill entire screen with background color
    g.rect(0, 0, bounds.screenWidth, bounds.screenHeight);
    g.fill({ color: this.config.backgroundColor });

    // Draw pattern if enabled
    if (this.config.showPattern) {
      this.drawPattern();
    }

    // Draw a slightly darker overlay on the letterbox areas only
    // This makes the safe area appear slightly brighter/distinct
    const overlayAlpha = 0.1;

    if (bounds.isVerticalLetterbox) {
      // Top and bottom bars
      if (bounds.y > 0) {
        // Top bar
        g.rect(0, 0, bounds.screenWidth, bounds.y);
        g.fill({ color: 0x000000, alpha: overlayAlpha });

        // Bottom bar
        g.rect(0, bounds.y + bounds.height, bounds.screenWidth, bounds.screenHeight - bounds.y - bounds.height);
        g.fill({ color: 0x000000, alpha: overlayAlpha });
      }
    } else {
      // Left and right bars
      if (bounds.x > 0) {
        // Left bar
        g.rect(0, 0, bounds.x, bounds.screenHeight);
        g.fill({ color: 0x000000, alpha: overlayAlpha });

        // Right bar
        g.rect(bounds.x + bounds.width, 0, bounds.screenWidth - bounds.x - bounds.width, bounds.screenHeight);
        g.fill({ color: 0x000000, alpha: overlayAlpha });
      }
    }
  }

  /**
   * Draw a subtle square pattern in the letterbox areas
   */
  drawPattern(): void {
    if (!this.letterboxGraphics) return;

    const g = this.letterboxGraphics;
    const bounds = this.currentBounds;
    const patternSize = 20;
    const squareSize = 4;
    const opacity = this.config.patternOpacity;

    // Helper to draw pattern in a region
    const drawPatternInRegion = (rx: number, ry: number, rw: number, rh: number) => {
      if (rw <= 0 || rh <= 0) return;

      for (let px = rx; px < rx + rw; px += patternSize) {
        for (let py = ry; py < ry + rh; py += patternSize) {
          g.rect(px, py, squareSize, squareSize);
          g.fill({ color: 0xffffff, alpha: opacity });
        }
      }
    };

    if (bounds.isVerticalLetterbox) {
      // Draw pattern in top and bottom bars
      if (bounds.y > 0) {
        drawPatternInRegion(0, 0, bounds.screenWidth, bounds.y);
        drawPatternInRegion(0, bounds.y + bounds.height, bounds.screenWidth, bounds.screenHeight - bounds.y - bounds.height);
      }
    } else {
      // Draw pattern in left and right bars
      if (bounds.x > 0) {
        drawPatternInRegion(0, 0, bounds.x, bounds.screenHeight);
        drawPatternInRegion(bounds.x + bounds.width, 0, bounds.screenWidth - bounds.x - bounds.width, bounds.screenHeight);
      }
    }
  }

  /**
   * Register a callback for resize events
   */
  onResize(callback: (bounds: SafeAreaBounds) => void): void {
    this.resizeCallbacks.push(callback);
  }

  /**
   * Remove a resize callback
   */
  offResize(callback: (bounds: SafeAreaBounds) => void): void {
    const index = this.resizeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.resizeCallbacks.splice(index, 1);
    }
  }

  /**
   * Get the main container (includes letterbox and game container)
   * Add this to your PIXI stage
   */
  getContainer(): any {
    return this.mainContainer;
  }

  /**
   * Get the game container (safe area)
   * Add game content as children of this container
   */
  getGameContainer(): any {
    return this.gameContainer;
  }

  /**
   * Add a child to the game container
   */
  addChild(child: any): any {
    if (this.gameContainer) {
      return this.gameContainer.addChild(child);
    }
    return child;
  }

  /**
   * Remove a child from the game container
   */
  removeChild(child: any): any {
    if (this.gameContainer) {
      return this.gameContainer.removeChild(child);
    }
    return child;
  }

  /**
   * Get current safe area bounds
   */
  getBounds(): SafeAreaBounds {
    return { ...this.currentBounds };
  }

  /**
   * Get design width
   */
  getDesignWidth(): number {
    return this.config.designWidth;
  }

  /**
   * Get design height
   */
  getDesignHeight(): number {
    return this.config.designHeight;
  }

  /**
   * Convert screen coordinates to design coordinates
   * Useful for handling input events
   */
  screenToDesign(screenX: number, screenY: number): { x: number; y: number } {
    const bounds = this.currentBounds;
    return {
      x: (screenX - bounds.x) / bounds.scale,
      y: (screenY - bounds.y) / bounds.scale
    };
  }

  /**
   * Convert design coordinates to screen coordinates
   * Useful for positioning UI elements outside the game container
   */
  designToScreen(designX: number, designY: number): { x: number; y: number } {
    const bounds = this.currentBounds;
    return {
      x: designX * bounds.scale + bounds.x,
      y: designY * bounds.scale + bounds.y
    };
  }

  /**
   * Check if a screen point is within the safe area
   */
  isPointInSafeArea(screenX: number, screenY: number): boolean {
    const bounds = this.currentBounds;
    return (
      screenX >= bounds.x &&
      screenX <= bounds.x + bounds.width &&
      screenY >= bounds.y &&
      screenY <= bounds.y + bounds.height
    );
  }

  /**
   * Get the current scale factor
   */
  getScale(): number {
    return this.currentBounds.scale;
  }

  /**
   * Update background color
   */
  setBackgroundColor(color: number): void {
    this.config.backgroundColor = color;
    this.drawLetterbox();
  }

  /**
   * Toggle pattern visibility
   */
  setShowPattern(show: boolean): void {
    this.config.showPattern = show;
    this.drawLetterbox();
  }

  /**
   * Set pattern opacity
   */
  setPatternOpacity(opacity: number): void {
    this.config.patternOpacity = Math.max(0, Math.min(1, opacity));
    this.drawLetterbox();
  }

  /**
   * Destroy and clean up all resources
   */
  destroy(): void {
    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // Clear callbacks
    this.resizeCallbacks = [];

    // Destroy PIXI objects
    if (this.letterboxGraphics) {
      this.letterboxGraphics.destroy();
      this.letterboxGraphics = null;
    }

    if (this.gameContainer) {
      this.gameContainer.destroy({ children: true });
      this.gameContainer = null;
    }

    if (this.mainContainer) {
      this.mainContainer.destroy({ children: true });
      this.mainContainer = null;
    }

    this.PIXI = null;
  }
}

/**
 * Create a SafeAreaLayout with default configuration
 * Defaults to iPhone-style dimensions (390x844)
 */
export function createSafeAreaLayout(config?: Partial<SafeAreaLayoutConfig>): SafeAreaLayout {
  return new SafeAreaLayout({
    designWidth: config?.designWidth ?? 390,
    designHeight: config?.designHeight ?? 844,
    minAspectRatio: config?.minAspectRatio ?? 0.4,
    maxAspectRatio: config?.maxAspectRatio ?? 1.0,
    backgroundColor: config?.backgroundColor ?? 0x1a1a2e,
    showPattern: config?.showPattern ?? false,
    patternOpacity: config?.patternOpacity ?? 0.05
  });
}
