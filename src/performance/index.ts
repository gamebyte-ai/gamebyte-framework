/**
 * Performance Module - GameByte Framework
 *
 * Performance monitoring, optimization, and debugging tools.
 *
 * @module performance
 * @example
 * ```typescript
 * import { PerformanceMonitor, DeviceDetector } from '@gamebyte/framework/performance';
 * ```
 */

export { PerformanceMonitor } from './PerformanceMonitor.js';
export { DeviceDetector } from './DeviceDetector.js';
export { GameLoopOptimizer } from './GameLoopOptimizer.js';
export { FrameRateManager } from './FrameRateManager.js';
export { MemoryOptimizer } from './MemoryOptimizer.js';
export { RenderingOptimizer } from './RenderingOptimizer.js';
export { MobileOptimizer } from './MobileOptimizer.js';
export { PerformanceDebugOverlay, PerformanceProfiler } from './PerformanceDebugOverlay.js';
export { PerformanceAdvisor } from './PerformanceAdvisor.js';
export { QualityTierManager } from './QualityTierManager.js';
export type { QualityTier, AdaptiveConfig } from '../contracts/Performance.js';
