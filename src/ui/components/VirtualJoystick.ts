import { EventEmitter } from 'eventemitter3';
import { graphics } from '../../graphics/GraphicsEngine';
import { IContainer, IGraphics } from '../../contracts/Graphics';

/**
 * Direction type for 8-way directional output
 */
export type JoystickDirection =
  | 'idle'
  | 'up' | 'down' | 'left' | 'right'
  | 'up-left' | 'up-right' | 'down-left' | 'down-right';

/**
 * Joystick move event data
 */
export interface JoystickMoveData {
  /** Normalized vector (-1 to 1 for both axes) */
  vector: { x: number; y: number };
  /** Angle in degrees (0-360, 0 = right, 90 = down) */
  angle: number;
  /** Distance from center (0-1) */
  magnitude: number;
  /** 8-way direction */
  direction: JoystickDirection;
  /** Raw position in pixels */
  rawPosition: { x: number; y: number };
}

/**
 * Joystick visual style configuration
 */
export interface JoystickStyle {
  baseColor?: number;
  baseAlpha?: number;
  knobColor?: number;
  knobAlpha?: number;
  borderColor?: number;
  borderWidth?: number;
  borderAlpha?: number;
}

/**
 * Activation zone for dynamic mode (normalized 0-1 values)
 */
export interface ActivationZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * VirtualJoystick configuration
 */
export interface VirtualJoystickConfig {
  /** Joystick mode: 'fixed' stays in place, 'dynamic' appears where user touches */
  mode: 'fixed' | 'dynamic';
  /** Position for fixed mode (required) or initial position for dynamic */
  position?: { x: number; y: number };
  /** Activation zone for dynamic mode (normalized 0-1 values, default: left half) */
  activationZone?: ActivationZone;
  /** Base diameter in pixels (default: 120) */
  size?: number;
  /** Knob diameter in pixels (default: size * 0.4) */
  knobSize?: number;
  /** Dead zone threshold 0-1 (default: 0.1) */
  deadZone?: number;
  /** Max distance knob can travel from center (default: size * 0.4) */
  maxDistance?: number;
  /** Visual style */
  style?: JoystickStyle;
  /** Hide when not in use - dynamic mode only (default: true) */
  hideWhenIdle?: boolean;
  /** Fade in animation duration in ms (default: 100) */
  fadeInDuration?: number;
  /** Fade out animation duration in ms (default: 200) */
  fadeOutDuration?: number;
}

/**
 * Default joystick style - minimal/modern look
 */
const DEFAULT_STYLE: Required<JoystickStyle> = {
  baseColor: 0x000000,
  baseAlpha: 0.3,
  knobColor: 0xFFFFFF,
  knobAlpha: 0.8,
  borderColor: 0xFFFFFF,
  borderWidth: 2,
  borderAlpha: 0.5,
};

/**
 * VirtualJoystick - Touch-based joystick for mobile game controls
 *
 * Supports two modes:
 * - **fixed**: Always visible at a set position
 * - **dynamic**: Appears where the user touches within the activation zone
 *
 * @example
 * ```typescript
 * // Dynamic joystick (appears on touch)
 * const joystick = new VirtualJoystick({
 *   mode: 'dynamic',
 *   activationZone: { x: 0, y: 0, width: 0.5, height: 1 }
 * });
 *
 * joystick.on('move', (data) => {
 *   player.velocity.x = data.vector.x * speed;
 *   player.velocity.y = data.vector.y * speed;
 * });
 *
 * scene.addChild(joystick.getContainer());
 *
 * // Fixed joystick
 * const fixedJoystick = new VirtualJoystick({
 *   mode: 'fixed',
 *   position: { x: 100, y: 500 },
 *   size: 140
 * });
 * ```
 */
export class VirtualJoystick extends EventEmitter {
  private container: IContainer;
  private baseGraphics: IGraphics;
  private knobGraphics: IGraphics;

  private config: Required<VirtualJoystickConfig>;
  private style: Required<JoystickStyle>;

  // State
  private isActive: boolean = false;
  private activePointerId: number | null = null;
  private centerPosition: { x: number; y: number } = { x: 0, y: 0 };
  private knobPosition: { x: number; y: number } = { x: 0, y: 0 };
  private currentData: JoystickMoveData;

  // Animation
  private fadeAnimation: number | null = null;
  private currentAlpha: number = 1;

  // Bound event handlers for cleanup
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;

  // Screen dimensions cache
  private screenWidth: number = window.innerWidth;
  private screenHeight: number = window.innerHeight;

