import { EventEmitter } from 'eventemitter3';
import { IContainer, IDisplayObject } from '../../contracts/Graphics.js';
import { ConfettiSystem, ConfettiConfig } from './ConfettiSystem.js';
import { ShineEffect, ShimmerConfig, SparkleConfig, ShimmerInstance } from './ShineEffect.js';

/**
 * Celebration configuration
 */
export interface CelebrationConfig {
  /** Enable confetti - Default: true */
  confetti?: boolean;
  /** Enable sound (if audio manager provided) - Default: true */
  sound?: boolean;
  /** Enable sparkle effects - Default: true */
  sparkle?: boolean;
}

/**
 * Preset configurations for different celebration types
 */
export const CelebrationPresets = {
  /** Victory screen celebration */
  VICTORY: {
    confetti: {
      particleCount: 80,
      duration: 3000,
      colors: [0xFFD700, 0x4CAF50, 0x6BCB77, 0xFFFFFF, 0xFFF8DC],
    },
    sparkle: {
      particleCount: 12,
      radius: 40,
    },
  },

  /** Defeat screen - no celebration */
  DEFEAT: {
    confetti: null,
    sparkle: null,
  },

  /** Star earned */
  STAR_EARNED: {
    confetti: {
      particleCount: 25,
      duration: 1500,
      spread: 45,
      colors: [0xFFD700, 0xFFF8DC, 0xFFEC8B, 0xFFFFFF],
    },
    sparkle: {
      particleCount: 8,
      colors: [0xFFD700, 0xFFFFFF],
      radius: 25,
    },
  },

  /** Level complete */
  LEVEL_COMPLETE: {
    confetti: {
      particleCount: 60,
      duration: 2500,
      colors: [0x4CAF50, 0x6BCB77, 0xFFD700, 0xFFFFFF],
    },
    sparkle: {
      particleCount: 10,
    },
  },

  /** Reward received */
  REWARD: {
    confetti: {
      particleCount: 35,
      duration: 2000,
      spread: 50,
      colors: [0xFFD700, 0x9C27B0, 0x00BCD4, 0xFFFFFF],
    },
    sparkle: {
      particleCount: 10,
      colors: [0xFFD700, 0xFFFFFF, 0x9C27B0],
    },
  },

  /** Jackpot/bonus */
  JACKPOT: {
    confetti: {
      particleCount: 100,
      duration: 3500,
      colors: [0xFFD700, 0xFFA500, 0xFFEC8B, 0xFFFFFF, 0xFF69B4],
    },
    sparkle: {
      particleCount: 16,
      radius: 50,
      colors: [0xFFD700, 0xFFFFFF],
    },
  },

  /** Coin/gold shimmer */
  GOLD_SHIMMER: {
    width: 15,
    angle: -30,
    speed: 2000,
    color: 0xFFFFFF,
    alpha: 0.5,
    loopDelay: 1500,
  },

  /** Gem shimmer */
  GEM_SHIMMER: {
    width: 12,
    angle: -25,
    speed: 1800,
    color: 0xFFFFFF,
    alpha: 0.4,
    loopDelay: 2000,
  },

  /** Star shimmer */
  STAR_SHIMMER: {
    width: 18,
    angle: -35,
    speed: 2200,
    color: 0xFFF8DC,
    alpha: 0.45,
    loopDelay: 1200,
  },
};

/**
 * Audio manager interface (optional integration)
 */
export interface ICelebrationAudioManager {
  playSound?(soundId: string): void;
}

/**
 * CelebrationManager - Orchestrates celebration effects
 *
 * Provides a simple API for triggering celebrations with
 * confetti and sparkle effects combined.
 *
 * @example
 * ```typescript
 * const celebration = new CelebrationManager(stage);
 *
 * // Victory celebration
 * celebration.victory();
 *
 * // Star earned at specific position
 * celebration.starEarned(starX, starY, 1);
 *
 * // Add shimmer to valuable items
 * celebration.addShimmer(coinIcon, 'gold');
 *
 * // Update in game loop
 * game.on('update', (dt) => celebration.update(dt));
 * ```
 */
