/**
 * DesignScaler - Design Resolution Scaling Utility
 *
 * Enables building game worlds at a fixed "design resolution" that automatically
 * scales to fit any screen size while maintaining aspect ratio.
 *
 * This solves the common mobile game problem where elements need to maintain
 * their relative positions and physics behavior across different screen sizes.
 *
 * @example
 * ```typescript
 * // Create scaler with design resolution
 * const scaler = new DesignScaler({
 *   width: 400,
 *   height: 600
 * });
 *
 * // Initialize with current screen size
 * scaler.initialize(window.innerWidth, window.innerHeight);
 *
 * // Add the scaled container to your stage
 * stage.addChild(scaler.getContainer());
 *
 * // Add game elements using design coordinates
 * const platform = createPlatform(100, 400, 120, 20);
 * scaler.addChild(platform);
 *
 * // On window resize
 * window.addEventListener('resize', () => {
 *   scaler.resize(window.innerWidth, window.innerHeight);
 * });
 *
 * // Convert coordinates if needed
 * const designPos = scaler.screenToDesign(touchX, touchY);
 * const screenPos = scaler.designToScreen(playerX, playerY);
 * ```
 */

import { graphics } from '../graphics/GraphicsEngine.js';
import type { IContainer } from '../contracts/Graphics.js';

/**
 * Configuration for DesignScaler
 */
export interface DesignScalerConfig {
  /** Design width (fixed game world width) */
  width: number;
  /** Design height (fixed game world height) */
  height: number;
  /** Scale mode: 'fit' maintains aspect ratio, 'fill' stretches to fill */
  scaleMode?: 'fit' | 'fill';
  /** Alignment when using 'fit' mode */
  align?: 'center' | 'top-left' | 'top-center' | 'bottom-center';
}

/**
 * Point interface for coordinate conversion
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * DesignScaler class for managing design resolution scaling
 */
export class DesignScaler {
  private config: Required<DesignScalerConfig>;
  private container: IContainer;
  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private currentScale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  /**
   * Create a new DesignScaler
   * @param config - Design resolution configuration
   */
  constructor(config: DesignScalerConfig) {
    this.config = {
      width: config.width,
      height: config.height,
      scaleMode: config.scaleMode || 'fit',
      align: config.align || 'center',
    };

    const gfx = graphics();
    this.container = gfx.createContainer();
  }

  /**
   * Initialize the scaler with screen dimensions
   * @param screenWidth - Current screen/canvas width
   * @param screenHeight - Current screen/canvas height
   */
  initialize(screenWidth: number, screenHeight: number): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.updateTransform();
  }

  /**
   * Resize handler - call this when screen size changes
   * @param screenWidth - New screen width
   * @param screenHeight - New screen height
   */
  resize(screenWidth: number, screenHeight: number): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.updateTransform();
  }

  /**
   * Update the container's scale and position
   */
  private updateTransform(): void {
    const { width, height, scaleMode, align } = this.config;

    // Calculate scale factors
    const scaleX = this.screenWidth / width;
    const scaleY = this.screenHeight / height;

    // Determine final scale based on mode
    if (scaleMode === 'fill') {
      // Stretch to fill (may distort)
      this.container.scale.x = scaleX;
      this.container.scale.y = scaleY;
      this.currentScale = Math.min(scaleX, scaleY); // For coordinate conversion
      this.offsetX = 0;
      this.offsetY = 0;
      this.container.x = 0;
      this.container.y = 0;
    } else {
      // Fit mode - maintain aspect ratio
      this.currentScale = Math.min(scaleX, scaleY);
      this.container.scale.x = this.currentScale;
      this.container.scale.y = this.currentScale;

      // Calculate offset based on alignment
      const scaledWidth = width * this.currentScale;
      const scaledHeight = height * this.currentScale;

      switch (align) {
        case 'top-left':
          this.offsetX = 0;
          this.offsetY = 0;
          break;
        case 'top-center':
          this.offsetX = (this.screenWidth - scaledWidth) / 2;
          this.offsetY = 0;
          break;
        case 'bottom-center':
          this.offsetX = (this.screenWidth - scaledWidth) / 2;
          this.offsetY = this.screenHeight - scaledHeight;
          break;
        case 'center':
        default:
          this.offsetX = (this.screenWidth - scaledWidth) / 2;
          this.offsetY = (this.screenHeight - scaledHeight) / 2;
          break;
      }

      this.container.x = this.offsetX;
      this.container.y = this.offsetY;
    }
  }

  /**
   * Get the scaled container to add to your stage
   * @returns The container that holds all scaled game elements
   */
  getContainer(): IContainer {
    return this.container;
  }

  /**
   * Add a child to the scaled container
   * @param child - The display object to add
   */
  addChild(child: any): void {
    this.container.addChild(child);
  }

  /**
   * Remove a child from the scaled container
   * @param child - The display object to remove
   */
  removeChild(child: any): void {
    this.container.removeChild(child);
  }

  /**
   * Remove all children from the scaled container
   */
  removeAllChildren(): void {
    this.container.removeChildren();
  }

  /**
   * Convert screen coordinates to design coordinates
   * Useful for touch/mouse input handling
   * @param screenX - X position in screen space
   * @param screenY - Y position in screen space
   * @returns Position in design space
   */
  screenToDesign(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.offsetX) / this.currentScale,
      y: (screenY - this.offsetY) / this.currentScale,
    };
  }

  /**
   * Convert design coordinates to screen coordinates
   * Useful for positioning UI elements relative to game objects
   * @param designX - X position in design space
   * @param designY - Y position in design space
   * @returns Position in screen space
   */
  designToScreen(designX: number, designY: number): Point {
    return {
      x: designX * this.currentScale + this.offsetX,
      y: designY * this.currentScale + this.offsetY,
    };
  }

  /**
   * Get the current scale factor
   * @returns Current scale multiplier
   */
  getScale(): number {
    return this.currentScale;
  }

  /**
   * Get the design resolution
   * @returns Design width and height
   */
  getDesignSize(): { width: number; height: number } {
    return {
      width: this.config.width,
      height: this.config.height,
    };
  }

  /**
   * Get the current screen size
   * @returns Screen width and height
   */
  getScreenSize(): { width: number; height: number } {
    return {
      width: this.screenWidth,
      height: this.screenHeight,
    };
  }

  /**
   * Get the current offset (for 'fit' mode with centering)
   * @returns X and Y offset
   */
  getOffset(): Point {
    return {
      x: this.offsetX,
      y: this.offsetY,
    };
  }

  /**
   * Check if a screen position is within the game world bounds
   * @param screenX - X position in screen space
   * @param screenY - Y position in screen space
   * @returns True if within bounds
   */
  isInBounds(screenX: number, screenY: number): boolean {
    const design = this.screenToDesign(screenX, screenY);
    return (
      design.x >= 0 &&
      design.x <= this.config.width &&
      design.y >= 0 &&
      design.y <= this.config.height
    );
  }

  /**
   * Destroy the scaler and its container
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}

export default DesignScaler;
