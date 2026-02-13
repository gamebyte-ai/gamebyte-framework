/**
 * GameSplash - Framework splash screen (instant-loading)
 *
 * Shows GameByte logo with premium animations.
 * Loads INSTANTLY before any JavaScript - pure HTML/CSS.
 *
 * Features:
 * - Ambient light rays rotating in background
 * - Lens flare center glow
 * - Gradient orbital rings with orbiting dot
 * - Energy ripples expanding outward
 * - 4-pointed star sparkles (SVG)
 * - Particle burst effects
 * - Smooth floating logo with multi-layer glow
 * - Reduced motion support for accessibility
 *
 * Usage:
 * 1. Add GameSplash.getInlineCSS() to your HTML <head>
 * 2. Add GameSplash.getInlineHTML() to your HTML <body>
 * 3. Call GameSplash.init() once JS loads
 * 4. Call splash.hide() to transition out
 */

export interface GameSplashConfig {
  /** Logo URL (default: /img/logo-icon.svg) */
  logoUrl?: string;
  /** Background color (default: #0a0a1a) */
  backgroundColor?: string;
  /** Primary glow color (default: #6366f1) */
  glowColor?: string;
  /** Accent glow color (default: #a855f7) */
  accentColor?: string;
  /** Auto-hide duration in ms (0 = manual control) */
  duration?: number;
}

const DEFAULT_CONFIG: Required<GameSplashConfig> = {
  logoUrl: '/img/logo-icon.svg',
  backgroundColor: '#0a0a1a',
  glowColor: '#6366f1',
  accentColor: '#a855f7',
  duration: 1500
};

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '99, 102, 241'; // Default fallback
}

/**
 * GameSplash - Framework branding splash (instant load)
 */
export class GameSplash {
  private static instance: GameSplash | null = null;
  private config: Required<GameSplashConfig>;
  private element: HTMLElement | null = null;
  private onComplete: (() => void) | null = null;

