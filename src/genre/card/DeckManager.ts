/**
 * DeckManager - Deck, hand, draw pile, discard pile management.
 * Uses Fisher-Yates shuffle. Auto-reshuffles discard when draw pile is empty.
 * No rendering imports — pure logic.
 */

import { EventEmitter } from 'eventemitter3';

export interface CardDef {
  id: string;
  name: string;
  type?: string;
  cost?: number;
  [key: string]: unknown;
}

export interface DeckManagerEvents {
  'card-drawn': (card: CardDef) => void;
  'card-played': (card: CardDef) => void;
  'card-discarded': (card: CardDef) => void;
  'deck-empty': () => void;
  'hand-full': () => void;
  'shuffle': () => void;
}

export class DeckManager extends EventEmitter<DeckManagerEvents> {
  private _drawPile: CardDef[];
  private _hand: CardDef[];
  private _discardPile: CardDef[];
  private _maxHandSize: number;

  constructor(config: { maxHandSize?: number } = {}) {
    super();
    this._drawPile = [];
    this._hand = [];
    this._discardPile = [];
    this._maxHandSize = config.maxHandSize ?? 7;
  }

  /** Add cards to the draw pile */
  addToDeck(cards: CardDef[]): void {
    for (const card of cards) {
      this._drawPile.push(card);
    }
  }

  /** Shuffle the draw pile using Fisher-Yates */
  shuffle(): void {
    const arr = this._drawPile;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this.emit('shuffle');
  }

  /** Draw N cards from draw pile into hand */
  draw(count = 1): CardDef[] {
    const drawn: CardDef[] = [];
    for (let i = 0; i < count; i++) {
      if (this._hand.length >= this._maxHandSize) {
        this.emit('hand-full');
        break;
      }

      if (this._drawPile.length === 0) {
        if (this._discardPile.length === 0) {
          this.emit('deck-empty');
          break;
        }
        this.reshuffleDiscard();
        if (this._drawPile.length === 0) {
          this.emit('deck-empty');
          break;
        }
      }

      const card = this._drawPile.pop()!;
      this._hand.push(card);
      drawn.push(card);
      this.emit('card-drawn', card);
    }
    return drawn;
  }

  /** Play a card from hand (removes it, does NOT discard) */
  play(cardId: string): CardDef | null {
    const idx = this._hand.findIndex(c => c.id === cardId);
    if (idx === -1) return null;
    const [card] = this._hand.splice(idx, 1);
    this.emit('card-played', card);
    return card;
  }

  /** Discard a card from hand to discard pile */
  discard(cardId: string): CardDef | null {
    const idx = this._hand.findIndex(c => c.id === cardId);
    if (idx === -1) return null;
    const [card] = this._hand.splice(idx, 1);
    this._discardPile.push(card);
    this.emit('card-discarded', card);
    return card;
  }

  /** Discard the entire hand */
  discardHand(): void {
    while (this._hand.length > 0) {
      const card = this._hand.pop()!;
      this._discardPile.push(card);
      this.emit('card-discarded', card);
    }
  }

  /** Shuffle discard pile back into the draw pile */
  reshuffleDiscard(): void {
    this._drawPile.push(...this._discardPile);
    this._discardPile = [];
    this.shuffle();
  }

  /** Current hand (read-only copy) */
  get hand(): CardDef[] {
    return [...this._hand];
  }

  /** Number of cards in the draw pile */
  get drawPileCount(): number {
    return this._drawPile.length;
  }

  /** Number of cards in the discard pile */
  get discardPileCount(): number {
    return this._discardPile.length;
  }

  /** Reset all piles and hand */
  reset(): void {
    this._drawPile = [];
    this._hand = [];
    this._discardPile = [];
  }
}
