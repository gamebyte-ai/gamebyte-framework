import { UITheme, Color } from '../../contracts/UI';

/**
 * Default UI theme with modern, mobile-first design inspired by Rollic/Voodoo games
 */
export class DefaultUITheme implements UITheme {
  public readonly name = 'default';

  // Modern color palette with vibrant accents
  public colors = {
    // Primary brand colors
    primary: { r: 0, g: 122, b: 255, a: 1 }, // iOS Blue
    secondary: { r: 255, g: 59, b: 48, a: 1 }, // iOS Red
    
    // Background colors
    background: { r: 25, g: 35, b: 45, a: 1 }, // Dark blue-gray
    surface: { r: 45, g: 55, b: 65, a: 1 }, // Lighter surface
    
    // Text colors
    text: { r: 255, g: 255, b: 255, a: 1 }, // White
    textSecondary: { r: 200, g: 210, b: 220, a: 1 }, // Light gray
    
    // Status colors
    success: { r: 52, g: 199, b: 89, a: 1 }, // iOS Green
    warning: { r: 255, g: 149, b: 0, a: 1 }, // iOS Orange
    error: { r: 255, g: 59, b: 48, a: 1 }, // iOS Red
    
    // Utility
    overlay: { r: 0, g: 0, b: 0, a: 0.5 } // Semi-transparent black
  };

  // Typography scale
  public typography = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    
    sizes: {
      small: 14,
      medium: 16,
      large: 20,
      xlarge: 32
    },
    
    weights: {
      normal: 400,
      bold: 700
    }
  };

  // Spacing scale (8px base unit)
  public spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  };

  // Border radius scale
  public radius = {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999
  };

  // Shadow definitions
  public shadows = {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.2)'
  };

  // Animation timings
  public animations = {
    fast: 150,
    normal: 300,
    slow: 500
  };
}

/**
 * Vibrant theme with bright colors (Voodoo-style)
 */
export class VibrantUITheme implements UITheme {
  public readonly name = 'vibrant';

  public colors = {
    primary: { r: 255, g: 45, b: 85, a: 1 }, // Hot pink
    secondary: { r: 0, g: 245, b: 255, a: 1 }, // Cyan
    background: { r: 15, g: 15, b: 25, a: 1 }, // Very dark blue
    surface: { r: 30, g: 30, b: 45, a: 1 },
    text: { r: 255, g: 255, b: 255, a: 1 },
    textSecondary: { r: 180, g: 180, b: 200, a: 1 },
    success: { r: 0, g: 255, b: 127, a: 1 }, // Bright green
    warning: { r: 255, g: 191, b: 0, a: 1 }, // Gold
    error: { r: 255, g: 45, b: 85, a: 1 }, // Hot pink
    overlay: { r: 0, g: 0, b: 0, a: 0.7 }
  };

  public typography = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    sizes: { small: 14, medium: 16, large: 20, xlarge: 32 },
    weights: { normal: 400, bold: 700 }
  };

  public spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
  public radius = { sm: 6, md: 12, lg: 20, full: 9999 };
  public shadows = {
    sm: '0 2px 8px rgba(255, 45, 85, 0.3)',
    md: '0 4px 16px rgba(255, 45, 85, 0.4)',
    lg: '0 8px 32px rgba(255, 45, 85, 0.5)'
  };
  public animations = { fast: 200, normal: 400, slow: 600 };
}

/**
 * Minimalist theme with clean lines (Rollic-style)
 */
export class MinimalUITheme implements UITheme {
  public readonly name = 'minimal';

  public colors = {
    primary: { r: 0, g: 0, b: 0, a: 1 }, // Black
    secondary: { r: 100, g: 100, b: 100, a: 1 }, // Gray
    background: { r: 248, g: 248, b: 248, a: 1 }, // Light gray
    surface: { r: 255, g: 255, b: 255, a: 1 }, // White
    text: { r: 0, g: 0, b: 0, a: 1 }, // Black
    textSecondary: { r: 100, g: 100, b: 100, a: 1 }, // Gray
    success: { r: 0, g: 150, b: 0, a: 1 }, // Green
    warning: { r: 200, g: 150, b: 0, a: 1 }, // Orange
    error: { r: 200, g: 0, b: 0, a: 1 }, // Red
    overlay: { r: 0, g: 0, b: 0, a: 0.3 }
  };

