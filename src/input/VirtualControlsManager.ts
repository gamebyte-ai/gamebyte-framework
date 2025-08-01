import { EventEmitter } from 'eventemitter3';
import { Point, Size } from '../contracts/UI';
import {
  VirtualControlsManager,
  VirtualControlConfig,
  VirtualControlType,
  GameAction
} from '../contracts/Input';

/**
 * Virtual control state for tracking interaction
 */
interface VirtualControlState {
  config: VirtualControlConfig;
  element: HTMLElement;
  isPressed: boolean;
  isDragging: boolean;
  touchId: number | null;
  currentValue: Point;
  startPosition: Point;
  lastUpdateTime: number;
}

/**
 * Virtual joystick specific data
 */
interface JoystickState extends VirtualControlState {
  knobElement: HTMLElement;
  centerPosition: Point;
  maxDistance: number;
}

/**
 * Mobile-optimized virtual controls manager with DOM-based rendering
 */
export class GameByteVirtualControlsManager extends EventEmitter implements VirtualControlsManager {
  private element: HTMLElement | null = null;
  private containerElement: HTMLElement | null = null;
  private isInitialized: boolean = false;
  private isVisible: boolean = true;
  private isEnabled: boolean = true;
  
  // Control state tracking
  private controls: Map<string, VirtualControlState> = new Map();
  private joysticks: Map<string, JoystickState> = new Map();
  private activeTouch: number | null = null;
  
  // Layout and sizing
  private screenSize: Size = { width: window.innerWidth, height: window.innerHeight };
  private scaleFactor: number = 1;
  
  // Configuration
  private hapticEnabled: boolean = true;
  private debugMode: boolean = false;
  
  // Performance tracking
  private lastUpdateTime: number = 0;
  private updateFrequency: number = 60; // Target FPS

  constructor() {
    super();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Initialize virtual controls manager
   */
  async initialize(element: HTMLElement): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.element = element;
    this.createContainer();
    this.setupEventListeners();
    this.updateLayout(this.screenSize);
    
    this.isInitialized = true;
    this.emit('initialized');
  }

  /**
   * Destroy virtual controls manager
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    this.removeEventListeners();
    this.clearControls();
    
    if (this.containerElement) {
      this.containerElement.remove();
      this.containerElement = null;
    }
    
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    this.element = null;
    this.isInitialized = false;
    
    this.emit('destroyed');
    this.removeAllListeners();
  }

  /**
   * Add virtual control
   */
  addControl(config: VirtualControlConfig): void {
    if (this.controls.has(config.id)) {
      this.removeControl(config.id);
    }

    const element = this.createElement(config);
    const state: VirtualControlState = {
      config: { ...config },
      element,
      isPressed: false,
      isDragging: false,
      touchId: null,
      currentValue: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      lastUpdateTime: 0
    };

    this.controls.set(config.id, state);
    
    if (config.type === 'joystick') {
      this.createJoystick(config, state);
    }
    
    if (this.containerElement) {
      this.containerElement.appendChild(element);
    }
    
    this.emit('control-added', config.id, config);
  }

  /**
   * Remove virtual control
   */
  removeControl(id: string): void {
    const control = this.controls.get(id);
    if (!control) return;

    control.element.remove();
    this.controls.delete(id);
    this.joysticks.delete(id);
    
    this.emit('control-removed', id);
  }

  /**
   * Update virtual control configuration
   */
  updateControl(id: string, config: Partial<VirtualControlConfig>): void {
    const control = this.controls.get(id);
    if (!control) return;

    // Update config
    Object.assign(control.config, config);
    
    // Update element styling
    this.updateElementStyle(control.element, control.config);
    
    // Update position
    if (config.position) {
      this.positionElement(control.element, config.position, control.config.size);
    }
    
    this.emit('control-updated', id, control.config);
  }

  /**
   * Get virtual control configuration
   */
  getControl(id: string): VirtualControlConfig | null {
    const control = this.controls.get(id);
    return control ? { ...control.config } : null;
  }

  /**
   * Show all virtual controls
   */
  show(): void {
    this.setVisible(true);
  }

