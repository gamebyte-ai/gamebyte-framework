/**
 * Three.js Version Detection Utilities
 *
 * Provides runtime detection of Three.js version and feature availability
 * This file is part of the Three.js toolkit bundle (gamebyte-three.umd.js)
 */

import * as THREE from 'three';
import { Logger } from '../../utils/Logger.js';

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
 * Three.js Framework compatibility (includes browser features)
 */
export class ThreeFrameworkCompatibility {
  /**
   * Get Three.js compatibility report
   */
  static getCompatibilityReport() {
    return {
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
        hasWebGPU: typeof navigator !== 'undefined' && 'gpu' in navigator,
        hasWebGL2: this.hasWebGL2(),
        hasWebGL: this.hasWebGL(),
        bestContext: this.getBestRenderingContext()
      }
    };
  }

  private static hasWebGL2(): boolean {
    if (typeof document === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return canvas.getContext('webgl2') !== null;
    } catch {
      return false;
    }
  }

  private static hasWebGL(): boolean {
    if (typeof document === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) !== null;
    } catch {
      return false;
    }
  }

  private static getBestRenderingContext(): 'webgpu' | 'webgl2' | 'webgl' | null {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) return 'webgpu';
    if (this.hasWebGL2()) return 'webgl2';
    if (this.hasWebGL()) return 'webgl';
    return null;
  }

  /**
   * Log compatibility report to console
   */
  static logCompatibilityReport(): void {
    const report = this.getCompatibilityReport();
    Logger.info('Compatibility', 'GameByte Three.js Toolkit - Compatibility Report');
    Logger.info('Compatibility', 'Three.js:', report.three);
    Logger.info('Compatibility', 'Browser:', report.browser);
  }
}
