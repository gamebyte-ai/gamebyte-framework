/**
 * GameByte Framework - Main Entry Point
 * 
 * A comprehensive JavaScript game engine framework that unifies 2D and 3D 
 * game development with Laravel-inspired architecture.
 */

// Core Framework
export { GameByte } from './core/GameByte';
export type { QuickGameConfig } from './core/GameByte';
export { ServiceContainer } from './core/ServiceContainer';
export { DefaultSceneManager } from './core/DefaultSceneManager';

// Base Scene Implementations
export { BaseScene, BaseScene3D } from './scenes/BaseScene';

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
export { ThreeRenderer } from './rendering/ThreeRenderer';
export type { ThreeRendererConfig } from './rendering/ThreeRenderer';
export { HybridRenderer } from './rendering/HybridRenderer';
export type { HybridRendererConfig } from './rendering/HybridRenderer';
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
export { Merge } from './facades/Merge';

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

// Merge Game Components
export { MergeGrid, MergeCell, MergeItem } from './ui/components/merge';
export type {
  MergeGridConfig,
  MergeGridEvents,
  MergeCellConfig,
  MergeCellEvents,
  MergeItemConfig,
  MergeItemEvents
} from './ui/components/merge';

// Merge Game System (High-level API)
export { MergeManager } from './merge/MergeManager';
export type {
  MergeGameConfig,
  MergeGameState,
  MergeManagerEvents
} from './merge/MergeManager';
export { MergeServiceProvider } from './services/MergeServiceProvider';
export { MergeGameScene } from './scenes/MergeGameScene';
export type { MergeGameSceneConfig } from './scenes/MergeGameScene';

// Layout & UI Adapters (@pixi/layout, @pixi/ui)
// NOTE: These adapters are temporarily disabled pending refactoring
// export { LayoutAdapter } from './adapters/LayoutAdapter';
// export type {
//   FlexDirection,
//   JustifyContent,
//   AlignItems,
//   AlignSelf,
//   FlexWrap,
//   LayoutSize,
//   Padding,
//   FlexContainerConfig,
//   FlexItemConfig,
//   ResponsiveConfig as LayoutResponsiveConfig
// } from './adapters/LayoutAdapter';

// export { UIAdapter } from './adapters/UIAdapter';
// export type {
//   ButtonConfig,
//   ProgressBarConfig,
//   SliderConfig
// } from './adapters/UIAdapter';

// export { FlexLayoutHelper } from './ui/layouts/FlexLayoutHelper';
// export type {
//   ResponsiveNavBarConfig,
//   GridLayoutConfig
// } from './ui/layouts/FlexLayoutHelper';

// UI Menu Components (Plugins)
export {
  ArcheroMenu,
  ARCHERO_COLORS
} from './ui/menus/ArcheroMenu';
export type {
  ArcheroMenuOptions,
  ArcheroMenuStyleConfig,
  ArcheroMenuCallbacks,
  MenuSection as ArcheroMenuSection,
  ButtonData as ArcheroButtonData,
  GradientConfig as ArcheroGradientConfig,
  ShineGradientConfig as ArcheroShineGradientConfig,
  SectionStyleOverride as ArcheroSectionStyleOverride
} from './ui/menus/ArcheroMenu';

// UI Screen Components
export { BaseUIScreen } from './ui/screens/BaseUIScreen';
export { SplashScreen } from './ui/screens/SplashScreen';
// LoadingScreen temporarily disabled - file doesn't exist yet
// export { LoadingScreen } from './ui/screens/LoadingScreen';
// MainMenuScreen temporarily disabled - needs refactoring to work with UIComponent
// export { MainMenuScreen } from './ui/screens/MainMenuScreen';

// SimpleScreen Base Class
export { SimpleScreen } from './ui/screens/SimpleScreen';

// Boilerplate Screens
export { HubScreen } from './ui/screens/HubScreen';
export type { HubScreenConfig, HubTabContent } from './ui/screens/HubScreen';

export { GameHUDScreen } from './ui/screens/GameHUDScreen';
export type { GameHUDScreenConfig, GameHUDConfig } from './ui/screens/GameHUDScreen';

export { ResultScreen } from './ui/screens/ResultScreen';
export type { ResultScreenConfig, ResultType, RewardItem, ResultAction } from './ui/screens/ResultScreen';

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

// Game Style UI Theme
export {
  GameStyleUITheme,
  GameStyleColors,
  createGameButtonGradient,
  createSkyGradient,
  numberToHex,
  lightenColor,
  darkenColor
} from './ui/themes/GameStyleUITheme';

// Game Style UI Components
export { GameStyleButton, GameButtons } from './ui/components/GameStyleButton';
export type { GameStyleButtonConfig, GameButtonColorScheme, GameButtonStyle } from './ui/components/GameStyleButton';

