import { useMemo, useState } from "react";
import { ActionCard } from "../components/ActionCard";
import { EventNode } from "../components/EventNode";
import { FinalReport } from "../components/FinalReport";
import { ResourcePanel } from "../components/ResourcePanel";
import { RewardChoice } from "../components/RewardChoice";
import { RunProgress } from "../components/RunProgress";
import { ScenarioStatus } from "../components/ScenarioStatus";
import {
  cards,
  events,
  learningFeedback,
  scenarios,
  startingDeckCardIds,
} from "../data";
import {
  addCardToRunDeck,
  addRewardCardToDeck,
  applyEventChoice,
  applyRiskyProceed,
  canPlayCard,
  checkRiskCounter,
  createFixedRunNodes,
  createInitialEventRunMemory,
  createInitialPlayerState,
  createInitialRiskExposure,
  createStartingDeck,
  discardHand,
  drawCards,
  endTurn,
  generateFinalReport,
  getCardRewardOptions,
  getCurrentRunNode,
  getEventById,
  getNextRunNodeIndex,
  getPhaseAfterScenarioOutcome,
  getPhaseForRunNode,
  getRunProgress,
  playCard,
  resetEventRunMemory,
  resetRunDeck,
  startScenario,
  startTurn,
} from "../game";
import type {
  Card,
  CardCost,
  Event as RunEvent,
  EventChoice,
  EventRunMemory,
  FixedRunNode,
  FixedRunPhase,
  GameId,
  MetricKey,
  PlayerResources,
  ResourceThreshold,
  RunState,
  Scenario,
  ScenarioOutcome,
  RiskCounterNotice,
  RiskExposureState,
  TurnResourceKey,
} from "../game";

type ActivityLogEntry = {
  id: string;
  message: string;
  tone?: "info" | "success" | "failure";
};

type DialogueExchange = {
  id: string;
  playerLine: string;
  pressureLine: string;
  summary?: string;
  tone?: "info" | "success" | "failure";
};

const fixedRunNodes = createFixedRunNodes([
  { type: "event", eventId: events[0].id, title: "이벤트 1" },
  { type: "scenario", scenarioId: scenarios[0].id, title: "1번째 상황" },
  { type: "event", eventId: events[1].id, title: "이벤트 2" },
  { type: "scenario", scenarioId: scenarios[1].id, title: "2번째 상황" },
  { type: "event", eventId: events[2].id, title: "이벤트 3" },
  {
    type: "scenario",
    scenarioId: scenarios[5].id,
    title: "최종 상황",
    isFinal: true,
  },
]);
const handSize = 5;
const scenarioProgressTarget = 2;

const metricLabels: Record<MetricKey, string> = {
  risk: "리스크",
  evidence: "증빙",
  trust: "신뢰",
  pressure: "압박",
  attention: "주의력",
  time: "시간",
};

const gameArt = {
  background: "/assets/game-art/office-risk-room-bg.webp",
  player: "/assets/game-art/player-compliance-employee.webp",
  cardBack: "/assets/game-art/card-back-compliance.webp",
  actors: {
    client: "/assets/game-art/actor-contract-client.webp",
    colleague: "/assets/game-art/actor-rushed-coworker.webp",
    manager: "/assets/game-art/actor-deadline-manager.webp",
    social: "/assets/game-art/actor-social-pressure.webp",
    vendor: "/assets/game-art/actor-vendor-gift.webp",
  },
  events: {
    "deadline-choice": "/assets/game-art/event-deadline-choice.webp",
    "lunch-briefing": "/assets/game-art/event-lunch-briefing.webp",
    "organize-notes": "/assets/game-art/event-organize-notes.webp",
  },
} as const;

