/**
 * Juice module — high-level game feel effects combining tweens, particles,
 * and screen shake into single fire-and-forget calls.
 *
 * No side effects on import. All methods are static and self-contained.
 *
 * @example
 * ```typescript
 * import { Juice } from '@gamebyte/framework/juice';
 *
 * Juice.impact(target, { particleParent: scene });
 * Juice.collect(scene, x, y, { text: '+10', style: 'coin' });
 * Juice.damage(target, scene, 25);
 * Juice.celebrate(scene, cx, cy, { text: 'WIN!', score: 1000 });
 * ```
 */

export { Juice } from './Juice.js';
export type { JuiceConfig } from './Juice.js';
