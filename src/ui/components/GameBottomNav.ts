import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { darkenColor, lightenColor } from '../themes/GameStyleUITheme';
import { getFrameworkFontFamily } from '../utils/FontLoader';

/**
 * Bottom nav item type
 */
export type NavItemType = 'shop' | 'play' | 'profile' | 'leaderboard' | 'settings' | 'custom';

/**
 * Nav item configuration
 */
export interface NavItemConfig {
  id: string;
  type: NavItemType;
  label?: string;
  icon?: string;
  badge?: number;
  locked?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
}

/**
 * GameBottomNav configuration
 */
export interface GameBottomNavConfig {
  width: number;
  height?: number;
  items: NavItemConfig[];
  backgroundColor?: number;
  activeIndex?: number;
}

/**
 * GameBottomNav - Game-style bottom navigation bar
 *
 * Features:
 * - Three main sections: left icon, center main button, right icon
 * - Center button is larger and highlighted
 * - Game-style icons and badges
 * - Lock states for unavailable items
 * - Smooth press animations
 *
 * Inspired by: Brawl Stars, mobile game navigation
 *
 * @example
 * ```typescript
 * const bottomNav = new GameBottomNav({
 *   width: 400,
 *   items: [
 *     { id: 'shop', type: 'shop', label: 'Shop' },
 *     { id: 'play', type: 'play', label: 'Start', highlighted: true },
 *     { id: 'profile', type: 'profile', locked: true }
 *   ]
 * });
 *
 * bottomNav.on('item-click', (id) => handleNavClick(id));
 * stage.addChild(bottomNav.getContainer());
 * ```
 */
export class GameBottomNav extends EventEmitter {
  private container: IContainer;
  private backgroundGraphics: IGraphics;
  private itemContainers: Map<string, IContainer> = new Map();

  private config: Required<GameBottomNavConfig>;

  constructor(config: GameBottomNavConfig) {
    super();

    this.config = {
      width: config.width,
      height: config.height || 90,
      items: config.items,
      backgroundColor: config.backgroundColor || 0x1A237E,
      activeIndex: config.activeIndex || 0
    };

    this.container = graphics().createContainer();
    this.backgroundGraphics = graphics().createGraphics();
    this.container.addChild(this.backgroundGraphics);

    this.createBackground();
    this.createNavItems();
  }

  /**
   * Create background with gradient
   */
  private createBackground(): void {
    const { width, height, backgroundColor } = this.config;

    this.backgroundGraphics.clear();

    // Main background
    this.backgroundGraphics.rect(0, 0, width, height);
    this.backgroundGraphics.fill({ color: backgroundColor });

    // Top border/highlight
    this.backgroundGraphics.rect(0, 0, width, 3);
    this.backgroundGraphics.fill({ color: lightenColor(backgroundColor, 0.2) });

    // Top shadow line
    this.backgroundGraphics.rect(0, 3, width, 2);
    this.backgroundGraphics.fill({ color: darkenColor(backgroundColor, 0.3), alpha: 0.5 });
  }

  /**
   * Create navigation items
   */
  private createNavItems(): void {
    const { items, width, height } = this.config;

    // Calculate positions based on number of items
    const itemCount = items.length;
    const sectionWidth = width / itemCount;

    items.forEach((item, index) => {
      const x = sectionWidth * index + sectionWidth / 2;
      const y = height / 2;

      const itemContainer = this.createNavItem(item, index);
      itemContainer.x = x;
      itemContainer.y = y;

      this.itemContainers.set(item.id, itemContainer);
      this.container.addChild(itemContainer);
    });
  }

  /**
   * Create a single nav item
   */
  private createNavItem(item: NavItemConfig, index: number): IContainer {
    const container = graphics().createContainer();
    const isCenter = item.highlighted || item.type === 'play';
    const size = isCenter ? 70 : 50;

    // Background
    const bg = graphics().createGraphics();

    if (isCenter) {
      // Center button has special styling - larger and raised
      bg.roundRect(-size / 2, -size / 2 - 10, size, size, 16);
      bg.fill({ color: 0x3949AB });
      bg.stroke({ color: 0x1A237E, width: 3 });

      // Add highlight at top
      bg.roundRect(-size / 2 + 4, -size / 2 - 6, size - 8, size * 0.3, 12);
      bg.fill({ color: 0x5C6BC0, alpha: 0.5 });
    } else {
      // Side buttons
      bg.roundRect(-size / 2, -size / 2, size, size, 12);
      bg.fill({ color: 0x283593, alpha: 0.8 });
    }
    container.addChild(bg);

    // Icon
    const icon = this.createNavIcon(item, size * 0.5);
    icon.y = isCenter ? -10 : 0;
    container.addChild(icon);

    // Lock overlay if locked
    if (item.locked) {
      const lockOverlay = this.createLockOverlay(size);
      lockOverlay.y = isCenter ? -10 : 0;
      container.addChild(lockOverlay);
    }

    // Badge if present
    if (item.badge && item.badge > 0) {
      const badge = this.createBadge(item.badge);
      badge.x = size / 2 - 5;
      badge.y = -size / 2 + (isCenter ? 0 : 5);
      container.addChild(badge);
    }

    // Label
    if (item.label) {
      const label = graphics().createText(item.label, {
        fontFamily: '"Lilita One", "Arial Black", sans-serif',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: { color: 0x1A237E, width: 2 }
      });
      if (label.anchor) label.anchor.set(0.5, 0);
      label.y = isCenter ? size / 2 - 5 : size / 2 + 5;
      container.addChild(label);
    }

    // Interactivity
    if (!item.locked) {
      container.eventMode = 'static';
      container.cursor = 'pointer';

      container.on('pointerdown', () => {
        container.scale.x = 0.9;
        container.scale.y = 0.9;
      });

      container.on('pointerup', () => {
        container.scale.x = 1;
        container.scale.y = 1;
        if (item.onClick) {
          item.onClick();
        }
        this.emit('item-click', item.id, item);
      });

      container.on('pointerupoutside', () => {
        container.scale.x = 1;
        container.scale.y = 1;
      });
    }

    return container;
  }

