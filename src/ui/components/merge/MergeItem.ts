import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, ISprite, ITexture } from '../../../contracts/Graphics';
import { graphics } from '../../../graphics/GraphicsEngine';

/**
 * MergeItem configuration
 */
export interface MergeItemConfig {
  /** Item tier/level (items with same tier can merge) */
  tier: number;
  /** Maximum tier this item can reach */
  maxTier?: number;
  /** Visual size of the item */
  size?: number;
  /** Item ID for tracking */
  id?: string;
  /** Texture for each tier (optional, uses default visuals if not provided) */
  textures?: Map<number, ITexture>;
  /** Color for each tier (used when no texture) */
  tierColors?: number[];
  /** Whether this item can be dragged */
  draggable?: boolean;
  /** Whether this item can be merged with others */
  mergeable?: boolean;
  /** Custom data attached to this item */
  data?: Record<string, any>;
}

/**
 * Events emitted by MergeItem
 */
export interface MergeItemEvents {
  'drag-start': (item: MergeItem, x: number, y: number) => void;
  'drag-move': (item: MergeItem, x: number, y: number) => void;
  'drag-end': (item: MergeItem, x: number, y: number) => void;
  'merge-start': (item: MergeItem, targetItem: MergeItem) => void;
  'merge-complete': (resultItem: MergeItem, mergedItems: MergeItem[]) => void;
  'tier-changed': (item: MergeItem, oldTier: number, newTier: number) => void;
  'destroyed': (item: MergeItem) => void;
}

/**
 * Default tier colors (vibrant mobile game palette)
 */
const DEFAULT_TIER_COLORS = [
  0x9E9E9E,  // Tier 0: Gray
  0x4CAF50,  // Tier 1: Green
  0x2196F3,  // Tier 2: Blue
  0x9C27B0,  // Tier 3: Purple
  0xFF9800,  // Tier 4: Orange
  0xF44336,  // Tier 5: Red
  0xFFEB3B,  // Tier 6: Yellow/Gold
  0x00BCD4,  // Tier 7: Cyan
  0xE91E63,  // Tier 8: Pink
  0x673AB7,  // Tier 9: Deep Purple
  0xFFD700,  // Tier 10+: Gold (max tier)
];

/**
 * MergeItem - Draggable, mergeable item for merge puzzle games
 *
 * A MergeItem represents a single item on the merge grid that can be:
 * - Dragged by the player
 * - Dropped onto other items or cells
 * - Merged with items of the same tier to create a higher tier item
 *
 * Features:
 * - Tier-based visual system (colors or textures)
 * - Touch/mouse drag support
 * - Merge zone detection
 * - Smooth animations for spawn, merge, destroy
 * - Mobile-optimized touch targets
 *
 * @example
 * ```typescript
 * const item = new MergeItem({
 *   tier: 1,
 *   size: 80,
 *   draggable: true
 * });
 *
 * item.on('drag-end', (item, x, y) => {
 *   // Check for merge or placement
 * });
 *
 * // Merge two items
 * if (item1.canMergeWith(item2)) {
 *   const result = item1.mergeWith(item2);
 * }
 * ```
 */
export class MergeItem extends EventEmitter<MergeItemEvents> {
  private container: IContainer;
  private background: IGraphics;
  private sprite?: ISprite;
  private tierLabel?: IGraphics;

  private config: Required<MergeItemConfig>;
  private _tier: number;
  private _isDragging: boolean = false;
  private _isDestroyed: boolean = false;
  private _originalPosition: { x: number; y: number } = { x: 0, y: 0 };
  private _dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  // For merge zone detection
  private _mergeZoneRadius: number = 1.2; // 20% larger than visual size

  constructor(config: MergeItemConfig) {
    super();

    this.config = {
      tier: config.tier,
      maxTier: config.maxTier ?? 10,
      size: config.size ?? 80,
      id: config.id ?? `item_${Math.random().toString(36).substr(2, 9)}`,
      textures: config.textures ?? new Map(),
      tierColors: config.tierColors ?? DEFAULT_TIER_COLORS,
      draggable: config.draggable ?? true,
      mergeable: config.mergeable ?? true,
      data: config.data ?? {}
    };

    this._tier = config.tier;

    // Create visual elements
    this.container = graphics().createContainer();
    this.background = graphics().createGraphics();
    this.container.addChild(this.background);

    // Setup interactive
    if (this.config.draggable) {
      this.setupDragInteraction();
    }

    // Initial render
    this.updateVisuals();
  }