  /**
   * Hide all virtual controls
   */
  hide(): void {
    this.setVisible(false);
  }

  /**
   * Set visibility of virtual controls
   */
  setVisible(visible: boolean): void {
    this.isVisible = visible;
    
    if (this.containerElement) {
      this.containerElement.style.display = visible ? 'block' : 'none';
    }
    
    this.emit('visibility-changed', visible);
  }

  /**
   * Enable or disable virtual controls
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (this.containerElement) {
      // Update pointer events for individual controls
      for (const [id, control] of this.controls) {
        control.element.style.pointerEvents = enabled ? 'auto' : 'none';
        control.element.style.opacity = enabled ? control.config.alpha.toString() : '0.3';
      }
    }
    
    this.emit('enabled-changed', enabled);
  }

  /**
   * Update layout for screen size changes
   */
  updateLayout(screenSize: Size): void {
    this.screenSize = screenSize;
    
    // Calculate scale factor based on screen size
    const baseWidth = 390; // iPhone 12 Pro width as reference
    this.scaleFactor = Math.min(screenSize.width / baseWidth, 1.5);
    
    // Update container size
    if (this.containerElement) {
      this.containerElement.style.width = `${screenSize.width}px`;
      this.containerElement.style.height = `${screenSize.height}px`;
    }
    
    // Update all control positions and sizes
    for (const [id, control] of this.controls) {
      this.updateControlLayout(control);
    }
    
    this.emit('layout-updated', screenSize);
  }

  /**
   * Process touch input and return associated game action
   */
  processTouch(position: Point, type: 'start' | 'move' | 'end'): GameAction | null {
    if (!this.isEnabled) {
      return null;
    }
    
    let handledAction: GameAction | null = null;
    
    for (const [id, control] of this.controls) {
      if (this.isPointInControl(position, control)) {
        handledAction = this.handleControlTouch(control, position, type);
        if (handledAction) break;
      }
    }
    
    // Handle joystick drag outside bounds
    if (type === 'move' && this.activeTouch !== null) {
      for (const [id, joystick] of this.joysticks) {
        if (joystick.touchId === this.activeTouch) {
          this.updateJoystick(joystick, position);
          break;
        }
      }
    }
    
    return handledAction;
  }

  /**
   * Get joystick value by ID
   */
  getJoystickValue(id: string): Point {
    const joystick = this.joysticks.get(id);
    if (!joystick) return { x: 0, y: 0 };
    
    return { ...joystick.currentValue };
  }

  /**
   * Check if button is pressed
   */
  isButtonPressed(id: string): boolean {
    const control = this.controls.get(id);
    return control ? control.isPressed : false;
  }

  /**
   * Set control style
   */
  setStyle(id: string, style: any): void {
    const control = this.controls.get(id);
    if (!control) return;

    if (control.config.style) {
      Object.assign(control.config.style, style);
    } else {
      control.config.style = { ...style };
    }
    
    this.updateElementStyle(control.element, control.config);
  }

  /**
   * Enable or disable haptic feedback
   */
  enableHaptics(enabled: boolean): void {
    this.hapticEnabled = enabled;
  }

  /**
   * Clear all controls
   */
  clearControls(): void {
    for (const [id, control] of this.controls) {
      control.element.remove();
    }
    
    this.controls.clear();
    this.joysticks.clear();
    
    this.emit('controls-cleared');
  }

  /**
   * Render virtual controls (support multiple signatures for compatibility)
   */
  render(context?: CanvasRenderingContext2D | any): void {
    // DOM-based rendering doesn't need canvas context
    // This method exists for interface compatibility
    this.updateVisualFeedback();
  }