  constructor(config: VirtualJoystickConfig) {
    super();

    // Merge config with defaults
    this.config = {
      mode: config.mode,
      position: config.position || { x: 100, y: window.innerHeight - 200 },
      activationZone: config.activationZone || { x: 0, y: 0, width: 0.5, height: 1 },
      size: config.size || 120,
      knobSize: config.knobSize || (config.size || 120) * 0.4,
      deadZone: config.deadZone ?? 0.1,
      maxDistance: config.maxDistance || (config.size || 120) * 0.4,
      style: config.style || {},
      hideWhenIdle: config.hideWhenIdle ?? true,
      fadeInDuration: config.fadeInDuration ?? 100,
      fadeOutDuration: config.fadeOutDuration ?? 200,
    };

    // Merge style with defaults
    this.style = { ...DEFAULT_STYLE, ...this.config.style };

    // Initialize move data
    this.currentData = {
      vector: { x: 0, y: 0 },
      angle: 0,
      magnitude: 0,
      direction: 'idle',
      rawPosition: { x: 0, y: 0 },
    };

    // Create graphics
    const factory = graphics();
    this.container = factory.createContainer();
    this.baseGraphics = factory.createGraphics();
    this.knobGraphics = factory.createGraphics();

    this.container.addChild(this.baseGraphics);
    this.container.addChild(this.knobGraphics);

    // Bind event handlers
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);

    // Initial render
    this.render();

    // Setup based on mode
    if (this.config.mode === 'fixed') {
      this.centerPosition = { ...this.config.position };
      this.updatePosition();
      this.container.alpha = 1;
    } else {
      // Dynamic mode - hide initially if configured
      if (this.config.hideWhenIdle) {
        this.container.alpha = 0;
        this.container.visible = false;
      }
    }

    // Setup event listeners
    this.setupEventListeners();

    // Listen for resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Render the joystick graphics
   */
  private render(): void {
    const { size, knobSize } = this.config;
    const halfSize = size / 2;
    const halfKnob = knobSize / 2;

    // Clear previous graphics
    this.baseGraphics.clear();
    this.knobGraphics.clear();

    // Draw base circle
    this.baseGraphics.circle(0, 0, halfSize);
    this.baseGraphics.fill({ color: this.style.baseColor, alpha: this.style.baseAlpha });
    this.baseGraphics.circle(0, 0, halfSize);
    this.baseGraphics.stroke({
      color: this.style.borderColor,
      width: this.style.borderWidth,
      alpha: this.style.borderAlpha
    });

    // Draw knob circle
    this.knobGraphics.circle(0, 0, halfKnob);
    this.knobGraphics.fill({ color: this.style.knobColor, alpha: this.style.knobAlpha });
  }

  /**
   * Setup pointer event listeners
   */
  private setupEventListeners(): void {
    // Use document to capture all pointer events
    document.addEventListener('pointerdown', this.boundPointerDown);
    document.addEventListener('pointermove', this.boundPointerMove);
    document.addEventListener('pointerup', this.boundPointerUp);
    document.addEventListener('pointercancel', this.boundPointerUp);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    document.removeEventListener('pointerdown', this.boundPointerDown);
    document.removeEventListener('pointermove', this.boundPointerMove);
    document.removeEventListener('pointerup', this.boundPointerUp);
    document.removeEventListener('pointercancel', this.boundPointerUp);
  }

  /**
   * Handle pointer down event
   */
  private handlePointerDown(event: PointerEvent): void {
    // Already tracking a pointer
    if (this.activePointerId !== null) return;

    const pos = { x: event.clientX, y: event.clientY };

    if (this.config.mode === 'dynamic') {
      // Check if touch is within activation zone
      if (!this.isInActivationZone(pos)) return;

      // Set center to touch position
      this.centerPosition = { ...pos };
      this.updatePosition();

      // Show joystick
      this.showJoystick();
    } else {
      // Fixed mode - check if touch is on the joystick
      if (!this.isInJoystickArea(pos)) return;
    }

    // Start tracking
    this.isActive = true;
    this.activePointerId = event.pointerId;

    // Update knob position
    this.updateKnob(pos);

    this.emit('start');
  }

  /**
   * Handle pointer move event
   */
  private handlePointerMove(event: PointerEvent): void {
    if (!this.isActive || event.pointerId !== this.activePointerId) return;

    const pos = { x: event.clientX, y: event.clientY };
    this.updateKnob(pos);
  }

  /**
   * Handle pointer up event
   */
  private handlePointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;

