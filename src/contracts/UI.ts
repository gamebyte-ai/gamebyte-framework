import { EventEmitter } from 'eventemitter3';

/**
 * Represents a 2D point or position
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Represents a size with width and height
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Represents a rectangle with position and size
 */
export interface Rect extends Point, Size {}

/**
 * Represents margins or padding
 */
export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Represents a color in RGBA format
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Touch/mouse interaction event
 */
export interface UIInteractionEvent {
  type: 'down' | 'up' | 'move' | 'cancel';
  position: Point;
  target: UIComponent | null;
  timestamp: number;
  pointerID: number;
}

/**
 * Animation easing functions
 */
export type EasingFunction = 
  | 'linear'
  | 'ease-in'
  | 'ease-out' 
  | 'ease-in-out'
  | 'spring'
  | 'bounce';

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
  delay?: number;
  repeat?: number | 'infinite';
  yoyo?: boolean;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

/**
 * Constraint types for responsive layouts
 */
export type ConstraintType = 
  | 'fixed'           // Fixed size/position
  | 'percentage'      // Percentage of parent
  | 'fill'            // Fill available space
  | 'wrap'            // Wrap content size
  | 'aspect-ratio'    // Maintain aspect ratio
  | 'safe-area'       // Respect device safe areas
  | 'center'          // Center in available space
  | 'stretch';        // Stretch to fill

/**
 * Layout constraint definition
 */
export interface LayoutConstraint {
  type: ConstraintType;
  value?: number;
  min?: number;
  max?: number;
  priority?: number;
}

/**
 * Device safe area information
 */
export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Screen orientation
 */
export type ScreenOrientation = 'portrait' | 'landscape';

/**
 * Device information for responsive design
 */
export interface DeviceInfo {
  screenSize: Size;
  pixelRatio: number;
  orientation: ScreenOrientation;
  safeArea: SafeArea;
  isTouch: boolean;
  performanceTier: 'low' | 'medium' | 'high';
}

/**
 * Base UI component interface
 */
export interface UIComponent extends EventEmitter {
  // Core properties
  readonly id: string;
  parent: UIComponent | null;
  children: UIComponent[];
  
  // Transform properties
  position: Point;
  size: Size;
  rotation: number;
  scale: Point;
  anchor: Point;
  
  // Appearance properties
  visible: boolean;
  alpha: number;
  interactive: boolean;
  
  // Layout properties
  margin: Spacing;
  padding: Spacing;
  constraints: {
    x: LayoutConstraint;
    y: LayoutConstraint;
    width: LayoutConstraint;
    height: LayoutConstraint;
  };
  
  // Lifecycle methods
  initialize(): void;
  update(deltaTime: number): void;
  render(renderer: any): void;
  destroy(): void;
  
  // Hierarchy management
  addChild(child: UIComponent): void;
  removeChild(child: UIComponent): void;
  removeFromParent(): void;
  getChildById(id: string): UIComponent | null;
  
  // Layout methods
  layout(): void;
  getBounds(): Rect;
  getGlobalPosition(): Point;
  hitTest(point: Point): UIComponent | null;
  
  // Animation methods
  animate(properties: Partial<UIComponent>, config: AnimationConfig): Promise<void>;
  stopAllAnimations(): void;
  
  // Setter methods for property updates
  setSize(width: number, height: number): void;
  setPosition(x: number, y: number): void;
  setVisible(visible: boolean): void;
  setAlpha(alpha: number): void;
  setAnchor(x: number | Point, y?: number): void;
  setMargin(margin: Spacing): void;
  setPadding(padding: Spacing): void;
  setPositionConstraint(x: ConstraintType | LayoutConstraint, y?: ConstraintType | LayoutConstraint): void;
  setPositionConstraint(constraint: LayoutConstraint): void;
  setSizeConstraint(width: ConstraintType | LayoutConstraint, height?: ConstraintType | LayoutConstraint): void;
  setSizeConstraint(constraint: LayoutConstraint): void;
}

/**
 * UI Manager interface for managing the entire UI system
 */
export interface UIManager {
  // Root container
  readonly root: UIComponent;
  
  // Device info
  readonly deviceInfo: DeviceInfo;
  