  private constructor(config: GameSplashConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize splash screen (call once JS loads)
   */
  static init(config: GameSplashConfig = {}): GameSplash {
    if (!GameSplash.instance) {
      GameSplash.instance = new GameSplash(config);
      GameSplash.instance.attach();
    }
    return GameSplash.instance;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GameSplash | null {
    return GameSplash.instance;
  }

  /**
   * Attach to existing splash element or create new one
   */
  private attach(): void {
    this.element = document.getElementById('gamebyte-splash');

    if (!this.element) {
      // Create splash if not found in HTML
      const css = document.createElement('style');
      css.id = 'gamebyte-splash-styles';
      let cssText = GameSplash.getInlineCSS(this.config);
      // Strip style tags using string operations to avoid polynomial regex backtracking
      let idx: number;
      while ((idx = cssText.toLowerCase().indexOf('<style')) !== -1) {
        const end = cssText.indexOf('>', idx);
        if (end === -1) break;
        cssText = cssText.substring(0, idx) + cssText.substring(end + 1);
      }
      while ((idx = cssText.toLowerCase().indexOf('</style')) !== -1) {
        const end = cssText.indexOf('>', idx);
        if (end === -1) break;
        cssText = cssText.substring(0, idx) + cssText.substring(end + 1);
      }
      css.textContent = cssText;
      document.head.appendChild(css);

      document.body.insertAdjacentHTML('afterbegin', GameSplash.getInlineHTML(this.config));
      this.element = document.getElementById('gamebyte-splash');
    }

    // Auto-hide if duration is set
    if (this.config.duration > 0) {
      setTimeout(() => this.hide(), this.config.duration);
    }
  }

  /**
   * Hide splash with fade animation
   */
  async hide(): Promise<void> {
    if (!this.element) return;

    this.element.classList.add('splash-hiding');

    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.element) {
          this.element.remove();
        }
        // Clean up styles
        const styles = document.getElementById('gamebyte-splash-styles');
        if (styles) styles.remove();

        GameSplash.instance = null;
        if (this.onComplete) {
          this.onComplete();
        }
        resolve();
      }, 600);
    });
  }

  /**
   * Set callback for when splash completes
   */
  onHide(callback: () => void): void {
    this.onComplete = callback;
  }

  /**
   * Get inline CSS to embed in <head>
   * Pure CSS - loads instantly without JS
   * Premium effects: light rays, lens flare, orbital rings, sparkles, particles
   */
  static getInlineCSS(config: GameSplashConfig = {}): string {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const glowRgb = hexToRgb(cfg.glowColor);
    const accentRgb = hexToRgb(cfg.accentColor);

    return `
<style id="gamebyte-splash-styles">
  :root {
    --gb-glow: ${cfg.glowColor};
    --gb-glow-rgb: ${glowRgb};
    --gb-accent: ${cfg.accentColor};
    --gb-accent-rgb: ${accentRgb};
  }

  #gamebyte-splash {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at center, #12122a 0%, ${cfg.backgroundColor} 70%);
    transition: opacity 0.6s ease-out;
    overflow: hidden;
  }

  #gamebyte-splash.splash-hiding {
    opacity: 0;
    pointer-events: none;
  }

  /* === AMBIENT LIGHT RAYS === */
  .gb-light-rays {
    position: absolute;
    width: 100%;
    height: 100%;
    background: conic-gradient(
      from 0deg at 50% 50%,
      transparent 0deg,
      rgba(var(--gb-glow-rgb), 0.03) 10deg,
      transparent 20deg,
      transparent 40deg,
      rgba(var(--gb-glow-rgb), 0.02) 50deg,
      transparent 60deg,
      transparent 90deg,
      rgba(var(--gb-accent-rgb), 0.03) 100deg,
      transparent 110deg,
      transparent 140deg,
      rgba(var(--gb-glow-rgb), 0.02) 150deg,
      transparent 160deg,
      transparent 180deg,
      rgba(var(--gb-glow-rgb), 0.03) 190deg,
      transparent 200deg,
      transparent 230deg,
      rgba(var(--gb-accent-rgb), 0.02) 240deg,
      transparent 250deg,
      transparent 280deg,
      rgba(var(--gb-glow-rgb), 0.03) 290deg,
      transparent 300deg,
      transparent 330deg,
      rgba(var(--gb-glow-rgb), 0.02) 340deg,
      transparent 360deg
    );
    animation: gb-rays-rotate 20s linear infinite;
    pointer-events: none;
  }

  /* === LENS FLARE CENTER GLOW === */
  .gb-lens-flare {
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(
      circle at center,
      rgba(var(--gb-glow-rgb), 0.15) 0%,
      rgba(var(--gb-glow-rgb), 0.08) 20%,
      rgba(var(--gb-accent-rgb), 0.03) 40%,
      transparent 70%
    );
    filter: blur(20px);
    animation: gb-lens-pulse 4s ease-in-out infinite;
    pointer-events: none;
  }

  /* === LOGO WRAPPER === */
  .gamebyte-logo-wrapper {
    position: relative;
    width: 240px;
    height: 240px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: gb-entrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* === LOGO === */
  .gamebyte-logo {
    position: relative;
    width: 80px;
    height: 80px;
    z-index: 10;
  }

  .gamebyte-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: brightness(0) invert(1);
    animation: gb-logo-glow 3s ease-in-out infinite;
  }

  /* === ORBITAL RINGS WITH GRADIENT === */
  .gb-orbit {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .gb-orbit-1 {
    width: 130px;
    height: 130px;
    border: 2px solid transparent;
    background: linear-gradient(${cfg.backgroundColor}, ${cfg.backgroundColor}) padding-box,
                linear-gradient(45deg, var(--gb-glow), var(--gb-accent), var(--gb-glow)) border-box;
    animation: gb-spin 6s linear infinite;
    opacity: 0.6;
  }

  .gb-orbit-2 {
    width: 170px;
    height: 170px;
    border: 1px dashed rgba(var(--gb-glow-rgb), 0.4);
    animation: gb-spin-reverse 10s linear infinite;
  }

  .gb-orbit-3 {
    width: 210px;
    height: 210px;
    border: 1px solid transparent;
    background: linear-gradient(${cfg.backgroundColor}, ${cfg.backgroundColor}) padding-box,
                linear-gradient(135deg, transparent, var(--gb-glow), transparent) border-box;
    animation: gb-spin 15s linear infinite;
    opacity: 0.3;
  }

  /* === ORBITING DOT === */
  .gb-orbit-dot {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--gb-glow);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--gb-glow), 0 0 20px var(--gb-glow), 0 0 30px var(--gb-accent);
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
  }

  /* === ENERGY RIPPLES === */
  .gb-ripple {
    position: absolute;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid var(--gb-glow);
    opacity: 0;
    pointer-events: none;
  }

  .gb-ripple-1 { animation: gb-ripple-expand 2.5s ease-out infinite; }
  .gb-ripple-2 { animation: gb-ripple-expand 2.5s ease-out infinite 0.8s; }
  .gb-ripple-3 { animation: gb-ripple-expand 2.5s ease-out infinite 1.6s; }

  /* === 4-POINTED STAR SPARKLES (SVG) === */
  .gb-sparkles {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .gb-star {
    position: absolute;
    width: 20px;
    height: 20px;
    opacity: 0;
  }

  .gb-star svg {
    width: 100%;
    height: 100%;
    fill: white;
    filter: drop-shadow(0 0 4px white) drop-shadow(0 0 8px var(--gb-glow));
  }

  .gb-star-1 { top: 15%; left: 20%; animation: gb-star-twinkle 2s ease-in-out infinite 0s; }
  .gb-star-2 { top: 25%; right: 15%; animation: gb-star-twinkle 2.3s ease-in-out infinite 0.4s; }
  .gb-star-3 { bottom: 20%; left: 15%; animation: gb-star-twinkle 1.8s ease-in-out infinite 0.8s; }
  .gb-star-4 { bottom: 25%; right: 20%; animation: gb-star-twinkle 2.1s ease-in-out infinite 1.2s; }
  .gb-star-5 { top: 50%; left: 5%; animation: gb-star-twinkle 2.5s ease-in-out infinite 0.2s; }
  .gb-star-6 { top: 50%; right: 5%; animation: gb-star-twinkle 1.9s ease-in-out infinite 0.6s; }

  /* === FLOATING PARTICLES === */
  .gb-particles {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .gb-particle {
    position: absolute;
    width: 3px;
    height: 3px;
    background: white;
    border-radius: 50%;
    opacity: 0;
  }

  .gb-particle-1 { top: 50%; left: 50%; animation: gb-particle-burst 3s ease-out infinite 0s; --angle: 0deg; --dist: 120px; }
  .gb-particle-2 { top: 50%; left: 50%; animation: gb-particle-burst 3s ease-out infinite 0.25s; --angle: 45deg; --dist: 100px; }
  .gb-particle-3 { top: 50%; left: 50%; animation: gb-particle-burst 3s ease-out infinite 0.5s; --angle: 90deg; --dist: 110px; }
  .gb-particle-4 { top: 50%; left: 50%; animation: gb-particle-burst 3s ease-out infinite 0.75s; --angle: 135deg; --dist: 95px; }
  .gb-particle-5 { top: 50%; left: 50%; animation: gb-particle-burst 3s ease-out infinite 1s; --angle: 180deg; --dist: 115px; }
  .gb-particle-6 { top: 50%; left: 50%; animation: gb-particle-burst 3s ease-out infinite 1.25s; --angle: 225deg; --dist: 105px; }
  .gb-particle-7 { top: 50%; left: 50%; animation: gb-particle-burst 3s ease-out infinite 1.5s; --angle: 270deg; --dist: 120px; }
  .gb-particle-8 { top: 50%; left: 50%; animation: gb-particle-burst 3s ease-out infinite 1.75s; --angle: 315deg; --dist: 100px; }

  /* === KEYFRAME ANIMATIONS === */
  @keyframes gb-entrance {
    0% { transform: scale(0); opacity: 0; filter: blur(20px); }
    50% { filter: blur(0); }
    100% { transform: scale(1); opacity: 1; filter: blur(0); }
  }

  @keyframes gb-logo-glow {
    0%, 100% {
      filter: brightness(0) invert(1)
              drop-shadow(0 0 15px rgba(var(--gb-glow-rgb), 0.8))
              drop-shadow(0 0 30px rgba(var(--gb-glow-rgb), 0.5))
              drop-shadow(0 0 45px rgba(var(--gb-accent-rgb), 0.3));
    }
    50% {
      filter: brightness(0) invert(1)
              drop-shadow(0 0 25px rgba(var(--gb-glow-rgb), 1))
              drop-shadow(0 0 50px rgba(var(--gb-glow-rgb), 0.7))
              drop-shadow(0 0 75px rgba(var(--gb-accent-rgb), 0.5));
    }
  }

  @keyframes gb-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes gb-spin-reverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }

  @keyframes gb-ripple-expand {
    0% { transform: scale(1); opacity: 0.6; border-color: var(--gb-glow); }
    100% { transform: scale(4); opacity: 0; border-color: var(--gb-accent); }
  }

  @keyframes gb-star-twinkle {
    0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
  }

  @keyframes gb-particle-burst {
    0% {
      opacity: 1;
      transform: rotate(var(--angle)) translateX(30px) scale(1);
      box-shadow: 0 0 6px var(--gb-glow), 0 0 12px var(--gb-glow);
    }
    100% {
      opacity: 0;
      transform: rotate(var(--angle)) translateX(var(--dist)) scale(0);
      box-shadow: 0 0 2px var(--gb-glow);
    }
  }

  @keyframes gb-rays-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes gb-lens-pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }

  /* === REDUCED MOTION (ACCESSIBILITY) === */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
</style>`;
  }

  /**
   * Get inline HTML to embed in <body>
   * Pure HTML - renders instantly without JS
   * Includes: light rays, lens flare, orbital rings, sparkles, particles, logo
   */
  static getInlineHTML(config: GameSplashConfig = {}): string {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // SVG for 4-pointed star
    const starSvg = '<svg viewBox="0 0 24 24"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>';

    return `
<div id="gamebyte-splash">
  <!-- Ambient light rays -->
  <div class="gb-light-rays"></div>

  <!-- Lens flare glow -->
  <div class="gb-lens-flare"></div>

  <div class="gamebyte-logo-wrapper">
    <!-- Orbital rings -->
    <div class="gb-orbit gb-orbit-1">
      <div class="gb-orbit-dot"></div>
    </div>
    <div class="gb-orbit gb-orbit-2"></div>
    <div class="gb-orbit gb-orbit-3"></div>

    <!-- Energy ripples -->
    <div class="gb-ripple gb-ripple-1"></div>
    <div class="gb-ripple gb-ripple-2"></div>
    <div class="gb-ripple gb-ripple-3"></div>

    <!-- 4-pointed star sparkles -->
    <div class="gb-sparkles">
      <div class="gb-star gb-star-1">${starSvg}</div>
      <div class="gb-star gb-star-2">${starSvg}</div>
      <div class="gb-star gb-star-3">${starSvg}</div>
      <div class="gb-star gb-star-4">${starSvg}</div>
      <div class="gb-star gb-star-5">${starSvg}</div>
      <div class="gb-star gb-star-6">${starSvg}</div>
    </div>

    <!-- Floating particles -->
    <div class="gb-particles">
      <div class="gb-particle gb-particle-1"></div>
      <div class="gb-particle gb-particle-2"></div>
      <div class="gb-particle gb-particle-3"></div>
      <div class="gb-particle gb-particle-4"></div>
      <div class="gb-particle gb-particle-5"></div>
      <div class="gb-particle gb-particle-6"></div>
      <div class="gb-particle gb-particle-7"></div>
      <div class="gb-particle gb-particle-8"></div>
    </div>

    <!-- Logo -->
    <div class="gamebyte-logo">
      <img src="${/^(https?:\/\/|\/|\.\.?\/)/.test(cfg.logoUrl) ? cfg.logoUrl.replace(/["<>]/g, '') : '/img/logo-icon.svg'}" alt="GameByte" />
    </div>
  </div>
</div>`;
  }

  /**
   * Get complete inline code (CSS + HTML) for embedding
   */
  static getInlineCode(config: GameSplashConfig = {}): { css: string; html: string } {
    return {
      css: GameSplash.getInlineCSS(config),
      html: GameSplash.getInlineHTML(config)
    };
  }
}

export default GameSplash;
