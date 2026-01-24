import { UITheme, Color } from '../../contracts/UI';

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
    fontFamily: '"Fredoka One", "Bubblegum Sans", "Comic Sans MS", "Arial Black", sans-serif',

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
  // Pre-defined button color schemes - Mobile game style (Candy Crush, Brawl Stars)
  YELLOW_BUTTON: {
    gradientTop: 0xFFD966,    // Bright golden yellow (top section)
    gradientBottom: 0xE6A800, // Darker orange-gold (bottom section)
    border: 0xB37700,         // Dark brown-orange border
    shadow: 0x805500,         // Deep brown shadow
    highlight: 0xFFF0B3,      // Light cream highlight
    text: 0xFFFFFF,
    textStroke: 0x805500
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
    gradientTop: 0x5DADEC,    // Sky blue
    gradientBottom: 0x2E86C9, // Ocean blue
    border: 0x1A5C8F,         // Dark navy border
    shadow: 0x0D3A5C,         // Deep navy shadow
    highlight: 0xB3DBFF,
    text: 0xFFFFFF,
    textStroke: 0x0D3A5C
  },

  RED_BUTTON: {
    gradientTop: 0xE85C5C,    // Coral red
    gradientBottom: 0xC92A2A, // Deep red
    border: 0x8F1A1A,         // Dark crimson border
    shadow: 0x5C0D0D,         // Deep crimson shadow
    highlight: 0xFFB3B3,
    text: 0xFFFFFF,
    textStroke: 0x5C0D0D
  },

  PURPLE_BUTTON: {
    gradientTop: 0xAD6DD6,    // Lavender
    gradientBottom: 0x8338B5, // Royal purple
    border: 0x5C2680,         // Dark purple border
    shadow: 0x3D1A54,         // Deep purple shadow
    highlight: 0xDDB3FF,
    text: 0xFFFFFF,
    textStroke: 0x3D1A54
  },

  // Cream/Beige Play Button (Candy Crush style)
  CREAM_BUTTON: {
    gradientTop: 0xFFFBF0,
    gradientBottom: 0xF5E6C8,
    border: 0xD4A857,
    shadow: 0x8B6914,
    highlight: 0xFFFFFF,
    text: 0x8B6914,
    textStroke: 0xD4A857
  },

  // Hexagon level colors
  HEXAGON_BLUE: {
    fill: 0x3D85C6,
    border: 0x1A3A5C,
    highlight: 0x6DB3F2,
    text: 0xFFFFFF,
    textStroke: 0x1A3A5C
  },

  HEXAGON_LOCKED: {
    fill: 0x5C6370,
    border: 0x3A3F47,
    highlight: 0x7A8089,
    text: 0xCCCCCC,
    textStroke: 0x2A2E35
  },

  HEXAGON_COMPLETED: {
    fill: 0x43A047,
    border: 0x1B5E20,
    highlight: 0x76D275,
    text: 0xFFFFFF,
    textStroke: 0x1B5E20
  },

  HEXAGON_CURRENT: {
    fill: 0x5C6BC0,
    border: 0x283593,
    highlight: 0x8E99F3,
    text: 0xFFFFFF,
    textStroke: 0x283593
  },

  // Candy Crush style hexagon with golden border
  HEXAGON_CANDY_BLUE: {
    fill: 0x4A7BB7,
    border: 0xFFB300,
    highlight: 0x6B9BD1,
    text: 0xFFFFFF,
    textStroke: 0x2D4A6E,
    outerBorder: 0xCC8800
  },

  HEXAGON_CANDY_CURRENT: {
    fill: 0x5A9BD4,
    border: 0xFFB300,
    highlight: 0x7BB8E8,
    text: 0xFFFFFF,
    textStroke: 0x2D5A7E,
    outerBorder: 0xCC8800,
    glow: 0x00FFFF
  },

  HEXAGON_CANDY_LOCKED: {
    fill: 0x4A5568,
    border: 0x718096,
    highlight: 0x5A6578,
    text: 0xA0AEC0,
    textStroke: 0x2D3748,
    outerBorder: 0x4A5568
  },

  // Panel color schemes
  PANEL_BLUE: {
    fillTop: 0x5BA3E0,
    fillBottom: 0x3B7BBF,
    borderOuter: 0x1A4B7A,
    borderInner: 0x2A6B9A,
    borderWidth: 8,
    titleColor: 0xFFFFFF,
    titleStroke: 0x1A4B7A,
    closeButtonBg: 0xE84C4C,
    closeButtonBorder: 0x8B2020,
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
