import type {
  Card,
  CardCategory,
  ComplianceTopic,
  DecisionLogEntry,
  Event,
  FinalReport,
  FinalReportGrade,
  FinalReportKeyDecision,
  FinalReportOutcome,
  GameId,
  MetricKey,
  PlayerResources,
  RunState,
  Scenario,
} from "./types";

export type GenerateFinalReportInput = {
  run: RunState;
  outcome: FinalReportOutcome;
  cards: readonly Card[];
  scenarios: readonly Scenario[];
  events: readonly Event[];
  selectedEventChoiceIds?: Readonly<Record<GameId, GameId>>;
  selectedRewardCardIds?: readonly GameId[];
};

type BehaviorLabel =
  | "사실관계 확인"
  | "정책 확인"
  | "증빙 구축"
  | "안전한 경로 제안"
  | "적절한 상담/보고"
  | "근거 있는 거절"
  | "신뢰 관리"
  | "압박 관리"
  | "리스크 관리";

type CoreMetricKey = "risk" | "evidence" | "trust" | "pressure";

const behaviorByCategory: Record<CardCategory, BehaviorLabel> = {
  ask: "사실관계 확인",
  checkPolicy: "정책 확인",
  consult: "적절한 상담/보고",
  document: "증빙 구축",
  escalate: "적절한 상담/보고",
  manageConflict: "압박 관리",
  observe: "사실관계 확인",
  prepareAudit: "증빙 구축",
  preserveEvidence: "증빙 구축",
  protectData: "안전한 경로 제안",
  refuse: "근거 있는 거절",
  repairTrust: "신뢰 관리",
};

const topicLabels: Record<ComplianceTopic, string> = {
  approvalProcess: "승인 경로와 상담",
  confidentialInformation: "개인정보/기밀정보 보호",
  conflictOfInterest: "이해충돌 관리",
  dataPrivacy: "개인정보/기밀정보 보호",
  expensesAccounting: "증빙과 기록",
  generalCompliance: "압박 상황에서의 의사결정",
  giftsHospitality: "정책 확인",
  retaliation: "보복 방지와 문제 제기",
  thirdPartyRisk: "승인 경로와 상담",
};

const gradeLabels: Record<FinalReportGrade, string> = {
  A: "안정적인 판단",
  B: "대체로 안전한 대응",
  C: "보완이 필요한 대응",
  D: "리스크 노출이 큰 대응",
};

export function generateFinalReport({
  cards,
  events,
  outcome,
  run,
  scenarios,
  selectedEventChoiceIds = {},
  selectedRewardCardIds = [],
}: GenerateFinalReportInput): FinalReport {
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const scenariosById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const metrics = pickCoreMetrics(run.player.resources);
  const score = calculateScore({
    metrics,
    outcome,
    scenariosCompleted: run.completedScenarioIds.length,
  });
  const grade = getGrade(score);
  const strongestBehavior = getStrongestBehavior(run.decisionLog, cardsById, metrics);
  const improvementArea = getImprovementArea(
    run.decisionLog,
    cardsById,
    metrics,
    strongestBehavior,
  );

  return {
    outcome,
    grade,
    gradeLabel: gradeLabels[grade],
    score,
    headline:
      outcome === "completed"
        ? "마지막 상황까지 판단을 마쳤습니다."
        : "이번 런은 중단됐지만 다음 판단에 쓸 단서가 남았습니다.",
    riskSummary: createRiskSummary(outcome, metrics),
    strongestBehavior,
    improvementArea,
    keyDecisions: buildKeyDecisions({
      cardsById,
      events,
      outcome,
      run,
      scenariosById,
      selectedEventChoiceIds,
      selectedRewardCardIds,
    }),
    recommendedTopics: buildRecommendedTopics({
      cardsById,
      events,
      metrics,
      run,
      scenariosById,
      selectedEventChoiceIds,
    }),
    takeaways: buildTakeaways(outcome, metrics, strongestBehavior, improvementArea),
    metrics,
    scenariosCompleted: run.completedScenarioIds.length,
  };
}

function calculateScore({
  metrics,
  outcome,
  scenariosCompleted,
}: {
  metrics: Pick<PlayerResources, CoreMetricKey>;
  outcome: FinalReportOutcome;
  scenariosCompleted: number;
}): number {
  const baseScore = outcome === "completed" ? 72 : 42;
  const score =
    baseScore -
    metrics.risk * 3 +
    metrics.evidence * 4 +
    scenariosCompleted * 4 +
    (metrics.trust >= 4 ? 6 : 0) -
    (metrics.trust <= 1 ? 8 : 0) -
    metrics.pressure * 2;

  return clamp(Math.round(score), 0, 100);
}

