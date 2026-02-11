/**
 * Archero-Style Bottom Navigation Menu
 *
 * A fully configurable, extendable, and override-capable mobile-optimized (9:16 portrait)
 * bottom navigation menu system featuring:
 * - Glossy gold gradient buttons for active state
 * - Smooth GSAP-powered animations
 * - Touch/swipe gestures
 * - Particle effects on interaction
 * - Dynamic button spacing
 * - Renderer-agnostic (works with both 2D and 3D)
 * - Complete style customization
 * - Per-section style overrides
 * - Dynamic section management
 * - Inheritance-friendly architecture
 *
 * @example Basic Usage
 * ```typescript
 * const menu = new ArcheroMenu({
 *   sections: [
 *     { name: 'Shop', icon: '🏪', iconColor: 0xFF6B6B },
 *     { name: 'Campaign', icon: '🎯', iconColor: 0xFFD700 }
 *   ],
 *   activeSection: 1
 * });
 * stage.addChild(menu.getContainer());
 * ```
 *
 * @example Advanced Configuration
 * ```typescript
 * const menu = new ArcheroMenu({
 *   sections: [...],
 *   style: {
 *     buttonSize: 200,
 *     activeButtonSize: 350,
 *     buttonGradient: {
 *       topColor: 0xFF6B6B,
 *       middleColor: 0xFF3B3B,
 *       bottomColor: 0xCC0000
 *     },
 *     transitionDuration: 0.7
 *   },
 *   callbacks: {
 *     onSectionChange: (index, section) => console.log('Changed to:', section.name),
 *     onBeforeTransition: (from, to) => {
 *       // Can cancel transition by returning false
 *       return true;
 *     }
 *   }
 * });
 * ```
 *
 * @example Custom Inheritance
 * ```typescript
 * class CustomArcheroMenu extends ArcheroMenu {
 *   protected createButton(section: MenuSection, index: number): ButtonData {
 *     // Custom button creation logic
 *     return super.createButton(section, index);
 *   }
 * }
 * ```
 */

import { EventEmitter } from 'eventemitter3';
import { graphics } from '../../graphics/GraphicsEngine';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { ResponsiveScaleCalculator, ResponsiveConfig } from '../../utils/ResponsiveHelper';
import { Logger } from '../../utils/Logger.js';

/**
 * Gradient configuration for button backgrounds
 */
export interface GradientConfig {
  /** Top gradient color (default: 0xFFE55C) */
  topColor?: number;
  /** Middle gradient color (default: 0xFFD700) */
  middleColor?: number;
  /** Bottom gradient color (default: 0xFFA500) */
  bottomColor?: number;
}

/**
 * Shine/gloss overlay gradient configuration
 */
export interface ShineGradientConfig extends GradientConfig {
  /** Shine overlay alpha (default: 0.5) */
  alpha?: number;
}

/**
 * Comprehensive style configuration for ArcheroMenu
 * All properties are optional with sensible defaults
 */
export interface ArcheroMenuStyleConfig {
  // Button Sizes
  /** Inactive button size in pixels (default: 180) */
  buttonSize?: number;
  /** Active button size in pixels (default: 320) */
  activeButtonSize?: number;
  /** Active button corner radius (default: 30) */
  buttonRadius?: number;

  // Button Colors & Gradients
  /** Active button gradient configuration */
  buttonGradient?: GradientConfig;
  /** Shine/gloss overlay gradient configuration */
  shineGradient?: ShineGradientConfig;

  // Navigation Bar
  /** Navigation bar background color (default: 0x0f1624) */
  navBarColor?: number;
  /** Navigation bar background alpha (default: 1.0) */
  navBarAlpha?: number;
  /** Navigation bar overlay color (default: 0x1a2332) */
  navBarOverlayColor?: number;
  /** Navigation bar overlay alpha (default: 0.5) */
  navBarOverlayAlpha?: number;
  /** Separator line color (default: 0x2d3f5f) */
  separatorColor?: number;
  /** Navigation bar height (default: 280) */
  navHeight?: number;

  // Icon Styling
  /** Inactive icon size (default: 90) */
  iconSize?: number;
  /** Active icon size (default: 140) */
  activeIconSize?: number;
  /** Inactive icon Y offset from center (default: -10) */
  iconYOffset?: number;
  /** Active icon Y offset from center (default: -35) */
  activeIconYOffset?: number;
  /** Icon stroke color (default: 0x000000) */
  iconStrokeColor?: number;
  /** Icon stroke width (default: 8) */
  iconStrokeWidth?: number;
  /** Icon drop shadow distance (default: 6) */
  iconShadowDistance?: number;
  /** Icon drop shadow blur (default: 4) */
  iconShadowBlur?: number;

  // Label Styling
  /** Label font size (default: 40) */
  labelSize?: number;
  /** Label Y offset from center (default: 55) */
  labelYOffset?: number;
  /** Label fill color (default: 0x4A2F1A) */
  labelColor?: number;
  /** Label stroke color (default: 0xFFE55C) */
  labelStrokeColor?: number;
  /** Label stroke width (default: 4) */
  labelStrokeWidth?: number;
  /** Label font weight (default: '900') */
  labelFontWeight?: string;
  /** Label drop shadow distance (default: 3) */
  labelShadowDistance?: number;
  /** Label drop shadow blur (default: 3) */
  labelShadowBlur?: number;

  // Layout & Spacing
  /** Padding from screen edges (default: 40) */
  padding?: number;
  /** Active button elevation offset (Y position adjustment) (default: 40) */
  elevationOffset?: number;

