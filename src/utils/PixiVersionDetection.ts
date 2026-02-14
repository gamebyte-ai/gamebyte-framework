/**
 * Version Detection Utilities (Pixi.js and Browser only)
 *
 * Provides runtime detection of Pixi.js version and browser feature availability
 * Note: Three.js detection is in ThreeVersionDetection.ts (separate bundle)
 */

import * as PIXI from 'pixi.js';
import { Logger } from './Logger.js';

export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

export interface FeatureSupport {
  webgpu: boolean;
  webgl2: boolean;
  webgl: boolean;
}

/**
 * Parse semantic version string into components
 */
export function parseVersion(versionString: string): VersionInfo {
  // Guard against excessively long input to prevent regex backtracking
  if (!versionString || versionString.length > 128) {
    return { major: 0, minor: 0, patch: 0, raw: versionString || '' };
  }
  const match = versionString.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return { major: 0, minor: 0, patch: 0, raw: versionString };
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    raw: versionString
  };
}

/**
 * Detect Pixi.js version and available features
 */
export class PixiVersionDetector {
  private static cachedVersion: VersionInfo | null = null;
  private static cachedFeatures: FeatureSupport | null = null;

  /**
   * Get Pixi.js version information
   */
  static getVersion(): VersionInfo {
    if (this.cachedVersion) {
      return this.cachedVersion;
    }

    try {
      if (PIXI && (PIXI as any).VERSION) {
        this.cachedVersion = parseVersion((PIXI as any).VERSION);
      } else {
        // Fallback: assume v8 if VERSION is not available
        this.cachedVersion = { major: 8, minor: 0, patch: 0, raw: '8.0.0' };
      }
    } catch (error) {
      // Default to v8 if detection fails
      this.cachedVersion = { major: 8, minor: 0, patch: 0, raw: '8.0.0' };
    }

    return this.cachedVersion;
  }

  /**
   * Check if Pixi.js is v8 or higher
   */
  static isV8OrHigher(): boolean {
    const version = this.getVersion();
    return version.major >= 8;
  }

  /**
   * Check if Pixi.js is v7
   */
  static isV7(): boolean {
    const version = this.getVersion();
    return version.major === 7;
  }

  /**
   * Detect available rendering features
   */
  static getFeatureSupport(): FeatureSupport {
    if (this.cachedFeatures) {
      return this.cachedFeatures;
    }

    this.cachedFeatures = {
      webgpu: this.hasWebGPUSupport(),
      webgl2: this.hasWebGL2Support(),
      webgl: this.hasWebGLSupport()
    };

    return this.cachedFeatures;
  }

  /**
   * Check if WebGPU is available in browser and Pixi.js
   */
  private static hasWebGPUSupport(): boolean {
    // WebGPU only available in Pixi v8+
    if (!this.isV8OrHigher()) {
      return false;
    }

    // Check browser WebGPU support
    if (typeof navigator === 'undefined') {
      return false;
    }

    return 'gpu' in navigator;
  }

  /**
   * Check if WebGL2 is available
   */
  private static hasWebGL2Support(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2'));
    } catch {
      return false;
    }
  }

  /**
   * Check if WebGL is available
   */
  private static hasWebGLSupport(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  /**
   * Check if autoDetectRenderer is available (v8 feature)
   */
  static hasAutoDetectRenderer(): boolean {
    try {
      return typeof (PIXI as any).autoDetectRenderer === 'function';
    } catch {
      return false;
    }
  }

  /**
   * Check if ParticleContainer is available
   */
  static hasParticleContainer(): boolean {
    try {
      return typeof (PIXI as any).ParticleContainer !== 'undefined';
    } catch {
      return false;
    }
  }
}

/**
 * Browser feature detection
 */
export class BrowserFeatureDetector {
  /**
   * Check if WebGPU is available in the browser
   */
  static hasWebGPU(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return 'gpu' in navigator;
  }

  /**
   * Check if WebGL2 is available
   */
  static hasWebGL2(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      return gl !== null;
    } catch {
      return false;
    }
  }

  /**
   * Check if WebGL is available
   */
  static hasWebGL(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get best available rendering context
   */
  static getBestRenderingContext(): 'webgpu' | 'webgl2' | 'webgl' | null {
    if (this.hasWebGPU()) return 'webgpu';
    if (this.hasWebGL2()) return 'webgl2';
    if (this.hasWebGL()) return 'webgl';
    return null;
  }

  /**
   * Check if running on mobile device
   */
  static isMobile(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if Battery Status API is available
   */
  static hasBatteryAPI(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return 'getBattery' in navigator;
  }
}

/**
 * Framework compatibility (Pixi-only version)
 * Note: Full compatibility report including Three.js is in FrameworkCompatibility (three-toolkit)
 */
export class FrameworkCompatibility {
  /**
   * Get compatibility report (Pixi and browser only)
   */
  static getCompatibilityReport() {
    return {
      pixi: {
        version: PixiVersionDetector.getVersion(),
        isV8: PixiVersionDetector.isV8OrHigher(),
        isV7: PixiVersionDetector.isV7(),
        features: PixiVersionDetector.getFeatureSupport(),
        hasAutoDetectRenderer: PixiVersionDetector.hasAutoDetectRenderer(),
        hasParticleContainer: PixiVersionDetector.hasParticleContainer()
      },
      browser: {
        hasWebGPU: BrowserFeatureDetector.hasWebGPU(),
        hasWebGL2: BrowserFeatureDetector.hasWebGL2(),
        hasWebGL: BrowserFeatureDetector.hasWebGL(),
        bestContext: BrowserFeatureDetector.getBestRenderingContext(),
        isMobile: BrowserFeatureDetector.isMobile(),
        hasBatteryAPI: BrowserFeatureDetector.hasBatteryAPI()
      }
    };
  }

  /**
   * Log compatibility report to console
   */
  static logCompatibilityReport(): void {
    const report = this.getCompatibilityReport();
    Logger.info('Compatibility', 'GameByte Framework - Compatibility Report');
    Logger.info('Compatibility', 'Pixi.js:', report.pixi);
    Logger.info('Compatibility', 'Browser:', report.browser);
  }
}
