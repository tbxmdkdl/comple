import { describe, expect, it } from "vitest";
import { cards, startingDeckCardIds } from "../data";
import {
  addRewardCardToDeck,
  getCardRewardOptions,
} from "../game";
import type { CardZoneState } from "../game";

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

function countCardIds(state: CardZoneState, cardId: string): number {
  return [
    ...state.drawPile,
    ...state.hand,
    ...state.discardPile,
    ...state.removedFromRun,
  ].filter((id) => id === cardId).length;
}

function sequenceRandom(values: number[]) {
  let index = 0;

  return () => values[index++] ?? 0;
}

describe("reward helpers", () => {
  it("returns exactly three deterministic card reward options", () => {
    const options = getCardRewardOptions(cards, startingDeckCardIds);

    expect(options.map((card) => card.id)).toEqual([
      "minimum-data",
      "approval-request",
      "compliance-consult",
    ]);
  });

  it("returns reward option ids that exist in cards data", () => {
    const cardIds = new Set(cards.map((card) => card.id));
    const options = getCardRewardOptions(cards, startingDeckCardIds);

    expect(options).toHaveLength(3);

    for (const option of options) {
      expect(cardIds.has(option.id)).toBe(true);
    }
  });

  it("can shuffle reward options when requested", () => {
    const options = getCardRewardOptions(cards, startingDeckCardIds, 3, {
      random: sequenceRandom([0.1, 0.7, 0.3, 0.2, 0.8, 0.4, 0.6, 0.5, 0.1]),
      shuffle: true,
    });

    expect(options).toHaveLength(3);
    expect(options.map((card) => card.id)).not.toEqual([
      "minimum-data",
      "approval-request",
      "compliance-consult",
    ]);
  });

  it("adds the selected reward card to the deck discard pile by default", () => {
    const state = createState({
      drawPile: ["a"],
      hand: ["b"],
      discardPile: ["c"],
    });

    const nextState = addRewardCardToDeck(state, "reward-card");

    expect(nextState.discardPile).toEqual(["c", "reward-card"]);
    expect(nextState.drawPile).toEqual(["a"]);
    expect(nextState.hand).toEqual(["b"]);
  });

  it("preserves duplicate card ids when adding an existing card id", () => {
    const state = createState({
      drawPile: ["existing-card"],
      discardPile: ["other-card"],
    });

    const nextState = addRewardCardToDeck(state, "existing-card");

    expect(countCardIds(nextState, "existing-card")).toBe(2);
  });

  it("does not mutate the input deck state", () => {
    const state = createState({
      drawPile: ["a"],
      hand: ["b"],
      discardPile: ["c"],
      removedFromRun: ["d"],
    });

    const nextState = addRewardCardToDeck(state, "reward-card");

    expect(state).toEqual({
      drawPile: ["a"],
      hand: ["b"],
      discardPile: ["c"],
      removedFromRun: ["d"],
    });
    expect(nextState).not.toBe(state);
    expect(nextState.discardPile).not.toBe(state.discardPile);
  });
});
