import { EventEmitter } from 'eventemitter3';
import { Point, Size } from './UI';

/**
 * Input device types supported by the framework
 */
export type InputDevice = 'touch' | 'mouse' | 'keyboard' | 'gamepad';

/**
 * Input event types
 */
export type InputEventType = 
  | 'down' | 'up' | 'move' | 'cancel'
  | 'key-down' | 'key-up' | 'key-repeat'
  | 'gamepad-button-down' | 'gamepad-button-up'
  | 'gamepad-axis' | 'gamepad-connected' | 'gamepad-disconnected';

/**
 * Input context types for different game states
 */
export type InputContext = 
  | 'menu' | 'gameplay' | 'pause' | 'settings' 
  | 'loading' | 'cutscene' | 'dialogue' | 'inventory';

/**
 * Common game actions that can be mapped to different inputs
 */
export type GameAction = 
  | 'move-left' | 'move-right' | 'move-up' | 'move-down'
  | 'jump' | 'run' | 'crouch' | 'interact'
  | 'ui-confirm' | 'ui-cancel' | 'ui-navigate'
  | 'menu-navigate' | 'menu-select' | 'menu-back'
  | 'attack' | 'pause'
  | 'camera-pan' | 'camera-zoom' | 'camera-rotate'

/**
 * Input system settings
 */
export interface InputSettings {
  touchEnabled: boolean;
  mouseEnabled: boolean;
  keyboardEnabled: boolean;
  gamepadEnabled: boolean;
  sensitivity: number;
  deadZone: number;
}

/**
 * Input handler interface
 */
export interface InputHandler {
  handleInput(event: RawInputEvent): void;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
}

/**
 * Device capabilities information
 */
export interface InputDeviceCapabilities {
  hasTouch: boolean;
  hasMouse: boolean;
  hasKeyboard: boolean;
  hasGamepad: boolean;
  maxTouchPoints: number;
}

/**
 * Raw input event data
 */
export interface RawInputEvent {
  type: InputEventType;
  device: InputDevice;
  deviceType?: InputDevice; // Alias for device for compatibility
  timestamp: number;
  position?: Point;
  key?: string;
  keyCode?: number;
  button?: number;
  gamepadIndex?: number;
  gamepadAxis?: number; // Gamepad axis index
  gamepadButton?: number; // Gamepad button index
  axisIndex?: number;
  axisValue?: number;
  pressure?: number;
  pointerId?: number;
  deltaTime?: number;
  delta?: Point; // For mouse wheel and scroll events
}

/**
 * Processed input event with context and action mapping
 */
export interface ProcessedInputEvent {
  rawEvent: RawInputEvent;
  action?: GameAction;
  context: InputContext;
  consumed: boolean;
  value?: number;
  vector?: Point;
  normalized?: boolean;
}

/**
 * Touch gesture types
 */
export type GestureType = 
  | 'tap' | 'double-tap' | 'long-press'
  | 'swipe' | 'pinch' | 'rotate' | 'drag';

/**
 * Touch gesture event data
 */
export interface GestureEvent {
  type: GestureType;
  position: Point;
  startPosition?: Point;
  endPosition?: Point;
  timestamp: number;
  duration?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  velocity?: Point;
  scale?: number;
  rotation?: number;
  fingers?: number;
}

/**
 * Virtual control types
 */
export type VirtualControlType = 'joystick' | 'dpad' | 'button';

/**
 * Virtual control configuration
 */
export interface VirtualControlConfig {
  id: string;
  type: VirtualControlType;
  position: Point;
  size: Size;
  action?: GameAction;
  visible: boolean;
  alpha: number;
  scale: number;
  deadZone?: number;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    knobColor?: string;
    activeColor?: string;
    borderRadius?: number;
    border?: string;
  };
  hapticFeedback?: boolean;
}

/**
 * Input mapping configuration for different contexts
 */
export interface InputMapping {
  context: InputContext;
  mappings: Map<string, GameAction>;
  priority: number;
  enabled: boolean;
}

/**
 * Input profile containing multiple mappings and virtual controls
 */
export interface InputProfile {
  id: string;
  name: string;
  description?: string;
  mappings: InputMapping[];
  virtualControls: VirtualControlConfig[];
  settings: {
    touchSensitivity: number;
    gestureThresholds: {
      tap: number;
      longPress: number;
      swipe: number;
      pinch: number;
    };
    deadZones: {
      joystick: number;
      gamepad: number;
    };
    hapticEnabled: boolean;
    inputPrediction: boolean;
  };
}

