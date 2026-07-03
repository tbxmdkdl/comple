import type {
  DecisionLogEntry,
  Event,
  EventChoice,
  GameId,
  MetricKey,
  PlayerResources,
  ResourceChange,
  RunState,
} from "./types";

export type EventRunMemory = {
  resourceChanges: Partial<Record<MetricKey, number>>;
  selectedChoiceIds: Record<GameId, GameId>;
};

export type ApplyEventChoiceResult = {
  state: RunState;
  deckCardIds: GameId[];
  resourceChanges: Partial<Record<MetricKey, number>>;
  addedCardIds: GameId[];
  memory: EventRunMemory;
};

export function getEventById(
  events: readonly Event[],
  eventId: GameId,
): Event | undefined {
  return events.find((event) => event.id === eventId);
}

export function createInitialEventRunMemory(): EventRunMemory {
  return {
    resourceChanges: {},
    selectedChoiceIds: {},
  };
}

export function resetEventRunMemory(): EventRunMemory {
  return createInitialEventRunMemory();
}

export function applyEventChoice({
  choice,
  deckCardIds,
  event,
  memory = createInitialEventRunMemory(),
  run,
}: {
  choice: EventChoice;
  deckCardIds: readonly GameId[];
  event: Event;
  memory?: EventRunMemory;
  run: RunState;
}): ApplyEventChoiceResult {
  const resourceChanges = getEventResourceChanges(choice);
  const addedCardIds = getEventAddedCardIds(choice);
  const nextDeckCardIds = [...deckCardIds, ...addedCardIds];
  const nextRun = applyEventChangesToRun(run, resourceChanges, addedCardIds);
  const decisionLogEntry = createEventDecisionLogEntry({
    choice,
    event,
    resourceChanges,
    run: nextRun,
  });
  const nextMemory: EventRunMemory = {
    resourceChanges: mergeResourceChangeTotals(
      memory.resourceChanges,
      resourceChanges,
    ),
    selectedChoiceIds: {
      ...memory.selectedChoiceIds,
      [event.id]: choice.id,
    },
  };

  return {
    state: {
      ...nextRun,
      decisionLog: [...nextRun.decisionLog, decisionLogEntry],
    },
    deckCardIds: nextDeckCardIds,
    resourceChanges,
    addedCardIds,
    memory: nextMemory,
  };
}

export function mergeResourceChangeTotals(
  current: Partial<Record<MetricKey, number>>,
  changes: Partial<Record<MetricKey, number>>,
): Partial<Record<MetricKey, number>> {
  return Object.entries(changes).reduce<Partial<Record<MetricKey, number>>>(
    (totals, [resource, amount]) => ({
      ...totals,
      [resource]: (totals[resource as MetricKey] ?? 0) + (amount ?? 0),
    }),
    { ...current },
  );
}

function getEventResourceChanges(
  choice: EventChoice,
): Partial<Record<MetricKey, number>> {
  return choice.effects
    .filter((effect) => effect.type === "adjustResource")
    .flatMap((effect) => effect.changes)
    .reduce<Partial<Record<MetricKey, number>>>(
      (totals, change) => ({
        ...totals,
        [change.resource]: (totals[change.resource] ?? 0) + change.amount,
      }),
      {},
    );
}

function getEventAddedCardIds(choice: EventChoice): GameId[] {
  return choice.effects
    .filter((effect) => effect.type === "addCardToDeck")
    .map((effect) => effect.cardId);
}

function applyEventChangesToRun(
  run: RunState,
  resourceChanges: Partial<Record<MetricKey, number>>,
  addedCardIds: readonly GameId[],
): RunState {
  return {
    ...copyRunState(run),
    cardZones: {
      drawPile: [...run.cardZones.drawPile, ...addedCardIds],
      hand: [...run.cardZones.hand],
      discardPile: [...run.cardZones.discardPile],
      removedFromRun: [...run.cardZones.removedFromRun],
    },
    player: {
      ...run.player,
      resources: applyResourceChanges(run.player.resources, resourceChanges),
    },
  };
}

function applyResourceChanges(
  resources: PlayerResources,
  changes: Partial<Record<MetricKey, number>>,
): PlayerResources {
  return Object.entries(changes).reduce<PlayerResources>(
    (nextResources, [resource, amount]) => ({
      ...nextResources,
      [resource]: clampMinimum(
        (nextResources[resource as MetricKey] ?? 0) + (amount ?? 0),
      ),
    }),
    { ...resources },
  );
}

function createEventDecisionLogEntry({
  choice,
  event,
  resourceChanges,
  run,
}: {
  choice: EventChoice;
  event: Event;
  resourceChanges: Partial<Record<MetricKey, number>>;
  run: RunState;
}): DecisionLogEntry {
  return {
    id: `${run.id}:node-${run.nodeIndex}:event-${event.id}:choice-${choice.id}:${run.decisionLog.length + 1}`,
    type: "chooseEvent",
    nodeIndex: run.nodeIndex,
    eventId: event.id,
    summary: `이벤트 선택: ${choice.label}`,
    resourceSnapshot: { ...run.player.resources },
    resourceChanges,
    feedbackIds: [],
  };
}

function copyRunState(run: RunState): RunState {
  return {
    ...run,
    player: {
      ...run.player,
      resources: { ...run.player.resources },
      activePassiveIds: [...run.player.activePassiveIds],
      flags: [...run.player.flags],
    },
    cardZones: {
      drawPile: [...run.cardZones.drawPile],
      hand: [...run.cardZones.hand],
      discardPile: [...run.cardZones.discardPile],
      removedFromRun: [...run.cardZones.removedFromRun],
    },
    activeScenario: run.activeScenario
      ? {
          ...run.activeScenario,
          activeSignalIds: [...run.activeScenario.activeSignalIds],
        }
      : undefined,
    availableRewardIds: [...run.availableRewardIds],
    completedScenarioIds: [...run.completedScenarioIds],
    decisionLog: run.decisionLog.map((entry) => ({
      ...entry,
      feedbackIds: [...entry.feedbackIds],
      resourceChanges: entry.resourceChanges
        ? { ...entry.resourceChanges }
        : undefined,
      resourceSnapshot: { ...entry.resourceSnapshot },
    })),
  };
}

function clampMinimum(value: number): number {
  return Math.max(0, value);
}
