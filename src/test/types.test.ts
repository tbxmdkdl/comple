import { describe, expect, it } from "vitest";
import type { Card, PlayerState, RunState, Scenario } from "../game";

describe("core domain model", () => {
  it("supports data-driven cards, scenarios, and run state", () => {
    const card: Card = {
      id: "card-test",
      name: "테스트 카드",
      description: "타입 검증용 카드입니다.",
      category: "ask",
      tags: ["ask", "earlyAction"],
      cost: { attention: 1 },
      complianceTopics: ["generalCompliance"],
      effects: [
        {
          type: "adjustResource",
          changes: [{ resource: "evidence", amount: 1 }],
        },
      ],
    };

    const scenario: Scenario = {
      id: "scenario-test",
      title: "테스트 시나리오",
      summary: "타입 검증용 시나리오입니다.",
      setup: "실제 콘텐츠가 아닌 테스트용 구조입니다.",
      complianceTopics: ["generalCompliance"],
      pressureSignals: [
        {
          id: "signal-test",
          label: "압박 신호",
          description: "테스트용 신호입니다.",
          type: "timePressure",
          severity: 1,
          visible: true,
        },
      ],
      successThresholds: [{ resource: "risk", operator: "atMost", value: 2 }],
      failureThresholds: [{ resource: "pressure", operator: "atLeast", value: 8 }],
    };

    const player: PlayerState = {
      resources: {
        risk: 3,
        evidence: 0,
        trust: 5,
        pressure: 2,
        attention: 3,
      },
      maxAttention: 3,
      turnResource: "attention",
      activePassiveIds: [],
      flags: [],
    };

    const run: RunState = {
      id: "run-test",
      phase: "scenario",
      nodeIndex: 0,
      player,
      cardZones: {
        drawPile: [card.id],
        hand: [],
        discardPile: [],
        removedFromRun: [],
      },
      activeScenario: {
        scenarioId: scenario.id,
        turnNumber: 1,
        outcome: "unresolved",
        activeSignalIds: ["signal-test"],
        successProgress: 0,
        failureProgress: 0,
      },
      availableRewardIds: [],
      completedScenarioIds: [],
      decisionLog: [],
    };

    expect(run.player.resources.attention).toBe(3);
    expect(card.effects[0].type).toBe("adjustResource");
    expect(scenario.pressureSignals[0].type).toBe("timePressure");
  });
});
