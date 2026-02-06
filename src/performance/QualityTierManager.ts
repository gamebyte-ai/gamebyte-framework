import type { QualityTier } from '../contracts/Performance.js';

/** Default quality tiers ordered from lowest to highest */
const DEFAULT_TIERS: QualityTier[] = [
  {
    name: 'ultra-low',
    dpr: 0.5,
    shadowMapSize: 0,
    shadowsEnabled: false,
    postProcessing: false,
    drawDistance: 50,
    particleMultiplier: 0.1,
    textureResolution: 'low',
    antialiasing: false,
    maxLights: 2
  },
  {
    name: 'low',
    dpr: 0.75,
    shadowMapSize: 512,
    shadowsEnabled: true,
    postProcessing: false,
    drawDistance: 100,
    particleMultiplier: 0.3,
    textureResolution: 'low',
    antialiasing: false,
    maxLights: 4
  },
  {
    name: 'medium',
    dpr: 1.0,
    shadowMapSize: 1024,
    shadowsEnabled: true,
    postProcessing: true,
    drawDistance: 200,
    particleMultiplier: 0.6,
    textureResolution: 'medium',
    antialiasing: true,
    maxLights: 8
  },
  {
    name: 'high',
    dpr: 1.0,
    shadowMapSize: 2048,
    shadowsEnabled: true,
    postProcessing: true,
    drawDistance: 500,
    particleMultiplier: 1.0,
    textureResolution: 'high',
    antialiasing: true,
    maxLights: 16
  },
  {
    name: 'ultra',
    dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 2,
    shadowMapSize: 4096,
    shadowsEnabled: true,
    postProcessing: true,
    drawDistance: 1000,
    particleMultiplier: 1.5,
    textureResolution: 'high',
    antialiasing: true,
    maxLights: 32
  }
];

/**
 * Manages quality tiers and tier transitions.
 */
export class QualityTierManager {
  private tiers: QualityTier[];
  private tierIndex: number;
  private minTierIndex = 0;
  private maxTierIndex: number;

  constructor() {
    this.tiers = [...DEFAULT_TIERS];
    this.tierIndex = 2; // Start at 'medium'
    this.maxTierIndex = this.tiers.length - 1;
  }

  /**
   * Register a custom tier. Inserted in order by DPR * drawDistance (quality proxy).
   */
  registerTier(tier: QualityTier): void {
    this.tiers.push(tier);
    // Re-sort by quality proxy
    this.tiers.sort((a, b) => (a.dpr * a.drawDistance) - (b.dpr * b.drawDistance));
    this.maxTierIndex = this.tiers.length - 1;
    // Re-find current tier index by name
    const idx = this.tiers.findIndex(t => t.name === this.getCurrentTier().name);
    if (idx >= 0) this.tierIndex = idx;
  }

  getCurrentTier(): QualityTier {
    return this.tiers[this.tierIndex];
  }

  getTierByName(name: string): QualityTier | undefined {
    return this.tiers.find(t => t.name === name);
  }

  setTierByName(name: string): QualityTier | null {
    const idx = this.tiers.findIndex(t => t.name === name);
    if (idx >= 0 && idx >= this.minTierIndex && idx <= this.maxTierIndex) {
      this.tierIndex = idx;
      return this.tiers[idx];
    }
    return null;
  }

  /**
   * Move to the next lower tier. Returns new tier or null if already at min.
   */
  downgrade(): QualityTier | null {
    if (this.tierIndex <= this.minTierIndex) return null;
    this.tierIndex--;
    return this.tiers[this.tierIndex];
  }

  /**
   * Move to the next higher tier. Returns new tier or null if already at max.
   */
  upgrade(): QualityTier | null {
    if (this.tierIndex >= this.maxTierIndex) return null;
    this.tierIndex++;
    return this.tiers[this.tierIndex];
  }

  canDowngrade(): boolean {
    return this.tierIndex > this.minTierIndex;
  }

  canUpgrade(): boolean {
    return this.tierIndex < this.maxTierIndex;
  }

  setMinTier(name: string): void {
    const idx = this.tiers.findIndex(t => t.name === name);
    if (idx >= 0) this.minTierIndex = idx;
  }

  setMaxTier(name: string): void {
    const idx = this.tiers.findIndex(t => t.name === name);
    if (idx >= 0) this.maxTierIndex = idx;
  }

  getTierNames(): string[] {
    return this.tiers.map(t => t.name);
  }
}