function getGrade(score: number): FinalReportGrade {
  if (score >= 85) {
    return "A";
  }

  if (score >= 70) {
    return "B";
  }

  if (score >= 55) {
    return "C";
  }

  return "D";
}

function getStrongestBehavior(
  decisionLog: readonly DecisionLogEntry[],
  cardsById: ReadonlyMap<GameId, Card>,
  metrics: Pick<PlayerResources, CoreMetricKey>,
): BehaviorLabel {
  const scoredBehaviors = scoreBehaviors(decisionLog, cardsById);

  if (scoredBehaviors.length > 0) {
    return scoredBehaviors[0][0];
  }

  if (metrics.evidence >= 4) {
    return "증빙 구축";
  }

  if (metrics.risk <= 2) {
    return "리스크 관리";
  }

  if (metrics.trust >= 5) {
    return "신뢰 관리";
  }

  if (metrics.pressure <= 2) {
    return "압박 관리";
  }

  return "사실관계 확인";
}

function getImprovementArea(
  decisionLog: readonly DecisionLogEntry[],
  cardsById: ReadonlyMap<GameId, Card>,
  metrics: Pick<PlayerResources, CoreMetricKey>,
  strongestBehavior: BehaviorLabel,
): BehaviorLabel {
  const metricFallbacks: BehaviorLabel[] = [
    ...(metrics.risk >= 6 ? ["리스크 관리" as const] : []),
    ...(metrics.pressure >= 6 ? ["압박 관리" as const] : []),
    ...(metrics.evidence <= 1 ? ["증빙 구축" as const] : []),
    ...(metrics.trust <= 2 ? ["신뢰 관리" as const] : []),
  ];
  const firstMetricFallback = metricFallbacks.find(
    (behavior) => behavior !== strongestBehavior,
  );

  if (firstMetricFallback) {
    return firstMetricFallback;
  }

  const playedBehaviors = new Set(
    scoreBehaviors(decisionLog, cardsById).map(([behavior]) => behavior),
  );
  const behaviorGaps: BehaviorLabel[] = [
    "정책 확인",
    "증빙 구축",
    "압박 관리",
    "적절한 상담/보고",
    "신뢰 관리",
  ];

  return (
    behaviorGaps.find(
      (behavior) => !playedBehaviors.has(behavior) && behavior !== strongestBehavior,
    ) ??
    behaviorGaps.find((behavior) => behavior !== strongestBehavior) ??
    "리스크 관리"
  );
}

function scoreBehaviors(
  decisionLog: readonly DecisionLogEntry[],
  cardsById: ReadonlyMap<GameId, Card>,
): [BehaviorLabel, number][] {
  const scores = new Map<BehaviorLabel, number>();

  for (const entry of decisionLog) {
    if (entry.type !== "playCard" || !entry.cardId) {
      continue;
    }

    const card = cardsById.get(entry.cardId);

    if (!card) {
      continue;
    }

    const behavior = behaviorByCategory[card.category];

    scores.set(behavior, (scores.get(behavior) ?? 0) + 1);
  }

  return [...scores.entries()].sort(([leftLabel, leftScore], [rightLabel, rightScore]) => {
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return leftLabel.localeCompare(rightLabel, "ko");
  });
}

function createRiskSummary(
  outcome: FinalReportOutcome,
  metrics: Pick<PlayerResources, CoreMetricKey>,
): string {
  const base =
    outcome === "completed"
      ? `최종 리스크 ${metrics.risk}, 증빙 ${metrics.evidence}, 신뢰 ${metrics.trust}, 압박 ${metrics.pressure}로 런을 마쳤습니다.`
      : `리스크 ${metrics.risk}, 증빙 ${metrics.evidence}, 신뢰 ${metrics.trust}, 압박 ${metrics.pressure} 상태에서 런이 중단되었습니다.`;

  if (metrics.evidence >= 3 && metrics.risk <= 3) {
    return `${base} 근거를 쌓아 리스크를 낮추는 흐름이 비교적 안정적이었습니다.`;
  }

  if (metrics.pressure >= 6) {
    return `${base} 압박이 높아질 때 즉시 처리보다 확인과 기록을 먼저 확보하는 연습이 필요합니다.`;
  }

  if (metrics.evidence <= 1) {
    return `${base} 다음 런에서는 초반에 사실관계와 기록을 더 빨리 확보하면 판단 여지가 넓어집니다.`;
  }

  return `${base} 다음 선택에서는 리스크, 증빙, 신뢰, 압박의 균형을 조금 더 의식해 보세요.`;
}

