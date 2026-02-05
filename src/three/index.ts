/**
 * GameByte Framework - Three.js 3D Game Toolkit
 *
 * High-level components for building 3D strategy and puzzle games.
 * Works with pure Three.js objects - these are helpers, not replacements.
 *
 * @module three
 */

// Cameras
export { IsometricCamera, type IsometricCameraConfig } from './cameras/IsometricCamera.js';
export { StrategyCamera, type StrategyCameraConfig } from './cameras/StrategyCamera.js';
export { CameraController, type CameraControllerConfig } from './cameras/CameraController.js';

// Grids
export {
  type GridCoord,
  type HexCoord,
  type IGridSystem,
  type NeighborMode
} from './grids/GridSystem.js';
export { SquareGrid, type SquareGridConfig } from './grids/SquareGrid.js';
export { HexGrid, type HexGridConfig } from './grids/HexGrid.js';
export { GridRenderer, type GridRendererConfig } from './grids/GridRenderer.js';

// Interaction
export { Object3DPicker, type Object3DPickerConfig, type PickResult } from './interaction/Object3DPicker.js';
export { DragController, type DragControllerConfig } from './interaction/DragController.js';
export { GestureHandler3D, type GestureHandler3DConfig } from './interaction/GestureHandler3D.js';

// UI
export { Billboard, type BillboardConfig } from './ui/Billboard.js';
export { HealthBar3D, type HealthBar3DConfig } from './ui/HealthBar3D.js';
export { SelectionIndicator, type SelectionIndicatorConfig } from './ui/SelectionIndicator.js';
export { FloatingText, type FloatingTextConfig, type FloatingTextSpawnOptions } from './ui/FloatingText.js';

// Helpers
export { ObjectPool3D, type ObjectPool3DConfig } from './helpers/ObjectPool3D.js';
export { Pathfinder, type PathfinderConfig, type FindPathOptions } from './helpers/Pathfinder.js';
export {
  StateMachine,
  StateMachineInstance,
  type StateMachineConfig,
  type StateDefinition
} from './helpers/StateMachine.js';

// Version Detection (Three.js specific)
export {
  ThreeVersionDetector,
  ThreeFrameworkCompatibility
} from './utils/ThreeVersionDetection.js';
export type { VersionInfo, FeatureSupport } from './utils/ThreeVersionDetection.js';

// Scene Management (3D)
export { BaseScene3D } from './scenes/BaseScene3D.js';

// Lights
export { DirectionalLight, type DirectionalLightConfig } from './lights/DirectionalLight.js';
export { PointLight, type PointLightConfig } from './lights/PointLight.js';
export { SpotLight, type SpotLightConfig } from './lights/SpotLight.js';
export { AmbientLight, type AmbientLightConfig } from './lights/AmbientLight.js';
export { HemisphereLight, type HemisphereLightConfig } from './lights/HemisphereLight.js';
export { LightHelper } from './lights/LightHelper.js';

// Loaders
export { ModelLoader, type ModelLoaderConfig, type LoadedModel, type LoadOptions } from './loaders/ModelLoader.js';
export { TextureLoader3D, type TextureLoader3DConfig, type TextureOptions } from './loaders/TextureLoader.js';

// Animation
export { AnimationController, type AnimationControllerConfig, type PlayOptions } from './animation/AnimationController.js';
