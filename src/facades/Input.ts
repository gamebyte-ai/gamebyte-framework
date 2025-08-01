import { Facade } from './Facade';
import { GameByteInputManager } from '../input/InputManager';
import { GameByteVirtualControlsManager } from '../input/VirtualControlsManager';
import { GameByteInputMappingManager } from '../input/InputMappingManager';
import { GameByteInputPerformanceManager } from '../input/InputPerformanceManager';
import {
  InputContext,
  GameAction,
  InputSettings,
  InputProfile,
  VirtualControlConfig,
  InputMapping,
  InputPerformanceMetrics,
  InputDeviceCapabilities,
  InputHandler,
  DeviceCapabilities
} from '../contracts/Input';
import { Point, Size } from '../contracts/UI';

/**
 * Input facade for convenient static access to input system functionality
 * Provides a clean API for game developers to interact with the input system
 */
export class Input extends Facade {
  /**
   * Get the service key for the facade
   */
  protected static getFacadeAccessor(): string {
    return 'input.manager';
  }

  /**
   * Get the input manager instance
   */
  protected static getInputManager(): GameByteInputManager {
    return this.app!.make<GameByteInputManager>('input.manager');
  }

  /**
   * Get the virtual controls manager instance
   */
  protected static getVirtualControls(): GameByteVirtualControlsManager {
    return this.app!.make<GameByteVirtualControlsManager>('input.virtualControls');
  }

  /**
   * Get the input mapping manager instance
   */
  protected static getInputMapping(): GameByteInputMappingManager {
    return this.app!.make<GameByteInputMappingManager>('input.mapping');
  }

  /**
   * Get the performance manager instance
   */
  protected static getPerformanceManager(): GameByteInputPerformanceManager {
    return this.app!.make<GameByteInputPerformanceManager>('input.performance');
  }

  // === Core Input Management ===

  /**
   * Initialize input system with DOM element
   */
  public static initialize(element: HTMLElement): void {
    try {
      this.getInputManager().initialize(element);
    } catch (error) {
      console.error('Failed to initialize input system:', error);
      throw error;
    }
  }

  /**
   * Set current input context
   */
  public static setContext(context: InputContext): void {
    try {
      this.getInputManager().setContext(context);
    } catch (error) {
      console.warn('Failed to set input context:', error);
    }
  }

  /**
   * Get current input context
   */
  public static getContext(): InputContext {
    try {
      return this.getInputManager().currentContext;
    } catch (error) {
      console.warn('Failed to get input context:', error);
      return 'menu'; // Default fallback
    }
  }

  /**
   * Enable/disable input processing
   */
  public static setEnabled(enabled: boolean): void {
    this.getInputManager().setEnabled(enabled);
  }

  /**
   * Get device capabilities
   */
  public static getDeviceCapabilities(): DeviceCapabilities {
    return this.getInputManager().deviceCapabilities;
  }

  /**
   * Add input handler
   */
  public static addHandler(handler: InputHandler): void {
    this.getInputManager().addHandler(handler);
  }

  /**
   * Remove input handler
   */
  public static removeHandler(handlerName: string): void {
    this.getInputManager().removeHandler(handlerName);
  }

  /**
   * Get input handler by name
   */
  public static getHandler(handlerName: string): InputHandler | null {
    try {
      return this.getInputManager().getHandler(handlerName);
    } catch (error) {
      console.warn('Failed to get input handler:', error);
      return null;
    }
  }

  // === Event Listening ===

  /**
   * Listen for input actions
   */
  public static onAction(action: GameAction, callback: (data: any, source: string) => void): void {
    this.getInputManager().on('action', (receivedAction: GameAction, data: any, source: string) => {
      if (receivedAction === action) {
        callback(data, source);
      }
    });
  }

  /**
   * Listen for any input action
   */
  public static onAnyAction(callback: (action: GameAction, data: any, source: string) => void): void {
    this.getInputManager().on('action', callback);
  }

  /**
   * Listen for context changes
   */
  public static onContextChange(callback: (context: { previous: InputContext; current: InputContext }) => void): void {
    this.getInputManager().on('context-changed', callback);
  }

  /**
   * Listen for raw input events
   */
  public static onRawInput(callback: (event: any) => void): void {
    this.getInputManager().on('raw-input', callback);
  }

  // === Virtual Controls ===

  /**
   * Add virtual control
   */
  public static addVirtualControl(id: string, config: VirtualControlConfig): void {
    const fullConfig = { ...config, id };
    this.getVirtualControls().addControl(fullConfig);
  }

  /**
   * Remove virtual control
   */
  public static removeVirtualControl(id: string): void {
    this.getVirtualControls().removeControl(id);
  }