/**
 * Device capability information for input optimization
 */
export interface DeviceCapabilities {
  hasTouchScreen: boolean;
  hasTouch: boolean; // Alias for hasTouchScreen for compatibility
  hasKeyboard: boolean;
  hasMouse: boolean;
  hasGamepad: boolean;
  maxTouchPoints: number;
  supportsPressure: boolean;
  supportsHaptics: boolean;
  performanceTier: 'low' | 'medium' | 'high';
  screenSize: Size;
  pixelRatio: number;
}

/**
 * Input performance metrics
 */
export interface InputPerformanceMetrics {
  averageLatency: number;
  inputEventCount: number;
  gestureRecognitionTime: number;
  memoryUsage: number;
  droppedInputs: number;
  frameRate: number;
  batteryImpact: 'low' | 'medium' | 'high';
}

/**
 * Main input manager interface
 */
export interface InputManager extends EventEmitter {
  readonly isInitialized: boolean;
  readonly currentContext: InputContext;
  readonly deviceCapabilities: DeviceCapabilities;
  readonly performanceMetrics: InputPerformanceMetrics;

  // Initialization and lifecycle
  initialize(element?: HTMLElement): Promise<void>;
  destroy(): void;
  
  // Context management
  setContext(context: InputContext): void;
  pushContext(context: InputContext): void;
  popContext(): InputContext | null;
  
  // Input handling
  processInput(event: RawInputEvent): ProcessedInputEvent;
  onAction(action: GameAction, callback: (event: ProcessedInputEvent) => void): void;
  offAction(action: GameAction, callback?: (event: ProcessedInputEvent) => void): void;
  
  // Virtual controls
  addVirtualControl(config: VirtualControlConfig): void;
  removeVirtualControl(id: string): void;
  showVirtualControls(): void;
  hideVirtualControls(): void;
  
  // Input profiles
  setProfile(profile: InputProfile): void;
  getProfile(): InputProfile | null;
  saveProfile(profile: InputProfile): void;
  loadProfile(id: string): InputProfile | null;
  
  // Convenience methods
  getMovementVector(): Point;
  isActionPressed(action: GameAction): boolean;
  isActionJustPressed(action: GameAction): boolean;
  isActionJustReleased(action: GameAction): boolean;
  
  // Performance and debugging
  enableDebugMode(enabled: boolean): void;
  getPerformanceMetrics(): InputPerformanceMetrics;
  optimizeForDevice(): void;
  
  // Update and rendering
  update(deltaTime: number): void;
  render(renderer: any): void;
}

/**
 * Touch input handler interface
 */
export interface TouchInputHandler extends EventEmitter {
  // Touch event processing
  processTouchEvent(event: TouchEvent): RawInputEvent[];
  processPointerEvent(event: PointerEvent): RawInputEvent;
  
  // Gesture recognition
  recognizeGesture(): GestureEvent | null;
  configureGesture(type: GestureType, config: any): void;
  
  // Touch tracking
  getTouchCount(): number;
  getTouch(id: number): Touch | null;
  getPrimaryTouch(): Touch | null;
  
  // Configuration
  setSensitivity(sensitivity: number): void;
  setGestureThresholds(thresholds: any): void;
  enablePalmRejection(enabled: boolean): void;
}

/**
 * Virtual controls manager interface
 */
export interface VirtualControlsManager extends EventEmitter {
  // Control management
  addControl(config: VirtualControlConfig): void;
  removeControl(id: string): void;
  updateControl(id: string, config: Partial<VirtualControlConfig>): void;
  getControl(id: string): VirtualControlConfig | null;
  
  // Visibility and layout
  show(): void;
  hide(): void;
  setVisible(visible: boolean): void;
  updateLayout(screenSize: Size): void;
  
  // Input processing
  processTouch(position: Point, type: 'start' | 'move' | 'end'): GameAction | null;
  getJoystickValue(id: string): Point;
  isButtonPressed(id: string): boolean;
  
  // Customization
  setStyle(id: string, style: any): void;
  enableHaptics(enabled: boolean): void;
  
