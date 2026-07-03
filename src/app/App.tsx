import { useMemo, useState } from "react";
import { ActionCard } from "../components/ActionCard";
import { ResourcePanel } from "../components/ResourcePanel";
import { ScenarioStatus } from "../components/ScenarioStatus";
import {
  cards,
  learningFeedback,
  scenarios,
  startingDeckCardIds,
} from "../data";
import {
  canPlayCard,
  createInitialPlayerState,
  createStartingDeck,
  discardHand,
  drawCards,
  endTurn,
  playCard,
  startScenario,
  startTurn,
} from "../game";
import type {
  Card,
  CardCost,
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

const firstScenario = scenarios[0];
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
  const [run, setRun] = useState(() => createPlayableRun(firstScenario));
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => [
    createLogEntry("시나리오가 시작되었습니다. 손패에서 조치를 선택하세요."),
  ]);
  const [feedbackIds, setFeedbackIds] = useState<GameId[]>([]);

  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), []);
  const feedbackById = useMemo(
    () => new Map(learningFeedback.map((feedback) => [feedback.id, feedback])),
    [],
  );
  const handCards = run.cardZones.hand
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is Card => card !== undefined);
  const activeScenario = run.activeScenario;
  const outcome = activeScenario?.outcome ?? "unresolved";
  const isResolved = outcome !== "unresolved";
  const latestFeedback = feedbackIds
    .map((feedbackId) => feedbackById.get(feedbackId)?.message)
    .map((message) => (message ? formatUiText(message) : message))
    .filter((message): message is string => Boolean(message));

  function resetScenario() {
    setRun(createPlayableRun(firstScenario));
    setFeedbackIds([]);
    setActivityLog([
      createLogEntry("시나리오를 다시 시작했습니다. 첫 손패를 확인하세요."),
    ]);
  }

  function handlePlayCard(card: Card) {
    if (!canPlayCard(run, card)) {
      setActivityLog((entries) => [
        createLogEntry(getDisabledReason(run, card) ?? "지금은 이 조치를 실행할 수 없습니다."),
        ...entries,
      ]);
      return;
    }

    const result = playCard(run, card, firstScenario);

    if (!result.played) {
      setActivityLog((entries) => [
        createLogEntry(getFailureMessage(result.reason)),
        ...entries,
      ]);
      return;
    }

    const latestDecision =
      result.state.decisionLog[result.state.decisionLog.length - 1];
    const outcomeMessage = getOutcomeLog(result.state.activeScenario?.outcome);
    const nextEntries = [
      createLogEntry(
        `${formatUiText(card.name)} 조치를 실행했습니다. ${formatResourceChanges(latestDecision?.resourceChanges)}`,
        outcomeMessage?.tone,
      ),
      ...(outcomeMessage ? [createLogEntry(outcomeMessage.message, outcomeMessage.tone)] : []),
    ];

    setRun(result.state);
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
    const afterPressure = endTurn(afterDiscard, firstScenario);
    const outcomeMessage = getOutcomeLog(afterPressure.activeScenario?.outcome);

    if (afterPressure.activeScenario?.outcome !== "unresolved") {
      setRun(afterPressure);
      setFeedbackIds([]);
      setActivityLog((entries) =>
        [
          createLogEntry("턴을 넘기며 상황 압박이 반영되었습니다."),
          ...(outcomeMessage
            ? [createLogEntry(outcomeMessage.message, outcomeMessage.tone)]
            : []),
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

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="app-title">
        <header className="top-bar">
          <div>
            <p className="eyebrow">컴플라이언스 판단 훈련</p>
            <h1 id="app-title">업무 리스크 상황판</h1>
          </div>
          <button className="secondary-button" onClick={resetScenario} type="button">
            시나리오 다시 시작
          </button>
        </header>

        <section className="scenario-panel" aria-label="현재 시나리오">
          <div>
            <p className="eyebrow">현재 상황</p>
            <h2>{formatUiText(firstScenario.title)}</h2>
            <p className="scenario-copy">{formatUiText(firstScenario.summary)}</p>
            <p className="scenario-setup">{formatUiText(firstScenario.setup)}</p>
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
            scenario={firstScenario}
            turnNumber={activeScenario.turnNumber}
          />
        ) : null}

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
                <p className="empty-copy">손패가 없습니다. 턴 종료로 다음 손패를 받으세요.</p>
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
      </section>
    </main>
  );
}

function createPlayableRun(scenario: Scenario): RunState {
  const baseRun: RunState = {
    id: "single-scenario-run",
    phase: "notStarted",
    nodeIndex: 0,
    player: createInitialPlayerState(),
    cardZones: createStartingDeck(startingDeckCardIds),
    availableRewardIds: [],
    completedScenarioIds: [],
    decisionLog: [],
  };
  const scenarioRun = startScenario(baseRun, scenario);
  const drawResult = drawCards(scenarioRun.cardZones, handSize);

  return {
    ...scenarioRun,
    cardZones: drawResult.state,
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
  return text.replaceAll("증거", "증빙");
}
