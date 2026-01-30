import { UITheme } from '../../contracts/UI';

/**
 * Game-style UI theme inspired by mobile games like Brawl Stars, Candy Crush, etc.
 * Features vibrant colors, multi-layer effects, and bold visual design.
 */
export class GameStyleUITheme implements UITheme {
  public readonly name = 'game-style';

  // Vibrant game-style color palette
  public colors = {
    // Primary action color (bright orange/yellow for Play buttons)
    primary: { r: 255, g: 180, b: 0, a: 1 }, // Golden yellow
    secondary: { r: 0, g: 180, b: 255, a: 1 }, // Bright cyan

    // Background colors (sky blue gradient base)
    background: { r: 0, g: 140, b: 220, a: 1 }, // Sky blue
    surface: { r: 30, g: 100, b: 180, a: 1 }, // Darker blue surface

    // Text colors
    text: { r: 255, g: 255, b: 255, a: 1 }, // White with stroke
    textSecondary: { r: 200, g: 220, b: 255, a: 1 }, // Light blue-white

    // Status colors (game-style vibrant)
    success: { r: 50, g: 205, b: 50, a: 1 }, // Lime green
    warning: { r: 255, g: 165, b: 0, a: 1 }, // Orange
    error: { r: 255, g: 60, b: 60, a: 1 }, // Bright red

    // Utility
    overlay: { r: 0, g: 0, b: 0, a: 0.6 }
  };

  // Game-style specific colors
  public gameColors = {
    // Button colors
    buttonYellow: { top: 0xFFD700, bottom: 0xFFA500, border: 0xCC8800 },
    buttonGreen: { top: 0x50C878, bottom: 0x228B22, border: 0x1A6B1A },
    buttonBlue: { top: 0x4DA6FF, bottom: 0x0066CC, border: 0x004C99 },
    buttonRed: { top: 0xFF6B6B, bottom: 0xCC3333, border: 0x992626 },
    buttonPurple: { top: 0xB388FF, bottom: 0x7C4DFF, border: 0x5C3DB8 },

    // UI element colors
    panelDark: 0x1A237E,
    panelLight: 0x3949AB,
    borderDark: 0x0D1B2A,
    borderMedium: 0x1B3A5C,

    // Resource colors
    coinGold: 0xFFD700,
    gemPurple: 0x9C27B0,
    heartRed: 0xFF4081,
    energyBlue: 0x00BCD4,

    // Level path
    pathActive: 0xFFD54F,
    pathInactive: 0x5C6BC0,
    pathCompleted: 0x4CAF50,

    // Hexagon level button
    hexBlue: { fill: 0x3D85C6, border: 0x1A3A5C, highlight: 0x6DB3F2 },
    hexLocked: { fill: 0x5C5C5C, border: 0x3A3A3A, highlight: 0x7A7A7A }
  };

  // Bold typography for games
  public typography = {
    fontFamily: '"Lilita One", "Arial Black", sans-serif',

    sizes: {
      small: 16,
      medium: 22,
      large: 32,
      xlarge: 48
    },

    weights: {
      normal: 600,
      bold: 800
    }
  };

  // Generous spacing for touch targets
  public spacing = {
    xs: 6,
    sm: 12,
    md: 20,
    lg: 32,
    xl: 48
  };

  // Rounded corners for game feel
  public radius = {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999
  };

  // Bold shadows for depth
  public shadows = {
    sm: '0 3px 0 rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)',
    md: '0 5px 0 rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.25)',
    lg: '0 8px 0 rgba(0, 0, 0, 0.3), 0 12px 24px rgba(0, 0, 0, 0.3)'
  };

  // Bouncy animations
  public animations = {
    fast: 150,
    normal: 300,
    slow: 500
  };
}

/**
 * Game style color utilities
 */
