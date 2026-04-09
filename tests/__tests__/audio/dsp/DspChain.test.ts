/**
 * Tests for the DSP effects chain system.
 *
 * Web Audio API is not available in jsdom, so we provide lightweight mocks
 * for all AudioNode types used by the DSP module.
 */

// ---------------------------------------------------------------------------
// Mock Web Audio API
// ---------------------------------------------------------------------------

class MockAudioParam {
  value = 0;
  setValueAtTime = jest.fn().mockReturnThis();
  linearRampToValueAtTime = jest.fn().mockReturnThis();
}

class MockAudioNode {
  connect = jest.fn();
  disconnect = jest.fn();
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockBiquadFilterNode extends MockAudioNode {
  type: BiquadFilterType = 'lowpass';
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
  gain = new MockAudioParam();
}

class MockDelayNode extends MockAudioNode {
  delayTime = new MockAudioParam();
}

class MockDynamicsCompressorNode extends MockAudioNode {
  threshold = new MockAudioParam();
  ratio = new MockAudioParam();
  attack = new MockAudioParam();
  release = new MockAudioParam();
  knee = new MockAudioParam();
}

class MockWaveShaperNode extends MockAudioNode {
  oversample: OverSampleType = '4x';
  curve: Float32Array | null = null;
}

class MockConvolverNode extends MockAudioNode {
  buffer: AudioBuffer | null = null;
}

class MockAudioBuffer {
  sampleRate = 44100;
  length = 44100;
  numberOfChannels = 2;
  getChannelData = jest.fn().mockReturnValue(new Float32Array(44100));
}

class MockAudioContext {
  sampleRate = 44100;
  currentTime = 0;