  /**
   * Create container element for virtual controls
   */
  private createContainer(): void {
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'gamebyte-virtual-controls';
    this.containerElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1000;
      overflow: hidden;
    `;
    
    document.body.appendChild(this.containerElement);
  }

  /**
   * Create DOM element for virtual control
   */
  private createElement(config: VirtualControlConfig): HTMLElement {
    const element = document.createElement('div');
    element.id = `virtual-control-${config.id}`;
    element.style.position = 'absolute';
    element.style.pointerEvents = 'auto';
    element.style.userSelect = 'none';
    element.style.touchAction = 'none';
    
    this.updateElementStyle(element, config);
    this.positionElement(element, config.position, config.size);
    
    return element;
  }

  /**
   * Create joystick-specific elements
   */
  private createJoystick(config: VirtualControlConfig, state: VirtualControlState): void {
    const knobElement = document.createElement('div');
    knobElement.style.cssText = `
      position: absolute;
      width: 40%;
      height: 40%;
      border-radius: 50%;
      background: ${config.style?.knobColor || '#ffffff'};
      border: 2px solid ${config.style?.borderColor || '#000000'};
      pointer-events: none;
      transition: transform 0.1s ease-out;
    `;
    
    // Center the knob
    knobElement.style.left = '30%';
    knobElement.style.top = '30%';
    
    state.element.appendChild(knobElement);
    
    const joystickState: JoystickState = {
      ...state,
      knobElement,
      centerPosition: {
        x: config.position.x + config.size.width / 2,
        y: config.position.y + config.size.height / 2
      },
      maxDistance: Math.min(config.size.width, config.size.height) / 2 * 0.8
    };
    
    this.joysticks.set(config.id, joystickState);
  }

  /**
   * Update element styling
   */
  private updateElementStyle(element: HTMLElement, config: VirtualControlConfig): void {
    const style = config.style || {};
    const scaledSize = {
      width: config.size.width * this.scaleFactor,
      height: config.size.height * this.scaleFactor
    };
    
    element.style.width = `${scaledSize.width}px`;
    element.style.height = `${scaledSize.height}px`;
    element.style.opacity = config.alpha.toString();
    element.style.transform = `scale(${config.scale})`;
    element.style.visibility = config.visible ? 'visible' : 'hidden';
    
    // Apply control type specific styling
    switch (config.type) {
      case 'joystick':
        element.style.borderRadius = '50%';
        element.style.background = style.backgroundColor || 'rgba(255, 255, 255, 0.3)';
        element.style.border = style.border || '2px solid rgba(255, 255, 255, 0.5)';
        break;
        
      case 'button':
        element.style.borderRadius = `${style.borderRadius || 10}px`;
        element.style.background = style.backgroundColor || 'rgba(255, 255, 255, 0.3)';
        element.style.border = style.border || '2px solid rgba(255, 255, 255, 0.5)';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.fontSize = `${12 * this.scaleFactor}px`;
        element.style.color = style.activeColor || '#ffffff';
        element.textContent = config.action || '';
        break;
        
      case 'dpad':
        element.style.background = style.backgroundColor || 'rgba(255, 255, 255, 0.3)';
        element.style.border = style.border || '2px solid rgba(255, 255, 255, 0.5)';
        this.createDpadElements(element, style);
        break;
    }
  }

  /**
   * Create D-pad sub-elements
   */
  private createDpadElements(element: HTMLElement, style: any): void {
    const directions = ['up', 'down', 'left', 'right'];
    const positions = [
      { x: '33%', y: '0%', width: '34%', height: '33%' },   // up
      { x: '33%', y: '67%', width: '34%', height: '33%' },  // down
      { x: '0%', y: '33%', width: '33%', height: '34%' },   // left
      { x: '67%', y: '33%', width: '33%', height: '34%' }   // right
    ];
    
    directions.forEach((direction, index) => {
      const buttonElement = document.createElement('div');
      const pos = positions[index];
      
      buttonElement.style.cssText = `
        position: absolute;
        left: ${pos.x};
        top: ${pos.y};
        width: ${pos.width};
        height: ${pos.height};
        background: ${style.activeColor || 'rgba(255, 255, 255, 0.5)'};
        border: 1px solid ${style.borderColor || '#ffffff'};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        cursor: pointer;
      `;
      
      buttonElement.textContent = direction.charAt(0).toUpperCase();
      buttonElement.dataset.direction = direction;
      
      element.appendChild(buttonElement);
    });
  }

  /**
   * Position element on screen
   */
  private positionElement(element: HTMLElement, position: Point, size: Size): void {
    const scaledSize = {
      width: size.width * this.scaleFactor,
      height: size.height * this.scaleFactor
    };
    
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.containerElement) return;
    
    // Touch events
    this.containerElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.containerElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.containerElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.containerElement.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    // Mouse events for desktop testing
    this.containerElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.containerElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.containerElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (!this.containerElement) return;
    
    this.containerElement.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.containerElement.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.containerElement.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.containerElement.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    this.containerElement.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.containerElement.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.containerElement.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * Handle touch start event
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const position = { x: touch.clientX, y: touch.clientY };
      
      const action = this.processTouch(position, 'start');
      if (action) {
        this.activeTouch = touch.identifier;
      }
    }
  }

  /**
   * Handle touch move event
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch.identifier === this.activeTouch) {
        const position = { x: touch.clientX, y: touch.clientY };
        this.processTouch(position, 'move');
      }
    }
  }

  /**
   * Handle touch end event
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch.identifier === this.activeTouch) {
        const position = { x: touch.clientX, y: touch.clientY };
        this.processTouch(position, 'end');
        this.activeTouch = null;
      }
    }
  }

  /**
   * Handle touch cancel event
   */
  private handleTouchCancel(event: TouchEvent): void {
    this.handleTouchEnd(event);
  }

  /**
   * Handle mouse down event (for desktop testing)
   */
  private handleMouseDown(event: MouseEvent): void {
    const position = { x: event.clientX, y: event.clientY };
    const action = this.processTouch(position, 'start');
    if (action) {
      this.activeTouch = 0; // Use 0 as mouse identifier
    }
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(event: MouseEvent): void {
    if (this.activeTouch === 0) {
      const position = { x: event.clientX, y: event.clientY };
      this.processTouch(position, 'move');
    }
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(event: MouseEvent): void {
    if (this.activeTouch === 0) {
      const position = { x: event.clientX, y: event.clientY };
      this.processTouch(position, 'end');
      this.activeTouch = null;
    }
  }

  /**
   * Check if point is within control bounds
   */
  private isPointInControl(position: Point, control: VirtualControlState): boolean {
    const rect = control.element.getBoundingClientRect();
    return position.x >= rect.left && 
           position.x <= rect.right && 
           position.y >= rect.top && 
           position.y <= rect.bottom;
  }

  /**
   * Handle touch interaction with control
   */
  private handleControlTouch(control: VirtualControlState, position: Point, type: 'start' | 'move' | 'end'): GameAction | null {
    const now = performance.now();
    
    switch (type) {
      case 'start':
        control.isPressed = true;
        control.startPosition = position;
        control.lastUpdateTime = now;
        
        if (control.config.type === 'joystick') {
          this.startJoystickDrag(control.config.id, position);
        }
        
        this.triggerHapticFeedback();
        this.updateVisualFeedback(control);
        this.emit('control-activated', control.config.id, control.config.action);
        
        return control.config.action || null;
        
      case 'move':
        if (control.isPressed && control.config.type === 'joystick') {
          const joystick = this.joysticks.get(control.config.id);
          if (joystick) {
            this.updateJoystick(joystick, position);
          }
        }
        break;
        
      case 'end':
        control.isPressed = false;
        control.currentValue = { x: 0, y: 0 };
        
        if (control.config.type === 'joystick') {
          this.resetJoystick(control.config.id);
        }
        
        this.updateVisualFeedback(control);
        this.emit('control-deactivated', control.config.id, control.config.action);
        break;
    }
    
    return null;
  }

  /**
   * Start joystick drag interaction
   */
  private startJoystickDrag(id: string, position: Point): void {
    const joystick = this.joysticks.get(id);
    if (!joystick) return;
    
    joystick.isDragging = true;
    joystick.touchId = this.activeTouch;
    this.updateJoystick(joystick, position);
  }

  /**
   * Update joystick position and value
   */
  private updateJoystick(joystick: JoystickState, position: Point): void {
    const centerX = joystick.centerPosition.x;
    const centerY = joystick.centerPosition.y;
    
    const deltaX = position.x - centerX;
    const deltaY = position.y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Apply dead zone
    const deadZone = joystick.config.deadZone || 0.1;
    const deadZonePixels = joystick.maxDistance * deadZone;
    
    if (distance < deadZonePixels) {
      joystick.currentValue = { x: 0, y: 0 };
      this.positionKnob(joystick, { x: 0, y: 0 });
      return;
    }
    
    // Clamp to max distance
    const clampedDistance = Math.min(distance, joystick.maxDistance);
    const normalizedX = (deltaX / distance) * clampedDistance;
    const normalizedY = (deltaY / distance) * clampedDistance;
    
    // Calculate normalized value (-1 to 1)
    joystick.currentValue = {
      x: normalizedX / joystick.maxDistance,
      y: normalizedY / joystick.maxDistance
    };
    
    // Position knob visually
    this.positionKnob(joystick, { x: normalizedX, y: normalizedY });
    
    // Emit joystick value change
    this.emit('joystick-changed', joystick.config.id, joystick.currentValue);
  }

  /**
   * Position joystick knob element
   */
  private positionKnob(joystick: JoystickState, offset: Point): void {
    const centerPercent = 30; // knob is 40% of joystick, centered at 30%
    const maxOffsetPercent = 25; // max offset from center
    
    const offsetXPercent = (offset.x / joystick.maxDistance) * maxOffsetPercent;
    const offsetYPercent = (offset.y / joystick.maxDistance) * maxOffsetPercent;
    
    joystick.knobElement.style.left = `${centerPercent + offsetXPercent}%`;
    joystick.knobElement.style.top = `${centerPercent + offsetYPercent}%`;
  }

  /**
   * Reset joystick to center position
   */
  private resetJoystick(id: string): void {
    const joystick = this.joysticks.get(id);
    if (!joystick) return;
    
    joystick.isDragging = false;
    joystick.touchId = null;
    joystick.currentValue = { x: 0, y: 0 };
    
    // Reset knob position with animation
    joystick.knobElement.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
    this.positionKnob(joystick, { x: 0, y: 0 });
    
    // Remove transition after animation
    setTimeout(() => {
      joystick.knobElement.style.transition = '';
    }, 200);
    
    this.emit('joystick-reset', id);
  }

  /**
   * Update visual feedback for control state
   */
  private updateVisualFeedback(control?: VirtualControlState): void {
    if (control) {
      const activeStyle = control.config.style?.activeColor || 'rgba(255, 255, 255, 0.8)';
      const normalStyle = control.config.style?.backgroundColor || 'rgba(255, 255, 255, 0.3)';
      
      control.element.style.background = control.isPressed ? activeStyle : normalStyle;
    } else {
      // Update all controls
      for (const [id, control] of this.controls) {
        this.updateVisualFeedback(control);
      }
    }
  }

  /**
   * Update control layout for screen changes
   */
  private updateControlLayout(control: VirtualControlState): void {
    this.positionElement(control.element, control.config.position, control.config.size);
    this.updateElementStyle(control.element, control.config);
    
    // Update joystick center position
    if (control.config.type === 'joystick') {
      const joystick = this.joysticks.get(control.config.id);
      if (joystick) {
        joystick.centerPosition = {
          x: control.config.position.x + control.config.size.width / 2,
          y: control.config.position.y + control.config.size.height / 2
        };
      }
    }
  }

  /**
   * Trigger haptic feedback if supported and enabled
   */
  private triggerHapticFeedback(): void {
    if (this.hapticEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10); // Short vibration
    }
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    setTimeout(() => {
      this.updateLayout({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 100);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.updateLayout({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  /**
   * Update virtual controls (called by input manager)
   */
  update(deltaTime: number): void {
    if (!this.isInitialized || !this.isVisible) return;

    // Update joystick smoothing and animations
    for (const joystick of this.joysticks.values()) {
      // Update joystick animations if any
      const currentTime = performance.now();
      joystick.lastUpdateTime = currentTime;
    }

    // Update control animations and states
    for (const control of this.controls.values()) {
      // Update control states if needed
      control.lastUpdateTime = performance.now();
    }
  }

}