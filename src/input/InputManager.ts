import { EventEmitter } from 'eventemitter3';
import { Point } from '../contracts/UI';
import {
  InputManager,
  InputContext,
  GameAction,
  RawInputEvent,
  ProcessedInputEvent,
  DeviceCapabilities,
  InputPerformanceMetrics,
  VirtualControlConfig,
  InputProfile,
  InputDevice,
  InputEventType,
  InputSettings,
  InputHandler
} from '../contracts/Input';
import { GameByteTouchInputHandler } from './TouchInputHandler';
import { GameByteVirtualControlsManager } from './VirtualControlsManager';
import { GameByteInputMappingManager } from './InputMappingManager';
import { GameByteInputPerformanceManager } from './InputPerformanceManager';
import { DeviceDetector } from '../performance/DeviceDetector';

/**
 * Main input manager for the GameByte Framework
 * Provides unified input handling for touch, mouse, keyboard, and gamepad inputs
 */
export class GameByteInputManager extends EventEmitter implements InputManager {
  private _isInitialized: boolean = false;
  private _currentContext: InputContext = 'menu';
  private _contextStack: InputContext[] = [];
  private _deviceCapabilities: DeviceCapabilities;
  private _performanceMetrics: InputPerformanceMetrics;
  
  // Core handlers
  private touchHandler: GameByteTouchInputHandler;
  private virtualControls: GameByteVirtualControlsManager;
  private mappingManager: GameByteInputMappingManager;
  private performanceManager: GameByteInputPerformanceManager;
  
  // Input state
  private element: HTMLElement | null = null;
  private actionCallbacks: Map<GameAction, Set<(event: ProcessedInputEvent) => void>> = new Map();
  private currentActions: Map<GameAction, boolean> = new Map();
  private previousActions: Map<GameAction, boolean> = new Map();
  private actionValues: Map<GameAction, number> = new Map();
  private enabled: boolean = true;
  private inputHandlers: Map<string, InputHandler> = new Map();
  private settings: InputSettings = {
    touchEnabled: true,
    mouseEnabled: true,
    keyboardEnabled: true,
    gamepadEnabled: true,
    sensitivity: 1.0,
    deadZone: 0.1
  };
  
  // Input queuing for performance
  private inputQueue: RawInputEvent[] = [];
  private maxQueueSize: number = 100;
  private processingInputs: boolean = false;
  
  // Debug mode
  private debugMode: boolean = false;
  private debugOverlay: HTMLElement | null = null;

  // Bound event handlers (stored for proper cleanup)
  private boundPointerHandler: (e: PointerEvent) => void;
  private boundKeydownHandler: (e: KeyboardEvent) => void;
  private boundKeyupHandler: (e: KeyboardEvent) => void;
  private boundGamepadConnectedHandler: (e: GamepadEvent) => void;
  private boundGamepadDisconnectedHandler: (e: GamepadEvent) => void;
  private boundContextMenuHandler: (e: Event) => void;

  constructor() {
    super();

    // Initialize device capabilities
    this._deviceCapabilities = this.detectDeviceCapabilities();

    // Initialize performance metrics
    this._performanceMetrics = {
      averageLatency: 0,
      inputEventCount: 0,
      gestureRecognitionTime: 0,
      memoryUsage: 0,
      droppedInputs: 0,
      frameRate: 60,
      batteryImpact: 'low'
    };

    // Create handlers
    this.touchHandler = new GameByteTouchInputHandler();
    this.virtualControls = new GameByteVirtualControlsManager();
    this.mappingManager = new GameByteInputMappingManager();
    this.performanceManager = new GameByteInputPerformanceManager();

    // Bind event handlers once (prevents memory leak from creating new bindings)
    this.boundPointerHandler = this.handlePointerEvent.bind(this);
    this.boundKeydownHandler = this.handleKeyboardEvent.bind(this);
    this.boundKeyupHandler = this.handleKeyboardEvent.bind(this);
    this.boundGamepadConnectedHandler = this.handleGamepadEvent.bind(this);
    this.boundGamepadDisconnectedHandler = this.handleGamepadEvent.bind(this);
    this.boundContextMenuHandler = this.preventDefault.bind(this);

    // Setup handler event forwarding
    this.setupHandlerEvents();
  }

