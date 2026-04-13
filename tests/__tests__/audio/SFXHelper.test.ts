/**
 * Tests for SFXHelper — minimal one-shot Web Audio player.
 */

// Mock AudioContext before importing SFXHelper
const mockStart = jest.fn();
const mockConnect = jest.fn();
const mockGainConnect = jest.fn();
const mockDecodeAudioData = jest.fn();
const mockCreateBufferSource = jest.fn();
const mockCreateGain = jest.fn();

const mockDestination = {};

const mockGainNode = {
  gain: { value: 1 },
  connect: mockGainConnect,
};

const mockBufferSource = {
  buffer: null as AudioBuffer | null,
  playbackRate: { value: 1 },
  connect: mockConnect,
  start: mockStart,
};

const MockAudioContext = jest.fn().mockImplementation(() => ({
  createBufferSource: mockCreateBufferSource,
  createGain: mockCreateGain,
  decodeAudioData: mockDecodeAudioData,
  destination: mockDestination,
}));

// Inject into global before module load
(global as any).AudioContext = MockAudioContext;
(global as any).fetch = jest.fn();

import { SFXHelper } from '../../../src/audio/SFXHelper';

// Access private statics for reset between tests
function resetSFXHelper(): void {
  (SFXHelper as any)._ctx = null;
  (SFXHelper as any)._buffers = new Map();
}

describe('SFXHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSFXHelper();

    mockCreateBufferSource.mockReturnValue({ ...mockBufferSource });
    mockCreateGain.mockReturnValue({ ...mockGainNode });
  });

  describe('load', () => {
    it('stores the decoded audio buffer under the given id', async () => {
      const fakeBuffer = {} as AudioBuffer;
      const fakeArrayBuffer = new ArrayBuffer(8);

      (global.fetch as jest.Mock).mockResolvedValue({
        arrayBuffer: () => Promise.resolve(fakeArrayBuffer),
      });
      mockDecodeAudioData.mockResolvedValue(fakeBuffer);

      await SFXHelper.load('jump', '/sounds/jump.wav');

      expect(SFXHelper.has('jump')).toBe(true);
    });
  });

  describe('has', () => {
    it('returns false when sound is not loaded', () => {
      expect(SFXHelper.has('missing')).toBe(false);
    });

    it('returns true after loading a sound', async () => {
      const fakeBuffer = {} as AudioBuffer;
      (global.fetch as jest.Mock).mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });
      mockDecodeAudioData.mockResolvedValue(fakeBuffer);

      await SFXHelper.load('coin', '/sounds/coin.wav');
      expect(SFXHelper.has('coin')).toBe(true);
    });
  });

  describe('play', () => {
    async function loadSound(id: string): Promise<void> {
      const fakeBuffer = { duration: 0.5 } as AudioBuffer;
      (global.fetch as jest.Mock).mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });
      mockDecodeAudioData.mockResolvedValue(fakeBuffer);
      await SFXHelper.load(id, `/sounds/${id}.wav`);
    }

    it('creates a buffer source and calls start(0)', async () => {
      const source = { ...mockBufferSource, connect: mockConnect, start: mockStart };
      mockCreateBufferSource.mockReturnValue(source);

      await loadSound('hit');
      SFXHelper.play('hit');

      expect(mockCreateBufferSource).toHaveBeenCalled();
      expect(mockStart).toHaveBeenCalledWith(0);
    });

    it('applies pitch variation within pitchMin/pitchMax range', async () => {
      const source = { ...mockBufferSource, connect: mockConnect, start: mockStart };
      mockCreateBufferSource.mockReturnValue(source);

      await loadSound('pop');

      const pitchMin = 0.8;
      const pitchMax = 1.2;
      SFXHelper.play('pop', { pitchMin, pitchMax });

      expect(source.playbackRate.value).toBeGreaterThanOrEqual(pitchMin);
      expect(source.playbackRate.value).toBeLessThanOrEqual(pitchMax);
    });

    it('creates a gain node when volume is less than 1', async () => {
      const source = { ...mockBufferSource, connect: mockConnect, start: mockStart };
      const gain = { gain: { value: 1 }, connect: mockGainConnect };
      mockCreateBufferSource.mockReturnValue(source);
      mockCreateGain.mockReturnValue(gain);

      await loadSound('boom');
      SFXHelper.play('boom', { volume: 0.5 });

      expect(mockCreateGain).toHaveBeenCalled();
      expect(gain.gain.value).toBe(0.5);
      // source connects to gain, gain connects to destination
      expect(mockConnect).toHaveBeenCalledWith(gain);
      expect(mockGainConnect).toHaveBeenCalledWith(mockDestination);
    });

    it('connects directly to destination when no volume option given', async () => {
      const source = { ...mockBufferSource, connect: mockConnect, start: mockStart };
      mockCreateBufferSource.mockReturnValue(source);

      await loadSound('zap');
      SFXHelper.play('zap');

      expect(mockCreateGain).not.toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalledWith(mockDestination);
    });

    it('does nothing when sound id is not loaded', () => {
      SFXHelper.play('nonexistent');
      expect(mockCreateBufferSource).not.toHaveBeenCalled();
    });
  });

  describe('unload', () => {
    it('removes the buffer so has() returns false', async () => {
      const fakeBuffer = {} as AudioBuffer;
      (global.fetch as jest.Mock).mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });
      mockDecodeAudioData.mockResolvedValue(fakeBuffer);

      await SFXHelper.load('sfx', '/sounds/sfx.wav');
      expect(SFXHelper.has('sfx')).toBe(true);

      SFXHelper.unload('sfx');
      expect(SFXHelper.has('sfx')).toBe(false);
    });
  });
});