  createGain = jest.fn(() => new MockGainNode());
  createBiquadFilter = jest.fn(() => new MockBiquadFilterNode());
  createDelay = jest.fn(() => new MockDelayNode());
  createDynamicsCompressor = jest.fn(() => new MockDynamicsCompressorNode());
  createWaveShaper = jest.fn(() => new MockWaveShaperNode());
  createConvolver = jest.fn(() => new MockConvolverNode());
  createBuffer = jest.fn((_ch: number, length: number, _sr: number) => {
    const buf = new MockAudioBuffer();
    buf.length = length;
    return buf;
  });
}

// ---------------------------------------------------------------------------
// Imports (must come after mocks are defined in scope)
// ---------------------------------------------------------------------------

import { DspChain } from '../../../../src/audio/dsp/DspChain.js';
import { DspEffect } from '../../../../src/audio/dsp/DspEffect.js';
import { FilterEffect } from '../../../../src/audio/dsp/effects/FilterEffect.js';
import { DelayEffect } from '../../../../src/audio/dsp/effects/DelayEffect.js';
import { ReverbEffect } from '../../../../src/audio/dsp/effects/ReverbEffect.js';
import { DistortionEffect } from '../../../../src/audio/dsp/effects/DistortionEffect.js';
import { CompressorEffect } from '../../../../src/audio/dsp/effects/CompressorEffect.js';
import { DspPresets } from '../../../../src/audio/dsp/DspPresets.js';

function makeCtx(): AudioContext {
  return new MockAudioContext() as unknown as AudioContext;
}

// ---------------------------------------------------------------------------
// DspChain core
// ---------------------------------------------------------------------------

describe('DspChain', () => {
  test('creates distinct input and output GainNodes', () => {
    const ctx = makeCtx();
    const chain = new DspChain(ctx);
    expect(chain.input).toBeDefined();
    expect(chain.output).toBeDefined();
    expect(chain.input).not.toBe(chain.output);
  });

  test('input connects directly to output when no effects are added', () => {
    const ctx = makeCtx();
    const chain = new DspChain(ctx);
    const input = chain.input as unknown as MockGainNode;
    expect(input.connect).toHaveBeenCalledWith(chain.output);
  });

  test('addEffect inserts effect into the chain', () => {
    const ctx = makeCtx();
    const chain = new DspChain(ctx);
    const filter = new FilterEffect({ type: 'lowpass', frequency: 400 });
    chain.addEffect(filter);
    expect(chain.getEffects()).toHaveLength(1);
    expect(chain.getEffects()[0]).toBe(filter);
  });

  test('addEffect rewires: input → effect → output', () => {
    const ctx = makeCtx();
    const chain = new DspChain(ctx);
    const filter = new FilterEffect();
    chain.addEffect(filter);

    const input = chain.input as unknown as MockGainNode;
    // After rewire the chain input must connect to the effect's input node
    const lastConnectCall = input.connect.mock.calls[input.connect.mock.calls.length - 1];
    expect(lastConnectCall[0]).toBe(filter.input);
  });

  test('removeEffect disconnects effect and removes it from chain', () => {
    const ctx = makeCtx();
    const chain = new DspChain(ctx);
    const filter = new FilterEffect();
    chain.addEffect(filter);
    chain.removeEffect(filter);
    expect(chain.getEffects()).toHaveLength(0);
  });

  test('clearEffects removes all effects', () => {
    const ctx = makeCtx();
    const chain = new DspChain(ctx);
    chain.addEffect(new FilterEffect());
    chain.addEffect(new DelayEffect());
    chain.clearEffects();
    expect(chain.getEffects()).toHaveLength(0);
  });

  test('setInputGain sets gain on the input node', () => {
    const ctx = makeCtx();
    const chain = new DspChain(ctx);
    chain.setInputGain(0.5);
    const input = chain.input as unknown as MockGainNode;
    expect(input.gain.value).toBe(0.5);
  });

  test('setOutputGain sets gain on the output node', () => {
    const ctx = makeCtx();
    const chain = new DspChain(ctx);
    chain.setOutputGain(0.8);
    const output = chain.output as unknown as MockGainNode;
    expect(output.gain.value).toBe(0.8);
  });

  test('destroy disconnects input and output nodes', () => {
    const ctx = makeCtx();
    const chain = new DspChain(ctx);
    chain.addEffect(new FilterEffect());
    chain.destroy();
    const input = chain.input as unknown as MockGainNode;
    const output = chain.output as unknown as MockGainNode;
    expect(input.disconnect).toHaveBeenCalled();
    expect(output.disconnect).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Individual effects
// ---------------------------------------------------------------------------

describe('FilterEffect', () => {
  test('creates a BiquadFilterNode on init', () => {
    const ctx = makeCtx() as unknown as MockAudioContext;
    const chain = new DspChain(ctx as unknown as AudioContext);
    chain.addEffect(new FilterEffect({ type: 'lowpass', frequency: 400, Q: 2 }));
    expect(ctx.createBiquadFilter).toHaveBeenCalled();
  });

  test('setFrequency updates filter frequency value', () => {
    const ctx = makeCtx() as unknown as MockAudioContext;
    const chain = new DspChain(ctx as unknown as AudioContext);
    const filter = new FilterEffect({ frequency: 1000 });
    chain.addEffect(filter);
    filter.setFrequency(800);
    // The filter node's frequency.value should now be 800
    const filterNode = ctx.createBiquadFilter.mock.results[0]!.value as MockBiquadFilterNode;
    expect(filterNode.frequency.value).toBe(800);
  });
});

describe('DelayEffect', () => {
  test('creates a DelayNode on init', () => {
    const ctx = makeCtx() as unknown as MockAudioContext;
    const chain = new DspChain(ctx as unknown as AudioContext);
    chain.addEffect(new DelayEffect({ time: 0.3, feedback: 0.4 }));
    expect(ctx.createDelay).toHaveBeenCalled();
  });
});

describe('ReverbEffect', () => {
  test('creates a ConvolverNode on init', () => {
    const ctx = makeCtx() as unknown as MockAudioContext;
    const chain = new DspChain(ctx as unknown as AudioContext);
    chain.addEffect(new ReverbEffect({ wetMix: 0.3, dryMix: 0.7 }));
    expect(ctx.createConvolver).toHaveBeenCalled();
  });

  test('generateImpulse sets a buffer on the convolver', () => {
    const ctx = makeCtx() as unknown as MockAudioContext;
    const chain = new DspChain(ctx as unknown as AudioContext);
    const reverb = new ReverbEffect();
    chain.addEffect(reverb);
    reverb.generateImpulse(1.0, 0.5);
    const convolverNode = ctx.createConvolver.mock.results[0]!.value as MockConvolverNode;
    expect(convolverNode.buffer).not.toBeNull();
  });
});

describe('DistortionEffect', () => {
  test('creates a WaveShaperNode on init', () => {
    const ctx = makeCtx() as unknown as MockAudioContext;
    const chain = new DspChain(ctx as unknown as AudioContext);
    chain.addEffect(new DistortionEffect({ amount: 50 }));
    expect(ctx.createWaveShaper).toHaveBeenCalled();
  });
});

describe('CompressorEffect', () => {
  test('creates a DynamicsCompressorNode on init', () => {
    const ctx = makeCtx() as unknown as MockAudioContext;
    const chain = new DspChain(ctx as unknown as AudioContext);
    chain.addEffect(new CompressorEffect({ threshold: -24, ratio: 4 }));
    expect(ctx.createDynamicsCompressor).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// DspPresets
// ---------------------------------------------------------------------------

describe('DspPresets', () => {
  test('underwater returns a DspChain with one FilterEffect', () => {
    const ctx = makeCtx();
    const chain = DspPresets.underwater(ctx);
    expect(chain).toBeInstanceOf(DspChain);
    expect(chain.getEffects()).toHaveLength(1);
    expect(chain.getEffects()[0]).toBeInstanceOf(FilterEffect);
  });

  test('radio returns a DspChain with two effects (filter + distortion)', () => {
    const ctx = makeCtx();
    const chain = DspPresets.radio(ctx);
    expect(chain.getEffects()).toHaveLength(2);
    expect(chain.getEffects()[0]).toBeInstanceOf(FilterEffect);
    expect(chain.getEffects()[1]).toBeInstanceOf(DistortionEffect);
  });

  test('echo returns a DspChain with a DelayEffect', () => {
    const ctx = makeCtx();
    const chain = DspPresets.echo(ctx);
    expect(chain.getEffects()[0]).toBeInstanceOf(DelayEffect);
  });

  test('masterCompressor returns a DspChain with a CompressorEffect', () => {
    const ctx = makeCtx();
    const chain = DspPresets.masterCompressor(ctx);
    expect(chain.getEffects()[0]).toBeInstanceOf(CompressorEffect);
  });

  test('cave returns a DspChain with a ReverbEffect', () => {
    const ctx = makeCtx();
    const chain = DspPresets.cave(ctx);
    expect(chain.getEffects()[0]).toBeInstanceOf(ReverbEffect);
  });

  test('lofi returns a DspChain with two effects (distortion + filter)', () => {
    const ctx = makeCtx();
    const chain = DspPresets.lofi(ctx);
    expect(chain.getEffects()).toHaveLength(2);
    expect(chain.getEffects()[0]).toBeInstanceOf(DistortionEffect);
    expect(chain.getEffects()[1]).toBeInstanceOf(FilterEffect);
  });
});
