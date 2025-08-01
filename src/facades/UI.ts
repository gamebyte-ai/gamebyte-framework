import { Facade } from './Facade';
import { GameByteUIManager } from '../ui/core/UIManager';
import { UIComponent, UIScreen, UITheme, UIInteractionEvent } from '../contracts/UI';

/**
 * UI facade for static access to the UI system
 */
export class UI extends Facade {
  /**
   * Get the facade accessor
   */
  protected static getFacadeAccessor(): string {
    return 'ui.manager';
  }

  /**
   * Get the UI manager instance
   */
  public static manager(): GameByteUIManager {
    return this.resolveFacadeInstance();
  }

  /**
   * Show a screen
   */
  public static async showScreen(screenName: string, data?: any): Promise<void> {
    return this.callStatic('showScreen', [screenName, data]);
  }

  /**
   * Hide a screen
   */
  public static async hideScreen(screenName: string): Promise<void> {
    return this.callStatic('hideScreen', [screenName]);
  }

  /**
   * Get current screen
   */
  public static getCurrentScreen(): string | null {
    return this.callStatic('getCurrentScreen', []);
  }

  /**
   * Register a screen
   */
  public static registerScreen(screen: UIScreen): void {
    return this.callStatic('registerScreen', [screen]);
  }

  /**
   * Create a component
   */
  public static createComponent<T extends UIComponent>(type: string, config?: any): T {
    return this.callStatic('createComponent', [type, config]);
  }

  /**
   * Register a component factory
   */
  public static registerComponent<T extends UIComponent>(type: string, factory: () => T): void {
    return this.callStatic('registerComponent', [type, factory]);
  }

  /**
   * Handle interaction event
   */
  public static handleInteraction(event: UIInteractionEvent): void {
    return this.callStatic('handleInteraction', [event]);
  }

  /**
   * Request layout update
   */
  public static requestLayout(): void {
    return this.callStatic('requestLayout', []);
  }

  /**
   * Set theme
   */
  public static setTheme(theme: UITheme): void {
    return this.callStatic('setTheme', [theme]);
  }

  /**
   * Get current theme
   */
  public static getTheme(): UITheme {
    return this.callStatic('getTheme', []);
  }

  /**
   * Get root UI component
   */
  public static getRoot(): UIComponent {
    return this.callStatic('root', []);
  }

  /**
   * Handle orientation change
   */
  public static handleOrientationChange(orientation: 'portrait' | 'landscape'): void {
    return this.callStatic('handleOrientationChange', [orientation]);
  }
}

/**
 * Animations facade for static access to the animation system
 */
export class Animations extends Facade {
  /**
   * Get the facade accessor
   */  
  protected static getFacadeAccessor(): string {
    return 'ui.animations';
  }

  /**
   * Animate properties to target values
   */
  public static async to(target: any, properties: any, config: any): Promise<void> {
    return this.callStatic('to', [target, properties, config]);
  }

  /**
   * Animate properties from initial values
   */
  public static async from(target: any, properties: any, config: any): Promise<void> {
    return this.callStatic('from', [target, properties, config]);
  }

  /**
   * Set properties immediately
   */
  public static set(target: any, properties: any): void {
    return this.callStatic('set', [target, properties]);
  }

  /**
   * Create a timeline
   */
  public static createTimeline(): any {
    return this.callStatic('createTimeline', []);
  }

  /**
   * Spring animation
   */
  public static async spring(target: any, properties: any, config: any): Promise<void> {
    return this.callStatic('spring', [target, properties, config]);
  }

  /**
   * Kill all animations for target
   */
  public static killTweensOf(target: any): void {
    return this.callStatic('killTweensOf', [target]);
  }

  /**
   * Pause all animations
   */
  public static pauseAll(): void {
    return this.callStatic('pauseAll', []);
  }

  /**
   * Resume all animations
   */
  public static resumeAll(): void {
    return this.callStatic('resumeAll', []);
  }

  /**
   * Set global time scale
   */
  public static setTimeScale(scale: number): void {
    return this.callStatic('setTimeScale', [scale]);
  }
}

/**
 * Themes facade for static access to the theme system
 */
export class Themes extends Facade {
  /**
   * Get the facade accessor
   */
  protected static getFacadeAccessor(): string {
    return 'ui.themes';
  }

  /**
   * Register a theme
   */
  public static registerTheme(theme: UITheme): void {
    return this.callStatic('registerTheme', [theme]);
  }

  /**
   * Set active theme
   */
  public static setTheme(themeName: string): boolean {
    return this.callStatic('setTheme', [themeName]);
  }

  /**
   * Get current theme
   */
  public static getCurrentTheme(): UITheme {
    return this.callStatic('getCurrentTheme', []);
  }

  /**
   * Get available themes
   */
  public static getAvailableThemes(): string[] {
    return this.callStatic('getAvailableThemes', []);
  }
}