function buildKeyDecisions({
  cardsById,
  events,
  outcome,
  run,
  scenariosById,
  selectedEventChoiceIds,
  selectedRewardCardIds,
}: {
  cardsById: ReadonlyMap<GameId, Card>;
  events: readonly Event[];
  outcome: FinalReportOutcome;
  run: RunState;
  scenariosById: ReadonlyMap<GameId, Scenario>;
  selectedEventChoiceIds: Readonly<Record<GameId, GameId>>;
  selectedRewardCardIds: readonly GameId[];
}): FinalReportKeyDecision[] {
  const eventDecisions = events
    .map<FinalReportKeyDecision | undefined>((event) => {
      const selectedChoiceId = selectedEventChoiceIds[event.id];
      const choice = event.choices.find((eventChoice) => eventChoice.id === selectedChoiceId);

      if (!choice) {
        return undefined;
      }

      return {
        id: `event:${event.id}`,
        type: "event" as const,
        label: `이벤트 선택: ${formatUiText(event.title)} - ${formatUiText(choice.label)}`,
        detail: formatUiText(choice.consequence),
      };
    })
    .filter((decision): decision is FinalReportKeyDecision => decision !== undefined);
  const rewardDecisions = selectedRewardCardIds
    .map<FinalReportKeyDecision | undefined>((cardId, index) => {
      const card = cardsById.get(cardId);

      if (!card) {
        return undefined;
      }

      return {
        id: `reward:${card.id}:${index}`,
        type: "reward" as const,
        label: `보상 선택: ${formatUiText(card.name)}`,
        detail: `${behaviorByCategory[card.category]} 쪽 대응을 덱에 보강했습니다.`,
      };
    })
    .filter((decision): decision is FinalReportKeyDecision => decision !== undefined);
  const cardDecisions = getRepresentativeCardDecisions(run.decisionLog, cardsById);
  const scenarioDecisions: FinalReportKeyDecision[] = [
    ...run.completedScenarioIds.map((scenarioId) => {
      const scenario = scenariosById.get(scenarioId);

      return {
        id: `scenario:${scenarioId}:success`,
        type: "scenario" as const,
        label: `상황 해결: ${formatUiText(scenario?.title ?? "업무 상황")}`,
        detail: "리스크를 관리하며 다음 단계로 진행했습니다.",
      };
    }),
    ...(outcome === "failed" && run.activeScenario
      ? [
          {
            id: `scenario:${run.activeScenario.scenarioId}:failed`,
            type: "scenario" as const,
            label: `런 중단: ${formatUiText(
              scenariosById.get(run.activeScenario.scenarioId)?.title ?? "업무 상황",
            )}`,
            detail:
              "상황이 더 커지기 전에 초반 확인, 기록, 상담 순서를 다시 시도해 볼 수 있습니다.",
          },
        ]
      : []),
  ];

  return uniqueDecisions([
    ...eventDecisions.slice(0, 2),
    ...cardDecisions.slice(0, 2),
    ...rewardDecisions.slice(0, 1),
    ...scenarioDecisions.slice(-1),
    ...eventDecisions,
    ...rewardDecisions,
    ...scenarioDecisions,
    ...cardDecisions,
  ]).slice(0, 5);
}

function getRepresentativeCardDecisions(
  decisionLog: readonly DecisionLogEntry[],
  cardsById: ReadonlyMap<GameId, Card>,
): FinalReportKeyDecision[] {
  const seenCardIds = new Set<GameId>();
  const decisions: FinalReportKeyDecision[] = [];

  for (const entry of [...decisionLog].reverse()) {
    if (entry.type !== "playCard" || !entry.cardId || seenCardIds.has(entry.cardId)) {
      continue;
    }

    const card = cardsById.get(entry.cardId);

    if (!card) {
      continue;
    }

    seenCardIds.add(entry.cardId);
    decisions.push({
      id: `card:${entry.id}`,
      type: "card",
      label: `조치 실행: ${formatUiText(card.name)}`,
      detail: formatResourceChanges(entry.resourceChanges),
    });
  }

  return decisions;
}

