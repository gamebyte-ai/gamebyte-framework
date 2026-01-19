import { EventEmitter } from 'eventemitter3';
import { IContainer } from '../../contracts/Graphics.js';
import { graphics } from '../../graphics/GraphicsEngine.js';
import { SimpleScreen } from '../screens/SimpleScreen.js';
import { animate, Easing, lerp } from '../utils/animation.js';

/**
 * Transition type for screen navigation
 */
export type TransitionType = 'slide' | 'fade' | 'none';

/**
 * Transition direction for slide animations
 */
export type TransitionDirection = 'left' | 'right' | 'up' | 'down';

/**
 * ScreenManager configuration
 */
export interface ScreenManagerConfig {
  container: IContainer;
  width: number;
  height: number;
  defaultTransition?: TransitionType;
  transitionDuration?: number;
}

/**
 * ScreenManager - Stack-based screen navigation with animated transitions
 *
 * Features:
 * - Stack-based navigation (push, pop, replace)
 * - Animated transitions (slide, fade)
 * - Screen lifecycle management
 * - Back button handling
 *
 * @example
 * ```typescript
 * const screenManager = new ScreenManager({
 *   container: stage,
 *   width: 720,
 *   height: 1280
 * });
 *
 * // Push a new screen
 * screenManager.push(new HubScreen());
 *
 * // Pop back
 * screenManager.pop();
 *
 * // Replace current screen
 * screenManager.replace(new GameHUDScreen());
 * ```
 */
export class ScreenManager extends EventEmitter {
  private parentContainer: IContainer;
  private screenStack: SimpleScreen[] = [];
  private screenContainer: IContainer;

  private config: Required<ScreenManagerConfig>;
  private isTransitioning: boolean = false;

  constructor(config: ScreenManagerConfig) {
    super();

    this.config = {
      container: config.container,
      width: config.width,
      height: config.height,
      defaultTransition: config.defaultTransition || 'slide',
      transitionDuration: config.transitionDuration || 300,
    };

    this.parentContainer = config.container;

    // Create screen container
    this.screenContainer = graphics().createContainer();
    this.parentContainer.addChild(this.screenContainer);
  }

  /**
   * Push a new screen onto the stack
   */
  public async push(
    screen: SimpleScreen,
    transition?: TransitionType,
    data?: any
  ): Promise<void> {
    if (this.isTransitioning) {
      console.warn('ScreenManager: Already transitioning, ignoring push');
      return;
    }

    this.isTransitioning = true;
    const transitionType = transition || this.config.defaultTransition;
    const currentScreen = this.getCurrentScreen();

    // Add screen to stack
    this.screenStack.push(screen);

    // Initialize screen
    screen.initialize(this.config.width, this.config.height);
    this.screenContainer.addChild(screen.getContainer());

    // Animate transition
    if (currentScreen && transitionType !== 'none') {
      await this.animateTransition(currentScreen, screen, transitionType, 'in', data);
    } else {
      await screen.show(data);
    }

    this.isTransitioning = false;
    this.emit('screen-pushed', screen);
  }

  /**
   * Pop the current screen from the stack
   */
  public async pop(transition?: TransitionType): Promise<SimpleScreen | null> {
    if (this.isTransitioning) {
      console.warn('ScreenManager: Already transitioning, ignoring pop');
      return null;
    }

    if (this.screenStack.length <= 1) {
      console.warn('ScreenManager: Cannot pop last screen');
      return null;
    }

    this.isTransitioning = true;
    const transitionType = transition || this.config.defaultTransition;

    // Get screens
    const poppedScreen = this.screenStack.pop()!;
    const targetScreen = this.getCurrentScreen()!;

    // Animate transition
    if (transitionType !== 'none') {
      await this.animateTransition(poppedScreen, targetScreen, transitionType, 'out');
    } else {
      await poppedScreen.hide();
      await targetScreen.show();
    }

    // Remove popped screen
    this.screenContainer.removeChild(poppedScreen.getContainer());
    poppedScreen.destroy();

    this.isTransitioning = false;
    this.emit('screen-popped', poppedScreen);

    return poppedScreen;
  }

  /**
   * Replace the current screen with a new one
   */
  public async replace(
    screen: SimpleScreen,
    transition?: TransitionType,
    data?: any
  ): Promise<SimpleScreen | null> {
    if (this.isTransitioning) {
      console.warn('ScreenManager: Already transitioning, ignoring replace');
      return null;
    }

    if (this.screenStack.length === 0) {
      // No current screen, just push
      await this.push(screen, transition, data);
      return null;
    }

    this.isTransitioning = true;
    const transitionType = transition || this.config.defaultTransition;

    // Get current screen
    const replacedScreen = this.screenStack.pop()!;

    // Add new screen
    this.screenStack.push(screen);
    screen.initialize(this.config.width, this.config.height);
    this.screenContainer.addChild(screen.getContainer());

    // Animate transition
    if (transitionType !== 'none') {
      await this.animateTransition(replacedScreen, screen, transitionType, 'in', data);
    } else {
      await replacedScreen.hide();
      await screen.show(data);
    }

    // Remove replaced screen
    this.screenContainer.removeChild(replacedScreen.getContainer());
    replacedScreen.destroy();

    this.isTransitioning = false;
    this.emit('screen-replaced', { old: replacedScreen, new: screen });

    return replacedScreen;
  }

