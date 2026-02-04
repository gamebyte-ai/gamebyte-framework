/**
 * UI Screens Module - GameByte Framework
 *
 * Pre-built screen templates for common game screens.
 *
 * @module ui/screens
 * @example
 * ```typescript
 * import { HubScreen, ResultScreen, GameHUDScreen } from '@gamebyte/framework/ui/screens';
 * ```
 */

export { BaseUIScreen } from './BaseUIScreen.js';
export { SplashScreen } from './SplashScreen.js';
export { SimpleScreen } from './SimpleScreen.js';

// Boilerplate Screens
export { HubScreen } from './HubScreen.js';
export type { HubScreenConfig, HubTabContent } from './HubScreen.js';

export { GameHUDScreen } from './GameHUDScreen.js';
export type { GameHUDScreenConfig, GameHUDConfig } from './GameHUDScreen.js';

export { ResultScreen } from './ResultScreen.js';
export type { ResultScreenConfig, ResultType, RewardItem, ResultAction } from './ResultScreen.js';
