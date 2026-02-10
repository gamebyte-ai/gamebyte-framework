/**
 * Utils Module - GameByte Framework
 *
 * Utility classes for version detection, compatibility, responsive design, and safe areas.
 *
 * @module utils
 * @example
 * ```typescript
 * import { PixiVersionDetector, ResponsiveScaleCalculator } from '@gamebyte/framework/utils';
 * ```
 */

// Version Detection (Pixi.js only - no Three.js dependency)
export {
  PixiVersionDetector,
  BrowserFeatureDetector,
  FrameworkCompatibility,
  parseVersion
} from './PixiVersionDetection.js';
export type { VersionInfo, FeatureSupport } from './PixiVersionDetection.js';

// Compatibility Helpers (Pixi.js only)
export {
  PixiCompatibility,
  RenderingCompatibility
} from './PixiCompatibility.js';
export type { PixiRendererOptions } from './PixiCompatibility.js';

// Responsive Design
export {
  ResponsiveScaleCalculator,
  ResponsiveContainer,
  ResponsiveCanvas,
  createResponsiveCalculator
} from './ResponsiveHelper.js';
export type { ResponsiveConfig, ResponsiveSize } from './ResponsiveHelper.js';

// Safe Area
export {
  SafeAreaLayout,
  createSafeAreaLayout
} from './SafeAreaLayout.js';
export type { SafeAreaLayoutConfig, SafeAreaBounds } from './SafeAreaLayout.js';

// Logger
export { Logger } from './Logger.js';
export type { LogLevel, LoggerConfig } from './Logger.js';