export const GameStyleColors = {
  // Pre-defined button color schemes - No Ads popup style (solid color, black border, jellybean)

  YELLOW_BUTTON: {
    gradientTop: 0xFFD966,    // Golden yellow (solid)
    gradientBottom: 0xFFD966, // Same - solid color
    border: 0x000000,         // Black outer border
    shadow: 0xCC9900,         // Darker yellow shadow
    highlight: 0xFFFFFF,      // White highlight (25% alpha applied in code)
    text: 0xFFFFFF,
    textStroke: 0x805500,
    jellybean: 0xFFFBE6       // Light cream jellybean
  },

  GREEN_BUTTON: {
    gradientTop: 0x2DE45A,    // Main green (No Ads popup style)
    gradientBottom: 0x2DE45A, // Same - solid color
    border: 0x000000,         // Black outer border
    shadow: 0x28A165,         // Green shadow/depth
    highlight: 0xFFFFFF,      // White highlight (25% alpha applied in code)
    text: 0xFFFFFF,
    textStroke: 0x1A4D1A,
    jellybean: 0xE6FCE9       // Jellybean gloss color
  },

  BLUE_BUTTON: {
    gradientTop: 0x4DA6FF,    // Bright blue (solid)
    gradientBottom: 0x4DA6FF, // Same - solid color
    border: 0x000000,         // Black outer border
    shadow: 0x2E7BC9,         // Darker blue shadow
    highlight: 0xFFFFFF,      // White highlight (25% alpha applied in code)
    text: 0xFFFFFF,
    textStroke: 0x1A4B7A,
    jellybean: 0xE6F3FF       // Light blue jellybean
  },

  RED_BUTTON: {
    gradientTop: 0xE85C5C,    // Coral red (solid)
    gradientBottom: 0xE85C5C, // Same - solid color
    border: 0x000000,         // Black outer border
    shadow: 0xB34040,         // Darker red shadow
    highlight: 0xFFFFFF,      // White highlight (25% alpha applied in code)
    text: 0xFFFFFF,
    textStroke: 0x5C0D0D,
    jellybean: 0xFFE6E6       // Light pink jellybean
  },

  PURPLE_BUTTON: {
    gradientTop: 0xAD6DD6,    // Lavender (solid)
    gradientBottom: 0xAD6DD6, // Same - solid color
    border: 0x000000,         // Black outer border
    shadow: 0x8050B0,         // Darker purple shadow
    highlight: 0xFFFFFF,      // White highlight (25% alpha applied in code)
    text: 0xFFFFFF,
    textStroke: 0x3D1A54,
    jellybean: 0xF3E6FF       // Light lavender jellybean
  },

  // Cream/Beige Play Button (Candy Crush style - keeps gradient for variety)
  CREAM_BUTTON: {
    gradientTop: 0xFFFBF0,
    gradientBottom: 0xF5E6C8,
    border: 0x000000,         // Black outer border
    shadow: 0xD4A857,
    highlight: 0xFFFFFF,
    text: 0x8B6914,
    textStroke: 0xD4A857,
    jellybean: 0xFFFFFF       // White jellybean
  },

  // Hexagon level colors
  HEXAGON_BLUE: {
    fill: 0x4DA6FF,
    fillBottom: 0x2E7BC9,
    border: 0x1A3A5C,
    highlight: 0x7DBFFF,
    text: 0xFFFFFF,
    textStroke: 0x1A3A5C
  },

  HEXAGON_LOCKED: {
    fill: 0x6B7280,
    fillBottom: 0x4B5563,
    border: 0x374151,
    highlight: 0x9CA3AF,
    text: 0xD1D5DB,
    textStroke: 0x1F2937
  },

  HEXAGON_COMPLETED: {
    fill: 0x4ADE80,
    fillBottom: 0x22C55E,
    border: 0x166534,
    highlight: 0x86EFAC,
    text: 0xFFFFFF,
    textStroke: 0x166534
  },

  HEXAGON_CURRENT: {
    fill: 0x818CF8,
    fillBottom: 0x6366F1,
    border: 0x3730A3,
    highlight: 0xA5B4FC,
    text: 0xFFFFFF,
    textStroke: 0x3730A3,
    glow: 0x818CF8
  },

  // Candy Crush style hexagon with golden border
  HEXAGON_CANDY_BLUE: {
    fill: 0x5DADE2,
    fillBottom: 0x3498DB,
    border: 0xF1C40F,
    highlight: 0x85C1E9,
    text: 0xFFFFFF,
    textStroke: 0x21618C,
    outerBorder: 0xD4AC0D
  },

  HEXAGON_CANDY_CURRENT: {
    fill: 0x7FB3D5,
    fillBottom: 0x5499C7,
    border: 0xF1C40F,
    highlight: 0xA9CCE3,
    text: 0xFFFFFF,
    textStroke: 0x2471A3,
    outerBorder: 0xD4AC0D,
    glow: 0x5DADE2
  },

  HEXAGON_CANDY_LOCKED: {
    fill: 0x7F8C8D,
    fillBottom: 0x5D6D7E,
    border: 0x95A5A6,
    highlight: 0xAEB6BF,
    text: 0xBDC3C7,
    textStroke: 0x2C3E50,
    outerBorder: 0x566573
  },

  // Panel color schemes (matches No Ads popup style)
  PANEL_BLUE: {
    fillTop: 0x41A7FB,      // Light blue (same as No Ads modal bg)
    fillBottom: 0x41A7FB,   // Solid color, no gradient
    borderOuter: 0x1e3a5f,  // Dark navy border
    borderInner: 0x1e3a5f,  // Same - single border layer
    borderWidth: 4,         // Thinner border like No Ads
    titleColor: 0xFFFFFF,
    titleStroke: 0x1a2a3a,  // Darker stroke for title
    headerBg: 0x2889F0,     // Darker blue header
    closeButtonBg: 0xE84C4C,
    closeButtonBorder: 0xA83340,
    closeButtonX: 0xFFFFFF
  },

  PANEL_PURPLE: {
    fillTop: 0xA478DC,
    fillBottom: 0x7B4DB8,
    borderOuter: 0x4A2878,
    borderInner: 0x5A3888,
    borderWidth: 8,
    titleColor: 0xFFFFFF,
    titleStroke: 0x4A2878,
    closeButtonBg: 0xE84C4C,
    closeButtonBorder: 0x8B2020,
    closeButtonX: 0xFFFFFF
  },

  PANEL_GREEN: {
    fillTop: 0x6FCF6F,
    fillBottom: 0x4CAF50,
    borderOuter: 0x2E7D32,
    borderInner: 0x388E3C,
    borderWidth: 8,
    titleColor: 0xFFFFFF,
    titleStroke: 0x2E7D32,
    closeButtonBg: 0xE84C4C,
    closeButtonBorder: 0x8B2020,
    closeButtonX: 0xFFFFFF
  },

  PANEL_ORANGE: {
    fillTop: 0xFFB74D,
    fillBottom: 0xFF9800,
    borderOuter: 0xE65100,
    borderInner: 0xF57C00,
    borderWidth: 8,
    titleColor: 0xFFFFFF,
    titleStroke: 0xE65100,
    closeButtonBg: 0xE84C4C,
    closeButtonBorder: 0x8B2020,
    closeButtonX: 0xFFFFFF
  },

  PANEL_DARK: {
    fillTop: 0x3D4A5C,
    fillBottom: 0x2C3E50,
    borderOuter: 0x1A252F,
    borderInner: 0x2A3F4F,
    borderWidth: 8,
    titleColor: 0xFFFFFF,
    titleStroke: 0x1A252F,
    closeButtonBg: 0xE84C4C,
    closeButtonBorder: 0x8B2020,
    closeButtonX: 0xFFFFFF
  },

  PANEL_RED: {
    fillTop: 0xE57373,
    fillBottom: 0xD32F2F,
    borderOuter: 0x8B1A1A,
    borderInner: 0xB71C1C,
    borderWidth: 8,
    titleColor: 0xFFFFFF,
    titleStroke: 0x8B1A1A,
    closeButtonBg: 0x333333,
    closeButtonBorder: 0x1A1A1A,
    closeButtonX: 0xFFFFFF
  },

  // Top Bar Resource Pill Colors
  TOP_BAR_LIVES: {
    background: 0x1A1A2A,
    border: 0x0D0D15,
    iconColor: 0xFF4081,
    textColor: 0xFFFFFF,
    labelBackground: 0x2A2A3A,
    labelColor: 0xFFFFFF
  },

  TOP_BAR_COINS: {
    background: 0x4CAF50,
    border: 0x2E7D32,
    iconColor: 0xFFD700,
    textColor: 0xFFFFFF,
    addButtonBg: 0x66BB6A,
    addButtonBorder: 0x43A047
  },

  // Bottom Navigation Colors
  BOTTOM_NAV: {
    background: 0x1A237E,
    topBorder: 0x3949AB,
    itemBackground: 0x283593,
    itemHighlight: 0x3949AB,
    itemActive: 0x5C6BC0,
    textColor: 0xFFFFFF,
    lockedColor: 0x757575
  },

  // ═══════════════════════════════════════════════════════════════
  // @pixi/ui Wrapper Component Colors (Jellybean Style)
  // ═══════════════════════════════════════════════════════════════

  // Input field colors
  GAME_INPUT: {
    background: 0x2A3A4A,
    backgroundFocus: 0x3A4A5A,
    border: 0x000000,
    borderInner: 0x1A2A3A,
    shadow: 0x1A2530,
    text: 0xFFFFFF,
    placeholder: 0x8A9AAA,
    cursor: 0xFFFFFF,
    selection: 0x4DA6FF,
    highlight: 0xFFFFFF
  },

  // ScrollBox colors
  GAME_SCROLLBOX: {
    background: 0x2A3A4A,
    border: 0x000000,
    borderInner: 0x1A2A3A,
    shadow: 0x1A2530,
    scrollbarTrack: 0x1A2A3A,
    scrollbarThumb: 0x5A6A7A,
    scrollbarThumbHover: 0x7A8A9A,
    highlight: 0xFFFFFF
  },

  // Select/Dropdown colors
  GAME_SELECT: {
    triggerBg: 0x4DA6FF,
    triggerBorder: 0x000000,
    triggerShadow: 0x2E7BC9,
    triggerHighlight: 0xFFFFFF,
    dropdownBg: 0x2A3A4A,
    dropdownBorder: 0x000000,
    dropdownShadow: 0x1A2530,
    itemHover: 0x3A4A5A,
    itemSelected: 0x4DA6FF,
    text: 0xFFFFFF,
    arrow: 0xFFFFFF
  },

  // CheckBox colors
  GAME_CHECKBOX: {
    boxBg: 0x2A3A4A,
    boxBorder: 0x000000,
    boxShadow: 0x1A2530,
    boxChecked: 0x4DA6FF,
    checkmark: 0xFFFFFF,
    highlight: 0xFFFFFF,
    text: 0xFFFFFF
  },

  // RadioGroup colors
  GAME_RADIO: {
    circleBg: 0x2A3A4A,
    circleBorder: 0x000000,
    circleShadow: 0x1A2530,
    circleSelected: 0x4DA6FF,
    dot: 0xFFFFFF,
    highlight: 0xFFFFFF,
    text: 0xFFFFFF
  },

  // List colors (minimal - mostly container)
  GAME_LIST: {
    background: 0x2A3A4A,
    border: 0x000000,
    divider: 0x3A4A5A
  }
};

