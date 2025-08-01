import { EventEmitter } from 'eventemitter3';
import {
  UINavigationHandler,
  RawInputEvent,
  InputContext,
  GameAction,
  InputHandler
} from '../../contracts/Input';
import { Point } from '../../contracts/UI';

/**
 * UI navigation configuration
 */
interface UINavigationConfig {
  navigationSensitivity: number;
  repeatDelay: number; // Initial delay before repeat
  repeatRate: number; // Rate of repeat after initial delay
  analogDeadZone: number;
  touchNavigationEnabled: boolean;
  gestureNavigationEnabled: boolean;
  focusWrapAround: boolean;
}

/**
 * UI navigation state
 */
interface UINavigationState {
  navigationDirection: Point;
  confirmPressed: boolean;
  cancelPressed: boolean;
  wasConfirmJustPressed: boolean;
  wasCancelJustPressed: boolean;
  lastNavigationTime: number;
  repeatTimer: number | null;
  currentRepeatDirection: Point;
}

/**
 * Specialized input handler for UI navigation
 * Handles menu navigation, focus management, and UI interactions
 */
export class GameByteUINavigationHandler extends EventEmitter implements UINavigationHandler, InputHandler {
  public readonly name: string = 'ui-navigation';
  public readonly priority: number = 95; // High priority for UI
  public readonly supportedContexts: InputContext[] = [
    'menu', 'pause', 'inventory', 'settings', 'dialogue'
  ];

  private active: boolean = false;
  private context: InputContext = 'menu';
  private config: UINavigationConfig;
  private state: UINavigationState;
  
  // Input tracking
  private pressedKeys: Set<string> = new Set();
  private pressedGamepadButtons: Set<number> = new Set();
  
  constructor(config?: Partial<UINavigationConfig>) {
    super();
    
    this.config = {
      navigationSensitivity: 1.0,
      repeatDelay: 500, // 500ms initial delay
      repeatRate: 150, // 150ms between repeats
      analogDeadZone: 0.3,
      touchNavigationEnabled: true,
      gestureNavigationEnabled: true,
      focusWrapAround: true,
      ...config
    };
    
    this.state = {
      navigationDirection: { x: 0, y: 0 },
      confirmPressed: false,
      cancelPressed: false,
      wasConfirmJustPressed: false,
      wasCancelJustPressed: false,
      lastNavigationTime: 0,
      repeatTimer: null,
      currentRepeatDirection: { x: 0, y: 0 }
    };
  }

  /**
   * Process raw input event
   */
  public handleInput(event: RawInputEvent): void {
    if (!this.active) return;

    // Set deviceType for compatibility
    if (!event.deviceType) {
      event.deviceType = event.device;
    }

    // Process different input types
    switch (event.deviceType || event.device) {
      case 'keyboard':
        this.handleKeyboardInput(event);
        break;
        
      case 'mouse':
        this.handleMouseInput(event);
        break;
        
      case 'touch':
        this.handleTouchInput(event);
        break;
        
      case 'gamepad':
        this.handleGamepadInput(event);
        break;
    }

    // Map to game actions
    const action = this.getActionFromInput(event);
    if (action) {
      this.emit('action', action, event);
    }
  }

  /**
   * Get navigation direction
   */
  public getNavigationDirection(): 'up' | 'down' | 'left' | 'right' | null {
    const dir = this.state.navigationDirection;
    if (dir.y < 0) return 'up';
    if (dir.y > 0) return 'down';
    if (dir.x < 0) return 'left';
    if (dir.x > 0) return 'right';
    return null;
  }

  /**
   * Get navigation direction as Point (for internal use)
   */
  public getNavigationDirectionPoint(): Point {
    return { ...this.state.navigationDirection };
  }

  /**
   * Check if confirm action was pressed
   */
  public wasConfirmPressed(): boolean {
    return this.state.wasConfirmJustPressed;
  }

  /**
   * Check if cancel action was pressed
   */
  public wasCancelPressed(): boolean {
    return this.state.wasCancelJustPressed;
  }

  /**
   * Check if confirm is pressed (interface compatibility)
   */
  public isConfirmPressed(): boolean {
    return this.state.confirmPressed;
  }

