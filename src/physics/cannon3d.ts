/**
 * GameByte Framework - 3D Physics Bundle
 * 
 * Bu bundle sadece 3D physics için gerekli dependency'leri içerir.
 * Kullanım: 3D physics gerektiren oyunlar için bu bundle'ı import edin.
 */

// 3D physics bileşenleri
export { Cannon3DEngine as PhysicsEngine3D } from '../physics/engines/Cannon3DEngine';
export { Cannon3DWorld as PhysicsWorld3D } from '../physics/worlds/Cannon3DWorld';
export { Cannon3DBody as PhysicsBody3D } from '../physics/bodies/Cannon3DBody';
export { Cannon3DConstraint as PhysicsConstraint3D } from '../physics/constraints/Cannon3DConstraint';

// 3D physics helpers
export { GameByteParticleSystem as ParticleSystem } from '../physics/helpers/ParticleSystem';
export { GameByteTriggerZone as TriggerZone } from '../physics/helpers/TriggerZone';

// 3D physics optimization
export { GameByteMobileOptimizer as PhysicsOptimizer3D } from '../physics/optimization/MobileOptimizer';

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
  PhysicsParticleSystem,
  MobilePhysicsOptimizer,
  Vector3,
  Quaternion
} from '../contracts/Physics';
export type {
  PhysicsDimension,
  PhysicsEngineType,
  PhysicsBodyType
} from '../contracts/Physics';

// Utility function for 3D physics game creation
import { GameByte } from '../core/GameByte';
import { PhysicsServiceProvider } from '../services/PhysicsServiceProvider';
import { PerformanceServiceProvider } from '../services/PerformanceServiceProvider';

/**
 * Add 3D physics support to existing GameByte instance
 */
export function add3DPhysics(app: GameByte): void {
  if (!app.getContainer().bound('physics')) {
    app.register(new PhysicsServiceProvider());
  }
  
  if (!app.getContainer().bound('performance')) {
    app.register(new PerformanceServiceProvider());
  }
}

/**
 * Create 3D physics world configuration
 */
export function create3DPhysicsConfig(options: any = {}) {
  return {
    dimension: '3D',
    engine: 'cannon',
    gravity: { x: 0, y: -9.82, z: 0 },
    broadphase: 'naive',
    solver: 'gs',
    ...options
  };
}

export default {
  add3DPhysics,
  create3DPhysicsConfig
};