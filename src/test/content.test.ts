import { describe, expect, it } from "vitest";
import { cards, learningFeedback, passives, scenarios } from "../data";

const combatTerms = [
  "enemy",
  "attack",
  "block",
  "damage",
  "hp",
  "relic",
  "battle",
  "combat",
  "kill",
  "defense",
  "적군",
  "공격",
  "방어",
  "피해",
  "전투",
  "처치",
];

function expectUniqueIds(items: Array<{ id: string }>) {
  const ids = items.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
}

function hasKoreanText(value: string) {
  return /[가-힣]/.test(value);
}

function collectText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(collectText).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(collectText).join(" ");
  }

  return "";
}

describe("initial content data", () => {
  it("has the expected MVP content counts", () => {
    expect(cards).toHaveLength(22);
    expect(scenarios).toHaveLength(6);
    expect(passives).toHaveLength(6);
    expect(learningFeedback).toHaveLength(6);
  });

  it("uses unique stable ids", () => {
    expectUniqueIds(cards);
    expectUniqueIds(scenarios);
    expectUniqueIds(passives);
    expectUniqueIds(learningFeedback);
  });

  it("has Korean user-facing text for cards and scenarios", () => {
    for (const card of cards) {
      expect(card.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(hasKoreanText(card.name)).toBe(true);
      expect(hasKoreanText(card.description)).toBe(true);
      expect(card.effects.length).toBeGreaterThan(0);
      expect(Object.values(card.cost).some((cost) => Number(cost) > 0)).toBe(true);
    }

    for (const scenario of scenarios) {
      expect(scenario.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(hasKoreanText(scenario.title)).toBe(true);
      expect(hasKoreanText(scenario.summary)).toBe(true);
      expect(hasKoreanText(scenario.setup)).toBe(true);
      expect(scenario.pressureSignals.length).toBeGreaterThan(0);
      expect(scenario.successThresholds.length).toBeGreaterThan(0);
      expect(scenario.failureThresholds.length).toBeGreaterThan(0);
    }
  });

  it("keeps feedback practical and concise", () => {
    for (const feedback of learningFeedback) {
      expect(hasKoreanText(feedback.message)).toBe(true);
      expect(feedback.message.length).toBeLessThanOrEqual(80);
      expect(feedback.message).not.toContain("정답");
      expect(feedback.message).not.toContain("오답");
    }
  });

  it("avoids obvious combat terms", () => {
    const allContentText = collectText({
      cards,
      learningFeedback,
      passives,
      scenarios,
    }).toLowerCase();

    for (const term of combatTerms) {
      expect(allContentText).not.toContain(term);
    }
  });
});
