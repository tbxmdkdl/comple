import type { Card, CardZoneState, GameId } from "./types";
import { shuffle, type RandomSource } from "./deck";

export type RewardDeckZoneName = "drawPile" | "discardPile";

export type CardRewardOptions = {
  random?: RandomSource;
  shuffle?: boolean;
};

export function getCardRewardOptions(
  cards: readonly Card[],
  existingCardIds: readonly GameId[],
  count = 3,
  options: CardRewardOptions = {},
): Card[] {
  const existingCardIdSet = new Set(existingCardIds);
  const candidates = cards.filter((card) => !existingCardIdSet.has(card.id));
  const orderedCandidates = options.shuffle
    ? shuffle(candidates, options.random)
    : candidates;

  return orderedCandidates.slice(0, count);
}

export function addRewardCardToDeck(
  state: CardZoneState,
  cardId: GameId,
  zoneName: RewardDeckZoneName = "discardPile",
): CardZoneState {
  return {
    drawPile:
      zoneName === "drawPile" ? [...state.drawPile, cardId] : [...state.drawPile],
    hand: [...state.hand],
    discardPile:
      zoneName === "discardPile"
        ? [...state.discardPile, cardId]
        : [...state.discardPile],
    removedFromRun: [...state.removedFromRun],
  };
}
