/**
 * HybridHUD — Pre-built 2D HUD configurations for hybrid 3D+2D games.
 *
 * Renders on top of the 3D scene using the Pixi.js overlay layer.
 * Uses the graphics() abstraction so it works with any Pixi factory.
 *
 * @example
 * ```typescript
 * import { HybridHUD } from 'gamebyte-framework/hybrid';
 *
 * const hud = new HybridHUD(game.hud, game.width, game.height);
 *
 * hud.addTopBar({
 *   score: { initial: 0 },
 *   lives: { initial: 3, max: 5 },
 *   coins: { initial: 0 },
 * });
 *
 * hud.addBottomBar({
 *   buttons: [
 *     { id: 'pause', label: 'Pause', onClick: () => pauseGame() },
 *   ],
 * });
 *
 * // Later, update a value
 * hud.setValue('score', 1500);
 *
 * // Show a temporary center message
 * hud.showMessage('WAVE 1', { duration: 2000 });
 * ```
 */

import { EventEmitter } from 'eventemitter3';
import { graphics } from '../graphics/GraphicsEngine.js';

// ---------------------------------------------------------------------------
// Config interfaces
// ---------------------------------------------------------------------------

export interface TopBarConfig {
  /** Score display */
  score?: { label?: string; initial?: number };
  /** Lives / health display */
  lives?: { label?: string; initial?: number; max?: number };
  /** Currency display */
  coins?: { label?: string; initial?: number; icon?: string };
  /** Countdown / count-up timer */
  timer?: { label?: string; seconds?: number; countDown?: boolean };
  /** Arbitrary extra text fields */
  custom?: Array<{ key: string; label: string; value: string | number }>;
}

export interface BottomBarConfig {
  buttons: Array<{
    id: string;
    label: string;
    icon?: string;
    onClick?: () => void;
  }>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const TOP_BAR_HEIGHT = 48;
const BOTTOM_BAR_HEIGHT = 60;
const BAR_ALPHA = 0.75;
const BAR_COLOR = 0x000000;
const TEXT_COLOR = 0xffffff;
const BUTTON_COLOR = 0x333344;
const BUTTON_HOVER_COLOR = 0x555566;
const FONT_FAMILY = 'Arial, sans-serif';
const FONT_SIZE_LABEL = 12;
const FONT_SIZE_VALUE = 18;
const FONT_SIZE_BUTTON = 16;
const PADDING = 12;
const ELEMENT_SPACING = 80;

// ---------------------------------------------------------------------------
// HybridHUD
// ---------------------------------------------------------------------------

export class HybridHUD extends EventEmitter {
  private _hudContainer: any; // IContainer (Pixi stage root)
  private _elements: Map<string, any> = new Map(); // key → IText
  private _containers: Map<string, any> = new Map(); // key → IContainer
  private _width: number;
  private _height: number;

  /**
   * @param hudContainer - The root Pixi container (e.g. game.hud)
   * @param width        - Viewport width in px
   * @param height       - Viewport height in px
   */
  constructor(hudContainer: any, width: number, height: number) {
    super();
    this._hudContainer = hudContainer;
    this._width = width;
    this._height = height;
  }

  // ---------------------------------------------------------------------------
  // Top bar
  // ---------------------------------------------------------------------------

  /**
   * Add a semi-transparent status bar at the top of the screen.
   * Each config field becomes a labelled text element.
   */
  addTopBar(config: TopBarConfig): void {
    const factory = graphics();

    // Background bar
    const bg = factory.createGraphics();
    bg.rect(0, 0, this._width, TOP_BAR_HEIGHT).fill({ color: BAR_COLOR, alpha: BAR_ALPHA });

    const topContainer = factory.createContainer();
    topContainer.addChild(bg as any);

    let xCursor = PADDING;

    const addField = (key: string, labelText: string, valueText: string) => {
      const labelGfx = factory.createText(labelText, {
        fontSize: FONT_SIZE_LABEL,
        fill: 0xaaaaaa,
        fontFamily: FONT_FAMILY,
      });
      labelGfx.x = xCursor;
      labelGfx.y = 4;

      const valueGfx = factory.createText(valueText, {
        fontSize: FONT_SIZE_VALUE,
        fill: TEXT_COLOR,
        fontFamily: FONT_FAMILY,
        fontWeight: 'bold',
      });
      valueGfx.x = xCursor;
      valueGfx.y = 18;

      topContainer.addChild(labelGfx as any);
      topContainer.addChild(valueGfx as any);

      // Store value element for later updates
      this._elements.set(key, valueGfx);

      xCursor += ELEMENT_SPACING;
    };

    if (config.score !== undefined) {
      addField('score', config.score.label ?? 'SCORE', String(config.score.initial ?? 0));
    }

    if (config.lives !== undefined) {
      const max = config.lives.max;
      const initial = config.lives.initial ?? 3;
      const display = max !== undefined ? `${initial}/${max}` : String(initial);
      addField('lives', config.lives.label ?? 'LIVES', display);
    }

    if (config.coins !== undefined) {
      addField('coins', config.coins.label ?? 'COINS', String(config.coins.initial ?? 0));
    }

    if (config.timer !== undefined) {
      addField('timer', config.timer.label ?? 'TIME', String(config.timer.seconds ?? 0));
    }

    if (config.custom) {
      for (const field of config.custom) {
        addField(field.key, field.label, String(field.value));
      }
    }

    this._hudContainer?.addChild(topContainer);
    this._containers.set('topBar', topContainer);
  }

