/**
 * Unified device detection utilities for the GameByte framework.
 * Consolidates all device detection logic with caching for expensive operations.
 *
 * @module DeviceDetectionUtils
 */

import { DevicePerformanceTier } from '../contracts/AssetManager';
import { DevicePerformanceTier as PerformanceTier } from '../contracts/Performance';

/**
 * Platform detection result.
 */
export type Platform = 'ios' | 'android' | 'web';

/**
 * Device type classification.
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

/**
 * Connection type for network detection.
 */
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi';

/**
 * GPU tier classification.
 */
export type GPUTier = 'none' | 'low' | 'medium' | 'high' | 'unknown';

/**
 * Screen information.
 */
export interface ScreenInfo {
  width: number;
  height: number;
  pixelRatio: number;
}

/**
 * Unified device capabilities interface that covers all use cases.
 */
export interface UnifiedDeviceCapabilities {
  performanceTier: DevicePerformanceTier;
  deviceType: DeviceType;
  platform: Platform;
  availableMemory: number;
  hardwareConcurrency: number;
  gpuTier: GPUTier;
  connectionType: ConnectionType;
  screen: ScreenInfo;
  webglVersion: number;
  maxTextureSize: number;
  hasTouchScreen: boolean;
  supportsWebWorkers: boolean;
  supportsOffscreenCanvas: boolean;
  supportsImageBitmap: boolean;
  supportsWebAssembly: boolean;
  supportsBatteryAPI: boolean;
  supportsThermalAPI: boolean;
  supportsHaptics: boolean;
}

/**
 * Cache for expensive detection operations.
 */
let cachedCapabilities: UnifiedDeviceCapabilities | null = null;
let cachedGPUInfo: { tier: GPUTier; renderer: string } | null = null;
let cachedWebGLContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;

/**
 * Get cached WebGL context for GPU detection.
 */
function getWebGLContext(): WebGLRenderingContext | WebGL2RenderingContext | null {
  if (cachedWebGLContext) {
    return cachedWebGLContext;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  cachedWebGLContext = (canvas.getContext('webgl2') ||
    canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null;

  return cachedWebGLContext;
}

/**
 * Detect platform from user agent.
 */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') {
    return 'web';
  }

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  return 'web';
}

/**
 * Detect device type based on user agent and screen size.
 */
