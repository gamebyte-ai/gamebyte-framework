/**
 * Card Color Schemes and Rarity System
 *
 * Defines color palettes for game card components in both
 * "game" (vibrant, multi-layer) and "flat" (clean, minimal) styles.
 *
 * @module ui/components/cards
 */

/**
 * Card rarity levels
 */
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Card visual style
 */
export type CardStyle = 'game' | 'flat';

/**
 * Rarity-specific color definition
 */
export interface RarityColorSet {
  border: number;
  glow: number;
  glowAlpha: number;
  background: number;
  backgroundBottom: number;
  accent: number;
  text: number;
  textStroke: number;
  badge: number;
}

/**
 * Card color scheme (for both game and flat styles)
 */
export interface CardColorScheme {
  background: number;
  backgroundBottom: number;
  border: number;
  borderWidth: number;
  headerBg: number;
  headerText: number;
  headerTextStroke: number;
  bodyText: number;
  shadow: number;
  highlight: number;
}

/**
 * Rarity colors — auto-applied based on card rarity
 */
export const CardRarityColors: Record<CardRarity, RarityColorSet> = {
  common: {
    border: 0x9E9E9E,
    glow: 0x9E9E9E,
    glowAlpha: 0,
    background: 0x424242,
    backgroundBottom: 0x333333,
    accent: 0xBDBDBD,
    text: 0xFFFFFF,
    textStroke: 0x424242,
    badge: 0x757575
  },
  rare: {
    border: 0x4DA6FF,
    glow: 0x4DA6FF,
    glowAlpha: 0.3,
    background: 0x1A3A5C,
    backgroundBottom: 0x0D2440,
    accent: 0x7DBFFF,
    text: 0xFFFFFF,
    textStroke: 0x1A3A5C,
    badge: 0x2E7BC9
  },
  epic: {
    border: 0xB388FF,
    glow: 0xB388FF,
    glowAlpha: 0.4,
    background: 0x4A2878,
    backgroundBottom: 0x351A5C,
    accent: 0xD4BBFF,
    text: 0xFFFFFF,
    textStroke: 0x4A2878,
    badge: 0x7C4DFF
  },
  legendary: {
    border: 0xFFD700,
    glow: 0xFFD700,
    glowAlpha: 0.5,
    background: 0x5C4200,
    backgroundBottom: 0x3D2C00,
    accent: 0xFFE44D,
    text: 0xFFFFFF,
    textStroke: 0x5C4200,
    badge: 0xFFA000
  }
};

/**
 * Game-style card color schemes (vibrant, multi-layer — matches GameStyleButton pattern)
 */
export const GameCardColors = {
  BLUE: {
    background: 0x1A3A5C,
    backgroundBottom: 0x0D2440,
    border: 0x000000,
    borderWidth: 3,
    headerBg: 0x2889F0,
    headerText: 0xFFFFFF,
    headerTextStroke: 0x1A3A5C,
    bodyText: 0xFFFFFF,
    shadow: 0x0A1A2E,
    highlight: 0xFFFFFF
  } as CardColorScheme,

  PURPLE: {
    background: 0x4A2878,
    backgroundBottom: 0x351A5C,
    border: 0x000000,
    borderWidth: 3,
    headerBg: 0x7C4DFF,
    headerText: 0xFFFFFF,
    headerTextStroke: 0x4A2878,
    bodyText: 0xFFFFFF,
    shadow: 0x2A1048,
    highlight: 0xFFFFFF
  } as CardColorScheme,

  GREEN: {
    background: 0x1A5C2E,
    backgroundBottom: 0x0D401A,
    border: 0x000000,
    borderWidth: 3,
    headerBg: 0x4CAF50,
    headerText: 0xFFFFFF,
    headerTextStroke: 0x1A5C2E,
    bodyText: 0xFFFFFF,
    shadow: 0x0A2E14,
    highlight: 0xFFFFFF
  } as CardColorScheme,

  DARK: {
    background: 0x2C3E50,
    backgroundBottom: 0x1A252F,
    border: 0x000000,
    borderWidth: 3,
    headerBg: 0x3D5A80,
    headerText: 0xFFFFFF,
    headerTextStroke: 0x1A252F,
    bodyText: 0xE0E0E0,
    shadow: 0x0D1218,
    highlight: 0xFFFFFF
  } as CardColorScheme
};

/**
 * Flat-style card color schemes (clean, minimal — matches MinimalUITheme pattern)
 */
export const FlatCardColors = {
  LIGHT: {
    background: 0xFFFFFF,
    backgroundBottom: 0xFFFFFF,
    border: 0xE0E0E0,
    borderWidth: 1,
    headerBg: 0xF5F5F5,
    headerText: 0x333333,
    headerTextStroke: 0x000000,
    bodyText: 0x666666,
    shadow: 0xCCCCCC,
    highlight: 0xFFFFFF
  } as CardColorScheme,

  DARK: {
    background: 0x2A2A3E,
    backgroundBottom: 0x2A2A3E,
    border: 0x3A3A4E,
    borderWidth: 1,
    headerBg: 0x333348,
    headerText: 0xFFFFFF,
    headerTextStroke: 0x000000,
    bodyText: 0xCCCCCC,
    shadow: 0x1A1A2E,
    highlight: 0x3A3A4E
  } as CardColorScheme,

  BLUE: {
    background: 0xF0F7FF,
    backgroundBottom: 0xF0F7FF,
    border: 0xBBDEFB,
    borderWidth: 1,
    headerBg: 0xE3F2FD,
    headerText: 0x1565C0,
    headerTextStroke: 0x000000,
    bodyText: 0x424242,
    shadow: 0xBBDEFB,
    highlight: 0xFFFFFF
  } as CardColorScheme
};

/**
 * Get the default card color scheme for a given style
 */
export function getDefaultCardColors(style: CardStyle): CardColorScheme {
  return style === 'game' ? GameCardColors.BLUE : FlatCardColors.LIGHT;
}

/**
 * Stat bar color definition
 */
export interface StatBarColors {
  fill: number;
  background: number;
  text: number;
}

/**
 * Pre-defined stat bar colors
 */
export const StatColors = {
  HP: { fill: 0x4CAF50, background: 0x1B5E20, text: 0xFFFFFF } as StatBarColors,
  ATK: { fill: 0xF44336, background: 0xB71C1C, text: 0xFFFFFF } as StatBarColors,
  DEF: { fill: 0x2196F3, background: 0x0D47A1, text: 0xFFFFFF } as StatBarColors,
  SPD: { fill: 0xFFEB3B, background: 0xF57F17, text: 0x333333 } as StatBarColors,
  MANA: { fill: 0x9C27B0, background: 0x4A148C, text: 0xFFFFFF } as StatBarColors
};
