/**
 * Contracts Module - GameByte Framework
 *
 * TypeScript interfaces and types for the framework.
 *
 * @module contracts
 */

// Service Provider
export type { ServiceProvider } from './ServiceProvider.js';
export { AbstractServiceProvider } from './ServiceProvider.js';

// Container
export type { Container, Factory, Binding } from './Container.js';

// Renderer
export type { Renderer, RendererOptions, RendererStats } from './Renderer.js';
export { RenderingMode } from './Renderer.js';

// Scene
export type { Scene, SceneManager, SceneTransition } from './Scene.js';

// Audio
export type {
  AudioManager,
  AudioSource,
  AudioBus,
  MusicSystem,
  SFXSystem,
  SpatialAudioSystem,
  MobileAudioManager,
  AudioAnalyticsSystem,
  AudioEffectsProcessor,
  ProceduralAudioGenerator,
  AudioZone,
  AudioBusConfig,
  MusicConfig,
  SpatialAudioConfig,
  AudioEffectsConfig,
  MobileAudioConfig,
  AudioZoneConfig,
  AudioAnalytics,
  AudioPerformanceMetrics,
  AudioEvents,
  AudioPosition
} from './Audio.js';
export {
  AudioPerformanceTier,
  AudioQuality,
  AudioBusType,
  DistanceModel,
  AudioEnvironment,
  AudioInterruption,
  AudioFadeType
} from './Audio.js';

// UI
export type {
  UIComponent,
  UIManager,
  UIScreen,
  UITheme,
  UIAnimationSystem,
  UITimeline,
  UIInputSystem,
  LayoutManager,
  Point,
  Size,
  Rect,
  Spacing,
  Color,
  UIInteractionEvent,
  AnimationConfig,
  SpringConfig,
  EasingFunction,
  LayoutConstraint,
  ConstraintType,
  SafeArea,
  ScreenOrientation,
  DeviceInfo
} from './UI.js';

// Input
export type {
  InputManager,
  InputHandler,
  TouchInputHandler,
  VirtualControlsManager,
  InputMappingManager,
  InputPerformanceManager,
  PlatformerInputHandler,
  CameraInputHandler,
  UINavigationHandler,
  PlayerMovementHandler,
  InputDevice,
  InputEventType,
  InputContext,
  GameAction,
  VirtualControlType,
  GestureType,
  InputDeviceCapabilities,
  RawInputEvent,
  ProcessedInputEvent,
  GestureEvent,
  VirtualControlConfig,
  InputMapping,
  InputProfile,
  InputSettings,
  InputPerformanceMetrics
} from './Input.js';

// Physics
export type {
  PhysicsManager,
  PhysicsEngine,
  PhysicsWorld,
  PhysicsBody,
  PhysicsConstraint,
  PhysicsWorldConfig,
  PhysicsBodyConfig,
  PhysicsConstraintConfig,
  PhysicsShapeConfig,
  PhysicsMaterial,
  CollisionEvent,
  RaycastOptions,
  RaycastResult,
  PhysicsPerformanceMetrics,
  PlatformerPhysicsHelper,
  TopDownPhysicsHelper,
  TriggerZone,
  PhysicsParticleSystem,
  MobilePhysicsOptimizer,
  PhysicsDimension,
  PhysicsEngineType,
  PhysicsBodyType,
  PhysicsShapeType,
  PhysicsConstraintType,
  Vector3,
  Quaternion
} from './Physics.js';

// Performance
export type {
  PerformanceManager,
  PerformanceConfig,
  PerformanceMetrics,
  PerformanceWarning,
  DeviceCapabilities,
  QualitySettings,
  ObjectPool,
  ObjectPoolConfig,
  FrameRateManager,
  MemoryOptimizer,
  MemoryInfo,
  MemoryLeak,
  RenderingOptimizer,
  BatchRenderingConfig,
  LODLevel,
  RenderStats,
  MobileOptimizer,
  PerformanceDebugOverlay,
  PerformanceProfiler,
  ProfilingResult,
  GameLoopConfig
} from './Performance.js';
export {
  DevicePerformanceTier,
  DeviceThermalState,
  BatteryOptimizationMode,
  QualityLevel
} from './Performance.js';

// Asset Manager
export type {
  AssetManager,
  AssetConfig,
  LoadedAsset,
  AssetLoader,
  AssetCache,
  AssetBundle,
  DeviceCapabilities as AssetDeviceCapabilities
} from './AssetManager.js';
export {
  AssetType,
  AssetPriority,
  DevicePerformanceTier as AssetDevicePerformanceTier,
  CacheEvictionStrategy
} from './AssetManager.js';

// Graphics
export type {
  IDisplayObject,
  IContainer,
  IGraphics,
  IText,
  ITextStyle,
  ISprite,
  ITexture,
  IGraphicsFactory,
  IGraphicsEngine,
  IFillGradient,
  ILinearGradientConfig,
  IRadialGradientConfig,
  IColorStop,
  IStrokeStyle,
  IDropShadowStyle
} from './Graphics.js';
