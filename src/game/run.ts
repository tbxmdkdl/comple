import type { GameId, ScenarioOutcome } from "./types";

export type FixedRunPhase = "intro" | "scenario" | "reward" | "complete" | "failed";

export type FixedRunNode = {
  id: GameId;
  scenarioId: GameId;
  title: string;
  isFinal: boolean;
};

export type FixedRunProgress = {
  currentIndex: number;
  currentStep: number;
  totalSteps: number;
  isFinal: boolean;
  label: string;
};

export function createFixedRunNodes(
  scenarioIds: readonly GameId[],
): FixedRunNode[] {
  return scenarioIds.map((scenarioId, index) => {
    const isFinal = index === scenarioIds.length - 1;

    return {
      id: `run-node-${index + 1}`,
      scenarioId,
      title: isFinal ? "최종 상황" : `${index + 1}번째 상황`,
      isFinal,
    };
  });
}

export function getCurrentRunNode(
  nodes: readonly FixedRunNode[],
  nodeIndex: number,
): FixedRunNode | undefined {
  return nodes[nodeIndex];
}

export function getRunProgress(
  nodes: readonly FixedRunNode[],
  nodeIndex: number,
): FixedRunProgress {
  const currentNode = getCurrentRunNode(nodes, nodeIndex);
  const currentStep = Math.min(nodeIndex + 1, nodes.length);

  return {
    currentIndex: nodeIndex,
    currentStep,
    totalSteps: nodes.length,
    isFinal: currentNode?.isFinal ?? false,
    label: currentNode?.isFinal
      ? "최종 상황"
      : `${currentStep} / ${nodes.length} 상황`,
  };
}

export function getPhaseAfterScenarioOutcome(
  nodes: readonly FixedRunNode[],
  nodeIndex: number,
  outcome: ScenarioOutcome,
): FixedRunPhase {
  if (outcome === "failure") {
    return "failed";
  }

  if (outcome !== "success") {
    return "scenario";
  }

  return getCurrentRunNode(nodes, nodeIndex)?.isFinal ? "complete" : "reward";
}

export function getNextScenarioIndex(
  nodes: readonly FixedRunNode[],
  nodeIndex: number,
): number {
  return Math.min(nodeIndex + 1, Math.max(nodes.length - 1, 0));
}

export function addCardToRunDeck(
  deckCardIds: readonly GameId[],
  cardId: GameId,
): GameId[] {
  return [...deckCardIds, cardId];
}

export function resetRunDeck(startingDeckCardIds: readonly GameId[]): GameId[] {
  return [...startingDeckCardIds];
}