  // Animation Durations (in seconds)
  /** Main transition duration (default: 0.5) */
  transitionDuration?: number;
  /** Icon animation duration (default: 0.3) */
  iconAnimDuration?: number;
  /** Button position animation duration (default: 0.4) */
  repositionDuration?: number;
  /** Elevation animation duration (default: 0.5) */
  elevationDuration?: number;
  /** Label fade duration (default: 0.3) */
  labelFadeDuration?: number;
  /** Label fade delay (default: 0.2) */
  labelFadeDelay?: number;

  // Particle Effects
  /** Enable particle effects on section change (default: true) */
  enableParticles?: boolean;
  /** Number of particles to spawn (default: 30) */
  particleCount?: number;
  /** Particle size range [min, max] (default: [3, 11]) */
  particleSizeRange?: [number, number];
  /** Particle speed range [min, max] (default: [6, 18]) */
  particleSpeedRange?: [number, number];
  /** Particle colors (if not set, uses section iconColor) */
  particleColors?: number[];
}

/**
 * Per-section style overrides
 */
export interface SectionStyleOverride {
  /** Override button gradient for this section */
  buttonGradient?: GradientConfig;
  /** Override icon size for this section */
  iconSize?: number;
  /** Override active icon size for this section */
  activeIconSize?: number;
  /** Override label color for this section */
  labelColor?: number;
  /** Override label stroke color for this section */
  labelStrokeColor?: number;
  /** Any other custom properties */
  [key: string]: any;
}

/**
 * Section configuration for menu
 */
export interface MenuSection {
  /** Section display name */
  name: string;
  /** Section icon (emoji, symbol, or custom canvas) */
  icon: string | HTMLCanvasElement;
  /** Icon color for particles and effects (default: 0xFFD700) */
  iconColor?: number;
  /** Custom content to display when section is active */
  content?: any;
  /** Per-section style overrides */
  customStyle?: SectionStyleOverride;
  /** Any other custom data */
  [key: string]: any;
}

/**
 * Event callbacks for menu interactions
 */
export interface ArcheroMenuCallbacks {
  /** Called when section changes (after animation completes) */
  onSectionChange?: (index: number, section: MenuSection) => void;
  /** Called before transition starts, return false to cancel */
  onBeforeTransition?: (fromIndex: number, toIndex: number) => boolean;
  /** Called after transition animation completes */
  onAfterTransition?: (fromIndex: number, toIndex: number) => void;
  /** Called when a button is pressed (before transition) */
  onButtonPress?: (index: number) => void;
  /** Called on swipe gesture */
  onSwipe?: (direction: 'left' | 'right') => void;
  /** Custom button renderer - return container to replace default */
  renderButton?: (section: MenuSection, isActive: boolean) => IContainer | null;
  /** Custom icon renderer - return text/sprite to replace default */
  renderIcon?: (section: MenuSection, isActive: boolean) => IText | IGraphics | null;
  /** Custom label renderer - return text to replace default */
  renderLabel?: (section: MenuSection) => IText | null;
}

/**
 * Archero menu configuration options
 */
export interface ArcheroMenuOptions {
  /** Menu sections */
  sections: MenuSection[];
  /** Initially active section index (default: 0) */
  activeSection?: number;
  /** Style configuration */
  style?: Partial<ArcheroMenuStyleConfig>;
  /** Event callbacks */
  callbacks?: ArcheroMenuCallbacks;
  /** Canvas width for positioning (default: 1080) */
  canvasWidth?: number;
  /** Canvas height for positioning (default: 1920) */
  canvasHeight?: number;
  /** Enable swipe gestures (default: true) */
  enableSwipe?: boolean;
  /** Enable responsive scaling (default: false) */
  responsive?: boolean | ResponsiveConfig;

  // Shorthand options (alternative to style.* and callbacks.*)
  /** Enable particle effects (shorthand for style.enableParticles) */
  enableParticles?: boolean;
  /** Navigation bar height (shorthand for style.navHeight) */
  navHeight?: number;
  /** Inactive button size (shorthand for style.buttonSize) */
  buttonSize?: number;
  /** Active button size (shorthand for style.activeButtonSize) */
  activeButtonSize?: number;
  /** Edge padding (shorthand for style.padding) */
  padding?: number;
  /** Section change callback (shorthand for callbacks.onSectionChange) */
  onSectionChange?: (index: number, section: MenuSection) => void;
}

/**
 * Button data structure for internal management
 */
export interface ButtonData {
  container: IContainer;
  bg: IGraphics;
  overlay: IGraphics | null;
  icon: IText | IGraphics;
  label: IText | null;
  section: MenuSection;
  index: number;
}

/**
 * Particle data for effects
 */
interface Particle {
  graphics: IGraphics;
  vx: number;
  vy: number;
  life: number;
  startTime: number;
}

/**
 * Archero-style color palette
 */
export const ARCHERO_COLORS = {
  // Navigation bar
  navBg: 0x0f1624,
  navBgLight: 0x1a2332,
  separator: 0x2d3f5f,

  // Button states
  activeYellow: 0xFFD700,
  activeOrange: 0xFFA500,
  activeLightGold: 0xFFE55C,

  // Icon colors
  red: 0xFF3B3B,
  blue: 0x3B7BFF,
  purple: 0x9B3BFF,
  green: 0x3BFF7B,

  // Effects
  white: 0xFFFFFF,
  black: 0x000000,

  // Label text
  darkBrown: 0x4A2F1A
};

/**
 * Default style configuration
 */
