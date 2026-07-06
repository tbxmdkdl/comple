import type { RandomSource } from "./deck";
import type { MetricKey, PlayerResources, RunState, Scenario } from "./types";

export type RiskCounterKind = "stageTransition" | "riskyProceed";

export type RiskExposureState = {
  checks: number;
  score: number;
  lastNotice?: RiskCounterNotice;
};

export type RiskCounterNotice = {
  authority: string;
  chance: number;
  kind: RiskCounterKind;
  message: string;
  riskScore: number;
  roll: number;
  triggered: boolean;
};

export type RiskCounterInput = {
  exposure: RiskExposureState;
  kind: RiskCounterKind;
  random?: RandomSource;
  run: RunState;
  scenario: Scenario;
};

export type RiskCounterResult = {
  exposure: RiskExposureState;
  notice: RiskCounterNotice;
  state: RunState;
};

export type RiskyProceedResult = {
  resourceChanges: Partial<Record<MetricKey, number>>;
  state: RunState;
};

const defaultRandom: RandomSource = Math.random;

export function createInitialRiskExposure(): RiskExposureState {
  return {
    checks: 0,
    score: 0,
  };
}

export function applyRiskyProceed(run: RunState): RiskyProceedResult {
  const resourceChanges: Partial<Record<MetricKey, number>> = {
    pressure: -1,
    risk: 2,
    trust: 1,
  };

  return {
    resourceChanges,
    state: {
      ...run,
      player: {
        ...run.player,
        resources: applyResourceChanges(run.player.resources, resourceChanges),
      },
    },
  };
}

export function checkRiskCounter({
  exposure,
  kind,
  random = defaultRandom,
  run,
  scenario,
}: RiskCounterInput): RiskCounterResult {
  const authority = getRiskCounterAuthority(scenario);
  const riskScore = calculateRiskScore(run.player.resources, exposure.score, kind);
  const chance = clampRiskChance(riskScore, kind);
  const roll = Math.floor(random() * 100) + 1;
  const triggered = roll <= chance;
  const notice: RiskCounterNotice = {
    authority,
    chance,
    kind,
    message: triggered
      ? `${authority} 점검이 발생했습니다. 남은 리스크가 드러나 이번 런이 중단되었습니다.`
      : `${authority} 점검 리스크 ${chance}%를 넘겼습니다. 이번에는 드러나지 않았지만 누적 리스크가 남았습니다.`,
    riskScore,
    roll,
    triggered,
  };

  return {
    exposure: {
      checks: exposure.checks + 1,
      lastNotice: notice,
      score: triggered ? riskScore : Math.round(riskScore * 0.65),
    },
    notice,
    state: triggered
      ? {
          ...run,
          phase: "complete",
        }
      : run,
  };
}

function calculateRiskScore(
  resources: PlayerResources,
  previousScore: number,
  kind: RiskCounterKind,
): number {
  const base = kind === "riskyProceed" ? 20 : 4;
  const riskWeight = resources.risk * 8;
  const pressureWeight = resources.pressure * 3;
  const evidenceBuffer = resources.evidence * 2;
  const trustBuffer = Math.max(0, resources.trust - 2);

  return Math.max(
    0,
    Math.round(previousScore + base + riskWeight + pressureWeight - evidenceBuffer - trustBuffer),
  );
}

function clampRiskChance(score: number, kind: RiskCounterKind): number {
  const minimumChance = kind === "riskyProceed" ? 12 : 3;

  return Math.min(85, Math.max(minimumChance, score));
}

function applyResourceChanges(
  resources: PlayerResources,
  changes: Partial<Record<MetricKey, number>>,
): PlayerResources {
  return Object.entries(changes).reduce<PlayerResources>(
    (nextResources, [resource, amount]) => ({
      ...nextResources,
      [resource]: Math.max(
        0,
        (nextResources[resource as keyof PlayerResources] ?? 0) + (amount ?? 0),
      ),
    }),
    { ...resources },
  );
}

function getRiskCounterAuthority(scenario: Scenario): string {
  if (
    scenario.complianceTopics.includes("giftsHospitality") ||
    scenario.complianceTopics.includes("thirdPartyRisk")
  ) {
    return "공정위";
  }

  if (scenario.complianceTopics.includes("dataPrivacy")) {
    return "개인정보 점검";
  }

  if (scenario.complianceTopics.includes("expensesAccounting")) {
    return "감사";
  }

  return "내부 점검";
}
