/**
 * UI Effects Module
 *
 * Provides celebration and visual effects for mobile games:
 * - ConfettiSystem: Particle-based confetti effects
 * - ShineEffect: Shimmer and sparkle effects for valuable items
 * - StarBurstEffect: Continuous sparkle particles around valuable items
 * - SunburstEffect: Rotating ray/sunburst background effect
 * - CelebrationManager: Orchestrates effects for common celebration scenarios
 */

export { ConfettiSystem } from './ConfettiSystem.js';
export type { ConfettiConfig, ConfettiShape } from './ConfettiSystem.js';

export { ShineEffect } from './ShineEffect.js';
export type { ShimmerConfig, SparkleConfig, ShimmerInstance } from './ShineEffect.js';

export { StarBurstEffect } from './StarBurstEffect.js';
export type { StarBurstConfig, StarBurstInstance } from './StarBurstEffect.js';

export { CelebrationManager, CelebrationPresets } from './CelebrationManager.js';
export type { CelebrationConfig, ICelebrationAudioManager } from './CelebrationManager.js';

export { SunburstEffect } from './SunburstEffect.js';
export type { SunburstConfig } from './SunburstEffect.js';
