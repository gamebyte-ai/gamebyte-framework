import { EventEmitter } from 'eventemitter3';
import { graphics } from '../graphics/GraphicsEngine.js';

export type SettingsFieldType = 'boolean' | 'number';

export interface SettingsFieldDef {
  key: string;
  label: string;
  type: SettingsFieldType;
  defaultValue: boolean | number;
  /** For number fields (default: 0) */
  min?: number;
  /** For number fields (default: 1) */
  max?: number;
  /** For number fields (default: 0.1) */
  step?: number;
}

export interface SettingsConfig {
  /** Pre-defined toggle fields */
  sound?: boolean;
  music?: boolean;
  vibration?: boolean;
  /** Custom fields (boolean or number) */
  fields?: SettingsFieldDef[];
  /**
   * @deprecated Use `fields` instead. Legacy boolean-only custom entries.
   */
  custom?: Array<{ key: string; label: string; value: boolean }>;
  /** Auto-persist to localStorage with this key prefix */
  persistKey?: string;
}

export interface SettingsPanelEvents {
  'changed': (key: string, value: boolean | number) => void;
  'close': () => void;
}

const PANEL_W = 320;
const TOGGLE_H = 48;
const PADDING = 20;
const SLIDER_W = 120;
const COLORS = { on: 0x4caf50, off: 0x555555, bg: 0x1a1a2e, overlay: 0x000000, text: 0xffffff, close: 0xff4444 };

/**
 * SettingsPanel - Simple modal with boolean toggles and number sliders.
 * Self-contained: no external UI components needed.
 * Supports auto-persistence via localStorage.
 */
export class SettingsPanel extends EventEmitter<SettingsPanelEvents> {
  private _container: any;
  private _values: Record<string, boolean | number> = {};
  private _toggleGfx: Map<string, any> = new Map();
  private _sliderData: Map<string, { fill: any; knob: any; min: number; max: number; step: number }> = new Map();
  private _entries: Array<{ key: string; label: string }> = [];
  private _fieldDefs: Map<string, SettingsFieldDef> = new Map();
  private _persistKey: string | undefined;

  constructor(config: SettingsConfig = {}) {
    super();
    this._persistKey = config.persistKey;

    // Built-in boolean fields
    const builtins: SettingsFieldDef[] = [
      { key: 'sound', label: 'Sound', type: 'boolean', defaultValue: config.sound ?? true },
      { key: 'music', label: 'Music', type: 'boolean', defaultValue: config.music ?? true },
      { key: 'vibration', label: 'Vibration', type: 'boolean', defaultValue: config.vibration ?? true },
    ];

    builtins.forEach((def) => {
      this._fieldDefs.set(def.key, def);
      this._values[def.key] = this._loadPersisted(def.key, def.defaultValue);
      this._entries.push({ key: def.key, label: def.label });
    });

    // Legacy custom boolean entries
    if (config.custom) {
      config.custom.forEach((c) => {
        const def: SettingsFieldDef = { key: c.key, label: c.label, type: 'boolean', defaultValue: c.value };
        this._fieldDefs.set(c.key, def);
        this._values[c.key] = this._loadPersisted(c.key, c.value);
        this._entries.push({ key: c.key, label: c.label });
      });
    }

    // New typed fields
    if (config.fields) {
      config.fields.forEach((def) => {
        this._fieldDefs.set(def.key, def);
        this._values[def.key] = this._loadPersisted(def.key, def.defaultValue);
        this._entries.push({ key: def.key, label: def.label });
      });
    }

    this._build();
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  private _persist(key: string, value: boolean | number): void {
    if (!this._persistKey) return;
    try {
      localStorage.setItem(`${this._persistKey}:${key}`, JSON.stringify(value));
    } catch { /* quota exceeded or unavailable */ }
  }

  private _loadPersisted(key: string, defaultValue: boolean | number): boolean | number {
    if (!this._persistKey) return defaultValue;
    try {
      const stored = localStorage.getItem(`${this._persistKey}:${key}`);
      if (stored !== null) return JSON.parse(stored);
    } catch { /* parse error */ }
    return defaultValue;
  }

  // ---------------------------------------------------------------------------
  // Build UI
  // ---------------------------------------------------------------------------

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

    // Field rows
    this._entries.forEach((entry, i) => {
      const def = this._fieldDefs.get(entry.key);
      const rowY = py + PADDING + 44 + i * TOGGLE_H;

      const label = f.createText(entry.label, { fontSize: 16, fill: COLORS.text });
      label.x = px + PADDING;
      label.y = rowY + 10;
      this._container.addChild(label);

      if (!def || def.type === 'boolean') {
        this._buildToggle(f, entry.key, px, rowY);
      } else {
        this._buildSlider(f, entry.key, def, px, rowY);
      }
    });
  }

