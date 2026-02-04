import * as THREE from 'three';

/**
 * Configuration options for HealthBar3D
 */
export interface HealthBar3DConfig {
  /** Width in world units */
  width?: number;
  /** Height in world units */
  height?: number;
  /** Offset from parent object [x, y, z] */
  offset?: [number, number, number];
  /** Background bar color */
  backgroundColor?: number;
  /** Fill bar color when healthy */
  fillColor?: number;
  /** Fill bar color when below threshold */
  lowHealthColor?: number;
  /** Threshold to switch to low health color (0-1) */
  lowHealthThreshold?: number;
  /** Show border around health bar */
  showBorder?: boolean;
  /** Border color */
  borderColor?: number;
  /** Border width in world units */
  borderWidth?: number;
  /** Enable smooth value transitions */
  animated?: boolean;
  /** Animation speed multiplier */
  animationSpeed?: number;
  /** Hide health bar when at full health */
  hideWhenFull?: boolean;
}

/**
 * 3D Health Bar Component
 *
 * A floating health bar that always faces the camera (billboard behavior).
 * Supports smooth animations, color transitions, and configurable styling.
 *
 * @example
 * ```typescript
 * const healthBar = new HealthBar3D({
 *   width: 2,
 *   height: 0.2,
 *   offset: [0, 2.5, 0],
 *   lowHealthThreshold: 0.25
 * });
 *
 * healthBar.attachTo(characterMesh);
 *
 * // In game loop
 * healthBar.update(camera, deltaTime);
 *
 * // Take damage
 * healthBar.damage(0.1); // -10%
 * ```
 */
export class HealthBar3D extends THREE.Group {
  private config: Required<HealthBar3DConfig>;

  // Visual elements
  private backgroundMesh!: THREE.Mesh;
  private fillMesh!: THREE.Mesh;
  private borderMesh: THREE.LineSegments | null = null;

  // Materials
  private backgroundMaterial!: THREE.MeshBasicMaterial;
  private fillMaterial!: THREE.MeshBasicMaterial;

  // State
  private currentValue: number = 1.0; // Current displayed value (0-1)
  private targetValue: number = 1.0;  // Target value for animation (0-1)
  private maxDisplayValue: number = 100; // For display purposes only
  private parentObject: THREE.Object3D | null = null;

  constructor(config: HealthBar3DConfig = {}) {
    super();

    // Merge config with defaults
    this.config = {
      width: config.width ?? 1.5,
      height: config.height ?? 0.15,
      offset: config.offset ?? [0, 2, 0],
      backgroundColor: config.backgroundColor ?? 0x333333,
      fillColor: config.fillColor ?? 0x44ff44,
      lowHealthColor: config.lowHealthColor ?? 0xff4444,
      lowHealthThreshold: config.lowHealthThreshold ?? 0.3,
      showBorder: config.showBorder ?? true,
      borderColor: config.borderColor ?? 0x000000,
      borderWidth: config.borderWidth ?? 0.02,
      animated: config.animated ?? true,
      animationSpeed: config.animationSpeed ?? 5,
      hideWhenFull: config.hideWhenFull ?? false
    };

    // Apply offset
    this.position.set(...this.config.offset);

    // Create visual elements
    this.createBackground();
    this.createFillBar();

    if (this.config.showBorder) {
      this.createBorder();
    }

    // Initial visibility
    this.updateVisibility();
  }

  /**
   * Create background bar mesh
   */
  private createBackground(): void {
    const geometry = new THREE.PlaneGeometry(
      this.config.width,
      this.config.height
    );

    this.backgroundMaterial = new THREE.MeshBasicMaterial({
      color: this.config.backgroundColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });

    this.backgroundMesh = new THREE.Mesh(geometry, this.backgroundMaterial);
    this.add(this.backgroundMesh);
  }

  /**
   * Create fill bar mesh
   */
  private createFillBar(): void {
    const geometry = new THREE.PlaneGeometry(
      this.config.width,
      this.config.height
    );

    this.fillMaterial = new THREE.MeshBasicMaterial({
      color: this.config.fillColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });

    this.fillMesh = new THREE.Mesh(geometry, this.fillMaterial);
    this.fillMesh.position.z = 0.001; // Slightly in front of background
    this.add(this.fillMesh);

    this.updateFillBar();
  }

  /**
   * Create border around health bar
   */
  private createBorder(): void {
    const hw = this.config.width / 2;
    const hh = this.config.height / 2;

    const points: THREE.Vector3[] = [
      new THREE.Vector3(-hw, -hh, 0),
      new THREE.Vector3(hw, -hh, 0),
      new THREE.Vector3(hw, hh, 0),
      new THREE.Vector3(-hw, hh, 0),
      new THREE.Vector3(-hw, -hh, 0)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: this.config.borderColor,
      linewidth: this.config.borderWidth
    });

