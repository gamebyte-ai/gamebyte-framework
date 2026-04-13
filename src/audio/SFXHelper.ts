/**
 * SFXHelper — Minimal one-shot sound player with pitch variation.
 * Uses Web Audio API directly. SSR-safe.
 */
export class SFXHelper {
  private static _ctx: AudioContext | null = null;
  private static _buffers = new Map<string, AudioBuffer>();

  private static _getContext(): AudioContext {
    if (!SFXHelper._ctx) {
      SFXHelper._ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return SFXHelper._ctx;
  }

  /** Preload a sound from URL */
  static async load(id: string, url: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const ctx = SFXHelper._getContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    SFXHelper._buffers.set(id, audioBuffer);
  }

  /** Play a one-shot sound with optional pitch variation */
  static play(id: string, options?: {
    volume?: number;
    pitchMin?: number;
    pitchMax?: number;
  }): void {
    const buffer = SFXHelper._buffers.get(id);
    if (!buffer || !SFXHelper._ctx) return;

    const ctx = SFXHelper._ctx;
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Pitch variation
    const pMin = options?.pitchMin ?? 0.9;
    const pMax = options?.pitchMax ?? 1.1;
    source.playbackRate.value = pMin + Math.random() * (pMax - pMin);

    // Volume
    if (options?.volume !== undefined && options.volume < 1) {
      const gain = ctx.createGain();
      gain.gain.value = options.volume;
      source.connect(gain);
      gain.connect(ctx.destination);
    } else {
      source.connect(ctx.destination);
    }

    source.start(0);
  }

  /** Check if a sound is loaded */
  static has(id: string): boolean {
    return SFXHelper._buffers.has(id);
  }

  /** Unload a sound */
  static unload(id: string): void {
    SFXHelper._buffers.delete(id);
  }
}
