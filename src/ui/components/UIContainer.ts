import { BaseUIComponent } from '../core/BaseUIComponent';
import { Size } from '../../contracts/UI';

/**
 * Basic container component that can hold other UI components
 */
export class UIContainer extends BaseUIComponent {
  constructor(id?: string) {
    super(id);
    this.interactive = false; // Containers are not interactive by default
  }

  /**
   * Render the container (typically just renders children)
   */
  public render(renderer: any): void {
    if (!this.visible || this.alpha <= 0) return;

    // Container itself doesn't render anything visual
    // Just render children
    for (const child of this.children) {
      child.render(renderer);
    }
  }

  /**
   * Update layout for container - arrange children
   */
  protected updateLayout(): void {
    // Basic layout - just ensures children fit within bounds
    const availableSize: Size = {
      width: this.size.width - this.padding.left - this.padding.right,
      height: this.size.height - this.padding.top - this.padding.bottom
    };

    // Apply padding offset to children positions
    for (const child of this.children) {
      // This is a basic implementation - more sophisticated layouts
      // would be handled by specific layout managers
      if (child.constraints.x.type === 'fixed' && child.constraints.y.type === 'fixed') {
        // Add padding offset for fixed positioned children
        const baseChild = child as BaseUIComponent;
        if (baseChild.position.x < this.padding.left) {
          baseChild.position.x += this.padding.left;
        }
        if (baseChild.position.y < this.padding.top) {
          baseChild.position.y += this.padding.top;
        }
      }
    }
  }

  /**
   * Auto-size container to fit content
   */
  public autoSize(): this {
    let maxWidth = 0;
    let maxHeight = 0;

    for (const child of this.children) {
      const bounds = child.getBounds();
      const rightEdge = bounds.x + bounds.width;
      const bottomEdge = bounds.y + bounds.height;
      
      if (rightEdge > maxWidth) {
        maxWidth = rightEdge;
      }
      if (bottomEdge > maxHeight) {
        maxHeight = bottomEdge;
      }
    }

    // Add padding
    maxWidth += this.padding.left + this.padding.right;
    maxHeight += this.padding.top + this.padding.bottom;

    this.setSize(maxWidth, maxHeight);
    return this;
  }

  /**
   * Arrange children in a vertical stack
   */
  public arrangeVertically(spacing: number = 0): this {
    let currentY = this.padding.top;

    for (const child of this.children) {
      child.setPosition(this.padding.left, currentY);
      currentY += child.size.height + spacing;
    }

    // Auto-resize container if needed
    const totalHeight = currentY - spacing + this.padding.bottom;
    if (totalHeight > this.size.height) {
      this.setSize(this.size.width, totalHeight);
    }

    return this;
  }

  /**
   * Arrange children in a horizontal row
   */
  public arrangeHorizontally(spacing: number = 0): this {
    let currentX = this.padding.left;

    for (const child of this.children) {
      child.setPosition(currentX, this.padding.top);
      currentX += child.size.width + spacing;
    }

    // Auto-resize container if needed
    const totalWidth = currentX - spacing + this.padding.right;
    if (totalWidth > this.size.width) {
      this.setSize(totalWidth, this.size.height);
    }

    return this;
  }

  /**
   * Center all children within the container
   */
  public centerChildren(): this {
    const centerX = this.size.width / 2;
    const centerY = this.size.height / 2;

    for (const child of this.children) {
      child.setPosition(centerX, centerY);
      child.setAnchor(0.5, 0.5);
    }

    return this;
  }

  /**
   * Distribute children evenly horizontally
   */
  public distributeHorizontally(): this {
    if (this.children.length <= 1) return this;

    const availableWidth = this.size.width - this.padding.left - this.padding.right;
    const spacing = availableWidth / (this.children.length - 1);

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const x = this.padding.left + (i * spacing);
      child.setPosition(x, child.position.y);
    }

    return this;
  }

  /**
   * Distribute children evenly vertically
   */
  public distributeVertically(): this {
    if (this.children.length <= 1) return this;

    const availableHeight = this.size.height - this.padding.top - this.padding.bottom;
    const spacing = availableHeight / (this.children.length - 1);

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const y = this.padding.top + (i * spacing);
      child.setPosition(child.position.x, y);
    }

    return this;
  }
}