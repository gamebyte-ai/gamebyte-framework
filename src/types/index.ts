/**
 * Common types used throughout the GameByte framework.
 */

// Game Configuration
export interface GameConfig {
  canvas?: HTMLCanvasElement | string;
  width?: number;
  height?: number;
  renderingMode?: 'auto' | '2d' | '3d' | 'hybrid';
  antialias?: boolean;
  transparent?: boolean;
  backgroundColor?: number | string;
  resolution?: number;
  autoDensity?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  plugins?: string[];
}

// Game Types for different game genres
export enum GameType {
  MOBILE_CASUAL = 'mobile-casual',
  HYBRID_CASUAL = 'hybrid-casual',
  HYPER_CASUAL = 'hyper-casual',
  PLATFORMER = 'platformer',
  SHOOTER = 'shooter',
  PUZZLE = 'puzzle'
}

// Performance Tiers for mobile optimization
export enum PerformanceTier {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  PREMIUM = 'premium'
}

// Re-export asset management types for convenience
export type {
  AssetConfig,
  LoadedAsset,
  AssetLoadingProgress,
  BatchLoadingProgress,
  AssetManager,
  AssetLoader,
  AssetCache,
  AssetBundle,
  DeviceCapabilities
} from '../contracts/AssetManager';
export {
  AssetType,
  AssetLoadingState as AssetState,
  AssetPriority,
  DevicePerformanceTier,
  CacheEvictionStrategy
} from '../contracts/AssetManager';

// Input Event Types
export interface InputEvent {
  type: 'touch' | 'mouse' | 'keyboard' | 'gamepad';
  x?: number;
  y?: number;
  button?: number;
  key?: string;
  target?: any;
  timestamp: number;
}

// Game Object Interface
export interface GameObject {
  id: string;
  name?: string;
  active: boolean;
  position: { x: number; y: number; z?: number };
  rotation: { x?: number; y?: number; z: number };
  scale: { x: number; y: number; z?: number };
  update(deltaTime: number): void;
  destroy(): void;
}

// Component System Types
export interface Component {
  readonly id: string;
  readonly type: string;
  enabled: boolean;
  gameObject?: GameObject;
  update?(deltaTime: number): void;
  destroy?(): void;
}

// Event System Types
export interface GameEvent {
  type: string;
  data?: any;
  timestamp: number;
  bubbles?: boolean;
  cancelable?: boolean;
}

// Mobile Specific Types
export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  performanceTier: PerformanceTier;
  memoryLimit: number;
  gpuTier: string;
}