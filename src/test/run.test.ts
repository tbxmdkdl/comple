import { describe, expect, it } from "vitest";
import { startingDeckCardIds } from "../data";
import {
  addCardToRunDeck,
  createFixedRunNodes,
  getCurrentRunNode,
  getNextScenarioIndex,
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

    expect(nodes.map((node) => node.scenarioId)).toEqual(scenarioIds);
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
    expect(firstNode?.scenarioId).toBe("vendor-gift-pressure");
    expect(progress.label).toBe("1 / 3 상황");
  });
});
