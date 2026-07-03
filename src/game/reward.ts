import type { Card, CardZoneState, GameId } from "./types";

export type RewardDeckZoneName = "drawPile" | "discardPile";

export function getCardRewardOptions(
  cards: readonly Card[],
  existingCardIds: readonly GameId[],
  count = 3,
): Card[] {
  const existingCardIdSet = new Set(existingCardIds);

  return cards
    .filter((card) => !existingCardIdSet.has(card.id))
    .slice(0, count);
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