  public typography = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    sizes: { small: 12, medium: 14, large: 18, xlarge: 28 },
    weights: { normal: 300, bold: 600 }
  };

  public spacing = { xs: 2, sm: 4, md: 8, lg: 16, xl: 24 };
  public radius = { sm: 2, md: 4, lg: 8, full: 9999 };
  public shadows = {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.15)'
  };
  public animations = { fast: 100, normal: 200, slow: 300 };
}

/**
 * Dark theme optimized for mobile gaming
 */
export class DarkGamingUITheme implements UITheme {
  public readonly name = 'dark-gaming';

  public colors = {
    primary: { r: 0, g: 255, b: 127, a: 1 }, // Neon green
    secondary: { r: 255, g: 0, b: 255, a: 1 }, // Magenta
    background: { r: 8, g: 8, b: 12, a: 1 }, // Very dark
    surface: { r: 20, g: 20, b: 30, a: 1 }, // Dark surface
    text: { r: 240, g: 240, b: 255, a: 1 }, // Off-white
    textSecondary: { r: 160, g: 160, b: 180, a: 1 }, // Gray
    success: { r: 0, g: 255, b: 127, a: 1 }, // Neon green
    warning: { r: 255, g: 215, b: 0, a: 1 }, // Gold
    error: { r: 255, g: 20, b: 147, a: 1 }, // Deep pink
    overlay: { r: 0, g: 0, b: 0, a: 0.8 }
  };

  public typography = {
    fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
    sizes: { small: 13, medium: 15, large: 19, xlarge: 30 },
    weights: { normal: 400, bold: 700 }
  };

  public spacing = { xs: 3, sm: 6, md: 12, lg: 20, xl: 28 };
  public radius = { sm: 3, md: 6, lg: 12, full: 9999 };
  public shadows = {
    sm: '0 2px 4px rgba(0, 255, 127, 0.2)',
    md: '0 4px 8px rgba(0, 255, 127, 0.3)',
    lg: '0 8px 16px rgba(0, 255, 127, 0.4)'
  };
  public animations = { fast: 120, normal: 250, slow: 400 };
}

/**
 * Theme manager for switching between themes
 */
export class UIThemeManager {
  private themes: Map<string, UITheme> = new Map();
  private currentTheme: UITheme;

  constructor() {
    // Register default themes
    this.registerTheme(new DefaultUITheme());
    this.registerTheme(new VibrantUITheme());
    this.registerTheme(new MinimalUITheme());
    this.registerTheme(new DarkGamingUITheme());
    
    // Set default theme
    this.currentTheme = this.themes.get('default')!;
  }

  /**
   * Register a custom theme
   */
  public registerTheme(theme: UITheme): void {
    this.themes.set(theme.name, theme);
  }

  /**
   * Set the active theme
   */
  public setTheme(themeName: string): boolean {
    const theme = this.themes.get(themeName);
    if (theme) {
      this.currentTheme = theme;
      return true;
    }
    return false;
  }

  /**
   * Get the current theme
   */
  public getCurrentTheme(): UITheme {
    return this.currentTheme;
  }

  /**
   * Get all available themes
   */
  public getAvailableThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * Create a color variant (lighter/darker)
   */
  public static adjustColor(color: Color, factor: number): Color {
    return {
      r: Math.max(0, Math.min(255, color.r + (color.r * factor))),
      g: Math.max(0, Math.min(255, color.g + (color.g * factor))),
      b: Math.max(0, Math.min(255, color.b + (color.b * factor))),
      a: color.a
    };
  }

  /**
   * Create a semi-transparent version of a color
   */
  public static withAlpha(color: Color, alpha: number): Color {
    return {
      ...color,
      a: Math.max(0, Math.min(1, alpha))
    };
  }

  /**
   * Convert color to CSS rgba string
   */
  public static colorToCSS(color: Color): string {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  }

  /**
   * Convert color to hex string
   */
  public static colorToHex(color: Color): string {
    const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  /**
   * Create a gradient between two colors
   */
  public static createGradient(startColor: Color, endColor: Color, steps: number): Color[] {
    const gradient: Color[] = [];
    
    for (let i = 0; i < steps; i++) {
      const factor = i / (steps - 1);
      gradient.push({
        r: startColor.r + (endColor.r - startColor.r) * factor,
        g: startColor.g + (endColor.g - startColor.g) * factor,
        b: startColor.b + (endColor.b - startColor.b) * factor,
        a: startColor.a + (endColor.a - startColor.a) * factor
      });
    }
    
    return gradient;
  }
}