  // Screen management
  showScreen(screenName: string, data?: any): Promise<void>;
  hideScreen(screenName: string): Promise<void>;
  getCurrentScreen(): string | null;
  
  // Component creation
  createComponent<T extends UIComponent>(type: string, config?: any): T;
  
  // Input handling
  handleInteraction(event: UIInteractionEvent): void;
  
  // Layout system
  requestLayout(): void;
  updateLayout(): void;
  
  // Themes
  setTheme(theme: UITheme): void;
  getTheme(): UITheme;
  
  // Lifecycle
  update(deltaTime: number): void;
  render(renderer: any): void;
  destroy(): void;
}

/**
 * Animation system interface
 */
export interface UIAnimationSystem {
  // Tween management
  to(target: any, properties: any, config: AnimationConfig): Promise<void>;
  from(target: any, properties: any, config: AnimationConfig): Promise<void>;
  set(target: any, properties: any): void;
  
  // Timeline management
  createTimeline(): UITimeline;
  
  // Spring physics
  spring(target: any, properties: any, config: SpringConfig): Promise<void>;
  
  // Utilities
  killTweensOf(target: any): void;
  pauseAll(): void;
  resumeAll(): void;
  
  // Update loop
  update(deltaTime: number): void;
}

/**
 * Spring animation configuration
 */
export interface SpringConfig {
  tension?: number;
  friction?: number;
  mass?: number;
  velocity?: number;
  precision?: number;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

/**
 * Animation timeline interface
 */
export interface UITimeline {
  to(target: any, properties: any, config: AnimationConfig): UITimeline;
  from(target: any, properties: any, config: AnimationConfig): UITimeline;
  set(target: any, properties: any): UITimeline;
  delay(duration: number): UITimeline;
  call(callback: () => void): UITimeline;
  play(): Promise<void>;
  pause(): void;
  resume(): void;
  reverse(): void;
  restart(): void;
  clear(): void;
}

/**
 * Layout manager interface
 */
export interface LayoutManager {
  calculateLayout(component: UIComponent, availableSize: Size): Size;
  updateConstraints(component: UIComponent, deviceInfo: DeviceInfo): void;
  handleOrientationChange(orientation: ScreenOrientation): void;
}

/**
 * UI Theme interface
 */
export interface UITheme {
  name: string;
  
  // Color palette
  colors: {
    primary: Color;
    secondary: Color;
    background: Color;
    surface: Color;
    text: Color;
    textSecondary: Color;
    success: Color;
    warning: Color;
    error: Color;
    overlay: Color;
  };
  
  // Typography
  typography: {
    fontFamily: string;
    sizes: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
    weights: {
      normal: number;
      bold: number;
    };
  };
  
  // Spacing scale
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  // Border radius scale
  radius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  
  // Shadow definitions
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  
  // Animation timings
  animations: {
    fast: number;
    normal: number;
    slow: number;
  };
}

/**
 * Screen component interface for full-screen UIs
 */
export interface UIScreen extends UIComponent {
  readonly screenName: string;
  
  // Screen lifecycle
  onShow(data?: any): Promise<void>;
  onHide(): Promise<void>;
  onOrientationChange(orientation: ScreenOrientation): void;
  
  // Back button handling (for mobile)
  onBackButton(): boolean; // Return true if handled
}

/**
 * Input system interface for UI interactions
 */
export interface UIInputSystem {
  // Touch/mouse handling
  onPointerDown(event: PointerEvent): void;
  onPointerMove(event: PointerEvent): void;
  onPointerUp(event: PointerEvent): void;
  onPointerCancel(event: PointerEvent): void;
  
  // Gesture recognition
  onTap(position: Point): void;
  onDoubleTap(position: Point): void;
  onLongPress(position: Point): void;
  onPinch(center: Point, scale: number): void;
  onSwipe(start: Point, end: Point, velocity: Point): void;
  
  // Focus management
  setFocus(component: UIComponent | null): void;
  getFocus(): UIComponent | null;
  
  // Configuration
  setTapThreshold(pixels: number): void;
  setLongPressThreshold(milliseconds: number): void;
  setPinchThreshold(scale: number): void;
  setSwipeThreshold(pixels: number): void;
}