const DEFAULT_STYLE: Required<ArcheroMenuStyleConfig> = {
  // Button Sizes - Adjusted for better balance
  buttonSize: 130,
  activeButtonSize: 260,
  buttonRadius: 30,

  // Button Colors & Gradients - EXACT vanilla colors
  buttonGradient: {
    topColor: 0xFFE55C,    // Light gold top (vanilla)
    middleColor: 0xFFD700, // Gold middle (vanilla)
    bottomColor: 0xFFA500  // Orange bottom (vanilla)
  },
  shineGradient: {
    topColor: 0xFFFFFF,    // Pure white at top (vanilla)
    middleColor: 0xFFE55C, // Light gold (vanilla)
    bottomColor: 0xFFD700, // Gold at bottom (vanilla)
    alpha: 0.5             // Overall shine brightness (vanilla)
  },

  // Navigation Bar - More visible and prominent
  navBarColor: 0x1a1f2e,   // Slightly lighter dark blue
  navBarAlpha: 1.0,
  navBarOverlayColor: ARCHERO_COLORS.navBgLight,
  navBarOverlayAlpha: 0.5,
  separatorColor: 0x3d4f6f, // Lighter separator for better visibility
  navHeight: 220,           // Shorter but more prominent

  // Icon Styling - Vanilla sizes
  iconSize: 90,               // Inactive icon size (vanilla)
  activeIconSize: 140,        // Active icon size (vanilla)
  iconYOffset: -10,
  activeIconYOffset: -35,     // Vanilla positioning
  iconStrokeColor: ARCHERO_COLORS.black,
  iconStrokeWidth: 8,
  iconShadowDistance: 6,
  iconShadowBlur: 4,

  // Label Styling - Vanilla values
  labelSize: 40,
  labelYOffset: 55,         // Vanilla Y position
  labelColor: ARCHERO_COLORS.darkBrown,
  labelStrokeColor: ARCHERO_COLORS.activeLightGold,
  labelStrokeWidth: 4,
  labelFontWeight: '900',
  labelShadowDistance: 3,
  labelShadowBlur: 3,

  // Layout & Spacing - Tighter spacing for better appearance
  padding: 50,              // Increased padding for tighter button spacing
  elevationOffset: 20,      // Less elevation for more natural look

  // Animation Durations - Smoother and faster
  transitionDuration: 0.4,
  iconAnimDuration: 0.25,
  repositionDuration: 0.35,
  elevationDuration: 0.4,
  labelFadeDuration: 0.25,
  labelFadeDelay: 0.15,

  // Particle Effects
  enableParticles: true,
  particleCount: 30,
  particleSizeRange: [3, 11],
  particleSpeedRange: [6, 18],
  particleColors: []
};

/**
 * Archero-Style Bottom Navigation Menu Component
 *
 * Fully configurable and extendable menu system with:
 * - Complete style customization via ArcheroMenuStyleConfig
 * - Dynamic section management (add, remove, update, reorder)
 * - Event callbacks for all interactions
 * - Inheritance-friendly protected methods
 * - Backward compatible with legacy API
 */
export class ArcheroMenu extends EventEmitter {
  // Configuration
  protected config: {
    sections: MenuSection[];
    activeSection: number;
    canvasWidth: number;
    canvasHeight: number;
    enableSwipe: boolean;
  };
  protected style: Required<ArcheroMenuStyleConfig>;
  protected callbacks: ArcheroMenuCallbacks;

  // Containers
  protected rootContainer: IContainer;
  protected navBarContainer: IContainer;
  protected particleContainer: IContainer;

  // Button management
  protected buttons: ButtonData[] = [];
  protected activeSection: number;

  // Particle management
  protected particles: Particle[] = [];

  // Animation state
  protected isAnimating: boolean = false;

  // Touch tracking
  protected touchStartX: number = 0;
  protected touchStartY: number = 0;

  // Responsive scaling
  protected responsiveCalculator: ResponsiveScaleCalculator | null = null;

  constructor(options: ArcheroMenuOptions) {
    super();

    // Merge style configuration with defaults
    this.style = this.mergeStyleConfig(options);

    // Merge callbacks (support both callbacks.onSectionChange and shorthand onSectionChange)
    this.callbacks = {
      ...options.callbacks,
      onSectionChange: options.callbacks?.onSectionChange || options.onSectionChange
    };

    // Set main configuration
    this.config = {
      sections: options.sections,
      activeSection: options.activeSection ?? 0,
      canvasWidth: options.canvasWidth ?? 1080,
      canvasHeight: options.canvasHeight ?? 1920,
      enableSwipe: options.enableSwipe ?? true
    };

    this.activeSection = this.config.activeSection;

    // Initialize responsive calculator if enabled
    if (options.responsive) {
      const responsiveConfig: ResponsiveConfig = typeof options.responsive === 'boolean'
        ? { baseWidth: this.config.canvasWidth, baseHeight: this.config.canvasHeight }
        : options.responsive;

      this.responsiveCalculator = new ResponsiveScaleCalculator(responsiveConfig);
      Logger.info('UI', 'ArcheroMenu responsive mode enabled with base size:', responsiveConfig.baseWidth, 'x', responsiveConfig.baseHeight);
    }

    // Create containers
    this.rootContainer = graphics().createContainer();
    this.navBarContainer = graphics().createContainer();
    this.particleContainer = graphics().createContainer();

    // Add to hierarchy
    this.rootContainer.addChild(this.particleContainer);
    this.rootContainer.addChild(this.navBarContainer);

    // Position nav bar at bottom
    this.navBarContainer.y = this.config.canvasHeight - this.getScaledValue(this.style.navHeight);

    // Build menu
    this.buildNavBar();
    this.buildButtons();

    // Setup touch handlers if swipe enabled
    if (this.config.enableSwipe) {
      this.setupTouchHandlers();
    }
  }

