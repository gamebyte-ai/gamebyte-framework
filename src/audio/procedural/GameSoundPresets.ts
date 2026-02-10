/**
 * Procedural game sound presets - zero audio files required.
 *
 * Each preset creates sounds using Web Audio API oscillators + gain envelopes.
 * Inspired by exported game SoundEffects patterns.
 *
 * Performance:
 * - Lazy AudioContext initialization (browser autoplay policy)
 * - Concurrency limiter (max 4 on mobile, 8 on desktop)
 * - Scheduling 50ms ahead to avoid clicks/pops
 */
import type { GameSoundType, GameSoundConfig } from '../../contracts/Audio.js';
import { Logger } from '../../utils/Logger.js';

type PresetGenerator = (ctx: AudioContext, dest: AudioNode, config: Required<GameSoundConfig>) => void;

/**
 * Procedural game sound library.
 * All sounds generated via oscillators - no audio files needed.
 */
export class GameSoundPresets {
  private ctx: AudioContext | null = null;
  private presets: Map<string, PresetGenerator> = new Map();
  private activeSounds = 0;
  private maxConcurrent: number;

  constructor() {
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
    this.maxConcurrent = isMobile ? 4 : 8;
    this.registerBuiltinPresets();
  }

  /**
   * Play a procedural sound preset.
   */
  play(type: GameSoundType | string, config?: GameSoundConfig): void {
    if (this.activeSounds >= this.maxConcurrent) return;

    const generator = this.presets.get(type);
    if (!generator) {
      Logger.warn('Audio', `GameSoundPresets: unknown preset '${type}'`);
      return;
    }

    // Lazy AudioContext init
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }

