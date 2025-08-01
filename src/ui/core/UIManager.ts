import { EventEmitter } from 'eventemitter3';
import { 
  UIManager, 
  UIComponent, 
  UIScreen, 
  UITheme, 
  UIInteractionEvent, 
  DeviceInfo, 
  ScreenOrientation, 
  Size, 
  SafeArea 
} from '../../contracts/UI';
import { BaseUIComponent } from './BaseUIComponent';
import { UIContainer } from '../components/UIContainer';
import { DefaultUITheme } from '../themes/DefaultUITheme';

/**
 * Main UI system manager that handles the entire UI layer
 */
export class GameByteUIManager extends EventEmitter implements UIManager {
  // Core properties
  public readonly root: UIComponent;
  public readonly deviceInfo: DeviceInfo;
  
  // Internal state
  private _screens: Map<string, UIScreen> = new Map();
  private _currentScreen: string | null = null;
  private _theme: UITheme;
  private _canvas: HTMLCanvasElement | null = null;
  private _animationFrameId: number | null = null;
  private _lastTime: number = 0;
  
  // Component registry
  private _componentFactories: Map<string, () => UIComponent> = new Map();
  
  constructor(canvas?: HTMLCanvasElement) {
    super();
    
    this._canvas = canvas || null;
    
    // Initialize device info
    this.deviceInfo = this.detectDeviceInfo();
    
    // Create root container
    this.root = new UIContainer('ui-root');
    this.root.setSize(this.deviceInfo.screenSize.width, this.deviceInfo.screenSize.height);
    this.root.initialize();
    
    // Set default theme
    this._theme = new DefaultUITheme();
    
    // Register default component types
    this.registerDefaultComponents();
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.emit('initialized');
  }

  /**
   * Show a screen by name
   */
  public async showScreen(screenName: string, data?: any): Promise<void> {
    const screen = this._screens.get(screenName);
    if (!screen) {
      throw new Error(`Screen '${screenName}' not found`);
    }

    // Hide current screen if any
    if (this._currentScreen) {
      await this.hideScreen(this._currentScreen);
    }

    // Show new screen
    this.root.addChild(screen);
    await screen.onShow(data);
    this._currentScreen = screenName;

    this.emit('screen-shown', screenName, data);
  }

  /**
   * Hide a screen by name
   */
  public async hideScreen(screenName: string): Promise<void> {
    const screen = this._screens.get(screenName);
    if (!screen) {
      return;
    }

    await screen.onHide();
    screen.removeFromParent();
    
    if (this._currentScreen === screenName) {
      this._currentScreen = null;
    }

    this.emit('screen-hidden', screenName);
  }

  /**
   * Get the current screen name
   */
  public getCurrentScreen(): string | null {
    return this._currentScreen;
  }

  /**
   * Register a screen
   */
  public registerScreen(screen: UIScreen): void {
    this._screens.set(screen.screenName, screen);
    this.emit('screen-registered', screen.screenName);
  }

  /**
   * Unregister a screen
   */
  public unregisterScreen(screenName: string): void {
    const screen = this._screens.get(screenName);
    if (screen) {
      if (this._currentScreen === screenName) {
        this.hideScreen(screenName);
      }
      this._screens.delete(screenName);
      this.emit('screen-unregistered', screenName);
    }
  }

  /**
   * Create a component by type
   */
  public createComponent<T extends UIComponent>(type: string, config?: any): T {
    const factory = this._componentFactories.get(type);
    if (!factory) {
      throw new Error(`Component type '${type}' not registered`);
    }

    const component = factory() as T;
    
    // Apply configuration if provided
    if (config) {
      this.configureComponent(component, config);
    }

    component.initialize();
    return component;
  }

  /**
   * Register a component factory
   */
  public registerComponent<T extends UIComponent>(
    type: string, 
    factory: () => T
  ): void {
    this._componentFactories.set(type, factory);
    this.emit('component-registered', type);
  }

  /**
   * Handle interaction events
   */
  public handleInteraction(event: UIInteractionEvent): void {
    // Find the target component
    const target = this.root.hitTest(event.position);
    
    if (target) {
      event.target = target;
      
      // Emit event on the target
      target.emit(`interaction-${event.type}`, event);
      
      // Handle specific interaction types
      switch (event.type) {
        case 'down':
          target.emit('pointer-down', event);
          break;
        case 'up':
          target.emit('pointer-up', event);
          target.emit('tap', event);
          break;
        case 'move':
          target.emit('pointer-move', event);
          break;
        case 'cancel':
          target.emit('pointer-cancel', event);
          break;
      }
    }
    
    this.emit('interaction', event);
  }

  /**
   * Request a layout update
   */
  public requestLayout(): void {
    this.root.layout();
  }

  /**
   * Update layout immediately
   */
  public updateLayout(): void {
    this.root.layout();
  }

  /**
   * Set the theme
   */
  public setTheme(theme: UITheme): void {
    this._theme = theme;
    this.emit('theme-changed', theme);
  }

  /**
   * Get the current theme
   */
  public getTheme(): UITheme {
    return this._theme;
  }

