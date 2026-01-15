/**
 * Version Detection Utilities
 *
 * Provides runtime detection of library versions and feature availability
 * to ensure backward compatibility across Pixi.js v7/v8 and Three.js r150-r180+
 */

import * as PIXI from 'pixi.js';
import * as THREE from 'three';

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
 * Detect Three.js version and available features
 */
export class ThreeVersionDetector {
  private static cachedVersion: VersionInfo | null = null;
  private static cachedFeatures: FeatureSupport | null = null;

  /**
   * Get Three.js version (revision number)
   */
  static getVersion(): VersionInfo {
    if (this.cachedVersion) {
      return this.cachedVersion;
    }

    try {
      if (THREE && THREE.REVISION) {
        const revision = parseInt(THREE.REVISION, 10);
        // Three.js uses revision numbers like "150", "160", "180"
        // Convert to semantic version for consistency
        this.cachedVersion = {
          major: 0,
          minor: revision,
          patch: 0,
          raw: `0.${revision}.0`
        };
      } else {
        // Fallback
        this.cachedVersion = { major: 0, minor: 180, patch: 0, raw: '0.180.0' };
      }
    } catch (error) {
      // Default to r180
      this.cachedVersion = { major: 0, minor: 180, patch: 0, raw: '0.180.0' };
    }

    return this.cachedVersion;
  }

  /**
   * Get revision number
   */
  static getRevision(): number {
    return this.getVersion().minor;
  }

  /**
   * Check if Three.js is r180 or higher
   */
  static isR180OrHigher(): boolean {
    return this.getRevision() >= 180;
  }

  /**
   * Check if Three.js is r160 or higher
   */
  static isR160OrHigher(): boolean {
    return this.getRevision() >= 160;
  }

  /**
   * Check if Three.js is below r160
   */
  static isLegacy(): boolean {
    return this.getRevision() < 160;
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
   * Check if WebGPURenderer might be available (version check only)
   * WebGPURenderer is in examples/jsm, not main Three.js export
   */
  static hasWebGPURenderer(): boolean {
    // WebGPURenderer available from r160+
    // Actual availability requires runtime dynamic import check
    return this.getRevision() >= 160;
  }

  /**
   * Attempt to load WebGPURenderer dynamically
   * Returns true if WebGPURenderer can be imported
   */
  static async canLoadWebGPURenderer(): Promise<boolean> {
    if (this.getRevision() < 160) {
      return false;
    }
    try {
      // @ts-expect-error - WebGPURenderer is in examples/jsm, not in main type definitions
      await import('three/examples/jsm/renderers/webgpu/WebGPURenderer.js');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if browser supports WebGPU
   */
  private static hasWebGPUSupport(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return 'gpu' in navigator && this.hasWebGPURenderer();
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
   * Check if instanced rendering is available
   */
  static hasInstancedMesh(): boolean {
    try {
      return typeof (THREE as any).InstancedMesh !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Check if LOD (Level of Detail) is available
   */
  static hasLOD(): boolean {
    try {
      return typeof (THREE as any).LOD !== 'undefined';
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
 * Unified version detection and feature support
 */
export class FrameworkCompatibility {
  /**
   * Get comprehensive compatibility report
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
      three: {
        version: ThreeVersionDetector.getVersion(),
        revision: ThreeVersionDetector.getRevision(),
        isR180Plus: ThreeVersionDetector.isR180OrHigher(),
        isR160Plus: ThreeVersionDetector.isR160OrHigher(),
        features: ThreeVersionDetector.getFeatureSupport(),
        hasWebGPURenderer: ThreeVersionDetector.hasWebGPURenderer(),
        hasInstancedMesh: ThreeVersionDetector.hasInstancedMesh(),
        hasLOD: ThreeVersionDetector.hasLOD()
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
    console.group('🔍 GameByte Framework - Compatibility Report');
    console.log('Pixi.js:', report.pixi);
    console.log('Three.js:', report.three);
    console.log('Browser:', report.browser);
    console.groupEnd();
  }
}