    // Resume if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const resolved: Required<GameSoundConfig> = {
      volume: config?.volume ?? 0.3,
      pitch: config?.pitch ?? 1.0,
      duration: config?.duration ?? 0,
      variation: config?.variation ?? 0
    };

    // Apply random variation to pitch
    if (resolved.variation > 0) {
      const range = resolved.variation * 0.4; // max ±20% pitch shift at variation=1
      resolved.pitch *= 1 + (Math.random() * range * 2 - range);
    }

    this.activeSounds++;
    try {
      generator(this.ctx, this.ctx.destination, resolved);
    } catch {
      // Silently fail if audio context is in bad state
    }

    // Auto-decrement after max reasonable duration
    const timeout = Math.max((resolved.duration || 2) * 1000, 100);
    setTimeout(() => { this.activeSounds = Math.max(0, this.activeSounds - 1); }, timeout);
  }

  /**
   * Register a custom sound preset.
   */
  register(name: string, generator: PresetGenerator): void {
    this.presets.set(name, generator);
  }

  /**
   * Get list of available preset names.
   */
  getPresets(): string[] {
    return Array.from(this.presets.keys());
  }

  /**
   * Destroy and clean up.
   */
  destroy(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.presets.clear();
    this.activeSounds = 0;
  }

  // ─── Built-in Presets ──────────────────────────

  private registerBuiltinPresets(): void {
    this.presets.set('click', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 * cfg.pitch, t);
      osc.frequency.exponentialRampToValueAtTime(400 * cfg.pitch, t + dur);
      gain.gain.setValueAtTime(cfg.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
    });

    this.presets.set('hit', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.15;
      // Impact oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200 * cfg.pitch, t);
      osc.frequency.exponentialRampToValueAtTime(60 * cfg.pitch, t + dur);
      gain.gain.setValueAtTime(cfg.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
      // Noise burst
      this.addNoiseBurst(ctx, dest, t, dur * 0.5, cfg.volume * 0.5);
    });

    this.presets.set('pickup', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 * cfg.pitch, t);
      osc.frequency.exponentialRampToValueAtTime(1200 * cfg.pitch, t + dur * 0.6);
      osc.frequency.exponentialRampToValueAtTime(800 * cfg.pitch, t + dur);
      gain.gain.setValueAtTime(cfg.volume, t);
      gain.gain.linearRampToValueAtTime(cfg.volume * 0.8, t + dur * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
    });

    this.presets.set('coin', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.25;
      // Two-tone ding
      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const freq = (i === 0 ? 988 : 1319) * cfg.pitch; // B5, E6
        const offset = i * 0.08;
        osc.frequency.setValueAtTime(freq, t + offset);
        gain.gain.setValueAtTime(cfg.volume, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
        osc.connect(gain).connect(dest);
        osc.start(t + offset);
        osc.stop(t + offset + dur);
      }
    });

    this.presets.set('jump', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150 * cfg.pitch, t);
      osc.frequency.exponentialRampToValueAtTime(600 * cfg.pitch, t + dur);
      gain.gain.setValueAtTime(cfg.volume * 0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
    });

    this.presets.set('land', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 * cfg.pitch, t);
      osc.frequency.exponentialRampToValueAtTime(80 * cfg.pitch, t + dur);
      gain.gain.setValueAtTime(cfg.volume * 0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
      this.addNoiseBurst(ctx, dest, t, dur * 0.3, cfg.volume * 0.3);
    });

    this.presets.set('explosion', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.6;
      // Low rumble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80 * cfg.pitch, t);
      osc.frequency.exponentialRampToValueAtTime(20 * cfg.pitch, t + dur);
      gain.gain.setValueAtTime(cfg.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
      // Noise component
      this.addNoiseBurst(ctx, dest, t, dur * 0.8, cfg.volume * 0.8);
    });

    this.presets.set('laser', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200 * cfg.pitch, t);
      osc.frequency.exponentialRampToValueAtTime(200 * cfg.pitch, t + dur);
      gain.gain.setValueAtTime(cfg.volume * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
    });

    this.presets.set('powerUp', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.5;
      // Rising arpeggio
      const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
      const noteDur = dur / notes.length;
      for (let i = 0; i < notes.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[i] * cfg.pitch, t + i * noteDur);
        gain.gain.setValueAtTime(cfg.volume, t + i * noteDur);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (i + 1) * noteDur);
        osc.connect(gain).connect(dest);
        osc.start(t + i * noteDur);
        osc.stop(t + (i + 1) * noteDur);
      }
    });

    this.presets.set('death', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.5;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400 * cfg.pitch, t);
      osc.frequency.exponentialRampToValueAtTime(50 * cfg.pitch, t + dur);
      gain.gain.setValueAtTime(cfg.volume * 0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
    });

    this.presets.set('error', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.3;
      // Two descending tones
      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        const freq = (i === 0 ? 400 : 300) * cfg.pitch;
        const offset = i * 0.12;
        osc.frequency.setValueAtTime(freq, t + offset);
        gain.gain.setValueAtTime(cfg.volume * 0.4, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur * 0.5);
        osc.connect(gain).connect(dest);
        osc.start(t + offset);
        osc.stop(t + offset + dur * 0.5);
      }
    });

    this.presets.set('success', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.4;
      // Major chord arpeggio
      const notes = [523, 659, 784]; // C5, E5, G5
      for (let i = 0; i < notes.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[i] * cfg.pitch, t + i * 0.06);
        gain.gain.setValueAtTime(cfg.volume, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain).connect(dest);
        osc.start(t + i * 0.06);
        osc.stop(t + dur);
      }
    });

    this.presets.set('whoosh', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.25;
      // Filtered noise sweep
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200 * cfg.pitch, t);
      filter.frequency.exponentialRampToValueAtTime(4000 * cfg.pitch, t + dur * 0.3);
      filter.frequency.exponentialRampToValueAtTime(200 * cfg.pitch, t + dur);
      filter.Q.value = 2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(cfg.volume * 0.5, t + dur * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      source.connect(filter).connect(gain).connect(dest);
      source.start(t);
      source.stop(t + dur);
    });

    this.presets.set('thrust', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.4;
      // Low noise with modulation
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60 * cfg.pitch, t);
      gain.gain.setValueAtTime(cfg.volume * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
      this.addNoiseBurst(ctx, dest, t, dur, cfg.volume * 0.3);
    });

    this.presets.set('nearMiss', (ctx, dest, cfg) => {
      const t = ctx.currentTime + 0.01;
      const dur = cfg.duration || 0.3;
      // Quick pitch sweep (Doppler-like)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 * cfg.pitch, t);
      osc.frequency.exponentialRampToValueAtTime(200 * cfg.pitch, t + dur);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(cfg.volume * 0.6, t + dur * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur);
    });
  }

  /**
   * Helper: add a white noise burst.
   */
  private addNoiseBurst(
    ctx: AudioContext,
    dest: AudioNode,
    startTime: number,
    duration: number,
    volume: number
  ): void {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    source.connect(gain).connect(dest);
    source.start(startTime);
    source.stop(startTime + duration);
  }
}
