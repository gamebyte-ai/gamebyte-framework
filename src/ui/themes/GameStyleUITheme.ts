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
  // Pre-defined button color schemes
  YELLOW_BUTTON: {
    gradientTop: 0xFFE066,
    gradientBottom: 0xFFB300,
    border: 0xCC8800,
    shadow: 0x996600,
    highlight: 0xFFFFCC,
    text: 0xFFFFFF,
    textStroke: 0x8B6914
  },

  GREEN_BUTTON: {
    gradientTop: 0x7DD87D,
    gradientBottom: 0x4CAF50,
    border: 0x2E7D32,
    shadow: 0x1B5E20,
    highlight: 0xC8E6C9,
    text: 0xFFFFFF,
    textStroke: 0x1B5E20
  },

  BLUE_BUTTON: {
    gradientTop: 0x64B5F6,
    gradientBottom: 0x2196F3,
    border: 0x1565C0,
    shadow: 0x0D47A1,
    highlight: 0xBBDEFB,
    text: 0xFFFFFF,
    textStroke: 0x0D47A1
  },

  RED_BUTTON: {
    gradientTop: 0xEF5350,
    gradientBottom: 0xD32F2F,
    border: 0xB71C1C,
    shadow: 0x7F0000,
    highlight: 0xFFCDD2,
    text: 0xFFFFFF,
    textStroke: 0x7F0000
  },

  PURPLE_BUTTON: {
    gradientTop: 0xBA68C8,
    gradientBottom: 0x9C27B0,
    border: 0x6A1B9A,
    shadow: 0x4A148C,
    highlight: 0xE1BEE7,
    text: 0xFFFFFF,
    textStroke: 0x4A148C
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