export function App() {
  const initialEventMemory = createInitialEventRunMemory();
  const [flowPhase, setFlowPhase] = useState<FixedRunPhase>("intro");
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [eventRunMemory, setEventRunMemory] = useState<EventRunMemory>(
    () => initialEventMemory,
  );
  const [demoDeckCardIds, setDemoDeckCardIds] = useState<GameId[]>(() =>
    resetRunDeck(startingDeckCardIds),
  );
  const [run, setRun] = useState(() =>
    createRunForNode(0, startingDeckCardIds, undefined, initialEventMemory),
  );
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => [
    createLogEntry("런을 시작하면 첫 업무 이벤트가 열립니다."),
  ]);
  const [feedbackIds, setFeedbackIds] = useState<GameId[]>([]);
  const [activeRewardCardIds, setActiveRewardCardIds] = useState<GameId[]>([]);
  const [selectedRewardCardId, setSelectedRewardCardId] = useState<GameId>();
  const [selectedRewardCardIds, setSelectedRewardCardIds] = useState<GameId[]>([]);
  const [selectedEventChoiceId, setSelectedEventChoiceId] = useState<GameId>();
  const [eventConsequence, setEventConsequence] = useState<string>();
  const [briefedScenarioNodeIndexes, setBriefedScenarioNodeIndexes] = useState<number[]>([]);
  const [dialogueExchange, setDialogueExchange] = useState<DialogueExchange>();
  const [riskExposure, setRiskExposure] = useState<RiskExposureState>(() =>
    createInitialRiskExposure(),
  );

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
  const currentEvent = getEventForNodeIndex(currentNodeIndex);
  const runProgress = getRunProgress(fixedRunNodes, currentNodeIndex);
  const handCards = run.cardZones.hand
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is Card => card !== undefined);
  const activeScenario = run.activeScenario;
  const outcome = activeScenario?.outcome ?? "unresolved";
  const isResolved = outcome !== "unresolved" || flowPhase !== "scenario";
  const showEventNode = flowPhase === "event";
  const showScenarioWorkspace = flowPhase === "scenario" || flowPhase === "reward";
  const showRewardChoice = flowPhase === "reward";
  const showResourceHud = flowPhase !== "intro";
  const showScenarioBriefing =
    flowPhase === "scenario" && !briefedScenarioNodeIndexes.includes(currentNodeIndex);
  const showScenarioBoard = showScenarioWorkspace && !showScenarioBriefing;
  const resolutionPercent = getResolutionPercent(run, currentScenario);
  const pressureActor = getPressureActor(currentScenario);
  const latestFeedback = feedbackIds
    .map((feedbackId) => feedbackById.get(feedbackId)?.message)
    .map((message) => (message ? formatUiText(message) : message))
    .filter((message): message is string => Boolean(message));
  const finalReport = useMemo(() => {
    if (flowPhase !== "complete" && flowPhase !== "failed") {
      return undefined;
    }

    return generateFinalReport({
      cards,
      events,
      outcome: flowPhase === "complete" ? "completed" : "failed",
      run,
      scenarios,
      selectedEventChoiceIds: eventRunMemory.selectedChoiceIds,
      selectedRewardCardIds,
    });
  }, [eventRunMemory.selectedChoiceIds, flowPhase, run, selectedRewardCardIds]);

  function startFreshRun() {
    const resetDeck = resetRunDeck(startingDeckCardIds);
    const resetMemory = resetEventRunMemory();
    const firstNode = fixedRunNodes[0];

    setDemoDeckCardIds(resetDeck);
    setEventRunMemory(resetMemory);
    setCurrentNodeIndex(0);
    setRun(createRunForNode(0, resetDeck, undefined, resetMemory));
    setFlowPhase(getPhaseForRunNode(firstNode));
    setFeedbackIds([]);
    setActiveRewardCardIds([]);
    setSelectedRewardCardId(undefined);
    setSelectedRewardCardIds([]);
    setSelectedEventChoiceId(undefined);
    setEventConsequence(undefined);
    setBriefedScenarioNodeIndexes([]);
    setDialogueExchange(undefined);
    setRiskExposure(createInitialRiskExposure());
    setActivityLog([
      createLogEntry("런이 시작되었습니다. 첫 이벤트에서 선택하세요."),
    ]);
  }

  function handleSelectEventChoice(choice: EventChoice) {
    if (selectedEventChoiceId) {
      return;
    }

    const result = applyEventChoice({
      choice,
      deckCardIds: demoDeckCardIds,
      event: currentEvent,
      memory: eventRunMemory,
      run,
    });

    setRun(result.state);
    setDemoDeckCardIds(result.deckCardIds);
    setEventRunMemory(result.memory);
    setSelectedEventChoiceId(choice.id);
    setEventConsequence(choice.consequence);
    setDialogueExchange(undefined);
    setActivityLog((entries) =>
      [
        createLogEntry(
          `${choice.label} 선택: ${formatResourceChanges(result.resourceChanges)}`,
          "success",
        ),
        ...entries,
      ].slice(0, 8),
    );
  }

  function handleContinueAfterEvent() {
    if (!selectedEventChoiceId) {
      return;
    }

    const nextNodeIndex = getNextRunNodeIndex(fixedRunNodes, currentNodeIndex);
    const nextNode = getCurrentRunNode(fixedRunNodes, nextNodeIndex);
    const nextRun = createRunForNode(
      nextNodeIndex,
      demoDeckCardIds,
      run,
      eventRunMemory,
    );

    setCurrentNodeIndex(nextNodeIndex);
    setRun(nextRun);
    setFlowPhase(getPhaseForRunNode(nextNode));
    setSelectedEventChoiceId(undefined);
    setEventConsequence(undefined);
    setDialogueExchange(undefined);
    setFeedbackIds([]);
    setActivityLog([
      createLogEntry(getNodeStartMessage(nextNode)),
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
    setDialogueExchange(
      createDialogueExchange(card, currentScenario, latestDecision?.resourceChanges),
    );
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
      setDialogueExchange(createPressureAdvanceDialogue(currentScenario));

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
    setDialogueExchange(createPressureAdvanceDialogue(currentScenario));
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
    setSelectedRewardCardIds((cardIds) => [...cardIds, card.id]);
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

    const riskCheck = checkRiskCounter({
      exposure: riskExposure,
      kind: "stageTransition",
      run,
      scenario: currentScenario,
    });

    setRiskExposure(riskCheck.exposure);

    if (riskCheck.notice.triggered) {
      setRun(riskCheck.state);
      setFlowPhase("failed");
      setActiveRewardCardIds([]);
      setSelectedRewardCardId(undefined);
      setSelectedEventChoiceId(undefined);
      setEventConsequence(undefined);
      setFeedbackIds([]);
      setDialogueExchange(createRiskTriggeredDialogue(riskCheck.notice));
      setActivityLog((entries) =>
        [
          createLogEntry(riskCheck.notice.message, "failure"),
          createLogEntry("최종 리포트에서 어떤 선택이 리스크를 키웠는지 확인하세요.", "failure"),
          ...entries,
        ].slice(0, 8),
      );
      return;
    }

    const nextNodeIndex = getNextRunNodeIndex(fixedRunNodes, currentNodeIndex);
    const nextNode = getCurrentRunNode(fixedRunNodes, nextNodeIndex);
    const nextRun = createRunForNode(
      nextNodeIndex,
      demoDeckCardIds,
      riskCheck.state,
      eventRunMemory,
    );

    setCurrentNodeIndex(nextNodeIndex);
    setRun(nextRun);
    setFlowPhase(getPhaseForRunNode(nextNode));
    setActiveRewardCardIds([]);
    setSelectedRewardCardId(undefined);
    setSelectedEventChoiceId(undefined);
    setEventConsequence(undefined);
    setDialogueExchange(undefined);
    setBriefedScenarioNodeIndexes((indexes) =>
      nextNode?.type === "scenario" ? indexes.filter((index) => index !== nextNodeIndex) : indexes,
    );
    setFeedbackIds([]);
    setActivityLog([
      createLogEntry(riskCheck.notice.message),
      createLogEntry(getNodeStartMessage(nextNode)),
    ]);
  }

  function handleRiskyProceed() {
    if (flowPhase !== "scenario" || isResolved) {
      return;
    }

    const proceedResult = applyRiskyProceed(run);
    const riskCheck = checkRiskCounter({
      exposure: riskExposure,
      kind: "riskyProceed",
      run: proceedResult.state,
      scenario: currentScenario,
    });

    setRiskExposure(riskCheck.exposure);

    if (riskCheck.notice.triggered) {
      setRun(riskCheck.state);
      setFlowPhase("failed");
      setActiveRewardCardIds([]);
      setSelectedRewardCardId(undefined);
      setSelectedEventChoiceId(undefined);
      setEventConsequence(undefined);
      setFeedbackIds([]);
      setDialogueExchange(createRiskTriggeredDialogue(riskCheck.notice));
      setActivityLog((entries) =>
        [
          createLogEntry(riskCheck.notice.message, "failure"),
          createLogEntry(
            `상황을 빠르게 넘긴 결과: ${formatResourceChanges(proceedResult.resourceChanges)}`,
            "failure",
          ),
          ...entries,
        ].slice(0, 8),
      );
      return;
    }

    if (currentRunNode.isFinal) {
      setRun({
        ...riskCheck.state,
        phase: "complete",
      });
      setFlowPhase("complete");
      setFeedbackIds([]);
      setDialogueExchange(createRiskyProceedDialogue(currentScenario));
      setActivityLog((entries) =>
        [
          createLogEntry("최종 상황을 리스크가 남은 상태로 마무리했습니다.", "success"),
          createLogEntry(riskCheck.notice.message),
          ...entries,
        ].slice(0, 8),
      );
      return;
    }

    const nextNodeIndex = getNextRunNodeIndex(fixedRunNodes, currentNodeIndex);
    const nextNode = getCurrentRunNode(fixedRunNodes, nextNodeIndex);
    const nextRun = createRunForNode(
      nextNodeIndex,
      demoDeckCardIds,
      riskCheck.state,
      eventRunMemory,
    );

    setCurrentNodeIndex(nextNodeIndex);
    setRun(nextRun);
    setFlowPhase(getPhaseForRunNode(nextNode));
    setActiveRewardCardIds([]);
    setSelectedRewardCardId(undefined);
    setSelectedEventChoiceId(undefined);
    setEventConsequence(undefined);
    setFeedbackIds([]);
    setDialogueExchange(createRiskyProceedDialogue(currentScenario));
    setBriefedScenarioNodeIndexes((indexes) =>
      nextNode?.type === "scenario" ? indexes.filter((index) => index !== nextNodeIndex) : indexes,
    );
    setActivityLog([
      createLogEntry(
        `상황을 리스크가 남은 상태로 넘겼습니다. ${formatResourceChanges(proceedResult.resourceChanges)}`,
      ),
      createLogEntry(riskCheck.notice.message),
      createLogEntry(getNodeStartMessage(nextNode)),
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

        <section
          className={`game-hud ${showResourceHud ? "" : "game-hud-single"}`}
          aria-label="런 상황 요약"
        >
          <RunProgress phase={flowPhase} progress={runProgress} />
          {showResourceHud ? (
            <ResourcePanel
              maxAttention={run.player.maxAttention}
              maxTime={run.player.maxTime}
              resources={run.player.resources}
              turnResource={run.player.turnResource}
            />
          ) : null}
        </section>

        {flowPhase === "intro" ? (
          <section className="state-panel" aria-label="런 시작">
            <p className="eyebrow">런 시작</p>
            <h2>이벤트와 업무 상황을 순서대로 해결하세요</h2>
            <p>
              짧은 이벤트 선택은 다음 상황의 리스크, 증빙, 신뢰, 압박 또는 덱
              흐름에 영향을 줍니다.
            </p>
            <div className="state-actions">
              <button className="primary-button" onClick={startFreshRun} type="button">
                런 시작
              </button>
            </div>
          </section>
        ) : null}

        {showEventNode ? (
          <section className="event-board" aria-label="이벤트 판단 보드">
              <EventNode
                consequence={eventConsequence}
                deckSize={demoDeckCardIds.length}
                event={currentEvent}
                illustrationSrc={getEventIllustrationSrc(currentEvent.id)}
                onContinue={handleContinueAfterEvent}
                onSelect={handleSelectEventChoice}
                selectedChoiceId={selectedEventChoiceId}
              />

            <aside className="event-side-panel" aria-label="이벤트 적용 상태">
              <section className="zone-counts board-widget" aria-label="덱 상태">
                <h2>덱 상태</h2>
                <dl>
                  <div>
                    <dt>런 덱</dt>
                    <dd>{demoDeckCardIds.length}</dd>
                  </div>
                  <div>
                    <dt>현재 뽑을 카드</dt>
                    <dd>{run.cardZones.drawPile.length}</dd>
                  </div>
                </dl>
              </section>

              <section className="activity-log board-widget" aria-label="최근 진행 기록">
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
        ) : null}

        {showScenarioWorkspace ? (
          <section className="scenario-play-scene" aria-label="상황 플레이 보드">
            {showScenarioBriefing ? (
              <section className="scenario-briefing" aria-label="상황 브리핑">
                <div>
                  <p className="eyebrow">{currentRunNode.title} 브리핑</p>
                  <h2>{formatUiText(currentScenario.title)}</h2>
                  <p>{formatUiText(currentScenario.setup)}</p>
                </div>

                <div className="briefing-grid">
                  <section className="briefing-card" aria-label="이번 상황 목표">
                    <h3>이번 상황 목표</h3>
                    <p>{formatThresholdList(currentScenario.successThresholds)}</p>
                    <span>{formatRemainingGoals(run.player.resources, currentScenario.successThresholds)}</span>
                  </section>

                  <section className="briefing-card" aria-label="주의할 위험 신호">
                    <h3>주의할 위험 신호</h3>
                    <p>
                      {currentScenario.pressureSignals
                        .filter((signal) => signal.visible)
                        .map((signal) => formatUiText(signal.label))
                        .join(" · ")}
                    </p>
                    <span>{currentScenario.turnLimit ? `권장 ${currentScenario.turnLimit}턴 안에 정리` : "압박이 커지기 전에 정리"}</span>
                  </section>
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    setBriefedScenarioNodeIndexes((indexes) => [
                      ...new Set([...indexes, currentNodeIndex]),
                    ])
                  }
                  type="button"
                >
                  상황 대응 시작
                </button>
              </section>
            ) : null}

            {showScenarioBoard ? (
              <>
            <section className="scenario-board" aria-label="상황 판단판">
              <div className="scenario-main-stack">
                <section className="scenario-panel" aria-label="현재 시나리오">
                  <div className="scenario-card-face">
                    <p className="eyebrow">{currentRunNode.title}</p>
                    <h2>{formatUiText(currentScenario.title)}</h2>
                    <p className="scenario-copy">{formatUiText(currentScenario.summary)}</p>
                    <p className="scenario-setup">{formatUiText(currentScenario.setup)}</p>
                    <div className="scenario-stage-meta" aria-label="현재 판단 상태">
                      <span>{formatOutcomeLabel(outcome)}</span>
                      <span>
                        {activeScenario?.turnNumber ?? 1}턴
                        {currentScenario.turnLimit
                          ? ` / 권장 ${currentScenario.turnLimit}턴`
                          : ""}
                      </span>
                    </div>
                    <div className="encounter-stage" aria-label="상황 대응 구도">
                      <div className="actor-card player-actor">
                        <img
                          alt=""
                          className="actor-sprite player-sprite"
                          src={gameArt.player}
                        />
                        <strong>나의 대응팀</strong>
                        <span>증빙 {run.player.resources.evidence} · 신뢰 {run.player.resources.trust}</span>
                      </div>

                      <div className="resolution-meter" aria-label="상황 해결도">
                        <span>상황 해결도</span>
                        <strong>{resolutionPercent}%</strong>
                        <div className="meter-track">
                          <span style={{ width: `${resolutionPercent}%` }} />
                        </div>
                        <small>{formatRemainingGoals(run.player.resources, currentScenario.successThresholds)}</small>
                      </div>

                      <div className="actor-card pressure-actor">
                        <img
                          alt=""
                          className="actor-sprite pressure-sprite"
                          src={pressureActor.imageSrc}
                        />
                        <strong>{pressureActor.label}</strong>
                        <span>리스크 {run.player.resources.risk} · 압박 {run.player.resources.pressure}</span>
                      </div>
                    </div>
                    {dialogueExchange ? (
                      <section
                        className={`dialogue-panel ${dialogueExchange.tone ?? "info"}`}
                        aria-label="상황 대화"
                      >
                        <div className="dialogue-line player-line">
                          <span>나의 대응</span>
                          <p>{dialogueExchange.playerLine}</p>
                        </div>
                        <div className="dialogue-line pressure-line">
                          <span>{pressureActor.label}</span>
                          <p>{dialogueExchange.pressureLine}</p>
                        </div>
                        {dialogueExchange.summary ? (
                          <p className="dialogue-summary">{dialogueExchange.summary}</p>
                        ) : null}
                      </section>
                    ) : null}
                    <p className="scenario-objective">
                      목표: {formatThresholdList(currentScenario.successThresholds)}
                    </p>
                  </div>
                </section>
              </div>

              <aside className="board-side-panel" aria-label="상황 신호와 진행 기록">
                {activeScenario ? (
                  <ScenarioStatus
                    activeSignalIds={activeScenario.activeSignalIds}
                    outcome={activeScenario.outcome}
                    scenario={currentScenario}
                    turnNumber={activeScenario.turnNumber}
                  />
                ) : null}

                <section
                  className={`risk-check-panel board-widget ${
                    riskExposure.lastNotice?.triggered ? "failure" : "warning"
                  }`}
                  aria-label="단계 사이 점검 리스크"
                >
                  <h2>점검 리스크</h2>
                  <strong>{riskExposure.lastNotice?.chance ?? 0}%</strong>
                  <p>
                    {riskExposure.lastNotice
                      ? riskExposure.lastNotice.message
                      : "리스크를 남긴 채 진행하면 공정위, 감사, 개인정보 점검 가능성이 누적됩니다."}
                  </p>
                  <span>누적 노출 {riskExposure.score} · 점검 {riskExposure.checks}회</span>
                </section>

                <section className="feedback-panel board-widget" aria-label="학습 피드백">
                  <h2>학습 피드백</h2>
                  {latestFeedback.length > 0 ? (
                    latestFeedback.map((message) => <p key={message}>{message}</p>)
                  ) : (
                    <p className="empty-copy">카드를 실행하면 짧은 피드백이 표시됩니다.</p>
                  )}
                </section>

                <section className="activity-log board-widget" aria-label="최근 진행 기록">
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

            {showRewardChoice ? (
              <RewardChoice
                deckSize={demoDeckCardIds.length}
                onContinue={handleContinueAfterReward}
                onSelect={handleSelectReward}
                options={activeRewardOptions}
                selectedCardId={selectedRewardCardId}
              />
            ) : (
              <section className="hand-dock" aria-label="조치 선택">
                <div className="hand-panel">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">손패</p>
                      <h2>이번 턴의 조치</h2>
                    </div>
                    <p className="hand-zone-summary">
                      뽑을 카드 {run.cardZones.drawPile.length} · 버림{" "}
                      {run.cardZones.discardPile.length}
                    </p>
                    <div className="turn-controls">
                      <button
                        className="risk-button"
                        disabled={isResolved}
                        onClick={handleRiskyProceed}
                        type="button"
                      >
                        리스크 안고 진행
                      </button>
                      <button
                        className="primary-button turn-button"
                        disabled={isResolved}
                        onClick={handleEndTurn}
                        type="button"
                      >
                        턴 종료
                      </button>
                    </div>
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
              </section>
            )}
              </>
            ) : null}
          </section>
        ) : null}

        {finalReport ? (
          <FinalReport onReplay={startFreshRun} report={finalReport} />
        ) : null}
      </section>
    </main>
  );
}

function getScenarioForNodeIndex(nodeIndex: number): Scenario {
  const node = getCurrentRunNode(fixedRunNodes, nodeIndex);

  if (node?.type !== "scenario") {
    return scenarios[0];
  }

  return scenarios.find((scenario) => scenario.id === node.scenarioId) ?? scenarios[0];
}

function getEventForNodeIndex(nodeIndex: number): RunEvent {
  const node = getCurrentRunNode(fixedRunNodes, nodeIndex);

  if (node?.type !== "event") {
    return events[0];
  }

  return getEventById(events, node.eventId) ?? events[0];
}

function createRewardCardIds(deckCardIds: readonly GameId[]): GameId[] {
  return getCardRewardOptions(cards, deckCardIds, 3, { shuffle: true }).map((card) => card.id);
}

function createRunForNode(
  nodeIndex: number,
  deckCardIds: readonly GameId[],
  previousRun: RunState | undefined,
  eventMemory: EventRunMemory,
): RunState {
  const node = getCurrentRunNode(fixedRunNodes, nodeIndex);

  if (node?.type === "scenario") {
    return createPlayableRun(
      getScenarioForNodeIndex(nodeIndex),
      deckCardIds,
      nodeIndex,
      previousRun,
      eventMemory,
    );
  }

  return createEventRun(nodeIndex, deckCardIds, previousRun, eventMemory);
}

function createEventRun(
  nodeIndex: number,
  deckCardIds: readonly GameId[],
  previousRun: RunState | undefined,
  eventMemory: EventRunMemory,
): RunState {
  return {
    id: "fixed-run",
    phase: "event",
    nodeIndex,
    player: createPlayerStateFromEventMemory(eventMemory),
    cardZones: createStartingDeck(deckCardIds, { shuffle: true }),
    availableRewardIds: [],
    completedScenarioIds: [...(previousRun?.completedScenarioIds ?? [])],
    decisionLog: [...(previousRun?.decisionLog ?? [])],
  };
}

function createPlayableRun(
  scenario: Scenario,
  deckCardIds: readonly GameId[],
  nodeIndex: number,
  previousRun: RunState | undefined,
  eventMemory: EventRunMemory,
): RunState {
  const adjustedScenario = createScenarioWithEventResources(scenario, eventMemory);
  const baseRun: RunState = {
    id: "fixed-run",
    phase: "notStarted",
    nodeIndex,
    player: createInitialPlayerState(),
    cardZones: createStartingDeck(deckCardIds, { shuffle: true }),
    availableRewardIds: [],
    completedScenarioIds: [...(previousRun?.completedScenarioIds ?? [])],
    decisionLog: [...(previousRun?.decisionLog ?? [])],
  };
  const scenarioRun = startScenario(baseRun, adjustedScenario);
  const drawResult = drawCards(scenarioRun.cardZones, handSize);

  return {
    ...scenarioRun,
    cardZones: drawResult.state,
  };
}

function createScenarioWithEventResources(
  scenario: Scenario,
  eventMemory: EventRunMemory,
): Scenario {
  return {
    ...scenario,
    startingResources: applyResourceDeltas(
      scenario.startingResources ?? {},
      eventMemory.resourceChanges,
    ),
  };
}

function createPlayerStateFromEventMemory(eventMemory: EventRunMemory) {
  const player = createInitialPlayerState();

  return {
    ...player,
    resources: applyResourceDeltas(player.resources, eventMemory.resourceChanges),
  };
}

function applyResourceDeltas<T extends Partial<PlayerResources>>(
  resources: T,
  changes: Partial<Record<MetricKey, number>>,
): T {
  return Object.entries(changes).reduce<T>(
    (nextResources, [resource, amount]) => ({
      ...nextResources,
      [resource]: clampMinimum(
        ((nextResources as Partial<Record<MetricKey, number>>)[resource as MetricKey] ?? 0) +
          (amount ?? 0),
      ),
    }),
    { ...resources },
  );
}

function markScenarioComplete(run: RunState, scenarioId: GameId): RunState {
  return {
    ...run,
    completedScenarioIds: [...new Set([...run.completedScenarioIds, scenarioId])],
  };
}

function getNodeStartMessage(node: FixedRunNode | undefined): string {
  if (!node) {
    return "런이 마무리되었습니다.";
  }

  if (node.type === "event") {
    return `${node.title}가 열렸습니다. 짧은 선택을 진행하세요.`;
  }

  return `${node.title}이 시작되었습니다. 조치를 선택하세요.`;
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

function formatOutcomeLabel(outcome: ScenarioOutcome | undefined): string {
  if (outcome === "success") {
    return "상황 해결";
  }

  if (outcome === "failure") {
    return "리스크 확대";
  }

  return "판단 진행 중";
}

function getResolutionPercent(run: RunState, scenario: Scenario): number {
  if (!run.activeScenario) {
    return 0;
  }

  if (run.activeScenario.outcome === "success") {
    return 100;
  }

  const progressRatio = run.activeScenario.successProgress / scenarioProgressTarget;
  const thresholdRatio =
    scenario.successThresholds.length > 0
      ? scenario.successThresholds.filter((threshold) =>
          isThresholdSatisfied(run.player.resources, threshold),
        ).length / scenario.successThresholds.length
      : 0;

  return Math.round(Math.min(1, Math.max(progressRatio, thresholdRatio)) * 100);
}

function isThresholdSatisfied(
  resources: PlayerResources,
  threshold: ResourceThreshold,
): boolean {
  const value = resources[threshold.resource];

  if (threshold.operator === "atMost") {
    return value <= threshold.value;
  }

  return value >= threshold.value;
}

function formatThresholdList(thresholds: readonly ResourceThreshold[]): string {
  return thresholds.map((threshold) => formatThreshold(threshold)).join(" · ");
}

function formatThreshold(threshold: ResourceThreshold): string {
  const label = metricLabels[threshold.resource];
  const operator = threshold.operator === "atMost" ? "이하" : "이상";

  return `${label} ${threshold.value} ${operator}`;
}

function formatRemainingGoals(
  resources: PlayerResources,
  thresholds: readonly ResourceThreshold[],
): string {
  const remaining = thresholds
    .map((threshold) => {
      const current = resources[threshold.resource];
      const label = metricLabels[threshold.resource];

      if (threshold.operator === "atMost" && current > threshold.value) {
        return `${label} ${current - threshold.value} 낮추기`;
      }

      if (threshold.operator === "atLeast" && current < threshold.value) {
        return `${label} ${threshold.value - current} 확보`;
      }

      return undefined;
    })
    .filter((goal): goal is string => Boolean(goal));

  return remaining.length > 0 ? remaining.join(" · ") : "목표 조건 충족";
}

function getEventIllustrationSrc(eventId: GameId): string | undefined {
  return gameArt.events[eventId as keyof typeof gameArt.events];
}

function getPressureActor(scenario: Scenario): { imageSrc: string; label: string; tone: string } {
  if (scenario.id.includes("vendor-gift")) {
    return {
      imageSrc: gameArt.actors.vendor,
      label: "협력사 담당자",
      tone: "vendor",
    };
  }

  if (scenario.id.includes("personal-data")) {
    return {
      imageSrc: gameArt.actors.colleague,
      label: "급한 동료",
      tone: "colleague",
    };
  }

  if (scenario.id.includes("expense")) {
    return {
      imageSrc: gameArt.actors.manager,
      label: "마감 압박 상사",
      tone: "manager",
    };
  }

  if (scenario.id.includes("family-vendor")) {
    return {
      imageSrc: gameArt.actors.vendor,
      label: "추천 압박 관계자",
      tone: "vendor",
    };
  }

  if (scenario.id.includes("retaliation")) {
    return {
      imageSrc: gameArt.actors.social,
      label: "침묵을 바라는 분위기",
      tone: "social",
    };
  }

  return {
    imageSrc: gameArt.actors.client,
    label: "계약 압박 고객",
    tone: "client",
  };
}

function createDialogueExchange(
  card: Card,
  scenario: Scenario,
  resourceChanges: Partial<Record<MetricKey, number>> | undefined,
): DialogueExchange {
  return {
    id: createDialogueId(),
    playerLine: getPlayerLineForCard(card),
    pressureLine: getPressureResponseLine(scenario),
    summary: `변화: ${formatResourceChanges(resourceChanges)}`,
    tone: getDialogueTone(resourceChanges),
  };
}

function createPressureAdvanceDialogue(scenario: Scenario): DialogueExchange {
  return {
    id: createDialogueId(),
    playerLine: "잠시 판단을 미루고 다음 손패를 준비합니다.",
    pressureLine: getPressureAdvanceLine(scenario),
    summary: "시간이 지나며 상황 압박이 반영되었습니다.",
    tone: "info",
  };
}

function createRiskyProceedDialogue(scenario: Scenario): DialogueExchange {
  return {
    id: createDialogueId(),
    playerLine: "확인을 끝내지 못했지만 일단 다음 단계로 넘깁니다.",
    pressureLine: getRiskyProceedResponseLine(scenario),
    summary: "단기 압박은 줄었지만 점검 리스크가 누적되었습니다.",
    tone: "failure",
  };
}

function createRiskTriggeredDialogue(notice: RiskCounterNotice): DialogueExchange {
  return {
    id: createDialogueId(),
    playerLine: "남은 리스크가 외부 점검에서 드러났습니다.",
    pressureLine: notice.message,
    summary: `점검 확률 ${notice.chance}% · 확인값 ${notice.roll}`,
    tone: "failure",
  };
}

function getPlayerLineForCard(card: Card): string {
  if (card.category === "protectData") {
    return "정책상 바로 공유하기는 어렵습니다. 목적, 승인 범위, 최소 항목부터 확인하겠습니다.";
  }

  if (card.category === "checkPolicy") {
    return "잠깐만요. 정책과 승인 기준을 먼저 확인하고 움직이겠습니다.";
  }

  if (card.category === "document" || card.category === "preserveEvidence") {
    return "지금 확인한 사실을 남기겠습니다. 말로만 넘기지 않겠습니다.";
  }

  if (card.category === "consult" || card.category === "escalate") {
    return "혼자 결정하지 않겠습니다. 책임자와 확인한 뒤 답하겠습니다.";
  }

  if (card.category === "refuse") {
    return "이 방식으로는 진행하기 어렵습니다. 안전한 대안을 다시 잡겠습니다.";
  }

  if (card.category === "ask") {
    return "필요한 목적과 근거를 먼저 알려주세요. 그다음 가능한 범위를 보겠습니다.";
  }

  return "바로 넘기지 않고 위험 신호를 확인하면서 대응하겠습니다.";
}

function getPressureResponseLine(scenario: Scenario): string {
  if (scenario.id.includes("personal-data")) {
    return "우리끼리 이 정도는 바로 처리해도 되잖아요. 지금 정말 급합니다.";
  }

  if (scenario.id.includes("vendor-gift")) {
    return "좋은 관계로 생각해 주시면 됩니다. 너무 어렵게 보지 않으셔도 됩니다.";
  }

  if (scenario.id.includes("expense")) {
    return "마감이 먼저입니다. 나중에 정리하면 되지 않을까요?";
  }

  if (scenario.id.includes("family-vendor")) {
    return "아는 곳이라 더 빠르게 맞출 수 있습니다. 절차는 크게 문제 없을 겁니다.";
  }

  if (scenario.id.includes("retaliation")) {
    return "괜히 일을 키우면 분위기만 더 불편해질 수 있어요.";
  }

  return "이번 건은 빨리 정리해야 합니다. 절차가 길어지면 부담이 커집니다.";
}

function getPressureAdvanceLine(scenario: Scenario): string {
  if (scenario.id.includes("personal-data")) {
    return "시간이 없습니다. 지금 못 받으면 업무가 막힙니다.";
  }

  if (scenario.id.includes("vendor-gift")) {
    return "계약 일정도 있으니 오늘 안에 방향을 주시면 좋겠습니다.";
  }

  if (scenario.id.includes("expense")) {
    return "마감 시간이 지나고 있습니다. 빨리 정리해 주세요.";
  }

  return "결정이 늦어질수록 주변 압박이 커지고 있습니다.";
}

function getRiskyProceedResponseLine(scenario: Scenario): string {
  if (scenario.id.includes("vendor-gift")) {
    return "그럼 계약은 바로 진행되는 것으로 알고 준비하겠습니다.";
  }

  if (scenario.id.includes("personal-data")) {
    return "고마워요. 일단 받은 자료로 급한 건 처리하겠습니다.";
  }

  if (scenario.id.includes("expense")) {
    return "좋습니다. 마감은 넘겼으니 정리는 나중에 보죠.";
  }

  return "좋습니다. 일단 진행된 것으로 알고 다음 단계로 넘기겠습니다.";
}

function getDialogueTone(
  resourceChanges: Partial<Record<MetricKey, number>> | undefined,
): DialogueExchange["tone"] {
  if (!resourceChanges) {
    return "info";
  }

  if ((resourceChanges.risk ?? 0) > 0 || (resourceChanges.pressure ?? 0) > 0) {
    return "failure";
  }

  if (
    (resourceChanges.risk ?? 0) < 0 ||
    (resourceChanges.evidence ?? 0) > 0 ||
    (resourceChanges.trust ?? 0) > 0
  ) {
    return "success";
  }

  return "info";
}

function createDialogueId(): string {
  return `dialogue-${Date.now()}-${Math.random()}`;
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

function clampMinimum(value: number): number {
  return Math.max(0, value);
}