  private _buildToggle(f: any, key: string, px: number, rowY: number): void {
    const toggleBg = f.createGraphics();
    this._drawToggle(toggleBg, this._values[key] as boolean);
    toggleBg.x = px + PANEL_W - PADDING - 52;
    toggleBg.y = rowY + 6;
    toggleBg.eventMode = 'static';
    toggleBg.cursor = 'pointer';
    toggleBg.on('pointerdown', () => this.set(key, !this._values[key]));
    this._container.addChild(toggleBg);
    this._toggleGfx.set(key, toggleBg);
  }

  private _buildSlider(f: any, key: string, def: SettingsFieldDef, px: number, rowY: number): void {
    const min = def.min ?? 0;
    const max = def.max ?? 1;
    const value = this._values[key] as number;
    const ratio = (value - min) / (max - min);
    const fillWidth = Math.max(0, ratio * SLIDER_W);
    const knobX = fillWidth;

    const sliderX = px + PANEL_W - PADDING - SLIDER_W;
    const sliderY = rowY + 16;

    // Background track
    const track = f.createGraphics();
    track.roundRect(0, 0, SLIDER_W, 8, 4).fill({ color: COLORS.off });
    track.x = sliderX;
    track.y = sliderY;
    this._container.addChild(track);

    // Filled track
    const fill = f.createGraphics();
    this._drawSliderFill(fill, fillWidth);
    fill.x = sliderX;
    fill.y = sliderY;
    this._container.addChild(fill);

    // Knob
    const knob = f.createGraphics();
    knob.circle(0, 4, 10).fill({ color: 0xffffff });
    knob.x = sliderX + knobX;
    knob.y = sliderY;
    knob.eventMode = 'static';
    knob.cursor = 'pointer';

    let dragging = false;
    let startX = 0;
    let startVal = value;

    knob.on('pointerdown', (e: any) => {
      dragging = true;
      startX = e.global?.x ?? e.clientX ?? 0;
      startVal = this._values[key] as number;
    });

    knob.on('pointermove', (e: any) => {
      if (!dragging) return;
      const currentX = e.global?.x ?? e.clientX ?? 0;
      const delta = currentX - startX;
      const range = max - min;
      const newVal = startVal + (delta / SLIDER_W) * range;
      this.set(key, newVal);
    });

    const stopDrag = () => { dragging = false; };
    knob.on('pointerup', stopDrag);
    knob.on('pointerupoutside', stopDrag);

    this._container.addChild(knob);

    this._sliderData.set(key, { fill, knob, min, max, step: def.step ?? 0.1 });
  }

  private _drawToggle(gfx: any, on: boolean): void {
    gfx.clear();
    gfx.roundRect(0, 0, 52, 28, 14).fill({ color: on ? COLORS.on : COLORS.off });
    const knobX = on ? 28 : 4;
    gfx.circle(knobX + 10, 14, 10).fill({ color: 0xffffff });
  }

  private _drawSliderFill(fill: any, fillWidth: number): void {
    fill.clear();
    if (fillWidth > 0) {
      fill.roundRect(0, 0, fillWidth, 8, 4).fill({ color: COLORS.on });
    }
  }

  private _updateFieldVisual(key: string, value: boolean | number): void {
    const toggleGfx = this._toggleGfx.get(key);
    if (toggleGfx) {
      this._drawToggle(toggleGfx, value as boolean);
      return;
    }

    const slider = this._sliderData.get(key);
    if (slider) {
      const { fill, knob, min, max } = slider;
      const ratio = (value as number - min) / (max - min);
      const fillWidth = Math.max(0, Math.min(SLIDER_W, ratio * SLIDER_W));
      this._drawSliderFill(fill, fillWidth);
      knob.x = fill.x + fillWidth;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  getContainer(): any { return this._container; }

  show(): void { this._container.visible = true; }
  hide(): void { this._container.visible = false; }

  get(key: string): boolean | number {
    return this._values[key] ?? false;
  }

  set(key: string, value: boolean | number): void {
    const field = this._fieldDefs.get(key);
    if (field && field.type === 'number') {
      const min = field.min ?? 0;
      const max = field.max ?? 1;
      const step = field.step ?? 0.1;
      value = Math.max(min, Math.min(max, value as number));
      if (step > 0) value = Math.round((value as number) / step) * step;
    }
    this._values[key] = value;
    this._persist(key, value);
    this._updateFieldVisual(key, value);
    this.emit('changed', key, value);
  }

  getAll(): Record<string, boolean | number> { return { ...this._values }; }

  destroy(): void {
    this._container.destroy({ children: true });
    this._toggleGfx.clear();
    this._sliderData.clear();
    this.removeAllListeners();
  }
}