  /**
   * Get scaled value using responsive calculator (if enabled)
   */
  protected getScaledValue(baseValue: number): number {
    return this.responsiveCalculator
      ? this.responsiveCalculator.scale(baseValue)
      : baseValue;
  }

  /**
   * Merge user style config with defaults
   */
  protected mergeStyleConfig(options: ArcheroMenuOptions): Required<ArcheroMenuStyleConfig> {
    const style = options.style || {};

    // Apply shorthand options (top-level options override style.*)
    const shorthandOverrides: Partial<ArcheroMenuStyleConfig> = {};
    if (options.enableParticles !== undefined) shorthandOverrides.enableParticles = options.enableParticles;
    if (options.navHeight !== undefined) shorthandOverrides.navHeight = options.navHeight;
    if (options.buttonSize !== undefined) shorthandOverrides.buttonSize = options.buttonSize;
    if (options.activeButtonSize !== undefined) shorthandOverrides.activeButtonSize = options.activeButtonSize;
    if (options.padding !== undefined) shorthandOverrides.padding = options.padding;

    return {
      ...DEFAULT_STYLE,
      ...shorthandOverrides,
      ...style,
      buttonGradient: {
        ...DEFAULT_STYLE.buttonGradient,
        ...style.buttonGradient
      },
      shineGradient: {
        ...DEFAULT_STYLE.shineGradient,
        ...style.shineGradient
      }
    };
  }

  /**
   * Get current style configuration
   */
  public getStyle(): Required<ArcheroMenuStyleConfig> {
    return { ...this.style };
  }

  /**
   * Update style configuration dynamically
   * @param style Partial style config to update
   * @param rebuild Whether to rebuild the menu (default: true)
   */
  public setStyle(style: Partial<ArcheroMenuStyleConfig>, rebuild: boolean = true): void {
    // Deep merge the new style
    this.style = {
      ...this.style,
      ...style,
      buttonGradient: {
        ...this.style.buttonGradient,
        ...style.buttonGradient
      },
      shineGradient: {
        ...this.style.shineGradient,
        ...style.shineGradient
      }
    };

    if (rebuild) {
      this.rebuildMenu();
    }
  }

  /**
   * Rebuild the entire menu (useful after style changes)
   */
  protected rebuildMenu(): void {
    // Clear existing buttons
    for (const button of this.buttons) {
      button.container.destroy({ children: true });
    }
    this.buttons = [];

    // Clear nav bar children except background
    while (this.navBarContainer.children.length > 0) {
      const child = this.navBarContainer.children[0];
      this.navBarContainer.removeChild(child);
      child.destroy({ children: true });
    }

    // Rebuild
    this.buildNavBar();
    this.buildButtons();
  }

  /**
   * Build navigation bar background
   */
  protected buildNavBar(): void {
    const navHeight = this.getScaledValue(this.style.navHeight);

    // Navy blue gradient background
    const navBg = graphics().createGraphics();
    navBg.rect(0, 0, this.config.canvasWidth, navHeight);
    navBg.fill({ color: this.style.navBarColor, alpha: this.style.navBarAlpha });
    this.navBarContainer.addChild(navBg);

    // Top separator line - more prominent
    const separatorHeight = this.getScaledValue(4);
    const separator = graphics().createGraphics();
    separator.rect(0, 0, this.config.canvasWidth, separatorHeight);
    separator.fill({ color: this.style.separatorColor });
    this.navBarContainer.addChild(separator);

    // Darker overlay for depth
    const overlay = graphics().createGraphics();
    overlay.rect(0, separatorHeight, this.config.canvasWidth, navHeight - separatorHeight);
    overlay.fill({ color: this.style.navBarOverlayColor, alpha: this.style.navBarOverlayAlpha });
    this.navBarContainer.addChild(overlay);
  }

  /**
   * Build navigation buttons
   */
  protected buildButtons(): void {
    this.config.sections.forEach((section, index) => {
      const buttonData = this.createButton(section, index);
      this.buttons.push(buttonData);
      this.navBarContainer.addChild(buttonData.container);
    });
  }

  /**
   * Create a single button (override this for custom button rendering)
   */
  protected createButton(section: MenuSection, index: number): ButtonData {
    const isActive = index === this.activeSection;

    // Apply responsive scaling
    const navHeight = this.getScaledValue(this.style.navHeight);
    const elevationOffset = this.getScaledValue(this.style.elevationOffset);

    // Check for custom renderer
    if (this.callbacks.renderButton) {
      const customButton = this.callbacks.renderButton(section, isActive);
      if (customButton) {
        // User provided custom button, create minimal ButtonData
        const xPos = this.calculateButtonX(index);
        customButton.x = xPos;
        customButton.y = isActive
          ? navHeight / 2 - elevationOffset
          : navHeight / 2;

        return {
          container: customButton,
          bg: graphics().createGraphics(), // Placeholder
          overlay: null,
          icon: graphics().createText('', { fontFamily: 'system-ui' }), // Placeholder
          label: null,
          section,
          index
        };
      }
    }

    // Default button creation with responsive scaling
    const size = isActive
      ? this.getScaledValue(this.style.activeButtonSize)
      : this.getScaledValue(this.style.buttonSize);

    // Create button container
    const container = graphics().createContainer();
    container.eventMode = 'static';
    container.cursor = 'pointer';

    // Position button
    const xPos = this.calculateButtonX(index);
    container.x = xPos;
    container.y = isActive
      ? navHeight / 2 - elevationOffset
      : navHeight / 2;

    // Create button background
    const bg = graphics().createGraphics();
    this.renderButtonBackground(bg, section, size, isActive);
    container.addChild(bg);

    // Create shine overlay for active button
    let overlay: IGraphics | null = null;
    if (isActive) {
      overlay = this.createShineOverlay(section, size);
      container.addChild(overlay);
    }

    // Create icon
    const icon = this.createIcon(section, isActive);
    container.addChild(icon);

    // Create label for active button
    let label: IText | null = null;
    if (isActive) {
      label = this.createLabel(section);
      container.addChild(label);
    }

    // Setup interaction
    this.setupButtonInteraction(container, index);

    return {
      container,
      bg,
      overlay,
      icon,
      label,
      section,
      index
    };
  }

