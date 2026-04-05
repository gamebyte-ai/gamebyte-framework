/**
 * Card Components Module - GameByte Framework
 *
 * Game card UI components for character displays, rewards,
 * inventory items, and generic card containers.
 *
 * @module ui/components/cards
 * @example
 * ```typescript
 * import { GameCard, CharacterCard, RewardCard, ItemCard } from '@gamebyte/framework/ui/components/cards';
 * ```
 */

// Color system
export {
  CardRarityColors,
  GameCardColors,
  FlatCardColors,
  StatColors,
  getDefaultCardColors
} from './CardColors.js';

export type {
  CardRarity,
  CardStyle,
  RarityColorSet,
  CardColorScheme,
  StatBarColors
} from './CardColors.js';

// Card components
export { GameCard } from './GameCard.js';
export type { GameCardConfig } from './GameCard.js';

export { CharacterCard } from './CharacterCard.js';
export type { CharacterCardConfig, CharacterStat } from './CharacterCard.js';

export { RewardCard } from './RewardCard.js';
export type { RewardCardConfig } from './RewardCard.js';

export { ItemCard } from './ItemCard.js';
export type { ItemCardConfig, ItemCardSize } from './ItemCard.js';
