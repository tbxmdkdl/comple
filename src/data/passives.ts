import type { Passive } from "../game";

export const passives: Passive[] = [
  {
    id: "policy-bookmark",
    name: "정책 북마크",
    description: "시나리오마다 첫 정책 확인의 부담을 줄이는 습관입니다.",
    trigger: "beforeCardPlay",
    complianceTopics: ["approvalProcess", "generalCompliance"],
    effects: [
      {
        type: "adjustResource",
        changes: [{ resource: "attention", amount: 1, reason: "정책 확인 준비" }],
      },
    ],
  },
  {
    id: "calm-meeting-notes",
    name: "차분한 회의록",
    description: "기록 카드 사용 후 첫 압박 증가를 완화하는 습관입니다.",
    trigger: "afterCardPlay",
    complianceTopics: ["generalCompliance", "expensesAccounting"],
    effects: [
      {
        type: "adjustResource",
        changes: [{ resource: "pressure", amount: -1, reason: "차분한 기록 방식" }],
      },
    ],
  },
  {
    id: "trusted-advisor",
    name: "신뢰받는 조언자",
    description: "상의 행동이 관계 회복에도 도움이 되도록 만듭니다.",
    trigger: "afterCardPlay",
    complianceTopics: ["generalCompliance"],
    effects: [
      {
        type: "adjustResource",
        changes: [{ resource: "trust", amount: 1, reason: "신뢰 기반 상담" }],
      },
    ],
  },
  {
    id: "safe-channel-first",
    name: "안전 채널 우선",
    description: "민감 정보 상황에서 안전한 전달 경로를 먼저 떠올립니다.",
    trigger: "afterCardPlay",
    complianceTopics: ["dataPrivacy", "confidentialInformation"],
    effects: [
      {
        type: "adjustResource",
        changes: [{ resource: "evidence", amount: 1, reason: "정보 흐름 확인" }],
      },
    ],
  },
  {
    id: "evidence-based-firmness",
    name: "근거 있는 단호함",
    description: "증거가 충분할 때 거절의 관계 비용을 줄입니다.",
    trigger: "beforeCardPlay",
    complianceTopics: ["generalCompliance"],
    effects: [
      {
        type: "conditional",
        condition: {
          type: "resource",
          resource: "evidence",
          operator: "atLeast",
          value: 2,
        },
        whenMet: [
          {
            type: "adjustResource",
            changes: [{ resource: "trust", amount: 1, reason: "근거 있는 설명" }],
          },
        ],
      },
    ],
  },
  {
    id: "early-warning-sense",
    name: "조기 경보 감각",
    description: "시나리오 시작 때 위험 신호를 더 빨리 확인합니다.",
    trigger: "scenarioStart",
    complianceTopics: ["generalCompliance"],
    effects: [
      {
        type: "addScenarioSignal",
        signalId: "early-warning",
        intensity: 1,
      },
    ],
  },
];
