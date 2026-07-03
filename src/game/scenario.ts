import { discardCard } from "./deck";
import type {
  ActiveScenarioState,
  Card,
  CardCost,
  CardEffect,
  CardTag,
  DecisionLogEntry,
  EffectCondition,
  GameId,
  MetricKey,
  PlayerResources,
  PlayerState,
  ResourceChange,
  ResourceThreshold,
  RunState,
  Scenario,
  ScenarioOutcome,
  TurnResourceKey,
} from "./types";

export type CardPlayFailureReason =
  | "cardNotInHand"
  | "insufficientResource"
  | "noActiveScenario"
  | "scenarioAlreadyResolved";

export type PlayCardResult =
  | {
      played: true;
      state: RunState;
      feedbackIds: GameId[];
    }
  | {
      played: false;
      state: RunState;
      reason: CardPlayFailureReason;
      feedbackIds: [];
    };

export type InitialPlayerStateOptions = {
  activePassiveIds?: GameId[];
  flags?: string[];
  maxAttention?: number;
  maxTime?: number;
  resources?: Partial<PlayerResources>;
  turnResource?: TurnResourceKey;
};

const DEFAULT_MAX_ATTENTION = 3;
const SCENARIO_PROGRESS_TARGET = 2;

const defaultResources: PlayerResources = {
  risk: 0,
  evidence: 0,
  trust: 5,
  pressure: 0,
  attention: DEFAULT_MAX_ATTENTION,
};

export function createInitialPlayerState(
  options: InitialPlayerStateOptions = {},
): PlayerState {
  const maxAttention = options.maxAttention ?? DEFAULT_MAX_ATTENTION;

  return {
    resources: clampResources({
      ...defaultResources,
      attention: maxAttention,
      ...(options.maxTime !== undefined ? { time: options.maxTime } : {}),
      ...options.resources,
    }),
    maxAttention,
    maxTime: options.maxTime,
    turnResource: options.turnResource ?? "attention",
    activePassiveIds: [...(options.activePassiveIds ?? [])],
    flags: [...(options.flags ?? [])],
  };
}

export function startScenario(run: RunState, scenario: Scenario): RunState {
  const activeScenario: ActiveScenarioState = {
    scenarioId: scenario.id,
    turnNumber: 1,
    outcome: "unresolved",
    activeSignalIds: scenario.pressureSignals
      .filter((signal) => signal.visible)
      .map((signal) => signal.id),
    successProgress: 0,
    failureProgress: 0,
  };

  return {
    ...copyRunState(run),
    phase: "scenario",
    player: {
      ...copyPlayerState(run.player),
      resources: clampResources({
        ...run.player.resources,
        attention: run.player.maxAttention,
        ...(run.player.maxTime !== undefined ? { time: run.player.maxTime } : {}),
        ...scenario.startingResources,
      }),
    },
    activeScenario,
  };
}

export function startTurn(run: RunState): RunState {
  const player = copyPlayerState(run.player);
  const turnResource = player.turnResource;
  const turnResourceValue =
    turnResource === "attention" ? player.maxAttention : player.maxTime ?? 0;

  return {
    ...copyRunState(run),
    player: {
      ...player,
      resources: clampResources({
        ...player.resources,
        [turnResource]: turnResourceValue,
      }),
    },
  };
}

export function canPlayCard(run: RunState, card: Card): boolean {
  return getCardPlayFailureReason(run, card) === undefined;
}

export function applyCardCost(player: PlayerState, cost: CardCost): PlayerState {
  return {
    ...copyPlayerState(player),
    resources: clampResources(
      Object.entries(cost).reduce<PlayerResources>(
        (resources, [resource, amount]) => ({
          ...resources,
          [resource]: (resources[resource as TurnResourceKey] ?? 0) - (amount ?? 0),
        }),
        { ...player.resources },
      ),
    ),
  };
}

export function applyCardEffects(
  run: RunState,
  card: Card,
): { state: RunState; feedbackIds: GameId[] } {
  return applyEffects(run, card.effects, card);
}