  /**
   * Check if cancel is pressed (interface compatibility)
   */
  public isCancelPressed(): boolean {
    return this.state.cancelPressed;
  }

  /**
   * Move focus in a direction
   */
  public moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void {
    let dir: Point;
    switch (direction) {
      case 'up': dir = { x: 0, y: -1 }; break;
      case 'down': dir = { x: 0, y: 1 }; break;
      case 'left': dir = { x: -1, y: 0 }; break;
      case 'right': dir = { x: 1, y: 0 }; break;
    }
    this.handleNavigationInput(dir);
    this.emit('focus-move', direction);
  }

  /**
   * Confirm current selection
   */
  public confirmSelection(): void {
    this.state.confirmPressed = true;
    this.state.wasConfirmJustPressed = true;
    this.emit('confirm');
  }

  /**
   * Cancel current selection
   */
  public cancelSelection(): void {
    this.state.cancelPressed = true;
    this.state.wasCancelJustPressed = true;
    this.emit('cancel');
  }

  /**
   * Set repeat delay
   */
  public setRepeatDelay(delay: number): void {
    this.config.repeatDelay = Math.max(0, delay);
  }

  /**
   * Set repeat rate
   */
  public setRepeatRate(rate: number): void {
    this.config.repeatRate = Math.max(50, rate); // Minimum 50ms
  }

  /**
   * Set navigation sensitivity
   */
  public setNavigationSensitivity(sensitivity: number): void {
    this.config.navigationSensitivity = sensitivity;
  }

  /**
   * Check if handler is enabled (InputHandler interface)
   */
  public isEnabled(): boolean {
    return this.active;
  }

  /**
   * Set handler enabled state (InputHandler interface)
   */
  public setEnabled(enabled: boolean): void {
    this.active = enabled;
    if (!enabled) {
      this.resetState();
      this.clearRepeatTimer();
    }
  }

  /**
   * Update handler state
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    // Update navigation based on input
    this.updateNavigationState();
    
    // Handle navigation repeat
    this.updateNavigationRepeat();
    
    // Emit navigation events
    this.emitNavigationEvents();
    
    // Reset frame-specific flags
    this.state.wasConfirmJustPressed = false;
    this.state.wasCancelJustPressed = false;
  }

  /**
   * Check if handler can process this event
   */
  public canHandle(event: RawInputEvent, context: InputContext): boolean {
    return this.active && this.supportedContexts.includes(context);
  }

  /**
   * Activate handler for context
   */
  public activate(context: InputContext): void {
    this.active = true;
    this.context = context;
    this.resetState();
    this.emit('activated', context);
  }

  /**
   * Deactivate handler
   */
  public deactivate(): void {
    this.active = false;
    this.resetState();
    this.clearRepeatTimer();
    this.emit('deactivated');
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.deactivate();
    this.removeAllListeners();
  }

