import { describe, expect, it } from "vitest";
import { cards, scenarios } from "../data";
import {
  canPlayCard,
  checkScenarioOutcome,
  createInitialPlayerState,
  endTurn,
  playCard,
  startScenario,
  startTurn,
} from "../game";
import type { Card, GameId, PlayerResources, RunState, Scenario } from "../game";

function cardById(id: GameId): Card {
  const card = cards.find((item) => item.id === id);

  if (!card) {
    throw new Error(`Missing card: ${id}`);
  }

  return card;
}

function scenarioById(id: GameId): Scenario {
  const scenario = scenarios.find((item) => item.id === id);

  if (!scenario) {
    throw new Error(`Missing scenario: ${id}`);
  }

  return scenario;
}

function createBaseRun(): RunState {
  return {
    id: "test-run",
    phase: "notStarted",
    nodeIndex: 0,
    player: createInitialPlayerState(),
    cardZones: {
      drawPile: [],
      hand: [],
      discardPile: [],
      removedFromRun: [],
    },
    availableRewardIds: [],
    completedScenarioIds: [],
    decisionLog: [],
  };
}

function createScenarioRun({
  hand = [],
  resources = {},
  scenarioId = "vendor-gift-pressure",
}: {
  hand?: GameId[];
  resources?: Partial<PlayerResources>;
  scenarioId?: GameId;
} = {}): { run: RunState; scenario: Scenario } {
  const scenario = scenarioById(scenarioId);
  const started = startScenario(createBaseRun(), scenario);

  return {
    scenario,
    run: {
      ...started,
      player: {
        ...started.player,
        resources: {
          ...started.player.resources,
          ...resources,
        },
      },
      cardZones: {
        ...started.cardZones,
        hand: [...hand],
      },
    },
  };
}

function cloneRun(run: RunState): RunState {
  return JSON.parse(JSON.stringify(run)) as RunState;
}

describe("scenario action engine", () => {
  it("starts a scenario with expected player and scenario state", () => {
    const scenario = scenarioById("vendor-gift-pressure");
    const run = startScenario(createBaseRun(), scenario);

    expect(run.phase).toBe("scenario");
    expect(run.activeScenario?.scenarioId).toBe(scenario.id);
    expect(run.activeScenario?.turnNumber).toBe(1);
    expect(run.activeScenario?.outcome).toBe("unresolved");
    expect(run.activeScenario?.activeSignalIds).toEqual([
      "vendor-value-timing",
      "approval-unclear",
    ]);
    expect(run.player.resources.risk).toBe(4);
    expect(run.player.resources.pressure).toBe(3);
    expect(run.player.resources.attention).toBe(3);
  });

  it("starts a turn by resetting attention", () => {
    const { run } = createScenarioRun({
      resources: { attention: 0 },
    });

    const nextRun = startTurn(run);

    expect(nextRun.player.resources.attention).toBe(3);
    expect(run.player.resources.attention).toBe(0);
  });

  it("allows affordable cards and rejects cards without enough attention", () => {
    const card = cardById("risk-scan");
    const affordable = createScenarioRun({
      hand: [card.id],
      resources: { attention: 1 },
    }).run;
    const insufficient = createScenarioRun({
      hand: [card.id],
      resources: { attention: 0 },
    }).run;

    expect(canPlayCard(affordable, card)).toBe(true);
    expect(canPlayCard(insufficient, card)).toBe(false);
  });

  it("plays a valid card, applies cost and resource effects, and moves it to discard", () => {
    const card = cardById("risk-scan");
    const { run, scenario } = createScenarioRun({ hand: [card.id] });
    const before = cloneRun(run);

    const result = playCard(run, card, scenario);

    expect(result.played).toBe(true);

    if (!result.played) {
      throw new Error("Expected playCard to succeed");
    }

    expect(result.state.player.resources.attention).toBe(2);
    expect(result.state.player.resources.risk).toBe(3);
    expect(result.state.player.resources.pressure).toBe(4);
    expect(result.state.cardZones.hand).toEqual([]);
    expect(result.state.cardZones.discardPile).toEqual([card.id]);
    expect(result.state.decisionLog).toHaveLength(1);
    expect(result.feedbackIds).toContain("feedback-clarify-before-deciding");
    expect(run).toEqual(before);
  });

  it("rejects invalid card play without mutating state", () => {
    const card = cardById("risk-scan");
    const { run, scenario } = createScenarioRun({
      hand: [card.id],
      resources: { attention: 0 },
    });
    const before = cloneRun(run);

    const result = playCard(run, card, scenario);

    expect(result.played).toBe(false);
    expect(result.state).toBe(run);
    expect(run).toEqual(before);
  });

  it("supports conditional effects based on evidence", () => {
    const card = cardById("approval-request");
    const { run, scenario } = createScenarioRun({
      hand: [card.id],
      resources: { attention: 3, evidence: 2, risk: 5, trust: 5 },
    });

    const result = playCard(run, card, scenario);

    expect(result.played).toBe(true);

    if (!result.played) {
      throw new Error("Expected approval-request to be playable");
    }

    expect(result.state.player.resources.attention).toBe(1);
    expect(result.state.player.resources.risk).toBe(2);
    expect(result.state.player.resources.trust).toBe(6);
  });

  it("supports conditional effects based on a prior card tag", () => {
    const policyCheck = cardById("policy-check");
    const firmRefusal = cardById("firm-refusal");
    const { run, scenario } = createScenarioRun({
      hand: [policyCheck.id, firmRefusal.id],
      resources: { attention: 3, risk: 6, trust: 5 },
    });

    const afterPolicy = playCard(run, policyCheck, scenario);

    expect(afterPolicy.played).toBe(true);

    if (!afterPolicy.played) {
      throw new Error("Expected policy-check to be playable");
    }

    const afterRefusal = playCard(afterPolicy.state, firmRefusal, scenario);

    expect(afterRefusal.played).toBe(true);

    if (!afterRefusal.played) {
      throw new Error("Expected firm-refusal to be playable");
    }

    expect(afterRefusal.state.player.resources.risk).toBe(2);
    expect(afterRefusal.state.player.resources.trust).toBe(4);
  });

  it("can reach scenario success through card effects and thresholds", () => {
    const card = cardById("compliance-consult");
    const { run, scenario } = createScenarioRun({
      hand: [card.id],
      resources: { attention: 3, evidence: 2, risk: 5 },
      scenarioId: "personal-data-personal-email",
    });

    const result = playCard(run, card, scenario);

    expect(result.played).toBe(true);

    if (!result.played) {
      throw new Error("Expected compliance-consult to be playable");
    }

    expect(result.state.activeScenario?.outcome).toBe("success");
    expect(result.feedbackIds).toContain("feedback-safe-data-path");
  });

  it("can reach scenario failure through thresholds", () => {
    const { run, scenario } = createScenarioRun({
      scenarioId: "informal-sales-side-letter",
    });

    const afterFirstTurn = endTurn(run, scenario);
    const afterSecondTurn = endTurn(afterFirstTurn, scenario);

    expect(afterFirstTurn.activeScenario?.outcome).toBe("unresolved");
    expect(afterSecondTurn.activeScenario?.outcome).toBe("failure");
    expect(afterSecondTurn.activeScenario?.turnNumber).toBe(3);
  });

  it("checks scenario outcome without mutating input", () => {
    const { run, scenario } = createScenarioRun({
      resources: { risk: 10 },
    });
    const before = cloneRun(run);

    const outcome = checkScenarioOutcome(run, scenario);

    expect(outcome).toBe("failure");
    expect(run).toEqual(before);
  });
});
