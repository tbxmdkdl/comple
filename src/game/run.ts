import type { GameId, ScenarioOutcome } from "./types";

export type FixedRunPhase =
  | "intro"
  | "event"
  | "scenario"
  | "reward"
  | "complete"
  | "failed";

export type FixedRunNodeInput =
  | GameId
  | {
      type: "event";
      eventId: GameId;
      title?: string;
    }
  | {
      type: "scenario";
      scenarioId: GameId;
      title?: string;
      isFinal?: boolean;
    };

export type FixedRunNode =
  | {
      id: GameId;
      type: "event";
      eventId: GameId;
      title: string;
      isFinal: false;
    }
  | {
      id: GameId;
      type: "scenario";
      scenarioId: GameId;
      title: string;
      isFinal: boolean;
    };

export type FixedRunProgressStep = {
  id: GameId;
  title: string;
  type: FixedRunNode["type"];
  isFinal: boolean;
};

export type FixedRunProgress = {
  currentIndex: number;
  currentStep: number;
  totalSteps: number;
  isFinal: boolean;
  label: string;
  currentTitle: string;
  steps: FixedRunProgressStep[];
};

export function createFixedRunNodes(
  nodeInputs: readonly FixedRunNodeInput[],
): FixedRunNode[] {
  return nodeInputs.map((nodeInput, index) => {
    const isLast = index === nodeInputs.length - 1;

    if (typeof nodeInput === "string") {
      return {
        id: `run-node-${index + 1}`,
        type: "scenario",
        scenarioId: nodeInput,
        title: isLast ? "최종 상황" : `${index + 1}번째 상황`,
        isFinal: isLast,
      };
    }

    if (nodeInput.type === "event") {
      return {
        id: `run-node-${index + 1}`,
        type: "event",
        eventId: nodeInput.eventId,
        title: nodeInput.title ?? `이벤트 ${index + 1}`,
        isFinal: false,
      };
    }

    return {
      id: `run-node-${index + 1}`,
      type: "scenario",
      scenarioId: nodeInput.scenarioId,
      title: nodeInput.title ?? (nodeInput.isFinal || isLast ? "최종 상황" : `${index + 1}번째 상황`),
      isFinal: nodeInput.isFinal ?? isLast,
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
  const scenarioOnly = nodes.every((node) => node.type === "scenario");
  const currentTitle = currentNode?.title ?? "런 진행";

  return {
    currentIndex: nodeIndex,
    currentStep,
    totalSteps: nodes.length,
    isFinal: currentNode?.isFinal ?? false,
    label: scenarioOnly
      ? currentNode?.isFinal
        ? "최종 상황"
        : `${currentStep} / ${nodes.length} 상황`
      : `${currentStep} / ${nodes.length} 단계`,
    currentTitle,
    steps: nodes.map((node) => ({
      id: node.id,
      title: node.title,
      type: node.type,
      isFinal: node.isFinal,
    })),
  };
}

export function getPhaseForRunNode(node: FixedRunNode | undefined): FixedRunPhase {
  if (!node) {
    return "complete";
  }

  return node.type === "event" ? "event" : "scenario";
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

export function getNextRunNodeIndex(
  nodes: readonly FixedRunNode[],
  nodeIndex: number,
): number {
  return Math.min(nodeIndex + 1, Math.max(nodes.length - 1, 0));
}

export const getNextScenarioIndex = getNextRunNodeIndex;

export function addCardToRunDeck(
  deckCardIds: readonly GameId[],
  cardId: GameId,
): GameId[] {
  return [...deckCardIds, cardId];
}

export function resetRunDeck(startingDeckCardIds: readonly GameId[]): GameId[] {
  return [...startingDeckCardIds];
}
