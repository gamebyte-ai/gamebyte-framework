/**
 * @jest-environment jsdom
 */

import { AssetFallback } from '../../../src/assets/AssetFallback';

// ---- Helpers ---------------------------------------------------------------

const ok = <T>(value: T): (() => Promise<T>) => () => Promise.resolve(value);
const fail = (msg: string): (() => Promise<never>) => () => Promise.reject(new Error(msg));

// ---- Tests -----------------------------------------------------------------

describe('AssetFallback', () => {
  // 1. Successful load
  it('returns the real result on success', async () => {
    const fb = new AssetFallback();
    const result = await fb.load('tex-ok', ok({ id: 'tex' }), 'texture');
    expect(result).toEqual({ id: 'tex' });
  });

  // 2. Failed load returns placeholder
  it('returns a placeholder when the loader throws', async () => {
    const fb = new AssetFallback();
    const result = await fb.load('tex-fail', fail('network error'), 'texture');
    // Placeholder texture is an object (not null/undefined)
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('returns empty object placeholder for json type', async () => {
    const fb = new AssetFallback();
    const result = await fb.load('data-fail', fail('404'), 'json');
    expect(result).toEqual({});
  });

  // 3. isFallback tracking
  it('isFallback returns true only for failed assets', async () => {
    const fb = new AssetFallback();
    await fb.load('good', ok('data'), 'other');
    await fb.load('bad', fail('error'), 'other');

    expect(fb.isFallback('good')).toBe(false);
    expect(fb.isFallback('bad')).toBe(true);
  });

  // 4. Stats tracking
  it('tracks loaded and fallback counts in stats', async () => {
    const fb = new AssetFallback();
    await fb.load('a', ok(1), 'json');
    await fb.load('b', ok(2), 'json');
    await fb.load('c', fail('err'), 'json');

    expect(fb.stats.loaded).toBe(2);
    expect(fb.stats.fallbacks).toBe(1);
    expect(fb.stats.total).toBe(3);
  });

  // 5. onFail callback fires
  it('calls onFail callback with id and error when a load fails', async () => {
    const onFail = jest.fn();
    const fb = new AssetFallback({ onFail });

    await fb.load('broken', fail('timeout'), 'audio');

    expect(onFail).toHaveBeenCalledTimes(1);
    expect(onFail.mock.calls[0][0]).toBe('broken');
    expect(onFail.mock.calls[0][1]).toBeInstanceOf(Error);
    expect((onFail.mock.calls[0][1] as Error).message).toBe('timeout');
  });

  // 6. getFallbackIds
  it('getFallbackIds returns correct list of failed asset IDs', async () => {
    const fb = new AssetFallback();
    await fb.load('ok1', ok(1), 'json');
    await fb.load('fail1', fail('e'), 'json');
    await fb.load('fail2', fail('e'), 'json');

    const ids = fb.getFallbackIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('fail1');
    expect(ids).toContain('fail2');
    expect(ids).not.toContain('ok1');
  });

  // 7. Event emission
  it('emits "fallback" event on failure', async () => {
    const fb = new AssetFallback();
    const handler = jest.fn();
    fb.on('fallback', handler);

    await fb.load('img', fail('not found'), 'texture');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBe('img');
  });

  // 8. destroy resets state
  it('destroy resets stats and fallback IDs', async () => {
    const fb = new AssetFallback();
    await fb.load('x', fail('e'), 'json');

    expect(fb.stats.total).toBe(1);
    expect(fb.getFallbackIds()).toHaveLength(1);

    fb.destroy();

    expect(fb.stats.total).toBe(0);
    expect(fb.getFallbackIds()).toHaveLength(0);
  });
});
