import { UITheme } from '../../contracts/UI.js';

/**
 * Flat Modern UI Theme
 *
 * Clean, minimal design with subtle shadows and no heavy gradients.
 * Ideal for casual/hyper-casual games and modern app-style interfaces.
 *
 * Inspired by modern mobile app design (Material You, iOS 17+).
 */
export class FlatModernUITheme implements UITheme {
  public readonly name = 'flat-modern';

  public colors = {
    primary: { r: 59, g: 130, b: 246, a: 1 },     // Blue-500
    secondary: { r: 99, g: 102, b: 241, a: 1 },    // Indigo-500
    background: { r: 245, g: 245, b: 245, a: 1 },  // Gray-100
    surface: { r: 255, g: 255, b: 255, a: 1 },      // White
    text: { r: 33, g: 33, b: 33, a: 1 },            // Gray-900
    textSecondary: { r: 117, g: 117, b: 117, a: 1 },// Gray-600
    success: { r: 34, g: 197, b: 94, a: 1 },        // Green-500
    warning: { r: 245, g: 158, b: 11, a: 1 },       // Amber-500
    error: { r: 239, g: 68, b: 68, a: 1 },          // Red-500
    overlay: { r: 0, g: 0, b: 0, a: 0.4 }
  };

  public typography = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sizes: {
      small: 13,
      medium: 15,
      large: 20,
      xlarge: 28
    },
    weights: {
      normal: 400,
      bold: 600
    }
  };

  public spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  };

  public radius = {
    sm: 6,
    md: 12,
    lg: 16,
    full: 9999
  };

  public shadows = {
    sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
    md: '0 2px 8px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 16px rgba(0, 0, 0, 0.12)'
  };

  public animations = {
    fast: 150,
    normal: 250,
    slow: 400
  };
}