export { HexagonLevelButton } from './ui/components/HexagonLevelButton';
export type { HexagonLevelButtonConfig, HexagonColorScheme, LevelState } from './ui/components/HexagonLevelButton';

export { GameTopBar } from './ui/components/GameTopBar';
export type { GameTopBarConfig, ResourceItemConfig, ResourceType } from './ui/components/GameTopBar';

export { LevelPath } from './ui/components/LevelPath';
export type { LevelPathConfig, LevelData } from './ui/components/LevelPath';

export { GameBottomNav } from './ui/components/GameBottomNav';
export type { GameBottomNavConfig, NavItemConfig, NavItemType } from './ui/components/GameBottomNav';

export { GameStylePanel } from './ui/components/GameStylePanel';
export type { GameStylePanelConfig, GamePanelColorScheme } from './ui/components/GameStylePanel';

export { GameToggle, GameToggleColors } from './ui/components/GameToggle';
export type { GameToggleConfig, GameToggleColorScheme } from './ui/components/GameToggle';

export { GameCheckBox, GameCheckBoxColors } from './ui/components/GameCheckBox';
export type { GameCheckBoxConfig, GameCheckBoxColorScheme } from './ui/components/GameCheckBox';

export { GameSlider, GameSliderColors } from './ui/components/GameSlider';
export type { GameSliderConfig, GameSliderColorScheme } from './ui/components/GameSlider';

export { GameTooltip, GameTooltipColors } from './ui/components/GameTooltip';
export type { GameTooltipConfig, GameTooltipColorScheme, TooltipTailPosition } from './ui/components/GameTooltip';

// Font Loader (auto-loads framework font)
export { loadFrameworkFont, getFrameworkFontFamily, isFontReady } from './ui/utils/FontLoader';

// Screen & Panel Management (Boilerplate)
export { ScreenManager } from './ui/app/ScreenManager';
export type { ScreenManagerConfig, TransitionType, TransitionDirection } from './ui/app/ScreenManager';

export { PanelManager } from './ui/app/PanelManager';
export type { PanelManagerConfig } from './ui/app/PanelManager';

// Panel Components
export { GamePanel, DEFAULT_PANEL_THEME } from './ui/panels/GamePanel';
export type { GamePanelConfig, GamePanelTheme } from './ui/panels/GamePanel';

export { GameModalPanel } from './ui/panels/GameModalPanel';
export type { GameModalPanelConfig } from './ui/panels/GameModalPanel';

export { GameBottomSheet } from './ui/panels/GameBottomSheet';
export type { GameBottomSheetConfig, BottomSheetHeight } from './ui/panels/GameBottomSheet';

// UI Effects System
export { ConfettiSystem } from './ui/effects/ConfettiSystem';
export type { ConfettiConfig, ConfettiShape } from './ui/effects/ConfettiSystem';
export { ShineEffect } from './ui/effects/ShineEffect';
export type { ShimmerConfig, SparkleConfig, ShimmerInstance } from './ui/effects/ShineEffect';
export { CelebrationManager, CelebrationPresets } from './ui/effects/CelebrationManager';
export type { CelebrationConfig, ICelebrationAudioManager } from './ui/effects/CelebrationManager';
export { StarBurstEffect } from './ui/effects/StarBurstEffect';
export type { StarBurstConfig, StarBurstInstance } from './ui/effects/StarBurstEffect';
export { SunburstEffect } from './ui/effects/SunburstEffect';
export type { SunburstConfig } from './ui/effects/SunburstEffect';

// UI Input System
export { GameByteUIInputSystem } from './ui/input/UIInputSystem';

// UI Layout System
export { ResponsiveLayoutManager } from './ui/layouts/ResponsiveLayoutManager';
// ScreenLayoutManager temporarily disabled - file doesn't exist yet
// export { ScreenLayoutManager } from './ui/layouts/ScreenLayoutManager';
// export type { ScreenLayout, LayoutRegion, ScreenLayoutConfig } from './ui/layouts/ScreenLayoutManager';

// Input System Components
export { GameByteInputManager } from './input/InputManager';
export { GameByteTouchInputHandler } from './input/TouchInputHandler';
export { GameByteVirtualControlsManager } from './input/VirtualControlsManager';
export { GameByteInputMappingManager } from './input/InputMappingManager';
export { GameByteInputPerformanceManager } from './input/InputPerformanceManager';

// Virtual Joystick Component
export { VirtualJoystick } from './ui/components/VirtualJoystick';
export type {
  VirtualJoystickConfig,
  JoystickMoveData,
  JoystickDirection,
  JoystickStyle,
  ActivationZone
} from './ui/components/VirtualJoystick';

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

