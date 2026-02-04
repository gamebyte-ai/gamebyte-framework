/**
 * UI Module - GameByte Framework
 *
 * Complete UI system with components, screens, panels, themes, and effects.
 *
 * @module ui
 * @example
 * ```typescript
 * import { UIButton, GameStyleButton, TopBar } from '@gamebyte/framework/ui';
 * import { HubScreen, ResultScreen } from '@gamebyte/framework/ui/screens';
 * ```
 */

// Core UI
export { BaseUIComponent } from './core/BaseUIComponent.js';
export { GameByteUIManager } from './core/UIManager.js';

// Components (re-export from submodule)
export * from './components/index.js';

// Screens (re-export from submodule)
export * from './screens/index.js';

// Panels (re-export from submodule)
export * from './panels/index.js';

// Themes (re-export from submodule)
export * from './themes/index.js';

// Effects (re-export from submodule)
export * from './effects/index.js';

// Animation System
export { GameByteUIAnimationSystem, GameByteUITimeline } from './animations/UIAnimationSystem.js';

// Input System
export { GameByteUIInputSystem } from './input/UIInputSystem.js';

// Layout System
export { ResponsiveLayoutManager } from './layouts/ResponsiveLayoutManager.js';

// App Management
export { ScreenManager } from './app/ScreenManager.js';
export type { ScreenManagerConfig, TransitionType, TransitionDirection } from './app/ScreenManager.js';
export { PanelManager } from './app/PanelManager.js';
export type { PanelManagerConfig } from './app/PanelManager.js';

// State Management
export { createState, computed, isReactive, resolveValue } from './state/index.js';
export type { StateListener, ReactiveState } from './state/index.js';

// Font Loader
export { loadFrameworkFont, getFrameworkFontFamily, isFontReady } from './utils/FontLoader.js';
