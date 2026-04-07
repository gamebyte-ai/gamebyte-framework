/**
 * TurnEngine - Simple turn-based state machine.
 * Manages participant turns and round counting.
 * No rendering imports — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface TurnEngineEvents {
  'turn-start': (turnOwner: string) => void;
  'turn-end': (turnOwner: string) => void;
  'round-start': (roundNumber: number) => void;
  'round-end': (roundNumber: number) => void;
}

export class TurnEngine extends EventEmitter<TurnEngineEvents> {
  private _participants: string[];
  private _currentIndex: number;
  private _round: number;
  private _started: boolean;

  constructor(participants: string[]) {
    super();
    if (participants.length === 0) throw new Error('TurnEngine requires at least one participant');
    this._participants = [...participants];
    this._currentIndex = 0;
    this._round = 0;
    this._started = false;
  }

  /** Start the game: round 1, first participant's turn */
  start(): void {
    this._currentIndex = 0;
    this._round = 1;
    this._started = true;
    this.emit('round-start', this._round);
    this.emit('turn-start', this._participants[this._currentIndex]);
  }

  /** End current turn and advance to next participant */
  endTurn(): void {
    if (!this._started) return;

    const current = this._participants[this._currentIndex];
    this.emit('turn-end', current);

    this._currentIndex++;

    // Check if we completed a round
    if (this._currentIndex >= this._participants.length) {
      this.emit('round-end', this._round);
      this._currentIndex = 0;
      this._round++;
      this.emit('round-start', this._round);
    }

    this.emit('turn-start', this._participants[this._currentIndex]);
  }

  /** Who's turn is it currently? */
  get currentTurn(): string {
    return this._participants[this._currentIndex];
  }

  /** Current round number (0 if not started) */
  get round(): number {
    return this._round;
  }

  /** Check if it's a specific participant's turn */
  isTurn(participant: string): boolean {
    return this._participants[this._currentIndex] === participant;
  }

  /** Reset to initial state */
  reset(): void {
    this._currentIndex = 0;
    this._round = 0;
    this._started = false;
  }
}
