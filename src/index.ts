/**
 * GameByte Framework - Main Entry Point
 * 
 * A comprehensive JavaScript game engine framework that unifies 2D and 3D 
 * game development with Laravel-inspired architecture.
 */

// Core Framework
export { GameByte } from './core/GameByte';
export { ServiceContainer } from './core/ServiceContainer';
export { DefaultSceneManager } from './core/DefaultSceneManager';

// Base Scene Implementations
export { BaseScene } from './scenes/BaseScene';
// BaseScene3D: Not exported to avoid THREE.js dependency in UMD
// Use ESM/CJS imports for 3D scene development
// export { BaseScene3D } from './scenes/BaseScene';

// Third-party dependencies (bundled)
export { EventEmitter } from 'eventemitter3';

// Contracts & Interfaces
export type { ServiceProvider } from './contracts/ServiceProvider';
export { AbstractServiceProvider } from './contracts/ServiceProvider';
export type { Container, Factory, Binding } from './contracts/Container';
export type { 
  Renderer, 
  RendererOptions, 
  RendererStats 
} from './contracts/Renderer';
export { RenderingMode } from './contracts/Renderer';
export type { 
  Scene, 
  SceneManager, 
  SceneTransition 
} from './contracts/Scene';

// Audio System Contracts
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
} from './contracts/Audio';
export {
  AudioPerformanceTier,
  AudioQuality,
  AudioBusType,
  DistanceModel,
  AudioEnvironment,
  AudioInterruption,
  AudioFadeType
} from './contracts/Audio';

// UI System Contracts
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
} from './contracts/UI';

// Input System Contracts
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
} from './contracts/Input';

// Physics System Contracts
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
} from './contracts/Physics';

// Performance System Contracts
export type {
  PerformanceManager,
  PerformanceConfig,
  PerformanceMetrics,
  PerformanceWarning,
  DeviceCapabilities as PerformanceDeviceCapabilities,
  QualitySettings,
  ObjectPool,
  ObjectPoolConfig,
  FrameRateManager as PerformanceFrameRateManager,
  MemoryOptimizer as PerformanceMemoryOptimizer,
  MemoryInfo,
  MemoryLeak,
  RenderingOptimizer as PerformanceRenderingOptimizer,
  BatchRenderingConfig,
  LODLevel,
  RenderStats,
  MobileOptimizer as PerformanceMobileOptimizer,
  PerformanceDebugOverlay as PerformanceDebugOverlayType,
  PerformanceProfiler as PerformanceProfilerType,
  ProfilingResult,
  GameLoopConfig
} from './contracts/Performance';
export {
  DevicePerformanceTier,
  DeviceThermalState,
  BatteryOptimizationMode,
  QualityLevel
} from './contracts/Performance';

// Asset Management
export { AssetServiceProvider } from './services/AssetServiceProvider';
export { Assets } from './facades/Assets';
export { GameByteAssetManager } from './assets/GameByteAssetManager';
export type { 
  AssetManager,
  AssetConfig,
  LoadedAsset,
  AssetLoader,
  AssetCache,
  AssetBundle,
  DeviceCapabilities as AssetDeviceCapabilities
} from './contracts/AssetManager';
export { 
  AssetType,
  AssetPriority,
  DevicePerformanceTier as AssetDevicePerformanceTier,
  CacheEvictionStrategy 
} from './contracts/AssetManager';

// Rendering System
export { PixiRenderer } from './rendering/PixiRenderer';
export type { PixiRendererConfig } from './rendering/PixiRenderer';
// ThreeRenderer: Use dist/renderers/three3d.js for 3D rendering
// Not exported in main bundle to avoid THREE.js dependency in UMD
// export { ThreeRenderer } from './rendering/ThreeRenderer';
// export type { ThreeRendererConfig } from './rendering/ThreeRenderer';
// HybridRenderer: Combines Three.js (3D) + Pixi.js (2D) with stacked canvas
// Not exported in main bundle to avoid THREE.js dependency in UMD
// Use ESM/CJS imports for hybrid rendering: import { HybridRenderer } from '@gamebyte/framework/rendering/HybridRenderer'
// export { HybridRenderer } from './rendering/HybridRenderer';
// export type { HybridRendererConfig } from './rendering/HybridRenderer';
export { RendererFactory } from './rendering/RendererFactory';