  // ---------------------------------------------------------------------------
  // Bottom bar
  // ---------------------------------------------------------------------------

  /**
   * Add a button bar anchored to the bottom of the screen.
   */
  addBottomBar(config: BottomBarConfig): void {
    const factory = graphics();

    const bg = factory.createGraphics();
    bg.rect(0, 0, this._width, BOTTOM_BAR_HEIGHT).fill({ color: BAR_COLOR, alpha: BAR_ALPHA });

    const bottomContainer = factory.createContainer();
    bottomContainer.y = this._height - BOTTOM_BAR_HEIGHT;
    bottomContainer.addChild(bg as any);

    const btnCount = config.buttons.length;
    const btnWidth = 100;
    const totalWidth = btnCount * btnWidth + (btnCount - 1) * PADDING;
    let btnX = (this._width - totalWidth) / 2;

    for (const btnCfg of config.buttons) {
      const btnContainer = factory.createContainer();
      btnContainer.x = btnX;
      btnContainer.y = 8;

      // Background
      const btnBg = factory.createGraphics();
      btnBg.roundRect(0, 0, btnWidth, BOTTOM_BAR_HEIGHT - 16, 6).fill({ color: BUTTON_COLOR });

      // Label
      const btnLabel = factory.createText(btnCfg.label, {
        fontSize: FONT_SIZE_BUTTON,
        fill: TEXT_COLOR,
        fontFamily: FONT_FAMILY,
      });
      btnLabel.x = btnWidth / 2 - (btnCfg.label.length * FONT_SIZE_BUTTON * 0.3);
      btnLabel.y = (BOTTOM_BAR_HEIGHT - 16) / 2 - FONT_SIZE_BUTTON / 2;

      btnContainer.addChild(btnBg as any);
      btnContainer.addChild(btnLabel as any);

      // Enable Pixi pointer events (v8 eventMode, v7 interactive, or any object with .on())
      const pixi = btnContainer as any;
      // Set interactive flags when the container supports them
      if ('eventMode' in pixi) {
        pixi.eventMode = 'static';
      } else if ('interactive' in pixi) {
        pixi.interactive = true;
      }
      if ('cursor' in pixi) {
        pixi.cursor = 'pointer';
      }

      // Wire pointer callbacks whenever the container has an .on() method
      if (typeof pixi.on === 'function') {
        pixi.on('pointerover', () => {
          btnBg.clear();
          btnBg.roundRect(0, 0, btnWidth, BOTTOM_BAR_HEIGHT - 16, 6).fill({ color: BUTTON_HOVER_COLOR });
        });

        pixi.on('pointerout', () => {
          btnBg.clear();
          btnBg.roundRect(0, 0, btnWidth, BOTTOM_BAR_HEIGHT - 16, 6).fill({ color: BUTTON_COLOR });
        });

        pixi.on('pointerdown', () => {
          this.emit('button:click', btnCfg.id);
          btnCfg.onClick?.();
        });
      }

      bottomContainer.addChild(btnContainer);
      this._containers.set(`button:${btnCfg.id}`, btnContainer);

      btnX += btnWidth + PADDING;
    }

    this._hudContainer?.addChild(bottomContainer);
    this._containers.set('bottomBar', bottomContainer);
  }

  // ---------------------------------------------------------------------------
  // Value updates
  // ---------------------------------------------------------------------------

  /**
   * Update any labelled value in the top bar.
   * @param key   - The field key ('score', 'lives', 'coins', 'timer', or custom key)
   * @param value - New value to display
   */
  setValue(key: string, value: string | number): void {
    const el = this._elements.get(key);
    if (!el) return;

    const text = String(value);
    // Support both Pixi v7 (el.text) and Pixi v8 (el.text)
    if ('text' in el) {
      el.text = text;
    }
  }

  // ---------------------------------------------------------------------------
  // Center message
  // ---------------------------------------------------------------------------

  /**
   * Display a centered message that auto-removes after `duration` ms.
   *
   * @param text   - Message to show (e.g. "WAVE 1", "GAME OVER")
   * @param config - Optional: duration (ms), fontSize, color
   */
  showMessage(
    text: string,
    config: { duration?: number; fontSize?: number; color?: number } = {}
  ): void {
    const factory = graphics();
    const duration = config.duration ?? 2000;
    const fontSize = config.fontSize ?? 48;
    const color = config.color ?? 0xffffff;

    const msgText = factory.createText(text, {
      fontSize,
      fill: color,
      fontFamily: FONT_FAMILY,
      fontWeight: 'bold',
      align: 'center',
    });

    // Approximate centre — exact bounds depend on Pixi internals
    const estimatedWidth = text.length * fontSize * 0.6;
    msgText.x = (this._width - estimatedWidth) / 2;
    msgText.y = (this._height - fontSize) / 2;

    this._hudContainer?.addChild(msgText as any);

    // Auto-remove after duration
    setTimeout(() => {
      this._hudContainer?.removeChild(msgText as any);
    }, duration);
  }

  // ---------------------------------------------------------------------------
  // Visibility
  // ---------------------------------------------------------------------------

  /**
   * Show or hide the entire HUD (affects all added bars and elements).
   */
  setVisible(visible: boolean): void {
    for (const [, container] of this._containers) {
      if (container && typeof container.visible !== 'undefined') {
        container.visible = visible;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Remove all HUD elements and release resources.
   */
  destroy(): void {
    for (const [, container] of this._containers) {
      this._hudContainer?.removeChild(container);
    }
    this._containers.clear();
    this._elements.clear();
    this.removeAllListeners();
  }
}