  // Getters for readonly properties
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get currentContext(): InputContext {
    return this._currentContext;
  }

  get deviceCapabilities(): DeviceCapabilities {
    return { ...this._deviceCapabilities };
  }

  get performanceMetrics(): InputPerformanceMetrics {
    return { ...this._performanceMetrics };
  }

  /**
   * Initialize the input manager with optional DOM element
   */
  async initialize(element?: HTMLElement): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    // Use provided element or default to document.body
    this.element = element || document.body;
    
    if (!this.element) {
      throw new Error('InputManager: No valid DOM element provided for input capture');
    }

    // Initialize handlers
    await this.touchHandler.initialize(this.element);
    await this.virtualControls.initialize(this.element);
    await this.performanceManager.initialize();
    
    // Setup DOM event listeners
    this.setupEventListeners();
    
    // Start performance monitoring
    this.performanceManager.startMonitoring();
    
    // Setup update loop
    this.setupUpdateLoop();
    
    // Apply device-specific optimizations
    this.optimizeForDevice();
    
    this._isInitialized = true;
    this.emit('initialized', this._deviceCapabilities);
  }

  /**
   * Enable or disable input processing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      // Clear current actions when disabled
      this.currentActions.clear();
      this.previousActions.clear();
    }
  }

  /**
   * Add input handler
   */
  addHandler(handler: InputHandler): void {
    // Use a name based on the handler's constructor name or a provided name
    const handlerName = handler.constructor.name || `handler-${this.inputHandlers.size}`;
    this.inputHandlers.set(handlerName, handler);
  }

  /**
   * Remove input handler by name
   */
  removeHandler(handlerName: string): void {
    this.inputHandlers.delete(handlerName);
  }

  /**
   * Get input handler by name
   */
  getHandler(handlerName: string): InputHandler | null {
    return this.inputHandlers.get(handlerName) || null;
  }

  /**
   * Configure input settings
   */
  configure(settings: Partial<InputSettings>): void {
    Object.assign(this.settings, settings);
    
    // Apply settings immediately if initialized
    if (this._isInitialized) {
      this.applySettings();
    }
  }

  /**
   * Get current input settings
   */
  getSettings(): InputSettings {
    return { ...this.settings };
  }

  /**
   * Destroy the input manager and clean up resources
   */
  destroy(): void {
    if (!this._isInitialized) {
      return;
    }

    // Stop performance monitoring
    this.performanceManager.stopMonitoring();
    
    // Remove event listeners
    this.removeEventListeners();
    
    // Destroy handlers
    this.touchHandler.destroy();
    this.virtualControls.destroy();
    this.performanceManager.destroy();
    
    // Clear input state
    this.inputQueue.length = 0;
    this.actionCallbacks.clear();
    this.currentActions.clear();
    this.previousActions.clear();
    this.actionValues.clear();
    
    // Remove debug overlay
    if (this.debugOverlay) {
      this.debugOverlay.remove();
      this.debugOverlay = null;
    }
    
    this.element = null;
    this._isInitialized = false;
    
    this.emit('destroyed');
    this.removeAllListeners();
  }

  /**
   * Set the current input context
   */
  setContext(context: InputContext): void {
    const previousContext = this._currentContext;
    this._currentContext = context;
    this.mappingManager.setActiveContext(context);
    this.emit('context-changed', { previous: previousContext, current: context });
  }

  /**
   * Push a new context onto the stack
   */
  pushContext(context: InputContext): void {
    this._contextStack.push(this._currentContext);
    this.setContext(context);
  }

  /**
   * Pop the previous context from the stack
   */
  popContext(): InputContext | null {
    const previousContext = this._contextStack.pop();
    if (previousContext) {
      this.setContext(previousContext);
      return previousContext;
    }
    return null;
  }

  /**
   * Process a raw input event and convert it to a processed event
   */
  processInput(event: RawInputEvent): ProcessedInputEvent {
    const startTime = performance.now();
    
    // Check if input is enabled
    if (!this.enabled) {
      const processedEvent: ProcessedInputEvent = {
        rawEvent: event,
        action: undefined,
        context: this._currentContext,
        consumed: true,
        value: 0,
        normalized: true
      };
      return processedEvent;
    }
    
    // Get action mapping for this input
    const action = this.mappingManager.getMapping(this._currentContext, this.getInputKey(event));
    
    // Create processed event
    const processedEvent: ProcessedInputEvent = {
      rawEvent: event,
      action: action || undefined,
      context: this._currentContext,
      consumed: false,
      value: this.getInputValue(event),
      vector: this.getInputVector(event),
      normalized: true
    };
    
    // Update action state
    if (action) {
      this.updateActionState(action, processedEvent);
    }
    
    // Emit processed event
    this.emit('input-processed', processedEvent);
    
    // Update performance metrics
    const processingTime = performance.now() - startTime;
    this.updatePerformanceMetrics(processingTime);
    
    return processedEvent;
  }

  /**
   * Register callback for specific game action
   */
  onAction(action: GameAction, callback: (event: ProcessedInputEvent) => void): void {
    if (!this.actionCallbacks.has(action)) {
      this.actionCallbacks.set(action, new Set());
    }
    this.actionCallbacks.get(action)!.add(callback);
  }

  /**
   * Unregister callback for specific game action
   */
  offAction(action: GameAction, callback?: (event: ProcessedInputEvent) => void): void {
    const callbacks = this.actionCallbacks.get(action);
    if (callbacks) {
      if (callback) {
        callbacks.delete(callback);
      } else {
        callbacks.clear();
      }
    }
  }

  /**
   * Add virtual control
   */
  addVirtualControl(config: VirtualControlConfig): void {
    this.virtualControls.addControl(config);
  }

  /**
   * Remove virtual control
   */
  removeVirtualControl(id: string): void {
    this.virtualControls.removeControl(id);
  }

  /**
   * Show virtual controls
   */
  showVirtualControls(): void {
    this.virtualControls.show();
  }

  /**
   * Hide virtual controls
   */
  hideVirtualControls(): void {
    this.virtualControls.hide();
  }

  /**
   * Set input profile
   */
  setProfile(profile: InputProfile): void {
    // Apply mappings
    for (const mapping of profile.mappings) {
      this.mappingManager.setMapping(mapping);
    }
    
    // Apply virtual controls
    this.virtualControls.clearControls();
    for (const controlConfig of profile.virtualControls) {
      this.virtualControls.addControl(controlConfig);
    }
    
    // Apply settings
    this.applyProfileSettings(profile.settings);
    
    this.emit('profile-changed', profile);
  }

  /**
   * Get current profile
   */
  getProfile(): InputProfile | null {
    return this.mappingManager.getCurrentProfile();
  }

  /**
   * Save input profile
   */
  saveProfile(profile: InputProfile): void {
    this.mappingManager.saveProfile(profile);
  }

  /**
   * Load input profile
   */
  loadProfile(id: string): InputProfile | null {
    const profile = this.mappingManager.loadProfile(id);
    if (profile) {
      this.setProfile(profile);
    }
    return profile;
  }

  /**
   * Get movement vector from input
   */
  getMovementVector(): Point {
    const left = this.isActionPressed('move-left') ? -1 : 0;
    const right = this.isActionPressed('move-right') ? 1 : 0;
    const up = this.isActionPressed('move-up') ? -1 : 0;
    const down = this.isActionPressed('move-down') ? 1 : 0;
    
    // Check for virtual joystick input
    const joystickValue = this.virtualControls.getJoystickValue('movement-stick');
    if (joystickValue && (Math.abs(joystickValue.x) > 0.1 || Math.abs(joystickValue.y) > 0.1)) {
      return joystickValue;
    }
    
    let x = left + right;
    let y = up + down;
    
    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      x /= length;
      y /= length;
    }
    
    return { x, y };
  }

  /**
   * Check if action is currently pressed
   */
  isActionPressed(action: GameAction): boolean {
    return this.currentActions.get(action) || false;
  }

  /**
   * Check if action was just pressed this frame
   */
  isActionJustPressed(action: GameAction): boolean {
    const current = this.currentActions.get(action) || false;
    const previous = this.previousActions.get(action) || false;
    return current && !previous;
  }

  /**
   * Check if action was just released this frame
   */
  isActionJustReleased(action: GameAction): boolean {
    const current = this.currentActions.get(action) || false;
    const previous = this.previousActions.get(action) || false;
    return !current && previous;
  }

  /**
   * Enable or disable debug mode
   */
  enableDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    
    if (enabled) {
      this.createDebugOverlay();
    } else if (this.debugOverlay) {
      this.debugOverlay.remove();
      this.debugOverlay = null;
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): InputPerformanceMetrics {
    return this.performanceManager.getMetrics();
  }

  /**
   * Optimize input system for current device
   */
  optimizeForDevice(): void {
    const caps = this._deviceCapabilities;
    
    // Adjust queue size based on performance tier
    switch (caps.performanceTier) {
      case 'low':
        this.maxQueueSize = 50;
        this.performanceManager.setPerformanceTarget('battery');
        break;
      case 'medium':
        this.maxQueueSize = 75;
        this.performanceManager.setPerformanceTarget('balanced');
        break;
      case 'high':
        this.maxQueueSize = 100;
        this.performanceManager.setPerformanceTarget('performance');
        break;
    }
    
    // Enable input prediction on higher-end devices
    if (caps.performanceTier === 'high') {
      this.performanceManager.enableInputPrediction(true);
    }
    
    // Adjust virtual controls for touch devices
    if (caps.hasTouchScreen) {
      this.virtualControls.updateLayout(caps.screenSize);
    }
    
    this.emit('optimized', caps);
  }

  /**
   * Update input system (called by framework update loop)
   */
  update(deltaTime: number): void {
    if (!this._isInitialized) return;
    
    // Update performance tracking
    this.performanceManager.update();
    
    // Update virtual controls
    this.virtualControls.update(deltaTime);
    
    // Update touch handler
    this.touchHandler.update(deltaTime);
    
    // Clean up old events from queue if needed
    if (this.inputQueue.length > this.maxQueueSize * 0.8) {
      this.inputQueue.splice(0, Math.floor(this.inputQueue.length * 0.2));
    }
  }

  /**
   * Render input system overlays (virtual controls, debug info)
   */
  render(renderer: any): void {
    if (!this._isInitialized) return;
    
    // Render virtual controls
    this.virtualControls.render(renderer);
    
    // Render debug overlay if enabled
    if (this.debugMode && this.debugOverlay) {
      // Debug overlay is rendered as DOM element, not through renderer
      this.updateDebugOverlay();
    }
    
    // Render any input-specific UI elements from handlers
    for (const handler of this.inputHandlers.values()) {
      if ('render' in handler && typeof handler.render === 'function') {
        handler.render(renderer);
      }
    }
  }

  /**
   * Apply current settings to the input system
   */
  private applySettings(): void {
    // Apply sensitivity settings
    this.touchHandler.setSensitivity(this.settings.sensitivity);
    
    // Enable/disable input types based on settings
    if (!this.settings.touchEnabled) {
      // Disable touch processing
    }
    if (!this.settings.mouseEnabled) {
      // Disable mouse processing
    }
    if (!this.settings.keyboardEnabled) {
      // Disable keyboard processing
    }
    if (!this.settings.gamepadEnabled) {
      // Disable gamepad processing
    }
  }

  /**
   * Detect device capabilities using centralized DeviceDetector
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const hasTouch = DeviceDetector.hasTouchSupport();
    const hasKeyboard = !hasTouch || window.innerWidth > 768; // Heuristic for keyboard availability
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    const hasGamepad = 'getGamepads' in navigator;

    // Use centralized DeviceDetector for consistent tier detection
    const performanceTier = DeviceDetector.detectTierSync();
    const screenSize = DeviceDetector.getScreenSize();

    return {
      hasTouchScreen: hasTouch,
      hasTouch: hasTouch, // Alias for compatibility
      hasKeyboard,
      hasMouse,
      hasGamepad,
      maxTouchPoints: navigator.maxTouchPoints || (hasTouch ? 10 : 0),
      supportsPressure: hasTouch, // Modern touch devices usually support pressure
      supportsHaptics: 'vibrate' in navigator,
      performanceTier,
      screenSize: {
        width: screenSize.width,
        height: screenSize.height
      },
      pixelRatio: DeviceDetector.getPixelRatio()
    };
  }

  /**
   * Setup event listeners for different input types
   */
  private setupEventListeners(): void {
    if (!this.element) return;

    // Touch/Pointer events (using pre-bound handlers for proper cleanup)
    this.element.addEventListener('pointerdown', this.boundPointerHandler);
    this.element.addEventListener('pointermove', this.boundPointerHandler);
    this.element.addEventListener('pointerup', this.boundPointerHandler);
    this.element.addEventListener('pointercancel', this.boundPointerHandler);

    // Keyboard events
    window.addEventListener('keydown', this.boundKeydownHandler);
    window.addEventListener('keyup', this.boundKeyupHandler);

    // Gamepad events
    window.addEventListener('gamepadconnected', this.boundGamepadConnectedHandler);
    window.addEventListener('gamepaddisconnected', this.boundGamepadDisconnectedHandler);

    // Prevent context menu and default behaviors
    this.element.addEventListener('contextmenu', this.boundContextMenuHandler);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (!this.element) return;

    // Remove using same handler references (fixes memory leak)
    this.element.removeEventListener('pointerdown', this.boundPointerHandler);
    this.element.removeEventListener('pointermove', this.boundPointerHandler);
    this.element.removeEventListener('pointerup', this.boundPointerHandler);
    this.element.removeEventListener('pointercancel', this.boundPointerHandler);

    window.removeEventListener('keydown', this.boundKeydownHandler);
    window.removeEventListener('keyup', this.boundKeyupHandler);

    window.removeEventListener('gamepadconnected', this.boundGamepadConnectedHandler);
    window.removeEventListener('gamepaddisconnected', this.boundGamepadDisconnectedHandler);

    this.element.removeEventListener('contextmenu', this.boundContextMenuHandler);
  }

  /**
   * Handle pointer events (touch, mouse, pen)
   */
  private handlePointerEvent(event: PointerEvent): void {
    event.preventDefault();
    
    const rawEvent: RawInputEvent = {
      type: this.mapPointerEventType(event.type),
      device: event.pointerType === 'touch' ? 'touch' : 'mouse',
      timestamp: performance.now(),
      position: { x: event.clientX, y: event.clientY },
      pointerId: event.pointerId,
      button: event.button,
      pressure: event.pressure
    };
    
    this.queueInput(rawEvent);
  }

  /**
   * Handle keyboard events
   */
  private handleKeyboardEvent(event: KeyboardEvent): void {
    const rawEvent: RawInputEvent = {
      type: event.type === 'keydown' ? 'key-down' : 'key-up',
      device: 'keyboard',
      timestamp: performance.now(),
      key: event.key,
      keyCode: event.keyCode
    };
    
    this.queueInput(rawEvent);
  }

  /**
   * Handle gamepad events
   */
  private handleGamepadEvent(event: GamepadEvent): void {
    const rawEvent: RawInputEvent = {
      type: event.type === 'gamepadconnected' ? 'gamepad-connected' : 'gamepad-disconnected',
      device: 'gamepad',
      timestamp: performance.now(),
      gamepadIndex: event.gamepad.index
    };
    
    this.queueInput(rawEvent);
  }

  /**
   * Queue input event for processing
   */
  private queueInput(event: RawInputEvent): void {
    if (this.inputQueue.length >= this.maxQueueSize) {
      // Drop oldest input if queue is full
      this.inputQueue.shift();
      this._performanceMetrics.droppedInputs++;
    }
    
    this.inputQueue.push(event);
  }

  /**
   * Process queued input events
   */
  private processQueuedInputs(): void {
    if (this.processingInputs || this.inputQueue.length === 0) {
      return;
    }
    
    this.processingInputs = true;
    
    // Process all queued inputs
    const eventsToProcess = [...this.inputQueue];
    this.inputQueue.length = 0;
    
    for (const rawEvent of eventsToProcess) {
      const processedEvent = this.processInput(rawEvent);
      
      // Trigger action callbacks
      if (processedEvent.action && !processedEvent.consumed) {
        const callbacks = this.actionCallbacks.get(processedEvent.action);
        if (callbacks) {
          for (const callback of callbacks) {
            try {
              callback(processedEvent);
            } catch (error) {
              console.error('Error in input action callback:', error);
            }
          }
        }
      }
    }
    
    this.processingInputs = false;
  }

  /**
   * Setup handler event forwarding
   */
  private setupHandlerEvents(): void {
    // Forward touch handler events
    this.touchHandler.on('gesture', (gesture) => {
      this.emit('gesture', gesture);
    });
    
    // Forward virtual controls events
    this.virtualControls.on('control-activated', (controlId, action) => {
      if (action) {
        const processedEvent: ProcessedInputEvent = {
          rawEvent: {
            type: 'down',
            device: 'touch',
            timestamp: performance.now()
          },
          action,
          context: this._currentContext,
          consumed: false,
          value: 1
        };
        
        this.updateActionState(action, processedEvent);
        this.triggerActionCallbacks(action, processedEvent);
      }
    });
    
    this.virtualControls.on('control-deactivated', (controlId, action) => {
      if (action) {
        const processedEvent: ProcessedInputEvent = {
          rawEvent: {
            type: 'up',
            device: 'touch',
            timestamp: performance.now()
          },
          action,
          context: this._currentContext,
          consumed: false,
          value: 0
        };
        
        this.updateActionState(action, processedEvent);
        this.triggerActionCallbacks(action, processedEvent);
      }
    });
  }

  /**
   * Setup update loop for input processing
   */
  private setupUpdateLoop(): void {
    const update = () => {
      if (!this._isInitialized) return;
      
      // Copy current actions to previous
      this.previousActions.clear();
      for (const [action, pressed] of this.currentActions) {
        this.previousActions.set(action, pressed);
      }
      
      // Process queued inputs
      this.processQueuedInputs();
      
      // Update gamepad input
      this.updateGamepadInput();
      
      // Update performance metrics
      this.performanceManager.update();
      
      // Update debug overlay
      if (this.debugMode && this.debugOverlay) {
        this.updateDebugOverlay();
      }
      
      requestAnimationFrame(update);
    };
    
    requestAnimationFrame(update);
  }

  /**
   * Update gamepad input state
   */
  private updateGamepadInput(): void {
    if (!this._deviceCapabilities.hasGamepad) return;
    
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (!gamepad) continue;
      
      // Process gamepad buttons
      for (let j = 0; j < gamepad.buttons.length; j++) {
        const button = gamepad.buttons[j];
        if (button.pressed !== this.getGamepadButtonState(i, j)) {
          const rawEvent: RawInputEvent = {
            type: button.pressed ? 'gamepad-button-down' : 'gamepad-button-up',
            device: 'gamepad',
            timestamp: performance.now(),
            gamepadIndex: i,
            button: j,
            pressure: button.value
          };
          
          this.processInput(rawEvent);
        }
      }
      
      // Process gamepad axes
      for (let j = 0; j < gamepad.axes.length; j++) {
        const axisValue = gamepad.axes[j];
        if (Math.abs(axisValue - this.getGamepadAxisValue(i, j)) > 0.1) {
          const rawEvent: RawInputEvent = {
            type: 'gamepad-axis',
            device: 'gamepad',
            timestamp: performance.now(),
            gamepadIndex: i,
            axisIndex: j,
            axisValue
          };
          
          this.processInput(rawEvent);
        }
      }
    }
  }

  /**
   * Get input key string from raw event
   */
  private getInputKey(event: RawInputEvent): string {
    switch (event.device) {
      case 'keyboard':
        return `key:${event.key}`;
      case 'mouse':
        return `mouse:button${event.button}`;
      case 'gamepad':
        return `gamepad:${event.gamepadIndex}:button${event.button}`;
      case 'touch':
        return `touch:${event.type}`;
      default:
        return 'unknown';
    }
  }

  /**
   * Get input value from raw event
   */
  private getInputValue(event: RawInputEvent): number {
    if (event.pressure !== undefined) {
      return event.pressure;
    }
    
    if (event.axisValue !== undefined) {
      return event.axisValue;
    }
    
    return event.type === 'down' || event.type === 'key-down' || event.type === 'gamepad-button-down' ? 1 : 0;
  }

  /**
   * Get input vector from raw event
   */
  private getInputVector(event: RawInputEvent): Point | undefined {
    if (event.position) {
      return event.position;
    }
    
    return undefined;
  }

  /**
   * Map pointer event type to input event type
   */
  private mapPointerEventType(type: string): InputEventType {
    switch (type) {
      case 'pointerdown': return 'down';
      case 'pointermove': return 'move';
      case 'pointerup': return 'up';
      case 'pointercancel': return 'cancel';
      default: return 'move';
    }
  }

  /**
   * Update action state
   */
  private updateActionState(action: GameAction, event: ProcessedInputEvent): void {
    const isPressed = event.rawEvent.type === 'down' || 
                     event.rawEvent.type === 'key-down' || 
                     event.rawEvent.type === 'gamepad-button-down' ||
                     (event.value !== undefined && event.value > 0.1);
    
    this.currentActions.set(action, isPressed);
    
    if (event.value !== undefined) {
      this.actionValues.set(action, event.value);
    }
  }

  /**
   * Trigger action callbacks
   */
  private triggerActionCallbacks(action: GameAction, event: ProcessedInputEvent): void {
    const callbacks = this.actionCallbacks.get(action);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in input action callback:', error);
        }
      }
    }
  }

  /**
   * Apply profile settings
   */
  private applyProfileSettings(settings: any): void {
    // Apply touch sensitivity
    this.touchHandler.setSensitivity(settings.touchSensitivity);
    
    // Apply gesture thresholds
    this.touchHandler.setGestureThresholds(settings.gestureThresholds);
    
    // Apply virtual control settings
    this.virtualControls.enableHaptics(settings.hapticEnabled);
    
    // Apply performance settings
    if (settings.inputPrediction) {
      this.performanceManager.enableInputPrediction(true);
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(processingTime: number): void {
    this._performanceMetrics.inputEventCount++;
    this._performanceMetrics.averageLatency = 
      (this._performanceMetrics.averageLatency + processingTime) / 2;
  }

  /**
   * Create debug overlay
   */
  private createDebugOverlay(): void {
    if (this.debugOverlay) return;
    
    this.debugOverlay = document.createElement('div');
    this.debugOverlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      pointer-events: none;
      max-width: 300px;
    `;
    
    document.body.appendChild(this.debugOverlay);
  }

  /**
   * Update debug overlay
   */
  private updateDebugOverlay(): void {
    if (!this.debugOverlay) return;
    
    const metrics = this.getPerformanceMetrics();
    const activeActions = Array.from(this.currentActions.entries())
      .filter(([_, pressed]) => pressed)
      .map(([action, _]) => action);
    
    this.debugOverlay.innerHTML = `
      <div><strong>Input Debug</strong></div>
      <div>Context: ${this._currentContext}</div>
      <div>Active Actions: ${activeActions.join(', ') || 'None'}</div>
      <div>Input Events: ${metrics.inputEventCount}</div>
      <div>Avg Latency: ${metrics.averageLatency.toFixed(2)}ms</div>
      <div>Dropped Inputs: ${metrics.droppedInputs}</div>
      <div>Queue Size: ${this.inputQueue.length}</div>
      <div>Device: ${this._deviceCapabilities.performanceTier}</div>
    `;
  }

  /**
   * Get gamepad button state (for comparison)
   */
  private getGamepadButtonState(gamepadIndex: number, buttonIndex: number): boolean {
    // This would typically be stored in a gamepad state cache
    return false;
  }

  /**
   * Get gamepad axis value (for comparison)
   */
  private getGamepadAxisValue(gamepadIndex: number, axisIndex: number): number {
    // This would typically be stored in a gamepad state cache
    return 0;
  }

  /**
   * Prevent default event behavior
   */
  private preventDefault(event: Event): void {
    event.preventDefault();
  }
}