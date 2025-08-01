import { EventEmitter } from 'eventemitter3';

/**
 * Device performance tier categories for mobile optimization
 */
export enum DevicePerformanceTier {
  LOW = 'low',
  MID = 'mid', 
  HIGH = 'high',
  UNKNOWN = 'unknown'
}

/**
 * Device thermal state for throttling management
 */
export enum DeviceThermalState {
  NORMAL = 'normal',
  FAIR = 'fair',
  SERIOUS = 'serious',
  CRITICAL = 'critical'
}

/**
 * Battery optimization modes
 */
export enum BatteryOptimizationMode {
  PERFORMANCE = 'performance',
  BALANCED = 'balanced',
  POWER_SAVER = 'power_saver'
}

/**
 * Quality levels for adaptive scaling
 */
export enum QualityLevel {
  ULTRA_LOW = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  ULTRA_HIGH = 4
}

/**
 * Performance monitoring metrics
 */
export interface PerformanceMetrics {
  // Frame rate metrics
  fps: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  frameTime: number;
  averageFrameTime: number;
  frameTimeVariance: number;

  // Memory metrics
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
    jsHeapSizeUsed: number;
    jsHeapSizeTotal: number;
    jsHeapSizeLimit: number;
  };

  // Rendering metrics
  drawCalls: number;
  triangles: number;
  textureMemory: number;
  geometryMemory: number;
  batchCount: number;

  // CPU/GPU metrics
  cpuUsage: number;
  gpuUsage: number;
  thermalState: DeviceThermalState;

  // Performance warnings
  warnings: PerformanceWarning[];
}

/**
 * Performance warning types
 */
export interface PerformanceWarning {
  type: 'fps' | 'memory' | 'thermal' | 'battery' | 'drawcalls';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  value?: number;
  threshold?: number;
}

/**
 * Device capabilities for optimization
 */
export interface DeviceCapabilities {
  // Hardware info
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  performanceTier: DevicePerformanceTier;
  cores: number;
  memory: number;
  
  // Graphics capabilities
  webglVersion: number;
  maxTextureSize: number;
  maxViewportDims: [number, number];
  supportedExtensions: string[];
  
  // Display info
  pixelRatio: number;
  screenSize: { width: number; height: number };
  refreshRate: number;
  
  // Battery and thermal
  supportsBatteryAPI: boolean;
  supportsThermalAPI: boolean;
  
  // Performance features
  supportsWebWorkers: boolean;
  supportsOffscreenCanvas: boolean;
  supportsImageBitmap: boolean;
  supportsWebAssembly: boolean;
}

/**
 * Game loop configuration
 */
export interface GameLoopConfig {
  targetFps: number;
  maxDeltaTime: number;
  fixedTimeStep: boolean;
  adaptiveFrameRate: boolean;
  vsyncEnabled: boolean;
  frameSkipping: boolean;
  maxFrameSkip: number;
}

/**
 * Quality settings for adaptive scaling
 */
export interface QualitySettings {
  // Rendering quality
  renderScale: number;
  textureQuality: QualityLevel;
  shadowQuality: QualityLevel;
  effectsQuality: QualityLevel;
  antialiasing: boolean;
  
  // Physics quality
  physicsTimestep: number;
  physicsIterations: number;
  maxPhysicsObjects: number;
  
  // Audio quality
  audioQuality: QualityLevel;
  maxAudioSources: number;
  
  // UI quality
  uiAnimationQuality: QualityLevel;
  particleCount: number;
}

/**
 * Object pool configuration
 */
export interface ObjectPoolConfig {
  initialSize: number;
  maxSize: number;
  growthFactor: number;
  shrinkThreshold: number;
  createFunction: () => any;
  resetFunction?: (obj: any) => void;
  destroyFunction?: (obj: any) => void;
}

/**
 * Batch rendering configuration
 */
export interface BatchRenderingConfig {
  maxBatchSize: number;
  sortingEnabled: boolean;
  textureAtlasing: boolean;
  instancedRendering: boolean;
  frustumCulling: boolean;
  occlusionCulling: boolean;
  distanceCulling: boolean;
  maxDistance: number;
}

/**
 * Performance optimization manager interface
 */
export interface PerformanceManager extends EventEmitter {
  /**
   * Initialize the performance manager
   */
  initialize(config?: PerformanceConfig): Promise<void>;

  /**
   * Start performance monitoring and optimization
   */
  start(): void;

  /**
   * Stop performance monitoring
   */
  stop(): void;

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics;

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities;

  /**
   * Get current quality settings
   */
  getQualitySettings(): QualitySettings;

  /**
   * Set quality settings
   */
  setQualitySettings(settings: Partial<QualitySettings>): void;

