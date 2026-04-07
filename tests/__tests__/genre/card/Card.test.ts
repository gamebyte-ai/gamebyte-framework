import { DeckManager } from '../../../../src/genre/card/DeckManager';
import { TurnEngine } from '../../../../src/genre/card/TurnEngine';
import type { CardDef } from '../../../../src/genre/card/DeckManager';

function makeCards(count: number): CardDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `card_${i}`,
    name: `Card ${i}`,
    type: 'action',
    cost: i,
  }));
}

// ─── DeckManager ───────────────────────────────────────────────────────────

describe('DeckManager', () => {
  test('addToDeck increases drawPileCount', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(5));
    expect(deck.drawPileCount).toBe(5);
  });

  test('draw moves card from draw pile to hand', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(3));
    const drawn = deck.draw(1);
    expect(drawn).toHaveLength(1);
    expect(deck.hand).toHaveLength(1);
    expect(deck.drawPileCount).toBe(2);
  });

  test('draw multiple cards at once', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(10));
    deck.draw(5);
    expect(deck.hand).toHaveLength(5);
    expect(deck.drawPileCount).toBe(5);
  });

  test('play removes card from hand', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(3));
    const drawn = deck.draw(1);
    deck.play(drawn[0].id);
    expect(deck.hand).toHaveLength(0);
  });

  test('discard moves card to discard pile', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(3));
    const drawn = deck.draw(1);
    deck.discard(drawn[0].id);
    expect(deck.hand).toHaveLength(0);
    expect(deck.discardPileCount).toBe(1);
  });

  test('discardHand clears entire hand', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(5));
    deck.draw(5);
    deck.discardHand();
    expect(deck.hand).toHaveLength(0);
    expect(deck.discardPileCount).toBe(5);
  });

  test('reshuffleDiscard moves discard back to draw pile', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(5));
    deck.draw(5);
    deck.discardHand();
    expect(deck.discardPileCount).toBe(5);
    deck.reshuffleDiscard();
    expect(deck.drawPileCount).toBe(5);
    expect(deck.discardPileCount).toBe(0);
  });

  test('draw auto-reshuffles discard when draw pile empty', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(3));
    deck.draw(3);
    deck.discardHand();
    // Draw pile is empty, discard has 3 — drawing should auto-reshuffle
    const drawn = deck.draw(1);
    expect(drawn).toHaveLength(1);
  });

  test('reset clears all piles', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(5));
    deck.draw(3);
    deck.reset();
    expect(deck.drawPileCount).toBe(0);
    expect(deck.hand).toHaveLength(0);
    expect(deck.discardPileCount).toBe(0);
  });

  test('shuffle emits shuffle event', () => {
    const deck = new DeckManager();
    deck.addToDeck(makeCards(5));
    let shuffled = false;
    deck.on('shuffle', () => { shuffled = true; });
    deck.shuffle();
    expect(shuffled).toBe(true);
  });
});

// ─── TurnEngine ────────────────────────────────────────────────────────────

describe('TurnEngine', () => {
  test('start sets round 1 and first participant', () => {
    const engine = new TurnEngine(['player', 'enemy']);
    engine.start();
    expect(engine.round).toBe(1);
    expect(engine.currentTurn).toBe('player');
  });

  test('endTurn advances to next participant', () => {
    const engine = new TurnEngine(['player', 'enemy']);
    engine.start();
    engine.endTurn();
    expect(engine.currentTurn).toBe('enemy');
  });

  test('endTurn wraps around and increments round', () => {
    const engine = new TurnEngine(['player', 'enemy']);
    engine.start();
    engine.endTurn(); // enemy's turn
    engine.endTurn(); // round ends, back to player, round 2
    expect(engine.currentTurn).toBe('player');
    expect(engine.round).toBe(2);
  });

  test('isTurn returns correct boolean', () => {
    const engine = new TurnEngine(['player', 'enemy']);
    engine.start();
    expect(engine.isTurn('player')).toBe(true);
    expect(engine.isTurn('enemy')).toBe(false);
  });

  test('reset clears state', () => {
    const engine = new TurnEngine(['player', 'enemy']);
    engine.start();
    engine.endTurn();
    engine.reset();
    expect(engine.round).toBe(0);
  });

  test('round-start and round-end events fire correctly', () => {
    const events: string[] = [];
    const engine = new TurnEngine(['a', 'b']);
    engine.on('round-start', r => events.push(`round-start:${r}`));
    engine.on('round-end', r => events.push(`round-end:${r}`));
    engine.start();
    engine.endTurn(); // a->b
    engine.endTurn(); // b->a, round ends
    expect(events).toContain('round-start:1');
    expect(events).toContain('round-end:1');
    expect(events).toContain('round-start:2');
  });
});