  /**
   * Create icon based on type
   */
  private createNavIcon(item: NavItemConfig, size: number): IContainer {
    const iconContainer = graphics().createContainer();
    const g = graphics().createGraphics();

    switch (item.type) {
      case 'shop':
        this.drawShopIcon(g, size);
        break;

      case 'play':
        this.drawPlayIcon(g, size);
        break;

      case 'profile':
        this.drawProfileIcon(g, size);
        break;

      case 'leaderboard':
        this.drawLeaderboardIcon(g, size);
        break;

      case 'settings':
        this.drawSettingsIcon(g, size);
        break;

      default:
        this.drawCustomIcon(g, size);
    }

    iconContainer.addChild(g);
    return iconContainer;
  }

  /**
   * Draw shop/store icon (gift box style)
   */
  private drawShopIcon(g: IGraphics, size: number): void {
    const s = size * 0.7;

    // Box body
    g.roundRect(-s / 2, -s * 0.1, s, s * 0.55, 4);
    g.fill({ color: 0xE91E63 });
    g.stroke({ color: 0xAD1457, width: 2 });

    // Box lid
    g.roundRect(-s / 2 - 2, -s * 0.25, s + 4, s * 0.2, 3);
    g.fill({ color: 0xF48FB1 });
    g.stroke({ color: 0xAD1457, width: 1.5 });

    // Ribbon vertical
    g.rect(-s * 0.08, -s * 0.25, s * 0.16, s * 0.7);
    g.fill({ color: 0xFFD54F });

    // Ribbon horizontal
    g.rect(-s / 2, -s * 0.15, s, s * 0.12);
    g.fill({ color: 0xFFD54F });

    // Bow
    g.ellipse(-s * 0.15, -s * 0.35, s * 0.12, s * 0.08);
    g.fill({ color: 0xFFD54F });
    g.ellipse(s * 0.15, -s * 0.35, s * 0.12, s * 0.08);
    g.fill({ color: 0xFFD54F });
    g.circle(0, -s * 0.35, s * 0.06);
    g.fill({ color: 0xFFC107 });
  }

  /**
   * Draw play/character icon (cute mascot style like Brawl Stars)
   */
  private drawPlayIcon(g: IGraphics, size: number): void {
    const s = size * 0.85;

    // Character body (round blob)
    g.ellipse(0, s * 0.05, s * 0.42, s * 0.38);
    g.fill({ color: 0x4FC3F7 });
    g.stroke({ color: 0x0288D1, width: 2.5 });

    // Body highlight
    g.ellipse(-s * 0.1, -s * 0.05, s * 0.2, s * 0.15);
    g.fill({ color: 0x81D4FA, alpha: 0.6 });

    // Eyes - white backgrounds
    g.ellipse(-s * 0.14, -s * 0.02, s * 0.12, s * 0.13);
    g.fill({ color: 0xFFFFFF });
    g.ellipse(s * 0.14, -s * 0.02, s * 0.12, s * 0.13);
    g.fill({ color: 0xFFFFFF });

    // Pupils - looking slightly up and to the side
    g.circle(-s * 0.12, -s * 0.04, s * 0.055);
    g.fill({ color: 0x1A1A2A });
    g.circle(s * 0.16, -s * 0.04, s * 0.055);
    g.fill({ color: 0x1A1A2A });

    // Pupil highlights
    g.circle(-s * 0.14, -s * 0.06, s * 0.02);
    g.fill({ color: 0xFFFFFF });
    g.circle(s * 0.14, -s * 0.06, s * 0.02);
    g.fill({ color: 0xFFFFFF });

    // Ears/horns (rounder)
    g.ellipse(-s * 0.32, -s * 0.22, s * 0.1, s * 0.12);
    g.fill({ color: 0x4FC3F7 });
    g.stroke({ color: 0x0288D1, width: 1.5 });

    g.ellipse(s * 0.32, -s * 0.22, s * 0.1, s * 0.12);
    g.fill({ color: 0x4FC3F7 });
    g.stroke({ color: 0x0288D1, width: 1.5 });
  }

