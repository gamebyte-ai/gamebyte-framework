import { EventEmitter } from 'eventemitter3';
import { 
  UIComponent, 
  Point, 
  Size, 
  Rect, 
  Spacing, 
  LayoutConstraint, 
  AnimationConfig,
  ConstraintType 
} from '../../contracts/UI';

/**
 * Abstract base implementation of UI component with common functionality
 */
export abstract class BaseUIComponent extends EventEmitter implements UIComponent {
  // Core properties
  public readonly id: string;
  public parent: UIComponent | null = null;
  public children: UIComponent[] = [];

  // Transform properties
  public position: Point = { x: 0, y: 0 };
  public size: Size = { width: 0, height: 0 };
  public rotation: number = 0;
  public scale: Point = { x: 1, y: 1 };
  public anchor: Point = { x: 0.5, y: 0.5 };

  // Appearance properties
  public visible: boolean = true;
  public alpha: number = 1;
  public interactive: boolean = false;

  // Layout properties
  public margin: Spacing = { top: 0, right: 0, bottom: 0, left: 0 };
  public padding: Spacing = { top: 0, right: 0, bottom: 0, left: 0 };
  public _autoSize: boolean = false;
  public constraints: {
    x: LayoutConstraint;
    y: LayoutConstraint;
    width: LayoutConstraint;
    height: LayoutConstraint;
  };

  // Internal state
  protected _needsLayout: boolean = true;
  protected _destroyed: boolean = false;
  protected _animations: Map<string, any> = new Map();

  constructor(id?: string) {
    super();
    this.id = id || `ui_${Math.random().toString(36).substr(2, 9)}`;
    
    // Default constraints
    this.constraints = {
      x: { type: 'fixed', value: 0 },
      y: { type: 'fixed', value: 0 },
      width: { type: 'wrap' },
      height: { type: 'wrap' }
    };
  }

  /**
   * Initialize the component
   */
  public initialize(): void {
    this.emit('initialize');
  }

  /**
   * Update the component
   */
  public update(deltaTime: number): void {
    if (this._destroyed || !this.visible) return;

    // Update children
    for (const child of this.children) {
      child.update(deltaTime);
    }

    this.emit('update', deltaTime);
  }

  /**
   * Render the component
   */
  public abstract render(renderer: any): void;

  /**
   * Destroy the component and clean up resources
   */
  public destroy(): void {
    if (this._destroyed) return;

    // Stop all animations
    this.stopAllAnimations();

    // Destroy children
    for (const child of [...this.children]) {
      child.destroy();
    }

    // Remove from parent
    this.removeFromParent();

    // Clean up
    this.removeAllListeners();
    this._destroyed = true;

    this.emit('destroy');
  }

  /**
   * Add a child component
   */
  public addChild(child: UIComponent): void {
    if (child.parent) {
      child.removeFromParent();
    }

    this.children.push(child);
    child.parent = this;
    this.requestLayout();

    this.emit('child-added', child);
    child.emit('added-to-parent', this);
  }

  /**
   * Remove a child component
   */
  public removeChild(child: UIComponent): void {
    const index = this.children.indexOf(child);
    if (index === -1) return;

    this.children.splice(index, 1);
    child.parent = null;
    this.requestLayout();

    this.emit('child-removed', child);
    child.emit('removed-from-parent', this);
  }

