import { EventEmitter } from 'eventemitter3';

// ============================================================
// Types & Interfaces
// ============================================================

export interface CameraConfig {
  /** Viewport width in pixels */
  viewportWidth: number;
  /** Viewport height in pixels */
  viewportHeight: number;
  /** World bounds (optional — no clamping if omitted) */
  bounds?: { x: number; y: number; width: number; height: number };
  /** Minimum zoom level (default: 0.25) */
  minZoom?: number;
  /** Maximum zoom level (default: 4) */
  maxZoom?: number;
}

export interface FollowConfig {
  /**
   * Smoothing factor 0–1.
   * 0 = instant snap, 1 = camera never moves.
   * Default: 0.1
   */
  lerp?: number;
  /** Pixel offset applied to the target's x before following */
  offsetX?: number;
  /** Pixel offset applied to the target's y before following */
  offsetY?: number;
  /** Dead zone rect — camera does not move while target stays within this area from center */
  deadZone?: { width: number; height: number };
}

export interface CameraEvents {
  'move': (x: number, y: number) => void;
  'zoom-change': (zoom: number) => void;
  'shake-start': () => void;
  'shake-end': () => void;
}

// ============================================================
// Helpers
// ============================================================

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

// ============================================================
// Camera
// ============================================================

/**
 * 2D Camera system that manipulates a world container's position and scale to
 * implement follow, zoom, bounds clamping, and screen shake.
 *
 * Core concept: the camera position (worldX, worldY) is in world space.
 * The attached container is transformed with the inverse:
 *   container.x = viewportWidth/2 − worldX * zoom
 *   container.y = viewportHeight/2 − worldY * zoom
 *   container.scale.x/y = zoom
 *
 * @example
 * ```typescript
 * const camera = new Camera({ viewportWidth: 480, viewportHeight: 852 });
 * camera.attach(worldContainer);
 * camera.follow(player, { lerp: 0.08 });
 *
 * // in game loop
 * camera.update(dt);
 * ```
 */
export class Camera extends EventEmitter<CameraEvents> {
  // ---- viewport ----
  private readonly _viewportWidth: number;
  private readonly _viewportHeight: number;

  // ---- bounds ----
  private readonly _bounds: { x: number; y: number; width: number; height: number } | undefined;

  // ---- zoom limits ----
  private readonly _minZoom: number;
  private readonly _maxZoom: number;

  // ---- world position ----
  private _x: number = 0;
  private _y: number = 0;

  // ---- desired position (lerp target when not following) ----
  private _targetX: number = 0;
  private _targetY: number = 0;
  private _moveLerp: number = 0; // 0 means instant

  // ---- zoom ----
  private _zoom: number = 1;
  private _targetZoom: number = 1;
  private _zoomLerp: number = 0; // 0 means instant

  // ---- attached container ----
  private _container: any | null = null;

  // ---- follow ----
  private _followTarget: { x: number; y: number } | null = null;
  private _followConfig: Required<FollowConfig> = {
    lerp: 0.1,
    offsetX: 0,
    offsetY: 0,
    deadZone: { width: 0, height: 0 },
  };

  // ---- shake ----
  private _shakeIntensity: number = 0;
  private _shakeDuration: number = 0;
  private _shakeElapsed: number = 0;
  private _shakeActive: boolean = false;
  private _shakeOffsetX: number = 0;
  private _shakeOffsetY: number = 0;

  constructor(config: CameraConfig) {
    super();

    this._viewportWidth = config.viewportWidth;
    this._viewportHeight = config.viewportHeight;
    this._bounds = config.bounds;
    this._minZoom = config.minZoom ?? 0.25;
    this._maxZoom = config.maxZoom ?? 4;

    // Start at center of viewport in world space
    this._x = 0;
    this._y = 0;
    this._targetX = 0;
    this._targetY = 0;
  }

  // ============================================================
  // Read-only state
  // ============================================================

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get zoom(): number { return this._zoom; }

  // ============================================================
  // attach()
  // ============================================================

  /**
   * Attach a world container to this camera.
   * The camera will set container.x, container.y, container.scale.x, container.scale.y
   * each frame. Any object with those properties works (Pixi Container, mock, etc.).
   */
  attach(container: any): void {
    this._container = container;
    this._applyTransform();
  }

  // ============================================================
  // follow() / unfollow()
  // ============================================================

