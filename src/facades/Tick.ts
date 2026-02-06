import { Facade } from './Facade.js';
import { TickSystem } from '../tick/TickSystem.js';
import { TickState, TickSubscriptionHandle, TickSubscribeOptions } from '../contracts/Tick.js';

/**
 * Static Tick facade for component-level render loop participation.
 *
 * @example
 * ```typescript
 * import { Tick } from 'gamebyte-framework';
 *
 * // Simple subscription
 * Tick.subscribe(({ delta }) => player.move(delta));
 *
 * // Priority ordering (lower runs first)
 * Tick.subscribe(updatePhysics, -10);
 * Tick.subscribe(updateAnimation, 0);
 * Tick.subscribe(updateParticles, 10);
 *
 * // Fixed timestep for physics
 * Tick.subscribe(physicsStep, -10, { fixedStep: 1/60 });
 *
 * // One-shot
 * Tick.runOnce(({ elapsed }) => console.log('Time:', elapsed));
 * ```
 */
export class Tick extends Facade {
  protected static getFacadeAccessor(): string {
    return 'tick';
  }

  private static getSystem(): TickSystem {
    return this.resolve<TickSystem>();
  }

  static subscribe(
    callback: (state: TickState) => void,
    priority = 0,
    options?: TickSubscribeOptions
  ): TickSubscriptionHandle {
    return this.getSystem().subscribe(callback, priority, options);
  }

  static unsubscribe(handle: TickSubscriptionHandle): void {
    this.getSystem().unsubscribe(handle);
  }

  static runOnce(callback: (state: TickState) => void): void {
    this.getSystem().runOnce(callback);
  }

  static getState(): Readonly<TickState> {
    return this.getSystem().getState();
  }

  static getSubscriberCount(): number {
    return this.getSystem().getSubscriberCount();
  }

  static pause(): void {
    this.getSystem().pause();
  }

  static resume(): void {
    this.getSystem().resume();
  }
}