export class CelebrationManager extends EventEmitter {
  private container: IContainer;
  private confetti: ConfettiSystem;
  private shine: ShineEffect;
  private audioManager?: ICelebrationAudioManager;
  private shimmerInstances: Map<IDisplayObject, ShimmerInstance> = new Map();

  constructor(
    container: IContainer,
    screenWidth: number = 360,
    screenHeight: number = 640,
    audioManager?: ICelebrationAudioManager
  ) {
    super();
    this.container = container;
    this.audioManager = audioManager;

    this.confetti = new ConfettiSystem(container, screenWidth, screenHeight);
    this.shine = new ShineEffect(container);

    // Forward events
    this.confetti.on('complete', () => this.emit('confetti-complete'));
    this.shine.on('sparkle-complete', (data) => this.emit('sparkle-complete', data));
  }

  /**
   * Victory celebration
   * - Confetti rain from top
   * - Sound effect (if audio manager provided)
   */
  public victory(config: CelebrationConfig = {}): void {
    const { confetti = true, sound = true } = config;

    if (confetti && CelebrationPresets.VICTORY.confetti) {
      this.confetti.rain(CelebrationPresets.VICTORY.confetti);
    }

    if (sound) {
      this.playSound('victory');
    }

    this.emit('victory');
  }

  /**
   * Defeat - no celebration by default
   */
  public defeat(config: CelebrationConfig = {}): void {
    const { sound = true } = config;

    if (sound) {
      this.playSound('defeat');
    }

    this.emit('defeat');
  }

  /**
   * Star earned celebration
   * - Confetti burst from star position
   * - Sparkle effect
   * - Sound effect
   *
   * @param x Star X position
   * @param y Star Y position
   * @param starIndex Which star (1, 2, or 3) - affects intensity
   */
  public async starEarned(
    x: number,
    y: number,
    starIndex: 1 | 2 | 3,
    config: CelebrationConfig = {}
  ): Promise<void> {
    const { confetti = true, sparkle = true, sound = true } = config;

    // Adjust particle count based on star index
    const preset = { ...CelebrationPresets.STAR_EARNED };
    if (preset.confetti) {
      preset.confetti = {
        ...preset.confetti,
        particleCount: preset.confetti.particleCount + (starIndex - 1) * 10,
      };
    }

    if (confetti && preset.confetti) {
      this.confetti.burst(x, y, preset.confetti);
    }

    if (sparkle && preset.sparkle) {
      await this.shine.sparkle(x, y, preset.sparkle);
    }

    if (sound) {
      this.playSound(`star_${starIndex}`);
    }

    this.emit('star-earned', { x, y, starIndex });
  }

  /**
   * Level complete celebration
   * - Confetti rain
   * - Sound effect
   */
  public levelComplete(config: CelebrationConfig = {}): void {
    const { confetti = true, sound = true } = config;

    if (confetti && CelebrationPresets.LEVEL_COMPLETE.confetti) {
      this.confetti.rain(CelebrationPresets.LEVEL_COMPLETE.confetti);
    }

    if (sound) {
      this.playSound('level_complete');
    }

    this.emit('level-complete');
  }

  /**
   * Reward received celebration
   * - Confetti burst from reward position
   * - Sparkle effect
   * - Sound effect
   */
  public async rewardReceived(x: number, y: number, config: CelebrationConfig = {}): Promise<void> {
    const { confetti = true, sparkle = true, sound = true } = config;

    if (confetti && CelebrationPresets.REWARD.confetti) {
      this.confetti.burst(x, y, CelebrationPresets.REWARD.confetti);
    }

    if (sparkle && CelebrationPresets.REWARD.sparkle) {
      await this.shine.sparkle(x, y, CelebrationPresets.REWARD.sparkle);
    }

    if (sound) {
      this.playSound('reward');
    }

    this.emit('reward-received', { x, y });
  }