// Audio System
export { AudioServiceProvider } from './services/AudioServiceProvider';
export { Audio as AudioFacade, Music, SFX, Spatial } from './facades/Audio';
export { GameByteAudioManager } from './audio/core/GameByteAudioManager';
export { GameByteAudioSource } from './audio/core/GameByteAudioSource';
export { GameByteAudioBus } from './audio/core/GameByteAudioBus';
export { GameByteAudioEffectsProcessor } from './audio/effects/GameByteAudioEffectsProcessor';
export { GameByteProceduralAudioGenerator } from './audio/procedural/GameByteProceduralAudioGenerator';
export { GameByteAudioAnalytics } from './audio/analytics/GameByteAudioAnalytics';

// Service Providers
export { RenderingServiceProvider } from './services/RenderingServiceProvider';
export { SceneServiceProvider } from './services/SceneServiceProvider';
export { PluginServiceProvider } from './services/PluginServiceProvider';
export { UIServiceProvider } from './services/UIServiceProvider';
export { InputServiceProvider } from './services/InputServiceProvider';
export { PhysicsServiceProvider } from './services/PhysicsServiceProvider';
export { PerformanceServiceProvider, PerformanceFacade } from './services/PerformanceServiceProvider';

// Plugin System
export { PluginManager } from './plugins/PluginManager';
export type { 
  PluginConfig, 
  PluginEntry 
} from './plugins/PluginManager';

// Facades
export { Facade } from './facades/Facade';
export { Renderer as RendererFacade } from './facades/Renderer';
export { Scenes } from './facades/Scenes';
export { Plugins } from './facades/Plugins';
export { UI, Animations, Themes } from './facades/UI';
export { Input } from './facades/Input';
export { Physics } from './facades/Physics';
export { Performance } from './facades/Performance';
export { Audio as AudioFacadeExport } from './facades/Audio';

// UI System Components
export { BaseUIComponent } from './ui/core/BaseUIComponent';
export { GameByteUIManager } from './ui/core/UIManager';
export { UIContainer } from './ui/components/UIContainer';
export { UIButton } from './ui/components/UIButton';
export { UIText } from './ui/components/UIText';
export { UIPanel } from './ui/components/UIPanel';
export { UIProgressBar } from './ui/components/UIProgressBar';
export { TopBar, TopBarItemType } from './ui/components/TopBar';
export type { TopBarConfig, TopBarItemConfig, TopBarTheme } from './ui/components/TopBar';

// UI Menu Components
export { ArcheroMenu, ARCHERO_COLORS } from './ui/menus/ArcheroMenu';
export type {
  MenuSection,
  ArcheroMenuOptions,
  ArcheroMenuStyleConfig,
  ArcheroMenuCallbacks,
  GradientConfig,
  ShineGradientConfig,
  SectionStyleOverride,
  ButtonData
} from './ui/menus/ArcheroMenu';

// UI Screen Components
export { BaseUIScreen } from './ui/screens/BaseUIScreen';
export { SplashScreen } from './ui/screens/SplashScreen';
// MainMenuScreen temporarily disabled - needs refactoring to work with UIComponent
// export { MainMenuScreen } from './ui/screens/MainMenuScreen';

// UI Animation System
export { GameByteUIAnimationSystem, GameByteUITimeline } from './ui/animations/UIAnimationSystem';

// UI Themes
export { 
  DefaultUITheme, 
  VibrantUITheme, 
  MinimalUITheme, 
  DarkGamingUITheme, 
  UIThemeManager 
} from './ui/themes/DefaultUITheme';

// UI Input System
export { GameByteUIInputSystem } from './ui/input/UIInputSystem';

// UI Layout System
export { ResponsiveLayoutManager } from './ui/layouts/ResponsiveLayoutManager';