  // Rendering
  render(context: CanvasRenderingContext2D | any): void;
}

/**
 * Input mapping manager interface
 */
export interface InputMappingManager {
  // Mapping management
  addMapping(context: InputContext, input: string, action: GameAction): void;
  removeMapping(context: InputContext, input: string): void;
  getMapping(context: InputContext, input: string): GameAction | null;
  mapInput(event: RawInputEvent, context: InputContext): GameAction | null;
  
  // Profile management
  createProfile(id: string, name: string): InputProfile;
  saveProfile(profile: InputProfile): void;
  loadProfile(id: string): InputProfile | null;
  deleteProfile(id: string): void;
  listProfiles(): InputProfile[];
  
  // Context management
  setActiveContext(context: InputContext): void;
  getActiveContext(): InputContext;
  
  // Built-in profiles
  getPlatformerProfile(): InputProfile;
  getTopDownProfile(): InputProfile;
  getMenuProfile(): InputProfile;
}

/**
 * Game-specific input handler interfaces
 */

/**
 * Platformer game input handler
 */
export interface PlatformerInputHandler extends EventEmitter {
  // Movement
  getHorizontalInput(): number;
  isJumpPressed(): boolean;
  isJumpJustPressed(): boolean;
  isRunPressed(): boolean;
  
  // Configuration
  setMovementSmoothing(smoothing: number): void;
  setJumpBuffering(enabled: boolean): void;
  setCoyoteTime(time: number): void;
  
  // State
  canJump(): boolean;
  isGrounded(): boolean;
  setGrounded(grounded: boolean): void;
}

/**
 * Camera input handler for pan, zoom, rotate
 */
export interface CameraInputHandler extends EventEmitter {
  // Pan controls
  getPanDelta(): Point;
  isPanning(): boolean;
  
  // Zoom controls
  getZoomDelta(): number;
  isZooming(): boolean;
  
  // Rotation controls
  getRotationDelta(): number;
  isRotating(): boolean;
  
  // Configuration
  setPanSensitivity(sensitivity: number): void;
  setZoomSensitivity(sensitivity: number): void;
  setRotationSensitivity(sensitivity: number): void;
  setInvertControls(pan: boolean, zoom: boolean, rotation: boolean): void;
  
  // Constraints
  setPanLimits(bounds: { min: Point; max: Point }): void;
  setZoomLimits(min: number, max: number): void;
  setRotationLimits(min: number, max: number): void;
}

/**
 * UI navigation input handler
 */
export interface UINavigationHandler extends EventEmitter {
  // Navigation
  getNavigationDirection(): 'up' | 'down' | 'left' | 'right' | null;
  isConfirmPressed(): boolean;
  isCancelPressed(): boolean;
  
  // Focus management
  moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void;
  confirmSelection(): void;
  cancelSelection(): void;
  
  // Configuration
  setRepeatDelay(delay: number): void;
  setRepeatRate(rate: number): void;
}

/**
 * Generic player movement handler
 */
export interface PlayerMovementHandler extends EventEmitter {
  // Movement vectors
  getMovementVector(): Point;
  getMovementVector3D(): { x: number; y: number; z: number };
  
  // Input modes
  setAnalogMode(enabled: boolean): void;
  isAnalogMode(): boolean;
  
  // Configuration
  setDeadZone(deadZone: number): void;
  setMovementSmoothing(smoothing: number): void;
  setSensitivity(sensitivity: number): void;
  
  // State
  isMoving(): boolean;
  getMovementSpeed(): number;
}

/**
 * Input performance manager interface
 */
export interface InputPerformanceManager {
  // Performance monitoring
  startMonitoring(): void;
  stopMonitoring(): void;
  getMetrics(): InputPerformanceMetrics;
  resetMetrics(): void;
  
  // Optimization
  enableInputPrediction(enabled: boolean): void;
  setBatchSize(size: number): void;
  setUpdateFrequency(frequency: number): void;
  processWithPrediction(event: RawInputEvent): RawInputEvent;
  
  // Adaptive performance
  enableAdaptivePerformance(enabled: boolean): void;
  setPerformanceTarget(target: 'battery' | 'performance' | 'balanced'): void;
  
  // Memory management
  enableEventPooling(enabled: boolean): void;
  setMaxPoolSize(size: number): void;
  cleanupMemory(): void;
}