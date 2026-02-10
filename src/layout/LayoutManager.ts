/**
 * Layout Manager
 *
 * Core layout management for GameByte framework.
 * Integrates @pixi/layout with the framework's architecture.
 *
 * @example
 * ```typescript
 * import { LayoutManager } from 'gamebyte-framework';
 *
 * // Initialize with app
 * const layoutManager = new LayoutManager();
 * await layoutManager.initialize(app);
 *
 * // Apply layout to stage
 * layoutManager.setStageLayout({
 *   width: 1080,
 *   height: 1920,
 *   justifyContent: 'center',
 *   alignItems: 'center'
 * });
 * ```
 */

import { EventEmitter } from 'eventemitter3';
import * as PIXI from 'pixi.js';
import { LayoutConfig, LayoutSystemConfig, ResponsiveLayoutConfig, ResponsiveBreakpoint } from './types.js';
import { LayoutPresets, GameLayoutPresets, scaleLayout } from './LayoutStyles.js';
import { graphics } from '../graphics/GraphicsEngine.js';
import { Logger } from '../utils/Logger.js';

/**
 * Layout Manager Events
 */
export interface LayoutManagerEvents {
  'initialized': [];
  'resize': [width: number, height: number, scale: number];
  'breakpoint-change': [breakpoint: ResponsiveBreakpoint | null, previousBreakpoint: ResponsiveBreakpoint | null];
  'layout-update': [];
  'destroyed': [];
}

/**
 * Layout Manager
 *
 * Manages layout system initialization, responsive scaling,
 * and provides utilities for creating layouts.
 */
export class LayoutManager extends EventEmitter<LayoutManagerEvents> {
  private app: PIXI.Application | null = null;
  private config: LayoutSystemConfig;
  private responsiveConfig: ResponsiveLayoutConfig | null = null;
  private currentBreakpoint: ResponsiveBreakpoint | null = null;
  private scale: number = 1;
  private isInitialized: boolean = false;

  // Default breakpoints for mobile games
  private static readonly DEFAULT_BREAKPOINTS: ResponsiveBreakpoint[] = [
    { name: 'xs', minWidth: 0, maxWidth: 479, scale: 0.75 },
    { name: 'sm', minWidth: 480, maxWidth: 767, scale: 0.875 },
    { name: 'md', minWidth: 768, maxWidth: 1023, scale: 1 },
    { name: 'lg', minWidth: 1024, maxWidth: 1439, scale: 1.125 },
    { name: 'xl', minWidth: 1440, scale: 1.25 },
  ];

  constructor(config: LayoutSystemConfig = {}) {
    super();
    this.config = {
      autoUpdate: true,
      enableDebug: false,
      throttle: 100,
      ...config,
    };
  }

  /**
   * Initialize the layout system with a PixiJS application
   */
  async initialize(app: PIXI.Application): Promise<void> {
    if (this.isInitialized) {
      Logger.warn('Layout', 'LayoutManager already initialized');
      return;
    }

    this.app = app;

    // @pixi/layout is imported at the entry point (index.ts)
    // The layout property is added to containers via mixins

    // Configure layout system if available
    const renderer = app.renderer as any;
    if (renderer.layout) {
      if (this.config.enableDebug !== undefined) {
        renderer.layout.enableDebug = this.config.enableDebug;
      }
      if (this.config.throttle !== undefined) {
        renderer.layout.throttle = this.config.throttle;
      }
    }

    this.isInitialized = true;
    Logger.info('Layout', 'LayoutManager initialized');
    this.emit('initialized');
  }

  /**
   * Configure responsive layout behavior
   */
  setResponsiveConfig(config: ResponsiveLayoutConfig): void {
    this.responsiveConfig = {
      scaleMode: 'fit',
      maintainAspectRatio: true,
      breakpoints: LayoutManager.DEFAULT_BREAKPOINTS,
      ...config,
    };

    // Update current state
    if (this.app) {
      this.handleResize(this.app.screen.width, this.app.screen.height);
    }
  }

  /**
   * Set layout on the application stage
   */
  setStageLayout(layout: LayoutConfig): void {
    if (!this.app) {
      Logger.warn('Layout', 'LayoutManager not initialized');
      return;
    }

    const stage = this.app.stage as any;
    if (stage) {
      // Apply screen dimensions if not specified
      const finalLayout: LayoutConfig = {
        width: this.app.screen.width,
        height: this.app.screen.height,
        ...layout,
      };

      stage.layout = finalLayout;
    }
  }