// Input System Components
export { GameByteInputManager } from './input/InputManager';
export { GameByteTouchInputHandler } from './input/TouchInputHandler';
export { GameByteVirtualControlsManager } from './input/VirtualControlsManager';
export { GameByteInputMappingManager } from './input/InputMappingManager';
export { GameByteInputPerformanceManager } from './input/InputPerformanceManager';

// Game-Specific Input Handlers
export { GameBytePlatformerInputHandler } from './input/handlers/PlatformerInputHandler';
export { GameByteCameraInputHandler } from './input/handlers/CameraInputHandler';
export { GameByteUINavigationHandler } from './input/handlers/UINavigationHandler';
export { GameBytePlayerMovementHandler } from './input/handlers/PlayerMovementHandler';

// Physics System Components
export { PhysicsManager as PhysicsManagerClass } from './physics/PhysicsManager';
export { Matter2DEngine } from './physics/engines/Matter2DEngine';
export { Cannon3DEngine } from './physics/engines/Cannon3DEngine';
export { Matter2DWorld } from './physics/worlds/Matter2DWorld';
export { Cannon3DWorld } from './physics/worlds/Cannon3DWorld';
export { Matter2DBody } from './physics/bodies/Matter2DBody';
export { Cannon3DBody } from './physics/bodies/Cannon3DBody';
export { Matter2DConstraint } from './physics/constraints/Matter2DConstraint';
export { Cannon3DConstraint } from './physics/constraints/Cannon3DConstraint';

// Physics Game Helpers
export { GameBytePlatformerHelper } from './physics/helpers/PlatformerHelper';
export { GameByteTopDownHelper } from './physics/helpers/TopDownHelper';
export { GameByteTriggerZone } from './physics/helpers/TriggerZone';
export { GameByteParticleSystem } from './physics/helpers/ParticleSystem';

// Physics Optimization
export { GameByteMobileOptimizer } from './physics/optimization/MobileOptimizer';

// Performance System Components
export { PerformanceMonitor } from './performance/PerformanceMonitor';
export { DeviceDetector } from './performance/DeviceDetector';
export { GameLoopOptimizer } from './performance/GameLoopOptimizer';
export { FrameRateManager as FrameRateManagerClass } from './performance/FrameRateManager';
export { MemoryOptimizer as MemoryOptimizerClass } from './performance/MemoryOptimizer';
export { RenderingOptimizer as RenderingOptimizerClass } from './performance/RenderingOptimizer';
export { MobileOptimizer as MobileOptimizerClass } from './performance/MobileOptimizer';
export { PerformanceDebugOverlay as PerformanceDebugOverlayClass, PerformanceProfiler as PerformanceProfilerClass } from './performance/PerformanceDebugOverlay';

// Version Detection & Compatibility Utilities
export {
  PixiVersionDetector,
  ThreeVersionDetector,
  BrowserFeatureDetector,
  FrameworkCompatibility
} from './utils/VersionDetection';
export type { VersionInfo, FeatureSupport } from './utils/VersionDetection';

// Renderer Compatibility Helpers
export {
  PixiCompatibility,
  ThreeCompatibility,
  RenderingCompatibility
} from './utils/RendererCompatibility';
export type { PixiRendererOptions, ThreeRendererOptions } from './utils/RendererCompatibility';

// Responsive Helper Utilities
export {
  ResponsiveScaleCalculator,
  ResponsiveContainer,
  ResponsiveCanvas,
  createResponsiveCalculator
} from './utils/ResponsiveHelper';
export type { ResponsiveConfig, ResponsiveSize } from './utils/ResponsiveHelper';

// Graphics Abstraction Layer
export type {
  IDisplayObject,
  IContainer,
  IGraphics,
  IText,
  ITextStyle,
  ISprite,
  ITexture,
  IGraphicsFactory,
  IGraphicsEngine
} from './contracts/Graphics';
export { GraphicsEngine, graphics } from './graphics/GraphicsEngine';
export { PixiGraphicsFactory } from './graphics/PixiGraphicsFactory';
// ThreeGraphicsFactory: Not exported to avoid CSS2DRenderer dependency in UMD
// Use PixiGraphicsFactory for 2D UI, or access ThreeGraphicsFactory via ESM/CJS imports
// export { ThreeGraphicsFactory } from './graphics/ThreeGraphicsFactory';

