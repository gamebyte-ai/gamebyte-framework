import { SimpleScreen } from './SimpleScreen.js';
import { GameTopBar, ResourceItemConfig } from '../components/GameTopBar.js';
import { GameBottomNav, NavItemConfig } from '../components/GameBottomNav.js';
import { IContainer, IGraphics, ISprite } from '../../contracts/Graphics.js';
import { graphics } from '../../graphics/GraphicsEngine.js';
import { Logger } from '../../utils/Logger.js';

/**
 * Hub tab content configuration
 */
export interface HubTabContent {
  id: string;
  create: () => IContainer;
}

/**
 * HubScreen configuration
 */
export interface HubScreenConfig {
  // Top bar
  topBarResources?: ResourceItemConfig[];
  showSettings?: boolean;
  onSettingsClick?: () => void;

  // Bottom nav
  bottomNavItems?: NavItemConfig[];
  defaultTab?: string;

  // Content
  tabContents?: Map<string, () => IContainer>;

  // Colors & Background
  backgroundColor?: number;
  /** Background image URL or base64 data URI */
  backgroundImage?: string;
}

/**
 * HubScreen - Main hub/menu screen with top bar, content area, and bottom nav
 *
 * Features:
 * - GameTopBar with resources and settings
 * - Tab-based content area
 * - GameBottomNav with tab switching
 * - Smooth content transitions
 *
 * @example
 * ```typescript
 * const hub = new HubScreen({
 *   topBarResources: [
 *     { type: 'coins', value: 1234, showAddButton: true }
 *   ],
 *   bottomNavItems: [
 *     { id: 'shop', type: 'shop', label: 'Shop' },
 *     { id: 'play', type: 'play', label: 'Play', highlighted: true },
 *     { id: 'profile', type: 'profile', label: 'Profile' }
 *   ],
 *   defaultTab: 'play'
 * });
 *
 * screenManager.push(hub);
 * ```
 */
export class HubScreen extends SimpleScreen {
  private topBar?: GameTopBar;
  private bottomNav?: GameBottomNav;
  private contentArea: IContainer;
  private background: IGraphics;
  private backgroundSprite?: ISprite;

  private currentTabId: string = '';
  private currentContent?: IContainer;
  private tabContents: Map<string, () => IContainer>;

  private hubConfig: HubScreenConfig;

  // Layout constants
  private readonly TOP_BAR_HEIGHT = 60;
  private readonly BOTTOM_NAV_HEIGHT = 90;

  constructor(config: HubScreenConfig = {}) {
    super('HubScreen');

    this.hubConfig = {
      topBarResources: config.topBarResources || [],
      showSettings: config.showSettings ?? true,
      onSettingsClick: config.onSettingsClick,
      bottomNavItems: config.bottomNavItems || this.getDefaultNavItems(),
      defaultTab: config.defaultTab || 'play',
      backgroundColor: config.backgroundColor || 0x1a1a2e,
      backgroundImage: config.backgroundImage,
    };

    this.tabContents = config.tabContents || new Map();

    const factory = graphics();

    // Create background
    this.background = factory.createGraphics();
    this.container.addChild(this.background);

    // Create content area container
    this.contentArea = factory.createContainer();
    this.container.addChild(this.contentArea);
  }

  /**
   * Default nav items
   */
  private getDefaultNavItems(): NavItemConfig[] {
    return [
      { id: 'shop', type: 'shop', label: 'Shop' },
      { id: 'play', type: 'play', label: 'Play', highlighted: true },
      { id: 'profile', type: 'profile', label: 'Profile' },
    ];
  }

  /**
   * Setup the screen
   */
  protected setup(): void {
    const width = this._width;
    const height = this._height;

    // Draw background
    this.drawBackground(width, height);

    // Create top bar
    this.createTopBar(width);

    // Create bottom nav
    this.createBottomNav(width, height);

    // Position content area
    this.contentArea.y = this.TOP_BAR_HEIGHT;

    // Show default tab
    if (this.hubConfig.defaultTab) {
      this.switchTab(this.hubConfig.defaultTab);
    }
  }

  /**
   * Draw background
   */
  private drawBackground(width: number, height: number): void {
    this.background.clear();
    this.background.rect(0, 0, width, height);
    this.background.fill({ color: this.hubConfig.backgroundColor || 0x1a1a2e });

    // Load background image if provided
    if (this.hubConfig.backgroundImage && !this.backgroundSprite) {
      this.loadBackgroundImage(width, height);
    }
  }