  /**
   * Auto-adjust quality based on performance
   */
  autoAdjustQuality(): void;

  /**
   * Force garbage collection (if available)
   */
  forceGC(): void;

  /**
   * Create an object pool
   */
  createObjectPool<T>(name: string, config: ObjectPoolConfig): ObjectPool<T>;

  /**
   * Get an object pool by name
   */
  getObjectPool<T>(name: string): ObjectPool<T> | null;

  /**
   * Enable/disable performance optimization features
   */
  setOptimizationEnabled(feature: string, enabled: boolean): void;

  /**
   * Destroy and cleanup
   */
  destroy(): void;
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  // Monitoring
  metricsUpdateInterval: number;
  performanceHistorySize: number;
  
  // Targets
  targetFps: number;
  minFps: number;
  maxMemoryUsage: number;
  
  // Auto-optimization
  autoQualityAdjustment: boolean;
  autoGarbageCollection: boolean;
  autoThermalThrottling: boolean;
  
  // Warnings
  enableWarnings: boolean;
  warningThresholds: {
    lowFps: number;
    highMemory: number;
    highDrawCalls: number;
  };
}

/**
 * Frame rate manager interface
 */
export interface FrameRateManager extends EventEmitter {
  initialize(config: GameLoopConfig): void;
  start(): void;
  stop(): void;
  update(deltaTime: number): void;
  getCurrentFps(): number;
  getTargetFps(): number;
  setTargetFps(fps: number): void;
  getFrameTime(): number;
  isFrameRateStable(): boolean;
}

/**
 * Memory optimizer interface
 */
export interface MemoryOptimizer extends EventEmitter {
  initialize(): void;
  getMemoryUsage(): MemoryInfo;
  optimizeMemory(): void;
  scheduleGC(): void;
  detectMemoryLeaks(): MemoryLeak[];
  createObjectPool<T>(config: ObjectPoolConfig): ObjectPool<T>;
  getObjectPools(): Map<string, ObjectPool<any>>;
}

/**
 * Memory information
 */
export interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
  gcCount: number;
  gcTime: number;
}

/**
 * Memory leak detection result
 */
export interface MemoryLeak {
  type: string;
  count: number;
  size: number;
  location?: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Object pool interface
 */
export interface ObjectPool<T> {
  get(): T;
  release(obj: T): void;
  clear(): void;
  size(): number;
  available(): number;
  inUse(): number;
  grow(count: number): void;
  shrink(): void;
}

/**
 * Rendering optimizer interface
 */
export interface RenderingOptimizer extends EventEmitter {
  initialize(config: BatchRenderingConfig): void;
  enableBatching(): void;
  disableBatching(): void;
  enableCulling(): void;
  disableCulling(): void;
  setLODLevels(levels: LODLevel[]): void;
  updateCulling(camera: any): void;
  getRenderStats(): RenderStats;
}

/**
 * Level of Detail configuration
 */
export interface LODLevel {
  distance: number;
  quality: QualityLevel;
  enabled: boolean;
}

/**
 * Rendering statistics
 */
export interface RenderStats {
  drawCalls: number;
  triangles: number;
  visibleObjects: number;
  culledObjects: number;
  batchedObjects: number;
  textureSwaps: number;
  shaderSwaps: number;
}

/**
 * Mobile optimizer interface
 */
export interface MobileOptimizer extends EventEmitter {
  initialize(): void;
  detectDeviceTier(): DevicePerformanceTier;
  getThermalState(): DeviceThermalState;
  getBatteryLevel(): number;
  getBatteryOptimizationMode(): BatteryOptimizationMode;
  setBatteryOptimizationMode(mode: BatteryOptimizationMode): void;
  enableThermalThrottling(): void;
  disableThermalThrottling(): void;
  optimizeForBattery(): void;
  optimizeForPerformance(): void;
}

/**
 * Performance debugging overlay interface
 */
export interface PerformanceDebugOverlay extends EventEmitter {
  show(): void;
  hide(): void;
  toggle(): void;
  isVisible(): boolean;
  updateMetrics(metrics: PerformanceMetrics): void;
  addGraph(name: string, maxValue: number, color: string): void;
  removeGraph(name: string): void;
  setPosition(x: number, y: number): void;
  setSize(width: number, height: number): void;
}

/**
 * Performance profiler interface
 */
export interface PerformanceProfiler extends EventEmitter {
  startProfiling(name: string): void;
  endProfiling(name: string): number;
  mark(name: string): void;
  measure(name: string, startMark: string, endMark: string): number;
  getProfilingResults(): ProfilingResult[];
  clearResults(): void;
  exportResults(): string;
}

/**
 * Profiling result
 */
export interface ProfilingResult {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  calls: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
}