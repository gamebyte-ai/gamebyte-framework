import { Tween } from '../tween/Tween.js';
import { Ease } from '../tween/Ease.js';
import { graphics } from '../graphics/GraphicsEngine.js';

export interface ToastConfig {
  text: string;
  duration?: number;
  type?: 'info' | 'success' | 'warning' | 'error';
  y?: number;
}

const TYPE_COLORS: Record<string, number> = {
  info: 0xffffff,
  success: 0x4caf50,
  warning: 0xffc107,
  error: 0xf44336,
};

const PADDING_X = 20;
const PADDING_Y = 10;

/**
 * Toast - Auto-dismissing notification overlay.
 * Static API: Toast.show(parent, config).
 */
export class Toast {
  /** Show a toast notification on the given parent container */
  static show(parent: any, config: ToastConfig | string): void {
    const cfg: ToastConfig = typeof config === 'string' ? { text: config } : config;
    const duration = cfg.duration ?? 2000;
    const type = cfg.type ?? 'info';
    const yPos = cfg.y ?? 80;
    const bgColor = TYPE_COLORS[type] ?? TYPE_COLORS.info;

    const f = graphics();
    const container = f.createContainer();

    // Measure text first, then draw bg
    const label = f.createText(cfg.text, {
      fontSize: 15,
      fill: type === 'info' ? 0x222222 : 0xffffff,
      fontWeight: '600',
    });

    const textW = (label as any).width ?? cfg.text.length * 9;
    const textH = (label as any).height ?? 20;
    const bgW = textW + PADDING_X * 2;
    const bgH = textH + PADDING_Y * 2;

    const bg = f.createGraphics();
    bg.roundRect(-bgW / 2, 0, bgW, bgH, bgH / 2).fill({ color: bgColor });
    container.addChild(bg);

    label.x = -textW / 2;
    label.y = PADDING_Y;
    container.addChild(label);

    container.y = yPos;
    container.alpha = 0;
    parent.addChild(container);

    // Fade in
    Tween.to(container, { alpha: 1 }, {
      duration: 200,
      ease: Ease.quadOut,
      onComplete: () => {
        // Wait then fade out
        Tween.delay(duration).on('complete', () => {
          Tween.to(container, { alpha: 0 }, {
            duration: 300,
            ease: Ease.quadIn,
            onComplete: () => {
              try { parent.removeChild(container); } catch (_) { /* already removed */ }
              container.destroy({ children: true });
            },
          });
        });
      },
    });
  }
}