  /**
   * Load background image
   */
  private loadBackgroundImage(width: number, height: number): void {
    const factory = graphics();
    const imageUrl = this.hubConfig.backgroundImage!;

    const img = new Image();
    img.onload = () => {
      try {
        const texture = factory.createTexture(img);
        this.backgroundSprite = factory.createSprite(texture);
        this.backgroundSprite.width = width;
        this.backgroundSprite.height = height;

        // Insert after solid background (index 1)
        const container = this.container as any;
        if (container.addChildAt) {
          container.addChildAt(this.backgroundSprite, 1);
        } else {
          // Fallback - add after background
          this.container.addChild(this.backgroundSprite as any);
        }
      } catch (e) {
        Logger.warn('UI', 'HubScreen: Failed to create background sprite', e);
      }
    };
    img.onerror = (e) => {
      Logger.warn('UI', 'HubScreen: Failed to load background image', e);
    };
    img.src = imageUrl;
  }

  /**
   * Create top bar
   */
  private createTopBar(width: number): void {
    this.topBar = new GameTopBar({
      width,
      height: this.TOP_BAR_HEIGHT,
      resources: this.hubConfig.topBarResources,
      showSettings: this.hubConfig.showSettings,
      onSettingsClick: this.hubConfig.onSettingsClick,
    });

    this.topBar.setPosition(0, 0);
    this.container.addChild(this.topBar.getContainer());
  }

  /**
   * Create bottom nav
   */
  private createBottomNav(width: number, height: number): void {
    this.bottomNav = new GameBottomNav({
      width,
      height: this.BOTTOM_NAV_HEIGHT,
      items: this.hubConfig.bottomNavItems || [],
    });

    this.bottomNav.setPosition(0, height - this.BOTTOM_NAV_HEIGHT);

    // Listen for tab changes
    this.bottomNav.on('item-click', (id: string) => {
      this.switchTab(id);
    });

    this.container.addChild(this.bottomNav.getContainer());
  }

  /**
   * Switch to a tab
   */
  public switchTab(tabId: string): void {
    if (this.currentTabId === tabId) return;

    // Remove current content
    if (this.currentContent) {
      this.contentArea.removeChild(this.currentContent);
      this.currentContent.destroy({ children: true });
      this.currentContent = undefined;
    }

    // Create new content
    const contentFactory = this.tabContents.get(tabId);
    if (contentFactory) {
      this.currentContent = contentFactory();
      this.contentArea.addChild(this.currentContent);
    }

    this.currentTabId = tabId;
    this.emit('tab-changed', tabId);
  }

  /**
   * Register tab content
   */
  public registerTabContent(tabId: string, factory: () => IContainer): void {
    this.tabContents.set(tabId, factory);
  }

  /**
   * Get current tab ID
   */
  public getCurrentTab(): string {
    return this.currentTabId;
  }

  /**
   * Update a resource value
   */
  public updateResource(type: 'lives' | 'coins' | 'gems' | 'energy' | 'custom', value: number): void {
    this.topBar?.updateResource(type, value);
  }

  /**
   * Get the content area container
   */
  public getContentArea(): IContainer {
    return this.contentArea;
  }

  /**
   * Get content area dimensions
   */
  public getContentAreaSize(): { width: number; height: number } {
    return {
      width: this._width,
      height: this._height - this.TOP_BAR_HEIGHT - this.BOTTOM_NAV_HEIGHT,
    };
  }

  /**
   * Handle resize
   */
  protected onResize(width: number, height: number): void {
    // Redraw background
    this.drawBackground(width, height);

    // Resize background sprite
    if (this.backgroundSprite) {
      this.backgroundSprite.width = width;
      this.backgroundSprite.height = height;
    }

    // Reposition bottom nav
    if (this.bottomNav) {
      this.bottomNav.setPosition(0, height - this.BOTTOM_NAV_HEIGHT);
    }
  }

  /**
   * Handle back button
   */
  public onBackButton(): boolean {
    // Hub screen doesn't handle back by itself
    return false;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.topBar?.destroy();
    this.bottomNav?.destroy();
    this.currentContent?.destroy({ children: true });
    this.backgroundSprite = undefined;
    this.tabContents.clear();
    super.destroy();
  }
}