  /**
   * Draw profile/user icon
   */
  private drawProfileIcon(g: IGraphics, size: number): void {
    const s = size * 0.6;

    // Lock body (since this shows as locked usually)
    g.roundRect(-s / 2, 0, s, s * 0.7, 6);
    g.fill({ color: 0x9E9E9E });
    g.stroke({ color: 0x616161, width: 2 });

    // Lock shackle (U-shape using poly)
    const shackleR = s * 0.3;
    const shacklePoints: number[] = [];
    for (let i = 0; i <= 12; i++) {
      const angle = Math.PI + (Math.PI * i) / 12;
      shacklePoints.push(Math.cos(angle) * shackleR, Math.sin(angle) * shackleR);
    }
    g.poly(shacklePoints);
    g.stroke({ color: 0x757575, width: 5 });

    // Keyhole
    g.circle(0, s * 0.25, s * 0.1);
    g.fill({ color: 0x424242 });
  }

  /**
   * Draw leaderboard icon
   */
  private drawLeaderboardIcon(g: IGraphics, size: number): void {
    const s = size * 0.7;
    const barWidth = s / 4;

    // Three bars representing podium
    g.rect(-s / 2, s * 0.1, barWidth, s * 0.4);
    g.fill({ color: 0xFFD54F });

    g.rect(-barWidth / 2, -s * 0.2, barWidth, s * 0.7);
    g.fill({ color: 0xFFD54F });

    g.rect(s / 2 - barWidth, s * 0.2, barWidth, s * 0.3);
    g.fill({ color: 0xFFD54F });
  }

  /**
   * Draw settings gear icon
   */
  private drawSettingsIcon(g: IGraphics, size: number): void {
    const s = size * 0.5;
    const teeth = 8;
    const outerRadius = s;
    const innerRadius = s * 0.7;

    const vertices: number[] = [];
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      vertices.push(Math.cos(angle) * r);
      vertices.push(Math.sin(angle) * r);
    }

    g.poly(vertices);
    g.fill({ color: 0xE0E0E0 });
    g.stroke({ color: 0x9E9E9E, width: 1 });

    g.circle(0, 0, s * 0.35);
    g.fill({ color: 0x283593 });
  }

  /**
   * Draw custom placeholder icon
   */
  private drawCustomIcon(g: IGraphics, size: number): void {
    g.circle(0, 0, size * 0.4);
    g.fill({ color: 0x9E9E9E });
  }

  /**
   * Create lock overlay
   */
  private createLockOverlay(size: number): IContainer {
    const container = graphics().createContainer();
    const g = graphics().createGraphics();

    // Semi-transparent overlay
    g.circle(0, 0, size * 0.3);
    g.fill({ color: 0x000000, alpha: 0.5 });

    // Lock icon
    const lockSize = size * 0.25;
    g.roundRect(-lockSize / 2, lockSize * 0.1, lockSize, lockSize * 0.6, 3);
    g.fill({ color: 0xFFFFFF });

    // Lock shackle (U-shape using poly)
    const shackleR = lockSize * 0.3;
    const shackleY = lockSize * 0.1;
    const shacklePoints: number[] = [];
    for (let i = 0; i <= 12; i++) {
      const angle = Math.PI + (Math.PI * i) / 12;
      shacklePoints.push(Math.cos(angle) * shackleR, shackleY + Math.sin(angle) * shackleR);
    }
    g.poly(shacklePoints);
    g.stroke({ color: 0xFFFFFF, width: 3 });

    container.addChild(g);
    return container;
  }

  /**
   * Create badge (notification count)
   */
  private createBadge(count: number): IContainer {
    const container = graphics().createContainer();
    const g = graphics().createGraphics();

    const badgeSize = 20;
    g.circle(0, 0, badgeSize / 2);
    g.fill({ color: 0xFF5252 });
    g.stroke({ color: 0xB71C1C, width: 2 });
    container.addChild(g);

    const text = graphics().createText(count > 99 ? '99+' : count.toString(), {
      fontFamily: getFrameworkFontFamily(),
      fontSize: 10,
      fontWeight: 'bold',
      fill: 0xFFFFFF
    });
    if (text.anchor) text.anchor.set(0.5, 0.5);
    container.addChild(text);

    return container;
  }

  /**
   * Public API
   */

  public setItemBadge(id: string, count: number): this {
    // Re-create the item with the new badge
    const item = this.config.items.find(i => i.id === id);
    if (item) {
      item.badge = count;
      // Would need to rebuild the item - for now just emit event
      this.emit('badge-updated', id, count);
    }
    return this;
  }

  public setItemLocked(id: string, locked: boolean): this {
    const item = this.config.items.find(i => i.id === id);
    if (item) {
      item.locked = locked;
      this.emit('lock-updated', id, locked);
    }
    return this;
  }

  public getContainer(): IContainer {
    return this.container;
  }

  public setPosition(x: number, y: number): this {
    this.container.x = x;
    this.container.y = y;
    return this;
  }

  public destroy(): void {
    this.itemContainers.forEach(c => c.destroy({ children: true }));
    this.itemContainers.clear();
    this.container.destroy({ children: true });
    this.removeAllListeners();
  }
}