export function playCard(
  run: RunState,
  card: Card,
  scenario: Scenario,
): PlayCardResult {
  const failureReason = getCardPlayFailureReason(run, card);

  if (failureReason) {
    return {
      played: false,
      state: run,
      reason: failureReason,
      feedbackIds: [],
    };
  }

  const beforeResources = run.player.resources;
  const costPaidState: RunState = {
    ...copyRunState(run),
    player: applyCardCost(run.player, card.cost),
  };
  const effectResult = applyCardEffects(costPaidState, card);
  const withTags = addPlayedCardTags(effectResult.state, card.tags);
  const withDiscardedCard: RunState = {
    ...withTags,
    cardZones: discardCard(withTags.cardZones, card.id),
  };
  const outcome = checkScenarioOutcome(withDiscardedCard, scenario);
  const withOutcome = setScenarioOutcome(withDiscardedCard, outcome);
  const feedbackIds = uniqueIds([
    ...effectResult.feedbackIds,
    ...(card.learningFeedbackId ? [card.learningFeedbackId] : []),
    ...(outcome !== "unresolved" && scenario.resolutionFeedbackIds?.[outcome]
      ? [scenario.resolutionFeedbackIds[outcome]]
      : []),
  ]);
  const decisionLogEntry = createDecisionLogEntry({
    run: withOutcome,
    card,
    feedbackIds,
    resourceChanges: diffResources(beforeResources, withOutcome.player.resources),
  });

  return {
    played: true,
    state: appendDecisionLog(withOutcome, decisionLogEntry),
    feedbackIds,
  };
}

export function endTurn(run: RunState, scenario: Scenario): RunState {
  if (!run.activeScenario || run.activeScenario.outcome !== "unresolved") {
    return copyRunState(run);
  }

  const visibleChanges =
    scenario.intents
      ?.filter((intent) => intent.visible)
      .flatMap((intent) => intent.projectedChanges) ?? [];
  const withPressure = applyResourceChanges(run, visibleChanges);
  const withNextTurn: RunState = {
    ...withPressure,
    activeScenario: {
      ...withPressure.activeScenario!,
      turnNumber: withPressure.activeScenario!.turnNumber + 1,
    },
  };

  return setScenarioOutcome(
    withNextTurn,
    checkScenarioOutcome(withNextTurn, scenario),
  );
}

export const advanceScenarioPressure = endTurn;

export function checkScenarioOutcome(
  run: RunState,
  scenario: Scenario,
): ScenarioOutcome {
  const activeScenario = run.activeScenario;

  if (!activeScenario) {
    return "unresolved";
  }

  if (
    activeScenario.failureProgress >= SCENARIO_PROGRESS_TARGET ||
    scenario.failureThresholds.some((threshold) =>
      isThresholdMet(run.player.resources, threshold),
    )
  ) {
    return "failure";
  }

  if (
    activeScenario.successProgress >= SCENARIO_PROGRESS_TARGET ||
    scenario.successThresholds.every((threshold) =>
      isThresholdMet(run.player.resources, threshold),
    )
  ) {
    return "success";
  }

  return "unresolved";
}

export function createDecisionLogEntry({
  card,
  feedbackIds,
  resourceChanges,
  run,
}: {
  card: Card;
  feedbackIds: GameId[];
  resourceChanges: Partial<Record<MetricKey, number>>;
  run: RunState;
}): DecisionLogEntry {
  return {
    id: `${run.id}:node-${run.nodeIndex}:turn-${run.activeScenario?.turnNumber ?? 0}:play-${card.id}:${run.decisionLog.length + 1}`,
    type: "playCard",
    nodeIndex: run.nodeIndex,
    turnNumber: run.activeScenario?.turnNumber,
    scenarioId: run.activeScenario?.scenarioId,
    cardId: card.id,
    summary: `카드 사용: ${card.name}`,
    resourceSnapshot: { ...run.player.resources },
    resourceChanges,
    feedbackIds: [...feedbackIds],
  };
}