    this.borderMesh = new THREE.LineSegments(geometry, material);
    this.borderMesh.position.z = 0.002; // In front of fill bar
    this.add(this.borderMesh);
  }

  /**
   * Update fill bar scale and position based on current value
   */
  private updateFillBar(): void {
    // Scale fill bar horizontally based on health value
    this.fillMesh.scale.x = Math.max(0, Math.min(1, this.currentValue));

    // Adjust position so it grows from left to right
    const offset = (this.config.width * (1 - this.currentValue)) / 2;
    this.fillMesh.position.x = -offset;

    // Update color based on health threshold
    this.updateFillColor();
  }

  /**
   * Update fill bar color based on current health value
   */
  private updateFillColor(): void {
    if (this.currentValue <= this.config.lowHealthThreshold) {
      // Low health - transition to low health color
      const t = this.currentValue / this.config.lowHealthThreshold;
      const currentColor = new THREE.Color(this.fillMaterial.color);
      const targetColor = new THREE.Color(this.config.lowHealthColor);
      currentColor.lerp(targetColor, 1 - t);
      this.fillMaterial.color.copy(currentColor);
    } else {
      // Normal health
      this.fillMaterial.color.setHex(this.config.fillColor);
    }
  }

  /**
   * Update visibility based on hideWhenFull setting
   */
  private updateVisibility(): void {
    if (this.config.hideWhenFull) {
      this.visible = this.targetValue < 1.0;
    } else {
      this.visible = true;
    }
  }

  /**
   * Attach health bar to a parent object
   */
  public attachTo(parent: THREE.Object3D): void {
    if (this.parentObject) {
      this.detach();
    }

    this.parentObject = parent;
    parent.add(this);
  }

  /**
   * Detach health bar from parent object
   */
  public detach(): void {
    if (this.parentObject) {
      this.parentObject.remove(this);
      this.parentObject = null;
    }
  }

  /**
   * Set health value (0-1 normalized)
   */
  public setValue(value: number): void {
    this.targetValue = Math.max(0, Math.min(1, value));

    if (!this.config.animated) {
      this.currentValue = this.targetValue;
      this.updateFillBar();
    }

    this.updateVisibility();
  }

  /**
   * Get current health value (0-1)
   */
  public getValue(): number {
    return this.targetValue;
  }

  /**
   * Set maximum display value (for UI purposes, internal stays 0-1)
   */
  public setMaxValue(max: number): void {
    this.maxDisplayValue = max;
  }

  /**
   * Apply damage (decrease health)
   */
  public damage(amount: number): void {
    this.setValue(this.targetValue - amount);
  }

  /**
   * Apply healing (increase health)
   */
  public heal(amount: number): void {
    this.setValue(this.targetValue + amount);
  }

  /**
   * Set whether to hide bar when full
   */
  public setHideWhenFull(hide: boolean): void {
    this.config.hideWhenFull = hide;
    this.updateVisibility();
  }

  /**
   * Update health bar (call in game loop)
   *
   * @param camera - Camera for billboard behavior
   * @param deltaTime - Time since last frame in seconds
   */
  public update(camera: THREE.Camera, deltaTime: number): void {
    // Billboard behavior - face camera
    this.quaternion.copy(camera.quaternion);

    // Animate value changes
    if (this.config.animated && this.currentValue !== this.targetValue) {
      const diff = this.targetValue - this.currentValue;
      const step = this.config.animationSpeed * deltaTime;

      if (Math.abs(diff) < step) {
        this.currentValue = this.targetValue;
      } else {
        this.currentValue += Math.sign(diff) * step;
      }

      this.updateFillBar();
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Dispose geometries
    this.backgroundMesh.geometry.dispose();
    this.fillMesh.geometry.dispose();

    if (this.borderMesh) {
      this.borderMesh.geometry.dispose();
      (this.borderMesh.material as THREE.Material).dispose();
    }

    // Dispose materials
    this.backgroundMaterial.dispose();
    this.fillMaterial.dispose();

    // Detach from parent
    this.detach();

    // Clear references
    this.clear();
  }

  /**
   * Get current health as a percentage (0-100)
   */
  public getHealthPercentage(): number {
    return this.targetValue * 100;
  }

  /**
   * Get current health as display value
   */
  public getDisplayValue(): number {
    return Math.round(this.targetValue * this.maxDisplayValue);
  }

  /**
   * Set health from display value
   */
  public setDisplayValue(value: number): void {
    this.setValue(value / this.maxDisplayValue);
  }

  /**
   * Check if health is critically low
   */
  public isCritical(): boolean {
    return this.targetValue <= this.config.lowHealthThreshold;
  }

  /**
   * Check if health is full
   */
  public isFull(): boolean {
    return this.targetValue >= 1.0;
  }

  /**
   * Check if health is depleted
   */
  public isEmpty(): boolean {
    return this.targetValue <= 0;
  }
}
