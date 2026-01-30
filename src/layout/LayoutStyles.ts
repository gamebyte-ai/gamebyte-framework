/**
 * Layout Styles & Presets
 *
 * Predefined layout configurations for common mobile game UI patterns.
 * These presets follow best practices for responsive game interfaces.
 *
 * @example
 * ```typescript
 * import { LayoutPresets, createFlexRow, createFlexColumn } from 'gamebyte-framework';
 *
 * // Use a preset
 * container.layout = LayoutPresets.center;
 *
 * // Use helper functions
 * container.layout = createFlexRow({ gap: 10, justify: 'space-between' });
 * ```
 */

import {
  LayoutConfig,
  JustifyContent,
  AlignItems,
  SpacingConfig,
  SizeValue,
} from './types.js';

// ============================================================================
// LAYOUT PRESETS
// ============================================================================

/**
 * Predefined layout configurations for common game UI patterns
 */
export const LayoutPresets = {
  /**
   * Center content both horizontally and vertically
   * Perfect for splash screens, modals, and popups
   */
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  } as LayoutConfig,

  /**
   * Center content horizontally only
   */
  centerHorizontal: {
    alignItems: 'center',
  } as LayoutConfig,

  /**
   * Center content vertically only
   */
  centerVertical: {
    justifyContent: 'center',
  } as LayoutConfig,

  /**
   * Top bar layout (fixed at top, full width)
   * Use with position: 'absolute' for fixed positioning
   */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  } as LayoutConfig,

  /**
   * Bottom bar layout (fixed at bottom, full width)
   * Use with position: 'absolute' for fixed positioning
   */
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  } as LayoutConfig,

  /**
   * Sidebar layout (vertical, full height)
   */
  sidebar: {
    flexDirection: 'column',
    alignItems: 'stretch',
    height: '100%',
    padding: 16,
    gap: 12,
  } as LayoutConfig,

  /**
   * Fullscreen container
   */
  fullscreen: {
    width: '100%',
    height: '100%',
  } as LayoutConfig,

  /**
   * Card-like container with padding
   */
  card: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 16,
    gap: 12,
    borderRadius: 12,
  } as LayoutConfig,

  /**
   * Grid layout (wrapping flex)
   */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    gap: 8,
  } as LayoutConfig,

  /**
   * Simple horizontal row
   */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as LayoutConfig,

  /**
   * Simple vertical column
   */
  column: {
    flexDirection: 'column',
    alignItems: 'stretch',
  } as LayoutConfig,

  /**
   * Stack layout (overlapping children)
   * Children should use position: 'absolute'
   */
  stack: {
    position: 'relative',
  } as LayoutConfig,

  /**
   * HUD layout (corners + center)
   * Typically used as root for game HUD
   */
  hud: {
    width: '100%',
    height: '100%',
    position: 'relative',
  } as LayoutConfig,

  /**
   * Modal/dialog layout (centered with backdrop)
   */
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  } as LayoutConfig,

  /**
   * Menu layout (vertical list of items)
   */
  menu: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    padding: 16,
  } as LayoutConfig,

  /**
   * Scrollable list
   */
  scrollList: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    overflow: 'scroll',
  } as LayoutConfig,

  /**
   * Level select grid
   */
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'flex-start',
    gap: 16,
    padding: 20,
  } as LayoutConfig,

  /**
   * Button group (horizontal)
   */
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  } as LayoutConfig,

  /**
   * Button group (vertical)
   */
  buttonGroupVertical: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  } as LayoutConfig,

  /**
   * Resource bar (coins, gems display)
   */
  resourceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  } as LayoutConfig,

  /**
   * Icon button layout
   */
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
  } as LayoutConfig,

  /**
   * Text button layout (icon + label)
   */
  textButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  } as LayoutConfig,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a flex row layout
 */
export function createFlexRow(options: {
  gap?: number;
  justify?: JustifyContent;
  align?: AlignItems;
  wrap?: boolean;
  reverse?: boolean;
} = {}): LayoutConfig {
  return {
    flexDirection: options.reverse ? 'row-reverse' : 'row',
    justifyContent: options.justify ?? 'flex-start',
    alignItems: options.align ?? 'center',
    flexWrap: options.wrap ? 'wrap' : 'nowrap',
    gap: options.gap,
  };
}

/**
 * Create a flex column layout
 */
export function createFlexColumn(options: {
  gap?: number;
  justify?: JustifyContent;
  align?: AlignItems;
  reverse?: boolean;
} = {}): LayoutConfig {
  return {
    flexDirection: options.reverse ? 'column-reverse' : 'column',
    justifyContent: options.justify ?? 'flex-start',
    alignItems: options.align ?? 'stretch',
    gap: options.gap,
  };
}

/**
 * Create a centered layout
 */
export function createCentered(options: {
  width?: SizeValue;
  height?: SizeValue;
} = {}): LayoutConfig {
  return {
    justifyContent: 'center',
    alignItems: 'center',
    width: options.width,
    height: options.height,
  };
}

/**
 * Create a grid layout
 */
export function createGrid(options: {
  columns?: number;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  itemWidth?: SizeValue;
  itemHeight?: SizeValue;
} = {}): LayoutConfig {
  return {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    gap: options.gap,
    rowGap: options.rowGap,
    columnGap: options.columnGap,
  };
}

/**
 * Create a stack layout (overlapping children)
 * Children should use position: 'absolute'
 */
export function createStack(options: {
  width?: SizeValue;
  height?: SizeValue;
} = {}): LayoutConfig {
  return {
    position: 'relative',
    width: options.width,
    height: options.height,
  };
}