/**
 * Create a canvas gradient for game buttons
 */
export function createGameButtonGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colorTop: number,
  colorBottom: number
): CanvasGradient {
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, numberToHex(colorTop));
  gradient.addColorStop(0.5, numberToHex(colorTop));
  gradient.addColorStop(0.5, numberToHex(colorBottom));
  gradient.addColorStop(1, numberToHex(colorBottom));
  return gradient;
}

/**
 * Create a vertical gradient for backgrounds
 */
export function createSkyGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0066CC');
  gradient.addColorStop(0.3, '#0088EE');
  gradient.addColorStop(0.6, '#00AAFF');
  gradient.addColorStop(1, '#66CCFF');
  return gradient;
}

/**
 * Convert hex number to CSS color string
 */
export function numberToHex(num: number): string {
  return `#${num.toString(16).padStart(6, '0')}`;
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(color: number, percent: number): number {
  const r = Math.min(255, ((color >> 16) & 0xFF) + Math.floor(255 * percent));
  const g = Math.min(255, ((color >> 8) & 0xFF) + Math.floor(255 * percent));
  const b = Math.min(255, (color & 0xFF) + Math.floor(255 * percent));
  return (r << 16) | (g << 8) | b;
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(color: number, percent: number): number {
  const r = Math.max(0, ((color >> 16) & 0xFF) - Math.floor(255 * percent));
  const g = Math.max(0, ((color >> 8) & 0xFF) - Math.floor(255 * percent));
  const b = Math.max(0, (color & 0xFF) - Math.floor(255 * percent));
  return (r << 16) | (g << 8) | b;
}
