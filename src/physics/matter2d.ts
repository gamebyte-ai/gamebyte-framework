/**
 * GameByte Framework - 2D Physics Bundle
 * 
 * Bu bundle sadece 2D physics için gerekli dependency'leri içerir.
 * Kullanım: 2D physics gerektiren oyunlar için bu bundle'ı import edin.
 */

// 2D physics bileşenleri
export { Matter2DEngine as PhysicsEngine2D } from '../physics/engines/Matter2DEngine';
export { Matter2DWorld as PhysicsWorld2D } from '../physics/worlds/Matter2DWorld';
export { Matter2DBody as PhysicsBody2D } from '../physics/bodies/Matter2DBody';
export { Matter2DConstraint as PhysicsConstraint2D } from '../physics/constraints/Matter2DConstraint';

// 2D game physics helpers
export { GameBytePlatformerHelper as PlatformerHelper } from '../physics/helpers/PlatformerHelper';
export { GameByteTopDownHelper as TopDownHelper } from '../physics/helpers/TopDownHelper';
export { GameByteTriggerZone as TriggerZone } from '../physics/helpers/TriggerZone';

// 2D physics optimization
export { GameByteMobileOptimizer as PhysicsOptimizer2D } from '../physics/optimization/MobileOptimizer';

// Physics service provider
export { PhysicsServiceProvider } from '../services/PhysicsServiceProvider';

// Physics facade
export { Physics } from '../facades/Physics';

// Re-export physics types for convenience
export type {
  PhysicsManager,
  PhysicsEngine,
  PhysicsWorld,
  PhysicsBody,
  PhysicsConstraint,
  PhysicsWorldConfig,
  PhysicsBodyConfig,
  PhysicsConstraintConfig,
  PlatformerPhysicsHelper,
  TopDownPhysicsHelper,
  MobilePhysicsOptimizer
} from '../contracts/Physics';
export type {
  PhysicsDimension,
  PhysicsEngineType,
  PhysicsBodyType
} from '../contracts/Physics';

// Utility function for 2D physics game creation
import { GameByte } from '../core/GameByte';
import { PhysicsServiceProvider } from '../services/PhysicsServiceProvider';
import { PerformanceServiceProvider } from '../services/PerformanceServiceProvider';

/**
 * Add 2D physics support to existing GameByte instance
 */
export function add2DPhysics(app: GameByte): void {
  if (!app.getContainer().bound('physics')) {
    app.register(new PhysicsServiceProvider());
  }
  
  if (!app.getContainer().bound('performance')) {
    app.register(new PerformanceServiceProvider());
  }
}

/**
 * Create 2D physics world configuration
 */
export function create2DPhysicsConfig(options: any = {}) {
  return {
    dimension: '2D',
    engine: 'matter',
    gravity: { x: 0, y: 0.8 },
    enableSleeping: true,
    iterations: 6,
    ...options
  };
}

export default {
  add2DPhysics,
  create2DPhysicsConfig
};