  /**
   * Apply layout to a container
   */
  applyLayout(container: PIXI.Container, layout: LayoutConfig | boolean): void {
    const containerAny = container as any;
    containerAny.layout = layout;
  }

  /**
   * Get a preset layout
   */
  getPreset(name: keyof typeof LayoutPresets): LayoutConfig {
    return { ...LayoutPresets[name] };
  }

  /**
   * Get a game-specific preset layout
   */
  getGamePreset(name: keyof typeof GameLayoutPresets): LayoutConfig {
    return { ...GameLayoutPresets[name] };
  }

  /**
   * Handle window/canvas resize
   */
  handleResize(width: number, height: number): void {
    if (!this.responsiveConfig) {
      this.scale = 1;
      this.emit('resize', width, height, this.scale);
      return;
    }

    // Calculate scale based on scale mode
    const { baseWidth, baseHeight, scaleMode } = this.responsiveConfig;

    switch (scaleMode) {
      case 'fit':
        this.scale = Math.min(width / baseWidth, height / baseHeight);
        break;
      case 'fill':
        this.scale = Math.max(width / baseWidth, height / baseHeight);
        break;
      case 'stretch':
        // Don't maintain uniform scale
        this.scale = width / baseWidth; // Use width as reference
        break;
      case 'none':
      default:
        this.scale = 1;
        break;
    }

    // Find matching breakpoint
    const breakpoints = this.responsiveConfig.breakpoints || LayoutManager.DEFAULT_BREAKPOINTS;
    const previousBreakpoint = this.currentBreakpoint;

    this.currentBreakpoint = breakpoints.find(bp => {
      const matchesMin = width >= bp.minWidth;
      const matchesMax = bp.maxWidth === undefined || width <= bp.maxWidth;
      return matchesMin && matchesMax;
    }) || null;

    // Apply breakpoint scale if defined
    if (this.currentBreakpoint?.scale !== undefined) {
      this.scale *= this.currentBreakpoint.scale;
    }

    // Emit events
    this.emit('resize', width, height, this.scale);

    if (this.currentBreakpoint !== previousBreakpoint) {
      this.emit('breakpoint-change', this.currentBreakpoint, previousBreakpoint);
    }

    // Update stage layout if app is available
    if (this.app) {
      const stage = this.app.stage as any;
      if (stage.layout) {
        stage.layout = {
          ...stage.layout,
          width,
          height,
        };
      }
    }
  }

  /**
   * Get current scale factor
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint(): ResponsiveBreakpoint | null {
    return this.currentBreakpoint;
  }

  /**
   * Scale a layout config for current screen density
   */
  scaleLayoutForScreen(layout: LayoutConfig): LayoutConfig {
    return scaleLayout(layout, this.scale);
  }

  /**
   * Enable/disable debug visualization
   */
  setDebugMode(enabled: boolean): void {
    this.config.enableDebug = enabled;

    if (this.app) {
      const renderer = this.app.renderer as any;
      if (renderer.layout) {
        renderer.layout.enableDebug = enabled;
      }
    }
  }

  /**
   * Manually trigger layout update
   */
  update(container?: PIXI.Container): void {
    if (!this.app) return;

    const renderer = this.app.renderer as any;
    if (renderer.layout && renderer.layout.update) {
      renderer.layout.update(container || this.app.stage);
      this.emit('layout-update');
    }
  }

  /**
   * Check if layout manager is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the PixiJS application
   */
  getApp(): PIXI.Application | null {
    return this.app;
  }

  /**
   * Get current responsive config
   */
  getResponsiveConfig(): ResponsiveLayoutConfig | null {
    return this.responsiveConfig;
  }

  /**
   * Create a layout-enabled container
   */
  createContainer(layout: LayoutConfig = {}): PIXI.Container {
    const container = graphics().createContainer() as unknown as PIXI.Container;
    (container as any).layout = layout;
    return container;
  }

  /**
   * Destroy the layout manager
   */
  destroy(): void {
    this.app = null;
    this.responsiveConfig = null;
    this.currentBreakpoint = null;
    this.isInitialized = false;
    this.removeAllListeners();
    this.emit('destroyed');
  }
}

// Singleton instance for facade access
let layoutManagerInstance: LayoutManager | null = null;

/**
 * Get the global LayoutManager instance
 */
export function getLayoutManager(): LayoutManager {
  if (!layoutManagerInstance) {
    layoutManagerInstance = new LayoutManager();
  }
  return layoutManagerInstance;
}

/**
 * Set the global LayoutManager instance
 */
export function setLayoutManager(manager: LayoutManager): void {
  layoutManagerInstance = manager;
}
