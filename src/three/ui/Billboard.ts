import * as THREE from 'three';
import { Logger } from '../../utils/Logger.js';

/**
 * Configuration options for Billboard
 */
export interface BillboardConfig {
  /** Image path or THREE.Texture */
  texture: string | THREE.Texture;
  /** Billboard size in world units [width, height] */
  size: [number, number];
  /** Offset from parent position [x, y, z] */
  offset?: [number, number, number];
  /** Scale with distance (default true) */
  scaleWithDistance?: boolean;
  /** Fixed size in screen pixels if scaleWithDistance is false */
  fixedSize?: number;
  /** Opacity (0-1, default 1) */
  opacity?: number;
  /** Enable depth testing (default true) */
  depthTest?: boolean;
  /** Enable depth writing (default false) */
  depthWrite?: boolean;
}

/**
 * Billboard - A sprite that always faces the camera
 *
 * Features:
 * - Automatic camera facing
 * - Optional distance-based scaling
 * - Fixed screen-space size mode
 * - Texture loading from path or THREE.Texture
 * - Offset positioning from parent
 *
 * @example
 * ```typescript
 * const billboard = new Billboard({
 *   texture: '/assets/marker.png',
 *   size: [1, 1],
 *   offset: [0, 2, 0]
 * });
 * billboard.attachTo(player);
 *
 * // In game loop
 * billboard.update(camera);
 * ```
 */
export class Billboard extends THREE.Group {
  private sprite: THREE.Sprite;
  private material: THREE.SpriteMaterial;
  private config: Required<BillboardConfig>;
  private parentObject: THREE.Object3D | null = null;
  private textureLoader: THREE.TextureLoader;
  private loadedTexture: THREE.Texture | null = null;

  constructor(config: BillboardConfig) {
    super();

    // Set defaults
    this.config = {
      texture: config.texture,
      size: config.size,
      offset: config.offset || [0, 0, 0],
      scaleWithDistance: config.scaleWithDistance ?? true,
      fixedSize: config.fixedSize || 100,
      opacity: config.opacity ?? 1,
      depthTest: config.depthTest ?? true,
      depthWrite: config.depthWrite ?? false
    };

    this.textureLoader = new THREE.TextureLoader();

    // Create material
    this.material = new THREE.SpriteMaterial({
      transparent: true,
      opacity: this.config.opacity,
      depthTest: this.config.depthTest,
      depthWrite: this.config.depthWrite
    });

    // Create sprite
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.set(this.config.size[0], this.config.size[1], 1);
    this.add(this.sprite);

    // Load texture
    this._loadTexture(this.config.texture);

    // Apply offset
    this.position.set(...this.config.offset);
  }

  /**
   * Attach billboard to a parent object
   */
  attachTo(parent: THREE.Object3D): void {
    if (this.parentObject) {
      this.detach();
    }

    this.parentObject = parent;
    parent.add(this);
  }

  /**
   * Detach billboard from parent
   */
  detach(): void {
    if (this.parentObject) {
      this.parentObject.remove(this);
      this.parentObject = null;
    }
  }

  /**
   * Update texture
   */
  setTexture(texture: string | THREE.Texture): void {
    this.config.texture = texture;
    this._loadTexture(texture);
  }

  /**
   * Update billboard size in world units
   */
  setSize(width: number, height: number): void {
    this.config.size = [width, height];
    if (this.config.scaleWithDistance) {
      this.sprite.scale.set(width, height, 1);
    }
  }

  /**
   * Update offset from parent position
   */
  setOffset(x: number, y: number, z: number): void {
    this.config.offset = [x, y, z];
    this.position.set(x, y, z);
  }

  /**
   * Update opacity
   */
  setOpacity(opacity: number): void {
    this.config.opacity = Math.max(0, Math.min(1, opacity));
    this.material.opacity = this.config.opacity;
  }

  /**
   * Update billboard orientation and scale
   * Call this each frame for proper billboarding
   */
  update(camera: THREE.Camera): void {
    // Billboard always faces camera (handled automatically by THREE.Sprite)

    // Handle fixed screen-space size mode
    if (!this.config.scaleWithDistance) {
      this._updateFixedSize(camera);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.detach();

    if (this.loadedTexture) {
      this.loadedTexture.dispose();
      this.loadedTexture = null;
    }

    this.material.dispose();
  }

  /**
   * Get the underlying sprite
   */
  getSprite(): THREE.Sprite {
    return this.sprite;
  }

  /**
   * Get the sprite material
   */
  getMaterial(): THREE.SpriteMaterial {
    return this.material;
  }

  /**
   * Load texture from string path or use THREE.Texture directly
   */
  private _loadTexture(texture: string | THREE.Texture): void {
    // Dispose previous texture if we loaded it
    if (this.loadedTexture) {
      this.loadedTexture.dispose();
      this.loadedTexture = null;
    }

    if (typeof texture === 'string') {
      // Load from path
      this.textureLoader.load(
        texture,
        (loadedTexture) => {
          this.loadedTexture = loadedTexture;
          this.material.map = loadedTexture;
          this.material.needsUpdate = true;
        },
        undefined,
        (error) => {
          Logger.error('Billboard', `Failed to load billboard texture: ${texture}`, error);
        }
      );
    } else {
      // Use provided texture directly
      this.material.map = texture;
      this.material.needsUpdate = true;
    }
  }

  /**
   * Calculate and apply fixed screen-space size scaling
   */
  private _updateFixedSize(camera: THREE.Camera): void {
    // Get world position
    const worldPos = new THREE.Vector3();
    this.getWorldPosition(worldPos);

    // Calculate distance to camera
    const distance = camera.position.distanceTo(worldPos);

    // Calculate scale factor based on perspective
    // For perspective camera, objects get smaller with distance
    // We need to scale up to maintain constant screen size
    let scaleFactor = 1;

    if (camera instanceof THREE.PerspectiveCamera) {
      // Calculate how much the object would naturally shrink at this distance
      // and compensate for it
      const vFOV = (camera.fov * Math.PI) / 180;
      const height = 2 * Math.tan(vFOV / 2) * distance;
      const pixelSize = height / window.innerHeight;
      scaleFactor = (this.config.fixedSize * pixelSize) / this.config.size[1];
    } else if (camera instanceof THREE.OrthographicCamera) {
      // For orthographic camera, use zoom level
      const height = (camera.top - camera.bottom) / camera.zoom;
      const pixelSize = height / window.innerHeight;
      scaleFactor = (this.config.fixedSize * pixelSize) / this.config.size[1];
    }

    // Apply scale while maintaining aspect ratio
    const aspect = this.config.size[0] / this.config.size[1];
    this.sprite.scale.set(
      this.config.size[0] * scaleFactor,
      this.config.size[1] * scaleFactor,
      1
    );
  }
}
