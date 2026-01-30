/**
 * GameByte Layout Module
 *
 * Provides CSS-like flexbox layout capabilities for PixiJS using @pixi/layout.
 * Built on Facebook's Yoga engine (same as React Native).
 *
 * @example
 * ```typescript
 * import { LayoutPresets, createFlexRow, GameLayoutPresets } from 'gamebyte-framework';
 *
 * // Use presets
 * container.layout = LayoutPresets.center;
 * hud.layout = GameLayoutPresets.topBar;
 *
 * // Use helpers
 * row.layout = createFlexRow({ gap: 10, justify: 'space-between' });
 *
 * // Direct configuration
 * panel.layout = {
 *   flexDirection: 'column',
 *   justifyContent: 'center',
 *   alignItems: 'center',
 *   gap: 16,
 *   padding: 20,
 *   width: '80%',
 *   height: 'auto',
 * };
 * ```
 *
 * @module layout
 */

// Import @pixi/layout to apply mixins (must be done before creating PixiJS objects)
import '@pixi/layout';

// Re-export types
export * from './types.js';

// Re-export layout styles and presets
export {
  LayoutPresets,
  GameLayoutPresets,
  createFlexRow,
  createFlexColumn,
  createCentered,
  createGrid,
  createStack,
  createAbsolute,
  createSpacing,
  createMargin,
  createPadding,
  createSized,
  percent,
  mergeLayouts,
  createResponsiveLayout,
  scaleLayout,
} from './LayoutStyles.js';

// Re-export layout manager
export {
  LayoutManager,
  getLayoutManager,
  setLayoutManager,
} from './LayoutManager.js';

// Re-export LayoutManager events type
export type { LayoutManagerEvents } from './LayoutManager.js';
