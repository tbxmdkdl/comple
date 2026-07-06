import { describe, expect, it } from "vitest";
import { cards, startingDeckCardIds } from "../data";
import {
  createStartingDeck,
  discardCard,
  discardHand,
  drawCards,
  exhaustCard,
  reshuffleDiscardIntoDraw,
  shuffle,
} from "../game";
import type { CardZoneState, RandomSource } from "../game";

function sequenceRandom(values: number[]): RandomSource {
  let index = 0;

  return () => values[index++] ?? 0;
}

function createState(
  overrides: Partial<CardZoneState> = {},
): CardZoneState {
  return {
    drawPile: [],
    hand: [],
    discardPile: [],
    removedFromRun: [],
    ...overrides,
  };
}

describe("deck engine", () => {
  it("creates the starting deck from data card ids", () => {
    const state = createStartingDeck(startingDeckCardIds);

    expect(state.drawPile).toEqual(startingDeckCardIds);
    expect(state.hand).toEqual([]);
    expect(state.discardPile).toEqual([]);
    expect(state.removedFromRun).toEqual([]);
    expect(state.drawPile).not.toBe(startingDeckCardIds);
  });

  it("can shuffle the starting deck when requested", () => {
    const state = createStartingDeck(["a", "b", "c", "d"], {
      random: sequenceRandom([0.1, 0.7, 0.3]),
      shuffle: true,
    });

    expect(state.drawPile).toEqual(["b", "d", "c", "a"]);
  });

  it("uses only existing card ids in the starting deck", () => {
    const cardIds = new Set(cards.map((card) => card.id));

    for (const cardId of startingDeckCardIds) {
      expect(cardIds.has(cardId)).toBe(true);
    }
  });

  it("preserves duplicate card ids in the starting deck", () => {
    const riskScanCopies = startingDeckCardIds.filter(
      (cardId) => cardId === "risk-scan",
    );

    expect(riskScanCopies).toHaveLength(2);
  });

  it("shuffles deterministically when a random source is injected", () => {
    const original = ["a", "b", "c", "d"];
    const shuffled = shuffle(original, sequenceRandom([0.1, 0.7, 0.3]));

    expect(shuffled).toEqual(["b", "d", "c", "a"]);
    expect(original).toEqual(["a", "b", "c", "d"]);
  });

  it("draws cards from draw pile into hand", () => {
    const state = createState({
      drawPile: ["a", "b", "c"],
      hand: ["h"],
      discardPile: ["d"],
    });

    const result = drawCards(state, 2);

    expect(result.drawn).toEqual(["a", "b"]);
    expect(result.state.drawPile).toEqual(["c"]);
    expect(result.state.hand).toEqual(["h", "a", "b"]);
    expect(result.state.discardPile).toEqual(["d"]);
    expect(state.drawPile).toEqual(["a", "b", "c"]);
    expect(state.hand).toEqual(["h"]);
  });

  it("draws fewer cards than requested when no cards remain", () => {
    const result = drawCards(createState({ drawPile: ["a"] }), 3);

    expect(result.drawn).toEqual(["a"]);
    expect(result.state.hand).toEqual(["a"]);
    expect(result.state.drawPile).toEqual([]);
  });

  it("reshuffles discard into draw pile when drawing needs more cards", () => {
    const result = drawCards(
      createState({
        drawPile: ["a"],
        discardPile: ["b", "c"],
      }),
      3,
      { random: sequenceRandom([0.1]) },
    );

    expect(result.drawn).toEqual(["a", "c", "b"]);
    expect(result.state.hand).toEqual(["a", "c", "b"]);
    expect(result.state.drawPile).toEqual([]);
    expect(result.state.discardPile).toEqual([]);
  });

  it("moves discard pile into draw pile without mutating input", () => {
    const state = createState({
      drawPile: ["a"],
      hand: ["h"],
      discardPile: ["b", "c"],
      removedFromRun: ["x"],
    });

    const nextState = reshuffleDiscardIntoDraw(
      state,
      sequenceRandom([0.1]),
    );

    expect(nextState.drawPile).toEqual(["a", "c", "b"]);
    expect(nextState.hand).toEqual(["h"]);
    expect(nextState.discardPile).toEqual([]);
    expect(nextState.removedFromRun).toEqual(["x"]);
    expect(state.discardPile).toEqual(["b", "c"]);
  });

  it("moves one matching card from hand to discard", () => {
    const state = createState({
      hand: ["a", "b", "a"],
      discardPile: ["x"],
    });

    const nextState = discardCard(state, "a");

    expect(nextState.hand).toEqual(["b", "a"]);
    expect(nextState.discardPile).toEqual(["x", "a"]);
    expect(state.hand).toEqual(["a", "b", "a"]);
  });

  it("safely ignores discarding a card not in hand", () => {
    const state = createState({ hand: ["a"] });
    const nextState = discardCard(state, "missing");

    expect(nextState).toEqual(state);
    expect(nextState).not.toBe(state);
  });

  it("moves the whole hand to discard in hand order", () => {
    const state = createState({
      hand: ["a", "b"],
      discardPile: ["x"],
    });

    const nextState = discardHand(state);

    expect(nextState.hand).toEqual([]);
    expect(nextState.discardPile).toEqual(["x", "a", "b"]);
    expect(state.hand).toEqual(["a", "b"]);
  });

  it("handles empty draw and discard safely", () => {
    const result = drawCards(createState(), 2);

    expect(result.drawn).toEqual([]);
    expect(result.state).toEqual(createState());
  });

  it("can remove a card from a zone into removedFromRun", () => {
    const state = createState({
      hand: ["a", "b"],
      removedFromRun: ["x"],
    });

    const nextState = exhaustCard(state, "a");

    expect(nextState.hand).toEqual(["b"]);
    expect(nextState.removedFromRun).toEqual(["x", "a"]);
    expect(state.hand).toEqual(["a", "b"]);
  });
});