  /**
   * Create icon for button (override for custom icons)
   */
  protected createIcon(section: MenuSection, isActive: boolean): IText | IGraphics {
    // Check for custom icon renderer
    if (this.callbacks.renderIcon) {
      const customIcon = this.callbacks.renderIcon(section, isActive);
      if (customIcon) return customIcon;
    }

    // Use style config values (with vanilla defaults in DEFAULT_STYLE)
    const fontSize = isActive ? this.style.activeIconSize : this.style.iconSize;
    const yPosition = isActive ? this.style.activeIconYOffset : this.style.iconYOffset;

    // Create icon text using graphics abstraction
    const icon = graphics().createText(
      typeof section.icon === 'string' ? section.icon : '',
      {
        fontSize: fontSize,
        fontFamily: 'system-ui',
        stroke: { color: this.style.iconStrokeColor, width: this.style.iconStrokeWidth },
        dropShadow: {
          angle: 0.523599,
          distance: this.style.iconShadowDistance,
          alpha: 0.8,
          blur: this.style.iconShadowBlur,
          color: this.style.iconStrokeColor
        }
      }
    );

    icon.anchor?.set(0.5);
    icon.y = yPosition;

    return icon;
  }

  /**
   * Create label for active button (override for custom labels)
   */
  protected createLabel(section: MenuSection): IText {
    // Check for custom label renderer
    if (this.callbacks.renderLabel) {
      const customLabel = this.callbacks.renderLabel(section);
      if (customLabel) return customLabel;
    }

    // Apply section-specific style overrides
    const labelColor = section.customStyle?.labelColor ?? this.style.labelColor;
    const labelStrokeColor = section.customStyle?.labelStrokeColor ?? this.style.labelStrokeColor;

    // Create label text using graphics abstraction
    const label = graphics().createText(
      section.name,
      {
        fontSize: this.style.labelSize,
        fill: labelColor,
        fontWeight: this.style.labelFontWeight,
        stroke: { color: labelStrokeColor, width: this.style.labelStrokeWidth },
        dropShadow: {
          angle: 0.523599,
          distance: this.style.labelShadowDistance,
          alpha: 0.6,
          blur: this.style.labelShadowBlur,
          color: 0x000000
        }
      }
    );

    label.anchor?.set(0.5);
    label.y = this.style.labelYOffset;

    return label;
  }

  /**
   * Setup button interaction handlers
   */
  protected setupButtonInteraction(container: IContainer, index: number): void {
    container.on('pointerdown', () => this.onButtonClick(index));
    container.on('pointerover', () => this.onButtonHover(index));
    container.on('pointerout', () => this.onButtonHoverEnd(index));
  }