export function appendDecisionLog(
  run: RunState,
  entry: DecisionLogEntry,
): RunState {
  return {
    ...copyRunState(run),
    decisionLog: [...run.decisionLog, { ...entry }],
  };
}

function getCardPlayFailureReason(
  run: RunState,
  card: Card,
): CardPlayFailureReason | undefined {
  if (!run.activeScenario) {
    return "noActiveScenario";
  }

  if (run.activeScenario.outcome !== "unresolved") {
    return "scenarioAlreadyResolved";
  }

  if (!run.cardZones.hand.includes(card.id)) {
    return "cardNotInHand";
  }

  if (!hasEnoughResources(run.player.resources, card.cost)) {
    return "insufficientResource";
  }

  return undefined;
}

function applyEffects(
  run: RunState,
  effects: readonly CardEffect[],
  sourceCard: Card,
): { state: RunState; feedbackIds: GameId[] } {
  return effects.reduce(
    (result, effect) => applyEffect(result.state, effect, sourceCard, result.feedbackIds),
    { state: copyRunState(run), feedbackIds: [] as GameId[] },
  );
}

function applyEffect(
  run: RunState,
  effect: CardEffect,
  sourceCard: Card,
  feedbackIds: GameId[],
): { state: RunState; feedbackIds: GameId[] } {
  switch (effect.type) {
    case "adjustResource":
      return {
        state: applyResourceChanges(run, effect.changes),
        feedbackIds,
      };
    case "addLearningFeedback":
      return {
        state: copyRunState(run),
        feedbackIds: uniqueIds([...feedbackIds, effect.feedbackId]),
      };
    case "addScenarioSignal":
      return {
        state: addScenarioSignal(run, effect.signalId),
        feedbackIds,
      };
    case "conditional":
      const conditionalResult = applyEffects(
        run,
        isConditionMet(run, effect.condition, sourceCard)
          ? effect.whenMet
          : effect.whenNotMet ?? [],
        sourceCard,
      );
      return {
        state: conditionalResult.state,
        feedbackIds: uniqueIds([...feedbackIds, ...conditionalResult.feedbackIds]),
      };
    case "recordDecision":
      return {
        state: copyRunState(run),
        feedbackIds,
      };
    case "scenarioProgress":
      return {
        state: applyScenarioProgress(run, effect.target, effect.amount),
        feedbackIds,
      };
  }
}

function applyResourceChanges(
  run: RunState,
  changes: readonly ResourceChange[],
): RunState {
  const nextResources = changes.reduce<PlayerResources>(
    (resources, change) => ({
      ...resources,
      [change.resource]: (resources[change.resource] ?? 0) + change.amount,
    }),
    { ...run.player.resources },
  );

  return {
    ...copyRunState(run),
    player: {
      ...copyPlayerState(run.player),
      resources: clampResources(nextResources),
    },
  };
}

function addScenarioSignal(run: RunState, signalId: GameId): RunState {
  if (!run.activeScenario) {
    return copyRunState(run);
  }

  return {
    ...copyRunState(run),
    activeScenario: {
      ...run.activeScenario,
      activeSignalIds: uniqueIds([...run.activeScenario.activeSignalIds, signalId]),
    },
  };
}

function applyScenarioProgress(
  run: RunState,
  target: "failure" | "success",
  amount: number,
): RunState {
  if (!run.activeScenario) {
    return copyRunState(run);
  }

  return {
    ...copyRunState(run),
    activeScenario: {
      ...run.activeScenario,
      failureProgress:
        target === "failure"
          ? run.activeScenario.failureProgress + amount
          : run.activeScenario.failureProgress,
      successProgress:
        target === "success"
          ? run.activeScenario.successProgress + amount
          : run.activeScenario.successProgress,
    },
  };
}