  // ============================================
  // PUBLIC GETTERS
  // ============================================

  /** Get the item's unique ID */
  get id(): string {
    return this.config.id;
  }

  /** Get the current tier */
  get tier(): number {
    return this._tier;
  }

  /** Get the visual size */
  get size(): number {
    return this.config.size;
  }

  /** Check if item is being dragged */
  get isDragging(): boolean {
    return this._isDragging;
  }

  /** Check if item can be dragged */
  get canBeDragged(): boolean {
    return this.config.draggable && !this._isDestroyed;
  }

  /** Check if item can be merged */
  get canBeMerged(): boolean {
    return this.config.mergeable && !this._isDestroyed && this._tier < this.config.maxTier;
  }

  /** Get the display container */
  getContainer(): IContainer {
    return this.container;
  }

  /** Get current position */
  getPosition(): { x: number; y: number } {
    return {
      x: this.container.x,
      y: this.container.y
    };
  }

  /** Get world position */
  getWorldPosition(): { x: number; y: number } {
    const containerAny = this.container as any;
    const pos = containerAny.getGlobalPosition?.() ?? { x: this.container.x, y: this.container.y };
    return { x: pos.x, y: pos.y };
  }

  /** Get custom data */
  getData<T = any>(key: string): T | undefined {
    return this.config.data[key] as T;
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Set the item's position
   */
  setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  /**
   * Set the item's scale
   */
  setScale(scale: number): this {
    this.container.scale.x = scale;
    this.container.scale.y = scale;
    return this;
  }

  /**
   * Store the original position (for drag cancel)
   */
  storeOriginalPosition(): void {
    this._originalPosition = this.getPosition();
  }

  /**
   * Return to original position (with optional animation)
   */
  returnToOriginalPosition(animate: boolean = true): void {
    if (animate) {
      // TODO: Use GSAP or built-in animation system
      this.setPosition(this._originalPosition.x, this._originalPosition.y);
    } else {
      this.setPosition(this._originalPosition.x, this._originalPosition.y);
    }
  }

  /**
   * Check if this item can merge with another
   */
  canMergeWith(other: MergeItem): boolean {
    if (!this.canBeMerged || !other.canBeMerged) {
      return false;
    }
    if (other === this) {
      return false;
    }
    if (other._tier !== this._tier) {
      return false;
    }
    if (this._tier >= this.config.maxTier) {
      return false;
    }
    return true;
  }

  /**
   * Check if a point is within this item's merge zone
   * (The merge zone is slightly larger than the visual for easier gameplay)
   */
  isPointInMergeZone(x: number, y: number): boolean {
    const pos = this.getWorldPosition();
    const mergeRadius = (this.config.size / 2) * this._mergeZoneRadius;

    const dx = x - pos.x;
    const dy = y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= mergeRadius;
  }

  /**
   * Perform merge with another item
   * Returns the resulting higher-tier item
   */
  mergeWith(other: MergeItem): MergeItem {
    if (!this.canMergeWith(other)) {
      throw new Error('Cannot merge these items');
    }

    // Emit merge start event
    this.emit('merge-start', this, other);
    other.emit('merge-start', other, this);

    // Calculate result position (midpoint)
    const pos1 = this.getPosition();
    const pos2 = other.getPosition();
    const resultPos = {
      x: (pos1.x + pos2.x) / 2,
      y: (pos1.y + pos2.y) / 2
    };

    // Create result item with higher tier
    const resultItem = new MergeItem({
      ...this.config,
      tier: this._tier + 1,
      id: undefined // Generate new ID
    });
    resultItem.setPosition(resultPos.x, resultPos.y);

    // Emit events
    this.emit('merge-complete', resultItem, [this, other]);
    other.emit('merge-complete', resultItem, [this, other]);
    resultItem.emit('tier-changed', resultItem, 0, resultItem.tier);

    // Destroy merged items
    this.destroy();
    other.destroy();

    return resultItem;
  }

  /**
   * Upgrade tier (used after merge animation)
   */
  upgradeTier(): boolean {
    if (this._tier >= this.config.maxTier) {
      return false;
    }

    const oldTier = this._tier;
    this._tier++;
    this.updateVisuals();
    this.emit('tier-changed', this, oldTier, this._tier);

    return true;
  }

  /**
   * Set custom data
   */
  setData(key: string, value: any): this {
    this.config.data[key] = value;
    return this;
  }

  /**
   * Destroy the item
   */
  destroy(): void {
    if (this._isDestroyed) return;

    this._isDestroyed = true;
    this.emit('destroyed', this);

    // Clean up graphics
    this.container.destroy();
    this.removeAllListeners();
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Setup drag interaction
   */
  private setupDragInteraction(): void {
    this.container.interactive = true;
    this.container.cursor = 'pointer';

    // Pointer down
    this.container.on('pointerdown', (event: any) => {
      if (!this.canBeDragged) return;

      this._isDragging = true;
      this.storeOriginalPosition();

      const pos = event.data?.global ?? event.global ?? { x: 0, y: 0 };
      const itemPos = this.getPosition();
      this._dragOffset = {
        x: itemPos.x - pos.x,
        y: itemPos.y - pos.y
      };

      // Bring to front
      const containerAny = this.container as any;
      if (containerAny.parent) {
        containerAny.parent.setChildIndex(this.container, containerAny.parent.children.length - 1);
      }

      this.emit('drag-start', this, pos.x, pos.y);
    });

    // Pointer move
    this.container.on('pointermove', (event: any) => {
      if (!this._isDragging) return;

      const pos = event.data?.global ?? event.global ?? { x: 0, y: 0 };
      this.setPosition(
        pos.x + this._dragOffset.x,
        pos.y + this._dragOffset.y
      );

      this.emit('drag-move', this, pos.x, pos.y);
    });

    // Pointer up
    this.container.on('pointerup', (event: any) => {
      if (!this._isDragging) return;

      this._isDragging = false;
      const pos = event.data?.global ?? event.global ?? { x: 0, y: 0 };

      this.emit('drag-end', this, pos.x, pos.y);
    });

    // Pointer up outside
    this.container.on('pointerupoutside', (event: any) => {
      if (!this._isDragging) return;

      this._isDragging = false;
      const pos = event.data?.global ?? event.global ?? { x: 0, y: 0 };

      this.emit('drag-end', this, pos.x, pos.y);
    });
  }

  /**
   * Update visual appearance based on tier
   */
  private updateVisuals(): void {
    const size = this.config.size;
    const halfSize = size / 2;

    // Clear previous graphics
    this.background.clear();

    // Get color for current tier
    const colorIndex = Math.min(this._tier, this.config.tierColors.length - 1);
    const color = this.config.tierColors[colorIndex];

    // Check for texture
    const texture = this.config.textures.get(this._tier);

    if (texture && !this.sprite) {
      // Create sprite for texture
      this.sprite = graphics().createSprite(texture);
      this.sprite.anchor?.set(0.5, 0.5);
      this.sprite.width = size;
      this.sprite.height = size;
      this.container.addChild(this.sprite);
    } else if (texture && this.sprite) {
      // Update sprite texture
      this.sprite.texture = texture;
    } else {
      // Draw colored circle/square using Pixi v8 modern API
      // Shadow
      this.background
        .roundRect(-halfSize + 3, -halfSize + 3, size, size, size * 0.2)
        .fill({ color: 0x000000, alpha: 0.2 });

      // Main shape
      this.background
        .roundRect(-halfSize, -halfSize, size, size, size * 0.2)
        .fill({ color, alpha: 1 });

      // Highlight
      this.background
        .roundRect(-halfSize + 4, -halfSize + 4, size - 8, size * 0.3, size * 0.15)
        .fill({ color: 0xFFFFFF, alpha: 0.3 });

      // Tier indicator (small number or stars)
      this.drawTierIndicator();
    }
  }

  /**
   * Draw tier indicator (number or stars)
   */
  private drawTierIndicator(): void {
    const size = this.config.size;
    const indicatorSize = size * 0.25;

    // Draw tier number in bottom-right corner
    if (!this.tierLabel) {
      this.tierLabel = graphics().createGraphics();
      this.container.addChild(this.tierLabel);
    }

    this.tierLabel.clear();

    // Background circle using Pixi v8 modern API
    this.tierLabel
      .circle(size / 2 - indicatorSize, size / 2 - indicatorSize, indicatorSize)
      .fill({ color: 0x000000, alpha: 0.5 });

    // TODO: Add text for tier number when text rendering is available
  }
}

export default MergeItem;