  /**
   * Update virtual control configuration
   */
  public static updateVirtualControl(id: string, config: Partial<VirtualControlConfig>): void {
    this.getVirtualControls().updateControl(id, config);
  }

  /**
   * Show/hide virtual controls
   */
  public static setVirtualControlsVisible(visible: boolean): void {
    this.getVirtualControls().setVisible(visible);
  }

  /**
   * Enable/disable virtual controls
   */
  public static setVirtualControlsEnabled(enabled: boolean): void {
    this.getVirtualControls().setEnabled(enabled);
  }

  /**
   * Update virtual controls layout for screen size
   */
  public static updateVirtualControlsLayout(screenSize: Size): void {
    this.getVirtualControls().updateLayout(screenSize);
  }

  // === Input Mapping ===

  /**
   * Load input profile
   */
  public static loadInputProfile(profile: InputProfile): void {
    this.getInputMapping().saveProfile(profile);
    this.getInputMapping().loadSavedProfile(profile.id);
  }

  /**
   * Get current input profile
   */
  public static getCurrentInputProfile(): InputProfile | null {
    return this.getInputMapping().getCurrentProfile();
  }

  /**
   * Add input mapping
   */
  public static addInputMapping(mapping: InputMapping): void {
    this.getInputMapping().setMapping(mapping);
  }

  /**
   * Remove input mapping
   */
  public static removeInputMapping(context: InputContext, deviceType: any, trigger: string | number): void {
    const input = `${deviceType}:${trigger}`;
    this.getInputMapping().removeMapping(context, input);
  }

  /**
   * Get available input profiles
   */
  public static getAvailableInputProfiles(): string[] {
    return this.getInputMapping().getAvailableProfiles();
  }

  /**
   * Load saved input profile
   */
  public static loadSavedInputProfile(name: string): boolean {
    return this.getInputMapping().loadSavedProfile(name);
  }

  /**
   * Save current input profile
   */
  public static saveInputProfile(name: string): void {
    const currentProfile = this.getInputMapping().getCurrentProfile();
    if (currentProfile) {
      const profileToSave = { ...currentProfile, name, id: name };
      this.getInputMapping().saveProfile(profileToSave);
    }
  }

  // === Settings & Configuration ===

  /**
   * Configure input settings
   */
  public static configure(settings: Partial<InputSettings>): void {
    this.getInputManager().configure(settings);
  }

  /**
   * Get current input settings
   */
  public static getSettings(): InputSettings {
    return this.getInputManager().getSettings();
  }

  // === Performance Management ===

  /**
   * Get performance metrics
   */
  public static getPerformanceMetrics(): InputPerformanceMetrics {
    return this.getPerformanceManager().getMetrics();
  }

  /**
   * Set performance mode
   */
  public static setPerformanceMode(mode: 'battery' | 'performance' | 'balanced'): void {
    this.getPerformanceManager().setPerformanceMode(mode);
  }

  /**
   * Enable/disable input prediction
   */
  public static enableInputPrediction(enabled: boolean): void {
    this.getPerformanceManager().enablePrediction(enabled);
  }

  /**
   * Optimize for battery life
   */
  public static optimizeForBattery(): void {
    this.getPerformanceManager().optimizeForBattery();
  }

  /**
   * Optimize for performance
   */
  public static optimizeForPerformance(): void {
    this.getPerformanceManager().optimizeForPerformance();
  }

  // === Game-Specific Helpers ===

  /**
   * Quick setup for platformer game controls
   */
  public static setupPlatformerControls(): void {
    this.loadSavedInputProfile('Platformer');
    this.setContext('gameplay');
    
    // Add virtual controls for mobile
    if (this.getDeviceCapabilities().hasTouchScreen && !this.getDeviceCapabilities().hasKeyboard) {
      this.addVirtualControl('movement-joystick', {
        type: 'joystick',
        position: { x: 60, y: window.innerHeight - 140 },
        size: { width: 120, height: 120 },
        visible: true,
        alpha: 0.7,
        deadZone: 0.15,
        returnToCenter: true,
        maxDistance: 50
      } as any);

      this.addVirtualControl('jump-button', {
        type: 'button',
        position: { x: window.innerWidth - 120, y: window.innerHeight - 140 },
        size: { width: 80, height: 80 },
        visible: true,
        alpha: 0.7,
        action: 'jump'
      } as any);
    }
  }