function isConditionMet(
  run: RunState,
  condition: EffectCondition,
  sourceCard: Card,
): boolean {
  switch (condition.type) {
    case "resource":
      return compareValue(
        run.player.resources[condition.resource] ?? 0,
        condition.operator,
        condition.value,
      );
    case "cardTag":
      return condition.operator === "has"
        ? hasPlayedCardTag(run, condition.tag) || sourceCard.tags.includes(condition.tag)
        : !hasPlayedCardTag(run, condition.tag) && !sourceCard.tags.includes(condition.tag);
    case "scenarioSignal":
      return condition.operator === "present"
        ? run.activeScenario?.activeSignalIds.includes(condition.signalId) === true
        : run.activeScenario?.activeSignalIds.includes(condition.signalId) !== true;
    case "passive":
      return condition.operator === "active"
        ? run.player.activePassiveIds.includes(condition.passiveId)
        : !run.player.activePassiveIds.includes(condition.passiveId);
  }
}

function addPlayedCardTags(run: RunState, tags: readonly CardTag[]): RunState {
  return {
    ...copyRunState(run),
    player: {
      ...copyPlayerState(run.player),
      flags: uniqueIds([
        ...run.player.flags,
        ...tags.map((tag) => playedCardTagFlag(tag)),
      ]),
    },
  };
}

function hasPlayedCardTag(run: RunState, tag: CardTag): boolean {
  return run.player.flags.includes(playedCardTagFlag(tag));
}

function playedCardTagFlag(tag: CardTag): string {
  return `cardTag:${tag}`;
}

function setScenarioOutcome(run: RunState, outcome: ScenarioOutcome): RunState {
  if (!run.activeScenario) {
    return copyRunState(run);
  }

  return {
    ...copyRunState(run),
    activeScenario: {
      ...run.activeScenario,
      outcome,
    },
  };
}

function hasEnoughResources(resources: PlayerResources, cost: CardCost): boolean {
  return Object.entries(cost).every(
    ([resource, amount]) => (resources[resource as TurnResourceKey] ?? 0) >= (amount ?? 0),
  );
}

function isThresholdMet(
  resources: PlayerResources,
  threshold: ResourceThreshold,
): boolean {
  return compareValue(
    resources[threshold.resource],
    threshold.operator,
    threshold.value,
  );
}

function compareValue(
  actual: number,
  operator: "atLeast" | "atMost" | "equals",
  expected: number,
): boolean {
  if (operator === "atLeast") {
    return actual >= expected;
  }

  if (operator === "atMost") {
    return actual <= expected;
  }

  return actual === expected;
}

function diffResources(
  before: PlayerResources,
  after: PlayerResources,
): Partial<Record<MetricKey, number>> {
  const metrics: MetricKey[] = ["risk", "evidence", "trust", "pressure", "attention", "time"];

  return metrics.reduce<Partial<Record<MetricKey, number>>>((diff, metric) => {
    const amount = (after[metric] ?? 0) - (before[metric] ?? 0);

    if (amount !== 0) {
      return { ...diff, [metric]: amount };
    }

    return diff;
  }, {});
}

function clampResources(resources: PlayerResources): PlayerResources {
  return {
    ...resources,
    risk: clampMinimum(resources.risk),
    evidence: clampMinimum(resources.evidence),
    trust: clampMinimum(resources.trust),
    pressure: clampMinimum(resources.pressure),
    attention: clampMinimum(resources.attention),
    ...(resources.time !== undefined ? { time: clampMinimum(resources.time) } : {}),
  };
}

function clampMinimum(value: number): number {
  return Math.max(0, value);
}

function copyRunState(run: RunState): RunState {
  return {
    ...run,
    player: copyPlayerState(run.player),
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

function copyPlayerState(player: PlayerState): PlayerState {
  return {
    ...player,
    resources: { ...player.resources },
    activePassiveIds: [...player.activePassiveIds],
    flags: [...player.flags],
  };
}

function uniqueIds<T extends string>(ids: readonly T[]): T[] {
  return [...new Set(ids)];
}
