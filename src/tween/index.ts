/**
 * Tween module — lightweight built-in animation engine.
 *
 * No external dependencies beyond eventemitter3.
 * No side effects on import.
 *
 * @example
 * ```typescript
 * import { Tween, TweenManager, Ease } from '@gamebyte/framework/tween';
 *
 * // In game loop:
 * TweenManager.update(deltaMs);
 *
 * // Animate a sprite:
 * Tween.to(sprite, { x: 400, alpha: 1 }, { duration: 500, ease: Ease.cubicOut });
 * ```
 */

export { Tween } from './Tween.js';
export type { TweenConfig, TweenEvents } from './Tween.js';

export { TweenManager } from './TweenManager.js';

export { Ease } from './Ease.js';
export type { EasingFunction } from './Ease.js';