  /**
   * Track a target object each frame, lerping the camera toward it.
   * Call update(dt) each frame to activate movement.
   */
  follow(target: { x: number; y: number }, config?: FollowConfig): void {
    this._followTarget = target;
    this._followConfig = {
      lerp: config?.lerp ?? 0.1,
      offsetX: config?.offsetX ?? 0,
      offsetY: config?.offsetY ?? 0,
      deadZone: config?.deadZone ?? { width: 0, height: 0 },
    };
  }

  /** Stop following the current target. */
  unfollow(): void {
    this._followTarget = null;
  }

  // ============================================================
  // moveTo()
  // ============================================================

  /**
   * Move the camera to a world position.
   * @param x - World x
   * @param y - World y
   * @param instant - If true (default false), snap immediately
   */
  moveTo(x: number, y: number, instant: boolean = false): void {
    this._targetX = x;
    this._targetY = y;

    if (instant) {
      this._x = x;
      this._y = y;
      this._clampToBounds();
      this._applyTransform();
      this.emit('move', this._x, this._y);
    }
    // Non-instant: update() handles lerp via _moveLerp = followConfig.lerp
    // For standalone moveTo without follow we use a gentle default
    if (!this._followTarget) {
      this._moveLerp = instant ? 0 : 0.1;
    }
  }

  // ============================================================
  // setZoom() / zoomBy()
  // ============================================================

  /**
   * Set zoom to an exact level, clamped to [minZoom, maxZoom].
   * @param zoom - Target zoom level (1 = 100%)
   * @param duration - Transition duration in seconds. 0 = instant.
   */
  setZoom(zoom: number, duration: number = 0): void {
    const clamped = clamp(zoom, this._minZoom, this._maxZoom);

    if (duration <= 0) {
      this._zoom = clamped;
      this._targetZoom = clamped;
      this._zoomLerp = 0;
      this._applyTransform();
      this.emit('zoom-change', this._zoom);
    } else {
      this._targetZoom = clamped;
      // Convert duration (seconds) to a lerp factor for per-frame smooth approach.
      // We approximate: factor per frame ≈ 1 - e^(-1 / (duration * 60))
      // Simpler and deterministic: store as lerp speed and drive from update()
      this._zoomLerp = 1 / (duration * 60);
    }
  }

  /**
   * Add a delta to the current target zoom.
   * @param delta - Positive to zoom in, negative to zoom out
   * @param duration - Transition duration in seconds
   */
  zoomBy(delta: number, duration: number = 0): void {
    this.setZoom(this._targetZoom + delta, duration);
  }

  // ============================================================
  // shake()
  // ============================================================

  /**
   * Trigger a screen-shake effect using exponential decay.
   * The shake offset is additive to the camera transform; shake state is
   * managed internally and does not interfere with camera position.
   *
   * @param intensity - Maximum pixel offset (default: 8)
   * @param duration  - Duration in seconds (default: 0.3)
   */
  shake(intensity: number = 8, duration: number = 0.3): void {
    this._shakeIntensity = intensity;
    this._shakeDuration = duration;
    this._shakeElapsed = 0;
    this._shakeActive = true;
    this.emit('shake-start');
  }

  // ============================================================
  // update() — hot path
  // ============================================================