// Types
export type {
  GameConfig,
  GameType,
  PerformanceTier,
  InputEvent,
  GameObject,
  Component,
  GameEvent
} from './types';

// Re-export for convenience
import { GameByte } from './core/GameByte';
import { RenderingServiceProvider } from './services/RenderingServiceProvider';
import { SceneServiceProvider } from './services/SceneServiceProvider';
import { PluginServiceProvider } from './services/PluginServiceProvider';
import { AssetServiceProvider } from './services/AssetServiceProvider';
import { UIServiceProvider } from './services/UIServiceProvider';
import { InputServiceProvider } from './services/InputServiceProvider';
import { PhysicsServiceProvider } from './services/PhysicsServiceProvider';
import { PerformanceServiceProvider } from './services/PerformanceServiceProvider';
import { AudioServiceProvider } from './services/AudioServiceProvider';
import { ServiceContainer } from './core/ServiceContainer';
import { RenderingMode } from './contracts/Renderer';
import { Assets } from './facades/Assets';
import { Facade } from './facades/Facade';
import { Renderer as RendererFacade } from './facades/Renderer';
import { Scenes } from './facades/Scenes';
import { Plugins } from './facades/Plugins';
import { UI, Animations, Themes } from './facades/UI';
import { Input } from './facades/Input';
import { Physics } from './facades/Physics';
import { Performance } from './facades/Performance';
import { Audio as AudioFacadeExport } from './facades/Audio';

// Utility function to create and configure a GameByte instance
export function createGame(): GameByte {
  const app = GameByte.create();
  
  // Register core service providers
  app.register(new RenderingServiceProvider());
  app.register(new SceneServiceProvider());
  app.register(new PluginServiceProvider());
  app.register(new AssetServiceProvider());
  app.register(new UIServiceProvider());
  app.register(new InputServiceProvider());
  app.register(new PhysicsServiceProvider());
  app.register(new PerformanceServiceProvider());
  app.register(new AudioServiceProvider());
  
  return app;
}

// Utility function to create a GameByte instance with UI system optimized for mobile games
export function createMobileGame(): GameByte {
  const app = createGame();
  
  // Additional mobile optimizations could be applied here
  // such as specific renderer configurations, performance settings, etc.
  
  return app;
}

// Default export for convenient importing
const GameByteFramework = {
  GameByte,
  createGame,
  createMobileGame,
  RenderingMode,
  ServiceContainer,
  Assets,
  
  // Facades for static access
  Renderer: null as any, // Will be set after app initialization
  Scenes: null as any,   // Will be set after app initialization
  Plugins: null as any,  // Will be set after app initialization
  UI: null as any,       // Will be set after app initialization
  Animations: null as any, // Will be set after app initialization
  Themes: null as any,   // Will be set after app initialization
  Input: null as any,    // Will be set after app initialization
  Physics: null as any,  // Will be set after app initialization
  Performance: null as any, // Will be set after app initialization
  Audio: null as any       // Will be set after app initialization
};

export default GameByteFramework;

/**
 * Initialize facades with a GameByte application instance.
 * This should be called after creating your GameByte app.
 */
export function initializeFacades(app: GameByte): void {
  // Import facades (already imported at the top of this file)
  Facade.setApplication(app);

  // Update default export facades
  GameByteFramework.Renderer = RendererFacade;
  GameByteFramework.Scenes = Scenes;
  GameByteFramework.Plugins = Plugins;
  GameByteFramework.UI = UI;
  GameByteFramework.Animations = Animations;
  GameByteFramework.Themes = Themes;
  GameByteFramework.Input = Input;
  GameByteFramework.Physics = Physics;
  GameByteFramework.Performance = Performance;
  GameByteFramework.Audio = AudioFacadeExport;
}