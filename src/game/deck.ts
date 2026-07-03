import type { CardZoneState, GameId } from "./types";

export type RandomSource = () => number;

export type DeckZoneName = "drawPile" | "hand" | "discardPile";

export type DrawCardsOptions = {
  random?: RandomSource;
  reshuffleDiscard?: boolean;
};

export type DrawCardsResult = {
  state: CardZoneState;
  drawn: GameId[];
};

const defaultRandom: RandomSource = Math.random;

export function createStartingDeck(cardIds: readonly GameId[]): CardZoneState {
  return {
    drawPile: [...cardIds],
    hand: [],
    discardPile: [],
    removedFromRun: [],
  };
}

export function shuffle<T>(
  items: readonly T[],
  random: RandomSource = defaultRandom,
): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function reshuffleDiscardIntoDraw(
  state: CardZoneState,
  random: RandomSource = defaultRandom,
): CardZoneState {
  if (state.discardPile.length === 0) {
    return copyCardZoneState(state);
  }

  return {
    drawPile: [...state.drawPile, ...shuffle(state.discardPile, random)],
    hand: [...state.hand],
    discardPile: [],
    removedFromRun: [...state.removedFromRun],
  };
}

export function drawCards(
  state: CardZoneState,
  count: number,
  options: DrawCardsOptions = {},
): DrawCardsResult {
  const random = options.random ?? defaultRandom;
  const reshuffleDiscard = options.reshuffleDiscard ?? true;
  const drawn: GameId[] = [];
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];

  for (let drawIndex = 0; drawIndex < count; drawIndex += 1) {
    if (drawPile.length === 0 && reshuffleDiscard && discardPile.length > 0) {
      drawPile = shuffle(discardPile, random);
      discardPile = [];
    }

    const nextCardId = drawPile.shift();

    if (!nextCardId) {
      break;
    }

    drawn.push(nextCardId);
  }

  return {
    drawn,
    state: {
      drawPile,
      hand: [...state.hand, ...drawn],
      discardPile,
      removedFromRun: [...state.removedFromRun],
    },
  };
}

export function discardCard(
  state: CardZoneState,
  cardId: GameId,
): CardZoneState {
  const hand = [...state.hand];
  const cardIndex = hand.indexOf(cardId);

  if (cardIndex === -1) {
    return copyCardZoneState(state);
  }

  const [discardedCardId] = hand.splice(cardIndex, 1);

  return {
    drawPile: [...state.drawPile],
    hand,
    discardPile: [...state.discardPile, discardedCardId],
    removedFromRun: [...state.removedFromRun],
  };
}

export function discardHand(state: CardZoneState): CardZoneState {
  return {
    drawPile: [...state.drawPile],
    hand: [],
    discardPile: [...state.discardPile, ...state.hand],
    removedFromRun: [...state.removedFromRun],
  };
}

export function exhaustCard(
  state: CardZoneState,
  cardId: GameId,
  zoneName: DeckZoneName = "hand",
): CardZoneState {
  const zone = [...state[zoneName]];
  const cardIndex = zone.indexOf(cardId);

  if (cardIndex === -1) {
    return copyCardZoneState(state);
  }

  const [removedCardId] = zone.splice(cardIndex, 1);

  return {
    drawPile: zoneName === "drawPile" ? zone : [...state.drawPile],
    hand: zoneName === "hand" ? zone : [...state.hand],
    discardPile: zoneName === "discardPile" ? zone : [...state.discardPile],
    removedFromRun: [...state.removedFromRun, removedCardId],
  };
}

function copyCardZoneState(state: CardZoneState): CardZoneState {
  return {
    drawPile: [...state.drawPile],
    hand: [...state.hand],
    discardPile: [...state.discardPile],
    removedFromRun: [...state.removedFromRun],
  };
}