  /**
   * Drive the camera each frame.
   * Must be called from the game loop with delta time in seconds.
   */
  update(dt: number): void {
    // 1. Follow logic — frame-rate-independent exponential lerp toward target
    if (this._followTarget !== null) {
      const desiredX = this._followTarget.x + this._followConfig.offsetX;
      const desiredY = this._followTarget.y + this._followConfig.offsetY;

      // Exponential easing: k normalised so lerp=0.1 at 60fps behaves the same at any fps.
      // Math.min(lerp, 0.999) prevents -log(0) when lerp approaches 1.
      const k = -Math.log(1 - Math.min(this._followConfig.lerp, 0.999)) * 60;
      const t = 1 - Math.exp(-k * dt);

      const dz = this._followConfig.deadZone;
      const halfDZW = dz.width * 0.5;
      const halfDZH = dz.height * 0.5;

      if (halfDZW <= 0 || Math.abs(this._x - desiredX) > halfDZW) {
        this._x += (desiredX - this._x) * t;
      }

      if (halfDZH <= 0 || Math.abs(this._y - desiredY) > halfDZH) {
        this._y += (desiredY - this._y) * t;
      }
    } else if (this._moveLerp > 0) {
      // Standalone moveTo lerp — same frame-rate-independent approach
      const k = -Math.log(1 - Math.min(this._moveLerp, 0.999)) * 60;
      const t = 1 - Math.exp(-k * dt);
      this._x += (this._targetX - this._x) * t;
      this._y += (this._targetY - this._y) * t;
    }

    // 2. Zoom lerp
    if (this._zoomLerp > 0 && this._zoom !== this._targetZoom) {
      const prev = this._zoom;
      this._zoom += (this._targetZoom - this._zoom) * this._zoomLerp;

      // Snap when close enough to avoid infinite convergence
      if (Math.abs(this._zoom - this._targetZoom) < 0.0001) {
        this._zoom = this._targetZoom;
        this._zoomLerp = 0;
      }

      if (this._zoom !== prev) {
        this.emit('zoom-change', this._zoom);
      }
    }

    // 3. Bounds clamping
    this._clampToBounds();

    // 4. Shake update
    this._shakeOffsetX = 0;
    this._shakeOffsetY = 0;

    if (this._shakeActive) {
      this._shakeElapsed += dt;

      if (this._shakeElapsed >= this._shakeDuration) {
        this._shakeActive = false;
        this._shakeOffsetX = 0;
        this._shakeOffsetY = 0;
        this.emit('shake-end');
      } else {
        const progress = this._shakeElapsed / this._shakeDuration;
        // Exponential decay — matches screenShake.ts pattern
        const decayFactor = Math.pow(1 - progress, 2);

        this._shakeOffsetX = (Math.random() * 2 - 1) * this._shakeIntensity * decayFactor;
        this._shakeOffsetY = (Math.random() * 2 - 1) * this._shakeIntensity * decayFactor;
      }
    }

    // 5. Apply final transform to the attached container
    const prevX = this._x;
    const prevY = this._y;
    this._applyTransform();

    // Emit move only when position actually changed
    if (this._x !== prevX || this._y !== prevY) {
      this.emit('move', this._x, this._y);
    }
  }

  // ============================================================
  // Coordinate conversion
  // ============================================================

  /**
   * Convert screen-space coordinates to world-space coordinates.
   * Inverse of the camera transform.
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this._viewportWidth * 0.5) / this._zoom + this._x,
      y: (screenY - this._viewportHeight * 0.5) / this._zoom + this._y,
    };
  }

  /**
   * Convert world-space coordinates to screen-space coordinates.
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this._x) * this._zoom + this._viewportWidth * 0.5,
      y: (worldY - this._y) * this._zoom + this._viewportHeight * 0.5,
    };
  }

  // ============================================================
  // destroy()
  // ============================================================

  /** Release all references and listeners. */
  destroy(): void {
    this._container = null;
    this._followTarget = null;
    this.removeAllListeners();
  }

  // ============================================================
  // Private helpers
  // ============================================================

  /**
   * Clamp camera position so the viewport never exceeds world bounds.
   * If world is smaller than viewport at current zoom, center it instead of clamping.
   */
  private _clampToBounds(): void {
    if (!this._bounds) return;

    const halfW = this._viewportWidth / (2 * this._zoom);
    const halfH = this._viewportHeight / (2 * this._zoom);

    const minX = this._bounds.x + halfW;
    const maxX = this._bounds.x + this._bounds.width - halfW;
    const minY = this._bounds.y + halfH;
    const maxY = this._bounds.y + this._bounds.height - halfH;

    // When world is smaller than viewport, center on world midpoint
    if (minX > maxX) {
      this._x = this._bounds.x + this._bounds.width * 0.5;
    } else {
      this._x = clamp(this._x, minX, maxX);
    }

    if (minY > maxY) {
      this._y = this._bounds.y + this._bounds.height * 0.5;
    } else {
      this._y = clamp(this._y, minY, maxY);
    }
  }

  /**
   * Write the camera transform to the attached container.
   * Shake offsets are added on top of the base position.
   */
  private _applyTransform(): void {
    if (!this._container) return;

    this._container.x =
      this._viewportWidth * 0.5 - (this._x + this._shakeOffsetX) * this._zoom;
    this._container.y =
      this._viewportHeight * 0.5 - (this._y + this._shakeOffsetY) * this._zoom;

    if (this._container.scale) {
      this._container.scale.x = this._zoom;
      this._container.scale.y = this._zoom;
    }
  }
}