  /**
   * Configure handler settings
   */
  public configure(config: Partial<UINavigationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle keyboard input
   */
  private handleKeyboardInput(event: RawInputEvent): void {
    if (!event.key) return;

    const key = event.key;
    
    if (event.type === 'key-down') {
      this.pressedKeys.add(key);
      
      // Navigation keys
      if (this.isNavigationKey(key)) {
        this.handleNavigationKeyPressed(key);
      }
      
      // Confirm keys
      if (this.isConfirmKey(key)) {
        this.state.confirmPressed = true;
        this.state.wasConfirmJustPressed = true;
      }
      
      // Cancel keys
      if (this.isCancelKey(key)) {
        this.state.cancelPressed = true;
        this.state.wasCancelJustPressed = true;
      }
    } else if (event.type === 'key-up') {
      this.pressedKeys.delete(key);
      
      // Confirm keys
      if (this.isConfirmKey(key)) {
        this.state.confirmPressed = false;
      }
      
      // Cancel keys
      if (this.isCancelKey(key)) {
        this.state.cancelPressed = false;
      }
      
      // Stop navigation repeat when key released
      if (this.isNavigationKey(key)) {
        this.clearRepeatTimer();
      }
    }
  }

  /**
   * Handle mouse input
   */
  private handleMouseInput(event: RawInputEvent): void {
    switch (event.type) {
      case 'down':
        if (event.button === 0) { // Left click
          this.state.confirmPressed = true;
          this.state.wasConfirmJustPressed = true;
        } else if (event.button === 2) { // Right click
          this.state.cancelPressed = true;
          this.state.wasCancelJustPressed = true;
        }
        break;
        
      case 'up':
        if (event.button === 0) {
          this.state.confirmPressed = false;
        } else if (event.button === 2) {
          this.state.cancelPressed = false;
        }
        break;
        
      default:
        // Handle wheel events for navigation
        if (event.delta) {
          if (Math.abs(event.delta.y) > Math.abs(event.delta.x)) {
            // Vertical scrolling
            this.state.navigationDirection.y = event.delta.y > 0 ? 1 : -1;
          } else {
            // Horizontal scrolling
            this.state.navigationDirection.x = event.delta.x > 0 ? 1 : -1;
          }
          this.state.lastNavigationTime = performance.now();
        }
        break;
    }
  }

  /**
   * Handle touch input
   */
  private handleTouchInput(event: RawInputEvent): void {
    if (!this.config.touchNavigationEnabled) return;

    switch (event.type) {
      case 'down':
        this.state.confirmPressed = true;
        this.state.wasConfirmJustPressed = true;
        break;
        
      case 'up':
        this.state.confirmPressed = false;
        break;
    }
    
    // Touch gestures would be handled here if gestureNavigationEnabled
    if (this.config.gestureNavigationEnabled) {
      // Swipe gestures for navigation would be implemented here
    }
  }

  /**
   * Handle gamepad input
   */
  private handleGamepadInput(event: RawInputEvent): void {
    if (event.type === 'gamepad-button-down' || event.type === 'gamepad-button-up') {
      const button = event.gamepadButton;
      const pressed = event.type === 'gamepad-button-down';
      
      if (pressed && !this.pressedGamepadButtons.has(button!)) {
        this.pressedGamepadButtons.add(button!);
        
        // D-pad navigation
        if (button === 12) { // D-pad up
          this.handleNavigationInput({ x: 0, y: -1 });
        } else if (button === 13) { // D-pad down
          this.handleNavigationInput({ x: 0, y: 1 });
        } else if (button === 14) { // D-pad left
          this.handleNavigationInput({ x: -1, y: 0 });
        } else if (button === 15) { // D-pad right
          this.handleNavigationInput({ x: 1, y: 0 });
        }
        
        // Action buttons
        if (button === 0) { // A button
          this.state.confirmPressed = true;
          this.state.wasConfirmJustPressed = true;
        } else if (button === 1) { // B button
          this.state.cancelPressed = true;
          this.state.wasCancelJustPressed = true;
        }
      } else if (!pressed) {
        this.pressedGamepadButtons.delete(button!);
        
        if (button === 0) {
          this.state.confirmPressed = false;
        } else if (button === 1) {
          this.state.cancelPressed = false;
        }
        
        // Clear repeat for D-pad
        if (button! >= 12 && button! <= 15) {
          this.clearRepeatTimer();
        }
      }
    } else if (event.type === 'gamepad-axis') {
      const axis = event.gamepadAxis;
      const value = event.axisValue || 0;
      
      // Left stick navigation
      if (axis === 0) { // Left stick X
        if (Math.abs(value) > this.config.analogDeadZone) {
          this.state.navigationDirection.x = value > 0 ? 1 : -1;
        } else {
          this.state.navigationDirection.x = 0;
        }
      } else if (axis === 1) { // Left stick Y
        if (Math.abs(value) > this.config.analogDeadZone) {
          this.state.navigationDirection.y = value > 0 ? 1 : -1;
        } else {
          this.state.navigationDirection.y = 0;
        }
      }
    }
  }

  /**
   * Handle navigation key pressed
   */
  private handleNavigationKeyPressed(key: string): void {
    let direction: Point = { x: 0, y: 0 };
    
    switch (key) {
      case 'ArrowUp':
        direction = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
        direction = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
        direction = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
        direction = { x: 1, y: 0 };
        break;
      case 'Tab':
        direction = { x: 1, y: 0 }; // Tab moves to next element
        break;
    }
    
    this.handleNavigationInput(direction);
  }

  /**
   * Handle navigation input
   */
  private handleNavigationInput(direction: Point): void {
    this.state.navigationDirection = { ...direction };
    this.state.lastNavigationTime = performance.now();
    
    // Setup repeat timer
    this.setupNavigationRepeat(direction);
  }

  /**
   * Update navigation state
   */
  private updateNavigationState(): void {
    // Clear navigation direction if no recent input
    const timeSinceLastNavigation = performance.now() - this.state.lastNavigationTime;
    if (timeSinceLastNavigation > 100) { // 100ms timeout
      if (!this.state.repeatTimer) {
        this.state.navigationDirection = { x: 0, y: 0 };
      }
    }
  }

  /**
   * Update navigation repeat
   */
  private updateNavigationRepeat(): void {
    // Navigation repeat is handled by the repeat timer
  }

  /**
   * Setup navigation repeat
   */
  private setupNavigationRepeat(direction: Point): void {
    this.clearRepeatTimer();
    
    this.state.currentRepeatDirection = { ...direction };
    
    // Initial delay before repeat starts
    this.state.repeatTimer = window.setTimeout(() => {
      // Start repeating
      const repeatInterval = window.setInterval(() => {
        if (this.active) {
          this.state.navigationDirection = { ...this.state.currentRepeatDirection };
          this.state.lastNavigationTime = performance.now();
          this.emit('navigation-repeat', this.state.currentRepeatDirection);
        } else {
          clearInterval(repeatInterval);
        }
      }, this.config.repeatRate);
      
      // Store interval ID in repeatTimer
      this.state.repeatTimer = repeatInterval;
    }, this.config.repeatDelay);
  }

  /**
   * Clear navigation repeat timer
   */
  private clearRepeatTimer(): void {
    if (this.state.repeatTimer !== null) {
      window.clearTimeout(this.state.repeatTimer);
      window.clearInterval(this.state.repeatTimer);
      this.state.repeatTimer = null;
    }
    this.state.currentRepeatDirection = { x: 0, y: 0 };
  }

  /**
   * Emit navigation events
   */
  private emitNavigationEvents(): void {
    if (this.state.navigationDirection.x !== 0 || this.state.navigationDirection.y !== 0) {
      this.emit('navigation', this.state.navigationDirection);
    }
    
    if (this.state.wasConfirmJustPressed) {
      this.emit('confirm');
    }
    
    if (this.state.wasCancelJustPressed) {
      this.emit('cancel');
    }
  }

  /**
   * Check if key is a navigation key
   */
  private isNavigationKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key);
  }

  /**
   * Check if key is a confirm key
   */
  private isConfirmKey(key: string): boolean {
    return ['Enter', 'Space'].includes(key);
  }

  /**
   * Check if key is a cancel key
   */
  private isCancelKey(key: string): boolean {
    return ['Escape', 'Backspace'].includes(key);
  }

  /**
   * Get action from input event
   */
  private getActionFromInput(event: RawInputEvent): GameAction | null {
    if (event.deviceType === 'keyboard' && event.key && event.type === 'key-down') {
      if (this.isConfirmKey(event.key)) {
        return 'ui-confirm';
      }
      if (this.isCancelKey(event.key)) {
        return 'ui-cancel';
      }
      if (this.isNavigationKey(event.key)) {
        return 'ui-navigate';
      }
    }
    
    if (event.deviceType === 'mouse' && event.type === 'down') {
      if (event.button === 0) {
        return 'ui-confirm';
      }
      if (event.button === 2) {
        return 'ui-cancel';
      }
    }
    
    return null;
  }

  /**
   * Reset handler state
   */
  private resetState(): void {
    this.state = {
      navigationDirection: { x: 0, y: 0 },
      confirmPressed: false,
      cancelPressed: false,
      wasConfirmJustPressed: false,
      wasCancelJustPressed: false,
      lastNavigationTime: 0,
      repeatTimer: null,
      currentRepeatDirection: { x: 0, y: 0 }
    };
    
    this.pressedKeys.clear();
    this.pressedGamepadButtons.clear();
  }
}