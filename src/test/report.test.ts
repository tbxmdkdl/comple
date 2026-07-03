import { describe, expect, it } from "vitest";
import { cards, events, scenarios, startingDeckCardIds } from "../data";
import {
  createInitialPlayerState,
  createStartingDeck,
  generateFinalReport,
} from "../game";
import type {
  ActiveScenarioState,
  DecisionLogEntry,
  GameId,
  PlayerResources,
  RunState,
} from "../game";

describe("final learning report", () => {
  it("creates a completed-run report with outcome, grade, and key sections", () => {
    const run = createReportRun({
      activeScenario: {
        activeSignalIds: [],
        failureProgress: 0,
        outcome: "success",
        scenarioId: "informal-sales-side-letter",
        successProgress: 2,
        turnNumber: 3,
      },
      completedScenarioIds: [
        "vendor-gift-pressure",
        "personal-data-personal-email",
        "informal-sales-side-letter",
      ],
      resources: {
        risk: 1,
        evidence: 5,
        trust: 5,
        pressure: 2,
        attention: 3,
      },
    });
    const report = generateFinalReport({
      cards,
      events,
      outcome: "completed",
      run,
      scenarios,
      selectedEventChoiceIds: {
        "lunch-briefing": "listen-for-policy-cue",
        "organize-notes": "write-clear-notes",
      },
      selectedRewardCardIds: ["safe-channel"],
    });

    expect(report.outcome).toBe("completed");
    expect(report.grade).toMatch(/[ABCD]/);
    expect(report.gradeLabel).not.toBe("");
    expect(report.riskSummary).toContain("리스크");
    expect(report.strongestBehavior).not.toBe("");
    expect(report.improvementArea).not.toBe("");
    expect(report.keyDecisions.length).toBeGreaterThanOrEqual(3);
    expect(report.recommendedTopics.length).toBeGreaterThanOrEqual(2);
    expect(report.takeaways.length).toBeGreaterThanOrEqual(2);
  });

  it("creates a useful failed-run report", () => {
    const run = createReportRun({
      activeScenario: {
        activeSignalIds: ["unsafe-transfer-channel"],
        failureProgress: 2,
        outcome: "failure",
        scenarioId: "personal-data-personal-email",
        successProgress: 0,
        turnNumber: 4,
      },
      completedScenarioIds: ["vendor-gift-pressure"],
      resources: {
        risk: 9,
        evidence: 1,
        trust: 2,
        pressure: 7,
        attention: 0,
      },
    });
    const report = generateFinalReport({
      cards,
      events,
      outcome: "failed",
      run,
      scenarios,
      selectedEventChoiceIds: {
        "lunch-briefing": "skip-briefing",
      },
    });

    expect(report.outcome).toBe("failed");
    expect(report.headline).toContain("단서");
    expect(report.riskSummary).toContain("런이 중단");
    expect(report.improvementArea).toBe("리스크 관리");
    expect(report.keyDecisions.some((decision) => decision.label.includes("런 중단"))).toBe(
      true,
    );
    expect(report.takeaways.join(" ")).toContain("다시 시도");
  });

  it("uses actual event choices and selected reward cards in key decisions", () => {
    const run = createReportRun();
    const report = generateFinalReport({
      cards,
      events,
      outcome: "completed",
      run,
      scenarios,
      selectedEventChoiceIds: {
        "lunch-briefing": "listen-for-policy-cue",
      },
      selectedRewardCardIds: ["policy-check"],
    });
    const decisionText = report.keyDecisions
      .map((decision) => `${decision.label} ${decision.detail}`)
      .join(" ");

    expect(decisionText).toContain("짧은 점심 브리핑");
    expect(decisionText).toContain("10분 듣기");
    expect(decisionText).toContain("정책 확인");
  });

  it("keeps scoring deterministic", () => {
    const run = createReportRun();
    const firstReport = generateFinalReport({
      cards,
      events,
      outcome: "completed",
      run,
      scenarios,
    });
    const secondReport = generateFinalReport({
      cards,
      events,
      outcome: "completed",
      run,
      scenarios,
    });

    expect(secondReport).toEqual(firstReport);
  });

  it("does not mutate input run state", () => {
    const run = createReportRun();
    const before = JSON.parse(JSON.stringify(run));

    generateFinalReport({
      cards,
      events,
      outcome: "completed",
      run,
      scenarios,
      selectedRewardCardIds: ["safe-channel"],
    });

    expect(run).toEqual(before);
  });
});

function createReportRun({
  activeScenario = {
    activeSignalIds: [],
    failureProgress: 0,
    outcome: "success",
    scenarioId: "informal-sales-side-letter",
    successProgress: 2,
    turnNumber: 3,
  },
  completedScenarioIds = [
    "vendor-gift-pressure",
    "personal-data-personal-email",
    "informal-sales-side-letter",
  ],
  resources = {
    risk: 2,
    evidence: 4,
    trust: 4,
    pressure: 3,
    attention: 2,
  },
}: {
  activeScenario?: ActiveScenarioState;
  completedScenarioIds?: GameId[];
  resources?: PlayerResources;
} = {}): RunState {
  return {
    id: "report-test-run",
    phase: "complete",
    nodeIndex: 5,
    player: createInitialPlayerState({ resources }),
    cardZones: createStartingDeck(startingDeckCardIds),
    activeScenario,
    availableRewardIds: [],
    completedScenarioIds,
    decisionLog: createDecisionLog(resources),
  };
}

function createDecisionLog(resources: PlayerResources): DecisionLogEntry[] {
  return [
    {
      id: "decision-1",
      type: "playCard",
      nodeIndex: 1,
      turnNumber: 1,
      scenarioId: "vendor-gift-pressure",
      cardId: "policy-check",
      summary: "카드 사용: 정책 확인",
      resourceSnapshot: resources,
      resourceChanges: { evidence: 1, pressure: 1 },
      feedbackIds: ["feedback-policy-as-basis"],
    },
    {
      id: "decision-2",
      type: "playCard",
      nodeIndex: 1,
      turnNumber: 2,
      scenarioId: "vendor-gift-pressure",
      cardId: "fact-memo",
      summary: "카드 사용: 사실 메모",
      resourceSnapshot: resources,
      resourceChanges: { evidence: 2, trust: -1 },
      feedbackIds: ["feedback-document-for-traceability"],
    },
    {
      id: "decision-3",
      type: "playCard",
      nodeIndex: 3,
      turnNumber: 1,
      scenarioId: "personal-data-personal-email",
      cardId: "safe-channel",
      summary: "카드 사용: 안전 채널 제안",
      resourceSnapshot: resources,
      resourceChanges: { risk: -2, pressure: 1 },
      feedbackIds: ["feedback-safe-data-path"],
    },
  ];
}