    this.isActive = false;
    this.activePointerId = null;

    // Reset knob to center
    this.resetKnob();

    // Hide joystick in dynamic mode
    if (this.config.mode === 'dynamic' && this.config.hideWhenIdle) {
      this.hideJoystick();
    }

    this.emit('end');
  }

  /**
   * Check if position is within activation zone
   */
  private isInActivationZone(pos: { x: number; y: number }): boolean {
    const zone = this.config.activationZone;
    const zoneX = zone.x * this.screenWidth;
    const zoneY = zone.y * this.screenHeight;
    const zoneW = zone.width * this.screenWidth;
    const zoneH = zone.height * this.screenHeight;

    return pos.x >= zoneX && pos.x <= zoneX + zoneW &&
           pos.y >= zoneY && pos.y <= zoneY + zoneH;
  }

  /**
   * Check if position is within joystick area (fixed mode)
   */
  private isInJoystickArea(pos: { x: number; y: number }): boolean {
    const dx = pos.x - this.centerPosition.x;
    const dy = pos.y - this.centerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.config.size / 2;
  }

  /**
   * Update container position based on center
   */
  private updatePosition(): void {
    this.container.x = this.centerPosition.x;
    this.container.y = this.centerPosition.y;
  }

  /**
   * Update knob position based on pointer position
   */
  private updateKnob(pointerPos: { x: number; y: number }): void {
    const dx = pointerPos.x - this.centerPosition.x;
    const dy = pointerPos.y - this.centerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to max distance
    const maxDist = this.config.maxDistance;
    const clampedDistance = Math.min(distance, maxDist);

    // Calculate normalized direction
    let normalizedX = 0;
    let normalizedY = 0;

    if (distance > 0) {
      normalizedX = dx / distance;
      normalizedY = dy / distance;
    }

    // Calculate knob position
    this.knobPosition = {
      x: normalizedX * clampedDistance,
      y: normalizedY * clampedDistance,
    };

    // Update knob graphics position
    this.knobGraphics.x = this.knobPosition.x;
    this.knobGraphics.y = this.knobPosition.y;

    // Calculate magnitude (0-1)
    const magnitude = clampedDistance / maxDist;

    // Apply dead zone
    const effectiveMagnitude = magnitude < this.config.deadZone ? 0 :
      (magnitude - this.config.deadZone) / (1 - this.config.deadZone);

    // Calculate output vector
    const outputX = effectiveMagnitude > 0 ? normalizedX * effectiveMagnitude : 0;
    const outputY = effectiveMagnitude > 0 ? normalizedY * effectiveMagnitude : 0;

    // Calculate angle (0-360, 0 = right, 90 = down)
    let angle = 0;
    if (effectiveMagnitude > 0) {
      angle = Math.atan2(normalizedY, normalizedX) * (180 / Math.PI);
      if (angle < 0) angle += 360;
    }

    // Calculate direction
    const direction = this.calculateDirection(outputX, outputY, effectiveMagnitude);

    // Update current data
    this.currentData = {
      vector: { x: outputX, y: outputY },
      angle,
      magnitude: effectiveMagnitude,
      direction,
      rawPosition: { x: this.knobPosition.x, y: this.knobPosition.y },
    };

    // Emit move event
    this.emit('move', this.currentData);
  }

  /**
   * Calculate 8-way direction from vector
   */
  private calculateDirection(x: number, y: number, magnitude: number): JoystickDirection {
    if (magnitude < 0.01) return 'idle';

    const angle = Math.atan2(y, x) * (180 / Math.PI);

    // 8-way direction based on 45-degree segments
    if (angle >= -22.5 && angle < 22.5) return 'right';
    if (angle >= 22.5 && angle < 67.5) return 'down-right';
    if (angle >= 67.5 && angle < 112.5) return 'down';
    if (angle >= 112.5 && angle < 157.5) return 'down-left';
    if (angle >= 157.5 || angle < -157.5) return 'left';
    if (angle >= -157.5 && angle < -112.5) return 'up-left';
    if (angle >= -112.5 && angle < -67.5) return 'up';
    if (angle >= -67.5 && angle < -22.5) return 'up-right';

    return 'idle';
  }

  /**
   * Reset knob to center position
   */
  private resetKnob(): void {
    this.knobPosition = { x: 0, y: 0 };
    this.knobGraphics.x = 0;
    this.knobGraphics.y = 0;

    // Reset data
    this.currentData = {
      vector: { x: 0, y: 0 },
      angle: 0,
      magnitude: 0,
      direction: 'idle',
      rawPosition: { x: 0, y: 0 },
    };

    // Emit final move with zero values
    this.emit('move', this.currentData);
  }

  /**
   * Show joystick with fade animation
   */
  private showJoystick(): void {
    if (this.fadeAnimation !== null) {
      cancelAnimationFrame(this.fadeAnimation);
    }

    this.container.visible = true;

    const startAlpha = this.currentAlpha;
    const targetAlpha = 1;
    const duration = this.config.fadeInDuration;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.currentAlpha = startAlpha + (targetAlpha - startAlpha) * progress;
      this.container.alpha = this.currentAlpha;

      if (progress < 1) {
        this.fadeAnimation = requestAnimationFrame(animate);
      } else {
        this.fadeAnimation = null;
      }
    };

    this.fadeAnimation = requestAnimationFrame(animate);
  }

  /**
   * Hide joystick with fade animation
   */
  private hideJoystick(): void {
    if (this.fadeAnimation !== null) {
      cancelAnimationFrame(this.fadeAnimation);
    }

    const startAlpha = this.currentAlpha;
    const targetAlpha = 0;
    const duration = this.config.fadeOutDuration;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.currentAlpha = startAlpha + (targetAlpha - startAlpha) * progress;
      this.container.alpha = this.currentAlpha;

      if (progress < 1) {
        this.fadeAnimation = requestAnimationFrame(animate);
      } else {
        this.fadeAnimation = null;
        this.container.visible = false;
      }
    };

    this.fadeAnimation = requestAnimationFrame(animate);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  // =====================
  // Public API
  // =====================

  /**
   * Get the container for adding to scene
   */
  public getContainer(): IContainer {
    return this.container;
  }

  /**
   * Get current joystick data
   */
  public getData(): JoystickMoveData {
    return { ...this.currentData };
  }

  /**
   * Get current vector value
   */
  public getVector(): { x: number; y: number } {
    return { ...this.currentData.vector };
  }

  /**
   * Check if joystick is currently active (being touched)
   */
  public isPressed(): boolean {
    return this.isActive;
  }

  /**
   * Set joystick position (fixed mode) or center position (dynamic mode)
   */
  public setPosition(x: number, y: number): void {
    this.config.position = { x, y };
    if (this.config.mode === 'fixed') {
      this.centerPosition = { x, y };
      this.updatePosition();
    }
  }

  /**
   * Set activation zone (dynamic mode)
   */
  public setActivationZone(zone: ActivationZone): void {
    this.config.activationZone = zone;
  }

  /**
   * Update joystick style
   */
  public setStyle(style: Partial<JoystickStyle>): void {
    this.style = { ...this.style, ...style };
    this.render();
  }

  /**
   * Set joystick size
   */
  public setSize(size: number, knobSize?: number): void {
    this.config.size = size;
    this.config.knobSize = knobSize || size * 0.4;
    this.config.maxDistance = size * 0.4;
    this.render();
  }

  /**
   * Set dead zone threshold
   */
  public setDeadZone(deadZone: number): void {
    this.config.deadZone = Math.max(0, Math.min(1, deadZone));
  }

  /**
   * Show the joystick
   */
  public show(): void {
    this.container.visible = true;
    this.container.alpha = 1;
    this.currentAlpha = 1;
  }

  /**
   * Hide the joystick
   */
  public hide(): void {
    this.container.visible = false;
    this.container.alpha = 0;
    this.currentAlpha = 0;
  }

  /**
   * Enable the joystick
   */
  public enable(): void {
    this.setupEventListeners();
  }

  /**
   * Disable the joystick
   */
  public disable(): void {
    this.removeEventListeners();
    if (this.isActive) {
      this.isActive = false;
      this.activePointerId = null;
      this.resetKnob();
    }
  }

  /**
   * Update joystick (call in game loop if needed for animations)
   */
  public update(_deltaTime: number): void {
    // Currently animations are handled via requestAnimationFrame
    // This method is provided for future extensions
  }

  /**
   * Destroy the joystick and clean up resources
   */
  public destroy(): void {
    // Cancel any pending animation
    if (this.fadeAnimation !== null) {
      cancelAnimationFrame(this.fadeAnimation);
      this.fadeAnimation = null;
    }

    // Remove event listeners
    this.removeEventListeners();
    window.removeEventListener('resize', this.handleResize.bind(this));

    // Destroy graphics
    this.container.destroy();

    // Remove all event listeners
    this.removeAllListeners();
  }
}