export function detectDeviceType(): DeviceType {
  if (typeof navigator === 'undefined' || typeof screen === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  if (isMobile) {
    const minDimension = Math.min(screen.width, screen.height);
    const maxDimension = Math.max(screen.width, screen.height);
    const aspectRatio = maxDimension / minDimension;

    // Tablets typically have larger screens and different aspect ratios
    if (minDimension >= 768 || (minDimension >= 600 && aspectRatio < 2)) {
      return 'tablet';
    }
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Estimate device memory if navigator.deviceMemory is not available.
 */
export function estimateDeviceMemory(): number {
  if (typeof navigator === 'undefined') {
    return 4;
  }

  const nav = navigator as { deviceMemory?: number };
  if (nav.deviceMemory !== undefined) {
    return nav.deviceMemory;
  }

  const ua = navigator.userAgent.toLowerCase();

  // Estimates based on user agent patterns
  if (/iphone|ipad/.test(ua)) {
    if (/iphone.*15|ipad.*15/.test(ua)) return 6; // iPhone 15 series
    if (/iphone.*14|ipad.*14/.test(ua)) return 6; // iPhone 14 series
    if (/iphone.*13|ipad.*13/.test(ua)) return 4; // iPhone 13 series
    return 3; // Older iPhones
  }

  if (/android/.test(ua)) {
    // Most Android devices have 4-8GB RAM
    return 4;
  }

  // Desktop/other - assume higher memory
  return 8;
}

/**
 * Get hardware concurrency (number of logical processors).
 */
export function getHardwareConcurrency(): number {
  if (typeof navigator === 'undefined') {
    return 4;
  }
  return navigator.hardwareConcurrency || 4;
}

/**
 * Detect GPU tier based on WebGL renderer information.
 */
export function detectGPUTier(): { tier: GPUTier; renderer: string } {
  if (cachedGPUInfo) {
    return cachedGPUInfo;
  }

  const gl = getWebGLContext();
  if (!gl) {
    cachedGPUInfo = { tier: 'none', renderer: 'none' };
    return cachedGPUInfo;
  }

  let renderer = 'unknown';
  let tier: GPUTier = 'unknown';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';

    if (/nvidia|geforce/i.test(renderer)) {
      tier = 'high';
    } else if (/amd|radeon/i.test(renderer)) {
      tier = 'high';
    } else if (/apple/i.test(renderer)) {
      tier = 'high';
    } else if (/intel/i.test(renderer)) {
      tier = 'medium';
    } else if (/mali|adreno|powerVR/i.test(renderer)) {
      tier = 'medium';
    }
  }

  cachedGPUInfo = { tier, renderer };
  return cachedGPUInfo;
}

/**
 * Get WebGL version (0, 1, or 2).
 */
export function getWebGLVersion(): number {
  const gl = getWebGLContext();
  if (!gl) return 0;

  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return 2;
  }
  if (typeof WebGLRenderingContext !== 'undefined' && gl instanceof WebGLRenderingContext) {
    return 1;
  }

  return 0;
}

/**
 * Get maximum texture size supported by the GPU.
 */
export function getMaxTextureSize(): number {
  const gl = getWebGLContext();
  if (!gl) return 0;
  return gl.getParameter(gl.MAX_TEXTURE_SIZE);
}

/**
 * Get maximum viewport dimensions.
 */
export function getMaxViewportDims(): [number, number] {
  const gl = getWebGLContext();
  if (!gl) return [0, 0];
  const dims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  return [dims[0], dims[1]];
}

/**
 * Get supported WebGL extensions.
 */
export function getSupportedExtensions(): string[] {
  const gl = getWebGLContext();
  if (!gl) return [];
  return gl.getSupportedExtensions() || [];
}

/**
 * Detect network connection type.
 */
export function detectConnectionType(): ConnectionType {
  if (typeof navigator === 'undefined') {
    return '4g';
  }

  const nav = navigator as { connection?: { effectiveType?: string } };
  const connection = nav.connection;

  if (connection?.effectiveType) {
    const type = connection.effectiveType.toLowerCase();
    if (type === 'slow-2g') return 'slow-2g';
    if (type === '2g') return '2g';
    if (type === '3g') return '3g';
    if (type === '4g') return '4g';
    if (type === '5g') return '5g';
  }

  return '4g';
}

/**
 * Get screen information.
 */
export function getScreenInfo(): ScreenInfo {
  if (typeof window === 'undefined' || typeof screen === 'undefined') {
    return { width: 1920, height: 1080, pixelRatio: 1 };
  }

  return {
    width: screen.width,
    height: screen.height,
    pixelRatio: window.devicePixelRatio || 1,
  };
}

/**
 * Check if device has touch screen.
 */
export function hasTouchScreen(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if device supports haptic feedback.
 */
export function supportsHaptics(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return 'vibrate' in navigator;
}

/**
 * Check if Battery API is supported.
 */
export function supportsBatteryAPI(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return 'getBattery' in navigator;
}

/**
 * Check if Thermal API is supported.
 */
export function supportsThermalAPI(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const nav = navigator as { connection?: { thermalState?: unknown } };
  return 'connection' in navigator && nav.connection !== undefined && 'thermalState' in (nav.connection || {});
}

/**
 * Calculate device performance tier based on multiple heuristics.
 */
export function calculatePerformanceTier(): DevicePerformanceTier {
  const deviceMemory = estimateDeviceMemory();
  const hardwareConcurrency = getHardwareConcurrency();
  const screenInfo = getScreenInfo();
  const connectionType = detectConnectionType();
  const gpuInfo = detectGPUTier();

  // Premium tier: High-end devices
  if (deviceMemory >= 8 && hardwareConcurrency >= 8 && screenInfo.pixelRatio >= 2) {
    return DevicePerformanceTier.PREMIUM;
  }

  // High tier: Good devices
  if (deviceMemory >= 6 && hardwareConcurrency >= 6 && gpuInfo.tier === 'high') {
    return DevicePerformanceTier.HIGH;
  }

  // Low tier: Limited devices
  if (deviceMemory <= 2 || hardwareConcurrency <= 2 || connectionType === 'slow-2g') {
    return DevicePerformanceTier.LOW;
  }

  // Default to medium
  return DevicePerformanceTier.MEDIUM;
}

/**
 * Calculate performance tier using the Performance contract enum.
 * This is used by DeviceDetector which uses a different enum.
 */
export function calculatePerformanceTierForPerformanceContract(): PerformanceTier {
  const deviceMemory = estimateDeviceMemory();
  const hardwareConcurrency = getHardwareConcurrency();
  const webglVersion = getWebGLVersion();
  const maxTextureSize = getMaxTextureSize();
  const deviceType = detectDeviceType();

  let score = 0;

  // CPU cores contribution (0-20 points)
  score += Math.min(hardwareConcurrency * 3, 20);

  // Memory contribution (0-25 points)
  if (deviceMemory >= 8) score += 25;
  else if (deviceMemory >= 4) score += 20;
  else if (deviceMemory >= 2) score += 15;
  else score += 10;

  // WebGL contribution (0-20 points)
  if (webglVersion === 2) score += 20;
  else if (webglVersion === 1) score += 15;

  // Texture size contribution (0-15 points)
  if (maxTextureSize >= 8192) score += 15;
  else if (maxTextureSize >= 4096) score += 12;
  else if (maxTextureSize >= 2048) score += 8;
  else score += 5;

  // Device type contribution (0-10 points)
  if (deviceType === 'desktop') score += 10;
  else if (deviceType === 'tablet') score += 7;
  else if (deviceType === 'mobile') score += 5;

  // Advanced features contribution (0-10 points)
  let featureScore = 0;
  if (typeof Worker !== 'undefined') featureScore += 2;
  if (typeof OffscreenCanvas !== 'undefined') featureScore += 2;
  if (typeof createImageBitmap !== 'undefined') featureScore += 2;
  if (typeof WebAssembly !== 'undefined') featureScore += 2;
  if (getSupportedExtensions().length > 20) featureScore += 2;
  score += featureScore;

  // Classify based on total score
  if (score >= 75) return PerformanceTier.HIGH;
  if (score >= 50) return PerformanceTier.MID;
  return PerformanceTier.LOW;
}

/**
 * Get device tier as a simple string (for loaders that use string tiers).
 */
export function getDeviceTierString(): 'low' | 'medium' | 'high' | 'premium' {
  const tier = calculatePerformanceTier();
  switch (tier) {
    case DevicePerformanceTier.LOW:
      return 'low';
    case DevicePerformanceTier.MEDIUM:
      return 'medium';
    case DevicePerformanceTier.HIGH:
      return 'high';
    case DevicePerformanceTier.PREMIUM:
      return 'premium';
    default:
      return 'medium';
  }
}

/**
 * Get device tier based on audio context capabilities.
 * Used by AudioLoader for audio-specific tier detection.
 */
export function getAudioDeviceTier(audioContext: AudioContext | null): 'low' | 'medium' | 'high' | 'premium' {
  if (!audioContext) return 'low';

  const maxChannels = audioContext.destination.maxChannelCount;
  const sampleRate = audioContext.sampleRate;

  if (maxChannels >= 8 && sampleRate >= 48000) return 'premium';
  if (maxChannels >= 6 && sampleRate >= 44100) return 'high';
  if (maxChannels >= 2) return 'medium';
  return 'low';
}

/**
 * Get device tier based on screen metrics.
 * Used by TextureLoader for texture-specific tier detection.
 */
export function getTextureDeviceTier(): 'low' | 'medium' | 'high' | 'premium' {
  const screenInfo = getScreenInfo();
  const screenSize = screenInfo.width * screenInfo.height;

  if (screenInfo.pixelRatio >= 3 && screenSize > 2000000) return 'premium';
  if (screenInfo.pixelRatio >= 2 && screenSize > 1000000) return 'high';
  if (screenInfo.pixelRatio >= 1.5) return 'medium';
  return 'low';
}

/**
 * Get all unified device capabilities.
 * Results are cached for performance.
 */
export function getUnifiedDeviceCapabilities(): UnifiedDeviceCapabilities {
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  cachedCapabilities = {
    performanceTier: calculatePerformanceTier(),
    deviceType: detectDeviceType(),
    platform: detectPlatform(),
    availableMemory: estimateDeviceMemory() * 1024, // Convert GB to MB
    hardwareConcurrency: getHardwareConcurrency(),
    gpuTier: detectGPUTier().tier,
    connectionType: detectConnectionType(),
    screen: getScreenInfo(),
    webglVersion: getWebGLVersion(),
    maxTextureSize: getMaxTextureSize(),
    hasTouchScreen: hasTouchScreen(),
    supportsWebWorkers: typeof Worker !== 'undefined',
    supportsOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    supportsImageBitmap: typeof createImageBitmap !== 'undefined',
    supportsWebAssembly: typeof WebAssembly !== 'undefined',
    supportsBatteryAPI: supportsBatteryAPI(),
    supportsThermalAPI: supportsThermalAPI(),
    supportsHaptics: supportsHaptics(),
  };

  return cachedCapabilities;
}

/**
 * Clear cached detection results.
 * Useful for testing or when device state might have changed.
 */
export function clearDeviceDetectionCache(): void {
  cachedCapabilities = null;
  cachedGPUInfo = null;
  cachedWebGLContext = null;
}

/**
 * Force refresh of device capabilities.
 */
export function refreshDeviceCapabilities(): UnifiedDeviceCapabilities {
  clearDeviceDetectionCache();
  return getUnifiedDeviceCapabilities();
}
