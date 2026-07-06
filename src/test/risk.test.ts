import { describe, expect, it } from "vitest";
import {
  applyRiskyProceed,
  checkRiskCounter,
  createInitialRiskExposure,
} from "../game";
import type { RunState, Scenario } from "../game";

function createRun(overrides: Partial<RunState> = {}): RunState {
  return {
    id: "risk-test-run",
    phase: "scenario",
    nodeIndex: 1,
    player: {
      activePassiveIds: [],
      flags: [],
      maxAttention: 3,
      resources: {
        attention: 3,
        evidence: 1,
        pressure: 2,
        risk: 4,
        trust: 2,
      },
      turnResource: "attention",
    },
    cardZones: {
      discardPile: [],
      drawPile: [],
      hand: [],
      removedFromRun: [],
    },
    activeScenario: {
      activeSignalIds: [],
      failureProgress: 0,
      outcome: "unresolved",
      scenarioId: "vendor-gift-test",
      successProgress: 0,
      turnNumber: 1,
    },
    availableRewardIds: [],
    completedScenarioIds: [],
    decisionLog: [],
    ...overrides,
  };
}

const scenario: Scenario = {
  id: "vendor-gift-test",
  title: "협력사 선물 제안",
  summary: "협력사 선물과 계약 일정이 겹친 상황",
  setup: "고가 선물을 받은 뒤 계약 승인을 요청받았습니다.",
  complianceTopics: ["giftsHospitality", "thirdPartyRisk"],
  pressureSignals: [],
  successThresholds: [{ resource: "risk", operator: "atMost", value: 2 }],
  failureThresholds: [{ resource: "risk", operator: "atLeast", value: 8 }],
};

describe("risk counter helpers", () => {
  it("applies risky proceed resource changes without mutating input", () => {
    const run = createRun();
    const result = applyRiskyProceed(run);

    expect(result.resourceChanges).toEqual({
      pressure: -1,
      risk: 2,
      trust: 1,
    });
    expect(result.state.player.resources.risk).toBe(6);
    expect(result.state.player.resources.pressure).toBe(1);
    expect(result.state.player.resources.trust).toBe(3);
    expect(run.player.resources.risk).toBe(4);
  });

  it("can trigger a risk counter with an injected low random roll", () => {
    const run = createRun({
      player: {
        ...createRun().player,
        resources: {
          attention: 3,
          evidence: 0,
          pressure: 5,
          risk: 8,
          trust: 1,
        },
      },
    });
    const result = checkRiskCounter({
      exposure: createInitialRiskExposure(),
      kind: "riskyProceed",
      random: () => 0,
      run,
      scenario,
    });

    expect(result.notice.triggered).toBe(true);
    expect(result.notice.authority).toBe("공정위");
    expect(result.state.phase).toBe("complete");
    expect(result.exposure.checks).toBe(1);
  });

  it("carries risk exposure forward when the counter does not trigger", () => {
    const run = createRun();
    const result = checkRiskCounter({
      exposure: createInitialRiskExposure(),
      kind: "stageTransition",
      random: () => 0.99,
      run,
      scenario,
    });

    expect(result.notice.triggered).toBe(false);
    expect(result.state).toBe(run);
    expect(result.exposure.score).toBeGreaterThan(0);
    expect(result.exposure.lastNotice?.message).toContain("점검 리스크");
  });
});
