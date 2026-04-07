import { EventEmitter } from 'eventemitter3';
import { graphics } from '../graphics/GraphicsEngine.js';

export interface SettingsConfig {
  sound?: boolean;
  music?: boolean;
  vibration?: boolean;
  /** Custom toggle entries */
  custom?: Array<{ key: string; label: string; value: boolean }>;
}

export interface SettingsPanelEvents {
  'changed': (key: string, value: boolean) => void;
  'close': () => void;
}

const PANEL_W = 320;
const TOGGLE_H = 48;
const PADDING = 20;
const COLORS = { on: 0x4caf50, off: 0x555555, bg: 0x1a1a2e, overlay: 0x000000, text: 0xffffff, close: 0xff4444 };

/**
 * SettingsPanel - Simple modal with boolean toggles.
 * Self-contained: no external UI components needed.
 */
export class SettingsPanel extends EventEmitter<SettingsPanelEvents> {
  private _container: any;
  private _values: Record<string, boolean> = {};
  private _toggleGfx: Map<string, any> = new Map();
  private _entries: Array<{ key: string; label: string }> = [];

  constructor(config: SettingsConfig = {}) {
    super();
    this._values = {
      sound: config.sound ?? true,
      music: config.music ?? true,
      vibration: config.vibration ?? true,
    };
    this._entries = [
      { key: 'sound', label: 'Sound' },
      { key: 'music', label: 'Music' },
      { key: 'vibration', label: 'Vibration' },
    ];
    if (config.custom) {
      config.custom.forEach((c) => {
        this._values[c.key] = c.value;
        this._entries.push({ key: c.key, label: c.label });
      });
    }
    this._build();
  }

  private _build(): void {
    const f = graphics();
    this._container = f.createContainer();
    this._container.visible = false;

    const panelH = PADDING * 3 + this._entries.length * TOGGLE_H + 44;

    // Overlay
    const overlay = f.createGraphics();
    overlay.rect(0, 0, 2000, 2000).fill({ color: COLORS.overlay, alpha: 0.6 });
    overlay.eventMode = 'static';
    overlay.on('pointerdown', () => {});
    this._container.addChild(overlay);

    // Panel bg (centered at 0,0 — parent should position container)
    const px = -PANEL_W / 2;
    const py = -panelH / 2;
    const panel = f.createGraphics();
    panel.roundRect(px, py, PANEL_W, panelH, 12).fill({ color: COLORS.bg });
    this._container.addChild(panel);

    // Title
    const title = f.createText('Settings', { fontSize: 20, fill: COLORS.text, fontWeight: 'bold' });
    title.x = px + PADDING;
    title.y = py + PADDING;
    this._container.addChild(title);

    // Close button
    const closeBtn = f.createGraphics();
    closeBtn.roundRect(px + PANEL_W - 44, py + PADDING - 4, 36, 36, 8).fill({ color: COLORS.close });
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => { this.hide(); this.emit('close'); });
    this._container.addChild(closeBtn);

    // Toggles
    this._entries.forEach((entry, i) => {
      const rowY = py + PADDING + 44 + i * TOGGLE_H;

      const label = f.createText(entry.label, { fontSize: 16, fill: COLORS.text });
      label.x = px + PADDING;
      label.y = rowY + 10;
      this._container.addChild(label);

      const toggleBg = f.createGraphics();
      this._drawToggle(toggleBg, this._values[entry.key]);
      toggleBg.x = px + PANEL_W - PADDING - 52;
      toggleBg.y = rowY + 6;
      toggleBg.eventMode = 'static';
      toggleBg.cursor = 'pointer';
      toggleBg.on('pointerdown', () => this.set(entry.key, !this._values[entry.key]));
      this._container.addChild(toggleBg);
      this._toggleGfx.set(entry.key, toggleBg);
    });
  }

  private _drawToggle(gfx: any, on: boolean): void {
    gfx.clear();
    gfx.roundRect(0, 0, 52, 28, 14).fill({ color: on ? COLORS.on : COLORS.off });
    const knobX = on ? 28 : 4;
    gfx.circle(knobX + 10, 14, 10).fill({ color: 0xffffff });
  }

  getContainer(): any { return this._container; }

  show(): void { this._container.visible = true; }
  hide(): void { this._container.visible = false; }

  get(key: string): boolean { return this._values[key] ?? false; }

  set(key: string, value: boolean): void {
    this._values[key] = value;
    const gfx = this._toggleGfx.get(key);
    if (gfx) this._drawToggle(gfx, value);
    this.emit('changed', key, value);
  }

  getAll(): Record<string, boolean> { return { ...this._values }; }

  destroy(): void {
    this._container.destroy({ children: true });
    this._toggleGfx.clear();
    this.removeAllListeners();
  }
}