  /**
   * Update the UI system
   */
  public update(deltaTime: number): void {
    this.root.update(deltaTime);
    this.emit('update', deltaTime);
  }

  /**
   * Render the UI system
   */
  public render(renderer: any): void {
    this.root.render(renderer);
    this.emit('render', renderer);
  }

  /**
   * Destroy the UI system
   */
  public destroy(): void {
    // Stop animation loop
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    // Destroy all screens
    for (const screen of this._screens.values()) {
      screen.destroy();
    }
    this._screens.clear();

    // Destroy root
    this.root.destroy();

    // Clean up event listeners
    this.removeEventListeners();
    this.removeAllListeners();

    this.emit('destroyed');
  }

  /**
   * Handle orientation change
   */
  public handleOrientationChange(orientation: ScreenOrientation): void {
    // Update device info
    (this.deviceInfo as any).orientation = orientation;
    
    // Swap screen dimensions if needed
    if (orientation === 'landscape') {
      const { width, height } = this.deviceInfo.screenSize;
      if (height > width) {
        this.deviceInfo.screenSize.width = height;
        this.deviceInfo.screenSize.height = width;
      }
    } else {
      const { width, height } = this.deviceInfo.screenSize;
      if (width > height) {
        this.deviceInfo.screenSize.width = height;
        this.deviceInfo.screenSize.height = width;
      }
    }

    // Update root size
    this.root.setSize(this.deviceInfo.screenSize.width, this.deviceInfo.screenSize.height);

    // Notify current screen
    if (this._currentScreen) {
      const screen = this._screens.get(this._currentScreen);
      if (screen) {
        screen.onOrientationChange(orientation);
      }
    }

    // Request layout update
    this.requestLayout();

    this.emit('orientation-changed', orientation);
  }

  /**
   * Detect device information
   */
  private detectDeviceInfo(): DeviceInfo {
    const canvas = this._canvas;
    const screenSize: Size = canvas ? 
      { width: canvas.width, height: canvas.height } :
      { width: window.innerWidth, height: window.innerHeight };

    const pixelRatio = window.devicePixelRatio || 1;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detect orientation
    const orientation: ScreenOrientation = screenSize.width > screenSize.height ? 
      'landscape' : 'portrait';

    // Detect safe area (simplified - in a real implementation, you'd use CSS env() variables)
    const safeArea: SafeArea = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    // Detect performance tier (simplified heuristic)
    const performanceTier = this.detectPerformanceTier();

    return {
      screenSize,
      pixelRatio,
      orientation,
      safeArea,
      isTouch,
      performanceTier
    };
  }

  /**
   * Detect device performance tier
   */
  private detectPerformanceTier(): 'low' | 'medium' | 'high' {
    // Simple heuristic based on common indicators
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const pixelRatio = window.devicePixelRatio || 1;

    if (memory >= 8 && cores >= 6 && pixelRatio >= 2) {
      return 'high';
    } else if (memory >= 4 && cores >= 4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Configure a component with the given config object
   */
  private configureComponent(component: UIComponent, config: any): void {
    // Apply basic properties
    if (config.position) {
      component.setPosition(config.position.x, config.position.y);
    }
    if (config.size) {
      component.setSize(config.size.width, config.size.height);
    }
    if (config.visible !== undefined) {
      component.setVisible(config.visible);
    }
    if (config.alpha !== undefined) {
      component.setAlpha(config.alpha);
    }
    if (config.interactive !== undefined) {
      component.interactive = config.interactive;
    }
    if (config.margin) {
      component.setMargin(config.margin);
    }
    if (config.padding) {
      component.setPadding(config.padding);
    }

    // Apply constraints
    if (config.constraints) {
      if (config.constraints.position) {
        component.setPositionConstraint(
          config.constraints.position.x,
          config.constraints.position.y
        );
      }
      if (config.constraints.size) {
        component.setSizeConstraint(
          config.constraints.size.width,
          config.constraints.size.height
        );
      }
    }
  }

  /**
   * Register default component factories
   */
  private registerDefaultComponents(): void {
    // This will be expanded as we create more components
    this.registerComponent('container', () => new (require('../components/UIContainer').UIContainer)());
  }

  /**
   * Setup event listeners for device events
   */
  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize.bind(this));
      window.addEventListener('orientationchange', this.handleOrientationChangeEvent.bind(this));
    }
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize.bind(this));
      window.removeEventListener('orientationchange', this.handleOrientationChangeEvent.bind(this));
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const canvas = this._canvas;
    const newSize: Size = canvas ? 
      { width: canvas.width, height: canvas.height } :
      { width: window.innerWidth, height: window.innerHeight };

    this.deviceInfo.screenSize = newSize;
    this.root.setSize(newSize.width, newSize.height);
    this.requestLayout();

    this.emit('resize', newSize);
  }

  /**
   * Handle orientation change event
   */
  private handleOrientationChangeEvent(): void {
    // Delay to allow browser to update dimensions
    setTimeout(() => {
      const newOrientation = this.deviceInfo.screenSize.width > this.deviceInfo.screenSize.height ? 
        'landscape' : 'portrait';
      this.handleOrientationChange(newOrientation);
    }, 100);
  }
}