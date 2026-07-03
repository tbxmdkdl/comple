import { describe, expect, it } from "vitest";
import { startingDeckCardIds } from "../data";
import {
  addCardToRunDeck,
  createFixedRunNodes,
  getCurrentRunNode,
  getNextScenarioIndex,
  getNextRunNodeIndex,
  getPhaseAfterScenarioOutcome,
  getRunProgress,
  resetRunDeck,
} from "../game";

const scenarioIds = [
  "vendor-gift-pressure",
  "personal-data-personal-email",
  "informal-sales-side-letter",
];

describe("fixed run progression helpers", () => {
  it("creates the fixed sequence in order with a final scenario", () => {
    const nodes = createFixedRunNodes(scenarioIds);

    expect(
      nodes.map((node) => (node.type === "scenario" ? node.scenarioId : undefined)),
    ).toEqual(scenarioIds);
    expect(nodes).toHaveLength(3);
    expect(nodes[0].isFinal).toBe(false);
    expect(nodes[1].isFinal).toBe(false);
    expect(nodes[2].isFinal).toBe(true);
  });

  it("advances from scenario success to reward before the final node", () => {
    const nodes = createFixedRunNodes(scenarioIds);

    expect(getPhaseAfterScenarioOutcome(nodes, 0, "success")).toBe("reward");
    expect(getPhaseAfterScenarioOutcome(nodes, 1, "success")).toBe("reward");
  });

  it("advances from reward to the next scenario index", () => {
    const nodes = createFixedRunNodes(scenarioIds);

    expect(getNextScenarioIndex(nodes, 0)).toBe(1);
    expect(getNextScenarioIndex(nodes, 1)).toBe(2);
  });

  it("supports fixed event nodes between scenarios", () => {
    const nodes = createFixedRunNodes([
      { type: "event", eventId: "lunch-briefing", title: "이벤트 1" },
      { type: "scenario", scenarioId: scenarioIds[0], title: "1번째 상황" },
      { type: "event", eventId: "organize-notes", title: "이벤트 2" },
      { type: "scenario", scenarioId: scenarioIds[1], title: "2번째 상황" },
      { type: "event", eventId: "deadline-choice", title: "이벤트 3" },
      {
        type: "scenario",
        scenarioId: scenarioIds[2],
        title: "최종 상황",
        isFinal: true,
      },
    ]);

    expect(nodes).toHaveLength(6);
    expect(nodes.filter((node) => node.type === "event")).toHaveLength(3);
    expect(nodes[0]).toMatchObject({ type: "event", eventId: "lunch-briefing" });
    expect(nodes[5].isFinal).toBe(true);
    expect(getNextRunNodeIndex(nodes, 1)).toBe(2);
    expect(getRunProgress(nodes, 0).label).toBe("1 / 6 단계");
  });

  it("preserves deck additions across nodes without mutating input", () => {
    const originalDeck = [...startingDeckCardIds];
    const nextDeck = addCardToRunDeck(originalDeck, "minimum-data");

    expect(nextDeck).toHaveLength(originalDeck.length + 1);
    expect(nextDeck.at(-1)).toBe("minimum-data");
    expect(originalDeck).toEqual(startingDeckCardIds);
  });

  it("completes the run after final scenario success", () => {
    const nodes = createFixedRunNodes(scenarioIds);

    expect(getPhaseAfterScenarioOutcome(nodes, 2, "success")).toBe("complete");
  });

  it("moves to failed state after scenario failure", () => {
    const nodes = createFixedRunNodes(scenarioIds);

    expect(getPhaseAfterScenarioOutcome(nodes, 0, "failure")).toBe("failed");
  });

  it("resets to the starting deck and first node", () => {
    const nodes = createFixedRunNodes(scenarioIds);
    const resetDeck = resetRunDeck(startingDeckCardIds);
    const firstNode = getCurrentRunNode(nodes, 0);
    const progress = getRunProgress(nodes, 0);

    expect(resetDeck).toEqual(startingDeckCardIds);
    expect(resetDeck).not.toBe(startingDeckCardIds);
    expect(firstNode?.type).toBe("scenario");
    expect(firstNode?.type === "scenario" ? firstNode.scenarioId : undefined).toBe(
      "vendor-gift-pressure",
    );
    expect(progress.label).toBe("1 / 3 상황");
  });
});
