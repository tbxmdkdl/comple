import { describe, expect, it } from "vitest";
import { events, startingDeckCardIds } from "../data";
import {
  applyEventChoice,
  createInitialEventRunMemory,
  createInitialPlayerState,
  createStartingDeck,
  resetEventRunMemory,
} from "../game";
import type { RunState } from "../game";

const combatTerms = [
  "enemy",
  "attack",
  "block",
  "damage",
  "HP",
  "relic",
  "battle",
  "combat",
  "적군",
  "공격",
  "방어",
  "피해",
  "체력",
  "전투",
  "유물",
];

describe("event content data", () => {
  it("has exactly three events", () => {
    expect(events).toHaveLength(3);
  });

  it("gives every event two to three choices", () => {
    for (const event of events) {
      expect(event.choices.length).toBeGreaterThanOrEqual(2);
      expect(event.choices.length).toBeLessThanOrEqual(3);
    }
  });

  it("uses unique event ids", () => {
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
  });

  it("has non-empty Korean-facing event and choice text", () => {
    for (const event of events) {
      expect(event.title.trim()).not.toBe("");
      expect(event.description.trim()).not.toBe("");

      for (const choice of event.choices) {
        expect(choice.label.trim()).not.toBe("");
        expect(choice.consequence.trim()).not.toBe("");
      }
    }
  });

  it("avoids obvious combat terms", () => {
    const eventText = JSON.stringify(events);

    for (const term of combatTerms) {
      expect(eventText).not.toContain(term);
    }
  });
});

describe("event choice logic", () => {
  it("applies resource changes", () => {
    const run = createEventRunForTest();
    const event = events[0];
    const choice = event.choices[0];
    const result = applyEventChoice({
      choice,
      deckCardIds: startingDeckCardIds,
      event,
      run,
    });

    expect(result.state.player.resources.evidence).toBe(1);
    expect(result.state.player.resources.pressure).toBe(1);
    expect(result.resourceChanges).toMatchObject({
      evidence: 1,
      pressure: 1,
    });
  });

  it("can add existing card ids to the run deck", () => {
    const run = createEventRunForTest();
    const event = events[1];
    const choice = event.choices[1];
    const result = applyEventChoice({
      choice,
      deckCardIds: startingDeckCardIds,
      event,
      run,
    });

    expect(result.deckCardIds).toHaveLength(startingDeckCardIds.length + 1);
    expect(result.deckCardIds.at(-1)).toBe("fact-memo");
    expect(result.addedCardIds).toEqual(["fact-memo"]);
  });

  it("does not mutate input run state or deck ids", () => {
    const run = createEventRunForTest();
    const originalResources = { ...run.player.resources };
    const originalDeck = [...startingDeckCardIds];
    const event = events[0];
    const choice = event.choices[0];

    applyEventChoice({
      choice,
      deckCardIds: originalDeck,
      event,
      run,
    });

    expect(run.player.resources).toEqual(originalResources);
    expect(originalDeck).toEqual(startingDeckCardIds);
  });

  it("tracks and resets event-applied state", () => {
    const run = createEventRunForTest();
    const memory = createInitialEventRunMemory();
    const event = events[0];
    const choice = event.choices[0];
    const result = applyEventChoice({
      choice,
      deckCardIds: startingDeckCardIds,
      event,
      memory,
      run,
    });

    expect(result.memory.selectedChoiceIds[event.id]).toBe(choice.id);
    expect(result.memory.resourceChanges).toMatchObject({
      evidence: 1,
      pressure: 1,
    });
    expect(resetEventRunMemory()).toEqual({
      resourceChanges: {},
      selectedChoiceIds: {},
    });
  });
});

function createEventRunForTest(): RunState {
  return {
    id: "event-test-run",
    phase: "event",
    nodeIndex: 0,
    player: createInitialPlayerState(),
    cardZones: createStartingDeck(startingDeckCardIds),
    availableRewardIds: [],
    completedScenarioIds: [],
    decisionLog: [],
  };
}
