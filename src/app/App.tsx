import { useMemo, useState } from "react";
import { ActionCard } from "../components/ActionCard";
import { ResourcePanel } from "../components/ResourcePanel";
import { RewardChoice } from "../components/RewardChoice";
import { RunProgress } from "../components/RunProgress";
import { ScenarioStatus } from "../components/ScenarioStatus";
import {
  cards,
  learningFeedback,
  scenarios,
  startingDeckCardIds,
} from "../data";
import {
  addCardToRunDeck,
  addRewardCardToDeck,
  canPlayCard,
  createFixedRunNodes,
  createInitialPlayerState,
  createStartingDeck,
  discardHand,
  drawCards,
  endTurn,
  getCardRewardOptions,
  getCurrentRunNode,
  getNextScenarioIndex,
  getPhaseAfterScenarioOutcome,
  getRunProgress,
  playCard,
  resetRunDeck,
  startScenario,
  startTurn,
} from "../game";
import type {
  Card,
  CardCost,
  FixedRunPhase,
  GameId,
  MetricKey,
  PlayerResources,
  RunState,
  Scenario,
  ScenarioOutcome,
  TurnResourceKey,
} from "../game";

type ActivityLogEntry = {
  id: string;
  message: string;
  tone?: "info" | "success" | "failure";
};

const runScenarioIds: GameId[] = [
  scenarios[0].id,
  scenarios[1].id,
  scenarios[5].id,
];
const fixedRunNodes = createFixedRunNodes(runScenarioIds);
const handSize = 5;

const metricLabels: Record<MetricKey, string> = {
  risk: "리스크",
  evidence: "증빙",
  trust: "신뢰",
  pressure: "압박",
  attention: "주의력",
  time: "시간",
};

