import { EventEmitter } from 'eventemitter3';
import { IContainer } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';

/**
 * SimpleScreen - A lightweight screen base class for game UI
 *
 * Unlike BaseUIScreen which uses the UIComponent system, SimpleScreen
 * works directly with the graphics abstraction layer (IContainer, IGraphics).
 *
 * This is more suitable for game-style screens that need direct control
 * over rendering and don't need the full UIComponent lifecycle.
 */
export abstract class SimpleScreen extends EventEmitter {
  public readonly screenName: string;

  protected container: IContainer;
  protected _isVisible: boolean = false;
  protected _width: number = 0;
  protected _height: number = 0;

  constructor(screenName: string) {
    super();
    this.screenName = screenName;
    this.container = graphics().createContainer();
    this.container.visible = false;
  }

  /**
   * Initialize the screen with dimensions
   */
  public initialize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this.setup();
    this.emit('initialized');
  }

  /**
   * Abstract: Setup screen content
   */
  protected abstract setup(): void;

  /**
   * Show the screen
   */
  public async show(data?: any): Promise<void> {
    this._isVisible = true;
    this.container.visible = true;
    await this.animateIn();
    this.emit('shown', data);
  }

  /**
   * Hide the screen
   */
  public async hide(): Promise<void> {
    await this.animateOut();
    this._isVisible = false;
    this.container.visible = false;
    this.emit('hidden');
  }

  /**
   * Animate in (can be overridden)
   */
  protected async animateIn(): Promise<void> {
    return new Promise((resolve) => {
      this.container.alpha = 0;
      const startTime = Date.now();
      const duration = 300;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        this.container.alpha = progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Animate out (can be overridden)
   */
  protected async animateOut(): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = 200;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        this.container.alpha = 1 - progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Handle back button (return true if handled)
   */
  public onBackButton(): boolean {
    return false;
  }

  /**
   * Resize the screen
   */
  public resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this.onResize(width, height);
  }

  /**
   * Handle resize (can be overridden)
   */
  protected onResize(_width: number, _height: number): void {
    // Override in subclasses
  }

  /**
   * Get the screen container
   */
  public getContainer(): IContainer {
    return this.container;
  }

  /**
   * Check if visible
   */
  public isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * Get screen dimensions
   */
  public getSize(): { width: number; height: number } {
    return { width: this._width, height: this._height };
  }

  /**
   * Set position
   */
  public setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /**
   * Destroy the screen
   */
  public destroy(): void {
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
