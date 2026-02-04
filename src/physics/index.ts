/**
 * Physics Module - GameByte Framework
 *
 * 2D (Matter.js) and 3D (Cannon.js) physics integration.
 *
 * @module physics
 * @example
 * ```typescript
 * import { PhysicsManager, Matter2DEngine } from '@gamebyte/framework/physics';
 * ```
 */

// Core Physics
export { PhysicsManager } from './PhysicsManager.js';

// 2D Physics (Matter.js)
export { Matter2DEngine } from './engines/Matter2DEngine.js';
export { Matter2DWorld } from './worlds/Matter2DWorld.js';
export { Matter2DBody } from './bodies/Matter2DBody.js';
export { Matter2DConstraint } from './constraints/Matter2DConstraint.js';

// 3D Physics (Cannon-ES)
export { Cannon3DEngine } from './engines/Cannon3DEngine.js';
export { Cannon3DWorld } from './worlds/Cannon3DWorld.js';
export { Cannon3DBody } from './bodies/Cannon3DBody.js';
export { Cannon3DConstraint } from './constraints/Cannon3DConstraint.js';

// Game Helpers
export { GameBytePlatformerHelper } from './helpers/PlatformerHelper.js';
export { GameByteTopDownHelper } from './helpers/TopDownHelper.js';
export { GameByteTriggerZone } from './helpers/TriggerZone.js';
export { GameByteParticleSystem } from './helpers/ParticleSystem.js';

// Optimization
export { GameByteMobileOptimizer } from './optimization/MobileOptimizer.js';