export function App() {
  const [flowPhase, setFlowPhase] = useState<FixedRunPhase>("intro");
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [demoDeckCardIds, setDemoDeckCardIds] = useState<GameId[]>(() =>
    resetRunDeck(startingDeckCardIds),
  );
  const [run, setRun] = useState(() =>
    createPlayableRun(getScenarioForNodeIndex(0), startingDeckCardIds, 0),
  );
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => [
    createLogEntry("런을 시작하면 첫 업무 상황이 열립니다."),
  ]);
  const [feedbackIds, setFeedbackIds] = useState<GameId[]>([]);
  const [activeRewardCardIds, setActiveRewardCardIds] = useState<GameId[]>([]);
  const [selectedRewardCardId, setSelectedRewardCardId] = useState<GameId>();

  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), []);
  const activeRewardOptions = useMemo(
    () =>
      activeRewardCardIds
        .map((cardId) => cardsById.get(cardId))
        .filter((card): card is Card => card !== undefined),
    [activeRewardCardIds, cardsById],
  );
  const feedbackById = useMemo(
    () => new Map(learningFeedback.map((feedback) => [feedback.id, feedback])),
    [],
  );
  const currentRunNode =
    getCurrentRunNode(fixedRunNodes, currentNodeIndex) ?? fixedRunNodes[0];
  const currentScenario = getScenarioForNodeIndex(currentNodeIndex);
  const runProgress = getRunProgress(fixedRunNodes, currentNodeIndex);
  const handCards = run.cardZones.hand
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is Card => card !== undefined);
  const activeScenario = run.activeScenario;
  const outcome = activeScenario?.outcome ?? "unresolved";
  const isResolved = outcome !== "unresolved" || flowPhase !== "scenario";
  const showScenarioWorkspace = flowPhase === "scenario" || flowPhase === "reward";
  const showRewardChoice = flowPhase === "reward";
  const latestFeedback = feedbackIds
    .map((feedbackId) => feedbackById.get(feedbackId)?.message)
    .map((message) => (message ? formatUiText(message) : message))
    .filter((message): message is string => Boolean(message));

  function startFreshRun() {
    const resetDeck = resetRunDeck(startingDeckCardIds);
    const firstScenario = getScenarioForNodeIndex(0);

    setDemoDeckCardIds(resetDeck);
    setCurrentNodeIndex(0);
    setRun(createPlayableRun(firstScenario, resetDeck, 0));
    setFlowPhase("scenario");
    setFeedbackIds([]);
    setActiveRewardCardIds([]);
    setSelectedRewardCardId(undefined);
    setActivityLog([
      createLogEntry("런이 시작되었습니다. 첫 상황에서 조치를 선택하세요."),
    ]);
  }

  function handlePlayCard(card: Card) {
    if (flowPhase !== "scenario") {
      return;
    }

    if (!canPlayCard(run, card)) {
      setActivityLog((entries) => [
        createLogEntry(getDisabledReason(run, card) ?? "지금은 이 조치를 실행할 수 없습니다."),
        ...entries,
      ]);
      return;
    }

    const result = playCard(run, card, currentScenario);

    if (!result.played) {
      setActivityLog((entries) => [
        createLogEntry(getFailureMessage(result.reason)),
        ...entries,
      ]);
      return;
    }

    const latestDecision =
      result.state.decisionLog[result.state.decisionLog.length - 1];
    const resolvedOutcome = result.state.activeScenario?.outcome ?? "unresolved";
    const { nextPhase, nextState } = applyOutcomeFlow(result.state, resolvedOutcome);
    const outcomeMessage = getOutcomeLog(resolvedOutcome);
    const runPhaseMessage = getRunPhaseLog(nextPhase);

    if (nextPhase === "reward") {
      setActiveRewardCardIds(createRewardCardIds(demoDeckCardIds));
      setSelectedRewardCardId(undefined);
    } else if (nextPhase === "complete" || nextPhase === "failed") {
      setActiveRewardCardIds([]);
      setSelectedRewardCardId(undefined);
    }

    const nextEntries = [
      createLogEntry(
        `${formatUiText(card.name)} 조치를 실행했습니다. ${formatResourceChanges(latestDecision?.resourceChanges)}`,
        outcomeMessage?.tone,
      ),
      ...(outcomeMessage ? [createLogEntry(outcomeMessage.message, outcomeMessage.tone)] : []),
      ...(runPhaseMessage ? [runPhaseMessage] : []),
    ];

    setRun(nextState);
    setFlowPhase(nextPhase);
    setFeedbackIds(result.feedbackIds);
    setActivityLog((entries) => [...nextEntries, ...entries].slice(0, 8));
  }

  function handleEndTurn() {
    if (isResolved) {
      return;
    }

    const afterDiscard: RunState = {
      ...run,
      cardZones: discardHand(run.cardZones),
    };
    const afterPressure = endTurn(afterDiscard, currentScenario);
    const pressureOutcome = afterPressure.activeScenario?.outcome ?? "unresolved";
    const outcomeMessage = getOutcomeLog(pressureOutcome);

    if (pressureOutcome !== "unresolved") {
      const { nextPhase, nextState } = applyOutcomeFlow(afterPressure, pressureOutcome);
      const runPhaseMessage = getRunPhaseLog(nextPhase);

      setRun(nextState);
      setFlowPhase(nextPhase);
      setFeedbackIds([]);

      if (nextPhase === "reward") {
        setActiveRewardCardIds(createRewardCardIds(demoDeckCardIds));
        setSelectedRewardCardId(undefined);
      } else {
        setActiveRewardCardIds([]);
        setSelectedRewardCardId(undefined);
      }

      setActivityLog((entries) =>
        [
          createLogEntry("턴을 넘기며 상황 압박이 반영되었습니다."),
          ...(outcomeMessage
            ? [createLogEntry(outcomeMessage.message, outcomeMessage.tone)]
            : []),
          ...(runPhaseMessage ? [runPhaseMessage] : []),
          ...entries,
        ].slice(0, 8),
      );
      return;
    }

    const nextTurn = startTurn(afterPressure);
    const drawResult = drawCards(nextTurn.cardZones, handSize);
    const nextRun: RunState = {
      ...nextTurn,
      cardZones: drawResult.state,
    };

    setRun(nextRun);
    setFeedbackIds([]);
    setActivityLog((entries) =>
      [
        createLogEntry(
          `${nextRun.activeScenario?.turnNumber ?? 1}턴이 시작되었습니다. 새 손패 ${drawResult.drawn.length}장을 받았습니다.`,
        ),
        ...entries,
      ].slice(0, 8),
    );
  }

  function handleSelectReward(card: Card) {
    if (selectedRewardCardId) {
      return;
    }

    setSelectedRewardCardId(card.id);
    setDemoDeckCardIds((cardIds) => addCardToRunDeck(cardIds, card.id));
    setRun((currentRun) => ({
      ...currentRun,
      phase: "reward",
      cardZones: addRewardCardToDeck(currentRun.cardZones, card.id),
    }));
    setActivityLog((entries) =>
      [
        createLogEntry(`${formatUiText(card.name)} 카드가 덱에 추가되었습니다.`, "success"),
        ...entries,
      ].slice(0, 8),
    );
  }

  function handleContinueAfterReward() {
    if (!selectedRewardCardId) {
      return;
    }

    const nextNodeIndex = getNextScenarioIndex(fixedRunNodes, currentNodeIndex);
    const nextScenario = getScenarioForNodeIndex(nextNodeIndex);
    const nextRun = createPlayableRun(nextScenario, demoDeckCardIds, nextNodeIndex, run);

    setCurrentNodeIndex(nextNodeIndex);
    setRun(nextRun);
    setFlowPhase("scenario");
    setActiveRewardCardIds([]);
    setSelectedRewardCardId(undefined);
    setFeedbackIds([]);
    setActivityLog([
      createLogEntry("보상 카드가 유지된 덱으로 다음 상황을 시작합니다."),
    ]);
  }

  function applyOutcomeFlow(
    state: RunState,
    resolvedOutcome: ScenarioOutcome,
  ): { nextPhase: FixedRunPhase; nextState: RunState } {
    const nextPhase = getPhaseAfterScenarioOutcome(
      fixedRunNodes,
      currentNodeIndex,
      resolvedOutcome,
    );
    const completedState =
      resolvedOutcome === "success"
        ? markScenarioComplete(state, currentScenario.id)
        : state;

    if (nextPhase === "reward") {
      return {
        nextPhase,
        nextState: { ...completedState, phase: "reward" },
      };
    }

    if (nextPhase === "complete") {
      return {
        nextPhase,
        nextState: { ...completedState, phase: "complete" },
      };
    }

    return { nextPhase, nextState: completedState };
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="app-title">
        <header className="top-bar">
          <div>
            <p className="eyebrow">컴플라이언스 판단 훈련</p>
            <h1 id="app-title">업무 리스크 상황판</h1>
          </div>
          <button className="secondary-button" onClick={startFreshRun} type="button">
            런 다시 시작
          </button>
        </header>

        <RunProgress phase={flowPhase} progress={runProgress} />

        {flowPhase === "intro" ? (
          <section className="state-panel" aria-label="런 시작">
            <p className="eyebrow">런 시작</p>
            <h2>세 가지 업무 상황을 순서대로 해결하세요</h2>
            <p>
              각 상황을 안전하게 정리하면 새 조치 카드를 선택할 수 있습니다.
              선택한 카드는 다음 상황의 덱에 유지됩니다.
            </p>
            <div className="state-actions">
              <button className="primary-button" onClick={startFreshRun} type="button">
                런 시작
              </button>
            </div>
          </section>
        ) : null}

        {showScenarioWorkspace ? (
          <>
            <section className="scenario-panel" aria-label="현재 시나리오">
              <div>
                <p className="eyebrow">{currentRunNode.title}</p>
                <h2>{formatUiText(currentScenario.title)}</h2>
                <p className="scenario-copy">{formatUiText(currentScenario.summary)}</p>
                <p className="scenario-setup">{formatUiText(currentScenario.setup)}</p>
              </div>
            </section>

            <ResourcePanel
              maxAttention={run.player.maxAttention}
              maxTime={run.player.maxTime}
              resources={run.player.resources}
              turnResource={run.player.turnResource}
            />

            {activeScenario ? (
              <ScenarioStatus
                activeSignalIds={activeScenario.activeSignalIds}
                outcome={activeScenario.outcome}
                scenario={currentScenario}
                turnNumber={activeScenario.turnNumber}
              />
            ) : null}

            {showRewardChoice ? (
              <RewardChoice
                deckSize={demoDeckCardIds.length}
                onContinue={handleContinueAfterReward}
                onSelect={handleSelectReward}
                options={activeRewardOptions}
                selectedCardId={selectedRewardCardId}
              />
            ) : (
              <section className="play-area" aria-label="조치 선택">
                <div className="hand-panel">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">손패</p>
                      <h2>이번 턴의 조치</h2>
                    </div>
                    <button
                      className="primary-button"
                      disabled={isResolved}
                      onClick={handleEndTurn}
                      type="button"
                    >
                      턴 종료
                    </button>
                  </div>

                  <div className="hand-row">
                    {handCards.length > 0 ? (
                      handCards.map((card, index) => {
                        const disabledReason = getDisabledReason(run, card);

                        return (
                          <ActionCard
                            card={card}
                            disabled={Boolean(disabledReason)}
                            disabledReason={disabledReason}
                            key={`${card.id}-${index}`}
                            onPlay={() => handlePlayCard(card)}
                          />
                        );
                      })
                    ) : (
                      <p className="empty-copy">
                        손패가 없습니다. 턴 종료로 다음 손패를 받으세요.
                      </p>
                    )}
                  </div>
                </div>

                <aside className="side-panel" aria-label="진행 기록">
                  <section className="zone-counts" aria-label="덱 상태">
                    <h2>덱 상태</h2>
                    <dl>
                      <div>
                        <dt>뽑을 카드</dt>
                        <dd>{run.cardZones.drawPile.length}</dd>
                      </div>
                      <div>
                        <dt>손패</dt>
                        <dd>{run.cardZones.hand.length}</dd>
                      </div>
                      <div>
                        <dt>버림</dt>
                        <dd>{run.cardZones.discardPile.length}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="feedback-panel" aria-label="학습 피드백">
                    <h2>학습 피드백</h2>
                    {latestFeedback.length > 0 ? (
                      latestFeedback.map((message) => <p key={message}>{message}</p>)
                    ) : (
                      <p className="empty-copy">카드를 실행하면 짧은 피드백이 표시됩니다.</p>
                    )}
                  </section>

                  <section className="activity-log" aria-label="최근 진행 기록">
                    <h2>진행 기록</h2>
                    <ol>
                      {activityLog.map((entry) => (
                        <li className={entry.tone} key={entry.id}>
                          {entry.message}
                        </li>
                      ))}
                    </ol>
                  </section>
                </aside>
              </section>
            )}
          </>
        ) : null}

        {flowPhase === "complete" ? (
          <section className="state-panel success" aria-label="런 완료">
            <p className="eyebrow">런 완료</p>
            <h2>모든 업무 상황을 마쳤습니다</h2>
            <p>
              이번 MVP에서는 최종 리포트 대신 완료 상태만 표시합니다. 선택과
              피드백을 정리하는 화면은 다음 티켓에서 추가할 수 있습니다.
            </p>
            <div className="state-actions">
              <button className="primary-button" onClick={startFreshRun} type="button">
                런 다시 시작
              </button>
            </div>
          </section>
        ) : null}

        {flowPhase === "failed" ? (
          <section className="state-panel failure" aria-label="런 중단">
            <p className="eyebrow">런 중단</p>
            <h2>상황을 안전하게 정리하지 못했습니다</h2>
            <p>
              리스크가 커져 이번 런을 멈췄습니다. 덱을 초기화하고 첫 상황부터
              다시 연습할 수 있습니다.
            </p>
            <div className="state-actions">
              <button className="primary-button" onClick={startFreshRun} type="button">
                런 다시 시작
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function getScenarioForNodeIndex(nodeIndex: number): Scenario {
  const node = getCurrentRunNode(fixedRunNodes, nodeIndex) ?? fixedRunNodes[0];

  return scenarios.find((scenario) => scenario.id === node.scenarioId) ?? scenarios[0];
}

function createRewardCardIds(deckCardIds: readonly GameId[]): GameId[] {
  return getCardRewardOptions(cards, deckCardIds).map((card) => card.id);
}

function createPlayableRun(
  scenario: Scenario,
  deckCardIds: readonly GameId[],
  nodeIndex: number,
  previousRun?: RunState,
): RunState {
  const baseRun: RunState = {
    id: "fixed-run",
    phase: "notStarted",
    nodeIndex,
    player: createInitialPlayerState(),
    cardZones: createStartingDeck(deckCardIds),
    availableRewardIds: [],
    completedScenarioIds: [...(previousRun?.completedScenarioIds ?? [])],
    decisionLog: [...(previousRun?.decisionLog ?? [])],
  };
  const scenarioRun = startScenario(baseRun, scenario);
  const drawResult = drawCards(scenarioRun.cardZones, handSize);

  return {
    ...scenarioRun,
    cardZones: drawResult.state,
  };
}

function markScenarioComplete(run: RunState, scenarioId: GameId): RunState {
  return {
    ...run,
    completedScenarioIds: [...new Set([...run.completedScenarioIds, scenarioId])],
  };
}

function getDisabledReason(run: RunState, card: Card): string | undefined {
  if (run.activeScenario?.outcome && run.activeScenario.outcome !== "unresolved") {
    return "이미 해결된 상황입니다.";
  }

  if (!run.cardZones.hand.includes(card.id)) {
    return "현재 손패에 없습니다.";
  }

  const insufficientResource = getInsufficientResource(
    run.player.resources,
    card.cost,
    run.player.turnResource,
  );

  if (insufficientResource) {
    return `${metricLabels[insufficientResource]}이 부족합니다.`;
  }

  return undefined;
}

function getInsufficientResource(
  resources: PlayerResources,
  cost: CardCost,
  turnResource: TurnResourceKey,
): MetricKey | undefined {
  const primaryCost = cost[turnResource] ?? 0;

  if ((resources[turnResource] ?? 0) < primaryCost) {
    return turnResource;
  }

  const otherTurnResource = turnResource === "attention" ? "time" : "attention";
  const otherCost = cost[otherTurnResource] ?? 0;

  if ((resources[otherTurnResource] ?? 0) < otherCost) {
    return otherTurnResource;
  }

  return undefined;
}

function getFailureMessage(reason: string): string {
  const messages: Record<string, string> = {
    cardNotInHand: "현재 손패에 없는 조치입니다.",
    insufficientResource: "이번 턴의 주의력이나 시간이 부족합니다.",
    noActiveScenario: "진행 중인 시나리오가 없습니다.",
    scenarioAlreadyResolved: "이미 해결된 상황입니다.",
  };

  return messages[reason] ?? "지금은 이 조치를 실행할 수 없습니다.";
}

function formatResourceChanges(
  changes: Partial<Record<MetricKey, number>> | undefined,
): string {
  if (!changes) {
    return "지표 변화는 없습니다.";
  }

  const entries = Object.entries(changes).filter(([, amount]) => amount !== 0);

  if (entries.length === 0) {
    return "지표 변화는 없습니다.";
  }

  return entries
    .map(([metric, amount]) => {
      const sign = amount > 0 ? "+" : "";

      return `${metricLabels[metric as MetricKey]} ${sign}${amount}`;
    })
    .join(", ");
}

function getOutcomeLog(
  outcome: ScenarioOutcome | undefined,
): { message: string; tone: ActivityLogEntry["tone"] } | undefined {
  if (outcome === "success") {
    return {
      message: "상황이 안전한 방향으로 해결되었습니다.",
      tone: "success",
    };
  }

  if (outcome === "failure") {
    return {
      message: "리스크가 커져 상황을 더 안전하게 정리하지 못했습니다.",
      tone: "failure",
    };
  }

  return undefined;
}

function getRunPhaseLog(phase: FixedRunPhase): ActivityLogEntry | undefined {
  if (phase === "reward") {
    return createLogEntry("상황 해결 보상으로 새 조치 카드를 선택하세요.", "success");
  }

  if (phase === "complete") {
    return createLogEntry("모든 상황을 마쳐 런이 완료되었습니다.", "success");
  }

  if (phase === "failed") {
    return createLogEntry("이번 런은 중단되었습니다. 다시 시작할 수 있습니다.", "failure");
  }

  return undefined;
}

function createLogEntry(
  message: string,
  tone: ActivityLogEntry["tone"] = "info",
): ActivityLogEntry {
  return {
    id: `${Date.now()}-${Math.random()}`,
    message: formatUiText(message),
    tone,
  };
}

function formatUiText(text: string): string {
  return text
    .replaceAll("증거가", "증빙이")
    .replaceAll("증거는", "증빙은")
    .replaceAll("증거를", "증빙을")
    .replaceAll("증거", "증빙");
}