  /**
   * Quick setup for top-down game controls
   */
  public static setupTopDownControls(): void {
    this.loadSavedInputProfile('Top-Down');
    this.setContext('gameplay');
    
    // Add virtual controls for mobile
    if (this.getDeviceCapabilities().hasTouchScreen && !this.getDeviceCapabilities().hasKeyboard) {
      this.addVirtualControl('movement-joystick', {
        type: 'joystick',
        position: { x: 60, y: window.innerHeight - 140 },
        size: { width: 120, height: 120 },
        visible: true,
        alpha: 0.7,
        deadZone: 0.1,
        returnToCenter: true
      } as any);

      this.addVirtualControl('action-button', {
        type: 'button',
        position: { x: window.innerWidth - 120, y: window.innerHeight - 140 },
        size: { width: 80, height: 80 },
        visible: true,
        alpha: 0.7,
        action: 'attack'
      } as any);
    }
  }

  /**
   * Quick setup for menu navigation
   */
  public static setupMenuNavigation(): void {
    this.setContext('menu');
    this.setVirtualControlsVisible(false);
  }

  /**
   * Quick setup for pause menu
   */
  public static setupPauseMenu(): void {
    this.setContext('pause');
    this.setVirtualControlsVisible(false);
  }

  // === Convenience Methods ===

  /**
   * Check if specific action is currently active
   */
  public static isActionActive(action: GameAction): boolean {
    // This would need to be implemented based on current handler states
    // For now, return false as a placeholder
    return false;
  }

  /**
   * Get movement vector from player movement handler
   */
  public static getMovementVector(): Point {
    try {
      const handler = this.getHandler('player-movement');
      if (handler && 'getMovementVector' in handler) {
        return (handler as any).getMovementVector();
      }
    } catch (error) {
      console.warn('Failed to get movement vector:', error);
    }
    return { x: 0, y: 0 };
  }

  /**
   * Check if player is moving
   */
  public static isPlayerMoving(): boolean {
    try {
      const handler = this.getHandler('player-movement');
      if (handler && 'isMoving' in handler) {
        return (handler as any).isMoving();
      }
    } catch (error) {
      console.warn('Failed to check if player is moving:', error);
    }
    return false;
  }

  /**
   * Check if jump is pressed (for platformer games)
   */
  public static isJumpPressed(): boolean {
    try {
      const handler = this.getHandler('platformer-input');
      if (handler && 'isJumpPressed' in handler) {
        return (handler as any).isJumpPressed();
      }
    } catch (error) {
      console.warn('Failed to check if jump is pressed:', error);
    }
    return false;
  }

  /**
   * Check if jump was just pressed this frame (for platformer games)
   */
  public static wasJumpJustPressed(): boolean {
    try {
      const handler = this.getHandler('platformer-input');
      if (handler && 'wasJumpJustPressed' in handler) {
        return (handler as any).wasJumpJustPressed();
      }
    } catch (error) {
      console.warn('Failed to check if jump was just pressed:', error);
    }
    return false;
  }

  /**
   * Get camera pan delta
   */
  public static getCameraPanDelta(): Point {
    try {
      const handler = this.getHandler('camera-input');
      if (handler && 'getPanDelta' in handler) {
        return (handler as any).getPanDelta();
      }
    } catch (error) {
      console.warn('Failed to get camera pan delta:', error);
    }
    return { x: 0, y: 0 };
  }

  /**
   * Get camera zoom delta
   */
  public static getCameraZoomDelta(): number {
    try {
      const handler = this.getHandler('camera-input');
      if (handler && 'getZoomDelta' in handler) {
        return (handler as any).getZoomDelta();
      }
    } catch (error) {
      console.warn('Failed to get camera zoom delta:', error);
    }
    return 0;
  }

  // === Mobile-Specific Helpers ===

  /**
   * Check if device is mobile
   */
  public static isMobile(): boolean {
    const capabilities = this.getDeviceCapabilities();
    return capabilities.hasTouchScreen && !capabilities.hasKeyboard;
  }

  /**
   * Check if device has touch support
   */
  public static hasTouchScreen(): boolean {
    return this.getDeviceCapabilities().hasTouchScreen;
  }

  /**
   * Check if device has gamepad support
   */
  public static hasGamepad(): boolean {
    return this.getDeviceCapabilities().hasGamepad;
  }

  /**
   * Trigger haptic feedback (mobile)
   */
  public static vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // === Debug & Development Helpers ===

  /**
   * Enable debug mode with input visualization
   */
  public static enableDebugMode(): void {
    this.onRawInput((event) => {
      console.log('Input Event:', event);
    });

    this.onAnyAction((action, data, source) => {
      console.log(`Action: ${action} [${source}]`, data);
    });
  }

  /**
   * Get debug information
   */
  public static getDebugInfo() {
    return {
      context: this.getContext(),
      capabilities: this.getDeviceCapabilities(),
      settings: this.getSettings(),
      metrics: this.getPerformanceMetrics(),
      profile: this.getCurrentInputProfile()?.name || 'None'
    };
  }
}