  /**
   * Remove this component from its parent
   */
  public removeFromParent(): void {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  /**
   * Find a child component by ID
   */
  public getChildById(id: string): UIComponent | null {
    for (const child of this.children) {
      if (child.id === id) {
        return child;
      }
      
      const found = child.getChildById(id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /**
   * Request a layout update
   */
  protected requestLayout(): void {
    this._needsLayout = true;
    if (this.parent) {
      (this.parent as BaseUIComponent).requestLayout();
    }
  }

  /**
   * Perform layout calculations
   */
  public layout(): void {
    if (!this._needsLayout) return;

    this.updateLayout();
    
    // Layout children
    for (const child of this.children) {
      child.layout();
    }

    this._needsLayout = false;
    this.emit('layout');
  }

  /**
   * Update this component's layout (to be overridden by subclasses)
   */
  protected updateLayout(): void {
    // Base implementation - subclasses should override
  }

  /**
   * Get the component's bounding rectangle
   */
  public getBounds(): Rect {
    return {
      x: this.position.x - (this.size.width * this.anchor.x),
      y: this.position.y - (this.size.height * this.anchor.y),
      width: this.size.width,
      height: this.size.height
    };
  }

  /**
   * Get the component's global position
   */
  public getGlobalPosition(): Point {
    let globalPos = { ...this.position };
    let current = this.parent;

    while (current) {
      globalPos.x += current.position.x;
      globalPos.y += current.position.y;
      current = current.parent;
    }

    return globalPos;
  }

  /**
   * Hit test - check if a point intersects with this component
   */
  public hitTest(point: Point): UIComponent | null {
    if (!this.visible || !this.interactive || this.alpha <= 0) {
      return null;
    }

    const bounds = this.getBounds();
    const globalPos = this.getGlobalPosition();
    
    // Adjust bounds to global position
    bounds.x += globalPos.x - this.position.x;
    bounds.y += globalPos.y - this.position.y;

    // Check if point is within bounds
    if (point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y && point.y <= bounds.y + bounds.height) {
      
      // Check children first (they're on top)
      for (let i = this.children.length - 1; i >= 0; i--) {
        const child = this.children[i];
        const hit = child.hitTest(point);
        if (hit) {
          return hit;
        }
      }

      return this;
    }

    return null;
  }

  /**
   * Animate component properties
   */
  public async animate(properties: Partial<UIComponent>, config: AnimationConfig): Promise<void> {
    // This will be implemented by the animation system
    // For now, just set properties immediately
    Object.assign(this, properties);
    
    if (config.onComplete) {
      config.onComplete();
    }
  }

  /**
   * Stop all animations on this component
   */
  public stopAllAnimations(): void {
    this._animations.clear();
  }

  // Utility methods for constraints

  /**
   * Set position constraint
   */
  public setPositionConstraint(
    x: ConstraintType | LayoutConstraint, 
    y?: ConstraintType | LayoutConstraint
  ): this;
  public setPositionConstraint(constraint: LayoutConstraint): this;
  public setPositionConstraint(
    xOrConstraint: ConstraintType | LayoutConstraint, 
    y?: ConstraintType | LayoutConstraint
  ): this {
    if (y !== undefined) {
      // Two parameter version
      this.constraints.x = typeof xOrConstraint === 'string' ? { type: xOrConstraint } : xOrConstraint;
      this.constraints.y = typeof y === 'string' ? { type: y } : y;
    } else {
      // Single constraint parameter version
      const constraint = typeof xOrConstraint === 'string' ? { type: xOrConstraint } : xOrConstraint;
      this.constraints.x = constraint;
      this.constraints.y = constraint;
    }
    this.requestLayout();
    return this;
  }

  /**
   * Set size constraint
   */
  public setSizeConstraint(
    width: ConstraintType | LayoutConstraint, 
    height?: ConstraintType | LayoutConstraint
  ): this;
  public setSizeConstraint(constraint: LayoutConstraint): this;
  public setSizeConstraint(
    widthOrConstraint: ConstraintType | LayoutConstraint, 
    height?: ConstraintType | LayoutConstraint
  ): this {
    if (height !== undefined) {
      // Two parameter version
      this.constraints.width = typeof widthOrConstraint === 'string' ? { type: widthOrConstraint } : widthOrConstraint;
      this.constraints.height = typeof height === 'string' ? { type: height } : height;
    } else {
      // Single constraint parameter version
      const constraint = typeof widthOrConstraint === 'string' ? { type: widthOrConstraint } : widthOrConstraint;
      this.constraints.width = constraint;
      this.constraints.height = constraint;
    }
    this.requestLayout();
    return this;
  }

  /**
   * Set margin
   */
  public setMargin(margin: number | Spacing): this {
    if (typeof margin === 'number') {
      this.margin = { top: margin, right: margin, bottom: margin, left: margin };
    } else {
      this.margin = { ...margin };
    }
    this.requestLayout();
    return this;
  }

  /**
   * Set padding
   */
  public setPadding(padding: number | Spacing): this {
    if (typeof padding === 'number') {
      this.padding = { top: padding, right: padding, bottom: padding, left: padding };
    } else {
      this.padding = { ...padding };
    }
    this.requestLayout();
    return this;
  }

  /**
   * Make component interactive
   */
  public makeInteractive(): this {
    this.interactive = true;
    return this;
  }

  /**
   * Set visibility
   */
  public setVisible(visible: boolean): this {
    this.visible = visible;
    this.emit('visibility-changed', visible);
    return this;
  }

  /**
   * Set alpha (opacity)
   */
  public setAlpha(alpha: number): this {
    this.alpha = Math.max(0, Math.min(1, alpha));
    this.emit('alpha-changed', this.alpha);
    return this;
  }

  /**
   * Set position
   */
  public setPosition(x: number, y: number): this {
    this.position.x = x;
    this.position.y = y;
    this.emit('position-changed', this.position);
    return this;
  }

  /**
   * Set size
   */
  public setSize(width: number, height: number): this {
    this.size.width = width;
    this.size.height = height;
    this.requestLayout();
    this.emit('size-changed', this.size);
    return this;
  }

  /**
   * Set scale
   */
  public setScale(x: number, y?: number): this {
    this.scale.x = x;
    this.scale.y = y ?? x;
    this.emit('scale-changed', this.scale);
    return this;
  }

  /**
   * Set rotation (in radians)
   */
  public setRotation(rotation: number): this {
    this.rotation = rotation;
    this.emit('rotation-changed', this.rotation);
    return this;
  }

  /**
   * Set anchor point
   */
  public setAnchor(x: number | Point, y?: number): this {
    if (typeof x === 'object') {
      this.anchor.x = x.x;
      this.anchor.y = x.y;
    } else {
      this.anchor.x = x;
      this.anchor.y = y ?? x;
    }
    this.emit('anchor-changed', this.anchor);
    return this;
  }
}