/**
 * Create an absolute positioned child
 */
export function createAbsolute(options: {
  top?: SizeValue;
  right?: SizeValue;
  bottom?: SizeValue;
  left?: SizeValue;
  width?: SizeValue;
  height?: SizeValue;
  centerX?: boolean;
  centerY?: boolean;
} = {}): LayoutConfig {
  const config: LayoutConfig = {
    position: 'absolute',
    top: options.top,
    right: options.right,
    bottom: options.bottom,
    left: options.left,
    width: options.width,
    height: options.height,
  };

  // Center horizontally
  if (options.centerX) {
    config.left = '50%';
    // Note: Transform translate needs to be handled separately in PixiJS
  }

  // Center vertically
  if (options.centerY) {
    config.top = '50%';
  }

  return config;
}

/**
 * Create spacing (margin or padding)
 */
export function createSpacing(value: number | SpacingConfig): SpacingConfig {
  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value };
  }
  return value;
}

/**
 * Create margin config
 */
export function createMargin(value: number | SpacingConfig): Partial<LayoutConfig> {
  const spacing = createSpacing(value);
  return {
    marginTop: spacing.top,
    marginRight: spacing.right,
    marginBottom: spacing.bottom,
    marginLeft: spacing.left,
  };
}

/**
 * Create padding config
 */
export function createPadding(value: number | SpacingConfig): Partial<LayoutConfig> {
  const spacing = createSpacing(value);
  return {
    paddingTop: spacing.top,
    paddingRight: spacing.right,
    paddingBottom: spacing.bottom,
    paddingLeft: spacing.left,
  };
}

/**
 * Create a sized layout
 */
export function createSized(width: SizeValue, height: SizeValue): LayoutConfig {
  return { width, height };
}

/**
 * Create percentage-based sizing
 */
export function percent(value: number): string {
  return `${value}%`;
}

/**
 * Merge multiple layout configs
 */
export function mergeLayouts(...configs: (LayoutConfig | undefined)[]): LayoutConfig {
  return Object.assign({}, ...configs.filter(Boolean));
}

// ============================================================================
// RESPONSIVE HELPERS
// ============================================================================

/**
 * Create responsive layout based on screen size
 */
export function createResponsiveLayout(
  baseLayout: LayoutConfig,
  breakpoints: Record<string, Partial<LayoutConfig>>
): (screenWidth: number) => LayoutConfig {
  const sortedBreakpoints = Object.entries(breakpoints)
    .map(([key, value]) => ({
      width: parseInt(key, 10),
      config: value,
    }))
    .sort((a, b) => b.width - a.width);

  return (screenWidth: number): LayoutConfig => {
    const matchedBreakpoint = sortedBreakpoints.find(bp => screenWidth >= bp.width);
    if (matchedBreakpoint) {
      return mergeLayouts(baseLayout, matchedBreakpoint.config);
    }
    return baseLayout;
  };
}

/**
 * Scale a layout config for different screen densities
 */
export function scaleLayout(layout: LayoutConfig, scale: number): LayoutConfig {
  const scaled: LayoutConfig = { ...layout };

  // Scale numeric values
  const numericKeys: (keyof LayoutConfig)[] = [
    'gap', 'rowGap', 'columnGap',
    'borderRadius',
  ];

  for (const key of numericKeys) {
    if (typeof scaled[key] === 'number') {
      (scaled as any)[key] = Math.round((scaled[key] as number) * scale);
    }
  }

  // Scale spacing values (only if numeric)
  const spacingKeys: (keyof LayoutConfig)[] = [
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'marginHorizontal', 'marginVertical', 'paddingHorizontal', 'paddingVertical',
  ];

  for (const key of spacingKeys) {
    if (typeof scaled[key] === 'number') {
      (scaled as any)[key] = Math.round((scaled[key] as number) * scale);
    }
  }

  return scaled;
}

// ============================================================================
// GAME-SPECIFIC PRESETS
// ============================================================================

/**
 * Mobile game-specific layout presets
 */
export const GameLayoutPresets = {
  /**
   * Main game screen layout with HUD areas
   */
  gameScreen: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  } as LayoutConfig,

  /**
   * Safe area aware container
   * Respects device notches and home indicators
   */
  safeArea: {
    width: '100%',
    height: '100%',
    paddingTop: 44, // iOS notch
    paddingBottom: 34, // iOS home indicator
  } as LayoutConfig,

  /**
   * Touch-friendly button (min 44pt)
   */
  touchButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  } as LayoutConfig,

  /**
   * Currency display (icon + value)
   */
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  } as LayoutConfig,

  /**
   * Progress bar container
   */
  progressBar: {
    width: '100%',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  } as LayoutConfig,

  /**
   * Level button in level select
   */
  levelButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  } as LayoutConfig,

  /**
   * Shop item card
   */
  shopItem: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderRadius: 12,
  } as LayoutConfig,

  /**
   * Achievement/reward popup
   */
  rewardPopup: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    borderRadius: 20,
  } as LayoutConfig,

  /**
   * Settings menu
   */
  settingsMenu: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 20,
    gap: 16,
    width: '80%',
    maxWidth: 400,
  } as LayoutConfig,

  /**
   * Leaderboard entry row
   */
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  } as LayoutConfig,

  /**
   * Tab bar at bottom of screen
   */
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: 60,
    paddingHorizontal: 16,
  } as LayoutConfig,

  /**
   * Floating action button
   */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  } as LayoutConfig,

  /**
   * Banner ad placeholder
   */
  bannerAd: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  } as LayoutConfig,
} as const;