  /**
   * Render button background (solid or gradient)
   */
  protected renderButtonBackground(
    bg: IGraphics,
    section: MenuSection,
    size: number,
    isActive: boolean
  ): void {
    bg.clear();

    if (isActive) {
      // Apply section-specific gradient override
      const gradientConfig = section.customStyle?.buttonGradient ?? this.style.buttonGradient;

      // Ensure gradient colors have defaults
      const topColor = gradientConfig.topColor ?? 0xFFF4CC;
      const middleColor = gradientConfig.middleColor ?? 0xFFD700;
      const bottomColor = gradientConfig.bottomColor ?? 0xFF8C00;

      // Create linear gradient using graphics factory abstraction
      const fillGradient = graphics().createLinearGradient({
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
          { offset: 0, color: topColor },
          { offset: 0.5, color: middleColor },
          { offset: 1, color: bottomColor }
        ]
      });

      bg.roundRect(-size/2, -size/2, size, size, this.getScaledValue(this.style.buttonRadius));
      bg.fill(fillGradient.native);
    } else {
      // Inactive: Transparent
      bg.rect(-size/2, -size/2, size, size);
      bg.fill({ color: ARCHERO_COLORS.black, alpha: 0.0 });
    }
  }

  /**
   * Create glossy shine overlay for active button
   */
  protected createShineOverlay(section: MenuSection, size: number): IGraphics {
    const overlay = graphics().createGraphics();
    const overlayWidth = size * 0.92;
    const overlayHeight = size * 0.22;

    const shine = this.style.shineGradient;

    // Ensure shine colors have defaults
    const topColor = shine.topColor ?? 0xFFFFFF;
    const middleColor = shine.middleColor ?? 0xFFFBE6;
    const bottomColor = shine.bottomColor ?? 0xFFE55C;
    const alpha = shine.alpha ?? 0.35;

    // Create shine gradient using graphics factory abstraction
    const overlayTop = -size/2 + 8;
    const shineGradient = graphics().createLinearGradient({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: topColor },
        { offset: 0.8, color: middleColor },
        { offset: 1, color: bottomColor }
      ]
    });

    overlay.roundRect(-overlayWidth/2, overlayTop, overlayWidth, overlayHeight, this.getScaledValue(25));
    overlay.fill(shineGradient.native);
    overlay.alpha = alpha; // Vanilla: simple alpha, no mask

    return overlay;
  }

  /**
   * Calculate button X position based on index
   */
  protected calculateButtonX(index: number): number {
    const { sections } = this.config;

    // Apply responsive scaling to button sizes and padding
    const buttonSize = this.getScaledValue(this.style.buttonSize);
    const activeButtonSize = this.getScaledValue(this.style.activeButtonSize);
    const padding = this.getScaledValue(this.style.padding);

    // Calculate total width needed
    const totalButtonsWidth = activeButtonSize + (buttonSize * (sections.length - 1));
    const availableWidth = this.config.canvasWidth - (padding * 2);
    const totalSpacing = availableWidth - totalButtonsWidth;
    const spacingBetweenButtons = totalSpacing / (sections.length - 1);

    // Calculate position for this button
    let xPos = padding;
    for (let i = 0; i < index; i++) {
      const btnSize = (i === this.activeSection) ? activeButtonSize : buttonSize;
      xPos += btnSize + spacingBetweenButtons;
    }

    // Add half of current button size to center it
    const currentSize = (index === this.activeSection) ? activeButtonSize : buttonSize;
    xPos += currentSize / 2;

    return xPos;
  }

  /**
   * Handle button click
   */
  protected onButtonClick(index: number): void {
    if (this.isAnimating || index === this.activeSection) return;

    // Call button press callback
    if (this.callbacks.onButtonPress) {
      this.callbacks.onButtonPress(index);
    }

    this.switchToSection(index);
  }

  /**
   * Handle button hover
   */
  protected onButtonHover(index: number): void {
    if (index === this.activeSection) return;

    const button = this.buttons[index];

    // Use GSAP if available, fallback to direct scale
    if (typeof window !== 'undefined' && (window as any).gsap) {
      (window as any).gsap.to(button.container.scale, {
        x: 1.1,
        y: 1.1,
        duration: 0.2
      });
    } else {
      button.container.scale.x = 1.1;
      button.container.scale.y = 1.1;
    }
  }

  /**
   * Handle button hover end
   */
  protected onButtonHoverEnd(index: number): void {
    if (index === this.activeSection) return;

    const button = this.buttons[index];

    // Use GSAP if available, fallback to direct scale
    if (typeof window !== 'undefined' && (window as any).gsap) {
      (window as any).gsap.to(button.container.scale, {
        x: 1.0,
        y: 1.0,
        duration: 0.2
      });
    } else {
      button.container.scale.x = 1.0;
      button.container.scale.y = 1.0;
    }
  }

  /**
   * Switch to a new section with animation
   */
  protected switchToSection(newIndex: number): void {
    if (this.isAnimating) return;

    const oldIndex = this.activeSection;

    // Check if transition should be cancelled
    if (this.callbacks.onBeforeTransition) {
      const shouldContinue = this.callbacks.onBeforeTransition(oldIndex, newIndex);
      if (shouldContinue === false) return;
    }

    this.isAnimating = true;
    this.activeSection = newIndex;

    // Create particles if enabled
    if (this.style.enableParticles) {
      const button = this.buttons[newIndex];
      const globalX = button.container.x;
      const globalY = button.container.y + this.navBarContainer.y;
      const particleColor = button.section.iconColor || ARCHERO_COLORS.activeYellow;
      this.createParticles(globalX, globalY, particleColor);
    }

    // Animate buttons
    this.animateToActive(newIndex);
    this.animateToInactive(oldIndex);
    this.repositionAllButtons();

    // Notify listeners after animation duration
    const animationDuration = Math.max(
      this.style.transitionDuration,
      this.style.elevationDuration,
      this.style.repositionDuration
    );

    setTimeout(() => {
      this.isAnimating = false;

      // Call section change callback
      if (this.callbacks.onSectionChange) {
        this.callbacks.onSectionChange(newIndex, this.config.sections[newIndex]);
      }

      // Call after transition callback
      if (this.callbacks.onAfterTransition) {
        this.callbacks.onAfterTransition(oldIndex, newIndex);
      }

      // Emit event
      this.emit('section-changed', newIndex, this.config.sections[newIndex]);
    }, animationDuration * 1000);
  }

  /**
   * Animate button to active state (override for custom animation)
   */
  protected animateToActive(index: number): void {
    const button = this.buttons[index];
    const activeButtonSize = this.getScaledValue(this.style.activeButtonSize);

    // Recreate background as active
    this.renderButtonBackground(button.bg, button.section, activeButtonSize, true);

    // Add shine overlay
    if (!button.overlay) {
      button.overlay = this.createShineOverlay(button.section, activeButtonSize);
      // First add as child, then set index
      button.container.addChild(button.overlay);
      const bgIndex = button.container.getChildIndex(button.bg);
      button.container.setChildIndex(button.overlay, bgIndex + 1);
    }

    // Apply responsive scaling for animation values
    const navHeight = this.getScaledValue(this.style.navHeight);
    const elevationOffset = this.getScaledValue(this.style.elevationOffset);
    const activeIconYOffset = this.getScaledValue(this.style.activeIconYOffset);
    const activeIconSize = this.getScaledValue(
      button.section.customStyle?.activeIconSize ?? this.style.activeIconSize
    );

    // Use GSAP if available
    if (typeof window !== 'undefined' && (window as any).gsap) {
      const gsap = (window as any).gsap;

      // Move button up (elevated)
      gsap.to(button.container, {
        y: navHeight / 2 - elevationOffset,
        duration: this.style.elevationDuration,
        ease: 'elastic.out(1, 0.5)'
      });

      // Icon grows and moves up
      gsap.to(button.icon, {
        y: activeIconYOffset,
        duration: this.style.iconAnimDuration,
        ease: 'back.out(2)'
      });

      if ((button.icon as IText).style) {
        gsap.to((button.icon as IText).style, {
          fontSize: activeIconSize,
          duration: this.style.iconAnimDuration
        });
      }

      // Add label
      if (!button.label) {
        button.label = this.createLabel(button.section);
        button.label.alpha = 0;
        button.container.addChild(button.label);

        gsap.to(button.label, {
          alpha: 1,
          duration: this.style.labelFadeDuration,
          delay: this.style.labelFadeDelay
        });
      }
    } else {
      // Fallback without GSAP
      button.container.y = navHeight / 2 - elevationOffset;
      button.icon.y = activeIconYOffset;

      if ((button.icon as IText).style) {
        (button.icon as IText).style.fontSize = activeIconSize;
      }

      if (!button.label) {
        button.label = this.createLabel(button.section);
        button.container.addChild(button.label);
      }
    }
  }

  /**
   * Animate button to inactive state (override for custom animation)
   */
  protected animateToInactive(index: number): void {
    const button = this.buttons[index];
    const buttonSize = this.getScaledValue(this.style.buttonSize);

    // Recreate background as inactive
    this.renderButtonBackground(button.bg, button.section, buttonSize, false);

    // Remove shine overlay
    if (button.overlay) {
      button.container.removeChild(button.overlay);
      button.overlay.destroy();
      button.overlay = null;
    }

    // Apply responsive scaling for animation values
    const navHeight = this.getScaledValue(this.style.navHeight);
    const iconYOffset = this.getScaledValue(this.style.iconYOffset);
    const iconSize = this.getScaledValue(
      button.section.customStyle?.iconSize ?? this.style.iconSize
    );

    // Use GSAP if available
    if (typeof window !== 'undefined' && (window as any).gsap) {
      const gsap = (window as any).gsap;

      // Move button down
      gsap.to(button.container, {
        y: navHeight / 2,
        duration: this.style.iconAnimDuration,
        ease: 'power2.out'
      });

      // Icon shrinks and moves to inactive position
      gsap.to(button.icon, {
        y: iconYOffset,
        duration: this.style.iconAnimDuration
      });

      if ((button.icon as IText).style) {
        gsap.to((button.icon as IText).style, {
          fontSize: iconSize,
          duration: this.style.iconAnimDuration
        });
      }

      // Remove label
      if (button.label) {
        gsap.to(button.label, {
          alpha: 0,
          duration: 0.2,
          onComplete: () => {
            if (button.label) {
              button.container.removeChild(button.label);
              button.label.destroy();
              button.label = null;
            }
          }
        });
      }
    } else {
      // Fallback without GSAP
      button.container.y = navHeight / 2;
      button.icon.y = iconYOffset;

      if ((button.icon as IText).style) {
        (button.icon as IText).style.fontSize = iconSize;
      }

      if (button.label) {
        button.container.removeChild(button.label);
        button.label.destroy();
        button.label = null;
      }
    }
  }

  /**
   * Reposition all buttons based on new active index
   */
  protected repositionAllButtons(): void {
    this.buttons.forEach((button, index) => {
      const newX = this.calculateButtonX(index);

      // Use GSAP if available
      if (typeof window !== 'undefined' && (window as any).gsap) {
        (window as any).gsap.to(button.container, {
          x: newX,
          duration: this.style.repositionDuration,
          ease: 'power2.out'
        });
      } else {
        button.container.x = newX;
      }
    });
  }

  /**
   * Create particle effects at position
   */
  protected createParticles(x: number, y: number, color: number): void {
    // Apply responsive scaling to particle sizes and speeds
    const [baseMinSize, baseMaxSize] = this.style.particleSizeRange;
    const [baseMinSpeed, baseMaxSpeed] = this.style.particleSpeedRange;

    const minSize = this.getScaledValue(baseMinSize);
    const maxSize = this.getScaledValue(baseMaxSize);
    const minSpeed = this.getScaledValue(baseMinSpeed);
    const maxSpeed = this.getScaledValue(baseMaxSpeed);

    for (let i = 0; i < this.style.particleCount; i++) {
      const particle = graphics().createGraphics();
      const size = Math.random() * (maxSize - minSize) + minSize;

      // Fill circle
      particle.circle(0, 0, size);
      particle.fill({ color, alpha: 1 });

      // Stroke circle outline
      particle.circle(0, 0, size);
      particle.stroke({ color: ARCHERO_COLORS.white, width: this.getScaledValue(2) });

      particle.x = x;
      particle.y = y;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;

      this.particleContainer.addChild(particle);

      this.particles.push({
        graphics: particle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        startTime: Date.now()
      });
    }
  }

  /**
   * Setup touch handlers for swipe gestures
   */
  protected setupTouchHandlers(): void {
    this.rootContainer.eventMode = 'static';

    this.rootContainer.on('pointerdown', (event: any) => {
      this.touchStartX = event.global?.x || 0;
      this.touchStartY = event.global?.y || 0;
    });

    this.rootContainer.on('pointerup', (event: any) => {
      const touchEndX = event.global?.x || 0;
      const deltaX = touchEndX - this.touchStartX;

      // Swipe threshold
      if (Math.abs(deltaX) > 100) {
        const direction = deltaX < 0 ? 'left' : 'right';

        // Call swipe callback
        if (this.callbacks.onSwipe) {
          this.callbacks.onSwipe(direction);
        }

        if (deltaX < 0 && this.activeSection < this.config.sections.length - 1) {
          // Swipe left - next section
          this.switchToSection(this.activeSection + 1);
        } else if (deltaX > 0 && this.activeSection > 0) {
          // Swipe right - previous section
          this.switchToSection(this.activeSection - 1);
        }
      }
    });
  }

  // ============================================================================
  // PUBLIC API - Section Management
  // ============================================================================

  /**
   * Add a new section to the menu
   * @param section Section to add
   * @param index Optional index to insert at (default: end)
   */
  public addSection(section: MenuSection, index?: number): void {
    const insertIndex = index !== undefined ? index : this.config.sections.length;
    this.config.sections.splice(insertIndex, 0, section);
    this.rebuildMenu();
  }

  /**
   * Remove a section from the menu
   * @param index Index of section to remove
   */
  public removeSection(index: number): void {
    if (index < 0 || index >= this.config.sections.length) {
      throw new Error(`Invalid section index: ${index}`);
    }

    // Don't allow removing the only section
    if (this.config.sections.length === 1) {
      throw new Error('Cannot remove the only section');
    }

    this.config.sections.splice(index, 1);

    // Adjust active section if needed
    if (this.activeSection >= index) {
      this.activeSection = Math.max(0, this.activeSection - 1);
    }

    this.rebuildMenu();
  }

  /**
   * Update an existing section
   * @param index Index of section to update
   * @param section Partial section data to merge
   */
  public updateSection(index: number, section: Partial<MenuSection>): void {
    if (index < 0 || index >= this.config.sections.length) {
      throw new Error(`Invalid section index: ${index}`);
    }

    this.config.sections[index] = {
      ...this.config.sections[index],
      ...section
    };

    this.rebuildMenu();
  }

  /**
   * Reorder sections
   * @param order Array of indices representing new order
   */
  public reorderSections(order: number[]): void {
    if (order.length !== this.config.sections.length) {
      throw new Error('Order array must have same length as sections');
    }

    const newSections = order.map(i => this.config.sections[i]);
    this.config.sections = newSections;

    // Update active section index
    this.activeSection = order.indexOf(this.activeSection);

    this.rebuildMenu();
  }

  /**
   * Set the number of sections (adds or removes as needed)
   * @param count Target number of sections
   * @param template Template section to use when adding new sections
   */
  public setSectionCount(count: number, template?: Partial<MenuSection>): void {
    const currentCount = this.config.sections.length;

    if (count < 1) {
      throw new Error('Section count must be at least 1');
    }

    if (count > currentCount) {
      // Add sections
      const defaultTemplate: MenuSection = {
        name: 'Section',
        icon: '⭐',
        iconColor: ARCHERO_COLORS.activeYellow,
        ...template
      };

      for (let i = currentCount; i < count; i++) {
        this.config.sections.push({
          ...defaultTemplate,
          name: `${defaultTemplate.name} ${i + 1}`
        });
      }
    } else if (count < currentCount) {
      // Remove sections
      this.config.sections.splice(count);

      // Adjust active section if needed
      if (this.activeSection >= count) {
        this.activeSection = count - 1;
      }
    }

    this.rebuildMenu();
  }

  /**
   * Get all sections
   */
  public getSections(): MenuSection[] {
    return [...this.config.sections];
  }

  /**
   * Get a specific section
   */
  public getSection(index: number): MenuSection {
    if (index < 0 || index >= this.config.sections.length) {
      throw new Error(`Invalid section index: ${index}`);
    }
    return this.config.sections[index];
  }

  // ============================================================================
  // PUBLIC API - State Management
  // ============================================================================

  /**
   * Update method - call this in game loop for particles
   */
  public update(deltaTime: number): void {
    if (!this.style.enableParticles || this.particles.length === 0) return;

    const dt = deltaTime * 0.016; // Convert to seconds-like scale

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.graphics.x += p.vx * dt;
      p.graphics.y += p.vy * dt;
      p.vy += 0.3; // Gravity

      // Update life
      p.life -= dt * 0.02;
      p.graphics.alpha = p.life;
      p.graphics.scale.x = p.life;
      p.graphics.scale.y = p.life;

      // Remove dead particles
      if (p.life <= 0) {
        this.particleContainer.removeChild(p.graphics);
        p.graphics.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Get the root container
   */
  public getContainer(): IContainer {
    return this.rootContainer;
  }

  /**
   * Get current active section index
   */
  public getActiveSection(): number {
    return this.activeSection;
  }

  /**
   * Set active section programmatically
   */
  public setActiveSection(index: number): void {
    if (index < 0 || index >= this.config.sections.length) {
      throw new Error(`Invalid section index: ${index}`);
    }

    if (index !== this.activeSection) {
      this.switchToSection(index);
    }
  }

  /**
   * Destroy menu and clean up resources
   */
  public destroy(): void {
    // Clean up particles
    for (const particle of this.particles) {
      particle.graphics.destroy();
    }
    this.particles = [];

    // Clean up buttons
    for (const button of this.buttons) {
      button.bg.destroy();
      if (button.overlay) button.overlay.destroy();
      button.icon.destroy();
      if (button.label) button.label.destroy();
      button.container.destroy({ children: true });
    }
    this.buttons = [];

    // Clean up containers
    this.particleContainer.destroy({ children: true });
    this.navBarContainer.destroy({ children: true });
    this.rootContainer.destroy({ children: true });

    // Remove all listeners
    this.removeAllListeners();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Convert hex color to RGB string
   */
  protected hexToRgb(hex: number): string {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Utility: Draw rounded rectangle on canvas
   */
  protected roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