// Safe Area Layout System
export {
  SafeAreaLayout,
  createSafeAreaLayout
} from './utils/SafeAreaLayout';
export type { SafeAreaLayoutConfig, SafeAreaBounds } from './utils/SafeAreaLayout';

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
export { GraphicsEngine, graphics, drawToTexture } from './graphics/GraphicsEngine';
export type { DrawToTextureOptions } from './graphics/GraphicsEngine';
export { PixiGraphicsFactory } from './graphics/PixiGraphicsFactory';
export { ThreeGraphicsFactory } from './graphics/ThreeGraphicsFactory';

// Gradient System (Native Pixi.js v8 FillGradient)
export {
  Gradients,
  createLinearGradient,
  createRadialGradient,
  linearGradient,
  radialGradient
} from './graphics/GradientFactory';
export type {
  GradientFill,
  GradientColorStop,
  LinearGradientOptions,
  RadialGradientOptions
} from './graphics/GradientFactory';

// Layout System (@pixi/layout - Yoga-powered flexbox)
export {
  // Layout Manager
  LayoutManager as PixiLayoutManager,
  getLayoutManager,
  setLayoutManager,
  // Layout Presets
  LayoutPresets,
  GameLayoutPresets,
  // Layout Helpers
  createFlexRow,
  createFlexColumn,
  createCentered,
  createGrid,
  createStack,
  createAbsolute,
  createSpacing,
  createMargin,
  createPadding,
  createSized,
  percent,
  mergeLayouts,
  createResponsiveLayout,
  scaleLayout,
} from './layout/index';
export type {
  // Layout Types
  LayoutConfig,
  LayoutSystemConfig,
  ResponsiveLayoutConfig,
  ResponsiveBreakpoint,
  LayoutPreset,
  LayoutManagerEvents,
  // Flexbox Types
  FlexDirection,
  FlexWrap,
  JustifyContent,
  AlignItems,
  AlignContent,
  AlignSelf,
  PositionType,
  Overflow,
  ObjectFit,
  SizeValue,
  StackDirection,
  SpacingConfig,
} from './layout/index';

// UI2 System (Modern Declarative UI)
export { UI as UI2, UINode, createState, computed, reactive, resolveValue, isReactive } from './ui2/index';
export { setTheme as setUI2Theme, setThemeMode as setUI2ThemeMode, getTheme as getUI2Theme } from './ui2/index';
export { createNode as createUI2Node, registerComponent as registerUI2Component } from './ui2/index';
export type {
  // UI2 Types
  UINodeConfig as UI2NodeConfig,
  UINodeConfigBase as UI2NodeConfigBase,
  ScreenConfig as UI2ScreenConfig,
  PanelConfig as UI2PanelConfig,
  ThemeConfig as UI2ThemeConfig,
  ReactiveState as UI2ReactiveState,
  UIRef as UI2Ref
} from './ui2/index';

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
import { Merge as MergeFacadeExport } from './facades/Merge';

// Import QuickGameConfig for the createGame function
import type { QuickGameConfig } from './core/GameByte';
import { Gradients } from './graphics/GradientFactory';

/**
 * Create and configure a GameByte instance.
 *
 * @example
 * // Traditional usage (requires manual initialization):
 * const game = createGame();
 * await game.initialize(canvas, '2d');
 * game.start();
 *
 * @example
 * // Quick config-based usage (auto-initializes):
 * const game = await createGame({
 *   container: '#game',
 *   width: 800,
 *   height: 600,
 *   mode: '2d',
 *   backgroundColor: 0x1a1a2e,
 *   autoStart: true
 * });
 * game.stage.addChild(mySprite);
 */
export function createGame(): GameByte;
export function createGame(config: QuickGameConfig): Promise<GameByte>;
export function createGame(config?: QuickGameConfig): GameByte | Promise<GameByte> {
  // If config provided, use quick setup
  if (config) {
    return GameByte.quick(config);
  }

  // Traditional setup - just create and register providers
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

/**
 * Create a GameByte instance pre-configured for merge puzzle games.
 *
 * @example
 * ```typescript
 * const game = createMergeGame();
 * await game.initialize(canvas, '2d');
 *
 * // Use the Merge facade
 * Merge.createGame({ rows: 5, cols: 5 });
 * scene.addChild(Merge.getContainer());
 * Merge.start();
 *
 * game.start();
 * ```
 */
export function createMergeGame(): GameByte {
  const app = createGame();

  // Register merge service provider
  const { MergeServiceProvider: MSP } = require('./services/MergeServiceProvider');
  app.register(new MSP());

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
  Gradients,

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
  Audio: null as any,      // Will be set after app initialization
  Merge: null as any       // Will be set after app initialization
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
  GameByteFramework.Merge = MergeFacadeExport;
}