  /**
   * Jackpot/bonus celebration
   * - Confetti fountain from position
   * - Extra sparkles
   * - Sound effect
   */
  public async jackpot(x: number, y: number, config: CelebrationConfig = {}): Promise<void> {
    const { confetti = true, sparkle = true, sound = true } = config;

    if (confetti && CelebrationPresets.JACKPOT.confetti) {
      this.confetti.fountain(x, y, CelebrationPresets.JACKPOT.confetti);
    }

    if (sparkle && CelebrationPresets.JACKPOT.sparkle) {
      // Multiple sparkle bursts
      await this.shine.sparkle(x, y, CelebrationPresets.JACKPOT.sparkle);
      setTimeout(() => {
        this.shine.sparkle(x - 20, y - 20, CelebrationPresets.JACKPOT.sparkle);
      }, 100);
      setTimeout(() => {
        this.shine.sparkle(x + 20, y - 20, CelebrationPresets.JACKPOT.sparkle);
      }, 200);
    }

    if (sound) {
      this.playSound('jackpot');
    }

    this.emit('jackpot', { x, y });
  }

  /**
   * Add shimmer effect to a valuable item
   *
   * @param target Display object to add shimmer to
   * @param type Type of shimmer preset ('gold', 'gem', 'star') or custom config
   */
  public addShimmer(
    target: IDisplayObject,
    type: 'gold' | 'gem' | 'star' | ShimmerConfig = 'gold'
  ): ShimmerInstance {
    // Remove existing shimmer on this target
    this.removeShimmer(target);

    let config: ShimmerConfig;

    if (typeof type === 'string') {
      switch (type) {
        case 'gold':
          config = CelebrationPresets.GOLD_SHIMMER;
          break;
        case 'gem':
          config = CelebrationPresets.GEM_SHIMMER;
          break;
        case 'star':
          config = CelebrationPresets.STAR_SHIMMER;
          break;
        default:
          config = CelebrationPresets.GOLD_SHIMMER;
      }
    } else {
      config = type;
    }

    const instance = this.shine.shimmer(target, config);
    this.shimmerInstances.set(target, instance);

    this.emit('shimmer-added', target);
    return instance;
  }

  /**
   * Remove shimmer from a target
   */
  public removeShimmer(target: IDisplayObject): void {
    const instance = this.shimmerInstances.get(target);
    if (instance) {
      instance.stop();
      this.shimmerInstances.delete(target);
      this.emit('shimmer-removed', target);
    }
  }

  /**
   * Trigger sparkle effect at a point
   */
  public async sparkle(x: number, y: number, config?: SparkleConfig): Promise<void> {
    await this.shine.sparkle(x, y, config);
  }

  /**
   * Trigger confetti rain
   */
  public confettiRain(config?: ConfettiConfig): void {
    this.confetti.rain(config);
  }

  /**
   * Trigger confetti burst
   */
  public confettiBurst(x: number, y: number, config?: ConfettiConfig): void {
    this.confetti.burst(x, y, config);
  }

  /**
   * Trigger confetti fountain
   */
  public confettiFountain(x: number, y: number, config?: ConfettiConfig): void {
    this.confetti.fountain(x, y, config);
  }

  /**
   * Play sound effect (if audio manager provided)
   */
  private playSound(soundId: string): void {
    if (this.audioManager?.playSound) {
      try {
        this.audioManager.playSound(soundId);
      } catch {
        // Ignore audio errors
      }
    }
  }

  /**
   * Update all effects - call every frame
   */
  public update(deltaTime: number): void {
    this.confetti.update(deltaTime);
    this.shine.update(deltaTime);
  }

  /**
   * Resize the system
   */
  public resize(width: number, height: number): void {
    this.confetti.resize(width, height);
  }

  /**
   * Clear all active effects
   */
  public clear(): void {
    this.confetti.clear();
    this.shine.clear();

    // Clear shimmer instances
    for (const [target] of this.shimmerInstances) {
      this.removeShimmer(target);
    }

    this.emit('cleared');
  }

  /**
   * Destroy the manager
   */
  public destroy(): void {
    this.clear();
    this.confetti.destroy();
    this.shine.destroy();
    this.removeAllListeners();
  }
}