function buildRecommendedTopics({
  cardsById,
  events,
  metrics,
  run,
  scenariosById,
  selectedEventChoiceIds,
}: {
  cardsById: ReadonlyMap<GameId, Card>;
  events: readonly Event[];
  metrics: Pick<PlayerResources, CoreMetricKey>;
  run: RunState;
  scenariosById: ReadonlyMap<GameId, Scenario>;
  selectedEventChoiceIds: Readonly<Record<GameId, GameId>>;
}): string[] {
  const topics: ComplianceTopic[] = [];

  for (const entry of run.decisionLog) {
    if (entry.cardId) {
      topics.push(...(cardsById.get(entry.cardId)?.complianceTopics ?? []));
    }
  }

  for (const scenarioId of run.completedScenarioIds) {
    topics.push(...(scenariosById.get(scenarioId)?.complianceTopics ?? []));
  }

  if (run.activeScenario) {
    topics.push(...(scenariosById.get(run.activeScenario.scenarioId)?.complianceTopics ?? []));
  }

  for (const event of events) {
    if (selectedEventChoiceIds[event.id]) {
      topics.push(...event.complianceTopics);
    }
  }

  const metricTopics = [
    ...(metrics.evidence <= 2 ? ["증빙과 기록"] : []),
    ...(metrics.risk >= 5 ? ["정책 확인"] : []),
    ...(metrics.pressure >= 5 ? ["압박 상황에서의 의사결정"] : []),
    ...(metrics.trust <= 2 ? ["승인 경로와 상담"] : []),
  ];
  const dataTopics = topics.map((topic) => topicLabels[topic]);

  return uniqueStrings([
    ...metricTopics,
    ...dataTopics,
    "정책 확인",
    "증빙과 기록",
    "승인 경로와 상담",
  ]).slice(0, 4);
}

function buildTakeaways(
  outcome: FinalReportOutcome,
  metrics: Pick<PlayerResources, CoreMetricKey>,
  strongestBehavior: BehaviorLabel,
  improvementArea: BehaviorLabel,
): string[] {
  const takeaways = [
    ...(outcome === "failed"
      ? ["실패한 런도 다음 순서를 바꾸는 단서가 됩니다. 초반 확인과 기록부터 다시 시도해 보세요."]
      : []),
    ...(metrics.evidence >= 3
      ? ["증빙을 먼저 쌓으면 단호한 대응이 더 설득력 있게 작동합니다."]
      : ["요청 내용과 판단 근거를 짧게 기록해 두면 이후 확인과 상담이 쉬워집니다."]),
    ...(metrics.pressure >= 5
      ? ["압박이 높아질수록 즉흥적 처리보다 잠시 멈추고 확인하는 선택이 중요합니다."]
      : ["압박을 낮추는 선택은 다음 조치를 차분하게 고를 시간을 만들어 줍니다."]),
    ...(improvementArea === "신뢰 관리"
      ? ["위험한 요청을 거절할 때는 안전한 대안을 함께 제시하면 신뢰 손실을 줄일 수 있습니다."]
      : [`이번 런의 강점인 ${strongestBehavior}을 유지하면서 ${improvementArea} 영역을 조금 더 보강해 보세요.`]),
  ];

  return uniqueStrings(takeaways).slice(0, 3);
}

function formatResourceChanges(
  changes: Partial<Record<MetricKey, number>> | undefined,
): string {
  if (!changes) {
    return "지표 변화 없이 판단 흐름을 이어갔습니다.";
  }

  const metricLabels: Record<MetricKey, string> = {
    attention: "주의력",
    evidence: "증빙",
    pressure: "압박",
    risk: "리스크",
    time: "시간",
    trust: "신뢰",
  };
  const entries = Object.entries(changes).filter(([, amount]) => amount !== 0);

  if (entries.length === 0) {
    return "지표 변화 없이 판단 흐름을 이어갔습니다.";
  }

  return entries
    .map(([metric, amount]) => {
      const sign = (amount ?? 0) > 0 ? "+" : "";

      return `${metricLabels[metric as MetricKey]} ${sign}${amount}`;
    })
    .join(", ");
}

function pickCoreMetrics(
  resources: PlayerResources,
): Pick<PlayerResources, CoreMetricKey> {
  return {
    evidence: resources.evidence,
    pressure: resources.pressure,
    risk: resources.risk,
    trust: resources.trust,
  };
}

function uniqueDecisions(
  decisions: readonly FinalReportKeyDecision[],
): FinalReportKeyDecision[] {
  const seenIds = new Set<GameId>();

  return decisions.filter((decision) => {
    if (seenIds.has(decision.id)) {
      return false;
    }

    seenIds.add(decision.id);
    return true;
  });
}

function uniqueStrings(items: readonly string[]): string[] {
  return [...new Set(items.filter((item) => item.trim() !== ""))];
}

function formatUiText(text: string): string {
  return text
    .replaceAll("증거가", "증빙이")
    .replaceAll("증거는", "증빙은")
    .replaceAll("증거를", "증빙을")
    .replaceAll("증거", "증빙");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
