import { EventEmitter } from 'eventemitter3';
import { graphics } from '../graphics/GraphicsEngine.js';

export interface TutorialStep {
  /** Text to display */
  text: string;
  /** Position for text bubble */
  x: number;
  y: number;
  /** Optional spotlight circle (dims everything except this area) */
  spotlight?: { x: number; y: number; radius: number };
  /** Which side to show text bubble: 'above' | 'below' */
  position?: 'above' | 'below';
}

export interface TutorialOptions {
  skipButton?: boolean;
  dimAlpha?: number;
}

export interface TutorialEvents {
  'step': (index: number) => void;
  'complete': () => void;
  'skip': () => void;
}

const BUBBLE_W = 260;
const BUBBLE_H = 72;
const COLORS = { dim: 0x000000, bubble: 0x1a1a2e, text: 0xffffff, skip: 0xaaaaaa, spotlight: 0xffffff };

/**
 * TutorialOverlay - Step-through tutorial with dim overlay and optional spotlight.
 * Tap anywhere to advance. Optional skip button in top-right corner.
 */
export class TutorialOverlay extends EventEmitter<TutorialEvents> {
  private _container: any;
  private _dimGfx: any;
  private _bubbleGfx: any;
  private _bubbleText: any;
  private _stepIndex: number = 0;
  private _steps: TutorialStep[];
  private _dimAlpha: number;

  constructor(steps: TutorialStep[], options: TutorialOptions = {}) {
    super();
    this._steps = steps;
    this._dimAlpha = options.dimAlpha ?? 0.7;
    this._build(options.skipButton ?? true);
  }

  private _build(showSkip: boolean): void {
    const f = graphics();
    this._container = f.createContainer();
    this._container.visible = false;

    // Dim overlay — tap to advance
    this._dimGfx = f.createGraphics();
    this._dimGfx.eventMode = 'static';
    this._dimGfx.on('pointerdown', () => this.next());
    this._container.addChild(this._dimGfx);

    // Text bubble
    this._bubbleGfx = f.createGraphics();
    this._container.addChild(this._bubbleGfx);

    this._bubbleText = f.createText('', { fontSize: 15, fill: COLORS.text, wordWrap: true, wordWrapWidth: BUBBLE_W - 24 });
    this._container.addChild(this._bubbleText);

    // Skip button
    if (showSkip) {
      const skipLabel = f.createText('Skip', { fontSize: 14, fill: COLORS.skip });
      skipLabel.x = -120;
      skipLabel.y = -300;
      skipLabel.eventMode = 'static';
      skipLabel.cursor = 'pointer';
      skipLabel.on('pointerdown', (e: any) => { e.stopPropagation?.(); this.skip(); });
      this._container.addChild(skipLabel);
    }
  }

  private _renderStep(step: TutorialStep): void {
    const f = graphics();

    // Redraw dim overlay
    this._dimGfx.clear();
    this._dimGfx.rect(-2000, -2000, 6000, 6000).fill({ color: COLORS.dim, alpha: this._dimAlpha });

    // Spotlight: clear a circle area by drawing a lighter circle
    if (step.spotlight) {
      const sp = step.spotlight;
      this._dimGfx.circle(sp.x, sp.y, sp.radius).fill({ color: COLORS.spotlight, alpha: 0.15 });
    }

    // Bubble position
    const above = (step.position ?? 'above') === 'above';
    const bubbleY = above ? step.y - BUBBLE_H - 12 : step.y + 12;
    const bubbleX = step.x - BUBBLE_W / 2;

    this._bubbleGfx.clear();
    this._bubbleGfx.roundRect(bubbleX, bubbleY, BUBBLE_W, BUBBLE_H, 10)
      .fill({ color: COLORS.bubble });

    this._bubbleText.text = step.text;
    this._bubbleText.x = bubbleX + 12;
    this._bubbleText.y = bubbleY + 12;
  }

  getContainer(): any { return this._container; }

  /** Start tutorial from step 0 */
  start(): void {
    this._stepIndex = 0;
    this._container.visible = true;
    if (this._steps.length > 0) {
      this._renderStep(this._steps[0]);
      this.emit('step', 0);
    } else {
      this._finish();
    }
  }

  /** Advance to next step */
  next(): void {
    this._stepIndex++;
    if (this._stepIndex >= this._steps.length) {
      this._finish();
    } else {
      this._renderStep(this._steps[this._stepIndex]);
      this.emit('step', this._stepIndex);
    }
  }

  private _finish(): void {
    this._container.visible = false;
    this.emit('complete');
  }

  /** Skip entire tutorial */
  skip(): void {
    this._container.visible = false;
    this.emit('skip');
  }

  get currentStep(): number { return this._stepIndex; }

  destroy(): void {
    this._container.destroy({ children: true });
    this.removeAllListeners();
  }
}
