import { Tween } from '../tween/Tween.js';
import { Ease } from '../tween/Ease.js';
import { graphics } from '../graphics/GraphicsEngine.js';

export interface RewardFlyConfig {
  parent: any;
  from: { x: number; y: number };
  to: { x: number; y: number };
  count?: number;
  duration?: number;
  stagger?: number;
  size?: number;
  color?: number;
  onEachArrive?: () => void;
  onComplete?: () => void;
}

/**
 * RewardFly - Coins/items fly from source to target with stagger and arc.
 * Static API: RewardFly.play(config).
 */
export class RewardFly {
  static play(config: RewardFlyConfig): void {
    const {
      parent,
      from,
      to,
      count = 8,
      duration = 600,
      stagger = 50,
      size = 16,
      color = 0xffd700,
      onEachArrive,
      onComplete,
    } = config;

    const f = graphics();
    let arrived = 0;

    for (let i = 0; i < count; i++) {
      // Slight random scatter at source
      const scatter = size * 1.5;
      const startX = from.x + (Math.random() - 0.5) * scatter;
      const startY = from.y + (Math.random() - 0.5) * scatter;

      const particle = f.createGraphics();
      particle.circle(0, 0, size / 2).fill({ color });
      particle.x = startX;
      particle.y = startY;
      parent.addChild(particle);

      // Arc: midpoint Y offset creates a curve upward
      const midX = (startX + to.x) / 2;
      const midY = Math.min(startY, to.y) - 80 - Math.random() * 40;

      const delay = i * stagger;
      const proxy = { t: 0 };

      Tween.to(proxy, { t: 1 }, {
        duration,
        delay,
        ease: Ease.cubicOut,
        onUpdate: (progress: number) => {
          // Quadratic bezier: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
          const inv = 1 - progress;
          particle.x = inv * inv * startX + 2 * inv * progress * midX + progress * progress * to.x;
          particle.y = inv * inv * startY + 2 * inv * progress * midY + progress * progress * to.y;
          particle.alpha = progress < 0.8 ? 1 : 1 - (progress - 0.8) / 0.2;
        },
        onComplete: () => {
          parent.removeChild(particle);
          particle.destroy();
          arrived++;
          if (onEachArrive) onEachArrive();
          if (arrived === count && onComplete) onComplete();
        },
      });
    }
  }
}