  /**
   * Pop all screens and return to the first screen
   */
  public async popToRoot(transition?: TransitionType): Promise<void> {
    if (this.screenStack.length <= 1) return;

    while (this.screenStack.length > 1) {
      const isLast = this.screenStack.length === 2;
      await this.pop(isLast ? transition : 'none');
    }
  }

  /**
   * Get the current (top) screen
   */
  public getCurrentScreen(): SimpleScreen | null {
    return this.screenStack.length > 0
      ? this.screenStack[this.screenStack.length - 1]
      : null;
  }

  /**
   * Get the number of screens in the stack
   */
  public getScreenCount(): number {
    return this.screenStack.length;
  }

  /**
   * Check if a screen type exists in the stack
   */
  public hasScreen(screenName: string): boolean {
    return this.screenStack.some((s) => s.screenName === screenName);
  }

  /**
   * Handle back button press
   */
  public handleBackButton(): boolean {
    const currentScreen = this.getCurrentScreen();
    if (currentScreen && currentScreen.onBackButton()) {
      return true;
    }

    if (this.screenStack.length > 1) {
      this.pop();
      return true;
    }

    return false;
  }

  /**
   * Set the default transition type
   */
  public setDefaultTransition(transition: TransitionType): void {
    this.config.defaultTransition = transition;
  }

  /**
   * Set the transition duration
   */
  public setTransitionDuration(duration: number): void {
    this.config.transitionDuration = duration;
  }

  /**
   * Animate transition between screens
   */
  private async animateTransition(
    fromScreen: SimpleScreen,
    toScreen: SimpleScreen,
    type: TransitionType,
    direction: 'in' | 'out',
    data?: any
  ): Promise<void> {
    const duration = this.config.transitionDuration;

    switch (type) {
      case 'slide':
        await this.slideTransition(fromScreen, toScreen, direction, duration, data);
        break;

      case 'fade':
        await this.fadeTransition(fromScreen, toScreen, duration, data);
        break;

      default:
        // No animation
        await fromScreen.hide();
        await toScreen.show(data);
    }
  }

  /**
   * Slide transition animation
   */
  private async slideTransition(
    fromScreen: SimpleScreen,
    toScreen: SimpleScreen,
    direction: 'in' | 'out',
    duration: number,
    data?: any
  ): Promise<void> {
    const { width } = this.config;
    const fromContainer = fromScreen.getContainer();
    const toContainer = toScreen.getContainer();

    if (direction === 'in') {
      // New screen slides in from right
      toContainer.x = width;
      toContainer.visible = true;
      toContainer.alpha = 1;

      await Promise.all([
        this.animateX(fromContainer, 0, -width, duration),
        this.animateX(toContainer, width, 0, duration),
      ]);

      fromContainer.visible = false;
      this.emit('transition-complete', { from: fromScreen, to: toScreen });
    } else {
      // New screen reveals from left
      toContainer.x = -width;
      toContainer.visible = true;
      toContainer.alpha = 1;

      await Promise.all([
        this.animateX(fromContainer, 0, width, duration),
        this.animateX(toContainer, -width, 0, duration),
      ]);

      fromContainer.visible = false;
      this.emit('transition-complete', { from: fromScreen, to: toScreen });
    }
  }

  /**
   * Fade transition animation
   */
  private async fadeTransition(
    fromScreen: SimpleScreen,
    toScreen: SimpleScreen,
    duration: number,
    data?: any
  ): Promise<void> {
    const fromContainer = fromScreen.getContainer();
    const toContainer = toScreen.getContainer();

    toContainer.alpha = 0;
    toContainer.visible = true;

    await Promise.all([
      this.animateAlpha(fromContainer, 1, 0, duration),
      this.animateAlpha(toContainer, 0, 1, duration),
    ]);

    fromContainer.visible = false;
    this.emit('transition-complete', { from: fromScreen, to: toScreen });
  }

  /**
   * Animate X position
   */
  private animateX(
    container: IContainer,
    from: number,
    to: number,
    duration: number
  ): Promise<void> {
    container.x = from;
    return animate({
      duration,
      easing: Easing.easeOutCubic,
      onUpdate: (_, eased) => {
        container.x = lerp(from, to, eased);
      },
    });
  }

  /**
   * Animate alpha
   */
  private animateAlpha(
    container: IContainer,
    from: number,
    to: number,
    duration: number
  ): Promise<void> {
    container.alpha = from;
    return animate({
      duration,
      easing: Easing.easeOutCubic,
      onUpdate: (_, eased) => {
        container.alpha = lerp(from, to, eased);
      },
    });
  }

  /**
   * Resize all screens
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    this.screenStack.forEach((screen) => {
      screen.resize(width, height);
    });

    this.emit('resize', { width, height });
  }

  /**
   * Destroy the screen manager
   */
  public destroy(): void {
    // Destroy all screens
    this.screenStack.forEach((screen) => {
      screen.destroy();
    });
    this.screenStack = [];

    this.screenContainer.destroy({ children: true });
    this.removeAllListeners();
  }
}
