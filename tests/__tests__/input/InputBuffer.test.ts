/**
 * Tests for InputBuffer — generic input buffering with coyote time.
 */
import { InputBuffer } from '../../../src/input/InputBuffer';

describe('InputBuffer', () => {
  let buf: InputBuffer;

  beforeEach(() => {
    buf = new InputBuffer({ bufferWindow: 100, coyoteTime: 150 });
  });

  describe('buffer / has', () => {
    it('stores an action after buffer() is called', () => {
      buf.buffer('jump');
      expect(buf.has('jump')).toBe(true);
    });

    it('returns false for an action that was never buffered', () => {
      expect(buf.has('attack')).toBe(false);
    });
  });

  describe('consume', () => {
    it('returns true and removes the action when it is buffered', () => {
      buf.buffer('jump');
      const result = buf.consume('jump');
      expect(result).toBe(true);
      expect(buf.has('jump')).toBe(false);
    });

    it('returns false when action is not buffered', () => {
      const result = buf.consume('jump');
      expect(result).toBe(false);
    });

    it('emits "consumed" event on successful consume', () => {
      const spy = jest.fn();
      buf.on('consumed', spy);
      buf.buffer('dash');
      buf.consume('dash');
      expect(spy).toHaveBeenCalledWith('dash');
    });
  });

  describe('update — action expiry', () => {
    it('expires buffered action after the bufferWindow elapses', () => {
      buf.buffer('jump');
      buf.update(101); // exceeds 100ms window
      expect(buf.has('jump')).toBe(false);
    });

    it('emits "expired" event when action window runs out', () => {
      const spy = jest.fn();
      buf.on('expired', spy);
      buf.buffer('jump');
      buf.update(101);
      expect(spy).toHaveBeenCalledWith('jump');
    });

    it('keeps action alive while within the bufferWindow', () => {
      buf.buffer('jump');
      buf.update(50);
      expect(buf.has('jump')).toBe(true);
    });
  });

  describe('coyote time', () => {
    it('canJump is true while grounded', () => {
      buf.setGrounded(true);
      expect(buf.canJump).toBe(true);
    });

    it('canJump is true immediately after leaving ground (coyote window active)', () => {
      buf.setGrounded(true);
      buf.setGrounded(false); // starts coyote timer
      expect(buf.canJump).toBe(true);
    });

    it('canJump remains true during coyote window', () => {
      buf.setGrounded(true);
      buf.setGrounded(false);
      buf.update(100); // within 150ms coyote time
      expect(buf.canJump).toBe(true);
    });

    it('canJump becomes false after coyote time expires', () => {
      buf.setGrounded(true);
      buf.setGrounded(false);
      buf.update(160); // exceeds 150ms coyote time
      expect(buf.canJump).toBe(false);
    });

    it('canJump is false when never grounded and coyote timer is zero', () => {
      // Default: not grounded, coyote timer = 0
      expect(buf.canJump).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all buffered actions', () => {
      buf.buffer('jump');
      buf.buffer('attack');
      buf.buffer('dash');
      buf.clear();
      expect(buf.has('jump')).toBe(false);
      expect(buf.has('attack')).toBe(false);
      expect(buf.has('dash')).toBe(false);
    });
  });
});
